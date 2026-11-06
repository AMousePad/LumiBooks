import assert from "node:assert/strict";
import { makeDefaultProfile } from "../src/shared";
import { emptyCursor, msgSig } from "../src/backend/codex/store";

export async function runCodexFixScenarios(h: {
  api: (path: string, method?: string, body?: unknown) => Promise<any>;
  action: (payload: any, predicate?: (state: any) => boolean) => Promise<any>;
  response: (payload: any, type: string) => Promise<any>;
  until: <T>(label: string, read: () => T | Promise<T>, valid: (value: T) => boolean, timeout?: number) => Promise<T>;
  pass: (name: string) => void;
  fromHost: (path: string) => Promise<any>;
  connectionId: string; characterId: string; extensionId: string;
}) {
  const { api, action, response, until, pass, fromHost, connectionId, characterId, extensionId } = h;
  const chat = await api("/api/v1/chats", "POST", { character_id: characterId, name: "Codex fixes" });
  const chatId = chat.id;
  const state = await action({ type: "refresh", chatId });
  const delivery = { type: "lesson_delivery", id: crypto.randomUUID(), ownerUserId: state.userId,
    message: { type: "lesson_complete", course: "codex", wrong: 0, total: 8, grade: "gilded", signedName: "Test reader", chatId } };
  const first = await response(delivery, "lesson_saved");
  assert.equal(first.lessons.codex.status, "done");
  await (await fromHost("spindle/lifecycle.ts")).restartExtension(extensionId);
  const replay = await response(delivery, "lesson_saved");
  assert.equal(replay.lessons.codex.attempts, first.lessons.codex.attempts);
  assert.equal(replay.lessons.codex.revision, first.lessons.codex.revision);
  pass("tutorial completion crosses the WebSocket, persists across worker restart, and acknowledges replay exactly once");
  const profile = { ...makeDefaultProfile("default", "Fixes"), connectionId, codexEnabled: true, codexManualOnly: true,
    autoCreate: false, autoCreateChapter: false, autoCreateArc: false, codexExtraContext: false, codexLagValue: 0 };
  await action({ type: "save_settings", chatId, patch: { profiles: [profile], activeProfileId: "default" } });
  const messages: any[] = [];
  for (let i = 0; i < 202; i++) messages.push(await api(`/api/v1/chats/${chatId}/messages`, "POST", { name: "User", is_user: true, content: `Indexed turn ${i}` }));
  await response({ type: "codex_restore", chatId, raw: { kind: "lumibooks.codex.backup", version: 1, chatId,
    cursor: { ...emptyCursor(), runs: 10, lastMsgId: messages.at(-1).id, consumedSigs: messages.map(m => ({ id: m.id, sig: msgSig("user", m.content) })) },
    relationsTableMode: true, files: {
      characters: JSON.stringify({ entities: [{ id: "char:alice", name: "Alice", description: "A keeper of stories" }] }),
      relations: JSON.stringify({ relations: [{ type: "pair", a: "char:alice", b: "char:bob", kind: "friend", state: "close" }] }),
      timeline: JSON.stringify({ events: [{ when: "Now", event: "TIMELINE_FIX_MARKER" }] }),
    } } }, "codex_files");
  const repaired = await response({ type: "codex_repair_references", chatId }, "codex_files");
  assert(!JSON.parse(repaired.files.characters).entities.some((e: any) => e.id === "char:bob"));
  assert.equal(JSON.parse(repaired.files.relations).relations.length, 0);
  assert(JSON.parse(repaired.files.timeline).events.some((e: any) => e.event === "TIMELINE_FIX_MARKER"));
  pass("reference repair removes dangling links while keeping deleted entities absent and preserving timeline events");
  const bookId = (await api(`/api/v1/chats/${chatId}`)).metadata.lumibooks_codex_book_id;
  assert((await api(`/api/v1/world-books/${bookId}`)).name.includes("Synthetic integration character - Codex fixes"));
  pass("created Codex book title includes the actual character and chat names");
  const entries = async () => (await api(`/api/v1/world-books/${bookId}/entries?limit=200`)).data;
  const alice = (await entries()).find((e: any) => e.content.includes("Alice"));
  const manager = await fromHost("spindle/manager.service.ts");
  const permissions = ["characters", "chats", "world_books"];
  await manager.installFromFiles(new Map([
    ["spindle.json", new TextEncoder().encode(JSON.stringify({ identifier: "lumiagent", name: "LumiAgent bridge fixture", version: "0.0.1", author: "Test", description: "Isolated bridge test", github: "https://github.com/example/bridge-fixture", permissions, entry_backend: "backend.js" }))],
    ["backend.js", new TextEncoder().encode("")],
  ]), {});
  for (const permission of permissions) manager.grantPermission("lumiagent", permission);
  const rpc = await fromHost("spindle/shared-rpc-pool.service.ts");
  const dial = async (request: any) => {
    rpc.syncSharedRpcEndpoint("lumiagent", "phoneline_request", request, { requires: ["characters"] });
    return rpc.readSharedRpcEndpoint("lumi_books.phoneline", "lumiagent", manager.getGrantedPermissions);
  };
  assert.equal((await dial({ op: "describe" })).extension.id, "lumi_books");
    const guide = await dial({ op: "list_items", surfaceId: "lumibooks_docs" });
    assert.equal(guide.total, guide.items.length); assert(guide.total > 0);
    for (const topic of guide.items) {
      const page = await dial({ op: "read_item", surfaceId: "lumibooks_docs", itemId: topic.id });
      assert.equal(typeof page.value, "string"); assert(page.value.length > 100);
    }
    assert.equal((await dial({ op: "write_field", surfaceId: "lumibooks_docs", itemId: "overview", field: "text", value: "changed" })).ok, false);
    pass("LumiBooks worker serves read-only guide topics without a character or user request");
  const bridgeRequest = { userId: state.userId, surfaceId: "lumi_books.codex", itemId: alice.id, field: "key" };
  assert.deepEqual(await dial({ ...bridgeRequest, op: "write_field", value: ["agent-specific"] }), { ok: true });
  assert.deepEqual((await dial({ ...bridgeRequest, op: "read_item" })).value, ["agent-specific"]);
  await assert.rejects(rpc.readSharedRpcEndpoint("lumi_books.phoneline", "unapproved", manager.getGrantedPermissions));
  pass("the permission-checked LumiAgent bridge reads and edits real Codex records through the worker");
  await api(`/api/v1/world-books/${bookId}/entries/${alice.id}`, "PUT", { content: "USER_LOREBOOK_CORRECTION", key: ["specific fact"], keysecondary: ["condition"] });
  await response({ type: "codex_write_file", chatId, file: "characters", content: JSON.stringify({ entities: [{ id: "char:alice", name: "Alice", description: "Generated change" }, { id: "char:bob", name: "Bob", noInject: true }] }) }, "codex_files");
  assert.equal((await entries()).find((e: any) => e.id === alice.id).content, "USER_LOREBOOK_CORRECTION");
  assert.deepEqual((await entries()).find((e: any) => e.id === alice.id).key, ["specific fact"]);
  await response({ type: "codex_write_file", chatId, file: "relations", content: JSON.stringify({ relations: [{ type: "pair", a: "char:alice", b: "char:bob", kind: "friend", state: "close" }] }) }, "codex_files");
  await response({ type: "codex_write_file", chatId, file: "knowledge", content: JSON.stringify({ items: [{ fact: "KEEP_KNOWLEDGE_FACT", knownBy: ["char:alice", "char:bob"] }] }) }, "codex_files");
  const bob = (await entries()).find((entry: any) => entry.comment === "[Codex] Character: Bob");
  await api(`/api/v1/world-books/${bookId}/entries/${bob.id}`, "PUT", { content: "Edited Bob still must be deleted", disabled: false });
  const deleted = await response({ type: "codex_write_file", chatId, file: "characters", content: JSON.stringify({ entities: [{ id: "char:alice", name: "Alice", description: "Generated change" }] }) }, "codex_files");
  assert.equal(JSON.parse(deleted.files.relations).relations.length, 0);
  assert.deepEqual(JSON.parse(deleted.files.knowledge).items[0].knownBy, ["char:alice"]);
  assert.equal(JSON.parse(deleted.files.knowledge).items[0].fact, "KEEP_KNOWLEDGE_FACT");
  assert(!(await entries()).some((entry: any) => entry.comment === "[Codex] Character: Bob"));
  const undone = await response({ type: "codex_undo", chatId }, "codex_files");
  assert(JSON.parse(undone.files.characters).entities.some((e: any) => e.id === "char:bob"));
  assert.equal(JSON.parse(undone.files.relations).relations.length, 1);
  pass("deleting a Codex entity automatically removes its references and Undo restores the entity with its links");
  await action({ type: "save_profile", chatId, profile: { id: "default", codexActivationMode: "vector_only" } }, (s) => s.codexInjectedTokens === 0);
  await until("vector-only Codex resync", entries, (list) => list.every((e: any) => !e.constant && e.vectorized && e.key.length === 0 && e.keysecondary.length === 0));
  const dry = await api("/api/v1/generate/dry-run", "POST", { chat_id: chatId, connection_id: connectionId });
  assert(!JSON.stringify(dry.messages).includes("TIMELINE_FIX_MARKER"));
  assert(!JSON.stringify(dry.messages).includes("USER_LOREBOOK_CORRECTION"));
  pass("direct lorebook edits survive Codex writes and vector-only has no constant or keyword fallback in host prompts");
  await action({ type: "set_message_excluded", chatId, messageIds: messages.slice(0, 2).map(m => m.id), excluded: true });
  for (const message of messages.slice(0, 2)) await api(`/api/v1/chats/${chatId}/messages/${message.id}`, "DELETE");
  const afterDelete = await action({ type: "refresh", chatId });
  assert.equal(afterDelete.codexBacklog, 0);
  pass("deleting two excluded messages keeps 200 later indexed turns current through real host deletion events");
  const standalone = await api("/api/v1/chats", "POST", { character_id: characterId, name: "Missing inheritance", metadata: { branched_from: crypto.randomUUID(), branch_at_message: "missing" } });
  await action({ type: "refresh", chatId: standalone.id });
  await until("standalone fork adoption", async () => (await api(`/api/v1/chats/${standalone.id}`)).metadata,
    (md: any) => md.lumibooks_codex_fork_adopted === standalone.id);
  pass("a missing inheritance source settles in the host instead of permanently blocking a standalone chat");
}

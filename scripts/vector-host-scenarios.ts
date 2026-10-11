import assert from "node:assert/strict";
import { makeDefaultProfile } from "../src/shared";

// Only the embedding provider is simulated. Lumiverse indexes these vectors,
// searches its real store, merges keyword hits and assembles the actual prompt.
export const embeddingFixture = { fail: false, requests: 0 };
export function embeddingResponse(body: any): Response {
  embeddingFixture.requests++;
  if (embeddingFixture.fail) return new Response("Synthetic embedding outage", { status: 503 });
  const inputs = Array.isArray(body.input) ? body.input : [body.input];
  return Response.json({ object: "list", model: "integration-embedding", usage: { prompt_tokens: 8, total_tokens: 8 },
    data: inputs.map((text: string, index: number) => ({ object: "embedding", index,
      embedding: /drake|reptile|dragon/i.test(text) ? [1, 0, 0, 0, 0, 0, 0, 0]
        : /coral|ocean/i.test(text) ? [0, 1, 0, 0, 0, 0, 0, 0] : [0, 0, 1, 0, 0, 0, 0, 0] })) });
}

export async function runVectorScenarios(h: {
  api: (path: string, method?: string, body?: unknown) => Promise<any>;
  action: (payload: any, predicate?: (state: any) => boolean) => Promise<any>;
  response: (payload: any, type: string) => Promise<any>;
  until: <T>(label: string, read: () => T | Promise<T>, valid: (value: T) => boolean, timeout?: number) => Promise<T>;
  pass: (name: string) => void;
  fromHost: (path: string) => Promise<any>;
  connectionId: string; characterId: string; extensionId: string;
}) {
  const { api, action, response, until, pass, fromHost, connectionId, characterId } = h;
  const chat = await api("/api/v1/chats", "POST", { character_id: characterId, name: "Vector integration" });
  const chatId = chat.id;
  await action({ type: "lesson_seal_skip", course: "books", chatId });
  await action({ type: "lesson_seal_skip", course: "codex", chatId });
  const profile = { ...makeDefaultProfile("default", "Vector integration"), connectionId,
    autoCreate: false, autoCreateChapter: false, autoCreateArc: false, codexEnabled: true,
    codexManualOnly: true, codexExtraContext: false, codexActivationMode: "vector" as const,
    windowValue: 1, lagValue: 1, retryCount: 0 };
  await action({ type: "save_settings", chatId, patch: { profiles: [profile], activeProfileId: "default", summaryActivationMode: "always" } });
  const query = await api(`/api/v1/chats/${chatId}/messages`, "POST", { name: "User", is_user: true, content: "Where does the winged reptile sleep?" });
  const characters = { entities: [
    { id: "char:avalon", name: "Avalon", description: "DRAGON_RECORD_MARKER: a fire drake nests beneath the basalt mountain." },
    { id: "char:pelagia", name: "Pelagia", description: "OCEAN_RECORD_MARKER: a coral keeper tends the ocean reef." },
    { id: "char:hidden", name: "Hidden", description: "HIDDEN_RECORD_MARKER: a dragon secret.", noInject: true },
  ] };
  await response({ type: "codex_restore", chatId, raw: { kind: "lumibooks.codex.backup", version: 1,
    files: { characters: JSON.stringify(characters), timeline: JSON.stringify({ events: [{ when: "Now", event: "TIMELINE_RECORD_MARKER" }] }),
      threads: JSON.stringify({ threads: [{ name: "Journey", status: "open", summary: "THREAD_RECORD_MARKER" }], seeds: [] }) } } }, "codex_files");
  const metadata = (await api(`/api/v1/chats/${chatId}`)).metadata;
  const bookId = metadata.lumibooks_codex_book_id;
  assert(bookId, "Codex restore must create its mirror book");
  const entries = async () => (await api(`/api/v1/world-books/${bookId}/entries?limit=200`)).data;
  const text = (dry: any) => dry.messages.map((m: any) => typeof m.content === "string" ? m.content : JSON.stringify(m.content)).join("\n");
  const prompt = async () => text(await api("/api/v1/generate/dry-run", "POST", { chat_id: chatId, connection_id: connectionId }));
  let rows = await entries();
  assert.equal(rows.length, 5);
  const dragonId = rows.find((e: any) => e.content.includes("DRAGON_RECORD_MARKER")).id;
  assert(rows.filter((e: any) => e.extensions.lumibooks_codex.file === "characters").every((e: any) => e.vectorized && !e.constant));
  assert(rows.filter((e: any) => e.constant).every((e: any) => !e.vectorized));
  let assembled = await prompt();
  assert(assembled.includes("TIMELINE_RECORD_MARKER") && assembled.includes("THREAD_RECORD_MARKER"));
  assert(!assembled.includes("DRAGON_RECORD_MARKER") && !assembled.includes("HIDDEN_RECORD_MARKER"));
  pass("Codex vector mode preserves constant timeline/threads and excludes unmatched records before embeddings are configured");

  // This chat has no summary shelf yet; Codex must manage its own name too.
  await action({ type: "save_settings", chatId, patch: { followChatNames: false } });
  await api(`/api/v1/world-books/${bookId}`, "PUT", { name: "Independent Codex name" });
  await action({ type: "save_profile", chatId, profile: { id: "default", codexActivationMode: "vector" } });
  assert.equal((await api(`/api/v1/world-books/${bookId}`)).name, "Independent Codex name");
  await action({ type: "save_settings", chatId, patch: { followChatNames: true } });
  await action({ type: "save_profile", chatId, profile: { id: "default", codexActivationMode: "vector" } });
  assert.notEqual((await api(`/api/v1/world-books/${bookId}`)).name, "Independent Codex name");
  pass("Codex-only chats preserve custom names and resume following chat names when re-enabled");

  await api("/api/v1/embeddings/config", "PUT", { enabled: true, provider: "openai-compatible", api_url: "http://127.0.0.1:18761/v1",
    api_key: "synthetic-key", model: "integration-embedding", vectorize_world_books: true,
    vectorize_chat_messages: false, vectorize_chat_documents: false, retrieval_top_k: 1,
    similarity_threshold: 0.8, rerank_cutoff: 0, request_timeout: 2 });
  await api("/api/v1/embeddings/test", "POST", {});
  const { getFirstUserId } = await fromHost("auth/seed.ts");
  const { saveWorldBookVectorSettings } = await fromHost("services/world-book-vector-settings.service.ts");
  saveWorldBookVectorSettings(getFirstUserId(), { presetMode: "custom", retrievalTopK: 1 });
  await api(`/api/v1/embeddings/world-books/${bookId}/reindex`, "POST", {});
  await until("Codex indexing", entries, (list) => list.filter((e: any) => e.vectorized && !e.disabled).every((e: any) => e.vector_index_status === "indexed"));
  assembled = await prompt();
  assert(assembled.includes("DRAGON_RECORD_MARKER"), "Semantic match with no matching name/keyword must reach the final prompt");
  assert(!assembled.includes("OCEAN_RECORD_MARKER") && !assembled.includes("HIDDEN_RECORD_MARKER"));
  assert.equal(assembled.split("DRAGON_RECORD_MARKER").length - 1, 1);
  pass("real vector index retrieves the relevant Codex record without a keyword match, once, within top-K");

  characters.entities[0]!.description = "DRAGON_RECORD_UPDATED: the fire drake moved into a tower.";
  await response({ type: "codex_write_file", chatId, file: "characters", content: JSON.stringify(characters), seq: 1 }, "codex_files");
  rows = await until("edited Codex reindex", entries, (list) => list.find((e: any) => e.id === dragonId)?.vector_index_status === "indexed");
  assert(rows.find((e: any) => e.id === dragonId).vectorized);
  assembled = await prompt();
  assert(assembled.includes("DRAGON_RECORD_UPDATED") && !assembled.includes("DRAGON_RECORD_MARKER"));
  pass("editing a Codex record keeps its entry ID and vector setting and replaces stale indexed content");

  for (const mode of ["always", "keywords", "vector"] as const) {
    await action({ type: "save_profile", chatId, profile: { id: "default", codexActivationMode: mode } }, (s) => s.activeProfile.codexActivationMode === mode);
    rows = await entries();
    assert.equal(rows.find((e: any) => e.id === dragonId).constant, mode === "always");
    assert.equal(rows.find((e: any) => e.id === dragonId).vectorized, mode === "vector");
    if (mode === "vector") await api(`/api/v1/embeddings/world-books/${bookId}/reindex`, "POST", {});
    assembled = await prompt();
    assert.equal(assembled.includes("DRAGON_RECORD_UPDATED"), mode !== "keywords");
    assert.equal(assembled.includes("OCEAN_RECORD_MARKER"), mode === "always");
    assert(!assembled.includes("HIDDEN_RECORD_MARKER"));
  }
  pass("all three Codex recall modes change real prompt inclusion without enabling disabled records");

  await response({ type: "codex_set_file_state", chatId, file: "characters", state: "noInject", seq: 2 }, "codex_file_state_saved");
  assert(!(await prompt()).includes("DRAGON_RECORD_UPDATED"));
  await response({ type: "codex_set_file_state", chatId, file: "characters", state: "on", seq: 3 }, "codex_file_state_saved");
  await api(`/api/v1/embeddings/world-books/${bookId}/reindex`, "POST", {});
  assert((await prompt()).includes("DRAGON_RECORD_UPDATED"));
  pass("Codex file injection switches suppress vector hits and reindex on re-enable");

  embeddingFixture.fail = true;
  await api(`/api/v1/chats/${chatId}/messages/${query.id}`, "PUT", { content: "Avalon: where does the reptile rest tonight?" });
  assembled = await prompt();
  assert(assembled.includes("DRAGON_RECORD_UPDATED"), "Keyword fallback must survive provider failure");
  assert(assembled.includes("TIMELINE_RECORD_MARKER") && !assembled.includes("HIDDEN_RECORD_MARKER"));
  embeddingFixture.fail = false;
  pass("embedding provider failure preserves keyword recall and constant Codex context");

  await api(`/api/v1/chats/${chatId}/messages/${query.id}`, "PUT", { content: "A totally unrelated question." });
  assembled = await prompt();
  assert(!assembled.includes("DRAGON_RECORD_UPDATED") && !assembled.includes("OCEAN_RECORD_MARKER"));
  assert(assembled.includes("TIMELINE_RECORD_MARKER"));
  await api(`/api/v1/chats/${chatId}/messages/${query.id}`, "PUT", { extra: { hidden: true } });
  assembled = await prompt();
  assert(!assembled.includes("DRAGON_RECORD_UPDATED") && !assembled.includes("OCEAN_RECORD_MARKER"));
  assert(assembled.includes("TIMELINE_RECORD_MARKER") && assembled.includes("THREAD_RECORD_MARKER"));
  await api(`/api/v1/chats/${chatId}/messages/${query.id}`, "PUT", { content: "Where does the winged reptile sleep?", extra: { hidden: false } });
  const { restartExtension } = await fromHost("spindle/lifecycle.ts");
  await restartExtension(h.extensionId);
  const restarted = await action({ type: "refresh", chatId }, (s) => s.activeChatId === chatId);
  assert.equal(restarted.activeProfile.codexActivationMode, "vector");
  assert((await prompt()).includes("DRAGON_RECORD_UPDATED"));
  pass("zero matches and all-hidden history keep constant Codex context; vector mode and retrieval survive worker restart");

  const fork = await api(`/api/v1/chats/${chatId}/branch`, "POST", { message_id: query.id, name: "Vector fork" });
  await action({ type: "refresh", chatId: fork.id }, (s) => s.activeChatId === fork.id);
  const forkBook = (await api(`/api/v1/chats/${fork.id}`)).metadata.lumibooks_codex_book_id;
  assert(forkBook && forkBook !== bookId);
  const forkRows = (await api(`/api/v1/world-books/${forkBook}/entries`)).data;
  assert(forkRows.some((e: any) => e.vectorized && e.content.includes("DRAGON_RECORD_UPDATED")));
  assert(forkRows.every((e: any) => e.extensions.lumibooks_codex.chatId === fork.id));
  pass("forked Codex owns separate vector entries while retaining the active recall mode");

  // A separate summary shelf exercises the extension's capture/injection path.
  await action({ type: "set_summary_activation", chatId, mode: "vector" });
  await api(`/api/v1/chats/${chatId}/messages`, "POST", { name: "User", is_user: true, content: "Tell me about that winged reptile." });
  let state = await action({ type: "create_chapter", chatId }, (s) => s.chapters.length === 1);
  const chapter = state.chapters[0];
  await action({ type: "update_entry", chatId, entryId: chapter.entryId, patch: { content: "SUMMARY_DRAGON_MARKER: the fire drake arrived." } });
  const summaryRows = async () => (await api(`/api/v1/world-books/${state.bookId}/entries`)).data;
  await api(`/api/v1/embeddings/world-books/${state.bookId}/reindex`, "POST", {});
  // Codex no longer competes for the one vector slot.
  await action({ type: "save_profile", chatId, profile: { id: "default", codexActivationMode: "keywords" } });
  assembled = await prompt();
  assert.equal(assembled.split("SUMMARY_DRAGON_MARKER").length - 1, 1);
  assert.equal(state.coverage.coveredMessages, 1);
  assert((await summaryRows()).every((e: any) => e.vectorized && !e.constant));
  state = await action({ type: "regenerate_entry", chatId, entryId: chapter.entryId }, (s) => s.chapters[0]?.content !== "SUMMARY_DRAGON_MARKER: the fire drake arrived.");
  assert.equal(state.chapters[0].entryId, chapter.entryId);
  assert((await summaryRows()).every((e: any) => e.vectorized && !e.constant));
  assert.equal(state.coverage.coveredMessages, 1);
  pass("vector summaries pass through actual activation capture exactly once and retain mode and coverage on regeneration");

  await action({ type: "save_settings", chatId, patch: { followChatNames: false } });
  await api(`/api/v1/world-books/${state.bookId}`, "PUT", { name: "Custom summary shelf" });
  await api(`/api/v1/world-books/${bookId}`, "PUT", { name: "Custom Codex shelf" });
  await action({ type: "refresh", chatId });
  assert.equal((await api(`/api/v1/world-books/${state.bookId}`)).name, "Custom summary shelf");
  assert.equal((await api(`/api/v1/world-books/${bookId}`)).name, "Custom Codex shelf");
  await action({ type: "save_settings", chatId, patch: { followChatNames: true } });
  await action({ type: "refresh", chatId });
  assert.notEqual((await api(`/api/v1/world-books/${state.bookId}`)).name, "Custom summary shelf");
  assert.notEqual((await api(`/api/v1/world-books/${bookId}`)).name, "Custom Codex shelf");
  pass("manual Books and Codex names survive synchronization when following chat names is off");

  const exported = (await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content;
  for (const privateValue of ["DRAGON_RECORD", "OCEAN_RECORD", "HIDDEN_RECORD", "winged reptile", "synthetic-key", dragonId, bookId]) assert(!exported.includes(privateValue));
  assert(new TextEncoder().encode(exported).length <= 10_000_000);
  pass("vector diagnostics contain no record prose, search text, provider key or raw entry/book IDs");
}

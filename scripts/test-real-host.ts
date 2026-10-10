/** Run with: bun scripts/test-real-host.ts <Lumiverse checkout>
 * Uses the real host, SQLite, Spindle worker/RPC, HTTP routes and WebSocket.
 * Only the model is simulated: an HTTP SSE endpoint records every input.
 * Every run gets a new isolated data directory; no existing host data is read.
 */
import { mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, makeDefaultProfile } from "../src/shared";

const repo = resolve(import.meta.dir, "..");
const host = resolve(process.argv[2] || "../Lumiverse");
const runDir = join(repo, "local", "real-host", `${Date.now()}`);
mkdirSync(runDir, { recursive: true });
process.chdir(runDir);
Object.assign(process.env, {
  DATA_DIR: join(runDir, "data"), PORT: "18760", FRONTEND_DIR: join(host, "frontend", "dist"),
  OWNER_USERNAME: "lumibooks_test", OWNER_PASSWORD: "", AUTH_SECRET: "",
  ENCRYPTION_KEY: "", TRUSTED_ORIGINS: "http://localhost:18760",
  BUN_RUNTIME_TRANSPILER_CACHE_PATH: join(runDir, "cache"),
  LUMIVERSE_FORCE_BUN_WORKERS: "1", LUMIVERSE_LANCEDB_STARTUP_MAINTENANCE: "off",
});
const fromHost = (path: string) => import(pathToFileURL(join(host, "src", path)).href);
const password = crypto.randomUUID();
const requests: any[] = [];
const results: string[] = [];
const startedAt = Date.now();
let cookie = "", extensionId = "", socket: WebSocket;
const inbox: any[] = [];
let inboxSequence = 0;
const memoryPressure: Array<{ level: string; rss: number; heapUsed: number }> = [];
process.on("memoryPressure" as any, (level: string) => {
  const { rss, heapUsed } = process.memoryUsage();
  memoryPressure.push({ level, rss, heapUsed });
});
let providerMode = "normal";
let releaseProvider: (() => void) | undefined;
const provider = Bun.serve({ hostname: "127.0.0.1", port: 18761, async fetch(req) {
  if (req.method === "GET") return Response.json({ data: [{ id: "integration-test" }] });
  const body = await req.json();
  requests.push(body);
  if (providerMode === "pause") await new Promise<void>((r) => { releaseProvider = r; });
  if (providerMode === "fail") return new Response("Synthetic provider failure", { status: 503 });
  const content = JSON.stringify({ title: `TEST_SUMMARY_${requests.length}`, content: `SAVED_SUMMARY_${requests.length}`, keywords: ["synthetic"], short_comment: "Test summary." });
  const frames = [
    { choices: [{ index: 0, delta: { role: "assistant", content }, finish_reason: null }] },
    { choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } },
  ];
  return new Response(frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n", { headers: { "Content-Type": "text/event-stream" } });
} });
async function api(path: string, method = "GET", body?: unknown): Promise<any> {
  const response = await fetch(`http://localhost:18760${path}`, {
    signal: AbortSignal.timeout(15000),
    method, headers: { "Content-Type": "application/json", Origin: "http://localhost:18760", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.headers.has("set-cookie")) cookie = response.headers.getSetCookie().map((s) => s.split(";")[0]).join("; ");
  const value = await response.json();
  assert(response.ok, `${method} ${path}: ${response.status} ${JSON.stringify(value)}`);
  return value;
}
async function until<T>(label: string, read: () => T | Promise<T>, valid: (value: T) => boolean, timeout = 30000): Promise<T> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = await read();
    if (valid(value)) return value;
    await Bun.sleep(50);
  }
  throw new Error(`Timed out: ${label}. Recent responses: ${inbox.slice(-8).map((m) => m.type).join(", ")}`);
}
function send(payload: any) { socket.send(JSON.stringify({ type: "SPINDLE_BACKEND_MSG", extensionId, payload })); }
async function action(payload: any, predicate: (state: any) => boolean = () => true) {
  const start = inboxSequence;
  send(payload);
  return until(payload.type, () => inbox.filter((m) => m.testSequence > start && m.type === "state").map((m) => m.state).find((s) => predicate(s)), Boolean);
}
function pass(name: string) { results.push(name); console.log(`HOST PASS: ${name}`); }
async function response(payload: any, type: string) {
  const start = inboxSequence;
  send(payload);
  return until(payload.type, () => inbox.find((m) => m.testSequence > start && m.type === type), Boolean);
}
function promptText(request: any) { return request.messages.map((m: any) => typeof m.content === "string" ? m.content : JSON.stringify(m.content)).join("\n"); }
function markerNumbers(request: any): number[] {
  return [...new Set([...promptText(request).matchAll(/PRIVATE_CHAT_MARKER_(\d+)_END/g)].map((m) => Number(m[1])))];
}
try {
  const { initDatabase } = await fromHost("db/connection.ts");
  const { runMigrations } = await fromHost("db/migrate.ts");
  await runMigrations(initDatabase());
  const { hashPassword } = await fromHost("crypto/password.ts");
  const { writeOwnerCredentials } = await fromHost("crypto/credentials.ts");
  await writeOwnerCredentials(join(process.env.DATA_DIR!, "owner.credentials"), "lumibooks_test", await hashPassword(password));
  const manager = await fromHost("spindle/manager.service.ts");
  const files = new Map<string, Uint8Array>();
  for (const file of ["spindle.json", "dist/backend.js", "dist/frontend.js"]) files.set(file, new Uint8Array(await Bun.file(join(repo, file)).arrayBuffer()));
  const extension = await manager.installFromFiles(files, {});
  extensionId = extension.id;
  for (const permission of extension.permissions) manager.grantPermission("lumi_books", permission);
  manager.enable("lumi_books");
  await fromHost("main.ts");
  await api("/api/auth/sign-in/username", "POST", { username: "lumibooks_test", password });
  socket = new WebSocket("ws://localhost:18760/api/ws", { headers: { Cookie: cookie, Origin: "http://localhost:18760" } });
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.event === "SPINDLE_FRONTEND_MSG") {
      inbox.push({ ...msg.payload.data, testSequence: ++inboxSequence });
      // Do not turn the harness into a leak by retaining every full UI state.
      if (inbox.length > 32) inbox.splice(0, inbox.length - 32);
    }
  });
  await until("WebSocket open", () => socket.readyState, (s) => s === WebSocket.OPEN);
  await until("worker boot", () => api("/api/v1/spindle"), (v) => v.extensions.some((e: any) => e.id === extensionId && e.status === "running"));
  const connection = await api("/api/v1/connections", "POST", { name: "Synthetic local provider", provider: "custom", api_url: "http://127.0.0.1:18761/v1", model: "integration-test", is_default: true });
  const character = await api("/api/v1/characters", "POST", { name: "Synthetic integration character", first_mes: "" });
  const chat = await api("/api/v1/chats", "POST", { character_id: character.id, name: "LumiBooks integration" });
  const chatId = chat.id;
  const profile = { ...makeDefaultProfile("default", "Integration"), connectionId: connection.id, autoCreate: false, autoCreateChapter: false, autoCreateArc: false, codexEnabled: false, codexExtraContext: false, retryCount: 0, lagValue: 0, windowValue: 12 };
  await action({ type: "save_settings", chatId, patch: { ...DEFAULT_SETTINGS, profiles: [profile] } });
  const messages = [];
  for (let i = 0; i < 53; i++) messages.push(await api(`/api/v1/chats/${chatId}/messages`, "POST", { name: i % 2 ? "Assistant" : "User", is_user: i % 2 === 0, content: `PRIVATE_CHAT_MARKER_${i}_END` }));
  for (const message of messages.slice(0, 5)) await api(`/api/v1/chats/${chatId}/messages/${message.id}`, "DELETE");
  let state = await action({ type: "refresh", chatId }, (s) => s.messages.length === 48);
  assert.equal(state.messages[0].indexInChat, 5);
  pass("real host preserves deleted-message index gaps");
  state = await action({ type: "create_chapter", chatId }, (s) => s.chapters.length === 1);
  assert.equal(state.chapters[0].meta.firstMsgIdx, 5);
  assert.equal(state.chapters[0].meta.lastMsgIdx, 16);
  assert.deepEqual(state.chapters[0].meta.msgIds, messages.slice(5, 17).map((m) => m.id));
  assert.equal(state.messages.filter((m: any) => m.hidden).length, 12);
  pass("filing through worker RPC saves correct ranges and hides exactly its sources");
  assert.deepEqual(markerNumbers(requests.at(-1)), Array.from({ length: 12 }, (_, i) => i + 5));
  state = await action({ type: "create_chapter_range", chatId, messageIds: messages.slice(17, 29).map((m) => m.id) }, (s) => s.chapters.length === 2);
  assert.equal(state.chapters[1].meta.firstMsgIdx, 17);
  assert.equal(state.chapters[1].meta.lastMsgIdx, 28);
  assert.deepEqual(markerNumbers(requests.at(-1)), Array.from({ length: 12 }, (_, i) => i + 17));
  state = await action({ type: "create_chapter", chatId }, (s) => s.chapters.length === 3);
  assert.deepEqual(markerNumbers(requests.at(-1)), Array.from({ length: 12 }, (_, i) => i + 29));
  pass("manual selection followed by automatic window selection sends every source exactly once");
  const second = state.chapters[1], third = state.chapters[2];
  state = await action({ type: "regenerate_entry", chatId, entryId: second.entryId }, (s) => s.chapters[1]?.content !== second.content);
  assert.equal(state.chapters.length, 3);
  assert.equal(state.chapters[1].entryId, second.entryId);
  assert(promptText(requests.at(-1)).includes(state.chapters[0].content));
  assert(!promptText(requests.at(-1)).includes(second.content));
  assert(!promptText(requests.at(-1)).includes(third.content));
  assert.deepEqual(markerNumbers(requests.at(-1)), Array.from({ length: 12 }, (_, i) => i + 17));
  pass("regeneration excludes itself and future memories while preserving its entry ID");
  state = await action({ type: "create_chapter", chatId }, (s) => s.chapters.length === 4);
  assert.equal(state.coverage.coveredMessages, 48);
  assert.equal(state.messages.filter((m: any) => m.hidden).length, 48);
  const dryRun = await api("/api/v1/generate/dry-run", "POST", { chat_id: chatId, connection_id: connection.id });
  await Bun.write(join(runDir, "prompt.json"), JSON.stringify(dryRun, null, 2));
  const assembled = promptText(dryRun);
  for (const chapter of state.chapters) assert(assembled.includes(chapter.content), "Active memory missing from actual host prompt");
  assert(!assembled.includes("PRIVATE_CHAT_MARKER_"));
  pass("actual host prompt injects all active summaries when every raw message is hidden");

  const fork = await api(`/api/v1/chats/${chatId}/branch`, "POST", { message_id: messages[40].id, name: "Integration fork" });
  let forkState = await action({ type: "refresh", chatId: fork.id }, (s) => s.activeChatId === fork.id && s.chapters.length === 3);
  assert.equal(forkState.messages.length, 36);
  assert.equal(forkState.messages[0].indexInChat, 5);
  assert.equal(forkState.coverage.coveredMessages, 36);
  assert.notEqual(forkState.bookId, state.bookId);
  const forkIds = new Set(forkState.messages.map((m: any) => m.id));
  assert(forkState.chapters.every((c: any) => c.meta.msgIds.every((id: string) => forkIds.has(id))));
  pass("host-created fork inherits only pre-fork summaries and remaps IDs across index gaps");

  const chapterIds = state.chapters.map((c: any) => c.entryId);
  state = await action({ type: "create_arc_from", chatId, chapterEntryIds: chapterIds.slice(0, 2) }, (s) => s.activeChatId === chatId && s.arcs.length === 1);
  state = await action({ type: "create_arc_from", chatId, chapterEntryIds: chapterIds.slice(2) }, (s) => s.arcs.length === 2);
  const arc = state.arcs[1];
  state = await action({ type: "regenerate_entry", chatId, entryId: arc.entryId }, (s) => s.arcs[1]?.content !== arc.content);
  assert.equal(state.arcs[1].entryId, arc.entryId);
  assert(!promptText(requests.at(-1)).includes(arc.content));
  pass("arc regeneration works through real storage without duplicate active entries");
  state = await action({ type: "create_volume_from", chatId, arcEntryIds: state.arcs.map((a: any) => a.entryId) }, (s) => s.volumes.length === 1);
  const volume = state.volumes[0];
  assert.equal(state.chapters.filter((c: any) => c.active).length, 0);
  state = await action({ type: "delete_entry", chatId, entryId: state.arcs[0].entryId }, (s) => s.arcs.length === 1);
  assert.equal(state.coverage.coveredMessages, 48);
  assert.equal(state.chapters.filter((c: any) => c.active).length, 0);
  assert.equal(state.volumes[0].entryId, volume.entryId);
  pass("deleting a compacted arc preserves its volume coverage during real host deletion events");
  state = await action({ type: "delete_entry", chatId, entryId: volume.entryId }, (s) => s.volumes.length === 0);
  assert.equal(state.coverage.coveredMessages, 48);
  assert.equal(state.chapters.filter((c: any) => c.active).length, 2);
  assert.equal(state.arcs.filter((c: any) => c.active).length, 1);
  pass("deleting a volume revives the correct surviving descendants");

  const original = state.chapters[0];
  providerMode = "fail";
  state = await action({ type: "regenerate_entry", chatId, entryId: original.entryId }, (s) => !!s.lastFailure);
  assert.equal(state.chapters.find((c: any) => c.entryId === original.entryId).content, original.content);
  assert.equal(state.coverage.coveredMessages, 48);
  providerMode = "normal";
  state = await action({ type: "retry_last_failure", chatId }, (s) => s.chapters.find((c: any) => c.entryId === original.entryId)?.content !== original.content);
  assert.deepEqual(markerNumbers(requests.at(-1)), Array.from({ length: 12 }, (_, i) => i + 5));
  pass("real HTTP provider failure preserves saved memory and retry reuses the original sources");

  profile.showMemoryPreviews = true;
  await action({ type: "save_settings", chatId, patch: { profiles: [profile] } }, (s) => s.settings.profiles[0].showMemoryPreviews);
  state = await action({ type: "regenerate_entry", chatId, entryId: original.entryId }, (s) => s.pendingPreviews.length === 1);
  const draftId = state.pendingPreviews[0].draftId;
  state = await action({ type: "update_entry", chatId, entryId: original.entryId, patch: { content: "PRIVATE_EDITED_SUMMARY" } }, (s) => s.chapters[0].content === "PRIVATE_EDITED_SUMMARY");
  state = await action({ type: "accept_preview", chatId, draftId });
  assert.equal(state.chapters[0].content, "PRIVATE_EDITED_SUMMARY");
  assert.equal(state.pendingPreviews.length, 1);
  await action({ type: "discard_preview", chatId, draftId }, (s) => !s.pendingPreviews.length);
  pass("accepting a stale preview cannot overwrite a concurrent user edit");

  profile.showMemoryPreviews = false;
  await action({ type: "save_settings", chatId, patch: { profiles: [profile] } });
  providerMode = "pause";
  releaseProvider = undefined;
  send({ type: "regenerate_entry", chatId, entryId: original.entryId });
  await until("provider request held", () => releaseProvider, Boolean);
  await response({ type: "abort_busy", chatId, kind: "chapter" }, "state");
  providerMode = "normal";
  releaseProvider!();
  state = await action({ type: "refresh", chatId }, (s) => !s.busy.some((b: any) => b.chatId === chatId));
  assert.equal(state.chapters[0].content, "PRIVATE_EDITED_SUMMARY");
  pass("cancellation rejects a delayed provider response without replacing saved memory");

  const exported = await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data");
  assert(new TextEncoder().encode(exported.content).length <= 10_000_000);
  for (const secret of ["PRIVATE_CHAT_MARKER_", "PRIVATE_EDITED_SUMMARY", "SAVED_SUMMARY_", "Synthetic integration character", chatId, ...messages.map((m) => m.id)]) assert(!exported.content.includes(secret), `Diagnostics leaked ${secret}`);
  await Bun.write(join(runDir, "diagnostics.json"), exported.content);
  pass("diagnostic download contains structural events without synthetic chat text, summaries, names or raw IDs");
  const lifecycle = await fromHost("spindle/lifecycle.ts");
  await lifecycle.restartExtension(extensionId);
  state = await action({ type: "refresh", chatId }, (s) => s.activeChatId === chatId);
  assert.equal(state.chapters[0].content, "PRIVATE_EDITED_SUMMARY");
  assert.equal(state.coverage.coveredMessages, 48);
  pass("worker restart reloads persisted summaries and reconstructs the same coverage");
  forkState = await action({ type: "wipe_books", chatId: fork.id }, (s) => s.activeChatId === fork.id && s.chapters.length === 0);
  assert.equal(forkState.messages.filter((m: any) => m.hidden).length, 0);
  state = await action({ type: "refresh", chatId }, (s) => s.activeChatId === chatId);
  assert.equal(state.coverage.coveredMessages, 48);
  pass("wiping the fork restores its raw messages and leaves the parent unchanged");
  const automated = await api("/api/v1/chats", "POST", { character_id: character.id, name: "Automatic filing integration" });
  const autoMessages = [];
  for (let i = 0; i < 25; i++) autoMessages.push(await api(`/api/v1/chats/${automated.id}/messages`, "POST", { name: "User", is_user: true, content: `AUTO_SOURCE_${i}_END` }));
  const autoProfile = { ...profile, autoCreate: true, autoCreateChapter: true, lagValue: 2 };
  await action({ type: "save_settings", chatId: automated.id, patch: { profiles: [autoProfile] } });
  await api("/api/v1/generate", "POST", { chat_id: automated.id, connection_id: connection.id });
  const autoState = await until("generation-ended automatic filing", () => action({ type: "refresh", chatId: automated.id }), (s) => s.chapters.length === 2 && !s.busy.length);
  assert.equal(autoState.messages.length, 26);
  assert.equal(autoState.coverage.coveredMessages, 24);
  assert.deepEqual(autoState.chapters.flatMap((c: any) => c.meta.msgIds), autoMessages.slice(0, 24).map((m) => m.id));
  assert(autoState.messages.slice(-2).every((m: any) => !m.hidden && !m.covered));
  pass("real chat generation triggers automatic filing and preserves the configured lag tail");
  await action({ type: "save_settings", chatId: automated.id, patch: { profiles: [{ ...profile, windowValue: 7 }] } });
  const resized = await action({ type: "create_chapter", chatId: automated.id }, (s) => s.chapters.length === 3);
  assert.equal(resized.coverage.coveredMessages, 26);
  assert.equal(resized.chapters[2].meta.msgIds.length, 2);
  pass("changing lag and window after automation files the remaining tail without overlaps");
  await action({ type: "save_settings", chatId, patch: { profiles: [profile], localLogsDisabled: true } });
  const disabledBefore = JSON.parse((await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content);
  await action({ type: "resync_visibility", chatId });
  const disabledAfter = JSON.parse((await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content);
  assert.deepEqual(disabledAfter.events, disabledBefore.events);
  await lifecycle.restartExtension(extensionId);
  state = await action({ type: "refresh", chatId });
  assert.equal(state.settings.localLogsDisabled, true);
  const disabledRestart = JSON.parse((await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content);
  assert.deepEqual(disabledRestart.events, disabledBefore.events);
  pass("diagnostics opt-out stops recording and survives worker restart");
  await action({ type: "save_settings", chatId, patch: { localLogsDisabled: false } });
  const resumed = JSON.parse((await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content);
  assert(resumed.events.length > disabledRestart.events.length);
  pass("re-enabling local logs resumes structural recording");
  const raceChat = await api("/api/v1/chats", "POST", { character_id: character.id, name: "Source edit integration" });
  const raceMessages = [];
  for (let i = 0; i < 2; i++) raceMessages.push(await api(`/api/v1/chats/${raceChat.id}/messages`, "POST", { name: "User", is_user: true, content: `RACE_SOURCE_${i}` }));
  providerMode = "pause";
  releaseProvider = undefined;
  send({ type: "create_chapter_range", chatId: raceChat.id, messageIds: raceMessages.map((m) => m.id) });
  await until("generation before source edit", () => releaseProvider, Boolean);
  await api(`/api/v1/chats/${raceChat.id}/messages/${raceMessages[0].id}`, "PUT", { content: "SOURCE_EDITED_DURING_GENERATION" });
  providerMode = "normal";
  releaseProvider!();
  let raceState = await until("reject changed source", () => action({ type: "refresh", chatId: raceChat.id }), (s) => !s.busy.length && !!s.lastFailure);
  assert.equal(raceState.chapters.length, 0);
  assert(raceState.messages.every((m: any) => !m.hidden));
  pass("editing a real host message during generation rejects stale output before saving or hiding");
  await action({ type: "save_settings", chatId: raceChat.id, patch: { profiles: [{ ...profile, showMemoryPreviews: true }] } });
  raceState = await action({ type: "create_chapter_range", chatId: raceChat.id, messageIds: raceMessages.map((m) => m.id) }, (s) => s.pendingPreviews.length === 1);
  assert.equal(raceState.chapters.length, 0);
  assert(raceState.messages.every((m: any) => !m.hidden));
  raceState = await action({ type: "accept_preview", chatId: raceChat.id, draftId: raceState.pendingPreviews[0].draftId }, (s) => s.chapters.length === 1);
  assert(raceState.messages.every((m: any) => m.hidden));
  raceState = await action({ type: "release_entry", chatId: raceChat.id, entryId: raceState.chapters[0].entryId }, (s) => s.coverage.coveredMessages === 0);
  assert(raceState.messages.every((m: any) => !m.hidden));
  pass("valid preview acceptance hides sources; releasing its chapter restores them");

  // Match the reported scale and transition: ~1,100 manually filed messages,
  // then automation, deleted indexes, lag/window changes and a real fork.
  const longChat = await api("/api/v1/chats", "POST", { character_id: character.id, name: "Long history integration" });
  await action({ type: "save_settings", chatId: longChat.id, patch: { profiles: [profile] } });
  const longMessages = [];
  for (let i = 0; i < 1445; i++) {
    longMessages.push(await api(`/api/v1/chats/${longChat.id}/messages`, "POST", { name: i % 2 ? "Assistant" : "User", is_user: i % 2 === 0, content: `LONG_SOURCE_${i}_END` }));
    if (i && i % 400 === 0) console.log(`HOST PROGRESS: seeded ${i} long-history messages`);
  }
  for (const message of longMessages.slice(0, 5)) await api(`/api/v1/chats/${longChat.id}/messages/${message.id}`, "DELETE");
  const longStart = requests.length;
  let longState: any;
  for (let chapter = 0; chapter < 92; chapter++) {
    longState = await action({ type: "create_chapter_range", chatId: longChat.id, messageIds: longMessages.slice(5 + chapter * 12, 17 + chapter * 12).map((m) => m.id) }, (s) => s.chapters.length === chapter + 1);
    if (chapter && chapter % 30 === 0) console.log(`HOST PROGRESS: manually filed ${chapter + 1} chapters`);
  }
  assert.equal(longState.coverage.coveredMessages, 1104);
  await action({ type: "save_settings", chatId: longChat.id, patch: { profiles: [{ ...autoProfile, lagValue: 13, windowValue: 11 }] } });
  await api("/api/v1/generate", "POST", { chat_id: longChat.id, connection_id: connection.id });
  longState = await until("long-history automation drain", () => action({ type: "refresh", chatId: longChat.id }), (s) => s.coverage.coveredMessages === 1423 && !s.busy.length, 60000);
  const longIds = longState.chapters.flatMap((c: any) => c.meta.msgIds);
  assert.equal(new Set(longIds).size, longIds.length);
  assert.deepEqual(longIds, longMessages.slice(5, 1428).map((m) => m.id));
  for (const chapter of longState.chapters) {
    const first = longMessages.findIndex((m) => m.id === chapter.meta.msgIds[0]);
    const last = longMessages.findIndex((m) => m.id === chapter.meta.msgIds.at(-1));
    assert.equal(chapter.meta.firstMsgIdx, first);
    assert.equal(chapter.meta.lastMsgIdx, last);
  }
  const sourceNumbers = requests.slice(longStart).filter((r) => promptText(r).includes("SCENE TO SUMMARIZE")).flatMap((r) => [...promptText(r).matchAll(/LONG_SOURCE_(\d+)_END/g)].map((m) => Number(m[1])));
  assert.deepEqual(sourceNumbers, Array.from({ length: 1423 }, (_, i) => i + 5));
  pass("1,445-message history: 92 manual chapters then 29 automatic chapters have exact model inputs, ranges and no skipped or repeated sources");
  await action({ type: "save_settings", chatId: longChat.id, patch: { profiles: [profile] } });
  const longFork = await api(`/api/v1/chats/${longChat.id}/branch`, "POST", { message_id: longMessages[1427].id, name: "Long history fork" });
  const longForkState = await action({ type: "refresh", chatId: longFork.id }, (s) => s.activeChatId === longFork.id && s.chapters.length === 121);
  assert.equal(longForkState.coverage.coveredMessages, 1423);
  assert.equal(longForkState.messages.length, 1423);
  assert.equal(longForkState.chapters.at(-1).meta.lastMsgIdx, 1427);
  pass("long-history fork preserves all 121 summaries and their coverage across deleted index gaps");
  const saturatedExport = (await response({ type: "diagnostics_export", chatId: longChat.id }, "diagnostics_export_data")).content;
  const saturated = JSON.parse(saturatedExport);
  const { getFirstUserId } = await fromHost("auth/seed.ts");
  const { getUserExtensionPath } = await fromHost("auth/provision.ts");
  const diagnosticFile = Bun.file(join(getUserExtensionPath(getFirstUserId(), "lumi_books"), "diagnostics.json"));
  const persistedDiagnostics = await diagnosticFile.text();
  assert(new TextEncoder().encode(saturatedExport).length <= 10_000_000);
  assert(new TextEncoder().encode(persistedDiagnostics).length <= 10_000_000);
  assert.equal(persistedDiagnostics, JSON.stringify(JSON.parse(persistedDiagnostics)));
  assert(saturated.droppedEvents > 0, "Long-history workload must exercise actual byte-budget eviction");
  assert.equal(saturated.writeFailuresThisSession, 0);
  for (const marker of ["LONG_SOURCE_", "PRIVATE_CHAT_MARKER_", "SAVED_SUMMARY_", "SOURCE_EDITED_DURING_GENERATION", longChat.id]) assert(!saturatedExport.includes(marker));
  await Bun.write(join(runDir, "saturated-diagnostics.json"), saturatedExport);
  pass("real logging reaches its byte limit, evicts older events and keeps disk/export compact and below 10 MB");
  await action({ type: "save_settings", chatId, patch: { localLogsDisabled: true } });
  await response({ type: "diagnostics_clear", chatId }, "toast");
  const cleared = JSON.parse((await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content);
  assert.equal(cleared.events.length, 0);
  state = await action({ type: "refresh", chatId });
  assert.equal(state.settings.localLogsDisabled, true);
  assert.equal(state.coverage.coveredMessages, 48);
  await action({ type: "save_settings", chatId, patch: { localLogsDisabled: false } });
  const afterClear = JSON.parse((await response({ type: "diagnostics_export", chatId }, "diagnostics_export_data")).content);
  assert(afterClear.events.length > 0);
  assert.notEqual(afterClear.events.find((e: any) => e.event === "snapshot").chatId, resumed.events.find((e: any) => e.event === "snapshot" && e.entries?.length)?.chatId);
  pass("clearing diagnostics empties saved records, preserves opt-out and coverage, and resets pseudonyms");
  await Bun.write(join(runDir, "checkpoint.json"), JSON.stringify({ chatId, connectionId: connection.id, characterId: character.id, extensionId, results }, null, 2));
  const revision = (directory: string) => Bun.spawnSync(["git", "-C", directory, "rev-parse", "HEAD"]).stdout.toString().trim();
  await Bun.write(join(runDir, "report.json"), JSON.stringify({
    results, elapsedMs: Date.now() - startedAt, requests: requests.length, memoryPressure,
    hostRevision: revision(host), extensionRevision: revision(repo),
    backendSha256: new Bun.CryptoHasher("sha256").update(await Bun.file(join(repo, "dist/backend.js")).arrayBuffer()).digest("hex"),
    frontendSha256: new Bun.CryptoHasher("sha256").update(await Bun.file(join(repo, "dist/frontend.js")).arrayBuffer()).digest("hex"),
    diagnostics: { bytes: new TextEncoder().encode(saturatedExport).length, retained: saturated.events.length, evicted: saturated.droppedEvents, queueDrops: saturated.queueDropsThisSession, writeFailures: saturated.writeFailuresThisSession },
    model: "deterministic local HTTP SSE provider; no live model", browserChecks: "Run separately; not implied by this script",
  }, null, 2));
  console.log(`HOST REPORT: ${runDir}`);
  if (process.argv.includes("--keep-open")) {
    await Bun.write(join(repo, "local", "real-host-browser.json"), JSON.stringify({ password, runDir, chatId, extensionId }));
    console.log("HOST READY FOR BROWSER: http://localhost:18760");
    while (!existsSync(join(runDir, "stop"))) await Bun.sleep(250);
  }
} catch (error) {
  console.error(error);
  await Bun.write(join(runDir, "failure.json"), JSON.stringify({ error: String(error), results, inbox: inbox.slice(-15), requests }, null, 2));
  process.exitCode = 1;
} finally {
  releaseProvider?.();
  provider.stop(true);
  socket?.close();
  try { await (await fromHost("spindle/lifecycle.ts")).stopAllExtensions(); } catch {}
  process.exit(process.exitCode || 0);
}

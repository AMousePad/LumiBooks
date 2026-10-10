import { afterAll, afterEach, beforeEach, expect, test } from "bun:test";
import { normalizeEntryMeta } from "../shared";
import { buildInjection } from "./injection";
import { invalidateBookCache } from "./world-book";
import { exportDiagnostics } from "./diagnostics";

const original = (globalThis as any).spindle;
const chatId = "injection-range-chat", userId = "injection-range-user", bookId = "injection-range-book";
let messages: any[], entries: any[], reads: number;
const captured = () => ({ worldInfoActivationCapture: true, capturedWorldInfo: entries.map((e) => ({ id: e.id })) });
const assembled = () => messages.filter((m) => !m.extra.hidden).map((m) => ({ role: m.role, content: m.content,
  __isChatHistory: true, sourceMessageId: m.id, sourceIndexInChat: m.index_in_chat, sourceMessageMetadata: {} }));
function summary(ids: string[], first: number, last: number) {
  entries = [{ id: "summary", world_book_id: bookId, content: "SUMMARY", disabled: false,
    extensions: { lumibooks: normalizeEntryMeta({ tier: 1, chatId, msgIds: ids, firstMsgIdx: first, lastMsgIdx: last }) } }];
}
beforeEach(() => {
  reads = 0; entries = [];
  messages = Array.from({ length: 4 }, (_, i) => ({ id: `m${i}`, role: "user", content: `RAW_${i + 5}`, index_in_chat: i + 5, extra: { hidden: false } }));
  const disk = new Map<string, unknown>();
  const book = { id: bookId, metadata: { lumibooks_chat_id: chatId } };
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    chat: { async getMessages() { reads++; return structuredClone(messages); } },
    chats: { async get() { return { id: chatId, metadata: { lumibooks_book_id: bookId } }; } },
    world_books: { async get() { return book; }, entries: { async list() { return { data: structuredClone(entries), total: entries.length }; } } },
    userStorage: { async exists() { return false; }, async getJson(path: string, opts: any) { return disk.get(path) ?? opts?.fallback; },
      async setJson(path: string, value: unknown) { disk.set(path, structuredClone(value)); } },
  };
  invalidateBookCache(userId, chatId);
});
afterEach(async () => { await exportDiagnostics(userId); });
afterAll(() => { (globalThis as any).spindle = original; });

test("hidden summaries with old offset ranges inject at their live host position", async () => {
  summary(["m1"], 1, 1);
  messages[1].extra.hidden = true;
  const result = await buildInjection(chatId, assembled(), userId, captured());
  expect(result?.messages?.map((m) => m.content)).toEqual(["RAW_5", "SUMMARY", "RAW_7", "RAW_8"]);
});

test("a partially hidden selection injects after its last source, not its last visible source", async () => {
  summary(["m0", "m2"], 5, 7);
  messages[2].extra.hidden = true;
  const result = await buildInjection(chatId, assembled(), userId, captured());
  expect(result?.messages?.map((m) => m.content)).toEqual(["RAW_6", "SUMMARY", "RAW_8"]);
});

test("fully hidden history still injects captured summaries before trailing instructions", async () => {
  summary(messages.map((m) => m.id), 5, 8);
  messages.forEach((m) => { m.extra.hidden = true; });
  const prompt = [{ role: "system" as const, content: "System" }, { role: "user" as const, content: "Continue the scene" }];
  const result = await buildInjection(chatId, prompt, userId, captured());
  expect(result?.messages?.map((m) => m.content)).toEqual(["System", "SUMMARY", "Continue the scene"]);
  expect(reads).toBe(1);
});

test("missing source metadata resolves host indexes without dropping excluded raw messages", async () => {
  summary(["m1"], 6, 6);
  messages[1].metadata = { lmb_excluded: true };
  const prompt: any[] = assembled();
  delete prompt[1].sourceMessageMetadata;
  const result = await buildInjection(chatId, prompt, userId, captured());
  expect(result?.messages?.map((m) => m.content)).toEqual(["RAW_5", "RAW_6", "SUMMARY", "RAW_7", "RAW_8"]);
  const events = JSON.parse(await exportDiagnostics(userId)).events;
  expect(events.findLast((e: any) => e.event === "injection").messages.map((m: any) => m.index)).toEqual([5, 6, 7, 8]);
});

test("complete source metadata retains the no-full-chat-read path", async () => {
  summary(["m1"], 6, 6);
  const result = await buildInjection(chatId, assembled(), userId, captured());
  expect(result?.messages?.map((m) => m.content)).toEqual(["RAW_5", "SUMMARY", "RAW_7", "RAW_8"]);
  expect(reads).toBe(0);
});

test("an inherited root injects into a new chat with no history yet", async () => {
  summary(["old-chat-message"], -1, -1);
  entries[0].extensions.lumibooks.isRoot = true;
  messages = [];
  const result = await buildInjection(chatId, [{ role: "system", content: "System" }], userId, captured());
  expect(result?.messages?.map((m) => m.content)).toEqual(["System", "SUMMARY"]);
});

test("a missing history block with visible messages still skips injection", async () => {
  summary(["m1"], 6, 6);
  expect(await buildInjection(chatId, [{ role: "system", content: "System" }], userId, captured())).toBeNull();
});

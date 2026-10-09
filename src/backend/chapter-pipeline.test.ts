import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, makeDefaultProfile, normalizeEntryMeta } from "../shared";
import { createChapterFromRange, registerPipelineCallbacks } from "./pipeline";
import { invalidateBookCache } from "./world-book";
import { saveSettings } from "./storage";

const original = (globalThis as any).spindle;
const chatId = "chapter-regression", userId = "chapter-regression-user", bookId = "chapter-regression-book";
let entries: any[], messages: any[], requests: any[], serial: number;
let profile = makeDefaultProfile("chapter-regression");
const settings = () => ({ ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
function chapter(number: number, start: number, end: number) {
  return {
    id: `chapter-${number}`, world_book_id: bookId, content: `MEMORY_${number}`, comment: `Chapter ${number}`, disabled: false,
    extensions: { lumibooks: normalizeEntryMeta({ tier: 1, chatId, sceneNumber: number,
      msgIds: messages.slice(start, end).map((m) => m.id), firstMsgIdx: start, lastMsgIdx: end - 1 }) },
  };
}
beforeEach(async () => {
  entries = []; requests = []; serial = 0;
  messages = Array.from({ length: 100 }, (_, i) => ({ id: `m${i + 1}`, role: "user", content: `RAW_MESSAGE_${i + 1}_END`, index_in_chat: i, extra: {} }));
  profile = { ...makeDefaultProfile("chapter-regression"), retryCount: 0, autoCreateArc: false, hideCoveredMessages: false, codexEnabled: false, lagValue: 0, windowValue: 12 };
  const book = { id: bookId, name: "Test", metadata: { lumibooks_chat_id: chatId } };
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} }, rpcPool: { sync() {} },
    userStorage: { async setJson() {}, async getJson() { return settings(); } },
    chat: { async getMessages() { return messages; } },
    chats: { async get() { return { id: chatId, metadata: { lumibooks_book_id: bookId, chat_world_book_ids: [bookId] } }; }, async update() {} },
    connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
    tokens: { async countText(text: string) { return { total_tokens: Math.ceil(text.length / 4) }; } },
    generate: { async *rawStream(req: any) {
      requests.push(req);
      yield { type: "done", content: JSON.stringify({ title: "Summary", content: "A compressed story.", keywords: [] }) };
    } },
    world_books: { async get() { return book; }, async list() { return { data: [book], total: 1 }; }, entries: {
      async list() { return { data: entries, total: entries.length }; },
      async create(_id: string, value: any) { const row = { ...value, id: `new-${++serial}`, world_book_id: bookId }; entries.push(row); return row; },
      async update(id: string, patch: any) { const row = entries.find((e) => e.id === id); Object.assign(row, patch); return row; },
      async delete(id: string) { entries = entries.filter((e) => e.id !== id); return true; },
    } },
  };
  registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
  invalidateBookCache(userId, chatId);
  await saveSettings(userId, settings());
});
afterAll(() => { (globalThis as any).spindle = original; });

test("regenerating chapter 67 includes only preceding memories and preserves its source IDs and ordinal", async () => {
  entries = [chapter(64, 0, 12), chapter(65, 12, 24), chapter(66, 24, 36), chapter(67, 36, 48), chapter(68, 48, 60)];
  const ids = entries[3].extensions.lumibooks.msgIds;
  profile.previousMemoriesCount = 3;
  const id = await createChapterFromRange(chatId, ids, profile, settings(), userId, { replacesEntryId: "chapter-67" });
  expect(id).toBeTruthy();
  const prompt = requests[0].messages[1].content;
  for (const n of [64, 65, 66]) expect(prompt).toContain(`MEMORY_${n}`);
  for (const n of [67, 68]) expect(prompt).not.toContain(`MEMORY_${n}`);
  for (let n = 37; n <= 48; n++) expect(prompt).toContain(`RAW_MESSAGE_${n}_END`);
  const saved = entries.find((e) => e.id === id).extensions.lumibooks;
  expect(saved.msgIds).toEqual(ids);
  expect(saved.sceneNumber).toBe(67);
  expect(entries.some((e) => e.id === "chapter-67")).toBe(false);
});

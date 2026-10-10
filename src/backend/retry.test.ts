import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, HIGHER_TIERS, TIER_NAMES, makeDefaultProfile, normalizeEntryMeta, normalizeProfile } from "../shared";
import { buildCoverage } from "./coverage";
import { copyLmbEntries } from "./book-copy";
import { createChapterFromRange, getLastFailure, createHigherFromEntries, drainHigherBacklog, maybeRunArcCheck, getPendingPreviews, acceptPreview, registerPipelineCallbacks } from "./pipeline";
import { invalidateBookCache, listLmbEntries } from "./world-book";
import { saveSettings } from "./storage";

const original = (globalThis as any).spindle;
const chatId = "higher-test", userId = "higher-user", bookId = "higher-book";
let entries: any[] = [], calls = 0, serial = 0;
let profile = makeDefaultProfile("higher", "test");
const book = { id: bookId, name: "Test", metadata: { lumibooks_chat_id: chatId } };
const settings = () => ({ ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
function source(tier: number, i: number) {
 const meta = normalizeEntryMeta({ tier, chatId, msgIds: [`m${i}`], firstMsgIdx: i, lastMsgIdx: i, tokenCountOutput: 24000 })!;
 return { id: `source-${tier}-${i}`, world_book_id: bookId, content: `Summary ${i}`, comment: `Source ${i}`, disabled: false, constant: true, extensions: { lumibooks: meta } };
}
beforeEach(async () => {
 entries = []; calls = 0; serial = 0; profile = makeDefaultProfile("higher", "test");
 profile.autoCreateArc = false; profile.retryCount = 0;
 (globalThis as any).spindle = {
  log: { info() {}, warn: console.warn, error: console.error }, rpcPool: { sync() {} },
  userStorage: { async setJson() {}, async getJson() { return settings(); } },
  chat: { async getMessages() { return []; } },
  chats: { async get() { return { id: chatId, metadata: { lumibooks_book_id: bookId, chat_world_book_ids: [bookId] } }; }, async update() {} },
  connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
  tokens: { async countText(text: string) { return { total_tokens: Math.ceil(text.length / 4) }; } },
  generate: { async *rawStream(req: any) {
    calls++; expect(req.messages[1].content).toContain("TO CONSOLIDATE");
    yield { type: "done", content: JSON.stringify({ title: "Bound", content: "A compressed story.", keywords: ["story"] }), usage: { completion_tokens: 24000 } };
  } },
  world_books: { async get() { return book; }, async list() { return { data: [book], total: 1 }; },
   entries: {
    async list(id: string) { const data = entries.filter((e) => e.world_book_id === id); return { data, total: data.length }; },
    async create(id: string, value: any) { const entry = { ...value, id: `new-${++serial}`, world_book_id: id }; entries.push(entry); return entry; },
    async update(id: string, patch: any) { const row = entries.find((e) => e.id === id); Object.assign(row, patch); return row; },
    async delete(id: string) { entries = entries.filter((e) => e.id !== id); return true; },
   },
  },
 };
 registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
 invalidateBookCache(userId, chatId);
 await saveSettings(userId, settings());
});
afterAll(() => { (globalThis as any).spindle = original; });


test("retry must respect the failed automatic batch and reserved lag", async () => {
 let handler: any;
 const sent: any[] = [];
 Object.assign((globalThis as any).spindle, {
   registerWorldInfoInterceptor() {}, registerInterceptor() {}, on() {},
   onFrontendMessage(fn: any) { handler = fn; }, sendToFrontend(msg: any) { sent.push(msg); },
 });
 (globalThis as any).spindle.userStorage.mkdir = async () => {};
 // Suppress a state refresh for the background chat after the retry completes.
 (globalThis as any).spindle.chats.getActive = async () => ({ id: "another-active-chat" });
 (globalThis as any).spindle.macros = { async resolve(text: string) { return text; } };
 const disk = new Map<string, any>();
 (globalThis as any).spindle.userStorage.setJson = async (path: string, value: any) => { disk.set(path, structuredClone(value)); };
 (globalThis as any).spindle.userStorage.exists = async (path: string) => disk.has(path);
 (globalThis as any).spindle.userStorage.read = async (path: string) => JSON.stringify(disk.get(path));
 const { unlockedLessons } = await import("../shared");
 disk.set("lessons.json", unlockedLessons());
 const { retryLastFailure } = await import("./index");
 registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
 entries = Array.from({ length: 4 }, (_, i) => source(2, i));
 profile.higherTiers[3] = { ...profile.higherTiers[3], enabled: true, batch: 2, lag: 2 };
 await saveSettings(userId, settings());
 (globalThis as any).spindle.generate.rawStream = async function* () {
   calls++;
   if (calls === 1) throw new Error("temporary model fault");
   yield { type: "done", content: JSON.stringify({ title: "Bound", content: "Summary.", keywords: ["story"] }) };
 };
 expect(await drainHigherBacklog(3, chatId, profile, settings(), userId, true)).toBe(0);
 await retryLastFailure(chatId, userId, profile, settings());
 const volume = entries.find((e) => e.extensions.lumibooks.tier === 3);
 expect(volume?.extensions.lumibooks.sourceChapterEntryIds.length).toBe(2);
});

for (const extra of [false, true]) for (const regenerate of [false, true]) test(`retry preserves ${regenerate ? "regeneration target" : "manual chapter selection"} with extra context ${extra}`, async () => {
 Object.assign((globalThis as any).spindle, {
   registerWorldInfoInterceptor() {}, registerInterceptor() {}, on() {}, onFrontendMessage() {}, sendToFrontend() {},
   macros: { async resolve(text: string) { return text; } },
 });
 const { retryLastFailure } = await import("./index");
 registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
 const messages = Array.from({ length: 60 }, (_, i) => ({ id: `m${i}`, role: "user", content: `RETRY_SOURCE_${i}_END`, index_in_chat: i, extra: {} }));
 (globalThis as any).spindle.chat.getMessages = async () => messages;
 profile.codexEnabled = true; profile.codexExtraContext = extra;
 profile.lagValue = 50; profile.windowValue = 12;
 profile.hideCoveredMessages = false;
 const ids = ["m20", "m22", "m24"];
 const old = source(1, 20);
 old.extensions.lumibooks.msgIds = ids;
 old.extensions.lumibooks.sceneNumber = 67;
 if (regenerate) entries = [old];
 await saveSettings(userId, settings());
 const requests: any[] = [];
 (globalThis as any).spindle.generate.rawStream = async function* (req: any) {
   requests.push(req);
   if (requests.length === 1) throw new Error("temporary model fault");
   yield { type: "done", content: JSON.stringify({ title: "Retried", content: "Summary.", keywords: [] }) };
 };
 expect(await createChapterFromRange(chatId, ids, profile, settings(), userId, regenerate ? { replacesEntryId: old.id } : {})).toBeNull();
 await retryLastFailure(chatId, userId, profile, settings());
 const created = entries.find((e) => e.id.startsWith("new-"));
 expect(created?.extensions.lumibooks.msgIds).toEqual(ids);
 expect(created?.extensions.lumibooks.ghost).not.toBe(true);
 expect(requests).toHaveLength(2);
 expect(requests[1].messages[1].content.match(/RETRY_SOURCE_\d+_END/g)).toEqual(ids.map((id) => `RETRY_SOURCE_${id.slice(1)}_END`));
 expect(getLastFailure(userId, chatId)).toBeNull();
 if (regenerate) {
   expect(entries.some((e) => e.id === old.id)).toBe(false);
   expect(created.extensions.lumibooks.sceneNumber).toBe(67);
 }
});

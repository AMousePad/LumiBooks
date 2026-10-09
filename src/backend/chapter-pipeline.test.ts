import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, makeDefaultProfile, normalizeEntryMeta } from "../shared";
import { acceptPreview, createArcFromChapters, createChapterAuto, createChapterFromRange, dryRunChapter, getPendingPreviews, registerPipelineCallbacks } from "./pipeline";
import { buildCoverage, computeCoverageStats, countCompressibleEligible } from "./coverage";
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

for (const manual of [false, true]) test(`${manual ? "File chapter" : "automation"} fills an older uncovered gap before the newer tail`, async () => {
  entries = [chapter(71, 0, 69), chapter(72, 75, 87)];
  profile.lagValue = 12;
  // Six missed messages cannot grow to the configured window of twelve.
  const coverage = await buildCoverage(chatId, userId);
  expect(computeCoverageStats(messages, coverage, profile).windowAvailable).toBe(true);
  expect(countCompressibleEligible(messages, coverage, profile)).toBe(7);
  const dry = await dryRunChapter(chatId, profile, settings(), userId);
  const id = await createChapterAuto(chatId, profile, settings(), userId, false, false, manual);
  expect(id).toBeTruthy();
  const prompt = requests[0].messages[1].content;
  expect(dry.messages[1]!.content).toBe(prompt);
  for (let n = 70; n <= 75; n++) expect(prompt).toContain(`RAW_MESSAGE_${n}_END`);
  expect(prompt).not.toContain("RAW_MESSAGE_88_END");
  expect(prompt).not.toContain("MEMORY_72");
  const saved = entries.find((e) => e.id === id).extensions.lumibooks;
  expect(saved.msgIds).toEqual(messages.slice(69, 75).map((m) => m.id));
  // The newer open tail still waits for a full window in automation.
  expect(await createChapterAuto(chatId, profile, settings(), userId)).toBeNull();
});

test("automation recovers holes left by manual selections while respecting exclusions and changed cadence", async () => {
  const selected = ["m2", "m4", "m6"];
  expect(await createChapterFromRange(chatId, selected, profile, settings(), userId)).toBeTruthy();
  messages[2].metadata = { lmb_excluded: true };
  profile.windowValue = 20;
  profile.lagValue = 95;
  requests = [];
  const first = await createChapterAuto(chatId, profile, settings(), userId);
  expect(entries.find((e) => e.id === first).extensions.lumibooks.msgIds).toEqual(["m1"]);
  // The second eligible hole is still before the lag boundary; its covered
  // right neighbour sits inside the lag. File chapter may file the short span.
  const second = await createChapterAuto(chatId, profile, settings(), userId, false, false, true);
  expect(entries.find((e) => e.id === second).extensions.lumibooks.msgIds).toEqual(["m5"]);
  expect(await createChapterAuto(chatId, profile, settings(), userId)).toBeNull();
  for (const req of requests) {
    expect(req.messages[1].content).not.toContain("RAW_MESSAGE_3_END");
    expect(req.messages[1].content).not.toContain("RAW_MESSAGE_7_END");
  }
});

test("ghost filing retains gap recovery and uses its own generation lag", async () => {
  entries = [chapter(1, 0, 12), chapter(2, 24, 36)];
  entries[1].disabled = true;
  entries[1].extensions.lumibooks.ghost = true;
  profile.codexEnabled = true;
  profile.codexExtraContext = true;
  profile.codexLagValue = 64;
  profile.lagValue = 90;
  await saveSettings(userId, settings());
  const id = await createChapterAuto(chatId, profile, settings(), userId, true, true);
  expect(id).toBeTruthy();
  const saved = entries.find((e) => e.id === id);
  expect(saved.extensions.lumibooks.msgIds).toEqual(messages.slice(12, 24).map((m) => m.id));
  expect(saved.extensions.lumibooks.ghost).toBe(true);
  expect(saved.disabled).toBe(true);
  expect(requests[0].messages[1].content).not.toContain("MEMORY_2");
});

test("arc binding orders old offset ranges by live sources and saves host message numbers", async () => {
  messages = messages.slice(5);
  entries = [chapter(71, 38, 50), chapter(72, 50, 62)];
  // A fork had corrected chapter 71; chapter 72 still has an old array offset.
  Object.assign(entries[0].extensions.lumibooks, { firstMsgIdx: 43, lastMsgIdx: 54 });
  const id = await createArcFromChapters(chatId, ["chapter-72", "chapter-71"], profile, settings(), userId);
  expect(id).toBeTruthy();
  const saved = entries.find((e) => e.id === id).extensions.lumibooks;
  expect([saved.firstMsgIdx, saved.lastMsgIdx]).toEqual([43, 66]);
  expect(saved.sourceChapterEntryIds).toEqual(["chapter-71", "chapter-72"]);
});

for (const mode of ["auto", "manual", "preview"] as const) test(`${mode} filing uses host message numbers after five earlier deletions`, async () => {
  messages = messages.slice(5);
  entries = [chapter(71, 0, 50)];
  Object.assign(entries[0].extensions.lumibooks, { firstMsgIdx: 5, lastMsgIdx: 54 });
  profile.showMemoryPreviews = mode === "preview";
  const ids = messages.slice(50, 62).map((m) => m.id);
  let id = mode === "auto"
    ? await createChapterAuto(chatId, profile, settings(), userId)
    : await createChapterFromRange(chatId, ids, profile, settings(), userId);
  if (mode === "preview") {
    const draft = getPendingPreviews(userId, chatId)[0]!;
    expect([draft.firstMsgIdx, draft.lastMsgIdx]).toEqual([55, 66]);
    id = await acceptPreview(chatId, draft.draftId, profile, userId);
  }
  expect(id).toBeTruthy();
  const saved = entries.find((e) => e.id === id).extensions.lumibooks;
  expect(saved.msgIds).toEqual(ids);
  expect([saved.firstMsgIdx, saved.lastMsgIdx]).toEqual([55, 66]);
  for (let n = 56; n <= 67; n++) expect(requests[0].messages[1].content).toContain(`RAW_MESSAGE_${n}_END`);
});

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

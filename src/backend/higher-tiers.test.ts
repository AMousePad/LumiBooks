import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, HIGHER_TIERS, TIER_NAMES, makeDefaultProfile, normalizeEntryMeta, normalizeProfile } from "../shared";
import { buildCoverage } from "./coverage";
import { copyLmbEntries } from "./book-copy";
import { createArcAuto, createArcFromChapters, createHigherFromEntries, drainHigherBacklog, maybeRunArcCheck, getPendingPreviews, getLastFailure, acceptPreview, registerPipelineCallbacks, repairSummaryTimeline } from "./pipeline";
import { SummaryTimelineError } from "./binding";
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
  log: { info() {}, warn() {}, error() {} }, rpcPool: { sync() {} },
  userStorage: { async setJson() {}, async getJson() { return settings(); } },
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

for (const tier of [2, ...HIGHER_TIERS] as const) for (const rootOnly of [false, true]) {
 test(`${TIER_NAMES[tier - 1]} compacts ${rootOnly ? "rooted" : "mixed rooted and own"} sources without consuming the lag`, async () => {
  entries = [source(tier - 1, 0), source(tier - 1, 1), source(tier - 1, 2)];
  for (const entry of entries.slice(0, rootOnly ? 2 : 1)) {
   Object.assign(entry.extensions.lumibooks, { isRoot: true, rootOrigin: "past-chat", firstMsgIdx: entry.extensions.lumibooks.firstMsgIdx - 2 });
  }
  profile.arcAfterChapters = 2; profile.arcLagChapters = 1;
  if (tier > 2) profile.higherTiers[tier] = { ...profile.higherTiers[tier], enabled: true, batch: 2, lag: 1 };
  await saveSettings(userId, settings());
  if (tier === 2) expect(await createArcAuto(chatId, profile, settings(), userId, true)).toBeTruthy();
  else expect(await drainHigherBacklog(tier, chatId, profile, settings(), userId, true)).toBe(1);
  expect(calls).toBe(1);
  const coverage = await buildCoverage(chatId, userId);
  const bound = coverage.activeEntries.find((e) => e.meta.tier === tier)!;
  expect(bound.meta.sourceChapterEntryIds).toEqual([`source-${tier - 1}-0`, `source-${tier - 1}-1`]);
  expect(!!bound.meta.isRoot).toBe(rootOnly);
  expect(bound.meta.rootOrigin).toBe(rootOnly ? "past-chat" : undefined);
  expect(coverage.activeEntries.map((e) => e.raw.id).sort()).toEqual([bound.raw.id, `source-${tier - 1}-2`].sort());
  expect(entries).toHaveLength(4);
  for (const entry of entries.slice(0, 2)) expect(entry.extensions.lumibooks.supersededByEntryId).toBe(bound.raw.id);
  const revived = await buildCoverage(chatId, userId, (await listLmbEntries(chatId, userId)).filter((e) => e.raw.id !== bound.raw.id));
  expect(revived.activeEntries).toHaveLength(3);
 });
}

for (const tier of HIGHER_TIERS) test(`${TIER_NAMES[tier - 1]} binds the exact batch and keeps its own lag`, async () => {
 entries = [source(tier - 1, 0), source(tier - 1, 1), source(tier - 1, 2)];
 profile.higherTiers[tier] = { ...profile.higherTiers[tier], enabled: true, batch: 2, lag: 1 };
 await saveSettings(userId, settings());
 expect(await drainHigherBacklog(tier, chatId, profile, settings(), userId, true)).toBe(1);
 expect(calls).toBe(1);
 const coverage = await buildCoverage(chatId, userId);
 expect(coverage.activeEntries.map((e) => e.meta.tier).sort()).toEqual([tier - 1, tier]);
 const bound = coverage.activeEntries.find((e) => e.meta.tier === tier)!;
 expect(bound.meta.sourceChapterEntryIds).toEqual([`source-${tier - 1}-0`, `source-${tier - 1}-1`]);
 expect(bound.raw.content).toContain(TIER_NAMES[tier - 1]!);
 expect(bound.meta.tokenCountInput).toBeLessThan(100);
});

test("automation cascades through Universe with arc automation off and preserves all coverage", async () => {
 entries = Array.from({ length: 32 }, (_, i) => source(2, i));
 for (const tier of HIGHER_TIERS) profile.higherTiers[tier] = { ...profile.higherTiers[tier], enabled: true, batch: 2, lag: 0 };
 await saveSettings(userId, settings());
 await maybeRunArcCheck(chatId, profile, settings(), userId, true);
 const coverage = await buildCoverage(chatId, userId);
 expect(calls).toBe(31);
 expect(coverage.activeEntries).toHaveLength(1);
 expect(coverage.activeEntries[0]!.meta.tier).toBe(7);
 expect(coverage.coveredBy.size).toBe(32);
 const all = await listLmbEntries(chatId, userId);
 const copied = await copyLmbEntries("copy", all, userId, (e) => ({ msgIds: e.meta.msgIds, extra: { chatId: "copy", isRoot: true } }));
 expect(copied.size).toBe(63);
 const clone = entries.filter((e) => e.world_book_id === "copy").map((raw) => ({ raw, meta: raw.extensions.lumibooks }));
 const inherited = await buildCoverage("copy", userId, clone);
 expect(inherited.activeEntries).toHaveLength(1);
 expect(inherited.activeEntries[0]!.meta.tier).toBe(7);
 expect(inherited.coveredBy.size).toBe(32);
 // Removing a parent revives only its immediate children, never all descendants.
 const released = await buildCoverage(chatId, userId, all.filter((e) => e.meta.tier !== 7));
 expect(released.activeEntries.map((e) => e.meta.tier)).toEqual([6, 6]);
});

test("higher-tier previews accept at their original tier and regeneration keeps that tier", async () => {
 entries = [source(5, 0), source(5, 1)];
 profile.showMemoryPreviews = true;
 await createHigherFromEntries(6, chatId, entries.map((e) => e.id), profile, settings(), userId);
 const preview = getPendingPreviews(userId, chatId)[0]!;
 expect(preview.kind).toBe("library");
 const id = await acceptPreview(chatId, preview.draftId, profile, userId);
 expect(id).toBeTruthy();
 expect((await buildCoverage(chatId, userId)).activeEntries[0]!.meta.tier).toBe(6);
 profile.showMemoryPreviews = false;
 const replacement = await createHigherFromEntries(6, chatId, ["source-5-0", "source-5-1"], profile, settings(), userId, { replacesEntryId: id! });
 expect(replacement).toBeTruthy();
 expect(entries.some((e) => e.id === id)).toBe(false);
 expect((await buildCoverage(chatId, userId)).activeEntries[0]!.meta.tier).toBe(6);
});

test("profile loading preserves independent settings and old profiles opt out", () => {
 profile.higherTiers[4].enabled = true; profile.higherTiers[4].batch = 9;
 expect(normalizeProfile(profile)!.higherTiers[4].batch).toBe(9);
 expect(normalizeProfile({ id: "old", name: "old" })!.higherTiers[3].enabled).toBe(false);
});
test("failed Series preview acceptance must retain its tier for retry", async () => {
 profile.showMemoryPreviews = true;
 entries = [source(3, 0), source(3, 1)];
 await createHigherFromEntries(4, chatId, entries.map((e) => e.id), profile, settings(), userId);
 const draft = getPendingPreviews(userId, chatId).find((p) => p.kind === "series")!;
 const create = (globalThis as any).spindle.world_books.entries.create;
 (globalThis as any).spindle.world_books.entries.create = async () => { throw new Error("temporary storage fault"); };
 expect(await acceptPreview(chatId, draft.draftId, profile, userId)).toBeNull();
 const { getLastFailure, dropPendingPreview } = await import("./pipeline");
 const failure = getLastFailure(userId, chatId);
 expect(failure?.kind).toBe("series");
 expect(failure?.sourceEntryIds).toEqual(["source-3-0", "source-3-1"]);
 (globalThis as any).spindle.world_books.entries.create = create;
 expect(await acceptPreview(chatId, draft.draftId, profile, userId)).toBeTruthy();
 expect(getLastFailure(userId, chatId)).toBeNull();
});

for (const tier of [2, ...HIGHER_TIERS] as const) test(`${TIER_NAMES[tier - 1]} repairs a short rooted segment between higher summaries and leaves the newer tail alone`, async () => {
 entries = [source(tier, 0), source(tier - 1, 1), source(tier, 2), source(tier - 1, 3)];
 Object.assign(entries[1].extensions.lumibooks, { isRoot: true, rootOrigin: "past-chat" });
 profile.arcTrigger = "manual";
 expect(await repairSummaryTimeline(chatId, profile, settings(), userId)).toBe(1);
 const coverage = await buildCoverage(chatId, userId);
 const bound = coverage.activeEntries.find((e) => e.raw.id.startsWith("new-"))!;
 expect(bound.meta.tier).toBe(tier);
 expect(bound.meta.sourceChapterEntryIds).toEqual([`source-${tier - 1}-1`]);
 expect(bound.meta.isRoot).toBe(true);
 expect(coverage.activeEntries.some((e) => e.raw.id === `source-${tier - 1}-3`)).toBe(true);
 expect(entries).toHaveLength(5);
 expect(await repairSummaryTimeline(chatId, profile, settings(), userId)).toBe(0);
 expect(calls).toBe(1);
});

test("repair previews retain the sources until accepted and resume without repeating the repaired segment", async () => {
 entries = [source(2, 0), source(1, 1), source(2, 2), source(1, 3)];
 Object.assign(entries[1].extensions.lumibooks, { isRoot: true, rootOrigin: "past-chat" });
 profile.showMemoryPreviews = true;
 expect(await repairSummaryTimeline(chatId, profile, settings(), userId)).toBe(0);
 expect(entries).toHaveLength(4);
 const preview = getPendingPreviews(userId, chatId)[0]!;
 expect(preview.sourceChapterEntryIds).toEqual(["source-1-1"]);
 expect(await repairSummaryTimeline(chatId, profile, settings(), userId)).toBe(0);
 expect(calls).toBe(1);
 expect(await acceptPreview(chatId, preview.draftId, profile, userId)).toBeTruthy();
 expect((await buildCoverage(chatId, userId)).activeEntries.some((e) => e.raw.id === "source-1-1")).toBe(false);
 expect(await repairSummaryTimeline(chatId, profile, settings(), userId)).toBe(0);
 expect(calls).toBe(1);
});

test("manual binding rejects sources separated by a higher summary before generating", async () => {
 entries = [source(1, 0), source(2, 1), source(1, 2)];
 await expect(createArcFromChapters(chatId, ["source-1-0", "source-1-2"], profile, settings(), userId)).rejects.toBeInstanceOf(SummaryTimelineError);
 expect(calls).toBe(0);
 expect(entries).toHaveLength(3);
});

test("a timeline boundary added during generation blocks the commit without superseding its sources", async () => {
 entries = [source(1, 0), source(1, 2)];
 (globalThis as any).spindle.generate.rawStream = async function* () {
  entries.push(source(2, 1));
  invalidateBookCache(userId, chatId);
  yield { type: "done", content: JSON.stringify({ title: "Stale", content: "A summary of both chapters.", keywords: [] }) };
 };
 expect(await createArcFromChapters(chatId, ["source-1-0", "source-1-2"], profile, settings(), userId)).toBeNull();
 expect(entries).toHaveLength(3);
 expect(entries.every((e) => !e.extensions.lumibooks.supersededByEntryId)).toBe(true);
 expect(getLastFailure(userId, chatId)?.message).toContain("consecutive summaries");
});


test("Universe generation must not instruct the model to produce a Volume from Arcs", async () => {
 let system = "";
 (globalThis as any).spindle.generate.rawStream = async function* (req: any) {
   system = req.messages[0].content;
   yield { type: "done", content: JSON.stringify({ title: "Universe", content: "Summary.", keywords: ["story"] }) };
 };
 entries = [source(6, 0), source(6, 1)];
 expect(await createHigherFromEntries(7, chatId, entries.map((e) => e.id), profile, settings(), userId)).toBeTruthy();
 expect(system).not.toContain("consolidated VOLUME entry");
});

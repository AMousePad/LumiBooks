import { afterAll, afterEach, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, HIGHER_TIERS, TIER_NAMES, makeDefaultProfile, normalizeEntryMeta, normalizeProfile } from "../shared";
import { buildCoverage } from "./coverage";
import { copyLmbEntries } from "./book-copy";
import { createArcAuto, createArcFromChapters, createHigherFromEntries, drainHigherBacklog, dropPendingPreview, maybeRunArcCheck, getPendingPreviews, getLastFailure, acceptPreview, registerPipelineCallbacks, repairSummaryTimeline } from "./pipeline";
import { SummaryTimelineError } from "./binding";
import { invalidateBookCache, listLmbEntries } from "./world-book";
import { saveSettings } from "./storage";
import { removeSummaryEntry } from "./shelf-actions";

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
  chat: { async getMessages() { return []; }, async setMessagesHidden() {}, async setMessageHidden() {} },
  chats: { async get() { return { id: chatId, metadata: { lumibooks_book_id: bookId, chat_world_book_ids: [bookId] } }; }, async update() {} },
  connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
  tokens: { async countText(text: string) { return { total_tokens: Math.ceil(text.length / 4) }; } },
  generate: { async *rawStream(req: any) {
    calls++; expect(req.messages[1].content).toContain("TO CONSOLIDATE");
    yield { type: "done", content: JSON.stringify({ title: "Bound", content: "A compressed story.", keywords: ["story"] }), usage: { completion_tokens: 24000 } };
  } },
  world_books: { async get() { return book; }, async list() { return { data: [book], total: 1 }; },
   entries: {
    async list(id: string) { const data = structuredClone(entries.filter((e) => e.world_book_id === id)); return { data, total: data.length }; },
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
afterEach(() => { for (const p of getPendingPreviews(userId, chatId)) dropPendingPreview(userId, chatId, p.draftId); });

for (const tier of [2, 6]) for (const release of [false, true]) for (const root of [false, true]) {
 test(`${release ? "releasing" : "deleting"} a compacted tier ${tier} ${root ? "root" : "summary"} preserves descendant coverage`, async () => {
  const children = [source(tier - 1, 0), source(tier - 1, 1)];
  const middle = source(tier, 0), parent = source(tier + 1, 0);
  middle.extensions.lumibooks.sourceChapterEntryIds = children.map((e) => e.id);
  middle.extensions.lumibooks.msgIds = ["m0", "m1", "direct-middle-source"];
  parent.extensions.lumibooks.sourceChapterEntryIds = [middle.id];
  entries = [...children, middle, parent];
  for (const entry of entries) entry.extensions.lumibooks.isRoot = root;
  for (const child of children) child.extensions.lumibooks.supersededByEntryId = middle.id;
  middle.extensions.lumibooks.supersededByEntryId = parent.id;
  const before = await buildCoverage(chatId, userId);
  await removeSummaryEntry(chatId, middle.id, userId, release);
  const after = await buildCoverage(chatId, userId);
  expect(after.activeEntries.map((e) => e.raw.id)).toEqual([parent.id]);
  expect([...after.coveredBy.keys()].sort()).toEqual([...before.coveredBy.keys()].sort());
  if (release) expect(entries.find((e) => e.id === middle.id)?.content).toBe(middle.content);
  else expect(entries.some((e) => e.id === middle.id)).toBe(false);
 });
}

for (const failure of ["preserve", "delete", "cleanup"] as const) test(`removing a compacted arc retains coverage when ${failure} fails`, async () => {
 const children = [source(1, 0), source(1, 1)], arc = source(2, 0), volume = source(3, 0);
 arc.extensions.lumibooks.sourceChapterEntryIds = children.map((e) => e.id);
 volume.extensions.lumibooks.sourceChapterEntryIds = [arc.id];
 entries = [...children, arc, volume];
 const api = (globalThis as any).spindle.world_books.entries;
 const update = api.update;
 let writes = 0;
 api.update = async (...args: any[]) => {
  if (++writes === (failure === "preserve" ? 1 : failure === "cleanup" ? 2 : -1)) throw new Error("write failed");
  return update(...args);
 };
 if (failure === "delete") api.delete = async () => { throw new Error("delete failed"); };
 if (failure === "cleanup") await removeSummaryEntry(chatId, arc.id, userId);
 else await expect(removeSummaryEntry(chatId, arc.id, userId)).rejects.toThrow();
 const coverage = await buildCoverage(chatId, userId);
 expect(coverage.activeEntries.map((e) => e.raw.id)).toEqual([volume.id]);
 expect([...coverage.coveredBy.keys()].sort()).toEqual(["m0", "m1"]);
 expect(entries.some((e) => e.id === arc.id)).toBe(failure !== "cleanup");
});

test("removing an active arc revives its children and deleting a chapter uncovers only its messages", async () => {
 const children = [source(1, 0), source(1, 1)], arc = source(2, 0);
 arc.extensions.lumibooks.sourceChapterEntryIds = children.map((e) => e.id);
 entries = [...children, arc];
 const unhidden: string[] = [];
 (globalThis as any).spindle.chat.setMessagesHidden = async (_chat: string, ids: string[]) => { unhidden.push(...ids); };
 await removeSummaryEntry(chatId, arc.id, userId);
 expect((await buildCoverage(chatId, userId)).activeEntries.map((e) => e.raw.id)).toEqual(children.map((e) => e.id));
 expect(unhidden).toEqual([]);
 await removeSummaryEntry(chatId, children[0].id, userId);
 expect(unhidden).toEqual(["m0"]);
 expect([... (await buildCoverage(chatId, userId)).coveredBy.keys()]).toEqual(["m1"]);
});

for (const tier of [2, 3, 7] as const) for (const change of ["deleted", "disabled"] as const) {
 test(`tier ${tier} regeneration refuses sources already ${change} before generation`, async () => {
  const children = [source(tier - 1, 0), source(tier - 1, 1)], parent = source(tier, 0);
  const ids = children.map((e) => e.id);
  parent.extensions.lumibooks.msgIds = ["m0", "m1"];
  parent.extensions.lumibooks.sourceChapterEntryIds = ids;
  entries = [...children, parent];
  if (change === "deleted") entries = entries.filter((e) => e.id !== ids[0]);
  else children[0].disabled = true;
  const before = structuredClone(entries);
  const action = tier === 2 ? createArcFromChapters(chatId, ids, profile, settings(), userId, { replacesEntryId: parent.id })
    : createHigherFromEntries(tier, chatId, ids, profile, settings(), userId, { replacesEntryId: parent.id });
  await expect(action).rejects.toThrow("Summary sources changed");
  expect(entries).toEqual(before);
  expect(calls).toBe(0);
 });
}

for (const parentFirst of [false, true]) test(`concurrent arc regeneration and volume binding serialize with ${parentFirst ? "volume" : "arc"} saving first`, async () => {
 const chapters = [source(1, 0), source(1, 1)];
 const arc = source(2, 0), otherArc = source(2, 2);
 arc.extensions.lumibooks.msgIds = ["m0", "m1"];
 arc.extensions.lumibooks.sourceChapterEntryIds = chapters.map((e) => e.id);
 entries = [...chapters, arc, otherArc];
 let enter!: () => void, release!: () => void, generated!: () => void;
 const entered = new Promise<void>((r) => { enter = r; });
 const gate = new Promise<void>((r) => { release = r; });
 const secondGenerated = new Promise<void>((r) => { generated = r; });
 const api = (globalThis as any).spindle;
 const create = api.world_books.entries.create, update = api.world_books.entries.update, generate = api.generate.rawStream;
 let firstWrite = true;
 api.world_books.entries.create = async (...args: any[]) => {
  if (firstWrite) { firstWrite = false; enter(); await gate; }
  return create(...args);
 };
 api.world_books.entries.update = async (...args: any[]) => {
  if (firstWrite && args[1].content !== undefined) { firstWrite = false; enter(); await gate; }
  return update(...args);
 };
 api.generate.rawStream = async function* (req: any) {
  for await (const event of generate(req)) { if (calls === 2) generated(); yield event; }
 };
 const childRun = () => createArcFromChapters(chatId, chapters.map((e) => e.id), profile, settings(), userId, { replacesEntryId: arc.id });
 const parentRun = () => createHigherFromEntries(3, chatId, [arc.id, otherArc.id], profile, settings(), userId);
 const first = parentFirst ? parentRun() : childRun();
 await entered;
 const second = parentFirst ? childRun() : parentRun();
 try {
  await secondGenerated;
  // Let the second operation reach its commit while the first write is paused.
  await new Promise((r) => setTimeout(r, 0));
 } finally { release(); }
 const results = await Promise.all([first, second]);
 expect(results.filter(Boolean)).toHaveLength(1);
 const coverage = await buildCoverage(chatId, userId);
 expect(coverage.coveredBy.size).toBe(3);
 expect(coverage.activeEntries).toHaveLength(parentFirst ? 1 : 2);
 const allIds = new Set(entries.map((e) => e.id));
 for (const entry of entries) for (const id of entry.extensions.lumibooks.sourceChapterEntryIds ?? []) expect(allIds.has(id)).toBe(true);
});

for (const tier of [2, 3, 7] as const) for (const fail of [false, true]) test(`${TIER_NAMES[tier - 1]} regeneration ${fail ? "preserves the original on write failure" : "updates its existing entry without deletion"}`, async () => {
 const children = [source(tier - 1, 0), source(tier - 1, 1)], parent = source(tier, 0);
 const ids = children.map((e) => e.id);
 parent.extensions.lumibooks.msgIds = ["m0", "m1"];
 parent.extensions.lumibooks.sourceChapterEntryIds = ids;
 parent.extensions.lumibooks.sceneNumber = 10;
 for (const child of children) child.extensions.lumibooks.supersededByEntryId = parent.id;
 entries = [...children, parent];
 const before = structuredClone(entries), api = (globalThis as any).spindle.world_books.entries;
 let deletions = 0;
 api.delete = async () => { deletions++; throw new Error("delete failed"); };
 if (fail) api.update = async () => { throw new Error("update failed"); };
 const id = tier === 2 ? await createArcFromChapters(chatId, ids, profile, settings(), userId, { replacesEntryId: parent.id })
   : await createHigherFromEntries(tier, chatId, ids, profile, settings(), userId, { replacesEntryId: parent.id });
 expect(id).toBe(fail ? null : parent.id);
 expect(deletions).toBe(0);
 expect(entries).toHaveLength(3);
 if (fail) expect(entries).toEqual(before);
 else {
  expect(entries.at(-1).content).toContain("A compressed story.");
  expect(entries.at(-1).extensions.lumibooks.sceneNumber).toBe(10);
  expect((await buildCoverage(chatId, userId)).activeEntries.map((e) => e.raw.id)).toEqual([parent.id]);
 }
});

for (const tier of [2, 3, 7] as const) for (const preview of [false, true]) for (const change of ["delete", "cover", "edit", "coverage"] as const) {
 test(`${TIER_NAMES[tier - 1]} ${preview ? "preview" : "in-flight result"} refuses changed source: ${change}`, async () => {
  entries = [source(tier - 1, 0), source(tier - 1, 1)];
  const ids = entries.map((e) => e.id);
  profile.showMemoryPreviews = preview;
  const mutate = () => {
   if (change === "delete") entries = entries.filter((e) => e.id !== ids[0]);
   if (change === "edit") entries = entries.map((e) => e.id === ids[0] ? { ...e, content: "Changed source summary" } : e);
   if (change === "coverage") entries = entries.map((e) => e.id === ids[0] ? { ...e, extensions: { lumibooks: { ...e.extensions.lumibooks, msgIds: ["different-message"] } } } : e);
   if (change === "cover") {
    const parent = source(tier, 0);
    parent.extensions.lumibooks.sourceChapterEntryIds = [ids[0]];
    entries.push(parent);
   }
  };
  if (!preview) {
   const generate = (globalThis as any).spindle.generate.rawStream;
   (globalThis as any).spindle.generate.rawStream = async function* (req: any) {
    for await (const event of generate(req)) { if (event.type === "done") mutate(); yield event; }
   };
  }
  const id = tier === 2 ? await createArcFromChapters(chatId, ids, profile, settings(), userId)
    : await createHigherFromEntries(tier, chatId, ids, profile, settings(), userId);
  if (preview) {
   const draft = getPendingPreviews(userId, chatId).at(-1)!;
   mutate();
   expect(await acceptPreview(chatId, draft.draftId, profile, userId)).toBeNull();
   expect(getPendingPreviews(userId, chatId).some((p) => p.draftId === draft.draftId)).toBe(true);
  } else expect(id).toBeNull();
  expect(entries.some((e) => e.id.startsWith("new-"))).toBe(false);
  expect(entries.filter((e) => ids.includes(e.id)).every((e) => !e.extensions.lumibooks.supersededByEntryId)).toBe(true);
 });
}

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
 expect(replacement).toBe(id);
 expect(entries.filter((e) => e.extensions.lumibooks.tier === 6)).toHaveLength(1);
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

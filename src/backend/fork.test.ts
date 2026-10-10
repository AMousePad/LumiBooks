import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, makeDefaultProfile, normalizeEntryMeta, unlockedLessons } from "../shared";
import { ensureForkAdoption, forkCodexPending, forkShelfPending } from "./fork";
import { buildCoverage } from "./coverage";
import { listLmbEntries, invalidateBookCache } from "./world-book";
import { emptyCursor, loadCursor } from "./codex/store";
import { saveSettings } from "./storage";
import { rebaseRoot, rebuildRoot, detachRoot } from "./rebase";
import { syncCodexProfiles } from "./codex/sync";
import { saveImportedSummaries } from "./summary-backup";
import { getLastFailure, registerPipelineCallbacks, resumeSummaryBinding } from "./pipeline";
import { buildState } from "./state";

const original = (globalThis as any).spindle;
const user = "fork-user";
let sequence = 0, serial = 0, parent: string, child: string;
let chats = new Map<string, any>(), books = new Map<string, any>(), disk = new Map<string, any>();
let entries: any[] = [], messages = new Map<string, any[]>();
const profile = { ...makeDefaultProfile("fork-profile", "Fork"), hideCoveredMessages: false, codexForceConstant: true, codexInjectionPosition: "depth" as const, codexInjectionDepth: 3 };

beforeEach(async () => {
  parent = `parent-${++sequence}`; child = `child-${sequence}`; serial = 0;
  chats = new Map(); books = new Map(); disk = new Map(); entries = []; messages = new Map();
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    userStorage: {
      async exists(p: string) { return disk.has(p); },
      async read(p: string) { if (!disk.has(p)) throw new Error("missing"); return JSON.stringify(disk.get(p)); },
      async getJson(p: string, opts: any) { return structuredClone(disk.get(p) ?? opts?.fallback); },
      async setJson(p: string, value: any) { disk.set(p, structuredClone(value)); },
      async delete(p: string) { disk.delete(p); },
      async list(prefix: string) { return [...disk.keys()].filter((p) => p.startsWith(prefix)); },
    },
    chats: {
      async get(id: string) { return structuredClone(chats.get(id) ?? null); },
      async update(id: string, patch: any) { Object.assign(chats.get(id), structuredClone(patch)); return chats.get(id); },
    },
    chat: {
      async getMessages(id: string) { return structuredClone(messages.get(id) ?? []); },
      async updateMessage(id: string, patch: any) { for (const list of messages.values()) { const m = list.find((m) => m.id === id); if (m) Object.assign(m, patch); } },
    },
    world_books: {
      async get(id: string) { return structuredClone(books.get(id) ?? null); },
      async list() { return { data: [...books.values()], total: books.size }; },
      async create(value: any) { const row = { ...structuredClone(value), id: `book-${sequence}-${++serial}` }; books.set(row.id, row); return row; },
      async delete(id: string) { books.delete(id); entries = entries.filter((e) => e.world_book_id !== id); },
      entries: {
        async list(bookId: string) { const data = entries.filter((e) => e.world_book_id === bookId); return { data: structuredClone(data), total: data.length }; },
        async create(bookId: string, value: any) { const row = { ...structuredClone(value), id: `entry-${sequence}-${++serial}`, world_book_id: bookId }; entries.push(row); return row; },
        async update(id: string, patch: any) { const row = entries.find((e) => e.id === id); Object.assign(row, structuredClone(patch)); return row; },
        async delete(id: string) { entries = entries.filter((e) => e.id !== id); },
      },
    },
  };
  await saveSettings(user, { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
  const shelf = `shelf-${sequence}`, codex = `codex-${sequence}`;
  books.set(shelf, { id: shelf, metadata: { lumibooks_chat_id: parent } });
  books.set(codex, { id: codex, metadata: { lumibooks_codex_chat_id: parent } });
  books.set("ordinary-lore", { id: "ordinary-lore", metadata: {} });
  chats.set(parent, { id: parent, name: "Parent", metadata: {
    lumibooks_book_id: shelf, lumibooks_codex_book_id: codex,
    chat_world_book_ids: [shelf, codex, "ordinary-lore"],
    lumibooks_fork_adopted: parent, lumibooks_codex_fork_adopted: parent,
  } });
  messages.set(parent, Array.from({ length: 4 }, (_, i) => ({ id: `${parent}-m${i}`, role: "assistant", content: `turn ${i}`, index_in_chat: i })));
  disk.set(`codex/${parent}/world.json`, { entries: [{ topic: "Weather", facts: ["Snow"] }] });
  disk.set(`codex/${parent}/cursor.json`, { ...emptyCursor(), runs: 3, lastMsgId: `${parent}-m3`, consumedSigs: messages.get(parent)!.map((m) => ({ id: m.id, sig: "sig" })), fileStates: { knowledge: "noInject" } });
  branch(parent, child, 4);
});
afterAll(() => { (globalThis as any).spindle = original; });

function branch(from: string, to: string, count: number) {
  chats.set(to, { id: to, name: "Fork", metadata: { ...structuredClone(chats.get(from).metadata), branched_from: from, branch_at_message: messages.get(from)![count - 1]?.id } });
  messages.set(to, messages.get(from)!.slice(0, count).map((m, i) => ({ ...m, id: `${to}-m${i}` })));
}
function summary(id: string, tier: number, indexes: number[], sources: string[] = [], extra: any = {}) {
  const meta = normalizeEntryMeta({ tier, chatId: parent, msgIds: indexes.map((i) => `${parent}-m${i}`), sourceChapterEntryIds: sources, firstMsgIdx: indexes[0], lastMsgIdx: indexes.at(-1), ...extra })!;
  entries.push({ id, world_book_id: chats.get(parent).metadata.lumibooks_book_id, content: id, comment: id, disabled: !!extra.ghost, constant: true, extensions: { lumibooks: meta } });
}

test("delayed fork adoption never maps new fork turns to abandoned parent turns at the same indexes", async () => {
  summary("early", 1, [0, 1]);
  summary("abandoned", 1, [2, 3]);
  branch(parent, child, 2);
  // Identical text is still a different branch; the host's fork point is decisive.
  messages.get(child)!.push(...messages.get(parent)!.slice(2).map((m) => ({ ...m, id: `${child}-new-${m.index_in_chat}` })));
  await ensureForkAdoption(child, user);
  expect((await listLmbEntries(child, user)).map((e) => e.raw.content)).toEqual(["early"]);
  expect((await buildCoverage(child, user)).coveredBy.has(`${child}-new-2`)).toBe(false);
  const cursor = await loadCursor(child, user);
  expect(cursor.lastMsgId).toBe(`${child}-m1`);
  expect(cursor.consumedSigs.map((s) => s.id)).toEqual([`${child}-m0`, `${child}-m1`]);
});

test("ancestor adoption respects every intervening fork point", async () => {
  summary("early", 1, [0]);
  summary("abandoned", 1, [1, 2, 3]);
  branch(parent, child, 1);
  messages.get(child)!.push(...messages.get(parent)!.slice(1).map((m) => ({ ...m, id: `${child}-new-${m.index_in_chat}` })));
  const grandchild = `late-grandchild-${sequence}`;
  branch(child, grandchild, 4);
  await ensureForkAdoption(grandchild, user);
  expect((await listLmbEntries(grandchild, user)).map((e) => e.raw.content)).toEqual(["early"]);
  expect((await loadCursor(grandchild, user)).lastMsgId).toBe(`${grandchild}-m0`);
});

for (const changedChat of ["parent", "fork"] as const) test(`fork adoption drops summaries whose ${changedChat} sources were edited`, async () => {
  summary("early", 1, [0, 1]);
  summary("changed", 1, [2, 3]);
  messages.get(changedChat === "parent" ? parent : child)![2].content = "An edited turn";
  await ensureForkAdoption(child, user);
  expect((await listLmbEntries(child, user)).map((e) => e.raw.content)).toEqual(["early"]);
  expect((await buildCoverage(child, user)).coveredBy.has(`${child}-m2`)).toBe(false);
  expect((await loadCursor(child, user)).lastMsgId).toBe(`${child}-m1`);
});

test("a deleted fork point leaves unverified summary coverage available for regeneration", async () => {
  summary("unverified", 1, [0, 1]);
  messages.set(parent, messages.get(parent)!.slice(0, 3));
  await ensureForkAdoption(child, user);
  expect(await listLmbEntries(child, user)).toEqual([]);
  expect((await buildCoverage(child, user)).coveredBy.size).toBe(0);
  expect((await loadCursor(child, user)).lastMsgId).toBeNull();
  expect(await forkShelfPending(child, user)).toBe(false);
});

test("imported coverage remaps on a full fork and drops summaries crossing a shorter fork", async () => {
  await saveImportedSummaries(parent, user, [
    { content: "Imported early story", comment: "Early", keys: [], tier: 1 },
    { content: "Imported later story", comment: "Later", keys: [], tier: 5 },
  ], { messages: messages.get(parent)!, indices: [[0, 1], [2, 3]] });
  await ensureForkAdoption(child, user);
  expect([...((await buildCoverage(child, user)).coveredBy.keys())].sort()).toEqual(messages.get(child)!.map((m) => m.id).sort());
  const shorter = `short-import-${sequence}`;
  branch(parent, shorter, 3);
  await ensureForkAdoption(shorter, user);
  const inherited = await listLmbEntries(shorter, user);
  expect(inherited.map((e) => e.raw.content)).toEqual(["Imported early story"]);
  expect(inherited[0]!.meta.msgIds).toEqual([`${shorter}-m0`, `${shorter}-m1`]);
});

test("old chapter and arc ranges use live host numbers in state and after repeated forks", async () => {
  Object.assign((globalThis as any).spindle, {
    connections: { async list() { return []; } },
    regex_scripts: { async list() { return { data: [] }; } },
  });
  disk.set("lessons.json", unlockedLessons());
  for (const m of messages.get(parent)!) m.index_in_chat += 5;
  summary("chapter", 1, [0, 1]);
  summary("arc", 2, [0, 1], ["chapter"]);
  branch(parent, child, 4);
  for (const target of [parent, child, `grandchild-${sequence}`]) {
    if (target.startsWith("grandchild")) branch(child, target, 4);
    if (target !== parent) await ensureForkAdoption(target, user);
    const state = await buildState(user, target);
    expect([state.chapters[0]!.meta.firstMsgIdx, state.chapters[0]!.meta.lastMsgIdx]).toEqual([5, 6]);
    expect([state.arcs[0]!.meta.firstMsgIdx, state.arcs[0]!.meta.lastMsgIdx]).toEqual([5, 6]);
    expect(state.messages.filter((m) => !m.covered).map((m) => m.indexInChat)).toEqual([7, 8]);
  }
  // Correcting the view does not rewrite the original book or its prose.
  expect(entries.find((e) => e.id === "chapter").extensions.lumibooks.firstMsgIdx).toBe(0);
});

test("imported coverage stores host numbers despite gaps in the destination chat", async () => {
  for (const m of messages.get(parent)!) m.index_in_chat += 5;
  await saveImportedSummaries(parent, user, [{ content: "Imported", comment: "Imported", keys: [], tier: 1 }],
    { messages: messages.get(parent)!, indices: [[0, 1]] });
  const [entry] = await listLmbEntries(parent, user);
  expect([entry!.meta.firstMsgIdx, entry!.meta.lastMsgIdx]).toEqual([5, 6]);
});

test("forks and forks of forks own independent shelves through Universe and Codex books", async () => {
  summary("chapter", 1, [0, 1, 2, 3]);
  for (let tier = 2; tier <= 7; tier++) summary(`tier-${tier}`, tier, [0, 1, 2, 3], [tier === 2 ? "chapter" : `tier-${tier - 1}`]);
  summary("root", 1, [], [], { isRoot: true });
  summary("ghost", 1, [3], [], { ghost: true });
  const originalEntries = structuredClone(entries), originalChat = structuredClone(chats.get(parent));
  for (const [from, to] of [[parent, child], [child, `grandchild-${sequence}`]]) {
    if (from === child) branch(from!, to!, 4);
    await ensureForkAdoption(to!, user);
    const owned = chats.get(to!).metadata;
    expect(owned.lumibooks_book_id).not.toBe(chats.get(from!).metadata.lumibooks_book_id);
    expect(owned.lumibooks_codex_book_id).not.toBe(chats.get(from!).metadata.lumibooks_codex_book_id);
    expect(owned.chat_world_book_ids).toEqual(["ordinary-lore", owned.lumibooks_book_id, owned.lumibooks_codex_book_id]);
    const copied = await listLmbEntries(to!, user), ids = new Set(copied.map((e) => e.raw.id));
    expect(copied).toHaveLength(8);
    expect(copied.some((e) => e.meta.ghost)).toBe(false);
    for (const entry of copied) {
      expect(entry.meta.chatId).toBe(to!);
      expect((entry.meta.sourceChapterEntryIds ?? []).every((id) => ids.has(id))).toBe(true);
    }
    const coverage = await buildCoverage(to!, user);
    expect(coverage.activeEntries.map((e) => e.meta.tier)).toEqual([7, 1]);
    expect([...coverage.coveredBy.keys()].sort()).toEqual(messages.get(to!)!.map((m) => m.id).sort());
    const cursor = await loadCursor(to!, user);
    expect(cursor.lastMsgId).toBe(`${to}-m3`);
    expect(cursor.pendingReconcile).toBe(true);
    expect(cursor.fileStates.knowledge).toBe("noInject");
    const records = entries.filter((e) => e.world_book_id === owned.lumibooks_codex_book_id);
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((e) => e.constant && e.position === 4 && e.depth === 3)).toBe(true);
    const count = entries.length;
    await ensureForkAdoption(to!, user);
    expect(entries).toHaveLength(count);
    expect(await forkShelfPending(to!, user)).toBe(false);
    expect(await forkCodexPending(to!, user)).toBe(false);
  }
  expect(entries.filter((e) => e.world_book_id === originalChat.metadata.lumibooks_book_id)).toEqual(originalEntries);
  expect(chats.get(parent)).toEqual(originalChat);
});

test("forking before the end of a summary drops abandoned-future prose and revives surviving children", async () => {
  summary("early", 1, [0]);
  summary("crossing", 1, [1, 2, 3]);
  summary("arc", 2, [0, 1, 2, 3], ["early", "crossing"]);
  for (let tier = 3; tier <= 7; tier++) summary(`tier-${tier}`, tier, [0, 1, 2, 3], [tier === 3 ? "arc" : `tier-${tier - 1}`]);
  branch(parent, child, 2);
  await ensureForkAdoption(child, user);
  const copied = await listLmbEntries(child, user);
  expect(copied.map((e) => e.raw.content)).toEqual(["early"]);
  const coverage = await buildCoverage(child, user);
  expect([...coverage.coveredBy.keys()]).toEqual([`${child}-m0`]);
  const cursor = await loadCursor(child, user);
  expect(cursor.consumedSigs.map((s) => s.id)).toEqual([`${child}-m0`, `${child}-m1`]);
  expect(cursor.lastMsgId).toBe(`${child}-m1`);
  expect(cursor.reconcileUntilMsgId).toBe(`${child}-m1`);
});

test("forking an empty shelf detaches the parent's book", async () => {
  await ensureForkAdoption(child, user);
  expect(chats.get(child).metadata.chat_world_book_ids).not.toContain(chats.get(parent).metadata.lumibooks_book_id);
  expect(chats.get(child).metadata.lumibooks_fork_adopted).toBe(child);
});

for (const operation of [rebaseRoot, rebuildRoot]) test(`${operation.name} rolls back an incomplete copy before retrying`, async () => {
  summary("chapter-one", 1, [0, 1]);
  summary("chapter-two", 1, [2, 3]);
  summary("arc", 2, [0, 1, 2, 3], ["chapter-one", "chapter-two"]);
  expect(await rebaseRoot(child, parent, user)).toEqual({ ok: true, count: 3 });
  const before = structuredClone(entries);
  const api = (globalThis as any).spindle.world_books.entries;
  const create = api.create;
  let calls = 0;
  api.create = async (...args: any[]) => {
    if (++calls === 2) throw new Error("copy write failed");
    return create(...args);
  };
  await expect(operation(child, parent, user)).rejects.toThrow("copy write failed");
  expect(entries).toEqual(before);
  api.create = create;
  expect(await operation(child, parent, user)).toEqual({ ok: true, count: 3 });
  expect((await listLmbEntries(child, user)).length).toBe(3);
  expect(entries.filter((e) => e.world_book_id === chats.get(parent).metadata.lumibooks_book_id))
    .toEqual(before.filter((e) => e.world_book_id === chats.get(parent).metadata.lumibooks_book_id));
});

test("an incomplete root copy disables its new entries when rollback deletion fails", async () => {
  summary("one", 1, [0, 1]); summary("two", 1, [2, 3]);
  const api = (globalThis as any).spindle.world_books.entries;
  const create = api.create;
  let calls = 0;
  api.create = async (...args: any[]) => {
    if (++calls === 2) throw new Error("copy failed");
    return create(...args);
  };
  api.delete = async () => { throw new Error("delete failed"); };
  await expect(rebaseRoot(child, parent, user)).rejects.toThrow("copy failed");
  const copied = entries.filter((e) => e.extensions.lumibooks.chatId === child);
  expect(copied).toHaveLength(1);
  expect(copied[0].disabled).toBe(true);
  expect(entries.filter((e) => e.extensions.lumibooks.chatId === parent).every((e) => !e.disabled)).toBe(true);
});

for (const operation of [rebaseRoot, rebuildRoot, detachRoot]) {
  test(`${operation.name} disables retired roots if deletion fails`, async () => {
    summary("old-root", 1, [0, 1]);
    await rebaseRoot(child, parent, user);
    const oldIds = new Set((await listLmbEntries(child, user)).map((e) => e.raw.id));
    (globalThis as any).spindle.world_books.entries.delete = async () => { throw new Error("delete unavailable"); };
    if (operation === detachRoot) await detachRoot(child, user);
    else await operation(child, parent, user);
    expect(entries.filter((e) => oldIds.has(e.id)).every((e) => e.disabled)).toBe(true);
    const active = (await buildCoverage(child, user)).activeEntries;
    expect(active).toHaveLength(operation === detachRoot ? 0 : 1);
    expect(active.every((e) => !oldIds.has(e.raw.id))).toBe(true);
  });
}

for (const operation of [rebaseRoot, rebuildRoot]) test(`detaching roots waits for an in-progress ${operation.name}`, async () => {
  summary("root", 1, [0, 1]);
  await rebaseRoot(child, parent, user);
  const api = (globalThis as any).spindle.world_books.entries;
  const create = api.create;
  let release!: () => void, entered!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  const copying = new Promise<void>((resolve) => { entered = resolve; });
  api.create = async (...args: any[]) => { entered(); await paused; return create(...args); };
  const replacement = operation(child, parent, user);
  await copying;
  const detaching = detachRoot(child, user);
  await new Promise((resolve) => setTimeout(resolve, 0));
  release();
  await Promise.all([replacement, detaching]);
  expect((await listLmbEntries(child, user)).filter((e) => e.meta.isRoot)).toEqual([]);
  expect((await listLmbEntries(parent, user)).map((e) => e.raw.id)).toEqual(["root"]);
});

test("root cleanup reports failure when neither deletion nor disabling succeeds", async () => {
  summary("old-root", 1, [0, 1]);
  await rebaseRoot(child, parent, user);
  const api = (globalThis as any).spindle.world_books.entries;
  api.delete = async () => { throw new Error("delete unavailable"); };
  api.update = async () => { throw new Error("update unavailable"); };
  await expect(detachRoot(child, user)).rejects.toThrow();
});

test("higher-tier root adoption, rebuilding and detaching preserve the source", async () => {
  summary("chapter", 1, [0, 1, 2, 3]);
  for (let tier = 2; tier <= 7; tier++) summary(`tier-${tier}`, tier, [0, 1, 2, 3], [tier === 2 ? "chapter" : `tier-${tier - 1}`]);
  const sourceEntries = structuredClone(entries);
  chats.set(child, { id: child, name: "New story", metadata: {} });
  messages.set(child, []);
  expect(await rebaseRoot(child, parent, user)).toEqual({ ok: true, count: 7 });
  let copied = await listLmbEntries(child, user);
  expect(copied.every((e) => e.meta.isRoot && e.meta.rootOrigin === parent)).toBe(true);
  expect((await buildCoverage(child, user)).activeEntries.map((e) => e.meta.tier)).toEqual([7]);
  expect(await rebuildRoot(child, parent, user)).toEqual({ ok: true, count: 7 });
  copied = await listLmbEntries(child, user);
  expect(copied).toHaveLength(7);
  expect(await detachRoot(child, user)).toBe(7);
  expect(await listLmbEntries(child, user)).toEqual([]);
  expect(entries).toEqual(sourceEntries);
});

for (const failFirst of [false, true]) test(`opening an existing rooted timeline repairs its older gap${failFirst ? " after a failed generation" : ""}`, async () => {
  const repairUser = `repair-user-${sequence}`;
  const configured = { ...profile, autoCreate: false, arcAfterChapters: 6, arcLagChapters: 7, retryCount: 0 };
  let calls = 0;
  Object.assign((globalThis as any).spindle, {
    rpcPool: { sync() {} },
    connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
    tokens: { async countText(text: string) { return { total_tokens: Math.ceil(text.length / 4) }; } },
    regex_scripts: { async list() { return { data: [] }; } },
    generate: { async *rawStream(req: any) {
      calls++;
      expect(req.messages[1].content).toContain("leftover-one");
      expect(req.messages[1].content).toContain("leftover-two");
      expect(req.messages[1].content).not.toContain("Continuation summary");
      expect(req.messages[1].content).not.toContain("recent-arc");
      if (failFirst && calls === 1) throw new Error("temporary generation fault");
      yield { type: "done", content: JSON.stringify({ title: "Repaired", content: "An older contiguous story segment.", keywords: [] }) };
    } },
  });
  registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
  await saveSettings(repairUser, { ...DEFAULT_SETTINGS, profiles: [configured], activeProfileId: configured.id });
  disk.set("lessons.json", unlockedLessons());
  summary("older-arc", 2, [0]); summary("leftover-one", 1, [1]);
  summary("leftover-two", 1, [2]); summary("recent-arc", 2, [3]);
  const sourceEntries = structuredClone(entries);
  chats.set(child, { id: child, name: "Continuation", metadata: {} });
  messages.set(child, []);
  expect(await rebaseRoot(child, parent, repairUser)).toEqual({ ok: true, count: 4 });
  messages.set(child, [{ id: "continuation-message", role: "assistant", content: "A new scene.", index_in_chat: 0 }]);
  const own = await (globalThis as any).spindle.world_books.entries.create(chats.get(child).metadata.lumibooks_book_id, {
    content: "Continuation summary", disabled: false, constant: true,
    extensions: { lumibooks: normalizeEntryMeta({ tier: 1, chatId: child, msgIds: ["continuation-message"], firstMsgIdx: 0, lastMsgIdx: 0 }) },
  });
  invalidateBookCache(repairUser, child);
  expect((await buildState(repairUser, child)).backlogArcs).toBe(1);
  const before = structuredClone(await listLmbEntries(child, repairUser));
  await Promise.all([resumeSummaryBinding(child, repairUser), resumeSummaryBinding(child, repairUser)]);
  if (failFirst) {
    expect(getLastFailure(repairUser, child)?.kind).toBe("arc");
    expect(await listLmbEntries(child, repairUser)).toEqual(before);
    await resumeSummaryBinding(child, repairUser);
  }
  const repaired = await buildState(repairUser, child);
  expect(repaired.backlogArcs).toBe(0);
  expect(repaired.arcs.filter((e) => e.active)).toHaveLength(3);
  expect(repaired.chapters.filter((e) => e.active).map((e) => e.entryId)).toEqual([own.id]);
  expect(repaired.chapters).toHaveLength(3);
  expect(repaired.chapters.filter((e) => e.isRoot).every((e) => !!e.meta.supersededByEntryId)).toBe(true);
  expect(entries.filter((e) => e.world_book_id === chats.get(parent).metadata.lumibooks_book_id)).toEqual(sourceEntries);
  expect(getLastFailure(repairUser, child)).toBeNull();
  await resumeSummaryBinding(child, repairUser);
  expect(calls).toBe(failFirst ? 2 : 1);
});

test("profile changes resync parent and fork books without merging their ownership", async () => {
  await ensureForkAdoption(child, user);
  const childBook = chats.get(child).metadata.lumibooks_codex_book_id;
  const next = { ...profile, codexForceConstant: false, codexInjectionPosition: "after_history" as const };
  await saveSettings(user, { ...DEFAULT_SETTINGS, profiles: [next], activeProfileId: next.id });
  expect(await syncCodexProfiles(user)).toEqual([]);
  for (const id of [parent, child]) {
    const book = chats.get(id).metadata.lumibooks_codex_book_id;
    const records = entries.filter((e) => e.world_book_id === book);
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((e) => !e.constant && e.position === 4 && e.depth === 0 && e.extensions.lumibooks_codex.chatId === id)).toBe(true);
  }
  expect(chats.get(child).metadata.lumibooks_codex_book_id).toBe(childBook);
});

test("a failed shelf copy rolls back and a later fork adoption retries it", async () => {
  summary("early", 1, [0]);
  const create = (globalThis as any).spindle.world_books.entries.create;
  let fail = true;
  (globalThis as any).spindle.world_books.entries.create = async (bookId: string, value: any) => {
    if (fail && value.extensions?.lumibooks) throw new Error("temporary write fault");
    return create(bookId, value);
  };
  await ensureForkAdoption(child, user);
  expect(await forkShelfPending(child, user)).toBe(true);
  expect([...books.values()].some((b) => b.metadata.lumibooks_chat_id === child)).toBe(false);
  fail = false;
  const now = Date.now;
  const later = now() + 31_000;
  Date.now = () => later;
  try { await ensureForkAdoption(child, user); } finally { Date.now = now; }
  expect(await forkShelfPending(child, user)).toBe(false);
  expect((await listLmbEntries(child, user)).map((e) => e.raw.content)).toEqual(["early"]);
});

test("a failed Codex mirror retries after inheritance without overwriting copied files", async () => {
  const create = (globalThis as any).spindle.world_books.entries.create;
  let fail = true;
  (globalThis as any).spindle.world_books.entries.create = async (bookId: string, value: any) => {
    if (fail && value.extensions?.lumibooks_codex) throw new Error("temporary mirror fault");
    return create(bookId, value);
  };
  await ensureForkAdoption(child, user);
  expect(await forkCodexPending(child, user)).toBe(true);
  const copied = structuredClone(disk.get(`codex/${child}/world.json`));
  fail = false;
  const now = Date.now;
  const later = now() + 31_000;
  Date.now = () => later;
  try { await ensureForkAdoption(child, user); } finally { Date.now = now; }
  expect(await forkCodexPending(child, user)).toBe(false);
  expect(disk.get(`codex/${child}/world.json`)).toEqual(copied);
  expect(entries.filter((e) => e.extensions?.lumibooks_codex?.chatId === child)).toHaveLength(1);
});

test("an interrupted Codex inheritance retries with preconfigured file switches", async () => {
  disk.set(`codex/${parent}/characters.json`, { entities: [{ id: "char:alice", name: "Alice" }] });
  disk.set(`codex/${child}/cursor.json`, { ...emptyCursor(), fileStates: { timeline: "frozen" } });
  const write = (globalThis as any).spindle.userStorage.setJson;
  let fail = true;
  (globalThis as any).spindle.userStorage.setJson = async (path: string, value: any) => {
    if (fail && path === `codex/${child}/world.json`) throw new Error("temporary disk fault");
    return write(path, value);
  };
  await ensureForkAdoption(child, user);
  expect(await forkCodexPending(child, user)).toBe(true);
  fail = false;
  const now = Date.now;
  const later = now() + 31_000;
  Date.now = () => later;
  try { await ensureForkAdoption(child, user); } finally { Date.now = now; }
  expect(disk.get(`codex/${child}/world.json`)).toEqual(disk.get(`codex/${parent}/world.json`));
  const cursor = await loadCursor(child, user);
  expect(cursor.fileStates.timeline).toBe("frozen");
  expect(cursor.fileStates.knowledge).toBe("noInject");
  expect(cursor.lastMsgId).toBe(`${child}-m3`);
});

import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, makeDefaultProfile, normalizeEntryMeta } from "../shared";
import { ensureForkAdoption, forkCodexPending, forkShelfPending } from "./fork";
import { buildCoverage } from "./coverage";
import { listLmbEntries, invalidateBookCache } from "./world-book";
import { emptyCursor, loadCursor } from "./codex/store";
import { saveSettings } from "./storage";

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
  chats.set(to, { id: to, name: "Fork", metadata: { ...structuredClone(chats.get(from).metadata), branched_from: from } });
  messages.set(to, messages.get(from)!.slice(0, count).map((m, i) => ({ ...m, id: `${to}-m${i}` })));
}
function summary(id: string, tier: number, indexes: number[], sources: string[] = [], extra: any = {}) {
  const meta = normalizeEntryMeta({ tier, chatId: parent, msgIds: indexes.map((i) => `${parent}-m${i}`), sourceChapterEntryIds: sources, firstMsgIdx: indexes[0], lastMsgIdx: indexes.at(-1), ...extra })!;
  entries.push({ id, world_book_id: chats.get(parent).metadata.lumibooks_book_id, content: id, comment: id, disabled: !!extra.ghost, constant: true, extensions: { lumibooks: meta } });
}

test("forks and forks of forks own independent shelves through Library and Codex books", async () => {
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

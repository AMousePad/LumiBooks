import { afterAll, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, makeDefaultProfile, normalizeEntryMeta, type LMBSettings } from "../shared";
import { saveSettings } from "./storage";
import { ensureChatEntrySettings, forgetChatEntrySettings } from "./entry-settings";
import { codexSettingsStamp } from "./codex/sync";
import { invalidateBookCache } from "./world-book";

const previous = (globalThis as any).spindle;
afterAll(() => { (globalThis as any).spindle = previous; });

const CHATS = 50;
let run = 0;
let user = "";
let storage: Map<string, unknown>;
let books: Map<string, { id: string; metadata: Record<string, unknown> }>;
let entries: Array<{ id: string; world_book_id: string; constant: boolean; vectorized: boolean; extensions: Record<string, unknown> }>;
let calls: string[];
let batchedIds: string[];
let failEntries: Set<string>;
let inBatch = 0;
let maxInBatch = 0;

const chatId = (i: number) => `chat-${i}`;
const bookId = (i: number) => `book-${i}`;
const settingsWith = (patch: Partial<LMBSettings>): LMBSettings => {
  const profile = makeDefaultProfile("default", "Default");
  return { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id, ...patch };
};

beforeEach(async () => {
  user = `entry-settings-${++run}`;
  storage = new Map();
  books = new Map();
  entries = [];
  calls = [];
  batchedIds = [];
  failEntries = new Set();
  for (let i = 0; i < CHATS; i++) {
    books.set(bookId(i), { id: bookId(i), metadata: { lumibooks_chat_id: chatId(i) } });
    for (let j = 0; j < 3; j++) {
      entries.push({ id: `entry-${i}-${j}`, world_book_id: bookId(i), constant: true, vectorized: false,
        extensions: { lumibooks: normalizeEntryMeta({ tier: 1, chatId: chatId(i), msgIds: [`m${j}`] })! } });
    }
    invalidateBookCache(user, chatId(i));
  }
  const applyUpdate = (id: string, input: any) => {
    if (failEntries.has(id)) throw new Error("unavailable");
    Object.assign(entries.find((e) => e.id === id)!, input);
  };
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    async batch(ops: Array<{ args: { id: string; input: any } }>) {
      calls.push("batch");
      inBatch++;
      maxInBatch = Math.max(maxInBatch, inBatch);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inBatch--;
      if (ops.some((op) => failEntries.has(op.args.id))) return ops.map(() => ({ ok: false, error: "BATCH_ROLLED_BACK: unavailable" }));
      for (const op of ops) { batchedIds.push(op.args.id); applyUpdate(op.args.id, op.args.input); }
      return ops.map(() => ({ ok: true, result: null }));
    },
    userStorage: {
      async exists(path: string) { calls.push(`exists:${path}`); return storage.has(path); },
      async getJson(path: string, opts?: any) { calls.push(`getJson:${path}`); return structuredClone(storage.get(path) ?? opts?.fallback ?? null); },
      async setJson(path: string, value: unknown) { calls.push(`setJson:${path}`); storage.set(path, structuredClone(value)); },
      async read(path: string) { calls.push(`read:${path}`); return JSON.stringify(storage.get(path)); },
      async list() { calls.push("list"); return [...storage.keys()]; },
      async delete(path: string) { storage.delete(path); },
    },
    chats: { async get(id: string) { calls.push(`chat:${id}`); return { id, metadata: { lumibooks_book_id: id.replace("chat", "book") } }; } },
    world_books: {
      async get(id: string) { calls.push(`book:${id}`); return structuredClone(books.get(id) ?? null); },
      async list() { calls.push("books"); return { data: [...books.values()].map((b) => structuredClone(b)), total: books.size }; },
      async update(id: string, patch: any) { calls.push(`updateBook:${id}`); Object.assign(books.get(id)!, structuredClone(patch)); return structuredClone(books.get(id)); },
      entries: {
        async list(id: string) { calls.push(`entries:${id}`); const data = entries.filter((e) => e.world_book_id === id); return { data: structuredClone(data), total: data.length }; },
        async update(id: string, input: any) { calls.push(`update:${id}`); applyUpdate(id, input); return null; },
      },
    },
  };
  await saveSettings(user, settingsWith({ summaryActivationMode: "always" }));
});

const touched = () => new Set(calls.filter((c) => c.startsWith("entries:")).map((c) => c.slice("entries:".length)));

test("a mode change rewrites only the chat in use, and each other chat only when it is used", async () => {
  await saveSettings(user, settingsWith({ summaryActivationMode: "vector" }));
  expect(await ensureChatEntrySettings(user, chatId(0))).toEqual({ summaryFailed: 0, codexError: null });
  expect([...touched()]).toEqual([bookId(0)]);
  expect(batchedIds.sort()).toEqual(["entry-0-0", "entry-0-1", "entry-0-2"]);
  expect(entries.filter((e) => e.world_book_id === bookId(0)).every((e) => e.vectorized && !e.constant)).toBe(true);
  expect(entries.filter((e) => e.world_book_id !== bookId(0)).every((e) => e.constant && !e.vectorized)).toBe(true);
  calls = [];
  batchedIds = [];
  await ensureChatEntrySettings(user, chatId(7));
  expect([...touched()]).toEqual([bookId(7)]);
  expect(batchedIds.sort()).toEqual(["entry-7-0", "entry-7-1", "entry-7-2"]);
});

test("a chat already up to date costs no host calls", async () => {
  await ensureChatEntrySettings(user, chatId(1));
  calls = [];
  await ensureChatEntrySettings(user, chatId(1));
  expect(calls).toEqual([]);
});

test("a chat stamped in an earlier process skips its entries without rereading them", async () => {
  await saveSettings(user, settingsWith({ summaryActivationMode: "vector" }));
  await ensureChatEntrySettings(user, chatId(2));
  forgetChatEntrySettings(user, chatId(2));
  calls = [];
  batchedIds = [];
  await ensureChatEntrySettings(user, chatId(2));
  expect(touched().size).toBe(0);
  expect(batchedIds).toEqual([]);
});

test("switching back to an older mode leaves chats that still match it untouched", async () => {
  await ensureChatEntrySettings(user, chatId(3));
  await saveSettings(user, settingsWith({ summaryActivationMode: "vector" }));
  await ensureChatEntrySettings(user, chatId(4));
  await saveSettings(user, settingsWith({ summaryActivationMode: "always" }));
  calls = [];
  batchedIds = [];
  await ensureChatEntrySettings(user, chatId(3));
  expect(batchedIds).toEqual([]);
  await ensureChatEntrySettings(user, chatId(4));
  expect(batchedIds.sort()).toEqual(["entry-4-0", "entry-4-1", "entry-4-2"]);
});

test("a failed update is reported, not remembered, and retried on the next use", async () => {
  await saveSettings(user, settingsWith({ summaryActivationMode: "vector" }));
  failEntries.add("entry-5-1");
  expect(await ensureChatEntrySettings(user, chatId(5))).toEqual({ summaryFailed: 1, codexError: null });
  expect(books.get(bookId(5))!.metadata.lumibooks_summary_activation).toBeUndefined();
  failEntries.clear();
  expect(await ensureChatEntrySettings(user, chatId(5))).toEqual({ summaryFailed: 0, codexError: null });
  expect(books.get(bookId(5))!.metadata.lumibooks_summary_activation).toBe("vector");
  expect(entries.filter((e) => e.world_book_id === bookId(5)).every((e) => e.vectorized)).toBe(true);
});

test("concurrent calls for one chat run one at a time and update its entries once", async () => {
  await saveSettings(user, settingsWith({ summaryActivationMode: "vector" }));
  maxInBatch = 0;
  const results = await Promise.all([ensureChatEntrySettings(user, chatId(6)), ensureChatEntrySettings(user, chatId(6)), ensureChatEntrySettings(user, chatId(6))]);
  expect(results).toEqual(Array(3).fill({ summaryFailed: 0, codexError: null }));
  expect(maxInBatch).toBe(1);
  expect(batchedIds.sort()).toEqual(["entry-6-0", "entry-6-1", "entry-6-2"]);
});

test("a settings change during a run is applied by the next queued run", async () => {
  await saveSettings(user, settingsWith({ summaryActivationMode: "vector" }));
  const first = ensureChatEntrySettings(user, chatId(8));
  await saveSettings(user, settingsWith({ summaryActivationMode: "always" }));
  const second = ensureChatEntrySettings(user, chatId(8));
  await Promise.all([first, second]);
  expect(entries.filter((e) => e.world_book_id === bookId(8)).every((e) => e.constant && !e.vectorized)).toBe(true);
  expect(books.get(bookId(8))!.metadata.lumibooks_summary_activation).toBe("always");
});

test("the Codex stamp changes with every setting the sync reads and nothing else", () => {
  const base = settingsWith({});
  const stamp = codexSettingsStamp(base);
  const withProfile = (patch: Record<string, unknown>) => codexSettingsStamp({ ...base, profiles: [{ ...base.profiles[0]!, ...patch }] });
  expect(codexSettingsStamp({ ...base, cacheFriendly: !base.cacheFriendly })).not.toBe(stamp);
  expect(withProfile({ codexActivationMode: base.profiles[0]!.codexActivationMode === "always" ? "keywords" : "always" })).not.toBe(stamp);
  expect(withProfile({ codexInjectionPosition: base.profiles[0]!.codexInjectionPosition === "depth" ? "lorebook" : "depth" })).not.toBe(stamp);
  expect(withProfile({ codexInjectionDepth: base.profiles[0]!.codexInjectionDepth + 1 })).not.toBe(stamp);
  expect(withProfile({ codexTokenLimits: { ...base.profiles[0]!.codexTokenLimits, things: 1234 } })).not.toBe(stamp);
  expect(withProfile({ name: "Renamed", chapterLag: base.profiles[0]!.chapterLag + 1 })).toBe(stamp);
  expect(codexSettingsStamp({ ...base, summaryActivationMode: "vector" })).toBe(stamp);
});

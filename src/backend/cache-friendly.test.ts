import { afterAll, beforeEach, expect, test } from "bun:test";
import { CODEX_FILE_KEYS, DEFAULT_SETTINGS, enterCacheFriendly, leaveCacheFriendly, makeDefaultProfile, normalizeSettings, type LMBProfile } from "../shared";
import { advanceRecordStats, codexFullness, selectCodexCuts, type CutCandidate } from "./codex/limits";
import { alignCacheFileStates } from "./codex/cache-states";
import { codexActivationCuts, syncCodexEntries } from "./codex/sync";
import { buildCodexUserMessage, makeCodexPromptCtx } from "./codex/prompt";
import { emptyBundle } from "./codex/schema";
import { emptyCursor, loadCursor } from "./codex/store";
import { registerCodexCallbacks } from "./codex/index";
import { filedMessageChanged, lumiCacheAvailable, runCacheFriendlyWindow } from "./cache-friendly";
import { registerPipelineCallbacks } from "./pipeline";
import { saveSettings } from "./storage";
import { invalidateBookCache } from "./world-book";

const original = (globalThis as any).spindle;
const chat = "cache-chat", user = "cache-user", bookId = "shelf", codexBookId = "codex-book";
const data = new Map<string, any>();
let entries: any[], messages: any[], serial: number, epochs: string[], order: string[];
let codexReply: () => any;

function limits(value: number) {
  return Object.fromEntries(CODEX_FILE_KEYS.map((key) => [key, value])) as LMBProfile["codexTokenLimits"];
}
function candidate(id: string, tokens: number, updates = 0, born = 0, index = 0): CutCandidate {
  return { id, file: "world", tokens, updates, born, index };
}
function mode(extra: Partial<LMBProfile> = {}): LMBProfile {
  return { ...enterCacheFriendly({ ...makeDefaultProfile("p", "Test"), windowValue: 20, lagValue: 25 }), retryCount: 0, codexThorough: false, codexUseTools: false, ...extra };
}
async function useProfile(profile: LMBProfile, cacheFriendly = true): Promise<void> {
  await saveSettings(user, normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly, profiles: [profile], activeProfileId: profile.id }));
}
const codexEntries = () => entries.filter((e) => e.extensions?.lumibooks_codex);
const chapters = () => entries.filter((e) => e.extensions?.lumibooks);

beforeEach(() => {
  data.clear(); entries = []; serial = 0; epochs = []; order = [];
  messages = Array.from({ length: 45 }, (_, i) => ({ id: `m${i + 1}`, role: i % 2 ? "assistant" : "user", content: `Turn ${i + 1}`, index_in_chat: i, extra: {}, metadata: {} }));
  codexReply = () => ({ writes: [{ file: "world", content: { entries: [{ topic: "Rain", facts: ["It rains."] }] } }], skip: ["characters", "locations", "things", "knowledge"], done: true });
  const shelf = { id: bookId, name: "Shelf", metadata: { lumibooks_chat_id: chat } };
  const codexBook = { id: codexBookId, name: "Codex", metadata: { lumibooks_codex_chat_id: chat } };
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    rpcPool: { sync(name: string) { if (name.startsWith("cache_epoch.")) { epochs.push(name); order.push("epoch"); } } },
    userStorage: {
      async exists(p: string) { return data.has(p); },
      async read(p: string) { if (!data.has(p)) throw new Error("missing"); return JSON.stringify(data.get(p)); },
      async getJson(p: string, opts: any) { return structuredClone(data.get(p) ?? opts?.fallback); },
      async setJson(p: string, value: any) { data.set(p, structuredClone(value)); },
      async list() { return [...data.keys()]; },
      async delete(p: string) { data.delete(p); },
    },
    tokens: { async countText(text: string) { return { total_tokens: text.length, approximate: false }; } },
    connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
    chat: { async getMessages() { return messages; }, async updateMessage() {} },
    chats: { async get() { return { id: chat, metadata: { lumibooks_book_id: bookId, lumibooks_codex_book_id: codexBookId, chat_world_book_ids: [bookId, codexBookId] } }; }, async update() {} },
    world_books: {
      async getActivated() { return []; },
      async get(id: string) { return id === bookId ? shelf : codexBook; },
      async list() { return { data: [shelf, codexBook], total: 2 }; },
      entries: {
        async list(id: string) { const rows = entries.filter((e) => e.world_book_id === id); return { data: rows, total: rows.length }; },
        async create(id: string, value: any) {
          if (value.extensions?.lumibooks_codex) order.push("codex-entry");
          const row = { ...value, id: `e${++serial}`, world_book_id: id }; entries.push(row); return row;
        },
        async update(id: string, patch: any) {
          const row = entries.find((e) => e.id === id);
          if (row.disabled && patch.disabled === false && row.extensions?.lumibooks) order.push("promote");
          Object.assign(row, patch); return row;
        },
        async delete(id: string) { entries = entries.filter((e) => e.id !== id); return true; },
      },
    },
    generate: {
      async *rawStream() { order.push("chapter-llm"); yield { type: "done", content: JSON.stringify({ title: "S", content: "Summary.", keywords: [] }) }; },
      async *quietStream() {
        order.push("codex-llm");
        expect(chapters().every((g) => g.disabled && g.extensions.lumibooks.ghost)).toBe(true);
        expect(codexEntries()).toHaveLength(0);
        yield { type: "done", content: JSON.stringify(codexReply()) };
      },
    },
  };
  registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
  registerCodexCallbacks({ onToast() {}, onStateChange() {} });
  invalidateBookCache(user, chat);
});
afterAll(() => { (globalThis as any).spindle = original; });

test("cuts the least updated then oldest, and spares the six largest", () => {
  const items = [
    ...[1, 2, 3, 4, 5, 6].map((n) => candidate(`big${n}`, 100, 0, 0, n)),
    candidate("tracked", 10, 3, 0, 7), candidate("old", 10, 0, 0, 8), candidate("newer", 10, 0, 5, 9),
  ];
  expect([...selectCodexCuts(items, limits(615))]).toEqual(["old", "newer"]);
  expect(selectCodexCuts(items, limits(0)).size).toBe(0);
  expect([...selectCodexCuts(items, limits(1))].sort()).toEqual(["newer", "old", "tracked"]);
  expect(selectCodexCuts(items, limits(1000)).size).toBe(0);
});

test("equal history discards the earliest record first", () => {
  const items = [...[1, 2, 3, 4, 5, 6].map((n) => candidate(`big${n}`, 100, 0, 0, n + 10)), candidate("a", 5, 0, 0, 0), candidate("b", 5, 0, 0, 1)];
  expect([...selectCodexCuts(items, limits(605))]).toEqual(["a"]);
});

test("only categories past 75 percent report as full", () => {
  expect(codexFullness({ world: 7500, knowledge: 7501, things: 12000 }, limits(10000))).toEqual([{ file: "things", percent: 120 }, { file: "knowledge", percent: 75 }]);
  expect(codexFullness({ world: 999999 }, limits(0))).toEqual([]);
});

test("update history counts text changes and drops removed records", () => {
  const before = new Map([["a", "one"], ["b", "two"], ["gone", "x"]]);
  const after = new Map([["a", "changed"], ["b", "two"], ["new", "fresh"]]);
  expect(advanceRecordStats({ a: { updates: 2, born: 1 }, gone: { updates: 9, born: 1 } }, before, after, 7)).toEqual({
    a: { updates: 3, born: 1 }, b: { updates: 0, born: 0 }, new: { updates: 0, born: 7 },
  });
});

test("the mode forces its values on every normalize and restores them on exit", () => {
  const custom = { ...makeDefaultProfile("p", "Test"), windowValue: 33, lagValue: 80, codexLagValue: 6, codexWindowValue: 40, codexRelationsTable: true, codexActivationMode: "keywords" as const, codexExtraContext: false };
  const on = enterCacheFriendly(custom);
  expect(on).toMatchObject({ windowValue: 33, lagValue: 80, codexWindowValue: 33, codexLagValue: 80, codexRelationsTable: false, codexActivationMode: "always", codexInjectionPosition: "lorebook", codexExtraContext: true, autoCreate: true, showMemoryPreviews: false });
  const edited = normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly: true, summaryActivationMode: "keywords", profiles: [{ ...on, windowValue: 30, codexWindowValue: 99, codexRelationsTable: true }], activeProfileId: "p" });
  expect(edited.summaryActivationMode).toBe("always");
  expect(edited.profiles[0]).toMatchObject({ windowValue: 30, codexWindowValue: 30, codexRelationsTable: false });
  const off = leaveCacheFriendly(edited.profiles[0]!);
  expect(off).toMatchObject({ windowValue: 30, lagValue: 80, codexLagValue: 6, codexWindowValue: 40, codexRelationsTable: true, codexActivationMode: "keywords", codexExtraContext: false });
  expect(off.cacheFriendlySnapshot).toBeUndefined();
});

test("file switches freeze on entry and flag a catch-up on exit", async () => {
  data.set(`codex/${chat}/cursor.json`, { ...emptyCursor(), runs: 2, fileStates: { threads: "noInject", relations: "frozen" } });
  await alignCacheFileStates(chat, user, true);
  let cursor = await loadCursor(chat, user);
  expect(cursor.fileStates).toEqual({ timeline: "frozen", threads: "frozen" });
  expect(cursor.cacheSavedStates).toEqual({ threads: "noInject", relations: "frozen" });
  cursor.runs = 5;
  data.set(`codex/${chat}/cursor.json`, cursor);
  await alignCacheFileStates(chat, user, true);
  expect((await loadCursor(chat, user)).frozenAtRuns.timeline).toBe(2);
  await alignCacheFileStates(chat, user, false);
  cursor = await loadCursor(chat, user);
  expect(cursor.fileStates).toEqual({ threads: "noInject", relations: "frozen" });
  expect(cursor.refreshPending).toContain("timeline");
  expect(cursor.cacheSavedStates).toBeUndefined();
});

test("a full category appends its note after the update instruction", async () => {
  const ctx = makeCodexPromptCtx(makeDefaultProfile("p", "Test"), [], new Set(["timeline"]));
  ctx.fullness = [{ file: "world", percent: 82 }, { file: "timeline", percent: 90 }];
  const text = buildCodexUserMessage(ctx, emptyBundle(), [], "x", 0, { reconcile: false, migrateToTable: false, migrateToInline: false, loadProblems: [] }, null, null);
  expect(text.trimEnd().endsWith("This overrides any earlier instruction to be comprehensive.")).toBe(true);
  expect(text).toContain("Its world category is currently 82% full.");
  expect(text).not.toContain("timeline category");
});

test("the Codex adopts the Summary window and lag, whatever the user picks", () => {
  const saved = (extra: Partial<LMBProfile>) => normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly: true, profiles: [{ ...enterCacheFriendly(makeDefaultProfile("p", "Test")), ...extra }], activeProfileId: "p" }).profiles[0]!;
  expect(saved({ windowValue: 35, lagValue: 7, codexWindowValue: 99, codexLagValue: 99 })).toMatchObject({ windowValue: 35, codexWindowValue: 35, lagValue: 7, codexLagValue: 7 });
  expect(saved({ windowUnit: "tokens", windowValue: 500, lagUnit: "tokens", lagValue: 300 })).toMatchObject({ codexWindowUnit: "tokens", codexWindowValue: 500, codexLagUnit: "tokens", codexLagValue: 300 });
});

test("one window spends its LLM time first and then commits chapter and Codex together", async () => {
  const profile = mode();
  await useProfile(profile);
  await runCacheFriendlyWindow(chat, profile, normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly: true, profiles: [profile], activeProfileId: "p" }), user, () => {});
  expect(order.filter((step) => step === "chapter-llm")).toHaveLength(1);
  expect(order.filter((step) => step === "codex-llm")).toHaveLength(1);
  expect(order.indexOf("chapter-llm")).toBeLessThan(order.indexOf("codex-llm"));
  expect(order.indexOf("codex-llm")).toBeLessThan(order.indexOf("promote"));
  expect(order.indexOf("promote")).toBeLessThan(order.indexOf("codex-entry"));
  expect(order.at(-1)).toBe("epoch");
  expect(chapters()).toHaveLength(1);
  expect(chapters()[0].disabled).toBe(false);
  const rain = codexEntries().find((e) => e.comment.includes("Rain"));
  expect(rain).toMatchObject({ constant: true, vectorized: false, position: 0, disabled: false, order_value: 0 });
  expect((await loadCursor(chat, user)).fileStates).toMatchObject({ timeline: "frozen", threads: "frozen" });
  expect((await loadCursor(chat, user)).lastMsgId).toBe("m20");
});

test("below the window nothing runs and the epoch stays put", async () => {
  messages = messages.slice(0, 44);
  const profile = mode();
  await useProfile(profile);
  await runCacheFriendlyWindow(chat, profile, normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly: true, profiles: [profile], activeProfileId: "p" }), user, () => {});
  expect(order).toEqual([]);
  expect(epochs).toEqual([]);
});

test("a failed Codex run still commits the chapter and warns", async () => {
  const profile = mode();
  await useProfile(profile);
  const stream = (globalThis as any).spindle.generate;
  stream.quietStream = async function* () { order.push("codex-llm"); throw new Error("provider down"); yield {}; };
  const warnings: string[] = [];
  await runCacheFriendlyWindow(chat, profile, normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly: true, profiles: [profile], activeProfileId: "p" }), user, (_, text) => warnings.push(text));
  expect(warnings).toHaveLength(1);
  expect(chapters()[0].disabled).toBe(false);
  expect(epochs.length).toBeGreaterThan(0);
});

test("sync cuts over-limit constant entries, keeps order stable, and warns only on new cuts", async () => {
  const facts = (n: number) => Array.from({ length: n }, (_, i) => ({ topic: `T${i}`, facts: ["x".repeat(i < 6 ? 400 : 100)] }));
  data.set(`codex/${chat}/cursor.json`, { ...emptyCursor(), recordStats: {}, relationsTableMode: false });
  data.set(`codex/${chat}/world.json`, { entries: facts(9) });
  const profile = mode({ codexTokenLimits: { ...limits(10000), world: 2750 } });
  await useProfile(profile);
  const { registerCodexCutWarning } = await import("./codex/sync");
  const warned: string[] = [];
  registerCodexCutWarning((_, chatId) => warned.push(chatId));
  await syncCodexEntries(chat, user, false);
  const disabled = () => codexEntries().filter((e) => e.disabled).map((e) => e.comment);
  expect(disabled().length).toBeGreaterThan(0);
  expect(disabled()).toContain("[Codex] World: T6");
  expect(disabled().some((comment: string) => /T[0-5]$/.test(comment))).toBe(false);
  expect(warned).toEqual([chat]);
  const orderValues = codexEntries().map((e) => e.order_value);
  expect(new Set(orderValues).size).toBe(orderValues.length);
  await syncCodexEntries(chat, user, false);
  expect(warned).toEqual([chat]);
});

test("keyword mode caps only entries the recent turns can activate", () => {
  const entry = (id: string, key: string[], size: number, extra: object = {}) => ({
    id, key, disabled: false, constant: false, content: "x".repeat(size),
    extensions: { lumibooks_codex: { chatId: chat, record: id, file: "world" } }, ...extra,
  });
  const profile = { ...makeDefaultProfile("p", "Test"), codexActivationMode: "keywords" as const, codexTokenLimits: { ...limits(10000), world: 100 } };
  const rows: any[] = [
    ...[1, 2, 3, 4, 5, 6].map((n) => entry(`big${n}`, ["alpha"], 400)),
    entry("hit", ["Alpha"], 40), entry("miss", ["zeta"], 400000),
  ];
  expect(codexActivationCuts(rows, [{ content: "old zeta" }, { content: "an ALPHA appears" }], 1, profile)).toEqual(["hit"]);
  expect(codexActivationCuts(rows, [{ content: "nothing" }], 1, profile)).toEqual([]);
  expect(codexActivationCuts(rows, [{ content: "alpha" }], 1, { ...profile, codexActivationMode: "always" })).toEqual([]);
});

test("only filed messages count as changed", async () => {
  const { msgSig } = await import("./codex/store");
  data.set(`codex/${chat}/cursor.json`, { ...emptyCursor(), consumedSigs: [{ id: "m1", sig: msgSig("user", "Turn 1") }, { id: "m2", sig: "stale" }] });
  expect(await filedMessageChanged(chat, "m1", user, false)).toBe(false);
  expect(await filedMessageChanged(chat, "m2", user, false)).toBe(true);
  expect(await filedMessageChanged(chat, "m45", user, false)).toBe(false);
  expect(await filedMessageChanged(chat, "m1", user, true)).toBe(true);
  expect(await filedMessageChanged(chat, "m45", user, true)).toBe(false);
});

test("LumiCache presence reads its endpoint and surfaces other failures", async () => {
  const rpc = (globalThis as any).spindle.rpcPool;
  rpc.read = async () => { throw new Error('Shared RPC endpoint "lumicache.status" is not registered'); };
  expect(await lumiCacheAvailable()).toBe(false);
  rpc.read = async () => ({ version: 1 });
  expect(await lumiCacheAvailable()).toBe(true);
  rpc.read = async () => { throw new Error("worker crashed"); };
  await expect(lumiCacheAvailable()).rejects.toThrow("worker crashed");
});

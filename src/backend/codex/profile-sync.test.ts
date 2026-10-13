import { afterAll, beforeEach, expect, test } from "bun:test";
import { resolveTidyTarget } from "../../codex-tidy";
import { DEFAULT_SETTINGS, makeDefaultProfile } from "../../shared";
import { runCodexTidy, registerCodexCallbacks } from "./index";
import { emptyCursor } from "./store";
import { saveSettings } from "../storage";
import { abortBusy, getBusy, registerPipelineCallbacks } from "../pipeline";

const original = (globalThis as any).spindle;
const chat = "tidy-test", user = "tidy-user";
const data = new Map<string, any>();
let calls = 0, toasts: Array<{ tone: string; text: string }> = [], prompts: string[] = [], entries: any[] = [];
let reply: (call: number) => any;
let profile = makeDefaultProfile("tidy", "Test");
const world = (size: number) => ({ entries: [{ topic: "Weather", facts: ["x".repeat(size)] }] });

beforeEach(async () => {
  calls = 0; toasts = []; prompts = []; entries = []; data.clear();
  profile = { ...makeDefaultProfile("tidy", "Test"), codexUseTools: false, codexThorough: true };
  data.set(`codex/${chat}/cursor.json`, { ...emptyCursor(), lastMsgId: "m40", runs: 5, consumedSigs: [{ id: "m40", sig: "old" }], fileStates: { knowledge: "frozen" } });
  data.set(`codex/${chat}/world.json`, world(1000));
  data.set(`codex/${chat}/knowledge.json`, { items: [{ fact: "Keep this secret.", knownBy: ["Alice"] }] });
  const book = { id: "codex-book", metadata: { lumibooks_codex_chat_id: chat } };
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    userStorage: {
      async exists(p: string) { return data.has(p); },
      async read(p: string) { if (!data.has(p)) throw new Error("missing"); return JSON.stringify(data.get(p)); },
      async getJson(p: string, opts: any) { return structuredClone(data.get(p) ?? opts?.fallback); },
      async setJson(p: string, value: any) { data.set(p, structuredClone(value)); },
      async delete(p: string) { data.delete(p); },
      async list() { return [...data.keys()]; },
    },
    tokens: { async countText(text: string) { return { total_tokens: text.length, approximate: false }; } },
    connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
    chats: { async get() { return { id: chat, metadata: { lumibooks_codex_book_id: book.id, chat_world_book_ids: [book.id] } }; } },
    world_books: { async get() { return book; }, async list() { return { data: [book], total: 1 }; }, entries: {
      async list() { return { data: entries, total: entries.length }; },
      async create(_id: string, value: any) { const row = { ...value, id: String(entries.length) }; entries.push(row); return row; },
      async update(id: string, value: any) { const row = entries.find((e) => e.id === id); Object.assign(row, value); return row; },
      async delete(id: string) { entries = entries.filter((e) => e.id !== id); },
    } },
    generate: { async *quietStream(req: any) {
      calls++; prompts.push(JSON.stringify(req.messages));
      const body = reply(calls);
      if (profile.codexUseTools && typeof body !== "string") {
        yield { type: "done", content: "", tool_calls: [
          ...(body.writes ?? []).map((args: any, i: number) => ({ call_id: `w${i}`, name: "codex_write", args })),
          ...(body.skip ? [{ call_id: "skip", name: "codex_skip", args: { files: body.skip } }] : []),
          ...(body.done ? [{ call_id: "done", name: "codex_done", args: {} }] : []),
        ] };
        return;
      }
      yield { type: "done", content: typeof body === "string" ? body : JSON.stringify(body), usage: { completion_tokens: 24000 } };
    } },
  };
  registerCodexCallbacks({ onToast(_u, tone, text) { toasts.push({ tone, text }); }, onStateChange() {} });
  registerPipelineCallbacks({ onBusyChange() {}, onStateChange() {}, onToast() {}, onStreamText() {} });
  await saveSettings(user, { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
});
afterAll(() => { (globalThis as any).spindle = original; });

test("recall modes survive record edits and preserve IDs, keywords and disabled files", async () => {
  const { syncCodexEntries } = await import("./sync");
  const ids = new Map<string, string>();
  for (const mode of ["keywords", "vector", "always", "vector", "keywords"] as const) {
    profile.codexActivationMode = mode;
    await saveSettings(user, { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
    await syncCodexEntries(chat, user);
    for (const entry of entries) {
      const record = entry.extensions.lumibooks_codex.record;
      if (ids.has(record)) expect(entry.id).toBe(ids.get(record));
      else ids.set(record, entry.id);
      expect(entry.constant).toBe(mode === "always");
      expect(entry.vectorized).toBe(mode === "vector");
    }
    const weather = entries.find((e) => e.content.includes("Weather"));
    expect(weather.key).toContain("Weather");
    expect(weather.disabled).toBe(false);
    expect(entries.find((e) => e.content.includes("Keep this secret."))?.disabled).toBe(true);
    data.set(`codex/${chat}/world.json`, world(mode.length * 100));
    await syncCodexEntries(chat, user);
    expect(entries.find((e) => e.id === weather.id)?.vectorized).toBe(mode === "vector");
  }
});

test("a corrupt old chat must not prevent resyncing healthy chats", async () => {
  const { syncCodexProfiles } = await import("./sync");
  (globalThis as any).spindle.userStorage.list = async () => ["codex/broken/cursor.json", `codex/${chat}/cursor.json`];
  data.set("codex/broken/cursor.json", emptyCursor());
  data.set("codex/broken/world.json", { entries: [{ topic: "invalid", facts: [] }] });
  profile.codexActivationMode = "always";
  await saveSettings(user, { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
  const failures = await syncCodexProfiles(user);
  expect(failures).toHaveLength(1);
  expect(failures[0]?.chatId).toBe("broken");
  expect(failures[0]?.error).toContain("world.json");
  expect(entries.some((e) => e.constant && e.content.includes("Weather"))).toBe(true);
});

test("deleted chats retire quietly, preserve recovery data, and stay out of continuity choices", async () => {
  const { syncCodexProfiles } = await import("./sync");
  const { listCodexChatIds } = await import("./store");
  const host = (globalThis as any).spindle;
  const get = host.chats.get;
  data.set("codex/deleted/cursor.json", emptyCursor());
  data.set("codex/deleted/world.json", world(500));
  const saved = structuredClone(data.get("codex/deleted/world.json"));
  host.chats.get = async (id: string, userId: string) => {
    expect(userId).toBe(user);
    return id === "deleted" ? null : get();
  };
  const read = host.userStorage.read;
  host.userStorage.read = async (path: string) => {
    expect(path.startsWith("codex/deleted/")).toBe(false);
    return read(path);
  };
  for (let i = 0; i < 2; i++) expect(await syncCodexProfiles(user)).toEqual([]);
  expect(data.has("codex/deleted/orphaned.json")).toBe(true);
  expect(data.get("codex/deleted/world.json")).toEqual(saved);
  expect(data.has("codex/deleted/cursor.json")).toBe(true);
  expect(await listCodexChatIds(user)).toEqual([chat]);
  expect(await listCodexChatIds(user, true)).toContain("deleted");
  expect(entries.some((e) => e.content.includes("Weather"))).toBe(true);
});

test("lookup failures keep Codex state active and report the real error", async () => {
  const { syncCodexProfiles } = await import("./sync");
  (globalThis as any).spindle.chats.get = async () => { throw new Error("host lookup unavailable"); };
  expect(await syncCodexProfiles(user)).toEqual([{ chatId: chat, error: "host lookup unavailable" }]);
  expect(data.has(`codex/${chat}/orphaned.json`)).toBe(false);
  expect(data.has(`codex/${chat}/world.json`)).toBe(true);
});

test("a chat deleted while attaching its book retires its cached binding and can later recover", async () => {
  const { syncCodexEntries, syncCodexProfiles } = await import("./sync");
  const { findCodexBookForChat } = await import("../world-book");
  const { listCodexChatIds } = await import("./store");
  await syncCodexEntries(chat, user);
  const host = (globalThis as any).spindle, get = host.chats.get;
  let lookups = 0;
  host.chats.get = async () => ++lookups === 1 ? get() : null;
  const savedEntries = structuredClone(entries);
  expect(await syncCodexProfiles(user)).toEqual([]);
  const beforeLookup = lookups;
  await findCodexBookForChat(chat, user);
  expect(lookups).toBeGreaterThan(beforeLookup);
  expect(await listCodexChatIds(user)).toEqual([]);
  expect(entries).toEqual(savedEntries);
  host.chats.get = get;
  expect(await syncCodexProfiles(user)).toEqual([]);
  expect(data.has(`codex/${chat}/orphaned.json`)).toBe(false);
  expect(await listCodexChatIds(user)).toEqual([chat]);
  expect(entries).toEqual(savedEntries);
});

test("failed absence verification does not hide a live chat sync failure", async () => {
  const { syncCodexProfiles } = await import("./sync");
  const host = (globalThis as any).spindle, get = host.chats.get;
  let lookups = 0;
  host.chats.get = async () => { if (++lookups > 1) throw new Error("lookup unavailable"); return get(); };
  data.set(`codex/${chat}/world.json`, { entries: [{ topic: "invalid", facts: [] }] });
  const failures = await syncCodexProfiles(user);
  expect(failures).toHaveLength(1);
  expect(failures[0]?.error).toContain("world.json");
  expect(data.has(`codex/${chat}/orphaned.json`)).toBe(false);
});

test("category switches refresh injection counts without invalidating cached file contents", async () => {
  const { setCodexFileState, getCodexRevision, getCodexTokenCounts, invalidateCodexInjectionCache } = await import("./index");
  profile.codexActivationMode = "always";
  await saveSettings(user, { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: profile.id });
  invalidateCodexInjectionCache(chat);
  const revision = getCodexRevision(chat);
  const content = structuredClone(data.get(`codex/${chat}/world.json`));
  expect((await getCodexTokenCounts(chat, user, profile)).constant).toBeGreaterThan(0);
  await setCodexFileState(chat, user, "world", "noInject");
  expect(getCodexRevision(chat)).toBe(revision);
  expect((await getCodexTokenCounts(chat, user, profile)).constant).toBe(0);
  expect(data.get(`codex/${chat}/world.json`)).toEqual(content);
  expect(entries.find((e) => e.content.includes("Weather"))?.disabled).toBe(true);
});

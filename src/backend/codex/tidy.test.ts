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

test("targets apply a 10 percent margin in both modes and reject invalid input", () => {
  expect(resolveTidyTarget(1000, { unit: "percent", value: 50 })).toEqual({ limit: 500, modelTarget: 450 });
  expect(resolveTidyTarget(1000, { unit: "tokens", value: 500 })).toEqual({ limit: 500, modelTarget: 450 });
  for (const value of [NaN, Infinity, 0, -1, 100]) expect(() => resolveTidyTarget(1000, { unit: "percent", value })).toThrow();
});

test("tidy retries using saved content, then stops at the user's limit with one undo snapshot", async () => {
  reply = (call) => ({ writes: [{ file: "world", content: world(call === 1 ? 600 : 420) }], done: true });
  await runCodexTidy(chat, profile, user, ["world"], { unit: "tokens", value: 500 });
  expect(calls).toBe(2);
  expect(prompts[1]).toContain("x".repeat(600));
  expect(prompts[1]).toContain("450 tokens");
  expect(data.get(`codex/${chat}/world.json`)).toMatchObject(world(420));
  expect(JSON.parse(data.get(`codex-undo/${chat}.json`).files.world)).toEqual(world(1000));
  expect(data.get(`codex/${chat}/cursor.json`).lastMsgId).toBe("m40");
  expect(toasts.at(-1)?.tone).toBe("success");
  expect(getBusy(user)).toHaveLength(0);
});

test("six actual calls include JSON repairs, with no seventh call when still too big", async () => {
  reply = (call) => call === 1 ? "This is not JSON." : ({ writes: [{ file: "world", content: world(800) }], done: true });
  await runCodexTidy(chat, profile, user, ["world"], { unit: "percent", value: 50 });
  expect(calls).toBe(6);
  expect(toasts.at(-1)?.text).toContain("still above");
  expect(data.get(`codex/${chat}/world.json`)).toMatchObject(world(800));
});

test("repeated skips cannot bypass the six-call cap", async () => {
  reply = () => ({ writes: [], skip: ["world"], done: true });
  await runCodexTidy(chat, profile, user, ["world"], { unit: "tokens", value: 100 });
  expect(calls).toBe(6);
  expect(toasts.at(-1)?.tone).toBe("warn");
});

test("tidy cannot rewrite unselected or frozen files", async () => {
  const knowledge = structuredClone(data.get(`codex/${chat}/knowledge.json`));
  data.set(`codex/${chat}/things.json`, { entities: [{ id: "thing:key", name: "Key", notes: "Unselected" }] });
  reply = () => ({ writes: [
    { file: "world", content: world(10) },
    { file: "knowledge", content: { items: [] } },
    { file: "things", content: { entities: [] } },
  ], done: true });
  await runCodexTidy(chat, profile, user, ["world", "knowledge"], { unit: "tokens", value: 100 });
  expect(calls).toBe(1);
  expect(data.get(`codex/${chat}/knowledge.json`)).toEqual(knowledge);
  expect(data.get(`codex/${chat}/things.json`).entities).toHaveLength(1);
});

test("already-small content costs no model calls and preserves the last Undo", async () => {
  data.set(`codex-undo/${chat}.json`, { previous: true });
  await runCodexTidy(chat, profile, user, ["world"], { unit: "tokens", value: 2000 });
  expect(calls).toBe(0);
  expect(data.get(`codex-undo/${chat}.json`)).toEqual({ previous: true });
});

test("cancel stops another compaction call and releases busy state", async () => {
  reply = () => { abortBusy(user, chat, "codex"); return { writes: [], skip: ["world"], done: true }; };
  await runCodexTidy(chat, profile, user, ["world"], { unit: "tokens", value: 100 });
  expect(calls).toBe(1);
  expect(getBusy(user)).toHaveLength(0);
  expect(toasts.some((t) => t.text.includes("Tidying stopped"))).toBe(true);
});


test("tool transport shares the same six-call ceiling across completed passes", async () => {
  profile.codexUseTools = true;
  reply = () => ({ writes: [{ file: "world", content: world(800) }], done: true });
  await runCodexTidy(chat, profile, user, ["world"], { unit: "tokens", value: 100 });
  expect(calls).toBe(6);
  expect(toasts.at(-1)?.text).toContain("still above");
});

test("locked entities survive a tidy even when the model tries to remove them", async () => {
  const locked = { id: "char:alice", name: "Alice", notes: "x".repeat(500), locked: true };
  data.set(`codex/${chat}/characters.json`, { entities: [locked] });
  reply = () => ({ writes: [{ file: "characters", content: { entities: [] } }], done: true });
  await runCodexTidy(chat, profile, user, ["characters"], { unit: "tokens", value: 100 });
  expect(data.get(`codex/${chat}/characters.json`).entities).toEqual([locked]);
  expect(calls).toBe(6);
  expect(toasts.at(-1)?.tone).toBe("warn");
});
for (const frozen of [false, true]) test(`per-file tidy preserves references in ${frozen ? "frozen" : "unselected"} files`, async () => {
  data.set(`codex/${chat}/characters.json`, { entities: [{ id: "char:alice", name: "Alice", notes: "x".repeat(500) }] });
  data.set(`codex/${chat}/knowledge.json`, { items: [{ fact: "secret", knownBy: ["char:alice"] }] });
  data.get(`codex/${chat}/cursor.json`).fileStates = frozen ? { knowledge: "frozen" } : {};
  reply = () => ({ writes: [{ file: "characters", content: { entities: [] } }], done: true });
  await runCodexTidy(chat, profile, user, ["characters"], { unit: "tokens", value: 100 });
  const { loadCodex } = await import("./store");
  const { checkIntegrity } = await import("./schema");
  const loaded = await loadCodex(chat, user, { relationsTable: true });
  expect(checkIntegrity(loaded.bundle)).toEqual([]);
  expect(loaded.bundle.characters.entities[0]?.id).toBe("char:alice");
  expect(loaded.bundle.knowledge.items[0]?.knownBy).toEqual(["char:alice"]);
  expect(calls).toBe(6);
  expect(toasts.at(-1)?.tone).toBe("warn");
});

test("a failed dependent edit cannot persist an entity deletion on its own", async () => {
  const characters = { entities: [{ id: "char:alice", name: "Alice", notes: "x".repeat(500) }, { id: "char:bob", name: "Bob", notes: "friend" }] };
  const relations = { relations: [{ type: "pair", a: "char:alice", b: "char:bob", kind: "friendship", state: "friends" }] };
  data.set(`codex/${chat}/characters.json`, characters);
  data.set(`codex/${chat}/relations.json`, relations);
  data.get(`codex/${chat}/cursor.json`).fileStates = {};
  profile.codexRelationsTable = true;
  reply = () => ({ writes: [
    { file: "characters", content: { entities: [characters.entities[1]] } },
    { file: "relations", content: { relations: [{ type: "pair", a: "char:missing", b: "char:bob", kind: "friendship", state: "friends" }] } },
  ], done: true });
  await runCodexTidy(chat, profile, user, ["characters", "relations"], { unit: "tokens", value: 100 });
  expect(data.get(`codex/${chat}/characters.json`)).toEqual(characters);
  expect(data.get(`codex/${chat}/relations.json`)).toEqual(relations);
  expect(toasts.at(-1)?.tone).toBe("error");
});




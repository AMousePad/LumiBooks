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

test("counts must use the current story tokenizer after a connection change", async () => {
  const { getCodexTokenCounts, invalidateCodexInjectionCache, invalidateCodexTokenCounts } = await import("./index");
  const { invalidateConnectionsCache } = await import("../summarizer");
  invalidateCodexInjectionCache(chat);
  const first = await getCodexTokenCounts(chat, user, profile);
  (globalThis as any).spindle.tokens.countText = async (text: string) => ({ total_tokens: text.length * 2, approximate: false });
  // Both host connection-change handlers invalidate counts as well as connections.
  invalidateConnectionsCache(user); invalidateCodexTokenCounts(user);
  const cached = await getCodexTokenCounts(chat, user, profile);
  invalidateCodexInjectionCache(chat);
  const actual = await getCodexTokenCounts(chat, user, profile);
  expect(cached.files.world).toBe(actual.files.world);
});

import { afterAll, expect, test } from "bun:test";
import { makeDefaultProfile, CODEX_FILE_KEYS } from "../../shared";
import { emptyBundle } from "./schema";
import { frozenCodexFiles, makeCodexPromptCtx } from "./prompt";
import { runCodexAgent } from "./agent";
const prev = (globalThis as any).spindle;
afterAll(() => { (globalThis as any).spindle = prev; });
for (const tools of [false, true]) test(`non-injected files accept updates through ${tools ? "tools" : "JSON"}`, async () => {
  const saved = new Map<string, any>();
  const fileStates = { world: "noInject", knowledge: "noInject", timeline: "frozen" };
  const writes = [
    { file: "world", set: [{ topic: "Weather", facts: ["The storm ended."] }] },
    { file: "knowledge", set: [{ fact: "The gate is open.", knownBy: ["Alice"] }] },
  ];
  const skip = CODEX_FILE_KEYS.filter((k) => !["world", "knowledge", "timeline"].includes(k));
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    connections: { async list() { return [{ id: "test", model: "test", is_default: true }]; } },
    userStorage: { async setJson(path: string, value: unknown) { saved.set(path, value); } },
    generate: { async *quietStream(req: any) {
      expect(JSON.stringify(req.messages)).toContain("world.json");
      yield tools ? { type: "done", content: "", tool_calls: [
        ...writes.map((args, i) => ({ call_id: `w${i}`, name: "codex_write", args })),
        { call_id: "skip", name: "codex_skip", args: { files: skip } },
        { call_id: "done", name: "codex_done", args: {} },
      ] } : { type: "done", content: JSON.stringify({ writes, skip, done: true }) };
    } },
  };
  const profile = { ...makeDefaultProfile("p", "test"), codexUseTools: tools, codexThorough: false };
  const ctx = makeCodexPromptCtx(profile, [], frozenCodexFiles(fileStates));
  expect(ctx.activeFiles.has("world")).toBe(true);
  expect(ctx.activeFiles.has("timeline")).toBe(false);
  const result = await runCodexAgent({ chatId: "chat", userId: `state-${tools}`, profile, promptCtx: ctx,
    bundle: emptyBundle(), chunk: [], chunkLabel: "test", chunkFirstIndex: 0,
    notes: { reconcile: false, migrateToTable: false, migrateToInline: false, loadProblems: [] },
    lore: null, storySoFar: null, externalSignal: new AbortController().signal });
  expect(result.changedFiles.sort()).toEqual(["knowledge", "world"]);
  expect(saved.get("codex/chat/world.json").entries[0].facts).toEqual(["The storm ended."]);
  expect(saved.has("codex/chat/timeline.json")).toBe(false);
});


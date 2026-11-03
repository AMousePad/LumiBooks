import { afterAll, beforeEach, expect, test } from "bun:test";
import { getCodexStatus } from "./index";
import { emptyCursor, msgSig, refreshCodexExclusions } from "./store";
import { makeDefaultProfile } from "../../shared";

const original = (globalThis as any).spindle;
const profile = { ...makeDefaultProfile("excluded", "Test"), codexEnabled: true, codexLagValue: 0 };
const disk = new Map<string, any>();
let messages: any[] = [];
beforeEach(() => {
  disk.clear();
  messages = Array.from({ length: 202 }, (_, i) => ({ id: `m${i}`, index_in_chat: i, role: "assistant", content: `story ${i}`, metadata: { lmb_excluded: i < 2 } }));
  disk.set("codex/chat/cursor.json", { ...emptyCursor(), runs: 10, lastMsgId: "m201", consumedSigs: messages.map(m => ({ id: m.id, sig: msgSig(m.role, m.content) })) });
  disk.set("codex/chat/world.json", { entries: [{ topic: "Story", facts: ["Current"] }] });
  (globalThis as any).spindle = { log: { warn() {} },
    chat: { async getMessages() { return structuredClone(messages); } },
    userStorage: {
      async exists(path: string) { return disk.has(path); },
      async read(path: string) { return JSON.stringify(disk.get(path)); },
      async setJson(path: string, value: any) { disk.set(path, structuredClone(value)); },
    },
  };
});
afterAll(() => { (globalThis as any).spindle = original; });

test("deleting two excluded messages after 200 indexed turns keeps the Codex current", async () => {
  expect((await getCodexStatus("chat", "user", profile)).backlog).toBe(0);
  expect(disk.get("codex/chat/cursor.json").consumedSigs[0].excluded).toBe(true);
  messages.splice(0, 2);
  expect((await getCodexStatus("chat", "user", profile)).backlog).toBe(0);
  expect(disk.get("codex/chat/cursor.json").lastMsgId).toBe("m201");
  expect(disk.get("codex/chat/cursor.json").pendingReconcile).toBe(false);
});

test("deleting an excluded cursor anchor resumes at the next new turn", async () => {
  messages[201].metadata.lmb_excluded = true;
  await refreshCodexExclusions("chat", "user", messages);
  messages.pop();
  messages.push({ id: "new", index_in_chat: 202, role: "assistant", content: "New story" });
  expect((await getCodexStatus("chat", "user", profile)).backlog).toBe(1);
});

test("real edits and deletions still rewind even alongside removed exclusions", async () => {
  await refreshCodexExclusions("chat", "user", messages);
  messages.splice(0, 3);
  expect((await getCodexStatus("chat", "user", profile)).backlog).toBe(199);
});

test("unexcluding a consumed message restores deletion tracking", async () => {
  await refreshCodexExclusions("chat", "user", messages);
  messages[1].metadata.lmb_excluded = false;
  await refreshCodexExclusions("chat", "user", messages);
  messages.splice(0, 2);
  expect((await getCodexStatus("chat", "user", profile)).backlog).toBe(200);
});

test("excluded deletion does not suppress edits to later story messages", async () => {
  await refreshCodexExclusions("chat", "user", messages);
  messages.splice(0, 2);
  messages[190].content = "A different outcome";
  expect((await getCodexStatus("chat", "user", profile)).backlog).toBe(10);
});

import { afterEach, expect, test } from "bun:test";
import { loadPromptBreakdown } from "./prompt-breakdown";
import type { PromptBreakdownRequest } from "../prompt-breakdown";

const original = Object.getOwnPropertyDescriptor(globalThis, "spindle");
afterEach(() => {
  if (original) Object.defineProperty(globalThis, "spindle", original);
  else delete (globalThis as any).spindle;
});
const request: PromptBreakdownRequest = { type: "prompt_breakdown", requestId: "request", chatId: "chat", messageIds: ["first", "second"], mode: "auto" };
function install(generate: unknown) { Object.defineProperty(globalThis, "spindle", { configurable: true, value: { generate } }); }

test("saved lookup walks newest first, scopes reads, and returns only panel metadata", async () => {
  const calls: unknown[] = [];
  install({
    getBreakdown: async (id: string, user: string) => {
      calls.push([id, user]);
      return id === "second" ? null : {
        entries: [{ name: "System", type: "block", tokens: 5, content: "PRIVATE_PROMPT" }],
        messages: [{ content: "PRIVATE_HISTORY" }], totalTokens: 25, chatHistoryTokens: 20, maxContext: 8192,
      };
    },
    dryRun: () => { throw new Error("Unexpected preview"); },
  });
  const result = await loadPromptBreakdown(request, "owner");
  expect(calls).toEqual([["second", "owner"], ["first", "owner"]]);
  expect(result.source).toBe("fire");
  expect(result.d.entries.map(e => e.tokens)).toEqual([20, 5]);
  expect(result.d.totalTokens).toBe(25);
  expect(JSON.stringify(result)).not.toContain("PRIVATE_");
});

test("absent snapshots fall back to a scoped preview with context and history totals", async () => {
  const calls: unknown[] = [];
  install({ getBreakdown: async () => null, dryRun: async (...args: unknown[]) => {
    calls.push(args);
    return { tokenCount: { breakdown: [{ name: "System", type: "block", tokens: 5 }], total_tokens: 15 },
      contextClipStats: { maxContext: 8192 }, chatHistoryTokens: 10, model: "test" };
  } });
  expect(await loadPromptBreakdown(request, "owner")).toMatchObject({ source: "dry", d: {
    maxContext: 8192, totalTokens: 15, model: "test", entries: [{ tokens: 10 }, { tokens: 5 }],
  } });
  expect(calls).toEqual([[{ chatId: "chat" }, "owner"]]);
});

test("explicit preview skips saved reads and does not duplicate history entries", async () => {
  install({ getBreakdown: () => { throw new Error("Unexpected saved read"); }, dryRun: async () => ({
    tokenCount: { breakdown: [{ name: "History", type: "chat_history", tokens: 10 }], total_tokens: 10 }, chatHistoryTokens: 10,
  }) });
  const result = await loadPromptBreakdown({ ...request, mode: "dry" }, "owner");
  expect(result.d.entries).toHaveLength(1);
  expect(result.d.maxContext).toBe(0);
});

test("saved lookup is bounded to the latest fifteen messages", async () => {
  const ids: string[] = [];
  install({ getBreakdown: async (id: string) => { ids.push(id); return null; }, dryRun: async () => ({ tokenCount: { breakdown: [] } }) });
  await expect(loadPromptBreakdown({ ...request, messageIds: Array.from({ length: 20 }, (_, i) => String(i)) }, "owner")).rejects.toThrow("no breakdown");
  expect(ids).toEqual(Array.from({ length: 15 }, (_, i) => String(19 - i)));
});

test("host errors propagate without silently falling back or making raw HTTP calls", async () => {
  install({ getBreakdown: async () => { throw new Error("Permission denied"); }, dryRun: () => { throw new Error("Unexpected preview"); } });
  await expect(loadPromptBreakdown(request, "owner")).rejects.toThrow("Permission denied");
  install({ dryRun: () => { throw new Error("Unexpected preview"); } });
  await expect(loadPromptBreakdown(request, "owner")).rejects.toThrow("requires a Lumiverse update");
});

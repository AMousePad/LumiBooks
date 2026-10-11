import { afterEach, expect, test } from "bun:test";
import { clearPromptRequests, deliverPromptBreakdown, requestPromptBreakdown } from "./prompt-breakdown";
import type { PromptBreakdownRequest } from "../prompt-breakdown";

afterEach(clearPromptRequests);
const input = { chatId: "chat", messageIds: ["message"], mode: "auto" as const };
const result = { source: "fire" as const, d: { entries: [], totalTokens: 0, maxContext: 0 } };

test("replies match both request and chat, including synchronous and out-of-order replies", async () => {
  const sent: PromptBreakdownRequest[] = [];
  const first = requestPromptBreakdown(m => sent.push(m as PromptBreakdownRequest), input);
  const second = requestPromptBreakdown(m => sent.push(m as PromptBreakdownRequest), { ...input, chatId: "other" });
  deliverPromptBreakdown({ ...sent[0]!, chatId: "wrong", result });
  deliverPromptBreakdown({ ...sent[1]!, result: { ...result, source: "dry" } });
  deliverPromptBreakdown({ ...sent[0]!, result });
  expect(await first).toEqual(result);
  expect((await second).source).toBe("dry");
  expect(await requestPromptBreakdown(m => deliverPromptBreakdown({ ...m as PromptBreakdownRequest, result }), input)).toEqual(result);
});

test("backend failures, send failures, timeouts and disposal release pending requests", async () => {
  await expect(requestPromptBreakdown(m => deliverPromptBreakdown({ ...m as PromptBreakdownRequest, error: "Host failed" }), input)).rejects.toThrow("Host failed");
  await expect(requestPromptBreakdown(() => { throw new Error("Disconnected"); }, input)).rejects.toThrow("Disconnected");
  let sent!: PromptBreakdownRequest;
  await expect(requestPromptBreakdown(m => { sent = m as PromptBreakdownRequest; }, input, 1)).rejects.toThrow("timed out");
  expect(() => deliverPromptBreakdown({ ...sent, result })).not.toThrow();
  const pending = requestPromptBreakdown(() => {}, input);
  clearPromptRequests();
  await expect(pending).rejects.toThrow("closed");
});

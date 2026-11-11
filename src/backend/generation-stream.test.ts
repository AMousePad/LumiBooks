import { expect, test } from "bun:test";
import { AbortedSummarizerError, consumeGenerationStream, parseSummaryReply, type ConsumeStreamOptions } from "./summarizer";

function options(controller = new AbortController()): ConsumeStreamOptions {
  return { externalSignal: controller.signal, firstTokenTimeoutMs: null, overallDeadlineMs: null, salvagePartial: true };
}
const aborted = (signal: AbortSignal) => signal.aborted ? Promise.resolve()
  : new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));

test("a request cancelled before streaming never starts a provider call", async () => {
  const controller = new AbortController(); controller.abort();
  let requests = 0;
  await expect(consumeGenerationStream(async function* () {
    requests++;
    yield { type: "done", content: "late result" };
  }, options(controller))).rejects.toBeInstanceOf(AbortedSummarizerError);
  expect(requests).toBe(0);
});

for (const end of ["done", "partial", "error"] as const) {
  test(`a response deadline rejects ${end} output after the provider sees cancellation`, async () => {
    await expect(consumeGenerationStream(async function* (signal) {
      yield { type: "token", token: "partial" };
      await aborted(signal);
      if (end === "done") yield { type: "done", content: "late result" };
      if (end === "error") throw new Error("provider abort");
    }, { ...options(), overallDeadlineMs: 1 })).rejects.toThrow("Response didn't finish");
  });
}

test("first-token timeout rejects a late completion and does not publish late tokens", async () => {
  const seen: string[] = [];
  await expect(consumeGenerationStream(async function* (signal) {
    await aborted(signal);
    yield { type: "token", token: "late" };
    yield { type: "done", content: "late result" };
  }, { ...options(), firstTokenTimeoutMs: 1, onDelta: (_kind, text) => seen.push(text) })).rejects.toThrow("No token within");
  expect(seen).toEqual([]);
});

test("user cancellation takes precedence over provider failures", async () => {
  const controller = new AbortController();
  await expect(consumeGenerationStream(async function* () {
    controller.abort();
    throw new Error("provider abort");
  }, options(controller))).rejects.toBeInstanceOf(AbortedSummarizerError);
});

function captureWarnings(run: (warnings: string[]) => Promise<void> | void) {
  const original = (globalThis as any).spindle;
  const warnings: string[] = [];
  (globalThis as any).spindle = { log: { warn: (message: string) => warnings.push(message) } };
  return Promise.resolve(run(warnings)).finally(() => { (globalThis as any).spindle = original; });
}

test("an uninterrupted stream still supports completion and partial recovery", () => captureWarnings(async (warnings) => {
  for (const done of [false, true]) {
    const result = await consumeGenerationStream(async function* () {
      yield { type: "reasoning", token: "think" };
      yield { type: "token", token: "partial" };
      if (done) yield { type: "done", content: "complete", finish_reason: "stop" };
    }, options());
    expect(result.content).toBe(done ? "complete" : "partial");
    expect(result.finishReason).toBe(done ? "stop" : null);
    expect(result.reasoningChars).toBe(5);
  }
  expect(warnings).toEqual(["[lmb] stream ended without a done chunk, keeping 7 partial chars and 5 reasoning chars"]);
}));

test("an unparseable summary logs its shape without its text", () => captureWarnings((warnings) => {
  const reply = '{"title": "SECRET_TITLE", "content": "SECRET_STORY';
  const profile = { samplers: { max_tokens: 900 } } as any;
  expect(() => parseSummaryReply("chapter", reply, { content: reply, finishReason: null, reasoningChars: 12, usage: { completion_tokens: 900 } }, profile))
    .toThrow("The model didn't return valid JSON");
  expect(warnings).toEqual([`[lmb] chapter reply unparseable: stream ended early, ${reply.length} chars (${reply.length} after regex), 1 "{" vs 0 "}", 12 reasoning chars, 900 completion tokens, max_tokens 900`]);
  expect(warnings.join("")).not.toContain("SECRET");
}));

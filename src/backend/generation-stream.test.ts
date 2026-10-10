import { expect, test } from "bun:test";
import { AbortedSummarizerError, consumeGenerationStream, type ConsumeStreamOptions } from "./summarizer";

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
    }, { ...options(), overallDeadlineMs: 1 })).rejects.toThrow("The response did not finish");
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

test("an uninterrupted stream still supports completion and partial recovery", async () => {
  for (const done of [false, true]) {
    const result = await consumeGenerationStream(async function* () {
      yield { type: "token", token: "partial" };
      if (done) yield { type: "done", content: "complete" };
    }, options());
    expect(result.content).toBe(done ? "complete" : "partial");
  }
});

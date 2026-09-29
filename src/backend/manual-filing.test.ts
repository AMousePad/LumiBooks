import { expect, test } from "bun:test";
import { makeDefaultProfile } from "../shared";
import type { CoverageMap } from "./coverage";

const globalWithSpindle = globalThis as typeof globalThis & { spindle?: unknown };
globalWithSpindle.spindle = { log: { info() {}, warn() {}, error() {} } };

const { countCompressibleEligible, selectNextChapterWindow, computeCoverageStats, trimLagFromTail } =
  await import("./coverage");

function profile(lagValue: number, windowValue: number) {
  return { ...makeDefaultProfile("p"), lagUnit: "messages" as const, lagValue, windowUnit: "messages" as const, windowValue };
}

function messages(n: number): any[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `m${i + 1}`,
    role: i % 2 === 0 ? "user" : "assistant",
    content: `line ${i + 1}`,
    index_in_chat: i,
    extra: {},
  }));
}

const noCoverage: CoverageMap = { coveredBy: new Map(), activeEntries: [] } as unknown as CoverageMap;

test("a partial window still yields messages to file", () => {
  // 10 messages, lag 4, window 20: only 6 sit behind the lag, short of a window.
  const p = profile(4, 20);
  const msgs = messages(10);
  const stats = computeCoverageStats(msgs, noCoverage, p);
  expect(stats.lagSatisfied).toBe(true);
  expect(stats.windowAvailable).toBe(false);

  // The automation gate refuses, but there is real work available, which is
  // what the manual button now files.
  expect(countCompressibleEligible(msgs, noCoverage, p)).toBe(6);
  expect(selectNextChapterWindow(msgs, p).length).toBe(6);
});

test("the lag reserve still holds back the newest turns", () => {
  const p = profile(4, 20);
  const msgs = messages(10);
  const kept = trimLagFromTail(msgs, p).map((m) => m.id);
  expect(kept).toEqual(["m1", "m2", "m3", "m4", "m5", "m6"]);
});

test("nothing to file when the lag swallows every uncovered message", () => {
  const p = profile(20, 20);
  const msgs = messages(10);
  expect(computeCoverageStats(msgs, noCoverage, p).lagSatisfied).toBe(false);
  expect(countCompressibleEligible(msgs, noCoverage, p)).toBe(0);
  expect(selectNextChapterWindow(msgs, p)).toEqual([]);
});

test("a full window is unchanged by the manual path", () => {
  const p = profile(4, 3);
  const msgs = messages(10);
  expect(computeCoverageStats(msgs, noCoverage, p).windowAvailable).toBe(true);
  expect(selectNextChapterWindow(msgs, p).length).toBe(3);
});

test("three selected replies form one chapter despite unselected turns between them", async () => {
  const { selectedChapterRuns } = await import("./coverage");
  const msgs = messages(6);
  expect(selectedChapterRuns(msgs, ["m2", "m4", "m6"])).toEqual([["m2", "m4", "m6"]]);
  msgs[2].metadata = { lmb_excluded: true };
  expect(selectedChapterRuns(msgs, ["m2", "m4", "m6"])).toEqual([["m2"], ["m4", "m6"]]);
});

test("watching observes a chapter without restarting it, even if viewer delivery fails", async () => {
  const p = await import("./pipeline");
  const seen: string[] = [];
  p.registerPipelineCallbacks({
    onBusyChange() {}, onToast() {}, onStateChange() {},
    onStreamText(_u, _c, _k, snap) { seen.push(snap.content); throw new Error("disconnected viewer"); },
  });
  expect(p.setBusy("watch-user", "watch-chat", "chapter", "writing")).toBe(true);
  p.appendStreamText("watch-user", "watch-chat", "chapter", "text", "first");
  expect(() => p.setStreamWatcher("watch-user", "watch-chat", "chapter", true)).not.toThrow();
  expect(() => p.appendStreamText("watch-user", "watch-chat", "chapter", "text", " second")).not.toThrow();
  expect(p.getBusy("watch-user")).toHaveLength(1);
  expect(p.setBusy("watch-user", "watch-chat", "chapter", "duplicate")).toBe(false);
  expect(() => p.clearBusy("watch-user", "watch-chat", "chapter")).not.toThrow();
  p.setStreamWatcher("watch-user", "watch-chat", "chapter", false);
  expect(seen).toContain("first second");
  expect(p.getBusy("watch-user")).toHaveLength(0);
});

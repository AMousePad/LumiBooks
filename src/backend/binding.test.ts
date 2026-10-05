import { expect, test } from "bun:test";
import { makeDefaultProfile } from "../shared";
import { summaryBindingRule, selectBindingBatch, countBindingBacklog, assertContiguousBinding, SummaryTimelineError } from "./binding";
import type { LMBEntry } from "./world-book";
const entries = (n: number) => Array.from({ length: n }, (_, i) => ({
 raw: { id: `c${i}`, content: "x".repeat(400), disabled: false },
 meta: { tier: 1, firstMsgIdx: i, tokenCountOutput: 24000 },
} as LMBEntry));
const rule = summaryBindingRule(makeDefaultProfile("p", "test"), 2);
for (const [n, backlog] of [[12, 0], [13, 1], [14, 1], [55, 8]] as const) {
 test(`${n} chapters with batch 6 and lag 7 yield ${backlog} arcs`, () => {
  expect(countBindingBacklog(entries(n), 1, rule)).toBe(backlog);
  expect(selectBindingBatch(entries(n), 1, rule).length).toBe(backlog ? 6 : 0);
 });
}
test("token binding measures content, excluding billed reasoning tokens", () => {
 const chapters = entries(8);
 expect(selectBindingBatch(chapters, 1, { unit: "tokens", batch: 600, lag: 200 })).toHaveLength(6);
 expect(selectBindingBatch(chapters, 1, { unit: "tokens", batch: 601, lag: 200 })).toHaveLength(0);
});
test("disabled sources and ghosts do not satisfy the threshold", () => {
 const chapters = entries(14);
 chapters[1]!.meta.ghost = true; chapters[2]!.raw.disabled = true;
 expect(selectBindingBatch(chapters, 1, rule)).toHaveLength(0);
});

test("rooted chapters satisfy entry and token thresholds while preserving the lag", () => {
 const chapters = entries(13);
 for (const chapter of chapters.slice(0, 4)) chapter.meta.isRoot = true;
 expect(selectBindingBatch(chapters, 1, rule).map((e) => e.raw.id)).toEqual(["c0", "c1", "c2", "c3", "c4", "c5"]);
 expect(countBindingBacklog(chapters, 1, rule)).toBe(1);
 expect(selectBindingBatch(chapters, 1, { unit: "tokens", batch: 600, lag: 700 }).map((e) => e.raw.id))
  .toEqual(["c0", "c1", "c2", "c3", "c4", "c5"]);
});

test("a closed older segment compacts by itself instead of borrowing newer chapters", () => {
 const timeline = entries(7);
 timeline[0]!.meta.tier = 3; timeline[3]!.meta.tier = 2;
 for (const chapter of timeline.slice(1, 3)) chapter.meta.isRoot = true;
 for (const unit of ["entries", "tokens"] as const) {
  const config = { unit, batch: unit === "entries" ? 6 : 600, lag: 700 };
  expect(selectBindingBatch(timeline, 1, config).map((e) => e.raw.id)).toEqual(["c1", "c2"]);
  expect(countBindingBacklog(timeline, 1, config)).toBe(1);
 }
 expect(selectBindingBatch(timeline, 1, { unit: "manual", batch: 6, lag: 7 })).toEqual([]);
 expect(selectBindingBatch(timeline, 1, { unit: "manual", batch: 6, lag: 7 }, true).map((e) => e.raw.id)).toEqual(["c1", "c2"]);
 expect(() => assertContiguousBinding(timeline, [timeline[1]!, timeline[4]!])).toThrow(SummaryTimelineError);
 expect(() => assertContiguousBinding(timeline, [timeline[4]!, timeline[6]!])).toThrow(SummaryTimelineError);
});

test("a closed segment finishes its short remainder without changing the open tail lag", () => {
 const timeline = entries(18);
 timeline[8]!.meta.tier = 2;
 const config = { unit: "entries" as const, batch: 6, lag: 7 };
 expect(countBindingBacklog(timeline, 1, config)).toBe(2);
 const first = selectBindingBatch(timeline, 1, config);
 expect(first.map((e) => e.raw.id)).toEqual(["c0", "c1", "c2", "c3", "c4", "c5"]);
 const remaining = timeline.filter((e) => !first.includes(e));
 expect(selectBindingBatch(remaining, 1, config).map((e) => e.raw.id)).toEqual(["c6", "c7"]);
 expect(selectBindingBatch(timeline.slice(9), 1, config)).toEqual([]);
 expect(selectBindingBatch(entries(13), 1, config, true)).toEqual([]);
});

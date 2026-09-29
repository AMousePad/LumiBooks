import { expect, test } from "bun:test";
import { makeDefaultProfile } from "../shared";
import { arcBindingRule, selectBindingBatch, countBindingBacklog } from "./binding";
import type { LMBEntry } from "./world-book";
const entries = (n: number) => Array.from({ length: n }, (_, i) => ({
 raw: { id: `c${i}`, content: "x".repeat(400), disabled: false },
 meta: { tier: 1, firstMsgIdx: i, tokenCountOutput: 24000 },
} as LMBEntry));
const rule = arcBindingRule(makeDefaultProfile("p", "test"));
for (const [n, backlog] of [[12, 0], [13, 1], [14, 1], [55, 8]] as const) {
 test(`${n} chapters with batch 6 and lag 7 yield ${backlog} arcs`, () => {
  expect(countBindingBacklog(entries(n), rule)).toBe(backlog);
  expect(selectBindingBatch(entries(n), rule).length).toBe(backlog ? 6 : 0);
 });
}
test("token binding measures content, excluding billed reasoning tokens", () => {
 const chapters = entries(8);
 expect(selectBindingBatch(chapters, { unit: "tokens", batch: 600, lag: 200 })).toHaveLength(6);
 expect(selectBindingBatch(chapters, { unit: "tokens", batch: 601, lag: 200 })).toHaveLength(0);
});
test("roots, disabled sources, and ghosts do not satisfy the threshold", () => {
 const chapters = entries(15);
 chapters[0]!.meta.isRoot = true; chapters[1]!.meta.ghost = true; chapters[2]!.raw.disabled = true;
 expect(selectBindingBatch(chapters, rule)).toHaveLength(0);
});

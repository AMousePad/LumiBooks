import { approximateTokensFromChars, type LMBProfile } from "../shared";
import type { LMBEntry } from "./world-book";

export interface BindingRule { unit: "entries" | "tokens" | "manual"; batch: number; lag: number }
export function arcBindingRule(profile: LMBProfile): BindingRule {
  return { unit: profile.arcTrigger === "chapters" ? "entries" : profile.arcTrigger,
    batch: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
    lag: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters };
}
/** Callers supply active entries only. Roots and ghosts never enter automation. */
export function selectBindingBatch(entries: LMBEntry[], rule: BindingRule): LMBEntry[] {
  if (rule.unit === "manual") return [];
  const ordered = entries.filter((e) => !e.meta.isRoot && !e.meta.ghost && !e.raw.disabled)
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const size = (e: LMBEntry) => rule.unit === "tokens" ? approximateTokensFromChars(e.raw.content.length) : 1;
  let cutoff = ordered.length, reserved = 0;
  while (cutoff > 0 && reserved < rule.lag) reserved += size(ordered[--cutoff]!);
  const selected: LMBEntry[] = [];
  let count = 0;
  for (const entry of ordered.slice(0, cutoff)) {
    selected.push(entry);
    count += size(entry);
    if (count >= Math.max(1, rule.batch)) return selected;
  }
  return [];
}
export function countBindingBacklog(entries: LMBEntry[], rule: BindingRule): number {
  let remaining = entries, count = 0;
  for (;;) {
    const batch = selectBindingBatch(remaining, rule);
    if (!batch.length) return count;
    const used = new Set(batch.map((e) => e.raw.id));
    remaining = remaining.filter((e) => !used.has(e.raw.id));
    count++;
  }
}

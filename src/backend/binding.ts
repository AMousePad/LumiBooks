import { approximateTokensFromChars, type LMBProfile, type SummaryTier } from "../shared";
import type { LMBEntry } from "./world-book";

export interface BindingRule { unit: "entries" | "tokens" | "manual"; batch: number; lag: number }
export function summaryBindingRule(profile: LMBProfile, tier: Exclude<SummaryTier, 1>): BindingRule {
  if (tier === 2) return { unit: profile.arcTrigger === "chapters" ? "entries" : profile.arcTrigger,
    batch: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
    lag: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters };
  return profile.higherTiers[tier];
}
/** Active entries from every tier preserve the boundaries between summary runs. */
export function summaryRuns(entries: LMBEntry[], tier: SummaryTier): { entries: LMBEntry[]; closed: boolean }[] {
  const ordered = entries.filter((e) => !e.meta.ghost && !e.raw.disabled)
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const runs: { entries: LMBEntry[]; closed: boolean }[] = [];
  let current: LMBEntry[] = [];
  for (const entry of ordered) {
    if (entry.meta.tier === tier) current.push(entry);
    else if (current.length) {
      runs.push({ entries: current, closed: entry.meta.tier > tier });
      current = [];
    }
  }
  if (current.length) runs.push({ entries: current, closed: false });
  return runs;
}

export class SummaryTimelineError extends Error {
  constructor() {
    super("Select consecutive summaries without crossing another summary tier");
    this.name = "SummaryTimelineError";
  }
}

export function assertContiguousBinding(entries: LMBEntry[], selected: LMBEntry[]): void {
  if (!selected.length) throw new SummaryTimelineError();
  const ids = new Set(selected.map((e) => e.raw.id));
  for (const run of summaryRuns(entries, selected[0]!.meta.tier)) {
    const positions = run.entries.flatMap((e, i) => ids.has(e.raw.id) ? [i] : []);
    if (positions.length === selected.length && positions.at(-1)! - positions[0]! + 1 === selected.length) return;
  }
  throw new SummaryTimelineError();
}

export function selectBindingBatch(entries: LMBEntry[], tier: SummaryTier, rule: BindingRule, closedOnly = false): LMBEntry[] {
  if (rule.unit === "manual" && !closedOnly) return [];
  const runs = summaryRuns(entries, tier);
  const ordered = runs.flatMap((run) => run.entries);
  const size = (e: LMBEntry) => rule.unit === "tokens" ? approximateTokensFromChars(e.raw.content.length) : 1;
  let cutoff = ordered.length, reserved = 0;
  while (cutoff > 0 && reserved < rule.lag) reserved += size(ordered[--cutoff]!);
  const eligible = new Set(ordered.slice(0, cutoff).map((e) => e.raw.id));
  for (const run of runs) {
    if (closedOnly && !run.closed) continue;
    const selected: LMBEntry[] = [];
    let count = 0;
    for (const entry of run.entries) {
      if (!run.closed && !eligible.has(entry.raw.id)) break;
      selected.push(entry);
      count += size(entry);
      if (count >= Math.max(1, rule.batch)) return selected;
    }
    // A higher tier closes this older segment, so its remainder cannot wait
    // for newer sources or borrow them across the intervening summary.
    if (run.closed) return selected;
  }
  return [];
}
export function countBindingBacklog(entries: LMBEntry[], tier: SummaryTier, rule: BindingRule): number {
  let remaining = entries, count = 0;
  for (;;) {
    const batch = selectBindingBatch(remaining, tier, rule);
    if (!batch.length) return count;
    const used = new Set(batch.map((e) => e.raw.id));
    remaining = remaining.filter((e) => !used.has(e.raw.id));
    count++;
  }
}

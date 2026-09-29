export interface CodexTidyTarget {
  unit: "tokens" | "percent";
  /** Percentage is the size to keep, not the amount to remove. */
  value: number;
}

export function resolveTidyTarget(currentTokens: number, target: CodexTidyTarget): { limit: number; modelTarget: number } {
  if (!target || !["tokens", "percent"].includes(target.unit) || !Number.isFinite(target.value) || target.value <= 0
    || (target.unit === "percent" && target.value >= 100)) {
    throw new Error("Enter a positive token limit or a percentage between 0 and 100.");
  }
  const limit = Math.floor(target.unit === "percent" ? currentTokens * target.value / 100 : target.value);
  if (limit < 1) throw new Error("The target must be at least one token.");
  return { limit, modelTarget: Math.max(1, Math.floor(limit * 0.9)) };
}

import { CODEX_FILE_KEYS, type CodexFileKey } from "../../shared";

export const CODEX_FULL_PERCENT = 85;
const NEVER_CUT_LARGEST = 6;

export interface CodexRecordStat {
  /** Agent runs that changed this record's text. */
  updates: number;
  /** Run that first produced it; 0 predates tracking. */
  born: number;
}

export interface CutCandidate {
  id: string;
  file: CodexFileKey;
  tokens: number;
  updates: number;
  born: number;
  /** Position in the rendered codex, for records with equal history. */
  index: number;
}

export type CodexTokenLimits = Readonly<Record<CodexFileKey, number>>;

/** Over a category limit, drop the least updated then oldest, sparing its largest six. */
export function selectCodexCuts(items: readonly CutCandidate[], limits: CodexTokenLimits): Set<string> {
  const cuts = new Set<string>();
  for (const file of CODEX_FILE_KEYS) {
    const limit = limits[file];
    if (limit <= 0) continue;
    const group = items.filter((item) => item.file === file);
    let total = group.reduce((sum, item) => sum + item.tokens, 0);
    if (total <= limit) continue;
    const spared = new Set([...group].sort((a, b) => b.tokens - a.tokens || b.index - a.index).slice(0, NEVER_CUT_LARGEST));
    const order = group.filter((item) => !spared.has(item))
      .sort((a, b) => a.updates - b.updates || a.born - b.born || a.index - b.index);
    for (const item of order) {
      if (total <= limit) break;
      cuts.add(item.id);
      total -= item.tokens;
    }
  }
  return cuts;
}

export interface CodexFullness {
  file: CodexFileKey;
  percent: number;
}

export function codexFullness(tokens: Partial<Record<CodexFileKey, number>>, limits: CodexTokenLimits): CodexFullness[] {
  const out: CodexFullness[] = [];
  for (const file of CODEX_FILE_KEYS) {
    const limit = limits[file];
    const used = tokens[file] ?? 0;
    if (limit <= 0 || used * 100 <= limit * CODEX_FULL_PERCENT) continue;
    out.push({ file, percent: Math.round((used * 100) / limit) });
  }
  return out;
}

export function advanceRecordStats(
  stats: Readonly<Record<string, CodexRecordStat>>,
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
  run: number,
): Record<string, CodexRecordStat> {
  const next: Record<string, CodexRecordStat> = {};
  for (const [record, content] of after) {
    const known = stats[record];
    if (!before.has(record)) next[record] = known ?? { updates: 0, born: run };
    else next[record] = { updates: (known?.updates ?? 0) + (before.get(record) === content ? 0 : 1), born: known?.born ?? 0 };
  }
  return next;
}

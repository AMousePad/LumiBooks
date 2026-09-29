declare const spindle: import("lumiverse-spindle-types").SpindleAPI;
import { approximateTokensFromChars } from "../../shared";
import { CODEX_FILE_KEYS, type CodexBundle, type CodexFileKey } from "./schema";
import { renderCodexFileSections, renderCodexRecords } from "./prompt";
import type { CodexFileState } from "./store";

export interface CodexTokenCounts {
  files: Record<string, number>;
  constant: number;
  approximate: boolean;
}

/** Count saved prose with the story model's tokenizer, never generation usage. */
export async function countCodexText(text: string, userId: string): Promise<{ tokens: number; approximate: boolean }> {
  if (!text) return { tokens: 0, approximate: false };
  try {
    const result = await spindle.tokens.countText(text, { modelSource: "main", userId });
    if (!Number.isFinite(result.total_tokens) || result.total_tokens < 0) throw new Error("Invalid token count");
    return { tokens: result.total_tokens, approximate: result.approximate };
  } catch {
    return { tokens: approximateTokensFromChars(text.length), approximate: true };
  }
}

/** File sizes describe the saved bible; constant cost describes actual lorebook records. */
export async function measureCodexTokens(
  bundle: CodexBundle, userId: string, fileStates: Partial<Record<CodexFileKey, CodexFileState>> = {}, forceConstant = false,
): Promise<CodexTokenCounts> {
  const sections = renderCodexFileSections(bundle);
  const counts: CodexTokenCounts = { files: {}, constant: 0, approximate: false };
  for (const key of CODEX_FILE_KEYS) {
    const count = await countCodexText(sections[key], userId);
    counts.files[key] = count.tokens;
    counts.approximate ||= count.approximate;
  }
  const disabledFiles = new Set(CODEX_FILE_KEYS.filter((k) => fileStates[k] === "noInject" || fileStates[k] === "frozen"));
  const records = renderCodexRecords(bundle, { includeRelations: !disabledFiles.has("relations"), disabledFiles });
  for (const record of records) {
    if (disabledFiles.has(record.file) || record.disabled || !(forceConstant || record.constant)) continue;
    const count = await countCodexText(record.content, userId);
    counts.constant += count.tokens;
    counts.approximate ||= count.approximate;
  }
  return counts;
}

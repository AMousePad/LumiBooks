import type { BuiltInPreset } from "../types";
import { fillPrompt } from "../prompts/fill";
import targetDirectiveTxt from "../prompts/books/target-directive.txt";
import chapterSummaryTxt from "../prompts/books/chapter-summary.txt";
import chapterSummarizeTxt from "../prompts/books/chapter-summarize.txt";
import chapterSynopsisTxt from "../prompts/books/chapter-synopsis.txt";
import chapterMinimalTxt from "../prompts/books/chapter-minimal.txt";
import arcDefaultTxt from "../prompts/books/arc-default.txt";
import volumeDefaultTxt from "../prompts/books/volume-default.txt";
import { CODEX_DIRECTIVES_DEFAULT } from "../prompts/codex/registry";

/** The shared target-budget sentence is spliced in at load so it has one
 * source; the {{target_*}} holes inside it survive for prompt-time fill. */
function withTargetDirective(template: string): string {
  return fillPrompt(template, { TARGET_DIRECTIVE: targetDirectiveTxt });
}

export const BUILTIN_CHAPTER_PRESETS: BuiltInPreset[] = [
  { key: "summary", displayName: "Summary", prompt: withTargetDirective(chapterSummaryTxt) },
  { key: "summarize", displayName: "Summarize", prompt: withTargetDirective(chapterSummarizeTxt) },
  { key: "synopsis", displayName: "Synopsis", prompt: withTargetDirective(chapterSynopsisTxt) },
  { key: "minimal", displayName: "Minimal", prompt: withTargetDirective(chapterMinimalTxt) },
];

export const BUILTIN_ARC_PRESETS: BuiltInPreset[] = [
  { key: "arc_default", displayName: "Arc", prompt: withTargetDirective(arcDefaultTxt) },
];

export const BUILTIN_VOLUME_PRESETS: BuiltInPreset[] = [
  { key: "volume_default", displayName: "Volume", prompt: withTargetDirective(volumeDefaultTxt) },
];

/** The codex directives block rides the same preset system as the books
 * prompts: built-in default, custom "codex" presets, picked per profile. */
export const BUILTIN_CODEX_PRESETS: BuiltInPreset[] = [
  { key: "codex_default", displayName: "Default", prompt: CODEX_DIRECTIVES_DEFAULT },
];

export function findBuiltInPreset(category: "chapter" | "arc" | "volume" | "codex", key: string): BuiltInPreset | null {
  const pool = category === "arc"
    ? BUILTIN_ARC_PRESETS
    : category === "volume"
      ? BUILTIN_VOLUME_PRESETS
      : category === "codex"
        ? BUILTIN_CODEX_PRESETS
        : BUILTIN_CHAPTER_PRESETS;
  return pool.find((p) => p.key === key) ?? null;
}

export interface ImportedPresetMap {
  chapter: { key: string; displayName: string; prompt: string }[];
  arc: { key: string; displayName: string; prompt: string }[];
}

export function parseStmbPresetExport(raw: unknown, category: "chapter" | "arc"): ImportedPresetMap[keyof ImportedPresetMap] {
  const out: { key: string; displayName: string; prompt: string }[] = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const overrides = (raw as { overrides?: unknown }).overrides;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return out;
  for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const node = v as { displayName?: unknown; prompt?: unknown };
    if (typeof node.prompt !== "string" || !node.prompt.trim()) continue;
    const key = sanitizeKey(`${category}_${k}`);
    const displayName = typeof node.displayName === "string" && node.displayName.trim()
      ? node.displayName
      : k;
    out.push({ key, displayName, prompt: node.prompt });
  }
  return out;
}

function sanitizeKey(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  if (cleaned) return cleaned;
  return `preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

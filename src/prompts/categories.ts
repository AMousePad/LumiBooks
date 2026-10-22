import { EXTRA_PRESET_CATEGORIES, MODEL_TIER_NAMES, TIER_KINDS, TIER_NAMES, type CustomPreset, type ExtraPresetCategory, type HigherTier, type LMBProfile, type PresetCategory } from "../shared";
import type { BuiltInPreset, FrontendState } from "../types";

type PresetPools = Pick<FrontendState, "chapterPresets" | "arcPresets" | "volumePresets" | "codexPresets">;
const KEY_FIELDS = { chapter: "chapterPresetKey", arc: "arcPresetKey", volume: "volumePresetKey", codex: "codexPresetKey" } as const;

export function isExtraCategory(category: PresetCategory): category is ExtraPresetCategory {
  return (EXTRA_PRESET_CATEGORIES as readonly string[]).includes(category);
}

export function presetKeyFor(profile: LMBProfile, category: PresetCategory): string {
  return isExtraCategory(category) ? profile.higherTierPresetKeys[category] ?? "" : profile[KEY_FIELDS[category]];
}

export function presetKeyPatch(category: PresetCategory, key: string): Partial<LMBProfile> {
  return isExtraCategory(category) ? { higherTierPresetKeys: { [category]: key } } : { [KEY_FIELDS[category]]: key };
}

export function higherTierPreset(text: string, tier: HigherTier): string {
  // One pass avoids replacing a source Volume again when producing a Series.
  return text.replace(/\b(volumes?|arcs?)\b/gi, (word) => {
    const source = word.toLowerCase().startsWith("arc");
    const name = MODEL_TIER_NAMES[tier - (source ? 2 : 1)]!;
    const plural = word.toLowerCase().endsWith("s");
    const replacement = name + (plural && name !== "Series" ? (name === "Library" ? "" : "s") : "");
    const result = plural && name === "Library" ? "Libraries" : replacement;
    return word === word.toUpperCase() ? result.toUpperCase() : result;
  });
}

export function builtInPresetsFor(pools: PresetPools, category: PresetCategory): BuiltInPreset[] {
  if (!isExtraCategory(category)) return pools[`${category}Presets`];
  const index = TIER_KINDS.indexOf(category);
  return [{ key: `${category}_default`, displayName: TIER_NAMES[index]!,
    prompt: higherTierPreset(pools.volumePresets[0]!.prompt, (index + 1) as HigherTier) }];
}

export function resolvePresetText(profile: LMBProfile, customs: CustomPreset[], pools: PresetPools, category: PresetCategory): string {
  const key = presetKeyFor(profile, category);
  if (isExtraCategory(category) && !key) {
    return higherTierPreset(resolvePresetText(profile, customs, pools, "volume"), (TIER_KINDS.indexOf(category) + 1) as HigherTier);
  }
  const custom = customs.find((p) => p.key === key && p.category === category);
  if (custom) return custom.prompt;
  const builtIns = builtInPresetsFor(pools, category);
  return (builtIns.find((p) => p.key === key) ?? builtIns[0])?.prompt ?? "";
}

import { t as tr } from "./i18n";
import { isCodexTemplateKey, type CodexTemplateKey } from "./prompts/codex/registry";
import { normalizeActivationMode, type ActivationMode } from "./activation";

export const EXTENSION_ID = "lumi_books" as const;
export const EXTENSION_KEY = "lumibooks" as const;

export type CodexFileKey =
  | "characters"
  | "locations"
  | "things"
  | "relations"
  | "timeline"
  | "threads"
  | "world"
  | "knowledge";

export const CODEX_FILE_KEYS: readonly CodexFileKey[] = [
  "characters",
  "locations",
  "things",
  "relations",
  "timeline",
  "threads",
  "world",
  "knowledge",
] as const;
export const CODEX_TOKEN_LIMIT_DEFAULT = 10000;
export const WORLD_BOOK_NAME_PREFIX = "LumiBooks" as const;
/** Marker for lorebook entries synced from codex records. Distinct from
 * EXTENSION_KEY on purpose: summary entries are host-disabled and re-injected
 * by our interceptor, codex entries ride the host's own keyword activation. */
export const CODEX_ENTRY_EXTENSION_KEY = "lumibooks_codex" as const;
/** v4: codexThorough + codexExtraContext flipped on once; v5: codexWindowValue
 * 30 -> 20 for message windows still on the old default; v6: codexUseTools
 * flipped off once (strict JSON is the default, tool calls are opt-in);
 * v7: codexDirectivesOverride became a custom "codex" preset + codexPresetKey. */
export const STORAGE_VERSION = 7 as const;
export const SETTINGS_PATH = "settings.json" as const;
export const CHAT_STATE_DIR = "chats" as const;

export type CodexWriteMode = "batch" | "sequential";

export type CompressionUnit = "messages" | "tokens";
export type CompressionTargetUnit = "percent" | "tokens";
export type SummaryTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type HigherTier = 3 | 4 | 5 | 6 | 7;
export type SummaryKind = "chapter" | "arc" | "volume" | "series" | "saga" | "library" | "universe";
export const TIER_KINDS = ["chapter", "arc", "volume", "series", "saga", "library", "universe"] as const;
// Fixed English names are part of the model prompt format. UI labels are separate.
export const MODEL_TIER_NAMES = ["Chapter", "Arc", "Volume", "Series", "Saga", "Library", "Universe"] as const;
export const TIER_NAMES = [tr("shared.tierNames.chapter"), tr("shared.tierNames.arc"), tr("shared.tierNames.volume"), tr("shared.tierNames.series"), tr("shared.tierNames.saga"), tr("shared.tierNames.library"), tr("shared.tierNames.universe")] as const;
export const HIGHER_TIERS = [3, 4, 5, 6, 7] as const;
export interface HigherTierSettings {
  enabled: boolean;
  unit: "entries" | "tokens";
  batch: number;
  lag: number;
  targetUnit: CompressionTargetUnit;
  targetPercent: number;
  targetTokens: number;
}
export function defaultHigherTiers(): Record<HigherTier, HigherTierSettings> {
  return Object.fromEntries(HIGHER_TIERS.map((tier) => [tier, {
    enabled: false, unit: "entries", batch: 6, lag: 2,
    targetUnit: "percent", targetPercent: 25, targetTokens: 3000,
  }])) as Record<HigherTier, HigherTierSettings>;
}
function normalizeHigherTiers(raw: unknown): Record<HigherTier, HigherTierSettings> {
  const out = defaultHigherTiers();
  const values = raw && typeof raw === "object" ? raw as Record<number, Partial<HigherTierSettings>> : {};
  for (const tier of HIGHER_TIERS) {
    const v = values[tier];
    if (!v || typeof v !== "object") continue;
    out[tier] = { enabled: v.enabled === true, unit: v.unit === "tokens" ? "tokens" : "entries",
      batch: clampInt(v.batch, v.unit === "tokens" ? 100 : 2, v.unit === "tokens" ? 1000000 : 100, out[tier].batch),
      lag: clampInt(v.lag, 0, v.unit === "tokens" ? 1000000 : 100, out[tier].lag),
      targetUnit: v.targetUnit === "tokens" ? "tokens" : "percent",
      targetPercent: clampInt(v.targetPercent, 5, 95, 25), targetTokens: clampInt(v.targetTokens, 50, 1000000, 3000) };
  }
  return out;
}
export function tierHeader(tier: SummaryTier, number: number, sources: number, turns: number): string {
  const sourceName = MODEL_TIER_NAMES[tier - 2]?.toLowerCase() ?? "message";
  const sourceLabel = sources === 1 || sourceName === "series" ? sourceName
    : sourceName === "library" ? "libraries" : `${sourceName}s`;
  return `${MODEL_TIER_NAMES[tier - 1]} ${ordinal(number)} (${sources} ${sourceLabel}, ${turns} turns)`;
}

export type ArcTriggerMode = "chapters" | "tokens" | "manual";

export interface SamplerSet {
  temperature: number | null;
  top_p: number | null;
  top_k: number | null;
  max_tokens: number | null;
  max_input_tokens: number | null;
  frequency_penalty: number | null;
  presence_penalty: number | null;
}

export interface LMBProfile {
  id: string;
  name: string;
  lagUnit: CompressionUnit;
  lagValue: number;
  windowUnit: CompressionUnit;
  windowValue: number;
  chapterTargetUnit: CompressionTargetUnit;
  chapterTargetPercent: number;
  chapterTargetTokens: number;
  arcTargetUnit: CompressionTargetUnit;
  arcTargetPercent: number;
  arcTargetTokens: number;
  volumeTargetUnit: CompressionTargetUnit;
  volumeTargetPercent: number;
  volumeTargetTokens: number;
  arcTrigger: ArcTriggerMode;
  arcAfterChapters: number;
  arcAfterTokens: number;
  arcLagChapters: number;
  arcLagTokens: number;
  chapterPresetKey: string;
  arcPresetKey: string;
  volumePresetKey: string;
  /** Unset higher categories keep using the Volume preset. */
  higherTierPresetKeys: Partial<Record<ExtraPresetCategory, string>>;
  promptRoles: Partial<Record<PresetCategory, PromptRole>>;
  previousMemoriesCount: number;
  regexOutgoingScriptIds: string[];
  regexIncomingScriptIds: string[];
  connectionId: string | null;
  samplers: SamplerSet;
  autoCreate: boolean;
  autoCreateChapter: boolean;
  autoCreateArc: boolean;
  higherTiers: Record<HigherTier, HigherTierSettings>;
  hideCoveredMessages: boolean;
  showMemoryPreviews: boolean;
  retryCount: number;
  shortCommentRulesOverride: string | null;
  memoriaPersonaOverride: string | null;
  ttftTimeoutSecs: number;
  codexEnabled: boolean;
  /** Codex only runs when you ask it to: no automatic pass after a generation. */
  codexManualOnly: boolean;
  codexLagUnit: CompressionUnit;
  codexLagValue: number;
  codexWindowUnit: CompressionUnit;
  codexWindowValue: number;
  /** Message-unit windows also fire at this many tokens, whichever first. */
  codexTokenBreakpoint: number;
  /** How the activated-lore canon reference is budgeted: a share of the codex
   * max input, or a flat token cap. */
  codexLoreLimitUnit: CompressionTargetUnit;
  /** Percent of the codex max input the lore reference may use. */
  codexLoreLimitPercent: number;
  /** Flat token cap for the lore reference; 0 = no limit. */
  codexLoreLimitTokens: number;
  /** Chapter summaries extra-context mode hands the agent as story-so-far. */
  codexStorySoFarCount: number;
  codexRelationsTable: boolean;
  codexActivationMode: ActivationMode | "vector_only";
  codexInjectionPosition: "lorebook" | "depth" | "after_history";
  codexInjectionDepth: number;
  codexThorough: boolean;
  codexConnectionId: string | null;
  codexExtraContext: boolean;
  /** Sampler overrides for codex agent calls; null fields fall back to
   * CODEX_SAMPLER_DEFAULTS on the wire, mirroring `samplers`. */
  codexSamplers: SamplerSet;
  /** Structured tool calls for the codex agent, opt-in. Off (the default)
   * uses strict JSON output, which every provider route can carry. */
  codexUseTools: boolean;
  /** How the agent is ASKED to deliver an update. Every record must be written
   * or skipped before it may finish either way; this only sets whether the
   * prompt asks for one record per reply or the whole update at once. */
  codexWriteMode: CodexWriteMode;
  /** The codex prompt preset, mirroring chapterPresetKey: built-in or custom
   * "codex" category preset. The preset carries the directives text plus any
   * per-template overrides, so switching it swaps the whole prompt set. */
  codexPresetKey: string;
  /** Per-category token cap on injected Codex entries; 0 means no limit. */
  codexTokenLimits: Record<CodexFileKey, number>;
  /** Context relief lowers a profile once, then this keeps it from compounding. */
  contextReliefApplied: boolean;
  /** Max context when relief applied; a different max context clears the flag. */
  contextReliefMaxContext: number | null;
  /** Values Cache Friendly mode replaced, restored when it turns off. */
  cacheFriendlySnapshot?: Partial<LMBProfile>;
}

export type PresetCategory = SummaryKind | "codex";
export type ExtraPresetCategory = Exclude<SummaryKind, "chapter" | "arc" | "volume">;
export type PromptRole = "system" | "assistant" | "user";
export const EXTRA_PRESET_CATEGORIES = ["series", "saga", "library", "universe"] as const;
export const PRESET_CATEGORIES = [...TIER_KINDS, "codex"] as const;

export function promptRoleFor(profile: LMBProfile, category: PresetCategory): PromptRole {
  return profile.promptRoles[category] ?? "system";
}

export interface CustomPreset {
  key: string;
  displayName: string;
  prompt: string;
  category: PresetCategory;
  createdAt: number;
  /** Codex presets only: per-template overrides riding with the directives,
   * so one preset is the complete codex prompt set. Absent key = built-in. */
  templates?: Partial<Record<CodexTemplateKey, string>>;
}

export interface LMBSettings {
  version: number;
  enabled: boolean;
  profiles: LMBProfile[];
  activeProfileId: string;
  customPresets: CustomPreset[];
  debugLog: boolean;
  localLogsDisabled: boolean;
  summaryActivationMode: ActivationMode;
  followChatNames: boolean;
  showAutomationToasts: boolean;
  /** "Don't show again" for the tool-calling fallback modal. */
  suppressToolCallingPrompt: boolean;
  /** Permanently lower the active profile when a prompt nears the context limit. */
  contextRelief: boolean;
  cacheFriendly: boolean;
  /** Summary recall mode to restore when Cache Friendly mode turns off. */
  cacheFriendlySummaryMode: ActivationMode | null;
}

export interface LMBEntryMeta {
  /** Chapter, Arc, Volume, Series, Saga, Library, Universe (1 through 7). */
  tier: SummaryTier;
  chatId: string;
  msgIds: string[];
  /** Ids of the tier below: chapter ids on an arc, arc ids on a volume. */
  sourceChapterEntryIds?: string[];
  firstMsgIdx?: number;
  lastMsgIdx?: number;
  tokenCountInput: number;
  tokenCountOutput: number;
  model: string;
  connectionId: string;
  createdAt: number;
  supersededByEntryId?: string | null;
  title?: string;
  shortComment?: string;
  presetKey?: string;
  sceneNumber?: number;
  rawOutput?: string;
  isRoot?: boolean;
  rootOrigin?: string;
  /** Chapter generated ahead of the injection lag: stored disabled, feeds the
   * codex agent as context, promoted to a real chapter when the lag arrives. */
  ghost?: boolean;
  /** Per-message content signatures (ghosts only), for staleness detection. */
  msgSigs?: string[];
}

export const DEFAULT_SAMPLERS: SamplerSet = {
  temperature: null,
  top_p: null,
  top_k: null,
  max_tokens: null,
  max_input_tokens: null,
  frequency_penalty: null,
  presence_penalty: null,
};

export const SAMPLER_DEFAULTS: Readonly<Record<keyof SamplerSet, number>> = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 32000,
  max_input_tokens: 128000,
  frequency_penalty: 0,
  presence_penalty: 0,
};

/** Wire fallbacks for codex agent calls. The codex re-reads the whole codex
 * plus a story chunk per pass and rewrites whole files, so both budgets run
 * far past the summarizer's. */
export const CODEX_SAMPLER_DEFAULTS: Readonly<Record<keyof SamplerSet, number>> = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 65536,
  max_input_tokens: 500000,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export function makeDefaultProfile(id: string, name: string): LMBProfile {
  return {
    id,
    name,
    lagUnit: "messages",
    lagValue: 40,
    windowUnit: "messages",
    windowValue: 20,
    chapterTargetUnit: "percent",
    chapterTargetPercent: 15,
    chapterTargetTokens: 800,
    arcTargetUnit: "percent",
    arcTargetPercent: 20,
    arcTargetTokens: 1500,
    volumeTargetUnit: "percent",
    volumeTargetPercent: 25,
    volumeTargetTokens: 3000,
    arcTrigger: "chapters",
    arcAfterChapters: 6,
    arcAfterTokens: 8000,
    arcLagChapters: 7,
    arcLagTokens: 2000,
    chapterPresetKey: "summary",
    arcPresetKey: "arc_default",
    volumePresetKey: "volume_default",
    higherTierPresetKeys: {},
    promptRoles: {},
    previousMemoriesCount: 7,
    regexOutgoingScriptIds: [],
    regexIncomingScriptIds: [],
    connectionId: null,
    samplers: { ...DEFAULT_SAMPLERS },
    autoCreate: true,
    autoCreateChapter: true,
    autoCreateArc: true,
    higherTiers: defaultHigherTiers(),
    hideCoveredMessages: true,
    showMemoryPreviews: false,
    retryCount: 3,
    shortCommentRulesOverride: null,
    memoriaPersonaOverride: null,
    ttftTimeoutSecs: 60,
    codexEnabled: true,
    codexManualOnly: false,
    codexLagUnit: "messages",
    codexLagValue: 6,
    codexWindowUnit: "messages",
    codexWindowValue: 20,
    codexTokenBreakpoint: 100000,
    codexLoreLimitUnit: "percent",
    codexLoreLimitPercent: 25,
    codexLoreLimitTokens: 25000,
    codexStorySoFarCount: 5,
    codexRelationsTable: true,
    codexActivationMode: "keywords",
    codexInjectionPosition: "lorebook",
    codexInjectionDepth: 4,
    codexThorough: true,
    codexConnectionId: null,
    codexExtraContext: true,
    codexSamplers: { ...DEFAULT_SAMPLERS },
    codexUseTools: false,
    codexWriteMode: "batch",
    codexPresetKey: "codex_default",
    codexTokenLimits: defaultCodexTokenLimits(),
    contextReliefApplied: false,
    contextReliefMaxContext: null,
  };
}

export const DEFAULT_SETTINGS: LMBSettings = {
  version: STORAGE_VERSION,
  enabled: true,
  profiles: [makeDefaultProfile("default", tr("shared.defaultSettings.default"))],
  activeProfileId: "default",
  customPresets: [],
  debugLog: false,
  localLogsDisabled: false,
  summaryActivationMode: "always",
  followChatNames: true,
  showAutomationToasts: true,
  suppressToolCallingPrompt: false,
  contextRelief: true,
  cacheFriendly: false,
  cacheFriendlySummaryMode: null,
};

export function diskVersionFor(raw: Partial<LMBSettings> | null | undefined): number {
  const v = raw && typeof raw === "object" ? raw : {};
  return typeof v.version === "number" ? v.version : 1;
}

export function normalizeSettings(raw: Partial<LMBSettings> | null | undefined): LMBSettings {
  const fallback = DEFAULT_SETTINGS;
  const v = raw && typeof raw === "object" ? raw : {};
  const cacheFriendly = v.cacheFriendly === true;
  const profilesRaw = Array.isArray(v.profiles) ? v.profiles : fallback.profiles;
  const profiles = profilesRaw
    .map((p): LMBProfile | null => normalizeProfile(p))
    .filter((p): p is LMBProfile => !!p)
    .map((p) => cacheFriendly ? applyCacheFriendly(p) : p);
  if (profiles.length === 0) {
    const profile = makeDefaultProfile("default", tr("shared.normalizeSettings.default"));
    profiles.push(cacheFriendly ? applyCacheFriendly(profile) : profile);
  }
  const activeProfileId =
    typeof v.activeProfileId === "string" && profiles.some((p) => p.id === v.activeProfileId)
      ? v.activeProfileId
      : profiles[0]!.id;
  const customPresets = Array.isArray(v.customPresets)
    ? v.customPresets.map(normalizeCustomPreset).filter((p): p is CustomPreset => !!p)
    : [];
  return {
    version: STORAGE_VERSION,
    enabled: typeof v.enabled === "boolean" ? v.enabled : fallback.enabled,
    profiles,
    activeProfileId,
    customPresets,
    debugLog: typeof v.debugLog === "boolean" ? v.debugLog : fallback.debugLog,
    localLogsDisabled: typeof v.localLogsDisabled === "boolean" ? v.localLogsDisabled : fallback.localLogsDisabled,
    summaryActivationMode: cacheFriendly ? "always" : normalizeActivationMode(v.summaryActivationMode,
      (v as { forceConstantEntries?: boolean }).forceConstantEntries === false ? "keywords" : "always"),
    followChatNames: v.followChatNames !== false,
    showAutomationToasts: typeof v.showAutomationToasts === "boolean" ? v.showAutomationToasts : fallback.showAutomationToasts,
    suppressToolCallingPrompt: typeof v.suppressToolCallingPrompt === "boolean" ? v.suppressToolCallingPrompt : fallback.suppressToolCallingPrompt,
    contextRelief: v.contextRelief !== false,
    cacheFriendly,
    cacheFriendlySummaryMode: v.cacheFriendlySummaryMode === null || v.cacheFriendlySummaryMode === undefined
      ? null : normalizeActivationMode(v.cacheFriendlySummaryMode, "always"),
  };
}

/** Hand-run actions that can change the sent prompt, so the mode asks first. */
export const CACHE_BREAKING_ACTIONS: ReadonlySet<string> = new Set([
  "create_chapter", "create_chapter_range", "create_all_chapters", "create_arc", "create_arc_from", "create_all_arcs",
  "create_higher_from", "create_higher_auto", "create_volume_from", "retry_last_failure", "delete_entry", "release_entry",
  "regenerate_entry", "update_entry", "rebase_root", "rebuild_root", "detach_root",
  "codex_update_now", "codex_reset", "codex_rebuild", "codex_tidy", "codex_repair_references", "codex_rebuild_files",
  "codex_refresh", "codex_restore", "codex_undo", "codex_adopt", "summary_import",
]);

/** Categories Cache Friendly mode stops generating and injecting. */
export const CACHE_FRIENDLY_FROZEN_FILES: readonly CodexFileKey[] = ["timeline", "threads"];
export const cacheFriendlyFileLocked = (file: CodexFileKey): boolean => CACHE_FRIENDLY_FROZEN_FILES.includes(file) || file === "relations";

function defaultCodexTokenLimits(): Record<CodexFileKey, number> {
  return Object.fromEntries(CODEX_FILE_KEYS.map((key) => [key, CODEX_TOKEN_LIMIT_DEFAULT])) as Record<CodexFileKey, number>;
}

function normalizeCodexTokenLimits(raw: unknown): Record<CodexFileKey, number> {
  const limits = defaultCodexTokenLimits();
  if (!raw || typeof raw !== "object") return limits;
  for (const key of CODEX_FILE_KEYS) limits[key] = clampInt((raw as Record<string, unknown>)[key], 0, 1000000, limits[key]);
  return limits;
}

const CACHE_FRIENDLY_FORCED_KEYS = [
  "autoCreate", "autoCreateChapter", "showMemoryPreviews", "codexManualOnly", "codexExtraContext",
  "codexRelationsTable", "codexActivationMode", "codexInjectionPosition", "codexWindowUnit", "codexWindowValue",
  "codexLagUnit", "codexLagValue",
] as const satisfies readonly (keyof LMBProfile)[];

/** Every load and save passes here, so forced values cannot drift while the mode is on. */
export function applyCacheFriendly(profile: LMBProfile): LMBProfile {
  return {
    ...profile,
    autoCreate: true,
    autoCreateChapter: true,
    showMemoryPreviews: false,
    codexManualOnly: false,
    codexExtraContext: true,
    codexRelationsTable: false,
    codexActivationMode: "always",
    codexInjectionPosition: "lorebook",
    codexWindowUnit: profile.windowUnit,
    codexWindowValue: profile.windowValue,
    codexLagUnit: profile.lagUnit,
    codexLagValue: profile.lagValue,
  };
}

export function enterCacheFriendly(profile: LMBProfile): LMBProfile {
  const cacheFriendlySnapshot = Object.fromEntries(CACHE_FRIENDLY_FORCED_KEYS.map((key) => [key, profile[key]])) as Partial<LMBProfile>;
  return applyCacheFriendly({ ...profile, cacheFriendlySnapshot });
}

/** A profile created during the mode has no snapshot and falls back to defaults. */
export function leaveCacheFriendly(profile: LMBProfile): LMBProfile {
  const { cacheFriendlySnapshot, ...rest } = profile;
  const source: Partial<LMBProfile> = cacheFriendlySnapshot ?? makeDefaultProfile(profile.id, profile.name);
  // Older snapshots also hold codexEnabled, which the user now controls.
  return { ...rest, ...Object.fromEntries(CACHE_FRIENDLY_FORCED_KEYS.map((key) => [key, source[key]])) as Partial<LMBProfile> };
}

export const CONTEXT_RELIEF_THRESHOLD = 0.9;
const CONTEXT_RELIEF_LAG = 0.7;
const CONTEXT_RELIEF_TARGET = 0.67;
const shrink = (value: number, factor: number, floor = 0) => value <= floor ? value : Math.max(floor, Math.round(value * factor));

export function applyContextRelief(profile: LMBProfile): LMBProfile {
  const lag = (value: number) => shrink(value, CONTEXT_RELIEF_LAG);
  const percent = (value: number, floor: number) => shrink(value, CONTEXT_RELIEF_TARGET, floor);
  const tokens = (value: number) => shrink(value, CONTEXT_RELIEF_TARGET, 50);
  const relieved: LMBProfile = {
    ...profile,
    contextReliefApplied: true,
    lagValue: lag(profile.lagValue),
    arcLagChapters: lag(profile.arcLagChapters),
    arcLagTokens: lag(profile.arcLagTokens),
    chapterTargetPercent: percent(profile.chapterTargetPercent, 2),
    chapterTargetTokens: tokens(profile.chapterTargetTokens),
    arcTargetPercent: percent(profile.arcTargetPercent, 5),
    arcTargetTokens: tokens(profile.arcTargetTokens),
    volumeTargetPercent: percent(profile.volumeTargetPercent, 5),
    volumeTargetTokens: tokens(profile.volumeTargetTokens),
    higherTiers: Object.fromEntries(HIGHER_TIERS.map((tier) => {
      const value = profile.higherTiers[tier];
      return [tier, { ...value, lag: lag(value.lag), targetPercent: percent(value.targetPercent, 5), targetTokens: tokens(value.targetTokens) }];
    })) as LMBProfile["higherTiers"],
    codexTokenLimits: Object.fromEntries(CODEX_FILE_KEYS.map((key) => [key, shrink(profile.codexTokenLimits[key], CONTEXT_RELIEF_TARGET)])) as LMBProfile["codexTokenLimits"],
  };
  return profile.cacheFriendlySnapshot ? applyCacheFriendly(relieved) : relieved;
}

export function normalizeProfile(raw: unknown): LMBProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<LMBProfile>;
  const id = typeof v.id === "string" && v.id.trim() ? v.id : null;
  if (!id) return null;
  const base = makeDefaultProfile(id, typeof v.name === "string" && v.name.trim() ? v.name : tr("shared.base.untitled"));
  return {
    ...base,
    lagUnit: v.lagUnit === "tokens" ? "tokens" : "messages",
    lagValue: clampInt(v.lagValue, 0, v.lagUnit === "tokens" ? 1000000 : 100000, base.lagValue),
    windowUnit: v.windowUnit === "tokens" ? "tokens" : "messages",
    windowValue: clampInt(v.windowValue, 1, v.windowUnit === "tokens" ? 1000000 : 100000, base.windowValue),
    chapterTargetUnit: v.chapterTargetUnit === "tokens" ? "tokens" : "percent",
    chapterTargetPercent: clampInt(v.chapterTargetPercent, 2, 90, base.chapterTargetPercent),
    chapterTargetTokens: clampInt(v.chapterTargetTokens, 50, 1000000, base.chapterTargetTokens),
    arcTargetUnit: v.arcTargetUnit === "tokens" ? "tokens" : "percent",
    arcTargetPercent: clampInt(v.arcTargetPercent, 5, 95, base.arcTargetPercent),
    arcTargetTokens: clampInt(v.arcTargetTokens, 50, 1000000, base.arcTargetTokens),
    volumeTargetUnit: v.volumeTargetUnit === "tokens" ? "tokens" : "percent",
    volumeTargetPercent: clampInt(v.volumeTargetPercent, 5, 95, base.volumeTargetPercent),
    volumeTargetTokens: clampInt(v.volumeTargetTokens, 50, 1000000, base.volumeTargetTokens),
    arcTrigger: v.arcTrigger === "tokens" || v.arcTrigger === "manual" ? v.arcTrigger : "chapters",
    arcAfterChapters: clampInt(v.arcAfterChapters, 2, 100, base.arcAfterChapters),
    arcAfterTokens: clampInt(v.arcAfterTokens, 500, 200000, base.arcAfterTokens),
    arcLagChapters: clampInt(v.arcLagChapters, 0, 100, base.arcLagChapters),
    arcLagTokens: clampInt(v.arcLagTokens, 0, 200000, base.arcLagTokens),
    chapterPresetKey: typeof v.chapterPresetKey === "string" && v.chapterPresetKey.trim() ? v.chapterPresetKey : base.chapterPresetKey,
    arcPresetKey: typeof v.arcPresetKey === "string" && v.arcPresetKey.trim() ? v.arcPresetKey : base.arcPresetKey,
    volumePresetKey: typeof v.volumePresetKey === "string" && v.volumePresetKey.trim() ? v.volumePresetKey : base.volumePresetKey,
    higherTierPresetKeys: Object.fromEntries(EXTRA_PRESET_CATEGORIES.flatMap((category) => {
      const key = v.higherTierPresetKeys?.[category];
      return typeof key === "string" && key.trim() ? [[category, key]] : [];
    })),
    promptRoles: Object.fromEntries(PRESET_CATEGORIES.flatMap((category) => {
      const role = v.promptRoles?.[category];
      return role === "system" || role === "assistant" || role === "user" ? [[category, role]] : [];
    })),
    previousMemoriesCount: clampInt(v.previousMemoriesCount, 0, 20, base.previousMemoriesCount),
    regexOutgoingScriptIds: Array.isArray(v.regexOutgoingScriptIds)
      ? v.regexOutgoingScriptIds.filter((x): x is string => typeof x === "string")
      : base.regexOutgoingScriptIds,
    regexIncomingScriptIds: Array.isArray(v.regexIncomingScriptIds)
      ? v.regexIncomingScriptIds.filter((x): x is string => typeof x === "string")
      : base.regexIncomingScriptIds,
    connectionId: typeof v.connectionId === "string" && v.connectionId.trim() ? v.connectionId : null,
    samplers: normalizeSamplers(v.samplers),
    autoCreate: typeof v.autoCreate === "boolean" ? v.autoCreate : base.autoCreate,
    autoCreateChapter: typeof v.autoCreateChapter === "boolean" ? v.autoCreateChapter : base.autoCreateChapter,
    higherTiers: normalizeHigherTiers(v.higherTiers),
    autoCreateArc: typeof v.autoCreateArc === "boolean" ? v.autoCreateArc : base.autoCreateArc,
    hideCoveredMessages: typeof v.hideCoveredMessages === "boolean" ? v.hideCoveredMessages : base.hideCoveredMessages,
    showMemoryPreviews: typeof v.showMemoryPreviews === "boolean" ? v.showMemoryPreviews : base.showMemoryPreviews,
    retryCount: clampInt(v.retryCount, 0, 10, base.retryCount),
    shortCommentRulesOverride:
      typeof v.shortCommentRulesOverride === "string" && v.shortCommentRulesOverride.trim() !== ""
        ? v.shortCommentRulesOverride
        : null,
    memoriaPersonaOverride:
      typeof v.memoriaPersonaOverride === "string" && v.memoriaPersonaOverride.trim() !== ""
        ? v.memoriaPersonaOverride
        : null,
    ttftTimeoutSecs: clampInt(v.ttftTimeoutSecs, 10, 600, base.ttftTimeoutSecs),
    codexEnabled: typeof v.codexEnabled === "boolean" ? v.codexEnabled : base.codexEnabled,
    codexManualOnly: typeof v.codexManualOnly === "boolean" ? v.codexManualOnly : base.codexManualOnly,
    codexLagUnit: v.codexLagUnit === "tokens" ? "tokens" : "messages",
    codexLagValue: clampInt(v.codexLagValue, 0, v.codexLagUnit === "tokens" ? 1000000 : 100000, base.codexLagValue),
    codexWindowUnit: v.codexWindowUnit === "tokens" ? "tokens" : "messages",
    codexWindowValue: clampInt(v.codexWindowValue, 1, v.codexWindowUnit === "tokens" ? 1000000 : 100000, base.codexWindowValue),
    codexTokenBreakpoint: clampInt(v.codexTokenBreakpoint, 1000, 1000000, base.codexTokenBreakpoint),
    codexLoreLimitUnit: v.codexLoreLimitUnit === "tokens" ? "tokens" : "percent",
    codexLoreLimitPercent: clampInt(v.codexLoreLimitPercent, 1, 100, base.codexLoreLimitPercent),
    codexLoreLimitTokens: clampInt(v.codexLoreLimitTokens, 0, 1000000, base.codexLoreLimitTokens),
    codexStorySoFarCount: clampInt(v.codexStorySoFarCount, 0, 50, base.codexStorySoFarCount),
    codexActivationMode: v.codexActivationMode === "vector_only" ? "vector_only" : normalizeActivationMode(v.codexActivationMode,
      (v as { codexForceConstant?: boolean }).codexForceConstant === true ? "always" : "keywords"),
    codexInjectionPosition: v.codexInjectionPosition === "depth" || v.codexInjectionPosition === "after_history" ? v.codexInjectionPosition : "lorebook",
    codexInjectionDepth: clampInt(v.codexInjectionDepth, 0, 10000, base.codexInjectionDepth),
    codexRelationsTable: typeof v.codexRelationsTable === "boolean" ? v.codexRelationsTable : base.codexRelationsTable,
    codexThorough: typeof v.codexThorough === "boolean" ? v.codexThorough : base.codexThorough,
    codexConnectionId: typeof v.codexConnectionId === "string" && v.codexConnectionId.trim() ? v.codexConnectionId : null,
    codexExtraContext: typeof v.codexExtraContext === "boolean" ? v.codexExtraContext : base.codexExtraContext,
    codexSamplers: normalizeSamplers(v.codexSamplers),
    codexUseTools: typeof v.codexUseTools === "boolean" ? v.codexUseTools : base.codexUseTools,
    codexWriteMode: v.codexWriteMode === "sequential" ? "sequential" : "batch",
    codexPresetKey: typeof v.codexPresetKey === "string" && v.codexPresetKey.trim() ? v.codexPresetKey : base.codexPresetKey,
    codexTokenLimits: normalizeCodexTokenLimits(v.codexTokenLimits),
    contextReliefApplied: v.contextReliefApplied === true,
    contextReliefMaxContext: typeof v.contextReliefMaxContext === "number" && v.contextReliefMaxContext > 0 ? v.contextReliefMaxContext : null,
    ...(v.cacheFriendlySnapshot && typeof v.cacheFriendlySnapshot === "object" ? { cacheFriendlySnapshot: v.cacheFriendlySnapshot } : {}),
  };
}

function normalizeCodexTemplates(raw: unknown): Partial<Record<CodexTemplateKey, string>> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Partial<Record<CodexTemplateKey, string>> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (isCodexTemplateKey(k) && typeof v === "string" && v.trim()) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function normalizeSamplers(raw: unknown): SamplerSet {
  const v = raw && typeof raw === "object" ? (raw as Partial<SamplerSet>) : {};
  return {
    temperature: numOrNull(v.temperature, 0, 2),
    top_p: numOrNull(v.top_p, 0, 1),
    top_k: numOrNull(v.top_k, 0, 1000),
    max_tokens: numOrNull(v.max_tokens, 1, 1000000),
    max_input_tokens: numOrNull(v.max_input_tokens, 256, 4000000),
    frequency_penalty: numOrNull(v.frequency_penalty, -2, 2),
    presence_penalty: numOrNull(v.presence_penalty, -2, 2),
  };
}

export function normalizeCustomPreset(raw: unknown): CustomPreset | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<CustomPreset>;
  if (typeof v.key !== "string" || !v.key.trim()) return null;
  if (typeof v.prompt !== "string" || !v.prompt.trim()) return null;
  const category: PresetCategory =
    PRESET_CATEGORIES.includes(v.category as PresetCategory) ? v.category! : "chapter";
  const templates = category === "codex" ? normalizeCodexTemplates(v.templates) : undefined;
  return {
    key: v.key,
    displayName: typeof v.displayName === "string" && v.displayName.trim() ? v.displayName : v.key,
    prompt: v.prompt,
    category,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
    ...(templates ? { templates } : {}),
  };
}

export function normalizeEntryMeta(raw: unknown): LMBEntryMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<LMBEntryMeta>;
  const tier = Number.isInteger(v.tier) && Number(v.tier) >= 1 && Number(v.tier) <= 7 ? v.tier as SummaryTier : null;
  if (!tier) return null;
  if (typeof v.chatId !== "string" || !v.chatId.trim()) return null;
  const msgIds = Array.isArray(v.msgIds) ? v.msgIds.filter((x): x is string => typeof x === "string") : [];
  return {
    tier,
    chatId: v.chatId,
    msgIds,
    sourceChapterEntryIds: Array.isArray(v.sourceChapterEntryIds)
      ? v.sourceChapterEntryIds.filter((x): x is string => typeof x === "string")
      : undefined,
    firstMsgIdx: typeof v.firstMsgIdx === "number" ? v.firstMsgIdx : undefined,
    lastMsgIdx: typeof v.lastMsgIdx === "number" ? v.lastMsgIdx : undefined,
    tokenCountInput: typeof v.tokenCountInput === "number" ? v.tokenCountInput : 0,
    tokenCountOutput: typeof v.tokenCountOutput === "number" ? v.tokenCountOutput : 0,
    model: typeof v.model === "string" ? v.model : "",
    connectionId: typeof v.connectionId === "string" ? v.connectionId : "",
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
    supersededByEntryId:
      typeof v.supersededByEntryId === "string" && v.supersededByEntryId.trim() ? v.supersededByEntryId : null,
    title: typeof v.title === "string" ? v.title : undefined,
    shortComment: typeof v.shortComment === "string" ? v.shortComment : undefined,
    presetKey: typeof v.presetKey === "string" ? v.presetKey : undefined,
    sceneNumber:
      typeof v.sceneNumber === "number" && Number.isFinite(v.sceneNumber) && v.sceneNumber > 0
        ? Math.floor(v.sceneNumber)
        : undefined,
    rawOutput: typeof v.rawOutput === "string" ? v.rawOutput : undefined,
    isRoot: v.isRoot === true ? true : undefined,
    rootOrigin: typeof v.rootOrigin === "string" && v.rootOrigin.trim() ? v.rootOrigin : undefined,
    ghost: v.ghost === true ? true : undefined,
    msgSigs: Array.isArray(v.msgSigs) ? v.msgSigs.filter((x): x is string => typeof x === "string") : undefined,
  };
}

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  const n = Math.round(v);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function numOrNull(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v < min || v > max) return null;
  return v;
}

export function approximateTokensFromChars(chars: number): number {
  return Math.ceil(chars / 4);
}

export function ordinal(n: number): string {
  if (!Number.isFinite(n) || n < 1) return String(n);
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export function buildChapterHeader(sceneNumber: number, turnCount: number): string {
  return `${ordinal(sceneNumber)} Summary Chapter Containing ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}

export function buildArcHeader(sceneNumber: number, chapterCount: number, turnCount: number): string {
  return `${ordinal(sceneNumber)} Summary ARC Containing ${chapterCount} Prior Chapter${chapterCount === 1 ? "" : "s"} and ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}

export function buildVolumeHeader(sceneNumber: number, arcCount: number, turnCount: number): string {
  return `${ordinal(sceneNumber)} Summary VOLUME Containing ${arcCount} Prior Arc${arcCount === 1 ? "" : "s"} and ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}

export function bookNameFor(chatName: string | null | undefined, chatId: string, characterName?: string): string {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  const character = characterName?.trim().slice(0, 60);
  return `${WORLD_BOOK_NAME_PREFIX} - ${character ? `${character} - ` : ""}${suffix}`;
}

/** The Codex has a separate editable lorebook from the summary shelf. */
export function codexBookNameFor(chatName: string | null | undefined, chatId: string, characterName?: string): string {
  const cleanName = (chatName ?? "").trim();
  const character = characterName?.trim().slice(0, 60);
  const suffix = `${character ? `${character} - ` : ""}${cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8)}`;
  return tr("shared.codexBookNameFor.codexDoNotEdit", { worldBookNamePrefix: WORLD_BOOK_NAME_PREFIX, suffix: suffix });
}

/* ------------------------------------------------- Lessons from Memoria */

export const LESSONS_PATH = "lessons.json" as const;
/** Fixture chats use this prefix so they can never collide with a real chat. */
export const LESSON_CHAT_PREFIX = "lesson:" as const;

export type LessonCourseKey = "books" | "codex";
export type LessonStatus = "todo" | "in_progress" | "done";
export type LessonAnswer = "gold" | "silver" | "skip";
export type LessonGrade = "gilded" | "silver" | "bronze" | "apprentice";

export interface LessonCourseState {
  revision?: number;
  deliveryIds?: string[];
  status: LessonStatus;
  section: number;
  step: number;
  answers: Record<string, LessonAnswer>;
  attempts: number;
  bestWrong: number | null;
  lastWrong: number | null;
  /** Question count lastWrong was scored against (exam 10, course all). */
  lastTotal: number | null;
  grade: LessonGrade | null;
  startedAt: number | null;
  completedAt: number | null;
  signedName: string | null;
}

export interface LessonsState {
  version: 1;
  /** True when this install had no settings.json at first load: automation
   * starts held and the Course 1 finale flips it on. */
  freshInstall: boolean;
  /** The user skipped the Course 1 seal: the archive opens, and a reminder
   * sits on Home until the course is completed. */
  booksSealSkipped: boolean;
  /** The user skipped the Course 2 seal: the codex unlocks (the agent still
   * needs enabling in Tuning), and a reminder sits on Home until completion. */
  codexSealSkipped: boolean;
  books: LessonCourseState;
  codex: LessonCourseState;
}

export function emptyLessonCourse(): LessonCourseState {
  return {
    status: "todo",
    section: 0,
    step: 0,
    answers: {},
    attempts: 0,
    bestWrong: null,
    lastWrong: null,
    lastTotal: null,
    grade: null,
    startedAt: null,
    completedAt: null,
    signedName: null,
  };
}

export function makeDefaultLessons(freshInstall: boolean): LessonsState {
  return { version: 1, freshInstall, booksSealSkipped: false, codexSealSkipped: false, books: emptyLessonCourse(), codex: emptyLessonCourse() };
}

/** Fail-open state: a broken lessons file must never lock a working install. */
export function unlockedLessons(): LessonsState {
  const done = (): LessonCourseState => ({ ...emptyLessonCourse(), status: "done" });
  return { version: 1, freshInstall: false, booksSealSkipped: false, codexSealSkipped: false, books: done(), codex: done() };
}

/** The one codex gate check, shared by backend gating and UI locks: the
 * codex opens on graduation or an explicit seal skip. */
export function codexLessonGated(lessons: LessonsState): boolean {
  return lessons.codex.status !== "done" && !lessons.codexSealSkipped;
}

export function lessonGradeForWrong(wrong: number): LessonGrade {
  if (wrong <= 1) return "gilded";
  if (wrong <= 3) return "silver";
  if (wrong <= 6) return "bronze";
  return "apprentice";
}

export const LESSON_GRADE_LABEL: Readonly<Record<LessonGrade, string>> = {
  gilded: tr("shared.lessonGradeLabel.gilded"),
  silver: tr("shared.lessonGradeLabel.silver"),
  bronze: tr("shared.lessonGradeLabel.bronze"),
  apprentice: tr("shared.lessonGradeLabel.apprentice"),
};

function normalizeLessonAnswers(raw: unknown): Record<string, LessonAnswer> {
  const out: Record<string, LessonAnswer> = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === "gold" || v === "silver" || v === "skip") out[k] = v;
    }
  }
  return out;
}

export function normalizeLessonCourse(raw: unknown): LessonCourseState {
  const base = emptyLessonCourse();
  if (!raw || typeof raw !== "object") return base;
  const v = raw as Partial<LessonCourseState>;
  const status = v.status === "done" || v.status === "in_progress" ? v.status : "todo";
  const grade =
    v.grade === "gilded" || v.grade === "silver" || v.grade === "bronze" || v.grade === "apprentice" ? v.grade : null;
  return {
    status,
    revision: typeof v.revision === "number" && Number.isSafeInteger(v.revision) ? Math.max(0, v.revision) : 0,
    deliveryIds: Array.isArray(v.deliveryIds) ? v.deliveryIds.filter((id): id is string => typeof id === "string").slice(-128) : [],
    section: clampInt(v.section, 0, 100, 0),
    step: clampInt(v.step, 0, 1000, 0),
    answers: normalizeLessonAnswers(v.answers),
    attempts: clampInt(v.attempts, 0, 10000, 0),
    bestWrong: typeof v.bestWrong === "number" && Number.isFinite(v.bestWrong) ? v.bestWrong : null,
    lastWrong: typeof v.lastWrong === "number" && Number.isFinite(v.lastWrong) ? v.lastWrong : null,
    lastTotal: typeof v.lastTotal === "number" && Number.isFinite(v.lastTotal) && v.lastTotal > 0 ? Math.round(v.lastTotal) : null,
    grade,
    startedAt: typeof v.startedAt === "number" ? v.startedAt : null,
    completedAt: typeof v.completedAt === "number" ? v.completedAt : null,
    signedName: typeof v.signedName === "string" && v.signedName.trim() ? v.signedName.trim().slice(0, 60) : null,
  };
}

export function normalizeLessons(raw: unknown): LessonsState {
  const v = raw && typeof raw === "object" ? (raw as Partial<LessonsState>) : {};
  return {
    version: 1,
    freshInstall: v.freshInstall === true,
    booksSealSkipped: v.booksSealSkipped === true,
    codexSealSkipped: v.codexSealSkipped === true,
    books: normalizeLessonCourse(v.books),
    codex: normalizeLessonCourse(v.codex),
  };
}

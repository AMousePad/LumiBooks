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
export const WORLD_BOOK_NAME_PREFIX = "LumiBooks" as const;
/** Marker for lorebook entries synced from codex records. Distinct from
 * EXTENSION_KEY on purpose: summary entries are host-disabled and re-injected
 * by our interceptor, codex entries ride the host's own keyword activation. */
export const CODEX_ENTRY_EXTENSION_KEY = "lumibooks_codex" as const;
/** v4: codexThorough + codexExtraContext flipped on once; v5: codexWindowValue
 * 30 -> 20 for message windows still on the old default; v6: codexUseTools
 * flipped off once (strict JSON is the default, tool calls are opt-in). */
export const STORAGE_VERSION = 6 as const;
export const SETTINGS_PATH = "settings.json" as const;
export const CHAT_STATE_DIR = "chats" as const;

export type CompressionUnit = "messages" | "tokens";
export type CompressionTargetUnit = "percent" | "tokens";
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
  previousMemoriesCount: number;
  regexOutgoingScriptIds: string[];
  regexIncomingScriptIds: string[];
  connectionId: string | null;
  samplers: SamplerSet;
  autoCreate: boolean;
  autoCreateChapter: boolean;
  autoCreateArc: boolean;
  hideCoveredMessages: boolean;
  showMemoryPreviews: boolean;
  retryCount: number;
  shortCommentRulesOverride: string | null;
  memoriaPersonaOverride: string | null;
  ttftTimeoutSecs: number;
  codexEnabled: boolean;
  codexLagUnit: CompressionUnit;
  codexLagValue: number;
  codexWindowUnit: CompressionUnit;
  codexWindowValue: number;
  /** Message-unit windows also fire at this many tokens, whichever first. */
  codexTokenBreakpoint: number;
  codexRelationsTable: boolean;
  codexThorough: boolean;
  codexConnectionId: string | null;
  codexExtraContext: boolean;
  /** Sampler overrides for codex agent calls; null fields fall back to
   * CODEX_SAMPLER_DEFAULTS on the wire, mirroring `samplers`. */
  codexSamplers: SamplerSet;
  /** Structured tool calls for the codex agent, opt-in. Off (the default)
   * uses strict JSON output, which every provider route can carry. */
  codexUseTools: boolean;
  /** Replaces the codex system prompt's directive block (null = built-in).
   * Schema and write-protocol blocks stay fixed, they encode validation. */
  codexDirectivesOverride: string | null;
}

export interface CustomPreset {
  key: string;
  displayName: string;
  prompt: string;
  category: "chapter" | "arc" | "volume";
  createdAt: number;
}

export interface LMBSettings {
  version: number;
  enabled: boolean;
  profiles: LMBProfile[];
  activeProfileId: string;
  customPresets: CustomPreset[];
  debugLog: boolean;
  forceConstantEntries: boolean;
  showAutomationToasts: boolean;
  /** "Don't show again" for the tool-calling fallback modal. */
  suppressToolCallingPrompt: boolean;
}

export interface LMBEntryMeta {
  /** 1 = chapter, 2 = arc, 3 = volume. */
  tier: 1 | 2 | 3;
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

/** Wire fallbacks for codex agent calls. The codex re-reads the whole bible
 * plus a story chunk per pass and rewrites whole files, so both budgets run
 * far past the summarizer's. */
export const CODEX_SAMPLER_DEFAULTS: Readonly<Record<keyof SamplerSet, number>> = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 100000,
  max_input_tokens: 500000,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export function makeDefaultProfile(id: string, name: string): LMBProfile {
  return {
    id,
    name,
    lagUnit: "messages",
    lagValue: 65,
    windowUnit: "messages",
    windowValue: 18,
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
    previousMemoriesCount: 7,
    regexOutgoingScriptIds: [],
    regexIncomingScriptIds: [],
    connectionId: null,
    samplers: { ...DEFAULT_SAMPLERS },
    autoCreate: true,
    autoCreateChapter: true,
    autoCreateArc: true,
    hideCoveredMessages: true,
    showMemoryPreviews: false,
    retryCount: 3,
    shortCommentRulesOverride: null,
    memoriaPersonaOverride: null,
    ttftTimeoutSecs: 60,
    codexEnabled: true,
    codexLagUnit: "messages",
    codexLagValue: 6,
    codexWindowUnit: "messages",
    codexWindowValue: 20,
    codexTokenBreakpoint: 100000,
    codexRelationsTable: true,
    codexThorough: true,
    codexConnectionId: null,
    codexExtraContext: true,
    codexSamplers: { ...DEFAULT_SAMPLERS },
    codexUseTools: false,
    codexDirectivesOverride: null,
  };
}

export const DEFAULT_SETTINGS: LMBSettings = {
  version: STORAGE_VERSION,
  enabled: true,
  profiles: [makeDefaultProfile("default", "Default")],
  activeProfileId: "default",
  customPresets: [],
  debugLog: false,
  forceConstantEntries: true,
  showAutomationToasts: true,
  suppressToolCallingPrompt: false,
};

/** The codex system prompt's directive block, per-profile overridable; the
 * schema and protocol blocks after it stay fixed. */
export const DEFAULT_CODEX_DIRECTIVES = [
  "You are Memoria's archivist. You maintain the Knowledge Codex: a set of JSON files that together form a perfect snapshot of a roleplay story's PRESENT state. You will receive the current codex files and the newest story turns. Update the codex to reflect the story so far.",
  "",
  "Your three directives, in order:",
  "1. UPDATE - patch every record the new turns have outdated, and add what is new and durable.",
  "2. SWEEP - verify nothing stale survived anywhere in any file, not just where you edited. Stale information is forbidden: a claim the story has moved past must be corrected the moment you see it.",
  "3. COMPRESS - keep every record lean. Terse phrases beat sentences, no filler words.",
  "",
  "Snapshot rules (absolute):",
  "- The codex describes the present. When something changes, REPLACE the old text entirely.",
  "- Never leave edit residue: no \"was X, now Y\", no \"formerly\", no \"updated:\", no strikethrough hints, no references to previous versions of the codex.",
  "- Story history is not residue. Key past events belong in timeline.json, and a relation's \"history\" list may hold pivotal shifts as story facts. Everywhere else: present tense only.",
  "- Record only what is durable. Sheets and records hold stable, medium-to-long-lived facts. Skip anything that will change again within a scene or two: poses, moods, weather, transient scene staging, and verbatim dialogue unless a line is genuinely load-bearing.",
  "- One fact lives in ONE place. Never duplicate information across records or files: anything tying two or more entities together belongs in relations, not on their sheets, and world-level truths belong in world.json, not repeated on every sheet they touch. Tight separation of concerns keeps every future edit small.",
  "- Omit empty optional fields entirely.",
  "- Activated lore, when provided, is reference canon: use it for names, spellings, and established facts, but never copy it into the codex. The codex records only what the STORY establishes, changes, or contradicts.",
  "- A STORY SO FAR block, when provided, holds chapter summaries of turns already recorded in the codex. Use it to interpret the new turns, never as new material to add.",
].join("\n");

export function diskVersionFor(raw: Partial<LMBSettings> | null | undefined): number {
  const v = raw && typeof raw === "object" ? raw : {};
  return typeof v.version === "number" ? v.version : 1;
}

export function normalizeSettings(raw: Partial<LMBSettings> | null | undefined): LMBSettings {
  const fallback = DEFAULT_SETTINGS;
  const v = raw && typeof raw === "object" ? raw : {};
  const profilesRaw = Array.isArray(v.profiles) ? v.profiles : fallback.profiles;
  const profiles = profilesRaw
    .map((p): LMBProfile | null => normalizeProfile(p))
    .filter((p): p is LMBProfile => !!p);
  if (profiles.length === 0) profiles.push(makeDefaultProfile("default", "Default"));
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
    forceConstantEntries: typeof v.forceConstantEntries === "boolean" ? v.forceConstantEntries : fallback.forceConstantEntries,
    showAutomationToasts: typeof v.showAutomationToasts === "boolean" ? v.showAutomationToasts : fallback.showAutomationToasts,
    suppressToolCallingPrompt: typeof v.suppressToolCallingPrompt === "boolean" ? v.suppressToolCallingPrompt : fallback.suppressToolCallingPrompt,
  };
}

export function normalizeProfile(raw: unknown): LMBProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<LMBProfile>;
  const id = typeof v.id === "string" && v.id.trim() ? v.id : null;
  if (!id) return null;
  const base = makeDefaultProfile(id, typeof v.name === "string" && v.name.trim() ? v.name : "Untitled");
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
    codexLagUnit: v.codexLagUnit === "tokens" ? "tokens" : "messages",
    codexLagValue: clampInt(v.codexLagValue, 0, v.codexLagUnit === "tokens" ? 1000000 : 100000, base.codexLagValue),
    codexWindowUnit: v.codexWindowUnit === "tokens" ? "tokens" : "messages",
    codexWindowValue: clampInt(v.codexWindowValue, 1, v.codexWindowUnit === "tokens" ? 1000000 : 100000, base.codexWindowValue),
    codexTokenBreakpoint: clampInt(v.codexTokenBreakpoint, 1000, 1000000, base.codexTokenBreakpoint),
    codexRelationsTable: typeof v.codexRelationsTable === "boolean" ? v.codexRelationsTable : base.codexRelationsTable,
    codexThorough: typeof v.codexThorough === "boolean" ? v.codexThorough : base.codexThorough,
    codexConnectionId: typeof v.codexConnectionId === "string" && v.codexConnectionId.trim() ? v.codexConnectionId : null,
    codexExtraContext: typeof v.codexExtraContext === "boolean" ? v.codexExtraContext : base.codexExtraContext,
    codexSamplers: normalizeSamplers(v.codexSamplers),
    codexUseTools: typeof v.codexUseTools === "boolean" ? v.codexUseTools : base.codexUseTools,
    codexDirectivesOverride:
      typeof v.codexDirectivesOverride === "string" && v.codexDirectivesOverride.trim() !== ""
        ? v.codexDirectivesOverride
        : null,
  };
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
  const category = v.category === "arc" ? "arc" : v.category === "volume" ? "volume" : "chapter";
  return {
    key: v.key,
    displayName: typeof v.displayName === "string" && v.displayName.trim() ? v.displayName : v.key,
    prompt: v.prompt,
    category,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
  };
}

export function normalizeEntryMeta(raw: unknown): LMBEntryMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<LMBEntryMeta>;
  const tier = v.tier === 3 ? 3 : v.tier === 2 ? 2 : v.tier === 1 ? 1 : null;
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

export function bookNameFor(chatName: string | null | undefined, chatId: string): string {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  return `${WORLD_BOOK_NAME_PREFIX} - ${suffix}`;
}

/** The codex mirror book: managed wholesale by sync, hence the loud name. */
export function codexBookNameFor(chatName: string | null | undefined, chatId: string): string {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  return `${WORLD_BOOK_NAME_PREFIX} Codex [Do Not Edit] - ${suffix}`;
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
  gilded: "Gilded",
  silver: "Silver",
  bronze: "Bronze",
  apprentice: "Apprentice",
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

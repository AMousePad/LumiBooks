import type {
  CustomPreset,
  LMBProfile,
  LMBSettings,
  LMBEntryMeta,
  LessonAnswer,
  LessonCourseKey,
  LessonCourseState,
  LessonGrade,
  LessonsState,
  SamplerSet,
} from "./shared";

export interface ChapterView {
  entryId: string;
  bookId: string;
  comment: string;
  content: string;
  meta: LMBEntryMeta;
  active: boolean;
  contentTokens: number;
  contentChars: number;
  sourceTokensInput: number;
  isRoot: boolean;
  isGhost: boolean;
}

export interface ArcView extends ChapterView {
  sourceChapterEntryIds: string[];
}

export interface RootSourceOption {
  chatId: string;
  chatName: string;
  entryCount: number;
}

export interface ConnectionOption {
  id: string;
  name: string;
  provider: string;
  model: string;
  isDefault: boolean;
  hasApiKey: boolean;
}

export interface CoverageStats {
  totalMessages: number;
  coveredMessages: number;
  uncoveredMessages: number;
  approxUncoveredTokens: number;
  lagSatisfied: boolean;
  windowAvailable: boolean;
}

export interface BusyEntry {
  kind: "chapter" | "arc" | "volume" | "codex";
  chatId: string;
  label: string;
  startedAt: number;
}

export interface FailureRecord {
  kind: "chapter" | "arc" | "volume";
  message: string;
  retriedTimes: number;
  at: number;
}

export interface MessageStub {
  id: string;
  role: "system" | "user" | "assistant";
  preview: string;
  charCount: number;
  approxTokens: number;
  hidden: boolean;
  covered: boolean;
  coveredByEntryId: string | null;
  indexInChat: number;
  excluded: boolean;
}

export interface BuiltInPreset {
  key: string;
  displayName: string;
  prompt: string;
}

export interface RegexScriptOption {
  id: string;
  name: string;
}

export interface PendingPreview {
  kind: "chapter" | "arc" | "volume";
  draftId: string;
  title: string;
  content: string;
  shortComment: string;
  sourceMessageIds: string[];
  /** Ids of the tier below: chapter ids for an arc preview, arc ids for a volume preview. */
  sourceChapterEntryIds?: string[];
  model: string;
  connectionId: string;
  tokenCountInput: number;
  tokenCountOutput: number;
  firstMsgIdx?: number;
  lastMsgIdx?: number;
  presetKey: string;
  replacesEntryId?: string;
}

export interface FrontendState {
  activeChatId: string | null;
  activeChatName: string | null;
  activeCharacterId: string | null;
  activeCharacterName: string | null;
  settings: LMBSettings;
  activeProfile: LMBProfile;
  chapters: ChapterView[];
  arcs: ArcView[];
  volumes: ArcView[];
  bookId: string | null;
  bookName: string | null;
  connections: ConnectionOption[];
  resolvedSidecarConnectionId: string | null;
  coverage: CoverageStats;
  busy: BusyEntry[];
  lastFailure: FailureRecord | null;
  messages: MessageStub[];
  chapterPresets: BuiltInPreset[];
  arcPresets: BuiltInPreset[];
  volumePresets: BuiltInPreset[];
  customPresets: CustomPreset[];
  regexScripts: RegexScriptOption[];
  pendingPreviews: PendingPreview[];
  backlogChapters: number;
  backlogArcs: number;
  rootOrigin: string | null;
  rootOriginName: string | null;
  rootEntryCount: number;
  availableRoots: RootSourceOption[];
  codexExists: boolean;
  codexBacklog: number;
  codexLastRunAt: number | null;
  /** Approx tokens of the constant codex entries (timeline + threads); the
   * keyword-retrieved records cost extra only when a scene activates them. */
  codexInjectedTokens: number;
  /** Per-file inject/update switches; absent key = "on". */
  codexFileStates: Record<string, "on" | "noInject" | "frozen">;
  /** Frozen files that missed at least one codex run since freezing. */
  codexStaleFiles: string[];
  /** Approx prompt tokens per codex file, priced on the rendered injection text. */
  codexFileTokens: Record<string, number>;
  /** Lessons from Memoria progress, account-wide. */
  lessons: LessonsState;
}

export type FrontendToBackend =
  | { type: "ready"; chatId?: string | null }
  | { type: "refresh"; chatId?: string | null }
  | { type: "save_settings"; patch: Partial<LMBSettings>; chatId?: string | null }
  | { type: "save_profile"; profile: Partial<LMBProfile> & { id: string }; chatId?: string | null }
  | { type: "save_samplers"; profileId: string; samplers: Partial<SamplerSet>; target?: "main" | "codex"; chatId?: string | null }
  | { type: "create_profile"; name: string; chatId?: string | null }
  | { type: "delete_profile"; profileId: string; chatId?: string | null }
  | { type: "set_active_profile"; profileId: string; chatId?: string | null }
  | { type: "create_chapter"; chatId: string }
  | { type: "create_chapter_range"; chatId: string; messageIds: string[] }
  | { type: "create_all_chapters"; chatId: string }
  | { type: "create_arc"; chatId: string }
  | { type: "create_arc_from"; chatId: string; chapterEntryIds: string[] }
  | { type: "create_all_arcs"; chatId: string }
  | { type: "create_volume_from"; chatId: string; arcEntryIds: string[] }
  | { type: "retry_last_failure"; chatId: string }
  | { type: "delete_entry"; chatId: string; entryId: string }
  | { type: "release_entry"; chatId: string; entryId: string }
  | { type: "regenerate_entry"; chatId: string; entryId: string }
  | { type: "update_entry"; chatId: string; entryId: string; patch: { content?: string; comment?: string } }
  | { type: "resync_hidden"; chatId: string }
  | { type: "resync_visibility"; chatId: string }
  | { type: "set_force_constant"; value: boolean; chatId?: string | null }
  | { type: "abort_busy"; chatId: string; kind: "chapter" | "arc" | "volume" | "codex" }
  | { type: "dry_run_chapter"; chatId: string }
  | { type: "dry_run_arc"; chatId: string }
  | { type: "dry_run_volume"; chatId: string }
  | { type: "ensure_book"; chatId: string }
  | { type: "import_preset"; raw: unknown; category: "chapter" | "arc"; chatId?: string | null }
  | { type: "save_custom_preset"; preset: CustomPreset; chatId?: string | null }
  | { type: "delete_custom_preset"; key: string; category: "chapter" | "arc" | "volume"; chatId?: string | null }
  | { type: "accept_preview"; draftId: string; chatId: string }
  | { type: "discard_preview"; draftId: string; chatId: string }
  | { type: "edit_preview"; draftId: string; chatId: string; patch: { title?: string; content?: string } }
  | { type: "rebase_root"; chatId: string; sourceChatId: string }
  | { type: "rebuild_root"; chatId: string; sourceChatId: string }
  | { type: "detach_root"; chatId: string }
  | { type: "set_message_excluded"; chatId: string; messageIds: string[]; excluded: boolean }
  | { type: "codex_update_now"; chatId: string }
  | { type: "codex_read"; chatId: string }
  | { type: "codex_write_file"; chatId: string; file: string; content: string; seq: number }
  | { type: "codex_reset"; chatId: string }
  | { type: "codex_rebuild"; chatId: string }
  | { type: "codex_tidy"; chatId: string; files?: string[] }
  | { type: "codex_set_file_state"; chatId: string; file: string; state: "on" | "noInject" | "frozen" }
  | { type: "wipe_books"; chatId: string }
  | { type: "rebuild_books"; chatId: string }
  | { type: "watch_stream"; chatId: string; kind: "chapter" | "arc" | "volume" | "codex"; on: boolean }
  | { type: "lesson_patch"; course: LessonCourseKey; patch: Partial<LessonCourseState>; chatId?: string | null }
  | {
      type: "lesson_complete";
      course: LessonCourseKey;
      wrong: number;
      total: number;
      grade: LessonGrade;
      signedName: string | null;
      answers?: Record<string, LessonAnswer>;
      chatId?: string | null;
    }
  | {
      type: "lesson_reset";
      course: LessonCourseKey;
      mode: "course" | "section";
      section?: number;
      answerIds?: string[];
      chatId?: string | null;
    }
  | { type: "lesson_seal_skip"; course?: LessonCourseKey; chatId?: string | null };

export interface DryRunMessage {
  role: "system" | "user";
  content: string;
}

export interface DryRunDiagnostic {
  message: string;
}

export type BackendToFrontend =
  | { type: "state"; state: FrontendState }
  | { type: "toast"; tone: "success" | "info" | "warn" | "error"; text: string }
  | { type: "busy"; entries: BusyEntry[] }
  | { type: "error"; text: string }
  | { type: "dry_run_result"; kind: "chapter" | "arc" | "volume"; messages: DryRunMessage[]; diagnostics: DryRunDiagnostic[] }
  | { type: "codex_files"; chatId: string; files: Record<string, string>; savedFile?: string; savedSeq?: number }
  | { type: "stream_text"; chatId: string; kind: "chapter" | "arc" | "volume" | "codex"; content: string; thinking: string; running: boolean };

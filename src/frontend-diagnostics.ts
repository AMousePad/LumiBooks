// Shared closed vocabulary: arbitrary DOM, errors and message payloads never cross it.
export const UI_KINDS = ["start", "stop", "view", "click", "change", "render", "error", "rejection", "resource", "send", "receive", "timeout", "overflow"] as const;
export const UI_VIEWS = ["startup", "home", "books", "codex", "tuning", "stuff", "lesson", "unknown"] as const;
export const UI_CODES = ["ok", "failed", "unknown", "TypeError", "ReferenceError", "RangeError", "SyntaxError", "AbortError", "TimeoutError", "Error", "state", "prompt", "closed", "stale", "button", "input", "select", "textarea", "image", "stylesheet"] as const;
export const UI_OPERATIONS = [
  "ready", "refresh", "prompt_breakdown", "regex_scripts_page", "save_settings", "save_profile", "save_samplers", "create_profile", "delete_profile", "set_active_profile",
  "create_chapter", "create_chapter_range", "create_all_chapters", "create_arc", "create_arc_from", "create_all_arcs", "create_higher_from", "create_higher_auto", "create_volume_from", "retry_last_failure",
  "delete_entry", "release_entry", "regenerate_entry", "update_entry", "resync_hidden", "resync_visibility", "set_summary_activation", "abort_busy",
  "dry_run_chapter", "dry_run_arc", "dry_run_volume", "dry_run_codex", "ensure_book", "import_preset", "save_custom_preset", "delete_custom_preset",
  "accept_preview", "discard_preview", "edit_preview", "rebase_root", "rebuild_root", "detach_root", "set_message_excluded",
  "codex_update_now", "codex_read", "codex_write_file", "codex_reset", "codex_rebuild", "codex_tidy", "codex_rebuild_files", "codex_clear_stale", "codex_refresh", "codex_set_file_state", "codex_backup", "codex_restore", "codex_undo", "codex_adopt",
  "summary_export", "summary_import", "summary_import_resolve", "wipe_books", "rebuild_books", "watch_stream",
  "lesson_patch", "lesson_complete", "lesson_reset", "lesson_seal_skip",
  "state", "state_loading", "state_error", "toast", "busy", "error", "dry_run_result", "codex_files", "codex_file_state_saved", "stream_text", "summary_transfer_status", "summary_export_data", "codex_backup_data", "codex_tools_hint",
  "subtab.profile", "subtab.settings", "subtab.prompts", "subtab.shelf", "subtab.compose", "subtab.continuity", "subtab.entities", "subtab.relations", "subtab.world", "subtab.secrets", "subtab.manage",
  "tuning.settings.books", "tuning.settings.codex", "tab.home", "tab.books", "tab.codex", "tab.tuning", "tab.stuff",
] as const;
export const UI_BATCH_LIMIT = 32;
export interface UiDiagnostic {
  kind: typeof UI_KINDS[number];
  view: typeof UI_VIEWS[number];
  code?: typeof UI_CODES[number];
  op?: typeof UI_OPERATIONS[number];
  count: number;
  first: number;
  last: number;
  /** Capability bits: 1 secure context, 2 randomUUID, 4 getRandomValues. */
  caps?: number;
  line?: number;
  column?: number;
}
export interface UiDiagnosticRow extends UiDiagnostic { chatId?: string }
function pick<T extends string>(v: unknown, values: readonly T[]): T | undefined {
  return typeof v === "string" && values.includes(v as T) ? v as T : undefined;
}
function integer(v: unknown, max = Number.MAX_SAFE_INTEGER): number | undefined {
  return typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max ? v : undefined;
}
export function projectUiDiagnostic(raw: unknown): UiDiagnostic | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const kind = pick(v.kind, UI_KINDS), view = pick(v.view, UI_VIEWS);
  if (!kind || !view) return null;
  const first = integer(v.first) ?? 0;
  return { kind, view, code: pick(v.code, UI_CODES), op: pick(v.op, UI_OPERATIONS),
    count: Math.max(1, integer(v.count, 1_000_000) ?? 1), first, last: Math.max(first, integer(v.last) ?? first),
    caps: integer(v.caps, 7), line: integer(v.line, 10_000_000), column: integer(v.column, 10_000_000) };
}

declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import { CODEX_FILE_KEYS, type CodexFileKey } from "../../shared";
import { describeError, warn } from "../runtime";
import { isCodexFileKey, validateCodexFile, type CodexFileValue } from "./schema";
import { loadCursor, readCodexFilesRaw, saveCodexFile, saveCursor, withCursorLock } from "./store";
import type { CodexCursor, CodexFileState } from "./store";

export const CODEX_BACKUP_KIND = "lumibooks.codex.backup";
export const CODEX_BACKUP_VERSION = 1;

export interface CodexBackup {
  kind: string;
  version: number;
  chatId: string;
  savedAt: number;
  files: Record<string, string>;
  fileStates: Record<string, CodexFileState>;
  relationsTableMode: boolean | null;
}

export async function buildCodexBackup(chatId: string, userId: string): Promise<CodexBackup> {
  const [files, cursor] = await Promise.all([
    readCodexFilesRaw(chatId, userId),
    loadCursor(chatId, userId),
  ]);
  return {
    kind: CODEX_BACKUP_KIND,
    version: CODEX_BACKUP_VERSION,
    chatId,
    savedAt: Date.now(),
    files,
    fileStates: cursor.fileStates,
    relationsTableMode: cursor.relationsTableMode,
  };
}

export interface ParsedBackup {
  values: { key: CodexFileKey; value: CodexFileValue }[];
  fileStates: Record<string, CodexFileState>;
  relationsTableMode: boolean | null;
}

/** All-or-nothing: a backup that fails any file leaves the codex untouched. */
export function parseCodexBackup(raw: unknown, fallbackRelationsTable: boolean): ParsedBackup | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "that file is not a codex backup" };
  const v = raw as Partial<CodexBackup>;
  if (v.kind !== CODEX_BACKUP_KIND) return { error: "that file is not a codex backup" };
  if (typeof v.version !== "number" || v.version > CODEX_BACKUP_VERSION) {
    return { error: `this backup was written by a newer LumiBooks (version ${String(v.version)})` };
  }
  if (!v.files || typeof v.files !== "object") return { error: "the backup has no codex files in it" };

  const relationsTableMode = typeof v.relationsTableMode === "boolean" ? v.relationsTableMode : null;
  const relationsTable = relationsTableMode ?? fallbackRelationsTable;
  const values: { key: CodexFileKey; value: CodexFileValue }[] = [];
  for (const key of CODEX_FILE_KEYS) {
    const rawText = (v.files as Record<string, unknown>)[key];
    if (typeof rawText !== "string") continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return { error: `${key}.json in the backup is not valid JSON` };
    }
    const result = validateCodexFile(key, parsed, { relationsTable });
    if (!result.ok) return { error: `${key}.json in the backup is invalid: ${result.errors[0]}` };
    values.push({ key, value: result.value });
  }
  if (values.length === 0) return { error: "the backup has no codex files in it" };

  const fileStates: Record<string, CodexFileState> = {};
  const rawStates = v.fileStates && typeof v.fileStates === "object" ? v.fileStates as Record<string, unknown> : {};
  for (const [key, state] of Object.entries(rawStates)) {
    if (!isCodexFileKey(key)) continue;
    if (state === "on" || state === "noInject" || state === "frozen") fileStates[key] = state;
  }
  return { values, fileStates, relationsTableMode };
}

const UNDO_DIR = "codex-undo" as const;

function undoPath(chatId: string): string {
  return `${UNDO_DIR}/${chatId}.json`;
}

export interface CodexUndoInfo {
  savedAt: number;
  reason: string;
}

/** The undo snapshot carries the whole cursor, unlike a user-facing backup.
 * Rolling back the files without it would leave the consumed-message marks
 * advanced, so the undone turns would never be read again. */
interface CodexUndoSnapshot extends CodexBackup, CodexUndoInfo {
  cursor?: CodexCursor;
}

/** Snapshot the codex before a run so a bad pass can be rolled back. Best
 * effort: a snapshot failure must never block the run it precedes. */
export async function snapshotCodexForUndo(chatId: string, userId: string, reason: string): Promise<void> {
  try {
    const backup = await buildCodexBackup(chatId, userId);
    const cursor = await loadCursor(chatId, userId).catch(() => null);
    const snap: CodexUndoSnapshot = { ...backup, reason, ...(cursor ? { cursor } : {}) };
    await spindle.userStorage.setJson(undoPath(chatId), snap, { indent: 0, userId });
  } catch (err) {
    warn(`codex undo snapshot failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
  }
}

export async function readCodexUndo(chatId: string, userId: string): Promise<CodexUndoSnapshot | null> {
  try {
    if (!(await spindle.userStorage.exists(undoPath(chatId), userId))) return null;
    const raw = await spindle.userStorage.getJson<unknown>(undoPath(chatId), { userId });
    if (!raw || typeof raw !== "object") return null;
    const v = raw as CodexUndoSnapshot;
    if (v.kind !== CODEX_BACKUP_KIND) return null;
    return v;
  } catch (err) {
    warn(`codex undo read failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    return null;
  }
}

export async function codexUndoInfo(chatId: string, userId: string): Promise<CodexUndoInfo | null> {
  const snap = await readCodexUndo(chatId, userId);
  if (!snap) return null;
  return { savedAt: snap.savedAt, reason: typeof snap.reason === "string" ? snap.reason : "update" };
}

export async function clearCodexUndo(chatId: string, userId: string): Promise<void> {
  await spindle.userStorage.delete(undoPath(chatId), userId).catch(() => {});
}

export async function applyCodexBackup(
  chatId: string,
  userId: string,
  parsed: ParsedBackup,
  /** Undo only: put consumption back exactly as it was. A user-facing restore
   * must not, or a backup from another chat would import its message marks. */
  restoreCursor?: CodexCursor,
): Promise<void> {
  for (const { key, value } of parsed.values) {
    await saveCodexFile(chatId, key, value, userId);
  }
  await withCursorLock(chatId, userId, async () => {
    const cur = restoreCursor ? { ...restoreCursor } : await loadCursor(chatId, userId);
    cur.fileStates = parsed.fileStates;
    if (parsed.relationsTableMode !== null) cur.relationsTableMode = parsed.relationsTableMode;
    cur.updatedAt = Date.now();
    await saveCursor(chatId, cur, userId);
  });
}

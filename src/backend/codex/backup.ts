import { CODEX_FILE_KEYS, type CodexFileKey } from "../../shared";
import { isCodexFileKey, validateCodexFile, type CodexFileValue } from "./schema";
import { loadCursor, readCodexFilesRaw, saveCodexFile, saveCursor, withCursorLock } from "./store";
import type { CodexFileState } from "./store";

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

export async function applyCodexBackup(chatId: string, userId: string, parsed: ParsedBackup): Promise<void> {
  for (const { key, value } of parsed.values) {
    await saveCodexFile(chatId, key, value, userId);
  }
  await withCursorLock(chatId, userId, async () => {
    const cur = await loadCursor(chatId, userId);
    cur.fileStates = parsed.fileStates;
    if (parsed.relationsTableMode !== null) cur.relationsTableMode = parsed.relationsTableMode;
    cur.updatedAt = Date.now();
    await saveCursor(chatId, cur, userId);
  });
}

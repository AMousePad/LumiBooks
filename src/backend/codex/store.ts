declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { CodexBundle, CodexFileKey, CodexFileValue, ValidateOptions } from "./schema";
import { CODEX_FILE_KEYS, emptyBundle, emptyCodexFile, validateCodexFile } from "./schema";
import { describeError, warn } from "../runtime";

const CODEX_DIR = "codex" as const;

/** Rolling window of consumed-message signatures kept for divergence detection.
 * Edits or deletions older than this window go unnoticed - acceptable, since a
 * snapshot codex heals on the next pass anyway. */
const SIG_CAP = 500;

export interface ConsumedSig {
  id: string;
  sig: string;
}

export interface CodexRunStats {
  rounds: number;
  promptTokens: number;
  completionTokens: number;
  model: string;
  note?: string;
}

/** Per-file lifecycle: "on" injects and updates, "noInject" keeps updating
 * but stays out of the prompt, "frozen" neither injects nor updates. */
export type CodexFileState = "on" | "noInject" | "frozen";

export interface CodexCursor {
  version: 1;
  /** Id of the last consumed chat message, null before the first run. */
  lastMsgId: string | null;
  consumedSigs: ConsumedSig[];
  /** Per-file inject/update switches; absent key = "on". */
  fileStates: Record<string, CodexFileState>;
  /** cursor.runs at the moment a file was frozen: any run after that makes
   * the frozen file stale, which prompts a rebuild offer on re-enable. */
  frozenAtRuns: Record<string, number>;
  /** Id of the last consumed message that has aged out of the consumedSigs
   * window (SIG_CAP), or null before any trimming. Floors a rewind so a
   * divergence at the window's oldest tracked sig can't reset consumption to
   * message zero and re-pay the whole backlog. */
  prefixMsgId: string | null;
  /** Set when divergence was detected, cleared once the rewound span is fully re-consumed. */
  pendingReconcile: boolean;
  /** End of the rewound span: reconcile notes keep firing until the cursor
   * passes this message, so multi-chunk rewinds stay flagged past chunk one. */
  reconcileUntilMsgId: string | null;
  /** Relations-table mode the files on disk were last written under. Load-time
   * validation must use THIS mode, not the profile's, or a toggle would reject
   * the very files the migration run needs to read. */
  relationsTableMode: boolean | null;
  lastRunAt: number | null;
  lastRunStats: CodexRunStats | null;
  runs: number;
  updatedAt: number;
}

export function emptyCursor(): CodexCursor {
  return {
    version: 1,
    lastMsgId: null,
    consumedSigs: [],
    fileStates: {},
    frozenAtRuns: {},
    prefixMsgId: null,
    pendingReconcile: false,
    reconcileUntilMsgId: null,
    relationsTableMode: null,
    lastRunAt: null,
    lastRunStats: null,
    runs: 0,
    updatedAt: 0,
  };
}

function normalizeRunStats(raw: unknown): CodexRunStats | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<CodexRunStats>;
  if (typeof v.rounds !== "number" || typeof v.model !== "string") return null;
  return {
    rounds: v.rounds,
    promptTokens: typeof v.promptTokens === "number" ? v.promptTokens : 0,
    completionTokens: typeof v.completionTokens === "number" ? v.completionTokens : 0,
    model: v.model,
    ...(typeof v.note === "string" && v.note.trim() ? { note: v.note.trim() } : {}),
  };
}

function dir(chatId: string): string {
  return `${CODEX_DIR}/${chatId}`;
}

function filePath(chatId: string, key: CodexFileKey): string {
  return `${dir(chatId)}/${key}.json`;
}

function cursorPath(chatId: string): string {
  return `${dir(chatId)}/cursor.json`;
}

export function msgSig(role: string, content: string): string {
  // FNV-1a over role + NUL + content, hex. The \0 separator is load-bearing:
  // changing it invalidates every persisted cursor sig and ghost msgSig.
  let h = 0x811c9dc5;
  const s = `${role}\0${content}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * A corrupt cursor must fail the run, not masquerade as a fresh one: an
 * emptyCursor fallback would silently rewind consumption to message zero
 * (re-paying the whole backlog) and erase the recorded relations mode.
 */
export async function loadCursor(chatId: string, userId: string): Promise<CodexCursor> {
  const read = await readJsonFileRaw(cursorPath(chatId), userId);
  if (read.state === "unreadable") {
    throw new Error(`The codex cursor is unreadable: ${read.error}`);
  }
  const raw = read.state === "ok" ? (read.value as Partial<CodexCursor> | null) : null;
  if (!raw || typeof raw !== "object") return emptyCursor();
  const base = emptyCursor();
  const fileStates: Record<string, CodexFileState> = {};
  if (raw.fileStates && typeof raw.fileStates === "object") {
    for (const [k, v] of Object.entries(raw.fileStates)) {
      if (v === "on" || v === "noInject" || v === "frozen") fileStates[k] = v;
    }
  }
  const frozenAtRuns: Record<string, number> = {};
  if (raw.frozenAtRuns && typeof raw.frozenAtRuns === "object") {
    for (const [k, v] of Object.entries(raw.frozenAtRuns)) {
      if (typeof v === "number" && Number.isFinite(v)) frozenAtRuns[k] = v;
    }
  }
  return {
    version: 1,
    lastMsgId: typeof raw.lastMsgId === "string" && raw.lastMsgId ? raw.lastMsgId : null,
    consumedSigs: Array.isArray(raw.consumedSigs)
      ? raw.consumedSigs.filter(
          (x): x is ConsumedSig =>
            !!x && typeof x === "object" && typeof (x as ConsumedSig).id === "string" && typeof (x as ConsumedSig).sig === "string",
        )
      : base.consumedSigs,
    fileStates,
    frozenAtRuns,
    prefixMsgId: typeof raw.prefixMsgId === "string" && raw.prefixMsgId ? raw.prefixMsgId : null,
    pendingReconcile: raw.pendingReconcile === true,
    reconcileUntilMsgId: typeof raw.reconcileUntilMsgId === "string" && raw.reconcileUntilMsgId ? raw.reconcileUntilMsgId : null,
    relationsTableMode: typeof raw.relationsTableMode === "boolean" ? raw.relationsTableMode : null,
    lastRunAt: typeof raw.lastRunAt === "number" ? raw.lastRunAt : null,
    lastRunStats: normalizeRunStats(raw.lastRunStats),
    runs: typeof raw.runs === "number" && Number.isFinite(raw.runs) ? raw.runs : 0,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}

export async function saveCursor(chatId: string, cursor: CodexCursor, userId: string): Promise<void> {
  // As sigs age out of the window, remember the last one dropped: it becomes
  // the floor a future edge-divergence rewinds to, instead of message zero.
  const overflow = cursor.consumedSigs.length - SIG_CAP;
  const prefixMsgId = overflow > 0 ? cursor.consumedSigs[overflow - 1]!.id : cursor.prefixMsgId;
  const trimmed: CodexCursor = {
    ...cursor,
    prefixMsgId,
    consumedSigs: cursor.consumedSigs.slice(-SIG_CAP),
    updatedAt: Date.now(),
  };
  await spindle.userStorage.setJson(cursorPath(chatId), trimmed, { indent: 0, userId });
}

export interface LoadedCodex {
  bundle: CodexBundle;
  /** Files that existed on disk but failed validation (kept out of the bundle). */
  problems: { file: CodexFileKey; errors: string[] }[];
}

/**
 * Absent and unreadable are different states: getJson would swallow a parse
 * failure into its fallback, silently presenting a corrupt file as empty and
 * letting the next write bury the old content. Reading raw and parsing here
 * routes corrupt files into problems, which becomes the agent's REPAIR note.
 */
async function readJsonFileRaw(
  path: string,
  userId: string,
): Promise<{ state: "absent" } | { state: "unreadable"; error: string } | { state: "ok"; value: unknown }> {
  // A rejected exists() is a storage fault, not a missing file. Coercing it to
  // "absent" would let a healthy-but-unchecked file be buried under a scaffold,
  // so treat it as unreadable and let callers fail loudly.
  let exists: boolean;
  try {
    exists = await spindle.userStorage.exists(path, userId);
  } catch (err) {
    return { state: "unreadable", error: describeError(err) };
  }
  if (!exists) return { state: "absent" };
  try {
    const text = await spindle.userStorage.read(path, userId);
    return { state: "ok", value: JSON.parse(text) as unknown };
  } catch (err) {
    return { state: "unreadable", error: describeError(err) };
  }
}

function readCodexFileRaw(
  chatId: string,
  key: CodexFileKey,
  userId: string,
): ReturnType<typeof readJsonFileRaw> {
  return readJsonFileRaw(filePath(chatId, key), userId);
}

export async function loadCodex(chatId: string, userId: string, opts: ValidateOptions): Promise<LoadedCodex> {
  const bundle = emptyBundle();
  const problems: LoadedCodex["problems"] = [];
  await Promise.all(
    CODEX_FILE_KEYS.map(async (key) => {
      const read = await readCodexFileRaw(chatId, key, userId);
      if (read.state === "absent") return;
      if (read.state === "unreadable") {
        problems.push({ file: key, errors: [`unreadable on disk: ${read.error}`] });
        warn(`codex: ${key}.json for ${chatId.slice(0, 8)} is unreadable: ${read.error}`);
        return;
      }
      const result = validateCodexFile(key, read.value, opts);
      if (result.ok) {
        (bundle as Record<CodexFileKey, CodexFileValue>)[key] = result.value;
      } else {
        problems.push({ file: key, errors: result.errors });
        warn(`codex: ${key}.json for ${chatId.slice(0, 8)} failed validation, treating as empty: ${result.errors.slice(0, 3).join("; ")}`);
      }
    }),
  );
  return { bundle, problems };
}

export async function saveCodexFile(
  chatId: string,
  key: CodexFileKey,
  value: CodexFileValue,
  userId: string,
): Promise<void> {
  await spindle.userStorage.setJson(filePath(chatId, key), value, { indent: 1, userId });
}

export async function codexExists(chatId: string, userId: string): Promise<boolean> {
  return spindle.userStorage.exists(cursorPath(chatId), userId).catch(() => false);
}

/**
 * Returns the files that could not be deleted. The cursor is only removed
 * when every data file went: otherwise a surviving stale file would
 * resurrect as current codex state while the UI reports the codex cleared.
 */
export async function deleteCodex(chatId: string, userId: string): Promise<CodexFileKey[]> {
  const failed: CodexFileKey[] = [];
  for (const key of CODEX_FILE_KEYS) {
    // A rejected exists() means we can't prove the file is gone, so it must
    // count as failed and hold back the cursor deletion below.
    let exists: boolean;
    try {
      exists = await spindle.userStorage.exists(filePath(chatId, key), userId);
    } catch (err) {
      failed.push(key);
      warn(`codex: exists() failed for ${key}.json of ${chatId.slice(0, 8)}: ${describeError(err)}`);
      continue;
    }
    if (!exists) continue;
    try {
      await spindle.userStorage.delete(filePath(chatId, key), userId);
    } catch (err) {
      failed.push(key);
      warn(`codex: failed to delete ${key}.json for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    }
  }
  if (failed.length === 0) {
    await spindle.userStorage.delete(cursorPath(chatId), userId).catch((err) => {
      warn(`codex: failed to delete cursor for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    });
  }
  return failed;
}

/** Raw file contents for the UI viewer: pretty JSON, empty scaffold when
 * absent. An unreadable file renders as a non-JSON marker so Save (which
 * validates) can't accidentally bury the on-disk content under a scaffold. */
export async function readCodexFilesRaw(chatId: string, userId: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    CODEX_FILE_KEYS.map(async (key) => {
      const read = await readCodexFileRaw(chatId, key, userId);
      if (read.state === "unreadable") {
        warn(`codex: read ${key}.json failed: ${read.error}`);
        out[key] = `UNREADABLE ${key}.json - the file exists but cannot be parsed (${read.error}). Fix or delete it before saving.`;
        return;
      }
      out[key] = JSON.stringify(read.state === "ok" ? read.value : emptyCodexFile(key), null, 2);
    }),
  );
  return out;
}

declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { WorldBookEntryDTO } from "lumiverse-spindle-types";
import { CODEX_ENTRY_EXTENSION_KEY } from "../../shared";
import type { CodexFileKey } from "./schema";
import { CODEX_FILE_KEYS } from "./schema";
import type { CodexRecordRender } from "./prompt";
import { renderCodexRecords } from "./prompt";
import { codexPresence, loadCodex, loadCursor } from "./store";
import { ensureCodexBookForChat, findCodexBookForChat, listAllEntries } from "../world-book";
import { describeError, warn } from "../runtime";

/** Identity payload stored on every synced entry. */
interface CodexEntryMeta {
  chatId: string;
  record: string;
  file: CodexFileKey;
}

function readEntryMeta(entry: WorldBookEntryDTO): CodexEntryMeta | null {
  const ext = (entry.extensions || {}) as Record<string, unknown>;
  const raw = ext[CODEX_ENTRY_EXTENSION_KEY];
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Partial<CodexEntryMeta>;
  if (typeof v.chatId !== "string" || !v.chatId) return null;
  if (typeof v.record !== "string" || !v.record) return null;
  const file = typeof v.file === "string" && (CODEX_FILE_KEYS as readonly string[]).includes(v.file)
    ? (v.file as CodexFileKey)
    : null;
  if (!file) return null;
  return { chatId: v.chatId, record: v.record, file };
}

/** Serialize sync and wipe per chat: a run finishing while a hand-save lands
 * must not interleave two diffs and double-create or double-delete entries. */
const syncChain = new Map<string, Promise<unknown>>();
function withSyncLock<T>(userId: string, chatId: string, fn: () => Promise<T>): Promise<T> {
  const key = `${userId}::${chatId}`;
  const prev = syncChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => undefined);
  syncChain.set(key, guarded);
  guarded.then(() => {
    if (syncChain.get(key) === guarded) syncChain.delete(key);
  });
  return tail;
}

function sameKeys(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const DELETE_ATTEMPTS = 6;
const DELETE_RETRY_BASE_MS = 1000;
const DELETE_RETRY_BUDGET_MS = 300_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Deletes take the host's global vector-store write lock, which rejects transiently. */
async function deleteSyncedEntry(entryId: string, userId: string, deadline: number): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await spindle.world_books.entries.delete(entryId, userId);
      return;
    } catch (err) {
      const backoff = DELETE_RETRY_BASE_MS * 2 ** (attempt - 1);
      if (attempt >= DELETE_ATTEMPTS || Date.now() + backoff >= deadline) throw err;
      warn(`codex sync: delete of ${entryId} failed (attempt ${attempt}), retrying: ${describeError(err)}`);
      await sleep(backoff);
    }
  }
}

async function listSyncedEntries(bookId: string, chatId: string, userId: string): Promise<Array<{ raw: WorldBookEntryDTO; meta: CodexEntryMeta }>> {
  const all = await listAllEntries(bookId, userId);
  const out: Array<{ raw: WorldBookEntryDTO; meta: CodexEntryMeta }> = [];
  for (const entry of all) {
    const meta = readEntryMeta(entry);
    if (meta && meta.chatId === chatId) out.push({ raw: entry, meta });
  }
  return out;
}

/**
 * Mirror the codex JSON into per-record lorebook entries in the chat's book:
 * keyword-triggered entries for entities (relations folded in), world topics,
 * and knowledge items, plus constant entries for timeline and threads. The
 * JSON stays the source of truth; entries are recreated from it on every sync,
 * so hand edits to the entries themselves do not survive.
 *
 * A codex with any unreadable file does not sync at all: records embed data
 * across files, so a partial bundle would erase the broken file's
 * contributions from every other file's entries.
 */
export function syncCodexEntries(chatId: string, userId: string, relationsTableFallback = true): Promise<void> {
  return withSyncLock(userId, chatId, () => doSync(chatId, userId, relationsTableFallback));
}

async function doSync(chatId: string, userId: string, relationsTableFallback: boolean): Promise<void> {
  if ((await codexPresence(chatId, userId)) === "absent") {
    await doWipe(chatId, userId);
    return;
  }
  const cursor = await loadCursor(chatId, userId);
  const diskMode = cursor.relationsTableMode ?? relationsTableFallback;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  if (problems.length > 0) {
    throw new Error(`codex sync skipped, unreadable or invalid file${problems.length === 1 ? "" : "s"}: ${problems.map((p) => `${p.file}.json`).join(", ")}`);
  }

  const relState = cursor.fileStates["relations"];
  const desired = renderCodexRecords(bundle, {
    includeRelations: relState !== "noInject" && relState !== "frozen",
  });

  const disabledFor = (file: CodexFileKey): boolean => {
    const st = cursor.fileStates[file];
    return st === "noInject" || st === "frozen";
  };

  let bookId: string;
  if (desired.length > 0) {
    bookId = (await ensureCodexBookForChat(chatId, userId)).id;
  } else {
    const found = await findCodexBookForChat(chatId, userId);
    if (!found) return;
    bookId = found;
  }

  const existing = await listSyncedEntries(bookId, chatId, userId);
  const byRecord = new Map<string, { raw: WorldBookEntryDTO; meta: CodexEntryMeta }>();
  const deleteDeadline = Date.now() + DELETE_RETRY_BUDGET_MS;
  let failedDeletes = 0;
  for (const e of existing) {
    const dup = byRecord.get(e.meta.record);
    if (!dup) {
      byRecord.set(e.meta.record, e);
      continue;
    }
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete duplicate entry ${e.raw.id}: ${describeError(err)}`);
    });
  }

  const seen = new Set<string>();
  for (const rec of desired) {
    seen.add(rec.record);
    const disabled = disabledFor(rec.file);
    const meta: CodexEntryMeta = { chatId, record: rec.record, file: rec.file };
    const cur = byRecord.get(rec.record);
    if (!cur) {
      try {
        await spindle.world_books.entries.create(
          bookId,
          {
            content: rec.content,
            comment: rec.comment,
            disabled,
            constant: rec.constant,
            key: rec.keys,
            keysecondary: [],
            vectorized: false,
            extensions: { [CODEX_ENTRY_EXTENSION_KEY]: meta },
          },
          userId,
        );
      } catch (err) {
        warn(`codex sync: failed to create entry for ${rec.record}: ${describeError(err)}`);
        throw err;
      }
      continue;
    }
    const changed =
      cur.raw.content !== rec.content
      || (cur.raw.comment || "") !== rec.comment
      || cur.raw.constant !== rec.constant
      || cur.raw.disabled !== disabled
      || !sameKeys(cur.raw.key ?? [], rec.keys)
      || cur.meta.file !== rec.file;
    if (!changed) continue;
    const ext = (cur.raw.extensions || {}) as Record<string, unknown>;
    try {
      await spindle.world_books.entries.update(
        cur.raw.id,
        {
          content: rec.content,
          comment: rec.comment,
          disabled,
          constant: rec.constant,
          key: rec.keys,
          extensions: { ...ext, [CODEX_ENTRY_EXTENSION_KEY]: meta },
        },
        userId,
      );
    } catch (err) {
      warn(`codex sync: failed to update entry for ${rec.record}: ${describeError(err)}`);
      throw err;
    }
  }

  for (const [record, e] of byRecord) {
    if (seen.has(record)) continue;
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete stale entry ${e.raw.id} (${record}): ${describeError(err)}`);
    });
  }
  if (failedDeletes > 0) {
    throw new Error(
      `${failedDeletes} outdated codex entr${failedDeletes === 1 ? "y" : "ies"} could not be removed and may still inject`,
    );
  }
}

/** Delete every synced codex entry for a chat (wipe, reset, rebuild). */
export function wipeCodexEntries(chatId: string, userId: string): Promise<void> {
  return withSyncLock(userId, chatId, () => doWipe(chatId, userId));
}

async function doWipe(chatId: string, userId: string): Promise<void> {
  const bookId = await findCodexBookForChat(chatId, userId);
  if (!bookId) return;
  const existing = await listSyncedEntries(bookId, chatId, userId);
  const deleteDeadline = Date.now() + DELETE_RETRY_BUDGET_MS;
  let failed = 0;
  for (const e of existing) {
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failed++;
      warn(`codex wipe: failed to delete entry ${e.raw.id}: ${describeError(err)}`);
    });
  }
  if (failed > 0) {
    throw new Error(`failed to delete ${failed} codex entr${failed === 1 ? "y" : "ies"}, they may still inject`);
  }
}

export type { CodexRecordRender };

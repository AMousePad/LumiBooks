import { t as tr } from "../../i18n";
import { loadSettings } from "../storage";
import { activationFlags } from "../../activation";
import type { LMBProfile } from "../../shared";
import { listCodexChatIds, setCodexOrphaned } from "./store";
declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { WorldBookEntryDTO, WorldInfoInterceptorEntryDTO } from "lumiverse-spindle-types";
import { CODEX_ENTRY_EXTENSION_KEY, approximateTokensFromChars } from "../../shared";
import type { CodexFileKey } from "./schema";
import { CODEX_FILE_KEYS } from "./schema";
import type { CodexRecordRender } from "./prompt";
import { renderCodexRecords } from "./prompt";
import { codexPresence, loadCodex, loadCursor } from "./store";
import { ensureCodexBookForChat, findCodexBookForChat, invalidateBookCache, listAllEntries } from "../world-book";
import { describeError, warn } from "../runtime";
import { updateEntriesBatched, type EntryUpdate } from "../entry-batch";
import { recordDiagnostic } from "../diagnostics";
import { mergeLorebookEdits, type LorebookEditState } from "./lorebook-edits";
import { selectCodexCuts, type CutCandidate } from "./limits";
import { alignCacheFileStates } from "./cache-states";
import { bumpCacheEpoch } from "../hooks";

/** Identity payload stored on every synced entry. */
interface CodexEntryMeta extends LorebookEditState {
  chatId: string;
  record: string;
  file: CodexFileKey;
  /** Update history, read by the activation hook without extra storage calls. */
  updates?: number;
  born?: number;
}

export function readEntryMeta(entry: Pick<WorldBookEntryDTO, "extensions">): CodexEntryMeta | null {
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
  return { chatId: v.chatId, record: v.record, file, applied: v.applied, overrides: v.overrides,
    ...(typeof v.updates === "number" ? { updates: v.updates } : {}), ...(typeof v.born === "number" ? { born: v.born } : {}) };
}

let cutWarning: ((userId: string, chatId: string) => void) | null = null;
export function registerCodexCutWarning(warning: (userId: string, chatId: string) => void): void {
  cutWarning = warning;
}

async function cutCandidates(
  desired: readonly CodexRecordRender[],
  stats: Record<string, { updates: number; born: number }>,
  disabledFor: (file: CodexFileKey) => boolean,
  userId: string,
): Promise<CutCandidate[]> {
  const out: CutCandidate[] = [];
  for (const [index, rec] of desired.entries()) {
    if (rec.disabled || disabledFor(rec.file)) continue;
    const stat = stats[rec.record];
    out.push({ id: rec.record, file: rec.file, index, tokens: approximateTokensFromChars(rec.content.length),
      updates: stat?.updates ?? 0, born: stat?.born ?? 0 });
  }
  return out;
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
 * Edited lorebook fields remain authoritative across generated updates.
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
  const settings = await loadSettings(userId);
  const profile = settings.profiles.find((p) => p.id === settings.activeProfileId)!;
  await alignCacheFileStates(chatId, userId, settings.cacheFriendly);
  const cursor = await loadCursor(chatId, userId);
  const diskMode = cursor.relationsTableMode ?? relationsTableFallback;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  if (problems.length > 0) {
    throw new Error(tr("backend.codex.sync.doSync.codexSyncSkippedUnreadableOrInvalidFile", { length: problems.length, join: problems.map((p) => `${p.file}.json`).join(", ") }));
  }

  const relState = cursor.fileStates["relations"];
  const desired = renderCodexRecords(bundle, {
    includeRelations: relState !== "noInject" && relState !== "frozen",
    disabledFiles: new Set(Object.entries(cursor.fileStates).filter(([, st]) => st === "noInject" || st === "frozen").map(([key]) => key as CodexFileKey)),
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
  const manifestPath = `codex/${chatId}/lorebook-sync.json`;
  const manifest = await spindle.userStorage.exists(manifestPath, userId)
    ? await spindle.userStorage.getJson<{ bookId: string; records: string[]; suppressed: string[]; cut?: string[] }>(manifestPath, { userId })
    : null;
  const suppressed = new Set(manifest?.bookId === bookId ? manifest.suppressed ?? [] : []);
  const previousRecords = new Set(manifest?.bookId === bookId ? manifest.records ?? [] : []);
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

  const cuts = profile.codexActivationMode === "always"
    ? selectCodexCuts(await cutCandidates(desired, cursor.recordStats, disabledFor, userId), profile.codexTokenLimits)
    : new Set<string>();
  const seen = new Set<string>();
  let wrote = false;
  const updates: EntryUpdate[] = [];
  for (const [index, rec] of desired.entries()) {
    seen.add(rec.record);
    const disabled = disabledFor(rec.file) || rec.disabled || cuts.has(rec.record);
    const placement = codexEntryPlacement(profile, rec.constant);
    const cur = byRecord.get(rec.record) ?? (rec.legacyRecord ? byRecord.get(rec.legacyRecord) : undefined);
    if (!cur && (previousRecords.has(rec.record) || (rec.legacyRecord && previousRecords.has(rec.legacyRecord)))) suppressed.add(rec.record);
    if (!cur && suppressed.has(rec.record)) continue;
    if (cur) seen.add(cur.meta.record);
    // Unique order values keep the host's sort from depending on its list order.
    const generated = { content: rec.content, comment: rec.comment, disabled, ...placement,
      ...(settings.cacheFriendly ? { order_value: index } : {}),
      key: profile.codexActivationMode === "vector_only" ? [] : rec.keys, keysecondary: [] };
    const { fields, state } = mergeLorebookEdits((cur?.raw ?? generated) as unknown as Record<string, unknown>, generated, cur?.meta ?? {}, {
      disabled, vectorOnly: profile.codexActivationMode === "vector_only",
      // Hand edits must not reintroduce per-turn activation or moving placement.
      ...(settings.cacheFriendly ? { pinned: placement } : {}),
    });
    const stat = cursor.recordStats[rec.record];
    const meta: CodexEntryMeta = { chatId, record: rec.record, file: rec.file, ...state, ...(stat ? { updates: stat.updates, born: stat.born } : {}) };
    if (!cur) {
      try {
        await spindle.world_books.entries.create(
          bookId,
          {
            ...fields as typeof generated,
            extensions: { [CODEX_ENTRY_EXTENSION_KEY]: meta },
          },
          userId,
        );
        wrote = true;
      } catch (err) {
        warn(`codex sync: failed to create entry for ${rec.record}: ${describeError(err)}`);
        throw err;
      }
      continue;
    }
    const changed = Object.entries(fields).some(([key, value]) => JSON.stringify((cur.raw as unknown as Record<string, unknown>)[key]) !== JSON.stringify(value))
      || JSON.stringify(cur.meta) !== JSON.stringify(meta);
    if (!changed) continue;
    const ext = (cur.raw.extensions || {}) as Record<string, unknown>;
    updates.push({ id: cur.raw.id, input: { ...fields, extensions: { ...ext, [CODEX_ENTRY_EXTENSION_KEY]: meta } } });
  }
  if (updates.length) {
    const failures = await updateEntriesBatched(updates, userId);
    if (failures.length < updates.length) wrote = true;
    for (const f of failures) warn(`codex sync: failed to update entry ${f.id}: ${f.error}`);
    if (failures.length) throw new Error(failures[0]!.error);
  }

  for (const [record, e] of byRecord) {
    if (seen.has(record)) continue;
    // A model dropping or renaming a record must not delete a user's prose.
    const edited = mergeLorebookEdits(e.raw as unknown as Record<string, unknown>, e.meta.applied ?? {}, e.meta, { disabled: false, vectorOnly: false });
    if (!cursor.discardedRecords?.includes(record) && Object.keys(edited.state.overrides ?? {}).length) {
      const constrained = mergeLorebookEdits(e.raw as unknown as Record<string, unknown>, {
        ...e.meta.applied, ...codexEntryPlacement(profile, e.raw.constant),
      }, e.meta, { disabled: disabledFor(e.meta.file), vectorOnly: profile.codexActivationMode === "vector_only" });
      await spindle.world_books.entries.update(e.raw.id, { ...constrained.fields,
        extensions: { ...e.raw.extensions, [CODEX_ENTRY_EXTENSION_KEY]: { ...e.meta, ...constrained.state } },
      }, userId);
      continue;
    }
    wrote = true;
    await deleteSyncedEntry(e.raw.id, userId, deleteDeadline).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete stale entry ${e.raw.id} (${record}): ${describeError(err)}`);
    });
  }
  if (failedDeletes > 0) {
    throw new Error(
      tr("backend.codex.sync.doSync.outdatedCodexEntrCouldNotBeRemoved", { failedDeletes: failedDeletes }),
    );
  }
  const records = desired.map(r => r.record);
  const cut = [...cuts].sort();
  await spindle.userStorage.setJson(manifestPath, { bookId, records, suppressed: [...suppressed].filter(record => records.includes(record)), cut }, { userId });
  const previousCut = new Set(manifest?.cut ?? []);
  if (cut.some((record) => !previousCut.has(record))) cutWarning?.(userId, chatId);
  if (wrote && settings.cacheFriendly) bumpCacheEpoch(chatId);
  void recordDiagnostic(userId, { event: "codex", chatId, outcome: "success",
    numbers: { entries: desired.length },
    flags: { vector: profile.codexActivationMode === "vector", constant: profile.codexActivationMode === "always" } });
}

/** Delete every synced codex entry for a chat (wipe, reset, rebuild). */
export function wipeCodexEntries(chatId: string, userId: string): Promise<void> {
  return withSyncLock(userId, chatId, () => doWipe(chatId, userId));
}

async function doWipe(chatId: string, userId: string): Promise<void> {
  await spindle.userStorage.setJson(`codex/${chatId}/lorebook-sync.json`, { bookId: "", records: [], suppressed: [] }, { userId });
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
    throw new Error(tr("backend.codex.sync.doWipe.failedToDeleteCodexEntrTheyMay", { failed: failed }));
  }
}

export async function readCodexLorebookEdits(chatId: string, userId: string): Promise<string> {
  const bookId = await findCodexBookForChat(chatId, userId);
  if (!bookId) return "";
  const edits: string[] = [];
  for (const { raw, meta } of await listSyncedEntries(bookId, chatId, userId)) {
    const manual = typeof meta.overrides?.content === "string" || (meta.applied?.content !== undefined && raw.content !== meta.applied.content);
    if (manual) edits.push(`[${meta.record}]\n${raw.content}`);
  }
  return edits.length ? `\n\n${tr("codexLorebook.prompt")}\n${edits.join("\n\n")}` : "";
}

export type { CodexRecordRender };

/** The host has no post-activation hook, so substring matching stands in for its keywords. */
export function codexActivationCuts(
  entries: readonly WorldInfoInterceptorEntryDTO[],
  messages: readonly { content: string }[],
  scanDepth: number | null,
  profile: LMBProfile,
): string[] {
  if (profile.codexActivationMode === "always") return [];
  const scan = (scanDepth && scanDepth > 0 ? messages.slice(-scanDepth) : messages).map((message) => message.content).join("\n").toLowerCase();
  const items: CutCandidate[] = [];
  for (const [index, entry] of entries.entries()) {
    const meta = entry.disabled ? null : readEntryMeta(entry);
    if (!meta) continue;
    const predicted = entry.constant || entry.key.length === 0 || entry.key.some((key) => scan.includes(key.toLowerCase()));
    if (!predicted) continue;
    items.push({ id: entry.id, file: meta.file, index, tokens: approximateTokensFromChars(entry.content.length), updates: meta.updates ?? 0, born: meta.born ?? 0 });
  }
  return [...selectCodexCuts(items, profile.codexTokenLimits)];
}

/** Host lorebook position 4 uses history depth; zero follows the last turn. */
export function codexEntryPlacement(profile: LMBProfile, constant: boolean) {
  return { ...(profile.codexActivationMode === "vector_only" ? { constant: false, vectorized: true } : activationFlags(profile.codexActivationMode, constant)),
    position: profile.codexInjectionPosition === "lorebook" ? 0 : 4,
    depth: profile.codexInjectionPosition === "depth" ? profile.codexInjectionDepth : 0,
    role: "system" };
}
export async function syncCodexProfiles(userId: string): Promise<Array<{ chatId: string; error: string }>> {
  const failures: Array<{ chatId: string; error: string }> = [];
  for (const chatId of await listCodexChatIds(userId, true)) {
    try {
      await withSyncLock(userId, chatId, async () => {
        const retire = async () => {
          await setCodexOrphaned(chatId, userId, true);
          invalidateBookCache(userId, chatId);
          void recordDiagnostic(userId, { event: "codex", chatId, outcome: "skipped", reason: "missing" });
        };
        // A null result confirms absence; permission/transport failures must
        // still surface and must never retire potentially live state.
        if (await spindle.chats.get(chatId, userId) === null) { await retire(); return; }
        await setCodexOrphaned(chatId, userId, false);
        try { await doSync(chatId, userId, true); }
        catch (err) {
          // Deletion can race the initial lookup and the book attachment.
          const missing = await spindle.chats.get(chatId, userId).then((chat) => chat === null, () => false);
          if (!missing) throw err;
          await retire();
        }
      });
    }
    catch (err) {
      const error = describeError(err);
      failures.push({ chatId, error });
      warn(`Codex profile sync failed for ${chatId}: ${error}`);
    }
  }
  return failures;
}

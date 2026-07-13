declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { LMBProfile, LMBSettings } from "../../shared";
import { CODEX_ENTRY_EXTENSION_KEY, EXTENSION_KEY, approximateTokensFromChars } from "../../shared";
import type { ChatMessage } from "../coverage";
import { liveEndPosition, sumApproxTokens } from "../coverage";
import type { CodexCursor, CodexFileState } from "./store";
import { codexExists, codexPresence, deleteCodex, emptyCursor, loadCodex, loadCursor, msgSig, saveCodexFile, saveCursor, withCursorLock } from "./store";
import { CODEX_FILE_KEYS, bundleIsEmpty, emptyCodexFile, type CodexBundle, type CodexFileKey, type CodexFileValue } from "./schema";
import { runCodexAgent } from "./agent";
import { buildCodexTidyMessage, renderCodexFileSections, renderCodexForInjection, type CodexRunNotes } from "./prompt";
import { syncCodexEntries, wipeCodexEntries } from "./sync";
import { AbortedSummarizerError } from "../summarizer";
import { appendStreamText, clearBusy, getBusy, registerAborter, setBusy, shortErrorText, updateProgressNumbers } from "../pipeline";
import { findBookForChat, listAllEntries, listLmbEntries } from "../world-book";
import { publishCodexSnapshot, publishCodexUpdated, publishCodexWiped, type CodexChangeReason } from "../hooks";
import { forkCodexPending } from "../fork";
import { describeError, warn } from "../runtime";


export interface CodexCallbacks {
  onToast(userId: string, tone: "success" | "info" | "warn" | "error", text: string, automation?: boolean): void;
  onStateChange(userId: string, chatId: string): void;
}

let cb: CodexCallbacks | null = null;
export function registerCodexCallbacks(c: CodexCallbacks): void {
  cb = c;
}

function nonEmpty(m: ChatMessage): boolean {
  return !!(m.content || "").trim();
}

function sizeOf(messages: ChatMessage[], unit: "messages" | "tokens"): number {
  return unit === "messages" ? messages.length : sumApproxTokens(messages);
}

/** Reserve the most recent `lagValue` worth of messages, return the rest. */
function trimLag(tail: ChatMessage[], unit: "messages" | "tokens", lagValue: number): ChatMessage[] {
  if (lagValue <= 0) return tail.slice();
  if (unit === "messages") {
    return lagValue >= tail.length ? [] : tail.slice(0, tail.length - lagValue);
  }
  let reserved = 0;
  let cutoff = tail.length;
  for (let i = tail.length - 1; i >= 0; i--) {
    reserved += approximateTokensFromChars((tail[i]!.content || "").length);
    cutoff = i;
    if (reserved >= lagValue) break;
  }
  if (reserved < lagValue) return [];
  return tail.slice(0, cutoff);
}

/** Take from the front until the window fills - whichever bound lands first,
 * the message count or the token breakpoint. A message-count window alone is
 * a footgun on verbose chats (30 long messages can be 80k+ tokens), so the
 * breakpoint co-limits it. Always takes at least one. */
function takeWindow(
  compressible: ChatMessage[],
  unit: "messages" | "tokens",
  windowValue: number,
  tokenBreakpoint: number,
): ChatMessage[] {
  const budget = unit === "messages" ? Math.max(1000, tokenBreakpoint) : windowValue;
  const maxCount = unit === "messages" ? Math.max(1, windowValue) : compressible.length;
  const out: ChatMessage[] = [];
  let acc = 0;
  for (const m of compressible) {
    out.push(m);
    if (out.length >= maxCount) break;
    acc += approximateTokensFromChars((m.content || "").length);
    if (acc >= budget) break;
  }
  return out;
}

/** Auto-fire condition: the window is "full" at whichever arrives first -
 * the configured window, or the token breakpoint. */
function windowReached(compressible: ChatMessage[], profile: LMBProfile): boolean {
  if (sizeOf(compressible, profile.codexWindowUnit) >= profile.codexWindowValue) return true;
  if (profile.codexWindowUnit === "messages"
    && sumApproxTokens(compressible) >= Math.max(1000, profile.codexTokenBreakpoint)) return true;
  return false;
}

/** Sync wrapper for codex mutation paths: a failed entry sync must not fail
 * the run that already persisted its files and cursor, but it must be heard -
 * a silently stale lorebook mirror defeats the whole feature. */
async function syncEntriesGuarded(chatId: string, userId: string, relationsTableFallback?: boolean): Promise<void> {
  try {
    await syncCodexEntries(chatId, userId, relationsTableFallback);
  } catch (err) {
    warn(`codex entry sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    cb?.onToast(userId, "error", `Memoria couldn't sync the codex to the lorebook: ${shortErrorText(err)}`);
  }
}

/** Chats whose synced entries were verified this session. Lets existing
 * codexes (written before entry sync shipped) materialize their entries on
 * the first generation instead of waiting for the next agent run. */
const entriesEnsured = new Set<string>();
const ENTRIES_ENSURED_CAP = 5000;

export async function ensureCodexEntriesSynced(chatId: string, userId: string, profile: LMBProfile): Promise<void> {
  if (!profile.codexEnabled) return;
  const key = `${userId}::${chatId}`;
  if (entriesEnsured.has(key)) return;
  // Clearing on overflow only costs a cheap re-verify per chat.
  if (entriesEnsured.size >= ENTRIES_ENSURED_CAP) entriesEnsured.clear();
  entriesEnsured.add(key);
  try {
    // Runs even without a codex on file: sync then sweeps entries orphaned by
    // a wipe this process never saw.
    await syncCodexEntries(chatId, userId, profile.codexRelationsTable);
  } catch (err) {
    entriesEnsured.delete(key);
    warn(`codex entry ensure-sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    cb?.onToast(userId, "error", `Memoria couldn't sync the codex to the lorebook: ${shortErrorText(err)}`);
  }
}

interface PlannedRun {
  messages: ChatMessage[];
  cursor: CodexCursor;
  /** Position in `messages` where unconsumed content starts. */
  startPos: number;
  /** Non-empty messages eligible this run, after the lag reserve. */
  compressible: ChatMessage[];
  reconcile: boolean;
  /** True when THIS plan detected divergence and rewound the cursor, so a
   * drain can tell a legitimate backward jump from a stall. */
  rewound: boolean;
}

/**
 * Loads the cursor, detects divergence (edits, regenerations, deletions behind
 * the cursor), rewinds to the divergence point when found, and computes what
 * is consumable. The codex reads everything: hidden and excluded messages
 * included, since exclusion governs compression, not tracking.
 */
async function planRun(chatId: string, userId: string, lagUnit: "messages" | "tokens", lagValue: number): Promise<PlannedRun> {
  const messages = await spindle.chat.getMessages(chatId);
  const cursor = await loadCursor(chatId, userId);
  const byId = new Map(messages.map((m) => [m.id, m] as const));
  const posById = new Map(messages.map((m, i) => [m.id, i] as const));

  // Kept before the rewind slices consumedSigs: used to resolve startPos to a
  // still-live anchor when the chosen anchor id was itself deleted.
  const consumedBeforeRewind = cursor.consumedSigs;

  let reconcile = cursor.pendingReconcile;
  let divergedAt = -1;
  for (let i = 0; i < cursor.consumedSigs.length; i++) {
    const rec = cursor.consumedSigs[i]!;
    const live = byId.get(rec.id);
    if (!live || msgSig(live.role, live.content || "") !== rec.sig) {
      divergedAt = i;
      break;
    }
  }
  const posOf = (id: string | null): number => (id ? posById.get(id) ?? -1 : -1);
  if (divergedAt >= 0) {
    // The pre-rewind cursor position bounds the reconcile span: chunks keep
    // carrying the reconcile note until consumption passes it again. When the
    // pre-rewind message was itself deleted, fall back to the last surviving
    // consumed message, or the boundary would be lost and chunks 2..n of the
    // rewind would go unflagged. Keep the later of two pending boundaries.
    let boundaryId = cursor.lastMsgId;
    if (boundaryId && !byId.has(boundaryId)) {
      boundaryId = null;
      for (let j = cursor.consumedSigs.length - 1; j >= 0; j--) {
        const id = cursor.consumedSigs[j]!.id;
        if (byId.has(id)) {
          boundaryId = id;
          break;
        }
      }
      // Nothing consumed survived (whole span replaced): anchor to the tip
      // so every re-consumed chunk carries the reconcile note.
      if (!boundaryId && messages.length > 0) {
        boundaryId = messages[messages.length - 1]!.id;
      }
    }
    if (boundaryId && posOf(boundaryId) > posOf(cursor.reconcileUntilMsgId)) {
      cursor.reconcileUntilMsgId = boundaryId;
    }
    cursor.consumedSigs = cursor.consumedSigs.slice(0, divergedAt);
    // Floor the rewind at the window's prefix boundary. consumedSigs[0] is not
    // message zero once the window has slid, so an empty slice means "rewind to
    // just before the window" (prefixMsgId), never "re-consume the whole chat".
    cursor.lastMsgId = cursor.consumedSigs.length
      ? cursor.consumedSigs[cursor.consumedSigs.length - 1]!.id
      : cursor.prefixMsgId;
    cursor.pendingReconcile = true;
    reconcile = true;
  }
  // A stored boundary whose message has since been deleted can never be
  // passed by position. Re-anchor it to the current tip: over-flagging later
  // chunks as reconcile is safe, silently dropping the flag is not.
  if (cursor.pendingReconcile && cursor.reconcileUntilMsgId && !byId.has(cursor.reconcileUntilMsgId)) {
    cursor.reconcileUntilMsgId = messages.length ? messages[messages.length - 1]!.id : null;
  }

  let startPos = 0;
  if (cursor.lastMsgId) {
    const idx = posById.get(cursor.lastMsgId);
    if (idx !== undefined) {
      startPos = idx + 1;
    } else {
      // The rewind anchor was itself deleted (an early swath went with the
      // edge divergence). Resume from the earliest still-live tracked message
      // so we re-do at most the tracked window, not the whole chat.
      let resume = -1;
      for (const rec of consumedBeforeRewind) {
        const p = posById.get(rec.id);
        if (p !== undefined) { resume = p; break; }
      }
      startPos = resume >= 0 ? resume : 0;
    }
  }
  const tail = messages.slice(startPos).filter(nonEmpty);
  const compressible = trimLag(tail, lagUnit, lagValue);
  return { messages, cursor, startPos, compressible, reconcile, rewound: divergedAt >= 0 };
}

/** Cap on the activated-lore reference block fed to the agent (~4k tokens). */
const LORE_CAP_CHARS = 16000;

/**
 * Non-LumiBooks activated lore for the agent's canon reference: character
 * books, world info, persona books - everything the host activated except
 * our own summary entries. getActivated returns metadata only, so contents
 * are resolved through each foreign book's entry list.
 */
async function activatedLoreText(chatId: string, userId: string): Promise<string | null> {
  const activated = await spindle.world_books.getActivated(chatId, userId).catch(() => null);
  if (!activated || activated.length === 0) return null;
  const ourBookId = await findBookForChat(chatId, userId).catch(() => null);

  const byBook = new Map<string, string[]>();
  for (const a of activated) {
    if (!a.bookId || a.bookId === ourBookId) continue;
    const list = byBook.get(a.bookId) ?? [];
    list.push(a.id);
    byBook.set(a.bookId, list);
  }
  if (byBook.size === 0) return null;

  const parts: string[] = [];
  let used = 0;
  let skipped = false;
  for (const [bookId, entryIds] of byBook) {
    const entries = await listAllEntries(bookId, userId).catch(() => []);
    const wanted = new Set(entryIds);
    for (const entry of entries) {
      if (!wanted.has(entry.id)) continue;
      const ext = (entry.extensions || {}) as Record<string, unknown>;
      if (ext[EXTENSION_KEY]) continue;
      // Our own codex mirror activating back into the agent's canon reference
      // would be a feedback loop, not lore.
      if (ext[CODEX_ENTRY_EXTENSION_KEY]) continue;
      const content = (entry.content || "").trim();
      if (!content) continue;
      const label = (entry.comment || "").trim();
      const block = label ? `[${label}]\n${content}` : content;
      // Skip over-budget blocks instead of stopping: one oversized entry must
      // not shadow every smaller entry behind it.
      if (used + block.length > LORE_CAP_CHARS) {
        skipped = true;
        continue;
      }
      parts.push(block);
      used += block.length;
    }
  }
  if (skipped) parts.push("[...more lore omitted for size...]");
  // The marker is pushed before the empty check so an all-oversized set still
  // signals that canon existed rather than vanishing silently.
  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

/**
 * Extra-context mode: recent chapter summaries (ghost or promoted) covering
 * the span behind the chunk, mirroring the previous-memories block the
 * chapter summarizer gets. Ghost chapters exist precisely so this context
 * reaches all the way up to the codex cursor instead of stopping at the
 * injection lag.
 */
async function storySoFarText(
  chatId: string,
  userId: string,
  profile: LMBProfile,
  chunkFirstIdx: number,
  posById: Map<string, number>,
): Promise<string | null> {
  if (!profile.codexExtraContext || profile.previousMemoriesCount <= 0) return null;
  const entries = await listLmbEntries(chatId, userId).catch(() => []);
  // chunkFirstIdx is a live position, so compare each chapter's LIVE end, not
  // its stored meta index which goes stale after deletions - otherwise a
  // future chapter could leak into this behind-the-window context block.
  const prior = entries
    .filter(
      (e) =>
        e.meta.tier === 1
        && !e.meta.isRoot
        && liveEndPosition(e.meta.msgIds, e.meta.lastMsgIdx, posById) < chunkFirstIdx,
    )
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0))
    .slice(-profile.previousMemoriesCount);
  if (prior.length === 0) return null;
  return prior.map((c) => c.raw.content || "").filter(Boolean).join("\n\n");
}

export interface CodexStatus {
  exists: boolean;
  backlog: number;
  lastRunAt: number | null;
}

export async function getCodexStatus(chatId: string, userId: string, profile: LMBProfile): Promise<CodexStatus> {
  const exists = (await codexPresence(chatId, userId)) === "present";
  if (!profile.codexEnabled && !exists) return { exists: false, backlog: 0, lastRunAt: null };
  try {
    const plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
    return { exists, backlog: plan.compressible.length, lastRunAt: plan.cursor.lastRunAt };
  } catch (err) {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists, backlog: 0, lastRunAt: null };
  }
}

async function runChunk(
  chatId: string,
  userId: string,
  profile: LMBProfile,
  plan: PlannedRun,
  chunk: ChatMessage[],
  automation: boolean,
  externalSignal: AbortSignal,
  progress: { chars: number; thinking: number },
): Promise<void> {
  // Files on disk were written under the PREVIOUS run's relations mode. On a
  // toggle, loading with the new mode would reject exactly the files the
  // migration run has to read, silently erasing them.
  const prevMode = plan.cursor.relationsTableMode;
  const diskMode = prevMode ?? profile.codexRelationsTable;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  const frozenFiles = new Set<CodexFileKey>(
    CODEX_FILE_KEYS.filter((k) => plan.cursor.fileStates[k] === "frozen"),
  );
  const notes: CodexRunNotes = {
    reconcile: plan.reconcile,
    migrateToTable: prevMode === false && profile.codexRelationsTable,
    migrateToInline: prevMode === true && !profile.codexRelationsTable,
    loadProblems: problems.map((p) => `${p.file}.json`),
    frozenFiles: [...frozenFiles].map((f) => `${f}.json`),
  };

  const posById = new Map(plan.messages.map((m, i) => [m.id, i] as const));
  const firstIdx = posById.get(chunk[0]!.id) ?? -1;
  const lastIdx = posById.get(chunk[chunk.length - 1]!.id) ?? -1;
  const chunkLabel = `messages ${firstIdx + 1}-${lastIdx + 1} of ${plan.messages.length}`;
  const lore = await activatedLoreText(chatId, userId);
  const storySoFar = await storySoFarText(chatId, userId, profile, firstIdx, posById);

  // Queued chunks share one stream buffer for the whole drain: a visible
  // divider keeps their rounds apart in the viewer.
  appendStreamText(userId, chatId, "codex", "text", `${progress.chars > 0 ? "\n\n" : ""}━━━ ${chunkLabel} ━━━\n`);

  const result = await runCodexAgent({
    chatId,
    userId,
    profile,
    bundle,
    // The unfiltered positional slice keeps transcript header numbers aligned
    // with the label even when empty messages sit inside the range (the
    // renderer skips empties but still counts their positions).
    chunk: plan.messages.slice(firstIdx, lastIdx + 1),
    chunkLabel,
    chunkFirstIndex: firstIdx,
    notes,
    lore,
    storySoFar,
    frozenFiles,
    progressBase: progress,
    externalSignal,
    onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
    onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta),
  });

  if (notes.migrateToInline) {
    // The agent cannot write relations.json in inline mode, so the stale
    // table would fail every future load and raise a bogus REPAIR note.
    await saveCodexFile(chatId, "relations", { relations: [] }, userId).catch((err) =>
      warn(`codex: failed to clear relations.json after inline migration: ${describeError(err)}`),
    );
  }

  // Consume the full positional range so skipped empty messages don't linger.
  for (let i = plan.startPos; i <= lastIdx; i++) {
    const m = plan.messages[i]!;
    plan.cursor.consumedSigs.push({ id: m.id, sig: msgSig(m.role, m.content || "") });
  }
  plan.cursor.lastMsgId = plan.messages[lastIdx]!.id;
  const reconcileUntilPos = plan.cursor.reconcileUntilMsgId
    ? plan.messages.findIndex((m) => m.id === plan.cursor.reconcileUntilMsgId)
    : -1;
  // Clear only when the boundary is provably passed. A vanished boundary id
  // (pos -1 with an id set) keeps the flag: planRun re-anchors it next pass.
  if (!plan.cursor.reconcileUntilMsgId || (reconcileUntilPos !== -1 && lastIdx >= reconcileUntilPos)) {
    plan.cursor.pendingReconcile = false;
    plan.cursor.reconcileUntilMsgId = null;
  }
  invalidateCodexInjectionCache(chatId);
  // File switches are user-owned and can flip mid-chunk: re-read them at save time.
  await withCursorLock(chatId, userId, async () => {
    const liveCursor = await loadCursor(chatId, userId).catch((err) => {
      warn(`codex: live cursor re-read failed before save: ${describeError(err)}`);
      return null;
    });
    if (liveCursor) {
      plan.cursor.fileStates = liveCursor.fileStates;
      plan.cursor.frozenAtRuns = liveCursor.frozenAtRuns;
    }
    plan.cursor.relationsTableMode = profile.codexRelationsTable;
    plan.cursor.lastRunAt = Date.now();
    plan.cursor.lastRunStats = {
      rounds: result.rounds,
      promptTokens: result.usagePromptTokens,
      completionTokens: result.usageCompletionTokens,
      model: result.model,
      ...(result.doneNote ? { note: result.doneNote } : {}),
    };
    plan.cursor.runs += 1;
    await saveCursor(chatId, plan.cursor, userId);
  });
  await publishCodexPool(chatId, userId, profile, result.changedFiles, "run");
  await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);

  if (result.changedFiles.length > 0) {
    cb?.onToast(userId, "success", `Memoria updated the codex (${result.changedFiles.length} file${result.changedFiles.length === 1 ? "" : "s"})`, automation);
  }
  cb?.onStateChange(userId, chatId);
}

async function drain(
  chatId: string,
  userId: string,
  profile: LMBProfile,
  lagValue: number,
  requireWindow: boolean,
  automation: boolean,
): Promise<number> {
  if (!setBusy(userId, chatId, "codex", "Memoria is updating the codex")) return 0;
  // One controller for the whole drain: aborting cancels the current chunk
  // and stops the loop, instead of racing a per-chunk controller swap.
  const controller = new AbortController();
  registerAborter(userId, chatId, "codex", controller);
  try {
    let runs = 0;
    // One cumulative progress counter for the whole drain, mirroring the
    // stream buffer's lifetime: without it the busy label reset to zero at
    // every queued chunk and sat frozen through silent tool-only rounds.
    const progress = { chars: 0, thinking: 0 };
    // Termination by progress: a rewound plan is a user edit, not a stall.
    const DRAIN_PASS_CAP = 500;
    let prevStartPos = -1;
    for (let pass = 0; pass < DRAIN_PASS_CAP; pass++) {
      if (controller.signal.aborted) throw new AbortedSummarizerError();
      const plan = await planRun(chatId, userId, profile.codexLagUnit, lagValue);
      if (plan.compressible.length === 0) break;
      if (requireWindow && !windowReached(plan.compressible, profile)) break;
      if (plan.rewound) {
        prevStartPos = plan.startPos - 1;
      } else if (plan.startPos <= prevStartPos) {
        warn(`codex drain stalled at message ${plan.startPos + 1} for ${chatId.slice(0, 8)} after ${runs} pass${runs === 1 ? "" : "es"}, stopping`);
        break;
      }
      prevStartPos = plan.startPos;
      const chunk = takeWindow(plan.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      await runChunk(chatId, userId, profile, plan, chunk, automation, controller.signal, progress);
      runs++;
    }
    return runs;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

/** Auto trigger: runs after each generation when enough backlog has built up. */
export async function maybeRunCodex(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
): Promise<void> {
  if (!settings.enabled || !profile.codexEnabled) return;
  // A fork drain before inheritance settles would forfeit the ancestor's codex.
  if (await forkCodexPending(chatId, userId).catch(() => false)) return;
  await ensureCodexEntriesSynced(chatId, userId, profile);
  try {
    await drain(chatId, userId, profile, profile.codexLagValue, true, true);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria closes the codex for now");
      return;
    }
    warn(`codex auto run failed: ${describeError(err)}`);
    cb?.onToast(userId, "error", `Memoria couldn't update the codex: ${shortErrorText(err)}`);
  }
}

/** Manual trigger: consumes everything up to the tail, ignoring lag and window. */
export async function runCodexNow(chatId: string, profile: LMBProfile, userId: string): Promise<void> {
  if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === chatId)) {
    cb?.onToast(userId, "warn", "Memoria is already updating the codex");
    return;
  }
  if (await forkCodexPending(chatId, userId).catch(() => false)) {
    cb?.onToast(userId, "info", "Memoria is still carrying the codex into this fork, try again in a moment");
    return;
  }
  await ensureCodexEntriesSynced(chatId, userId, profile);
  try {
    const runs = await drain(chatId, userId, profile, 0, false, false);
    if (runs === 0) {
      cb?.onToast(userId, "info", "The codex is already caught up");
    }
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria closes the codex for now");
      return;
    }
    warn(`codex manual run failed: ${describeError(err)}`);
    cb?.onToast(userId, "error", `Memoria couldn't update the codex: ${shortErrorText(err)}`);
  }
}

/** Injection text cache: rendering means ~10 storage reads per generation,
 * paid inside the host's interceptor time budget. Codex files only change
 * through paths in this process (agent runs, hand-saves, resets), all of
 * which invalidate; the TTL is a backstop. */
const INJECTION_CACHE_TTL_MS = 60_000;
const INJECTION_CACHE_CAP = 200;
const injectionTextCache = new Map<string, { at: number; text: string | null }>();
const fileTokensCache = new Map<string, { at: number; tokens: Record<string, number> }>();

export function invalidateCodexInjectionCache(chatId?: string): void {
  if (chatId) {
    injectionTextCache.delete(chatId);
    fileTokensCache.delete(chatId);
  } else {
    injectionTextCache.clear();
    fileTokensCache.clear();
  }
}

/** Approx prompt cost per file, priced on the RENDERED injection text (what
 * actually ships), not the raw JSON with its syntax overhead. */
export async function getCodexFileTokens(chatId: string, userId: string, profile: LMBProfile): Promise<Record<string, number>> {
  const cached = fileTokensCache.get(chatId);
  if (cached && Date.now() - cached.at < INJECTION_CACHE_TTL_MS) return cached.tokens;
  const tokens: Record<string, number> = {};
  let exists: boolean;
  try {
    exists = (await codexPresence(chatId, userId)) === "present";
  } catch (err) {
    warn(`codex file tokens skipped, storage fault: ${describeError(err)}`);
    return tokens;
  }
  if (exists) {
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const sections = renderCodexFileSections(bundle);
    for (const key of CODEX_FILE_KEYS) {
      tokens[key] = sections[key] ? approximateTokensFromChars(sections[key].length) : 0;
    }
  }
  fileTokensCache.set(chatId, { at: Date.now(), tokens });
  while (fileTokensCache.size > INJECTION_CACHE_CAP) {
    const oldest = fileTokensCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    fileTokensCache.delete(oldest);
  }
  return tokens;
}

/** Rendered codex block for prompt injection, or null when there is nothing to say. */
export async function buildCodexInjectionText(
  chatId: string,
  userId: string,
  profile: LMBProfile,
): Promise<string | null> {
  if (!profile.codexEnabled) return null;
  const cached = injectionTextCache.get(chatId);
  if (cached && Date.now() - cached.at < INJECTION_CACHE_TTL_MS) return cached.text;
  let exists: boolean;
  try {
    exists = (await codexPresence(chatId, userId)) === "present";
  } catch (err) {
    warn(`codex injection text skipped, storage fault: ${describeError(err)}`);
    return null;
  }
  let text: string | null = null;
  if (exists) {
    // Validate with the mode the files were written under, not the profile's
    // current mode - between a toggle and the migration run they differ.
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    // Files the user switched off (noInject or frozen) are blanked before
    // rendering so their sections vanish from the prompt.
    for (const key of CODEX_FILE_KEYS) {
      const st = cursor.fileStates[key];
      if (st === "noInject" || st === "frozen") {
        (bundle as Record<CodexFileKey, CodexFileValue>)[key] = emptyCodexFile(key);
      }
    }
    text = bundleIsEmpty(bundle) ? null : renderCodexForInjection(bundle);
  }
  if (injectionTextCache.has(chatId)) injectionTextCache.delete(chatId);
  injectionTextCache.set(chatId, { at: Date.now(), text });
  while (injectionTextCache.size > INJECTION_CACHE_CAP) {
    const oldest = injectionTextCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    injectionTextCache.delete(oldest);
  }
  return text;
}

/** Publish the current codex to the shared RPC pool so other extensions can
 * read it (`lumi_books.codex.<chatId>` and `.rendered`). */
export async function publishCodexPool(
  chatId: string,
  userId: string,
  profile: LMBProfile,
  changedFiles: string[],
  reason: CodexChangeReason,
): Promise<void> {
  try {
    let presence: "present" | "absent";
    try {
      presence = await codexPresence(chatId, userId);
    } catch (err) {
      warn(`codex pool publish skipped, storage fault: ${describeError(err)}`);
      return;
    }
    if (presence === "absent") {
      publishCodexWiped(chatId, userId);
      return;
    }
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const rendered = await buildCodexInjectionText(chatId, userId, profile);
    publishCodexSnapshot(chatId, {
      chatId,
      userId,
      files: bundle as unknown as Record<string, unknown>,
      fileStates: cursor.fileStates,
      runs: cursor.runs,
      updatedAt: Date.now(),
    }, rendered);
    publishCodexUpdated({ chatId, userId, changedFiles, reason });
  } catch (err) {
    warn(`codex pool publish failed: ${describeError(err)}`);
  }
}

/* --------------------------------------------------- file states + tidy */

export interface CodexPanelState {
  fileStates: Record<string, CodexFileState>;
  /** Frozen files that missed at least one run: re-enabling should offer a rebuild. */
  staleFiles: string[];
}

export async function getCodexPanelState(chatId: string, userId: string): Promise<CodexPanelState> {
  const exists = await codexExists(chatId, userId);
  if (!exists) return { fileStates: {}, staleFiles: [] };
  const cursor = await loadCursor(chatId, userId);
  const staleFiles: string[] = [];
  for (const [file, st] of Object.entries(cursor.fileStates)) {
    if (st !== "frozen") continue;
    const at = cursor.frozenAtRuns[file];
    if (typeof at === "number" && cursor.runs > at) staleFiles.push(file);
  }
  return { fileStates: cursor.fileStates, staleFiles };
}

export async function setCodexFileState(
  chatId: string,
  userId: string,
  file: CodexFileKey,
  state: CodexFileState,
): Promise<void> {
  await withCursorLock(chatId, userId, async () => {
    const cursor = await loadCursor(chatId, userId);
    if (state === "on") delete cursor.fileStates[file];
    else cursor.fileStates[file] = state;
    if (state === "frozen") cursor.frozenAtRuns[file] = cursor.runs;
    else delete cursor.frozenAtRuns[file];
    await saveCursor(chatId, cursor, userId);
  });
  invalidateCodexInjectionCache(chatId);
  // Mirror the switch onto the synced entries (disabled flag, and relations
  // folding in or out of entity entries).
  await syncEntriesGuarded(chatId, userId);
}

/** Wipe the codex but carry the user's per-file switches into the fresh
 * cursor, then re-read the whole chat from message zero. */
export async function rebuildCodex(chatId: string, profile: LMBProfile, userId: string): Promise<void> {
  // The wipe holds the busy flag itself, or a racing drain resurrects the old codex.
  if (!setBusy(userId, chatId, "codex", "Memoria is clearing the codex for a rebuild")) {
    cb?.onToast(userId, "warn", "Memoria is already working on the codex, abort that first");
    return;
  }
  try {
    const prev = await loadCursor(chatId, userId).catch(() => emptyCursor());
    // Frozen means "no updates", not "erase": their contents survive the wipe.
    const frozenKeys = CODEX_FILE_KEYS.filter((k) => prev.fileStates[k] === "frozen");
    const kept: Partial<Record<CodexFileKey, CodexFileValue>> = {};
    if (frozenKeys.length > 0) {
      const diskMode = prev.relationsTableMode ?? profile.codexRelationsTable;
      const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
      const broken = new Set(problems.map((p) => p.file));
      for (const k of frozenKeys) {
        if (!broken.has(k)) kept[k] = bundle[k];
      }
    }
    const failed = await deleteCodex(chatId, userId);
    invalidateCodexInjectionCache(chatId);
    if (failed.length > 0) {
      cb?.onToast(userId, "error", `Memoria couldn't clear ${failed.length} codex file${failed.length === 1 ? "" : "s"}, rebuild aborted`);
      return;
    }
    publishCodexWiped(chatId, userId);
    await wipeCodexEntries(chatId, userId).catch((err) => {
      warn(`codex rebuild: entry wipe failed: ${describeError(err)}`);
      cb?.onToast(userId, "error", `Memoria couldn't clear the codex lorebook entries: ${shortErrorText(err)}`);
    });
    const keptKeys = Object.keys(kept) as CodexFileKey[];
    if (Object.keys(prev.fileStates).length > 0 || keptKeys.length > 0) {
      await withCursorLock(chatId, userId, async () => {
        const fresh = emptyCursor();
        fresh.fileStates = prev.fileStates;
        for (const k of keptKeys) fresh.frozenAtRuns[k] = 0;
        if (keptKeys.length > 0) fresh.relationsTableMode = prev.relationsTableMode;
        await saveCursor(chatId, fresh, userId);
      });
      for (const k of keptKeys) {
        await saveCodexFile(chatId, k, kept[k]!, userId);
      }
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
  await runCodexNow(chatId, profile, userId);
}

/** One LLM pass that compresses the chosen files in place without reading
 * any new story turns. */
export async function runCodexTidy(
  chatId: string,
  profile: LMBProfile,
  userId: string,
  only?: CodexFileKey[],
): Promise<void> {
  if (!setBusy(userId, chatId, "codex", "Memoria is tidying the codex")) {
    cb?.onToast(userId, "warn", "Memoria is already working on the codex");
    return;
  }
  const controller = new AbortController();
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    // A pending relations-format migration belongs to the next chunk run, not tidy.
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb?.onToast(userId, "warn", "The relations format changed, run Update now first so Memoria can migrate the codex before tidying");
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const frozenFiles = new Set<CodexFileKey>(
      CODEX_FILE_KEYS.filter((k) => cursor.fileStates[k] === "frozen"),
    );
    const broken = new Set(problems.map((p) => p.file));
    const targets = (only ?? [...CODEX_FILE_KEYS]).filter(
      (k) => !frozenFiles.has(k) && !broken.has(k) && !fileIsEmpty(bundle, k),
    );
    if (targets.length === 0) {
      cb?.onToast(userId, "info", "Nothing to tidy, those records are empty, frozen, or unreadable");
      return;
    }
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes: { reconcile: false, migrateToTable: false, migrateToInline: false, loadProblems: [] },
      lore: null,
      storySoFar: null,
      frozenFiles,
      userTextOverride: buildCodexTidyMessage(bundle, targets),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta),
    });
    invalidateCodexInjectionCache(chatId);
    if (result.changedFiles.length > 0) {
      await publishCodexPool(chatId, userId, profile, result.changedFiles, "tidy");
      await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
      cb?.onToast(userId, "success", `Memoria tidied ${result.changedFiles.length} codex file${result.changedFiles.length === 1 ? "" : "s"}`);
    } else {
      cb?.onToast(userId, "info", "Memoria found nothing worth tightening");
    }
    cb?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the tidying aside");
      return;
    }
    warn(`codex tidy failed: ${describeError(err)}`);
    cb?.onToast(userId, "error", `Memoria couldn't tidy the codex: ${shortErrorText(err)}`);
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

function fileIsEmpty(bundle: CodexBundle, key: CodexFileKey): boolean {
  const v = bundle[key] as unknown as Record<string, unknown[]>;
  return Object.values(v).every((arr) => !Array.isArray(arr) || arr.length === 0);
}

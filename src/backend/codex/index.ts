declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { WorldBookEntryDTO } from "lumiverse-spindle-types";
import type { LMBProfile, LMBSettings } from "../../shared";
import { CODEX_ENTRY_EXTENSION_KEY, EXTENSION_KEY, approximateTokensFromChars } from "../../shared";
import type { ChatMessage } from "../coverage";
import { buildCoverage, isExcluded, liveEndPosition, sumApproxTokens } from "../coverage";
import type { CodexCursor, CodexFileState } from "./store";
import { codexExists, codexPresence, emptyCursor, loadCodex, loadCursor, msgSig, saveCodexFile, saveCursor, withCursorLock } from "./store";
import { CODEX_FILE_KEYS, bundleIsEmpty, emptyCodexFile, isCodexFileKey, type CodexBundle, type CodexFileKey, type CodexFileValue } from "./schema";
import { CodexContextError, CodexValidationError, ToolProtocolError, codexMaxInputTokens, resolveCodexConnection, runCodexAgent } from "./agent";
import {
  buildCodexRebuildMessage,
  buildCodexReconcileMessage,
  buildCodexRefreshMessage,
  buildCodexSummaryCatchupMessage,
  buildCodexSystemPrompt,
  buildCodexTidyMessage,
  buildCodexUltraMessage,
  buildCodexUserMessage,
  makeCodexPromptCtx,
  renderCodexFileSections,
  renderCodexForInjection,
  type CodexPromptCtx,
  type CodexRunNotes,
} from "./prompt";
import { loadSettings } from "../storage";
import { syncCodexEntries, wipeCodexEntries } from "./sync";
import { snapshotCodexForUndo } from "./backup";
import {
  AbortedSummarizerError,
  buildCodexSamplerParameters,
  renderTranscript,
  resolveMacrosWithDiagnostics,
  type DryRunAssembly,
} from "../summarizer";
import { abortBusy, appendStreamText, clearBusy, drainChapterBacklog, getBusy, maybeRunArcCheck, registerAborter, setBusy, shortErrorText, updateProgressNumbers } from "../pipeline";
import { findBookForChat, listAllEntries, listLmbEntries, type LMBEntry } from "../world-book";
import { publishCodexSnapshot, publishCodexUpdated, publishCodexWiped, type CodexChangeReason } from "../hooks";
import { forkCodexPending, forkShelfPending } from "../fork";
import { describeError, warn } from "../runtime";


export interface CodexCallbacks {
  onToast(userId: string, tone: "success" | "info" | "warn" | "error", text: string, automation?: boolean): void;
  onStateChange(userId: string, chatId: string): void;
  /** A run died on ToolProtocolError: offer the JSON fallback in the UI. */
  onToolsHint?(userId: string, chatId: string): void;
}

/** Shared failure tail for every codex entry point: toast the error, and on
 * a tool-transport failure also surface the JSON-fallback offer. */
function reportCodexFailure(userId: string, chatId: string, verb: string, err: unknown): void {
  // These carry their remedy and what survived past the first sentence, which
  // is exactly what shortErrorText would cut off.
  if (err instanceof CodexContextError || err instanceof CodexValidationError) {
    cb?.onToast(userId, "error", err.message);
    return;
  }
  cb?.onToast(userId, "error", `Memoria couldn't ${verb} the codex: ${shortErrorText(err)}`);
  if (err instanceof ToolProtocolError) cb?.onToolsHint?.(userId, chatId);
}

/** The lore reference budget in tokens: a share of the codex max input, or
 * the profile's flat cap (0 = no limit). */
function effectiveLoreLimitTokens(profile: LMBProfile): number {
  if (profile.codexLoreLimitUnit === "tokens") return profile.codexLoreLimitTokens;
  return Math.max(1, Math.floor((codexMaxInputTokens(profile) * profile.codexLoreLimitPercent) / 100));
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

/**
 * Non-LumiBooks activated lore for the agent's canon reference: character
 * books, world info, persona books - everything the host activated except
 * our own summary entries. getActivated returns metadata only, so contents
 * are resolved through each foreign book's entry list, then packed in the
 * host's own activation order. The default sends everything the host
 * activated (it already curated the set by relevance); a profile limit
 * (limitTokens > 0) skips whole entries past the budget, dropping the
 * activation-order tail rather than cutting an entry mid-fact.
 */
async function activatedLoreText(chatId: string, userId: string, limitTokens: number): Promise<string | null> {
  const activated = await spindle.world_books.getActivated(chatId, userId).catch(() => null);
  if (!activated || activated.length === 0) return null;
  const ourBookId = await findBookForChat(chatId, userId).catch(() => null);

  const bookIds = new Set<string>();
  for (const a of activated) {
    if (a.bookId && a.bookId !== ourBookId) bookIds.add(a.bookId);
  }
  if (bookIds.size === 0) return null;
  const entryById = new Map<string, WorldBookEntryDTO>();
  for (const bookId of bookIds) {
    for (const entry of await listAllEntries(bookId, userId).catch(() => [])) {
      entryById.set(entry.id, entry);
    }
  }

  const capChars = limitTokens > 0 ? limitTokens * 4 : Number.POSITIVE_INFINITY;
  const parts: string[] = [];
  let used = 0;
  let skipped = false;
  for (const a of activated) {
    if (!a.bookId || a.bookId === ourBookId) continue;
    const entry = entryById.get(a.id);
    if (!entry) continue;
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
    if (used + block.length > capChars) {
      skipped = true;
      continue;
    }
    parts.push(block);
    used += block.length;
  }
  if (skipped) parts.push(LORE_OMITTED_MARKER);
  // The marker is pushed before the empty check so an all-oversized set still
  // signals that canon existed rather than vanishing silently.
  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

const LORE_OMITTED_MARKER = "[...more lore omitted for size...]";

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
  if (!profile.codexExtraContext || profile.codexStorySoFarCount <= 0) return null;
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
    .slice(-profile.codexStorySoFarCount);
  if (prior.length === 0) return null;
  return prior.map((c) => c.raw.content || "").filter(Boolean).join("\n\n");
}

export interface CodexStatus {
  exists: boolean;
  backlog: number;
  lastRunAt: number | null;
  /** Estimated slow-mode passes the current backlog would take. */
  backlogPasses: number;
}

export async function getCodexStatus(chatId: string, userId: string, profile: LMBProfile): Promise<CodexStatus> {
  const exists = (await codexPresence(chatId, userId)) === "present";
  if (!profile.codexEnabled && !exists) return { exists: false, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  try {
    const plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
    let backlogPasses = 0;
    let rest = plan.compressible;
    while (rest.length > 0 && backlogPasses < 99) {
      const w = takeWindow(rest, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      if (w.length === 0) break;
      rest = rest.slice(w.length);
      backlogPasses++;
    }
    return { exists, backlog: plan.compressible.length, lastRunAt: plan.cursor.lastRunAt, backlogPasses };
  } catch (err) {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  }
}

/** Newest window-sized tail, for a dry run on a fully consumed chat. */
function previewTail(messages: ChatMessage[], profile: LMBProfile): ChatMessage[] {
  if (profile.codexWindowUnit === "messages") return messages.slice(-Math.max(1, profile.codexWindowValue));
  const out: ChatMessage[] = [];
  let acc = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    out.unshift(messages[i]!);
    acc += approximateTokensFromChars((messages[i]!.content || "").length);
    if (acc >= profile.codexWindowValue) break;
  }
  return out;
}

/**
 * Assemble exactly what the next codex run would send (system and user
 * message, host macros resolved, frozen files omitted) without calling the
 * model. Mirrors runChunk's assembly step for step.
 */
export async function dryRunCodex(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
): Promise<DryRunAssembly> {
  const conn = await resolveCodexConnection(profile, userId);
  const diagnostics: Array<{ message: string }> = [];
  let plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
  let chunk: ChatMessage[];
  if (plan.compressible.length > 0) {
    chunk = takeWindow(plan.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
    if (!windowReached(plan.compressible, profile)) {
      diagnostics.push({ message: "The window has not filled yet, automation would wait. Update now would consume this chunk." });
    }
  } else {
    const eager = await planRun(chatId, userId, profile.codexLagUnit, 0);
    if (eager.compressible.length > 0) {
      plan = eager;
      chunk = takeWindow(eager.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      diagnostics.push({ message: "The lag reserve still holds these turns, automation would wait. Update now would consume them." });
    } else {
      const eligible = plan.messages.filter(nonEmpty);
      if (eligible.length === 0) throw new Error("Chat has no messages");
      chunk = previewTail(eligible, profile);
      diagnostics.push({ message: "The codex has read everything, so this preview reuses the newest turns. A real run would wait for new messages." });
    }
  }
  if (chunk.length === 0) throw new Error("No consumable window, send a message and try again");

  const prevMode = plan.cursor.relationsTableMode;
  const diskMode = prevMode ?? profile.codexRelationsTable;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  const frozenFiles = new Set<CodexFileKey>(
    CODEX_FILE_KEYS.filter((k) => plan.cursor.fileStates[k] === "frozen"),
  );
  if (frozenFiles.size === CODEX_FILE_KEYS.length) {
    throw new Error("Every codex record is frozen, unfreeze one to preview a run");
  }
  const notes: CodexRunNotes = {
    reconcile: plan.reconcile,
    migrateToTable: prevMode === false && profile.codexRelationsTable,
    migrateToInline: prevMode === true && !profile.codexRelationsTable,
    loadProblems: problems.map((p) => `${p.file}.json`),
  };
  const promptCtx = makeCodexPromptCtx(profile, settings.customPresets, frozenFiles);

  const posById = new Map(plan.messages.map((m, i) => [m.id, i] as const));
  const firstIdx = posById.get(chunk[0]!.id) ?? 0;
  const lastIdx = posById.get(chunk[chunk.length - 1]!.id) ?? firstIdx;
  const chunkLabel = `messages ${firstIdx + 1}-${lastIdx + 1} of ${plan.messages.length}`;
  const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
  const storySoFar = await storySoFarText(chatId, userId, profile, firstIdx, posById);

  const system = await resolveMacrosWithDiagnostics(buildCodexSystemPrompt(promptCtx), chatId, userId, diagnostics);
  const user = buildCodexUserMessage(
    promptCtx, bundle, plan.messages.slice(firstIdx, lastIdx + 1), chunkLabel, firstIdx, notes, lore, storySoFar,
  );

  const preset = settings.customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey);
  const overrideCount = preset?.templates ? Object.keys(preset.templates).length : 0;
  diagnostics.push({ message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` });
  diagnostics.push({ message: `Transport: ${promptCtx.useTools ? "tool calls" : "strict JSON"}` });
  diagnostics.push({
    message: `Update delivery: ${promptCtx.sequential ? "one record per reply" : "all records in one reply"}`
      + `, and every record must be written or skipped before Memoria accepts the update (${[...promptCtx.activeFiles].length} to cover)`,
  });
  diagnostics.push({
    message: `Preset: ${preset ? `Custom: ${preset.displayName}` : "Built-in: Default"}${overrideCount ? ` (${overrideCount} template${overrideCount === 1 ? "" : "s"} customized)` : ""}`,
  });
  diagnostics.push({
    message: `Relations mode: ${profile.codexRelationsTable ? "table" : "inline ties"}${notes.migrateToTable || notes.migrateToInline ? " (format changed, this run would migrate)" : ""}`,
  });
  diagnostics.push({ message: `Active files: ${[...promptCtx.activeFiles].join(", ")}` });
  if (frozenFiles.size) diagnostics.push({ message: `Frozen, omitted from the prompt entirely: ${[...frozenFiles].join(", ")}` });
  diagnostics.push({ message: `Chunk: ${chunkLabel} (${chunk.length} message${chunk.length === 1 ? "" : "s"})` });
  if (plan.reconcile) diagnostics.push({ message: "Reconcile pending: the story was edited behind the codex, the reconcile note is included" });
  if (notes.loadProblems.length) diagnostics.push({ message: `Unreadable files shown empty: ${notes.loadProblems.join(", ")}` });
  const lockedEntities: string[] = [];
  const fieldLocked: string[] = [];
  for (const key of ["characters", "locations", "things"] as const) {
    for (const e of bundle[key].entities) {
      if (e.locked === true) lockedEntities.push(e.id);
      if (Array.isArray(e.lockedFields) && e.lockedFields.length) fieldLocked.push(e.id);
    }
  }
  if (lockedEntities.length || fieldLocked.length) {
    diagnostics.push({
      message: `Locks: ${lockedEntities.length} locked entit${lockedEntities.length === 1 ? "y" : "ies"}, ${fieldLocked.length} with locked fields (masked in the prompt)`,
    });
  }
  if (storySoFar) diagnostics.push({ message: `Story-so-far context: ~${approximateTokensFromChars(storySoFar.length)} tokens` });
  if (lore) diagnostics.push({ message: `Activated lore reference: ~${approximateTokensFromChars(lore.length)} tokens` });
  if (lore?.includes(LORE_OMITTED_MARKER)) {
    diagnostics.push({
      message: `Activated lore exceeded the lore limit (${effectiveLoreLimitTokens(profile)} tokens): entries past the budget were skipped whole and the omission marker tells the agent more canon exists`,
    });
  }
  diagnostics.push({ message: `Thorough mode: ${profile.codexThorough ? "on, one verification round follows a clean update" : "off"}` });
  diagnostics.push({
    message: `Prompt size: ~${approximateTokensFromChars(system.length)} tokens system + ~${approximateTokensFromChars(user.length)} tokens user (codex max input ${codexMaxInputTokens(profile)})`,
  });
  const promptTokens = approximateTokensFromChars(system.length + user.length);
  if (promptTokens > codexMaxInputTokens(profile)) {
    diagnostics.push({ message: `WOULD FAIL: ${new CodexContextError(promptTokens, codexMaxInputTokens(profile)).message}` });
  }
  diagnostics.push({ message: `Sampler parameters being sent on the wire: ${JSON.stringify(buildCodexSamplerParameters(profile))}` });

  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    diagnostics,
  };
}

/** Replacement agent user message for catch-up passes. */
type CatchupTextBuilder = (
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  notes: CodexRunNotes,
  chunkLabel: string,
  lore: string | null,
) => string;

async function runChunk(
  chatId: string,
  userId: string,
  profile: LMBProfile,
  plan: PlannedRun,
  chunk: ChatMessage[],
  automation: boolean,
  externalSignal: AbortSignal,
  progress: { chars: number; thinking: number },
  buildUserText?: CatchupTextBuilder,
  wantLore = false,
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
  };
  const settings = await loadSettings(userId);
  const promptCtx = makeCodexPromptCtx(profile, settings.customPresets, frozenFiles);
  // A frozen file the migration must rewrite would deadlock the gates below
  // with a generic error every run; fail actionably instead.
  if (notes.migrateToTable || notes.migrateToInline) {
    const blocked = (["characters", "locations", "things", "relations"] as const).filter((k) => frozenFiles.has(k));
    if (blocked.length) {
      throw new Error(`The relations format changed - unfreeze ${blocked.map((k) => `${k}.json`).join(", ")} so Memoria can migrate`);
    }
  }

  const posById = new Map(plan.messages.map((m, i) => [m.id, i] as const));
  const firstIdx = posById.get(chunk[0]!.id) ?? -1;
  const lastIdx = posById.get(chunk[chunk.length - 1]!.id) ?? -1;
  const chunkLabel = `messages ${firstIdx + 1}-${lastIdx + 1} of ${plan.messages.length}`;
  const lore = !buildUserText || wantLore ? await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile)) : null;
  const storySoFar = buildUserText ? null : await storySoFarText(chatId, userId, profile, firstIdx, posById);

  // Queued chunks share one stream buffer for the whole drain: a visible
  // divider keeps their rounds apart in the viewer.
  appendStreamText(userId, chatId, "codex", "text", `${progress.chars > 0 ? "\n\n" : ""}━━━ ${chunkLabel} ━━━\n`);

  const result = await runCodexAgent({
    chatId,
    userId,
    profile,
    promptCtx,
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
    timelineAppendOnly: !notes.reconcile,
    ...(buildUserText ? { userTextOverride: buildUserText(promptCtx, bundle, notes, chunkLabel, lore) } : {}),
    progressBase: progress,
    externalSignal,
    onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
    onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta),
  });

  if (notes.migrateToInline) {
    // The agent cannot write relations.json in inline mode, so the stale
    // table would fail every future load and raise a bogus REPAIR note.
    const lockedIds = new Set(
      (["characters", "locations", "things"] as const)
        .flatMap((k) => bundle[k].entities.filter((e) => e.locked === true).map((e) => e.id)),
    );
    const stuck = bundle.relations.relations.filter((r) =>
      (r.type === "pair" ? [r.a, r.b] : r.members).every((m) => lockedIds.has(m)),
    ).length;
    if (stuck > 0) {
      cb?.onToast(userId, "warn", `${stuck} relation${stuck === 1 ? "" : "s"} between locked entries could not be folded onto their sheets and will be dropped`);
    }
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
): Promise<number | null> {
  // Null means another run holds the busy flag, distinct from "nothing to do".
  if (!setBusy(userId, chatId, "codex", "Memoria is updating the codex")) return null;
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
      // Every file frozen means there is nothing the agent could write: a
      // pass would burn a full-context call on a guaranteed no-op.
      if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen")) break;
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
  // Entry sync stays on the generation cadence even in manual mode: it is what
  // sweeps entries orphaned by a wipe this process never saw.
  await ensureCodexEntriesSynced(chatId, userId, profile);
  if (profile.codexManualOnly) return;
  try {
    await snapshotCodexForUndo(chatId, userId, "automatic update");
    await drain(chatId, userId, profile, profile.codexLagValue, true, true);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria closes the codex for now");
      return;
    }
    warn(`codex auto run failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "update", err);
  }
}

export type CodexUpdateMode = "slow" | "fast" | "ultra";

/** Provider phrasings for a prompt that outgrew the model's context. */
const CONTEXT_ERROR_RE = /context[ _](?:window|length|size|limit)|maximum context|prompt is too long|too many tokens|max(?:imum)? (?:input )?tokens|token limit|input is too (?:long|large)/i;

/** Manual trigger: consumes everything up to the tail, ignoring lag and window. */
export async function runCodexNow(
  chatId: string,
  profile: LMBProfile,
  userId: string,
  mode: CodexUpdateMode = "slow",
  settings: LMBSettings | null = null,
): Promise<void> {
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
    const runs = mode === "slow"
      ? await drain(chatId, userId, profile, 0, false, false)
      : await catchupCodex(chatId, profile, settings, userId, mode);
    if (runs === 0) {
      const cursor = await loadCursor(chatId, userId).catch(() => null);
      if (cursor && CODEX_FILE_KEYS.every((k) => cursor.fileStates[k] === "frozen")) {
        cb?.onToast(userId, "info", "Every codex record is frozen, unfreeze one so Memoria can update it");
        return;
      }
      // Nothing consumable can still hide a pending reconcile: the deleted
      // tail left no unread turns, so sweep the codex against the story now.
      const swept = await maybeReconcileSweep(chatId, profile, userId);
      if (!swept) cb?.onToast(userId, "info", "The codex is already caught up");
    }
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria closes the codex for now");
      return;
    }
    warn(`codex manual run failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "update", err);
    if (mode !== "slow" && !(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb?.onToast(userId, "warn", "Fast catch-up needs the codex model's context to be at least the story model's, pick a larger context codex connection or use slow mode");
    }
  }
}

const CATCHUP_PASS_CAP = 200;

/** Live positional span of an entry's covered messages. */
function liveSpan(e: LMBEntry, posById: Map<string, number>): { start: number; end: number } {
  let start = Number.MAX_SAFE_INTEGER;
  let end = -1;
  for (const id of e.meta.msgIds) {
    const p = posById.get(id);
    if (p === undefined) continue;
    if (p < start) start = p;
    if (p > end) end = p;
  }
  return { start, end };
}

function entryBlock(e: LMBEntry): string {
  const head = (e.raw.comment || "").trim();
  const text = (e.raw.content || "").trim();
  return head ? `[${head}]\n${text}` : text;
}

interface SummaryBatch {
  endIdx: number;
  blocks: string[];
}

/** Next fast-mode batch of chapter summaries (raw gaps spliced in), packed
 * to one pass's token budget; null once no summarized span lies ahead. */
function nextSummaryBatch(plan: PlannedRun, chapters: LMBEntry[], profile: LMBProfile): SummaryBatch | null {
  const posById = new Map(plan.messages.map((m, i) => [m.id, i] as const));
  const spans = chapters
    .map((e) => ({ e, ...liveSpan(e, posById) }))
    .filter((s) => s.end >= plan.startPos && s.start !== Number.MAX_SAFE_INTEGER)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  if (spans.length === 0) return null;

  const budget = Math.max(4000, profile.codexTokenBreakpoint);
  const blocks: string[] = [];
  let used = 0;
  let pos = plan.startPos;
  let endIdx = -1;
  for (const s of spans) {
    if (s.end < pos) continue;
    if (s.start > pos) {
      let gapEnd = s.start - 1;
      // A gap opening the batch splits at the budget instead of shipping unbounded.
      if (blocks.length === 0) {
        let acc = 0;
        for (let i = pos; i < s.start; i++) {
          acc += approximateTokensFromChars((plan.messages[i]!.content || "").length);
          if (acc >= budget && i < s.start - 1) {
            gapEnd = i;
            break;
          }
        }
      }
      const gapText = renderTranscript(plan.messages.slice(pos, gapEnd + 1), true, pos);
      if (gapText.trim()) {
        const gapTokens = approximateTokensFromChars(gapText.length);
        if (blocks.length > 0 && used + gapTokens > budget) break;
        blocks.push(`RAW TURNS (no chapter covers messages ${pos + 1}-${gapEnd + 1} of ${plan.messages.length}):\n${gapText}`);
        used += gapTokens;
      }
      // The gap consumes with this batch, not the final raw pass.
      pos = gapEnd + 1;
      endIdx = Math.max(endIdx, gapEnd);
      if (gapEnd < s.start - 1) break;
      if (used >= budget) break;
    }
    const block = entryBlock(s.e);
    const tokens = approximateTokensFromChars(block.length);
    if (blocks.length > 0 && used + tokens > budget) break;
    blocks.push(block);
    used += tokens;
    pos = Math.max(pos, s.end + 1);
    endIdx = Math.max(endIdx, s.end);
    if (used >= budget) break;
  }
  if (endIdx < plan.startPos || blocks.length === 0) return null;
  return { endIdx, blocks };
}

/** The story as its filed summaries (ghosts included, raw gaps spliced in,
 * oldest first) plus the raw uncovered tail - the ultra input shape. */
async function activeStoryContext(
  chatId: string,
  userId: string,
  messages: ChatMessage[],
): Promise<{ books: string[]; tailTranscript: string | null }> {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, true);
  const posById = new Map(messages.map((m, i) => [m.id, i] as const));
  // Entries with no live span (roots, dead chapters) sort by their stored
  // index; roots carry negative indexes so pre-history leads.
  const items = coverage.activeEntries
    .map((e) => {
      const s = liveSpan(e, posById);
      return { pos: s.start !== Number.MAX_SAFE_INTEGER ? s.start : (e.meta.firstMsgIdx ?? 0), text: entryBlock(e) };
    })
    .filter((b) => b.text);
  // Tail starts after the LAST covered message; keying on the first
  // uncovered one would let one excluded message force a whole-chat raw dump.
  let lastCovered = -1;
  for (let i = 0; i < messages.length; i++) {
    if (coverage.coveredBy.has(messages[i]!.id)) lastCovered = i;
  }
  const tailStart = lastCovered + 1;
  // Uncovered spans behind the tail (deleted or never-filed chapters)
  // ride along as raw turns; excluded-only runs stay out.
  let runStart = -1;
  let runHasContent = false;
  const flushRun = (endIdx: number): void => {
    if (runStart !== -1 && runHasContent) {
      const text = renderTranscript(messages.slice(runStart, endIdx + 1), true, runStart);
      if (text.trim()) {
        items.push({ pos: runStart, text: `RAW TURNS (no summary covers messages ${runStart + 1}-${endIdx + 1}):\n${text}` });
      }
    }
    runStart = -1;
    runHasContent = false;
  };
  for (let i = 0; i < tailStart; i++) {
    const m = messages[i]!;
    if (coverage.coveredBy.has(m.id)) {
      flushRun(i - 1);
      continue;
    }
    if (runStart === -1) runStart = i;
    if ((m.content || "").trim() && !isExcluded(m)) runHasContent = true;
  }
  flushRun(tailStart - 1);
  const books = items.sort((a, b) => a.pos - b.pos).map((b) => b.text);
  const tailText = tailStart < messages.length
    ? renderTranscript(messages.slice(tailStart), true, tailStart)
    : "";
  return { books, tailTranscript: tailText.trim() ? tailText : null };
}

/** Fast/ultra catch-up: books first (automation on), then summary replay
 * batches (fast) or one active-context pass (ultra), raw remainder last. */
async function catchupCodex(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings | null,
  userId: string,
  mode: "fast" | "ultra",
): Promise<number | null> {
  if (!setBusy(userId, chatId, "codex", `Memoria is catching up the codex (${mode === "ultra" ? "ultra fast" : "fast"})`)) {
    cb?.onToast(userId, "warn", "Memoria is already working on the codex");
    return null;
  }
  const controller = new AbortController();
  registerAborter(userId, chatId, "codex", controller);
  try {
    // Aborting the codex row also stops the books phase.
    controller.signal.addEventListener("abort", () => {
      abortBusy(userId, chatId, "chapter");
      abortBusy(userId, chatId, "arc");
    }, { once: true });
    // Preview-mode profiles skip the books phase (chapters would stall as
    // pending previews); unsettled fork shelves hold it too.
    const shelfPending = await forkShelfPending(chatId, userId).catch(() => false);
    if (settings && profile.autoCreate && !profile.showMemoryPreviews && !shelfPending) {
      await drainChapterBacklog(chatId, profile, settings, userId, true);
      await maybeRunArcCheck(chatId, profile, settings, userId, true);
    }
    if (controller.signal.aborted) throw new AbortedSummarizerError();
    const progress = { chars: 0, thinking: 0 };
    let runs = 0;

    if (mode === "fast") {
      const entries = await listLmbEntries(chatId, userId);
      const coverage = await buildCoverage(chatId, userId, entries, true);
      let prevStart = -1;
      for (let pass = 0; pass < CATCHUP_PASS_CAP; pass++) {
        if (controller.signal.aborted) throw new AbortedSummarizerError();
        const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
        if (plan.compressible.length === 0) break;
        if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen")) break;
        if (!plan.rewound && plan.startPos <= prevStart) {
          warn(`codex fast catch-up stalled at message ${plan.startPos + 1} for ${chatId.slice(0, 8)}, stopping`);
          break;
        }
        prevStart = plan.startPos;
        const batch = nextSummaryBatch(plan, coverage.chapters, profile);
        if (!batch) break;
        await runChunk(
          chatId, userId, profile, plan,
          plan.messages.slice(plan.startPos, batch.endIdx + 1),
          false, controller.signal, progress,
          (ctx, bundle, notes, label) => buildCodexSummaryCatchupMessage(ctx, bundle, batch.blocks, label, notes),
        );
        runs++;
      }
    }

    // The final (or only) pass: everything left in one go.
    const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
    if (plan.compressible.length === 0) return runs;
    if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen")) return runs;
    if (mode === "ultra") {
      const { books, tailTranscript } = await activeStoryContext(chatId, userId, plan.messages);
      await runChunk(
        chatId, userId, profile, plan,
        plan.messages.slice(plan.startPos),
        false, controller.signal, progress,
        (ctx, bundle, notes, label, lore) => buildCodexUltraMessage(ctx, bundle, books, tailTranscript, label, notes, lore),
        true,
      );
    } else {
      await runChunk(chatId, userId, profile, plan, plan.compressible, false, controller.signal, progress);
    }
    return runs + 1;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

/** Deleted-tail cleanup: a pending reconcile with nothing consumable gets an
 * ultra-shaped sweep that corrects the codex against the surviving story.
 * The rewound cursor persists and the reconcile flag clears on success. */
async function maybeReconcileSweep(chatId: string, profile: LMBProfile, userId: string): Promise<boolean> {
  const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
  if (plan.compressible.length > 0 || !plan.reconcile) return false;
  if ((await codexPresence(chatId, userId)) !== "present") return false;
  // A pending relations-format migration belongs to a real chunk run.
  if (plan.cursor.relationsTableMode !== null && plan.cursor.relationsTableMode !== profile.codexRelationsTable) return false;
  // Every file frozen: the sweep could not write a single correction.
  if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen")) return false;
  if (!setBusy(userId, chatId, "codex", "Memoria is reconciling the codex with the edited story")) return false;
  const controller = new AbortController();
  registerAborter(userId, chatId, "codex", controller);
  try {
    const diskMode = plan.cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, plan.messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const frozen = new Set<CodexFileKey>(CODEX_FILE_KEYS.filter((k) => plan.cursor.fileStates[k] === "frozen"));
    const notes: CodexRunNotes = {
      reconcile: true,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`),
    };
    const sweepSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, sweepSettings.customPresets, frozen);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexReconcileMessage(promptCtx, bundle, books, tailTranscript, notes, lore),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta),
    });
    invalidateCodexInjectionCache(chatId);
    await withCursorLock(chatId, userId, async () => {
      const liveCursor = await loadCursor(chatId, userId).catch((err) => {
        warn(`codex: live cursor re-read failed before sweep save: ${describeError(err)}`);
        return null;
      });
      if (liveCursor) {
        plan.cursor.fileStates = liveCursor.fileStates;
        plan.cursor.frozenAtRuns = liveCursor.frozenAtRuns;
        plan.cursor.refreshPending = liveCursor.refreshPending;
      }
      plan.cursor.pendingReconcile = false;
      plan.cursor.reconcileUntilMsgId = null;
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
    cb?.onToast(userId, "success", result.changedFiles.length > 0
      ? `Memoria reconciled the codex with the edited story (${result.changedFiles.length} file${result.changedFiles.length === 1 ? "" : "s"})`
      : "Memoria checked the codex against the edited story and everything still holds");
    cb?.onStateChange(userId, chatId);
    return true;
  } finally {
    clearBusy(userId, chatId, "codex");
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

/** Bumped on every codex mutation. The frontend compares it against the
 * revision its cached file contents came from and refetches on a mismatch,
 * so a run finishing updates the Codex tab without pushing the whole codex. */
const codexRevisions = new Map<string, number>();

export function getCodexRevision(chatId: string): number {
  return codexRevisions.get(chatId) ?? 0;
}

export function invalidateCodexInjectionCache(chatId?: string): void {
  if (chatId) {
    injectionTextCache.delete(chatId);
    fileTokensCache.delete(chatId);
    codexRevisions.set(chatId, (codexRevisions.get(chatId) ?? 0) + 1);
    while (codexRevisions.size > INJECTION_CACHE_CAP) {
      const oldest = codexRevisions.keys().next().value as string | undefined;
      if (oldest === undefined || oldest === chatId) break;
      codexRevisions.delete(oldest);
    }
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
    text = bundleIsEmpty(bundle) ? null : renderCodexForInjection(bundle) || null;
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
  /** Frozen files that missed at least one run: re-enabling flags a catch-up. */
  staleFiles: string[];
  /** Re-enabled files awaiting the one-pass refresh. */
  refreshPending: string[];
}

export async function getCodexPanelState(chatId: string, userId: string): Promise<CodexPanelState> {
  const exists = await codexExists(chatId, userId);
  if (!exists) return { fileStates: {}, staleFiles: [], refreshPending: [] };
  const cursor = await loadCursor(chatId, userId);
  const staleFiles: string[] = [];
  for (const [file, st] of Object.entries(cursor.fileStates)) {
    if (st !== "frozen") continue;
    const at = cursor.frozenAtRuns[file];
    if (typeof at === "number" && cursor.runs > at) staleFiles.push(file);
  }
  return { fileStates: cursor.fileStates, staleFiles, refreshPending: cursor.refreshPending };
}

export async function setCodexFileState(
  chatId: string,
  userId: string,
  file: CodexFileKey,
  state: CodexFileState,
  relationsTableFallback?: boolean,
): Promise<void> {
  await withCursorLock(chatId, userId, async () => {
    const cursor = await loadCursor(chatId, userId);
    const prevState = cursor.fileStates[file] ?? "on";
    if (state === "on") delete cursor.fileStates[file];
    else cursor.fileStates[file] = state;
    if (state === "frozen") {
      cursor.frozenAtRuns[file] = cursor.runs;
      cursor.refreshPending = cursor.refreshPending.filter((f) => f !== file);
    } else {
      // Leaving frozen after missed runs flags the file for a catch-up pass.
      const at = cursor.frozenAtRuns[file];
      if (prevState === "frozen" && typeof at === "number" && cursor.runs > at && !cursor.refreshPending.includes(file)) {
        cursor.refreshPending.push(file);
      }
      delete cursor.frozenAtRuns[file];
    }
    await saveCursor(chatId, cursor, userId);
  });
  invalidateCodexInjectionCache(chatId);
  // Mirror the switch onto the synced entries (disabled flag, and relations
  // folding in or out of entity entries).
  await syncEntriesGuarded(chatId, userId, relationsTableFallback);
}

/** Wipe the codex but carry the user's per-file switches into the fresh
 * cursor, then re-read the whole chat from message zero. */
export async function rebuildCodex(
  chatId: string,
  profile: LMBProfile,
  userId: string,
  mode: CodexUpdateMode = "slow",
  settings: LMBSettings | null = null,
): Promise<void> {
  // The wipe holds the busy flag itself, or a racing drain resurrects the old codex.
  if (!setBusy(userId, chatId, "codex", "Memoria is clearing the codex for a rebuild")) {
    cb?.onToast(userId, "warn", "Memoria is already working on the codex, abort that first");
    return;
  }
  try {
    // Read and reseed under one lock so a file-state flip can't interleave.
    // An unreadable cursor must abort: falling back to empty would drop the
    // frozen list and wipe files the user locked.
    let cursorFault: unknown = null;
    let frozenKeys = new Set<CodexFileKey>();
    await withCursorLock(chatId, userId, async () => {
      let prev: CodexCursor;
      try {
        prev = await loadCursor(chatId, userId);
      } catch (err) {
        cursorFault = err;
        return;
      }
      // Frozen means "no updates", not "erase": their contents survive the wipe.
      frozenKeys = new Set(CODEX_FILE_KEYS.filter((k) => prev.fileStates[k] === "frozen"));
      // Overwrite in place instead of delete-then-restore, so frozen content
      // never leaves disk and no fault window can destroy it.
      const fresh = emptyCursor();
      fresh.fileStates = prev.fileStates;
      for (const k of frozenKeys) fresh.frozenAtRuns[k] = 0;
      if (frozenKeys.size > 0) fresh.relationsTableMode = prev.relationsTableMode;
      await saveCursor(chatId, fresh, userId);
    });
    if (cursorFault !== null) {
      cb?.onToast(userId, "error", `Memoria couldn't read the codex cursor, rebuild aborted: ${shortErrorText(cursorFault)}`);
      return;
    }
    const failed: CodexFileKey[] = [];
    for (const key of CODEX_FILE_KEYS) {
      if (frozenKeys.has(key)) continue;
      await saveCodexFile(chatId, key, emptyCodexFile(key), userId).catch(() => failed.push(key));
    }
    invalidateCodexInjectionCache(chatId);
    if (failed.length > 0) {
      cb?.onToast(userId, "error", `Memoria couldn't clear ${failed.length} codex file${failed.length === 1 ? "" : "s"}, run Rebuild again`);
      return;
    }
    publishCodexWiped(chatId, userId);
    await wipeCodexEntries(chatId, userId).catch((err) => {
      warn(`codex rebuild: entry wipe failed: ${describeError(err)}`);
      cb?.onToast(userId, "error", `Memoria couldn't clear the codex lorebook entries: ${shortErrorText(err)}`);
    });
  } finally {
    clearBusy(userId, chatId, "codex");
  }
  await runCodexNow(chatId, profile, userId, mode, settings);
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
    const tidySettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, tidySettings.customPresets, frozenFiles);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes: { reconcile: false, migrateToTable: false, migrateToInline: false, loadProblems: [] },
      lore: null,
      storySoFar: null,
      userTextOverride: buildCodexTidyMessage(promptCtx, bundle, targets),
      coverageFiles: targets,
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
    reportCodexFailure(userId, chatId, "tidy", err);
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

/** One ultra-shaped pass that rewrites the refresh-pending files from the
 * story's active context. The cursor never moves. */
export async function refreshCodexFiles(chatId: string, profile: LMBProfile, userId: string): Promise<void> {
  if (!setBusy(userId, chatId, "codex", "Memoria is catching up re-enabled records")) {
    cb?.onToast(userId, "warn", "Memoria is already working on the codex");
    return;
  }
  const controller = new AbortController();
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb?.onToast(userId, "warn", "The relations format changed, run Update now first so Memoria can migrate before catching records up");
      return;
    }
    const frozen = new Set<CodexFileKey>(CODEX_FILE_KEYS.filter((k) => cursor.fileStates[k] === "frozen"));
    const targets = cursor.refreshPending.filter((f): f is CodexFileKey => isCodexFileKey(f) && !frozen.has(f));
    if (targets.length === 0) {
      cb?.onToast(userId, "info", "No re-enabled records are waiting for a catch-up");
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const messages = await spindle.chat.getMessages(chatId);
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const notes: CodexRunNotes = {
      reconcile: false,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`),
    };
    const refreshSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, refreshSettings.customPresets, frozen);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexRefreshMessage(promptCtx, bundle, targets, books, tailTranscript, notes, lore),
      coverageFiles: targets,
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta),
    });
    invalidateCodexInjectionCache(chatId);
    await withCursorLock(chatId, userId, async () => {
      const live = await loadCursor(chatId, userId);
      live.refreshPending = live.refreshPending.filter((f) => !(targets as string[]).includes(f));
      await saveCursor(chatId, live, userId);
    });
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "refresh");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb?.onToast(userId, "success", `Memoria caught up ${targets.length} record${targets.length === 1 ? "" : "s"}`);
    cb?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the catch-up aside");
      return;
    }
    warn(`codex refresh failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "refresh", err);
    if (!(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb?.onToast(userId, "warn", "The catch-up pass needs the codex model's context to be at least the story model's, pick a larger context codex connection or use Rebuild in slow mode");
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

function fileIsEmpty(bundle: CodexBundle, key: CodexFileKey): boolean {
  const v = bundle[key] as unknown as Record<string, unknown[]>;
  return Object.values(v).every((arr) => !Array.isArray(arr) || arr.length === 0);
}

/** The rebuild pass's prompt view: targets blanked so stale contents cannot
 * anchor the rewrite. User-locked entities (whole-row or field locks) stay
 * visible, the agent must keep building around them. */
function blankTargets(bundle: CodexBundle, targets: readonly CodexFileKey[]): CodexBundle {
  const out: CodexBundle = { ...bundle };
  for (const t of targets) {
    if (t === "characters" || t === "locations" || t === "things") {
      out[t] = {
        entities: bundle[t].entities.filter(
          (e) => e.locked === true || (Array.isArray(e.lockedFields) && e.lockedFields.length > 0),
        ),
      };
    } else {
      (out as Record<CodexFileKey, CodexFileValue>)[t] = emptyCodexFile(t);
    }
  }
  return out;
}

/** One ultra-shaped pass that regenerates the chosen files from the story's
 * active context. Non-destructive: the disk files are only replaced when the
 * run finishes clean, and the cursor never moves. */
export async function rebuildCodexFiles(
  chatId: string,
  profile: LMBProfile,
  userId: string,
  only: CodexFileKey[],
): Promise<void> {
  if (!setBusy(userId, chatId, "codex", "Memoria is rebuilding codex records")) {
    cb?.onToast(userId, "warn", "Memoria is already working on the codex");
    return;
  }
  const controller = new AbortController();
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb?.onToast(userId, "warn", "The relations format changed, run Update now first so Memoria can migrate before rebuilding records");
      return;
    }
    const frozen = new Set<CodexFileKey>(CODEX_FILE_KEYS.filter((k) => cursor.fileStates[k] === "frozen"));
    const targets = only.filter((k) => !frozen.has(k));
    if (targets.length === 0) {
      cb?.onToast(userId, "info", "Those records are frozen, unfreeze them first");
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const messages = await spindle.chat.getMessages(chatId);
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const notes: CodexRunNotes = {
      reconcile: false,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`),
    };
    const rebuildSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, rebuildSettings.customPresets, frozen);
    // The prompt shows the targets wiped while staging runs against the real
    // files, so locked rows, locked fields, and the resolved-thread archive
    // all survive through the agent's rewrite.
    const promptBundle = blankTargets(bundle, targets);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexRebuildMessage(promptCtx, promptBundle, targets, books, tailTranscript, notes, lore),
      coverageFiles: targets,
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta),
    });
    invalidateCodexInjectionCache(chatId);
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "refresh");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb?.onToast(userId, "success", `Memoria rebuilt ${targets.length} record${targets.length === 1 ? "" : "s"} from the story`);
    cb?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the rebuild aside");
      return;
    }
    warn(`codex record rebuild failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "rebuild", err);
    if (!(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb?.onToast(userId, "warn", "The rebuild pass needs the codex model's context to be at least the story model's, pick a larger context codex connection");
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

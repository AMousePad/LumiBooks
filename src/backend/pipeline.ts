declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { LMBProfile, LMBSettings, LMBEntryMeta } from "../shared";
import type { BusyEntry, FailureRecord, PendingPreview } from "../types";
import type { ChatMessage } from "./coverage";
import { approximateTokensFromChars, buildArcHeader, buildChapterHeader, buildVolumeHeader } from "../shared";
import {
  buildCoverage,
  computeCoverageStats,
  isExcluded,
  liveEndPosition,
  pickUncoveredTail,
  selectNextChapterWindow,
  sizeEligible,
  syncHiddenForCoveredMessages,
  trimLagFromTail,
  type CoverageMap,
} from "./coverage";
import { createChapterEntry, deleteEntry, ensureBookForChat, invalidateBookCache, listLmbEntries, patchEntryMeta, promoteGhostEntry, type LMBEntry } from "./world-book";
import { msgSig } from "./codex/store";
import { loadSettings } from "./storage";
import {
  AbortedSummarizerError,
  FatalSummarizerError,
  assembleArcPrompt,
  assembleChapterPrompt,
  assembleVolumePrompt,
  summarizeArc,
  summarizeChapter,
  summarizeVolume,
  type DryRunAssembly,
  type SummarizationResult,
} from "./summarizer";
import { describeError, warn } from "./runtime";
import { publishChapterCreated, publishArcCreated, publishVolumeCreated } from "./hooks";
import { pickPhrase, type PhraseKind } from "./memoria";
import { ensureForkAdoption, forkShelfPending } from "./fork";

type ChatMessageDTO = ChatMessage;

const inflight = new Map<string, BusyEntry>();
const busyByUser = new Map<string, BusyEntry[]>();
const aborters = new Map<string, AbortController>();
const progressLastPush = new Map<string, number>();
interface ProgressState { kind: BusyKind; chars: number; thinkingChars: number; userId: string; chatId: string }
const progressState = new Map<string, ProgressState>();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
const HEARTBEAT_INTERVAL_MS = 1000;
const failureByChat = new Map<string, FailureRecord>();
const previewsByChat = new Map<string, PendingPreview[]>();
const committingDrafts = new Set<string>();

const PROGRESS_PUSH_INTERVAL_MS = 250;

/** Scene numbers of swept ghosts, keyed by chat, so the refill of the same
 * span keeps its ordinal instead of jumping to max+1 mid-list. In-memory
 * only: after a restart the refill falls back to nextSceneNumber. */
const freedGhostNumbers = new Map<string, { ids: Set<string>; sceneNumber: number }[]>();
const FREED_NUMBERS_CAP = 20;
const FREED_MAP_CAP = 200;

export function recordFreedGhostNumber(userId: string, chatId: string, msgIds: string[], sceneNumber: number): void {
  const key = chatKey(userId, chatId);
  const list = freedGhostNumbers.get(key) ?? [];
  freedGhostNumbers.delete(key);
  list.push({ ids: new Set(msgIds), sceneNumber });
  freedGhostNumbers.set(key, list.slice(-FREED_NUMBERS_CAP));
  capMap(freedGhostNumbers, FREED_MAP_CAP);
}

function takeFreedGhostNumber(userId: string, chatId: string, windowIds: Set<string>): number | null {
  const key = chatKey(userId, chatId);
  const list = freedGhostNumbers.get(key);
  if (!list) return null;
  const idx = list.findIndex((f) => {
    for (const id of windowIds) if (f.ids.has(id)) return true;
    return false;
  });
  if (idx === -1) return null;
  const n = list[idx]!.sceneNumber;
  list.splice(idx, 1);
  if (list.length === 0) freedGhostNumbers.delete(key);
  return n;
}

const commitChain = new Map<string, Promise<unknown>>();
function withCommitMutex<T>(userId: string, chatId: string, tier: 1 | 2 | 3, fn: () => Promise<T>): Promise<T> {
  const key = `${userId}::${chatId}::t${tier}`;
  const prev = commitChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => undefined);
  commitChain.set(key, guarded);
  guarded.then(() => {
    if (commitChain.get(key) === guarded) commitChain.delete(key);
  });
  return tail;
}
const FAILURE_MAP_CAP = 500;
const PREVIEW_MAP_CAP = 500;

function capMap<K, V>(map: Map<K, V>, cap: number): void {
  while (map.size > cap) {
    const oldest = map.keys().next().value as K | undefined;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}
type BusyKind = BusyEntry["kind"];

function busyKey(userId: string, chatId: string, kind: BusyKind): string {
  return `${userId}::${chatId}::${kind}`;
}

function chatKey(userId: string, chatId: string): string {
  return `${userId}::${chatId}`;
}

export interface StreamSnapshot {
  content: string;
  thinking: string;
  running: boolean;
}

export interface PipelineCallbacks {
  onBusyChange(userId: string, entries: BusyEntry[]): void;
  onToast(userId: string, tone: "success" | "info" | "warn" | "error", text: string, automation?: boolean): void;
  onStateChange(userId: string, chatId: string): void;
  onStreamText(userId: string, chatId: string, kind: BusyKind, snap: StreamSnapshot): void;
}

let cb: PipelineCallbacks | null = null;
export function registerPipelineCallbacks(c: PipelineCallbacks): void {
  cb = c;
}

export function setBusy(userId: string, chatId: string, kind: BusyKind, label: string): boolean {
  const key = busyKey(userId, chatId, kind);
  if (inflight.has(key)) return false;
  const entry: BusyEntry = { kind, chatId, label, startedAt: Date.now() };
  inflight.set(key, entry);
  progressState.set(key, { kind, chars: 0, thinkingChars: 0, userId, chatId });
  streamBufs.delete(key);
  streamLastPush.delete(key);
  const list = busyByUser.get(userId) ?? [];
  list.push(entry);
  busyByUser.set(userId, list);
  cb?.onBusyChange(userId, list.slice());
  ensureHeartbeat();
  return true;
}

export function clearBusy(userId: string, chatId: string, kind: BusyKind): void {
  const key = busyKey(userId, chatId, kind);
  inflight.delete(key);
  aborters.delete(key);
  progressLastPush.delete(key);
  progressState.delete(key);
  if (streamWatchers.has(key)) {
    const buf = streamBufs.get(key);
    cb?.onStreamText(userId, chatId, kind, {
      content: buf?.content ?? "",
      thinking: buf?.thinking ?? "",
      running: false,
    });
    streamWatchers.delete(key);
  }
  streamLastPush.delete(key);
  const fresh: BusyEntry[] = [];
  for (const k of inflight.keys()) {
    if (!k.startsWith(`${userId}::`)) continue;
    const found = inflight.get(k);
    if (found) fresh.push(found);
  }
  busyByUser.set(userId, fresh);
  cb?.onBusyChange(userId, fresh.slice());
}

export function registerAborter(userId: string, chatId: string, kind: BusyKind, controller: AbortController): void {
  aborters.set(busyKey(userId, chatId, kind), controller);
}

export function abortBusy(userId: string, chatId: string, kind: BusyKind): boolean {
  const controller = aborters.get(busyKey(userId, chatId, kind));
  if (!controller) return false;
  controller.abort();
  return true;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m${rem.toString().padStart(2, "0")}s`;
}

const BUSY_PHRASES: Record<BusyKind, { idle: string; writing: string }> = {
  chapter: { idle: "Memoria is filing a chapter", writing: "Memoria is writing a chapter" },
  arc: { idle: "Memoria is binding an arc", writing: "Memoria is binding an arc" },
  volume: { idle: "Memoria is pressing a volume", writing: "Memoria is pressing a volume" },
  codex: { idle: "Memoria is updating the codex", writing: "Memoria is updating the codex" },
};

/** Plain words first, telemetry in the parenthetical - the label is read by
 * users, not developers. */
function formatBusyLabel(state: ProgressState, elapsedMs: number): string {
  const { idle, writing } = BUSY_PHRASES[state.kind];
  const tokens = approximateTokensFromChars(state.chars);
  const thinkTokens = approximateTokensFromChars(state.thinkingChars);
  const t = formatElapsed(elapsedMs);
  if (tokens === 0 && thinkTokens === 0) return `${idle} (${t})`;
  if (tokens === 0 && thinkTokens > 0) return `Memoria is thinking (~${thinkTokens}t, ${t})`;
  if (thinkTokens > 0) return `${writing} (~${tokens}t written, ~${thinkTokens}t thought, ${t})`;
  return `${writing} (~${tokens}t, ${t})`;
}

function ensureHeartbeat(): void {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (progressState.size === 0) {
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      return;
    }
    const touched = new Set<string>();
    for (const [key, ps] of progressState) {
      const entry = inflight.get(key);
      if (!entry) continue;
      const elapsed = Date.now() - entry.startedAt;
      entry.label = formatBusyLabel(ps, elapsed);
      touched.add(ps.userId);
    }
    for (const userId of touched) {
      const list = busyByUser.get(userId) ?? [];
      cb?.onBusyChange(userId, list.slice());
    }
  }, HEARTBEAT_INTERVAL_MS);
}

/* ------------------------------------------------------- live stream feed */

interface StreamBuf { content: string; thinking: string }
const streamBufs = new Map<string, StreamBuf>();
/** Busy keys a frontend is currently watching. */
const streamWatchers = new Set<string>();
const streamLastPush = new Map<string, number>();
const STREAM_PUSH_INTERVAL_MS = 350;
/** Per-part cap; the viewer is a window, not an archive. */
const STREAM_BUF_CAP = 200_000;

function capStreamPart(s: string): string {
  if (s.length <= STREAM_BUF_CAP) return s;
  return `[...earlier output trimmed...]\n${s.slice(-STREAM_BUF_CAP)}`;
}

export function appendStreamText(
  userId: string,
  chatId: string,
  kind: BusyKind,
  deltaKind: "text" | "thinking",
  delta: string,
): void {
  const key = busyKey(userId, chatId, kind);
  if (!inflight.has(key)) return;
  const buf = streamBufs.get(key) ?? { content: "", thinking: "" };
  if (deltaKind === "text") buf.content = capStreamPart(buf.content + delta);
  else buf.thinking = capStreamPart(buf.thinking + delta);
  streamBufs.set(key, buf);
  if (!streamWatchers.has(key)) return;
  const now = Date.now();
  if (now - (streamLastPush.get(key) ?? 0) < STREAM_PUSH_INTERVAL_MS) return;
  streamLastPush.set(key, now);
  cb?.onStreamText(userId, chatId, kind, { content: buf.content, thinking: buf.thinking, running: true });
}

export function setStreamWatcher(userId: string, chatId: string, kind: BusyKind, on: boolean): void {
  const key = busyKey(userId, chatId, kind);
  if (!on) {
    streamWatchers.delete(key);
    return;
  }
  streamWatchers.add(key);
  const buf = streamBufs.get(key);
  cb?.onStreamText(userId, chatId, kind, {
    content: buf?.content ?? "",
    thinking: buf?.thinking ?? "",
    running: inflight.has(key),
  });
}

export function updateProgressNumbers(userId: string, chatId: string, kind: BusyKind, chars: number, thinkingChars: number): void {
  const key = busyKey(userId, chatId, kind);
  const ps = progressState.get(key);
  if (!ps) return;
  ps.chars = chars;
  ps.thinkingChars = thinkingChars;
  const entry = inflight.get(key);
  if (!entry) return;
  const now = Date.now();
  const last = progressLastPush.get(key) ?? 0;
  if (now - last < PROGRESS_PUSH_INTERVAL_MS) return;
  progressLastPush.set(key, now);
  entry.label = formatBusyLabel(ps, now - entry.startedAt);
  const list = busyByUser.get(userId) ?? [];
  cb?.onBusyChange(userId, list.slice());
}

export function getBusy(userId: string): BusyEntry[] {
  return (busyByUser.get(userId) ?? []).slice();
}

export function getLastFailure(userId: string, chatId: string): FailureRecord | null {
  return failureByChat.get(chatKey(userId, chatId)) ?? null;
}

export function clearLastFailure(userId: string, chatId: string): void {
  failureByChat.delete(chatKey(userId, chatId));
}

export function getPendingPreviews(userId: string, chatId: string): PendingPreview[] {
  return (previewsByChat.get(chatKey(userId, chatId)) ?? []).slice();
}

export function findPendingPreview(userId: string, chatId: string, draftId: string): PendingPreview | null {
  return (previewsByChat.get(chatKey(userId, chatId)) ?? []).find((p) => p.draftId === draftId) ?? null;
}

export function dropPendingPreview(userId: string, chatId: string, draftId: string): void {
  const list = previewsByChat.get(chatKey(userId, chatId)) ?? [];
  previewsByChat.set(chatKey(userId, chatId), list.filter((p) => p.draftId !== draftId));
}

export function patchPendingPreview(
  userId: string,
  chatId: string,
  draftId: string,
  patch: { title?: string; content?: string },
): void {
  const key = chatKey(userId, chatId);
  const list = previewsByChat.get(key) ?? [];
  const idx = list.findIndex((p) => p.draftId === draftId);
  if (idx === -1) return;
  const old = list[idx]!;
  list[idx] = {
    ...old,
    title: patch.title !== undefined ? patch.title : old.title,
    content: patch.content !== undefined ? patch.content : old.content,
  };
  previewsByChat.set(key, list);
}

function pushPreview(userId: string, chatId: string, preview: PendingPreview): void {
  const key = chatKey(userId, chatId);
  const existing = previewsByChat.get(key);
  if (existing) {
    previewsByChat.delete(key);
    existing.push(preview);
    previewsByChat.set(key, existing);
  } else {
    previewsByChat.set(key, [preview]);
  }
  capMap(previewsByChat, PREVIEW_MAP_CAP);
}

async function runWithRetry<T>(
  attempts: number,
  fn: () => Promise<T>,
  onRetry: (attemptNum: number, err: unknown) => void,
): Promise<{ ok: true; value: T } | { ok: false; err: unknown; retries: number }> {
  let lastErr: unknown = null;
  const tries = Math.max(1, attempts);
  for (let i = 0; i < tries; i++) {
    try {
      const v = await fn();
      return { ok: true, value: v };
    } catch (err) {
      lastErr = err;
      if (err instanceof FatalSummarizerError || err instanceof AbortedSummarizerError) {
        return { ok: false, err, retries: i };
      }
      if (i < tries - 1) onRetry(i + 1, err);
    }
  }
  return { ok: false, err: lastErr, retries: tries - 1 };
}

function recordFailure(userId: string, chatId: string, kind: FailureRecord["kind"], retries: number, err: unknown): void {
  const key = chatKey(userId, chatId);
  if (failureByChat.has(key)) failureByChat.delete(key);
  failureByChat.set(key, {
    kind,
    message: describeError(err),
    retriedTimes: retries,
    at: Date.now(),
  });
  capMap(failureByChat, FAILURE_MAP_CAP);
}

function nyaaToast(userId: string, kind: PhraseKind, automation: boolean): void {
  if (!cb) return;
  const tone = kind === "retry" ? "warn"
    : kind === "success" || kind === "arc_success" || kind === "volume_success" ? "success"
    : "info";
  cb.onToast(userId, tone, pickPhrase(kind), automation);
}

export function shortErrorText(err: unknown): string {
  const raw = describeError(err).replace(/\s+/g, " ").trim();
  const firstSentence = raw.split(/(?<=[.!?])\s/, 1)[0] || raw;
  const cleaned = firstSentence.replace(/;/g, ",");
  return cleaned.length > 160 ? `${cleaned.slice(0, 159)}…` : cleaned;
}

function failToast(userId: string, kind: BusyKind, err: unknown): void {
  const noun = kind === "arc" ? "bind the arc" : kind === "volume" ? "press the volume" : "file the chapter";
  cb?.onToast(userId, "error", `Memoria couldn't ${noun}: ${shortErrorText(err)}`);
}

/**
 * Extra-context mode is only in effect while the codex itself is enabled:
 * ghosts exist to feed the codex agent, so a disabled codex must not keep
 * paying for ghost generation the user can't see or use.
 */
export function extraContextActive(profile: LMBProfile): boolean {
  return profile.codexEnabled && profile.codexExtraContext;
}

/**
 * Ghost windows fill from the EARLIEST uncovered gap rather than the
 * contiguous tail, so a hole left by a swept or deleted mid-run ghost gets
 * refilled instead of stranded behind later coverage. A gap bounded by later
 * coverage files at whatever size it has (it can never grow); an open tail
 * waits for a full window.
 */
function selectGhostWindow(
  messages: ChatMessageDTO[],
  coverage: CoverageMap,
  effProfile: LMBProfile,
): ChatMessageDTO[] {
  const kept = trimLagFromTail(messages, effProfile);
  let i = 0;
  while (i < kept.length) {
    while (i < kept.length && coverage.coveredBy.has(kept[i]!.id)) i++;
    if (i >= kept.length) return [];
    const run: ChatMessageDTO[] = [];
    let boundedByCoverage = false;
    while (i < kept.length) {
      const m = kept[i]!;
      if (coverage.coveredBy.has(m.id)) {
        boundedByCoverage = true;
        break;
      }
      run.push(m);
      i++;
    }
    const runSize = sizeEligible(run, effProfile.windowUnit, effProfile);
    if (!boundedByCoverage && runSize < effProfile.windowValue) return [];
    // A bounded gap with no eligible content (only excluded or system
    // messages) can never file a real summary: scan past it or drainGhostBacklog
    // would pay an LLM call to summarize nothing, or worse stall on it forever.
    if (runSize === 0) continue;
    const window = selectNextChapterWindow(run, { ...effProfile, lagValue: 0 });
    if (window.length > 0) return window;
  }
  return [];
}

export async function createChapterAuto(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  automation = false,
  ghost = false,
): Promise<string | null> {
  if (!setBusy(userId, chatId, "chapter", "Memoria is filing a chapter")) return null;
  try {
    // The caller's profile snapshot can be from before a mode toggle; a
    // drain loop must stop minting ghosts the moment the live mode is off.
    if (ghost) {
      const live = await loadSettings(userId);
      const liveProfile = live.profiles.find((p) => p.id === live.activeProfileId);
      if (!liveProfile || !extraContextActive(liveProfile)) return null;
    }
    const messages = await spindle.chat.getMessages(chatId);
    if (!messages || messages.length === 0) return null;
    // Ghost generation runs against the codex lag (the generation lag); the
    // profile lag stays the injection lag that promotion answers to.
    const effProfile: LMBProfile = ghost
      ? { ...profile, lagUnit: profile.codexLagUnit, lagValue: profile.codexLagValue }
      : profile;
    const includeGhosts = ghost || extraContextActive(profile);
    const coverage = await buildCoverage(chatId, userId, undefined, includeGhosts);
    let window: ChatMessageDTO[];
    if (ghost) {
      window = selectGhostWindow(messages, coverage, effProfile);
    } else {
      const stats = computeCoverageStats(messages, coverage, effProfile);
      if (!stats.lagSatisfied || !stats.windowAvailable) return null;
      const uncoveredTail = pickUncoveredTail(messages, coverage);
      window = selectNextChapterWindow(uncoveredTail, effProfile);
    }
    if (window.length === 0) return null;
    return await runChapter(chatId, profile, settings, userId, messages, window, { automation, ghost });
  } finally {
    clearBusy(userId, chatId, "chapter");
  }
}

export async function createChapterFromRange(
  chatId: string,
  messageIds: string[],
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  opts: { replacesEntryId?: string } = {},
): Promise<string | null> {
  if (!setBusy(userId, chatId, "chapter", "Memoria is filing a chapter")) return null;
  try {
    const messages = await spindle.chat.getMessages(chatId);
    if (!messages.length) return null;
    const set = new Set(messageIds);
    const window = messages.filter((m) => set.has(m.id) && !isExcluded(m));
    if (window.length === 0) return null;
    return await runChapter(chatId, profile, settings, userId, messages, window, { replacesEntryId: opts.replacesEntryId });
  } finally {
    clearBusy(userId, chatId, "chapter");
  }
}

async function runChapter(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  allMessages: ChatMessageDTO[],
  window: ChatMessageDTO[],
  opts: { replacesEntryId?: string; automation?: boolean; ghost?: boolean } = {},
): Promise<string | null> {
  const { replacesEntryId } = opts;
  const automation = opts.automation === true;
  const ghost = opts.ghost === true;
  nyaaToast(userId, "fire", automation);
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, ghost || extraContextActive(profile));
  let chapters = coverage.activeEntries
    .filter((e) => e.meta.tier === 1 && typeof e.meta.firstMsgIdx === "number")
    .sort((a, b) => (a.meta.firstMsgIdx as number) - (b.meta.firstMsgIdx as number));
  if (ghost) {
    // Gap refills summarize mid-story spans: chapters AFTER the window are
    // future material and must not leak into its previous-memories context.
    // Compare live positions - stored meta indexes go stale after deletions.
    const windowFirstIdx = allMessages.findIndex((m) => m.id === window[0]!.id);
    const posById = new Map(allMessages.map((m, i) => [m.id, i] as const));
    chapters = chapters.filter((c) => liveEndPosition(c.meta.msgIds, c.meta.lastMsgIdx, posById) < windowFirstIdx);
  }
  const previousMemories = profile.previousMemoriesCount > 0
    ? chapters.slice(-profile.previousMemoriesCount)
    : [];
  const provisionalSceneNumber = await nextSceneNumber(chatId, 1, userId);
  const opener = buildChapterHeader(provisionalSceneNumber, window.length);

  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController();
    registerAborter(userId, chatId, "chapter", controller);
    try {
      return await summarizeChapter(
        profile, settings.customPresets, chatId, window, previousMemories, userId, opener,
        {
          externalSignal: controller.signal,
          onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "chapter", chars, thinking),
          onDelta: (kind, delta) => appendStreamText(userId, chatId, "chapter", kind, delta),
        },
      );
    } finally {
      aborters.delete(busyKey(userId, chatId, "chapter"));
    }
  }, (n, err) => {
    warn(`chapter attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", automation);
  });

  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the pen down");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "chapter", outcome.retries, outcome.err);
    failToast(userId, "chapter", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);

  const result = outcome.value;
  const firstIdx = allMessages.findIndex((m) => m.id === window[0]!.id);
  const lastIdx = allMessages.findIndex((m) => m.id === window[window.length - 1]!.id);

  if (profile.showMemoryPreviews && !ghost) {
    const draft: PendingPreview = makePreview("chapter", chatId, window, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitChapter(chatId, profile, userId, window, result, firstIdx, lastIdx, allMessages, false, replacesEntryId, ghost);
    nyaaToast(userId, "success", automation);
    return entryId;
  } catch (err) {
    warn(`commitChapter failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "chapter", 0, err);
    failToast(userId, "chapter", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}

async function commitChapter(
  chatId: string,
  profile: LMBProfile,
  userId: string,
  window: ChatMessageDTO[],
  result: SummarizationResult,
  firstIdx: number,
  lastIdx: number,
  allMessages: ChatMessageDTO[],
  fromPreview: boolean,
  replacesEntryId?: string,
  ghost = false,
): Promise<string> {
  return withCommitMutex(userId, chatId, 1, async () => {
  // The summarize call ran unfenced: if extra mode went off meanwhile, the
  // cleanup pass already ran and committing this ghost would strand it.
  if (ghost) {
    const live = await loadSettings(userId);
    const liveProfile = live.profiles.find((p) => p.id === live.activeProfileId);
    if (!liveProfile || !extraContextActive(liveProfile)) {
      throw new Error("Extra context mode was turned off while this ghost was being written");
    }
  }
  const freshEntries = await listLmbEntries(chatId, userId);
  const entriesForCoverage = replacesEntryId
    ? freshEntries.filter((e) => e.raw.id !== replacesEntryId)
    : freshEntries;
  const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage, ghost || extraContextActive(profile));
  const validWindow = window.filter((m) => !freshCoverage.coveredBy.has(m.id));
  if (validWindow.length === 0) {
    // Distinguish a ghost cover from a real one: a hand-picked range that
    // lands entirely on a ghost span should not read as "bound by a chapter".
    const ghostById = new Map(freshEntries.map((e) => [e.raw.id, e.meta.ghost === true] as const));
    const allGhost = window.every((m) => ghostById.get(freshCoverage.coveredBy.get(m.id) ?? "") === true);
    throw new Error(allGhost
      ? "Those messages are already staged as a ghost chapter, it will file on its own"
      : "All messages in this window were just bound by another chapter");
  }
  if (validWindow.length < window.length) {
    window = validWindow;
    const validIds = new Set(validWindow.map((m) => m.id));
    firstIdx = allMessages.findIndex((m) => validIds.has(m.id));
    lastIdx = -1;
    for (let i = allMessages.length - 1; i >= 0; i--) {
      if (validIds.has(allMessages[i]!.id)) { lastIdx = i; break; }
    }
  }
  const book = await ensureBookForChat(chatId, userId);
  // On regenerate, keep the replaced chapter's scene number so a mid-list
  // regen doesn't jump to the end (nextSceneNumber returns max+1, and the
  // entry being replaced still exists at this point). Ghost refills likewise
  // reuse the number a swept ghost freed for the same span.
  const replacedEntry = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
  let sceneNumber: number;
  let freedTaken: number | null = null;
  if (typeof replacedEntry?.meta.sceneNumber === "number") {
    sceneNumber = replacedEntry.meta.sceneNumber;
  } else {
    freedTaken = ghost ? takeFreedGhostNumber(userId, chatId, new Set(window.map((m) => m.id))) : null;
    sceneNumber = freedTaken ?? await nextSceneNumber(chatId, 1, userId);
  }
  const title = fromPreview
    ? (result.title?.trim() || `Chapter - msgs ${firstIdx + 1}-${lastIdx + 1}`)
    : deriveTitle(result, firstIdx + 1, lastIdx + 1);
  const msgIds = window.map((m) => m.id);
  const meta: LMBEntryMeta = {
    tier: 1,
    chatId,
    msgIds,
    firstMsgIdx: firstIdx >= 0 ? firstIdx : undefined,
    lastMsgIdx: lastIdx >= 0 ? lastIdx : undefined,
    tokenCountInput: window.reduce((acc, m) => acc + approximateTokensFromChars((m.content || "").length), 0),
    tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
    model: result.model,
    connectionId: result.connectionId,
    createdAt: Date.now(),
    title,
    shortComment: result.shortComment,
    presetKey: result.presetKey,
    sceneNumber,
    rawOutput: result.rawOutput,
    ...(ghost ? { ghost: true, msgSigs: window.map((m) => msgSig(m.role, m.content || "")) } : {}),
  };
  const baseComment = meta.title ?? `Chapter - msgs ${(firstIdx + 1)}-${(lastIdx + 1)}`;
  const comment = `#${sceneNumber} - ${baseComment}`;
  const settings = await loadSettings(userId);
  const opener = buildChapterHeader(sceneNumber, msgIds.length);
  const finalContent = `${opener}\n\n${result.content}`;
  let entry: Awaited<ReturnType<typeof createChapterEntry>>;
  try {
    entry = await createChapterEntry(book.id, meta, finalContent, comment, userId, result.keywords ?? [], settings.forceConstantEntries, ghost);
  } catch (err) {
    // The freed ordinal must survive a failed commit or the retried refill
    // falls back to max+1 and jumps out of story order.
    if (freedTaken !== null) recordFreedGhostNumber(userId, chatId, msgIds, freedTaken);
    throw err;
  }
  invalidateBookCache(userId, chatId);

  if (replacesEntryId) {
    try {
      await deleteEntry(replacesEntryId, userId);
      invalidateBookCache(userId, chatId);
    } catch (err) {
      warn(`regen: failed to delete replaced chapter ${replacesEntryId}: ${describeError(err)}`);
    }
  }

  if (profile.hideCoveredMessages && !ghost) {
    try {
      await syncHiddenForCoveredMessages(
        chatId,
        allMessages,
        {
          coveredBy: new Map(window.map((m) => [m.id, entry.id])),
          activeEntries: [],
          volumes: [],
          arcs: [],
          chapters: [],
        },
        userId,
        true,
      );
    } catch (err) {
      warn(`setMessagesHidden failed: ${describeError(err)}`);
    }
  }
  // Ghosts announce themselves on promotion instead: to the outside world a
  // chapter only exists once it starts covering messages.
  if (!ghost) {
    publishChapterCreated(userId, {
      chatId,
      chapterEntryId: entry.id,
      bookId: book.id,
      sourceMessageIds: meta.msgIds,
      summaryText: finalContent,
      model: result.model,
      title: meta.title,
    });
  }
  cb?.onStateChange(userId, chatId);
  return entry.id;
  });
}

export async function createArcAuto(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  automation = false,
): Promise<string | null> {
  if (!setBusy(userId, chatId, "arc", "Memoria is binding an arc")) return null;
  try {
    const entries = await listLmbEntries(chatId, userId);
    const coverage = await buildCoverage(chatId, userId, entries);
    const chapters = coverage.activeEntries
      .filter((e) => e.meta.tier === 1 && !e.meta.isRoot)
      .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (chapters.length === 0) return null;
    let selected: LMBEntry[] = [];
    if (profile.arcTrigger === "chapters") {
      const compressible = Math.max(0, chapters.length - profile.arcLagChapters);
      if (compressible < profile.arcAfterChapters) return null;
      selected = chapters.slice(0, compressible).slice(0, profile.arcAfterChapters);
    } else if (profile.arcTrigger === "tokens") {
      const reservedFromTail: LMBEntry[] = [];
      let reservedTokens = 0;
      for (let i = chapters.length - 1; i >= 0 && reservedTokens < profile.arcLagTokens; i--) {
        reservedFromTail.unshift(chapters[i]!);
        reservedTokens += chapters[i]!.meta.tokenCountOutput;
      }
      const reservedSet = new Set(reservedFromTail.map((c) => c.raw.id));
      const compressible = chapters.filter((c) => !reservedSet.has(c.raw.id));
      const compressibleTokens = compressible.reduce((a, c) => a + c.meta.tokenCountOutput, 0);
      if (compressibleTokens < profile.arcAfterTokens) return null;
      const take: LMBEntry[] = [];
      let acc = 0;
      for (const ch of compressible) {
        take.push(ch);
        acc += ch.meta.tokenCountOutput;
        if (acc >= profile.arcAfterTokens) break;
      }
      selected = take;
    } else {
      return null;
    }
    if (selected.length === 0) return null;
    return await runArc(chatId, profile, settings, userId, selected, { automation });
  } finally {
    clearBusy(userId, chatId, "arc");
  }
}

export async function createArcFromChapters(
  chatId: string,
  chapterEntryIds: string[],
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  opts: { replacesEntryId?: string } = {},
): Promise<string | null> {
  if (!setBusy(userId, chatId, "arc", "Memoria is binding an arc")) return null;
  try {
    const entries = await listLmbEntries(chatId, userId);
    const entriesForSelection = opts.replacesEntryId
      ? entries.filter((e) => e.raw.id !== opts.replacesEntryId)
      : entries;
    const coverage = await buildCoverage(chatId, userId, entriesForSelection);
    const wanted = new Set(chapterEntryIds);
    const chapters = coverage.activeEntries
      .filter((e) => e.meta.tier === 1 && wanted.has(e.raw.id))
      .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (chapters.length === 0) return null;
    return await runArc(chatId, profile, settings, userId, chapters, { replacesEntryId: opts.replacesEntryId });
  } finally {
    clearBusy(userId, chatId, "arc");
  }
}

async function runArc(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  selected: LMBEntry[],
  opts: { replacesEntryId?: string; automation?: boolean } = {},
): Promise<string | null> {
  const { replacesEntryId } = opts;
  const automation = opts.automation === true;
  nyaaToast(userId, "arc_fire", automation);
  const totalTurns = selected.reduce((acc, c) => acc + c.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 2, userId);
  const opener = buildArcHeader(provisionalSceneNumber, selected.length, totalTurns);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController();
    registerAborter(userId, chatId, "arc", controller);
    try {
      return await summarizeArc(
        profile, settings.customPresets, chatId, selected, userId, opener,
        {
          externalSignal: controller.signal,
          onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "arc", chars, thinking),
          onDelta: (kind, delta) => appendStreamText(userId, chatId, "arc", kind, delta),
        },
      );
    } finally {
      aborters.delete(busyKey(userId, chatId, "arc"));
    }
  }, (n, err) => {
    warn(`arc attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", automation);
  });

  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the pen down");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "arc", outcome.retries, outcome.err);
    failToast(userId, "arc", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);

  const result = outcome.value;
  const firstIdxs = selected.map((c) => c.meta.firstMsgIdx).filter((n): n is number => typeof n === "number");
  const lastIdxs = selected.map((c) => c.meta.lastMsgIdx).filter((n): n is number => typeof n === "number");
  const firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
  const lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;

  if (profile.showMemoryPreviews) {
    const draft = makeGroupPreview("arc", selected, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitArc(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, automation);
    nyaaToast(userId, "arc_success", automation);
    return entryId;
  } catch (err) {
    warn(`commitArc failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "arc", 0, err);
    failToast(userId, "arc", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}

async function commitArc(
  chatId: string,
  userId: string,
  selected: LMBEntry[],
  result: SummarizationResult,
  firstIdx: number,
  lastIdx: number,
  replacesEntryId?: string,
  automation = false,
): Promise<string> {
  return withCommitMutex(userId, chatId, 2, async () => {
  const freshEntries = await listLmbEntries(chatId, userId);
  const entriesForCoverage = replacesEntryId
    ? freshEntries.filter((e) => e.raw.id !== replacesEntryId)
    : freshEntries;
  const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage);
  const stillActive = new Set(freshCoverage.activeEntries.filter((e) => e.meta.tier === 1).map((e) => e.raw.id));
  const filtered = selected.filter((c) => stillActive.has(c.raw.id));
  if (filtered.length === 0) {
    throw new Error("All source chapters were already bound by another arc or deleted");
  }
  if (filtered.length < selected.length) {
    selected = filtered;
    const firstIdxs = selected.map((c) => c.meta.firstMsgIdx).filter((n): n is number => typeof n === "number");
    const lastIdxs = selected.map((c) => c.meta.lastMsgIdx).filter((n): n is number => typeof n === "number");
    firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
    lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
  }
  const book = await ensureBookForChat(chatId, userId);
  // On regenerate, keep the replaced arc's scene number (see commitChapter).
  const replacedArc = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
  const sceneNumber = typeof replacedArc?.meta.sceneNumber === "number"
    ? replacedArc.meta.sceneNumber
    : await nextSceneNumber(chatId, 2, userId);
  const msgIds = selected.flatMap((c) => c.meta.msgIds);
  const sourceChapterEntryIds = selected.map((c) => c.raw.id);
  const isRootArc = selected.length > 0 && selected.every((c) => c.meta.isRoot);
  const rootOrigin = isRootArc ? selected.find((c) => c.meta.rootOrigin)?.meta.rootOrigin : undefined;
  if (!isRootArc && selected.some((c) => c.meta.isRoot)) {
    const own = selected.filter((c) => !c.meta.isRoot);
    const fs = own.map((c) => c.meta.firstMsgIdx).filter((n): n is number => typeof n === "number");
    const ls = own.map((c) => c.meta.lastMsgIdx).filter((n): n is number => typeof n === "number");
    if (fs.length) firstIdx = Math.min(...fs);
    else if (firstIdx < 0) firstIdx = 0;
    if (ls.length) lastIdx = Math.max(...ls);
    else if (lastIdx < firstIdx) lastIdx = firstIdx;
  }
  const arcTitle = isRootArc
    ? (result.title?.trim() || "Inherited Arc")
    : deriveTitle(result, firstIdx + 1, lastIdx + 1);
  const meta: LMBEntryMeta = {
    tier: 2,
    chatId,
    msgIds,
    sourceChapterEntryIds,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    tokenCountInput: selected.reduce((a, c) => a + c.meta.tokenCountOutput, 0),
    tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
    model: result.model,
    connectionId: result.connectionId,
    createdAt: Date.now(),
    title: arcTitle,
    shortComment: result.shortComment,
    presetKey: result.presetKey,
    sceneNumber,
    rawOutput: result.rawOutput,
    ...(isRootArc ? { isRoot: true, rootOrigin } : {}),
  };
  const baseComment = meta.title ?? `Arc - msgs ${(firstIdx + 1)}-${(lastIdx + 1)}`;
  const comment = `${isRootArc ? "[Root] " : ""}Arc #${sceneNumber} - ${baseComment}`;
  const arcSettings = await loadSettings(userId);
  const arcOpener = buildArcHeader(sceneNumber, sourceChapterEntryIds.length, msgIds.length);
  const finalArcContent = `${arcOpener}\n\n${result.content}`;
  const arcEntry = await createChapterEntry(book.id, meta, finalArcContent, comment, userId, result.keywords ?? [], arcSettings.forceConstantEntries);
  const failedSupersedes: string[] = [];
  for (const ch of selected) {
    try {
      await patchEntryMeta(ch, { supersededByEntryId: arcEntry.id }, userId);
    } catch (err) {
      failedSupersedes.push(ch.raw.id);
      warn(`failed to mark chapter ${ch.raw.id} superseded by arc ${arcEntry.id}: ${describeError(err)}`);
    }
  }
  if (failedSupersedes.length > 0) {
    cb?.onToast(
      userId,
      "warn",
      `The arc saved but ${failedSupersedes.length} chapter${failedSupersedes.length === 1 ? "" : "s"} couldn't be marked superseded`,
      automation,
    );
  }
  invalidateBookCache(userId, chatId);
  if (replacesEntryId) {
    try {
      await deleteEntry(replacesEntryId, userId);
      invalidateBookCache(userId, chatId);
    } catch (err) {
      warn(`regen: failed to delete replaced arc ${replacesEntryId}: ${describeError(err)}`);
    }
  }
  publishArcCreated(userId, {
    chatId,
    arcEntryId: arcEntry.id,
    bookId: book.id,
    sourceChapterEntryIds: selected.map((c) => c.raw.id),
    sourceMessageIds: msgIds,
    summaryText: finalArcContent,
    model: result.model,
    title: meta.title,
  });
  cb?.onStateChange(userId, chatId);
  return arcEntry.id;
  });
}

export async function createVolumeFromArcs(
  chatId: string,
  arcEntryIds: string[],
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  opts: { replacesEntryId?: string } = {},
): Promise<string | null> {
  if (!setBusy(userId, chatId, "volume", "Memoria is pressing a volume")) return null;
  try {
    const entries = await listLmbEntries(chatId, userId);
    const entriesForSelection = opts.replacesEntryId
      ? entries.filter((e) => e.raw.id !== opts.replacesEntryId)
      : entries;
    const coverage = await buildCoverage(chatId, userId, entriesForSelection);
    const wanted = new Set(arcEntryIds);
    const arcs = coverage.activeEntries
      .filter((e) => e.meta.tier === 2 && wanted.has(e.raw.id))
      .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (arcs.length === 0) return null;
    return await runVolume(chatId, profile, settings, userId, arcs, opts.replacesEntryId);
  } finally {
    clearBusy(userId, chatId, "volume");
  }
}

async function runVolume(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  selected: LMBEntry[],
  replacesEntryId?: string,
): Promise<string | null> {
  nyaaToast(userId, "volume_fire", false);
  const totalTurns = selected.reduce((acc, a) => acc + a.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 3, userId);
  const opener = buildVolumeHeader(provisionalSceneNumber, selected.length, totalTurns);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController();
    registerAborter(userId, chatId, "volume", controller);
    try {
      return await summarizeVolume(
        profile, settings.customPresets, chatId, selected, userId, opener,
        {
          externalSignal: controller.signal,
          onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "volume", chars, thinking),
          onDelta: (kind, delta) => appendStreamText(userId, chatId, "volume", kind, delta),
        },
      );
    } finally {
      aborters.delete(busyKey(userId, chatId, "volume"));
    }
  }, (n, err) => {
    warn(`volume attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", false);
  });

  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the pen down");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "volume", outcome.retries, outcome.err);
    failToast(userId, "volume", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);

  const result = outcome.value;
  const firstIdxs = selected.map((a) => a.meta.firstMsgIdx).filter((n): n is number => typeof n === "number");
  const lastIdxs = selected.map((a) => a.meta.lastMsgIdx).filter((n): n is number => typeof n === "number");
  const firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
  const lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;

  if (profile.showMemoryPreviews) {
    const draft = makeGroupPreview("volume", selected, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitVolume(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId);
    nyaaToast(userId, "volume_success", false);
    return entryId;
  } catch (err) {
    warn(`commitVolume failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "volume", 0, err);
    failToast(userId, "volume", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}

async function commitVolume(
  chatId: string,
  userId: string,
  selected: LMBEntry[],
  result: SummarizationResult,
  firstIdx: number,
  lastIdx: number,
  replacesEntryId?: string,
): Promise<string> {
  return withCommitMutex(userId, chatId, 3, async () => {
  const freshEntries = await listLmbEntries(chatId, userId);
  const entriesForCoverage = replacesEntryId
    ? freshEntries.filter((e) => e.raw.id !== replacesEntryId)
    : freshEntries;
  const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage);
  const stillActive = new Set(freshCoverage.activeEntries.filter((e) => e.meta.tier === 2).map((e) => e.raw.id));
  const filtered = selected.filter((a) => stillActive.has(a.raw.id));
  if (filtered.length === 0) {
    throw new Error("All source arcs were already bound by another volume or deleted");
  }
  if (filtered.length < selected.length) {
    selected = filtered;
    const firstIdxs = selected.map((a) => a.meta.firstMsgIdx).filter((n): n is number => typeof n === "number");
    const lastIdxs = selected.map((a) => a.meta.lastMsgIdx).filter((n): n is number => typeof n === "number");
    firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
    lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
  }
  const book = await ensureBookForChat(chatId, userId);
  // On regenerate, keep the replaced volume's scene number (see commitChapter).
  const replacedVolume = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
  const sceneNumber = typeof replacedVolume?.meta.sceneNumber === "number"
    ? replacedVolume.meta.sceneNumber
    : await nextSceneNumber(chatId, 3, userId);
  const msgIds = selected.flatMap((a) => a.meta.msgIds);
  const sourceArcEntryIds = selected.map((a) => a.raw.id);
  const isRootVolume = selected.length > 0 && selected.every((a) => a.meta.isRoot);
  const rootOrigin = isRootVolume ? selected.find((a) => a.meta.rootOrigin)?.meta.rootOrigin : undefined;
  if (!isRootVolume && selected.some((a) => a.meta.isRoot)) {
    const own = selected.filter((a) => !a.meta.isRoot);
    const fs = own.map((a) => a.meta.firstMsgIdx).filter((n): n is number => typeof n === "number");
    const ls = own.map((a) => a.meta.lastMsgIdx).filter((n): n is number => typeof n === "number");
    if (fs.length) firstIdx = Math.min(...fs);
    else if (firstIdx < 0) firstIdx = 0;
    if (ls.length) lastIdx = Math.max(...ls);
    else if (lastIdx < firstIdx) lastIdx = firstIdx;
  }
  const volumeTitle = isRootVolume
    ? (result.title?.trim() || "Inherited Volume")
    : deriveTitle(result, firstIdx + 1, lastIdx + 1);
  const meta: LMBEntryMeta = {
    tier: 3,
    chatId,
    msgIds,
    sourceChapterEntryIds: sourceArcEntryIds,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    tokenCountInput: selected.reduce((a, e) => a + e.meta.tokenCountOutput, 0),
    tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
    model: result.model,
    connectionId: result.connectionId,
    createdAt: Date.now(),
    title: volumeTitle,
    shortComment: result.shortComment,
    presetKey: result.presetKey,
    sceneNumber,
    rawOutput: result.rawOutput,
    ...(isRootVolume ? { isRoot: true, rootOrigin } : {}),
  };
  const baseComment = meta.title ?? `Volume - msgs ${(firstIdx + 1)}-${(lastIdx + 1)}`;
  const comment = `${isRootVolume ? "[Root] " : ""}Vol #${sceneNumber} - ${baseComment}`;
  const volumeSettings = await loadSettings(userId);
  const volumeOpener = buildVolumeHeader(sceneNumber, sourceArcEntryIds.length, msgIds.length);
  const finalVolumeContent = `${volumeOpener}\n\n${result.content}`;
  const volumeEntry = await createChapterEntry(book.id, meta, finalVolumeContent, comment, userId, result.keywords ?? [], volumeSettings.forceConstantEntries);
  const failedSupersedes: string[] = [];
  for (const arc of selected) {
    try {
      await patchEntryMeta(arc, { supersededByEntryId: volumeEntry.id }, userId);
    } catch (err) {
      failedSupersedes.push(arc.raw.id);
      warn(`failed to mark arc ${arc.raw.id} superseded by volume ${volumeEntry.id}: ${describeError(err)}`);
    }
  }
  if (failedSupersedes.length > 0) {
    cb?.onToast(
      userId,
      "warn",
      `The volume saved but ${failedSupersedes.length} arc${failedSupersedes.length === 1 ? "" : "s"} couldn't be marked superseded`,
    );
  }
  invalidateBookCache(userId, chatId);
  if (replacesEntryId) {
    try {
      await deleteEntry(replacesEntryId, userId);
      invalidateBookCache(userId, chatId);
    } catch (err) {
      warn(`regen: failed to delete replaced volume ${replacesEntryId}: ${describeError(err)}`);
    }
  }
  publishVolumeCreated(userId, {
    chatId,
    volumeEntryId: volumeEntry.id,
    bookId: book.id,
    sourceArcEntryIds,
    sourceMessageIds: msgIds,
    summaryText: finalVolumeContent,
    model: result.model,
    title: meta.title,
  });
  cb?.onStateChange(userId, chatId);
  return volumeEntry.id;
  });
}

export async function acceptPreview(
  chatId: string,
  draftId: string,
  profile: LMBProfile,
  userId: string,
): Promise<string | null> {
  const preview = findPendingPreview(userId, chatId, draftId);
  if (!preview) return null;
  const guardKey = `${userId}::${chatId}::${draftId}`;
  if (committingDrafts.has(guardKey)) return null;
  committingDrafts.add(guardKey);
  try {
    if (preview.kind === "chapter") {
      const messages = await spindle.chat.getMessages(chatId);
      const acceptEntries = preview.replacesEntryId
        ? (await listLmbEntries(chatId, userId)).filter((e) => e.raw.id !== preview.replacesEntryId)
        : undefined;
      const coverage = await buildCoverage(chatId, userId, acceptEntries, extraContextActive(profile));
      const intent = new Set(preview.sourceMessageIds);
      const window = messages.filter((m) => intent.has(m.id) && !coverage.coveredBy.has(m.id) && !isExcluded(m));
      if (window.length === 0) {
        dropPendingPreview(userId, chatId, draftId);
        cb?.onToast(userId, "warn", "Memoria can't save this chapter, its messages were deleted or already filed");
        cb?.onStateChange(userId, chatId);
        return null;
      }
      if (window.length < preview.sourceMessageIds.length) {
        cb?.onToast(userId, "warn", "Some messages were missing or already covered, Memoria saved the rest");
      }
      const firstIdx = messages.findIndex((m) => m.id === window[0]!.id);
      const lastIdx = messages.findIndex((m) => m.id === window[window.length - 1]!.id);
      const fakeResult: SummarizationResult = {
        rawOutput: preview.content,
        title: preview.title,
        opener: "",
        content: preview.content,
        keywords: preview.keywords ?? [],
        shortComment: preview.shortComment,
        usagePromptTokens: preview.tokenCountInput,
        usageCompletionTokens: preview.tokenCountOutput,
        model: preview.model,
        connectionId: preview.connectionId,
        presetKey: preview.presetKey,
      };
      try {
        const entryId = await commitChapter(
          chatId, profile, userId, window, fakeResult,
          firstIdx, lastIdx, messages, true, preview.replacesEntryId,
        );
        dropPendingPreview(userId, chatId, draftId);
        nyaaToast(userId, "success", false);
        cb?.onStateChange(userId, chatId);
        return entryId;
      } catch (err) {
        recordFailure(userId, chatId, "chapter", 0, err);
        failToast(userId, "chapter", err);
        cb?.onStateChange(userId, chatId);
        return null;
      }
    }
    const isVolume = preview.kind === "volume";
    const entries = await listLmbEntries(chatId, userId);
    const groupSelectionEntries = preview.replacesEntryId
      ? entries.filter((e) => e.raw.id !== preview.replacesEntryId)
      : entries;
    const coverage = await buildCoverage(chatId, userId, groupSelectionEntries);
    const wanted = new Set(preview.sourceChapterEntryIds ?? []);
    const sourceTier = isVolume ? 2 : 1;
    const selected = coverage.activeEntries.filter((e) => e.meta.tier === sourceTier && wanted.has(e.raw.id));
    if (selected.length === 0) {
      dropPendingPreview(userId, chatId, draftId);
      cb?.onToast(userId, "warn", isVolume
        ? "Memoria can't save this volume, its arcs were deleted or already bound"
        : "Memoria can't save this arc, its chapters were deleted or already bound");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    const fakeResult: SummarizationResult = {
      rawOutput: preview.content,
      title: preview.title,
      opener: "",
      content: preview.content,
      keywords: preview.keywords ?? [],
      shortComment: preview.shortComment,
      usagePromptTokens: preview.tokenCountInput,
      usageCompletionTokens: preview.tokenCountOutput,
      model: preview.model,
      connectionId: preview.connectionId,
      presetKey: preview.presetKey,
    };
    try {
      const entryId = isVolume
        ? await commitVolume(
            chatId, userId, selected, fakeResult,
            preview.firstMsgIdx ?? 0, preview.lastMsgIdx ?? 0, preview.replacesEntryId,
          )
        : await commitArc(
            chatId, userId, selected, fakeResult,
            preview.firstMsgIdx ?? 0, preview.lastMsgIdx ?? 0, preview.replacesEntryId,
          );
      dropPendingPreview(userId, chatId, draftId);
      nyaaToast(userId, isVolume ? "volume_success" : "arc_success", false);
      cb?.onStateChange(userId, chatId);
      return entryId;
    } catch (err) {
      recordFailure(userId, chatId, isVolume ? "volume" : "arc", 0, err);
      failToast(userId, isVolume ? "volume" : "arc", err);
      cb?.onStateChange(userId, chatId);
      return null;
    }
  } finally {
    committingDrafts.delete(guardKey);
  }
}

const CHAPTER_BACKLOG_CAP = 500;
const ARC_BACKLOG_CAP = 100;

export async function drainChapterBacklog(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  automation = false,
  ghost = false,
): Promise<number> {
  let made = 0;
  for (let i = 0; i < CHAPTER_BACKLOG_CAP; i++) {
    const created = await createChapterAuto(chatId, profile, settings, userId, automation, ghost).catch((err) => {
      warn(`${ghost ? "ghost " : ""}createChapterAuto failed: ${describeError(err)}`);
      return null;
    });
    if (!created) break;
    made++;
  }
  return made;
}

/** Thin alias so ghost drains read clearly at their call sites. */
export function drainGhostBacklog(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  automation = false,
): Promise<number> {
  return drainChapterBacklog(chatId, profile, settings, userId, automation, true);
}

export async function dryRunChapter(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
): Promise<DryRunAssembly> {
  const messages = await spindle.chat.getMessages(chatId);
  if (!messages || messages.length === 0) throw new Error("Chat has no messages");
  const entries = await listLmbEntries(chatId, userId);
  // Same coverage the real manual path sees, ghosts included in extra mode.
  const coverage = await buildCoverage(chatId, userId, entries, extraContextActive(profile));
  const uncoveredTail = pickUncoveredTail(messages, coverage);
  const window = selectNextChapterWindow(uncoveredTail, profile);
  if (window.length === 0) {
    throw new Error("No window available, lower the lag or window thresholds");
  }
  const chapters = coverage.activeEntries
    .filter((e) => e.meta.tier === 1 && typeof e.meta.firstMsgIdx === "number")
    .sort((a, b) => (a.meta.firstMsgIdx as number) - (b.meta.firstMsgIdx as number));
  const previousMemories = profile.previousMemoriesCount > 0
    ? chapters.slice(-profile.previousMemoriesCount)
    : [];
  const provisionalSceneNumber = await nextSceneNumber(chatId, 1, userId);
  const opener = buildChapterHeader(provisionalSceneNumber, window.length);
  return assembleChapterPrompt(profile, settings.customPresets, chatId, window, previousMemories, userId, opener);
}

export async function dryRunArc(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
): Promise<DryRunAssembly> {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  const chapters = coverage.activeEntries
    .filter((e) => e.meta.tier === 1 && !e.meta.isRoot)
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (chapters.length === 0) throw new Error("No chapters to bind yet");
  const totalTurns = chapters.reduce((acc, c) => acc + c.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 2, userId);
  const opener = buildArcHeader(provisionalSceneNumber, chapters.length, totalTurns);
  return assembleArcPrompt(profile, settings.customPresets, chatId, chapters, userId, opener);
}

export async function dryRunVolume(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
): Promise<DryRunAssembly> {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  const arcs = coverage.activeEntries
    .filter((e) => e.meta.tier === 2 && !e.meta.isRoot)
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (arcs.length === 0) throw new Error("No arcs to press yet");
  const totalTurns = arcs.reduce((acc, a) => acc + a.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 3, userId);
  const opener = buildVolumeHeader(provisionalSceneNumber, arcs.length, totalTurns);
  return assembleVolumePrompt(profile, settings.customPresets, chatId, arcs, userId, opener);
}

export async function drainArcBacklog(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  automation = false,
): Promise<number> {
  if (profile.arcTrigger === "manual") return 0;
  let made = 0;
  for (let i = 0; i < ARC_BACKLOG_CAP; i++) {
    const created = await createArcAuto(chatId, profile, settings, userId, automation).catch((err) => {
      warn(`createArcAuto failed: ${describeError(err)}`);
      return null;
    });
    if (!created) break;
    made++;
  }
  return made;
}

/**
 * Extra-context mode: drop ghost chapters whose source messages were edited,
 * regenerated, or deleted since summarization. Ghosts are invisible, so
 * dropping and re-summarizing them is free of injection flicker.
 */
export async function sweepStaleGhosts(chatId: string, userId: string): Promise<number> {
  const entries = await listLmbEntries(chatId, userId);
  const ghosts = entries.filter((e) => e.meta.tier === 1 && e.meta.ghost === true);
  if (ghosts.length === 0) return 0;
  const messages = await spindle.chat.getMessages(chatId);
  const byId = new Map(messages.map((m) => [m.id, m] as const));
  let dropped = 0;
  for (const g of ghosts) {
    const sigs = g.meta.msgSigs;
    const stale = !sigs || sigs.length !== g.meta.msgIds.length
      ? g.meta.msgIds.some((id) => !byId.has(id))
      : g.meta.msgIds.some((id, i) => {
          const m = byId.get(id);
          return !m || msgSig(m.role, m.content || "") !== sigs[i];
        });
    if (!stale) continue;
    try {
      await deleteEntry(g.raw.id, userId);
      if (typeof g.meta.sceneNumber === "number") {
        recordFreedGhostNumber(userId, chatId, g.meta.msgIds, g.meta.sceneNumber);
      }
      dropped++;
    } catch (err) {
      warn(`ghost sweep: failed to delete stale ghost ${g.raw.id}: ${describeError(err)}`);
    }
  }
  if (dropped > 0) {
    invalidateBookCache(userId, chatId);
    // Ghosts are visible in the Books tab, so a deletion-only pass must push
    // state or the UI keeps showing dead entries.
    cb?.onStateChange(userId, chatId);
  }
  return dropped;
}

/**
 * Extra-context mode: activate every ghost chapter whose whole span has aged
 * past the injection lag. Promotion is pure metadata - the summary was
 * written at generation time and is reused as-is.
 */
export async function promoteGhostChapters(
  chatId: string,
  profile: LMBProfile,
  userId: string,
  automation = false,
): Promise<number> {
  // The overlap check and the flip must not race a concurrent tier-1 commit
  // (accept_preview, manual filing), or a ghost can promote over a span a
  // real chapter just took. The commit paths hold this same mutex.
  return withCommitMutex(userId, chatId, 1, async () => {
  const entries = await listLmbEntries(chatId, userId);
  const ghosts = entries
    .filter((e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled)
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (ghosts.length === 0) return 0;
  const messages = await spindle.chat.getMessages(chatId);
  const realCoverage = await buildCoverage(chatId, userId, entries);
  const posById = new Map(messages.map((m, i) => [m.id, i] as const));
  // "Past the injection lag" is a per-ghost property. Deriving eligibility
  // from the contiguous uncovered tail would strand any ghost that a later
  // real chapter landed behind.
  const pastLagBoundary = trimLagFromTail(messages, profile).length;

  const promoted: LMBEntry[] = [];
  let zombies = 0;
  for (const g of ghosts) {
    if (g.meta.msgIds.length === 0) continue;
    // A ghost whose span was since covered by a real entry (manual chapter,
    // arc, rebuild) can never promote and never goes stale - delete it, the
    // story is already represented there.
    if (g.meta.msgIds.some((id) => realCoverage.coveredBy.has(id))) {
      try {
        await deleteEntry(g.raw.id, userId);
        // Free its ordinal like the sweep path, so if that real coverage is
        // later released a refill over the same span keeps this number.
        if (typeof g.meta.sceneNumber === "number") {
          recordFreedGhostNumber(userId, chatId, g.meta.msgIds, g.meta.sceneNumber);
        }
        zombies++;
      } catch (err) {
        warn(`ghost promotion: failed to delete overlapped ghost ${g.raw.id}: ${describeError(err)}`);
      }
      continue;
    }
    const pastLag = g.meta.msgIds.every((id) => {
      const p = posById.get(id);
      return typeof p === "number" && p < pastLagBoundary;
    });
    if (!pastLag) continue;
    try {
      await promoteGhostEntry(g, userId);
      promoted.push(g);
    } catch (err) {
      warn(`ghost promotion failed for ${g.raw.id}: ${describeError(err)}`);
    }
  }
  if (zombies > 0) {
    invalidateBookCache(userId, chatId);
    if (promoted.length === 0) cb?.onStateChange(userId, chatId);
  }
  if (promoted.length === 0) return 0;
  invalidateBookCache(userId, chatId);

  if (profile.hideCoveredMessages) {
    const coveredBy = new Map<string, string>();
    for (const g of promoted) {
      for (const id of g.meta.msgIds) coveredBy.set(id, g.raw.id);
    }
    await syncHiddenForCoveredMessages(
      chatId,
      messages,
      { coveredBy, activeEntries: [], volumes: [], arcs: [], chapters: [] },
      userId,
      true,
    ).catch((err) => warn(`ghost promotion hide failed: ${describeError(err)}`));
  }
  for (const g of promoted) {
    publishChapterCreated(userId, {
      chatId,
      chapterEntryId: g.raw.id,
      bookId: g.raw.world_book_id,
      sourceMessageIds: g.meta.msgIds,
      summaryText: g.raw.content || "",
      model: g.meta.model,
      title: g.meta.title,
    });
  }
  cb?.onToast(
    userId,
    "success",
    `Memoria shelved ${promoted.length} ghost chapter${promoted.length === 1 ? "" : "s"}`,
    automation,
  );
  cb?.onStateChange(userId, chatId);
  return promoted.length;
  });
}

/**
 * When extra-context mode is switched off with ghosts pending: promote what
 * already earned it, delete the rest. Leaving them would double-summarize
 * their spans (real-chapter coverage ignores ghosts) and strand the entries
 * as permanent disabled leftovers.
 */
export async function cleanupGhostsAfterModeOff(
  chatId: string,
  profile: LMBProfile,
  userId: string,
): Promise<void> {
  const entries = await listLmbEntries(chatId, userId);
  if (!entries.some((e) => e.meta.tier === 1 && e.meta.ghost === true)) return;
  await sweepStaleGhosts(chatId, userId).catch((err) =>
    warn(`mode-off ghost sweep failed: ${describeError(err)}`),
  );
  await promoteGhostChapters(chatId, profile, userId, true).catch((err) =>
    warn(`mode-off ghost promotion failed: ${describeError(err)}`),
  );
  // The delete pass shares the tier-1 mutex with promotion and refetches
  // inside it: a concurrent cleanup could otherwise promote a ghost between
  // this scan and the delete, and we'd destroy an enabled, announced chapter.
  await withCommitMutex(userId, chatId, 1, async () => {
    const remaining = (await listLmbEntries(chatId, userId)).filter(
      (e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled,
    );
    for (const g of remaining) {
      await deleteEntry(g.raw.id, userId).catch((err) =>
        warn(`mode-off ghost cleanup failed for ${g.raw.id}: ${describeError(err)}`),
      );
    }
    if (remaining.length > 0) {
      invalidateBookCache(userId, chatId);
      cb?.onStateChange(userId, chatId);
    }
  });
}

export async function maybeRunPipeline(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
): Promise<void> {
  // Ghost lifecycle maintenance runs ahead of the auto-create gates:
  // promotion completes already-paid summaries and sweep/cleanup drop stale
  // entries, so no toggle combination may strand ghosts - including flipping
  // the extra flag off while other chats still hold them. The off-branch is
  // one entry listing per generation, the same order of cost the injection
  // interceptor already pays every generation.
  if (extraContextActive(profile)) {
    await sweepStaleGhosts(chatId, userId).catch((err) => warn(`ghost sweep failed: ${describeError(err)}`));
    await promoteGhostChapters(chatId, profile, userId, true).catch((err) => warn(`ghost promotion failed: ${describeError(err)}`));
  } else {
    await cleanupGhostsAfterModeOff(chatId, profile, userId).catch((err) =>
      warn(`ghost cleanup failed: ${describeError(err)}`),
    );
  }
  if (!profile.autoCreate) return;
  await ensureForkAdoption(chatId, userId).catch(() => {});
  // A self-filed chapter mid-backoff would shadow the shelf inheritance.
  if (await forkShelfPending(chatId, userId).catch(() => false)) return;
  if (profile.autoCreateChapter) {
    if (extraContextActive(profile)) {
      // Generation runs at the codex lag (ghosts), injection at the chapter lag
      // (promotion). Same chapters, two moments.
      await drainGhostBacklog(chatId, profile, settings, userId, true);
    } else {
      await drainChapterBacklog(chatId, profile, settings, userId, true);
    }
  }
  await maybeRunArcCheck(chatId, profile, settings, userId, true);
}

export async function maybeRunArcCheck(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  automation = false,
): Promise<void> {
  if (!profile.autoCreate) return;
  if (!profile.autoCreateArc) return;
  if (profile.arcTrigger === "manual") return;
  await drainArcBacklog(chatId, profile, settings, userId, automation);
}

async function nextSceneNumber(chatId: string, tier: 1 | 2 | 3, userId: string): Promise<number> {
  const entries = await listLmbEntries(chatId, userId).catch(() => [] as LMBEntry[]);
  let max = 0;
  for (const e of entries) {
    if (e.meta.tier !== tier) continue;
    if (e.meta.isRoot) continue;
    const n = e.meta.sceneNumber;
    if (typeof n === "number" && n > max) max = n;
  }
  return max + 1;
}

function deriveTitle(result: SummarizationResult, firstMsg: number, lastMsg: number): string {
  if (result.title && result.title.trim()) return `${result.title.trim()} (msgs ${firstMsg}-${lastMsg})`;
  const firstLine = (result.content.split(/\n+/, 1)[0] || "").trim();
  const firstSentence = firstLine.split(/(?<=[.!?])\s/, 1)[0] || firstLine;
  const trimmed = firstSentence.slice(0, 60).trim();
  if (trimmed) return `${trimmed}${trimmed.length === 60 ? "..." : ""} (msgs ${firstMsg}-${lastMsg})`;
  return `Compressed - msgs ${firstMsg}-${lastMsg}`;
}

function makePreview(
  kind: "chapter" | "arc",
  chatId: string,
  window: ChatMessageDTO[],
  result: SummarizationResult,
  firstIdx: number,
  lastIdx: number,
  replacesEntryId?: string,
): PendingPreview {
  void chatId;
  return {
    kind,
    draftId: `draft_${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || `Chapter - msgs ${firstIdx + 1}-${lastIdx + 1}`,
    content: result.content,
    shortComment: result.shortComment,
    keywords: result.keywords ?? [],
    sourceMessageIds: window.map((m) => m.id),
    model: result.model,
    connectionId: result.connectionId,
    tokenCountInput: result.usagePromptTokens || 0,
    tokenCountOutput: result.usageCompletionTokens || 0,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    presetKey: result.presetKey,
    replacesEntryId,
  };
}

function makeGroupPreview(
  kind: "arc" | "volume",
  selected: LMBEntry[],
  result: SummarizationResult,
  firstIdx: number,
  lastIdx: number,
  replacesEntryId?: string,
): PendingPreview {
  return {
    kind,
    draftId: `draft_${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || `${kind === "volume" ? "Volume" : "Arc"} - msgs ${firstIdx + 1}-${lastIdx + 1}`,
    content: result.content,
    shortComment: result.shortComment,
    keywords: result.keywords ?? [],
    sourceMessageIds: selected.flatMap((c) => c.meta.msgIds),
    sourceChapterEntryIds: selected.map((c) => c.raw.id),
    model: result.model,
    connectionId: result.connectionId,
    tokenCountInput: result.usagePromptTokens || 0,
    tokenCountOutput: result.usageCompletionTokens || 0,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    presetKey: result.presetKey,
    replacesEntryId,
  };
}

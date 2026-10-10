declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import manifest from "../../spindle.json";
import type { FrontendToBackend } from "../types";
import type { LMBProfile } from "../shared";
import { buildCoverage, isEligibleForCount, isExcluded, type ChatMessage, type CoverageMap } from "./coverage";
import { listLmbEntries, type LMBEntry } from "./world-book";
import { loadSettings } from "./storage";

export const DIAGNOSTICS_PATH = "diagnostics.json";
export const DIAGNOSTICS_MAX_BYTES = 10_000_000;
const MAX_EVENT_BYTES = 512 * 1024;
const MAX_ROWS = 4096;
const MAX_PENDING = 64;
const encoder = new TextEncoder();

const EVENTS = ["operation", "request", "selection", "context", "retry", "failure", "preview", "commit", "fork", "snapshot", "injection", "codex", "action", "message", "ghost"] as const;
const MODES = ["automatic", "manual", "selected", "regenerate", "ghost", "chapter", "arc", "volume", "series", "saga", "library", "universe", "codex"] as const;
const OUTCOMES = ["started", "finished", "success", "failed", "skipped", "created", "removed", "pending"] as const;
const REASONS = ["busy", "empty", "no_window", "generation", "storage", "coverage_changed", "unknown", "cancelled", "excluded", "missing", "adoption", "snapshot_unavailable", "timeout", "invalid_output", "context_limit", "connection", "protocol", "stale"] as const;
const NUMBER_KEYS = ["tier", "attempt", "durationMs", "total", "covered", "uncovered", "excluded", "eligible", "hidden", "selected", "requested", "missing", "entries", "previous", "first", "last", "input", "output", "sourceCount", "changed", "rounds", "promptTokens", "completionTokens", "indexGaps", "duplicateIndexes", "gaps", "overlaps", "rangeMismatches", "missingSources", "lag", "window", "previousCount", "retryCount", "regexOutgoing", "regexIncoming", "arcBatch", "arcLag", "inputCharacters", "outputCharacters", "maxInputTokens", "maxOutputTokens", "temperature", "targetPercent", "targetTokens"] as const;
const FLAGS = ["automation", "ghost", "regeneration", "previews", "hideCovered", "extraContext", "lagTokens", "windowTokens", "active", "root", "disabled"] as const;
const ACTIONS = ["save_settings", "save_profile", "save_samplers", "set_active_profile", "create_chapter", "create_chapter_range", "create_all_chapters", "create_arc", "create_arc_from", "create_all_arcs", "create_higher_from", "create_higher_auto", "create_volume_from", "retry_last_failure", "delete_entry", "release_entry", "regenerate_entry", "update_entry", "resync_hidden", "resync_visibility", "abort_busy", "accept_preview", "discard_preview", "edit_preview", "rebase_root", "rebuild_root", "detach_root", "set_message_excluded", "summary_import", "summary_import_resolve", "codex_update_now", "codex_reset", "codex_rebuild", "codex_tidy"] as const;
type Numbers = Partial<Record<typeof NUMBER_KEYS[number], number>>;
type Flags = Partial<Record<typeof FLAGS[number], boolean>>;
interface MessageRow { id: string; index: number; position?: number; coveredBy?: string; excluded?: boolean; hidden?: boolean; selected?: boolean; eligible?: boolean; empty?: boolean }
interface EntryRow { id: string; tier: number; first?: number; last?: number; scene?: number; active?: boolean; root?: boolean; ghost?: boolean; disabled?: boolean; sourceCount?: number; sourceEntryCount?: number; messages?: string[]; sources?: string[] }
export interface DiagnosticInput {
  event: typeof EVENTS[number];
  chatId: string;
  relatedChatId?: string;
  entryId?: string;
  replacesEntryId?: string;
  mode?: typeof MODES[number];
  outcome?: typeof OUTCOMES[number];
  reason?: typeof REASONS[number];
  action?: typeof ACTIONS[number];
  messageScope?: "all" | "uncovered_and_selected" | "selected" | "assembled";
  numbers?: Numbers;
  flags?: Flags;
  messages?: MessageRow[];
  entries?: EntryRow[];
}
interface Event extends DiagnosticInput { seq: number; at: number; truncated: boolean }
interface Store { schema: 1; salt: string; next: number; dropped: number; events: Event[] }
const queues = new Map<string, Promise<unknown>>();
let pendingTotal = 0;
// Operational counters contain no identifiers or error text.
const healthByUser = new Map<string, { queueDrops: number; writeFailures: number }>();
function health(userId: string) {
  let value = healthByUser.get(userId);
  if (!value) {
    if (healthByUser.size >= 100) healthByUser.delete(healthByUser.keys().next().value!);
    value = { queueDrops: 0, writeFailures: 0 }; healthByUser.set(userId, value);
  }
  return value;
}

function serial<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const next = (queues.get(userId) ?? Promise.resolve()).then(task, task);
  queues.set(userId, next);
  void next.finally(() => { if (queues.get(userId) === next) queues.delete(userId); }).catch(() => {});
  return next;
}
function number(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER ? value : undefined;
}
function bool(value: unknown): boolean | undefined { return typeof value === "boolean" ? value : undefined; }
function choice<T extends string>(value: unknown, choices: readonly T[]): T | undefined { return choices.includes(value as T) ? value as T : undefined; }
function object(value: unknown): Record<string, any> { return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {}; }
function size(value: unknown): number { return encoder.encode(JSON.stringify(value)).length; }

/** A closed projection, never a redaction pass over arbitrary objects. The same
 * projection runs on disk reads, so edited/old files cannot smuggle text out. */
function project(raw: unknown, stored: boolean): Event | null {
  const v = object(raw);
  const event = choice(v.event, EVENTS);
  const ref = (id: unknown): string | undefined => typeof id === "string" && id.length > 0 && id.length <= 1024
    && (!stored || /^r_[a-f0-9]{32}$/.test(id)) ? id : undefined;
  const chatId = ref(v.chatId);
  if (!event || !chatId) return null;
  const numbers: Numbers = {}, flags: Flags = {};
  for (const key of NUMBER_KEYS) { const n = number(object(v.numbers)[key]); if (n !== undefined) numbers[key] = n; }
  for (const key of FLAGS) { const b = bool(object(v.flags)[key]); if (b !== undefined) flags[key] = b; }
  let budget = MAX_ROWS, truncated = v.truncated === true;
  const take = (value: unknown): any[] => {
    if (!Array.isArray(value)) return [];
    const rows = value.slice(0, Math.max(0, budget));
    budget -= rows.length;
    if (rows.length < value.length) truncated = true;
    return rows;
  };
  const messages: MessageRow[] = take(v.messages).flatMap((raw) => {
    const m = object(raw), id = ref(m.id), index = number(m.index);
    return id && index !== undefined ? [{ id, index, position: number(m.position), coveredBy: ref(m.coveredBy), excluded: bool(m.excluded), hidden: bool(m.hidden), selected: bool(m.selected), eligible: bool(m.eligible), empty: bool(m.empty) }] : [];
  });
  const entries: EntryRow[] = take(v.entries).flatMap((raw) => {
    const e = object(raw), id = ref(e.id), tier = number(e.tier);
    if (!id || tier === undefined) return [];
    return [{ id, tier, first: number(e.first), last: number(e.last), scene: number(e.scene), active: bool(e.active), root: bool(e.root), ghost: bool(e.ghost), disabled: bool(e.disabled),
      sourceCount: number(e.sourceCount), sourceEntryCount: number(e.sourceEntryCount),
      messages: take(e.messages).flatMap((id) => ref(id) ? [ref(id)!] : []), sources: take(e.sources).flatMap((id) => ref(id) ? [ref(id)!] : []),
    }];
  });
  return { event, chatId, relatedChatId: ref(v.relatedChatId), entryId: ref(v.entryId), replacesEntryId: ref(v.replacesEntryId),
    mode: choice(v.mode, MODES), outcome: choice(v.outcome, OUTCOMES), reason: choice(v.reason, REASONS), action: choice(v.action, ACTIONS),
    messageScope: choice(v.messageScope, ["all", "uncovered_and_selected", "selected", "assembled"] as const), numbers, flags, messages, entries,
    seq: number(v.seq) ?? 0, at: number(v.at) ?? 0, truncated };
}
function empty(): Store { return { schema: 1, salt: crypto.randomUUID().replaceAll("-", ""), next: 1, dropped: 0, events: [] }; }
async function read(userId: string, storage = spindle.userStorage): Promise<Store> {
  const raw = object(await storage.getJson(DIAGNOSTICS_PATH, { fallback: null, userId }));
  if (raw.schema !== 1 || typeof raw.salt !== "string" || !/^[a-f0-9]{32}$/.test(raw.salt)) return empty();
  const rows = Array.isArray(raw.events) ? raw.events : [];
  const store: Store = { schema: 1, salt: raw.salt, next: Math.max(1, number(raw.next) ?? 1), dropped: Math.max(0, number(raw.dropped) ?? 0),
    events: rows.flatMap((row) => { const e = project(row, true); return e ? [e] : []; }) };
  for (const event of store.events) store.next = Math.max(store.next, event.seq + 1);
  bound(store, userId);
  return store;
}
function report(store: Store, userId: string) {
  return { format: "lumibooks-diagnostics", schema: 1, version: manifest.version,
    exportedAt: Date.now(), indexBase: 0, maxBytes: DIAGNOSTICS_MAX_BYTES,
    droppedEvents: store.dropped, queueDropsThisSession: health(userId).queueDrops, writeFailuresThisSession: health(userId).writeFailures,
    privacy: "Includes timestamps, counts, indexes, structural relationships and salted pseudonyms. Excludes chat/summary text, prompts, reasoning, names, raw IDs, content hashes, credentials and raw errors.",
    events: store.events };
}
function bound(store: Store, userId: string): void {
  const sizes = store.events.map((event) => size(event) + 1);
  let bytes = sizes.reduce((sum, n) => sum + n, 0), removed = 0;
  // Include both envelopes and comma separators; retain every complete event
  // that fits in the larger of the compact disk and export representations.
  while (removed < sizes.length) {
    const emptyStore = { ...store, events: [] };
    const overhead = Math.max(size(emptyStore), size(report(emptyStore, userId)));
    if (bytes - 1 + overhead <= DIAGNOSTICS_MAX_BYTES) break;
    bytes -= sizes[removed++]!;
    store.dropped++;
  }
  if (removed) store.events = store.events.slice(removed);
}
async function anonymize(event: Event, salt: string): Promise<Event> {
  const refs = new Map<string, Promise<string>>();
  const ref = (id: string | undefined): Promise<string | undefined> => {
    if (id === undefined) return Promise.resolve(undefined);
    if (!refs.has(id)) refs.set(id, crypto.subtle.digest("SHA-256", encoder.encode(`${salt}\0${id}`)).then((hash) =>
      "r_" + [...new Uint8Array(hash).slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("")));
    return refs.get(id)!;
  };
  const [chatId, relatedChatId, entryId, replacesEntryId, messages, entries] = await Promise.all([
    ref(event.chatId), ref(event.relatedChatId), ref(event.entryId), ref(event.replacesEntryId),
    Promise.all((event.messages ?? []).map(async (m) => ({ ...m, id: (await ref(m.id))!, coveredBy: await ref(m.coveredBy) }))),
    Promise.all((event.entries ?? []).map(async (e) => ({ ...e, id: (await ref(e.id))!, messages: await Promise.all((e.messages ?? []).map(async (id) => (await ref(id))!)), sources: await Promise.all((e.sources ?? []).map(async (id) => (await ref(id))!)) }))),
  ]);
  return { ...event, chatId: chatId!, relatedChatId, entryId, replacesEntryId, messages, entries };
}

/** Logging is best effort and cannot throw into generation, adoption or hiding.
 * Only the content-free projection is retained while waiting for disk. */
export function recordDiagnostic(userId: string, input: DiagnosticInput): Promise<void> {
  try {
    if (pendingTotal >= MAX_PENDING) { health(userId).queueDrops++; return Promise.resolve(); }
    const event = project(input, false);
    if (!event) return Promise.resolve();
    event.at = Date.now();
    const storage = spindle.userStorage;
    pendingTotal++;
    return serial(userId, async () => {
      if ((await loadSettings(userId)).localLogsDisabled) return;
      const store = await read(userId, storage);
      const safe = await anonymize(event, store.salt);
      safe.seq = store.next++;
      if (size(safe) > MAX_EVENT_BYTES) { safe.messages = []; safe.entries = []; safe.truncated = true; }
      store.events.push(safe);
      bound(store, userId);
      // The host defaults to pretty JSON; request compact output so the byte
      // budget measures the actual persisted representation.
      if ((await loadSettings(userId)).localLogsDisabled) return;
      await storage.setJson(DIAGNOSTICS_PATH, store, { userId, indent: 0 });
    }).catch(() => { health(userId).writeFailures++; }).finally(() => { pendingTotal--; });
  } catch { health(userId).writeFailures++; return Promise.resolve(); }
}

export async function exportDiagnostics(userId: string): Promise<string> {
  return serial(userId, async () => {
    const store = await read(userId);
    return JSON.stringify(report(store, userId));
  });
}
export async function clearDiagnostics(userId: string): Promise<void> {
  await serial(userId, async () => { await spindle.userStorage.setJson(DIAGNOSTICS_PATH, empty(), { userId, indent: 0 }); healthByUser.delete(userId); });
}

/** Known error classes become fixed categories. Never serialize messages,
 * stacks, provider responses or arbitrary error codes. */
export function diagnosticErrorReason(error: unknown): DiagnosticInput["reason"] {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "AbortError": case "AbortedSummarizerError": return "cancelled";
    case "TimeoutError": return "timeout";
    case "CodexContextError": return "context_limit";
    case "CodexValidationError": return "invalid_output";
    case "ToolProtocolError": return "protocol";
    case "FatalSummarizerError": return "connection";
    default: return "unknown";
  }
}

export function recordFrontendAction(userId: string, message: FrontendToBackend, outcome: "started" | "finished" | "failed"): void {
  const action = choice(message.type, ACTIONS);
  if (!action || !("chatId" in message) || !message.chatId) return;
  void recordDiagnostic(userId, { event: "action", chatId: message.chatId, action, outcome,
    entryId: "entryId" in message ? message.entryId : undefined,
    relatedChatId: "sourceChatId" in message ? message.sourceChatId : undefined,
    numbers: { requested: "messageIds" in message ? message.messageIds.length : undefined },
  });
}

export function diagnosticEntries(entries: LMBEntry[], activeIds?: Set<string>, includeSources = true): EntryRow[] {
  return entries.map((e) => ({ id: e.raw.id, tier: e.meta.tier, first: e.meta.firstMsgIdx, last: e.meta.lastMsgIdx, scene: e.meta.sceneNumber,
    active: activeIds?.has(e.raw.id), root: !!e.meta.isRoot, ghost: !!e.meta.ghost, disabled: !!e.raw.disabled,
    sourceCount: e.meta.msgIds.length, sourceEntryCount: e.meta.sourceChapterEntryIds?.length ?? 0, messages: includeSources ? e.meta.msgIds : undefined, sources: includeSources ? e.meta.sourceChapterEntryIds : undefined }));
}

export function recordSelection(userId: string, chatId: string, profile: LMBProfile, messages: ChatMessage[], coverage: CoverageMap,
  selected: ChatMessage[], mode: DiagnosticInput["mode"], replacesEntryId?: string): void {
  const selectedIds = new Set(selected.map((m) => m.id));
  const indexes = new Set<number>();
  let indexGaps = 0, duplicateIndexes = 0, gaps = 0, inGap = false;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    if (indexes.has(m.index_in_chat)) duplicateIndexes++;
    indexes.add(m.index_in_chat);
    indexGaps += Math.max(0, m.index_in_chat - (i ? messages[i - 1]!.index_in_chat : -1) - 1);
    const uncovered = !coverage.coveredBy.has(m.id) && isEligibleForCount(m, profile);
    if (uncovered && !inGap) gaps++;
    inGap = uncovered;
  }
  void recordDiagnostic(userId, { event: "selection", chatId, mode, replacesEntryId, messageScope: "uncovered_and_selected", outcome: selected.length ? "success" : "skipped", reason: selected.length ? undefined : "no_window",
    numbers: { total: messages.length, covered: messages.filter((m) => coverage.coveredBy.has(m.id)).length, selected: selected.length, indexGaps, duplicateIndexes, gaps,
      lag: profile.lagValue, window: profile.windowValue, previousCount: profile.previousMemoriesCount, retryCount: profile.retryCount, regexOutgoing: profile.regexOutgoingScriptIds.length, regexIncoming: profile.regexIncomingScriptIds.length,
      arcBatch: profile.arcAfterChapters, arcLag: profile.arcLagChapters },
    flags: { lagTokens: profile.lagUnit === "tokens", windowTokens: profile.windowUnit === "tokens", previews: profile.showMemoryPreviews, hideCovered: profile.hideCoveredMessages, extraContext: profile.codexEnabled && profile.codexExtraContext },
    // Do not repeat the entire already-covered history on every no-window poll.
    // Export snapshots and commits supply that topology; these rows describe
    // candidates and explicitly selected messages, retaining their live positions.
    messages: messages.flatMap((m, position) => coverage.coveredBy.has(m.id) && !selectedIds.has(m.id) ? [] : [{ id: m.id, index: m.index_in_chat, position, coveredBy: coverage.coveredBy.get(m.id), excluded: isExcluded(m), hidden: m.extra?.hidden === true, eligible: isEligibleForCount(m, profile), selected: selectedIds.has(m.id), empty: !(m.content || "").trim() }]) });
}

/** Export includes a fresh structural snapshot even if the bug preceded logging. */
export async function captureDiagnosticSnapshot(userId: string, chatId: string): Promise<void> {
  try {
    if ((await loadSettings(userId)).localLogsDisabled) return;
    if (!await spindle.chats.get(chatId, userId)) throw new Error("Snapshot chat unavailable");
    const [messages, entries] = await Promise.all([spindle.chat.getMessages(chatId), listLmbEntries(chatId, userId)]);
    const coverage = await buildCoverage(chatId, userId, entries, true);
    const indexes = new Map(messages.map((m) => [m.id, m.index_in_chat]));
    const owners = new Map<string, number>();
    let missingSources = 0, rangeMismatches = 0;
    for (const e of entries) {
      if (e.meta.isRoot) continue;
      const live = e.meta.msgIds.flatMap((id) => indexes.has(id) ? [indexes.get(id)!] : []);
      missingSources += e.meta.msgIds.length - live.length;
      if (live.length && (Math.min(...live) !== e.meta.firstMsgIdx || Math.max(...live) !== e.meta.lastMsgIdx)) rangeMismatches++;
      if (coverage.activeEntries.includes(e)) for (const id of e.meta.msgIds) owners.set(id, (owners.get(id) ?? 0) + 1);
    }
    await recordDiagnostic(userId, { event: "snapshot", chatId, outcome: "success", messageScope: "all", numbers: { total: messages.length, entries: entries.length, missingSources, rangeMismatches, overlaps: [...owners.values()].filter((n) => n > 1).length },
      messages: messages.map((m, position) => ({ id: m.id, index: m.index_in_chat, position, coveredBy: coverage.coveredBy.get(m.id), excluded: isExcluded(m), hidden: m.extra?.hidden === true })),
      entries: diagnosticEntries(entries, new Set(coverage.activeEntries.map((e) => e.raw.id))) });
  } catch {
    await recordDiagnostic(userId, { event: "snapshot", chatId, outcome: "failed", reason: "snapshot_unavailable" });
  }
}

declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { ConnectionProfileDTO, LlmMessageDTO, ToolCallDTO, ToolSchemaDTO } from "lumiverse-spindle-types";

type LlmMessagePartDTO = Exclude<LlmMessageDTO["content"], string>[number];
import type { LMBProfile } from "../../shared";
import { CODEX_SAMPLER_DEFAULTS, approximateTokensFromChars } from "../../shared";
import type { ChatMessage } from "../coverage";
import type { CodexBundle, CodexFileKey, CodexFileValue, CodexThread, ValidateOptions } from "./schema";
import {
  CODEX_FILE_KEYS,
  FILE_ROW_KEY,
  LOCKED_FIELD_MASK,
  assignMissingRids,
  danglingRefCounts,
  fileRows,
  isCodexFileKey,
  danglingKey,
  formatDanglingRef,
  newDangling,
  newDanglingErrors,
  newDanglingFiles,
  repairDanglingRefs,
  validateCodexFile,
} from "./schema";
import { buildCodexSystemPrompt, buildCodexUserMessage, verifyNudge, type CodexPromptCtx, type CodexRunNotes } from "./prompt";
import { saveCodexFile } from "./store";
import {
  AbortedSummarizerError,
  FatalSummarizerError,
  buildCodexSamplerParameters,
  consumeGenerationStream,
  listConnections,
  parseLooseJsonObjects,
  resolveConnection,
  resolveSystemMacros,
} from "../summarizer";
import { describeError, warn } from "../runtime";

/** Tool-call transport failure: the model replied in prose with zero
 * structured calls. Callers surface the JSON-fallback hint on this one. */
export class ToolProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolProtocolError";
  }
}

/** Carries the validator's wording plus what was kept, so the toast path must
 * show it whole instead of trimming to the first sentence. */
export class CodexValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodexValidationError";
  }
}

/**
 * Preflight failure: the assembled prompt cannot fit the codex max input.
 * Failing loudly beats sending a request a provider may silently truncate
 * into a corrupted update. Carries the full remedy list, so the toast path
 * must show it whole instead of trimming to the first sentence.
 */
export class CodexContextError extends Error {
  constructor(promptTokens: number, maxInputTokens: number) {
    super(
      `The assembled codex prompt is ~${Math.round(promptTokens / 1000)}k tokens but the codex max input is ${Math.round(maxInputTokens / 1000)}k, so Memoria stopped instead of sending a request that would fail or be silently cut. `
      + "Raise Max input tokens under Tuning > Connection > Codex, or in Tuning > Settings > Codex lower the window, Chapters provided, or the lore limit, or freeze records in Codex > Overview.",
    );
    this.name = "CodexContextError";
  }
}

/** The codex context budget: the profile's max input, or the codex default. */
export function codexMaxInputTokens(profile: LMBProfile): number {
  return profile.codexSamplers.max_input_tokens ?? CODEX_SAMPLER_DEFAULTS.max_input_tokens;
}

const CACHE_EPHEMERAL = { type: "ephemeral" } as const;

/** Rounds the agent gets to clear its own dangling refs while still making
 * progress, before the rest are demoted to plain text. */
const INTEGRITY_ROUNDS = 3;

/** Consecutive fruitless nudges before a stalled run is given up on. Resets
 * whenever a nudge actually lands a record. */
const COVERAGE_NUDGES = 3;

/** Tool schemas for one run. The file enum carries only the active files, so
 * a frozen file cannot even be addressed by a tool call. */
function codexTools(activeFiles: readonly CodexFileKey[], sequential: boolean): ToolSchemaDTO[] {
  const tools: ToolSchemaDTO[] = [
  {
    name: "codex_write",
    description: sequential
      ? "Edit one codex file. Default is a patch: set adds or replaces complete rows by key, drop deletes by key, untouched rows survive without being resent. content replaces the whole file and is only for ground-up rewrites. One file per call. If writing every remaining file at once would be a strain, write one and you will be asked for the next."
      : "Edit one codex file. Default is a patch: set adds or replaces complete rows by key, drop deletes by key, untouched rows survive without being resent. content replaces the whole file and is only for ground-up rewrites. Call once per changed file, and put every call for this update in a single response.",
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", enum: [...activeFiles] },
        set: {
          type: "array",
          items: { type: "object" },
          description: "Rows to add or replace, each complete on its own, keyed by entity id or rid. Only rows that actually changed.",
        },
        drop: {
          type: "array",
          items: { type: "string" },
          description: "Entity ids or rids of rows to delete.",
        },
        seeds: {
          type: "array",
          items: { type: "string" },
          description: "threads.json only: the complete replacement seeds list.",
        },
        content: {
          type: "object",
          description: "The complete new file content, replacing everything. Only for a ground-up rewrite; never combined with set or drop.",
        },
      },
      required: ["file"],
    },
  },
  {
    name: "codex_done",
    description: "Declare the codex current. Only honored once every file has been written or skipped.",
    parameters: {
      type: "object",
      properties: {
        note: { type: "string", description: "One short line on what changed." },
      },
      required: [],
    },
  },
  ];
  tools.push({
    name: "codex_skip",
    description:
      "Declare that the listed files need no change from this material. List several at once when several are genuinely unaffected. Skipping a file the story did change loses that information permanently.",
    parameters: {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "string", enum: [...activeFiles] }, description: "The files that need no change." },
        reason: { type: "string", description: "One short line on why nothing changed." },
      },
      required: ["files"],
    },
  });
  return tools;
}

export interface CodexAgentOptions {
  chatId: string;
  userId: string;
  profile: LMBProfile;
  /** Resolved prompt texts and the active (non-frozen) file set for this run. */
  promptCtx: CodexPromptCtx;
  bundle: CodexBundle;
  chunk: ChatMessage[];
  chunkLabel: string;
  /** Position of the chunk's first message in the full chat, for header numbering. */
  chunkFirstIndex: number;
  notes: CodexRunNotes;
  /** Non-LumiBooks activated lore, fed as read-only canon reference. */
  lore: string | null;
  /** Recent chapter summaries behind the chunk (extra-context mode). */
  storySoFar: string | null;
  /** Replaces the standard chunk-driven user message (tidy passes). */
  userTextOverride?: string;
  /** Suppress the thorough-mode verification round (tidy passes). */
  skipVerify?: boolean;
  /** Reject timeline drops: history only shrinks in reconcile/tidy/refresh. */
  timelineAppendOnly?: boolean;
  /** Files that must be accounted for before done. Defaults to every active
   * file; target-list passes pass their targets. */
  coverageFiles?: readonly CodexFileKey[];
  /** Cumulative progress counters owned by the caller. A drain passes one
   * object across all its queued chunks so the busy label keeps counting up
   * in step with the stream viewer instead of resetting (and appearing
   * frozen) at each chunk boundary. */
  progressBase?: { chars: number; thinking: number };
  externalSignal: AbortSignal;
  onProgress?: (chars: number, thinkingChars: number) => void;
  onDelta?: (kind: "text" | "thinking", delta: string) => void;
}

export interface CodexRunResult {
  changedFiles: CodexFileKey[];
  rounds: number;
  model: string;
  usagePromptTokens: number;
  usageCompletionTokens: number;
  doneNote: string | null;
}

export async function resolveCodexConnection(profile: LMBProfile, userId: string): Promise<ConnectionProfileDTO> {
  if (profile.codexConnectionId) {
    const list = await listConnections(userId);
    const picked = list.find((c) => c.id === profile.codexConnectionId) ?? null;
    if (picked) {
      const model = typeof picked.model === "string" ? picked.model : "";
      if (!model.trim()) {
        throw new FatalSummarizerError(
          `Codex connection "${picked.name || picked.id}" has no model set, pick one in its settings`,
        );
      }
      return picked;
    }
    warn(`codex: connection ${profile.codexConnectionId} not found, falling back to the profile connection`);
  }
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for the codex");
  return conn;
}

interface QuietRound {
  content: string;
  toolCalls: ToolCallDTO[];
  usagePrompt: number;
  usageCompletion: number;
}

async function runQuietRound(
  conn: ConnectionProfileDTO,
  messages: LlmMessageDTO[],
  profile: LMBProfile,
  userId: string,
  tools: ToolSchemaDTO[] | null,
  externalSignal: AbortSignal,
  onProgress: ((chars: number, thinkingChars: number) => void) | undefined,
  onDelta: ((kind: "text" | "thinking", delta: string) => void) | undefined,
  progressBase: { chars: number; thinking: number },
): Promise<QuietRound> {
  const model = (conn.model ?? "").trim();
  const parameters: Record<string, unknown> = { ...buildCodexSamplerParameters(profile) };
  if (model) parameters["model"] = model;

  const result = await consumeGenerationStream(
    (signal) =>
      spindle.generate.quietStream({
        type: "quiet",
        messages,
        connection_id: conn.id,
        parameters,
        // JSON mode sends no tool schemas at all: the whole point is a
        // route that can't carry them.
        ...(tools ? { tools } : {}),
        userId,
        signal,
      }),
    {
      externalSignal,
      onProgress,
      onDelta,
      // No first-token timeout and no whole-round deadline: the host streams
      // only text and reasoning deltas, so a healthy tool-only round is
      // silent until the terminal done chunk, and big passes on slow models
      // can legitimately run past any fixed budget. Abort on the busy row is
      // the brake for a round that truly hangs.
      firstTokenTimeoutMs: null,
      overallDeadlineMs: null,
      salvagePartial: false,
      progressBase,
    },
  );
  return {
    content: result.content,
    toolCalls: result.toolCalls,
    usagePrompt: result.usage?.prompt_tokens ?? 0,
    usageCompletion: result.usage?.completion_tokens ?? 0,
  };
}

function assistantTurn(content: string, toolCalls: ToolCallDTO[]): LlmMessageDTO {
  const parts: LlmMessagePartDTO[] = [];
  if (content.trim()) parts.push({ type: "text", text: content });
  for (const call of toolCalls) {
    parts.push({ type: "tool_use", id: call.call_id, name: call.name, input: call.args });
  }
  return { role: "assistant", content: parts };
}

/**
 * JSON mode: lift the reply's single object into synthetic tool calls so the
 * staging loop stays transport-blind. Malformed writes become calls with bad
 * args on purpose: validation rejects them, which blocks "done" and forces a
 * correction round instead of silently dropping content.
 *
 * Broken think tags can leak planning prose and decoy JSON fragments into the
 * parsed text, so among every parsable object the LAST writes/done-shaped one
 * wins: the answer follows the scratchpad, never the other way around.
 */
function parseJsonModeCalls(raw: string): ToolCallDTO[] {
  const objs = parseLooseJsonObjects(raw);
  const envelopes = objs.filter((o) => Array.isArray(o["writes"]) || Array.isArray(o["skip"]) || o["done"] === true);
  const obj = envelopes.length ? envelopes[envelopes.length - 1]! : objs[0] ?? null;
  if (!obj) return [];
  const calls: ToolCallDTO[] = [];
  const writes = Array.isArray(obj["writes"]) ? obj["writes"] : [];
  writes.forEach((w, i) => {
    const args = w && typeof w === "object" && !Array.isArray(w) ? (w as Record<string, unknown>) : {};
    calls.push({ call_id: `json_w${i}`, name: "codex_write", args } as ToolCallDTO);
  });
  const skip = Array.isArray(obj["skip"]) ? obj["skip"] : [];
  if (skip.length) {
    calls.push({ call_id: "json_skip", name: "codex_skip", args: { files: skip } } as ToolCallDTO);
  }
  if (obj["done"] === true) {
    const args = typeof obj["note"] === "string" ? { note: obj["note"] } : {};
    calls.push({ call_id: "json_done", name: "codex_done", args } as ToolCallDTO);
  }
  return calls;
}

interface WriteOutcome {
  callId: string;
  file: CodexFileKey | null;
  errors: string[];
  /** Dropped without staging (frozen file), the ack must say so. */
  skipped?: boolean;
  /** Locked entities the write tried to touch; kept as-is, the ack says so. */
  lockedKept?: string[];
  /** Entities whose locked fields the write tried to change; values restored. */
  lockedFieldsKept?: string[];
  /** Drop keys that matched nothing (already deleted); acked as a no-op. */
  dropMisses?: string[];
  /** Archived resolved threads the write tried to touch; left alone, acked. */
  archivedKept?: string[];
  /** Sequential mode: files this codex_skip cleared from the owed list. */
  skipCleared?: CodexFileKey[];
  /** Validator corrections applied on the way in (keyword trims). */
  trimmed?: string[];
}

interface StagedWrite {
  /** The validated new file value; absent when the write was rejected. */
  value?: CodexFileValue;
  errors: string[];
  lockedKept: string[];
  /** Entities whose locked fields the write tried to change; values restored. */
  lockedFieldsKept: string[];
  /** Drop keys that matched nothing; already-deleted rows are a no-op, not an error. */
  dropMisses: string[];
  /** Archived resolved threads the write tried to touch; left alone, acked. */
  archivedKept: string[];
  /** Silent validator corrections (keyword trims), acked so the agent adapts. */
  notes?: string[];
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function isMaskEcho(v: unknown): boolean {
  return v === LOCKED_FIELD_MASK || (Array.isArray(v) && v.length === 1 && v[0] === LOCKED_FIELD_MASK);
}

/**
 * Field-level locks: the agent saw LOCKED_FIELD_MASK instead of the values,
 * so every staged entity row gets its locked fields restored from disk and
 * keeps its lockedFields list. Rows the user never field-locked get any
 * agent-invented lockedFields stripped, mirroring the "locked" flag rule.
 * Returns the ids whose locked fields the agent actually tried to change
 * (a mask echo or an omission is compliant and stays silent).
 */
function restoreLockedFields(file: CodexFileKey, value: CodexFileValue, current: CodexFileValue): string[] {
  if (file !== "characters" && file !== "locations" && file !== "things") return [];
  const curById = new Map<string, Record<string, unknown>>();
  for (const row of fileRows(current, file)) {
    if (typeof row["id"] === "string") curById.set(row["id"], row);
  }
  const touched: string[] = [];
  for (const row of fileRows(value, file)) {
    const id = typeof row["id"] === "string" ? row["id"] : "";
    const orig = curById.get(id);
    const lf = orig && Array.isArray(orig["lockedFields"])
      ? (orig["lockedFields"] as unknown[]).filter((f): f is string => typeof f === "string" && f !== "id" && f !== "name")
      : [];
    if (lf.length === 0) {
      delete row["lockedFields"];
      continue;
    }
    let changed = false;
    for (const f of lf) {
      const wrote = row[f];
      const want = orig![f];
      if (wrote !== undefined && !isMaskEcho(wrote) && JSON.stringify(wrote) !== JSON.stringify(want)) changed = true;
      if (want === undefined) delete row[f];
      else row[f] = clone(want);
    }
    row["lockedFields"] = [...lf];
    if (changed) touched.push(id);
  }
  return touched;
}

/** Merge one codex_write (patch or full content) into a complete validated
 * file value, preserving locked entities and hidden resolved threads. */
function stageWrite(
  file: CodexFileKey,
  args: Record<string, unknown>,
  current: CodexFileValue,
  validateOpts: ValidateOptions,
  timelineAppendOnly: boolean,
): StagedWrite {
  const errors: string[] = [];
  const lockedKept: string[] = [];
  const lockedFieldsKept: string[] = [];
  const dropMisses: string[] = [];
  const archivedKept: string[] = [];
  const keyField = FILE_ROW_KEY[file].key;
  // Models regularly emit explicit nulls for omitted params; treat them as absent.
  const arg = (k: string): unknown => {
    const v = args[k];
    return v === null ? undefined : v;
  };
  const rawContent = arg("content");
  const rawSet = arg("set");
  const rawDrop = arg("drop");
  const rawSeeds = arg("seeds");
  const hasPatch = rawSet !== undefined || rawDrop !== undefined || rawSeeds !== undefined;

  const lockedRows = new Map<string, Record<string, unknown>>();
  if (keyField === "id") {
    for (const row of fileRows(current, file)) {
      if (row["locked"] === true && typeof row["id"] === "string") lockedRows.set(row["id"], row);
    }
  }
  const hiddenResolved: CodexThread[] =
    file === "threads" ? (current as { threads: CodexThread[] }).threads.filter((t) => t.status === "resolved") : [];

  if (rawContent !== undefined) {
    if (hasPatch) {
      return { errors: ["content replaces the whole file - never combine it with set, drop, or seeds"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
    }
    let content: unknown = rawContent;
    if (typeof content === "string") {
      try {
        content = JSON.parse(content) as unknown;
      } catch {
        return { errors: ["content: string was not valid JSON, pass the object directly"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
      }
    }
    const result = validateCodexFile(file, content, validateOpts);
    if (!result.ok) return { errors: result.errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
    const value = result.value;
    // Locked rows are user-owned: revert edits, re-add omissions.
    if (lockedRows.size > 0) {
      const rows = fileRows(value, file);
      for (const [id, orig] of lockedRows) {
        const idx = rows.findIndex((r) => r["id"] === id);
        if (idx >= 0) {
          if (JSON.stringify(rows[idx]) !== JSON.stringify(orig)) lockedKept.push(id);
          rows[idx] = clone(orig);
        } else {
          lockedKept.push(id);
          rows.push(clone(orig));
        }
      }
    }
    if (keyField === "id") {
      for (const row of fileRows(value, file)) {
        if (row["locked"] === true && !lockedRows.has(String(row["id"] ?? ""))) delete row["locked"];
      }
    }
    if (file === "threads" && hiddenResolved.length > 0) {
      const t = value as { threads: CodexThread[] };
      // The archive copy is canonical: a rewrite row echoing an archived rid
      // is dropped, so a renumbering tidy can neither shadow-delete nor
      // duplicate the archive.
      const hiddenRids = new Set(hiddenResolved.map((h) => h.rid).filter(Boolean));
      for (const row of t.threads) {
        if (row.rid && hiddenRids.has(row.rid)) archivedKept.push(row.rid);
      }
      t.threads = t.threads.filter((row) => !(row.rid && hiddenRids.has(row.rid)));
      t.threads.push(...hiddenResolved.map((h) => clone(h)));
    }
    lockedFieldsKept.push(...restoreLockedFields(file, value, current));
    assignMissingRids(file, value);
    return { value, errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept, notes: result.notes };
  }

  if (!hasPatch) {
    return { errors: ["empty write: provide set, drop, seeds, or content"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  }
  if (rawSeeds !== undefined && file !== "threads") {
    errors.push("seeds: only threads.json has a seeds list");
  }
  const setRows: Record<string, unknown>[] = [];
  if (rawSet !== undefined) {
    if (!Array.isArray(rawSet)) errors.push("set: expected an array of rows");
    else rawSet.forEach((r, i) => {
      let row: unknown = r;
      if (typeof row === "string") {
        try { row = JSON.parse(row); } catch { /* handled below */ }
      }
      if (!row || typeof row !== "object" || Array.isArray(row)) errors.push(`set[${i}]: expected a row object`);
      else setRows.push(row as Record<string, unknown>);
    });
  }
  const dropKeys: string[] = [];
  if (rawDrop !== undefined) {
    if (!Array.isArray(rawDrop)) errors.push("drop: expected an array of keys");
    else rawDrop.forEach((k, i) => {
      if (typeof k !== "string" || !k.trim()) errors.push(`drop[${i}]: expected a key string`);
      else dropKeys.push(k.trim());
    });
  }
  let seeds: string[] | null = null;
  if (rawSeeds !== undefined && file === "threads") {
    if (!Array.isArray(rawSeeds) || rawSeeds.some((s) => typeof s !== "string")) {
      errors.push("seeds: expected an array of strings");
    } else {
      seeds = (rawSeeds as string[]).map((s) => s.trim()).filter(Boolean);
    }
  }
  if (setRows.length === 0 && dropKeys.length === 0 && seeds === null && errors.length === 0) {
    errors.push("empty write: set and drop held nothing - provide rows, keys, seeds, or content");
  }
  if (errors.length) return { errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };

  // Merge against the rows the agent can see; resolved threads stay hidden.
  let rows = fileRows(current, file).map((r) => clone(r));
  if (file === "threads") rows = rows.filter((r) => r["status"] !== "resolved");
  const isArchivedRid = (key: string): boolean =>
    file === "threads" && hiddenResolved.some((h) => h.rid === key);

  for (const key of dropKeys) {
    if (lockedRows.has(key)) {
      lockedKept.push(key);
      continue;
    }
    if (isArchivedRid(key)) {
      archivedKept.push(key);
      continue;
    }
    if (file === "timeline" && timelineAppendOnly) {
      errors.push(`drop "${key}": the timeline is append-only - events are only removed in reconcile or tidy passes`);
      continue;
    }
    const idx = rows.findIndex((r) => r[keyField] === key);
    if (idx === -1) {
      // Deletion is idempotent: a replayed correction round must not fail
      // on rows already gone.
      dropMisses.push(key);
      continue;
    }
    rows.splice(idx, 1);
  }
  setRows.forEach((row, i) => {
    const key = row[keyField];
    if (typeof key === "string" && key) {
      if (lockedRows.has(key)) {
        lockedKept.push(key);
        return;
      }
      const idx = rows.findIndex((r) => r[keyField] === key);
      if (idx >= 0) {
        rows[idx] = row;
        return;
      }
      if (keyField === "rid") {
        if (isArchivedRid(key)) {
          archivedKept.push(key);
          return;
        }
        errors.push(`set[${i}]: rid "${key}" does not exist in ${file}.json - omit rid to add a new row`);
        return;
      }
      rows.push(row);
      return;
    }
    if (keyField === "id") {
      errors.push(`set[${i}]: missing "id"`);
      return;
    }
    rows.push(row);
  });
  if (errors.length) return { errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };

  const candidate: Record<string, unknown> = { [FILE_ROW_KEY[file].field]: rows };
  if (file === "threads") {
    candidate["seeds"] = seeds ?? (current as { seeds: string[] }).seeds;
  }
  const result = validateCodexFile(file, candidate, validateOpts);
  if (!result.ok) return { errors: result.errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  const value = result.value;
  if (keyField === "id") {
    for (const row of fileRows(value, file)) {
      if (row["locked"] === true && !lockedRows.has(String(row["id"] ?? ""))) delete row["locked"];
    }
  }
  if (file === "threads" && hiddenResolved.length > 0) {
    (value as { threads: CodexThread[] }).threads.push(...hiddenResolved.map((h) => clone(h)));
  }
  lockedFieldsKept.push(...restoreLockedFields(file, value, current));
  assignMissingRids(file, value);
  return { value, errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept, notes: result.notes };
}

/**
 * Runs the codex agent: one quiet LLM round in the common case, more only for
 * validation retries or the thorough verification pass. Valid writes accumulate
 * on a working copy; nothing persists unless the run finishes clean, so a
 * failed run leaves the codex and cursor untouched for the next attempt.
 */
export async function runCodexAgent(opts: CodexAgentOptions): Promise<CodexRunResult> {
  const { profile, userId, chatId, promptCtx } = opts;
  const conn = await resolveCodexConnection(profile, userId);
  const useTools = promptCtx.useTools;
  const sequential = promptCtx.sequential;
  const skipPhrase = useTools ? "call codex_skip" : 'name them in "skip"';
  const donePhrase = useTools ? "Then call codex_done." : 'Set "done": true once everything is accounted for.';
  const coverage = new Set<CodexFileKey>(
    (opts.coverageFiles ?? [...promptCtx.activeFiles]).filter((k) => promptCtx.activeFiles.has(k)),
  );
  // Headroom for one round per file plus the nudges a stalling model needs.
  // A model that batches never reaches any of them.
  const maxRounds = coverage.size + COVERAGE_NUDGES + (profile.codexThorough ? 4 : 3);
  const tools = useTools ? codexTools([...promptCtx.activeFiles], sequential) : null;

  // Host macros resolve on the system prompt only, mirroring the summarizer:
  // the user message carries codex JSON and raw story text that must never be
  // macro-expanded.
  const system = await resolveSystemMacros(buildCodexSystemPrompt(promptCtx), chatId, userId);
  const userText = opts.userTextOverride ?? buildCodexUserMessage(
    promptCtx, opts.bundle, opts.chunk, opts.chunkLabel, opts.chunkFirstIndex, opts.notes, opts.lore, opts.storySoFar,
  );
  const maxInput = codexMaxInputTokens(profile);
  const promptTokens = approximateTokensFromChars(system.length + userText.length);
  if (promptTokens > maxInput) throw new CodexContextError(promptTokens, maxInput);
  const frozen = new Set<CodexFileKey>(CODEX_FILE_KEYS.filter((k) => !promptCtx.activeFiles.has(k)));
  const conv: LlmMessageDTO[] = [
    { role: "system", content: [{ type: "text", text: system, cache_control: { ...CACHE_EPHEMERAL } }] },
    { role: "user", content: [{ type: "text", text: userText, cache_control: { ...CACHE_EPHEMERAL } }] },
  ];

  const working: CodexBundle = { ...opts.bundle };
  const changed = new Set<CodexFileKey>();
  const validateOpts = { relationsTable: profile.codexRelationsTable, strictExtras: true };
  const progressBase = opts.progressBase ?? { chars: 0, thinking: 0 };
  // Dangling refs already on disk (a hand-saved file can carry one). The run
  // is only held responsible for refs it introduces or leaves after touching
  // the file - tolerating pre-existing danglers keeps an untouched
  // inconsistency from stalling consumption and toast-spamming every message.
  const baselineDangling = danglingRefCounts(opts.bundle);

  let usagePrompt = 0;
  let usageCompletion = 0;
  let doneNote: string | null = null;
  let verifyRequested = false;
  let unresolvedErrors = false;
  /** Files whose write was rejected and not yet successfully restaged. */
  const rejectedFiles = new Set<string>();
  let rounds = 0;
  /** Files still owed a write or a skip. */
  const remaining = new Set<CodexFileKey>(coverage);
  let jsonRetryUsed = false;
  let coverageNudges = 0;
  let lastNudgeRemaining = Number.POSITIVE_INFINITY;
  /** Dangling refs already reported, so a repeat can be repaired instead. */
  const danglingSeen = new Set<string>();
  let prevDanglingCount = Number.POSITIVE_INFINITY;
  let integrityRounds = 0;

  /** Keep what validated when the run as a whole fails. The caller still sees
   * the throw, so the cursor holds and the chunk is re-read next pass. */
  const persistClean = async (): Promise<CodexFileKey[]> => {
    const broken = newDanglingFiles(working, baselineDangling);
    const clean = [...changed].filter((k) => !rejectedFiles.has(k) && !broken.has(k));
    const saved: CodexFileKey[] = [];
    for (const key of clean) {
      try {
        await saveCodexFile(chatId, key, working[key], userId);
        saved.push(key);
      } catch (err) {
        warn(`codex: failed to persist ${key}.json from a failed run: ${describeError(err)}`);
      }
    }
    return saved;
  };
  const keptSuffix = (saved: CodexFileKey[]): string =>
    saved.length
      ? ` Memoria kept the ${saved.length} record${saved.length === 1 ? "" : "s"} she finished and will try the rest next time.`
      : "";

  while (rounds < maxRounds) {
    if (opts.externalSignal.aborted) throw new AbortedSummarizerError();
    rounds++;
    if (rounds > 1) opts.onDelta?.("text", `\n\n═══ round ${rounds} ═══\n`);
    const round = await runQuietRound(conn, conv, profile, userId, tools, opts.externalSignal, opts.onProgress, opts.onDelta, progressBase);
    usagePrompt += round.usagePrompt;
    usageCompletion += round.usageCompletion;
    // JSON mode has no structured calls: synthesize them from the reply so
    // everything below stays transport-blind.
    const calls = useTools ? round.toolCalls : parseJsonModeCalls(round.content);
    // Tool payloads never stream; narrate them so the live viewer shows the work.
    for (const call of calls) {
      if (call.name === "codex_write") {
        const f = typeof call.args["file"] === "string" ? call.args["file"] : "?";
        let label: string;
        if (call.args["content"] !== undefined) {
          let size = 0;
          try { size = JSON.stringify(call.args["content"] ?? "").length; } catch { /* unserializable */ }
          label = `full rewrite, ${(size / 1000).toFixed(1)}k chars`;
        } else {
          const bits: string[] = [];
          const setN = Array.isArray(call.args["set"]) ? (call.args["set"] as unknown[]).length : 0;
          const dropN = Array.isArray(call.args["drop"]) ? (call.args["drop"] as unknown[]).length : 0;
          if (setN) bits.push(`${setN} set`);
          if (dropN) bits.push(`${dropN} drop`);
          if (call.args["seeds"] !== undefined) bits.push("seeds");
          label = bits.join(", ") || "empty";
        }
        opts.onDelta?.("text", `\n➤ codex_write ${f}.json (${label})`);
      } else if (call.name === "codex_done") {
        const note = typeof call.args["note"] === "string" && call.args["note"].trim() ? ` — ${call.args["note"].trim()}` : "";
        opts.onDelta?.("text", `\n✦ codex_done${note}`);
      } else if (call.name === "codex_skip") {
        const files = Array.isArray(call.args["files"])
          ? (call.args["files"] as unknown[]).filter((f): f is string => typeof f === "string")
          : [];
        opts.onDelta?.("text", `\n○ codex_skip ${files.length ? files.map((f) => `${f}.json`).join(", ") : "(no files)"}`);
      } else {
        opts.onDelta?.("text", `\n✗ unknown tool ${call.name}`);
      }
    }

    if (calls.length === 0) {
      if (rounds === 1 && !round.content.trim()) {
        throw new Error("The codex agent returned an empty response");
      }
      // One stray character should not cost a whole pass.
      if (!useTools && !jsonRetryUsed && rounds < maxRounds && round.content.trim()) {
        jsonRetryUsed = true;
        opts.onDelta?.("text", "\n✗ no JSON object found in the reply, asking for a resend");
        conv.push({ role: "assistant", content: round.content });
        conv.push({
          role: "user",
          content:
            "No JSON object could be parsed from that reply. Send the update again as exactly ONE JSON object"
            + ' with "writes" and "done", and nothing outside it except an optional <think> block.'
            + " Do not wrap it in prose and do not truncate it.",
        });
        continue;
      }
      // A text-only reply while corrections are outstanding is an abandon,
      // not a natural stop: persisting would advance the cursor past
      // corrections that never happened.
      if (unresolvedErrors) {
        const saved = await persistClean();
        throw new CodexValidationError(
          "Memoria couldn't finish the codex update because the model gave up instead of fixing a record she rejected."
          + keptSuffix(saved),
        );
      }
      // Nothing staged and no done signal: treating this as a clean no-op
      // would silently consume the chunk.
      if (changed.size === 0) {
        if (useTools) {
          // Prose instead of tool calls is a transport failure (a route that
          // can't carry tool calls): the callers offer the JSON fallback.
          throw new ToolProtocolError("The codex agent narrated instead of calling tools, check that the connection supports tool calls");
        }
        throw new Error("The codex agent replied without a parsable JSON update");
      }
      if (remaining.size > 0) {
        // An empty or narrated reply mid-list is a stall, not a refusal. Keep
        // asking while records are still landing, and only give up once the
        // nudges stop producing any.
        if (remaining.size < lastNudgeRemaining) coverageNudges = 0;
        if (coverageNudges < COVERAGE_NUDGES && rounds < maxRounds) {
          coverageNudges++;
          lastNudgeRemaining = remaining.size;
          // A stalled model often replies with nothing at all, and an empty
          // assistant turn is not a valid message.
          const said = round.content.trim() || "(no reply)";
          conv.push(useTools ? assistantTurn(said, []) : { role: "assistant", content: said });
          conv.push({
            role: "user",
            content:
              `Still to account for: ${[...remaining].map((k) => `${k}.json`).join(", ")}.`
              + ` Write the next one now, or ${skipPhrase} for the ones this material genuinely does not change.`
              + ` ${donePhrase}`,
          });
          continue;
        }
        const saved = await persistClean();
        throw new CodexValidationError(
          `Memoria couldn't finish the codex update, the model stopped before writing ${[...remaining].join(", ")}.`
          + keptSuffix(saved),
        );
      }
      break;
    }

    conv.push(useTools
      ? assistantTurn(round.content, calls)
      : { role: "assistant", content: round.content });

    // Writes first, codex_done after: a correction and the done may share a
    // round, and done must see the round's staging results.
    const outcomes: WriteOutcome[] = [];
    const doneCalls: ToolCallDTO[] = [];
    for (const call of calls) {
      if (call.name === "codex_done") {
        doneCalls.push(call);
        continue;
      }
      if (call.name === "codex_skip") {
        const raw = call.args["files"];
        const files = (Array.isArray(raw) ? raw : [raw])
          .filter((f): f is CodexFileKey => isCodexFileKey(f) && !frozen.has(f));
        if (files.length === 0) {
          outcomes.push({ callId: call.call_id, file: null, errors: [`files: expected one or more of ${[...remaining].join(", ")}`] });
          continue;
        }
        // A skip only clears what is still owed, never retracting a write.
        const cleared = files.filter((f) => remaining.delete(f));
        outcomes.push({ callId: call.call_id, file: null, errors: [], skipCleared: cleared });
        continue;
      }
      if (call.name !== "codex_write") {
        // hadErrors blocks done THIS round; a corrected next round recovers,
        // unlike a permanent rejectedFiles sentinel which nothing could clear.
        outcomes.push({ callId: call.call_id, file: null, errors: [`Unknown tool "${call.name}", only codex_write, codex_skip and codex_done exist - resend the payload through codex_write`] });
        continue;
      }
      const fileRaw = call.args["file"];
      if (!isCodexFileKey(fileRaw)) {
        outcomes.push({ callId: call.call_id, file: null, errors: [`file: expected one of ${CODEX_FILE_KEYS.join(", ")} - resend this write under the right file`] });
        continue;
      }
      if (frozen.has(fileRaw)) {
        // A frozen write is dropped, not retried: the agent should simply
        // move on without that file.
        remaining.delete(fileRaw);
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: [], skipped: true });
        continue;
      }
      const staged = stageWrite(fileRaw, call.args, working[fileRaw], validateOpts, opts.timelineAppendOnly === true);
      if (!staged.value) {
        rejectedFiles.add(fileRaw);
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: staged.errors });
        continue;
      }
      (working as Record<CodexFileKey, CodexFileValue>)[fileRaw] = staged.value;
      changed.add(fileRaw);
      remaining.delete(fileRaw);
      rejectedFiles.delete(fileRaw);
      outcomes.push({
        callId: call.call_id,
        file: fileRaw,
        errors: [],
        ...(staged.lockedKept.length ? { lockedKept: staged.lockedKept } : {}),
        ...(staged.lockedFieldsKept.length ? { lockedFieldsKept: staged.lockedFieldsKept } : {}),
        ...(staged.dropMisses.length ? { dropMisses: staged.dropMisses } : {}),
        ...(staged.archivedKept.length ? { archivedKept: staged.archivedKept } : {}),
        ...(staged.notes?.length ? { trimmed: staged.notes } : {}),
      });
    }

    let sawDone = false;
    for (const call of doneCalls) {
      if (rejectedFiles.size > 0) {
        // Honoring done here would persist partial work and advance the
        // cursor past corrections that never happened.
        outcomes.push({
          callId: call.call_id,
          file: null,
          errors: [`Corrections still outstanding for: ${[...rejectedFiles].join(", ")}. Resend them before codex_done.`],
        });
        continue;
      }
      if (remaining.size > 0) {
        outcomes.push({
          callId: call.call_id,
          file: null,
          errors: [
            `Not yet. These files have not been written or skipped: ${[...remaining].map((k) => `${k}.json`).join(", ")}.`
            + ` Write the next one now, or ${skipPhrase} for the ones this material genuinely does not change.`,
          ],
        });
        continue;
      }
      sawDone = true;
      const note = call.args["note"];
      if (typeof note === "string" && note.trim()) doneNote = note.trim();
      outcomes.push({ callId: call.call_id, file: null, errors: [] });
    }

    // Files still owed may hold the entity a written ref points at, so this
    // only binds once coverage is complete. The agent's own fix beats a
    // mechanical demotion, so keep asking while it is still clearing refs and
    // only repair once it stalls, runs out of patience, or runs out of rounds.
    let dangling = remaining.size === 0 ? newDangling(working, baselineDangling) : [];
    if (dangling.length > 0) {
      integrityRounds++;
      const stalled = dangling.length >= prevDanglingCount;
      const outOfRoad = integrityRounds >= INTEGRITY_ROUNDS || rounds >= maxRounds - 1;
      if (stalled || outOfRoad) {
        const stubborn = dangling.filter((d) => danglingSeen.has(danglingKey(d)));
        if (stubborn.length > 0) {
          const fixed = repairDanglingRefs(working, new Set(stubborn.map((d) => d.file)));
          for (const r of fixed) opts.onDelta?.("text", `\n⤳ ${r}`);
          if (fixed.length > 0) dangling = newDangling(working, baselineDangling);
        }
      }
      prevDanglingCount = dangling.length;
      for (const d of dangling) danglingSeen.add(danglingKey(d));
    }
    const integrityErrors = dangling.map(formatDanglingRef);
    for (const o of outcomes) {
      if (o.errors.length) opts.onDelta?.("text", `\n✗ rejected${o.file ? ` ${o.file}.json` : ""}: ${o.errors[0]}`);
    }
    for (const e of integrityErrors) opts.onDelta?.("text", `\n✗ integrity: ${e}`);
    const hadErrors = outcomes.some((o) => o.errors.length > 0) || integrityErrors.length > 0;
    unresolvedErrors = hadErrors || rejectedFiles.size > 0;

    // Two feedback channels for the same outcomes: tool_result parts when the
    // transport has tools, one plain-text user message when it doesn't (a
    // no-tools route would choke on tool_result parts).
    const lockedNote = (o: WriteOutcome): string => {
      const bits: string[] = [];
      if (o.lockedKept?.length) bits.push(`locked, left untouched: ${o.lockedKept.join(", ")} - do not resend them`);
      if (o.lockedFieldsKept?.length) bits.push(`locked fields restored to the user's values on: ${o.lockedFieldsKept.join(", ")} - never write those fields`);
      if (o.dropMisses?.length) bits.push(`already absent, drop was a no-op: ${o.dropMisses.join(", ")}`);
      if (o.archivedKept?.length) bits.push(`resolved and archived, left alone: ${o.archivedKept.join(", ")} - never resend them`);
      if (o.trimmed?.length) bits.push(`${o.trimmed.join("; ")} - send only the few strongest keywords next time`);
      return bits.length ? ` (${bits.join("; ")})` : "";
    };
    const okNote = (o: WriteOutcome): string => {
      if (o.skipCleared) {
        return o.skipCleared.length
          ? `noted, left unchanged: ${o.skipCleared.map((k) => `${k}.json`).join(", ")}`
          : "already accounted for";
      }
      if (o.skipped) return `skipped, ${o.file}.json is frozen by the user - do not resend it`;
      return o.file ? `ok, staged${lockedNote(o)}` : "ok";
    };
    const resultParts: LlmMessagePartDTO[] = outcomes.map((o) => ({
      type: "tool_result",
      tool_use_id: o.callId,
      content: o.errors.length
        ? `REJECTED, nothing from this write was staged - resend it corrected in full:\n${o.errors.join("\n")}`
        : okNote(o),
      ...(o.errors.length ? { is_error: true } : {}),
    }));
    const feedbackLines: string[] = outcomes.map((o) =>
      o.errors.length
        ? `REJECTED ${o.file ? `${o.file}.json` : "write"}, nothing from it was staged - resend it corrected in full:\n${o.errors.join("\n")}`
        : o.file || o.skipCleared
          ? `${o.file ? `${o.file}.json ` : ""}${okNote(o)}`
          : "done acknowledged.",
    );
    const pushFeedback = (extra: string): void => {
      if (useTools) {
        if (extra) resultParts.push({ type: "text", text: extra });
        conv.push({ role: "user", content: resultParts });
      } else {
        conv.push({ role: "user", content: [...feedbackLines, extra].filter(Boolean).join("\n\n") });
      }
    };

    if (!hadErrors) {
      // Verify follows the agent's own stop, not its first write, or a model
      // that writes one file per round loses a round to it mid-list.
      const wantVerify = profile.codexThorough && sawDone && changed.size > 0 && !verifyRequested && !opts.skipVerify;
      if (sawDone && !wantVerify) {
        if (useTools) conv.push({ role: "user", content: resultParts });
        break;
      }
      if (wantVerify) {
        verifyRequested = true;
        pushFeedback(verifyNudge(promptCtx));
        continue;
      }
      if (remaining.size > 0) {
        pushFeedback(
          `Still to account for: ${[...remaining].map((k) => `${k}.json`).join(", ")}.`
          + ` Write the next one now, or ${skipPhrase} for the ones this material genuinely does not change.`
          + ` ${donePhrase}`,
        );
        continue;
      }
      const roundStaged = outcomes.some((o) => o.file !== null && !o.skipped && o.errors.length === 0);
      pushFeedback(roundStaged
        ? (useTools
          ? "Writes staged. Call codex_done, or send corrected files if anything is left."
          : 'Writes staged. Respond with a JSON object: any corrected files in "writes", and "done": true to finish.')
        : (useTools
          ? "Nothing was staged this round. Call codex_done, or send writes for unfrozen files."
          : 'Nothing was staged this round. Respond with a JSON object: writes for unfrozen files if needed, and "done": true.'));
      continue;
    }

    const fixup: string[] = [];
    if (integrityErrors.length) {
      fixup.push(`Cross-file integrity errors:\n${integrityErrors.join("\n")}`);
    }
    fixup.push(useTools
      ? "Resend ONLY the rejected or offending files, corrected. Then call codex_done."
      : 'Respond with a JSON object containing ONLY the rejected or offending files, corrected, in "writes". Set "done": true once everything is fixed.');
    pushFeedback(fixup.join("\n\n"));

    if (rounds >= maxRounds) {
      const left = outcomes.flatMap((o) => o.errors).concat(integrityErrors);
      const saved = await persistClean();
      throw new CodexValidationError(
        `Memoria couldn't finish the codex update after ${rounds} tries. The model kept sending records she can't accept: ${left.slice(0, 3).join(", ")}.${keptSuffix(saved)}`,
      );
    }
  }

  // A run that ends with rejections still outstanding (e.g. maxRounds hit
  // while the last round staged unrelated valid files without a codex_done)
  // must not persist: the caller would advance the cursor past corrections
  // that never landed. Force the chunk to retry.
  if (rejectedFiles.size > 0) {
    const saved = await persistClean();
    throw new CodexValidationError(
      `Memoria couldn't finish the codex update, these records were never corrected: ${[...rejectedFiles].join(", ")}.${keptSuffix(saved)}`,
    );
  }
  if (remaining.size > 0) {
    const saved = await persistClean();
    throw new CodexValidationError(
      `Memoria couldn't finish the codex update, the model never wrote ${[...remaining].join(", ")}.${keptSuffix(saved)}`,
    );
  }

  // Final gates before anything touches disk. The integrity check catches
  // dangling refs THIS run introduced or left in a file it touched (pre-existing
  // danglers in untouched files are tolerated so they can't stall consumption);
  // the ties check catches a table migration that left an entity file
  // un-rewritten, which would brick that file under the new recorded mode.
  const repaired = repairDanglingRefs(working, new Set(changed));
  for (const r of repaired) opts.onDelta?.("text", `\n⤳ ${r}`);
  const finalIntegrity = newDanglingErrors(working, baselineDangling);
  if (finalIntegrity.length) {
    const saved = await persistClean();
    throw new CodexValidationError(
      `Memoria couldn't finish the codex update, some records point at people or places that don't exist: ${finalIntegrity.slice(0, 3).join(", ")}.${keptSuffix(saved)}`,
    );
  }
  // Locked entities are exempt from both migration gates: the agent may not
  // touch them, so their ties can neither be lifted nor receive folds.
  if (opts.notes.migrateToTable) {
    const leftover = (["characters", "locations", "things"] as const).filter((k) =>
      working[k].entities.some((e) => e.locked !== true && Array.isArray(e.ties) && e.ties.length > 0),
    );
    if (leftover.length) {
      throw new Error(`Table migration left ties on ${leftover.map((k) => `${k}.json`).join(", ")}, the run will retry`);
    }
  }
  // Mirror gate for the inline direction: the caller wipes relations.json
  // after this run, so a run that visibly folded nothing must fail rather
  // than let populated rows be destroyed unfolded.
  if (opts.notes.migrateToInline && opts.bundle.relations.relations.length > 0) {
    const foldedTies = (["characters", "locations", "things"] as const).some((k) =>
      working[k].entities.some((e) => e.locked !== true && Array.isArray(e.ties) && e.ties.length > 0),
    );
    const lockedIds = new Set(
      (["characters", "locations", "things"] as const)
        .flatMap((k) => working[k].entities.filter((e) => e.locked === true).map((e) => e.id)),
    );
    const foldable = opts.bundle.relations.relations.some((r) =>
      (r.type === "pair" ? [r.a, r.b] : r.members).some((m) => !lockedIds.has(m)),
    );
    if (!foldedTies && foldable) {
      throw new Error("Inline migration produced no ties from the relations table, the run will retry");
    }
  }

  for (const key of changed) {
    try {
      await saveCodexFile(chatId, key, working[key], userId);
    } catch (err) {
      throw new Error(`Failed to save ${key}.json: ${describeError(err)}`);
    }
  }

  return {
    changedFiles: [...changed],
    rounds,
    model: conn.model,
    usagePromptTokens: usagePrompt,
    usageCompletionTokens: usageCompletion,
    doneNote,
  };
}

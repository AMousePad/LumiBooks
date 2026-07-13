declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { ConnectionProfileDTO, LlmMessageDTO, ToolCallDTO, ToolSchemaDTO } from "lumiverse-spindle-types";

type LlmMessagePartDTO = Exclude<LlmMessageDTO["content"], string>[number];
import type { LMBProfile } from "../../shared";
import type { ChatMessage } from "../coverage";
import type { CodexBundle, CodexFileKey, CodexFileValue } from "./schema";
import { CODEX_FILE_KEYS, danglingRefCounts, isCodexFileKey, newDanglingErrors, validateCodexFile } from "./schema";
import { buildCodexSystemPrompt, buildCodexUserMessage, VERIFY_NUDGE, type CodexRunNotes } from "./prompt";
import { saveCodexFile } from "./store";
import {
  AbortedSummarizerError,
  FatalSummarizerError,
  buildCodexSamplerParameters,
  consumeGenerationStream,
  listConnections,
  resolveConnection,
} from "../summarizer";
import { describeError, warn } from "../runtime";

const CACHE_EPHEMERAL = { type: "ephemeral" } as const;

const TOOLS: ToolSchemaDTO[] = [
  {
    name: "codex_write",
    description:
      "Replace one codex file with its complete new content. Call once per changed file, and put every call for this update in a single response.",
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", enum: [...CODEX_FILE_KEYS] },
        content: { type: "object", description: "The complete file content matching that file's schema." },
      },
      required: ["file", "content"],
    },
  },
  {
    name: "codex_done",
    description: "Declare the codex current. Call it alongside your writes, or alone when nothing durable changed.",
    parameters: {
      type: "object",
      properties: {
        note: { type: "string", description: "One short line on what changed." },
      },
      required: [],
    },
  },
];

export interface CodexAgentOptions {
  chatId: string;
  userId: string;
  profile: LMBProfile;
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
  /** Files the user froze: writes to them are rejected. */
  frozenFiles?: Set<CodexFileKey>;
  /** Replaces the standard chunk-driven user message (tidy passes). */
  userTextOverride?: string;
  /** Suppress the thorough-mode verification round (tidy passes). */
  skipVerify?: boolean;
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

async function resolveCodexConnection(profile: LMBProfile, userId: string): Promise<ConnectionProfileDTO> {
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
        tools: TOOLS,
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

interface WriteOutcome {
  callId: string;
  file: CodexFileKey | null;
  errors: string[];
  /** Dropped without staging (frozen file), the ack must say so. */
  skipped?: boolean;
}

/**
 * Runs the codex agent: one quiet LLM round in the common case, more only for
 * validation retries or the thorough verification pass. Valid writes accumulate
 * on a working copy; nothing persists unless the run finishes clean, so a
 * failed run leaves the codex and cursor untouched for the next attempt.
 */
export async function runCodexAgent(opts: CodexAgentOptions): Promise<CodexRunResult> {
  const { profile, userId, chatId } = opts;
  const conn = await resolveCodexConnection(profile, userId);
  const maxRounds = profile.codexThorough ? 4 : 3;

  const system = buildCodexSystemPrompt(profile.codexRelationsTable);
  const userText = opts.userTextOverride ?? buildCodexUserMessage(
    opts.bundle, opts.chunk, opts.chunkLabel, opts.chunkFirstIndex, opts.notes, opts.lore, opts.storySoFar,
  );
  const frozen = opts.frozenFiles ?? new Set<CodexFileKey>();
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

  while (rounds < maxRounds) {
    if (opts.externalSignal.aborted) throw new AbortedSummarizerError();
    rounds++;
    if (rounds > 1) opts.onDelta?.("text", `\n\n═══ round ${rounds} ═══\n`);
    const round = await runQuietRound(conn, conv, profile, userId, opts.externalSignal, opts.onProgress, opts.onDelta, progressBase);
    usagePrompt += round.usagePrompt;
    usageCompletion += round.usageCompletion;
    // Tool payloads never stream; narrate them so the live viewer shows the work.
    for (const call of round.toolCalls) {
      if (call.name === "codex_write") {
        const f = typeof call.args["file"] === "string" ? call.args["file"] : "?";
        let size = 0;
        try { size = JSON.stringify(call.args["content"] ?? "").length; } catch { /* unserializable */ }
        opts.onDelta?.("text", `\n➤ codex_write ${f}.json (${(size / 1000).toFixed(1)}k chars)`);
      } else if (call.name === "codex_done") {
        const note = typeof call.args["note"] === "string" && call.args["note"].trim() ? ` — ${call.args["note"].trim()}` : "";
        opts.onDelta?.("text", `\n✦ codex_done${note}`);
      } else {
        opts.onDelta?.("text", `\n✗ unknown tool ${call.name}`);
      }
    }

    if (round.toolCalls.length === 0) {
      if (rounds === 1 && !round.content.trim()) {
        throw new Error("The codex agent returned an empty response");
      }
      // A text-only reply while corrections are outstanding is an abandon,
      // not a natural stop: persisting would advance the cursor past
      // corrections that never happened.
      if (unresolvedErrors) {
        throw new Error(
          rejectedFiles.size > 0
            ? "The codex agent abandoned a rejected write instead of correcting it"
            : "The codex agent left an unresolved integrity error instead of correcting it",
        );
      }
      // Nothing staged and no codex_done: prose instead of tool calls is a
      // protocol failure (likely a connection without tool support), and
      // treating it as a clean no-op would silently consume the chunk.
      if (changed.size === 0) {
        throw new Error("The codex agent narrated instead of calling tools, check that the connection supports tool calls");
      }
      break;
    }

    conv.push(assistantTurn(round.content, round.toolCalls));

    // Writes first, codex_done after: a correction and the done may share a
    // round, and done must see the round's staging results.
    const outcomes: WriteOutcome[] = [];
    const doneCalls: ToolCallDTO[] = [];
    for (const call of round.toolCalls) {
      if (call.name === "codex_done") {
        doneCalls.push(call);
        continue;
      }
      if (call.name !== "codex_write") {
        // Same rationale as the invalid-file-key case: whatever payload this
        // carried has no valid destination, so done stays blocked and the
        // chunk retries rather than silently dropping content.
        rejectedFiles.add(`(unknown tool ${call.name})`);
        outcomes.push({ callId: call.call_id, file: null, errors: [`Unknown tool "${call.name}", only codex_write and codex_done exist`] });
        continue;
      }
      const fileRaw = call.args["file"];
      if (!isCodexFileKey(fileRaw)) {
        // The content had no valid destination, so it can't be cleared by a
        // later stage; blocking done until maxRounds forces a chunk retry.
        rejectedFiles.add("(invalid file key)");
        outcomes.push({ callId: call.call_id, file: null, errors: [`file: expected one of ${CODEX_FILE_KEYS.join(", ")}`] });
        continue;
      }
      if (frozen.has(fileRaw)) {
        // A frozen write is dropped, not retried: the agent should simply
        // move on without that file.
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: [], skipped: true });
        continue;
      }
      let content = call.args["content"];
      if (typeof content === "string") {
        try {
          content = JSON.parse(content) as unknown;
        } catch {
          rejectedFiles.add(fileRaw);
          outcomes.push({ callId: call.call_id, file: fileRaw, errors: ["content: string was not valid JSON, pass the object directly"] });
          continue;
        }
      }
      const result = validateCodexFile(fileRaw, content, validateOpts);
      if (!result.ok) {
        rejectedFiles.add(fileRaw);
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: result.errors });
        continue;
      }
      (working as Record<CodexFileKey, CodexFileValue>)[fileRaw] = result.value;
      changed.add(fileRaw);
      rejectedFiles.delete(fileRaw);
      outcomes.push({ callId: call.call_id, file: fileRaw, errors: [] });
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
      sawDone = true;
      const note = call.args["note"];
      if (typeof note === "string" && note.trim()) doneNote = note.trim();
      outcomes.push({ callId: call.call_id, file: null, errors: [] });
    }

    const integrityErrors = newDanglingErrors(working, baselineDangling);
    for (const o of outcomes) {
      if (o.errors.length) opts.onDelta?.("text", `\n✗ rejected${o.file ? ` ${o.file}.json` : ""}: ${o.errors[0]}`);
    }
    for (const e of integrityErrors) opts.onDelta?.("text", `\n✗ integrity: ${e}`);
    const hadErrors = outcomes.some((o) => o.errors.length > 0) || integrityErrors.length > 0;
    unresolvedErrors = hadErrors || rejectedFiles.size > 0;

    const resultParts: LlmMessagePartDTO[] = outcomes.map((o) => ({
      type: "tool_result",
      tool_use_id: o.callId,
      content: o.errors.length
        ? `REJECTED:\n${o.errors.join("\n")}`
        : o.skipped
          ? `skipped, ${o.file}.json is frozen by the user - do not resend it`
          : o.file
            ? "ok, staged"
            : "ok",
      ...(o.errors.length ? { is_error: true } : {}),
    }));

    if (!hadErrors) {
      const wantVerify = profile.codexThorough && changed.size > 0 && !verifyRequested && !opts.skipVerify;
      if (sawDone && !wantVerify) {
        conv.push({ role: "user", content: resultParts });
        break;
      }
      if (wantVerify) {
        verifyRequested = true;
        resultParts.push({ type: "text", text: VERIFY_NUDGE });
        conv.push({ role: "user", content: resultParts });
        continue;
      }
      // Writes landed but no codex_done: give it one round to finish or add more.
      resultParts.push({ type: "text", text: "Writes staged. Call codex_done, or send corrected files if anything is left." });
      conv.push({ role: "user", content: resultParts });
      continue;
    }

    const fixup: string[] = [];
    if (integrityErrors.length) {
      fixup.push(`Cross-file integrity errors:\n${integrityErrors.join("\n")}`);
    }
    fixup.push("Resend ONLY the rejected or offending files, corrected. Then call codex_done.");
    resultParts.push({ type: "text", text: fixup.join("\n\n") });
    conv.push({ role: "user", content: resultParts });

    if (rounds >= maxRounds) {
      const remaining = outcomes.flatMap((o) => o.errors).concat(integrityErrors);
      throw new Error(`Codex update failed validation after ${rounds} rounds: ${remaining.slice(0, 3).join("; ")}`);
    }
  }

  // A run that ends with rejections still outstanding (e.g. maxRounds hit
  // while the last round staged unrelated valid files without a codex_done)
  // must not persist: the caller would advance the cursor past corrections
  // that never landed. Force the chunk to retry.
  if (rejectedFiles.size > 0) {
    throw new Error(`Codex run ended with unresolved rejections: ${[...rejectedFiles].join(", ")}`);
  }

  // Final gates before anything touches disk. The integrity check catches
  // dangling refs THIS run introduced or left in a file it touched (pre-existing
  // danglers in untouched files are tolerated so they can't stall consumption);
  // the ties check catches a table migration that left an entity file
  // un-rewritten, which would brick that file under the new recorded mode.
  const finalIntegrity = newDanglingErrors(working, baselineDangling);
  if (finalIntegrity.length) {
    throw new Error(`Codex left dangling references: ${finalIntegrity.slice(0, 3).join("; ")}`);
  }
  if (opts.notes.migrateToTable) {
    const leftover = (["characters", "locations", "things"] as const).filter((k) =>
      working[k].entities.some((e) => Array.isArray(e.ties) && e.ties.length > 0),
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
      working[k].entities.some((e) => Array.isArray(e.ties) && e.ties.length > 0),
    );
    if (!foldedTies) {
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

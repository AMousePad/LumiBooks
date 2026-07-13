declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { ConnectionProfileDTO, LlmMessageDTO, ToolCallDTO } from "lumiverse-spindle-types";
import type { LMBProfile, CustomPreset } from "../shared";
import { CODEX_SAMPLER_DEFAULTS, SAMPLER_DEFAULTS } from "../shared";
import type { ChatMessage } from "./coverage";
import type { LMBEntry } from "./world-book";
import { applySelectedRegex } from "./regex";
import { describeError, warn } from "./runtime";
import { BUILTIN_ARC_PRESETS, BUILTIN_CHAPTER_PRESETS, BUILTIN_VOLUME_PRESETS } from "./presets";
import { DEFAULT_SHORT_COMMENT_RULES_TEMPLATE, MEMORIA_PERSONA_LINE } from "./memoria";

type ChatMessageDTO = ChatMessage;

const CONNECTION_CACHE_TTL_MS = 5000;
const connectionCache = new Map<string, { connections: ConnectionProfileDTO[]; expiresAt: number }>();

export async function listConnections(userId: string): Promise<ConnectionProfileDTO[]> {
  const cached = connectionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.connections;
  const fresh = await spindle.connections.list(userId).catch((err) => {
    warn(`failed to list connections: ${describeError(err)}`);
    return [] as ConnectionProfileDTO[];
  });
  connectionCache.set(userId, { connections: fresh, expiresAt: Date.now() + CONNECTION_CACHE_TTL_MS });
  return fresh;
}

export function invalidateConnectionsCache(userId: string): void {
  connectionCache.delete(userId);
}

export async function resolveConnection(
  profile: LMBProfile,
  userId: string,
): Promise<ConnectionProfileDTO | null> {
  const list = await listConnections(userId);
  if (list.length === 0) return null;
  let picked: ConnectionProfileDTO | null = null;
  if (profile.connectionId) {
    picked = list.find((c) => c.id === profile.connectionId) ?? null;
  }
  if (!picked) picked = list.find((c) => c.is_default) ?? null;
  if (!picked) picked = list[0] ?? null;
  if (!picked) return null;
  const modelStr = typeof picked.model === "string" ? picked.model : "";
  if (!modelStr.trim()) {
    throw new FatalSummarizerError(
      `Connection "${picked.name || picked.id}" has no model set, pick one in its settings`,
    );
  }
  return picked;
}

export class FatalSummarizerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalSummarizerError";
  }
}

export function findPresetText(profile: LMBProfile, customPresets: CustomPreset[], category: "chapter" | "arc" | "volume"): string {
  const key = category === "arc" ? profile.arcPresetKey : category === "volume" ? profile.volumePresetKey : profile.chapterPresetKey;
  const builtIns = category === "arc" ? BUILTIN_ARC_PRESETS : category === "volume" ? BUILTIN_VOLUME_PRESETS : BUILTIN_CHAPTER_PRESETS;
  const custom = customPresets.find((p) => p.key === key && p.category === category);
  if (custom) return custom.prompt;
  const builtIn = builtIns.find((p) => p.key === key);
  if (builtIn) return builtIn.prompt;
  return builtIns[0]?.prompt ?? "";
}

export function renderTranscript(messages: ChatMessageDTO[], includeIndex = true, indexOffset = 0): string {
  const lines: string[] = [];
  messages.forEach((m, idx) => {
    const role = m.role === "user" ? "USER" : m.role === "assistant" ? "ASSISTANT" : "SYSTEM";
    const content = (m.content || "").trim();
    if (!content) return;
    const head = includeIndex ? `<<${role} #${idx + 1 + indexOffset}>>` : `<<${role}>>`;
    lines.push(`${head}\n${content}`);
  });
  return lines.join("\n\n");
}

export interface SummarizationResult {
  rawOutput: string;
  title: string;
  opener: string;
  content: string;
  keywords: string[];
  shortComment: string;
  usagePromptTokens: number;
  usageCompletionTokens: number;
  model: string;
  connectionId: string;
  presetKey: string;
}

interface BuildOpts {
  systemPromptTemplate: string;
  targetTokens: number;
  targetPercent: number;
  previousMemoriesBlock: string;
  bodyHeading: string;
  body: string;
  shortCommentRulesOverride: string | null;
  personaOverride: string | null;
  opener: string;
}

function applyTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const v = vars[k as string];
    return v === undefined ? m : String(v);
  });
}

function buildMessages(opts: BuildOpts): { system: string; user: string } {
  const shortCommentRules = opts.shortCommentRulesOverride && opts.shortCommentRulesOverride.trim()
    ? opts.shortCommentRulesOverride
    : DEFAULT_SHORT_COMMENT_RULES_TEMPLATE;
  const personaLine = opts.personaOverride && opts.personaOverride.trim()
    ? opts.personaOverride
    : MEMORIA_PERSONA_LINE;
  const targetWords = Math.max(1, Math.round(opts.targetTokens / 1.4));
  const system = [
    personaLine,
    "",
    applyTemplate(opts.systemPromptTemplate, {
      target_tokens: opts.targetTokens,
      target_words: targetWords,
      target_percent: opts.targetPercent,
      memoria_short_comment_rules: shortCommentRules,
      memoria_opener: opts.opener,
    }),
  ].join("\n");
  const user = [opts.previousMemoriesBlock, opts.bodyHeading, opts.body].filter(Boolean).join("\n\n");
  return { system, user };
}

export function buildSamplerParameters(profile: LMBProfile): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const s = profile.samplers;
  out["temperature"] = s.temperature ?? SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null) out["top_p"] = s.top_p;
  if (s.top_k !== null) out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null) out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null) out["presence_penalty"] = s.presence_penalty;
  return out;
}

/** Same wire shape as buildSamplerParameters, sourced from the profile's
 * codex sampler set with the codex-sized fallbacks. */
export function buildCodexSamplerParameters(profile: LMBProfile): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const s = profile.codexSamplers;
  out["temperature"] = s.temperature ?? CODEX_SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? CODEX_SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? CODEX_SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null) out["top_p"] = s.top_p;
  if (s.top_k !== null) out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null) out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null) out["presence_penalty"] = s.presence_penalty;
  return out;
}

interface StreamedGeneration {
  content: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export type StreamDeltaKind = "text" | "thinking";

export interface StreamOptions {
  externalSignal: AbortSignal;
  onProgress?: (chars: number, thinkingChars: number) => void;
  /** Raw streamed text, for the live viewer. */
  onDelta?: (kind: StreamDeltaKind, delta: string) => void;
}

export class AbortedSummarizerError extends Error {
  constructor() {
    super("Aborted by user");
    this.name = "AbortedSummarizerError";
  }
}

export interface ConsumeStreamOptions {
  externalSignal: AbortSignal;
  onProgress?: (chars: number, thinkingChars: number) => void;
  onDelta?: (kind: StreamDeltaKind, delta: string) => void;
  /** Abort when no token/reasoning chunk arrived within this window. Must be
   * null for tool-call rounds: the host only streams text and reasoning
   * deltas, so a healthy tool-only response is silent until done. */
  firstTokenTimeoutMs: number | null;
  /** Whole-response deadline, the hang guard for silent tool-call rounds. */
  overallDeadlineMs: number | null;
  /** Return partial content when the stream ends without a done chunk
   * instead of throwing (the summarizer can parse a truncated reply). */
  salvagePartial: boolean;
  /** Progress offsets carried across multi-round conversations. */
  progressBase?: { chars: number; thinking: number };
}

export interface ConsumedStream {
  content: string;
  toolCalls: ToolCallDTO[];
  usage?: StreamedGeneration["usage"];
}

/**
 * Shared stream consumer for the summarizer and the codex agent: one home
 * for the abort wiring, timers, accumulation, and error precedence, so the
 * two callers can't drift apart. The caller owns request construction and
 * passes a factory so the request is only issued once abort wiring is live.
 */
export async function consumeGenerationStream(
  makeStream: (signal: AbortSignal) => AsyncGenerator<import("lumiverse-spindle-types").StreamChunkDTO, void, void>,
  options: ConsumeStreamOptions,
): Promise<ConsumedStream> {
  const controller = new AbortController();
  let firstTokenSeen = false;
  let ttftFired = false;
  let deadlineFired = false;
  let externalAborted = options.externalSignal.aborted;
  const onExternalAbort = (): void => {
    externalAborted = true;
    controller.abort();
  };
  if (externalAborted) controller.abort();
  else options.externalSignal.addEventListener("abort", onExternalAbort);
  const ttftTimer = options.firstTokenTimeoutMs !== null
    ? setTimeout(() => {
        if (!firstTokenSeen) {
          ttftFired = true;
          controller.abort();
        }
      }, options.firstTokenTimeoutMs)
    : null;
  const deadlineTimer = options.overallDeadlineMs !== null
    ? setTimeout(() => {
        deadlineFired = true;
        controller.abort();
      }, options.overallDeadlineMs)
    : null;

  const base = options.progressBase ?? { chars: 0, thinking: 0 };
  let aggregated = "";
  let thinkingChars = 0;
  let usage: StreamedGeneration["usage"];

  try {
    for await (const chunk of makeStream(controller.signal)) {
      if (chunk.type === "token" || chunk.type === "reasoning") {
        if (!firstTokenSeen) {
          firstTokenSeen = true;
          if (ttftTimer) clearTimeout(ttftTimer);
        }
        if (chunk.type === "token") {
          aggregated += chunk.token;
          options.onDelta?.("text", chunk.token);
        } else {
          thinkingChars += chunk.token.length;
          options.onDelta?.("thinking", chunk.token);
        }
        options.onProgress?.(base.chars + aggregated.length, base.thinking + thinkingChars);
        continue;
      }
      if (chunk.type === "done") {
        if (externalAborted) throw new AbortedSummarizerError();
        if (chunk.content) aggregated = chunk.content;
        usage = chunk.usage;
        // Tool-call payloads never stream as tokens; without counting them a
        // codex round reports near-zero output.
        let toolChars = 0;
        for (const tc of chunk.tool_calls ?? []) {
          try { toolChars += JSON.stringify(tc.args ?? {}).length; } catch { /* unserializable args */ }
        }
        base.chars += aggregated.length + toolChars;
        base.thinking += thinkingChars;
        options.onProgress?.(base.chars, base.thinking);
        return { content: aggregated, toolCalls: chunk.tool_calls ?? [], usage };
      }
    }
    if (externalAborted) throw new AbortedSummarizerError();
    if (options.salvagePartial && aggregated.trim()) {
      return { content: aggregated, toolCalls: [], usage };
    }
    throw new Error("The stream ended before completing");
  } catch (err) {
    if (externalAborted) throw new AbortedSummarizerError();
    if (ttftFired && options.firstTokenTimeoutMs !== null) {
      throw new Error(`No token within ${Math.round(options.firstTokenTimeoutMs / 1000)}s, the provider may be slow or unreachable`);
    }
    if (deadlineFired && options.overallDeadlineMs !== null) {
      throw new Error(`The response did not finish within ${Math.round(options.overallDeadlineMs / 1000)}s`);
    }
    throw err;
  } finally {
    if (ttftTimer) clearTimeout(ttftTimer);
    if (deadlineTimer) clearTimeout(deadlineTimer);
    options.externalSignal.removeEventListener("abort", onExternalAbort);
  }
}

async function runStreamingGeneration(
  conn: ConnectionProfileDTO,
  messages: LlmMessageDTO[],
  profile: LMBProfile,
  userId: string,
  options: StreamOptions,
): Promise<StreamedGeneration> {
  const result = await consumeGenerationStream(
    (signal) => spindle.generate.rawStream(buildGenerateRequest(conn, messages, profile, userId, signal)),
    {
      externalSignal: options.externalSignal,
      onProgress: options.onProgress,
      onDelta: options.onDelta,
      firstTokenTimeoutMs: Math.max(1, profile.ttftTimeoutSecs) * 1000,
      overallDeadlineMs: null,
      salvagePartial: true,
    },
  );
  return { content: result.content, usage: result.usage };
}

function buildGenerateRequest(
  conn: ConnectionProfileDTO,
  messages: LlmMessageDTO[],
  profile: LMBProfile,
  userId: string,
  signal: AbortSignal,
): Parameters<typeof spindle.generate.raw>[0] {
  const baseParams = buildSamplerParameters(profile);
  const effectiveModel = (conn.model ?? "").trim();
  const parameters: Record<string, unknown> = { ...baseParams };
  if (effectiveModel) parameters["model"] = effectiveModel;
  return {
    type: "raw",
    messages,
    connection_id: conn.id,
    ...(effectiveModel ? { model: effectiveModel } : {}),
    ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
    userId,
    signal,
  } as Parameters<typeof spindle.generate.raw>[0];
}

async function countTextTokens(text: string, model: string, userId: string): Promise<number> {
  if (!text) return 0;
  try {
    const result = await spindle.tokens.countText(text, { model, userId });
    return result.total_tokens;
  } catch (err) {
    warn(`tokens.countText fallback: ${describeError(err)}`);
    return Math.ceil(text.length / 4);
  }
}

interface ResolvedTargets {
  targetTokens: number;
  targetPercent: number;
  inputTokens: number;
}

async function resolveTargets(
  unit: "percent" | "tokens",
  percent: number,
  tokens: number,
  inputText: string,
  model: string,
  userId: string,
): Promise<ResolvedTargets> {
  const inputTokens = await countTextTokens(inputText, model, userId);
  if (unit === "tokens") {
    const targetTokens = Math.max(1, Math.floor(tokens));
    const targetPercent = inputTokens > 0
      ? Math.max(1, Math.round((targetTokens / inputTokens) * 100))
      : 0;
    return { targetTokens, targetPercent, inputTokens };
  }
  const targetTokens = Math.max(1, Math.floor((inputTokens * percent) / 100));
  return { targetTokens, targetPercent: percent, inputTokens };
}

function buildPreviousMemoriesBlock(previous: LMBEntry[]): string {
  if (previous.length === 0) return "";
  const lines = ["<<PREVIOUS MEMORIES (for context, do not rewrite)>>"];
  previous.forEach((p) => {
    lines.push(p.raw.content);
  });
  return lines.join("\n\n");
}

async function resolveSystemMacros(text: string, chatId: string, userId: string): Promise<string> {
  if (!text.includes("{{")) return text;
  try {
    const result = await spindle.macros.resolve(text, { chatId, userId, commit: false });
    return result.text;
  } catch (err) {
    warn(`macros.resolve failed, sending unresolved system: ${describeError(err)}`);
    return text;
  }
}

export interface DryRunAssembly {
  messages: Array<{ role: "system" | "user"; content: string }>;
  diagnostics: Array<{ message: string }>;
}

async function resolveMacrosWithDiagnostics(
  text: string,
  chatId: string,
  userId: string,
  diagnostics: Array<{ message: string }>,
): Promise<string> {
  if (!text.includes("{{")) return text;
  try {
    const result = await spindle.macros.resolve(text, { chatId, userId, commit: false });
    for (const d of result.diagnostics) {
      diagnostics.push({ message: `macro: ${d.message} (offset ${d.offset}, length ${d.length})` });
    }
    return result.text;
  } catch (err) {
    diagnostics.push({ message: `macros.resolve failed: ${describeError(err)}` });
    return text;
  }
}

export async function assembleChapterPrompt(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  chatId: string,
  messages: ChatMessageDTO[],
  previousMemories: LMBEntry[],
  userId: string,
  opener: string,
): Promise<DryRunAssembly> {
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for Memoria");

  const presetText = findPresetText(profile, customPresets, "chapter");
  if (!presetText) throw new Error("Chapter preset missing");

  const transcript = renderTranscript(messages, true);
  if (!transcript.trim()) throw new Error("Empty transcript");

  const { targetTokens, targetPercent, inputTokens: transcriptTokens } = await resolveTargets(
    profile.chapterTargetUnit,
    profile.chapterTargetPercent,
    profile.chapterTargetTokens,
    transcript,
    conn.model,
    userId,
  );

  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: buildPreviousMemoriesBlock(previousMemories),
    bodyHeading: `<<SCENE TO SUMMARIZE (target ~${targetTokens} tokens)>>`,
    body: transcript,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener,
  });

  const samplerParams = buildSamplerParameters(profile);
  const diagnostics: Array<{ message: string }> = [
    { message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` },
    { message: `Window: ${messages.length} message(s)` },
    { message: `Transcript tokens (model tokenizer): ${transcriptTokens}` },
    { message: `Target tokens: ${targetTokens} (${profile.chapterTargetUnit === "tokens" ? `fixed budget, ~${targetPercent}% of input` : profile.chapterTargetPercent + "% of input"})` },
    { message: `Target words (shown to model): ${Math.max(1, Math.round(targetTokens / 1.4))}` },
    { message: `Previous memories included: ${previousMemories.length}` },
    { message: `Opener: ${opener}` },
    { message: `Preset key: ${profile.chapterPresetKey}` },
    { message: `Sampler parameters being sent on the wire: ${JSON.stringify(samplerParams)}` },
  ];

  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: `Outgoing regex applied: ${profile.regexOutgoingScriptIds.length} script(s)` });
  }

  return {
    messages: [
      { role: "system", content: resolvedSystem },
      { role: "user", content: outgoingUser },
    ],
    diagnostics,
  };
}

export async function assembleArcPrompt(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  chatId: string,
  chapters: LMBEntry[],
  userId: string,
  opener: string,
): Promise<DryRunAssembly> {
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for Memoria");

  const presetText = findPresetText(profile, customPresets, "arc");
  if (!presetText) throw new Error("Arc preset missing");

  const body = chapters
    .map((c, idx) => `<<CHAPTER ${idx + 1}: ${c.raw.comment || c.meta.title || "untitled"}>>\n${c.raw.content}`)
    .join("\n\n");

  const { targetTokens, targetPercent, inputTokens: bodyTokens } = await resolveTargets(
    profile.arcTargetUnit,
    profile.arcTargetPercent,
    profile.arcTargetTokens,
    body,
    conn.model,
    userId,
  );

  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<CHAPTERS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener,
  });

  const samplerParams = buildSamplerParameters(profile);
  const diagnostics: Array<{ message: string }> = [
    { message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` },
    { message: `Source chapters: ${chapters.length}` },
    { message: `Concatenated chapter body tokens (model tokenizer): ${bodyTokens}` },
    { message: `Target tokens: ${targetTokens} (${profile.arcTargetUnit === "tokens" ? `fixed budget, ~${targetPercent}% of input` : profile.arcTargetPercent + "% of input"})` },
    { message: `Target words (shown to model): ${Math.max(1, Math.round(targetTokens / 1.4))}` },
    { message: `Opener: ${opener}` },
    { message: `Preset key: ${profile.arcPresetKey}` },
    { message: `Sampler parameters being sent on the wire: ${JSON.stringify(samplerParams)}` },
  ];

  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: `Outgoing regex applied: ${profile.regexOutgoingScriptIds.length} script(s)` });
  }

  return {
    messages: [
      { role: "system", content: resolvedSystem },
      { role: "user", content: outgoingUser },
    ],
    diagnostics,
  };
}

export async function assembleVolumePrompt(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  chatId: string,
  arcs: LMBEntry[],
  userId: string,
  opener: string,
): Promise<DryRunAssembly> {
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for Memoria");

  const presetText = findPresetText(profile, customPresets, "volume");
  if (!presetText) throw new Error("Volume preset missing");

  const body = arcs
    .map((a, idx) => `<<ARC ${idx + 1}: ${a.raw.comment || a.meta.title || "untitled"}>>\n${a.raw.content}`)
    .join("\n\n");

  const { targetTokens, targetPercent, inputTokens: bodyTokens } = await resolveTargets(
    profile.volumeTargetUnit,
    profile.volumeTargetPercent,
    profile.volumeTargetTokens,
    body,
    conn.model,
    userId,
  );

  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<ARCS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener,
  });

  const samplerParams = buildSamplerParameters(profile);
  const diagnostics: Array<{ message: string }> = [
    { message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` },
    { message: `Source arcs: ${arcs.length}` },
    { message: `Concatenated arc body tokens (model tokenizer): ${bodyTokens}` },
    { message: `Target tokens: ${targetTokens} (${profile.volumeTargetUnit === "tokens" ? `fixed budget, ~${targetPercent}% of input` : profile.volumeTargetPercent + "% of input"})` },
    { message: `Target words (shown to model): ${Math.max(1, Math.round(targetTokens / 1.4))}` },
    { message: `Opener: ${opener}` },
    { message: `Preset key: ${profile.volumePresetKey}` },
    { message: `Sampler parameters being sent on the wire: ${JSON.stringify(samplerParams)}` },
  ];

  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: `Outgoing regex applied: ${profile.regexOutgoingScriptIds.length} script(s)` });
  }

  return {
    messages: [
      { role: "system", content: resolvedSystem },
      { role: "user", content: outgoingUser },
    ],
    diagnostics,
  };
}

export async function summarizeVolume(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  chatId: string,
  arcs: LMBEntry[],
  userId: string,
  opener: string,
  streamOptions: StreamOptions,
): Promise<SummarizationResult> {
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for Memoria");

  const presetText = findPresetText(profile, customPresets, "volume");
  if (!presetText) throw new Error("Volume preset missing");

  const body = arcs
    .map((a, idx) => `<<ARC ${idx + 1}: ${a.raw.comment || a.meta.title || "untitled"}>>\n${a.raw.content}`)
    .join("\n\n");

  const { targetTokens, targetPercent } = await resolveTargets(
    profile.volumeTargetUnit,
    profile.volumeTargetPercent,
    profile.volumeTargetTokens,
    body,
    conn.model,
    userId,
  );

  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<ARCS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener,
  });

  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);

  const llmMessages: LlmMessageDTO[] = [
    { role: "system", content: resolvedSystem },
    { role: "user", content: outgoingUser },
  ];

  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);

  const rawText = (result.content || "").trim();
  if (!rawText) throw new Error("Empty model output");
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim()) throw new Error("The volume summary came back empty");
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.volumePresetKey,
  };
}

export async function summarizeChapter(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  chatId: string,
  messages: ChatMessageDTO[],
  previousMemories: LMBEntry[],
  userId: string,
  opener: string,
  streamOptions: StreamOptions,
): Promise<SummarizationResult> {
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for Memoria");

  const presetText = findPresetText(profile, customPresets, "chapter");
  if (!presetText) throw new Error("Chapter preset missing");

  const transcript = renderTranscript(messages, true);
  if (!transcript.trim()) throw new Error("Empty transcript");

  const { targetTokens, targetPercent } = await resolveTargets(
    profile.chapterTargetUnit,
    profile.chapterTargetPercent,
    profile.chapterTargetTokens,
    transcript,
    conn.model,
    userId,
  );

  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: buildPreviousMemoriesBlock(previousMemories),
    bodyHeading: `<<SCENE TO SUMMARIZE (target ~${targetTokens} tokens)>>`,
    body: transcript,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener,
  });

  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);

  const llmMessages: LlmMessageDTO[] = [
    { role: "system", content: resolvedSystem },
    { role: "user", content: outgoingUser },
  ];

  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);

  const rawText = (result.content || "").trim();
  if (!rawText) throw new Error("Empty model output");
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);

  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim()) throw new Error("The summary came back empty");
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.chapterPresetKey,
  };
}

export async function summarizeArc(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  chatId: string,
  chapters: LMBEntry[],
  userId: string,
  opener: string,
  streamOptions: StreamOptions,
): Promise<SummarizationResult> {
  const conn = await resolveConnection(profile, userId);
  if (!conn) throw new FatalSummarizerError("No connection available for Memoria");

  const presetText = findPresetText(profile, customPresets, "arc");
  if (!presetText) throw new Error("Arc preset missing");

  const body = chapters
    .map((c, idx) => `<<CHAPTER ${idx + 1}: ${c.raw.comment || c.meta.title || "untitled"}>>\n${c.raw.content}`)
    .join("\n\n");

  const { targetTokens, targetPercent } = await resolveTargets(
    profile.arcTargetUnit,
    profile.arcTargetPercent,
    profile.arcTargetTokens,
    body,
    conn.model,
    userId,
  );

  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<CHAPTERS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener,
  });

  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);

  const llmMessages: LlmMessageDTO[] = [
    { role: "system", content: resolvedSystem },
    { role: "user", content: outgoingUser },
  ];

  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);

  const rawText = (result.content || "").trim();
  if (!rawText) throw new Error("Empty model output");
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim()) throw new Error("The arc summary came back empty");
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.arcPresetKey,
  };
}

interface ParsedSummary {
  title: string;
  opener: string;
  content: string;
  keywords: string[];
  shortComment: string;
}

function parseSummaryJson(raw: string): ParsedSummary {
  const cleaned = stripThinkBlocks(raw);
  const normalized = normalizeText(cleaned);

  const candidates = collectJsonCandidates(normalized);
  let sawParseableObject = false;
  for (const cand of candidates) {
    const obj = tryParseJsonObject(cand);
    if (!obj) continue;
    sawParseableObject = true;
    const title = typeof obj["title"] === "string" ? (obj["title"] as string) : "";
    const opener = typeof obj["opener"] === "string" ? (obj["opener"] as string) : "";
    const contentRaw = obj["content"] ?? obj["summary"] ?? obj["memory_content"];
    if (typeof contentRaw !== "string") continue;
    const kw = obj["keywords"];
    const keywords = Array.isArray(kw) ? kw.filter((x): x is string => typeof x === "string") : [];
    const sc = typeof obj["short_comment"] === "string" ? (obj["short_comment"] as string) : "";
    return { title, opener, content: contentRaw, keywords, shortComment: sc };
  }
  if (sawParseableObject) {
    throw new Error("The model's JSON had no content field");
  }
  throw new Error("The model didn't return valid JSON");
}

function stripThinkBlocks(raw: string): string {
  return raw.replace(/<(?:think(?:ing)?|reasoning)>[\s\S]*?<\/(?:think(?:ing)?|reasoning)>/gi, "");
}

function normalizeText(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .trim();
}

function collectJsonCandidates(s: string): string[] {
  const out: string[] = [];
  for (const block of extractFencedBlocks(s)) out.push(block);
  out.push(s);
  const balanced = extractBalancedJson(s);
  if (balanced) out.push(balanced);
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const c of out) {
    if (!c) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    uniq.push(c);
  }
  return uniq;
}

function extractFencedBlocks(s: string): string[] {
  const re = /```([\w-]*)\s*([\s\S]*?)```/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push((m[2] || "").trim());
  }
  return out;
}

function extractBalancedJson(s: string): string | null {
  const startIdx = s.search(/[{[]/);
  if (startIdx === -1) return null;
  const open = s[startIdx];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = startIdx; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (ch === "\\") { esc = true; }
      else if (ch === "\"") { inStr = false; }
      continue;
    }
    if (ch === "\"") { inStr = true; continue; }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return s.slice(startIdx, i + 1).trim();
    }
  }
  return null;
}

function tryParseJsonObject(cand: string): Record<string, unknown> | null {
  const strict = tryJsonParse(cand);
  if (strict) return strict;
  return tryJsonParse(repairJson(cand));
}

function tryJsonParse(cand: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(cand) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    return v as Record<string, unknown>;
  } catch {
    return null;
  }
}

function repairJson(s: string): string {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (inStr) {
      out += ch;
      if (esc) { esc = false; }
      else if (ch === "\\") { esc = true; }
      else if (ch === "\"") { inStr = false; }
      continue;
    }
    if (ch === "\"") { inStr = true; out += ch; continue; }
    if (ch === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
      if (i < s.length) out += s[i];
      continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length - 1 && !(s[i] === "*" && s[i + 1] === "/")) i++;
      i += 1;
      continue;
    }
    if (ch === ",") {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j]!)) j++;
      if (s[j] === "}" || s[j] === "]") continue;
    }
    out += ch;
  }
  return out;
}

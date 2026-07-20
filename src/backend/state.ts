declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { ChapterView, ArcView, FrontendState, ConnectionOption, MessageStub, RegexScriptOption, RootSourceOption } from "../types";
import type { ChatMessage } from "./coverage";
import type { LMBProfile } from "../shared";
import { approximateTokensFromChars } from "../shared";
import { loadSettings } from "./storage";
import { buildCoverage, computeCoverageStats, countCompressibleEligible } from "./coverage";
import { findBookForChat, listLmbEntries, listRootCandidates, reassertChatBinding, type LMBEntry } from "./world-book";
import { listConnections, resolveConnection } from "./summarizer";
import { listRegexScripts } from "./regex";
import { extraContextActive, getBusy, getLastFailure, getPendingPreviews } from "./pipeline";
import { getCodexFileTokens, getCodexPanelState, getCodexStatus } from "./codex/index";
import { effectiveProfile, ensureLessons } from "./lessons";
import { ensureForkAdoption } from "./fork";
import { describeError, warn } from "./runtime";
import { BUILTIN_ARC_PRESETS, BUILTIN_CHAPTER_PRESETS, BUILTIN_CODEX_PRESETS, BUILTIN_VOLUME_PRESETS } from "./presets";

type ChatMessageDTO = ChatMessage;

export async function buildState(userId: string, requestedChatId?: string | null): Promise<FrontendState> {
  const settings = await loadSettings(userId);
  const activeProfile =
    settings.profiles.find((p) => p.id === settings.activeProfileId) ?? settings.profiles[0]!;
  const lessons = await ensureLessons(userId);
  // Codex-derived fields respect the Course 2 gate; the raw profile still
  // ships so Tuning shows the user's real values.
  const codexProfile = effectiveProfile(activeProfile, lessons);

  let chat;
  if (requestedChatId) {
    chat = await spindle.chats.get(requestedChatId, userId).catch(() => null);
  } else {
    chat = await spindle.chats.getActive(userId).catch(() => null);
  }

  const [connectionsRaw, regexScriptsRaw, rootCandidatesRaw] = await Promise.all([
    listConnections(userId),
    listRegexScripts(userId),
    listRootCandidates(userId).catch(() => []),
  ]);
  const connections: ConnectionOption[] = connectionsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    model: c.model,
    isDefault: c.is_default,
    hasApiKey: c.has_api_key,
  }));
  const regexScripts: RegexScriptOption[] = regexScriptsRaw.map((s) => ({ id: s.id, name: s.name }));
  const allRootCandidates: RootSourceOption[] = rootCandidatesRaw.map((c) => ({
    chatId: c.chatId,
    chatName: c.chatName,
    entryCount: c.entryCount,
  }));
  const resolved = await resolveConnection(activeProfile, userId).catch(() => null);

  const baseState: FrontendState = {
    activeChatId: null,
    activeChatName: null,
    activeCharacterId: null,
    activeCharacterName: null,
    settings,
    activeProfile,
    chapters: [],
    arcs: [],
    volumes: [],
    bookId: null,
    bookName: null,
    connections,
    resolvedSidecarConnectionId: resolved?.id ?? null,
    coverage: {
      totalMessages: 0,
      coveredMessages: 0,
      uncoveredMessages: 0,
      approxUncoveredTokens: 0,
      lagSatisfied: false,
      windowAvailable: false,
    },
    busy: getBusy(userId),
    lastFailure: null,
    messages: [],
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: settings.customPresets,
    regexScripts,
    pendingPreviews: [],
    backlogChapters: 0,
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: allRootCandidates,
    codexExists: false,
    codexBacklog: 0,
    codexBacklogPasses: 0,
    codexLastRunAt: null,
    codexInjectedTokens: 0,
    codexFileStates: {},
    codexStaleFiles: [],
    codexRefreshPending: [],
    codexFileTokens: {},
    lessons,
  };

  if (!chat) return baseState;

  if (settings.enabled) {
    await ensureForkAdoption(chat.id, userId).catch(() => {});
    await reassertChatBinding(chat.id, userId).catch(() => {});
  }

  const bookId = await findBookForChat(chat.id, userId);
  const bookName =
    bookId !== null ? (await spindle.world_books.get(bookId, userId).catch(() => null))?.name ?? null : null;

  let messages: ChatMessageDTO[] = [];
  try {
    messages = await spindle.chat.getMessages(chat.id);
  } catch (err) {
    warn(`failed to read messages for chat ${chat.id.slice(0, 8)}: ${describeError(err)}`);
  }

  const entries = await listLmbEntries(chat.id, userId).catch(() => []);
  const coverage = await buildCoverage(chat.id, userId, entries);
  const stats = computeCoverageStats(messages, coverage, activeProfile);

  // The advertised backlog must match what the filing paths can actually
  // drain, which in extra-context mode means ghost-aware coverage.
  const backlogCoverage = extraContextActive(activeProfile)
    ? await buildCoverage(chat.id, userId, entries, true)
    : coverage;
  const compressibleSize = countCompressibleEligible(messages, backlogCoverage, activeProfile);
  const windowDenom = Math.max(1, activeProfile.windowValue);
  const backlogChapters = Math.max(0, Math.floor(compressibleSize / windowDenom));
  const activeChapterEntries = coverage.activeEntries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot);
  const backlogArcs = countArcBacklog(activeChapterEntries, activeProfile);

  const supersededIds = new Set<string>();
  for (const e of entries) {
    if (e.meta.tier !== 1 && !e.raw.disabled && Array.isArray(e.meta.sourceChapterEntryIds)) {
      for (const sid of e.meta.sourceChapterEntryIds) supersededIds.add(sid);
    }
  }

  const chapters: ChapterView[] = [];
  const arcs: ArcView[] = [];
  const volumes: ArcView[] = [];
  for (const e of entries) {
    const view: ChapterView = {
      entryId: e.raw.id,
      bookId: e.raw.world_book_id,
      comment: e.raw.comment || "",
      content: e.raw.content || "",
      meta: e.meta,
      active: !(supersededIds.has(e.raw.id) || e.raw.disabled),
      contentTokens: approximateTokensFromChars((e.raw.content || "").length),
      contentChars: (e.raw.content || "").length,
      sourceTokensInput: e.meta.tokenCountInput || 0,
      isRoot: !!e.meta.isRoot,
      isGhost: e.meta.ghost === true,
    };
    if (e.meta.tier === 3) {
      volumes.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else if (e.meta.tier === 2) {
      arcs.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else {
      chapters.push(view);
    }
  }
  chapters.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  arcs.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  volumes.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));

  const messageStubs: MessageStub[] = messages.map((m) => {
    const covered = coverage.coveredBy.get(m.id) ?? null;
    const hidden = !!(m.extra && (m.extra as Record<string, unknown>).hidden);
    const excluded = !!((m as { metadata?: Record<string, unknown> }).metadata?.["lmb_excluded"] === true);
    const preview = (m.content || "").slice(0, 220).replace(/\s+/g, " ").trim();
    const charCount = (m.content || "").length;
    return {
      id: m.id,
      role: m.role,
      preview,
      charCount,
      approxTokens: approximateTokensFromChars(charCount),
      hidden,
      covered: !!covered,
      coveredByEntryId: covered,
      indexInChat: m.index_in_chat,
      excluded,
    };
  });

  let characterName: string | null = null;
  if (chat.character_id) {
    try {
      const character = await spindle.characters.get(chat.character_id, userId);
      characterName = character?.name ?? null;
    } catch (_) { void _; }
  }

  const codexStatus = await getCodexStatus(chat.id, userId, codexProfile).catch((err) => {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists: false, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  });
  const codexPanel = await getCodexPanelState(chat.id, userId).catch(() => ({ fileStates: {}, staleFiles: [], refreshPending: [] }));
  const codexFileTokens: Record<string, number> = await getCodexFileTokens(chat.id, userId, codexProfile).catch(() => ({}));
  // Constant entries only (timeline + threads), keyworded records cost per scene.
  const codexInjectedTokens = settings.enabled && codexProfile.codexEnabled
    ? (["timeline", "threads"] as const).reduce((acc, k) => {
        const st = (codexPanel.fileStates as Record<string, string>)[k];
        if (st === "noInject" || st === "frozen") return acc;
        return acc + (codexFileTokens[k] ?? 0);
      }, 0)
    : 0;

  const rootEntries = entries.filter((e) => e.meta.isRoot);
  const rootOrigin = rootEntries.find((e) => e.meta.rootOrigin)?.meta.rootOrigin ?? null;
  const rootOriginName = rootOrigin
    ? (allRootCandidates.find((c) => c.chatId === rootOrigin)?.chatName ?? rootOrigin.slice(0, 8))
    : null;

  return {
    ...baseState,
    activeChatId: chat.id,
    activeChatName: chat.name,
    activeCharacterId: chat.character_id,
    activeCharacterName: characterName,
    chapters,
    arcs,
    volumes,
    bookId,
    bookName,
    coverage: stats,
    lastFailure: getLastFailure(userId, chat.id),
    messages: messageStubs,
    pendingPreviews: getPendingPreviews(userId, chat.id),
    backlogChapters,
    backlogArcs,
    rootOrigin,
    rootOriginName,
    rootEntryCount: rootEntries.length,
    availableRoots: allRootCandidates.filter((c) => c.chatId !== chat.id),
    codexExists: codexStatus.exists,
    codexBacklog: codexStatus.backlog,
    codexBacklogPasses: codexStatus.backlogPasses,
    codexLastRunAt: codexStatus.lastRunAt,
    codexInjectedTokens,
    codexFileStates: codexPanel.fileStates,
    codexStaleFiles: codexPanel.staleFiles,
    codexRefreshPending: codexPanel.refreshPending,
    codexFileTokens,
  };
}

function countArcBacklog(activeChapters: LMBEntry[], profile: LMBProfile): number {
  if (profile.arcTrigger === "manual") return 0;
  const chapters = activeChapters
    .slice()
    .sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (profile.arcTrigger === "chapters") {
    const compressible = Math.max(0, chapters.length - profile.arcLagChapters);
    const denom = Math.max(1, profile.arcAfterChapters);
    return Math.floor(compressible / denom);
  }
  let reservedTokens = 0;
  let cutoff = chapters.length;
  for (let i = chapters.length - 1; i >= 0 && reservedTokens < profile.arcLagTokens; i--) {
    reservedTokens += chapters[i]!.meta.tokenCountOutput;
    cutoff = i;
  }
  const compressible = chapters.slice(0, cutoff);
  let arcs = 0;
  let acc = 0;
  for (const ch of compressible) {
    acc += ch.meta.tokenCountOutput;
    if (acc >= profile.arcAfterTokens) {
      arcs++;
      acc = 0;
    }
  }
  return arcs;
}

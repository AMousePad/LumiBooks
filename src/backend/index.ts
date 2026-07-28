declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { InterceptorResultDTO, LlmMessageDTO } from "lumiverse-spindle-types";
import type { FrontendToBackend } from "../types";
import { CODEX_ENTRY_EXTENSION_KEY, EXTENSION_KEY, normalizeProfile, normalizeCustomPreset } from "../shared";
import {
  debug,
  describeError,
  ensureUserFolders,
  error,
  getBootstrapUserId,
  info,
  readChatIdFromMessage,
  rememberChatUser,
  resolveUserId,
  send,
  setLastFrontendUserId,
  warn,
} from "./runtime";
import { loadSettings, mutateSettings, patchSettings } from "./storage";
import {
  codexGated,
  completeLessonCourse,
  effectiveProfile,
  ensureLessons,
  patchLessonCourse,
  registerLessonsAnomalyCallback,
  resetLessonCourse,
  skipCourseSeal,
} from "./lessons";
import {
  applyConstantToAllLmbEntries,
  ensureBookForChat,
  deleteEntry,
  patchEntryMeta,
  releaseEntry,
  updateEntry,
  listLmbEntries,
  invalidateBookCache,
  findChatIdForBook,
  findCachedChatIdForBook,
  invalidateAllBookCacheEntriesForBook,
  reassertChatBinding,
  registerBookAnomalyCallback,
} from "./world-book";
import { buildInjection, registerInjectionAnomalyCallback } from "./injection";
import {
  abortBusy,
  acceptPreview,
  cleanupGhostsAfterModeOff,
  createArcFromChapters,
  maybeRunArcCheck,
  createChapterAuto,
  createChapterFromRange,
  createVolumeFromArcs,
  drainArcBacklog,
  drainChapterBacklog,
  drainGhostBacklog,
  dropPendingPreview,
  extraContextActive,
  dryRunArc,
  dryRunChapter,
  dryRunVolume,
  getBusy,
  clearLastFailure,
  getLastFailure,
  maybeRunPipeline,
  patchPendingPreview,
  recordFreedGhostNumber,
  registerPipelineCallbacks,
  setBusy,
  setStreamWatcher,
} from "./pipeline";
import { clearBusy } from "./pipeline";
import { buildCoverage, computeCoverageStats, resyncVisibility, syncHiddenForCoveredMessages, unhideCoveredMessages } from "./coverage";
import {
  dryRunCodex,
  getCodexRevision,
  invalidateCodexInjectionCache,
  maybeRunCodex,
  publishCodexPool,
  rebuildCodex,
  rebuildCodexFiles,
  refreshCodexFiles,
  registerCodexCallbacks,
  runCodexNow,
  runCodexTidy,
  setCodexFileState,
} from "./codex/index";
import { deleteCodex, loadCodex, loadCursor, readCodexFilesRaw, saveCodexFile, saveCursor, withCursorLock } from "./codex/store";
import { syncCodexEntries, wipeCodexEntries } from "./codex/sync";
import { shortErrorText } from "./pipeline";
import { checkIntegrity, isCodexFileKey, validateCodexFile } from "./codex/schema";
import { registerForkAnomalyCallback } from "./fork";
import { rebaseRoot, rebuildRoot, detachRoot } from "./rebase";
import { invalidateConnectionsCache } from "./summarizer";
import { invalidateRegexCache } from "./regex";
import { publishCodexWiped, registerHookEndpoints } from "./hooks";
import { buildState } from "./state";
import { parseStmbPresetExport } from "./presets";

async function notify(
  userId: string,
  tone: "success" | "info" | "warn" | "error",
  text: string,
  automation = false,
): Promise<void> {
  try {
    if (automation && tone !== "error") {
      const settings = await loadSettings(userId).catch(() => null);
      if (settings && !settings.showAutomationToasts) return;
    }
    // One toast system only: the frontend's styled stack. Doubling up with
    // the host's toast rendered the same message twice in the same corner.
    // Errors are additionally logged server-side so they survive even if no
    // frontend is listening.
    if (tone === "error") error(`toast(error): ${text}`);
    send({ type: "toast", tone, text }, userId);
  } catch (err) {
    warn(`toast delivery failed: ${describeError(err)}`);
  }
}

const PUSH_DEBOUNCE_MS = 30;
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingPushChatIds = new Map<string, string | null>();
const pendingPushResolvers = new Map<string, Array<() => void>>();

async function doPushState(userId: string, chatId?: string | null): Promise<void> {
  try {
    if (chatId) {
      const active = await spindle.chats.getActive(userId).catch(() => null);
      if (active && active.id !== chatId) return;
    }
    const state = await buildState(userId, chatId);
    if (chatId) {
      const active = await spindle.chats.getActive(userId).catch(() => null);
      if (active && active.id !== chatId) return;
    }
    send({ type: "state", state }, userId);
  } catch (err) {
    error(`pushState failed: ${describeError(err)}`);
    send({ type: "error", text: `LumiBooks state refresh failed: ${describeError(err)}` }, userId);
  }
}

function pushState(userId: string, chatId?: string | null): Promise<void> {
  pendingPushChatIds.set(userId, chatId ?? null);
  const prev = pushTimers.get(userId);
  if (prev) clearTimeout(prev);
  return new Promise((resolve) => {
    const resolvers = pendingPushResolvers.get(userId) ?? [];
    resolvers.push(resolve);
    pendingPushResolvers.set(userId, resolvers);
    const timer = setTimeout(() => {
      pushTimers.delete(userId);
      const finalChatId = pendingPushChatIds.get(userId) ?? null;
      pendingPushChatIds.delete(userId);
      const waiting = pendingPushResolvers.get(userId) ?? [];
      pendingPushResolvers.delete(userId);
      doPushState(userId, finalChatId).finally(() => {
        for (const r of waiting) {
          try { r(); } catch (_) { void _; }
        }
      });
    }, PUSH_DEBOUNCE_MS);
    pushTimers.set(userId, timer);
  });
}

registerPipelineCallbacks({
  onBusyChange(userId, entries) {
    send({ type: "busy", entries }, userId);
  },
  onToast(userId, tone, text, automation) {
    void notify(userId, tone, text, automation === true);
  },
  onStateChange(userId, chatId) {
    void pushState(userId, chatId);
  },
  onStreamText(userId, chatId, kind, snap) {
    send({ type: "stream_text", chatId, kind, content: snap.content, thinking: snap.thinking, running: snap.running }, userId);
  },
});

registerCodexCallbacks({
  onToast(userId, tone, text, automation) {
    void notify(userId, tone, text, automation === true);
  },
  onStateChange(userId, chatId) {
    void pushState(userId, chatId);
  },
  onToolsHint(userId, chatId) {
    void (async () => {
      const settings = await loadSettings(userId).catch(() => null);
      if (settings?.suppressToolCallingPrompt) return;
      send({ type: "codex_tools_hint", chatId }, userId);
    })();
  },
});

spindle.registerWorldInfoInterceptor(async (ctx) => {
  const lmbIds: string[] = [];
  const disabledIds: string[] = [];
  const codexIds: string[] = [];
  for (const entry of ctx.entries) {
    const ext = entry.extensions as Record<string, unknown> | undefined;
    if (!ext) continue;
    if (ext[EXTENSION_KEY]) {
      lmbIds.push(entry.id);
      disabledIds.push(entry.id);
    }
    else if (ext[CODEX_ENTRY_EXTENSION_KEY]) codexIds.push(entry.id);
  }
  // The codex gate is evaluated per activation and timeboxed: the host drops
  // every vote on handler timeout, summary disables included.
  if (codexIds.length > 0) {
    const userId = ctx.userId ?? resolveUserId(ctx.chatId);
    if (userId) {
      let gateTimer: ReturnType<typeof setTimeout> | undefined;
      const gate = (async (): Promise<boolean> => {
        const settings = await loadSettings(userId);
        const rawProfile = settings.profiles.find((p) => p.id === settings.activeProfileId) ?? null;
        const profile = rawProfile ? effectiveProfile(rawProfile, await ensureLessons(userId)) : null;
        return !settings.enabled || !profile || !profile.codexEnabled;
      })();
      gate.catch(() => {});
      const deadline = new Promise<"timeout">((resolve) => {
        gateTimer = setTimeout(() => resolve("timeout"), 1500);
      });
      try {
        const off = await Promise.race([gate, deadline]);
        if (off === "timeout") {
          warn("world-info codex gate timed out, leaving codex entries active this turn");
        } else if (off) {
          disabledIds.push(...codexIds);
        }
      } catch (err) {
        warn(`world-info codex gate failed, leaving codex entries active: ${describeError(err)}`);
      } finally {
        if (gateTimer) clearTimeout(gateTimer);
      }
    }
  }
  if (disabledIds.length === 0) return undefined;
  const contracts = (spindle as unknown as {
    contracts?: Readonly<Record<string, number>>;
  }).contracts;
  return {
    disabled: disabledIds,
    ...(lmbIds.length > 0 && (contracts?.["worldInfoActivationCapture"] ?? 0) >= 1
      ? { captured: lmbIds }
      : {}),
  };
}, 90);

spindle.registerInterceptor(async (messages, context) => {
  try {
    const interceptorContext =
      context && typeof context === "object"
        ? (context as Record<string, unknown>)
        : null;
    const chatId =
      interceptorContext && typeof interceptorContext["chatId"] === "string"
        ? interceptorContext["chatId"]
        : null;
    if (!chatId) return messages;
    const capturedValue = interceptorContext?.["capturedWorldInfo"];
    const capturedWorldInfo = Array.isArray(capturedValue)
      ? capturedValue.flatMap((value) =>
          value &&
          typeof value === "object" &&
          typeof (value as { id?: unknown }).id === "string"
            ? [{ id: (value as { id: string }).id }]
            : [],
        )
      : undefined;
    const contracts = (spindle as unknown as {
      contracts?: Readonly<Record<string, number>>;
    }).contracts;
    const worldInfoActivationCapture =
      (contracts?.["worldInfoActivationCapture"] ?? 0) >= 1;
    let userId = resolveUserId(chatId);
    if (!userId) {
      const bootstrap = getBootstrapUserId();
      if (bootstrap) {
        const chat = await spindle.chats.get(chatId, bootstrap).catch(() => null);
        if (chat) {
          rememberChatUser(chatId, bootstrap);
          userId = bootstrap;
        }
      }
    }
    if (!userId) return messages;
    const settings = await loadSettings(userId);
    if (!settings.enabled) return messages;
    const result = await buildInjection(
      chatId,
      messages as LlmMessageDTO[],
      userId,
      {
        capturedWorldInfo,
        worldInfoActivationCapture,
      },
    );
    if (!result) return messages;
    return { messages: result.messages, breakdown: result.breakdown };
  } catch (err) {
    warn(`interceptor failed: ${describeError(err)}`);
    return messages;
  }
}, 90);

spindle.on("MESSAGE_SENT", async (payload: unknown, hostUserId?: string) => {
  const p = payload as { chatId?: string };
  if (!p?.chatId) return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId) return;
  rememberChatUser(p.chatId, userId);
});

spindle.on("GENERATION_ENDED", async (payload: unknown, hostUserId?: string) => {
  const p = payload as { chatId?: string; error?: string };
  if (!p?.chatId || p.error) return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId) return;
  rememberChatUser(p.chatId, userId);
  await ensureUserFolders(userId).catch(() => {});
  const settings = await loadSettings(userId).catch(() => null);
  if (!settings?.enabled) return;
  const rawProfile = settings.profiles.find((x) => x.id === settings.activeProfileId);
  if (!rawProfile) return;
  const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
  await reassertChatBinding(p.chatId, userId).catch(() => {});
  await maybeRunPipeline(p.chatId, profile, settings, userId).catch((err) => {
    warn(`pipeline failed: ${describeError(err)}`);
  });
  await maybeRunCodex(p.chatId, profile, settings, userId).catch((err) => {
    warn(`codex run failed: ${describeError(err)}`);
  });
});

spindle.on("CHAT_SWITCHED", async (payload: unknown, hostUserId?: string) => {
  const p = payload as { chatId?: string | null };
  const userId = hostUserId ?? resolveUserId(p?.chatId ?? null);
  if (!userId) return;
  if (p?.chatId) rememberChatUser(p.chatId, userId);
  invalidateConnectionsCache(userId);
  await pushState(userId, p?.chatId ?? null);
});

spindle.on("MESSAGE_DELETED", async (payload: unknown, hostUserId?: string) => {
  const p = payload as { chatId?: string };
  if (!p?.chatId) return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId) return;
  rememberChatUser(p.chatId, userId);
  invalidateBookCache(userId, p.chatId);
  await pushState(userId, p.chatId);
});

spindle.on("WORLD_BOOK_ENTRY_DELETED", async (payload: unknown, hostUserId?: string) => {
  if (!hostUserId) return;
  const p = payload as { worldBookId?: string };
  if (!p?.worldBookId) return;
  await handleExternalEntryDeletion(hostUserId, p.worldBookId, false);
});

spindle.on("WORLD_BOOK_DELETED", async (payload: unknown, hostUserId?: string) => {
  if (!hostUserId) return;
  const p = payload as { id?: string };
  if (!p?.id) return;
  await handleExternalEntryDeletion(hostUserId, p.id, true);
});

spindle.on("REGEX_SCRIPT_CHANGED", (_payload: unknown, hostUserId?: string) => {
  if (hostUserId) invalidateRegexCache(hostUserId);
});
spindle.on("REGEX_SCRIPT_DELETED", (_payload: unknown, hostUserId?: string) => {
  if (hostUserId) invalidateRegexCache(hostUserId);
});
spindle.on("CONNECTION_PROFILE_LOADED", (_payload: unknown, hostUserId?: string) => {
  if (hostUserId) invalidateConnectionsCache(hostUserId);
});
spindle.on("MAIN_API_CHANGED", (_payload: unknown, hostUserId?: string) => {
  if (hostUserId) invalidateConnectionsCache(hostUserId);
});

async function handleExternalEntryDeletion(userId: string, bookId: string, isBookDeletion: boolean): Promise<void> {
  const chatId = isBookDeletion
    ? findCachedChatIdForBook(userId, bookId)
    : await findChatIdForBook(userId, bookId).catch(() => null);
  if (!chatId) return;
  if (isBookDeletion) invalidateAllBookCacheEntriesForBook(userId, bookId);
  else invalidateBookCache(userId, chatId);
  try {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    const desiredHidden = profile ? profile.hideCoveredMessages : true;
    const { unhidden } = await resyncVisibility(chatId, userId, desiredHidden);
    if (unhidden > 0) {
      await notify(userId, "info", `Memoria unhid ${unhidden} message${unhidden === 1 ? "" : "s"} after an external lorebook change`);
    }
  } catch (err) {
    warn(`external deletion resync failed: ${describeError(err)}`);
  }
  await pushState(userId, chatId);
}

/** Delete every LumiBooks-managed entry for a chat (roots and ghosts
 * included) and let its hidden messages back into the prompt. */
async function wipeBooksEntries(chatId: string, userId: string): Promise<number> {
  const entries = await listLmbEntries(chatId, userId);
  let removed = 0;
  for (const e of entries) {
    try {
      await deleteEntry(e.raw.id, userId);
      removed++;
    } catch (err) {
      warn(`wipe books: failed to delete ${e.raw.id}: ${describeError(err)}`);
    }
  }
  invalidateBookCache(userId, chatId);
  const settings = await loadSettings(userId);
  const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
  await resyncVisibility(chatId, userId, profile ? profile.hideCoveredMessages : true).catch((err) =>
    warn(`wipe books: visibility resync failed: ${describeError(err)}`),
  );
  return removed;
}

/** Shared by the profile handlers: when the resulting active profile lacks
 * effective extra mode, pending ghosts in this chat must not strand. */
async function cleanupGhostsIfModeOff(userId: string, chatId: string, context: string): Promise<void> {
  const after = await loadSettings(userId);
  const activeProfile = after.profiles.find((p) => p.id === after.activeProfileId);
  if (!activeProfile || extraContextActive(activeProfile)) return;
  await cleanupGhostsAfterModeOff(chatId, activeProfile, userId).catch((err) =>
    warn(`${context} ghost cleanup failed: ${describeError(err)}`),
  );
}

async function collectActiveChapterIds(chatId: string, userId: string): Promise<string[]> {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  return coverage.activeEntries
    .filter((e) => e.meta.tier === 1 && !e.meta.isRoot)
    .map((e) => e.raw.id);
}

async function collectActiveArcIds(chatId: string, userId: string): Promise<string[]> {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  return coverage.activeEntries
    .filter((e) => e.meta.tier === 2 && !e.meta.isRoot)
    .map((e) => e.raw.id);
}

async function retryLastFailure(
  chatId: string,
  userId: string,
  profile: Parameters<typeof createChapterAuto>[1],
  settings: Parameters<typeof createChapterAuto>[2],
): Promise<void> {
  const last = getLastFailure(userId, chatId);
  if (last?.kind === "volume") {
    const ids = await collectActiveArcIds(chatId, userId);
    if (ids.length === 0) {
      clearLastFailure(userId, chatId);
      await notify(userId, "warn", "Memoria has no arcs left to retry the volume");
      return;
    }
    await createVolumeFromArcs(chatId, ids, profile, settings, userId);
    return;
  }
  if (last?.kind === "arc") {
    const ids = await collectActiveChapterIds(chatId, userId);
    if (ids.length === 0) {
      clearLastFailure(userId, chatId);
      const msg = "Memoria has no chapters left to retry the arc";
      await notify(userId, "warn", msg);
      return;
    }
    await createArcFromChapters(chatId, ids, profile, settings, userId);
    return;
  }
  if (extraContextActive(profile)) {
    // A failed generation in extra mode was a ghost run: retrying through the
    // real-chapter path would gate on the injection lag and silently no-op.
    const made = await drainGhostBacklog(chatId, profile, settings, userId);
    if (made === 0) {
      await notify(userId, "info", "Nothing to retry yet, Memoria will catch it after the next message");
    }
  } else {
    await createChapterAuto(chatId, profile, settings, userId);
  }
  await maybeRunArcCheck(chatId, profile, settings, userId);
}


spindle.onFrontendMessage(async (raw, userId) => {
  setLastFrontendUserId(userId);
  const msg = raw as FrontendToBackend;
  rememberChatUser(readChatIdFromMessage(msg), userId);

  try {
    await ensureUserFolders(userId);
    switch (msg.type) {
      case "ready":
      case "refresh":
        await pushState(userId, msg.chatId);
        break;

      case "save_settings":
        await patchSettings(userId, msg.patch);
        await pushState(userId, msg.chatId);
        break;

      case "save_profile": {
        const incoming = msg.profile;
        const id = typeof incoming?.id === "string" && incoming.id.trim() ? incoming.id : null;
        if (!id) {
          send({ type: "error", text: "Invalid profile payload." }, userId);
          break;
        }
        let prevHide: boolean | null = null;
        let nextHide: boolean | null = null;
        let prevExtra: boolean | null = null;
        let nextExtra: boolean | null = null;
        let activeBefore: string | null = null;
        let missing = false;
        await mutateSettings(userId, (cur) => {
          activeBefore = cur.activeProfileId;
          const existing = cur.profiles.find((p) => p.id === id);
          if (!existing) {
            missing = true;
            return cur;
          }
          const merged = normalizeProfile({ ...existing, ...incoming, id });
          if (!merged) return cur;
          prevHide = existing.hideCoveredMessages;
          nextHide = merged.hideCoveredMessages;
          prevExtra = extraContextActive(existing);
          nextExtra = extraContextActive(merged);
          return { ...cur, profiles: cur.profiles.map((p) => (p.id === id ? merged : p)) };
        });
        if (missing) {
          warn(`save_profile dropped: no profile with id "${id}"`);
          send({ type: "error", text: `Profile ${id} no longer exists.` }, userId);
          break;
        }
        if (
          prevHide !== null
          && nextHide !== null
          && prevHide !== nextHide
          && id === activeBefore
          && msg.chatId
        ) {
          try {
            const messages = await spindle.chat.getMessages(msg.chatId);
            const coverage = await buildCoverage(msg.chatId, userId);
            await syncHiddenForCoveredMessages(msg.chatId, messages, coverage, userId, nextHide);
          } catch (err) {
            warn(`hideCoveredMessages re-sync failed: ${describeError(err)}`);
          }
        }
        // The effective-mode off transition (extra toggle OR codex disable)
        // must clean up pending ghosts here too, independent of automation.
        if (prevExtra === true && nextExtra === false && id === activeBefore && msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "mode-off");
        }
        await pushState(userId, msg.chatId);
        break;
      }

      case "save_samplers": {
        await mutateSettings(userId, (cur) => {
          const idx = cur.profiles.findIndex((p) => p.id === msg.profileId);
          if (idx === -1) return cur;
          const current = cur.profiles[idx]!;
          const profiles = cur.profiles.slice();
          if (msg.target === "codex") {
            profiles[idx] = { ...current, codexSamplers: { ...current.codexSamplers, ...msg.samplers } };
          } else {
            profiles[idx] = { ...current, samplers: { ...current.samplers, ...msg.samplers } };
          }
          return { ...cur, profiles };
        });
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_profile": {
        await mutateSettings(userId, (cur) => {
          const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          const baseProfile = cur.profiles.find((p) => p.id === cur.activeProfileId) ?? cur.profiles[0]!;
          const next = { ...baseProfile, id, name: (msg.name || "New profile").slice(0, 60) };
          return { ...cur, profiles: [...cur.profiles, next], activeProfileId: id };
        });
        await pushState(userId, msg.chatId);
        break;
      }

      case "delete_profile": {
        let warned = false;
        await mutateSettings(userId, (cur) => {
          if (cur.profiles.length <= 1) {
            warned = true;
            return cur;
          }
          const profiles = cur.profiles.filter((p) => p.id !== msg.profileId);
          const activeProfileId = cur.activeProfileId === msg.profileId ? profiles[0]!.id : cur.activeProfileId;
          return { ...cur, profiles, activeProfileId };
        });
        if (warned) {
          await notify(userId, "warn", "Memoria keeps at least one profile");
        }
        // Deleting the active profile falls back to another one, which may
        // lack effective extra mode: same ghost cleanup as set_active_profile.
        if (msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-delete");
        }
        await pushState(userId, msg.chatId);
        break;
      }

      case "set_active_profile": {
        await mutateSettings(userId, (cur) => {
          if (!cur.profiles.some((p) => p.id === msg.profileId)) return cur;
          return { ...cur, activeProfileId: msg.profileId };
        });
        // Switching to a profile without effective extra mode strands any
        // pending ghosts: they belong to the chat, not the profile.
        if (msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-switch");
        }
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_chapter": {
        const cur = await loadSettings(userId);
        const rawProfile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!rawProfile) break;
        const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already filing a chapter");
          break;
        }
        const chapterMessages = await spindle.chat.getMessages(msg.chatId);
        // The gate must see the same coverage createChapterAuto will, ghosts
        // included, or the click silently no-ops without the toast below.
        const chapterCoverage = await buildCoverage(msg.chatId, userId, undefined, extraContextActive(profile));
        const chapterStats = computeCoverageStats(chapterMessages, chapterCoverage, profile);
        if (!chapterStats.lagSatisfied || !chapterStats.windowAvailable) {
          await notify(userId, "info", "Your story needs more messages for me to generate a new entry~");
          break;
        }
        await createChapterAuto(msg.chatId, profile, cur, userId);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_chapter_range": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already filing a chapter");
          break;
        }
        const rangeMessages = await spindle.chat.getMessages(msg.chatId);
        const selectedIds = new Set(msg.messageIds);
        const positions = rangeMessages
          .map((m, i) => ({ m, i }))
          .filter(({ m }) => selectedIds.has(m.id)
            && !((m as { metadata?: Record<string, unknown> }).metadata?.["lmb_excluded"] === true))
          .map(({ i }) => i);
        const runs: string[][] = [];
        let prev = -2;
        for (const pos of positions) {
          if (pos === prev + 1) runs[runs.length - 1]!.push(rangeMessages[pos]!.id);
          else runs.push([rangeMessages[pos]!.id]);
          prev = pos;
        }
        for (const run of runs) {
          await createChapterFromRange(msg.chatId, run, profile, cur, userId);
        }
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_all_chapters": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already filing a chapter");
          break;
        }
        await drainChapterBacklog(msg.chatId, profile, cur, userId);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_arc": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already binding an arc");
          break;
        }
        const ids = await collectActiveChapterIds(msg.chatId, userId);
        await createArcFromChapters(msg.chatId, ids, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_arc_from": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already binding an arc");
          break;
        }
        await createArcFromChapters(msg.chatId, msg.chapterEntryIds, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_all_arcs": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already binding an arc");
          break;
        }
        await drainArcBacklog(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "create_volume_from": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (getBusy(userId).some((b) => b.kind === "volume" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already pressing a volume");
          break;
        }
        await createVolumeFromArcs(msg.chatId, msg.arcEntryIds, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "retry_last_failure": {
        const cur = await loadSettings(userId);
        const rawProfile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!rawProfile) break;
        const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
        await retryLastFailure(msg.chatId, userId, profile, cur);
        await pushState(userId, msg.chatId);
        break;
      }

      case "delete_entry": {
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        // Free the tier below only when the removed entry was itself active.
        // Deleting an arc that sits inside a volume must not reactivate its
        // chapters - the volume still covers them.
        if (
          entry
          && entry.meta.tier !== 1
          && !entry.meta.supersededByEntryId
          && Array.isArray(entry.meta.sourceChapterEntryIds)
        ) {
          const sourceIds = new Set(entry.meta.sourceChapterEntryIds);
          for (const src of entries) {
            if (!sourceIds.has(src.raw.id)) continue;
            if (src.meta.supersededByEntryId !== msg.entryId) continue;
            try {
              await patchEntryMeta(src, { supersededByEntryId: null }, userId);
            } catch (err) {
              warn(`failed to clear supersededByEntryId on entry ${src.raw.id}: ${describeError(err)}`);
            }
          }
        }
        // A deleted ghost's span gets refilled by the next drain: keep its
        // ordinal so the refill doesn't jump to max+1 mid-list.
        if (entry?.meta.ghost && typeof entry.meta.sceneNumber === "number") {
          recordFreedGhostNumber(userId, msg.chatId, entry.meta.msgIds, entry.meta.sceneNumber);
        }
        await deleteEntry(msg.entryId, userId);
        invalidateBookCache(userId, msg.chatId);
        if (entry) {
          const remaining = entries.filter((e) => e.raw.id !== msg.entryId);
          const newCoverage = await buildCoverage(msg.chatId, userId, remaining);
          const toUnhide = entry.meta.msgIds.filter((id) => !newCoverage.coveredBy.has(id));
          if (toUnhide.length > 0) {
            await unhideCoveredMessages(msg.chatId, toUnhide, userId).catch(() => {});
          }
        }
        await pushState(userId, msg.chatId);
        break;
      }

      case "release_entry": {
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        if (!entry) {
          await notify(userId, "warn", "Memoria can't find that entry to release");
          break;
        }
        if (entry.meta.ghost) {
          await notify(userId, "warn", "Memoria can't release a ghost chapter before it's shelved");
          break;
        }
        if (
          entry.meta.tier !== 1
          && !entry.meta.supersededByEntryId
          && Array.isArray(entry.meta.sourceChapterEntryIds)
        ) {
          const sourceIds = new Set(entry.meta.sourceChapterEntryIds);
          for (const src of entries) {
            if (!sourceIds.has(src.raw.id)) continue;
            if (src.meta.supersededByEntryId !== msg.entryId) continue;
            try {
              await patchEntryMeta(src, { supersededByEntryId: null }, userId);
            } catch (err) {
              warn(`failed to clear supersededByEntryId on entry ${src.raw.id}: ${describeError(err)}`);
            }
          }
        }
        await releaseEntry(entry, userId);
        invalidateBookCache(userId, msg.chatId);
        const remaining = entries.filter((e) => e.raw.id !== msg.entryId);
        const newCoverage = await buildCoverage(msg.chatId, userId, remaining);
        const toUnhide = entry.meta.msgIds.filter((id) => !newCoverage.coveredBy.has(id));
        if (toUnhide.length > 0) {
          await unhideCoveredMessages(msg.chatId, toUnhide, userId).catch(() => {});
        }
        await notify(userId, "success", "Memoria released the entry to your lorebook");
        await pushState(userId, msg.chatId);
        break;
      }

      case "regenerate_entry": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        if (!entry) {
          await notify(userId, "warn", "Memoria can't find that entry to regenerate");
          break;
        }
        const tier = entry.meta.tier;
        const busyKind = tier === 3 ? "volume" : tier === 2 ? "arc" : "chapter";
        if (getBusy(userId).some((b) => b.kind === busyKind && b.chatId === msg.chatId)) {
          await notify(userId, "warn", `Memoria is already busy with a ${busyKind}`);
          break;
        }
        if (entry.meta.isRoot && tier === 1) {
          await notify(userId, "warn", "Memoria can't regenerate inherited chapters");
          break;
        }
        if (entry.meta.ghost) {
          await notify(userId, "warn", "Memoria can't regenerate a ghost chapter before it's shelved");
          break;
        }
        const isArc = tier === 2;
        const isVolume = tier === 3;
        const msgIds = entry.meta.msgIds.slice();
        const sourceIds = Array.isArray(entry.meta.sourceChapterEntryIds)
          ? entry.meta.sourceChapterEntryIds.slice()
          : [];
        if (isVolume && sourceIds.length === 0) {
          await notify(userId, "warn", "Memoria has no arc sources to regenerate this volume from");
          break;
        }
        if (isArc && sourceIds.length === 0) {
          await notify(userId, "warn", "Memoria has no chapter sources to regenerate this arc from");
          break;
        }
        if (!isArc && !isVolume && msgIds.length === 0) {
          await notify(userId, "warn", "Memoria has no messages to regenerate this chapter from");
          break;
        }
        if (!isArc && !isVolume) {
          const otherEntries = entries.filter((e) => e.raw.id !== msg.entryId);
          const otherCoverage = await buildCoverage(msg.chatId, userId, otherEntries);
          const blockingIds = entry.meta.msgIds.filter((id) => otherCoverage.coveredBy.has(id));
          if (blockingIds.length > 0) {
            const blockerEntryId = otherCoverage.coveredBy.get(blockingIds[0]!);
            const blocker = otherEntries.find((e) => e.raw.id === blockerEntryId);
            const blockerLabel = blocker?.meta.tier === 3 ? "a volume" : blocker?.meta.tier === 2 ? "an arc" : "another entry";
            await notify(userId, "warn", `These messages are bound into ${blockerLabel}, release or delete it first`);
            break;
          }
        }
        if (isVolume) {
          await createVolumeFromArcs(msg.chatId, sourceIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        } else if (isArc) {
          await createArcFromChapters(msg.chatId, sourceIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        } else {
          await createChapterFromRange(msg.chatId, msgIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        }
        await pushState(userId, msg.chatId);
        break;
      }

      case "update_entry": {
        await updateEntry(msg.entryId, msg.patch, userId);
        invalidateBookCache(userId, msg.chatId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "resync_hidden": {
        const messages = await spindle.chat.getMessages(msg.chatId);
        const coverage = await buildCoverage(msg.chatId, userId);
        await syncHiddenForCoveredMessages(msg.chatId, messages, coverage, userId, true);
        await pushState(userId, msg.chatId);
        break;
      }

      case "dry_run_chapter": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        try {
          const result = await dryRunChapter(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "chapter", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_chapter failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }

      case "dry_run_arc": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        try {
          const result = await dryRunArc(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "arc", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_arc failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }

      case "dry_run_volume": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        try {
          const result = await dryRunVolume(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "volume", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_volume failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }

      case "dry_run_codex": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        try {
          const result = await dryRunCodex(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "codex", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_codex failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }

      case "abort_busy": {
        const aborted = abortBusy(userId, msg.chatId, msg.kind);
        if (!aborted) {
          await notify(userId, "warn", "Memoria is not in the middle of anything to abort");
        }
        break;
      }

      case "watch_stream": {
        setStreamWatcher(userId, msg.chatId, msg.kind, msg.on);
        break;
      }

      case "set_force_constant": {
        await patchSettings(userId, { forceConstantEntries: msg.value });
        const updated = await applyConstantToAllLmbEntries(userId, msg.value).catch((err) => {
          warn(`applyConstantToAllLmbEntries failed: ${describeError(err)}`);
          return 0;
        });
        const text = updated === 0
          ? `Future entries will be ${msg.value ? "constant" : "keyword-triggered"}`
          : `Memoria flipped ${updated} entr${updated === 1 ? "y" : "ies"} to ${msg.value ? "constant" : "keyword-triggered"}`;
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }

      case "resync_visibility": {
        const settings = await loadSettings(userId);
        const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
        const desiredHidden = profile ? profile.hideCoveredMessages : true;
        const { unhidden, hidden } = await resyncVisibility(msg.chatId, userId, desiredHidden);
        const total = unhidden + hidden;
        const text = total === 0
          ? "Memoria's shelf is already aligned, nya"
          : `Memoria resynced ${total} message${total === 1 ? "" : "s"} (${hidden} hidden, ${unhidden} unhidden)`;
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }

      case "ensure_book": {
        await ensureBookForChat(msg.chatId, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "import_preset": {
        const parsed = parseStmbPresetExport(msg.raw, msg.category);
        if (parsed.length === 0) {
          await notify(userId, "warn", "Memoria found no usable presets in that file");
          break;
        }
        await mutateSettings(userId, (cur) => {
          const merged = [...cur.customPresets];
          for (const p of parsed) {
            const existing = merged.findIndex((c) => c.key === p.key && c.category === msg.category);
            const record = { ...p, category: msg.category, createdAt: Date.now() };
            if (existing >= 0) merged[existing] = record;
            else merged.push(record);
          }
          return { ...cur, customPresets: merged };
        });
        await notify(userId, "success", `Memoria imported ${parsed.length} preset${parsed.length === 1 ? "" : "s"}`);
        await pushState(userId, msg.chatId);
        break;
      }

      case "save_custom_preset": {
        const next = normalizeCustomPreset(msg.preset);
        if (!next) {
          send({ type: "error", text: "Invalid preset payload." }, userId);
          break;
        }
        await mutateSettings(userId, (cur) => {
          const idx = cur.customPresets.findIndex((p) => p.key === next.key && p.category === next.category);
          const list = cur.customPresets.slice();
          if (idx >= 0) list[idx] = next; else list.push(next);
          return { ...cur, customPresets: list };
        });
        await pushState(userId, msg.chatId);
        break;
      }

      case "delete_custom_preset": {
        const fallbackChapter = "summary";
        const fallbackArc = "arc_default";
        const fallbackVolume = "volume_default";
        const fallbackCodex = "codex_default";
        await mutateSettings(userId, (cur) => {
          const list = cur.customPresets.filter((p) => !(p.key === msg.key && p.category === msg.category));
          const profiles = cur.profiles.map((p) => {
            if (msg.category === "chapter" && p.chapterPresetKey === msg.key) {
              return { ...p, chapterPresetKey: fallbackChapter };
            }
            if (msg.category === "arc" && p.arcPresetKey === msg.key) {
              return { ...p, arcPresetKey: fallbackArc };
            }
            if (msg.category === "volume" && p.volumePresetKey === msg.key) {
              return { ...p, volumePresetKey: fallbackVolume };
            }
            if (msg.category === "codex" && p.codexPresetKey === msg.key) {
              return { ...p, codexPresetKey: fallbackCodex };
            }
            return p;
          });
          return { ...cur, customPresets: list, profiles };
        });
        await pushState(userId, msg.chatId);
        break;
      }

      case "accept_preview": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        await acceptPreview(msg.chatId, msg.draftId, profile, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "discard_preview": {
        dropPendingPreview(userId, msg.chatId, msg.draftId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "edit_preview": {
        patchPendingPreview(userId, msg.chatId, msg.draftId, msg.patch);
        break;
      }

      case "rebase_root": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const result = await rebaseRoot(msg.chatId, msg.sourceChatId, userId);
        if (!result.ok) {
          const text = result.reason === "has_own"
            ? "This chat already has memories, use Rebuild instead"
            : result.reason === "empty_source"
              ? "That chat has no memories to inherit"
              : result.reason === "busy"
                ? "Memoria is already rebasing this chat"
                : "Memoria can't rebase a chat onto itself";
          await notify(userId, "warn", text);
        } else {
          await notify(userId, "success", `Memoria seeded ${result.count} inherited memor${result.count === 1 ? "y" : "ies"} before the greeting`);
        }
        await pushState(userId, msg.chatId);
        break;
      }

      case "rebuild_root": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const result = await rebuildRoot(msg.chatId, msg.sourceChatId, userId);
        if (!result.ok) {
          const text = result.reason === "empty_source"
            ? "That chat has no memories to inherit"
            : result.reason === "busy"
              ? "Memoria is already rebuilding this chat"
              : "Memoria can't rebuild a chat onto itself";
          await notify(userId, "warn", text);
          await pushState(userId, msg.chatId);
          break;
        }
        await notify(userId, "success", `Memoria rebuilt onto ${result.count} inherited memor${result.count === 1 ? "y" : "ies"} and is re-summarizing this chat`);
        await pushState(userId, msg.chatId);
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (profile) {
          await drainChapterBacklog(msg.chatId, profile, cur, userId).catch((err) => warn(`rebuild re-summarize failed: ${describeError(err)}`));
          await maybeRunArcCheck(msg.chatId, profile, cur, userId).catch(() => {});
          await resyncVisibility(msg.chatId, userId, profile.hideCoveredMessages).catch((err) => warn(`rebuild visibility resync failed: ${describeError(err)}`));
          await pushState(userId, msg.chatId);
        }
        break;
      }

      case "set_message_excluded": {
        const ids = Array.isArray(msg.messageIds) ? msg.messageIds.filter((x): x is string => typeof x === "string") : [];
        if (ids.length === 0) break;
        const messages = await spindle.chat.getMessages(msg.chatId);
        const byId = new Map(messages.map((m) => [m.id, m] as const));
        const coveredNow = msg.excluded ? (await buildCoverage(msg.chatId, userId)).coveredBy : null;
        const hideToUnhide: string[] = [];
        for (const id of ids) {
          const m = byId.get(id);
          if (!m) continue;
          const cur = (m as { metadata?: Record<string, unknown> }).metadata;
          const next: Record<string, unknown> = cur && typeof cur === "object" ? { ...cur } : {};
          if (msg.excluded) {
            next["lmb_excluded"] = true;
            const hidden = !!(m.extra && (m.extra as Record<string, unknown>).hidden);
            if (hidden && coveredNow?.has(id)) hideToUnhide.push(id);
          } else {
            delete next["lmb_excluded"];
          }
          await spindle.chat.updateMessage(msg.chatId, id, { metadata: next, skipChunkRebuild: true }).catch((err) => {
            warn(`set_message_excluded: updateMessage failed for ${id}: ${describeError(err)}`);
          });
        }
        if (hideToUnhide.length > 0) {
          await unhideCoveredMessages(msg.chatId, hideToUnhide, userId).catch(() => {});
        }
        if (!msg.excluded) {
          const cur = await loadSettings(userId);
          const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
          if (profile?.hideCoveredMessages) {
            const fresh = await spindle.chat.getMessages(msg.chatId);
            const coverage = await buildCoverage(msg.chatId, userId);
            const idSet = new Set(ids);
            const reincluded = fresh.filter((m) => idSet.has(m.id) && coverage.coveredBy.has(m.id));
            if (reincluded.length > 0) {
              await syncHiddenForCoveredMessages(msg.chatId, reincluded, coverage, userId, true).catch(() => {});
            }
          }
        }
        await notify(userId, "info", msg.excluded
          ? `Memoria will leave ${ids.length} message${ids.length === 1 ? "" : "s"} untouched`
          : `Memoria will compress ${ids.length} message${ids.length === 1 ? "" : "s"} again`);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_update_now": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        await runCodexNow(msg.chatId, profile, userId, msg.mode ?? "slow", cur);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_read": {
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files, revision: getCodexRevision(msg.chatId) }, userId);
        break;
      }

      case "codex_write_file": {
        if (!isCodexFileKey(msg.file)) {
          send({ type: "error", text: `Unknown codex file "${msg.file}".` }, userId);
          break;
        }
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is updating the codex, save again when she finishes");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        const profileMode = profile ? profile.codexRelationsTable : true;
        // Hand-saves validate against the DISK mode so the file stays
        // consistent with its siblings. Overwriting a non-null recorded mode
        // here would cancel a pending migration and brick the old-mode files.
        const cursor = await loadCursor(msg.chatId, userId);
        const relationsTable = cursor.relationsTableMode ?? profileMode;
        let parsed: unknown;
        try {
          parsed = JSON.parse(msg.content);
        } catch (err) {
          await notify(userId, "error", `That is not valid JSON: ${describeError(err)}`);
          break;
        }
        const result = validateCodexFile(msg.file, parsed, { relationsTable });
        if (!result.ok) {
          const extra = result.errors.length > 1 ? ` (+${result.errors.length - 1} more)` : "";
          await notify(userId, "error", `Validation failed: ${result.errors[0]}${extra}`);
          break;
        }
        await saveCodexFile(msg.chatId, msg.file, result.value, userId);
        invalidateCodexInjectionCache(msg.chatId);
        // A hand-seeded codex must count as existing: injection and status key
        // off the cursor.
        await withCursorLock(msg.chatId, userId, async () => {
          const cur = await loadCursor(msg.chatId, userId);
          if (cur.relationsTableMode === null) {
            cur.relationsTableMode = relationsTable;
            await saveCursor(msg.chatId, cur, userId);
          }
        });
        if (profile) await publishCodexPool(msg.chatId, userId, profile, [msg.file], "edit");
        try {
          await syncCodexEntries(msg.chatId, userId, relationsTable);
        } catch (err) {
          warn(`codex_write_file entry sync failed: ${describeError(err)}`);
          await notify(userId, "error", `Memoria couldn't sync the codex to the lorebook: ${shortErrorText(err)}`);
        }
        const { bundle, problems } = await loadCodex(msg.chatId, userId, { relationsTable });
        if (problems.length > 0) {
          // A dangling count computed against a bundle missing corrupt siblings
          // would blame references whose targets are fine on disk. Point at the
          // real culprit instead.
          const names = problems.map((p) => `${p.file}.json`).join(", ");
          await notify(userId, "warn", `Saved, but ${names} could not be read so cross-file checks were skipped`);
        } else {
          const dangling = checkIntegrity(bundle);
          if (dangling.length > 0) {
            await notify(userId, "warn", `Saved with ${dangling.length} dangling reference${dangling.length === 1 ? "" : "s"} to fix in the other files`);
          } else {
            await notify(userId, "success", `Memoria saved ${msg.file}.json`);
          }
        }
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files, savedFile: msg.file, savedSeq: msg.seq, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_reset": {
        if (!setBusy(userId, msg.chatId, "codex", "Memoria is clearing the codex")) {
          await notify(userId, "warn", "Memoria is updating the codex, abort that first");
          break;
        }
        try {
          const failed = await deleteCodex(msg.chatId, userId);
          invalidateCodexInjectionCache(msg.chatId);
          if (failed.length > 0) {
            await notify(userId, "error", `Memoria couldn't clear ${failed.length} codex file${failed.length === 1 ? "" : "s"}, try again`);
          } else {
            publishCodexWiped(msg.chatId, userId);
            let entriesCleared = true;
            try {
              await wipeCodexEntries(msg.chatId, userId);
            } catch (err) {
              entriesCleared = false;
              warn(`codex_reset entry wipe failed: ${describeError(err)}`);
              await notify(userId, "error", `Memoria couldn't clear the codex lorebook entries: ${shortErrorText(err)}`);
            }
            if (entriesCleared) {
              await notify(userId, "info", "Memoria cleared the codex for this chat");
            }
          }
        } finally {
          clearBusy(userId, msg.chatId, "codex");
        }
        // The codex tab caches file contents; without a fresh push it keeps
        // rendering the wiped records.
        const wiped = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: wiped, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_rebuild": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is updating the codex, abort that first");
          break;
        }
        await rebuildCodex(msg.chatId, profile, userId, msg.mode ?? "slow", cur);
        const rebuilt = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: rebuilt, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_tidy": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        const files = Array.isArray(msg.files) ? msg.files.filter(isCodexFileKey) : undefined;
        await runCodexTidy(msg.chatId, profile, userId, files && files.length ? files : undefined);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_rebuild_files": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        const files = Array.isArray(msg.files) ? msg.files.filter(isCodexFileKey) : [];
        if (files.length === 0) break;
        await rebuildCodexFiles(msg.chatId, profile, userId, files);
        const rebuiltFiles = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: rebuiltFiles, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_refresh": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        await refreshCodexFiles(msg.chatId, profile, userId);
        const refreshed = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: refreshed, revision: getCodexRevision(msg.chatId) }, userId);
        await pushState(userId, msg.chatId);
        break;
      }

      case "codex_set_file_state": {
        if (!isCodexFileKey(msg.file)) {
          send({ type: "error", text: `Unknown codex file "${msg.file}".` }, userId);
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        await setCodexFileState(msg.chatId, userId, msg.file, msg.state, profile?.codexRelationsTable);
        if (profile) await publishCodexPool(msg.chatId, userId, profile, [msg.file], "states");
        await pushState(userId, msg.chatId);
        break;
      }

      case "wipe_books": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const removed = await wipeBooksEntries(msg.chatId, userId);
        await notify(userId, removed > 0 ? "success" : "info",
          removed > 0
            ? `Memoria cleared ${removed} entr${removed === 1 ? "y" : "ies"} from the shelf`
            : "The shelf is already empty");
        await pushState(userId, msg.chatId);
        break;
      }

      case "rebuild_books": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile) break;
        const removed = await wipeBooksEntries(msg.chatId, userId);
        await notify(userId, "info", `Memoria cleared ${removed} entr${removed === 1 ? "y" : "ies"} and is re-summarizing this chat`);
        await pushState(userId, msg.chatId);
        await drainChapterBacklog(msg.chatId, profile, cur, userId).catch((err) => warn(`rebuild books re-summarize failed: ${describeError(err)}`));
        await maybeRunArcCheck(msg.chatId, profile, cur, userId).catch(() => {});
        await resyncVisibility(msg.chatId, userId, profile.hideCoveredMessages).catch(() => {});
        await pushState(userId, msg.chatId);
        break;
      }

      case "detach_root": {
        const removed = await detachRoot(msg.chatId, userId);
        const text = removed === 0
          ? "This chat has no inherited memories to detach"
          : `Memoria detached ${removed} inherited memor${removed === 1 ? "y" : "ies"}`;
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }

      case "lesson_patch": {
        if (msg.course !== "books" && msg.course !== "codex") break;
        // Persist silently: a state push here would re-render over the stage.
        await patchLessonCourse(userId, msg.course, msg.patch ?? {});
        break;
      }

      case "lesson_complete": {
        if (msg.course !== "books" && msg.course !== "codex") break;
        const grade =
          msg.grade === "gilded" || msg.grade === "silver" || msg.grade === "bronze" || msg.grade === "apprentice"
            ? msg.grade
            : "apprentice";
        const wrong = typeof msg.wrong === "number" && Number.isFinite(msg.wrong) ? Math.max(0, Math.round(msg.wrong)) : 0;
        const total = typeof msg.total === "number" && Number.isFinite(msg.total) ? Math.max(0, Math.round(msg.total)) : 0;
        await completeLessonCourse(userId, msg.course, wrong, total, grade, msg.signedName ?? null, msg.answers);
        await pushState(userId, msg.chatId);
        break;
      }

      case "lesson_reset": {
        if (msg.course !== "books" && msg.course !== "codex") break;
        await resetLessonCourse(
          userId,
          msg.course,
          msg.mode === "section" ? "section" : "course",
          msg.section,
          msg.answerIds,
        );
        await pushState(userId, msg.chatId);
        break;
      }

      case "lesson_seal_skip": {
        await skipCourseSeal(userId, msg.course === "codex" ? "codex" : "books");
        await pushState(userId, msg.chatId);
        break;
      }

      default:
        debug(userId, `unknown frontend msg type`, (msg as { type?: string }).type);
    }
  } catch (err) {
    const description = describeError(err);
    error(`frontend handler failed: ${description}`);
    send({ type: "error", text: description }, userId);
  }
});

registerBookAnomalyCallback((userId, tone, text) => {
  void notify(userId, tone, text);
});

registerInjectionAnomalyCallback((userId, text) => {
  void notify(userId, "error", text);
});

registerLessonsAnomalyCallback((userId, text) => {
  void notify(userId, "error", text);
});

registerForkAnomalyCallback((userId, text) => {
  void notify(userId, "error", text);
});

registerHookEndpoints();
info("LumiBooks loaded.");

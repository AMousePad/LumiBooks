import { t as tr } from "../i18n";
declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { LMBProfile, LMBSettings } from "../shared";
import { drainCodexForCacheWindow, ensureCodexEntriesSynced, reportCodexWindowFailure } from "./codex/index";
import { syncCodexEntries } from "./codex/sync";
import { loadCursor, msgSig } from "./codex/store";
import { forkCodexPending, forkShelfPending, ensureForkAdoption } from "./fork";
import { bumpCacheEpoch } from "./hooks";
import { drainGhostBacklog, hasPromotableGhost, maybeRunArcCheck, maybeRunPipeline, promoteGhostChapters, sweepStaleGhosts } from "./pipeline";
import { describeError, warn } from "./runtime";
import { listLmbEntries } from "./world-book";

const LUMICACHE_STATUS = "lumicache.status";

export async function lumiCacheAvailable(): Promise<boolean> {
  if (!spindle.rpcPool?.read) return false;
  try {
    await spindle.rpcPool.read(LUMICACHE_STATUS);
    return true;
  } catch (err) {
    if (/not registered/i.test(describeError(err))) return false;
    throw err;
  }
}

const running = new Set<string>();

async function bindingCount(chatId: string, userId: string): Promise<number> {
  return (await listLmbEntries(chatId, userId, true)).filter((entry) => entry.meta.tier >= 2).length;
}

async function liveSummaryIds(chatId: string, userId: string): Promise<string> {
  return (await listLmbEntries(chatId, userId, true)).filter((entry) => !entry.raw.disabled).map((entry) => entry.raw.id).join();
}

/** Without the Codex, filing summaries is the only planned prompt change. */
async function runSummaryWindow(chatId: string, profile: LMBProfile, settings: LMBSettings, userId: string): Promise<void> {
  const before = await liveSummaryIds(chatId, userId);
  try {
    await maybeRunPipeline(chatId, profile, settings, userId);
  } finally {
    if (await liveSummaryIds(chatId, userId) !== before) bumpCacheEpoch(chatId);
  }
}

/** LLM work runs while nothing visible changes, then promotion and entry sync land together. */
export async function runCacheFriendlyWindow(
  chatId: string,
  profile: LMBProfile,
  settings: LMBSettings,
  userId: string,
  onToast: (tone: "warn", text: string) => void,
): Promise<void> {
  const key = `${userId}::${chatId}`;
  if (running.has(key)) return;
  running.add(key);
  try {
    if (!profile.codexEnabled) return await runSummaryWindow(chatId, profile, settings, userId);
    await ensureForkAdoption(chatId, userId);
    if (await forkShelfPending(chatId, userId) || await forkCodexPending(chatId, userId)) return;
    await ensureCodexEntriesSynced(chatId, userId, profile);
    await sweepStaleGhosts(chatId, userId);
    await drainGhostBacklog(chatId, profile, settings, userId, true);
    if (!(await hasPromotableGhost(chatId, profile, userId))) return;
    try {
      await drainCodexForCacheWindow(chatId, userId, profile);
    } catch (err) {
      warn(`cache window codex run failed: ${describeError(err)}`);
      reportCodexWindowFailure(userId, chatId, err);
      onToast("warn", tr("backend.cacheFriendly.codexMissedThisWindow"));
    }
    await promoteGhostChapters(chatId, profile, userId, true);
    await syncCodexEntries(chatId, userId, profile.codexRelationsTable);
    bumpCacheEpoch(chatId);
    const before = await bindingCount(chatId, userId);
    await maybeRunArcCheck(chatId, profile, settings, userId, true);
    if (await bindingCount(chatId, userId) !== before) bumpCacheEpoch(chatId);
  } finally {
    running.delete(key);
  }
}

/** Only text already read into a chapter or the Codex affects a future prompt. */
export async function filedMessageChanged(chatId: string, messageId: string, userId: string, deleted: boolean): Promise<boolean> {
  const cursor = await loadCursor(chatId, userId);
  const consumed = cursor.consumedSigs.find((record) => record.id === messageId);
  if (deleted) {
    if (consumed) return true;
    const entries = await listLmbEntries(chatId, userId);
    return entries.some((entry) => entry.meta.ghost !== true && entry.meta.msgIds.includes(messageId));
  }
  if (!consumed) return false;
  const live = (await spindle.chat.getMessages(chatId)).find((message) => message.id === messageId);
  return !!live && msgSig(live.role, live.content || "") !== consumed.sig;
}

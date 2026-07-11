declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { LMBProfile } from "../shared";
import type { CoverageStats } from "../types";
import { approximateTokensFromChars } from "../shared";
import { listLmbEntries, type LMBEntry } from "./world-book";

export type ChatMessage = Awaited<ReturnType<typeof spindle.chat.getMessages>>[number];
type ChatMessageDTO = ChatMessage;

export interface CoverageMap {
  coveredBy: Map<string, string>;
  activeEntries: LMBEntry[];
  volumes: LMBEntry[];
  arcs: LMBEntry[];
  chapters: LMBEntry[];
}

export async function buildCoverage(
  chatId: string,
  userId: string,
  preloadedEntries?: LMBEntry[],
  includeGhosts = false,
): Promise<CoverageMap> {
  const allEntries = preloadedEntries ?? (await listLmbEntries(chatId, userId));
  // Ghost chapters are disabled entries (never injected, never hiding), but
  // chapter *generation* must treat them as covering so their span isn't
  // summarized twice. Callers on the injection/hiding path leave includeGhosts off.
  const entries = allEntries.filter((e) => !e.raw.disabled || (includeGhosts && e.meta.ghost === true));
  const chapters = entries.filter((e) => e.meta.tier === 1);
  const arcs = entries.filter((e) => e.meta.tier === 2);
  const volumes = entries.filter((e) => e.meta.tier === 3);
  const chapterById = new Map(chapters.map((c) => [c.raw.id, c] as const));
  const arcById = new Map(arcs.map((a) => [a.raw.id, a] as const));

  const supersededArcIds = new Set<string>();
  for (const vol of volumes) {
    for (const aid of vol.meta.sourceChapterEntryIds ?? []) {
      supersededArcIds.add(aid);
    }
  }

  // All arcs supersede their chapters, including arcs that are themselves
  // superseded by a volume - those chapters stay covered by the volume.
  const supersededChapterIds = new Set<string>();
  for (const arc of arcs) {
    for (const cid of arc.meta.sourceChapterEntryIds ?? []) {
      supersededChapterIds.add(cid);
    }
  }

  const coveredBy = new Map<string, string>();

  for (const vol of volumes) {
    for (const msgId of vol.meta.msgIds) {
      if (!coveredBy.has(msgId)) coveredBy.set(msgId, vol.raw.id);
    }
    for (const aid of vol.meta.sourceChapterEntryIds ?? []) {
      const arc = arcById.get(aid);
      if (!arc) continue;
      for (const msgId of arc.meta.msgIds) {
        if (!coveredBy.has(msgId)) coveredBy.set(msgId, vol.raw.id);
      }
      for (const cid of arc.meta.sourceChapterEntryIds ?? []) {
        const ch = chapterById.get(cid);
        if (!ch) continue;
        for (const msgId of ch.meta.msgIds) {
          if (!coveredBy.has(msgId)) coveredBy.set(msgId, vol.raw.id);
        }
      }
    }
  }

  for (const arc of arcs) {
    if (supersededArcIds.has(arc.raw.id)) continue;
    for (const msgId of arc.meta.msgIds) {
      if (!coveredBy.has(msgId)) coveredBy.set(msgId, arc.raw.id);
    }
    for (const cid of arc.meta.sourceChapterEntryIds ?? []) {
      const ch = chapterById.get(cid);
      if (!ch) continue;
      for (const msgId of ch.meta.msgIds) {
        if (!coveredBy.has(msgId)) coveredBy.set(msgId, arc.raw.id);
      }
    }
  }

  for (const chapter of chapters) {
    if (supersededChapterIds.has(chapter.raw.id)) continue;
    for (const msgId of chapter.meta.msgIds) {
      if (!coveredBy.has(msgId)) coveredBy.set(msgId, chapter.raw.id);
    }
  }

  const activeEntries: LMBEntry[] = [
    ...volumes,
    ...arcs.filter((a) => !supersededArcIds.has(a.raw.id)),
    ...chapters.filter((c) => !supersededChapterIds.has(c.raw.id)),
  ];

  return { coveredBy, activeEntries, volumes, arcs, chapters };
}

export function isExcluded(m: ChatMessageDTO): boolean {
  const md = (m as { metadata?: Record<string, unknown> }).metadata;
  return !!(md && md["lmb_excluded"] === true);
}

export function isEligibleForCount(m: ChatMessageDTO, _profile: LMBProfile): boolean {
  void _profile;
  if (isExcluded(m)) return false;
  const role = (m as { role?: string }).role;
  if (role === "system" || (m as { is_system?: boolean }).is_system) return false;
  return true;
}

function countEligible(messages: ChatMessageDTO[], profile: LMBProfile): number {
  let n = 0;
  for (const m of messages) if (isEligibleForCount(m, profile)) n++;
  return n;
}

function sumEligibleTokens(messages: ChatMessageDTO[], profile: LMBProfile): number {
  let n = 0;
  for (const m of messages) {
    if (!isEligibleForCount(m, profile)) continue;
    n += approximateTokensFromChars((m.content || "").length);
  }
  return n;
}

/** The one home for eligibility-weighted size, so window math can't drift
 * between coverage stats and ghost window selection. */
export function sizeEligible(
  messages: ChatMessageDTO[],
  unit: "messages" | "tokens",
  profile: LMBProfile,
): number {
  return unit === "tokens" ? sumEligibleTokens(messages, profile) : countEligible(messages, profile);
}

export function computeCoverageStats(
  messages: ChatMessageDTO[],
  coverage: CoverageMap,
  profile: LMBProfile,
): CoverageStats {
  const totalMessages = messages.length;
  let coveredMessages = 0;
  let approxUncoveredTokens = 0;
  for (const m of messages) {
    if (coverage.coveredBy.has(m.id)) {
      coveredMessages++;
    } else {
      approxUncoveredTokens += approximateTokensFromChars((m.content || "").length);
    }
  }
  const uncoveredMessages = totalMessages - coveredMessages;
  const uncoveredTail = pickUncoveredTail(messages, coverage);

  const tailCounted = sizeEligible(uncoveredTail, profile.lagUnit, profile);
  const lagSatisfied = tailCounted >= profile.lagValue;

  const compressible = trimLagFromTail(uncoveredTail, profile);
  const headRoom = sizeEligible(compressible, profile.windowUnit, profile);
  const windowAvailable = headRoom >= profile.windowValue;

  return {
    totalMessages,
    coveredMessages,
    uncoveredMessages,
    approxUncoveredTokens,
    lagSatisfied,
    windowAvailable,
  };
}

export function countCompressibleEligible(
  messages: ChatMessageDTO[],
  coverage: CoverageMap,
  profile: LMBProfile,
): number {
  const tail = pickUncoveredTail(messages, coverage);
  const compressible = trimLagFromTail(tail, profile);
  return sizeEligible(compressible, profile.windowUnit, profile);
}

export function trimLagFromTail(uncoveredTail: ChatMessageDTO[], profile: LMBProfile): ChatMessageDTO[] {
  if (uncoveredTail.length === 0) return [];
  if (profile.lagValue <= 0) return uncoveredTail.slice();
  if (profile.lagUnit === "messages") {
    let counted = 0;
    let cutoffIdx = uncoveredTail.length;
    for (let i = uncoveredTail.length - 1; i >= 0; i--) {
      if (isEligibleForCount(uncoveredTail[i]!, profile)) {
        counted++;
        if (counted >= profile.lagValue) {
          cutoffIdx = i;
          break;
        }
      }
    }
    if (counted < profile.lagValue) return [];
    return uncoveredTail.slice(0, cutoffIdx);
  }
  let lagged = 0;
  let cutoffIdx = 0;
  for (let i = uncoveredTail.length - 1; i >= 0; i--) {
    if (isEligibleForCount(uncoveredTail[i]!, profile)) {
      lagged += approximateTokensFromChars((uncoveredTail[i]!.content || "").length);
    }
    cutoffIdx = i;
    if (lagged >= profile.lagValue) break;
  }
  if (lagged < profile.lagValue) return [];
  return uncoveredTail.slice(0, cutoffIdx);
}

export function pickUncoveredTail(messages: ChatMessageDTO[], coverage: CoverageMap): ChatMessageDTO[] {
  const out: ChatMessageDTO[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (coverage.coveredBy.has(m.id)) break;
    out.push(m);
  }
  out.reverse();
  return out;
}

export function sumApproxTokens(messages: ChatMessageDTO[]): number {
  let total = 0;
  for (const m of messages) total += approximateTokensFromChars((m.content || "").length);
  return total;
}

/**
 * An entry's live end position: the highest current index among its source
 * messages, falling back to the stored meta index when none survive. Shared by
 * ghost previous-memories and the codex story-so-far filter so the two behind-
 * the-window boundaries stay in lockstep.
 */
export function liveEndPosition(
  msgIds: string[],
  storedLastMsgIdx: number | undefined,
  posById: Map<string, number>,
): number {
  let end = -1;
  for (const id of msgIds) {
    const p = posById.get(id);
    if (typeof p === "number" && p > end) end = p;
  }
  if (end !== -1) return end;
  return typeof storedLastMsgIdx === "number" ? storedLastMsgIdx : Number.MAX_SAFE_INTEGER;
}

export function selectNextChapterWindow(
  uncoveredTail: ChatMessageDTO[],
  profile: LMBProfile,
): ChatMessageDTO[] {
  const compressible = trimLagFromTail(uncoveredTail, profile);
  if (compressible.length === 0) return [];
  if (profile.windowUnit === "messages") {
    const out: ChatMessageDTO[] = [];
    let counted = 0;
    for (const m of compressible) {
      if (isExcluded(m)) {
        if (out.length > 0) break;
        continue;
      }
      out.push(m);
      if (isEligibleForCount(m, profile)) {
        counted++;
        if (counted >= profile.windowValue) break;
      }
    }
    return out;
  }
  return takeUntilTokens(compressible, profile.windowValue, profile);
}

function takeUntilTokens(messages: ChatMessageDTO[], maxTokens: number, profile: LMBProfile): ChatMessageDTO[] {
  const out: ChatMessageDTO[] = [];
  let acc = 0;
  for (const m of messages) {
    if (isExcluded(m)) {
      if (out.length > 0) break;
      continue;
    }
    out.push(m);
    if (isEligibleForCount(m, profile)) {
      acc += approximateTokensFromChars((m.content || "").length);
    }
    if (acc >= maxTokens) break;
  }
  return out;
}

export async function syncHiddenForCoveredMessages(
  chatId: string,
  messages: ChatMessageDTO[],
  coverage: CoverageMap,
  userId: string,
  desiredHidden: boolean,
): Promise<void> {
  void userId;
  const toFlip: string[] = [];
  for (const m of messages) {
    if (isExcluded(m)) continue;
    const isCovered = coverage.coveredBy.has(m.id);
    if (!isCovered) continue;
    const currentlyHidden = !!(m.extra && (m.extra as Record<string, unknown>).hidden);
    if (desiredHidden && !currentlyHidden) toFlip.push(m.id);
    else if (!desiredHidden && currentlyHidden) toFlip.push(m.id);
  }
  if (toFlip.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < toFlip.length; i += CHUNK) {
    const slice = toFlip.slice(i, i + CHUNK);
    try {
      await spindle.chat.setMessagesHidden(chatId, slice, desiredHidden);
    } catch {
      for (const id of slice) {
        await spindle.chat.setMessageHidden(chatId, id, desiredHidden).catch(() => {});
      }
    }
  }
}

export function pickOrphanedHiddenIds(messages: ChatMessageDTO[], coverage: CoverageMap): string[] {
  const out: string[] = [];
  for (const m of messages) {
    if (isExcluded(m)) continue;
    const currentlyHidden = !!(m.extra && (m.extra as Record<string, unknown>).hidden);
    if (!currentlyHidden) continue;
    if (coverage.coveredBy.has(m.id)) continue;
    out.push(m.id);
  }
  return out;
}

export async function unhideCoveredMessages(
  chatId: string,
  msgIds: string[],
  userId: string,
): Promise<void> {
  void userId;
  if (msgIds.length === 0) return;
  const CHUNK = 500;
  for (let i = 0; i < msgIds.length; i += CHUNK) {
    const slice = msgIds.slice(i, i + CHUNK);
    try {
      await spindle.chat.setMessagesHidden(chatId, slice, false);
    } catch {
      for (const id of slice) {
        await spindle.chat.setMessageHidden(chatId, id, false).catch(() => {});
      }
    }
  }
}

export async function resyncVisibility(
  chatId: string,
  userId: string,
  desiredHiddenForCovered: boolean,
): Promise<{ unhidden: number; hidden: number }> {
  const messages = await spindle.chat.getMessages(chatId);
  const coverage = await buildCoverage(chatId, userId);
  const orphanedHidden = pickOrphanedHiddenIds(messages, coverage);
  let hiddenBefore = 0;
  let unhiddenAfter = 0;
  if (orphanedHidden.length > 0) {
    await unhideCoveredMessages(chatId, orphanedHidden, userId).catch(() => {});
    unhiddenAfter = orphanedHidden.length;
  }
  for (const m of messages) {
    if (isExcluded(m)) continue;
    if (!coverage.coveredBy.has(m.id)) continue;
    const currentlyHidden = !!(m.extra && (m.extra as Record<string, unknown>).hidden);
    if (currentlyHidden !== desiredHiddenForCovered) hiddenBefore++;
  }
  if (hiddenBefore > 0) {
    await syncHiddenForCoveredMessages(chatId, messages, coverage, userId, desiredHiddenForCovered).catch(() => {});
  }
  return { unhidden: unhiddenAfter, hidden: desiredHiddenForCovered ? hiddenBefore : 0 };
}

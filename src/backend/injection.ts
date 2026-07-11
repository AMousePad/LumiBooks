declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { InterceptorResultDTO, LlmMessageDTO } from "lumiverse-spindle-types";
import type { LMBProfile } from "../shared";
import { buildCoverage, type CoverageMap } from "./coverage";
import { getChatAttachedBookIds, listLmbEntries, type LMBEntry } from "./world-book";
import { buildCodexInjectionText } from "./codex/index";
import { describeError, error, warn } from "./runtime";

let injectionAnomalyCb: ((userId: string, text: string) => void) | null = null;

export function registerInjectionAnomalyCallback(cb: (userId: string, text: string) => void): void {
  injectionAnomalyCb = cb;
}

function isAssembledHistory(lm: LlmMessageDTO): boolean {
  return (lm as unknown as Record<string, unknown>)["__isChatHistory"] === true;
}

function sourceMessageId(lm: LlmMessageDTO): string | undefined {
  const v = (lm as unknown as Record<string, unknown>)["sourceMessageId"];
  return typeof v === "string" && v ? v : undefined;
}

function sourceIndexInChat(lm: LlmMessageDTO): number | undefined {
  const v = (lm as unknown as Record<string, unknown>)["sourceIndexInChat"];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

interface OrderedEntry {
  entry: LMBEntry;
  label: string;
  firstIdx: number;
  lastIdx: number;
  emitted: boolean;
}

function orderEntries(coverage: CoverageMap, msgIdToIdx: Map<string, number>): OrderedEntry[] {
  const ordered: OrderedEntry[] = [];
  for (const entry of coverage.activeEntries) {
    let firstIdx = Number.POSITIVE_INFINITY;
    let lastIdx = -1;
    for (const msgId of entry.meta.msgIds) {
      const idx = msgIdToIdx.get(msgId);
      if (typeof idx !== "number") continue;
      if (idx < firstIdx) firstIdx = idx;
      if (idx > lastIdx) lastIdx = idx;
    }
    const haveIdx = firstIdx !== Number.POSITIVE_INFINITY;
    const resolvedFirst = haveIdx
      ? firstIdx
      : typeof entry.meta.firstMsgIdx === "number"
        ? entry.meta.firstMsgIdx
        : 0;
    const resolvedLast = haveIdx
      ? lastIdx
      : typeof entry.meta.lastMsgIdx === "number"
        ? entry.meta.lastMsgIdx
        : resolvedFirst;
    const tierName = entry.meta.tier === 3 ? "Volume" : entry.meta.tier === 2 ? "Arc" : "Chapter";
    const label =
      entry.raw.comment ||
      (haveIdx ? `${tierName} msgs ${firstIdx + 1}-${lastIdx + 1}` : tierName);
    ordered.push({ entry, label, firstIdx: resolvedFirst, lastIdx: resolvedLast, emitted: false });
  }
  ordered.sort((a, b) => a.firstIdx - b.firstIdx);
  return ordered;
}

export async function buildInjection(
  chatId: string,
  llmMessages: LlmMessageDTO[],
  userId: string,
  profile?: LMBProfile | null,
): Promise<InterceptorResultDTO | null> {
  const codexTextPromise: Promise<string | null> = profile
    ? buildCodexInjectionText(chatId, userId, profile).catch((err) => {
        warn(`codex injection failed: ${describeError(err)}`);
        return null;
      })
    : Promise.resolve(null);

  const [activated, allEntries, attachedBookIds, codexText] = await Promise.all([
    spindle.world_books.getActivated(chatId, userId).catch(() => null),
    listLmbEntries(chatId, userId),
    getChatAttachedBookIds(chatId, userId).catch(() => null),
    codexTextPromise,
  ]);
  if (allEntries.length === 0 && !codexText) return null;

  // Coverage needs no chat messages, so compute it first and short-circuit
  // before the getMessages round-trip when there is nothing to inject: a chat
  // with entries but no active ones (all superseded/disabled) and no codex
  // returns here without paying for a message fetch on the hot path.
  let coverage: CoverageMap | null = null;
  if (allEntries.length > 0) {
    const ourBookId = allEntries[0]!.raw.world_book_id;
    // getActivated reflects only the books the host is actually scanning for this
    // chat. If our book has been unbound from chat_world_book_ids (e.g. a wholesale
    // chat-metadata write by another actor dropped it), getActivated reports none
    // of our entries - and gating on it would then silently drop every memory.
    // Trust getActivated as the activation authority when the host is clearly
    // scanning our book (it activated some of our entries, or our book is still
    // chat-attached); otherwise fall open to enabled entries (still honoring
    // user-disabled ones). Off-hot-path handlers re-assert the binding.
    const activatedIds = activated ? new Set(activated.map((a) => a.id)) : null;
    const anyOursActivated = !!activatedIds && allEntries.some((e) => activatedIds.has(e.raw.id));
    const hostScanningOurBook = anyOursActivated || (!!attachedBookIds && attachedBookIds.includes(ourBookId));
    const entriesForCoverage: LMBEntry[] = activatedIds && hostScanningOurBook
      ? allEntries.filter((e) => activatedIds.has(e.raw.id))
      : allEntries.filter((e) => !e.raw.disabled);
    coverage = await buildCoverage(chatId, userId, entriesForCoverage);
  }
  if ((!coverage || coverage.activeEntries.length === 0) && !codexText) return null;

  const historyMsgs = llmMessages.filter(isAssembledHistory);
  if (historyMsgs.length === 0) {
    // Anomalous shape: verify against the chat before shouting. A fully
    // covered chat legitimately assembles zero history.
    const chatMessages = await spindle.chat.getMessages(chatId).catch(() => null);
    const hasVisibleMessage = !!chatMessages?.some(
      (m) => !(m.extra && (m.extra as Record<string, unknown>).hidden),
    );
    if (hasVisibleMessage) {
      error(
        `injection: no "__isChatHistory" messages on ${llmMessages.length} assembled message(s) despite ` +
          `visible chat messages. Possible causes: the host clipped history to fit max context, another ` +
          `extension reshaped the prompt first, or the active preset has no chat-history block. Skipping injection.`,
      );
      injectionAnomalyCb?.(
        userId,
        "Memoria couldn't find the chat history in this prompt and skipped injecting memories",
      );
    }
    return null;
  }

  // Identity contract: the host stamps each assembled history message with
  // its source id and chat index.
  interface PlanItem { id: string; idx: number | undefined; covered: boolean }
  const plan: PlanItem[] = [];
  let missingIdx = false;
  let anyCovered = false;
  for (const m of historyMsgs) {
    const id = sourceMessageId(m);
    if (id === undefined) {
      error(
        `injection: a "__isChatHistory" message is missing sourceMessageId. Host identity contract ` +
          `looks inconsistent, skipping injection.`,
      );
      return null;
    }
    const idx = sourceIndexInChat(m);
    if (idx === undefined) missingIdx = true;
    const covered = !!coverage && coverage.coveredBy.has(id);
    if (covered) anyCovered = true;
    plan.push({ id, idx, covered });
  }

  // Fast path: nothing to drop and host-stamped indexes available, so the
  // full chat fetch (the heaviest RPC on long chats, and the main way this
  // interceptor can blow the host's time budget) is skipped. Slow path only
  // when a drop is pending (needs lmb_excluded metadata) or indexes are
  // missing - identical behavior to the original.
  let msgIdToIdx: Map<string, number>;
  if (anyCovered || missingIdx) {
    const chatMessages = await spindle.chat.getMessages(chatId).catch(() => null);
    if (!chatMessages || chatMessages.length === 0) return null;
    msgIdToIdx = new Map<string, number>();
    for (let i = 0; i < chatMessages.length; i++) msgIdToIdx.set(chatMessages[i]!.id, i);
    for (const p of plan) {
      const idx = msgIdToIdx.get(p.id);
      if (idx === undefined) {
        error(`injection: sourceMessageId "${p.id}" is not in the chat, skipping injection.`);
        return null;
      }
      p.idx = idx;
      if (p.covered) {
        const md = (chatMessages[idx] as { metadata?: Record<string, unknown> } | undefined)?.metadata;
        if (md && md["lmb_excluded"] === true) p.covered = false;
      }
    }
  } else {
    msgIdToIdx = new Map(plan.map((p) => [p.id, p.idx!] as const));
  }

  const ordered: OrderedEntry[] = coverage ? orderEntries(coverage, msgIdToIdx) : [];
  if (ordered.length === 0 && !codexText) return null;

  const out: LlmMessageDTO[] = [];
  const injectedLabels = new Map<LlmMessageDTO, string>();

  const flushAt = (index: number, beforePos: number): void => {
    const block: LlmMessageDTO[] = [];
    for (const o of ordered) {
      if (o.emitted || o.lastIdx >= beforePos) continue;
      o.emitted = true;
      const msg: LlmMessageDTO = { role: "assistant", content: formatEntryForInjection(o.entry) };
      injectedLabels.set(msg, o.label);
      block.push(msg);
    }
    if (block.length) out.splice(index, 0, ...block);
  };

  let hp = 0;
  let histEnd = -1;
  let firstHistOutIdx = -1;
  for (const lm of llmMessages) {
    if (!isAssembledHistory(lm)) {
      out.push(lm);
      continue;
    }
    if (firstHistOutIdx === -1) firstHistOutIdx = out.length;
    const p = plan[hp++]!;
    flushAt(out.length, p.idx!);
    if (!p.covered) out.push(lm);
    histEnd = out.length;
  }

  flushAt(histEnd < 0 ? out.length : histEnd, Number.POSITIVE_INFINITY);

  // The codex is global state, so it rides ahead of the earliest history
  // message and every chapter/arc/volume block.
  if (codexText) {
    const codexMsg: LlmMessageDTO = { role: "assistant", content: codexText };
    const at = firstHistOutIdx >= 0 ? firstHistOutIdx : out.length;
    out.splice(at, 0, codexMsg);
    injectedLabels.set(codexMsg, "Knowledge Codex");
  }

  if (injectedLabels.size === 0) return null;

  const breakdown: NonNullable<InterceptorResultDTO["breakdown"]> = [];
  for (let i = 0; i < out.length; i++) {
    const label = injectedLabels.get(out[i]!);
    if (label !== undefined) breakdown.push({ messageIndex: i, name: label });
  }

  return { messages: out, breakdown };
}

function formatEntryForInjection(entry: LMBEntry): string {
  return entry.raw.content;
}

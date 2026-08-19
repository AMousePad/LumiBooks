declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { InterceptorResultDTO, LlmMessageDTO } from "lumiverse-spindle-types";
import { buildCoverage, type CoverageMap } from "./coverage";
import { getChatAttachedBookIds, listLmbEntries, type LMBEntry } from "./world-book";
import { describeError, error } from "./runtime";

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

function sourceMessageMetadata(lm: LlmMessageDTO): Record<string, unknown> | undefined {
  const record = lm as unknown as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, "sourceMessageMetadata")) return undefined;
  const value = record["sourceMessageMetadata"];
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export interface InjectionContext {
  capturedWorldInfo?: readonly { id: string }[];
  worldInfoActivationCapture: boolean;
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

/** Headroom under the manifest's 300s interceptor budget. */
const LEGACY_ACTIVATION_WAIT_MS = 240_000;
type ActivatedEntries = Awaited<ReturnType<typeof spindle.world_books.getActivated>>;
const legacyActivationInflight = new Map<string, Promise<ActivatedEntries | null>>();

async function getLegacyActivated(
  chatId: string,
  userId: string,
): Promise<ActivatedEntries | null> {
  const key = `${userId}:${chatId}`;
  let pending = legacyActivationInflight.get(key);
  if (!pending) {
    const raw = spindle.world_books.getActivated(chatId, userId).catch(() => null);
    pending = new Promise((resolve) => {
      const timer = setTimeout(
        () => {
          // Drop the cached promise too, or a hung call pins this chat to null.
          if (legacyActivationInflight.get(key) === pending) {
            legacyActivationInflight.delete(key);
          }
          resolve(null);
        },
        LEGACY_ACTIVATION_WAIT_MS,
      );
      void raw.then((value) => {
        clearTimeout(timer);
        resolve(value);
        if (legacyActivationInflight.get(key) === pending) {
          legacyActivationInflight.delete(key);
        }
      });
    });
    legacyActivationInflight.set(key, pending);
  }
  return await pending;
}

export async function buildInjection(
  chatId: string,
  llmMessages: LlmMessageDTO[],
  userId: string,
  context: InjectionContext = { worldInfoActivationCapture: false },
): Promise<InterceptorResultDTO | null> {
  let activated: Awaited<ReturnType<typeof spindle.world_books.getActivated>> | null = null;
  let attachedBookIds: string[] | null = null;
  let allEntries: LMBEntry[];
  if (
    context.capturedWorldInfo === undefined &&
    !context.worldInfoActivationCapture
  ) {
    [activated, allEntries, attachedBookIds] = await Promise.all([
      getLegacyActivated(chatId, userId),
      listLmbEntries(chatId, userId),
      getChatAttachedBookIds(chatId, userId).catch(() => null),
    ]);
  } else {
    allEntries = await listLmbEntries(chatId, userId);
  }
  if (allEntries.length === 0) return null;

  let entriesForCoverage: LMBEntry[];
  if (context.capturedWorldInfo !== undefined) {
    const capturedIds = new Set(context.capturedWorldInfo.map((entry) => entry.id));
    entriesForCoverage = allEntries.filter((entry) => capturedIds.has(entry.raw.id));
  } else if (context.worldInfoActivationCapture) {
    entriesForCoverage = allEntries.filter((entry) => !entry.raw.disabled);
  } else {
    const ourBookId = allEntries[0]!.raw.world_book_id;
    const activatedIds = activated ? new Set(activated.map((a) => a.id)) : null;
    const anyOursActivated = !!activatedIds && allEntries.some((e) => activatedIds.has(e.raw.id));
    const hostScanningOurBook = anyOursActivated || (!!attachedBookIds && attachedBookIds.includes(ourBookId));
    entriesForCoverage = activatedIds && hostScanningOurBook
      ? allEntries.filter((e) => activatedIds.has(e.raw.id))
      : allEntries.filter((e) => !e.raw.disabled);
  }
  const coverage: CoverageMap = await buildCoverage(chatId, userId, entriesForCoverage);
  if (coverage.activeEntries.length === 0) return null;

  const historyMsgs = llmMessages.filter(isAssembledHistory);
  if (historyMsgs.length === 0) {
    if (context.capturedWorldInfo !== undefined) return null;
    // Anomalous shape: verify against the chat before shouting. A fully
    // covered chat legitimately assembles zero history.
    let chatMessages: Awaited<ReturnType<typeof spindle.chat.getMessages>> | null = null;
    try {
      chatMessages = await spindle.chat.getMessages(chatId);
    } catch (err) {
      error(`injection: getMessages failed while verifying an empty history, skipping injection: ${describeError(err)}`);
      injectionAnomalyCb?.(userId, "Memoria couldn't read the chat and skipped injecting memories this turn");
      return null;
    }
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
  interface PlanItem {
    id: string;
    idx: number | undefined;
    covered: boolean;
    metadata: Record<string, unknown> | undefined;
  }
  const plan: PlanItem[] = [];
  let missingIdx = false;
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
    plan.push({
      id,
      idx,
      covered: coverage.coveredBy.has(id),
      metadata: sourceMessageMetadata(m),
    });
  }

  let msgIdToIdx: Map<string, number>;
  const needsMetadata = plan.some((item) => item.covered && item.metadata === undefined);
  if (missingIdx || needsMetadata) {
    let chatMessages: Awaited<ReturnType<typeof spindle.chat.getMessages>>;
    try {
      chatMessages = await spindle.chat.getMessages(chatId);
    } catch (err) {
      error(`injection: getMessages failed on the slow path, skipping injection: ${describeError(err)}`);
      injectionAnomalyCb?.(userId, "Memoria couldn't read the chat and skipped injecting memories this turn");
      return null;
    }
    if (chatMessages.length === 0) return null;
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
        p.metadata =
          (chatMessages[idx] as { metadata?: Record<string, unknown> } | undefined)?.metadata ??
          {};
      }
    }
  } else {
    msgIdToIdx = new Map(plan.map((p) => [p.id, p.idx!] as const));
  }
  for (const item of plan) {
    if (item.covered && item.metadata?.["lmb_excluded"] === true) {
      item.covered = false;
    }
  }

  const ordered: OrderedEntry[] = orderEntries(coverage, msgIdToIdx);
  if (ordered.length === 0) return null;

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
  for (const lm of llmMessages) {
    if (!isAssembledHistory(lm)) {
      out.push(lm);
      continue;
    }
    const p = plan[hp++]!;
    flushAt(out.length, p.idx!);
    if (!p.covered) out.push(lm);
    histEnd = out.length;
  }

  flushAt(histEnd < 0 ? out.length : histEnd, Number.POSITIVE_INFINITY);

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

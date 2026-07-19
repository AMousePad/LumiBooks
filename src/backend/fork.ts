declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import { bookNameFor } from "../shared";
import {
  codexBookChatTag,
  findBookForChat,
  invalidateBookCache,
  listLmbEntries,
  unbindBookFromChat,
  withChatMetaLock,
} from "./world-book";
import { copyLmbEntries, type CopyTransform } from "./book-copy";
import { codexPresence, inheritCodex } from "./codex/store";
import { syncCodexEntries } from "./codex/sync";
import { getBusy, shortErrorText } from "./pipeline";
import { loadSettings } from "./storage";
import { resyncVisibility } from "./coverage";
import { describeError, info, warn } from "./runtime";


const FORK_ADOPTED_FLAG = "lumibooks_fork_adopted";
const CODEX_ADOPTED_FLAG = "lumibooks_codex_fork_adopted";
const MAX_ANCESTRY_HOPS = 100;

const checked = new Set<string>();
const inflight = new Map<string, Promise<void>>();
const retryAt = new Map<string, number>();
const RETRY_BACKOFF_MS = 30_000;

let forkAnomalyCb: ((userId: string, text: string) => void) | null = null;
export function registerForkAnomalyCallback(cb: (userId: string, text: string) => void): void {
  forkAnomalyCb = cb;
}

function key(userId: string, chatId: string): string {
  return `${userId}::${chatId}`;
}

export async function ensureForkAdoption(chatId: string, userId: string): Promise<void> {
  const k = key(userId, chatId);
  if (checked.has(k)) return;
  const nextTry = retryAt.get(k);
  if (nextTry && Date.now() < nextTry) return;
  const existing = inflight.get(k);
  if (existing) return existing;
  const p = (async () => {
    try {
      // Only a fully settled adoption stops the retries.
      const settled = await doForkAdoption(chatId, userId);
      if (settled) {
        if (checked.size > 5000) checked.clear();
        checked.add(k);
        retryAt.delete(k);
      } else {
        if (retryAt.size > 1000) retryAt.clear();
        retryAt.set(k, Date.now() + RETRY_BACKOFF_MS);
      }
    } catch (err) {
      if (retryAt.size > 1000) retryAt.clear();
      retryAt.set(k, Date.now() + RETRY_BACKOFF_MS);
      warn(`fork adoption failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    } finally {
      inflight.delete(k);
    }
  })();
  inflight.set(k, p);
  return p;
}

/** Chapter creation holds off while a fork's shelf adoption is unsettled:
 * a self-made book would satisfy the owned check and shadow the inheritance
 * forever. */
export async function forkShelfPending(chatId: string, userId: string): Promise<boolean> {
  if (checked.has(key(userId, chatId))) return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object"
    ? (chat.metadata as Record<string, unknown>)
    : null;
  if (!md || typeof md["branched_from"] !== "string") return false;
  const flag = md[FORK_ADOPTED_FLAG];
  if (flag === chatId) return false;
  if (flag === true) {
    return (await findBookForChat(chatId, userId).catch(() => null)) === null;
  }
  return true;
}

export async function forkCodexPending(chatId: string, userId: string): Promise<boolean> {
  if (checked.has(key(userId, chatId))) return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object"
    ? (chat.metadata as Record<string, unknown>)
    : null;
  if (!md || typeof md["branched_from"] !== "string") return false;
  const flag = md[CODEX_ADOPTED_FLAG];
  if (flag === chatId) return false;
  // Legacy boolean flags predate id-stamping; only this chat's own codex
  // corroborates one, since the host fork copies the parent's flags.
  if (flag === true) {
    return (await codexPresence(chatId, userId).catch(() => "absent" as const)) !== "present";
  }
  return true;
}

async function doForkAdoption(forkChatId: string, userId: string): Promise<boolean> {
  const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
  if (!chat) return false;
  const meta = chat.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : null;
  const branchedFrom = meta && typeof meta["branched_from"] === "string" ? (meta["branched_from"] as string) : null;
  if (!branchedFrom) return true;

  let shelfSettled = true;
  // The host fork copies the parent's metadata wholesale, adoption flags
  // included, so only this chat's own id proves the shelf was adopted HERE.
  // Anything else (legacy true, parent's id) falls through to the owned check.
  if (meta?.[FORK_ADOPTED_FLAG] !== forkChatId) {
    const owned = await findBookForChat(forkChatId, userId).catch(() => null);
    if (!owned) {
      const ancestor = await findAncestorBook(branchedFrom, userId);
      if (ancestor === "fault") {
        // A transient fault must not stamp "no ancestor" permanently.
        shelfSettled = false;
      } else if (ancestor) {
        try {
          await cloneShelfForFork(forkChatId, chat.name ?? null, ancestor.chatId, userId);
        } catch (err) {
          shelfSettled = false;
          warn(`fork shelf adoption failed for ${forkChatId.slice(0, 8)}: ${describeError(err)}`);
          forkAnomalyCb?.(userId, `Memoria couldn't carry the shelf into this fork and will retry: ${shortErrorText(err)}`);
        }
      } else {
        await markShelfAdopted(forkChatId, userId).catch(() => {});
      }
    } else {
      await markShelfAdopted(forkChatId, userId).catch(() => {});
    }
  }

  // Independent of the shelf: a parent can have a codex without a single chapter.
  const codexSettled = await adoptForkCodex(forkChatId, branchedFrom, userId);
  return shelfSettled && codexSettled;
}

/** Unbind inherited codex books, inherit the nearest ancestor's codex, and
 * mirror it. Returns false to request a retry. */
async function adoptForkCodex(forkChatId: string, branchedFrom: string, userId: string): Promise<boolean> {
  try {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat) return false;
    const md = chat.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : null;
    const flag = md?.[CODEX_ADOPTED_FLAG];
    if (flag === forkChatId) return true;
    if (flag === true && (await codexPresence(forkChatId, userId)) === "present") {
      // Legacy boolean corroborated by this chat's own codex: stamp it so
      // the ambiguity never re-checks.
      await markCodexAdopted(forkChatId, userId);
      return true;
    }

    // The branch copied the parent's book attachments.
    const attached = Array.isArray(md?.["chat_world_book_ids"])
      ? (md!["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    for (const bookId of attached) {
      const book = await spindle.world_books.get(bookId, userId);
      if (!book) continue;
      const tag = codexBookChatTag(book);
      if (tag && tag !== forkChatId) {
        await unbindBookFromChat(forkChatId, bookId, userId);
      }
    }

    let ancestorChatId: string | null = null;
    {
      const seen = new Set<string>();
      let cur: string | null = branchedFrom;
      let hops = 0;
      while (cur && hops < MAX_ANCESTRY_HOPS) {
        const cid: string = cur;
        if (seen.has(cid)) break;
        seen.add(cid);
        hops++;
        if ((await codexPresence(cid, userId)) === "present") {
          ancestorChatId = cid;
          break;
        }
        const ancChat = await spindle.chats.get(cid, userId).catch(() => null);
        const ancMeta = ancChat && ancChat.metadata && typeof ancChat.metadata === "object"
          ? (ancChat.metadata as Record<string, unknown>)
          : null;
        cur = ancMeta && typeof ancMeta["branched_from"] === "string" ? (ancMeta["branched_from"] as string) : null;
      }
    }
    if (!ancestorChatId) {
      await markCodexAdopted(forkChatId, userId);
      return true;
    }

    // Copying mid-commit would mix pre- and post-run files.
    if (getBusy(userId).some((b) => b.kind === "codex" && (b.chatId === ancestorChatId || b.chatId === forkChatId))) {
      return false;
    }

    const [forkMsgs, ancMsgs] = await Promise.all([
      spindle.chat.getMessages(forkChatId),
      spindle.chat.getMessages(ancestorChatId),
    ]);
    const ancIdxById = new Map<string, number>();
    for (const m of ancMsgs) ancIdxById.set(m.id, m.index_in_chat);
    const forkIdByIdx = new Map<number, string>();
    for (const m of forkMsgs) {
      if (forkIdByIdx.has(m.index_in_chat)) {
        warn(`fork codex adoption: duplicate index_in_chat ${m.index_in_chat} in fork ${forkChatId.slice(0, 8)}; remap may be imprecise`);
        continue;
      }
      forkIdByIdx.set(m.index_in_chat, m.id);
    }
    const remapToFork = (ancestorMsgId: string): string | null => {
      const idx = ancIdxById.get(ancestorMsgId);
      if (idx === undefined) return null;
      return forkIdByIdx.get(idx) ?? null;
    };
    let forkTip: string | null = null;
    let tipIdx = -1;
    for (const m of forkMsgs) {
      if (m.index_in_chat > tipIdx) { tipIdx = m.index_in_chat; forkTip = m.id; }
    }
    const inherited = await inheritCodex(ancestorChatId, forkChatId, userId, remapToFork, forkTip);
    // Sync runs whether or not this attempt inherited: a prior attempt may
    // have inherited files and then failed exactly here.
    await syncCodexEntries(forkChatId, userId);
    if (inherited) {
      info(`fork adoption: inherited codex from ${ancestorChatId.slice(0, 8)} into ${forkChatId.slice(0, 8)}`);
    }
    await markCodexAdopted(forkChatId, userId);
    return true;
  } catch (err) {
    warn(`fork codex adoption failed for ${forkChatId.slice(0, 8)}: ${describeError(err)}`);
    forkAnomalyCb?.(userId, `Memoria couldn't carry the codex into this fork and will retry: ${shortErrorText(err)}`);
    return false;
  }
}

async function markShelfAdopted(forkChatId: string, userId: string): Promise<void> {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat) return;
    const md = chat.metadata && typeof chat.metadata === "object"
      ? { ...(chat.metadata as Record<string, unknown>) }
      : {};
    if (md[FORK_ADOPTED_FLAG] === forkChatId) return;
    md[FORK_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata: md }, userId);
  });
}

async function markCodexAdopted(forkChatId: string, userId: string): Promise<void> {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat) throw new Error("fork chat vanished while recording codex adoption");
    const md = chat.metadata && typeof chat.metadata === "object"
      ? { ...(chat.metadata as Record<string, unknown>) }
      : {};
    if (md[CODEX_ADOPTED_FLAG] === forkChatId) return;
    md[CODEX_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata: md }, userId);
  });
}

/** "fault" means a hop failed and the answer is unknowable right now; the
 * caller must retry rather than record "no ancestor". */
async function findAncestorBook(
  startChatId: string,
  userId: string,
): Promise<{ chatId: string; bookId: string } | "fault" | null> {
  const seen = new Set<string>();
  let cur: string | null = startChatId;
  let hops = 0;
  while (cur && hops < MAX_ANCESTRY_HOPS) {
    const chatId: string = cur;
    if (seen.has(chatId)) break;
    seen.add(chatId);
    hops++;
    let bookId: string | null;
    try {
      bookId = await findBookForChat(chatId, userId);
    } catch {
      return "fault";
    }
    if (bookId) return { chatId, bookId };
    let chat: Awaited<ReturnType<typeof spindle.chats.get>>;
    try {
      chat = await spindle.chats.get(chatId, userId);
    } catch {
      return "fault";
    }
    const meta = chat && chat.metadata && typeof chat.metadata === "object"
      ? (chat.metadata as Record<string, unknown>)
      : null;
    cur = meta && typeof meta["branched_from"] === "string" ? (meta["branched_from"] as string) : null;
  }
  return null;
}

async function cloneShelfForFork(
  forkChatId: string,
  forkChatName: string | null,
  parentChatId: string,
  userId: string,
): Promise<void> {
  const parentEntries = await listLmbEntries(parentChatId, userId);
  if (parentEntries.length === 0) return;

  const [forkMsgs, parentMsgs] = await Promise.all([
    spindle.chat.getMessages(forkChatId),
    spindle.chat.getMessages(parentChatId),
  ]);
  const parentIdxById = new Map<string, number>();
  for (const m of parentMsgs) parentIdxById.set(m.id, m.index_in_chat);
  const forkIdByIdx = new Map<number, string>();
  for (const m of forkMsgs) {
    if (forkIdByIdx.has(m.index_in_chat)) {
      warn(`fork adoption: duplicate index_in_chat ${m.index_in_chat} in fork ${forkChatId.slice(0, 8)}; remap may be imprecise`);
      continue;
    }
    forkIdByIdx.set(m.index_in_chat, m.id);
  }

  const remap = (msgIds: string[]): { ids: string[]; first?: number; last?: number } => {
    const ids: string[] = [];
    let first = Number.POSITIVE_INFINITY;
    let last = -1;
    for (const id of msgIds) {
      const idx = parentIdxById.get(id);
      if (idx === undefined) continue;
      const forkId = forkIdByIdx.get(idx);
      if (forkId === undefined) continue;
      ids.push(forkId);
      if (idx < first) first = idx;
      if (idx > last) last = idx;
    }
    return {
      ids,
      first: first === Number.POSITIVE_INFINITY ? undefined : first,
      last: last === -1 ? undefined : last,
    };
  };

  const forkTransform: CopyTransform = (entry, ctx) => {
    // Ghosts don't survive a fork: their spans may cross the fork point (the
    // summary would narrate the abandoned branch) and their msgSigs would no
    // longer align with the remapped msgIds. The fork regenerates them
    // cheaply at the codex lag.
    if (entry.meta.ghost) return null;
    if (entry.meta.isRoot) {
      return {
        msgIds: entry.meta.msgIds.slice(),
        firstMsgIdx: entry.meta.firstMsgIdx,
        lastMsgIdx: entry.meta.lastMsgIdx,
        extra: { chatId: forkChatId },
      };
    }
    const { ids, first, last } = remap(entry.meta.msgIds);
    if (entry.meta.tier === 1) {
      if (ids.length === 0) return null;
      return { msgIds: ids, firstMsgIdx: first, lastMsgIdx: last, extra: { chatId: forkChatId } };
    }
    const survived = (entry.meta.sourceChapterEntryIds ?? [])
      .map((oldId) => ctx.idMap.get(oldId))
      .filter((x): x is string => typeof x === "string");
    if (ids.length === 0 && survived.length === 0) return null;
    let firstIdx = first;
    let lastIdx = last;
    if (firstIdx === undefined || lastIdx === undefined) {
      for (const oldId of entry.meta.sourceChapterEntryIds ?? []) {
        const cm = ctx.clonedMeta.get(oldId);
        if (!cm) continue;
        if (cm.firstMsgIdx !== undefined) firstIdx = firstIdx === undefined ? cm.firstMsgIdx : Math.min(firstIdx, cm.firstMsgIdx);
        if (cm.lastMsgIdx !== undefined) lastIdx = lastIdx === undefined ? cm.lastMsgIdx : Math.max(lastIdx, cm.lastMsgIdx);
      }
    }
    return { msgIds: ids, firstMsgIdx: firstIdx, lastMsgIdx: lastIdx, extra: { chatId: forkChatId } };
  };

  const newBook = await spindle.world_books.create(
    {
      name: bookNameFor(forkChatName, forkChatId),
      description: "Memoria's shelf for this chat. Chapters and arcs live here.",
      metadata: {
        lumibooks_chat_id: forkChatId,
        lumibooks_created_at: Date.now(),
        lumibooks_forked_from: parentChatId,
      },
    },
    userId,
  );

  let cloned = 0;
  try {
    const idMap = await copyLmbEntries(newBook.id, parentEntries, userId, forkTransform);
    cloned = idMap.size;
    await rebindForkShelf(forkChatId, newBook.id, userId);
  } catch (err) {
    await spindle.world_books.delete(newBook.id, userId).catch(() => {});
    throw err;
  }

  invalidateBookCache(userId, forkChatId);

  try {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    const desiredHidden = profile ? profile.hideCoveredMessages : true;
    await resyncVisibility(forkChatId, userId, desiredHidden);
  } catch (err) {
    warn(`fork adoption: visibility resync failed: ${describeError(err)}`);
  }

  info(`adopted fork ${forkChatId.slice(0, 8)} from ${parentChatId.slice(0, 8)} (${cloned} entries cloned)`);
}

async function rebindForkShelf(forkChatId: string, newBookId: string, userId: string): Promise<void> {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat) return;
    const metadata = chat.metadata && typeof chat.metadata === "object"
      ? { ...(chat.metadata as Record<string, unknown>) }
      : {};
    const inheritedBookId =
      typeof metadata["lumibooks_book_id"] === "string" ? (metadata["lumibooks_book_id"] as string) : null;
    const existing = Array.isArray(metadata["chat_world_book_ids"])
      ? (metadata["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const nextBookIds = existing.filter((id) => id !== inheritedBookId && id !== newBookId);
    nextBookIds.push(newBookId);
    metadata["chat_world_book_ids"] = nextBookIds;
    metadata["lumibooks_book_id"] = newBookId;
    metadata[FORK_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata }, userId);
  });
}

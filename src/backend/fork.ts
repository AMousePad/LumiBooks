declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import { bookNameFor } from "../shared";
import { findBookForChat, invalidateBookCache, listLmbEntries } from "./world-book";
import { copyLmbEntries, type CopyTransform } from "./book-copy";
import { loadSettings } from "./storage";
import { resyncVisibility } from "./coverage";
import { describeError, info, warn } from "./runtime";


const FORK_ADOPTED_FLAG = "lumibooks_fork_adopted";
const MAX_ANCESTRY_HOPS = 100;

const checked = new Set<string>();
const inflight = new Map<string, Promise<void>>();

function key(userId: string, chatId: string): string {
  return `${userId}::${chatId}`;
}

export async function ensureForkAdoption(chatId: string, userId: string): Promise<void> {
  const k = key(userId, chatId);
  if (checked.has(k)) return;
  const existing = inflight.get(k);
  if (existing) return existing;
  const p = (async () => {
    try {
      await doForkAdoption(chatId, userId);
      checked.add(k);
    } catch (err) {
      warn(`fork adoption failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    } finally {
      inflight.delete(k);
    }
  })();
  inflight.set(k, p);
  return p;
}

async function doForkAdoption(forkChatId: string, userId: string): Promise<void> {
  const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
  if (!chat) return;
  const meta = chat.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : null;
  const branchedFrom = meta && typeof meta["branched_from"] === "string" ? (meta["branched_from"] as string) : null;
  if (!branchedFrom) return;
  if (meta && meta[FORK_ADOPTED_FLAG] === true) return;

  const owned = await findBookForChat(forkChatId, userId).catch(() => null);
  if (owned) return;

  const ancestor = await findAncestorBook(branchedFrom, userId);
  if (!ancestor) return;

  await cloneShelfForFork(forkChatId, chat.name ?? null, ancestor.chatId, userId);
}

async function findAncestorBook(
  startChatId: string,
  userId: string,
): Promise<{ chatId: string; bookId: string } | null> {
  const seen = new Set<string>();
  let cur: string | null = startChatId;
  let hops = 0;
  while (cur && hops < MAX_ANCESTRY_HOPS) {
    const chatId: string = cur;
    if (seen.has(chatId)) break;
    seen.add(chatId);
    hops++;
    const bookId = await findBookForChat(chatId, userId).catch(() => null);
    if (bookId) return { chatId, bookId };
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
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
  metadata[FORK_ADOPTED_FLAG] = true;
  await spindle.chats.update(forkChatId, { metadata }, userId);
}

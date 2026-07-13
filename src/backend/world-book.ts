declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { WorldBookDTO, WorldBookEntryDTO } from "lumiverse-spindle-types";
import type { LMBEntryMeta } from "../shared";
import { EXTENSION_KEY, WORLD_BOOK_NAME_PREFIX, bookNameFor, codexBookNameFor, normalizeEntryMeta } from "../shared";
import { describeError, error, warn } from "./runtime";

const PAGE_LIMIT = 200;
const BOOK_INDEX_CACHE_TTL_MS = 4000;

type BookAnomalyTone = "warn" | "error";
let bookAnomalyCb: ((userId: string, tone: BookAnomalyTone, text: string) => void) | null = null;
export function registerBookAnomalyCallback(cb: (userId: string, tone: BookAnomalyTone, text: string) => void): void {
  bookAnomalyCb = cb;
}

interface ChatBookCacheEntry {
  bookId: string;
  expiresAt: number;
}

const CHAT_BOOK_CACHE_CAP = 1000;
const chatBookCache = new Map<string, ChatBookCacheEntry>();
const ensureInflight = new Map<string, Promise<WorldBookDTO>>();

function setBookCache(key: string, value: ChatBookCacheEntry): void {
  if (chatBookCache.has(key)) chatBookCache.delete(key);
  chatBookCache.set(key, value);
  while (chatBookCache.size > CHAT_BOOK_CACHE_CAP) {
    const oldest = chatBookCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    chatBookCache.delete(oldest);
  }
}

function cacheKey(userId: string, chatId: string): string {
  return `${userId}::${chatId}`;
}

export interface LMBEntry {
  raw: WorldBookEntryDTO;
  meta: LMBEntryMeta;
}

export async function listAllBooks(userId: string): Promise<WorldBookDTO[]> {
  const out: WorldBookDTO[] = [];
  let offset = 0;
  while (true) {
    const page = await spindle.world_books.list({ limit: PAGE_LIMIT, offset, userId });
    out.push(...page.data);
    if (out.length >= page.total || page.data.length === 0) break;
    offset += page.data.length;
  }
  return out;
}

export async function listAllEntries(bookId: string, userId: string): Promise<WorldBookEntryDTO[]> {
  const out: WorldBookEntryDTO[] = [];
  let offset = 0;
  while (true) {
    const page = await spindle.world_books.entries.list(bookId, { limit: PAGE_LIMIT, offset, userId });
    out.push(...page.data);
    if (out.length >= page.total || page.data.length === 0) break;
    offset += page.data.length;
  }
  return out;
}

export async function findBookForChat(chatId: string, userId: string): Promise<string | null> {
  const cached = chatBookCache.get(cacheKey(userId, chatId));
  if (cached && cached.expiresAt > Date.now()) return cached.bookId;

  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const fromMeta = chat?.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : null;
  const claimed = fromMeta && typeof fromMeta["lumibooks_book_id"] === "string" ? (fromMeta["lumibooks_book_id"] as string) : null;
  if (claimed) {
    const exists = await spindle.world_books.get(claimed, userId).catch(() => null);
    if (exists) {
      const bookMeta = exists.metadata && typeof exists.metadata === "object" ? (exists.metadata as Record<string, unknown>) : null;
      const bookChatId = bookMeta ? bookMeta["lumibooks_chat_id"] : undefined;
      if (bookChatId === chatId) {
        setBookCache(cacheKey(userId, chatId), { bookId: claimed, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
        return claimed;
      }
    }
  }

  const books = await listAllBooks(userId);
  for (const book of books) {
    const meta = book.metadata as Record<string, unknown> | undefined;
    if (meta && meta["lumibooks_chat_id"] === chatId) {
      setBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return book.id;
    }
  }
  return null;
}

export async function ensureBookForChat(chatId: string, userId: string): Promise<WorldBookDTO> {
  const key = cacheKey(userId, chatId);
  const inflight = ensureInflight.get(key);
  if (inflight) return inflight;
  const p = doEnsureBookForChat(chatId, userId).finally(() => {
    ensureInflight.delete(key);
  });
  ensureInflight.set(key, p);
  return p;
}

async function doEnsureBookForChat(chatId: string, userId: string): Promise<WorldBookDTO> {
  const existingId = await findBookForChat(chatId, userId);
  if (existingId) {
    const existing = await spindle.world_books.get(existingId, userId);
    if (existing) {
      await bindBookToChat(chatId, existing.id, userId).catch(() => {});
      return existing;
    }
  }

  const chat = await spindle.chats.get(chatId, userId);
  if (!chat) throw new Error(`Chat ${chatId} not found for user`);
  const claim = chat.metadata && typeof chat.metadata === "object"
    ? (chat.metadata as Record<string, unknown>)["lumibooks_book_id"]
    : undefined;

  const recovery = await recoverBookForChat(chatId, userId).catch((err) => {
    warn(`book recovery scan failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    return null;
  });
  if (recovery) {
    const existing = await spindle.world_books.get(recovery.bookId, userId).catch(() => null);
    if (existing) {
      const meta = (existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {}) as Record<string, unknown>;
      if (meta["lumibooks_chat_id"] !== chatId) {
        await spindle.world_books.update(existing.id, { metadata: { ...meta, lumibooks_chat_id: chatId } }, userId).catch((err) => {
          warn(`book recovery: failed to re-tag ${existing.id}: ${describeError(err)}`);
        });
      }
      await bindBookToChat(chatId, existing.id, userId).catch(() => {});
      setBookCache(cacheKey(userId, chatId), { bookId: existing.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      error(
        `book recovery: re-linked book ${existing.id} for chat ${chatId.slice(0, 8)} ` +
          `(${recovery.count} LumiBooks entries; normal lookup MISSED it; chat claim=${typeof claim === "string" ? claim : "none"}; ` +
          `${recovery.candidates} candidate book(s); userId=${userId.slice(0, 6)})`,
      );
      bookAnomalyCb?.(
        userId,
        "warn",
        recovery.candidates > 1
          ? `Memoria re-linked this chat's notebook but found ${recovery.candidates} candidates, you may have duplicate notebooks`
          : "Memoria re-linked this chat's notebook after its link was lost",
      );
      return existing;
    }
  }

  if (typeof claim === "string" && claim.trim()) {
    error(
      `book mismatch: chat ${chatId.slice(0, 8)} claims book ${claim} but it could not be resolved OR recovered; ` +
        `creating a NEW book. userId=${userId.slice(0, 6)}`,
    );
    bookAnomalyCb?.(
      userId,
      "error",
      "Memoria couldn't find this chat's old notebook and started a new one, older chapters may live in a separate notebook",
    );
  }

  const book = await spindle.world_books.create(
    {
      name: bookNameFor(chat.name, chatId),
      description: "Memoria's shelf for this chat. Chapters and arcs live here.",
      metadata: {
        lumibooks_chat_id: chatId,
        lumibooks_created_at: Date.now(),
      },
    },
    userId,
  );

  await bindBookToChat(chatId, book.id, userId).catch(() => {});

  setBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
  return book;
}

/**
 * Last-resort book finder for when the normal metadata lookup fails: scan
 * LumiBooks-looking books for an entry whose meta.chatId === chatId. Entries
 * survive even if a book's own lumibooks_chat_id metadata gets stripped or the
 * book is unbound, so this recovers a "lost" book instead of creating a duplicate.
 */
async function recoverBookForChat(
  chatId: string,
  userId: string,
): Promise<{ bookId: string; count: number; candidates: number } | null> {
  const books = await listAllBooks(userId);
  const matches: { id: string; count: number }[] = [];
  for (const book of books) {
    const meta = book.metadata as Record<string, unknown> | undefined;
    // Codex mirror books share the LumiBooks name prefix but are never the
    // summaries book: re-tagging one here would cross the two systems.
    if (meta && meta[CODEX_BOOK_META_KEY]) continue;
    const bookChatId = meta && typeof meta["lumibooks_chat_id"] === "string" ? (meta["lumibooks_chat_id"] as string) : null;
    // A book correctly tagged for another chat can't be this chat's lost book.
    // (One tagged for this chat would already have been found; re-checking is harmless.)
    if (bookChatId && bookChatId !== chatId) continue;
    const looksLikeLmb =
      (book.name || "").startsWith(WORLD_BOOK_NAME_PREFIX)
      || !!(meta && (meta["lumibooks_chat_id"] || meta["lumibooks_created_at"] || meta["lumibooks_forked_from"]));
    if (!looksLikeLmb) continue;
    const entries = await listAllEntries(book.id, userId).catch(() => [] as WorldBookEntryDTO[]);
    let count = 0;
    for (const entry of entries) {
      const ext = (entry.extensions || {}) as Record<string, unknown>;
      const m = normalizeEntryMeta(ext[EXTENSION_KEY]);
      if (m && m.chatId === chatId) count++;
    }
    if (count > 0) matches.push({ id: book.id, count });
  }
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.count - a.count);
  return { bookId: matches[0]!.id, count: matches[0]!.count, candidates: matches.length };
}

/** Serializes chat-metadata read-modify-writes per chat within this process. */
const chatMetaChain = new Map<string, Promise<unknown>>();
export function withChatMetaLock<T>(userId: string, chatId: string, fn: () => Promise<T>): Promise<T> {
  const key = `${userId}::${chatId}`;
  const prev = chatMetaChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => undefined);
  chatMetaChain.set(key, guarded);
  guarded.then(() => {
    if (chatMetaChain.get(key) === guarded) chatMetaChain.delete(key);
  });
  return tail;
}

function bindBookToChat(chatId: string, bookId: string, userId: string): Promise<void> {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    if (!chat) return;
    const metadata = (chat.metadata && typeof chat.metadata === "object") ? chat.metadata : {};
    const existing = Array.isArray((metadata as Record<string, unknown>)["chat_world_book_ids"])
      ? ((metadata as Record<string, unknown>)["chat_world_book_ids"] as string[]).filter((x) => typeof x === "string")
      : [];
    const alreadyBound = existing.includes(bookId);
    const alreadyClaimed = (metadata as Record<string, unknown>)["lumibooks_book_id"] === bookId;
    if (alreadyBound && alreadyClaimed) return;
    const nextChatBookIds = alreadyBound ? existing : [...existing, bookId];
    await spindle.chats.update(
      chatId,
      {
        metadata: {
          ...(metadata as Record<string, unknown>),
          chat_world_book_ids: nextChatBookIds,
          lumibooks_book_id: bookId,
        },
      },
      userId,
    );
  });
}

/** The world-book ids the chat has attached at chat scope (chat.metadata.chat_world_book_ids). */
export async function getChatAttachedBookIds(chatId: string, userId: string): Promise<string[]> {
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : null;
  if (!md || !Array.isArray(md["chat_world_book_ids"])) return [];
  return (md["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string");
}

/**
 * Re-assert this chat's book binding if it has been dropped from the chat's
 * metadata. Lumiverse's world-info activation only scans books listed in
 * chat_world_book_ids (plus character/persona/global), but LumiBooks resolves
 * its book by its own lumibooks_chat_id tag - so a wholesale chat metadata
 * write by another actor can silently unbind the book (the host stops scanning
 * it, getActivated returns nothing, and injection drops everything) while the
 * book itself stays intact. Returns true if it re-bound.
 */
export async function reassertChatBinding(chatId: string, userId: string): Promise<boolean> {
  // The codex mirror book rides the same reassert cadence: an unbound codex
  // book silently mutes every codex entry.
  await reassertCodexBinding(chatId, userId).catch(() => {});
  const bookId = await findBookForChat(chatId, userId).catch(() => null);
  if (!bookId) return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  if (!chat) return false;
  const md = chat.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : {};
  const attached = Array.isArray(md["chat_world_book_ids"])
    ? (md["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  if (attached.includes(bookId) && md["lumibooks_book_id"] === bookId) return false;
  await bindBookToChat(chatId, bookId, userId).catch((err) => {
    warn(`reassertChatBinding: failed to rebind ${bookId} to ${chatId.slice(0, 8)}: ${describeError(err)}`);
  });
  return true;
}

/** Short-lived entries cache: the injection interceptor runs on every
 * generation and must stay well inside the host's interceptor time budget.
 * Every mutation path already calls invalidateBookCache, which clears this
 * too; the TTL bounds staleness from external edits we don't hear about. */
const ENTRIES_CACHE_TTL_MS = 4000;
const ENTRIES_CACHE_CAP = 300;
const entriesCache = new Map<string, { at: number; data: LMBEntry[] }>();

export async function listLmbEntries(chatId: string, userId: string): Promise<LMBEntry[]> {
  const key = cacheKey(userId, chatId);
  const cached = entriesCache.get(key);
  if (cached && Date.now() - cached.at < ENTRIES_CACHE_TTL_MS) return cached.data;
  const bookId = await findBookForChat(chatId, userId);
  if (!bookId) return [];
  const raw = await listAllEntries(bookId, userId);
  const out: LMBEntry[] = [];
  for (const entry of raw) {
    const ext = (entry.extensions || {}) as Record<string, unknown>;
    const meta = normalizeEntryMeta(ext[EXTENSION_KEY]);
    if (!meta) continue;
    if (meta.chatId !== chatId) continue;
    out.push({ raw: entry, meta });
  }
  if (entriesCache.has(key)) entriesCache.delete(key);
  entriesCache.set(key, { at: Date.now(), data: out });
  while (entriesCache.size > ENTRIES_CACHE_CAP) {
    const oldest = entriesCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    entriesCache.delete(oldest);
  }
  return out;
}

export async function createChapterEntry(
  bookId: string,
  meta: LMBEntryMeta,
  content: string,
  comment: string,
  userId: string,
  keys: string[] = [],
  constant: boolean = true,
  disabled: boolean = false,
): Promise<WorldBookEntryDTO> {
  return spindle.world_books.entries.create(
    bookId,
    {
      content,
      comment,
      disabled,
      constant,
      key: keys,
      keysecondary: [],
      vectorized: false,
      extensions: {
        [EXTENSION_KEY]: meta,
      },
    },
    userId,
  );
}

export async function applyConstantToAllLmbEntries(userId: string, constant: boolean): Promise<number> {
  const books = await listAllBooks(userId);
  let updated = 0;
  for (const book of books) {
    const meta = book.metadata as Record<string, unknown> | undefined;
    if (!meta || typeof meta["lumibooks_chat_id"] !== "string") continue;
    const entries = await listAllEntries(book.id, userId).catch(() => [] as WorldBookEntryDTO[]);
    for (const entry of entries) {
      const ext = (entry.extensions || {}) as Record<string, unknown>;
      if (!ext[EXTENSION_KEY]) continue;
      if (entry.constant === constant) continue;
      try {
        await spindle.world_books.entries.update(entry.id, { constant }, userId);
        updated++;
      } catch (_) { void _; }
    }
  }
  return updated;
}

export async function updateEntry(
  entryId: string,
  patch: { content?: string; comment?: string; extensions?: Record<string, unknown> },
  userId: string,
): Promise<WorldBookEntryDTO> {
  return spindle.world_books.entries.update(entryId, patch, userId);
}

export async function deleteEntry(entryId: string, userId: string): Promise<void> {
  await spindle.world_books.entries.delete(entryId, userId);
}

export async function setEntryDisabled(entryId: string, disabled: boolean, userId: string): Promise<WorldBookEntryDTO> {
  return spindle.world_books.entries.update(entryId, { disabled }, userId);
}

/** Single-write ghost promotion: clears the ghost markers and enables the
 * entry in one update, so a partial failure can't strand a disabled entry
 * that no ghost mechanism recognizes anymore. */
export async function promoteGhostEntry(entry: LMBEntry, userId: string): Promise<WorldBookEntryDTO> {
  const nextMeta: LMBEntryMeta = { ...entry.meta, ghost: undefined, msgSigs: undefined };
  const ext = (entry.raw.extensions || {}) as Record<string, unknown>;
  return spindle.world_books.entries.update(
    entry.raw.id,
    { disabled: false, extensions: { ...ext, [EXTENSION_KEY]: nextMeta } },
    userId,
  );
}

export async function releaseEntry(entry: LMBEntry, userId: string): Promise<WorldBookEntryDTO> {
  const ext = (entry.raw.extensions || {}) as Record<string, unknown>;
  const nextExt: Record<string, unknown> = { ...ext };
  delete nextExt[EXTENSION_KEY];
  const currentComment = entry.raw.comment || "";
  const nextComment = currentComment.startsWith("[orphaned]")
    ? currentComment
    : `[orphaned] ${currentComment}`.trim();
  return spindle.world_books.entries.update(
    entry.raw.id,
    { extensions: nextExt, comment: nextComment },
    userId,
  );
}

export async function patchEntryMeta(
  entry: LMBEntry,
  metaPatch: Partial<LMBEntryMeta>,
  userId: string,
): Promise<WorldBookEntryDTO> {
  const next: LMBEntryMeta = { ...entry.meta, ...metaPatch };
  const ext = (entry.raw.extensions || {}) as Record<string, unknown>;
  return spindle.world_books.entries.update(
    entry.raw.id,
    {
      extensions: { ...ext, [EXTENSION_KEY]: next },
    },
    userId,
  );
}

export function invalidateBookCache(userId: string, chatId: string): void {
  chatBookCache.delete(cacheKey(userId, chatId));
  entriesCache.delete(cacheKey(userId, chatId));
  codexBookCache.delete(cacheKey(userId, chatId));
}

export function findCachedChatIdForBook(userId: string, bookId: string): string | null {
  const prefix = `${userId}::`;
  for (const [key, value] of chatBookCache) {
    if (!key.startsWith(prefix)) continue;
    if (value.bookId === bookId) return key.slice(prefix.length);
  }
  return null;
}

export async function findChatIdForBook(userId: string, bookId: string): Promise<string | null> {
  const cached = findCachedChatIdForBook(userId, bookId);
  if (cached) return cached;
  const book = await spindle.world_books.get(bookId, userId).catch(() => null);
  if (!book) return null;
  const meta = book.metadata && typeof book.metadata === "object" ? (book.metadata as Record<string, unknown>) : null;
  const claimed = meta && typeof meta["lumibooks_chat_id"] === "string" ? (meta["lumibooks_chat_id"] as string) : null;
  return claimed;
}

export function invalidateAllBookCacheEntriesForBook(userId: string, bookId: string): void {
  const prefix = `${userId}::`;
  const toDelete: string[] = [];
  for (const [key, value] of chatBookCache) {
    if (!key.startsWith(prefix)) continue;
    if (value.bookId === bookId) toDelete.push(key);
  }
  for (const k of toDelete) {
    chatBookCache.delete(k);
    entriesCache.delete(k);
  }
  const codexToDelete: string[] = [];
  for (const [key, value] of codexBookCache) {
    if (!key.startsWith(prefix)) continue;
    if (value.bookId === bookId) codexToDelete.push(key);
  }
  for (const k of codexToDelete) codexBookCache.delete(k);
}

/* --------------------------------------------------------- codex book */
/* The codex mirror lives in its own book, separate from the summaries book:
   the host activates its entries natively (keywords + constant), while the
   summaries book stays host-disabled and hand-injected. Never mix the two. */

const CODEX_BOOK_META_KEY = "lumibooks_codex_chat_id";
const CODEX_BOOK_CLAIM_KEY = "lumibooks_codex_book_id";
const codexBookCache = new Map<string, ChatBookCacheEntry>();
const codexEnsureInflight = new Map<string, Promise<WorldBookDTO>>();

function setCodexBookCache(key: string, value: ChatBookCacheEntry): void {
  if (codexBookCache.has(key)) codexBookCache.delete(key);
  codexBookCache.set(key, value);
  while (codexBookCache.size > CHAT_BOOK_CACHE_CAP) {
    const oldest = codexBookCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    codexBookCache.delete(oldest);
  }
}

function codexBookTaggedFor(book: WorldBookDTO, chatId: string): boolean {
  return codexBookChatTag(book) === chatId;
}

/** The chat a codex mirror book belongs to, or null for non-codex books. */
export function codexBookChatTag(book: WorldBookDTO): string | null {
  const meta = book.metadata && typeof book.metadata === "object" ? (book.metadata as Record<string, unknown>) : null;
  const tag = meta ? meta[CODEX_BOOK_META_KEY] : null;
  return typeof tag === "string" && tag ? tag : null;
}

export async function findCodexBookForChat(chatId: string, userId: string): Promise<string | null> {
  const cached = codexBookCache.get(cacheKey(userId, chatId));
  if (cached && cached.expiresAt > Date.now()) return cached.bookId;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat?.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : null;
  const claimed = md && typeof md[CODEX_BOOK_CLAIM_KEY] === "string" ? (md[CODEX_BOOK_CLAIM_KEY] as string) : null;
  if (claimed) {
    const book = await spindle.world_books.get(claimed, userId).catch(() => null);
    // The tag check matters on forks: a branched chat inherits the parent's
    // claim, and honoring it would point the fork at the parent's codex.
    if (book && codexBookTaggedFor(book, chatId)) {
      setCodexBookCache(cacheKey(userId, chatId), { bookId: claimed, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return claimed;
    }
  }
  const books = await listAllBooks(userId);
  for (const book of books) {
    if (codexBookTaggedFor(book, chatId)) {
      setCodexBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return book.id;
    }
  }
  return null;
}

function bindCodexBookToChat(chatId: string, bookId: string, userId: string): Promise<void> {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    if (!chat) return;
    const metadata = (chat.metadata && typeof chat.metadata === "object") ? chat.metadata : {};
    const md = metadata as Record<string, unknown>;
    const existing = Array.isArray(md["chat_world_book_ids"])
      ? (md["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const alreadyBound = existing.includes(bookId);
    const alreadyClaimed = md[CODEX_BOOK_CLAIM_KEY] === bookId;
    if (alreadyBound && alreadyClaimed) return;
    await spindle.chats.update(
      chatId,
      {
        metadata: {
          ...md,
          chat_world_book_ids: alreadyBound ? existing : [...existing, bookId],
          [CODEX_BOOK_CLAIM_KEY]: bookId,
        },
      },
      userId,
    );
  });
}

export async function ensureCodexBookForChat(chatId: string, userId: string): Promise<WorldBookDTO> {
  const key = cacheKey(userId, chatId);
  const inflight = codexEnsureInflight.get(key);
  if (inflight) return inflight;
  const p = doEnsureCodexBookForChat(chatId, userId).finally(() => {
    codexEnsureInflight.delete(key);
  });
  codexEnsureInflight.set(key, p);
  return p;
}

async function doEnsureCodexBookForChat(chatId: string, userId: string): Promise<WorldBookDTO> {
  const existingId = await findCodexBookForChat(chatId, userId);
  if (existingId) {
    // Uncaught on purpose: creating on a transport fault would mint a duplicate book.
    const existing = await spindle.world_books.get(existingId, userId);
    if (existing) {
      await bindCodexBookToChat(chatId, existing.id, userId);
      return existing;
    }
  }
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat) throw new Error(`Chat ${chatId} not found for user`);
  const book = await spindle.world_books.create(
    {
      name: codexBookNameFor(chat.name, chatId),
      description:
        "Managed by LumiBooks. This book mirrors the Knowledge Codex as retrievable entries and is rewritten on every codex update - edits made here WILL be overwritten. Edit records in the LumiBooks Codex tab instead.",
      metadata: {
        [CODEX_BOOK_META_KEY]: chatId,
        lumibooks_created_at: Date.now(),
      },
    },
    userId,
  );
  setCodexBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
  await bindCodexBookToChat(chatId, book.id, userId);
  return book;
}

/** Remove one book from a chat's scanned set (and its codex claim if it held
 * it). Used on forks, where the branch copies the parent's attachments. */
export function unbindBookFromChat(chatId: string, bookId: string, userId: string): Promise<void> {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    if (!chat) return;
    const md = (chat.metadata && typeof chat.metadata === "object") ? { ...(chat.metadata as Record<string, unknown>) } : {};
    const existing = Array.isArray(md["chat_world_book_ids"])
      ? (md["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const filtered = existing.filter((id) => id !== bookId);
    const claimHeld = md[CODEX_BOOK_CLAIM_KEY] === bookId;
    if (filtered.length === existing.length && !claimHeld) return;
    md["chat_world_book_ids"] = filtered;
    if (claimHeld) delete md[CODEX_BOOK_CLAIM_KEY];
    await spindle.chats.update(chatId, { metadata: md }, userId);
  });
}

/** Claim-fast-path rebind for the codex book, mirroring reassertChatBinding:
 * a wholesale chat-metadata write can drop the book from the scanned set,
 * which silently mutes every codex entry. Full recovery (claim stripped too)
 * happens on the next sync via ensureCodexBookForChat. */
export async function reassertCodexBinding(chatId: string, userId: string): Promise<boolean> {
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  if (!chat) return false;
  const md = chat.metadata && typeof chat.metadata === "object" ? (chat.metadata as Record<string, unknown>) : {};
  const claimed = typeof md[CODEX_BOOK_CLAIM_KEY] === "string" ? (md[CODEX_BOOK_CLAIM_KEY] as string) : null;
  if (!claimed) return false;
  const attached = Array.isArray(md["chat_world_book_ids"])
    ? (md["chat_world_book_ids"] as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  if (attached.includes(claimed)) return false;
  const book = await spindle.world_books.get(claimed, userId).catch(() => null);
  if (!book || !codexBookTaggedFor(book, chatId)) return false;
  await bindCodexBookToChat(chatId, claimed, userId).catch((err) => {
    warn(`reassertCodexBinding: failed to rebind ${claimed} to ${chatId.slice(0, 8)}: ${describeError(err)}`);
  });
  return true;
}

export interface RootCandidate {
  chatId: string;
  chatName: string;
  bookId: string;
  entryCount: number;
}

const ROOT_CANDIDATES_TTL_MS = 8000;
const rootCandidatesCache = new Map<string, { at: number; data: RootCandidate[] }>();

export function invalidateRootCandidates(userId: string): void {
  rootCandidatesCache.delete(userId);
}

export async function listRootCandidates(userId: string): Promise<RootCandidate[]> {
  const cached = rootCandidatesCache.get(userId);
  if (cached && Date.now() - cached.at < ROOT_CANDIDATES_TTL_MS) return cached.data;
  const books = await listAllBooks(userId).catch(() => [] as WorldBookDTO[]);
  const out: RootCandidate[] = [];
  for (const book of books) {
    const meta = book.metadata as Record<string, unknown> | undefined;
    const chatId = meta && typeof meta["lumibooks_chat_id"] === "string" ? (meta["lumibooks_chat_id"] as string) : null;
    if (!chatId) continue;
    const entries = await listAllEntries(book.id, userId).catch(() => [] as WorldBookEntryDTO[]);
    let entryCount = 0;
    for (const e of entries) {
      const ext = (e.extensions || {}) as Record<string, unknown>;
      if (ext[EXTENSION_KEY] && !e.disabled) entryCount++;
    }
    if (entryCount === 0) continue;
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    out.push({ chatId, chatName: chat?.name?.trim() || chatId.slice(0, 8), bookId: book.id, entryCount });
  }
  rootCandidatesCache.set(userId, { at: Date.now(), data: out });
  return out;
}

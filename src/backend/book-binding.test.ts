import { afterEach, beforeEach, expect, test } from "bun:test";
import { normalizeEntryMeta, WORLD_BOOK_NAME_PREFIX } from "../shared";
import { ensureBookForChat, ensureCodexBookForChat, invalidateBookCache, reassertChatBinding, reassertCodexBinding, unbindBookFromChat } from "./world-book";

const original = (globalThis as any).spindle;
const chatId = "binding-chat", userId = "binding-user";
let chat: any, books: Map<string, any>, entries: any[], serial: number;
beforeEach(() => {
  chat = { id: chatId, name: "Test", metadata: {} }; books = new Map(); entries = []; serial = 0;
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    chats: {
      async get() { return structuredClone(chat); },
      async update(_id: string, patch: any) { Object.assign(chat, structuredClone(patch)); return structuredClone(chat); },
    },
    world_books: {
      async get(id: string) { return structuredClone(books.get(id) ?? null); },
      async list() { return { data: structuredClone([...books.values()]), total: books.size }; },
      async create(value: any) { const book = { ...value, id: `book-${++serial}` }; books.set(book.id, book); return structuredClone(book); },
      async update(id: string, patch: any) { Object.assign(books.get(id), patch); return structuredClone(books.get(id)); },
      entries: { async list() { return { data: structuredClone(entries), total: entries.length }; } },
    },
  };
  invalidateBookCache(userId, chatId);
});
afterEach(() => { invalidateBookCache(userId, chatId); (globalThis as any).spindle = original; });

for (const kind of ["new", "existing", "recovered"] as const) test(`${kind} shelf cannot be used until chat binding succeeds`, async () => {
  if (kind !== "new") books.set("original", { id: "original", name: `${WORLD_BOOK_NAME_PREFIX} Test`, metadata: kind === "existing" ? { lumibooks_chat_id: chatId } : {} });
  if (kind === "recovered") entries = [{ id: "chapter", extensions: { lumibooks: normalizeEntryMeta({ chatId, tier: 1, msgIds: ["m0"] }) } }];
  const api = (globalThis as any).spindle.chats;
  const update = api.update;
  api.update = async () => { throw new Error("binding write failed"); };
  await expect(ensureBookForChat(chatId, userId)).rejects.toThrow("binding write failed");
  expect(books.size).toBe(1);
  api.update = update;
  const book = await ensureBookForChat(chatId, userId);
  expect(chat.metadata.chat_world_book_ids).toContain(book.id);
  expect(chat.metadata.lumibooks_book_id).toBe(book.id);
  expect(books.size).toBe(1);
});

test("a failed recovery scan cannot create a duplicate shelf", async () => {
  const api = (globalThis as any).spindle.world_books;
  const list = api.list;
  let reads = 0;
  api.list = async () => { if (++reads === 2) throw new Error("recovery unavailable"); return list(); };
  await expect(ensureBookForChat(chatId, userId)).rejects.toThrow("recovery unavailable");
  expect(books.size).toBe(0);
});

test("reasserting a failed binding does not report success", async () => {
  books.set("original", { id: "original", name: "Test", metadata: { lumibooks_chat_id: chatId } });
  (globalThis as any).spindle.chats.update = async () => { throw new Error("binding write failed"); };
  await expect(reassertChatBinding(chatId, userId)).rejects.toThrow("binding write failed");
});

for (const ensure of [ensureBookForChat, ensureCodexBookForChat]) test(`${ensure.name} rejects an unreadable chat during binding`, async () => {
  const host = (globalThis as any).spindle;
  const create = host.world_books.create, read = host.chats.get;
  host.world_books.create = async (...args: any[]) => {
    const book = await create(...args);
    host.chats.get = async () => { throw new Error("chat unavailable"); };
    return book;
  };
  await expect(ensure(chatId, userId)).rejects.toThrow("chat unavailable");
  host.chats.get = read;
  const book = await ensure(chatId, userId);
  expect(chat.metadata.chat_world_book_ids).toContain(book.id);
  expect(books.size).toBe(1);
});

test("failed Codex rebinding and inherited-book detachment are not acknowledged as successful", async () => {
  books.set("codex", { id: "codex", metadata: { lumibooks_codex_chat_id: chatId } });
  chat.metadata.lumibooks_codex_book_id = "codex";
  (globalThis as any).spindle.chats.update = async () => { throw new Error("binding failed"); };
  await expect(reassertCodexBinding(chatId, userId)).rejects.toThrow("binding failed");
  (globalThis as any).spindle.chats.get = async () => { throw new Error("chat unavailable"); };
  await expect(unbindBookFromChat(chatId, "codex", userId)).rejects.toThrow("chat unavailable");
});

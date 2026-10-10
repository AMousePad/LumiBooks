import { afterEach, beforeEach, expect, test } from "bun:test";
import { normalizeEntryMeta } from "../shared";
import { resyncVisibility, unhideCoveredMessages } from "./coverage";
import { invalidateBookCache } from "./world-book";
import { removeSummaryEntry } from "./shelf-actions";

const original = (globalThis as any).spindle;
const chatId = "visibility-chat", userId = "visibility-user", bookId = "visibility-book";
let messages: any[], entries: any[];
beforeEach(() => {
  messages = [0, 1, 2].map((i) => ({ id: `m${i}`, role: "user", content: `Message ${i}`, index_in_chat: i, extra: { hidden: true } }));
  entries = [{ id: "chapter", disabled: false, extensions: { lumibooks: normalizeEntryMeta({ chatId, tier: 1, msgIds: ["m0", "m1"] }) } }];
  const book = { id: bookId, metadata: { lumibooks_chat_id: chatId } };
  (globalThis as any).spindle = {
    log: { warn() {}, info() {}, error() {} },
    chat: {
      async getMessages() { return structuredClone(messages); },
      async setMessagesHidden(_chat: string, ids: string[], hidden: boolean) { for (const m of messages) if (ids.includes(m.id)) m.extra.hidden = hidden; },
      async setMessageHidden(_chat: string, id: string, hidden: boolean) { messages.find((m) => m.id === id).extra.hidden = hidden; },
    },
    chats: { async get() { return { id: chatId, metadata: { lumibooks_book_id: bookId } }; } },
    world_books: { async get() { return book; }, entries: {
      async list() { return { data: structuredClone(entries), total: entries.length }; },
      async delete(id: string) { entries = entries.filter((e) => e.id !== id); },
    } },
  };
  invalidateBookCache(userId, chatId);
});
afterEach(() => { invalidateBookCache(userId, chatId); (globalThis as any).spindle = original; });

test("resync counts covered and orphaned messages restored to visibility", async () => {
  expect(await resyncVisibility(chatId, userId, false)).toEqual({ unhidden: 3, hidden: 0 });
  expect(messages.every((m) => !m.extra.hidden)).toBe(true);
});

test("failed bulk visibility writes recover through individual writes", async () => {
  (globalThis as any).spindle.chat.setMessagesHidden = async () => { throw new Error("bulk unavailable"); };
  await unhideCoveredMessages(chatId, messages.map((m) => m.id), userId);
  expect(messages.every((m) => !m.extra.hidden)).toBe(true);
});

test("failed individual visibility writes are reported and can be retried", async () => {
  const api = (globalThis as any).spindle.chat;
  const write = api.setMessageHidden;
  api.setMessagesHidden = async () => { throw new Error("bulk unavailable"); };
  api.setMessageHidden = async (...args: any[]) => {
    if (args[1] === "m2") throw new Error("write unavailable");
    return write(...args);
  };
  await expect(resyncVisibility(chatId, userId, true)).rejects.toThrow("visibility");
  expect(messages[2].extra.hidden).toBe(true);
  api.setMessageHidden = write;
  expect(await resyncVisibility(chatId, userId, true)).toEqual({ unhidden: 1, hidden: 0 });
  expect(messages[2].extra.hidden).toBe(false);
});

test("visibility resync ignores stale cached coverage after entries disappear", async () => {
  await resyncVisibility(chatId, userId, true);
  entries = [];
  expect(await resyncVisibility(chatId, userId, true)).toEqual({ unhidden: 2, hidden: 0 });
  expect(messages.every((m) => !m.extra.hidden)).toBe(true);
});

test("deleting a chapter during visibility repair cannot leave its raw messages hidden", async () => {
  messages.forEach((m) => { m.extra.hidden = false; });
  let entered!: () => void, release!: () => void;
  const hiding = new Promise<void>((resolve) => { entered = resolve; });
  const paused = new Promise<void>((resolve) => { release = resolve; });
  const api = (globalThis as any).spindle.chat, write = api.setMessagesHidden;
  api.setMessagesHidden = async (chat: string, ids: string[], hidden: boolean) => {
    if (hidden) { entered(); await paused; }
    return write(chat, ids, hidden);
  };
  const repair = resyncVisibility(chatId, userId, true);
  await hiding;
  const deletion = removeSummaryEntry(chatId, "chapter", userId);
  await new Promise((resolve) => setTimeout(resolve, 0));
  release();
  await Promise.all([repair, deletion]);
  expect(entries).toHaveLength(0);
  expect(messages.every((m) => !m.extra.hidden)).toBe(true);
});

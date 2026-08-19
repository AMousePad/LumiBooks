import { afterAll, expect, jest, test } from "bun:test";

const chatId = "chat-sync-retry";
const userId = "user-1";
const bookId = "codex-book-1";

interface StoredEntry {
  id: string;
  world_book_id: string;
  content: string;
  comment: string;
  disabled: boolean;
  constant: boolean;
  key: string[];
  extensions: Record<string, unknown>;
}

const book = {
  id: bookId,
  name: "LumiBooks Codex [Do Not Edit] - Chat",
  metadata: { lumibooks_codex_chat_id: chatId },
};

let entries: StoredEntry[] = [];
let deleteCalls: string[] = [];
let failuresLeft = 0;

const globalWithSpindle = globalThis as typeof globalThis & { spindle?: unknown };
const previousSpindle = globalWithSpindle.spindle;

globalWithSpindle.spindle = {
  registerWorldInfoInterceptor(): void {},
  registerInterceptor(): void {},
  on(): () => void {
    return () => {};
  },
  onFrontendMessage(): void {},
  rpcPool: { sync(): void {} },
  log: {
    info(): void {},
    warn(): void {},
    error(): void {},
  },
  sendToFrontend(): void {},
  userStorage: {
    async exists(): Promise<boolean> {
      return false;
    },
    async readFile(): Promise<string> {
      throw new Error("not found");
    },
    async mkdir(): Promise<void> {},
  },
  chats: {
    async get(): Promise<unknown> {
      return {
        id: chatId,
        name: "Chat",
        metadata: { lumibooks_codex_book_id: bookId, chat_world_book_ids: [bookId] },
      };
    },
    async update(): Promise<unknown> {
      return {};
    },
  },
  chat: {
    async getMessages(): Promise<unknown[]> {
      return [];
    },
  },
  world_books: {
    async get(): Promise<unknown> {
      return book;
    },
    async list(): Promise<{ data: unknown[]; total: number }> {
      return { data: [book], total: 1 };
    },
    entries: {
      async list(): Promise<{ data: unknown[]; total: number }> {
        return { data: [...entries], total: entries.length };
      },
      async delete(entryId: string): Promise<boolean> {
        deleteCalls.push(entryId);
        if (failuresLeft > 0) {
          failuresLeft--;
          throw new Error("[embeddings] Write lock queue full (50 waiters) — rejecting to prevent resource exhaustion");
        }
        entries = entries.filter((e) => e.id !== entryId);
        return true;
      },
    },
  },
};

const { wipeCodexEntries } = await import("./sync");

afterAll(() => {
  if (previousSpindle === undefined) delete globalWithSpindle.spindle;
  else globalWithSpindle.spindle = previousSpindle;
});

function seed(): void {
  entries = [{
    id: "entry-1",
    world_book_id: bookId,
    content: "stale",
    comment: "Stale record",
    disabled: false,
    constant: false,
    key: ["stale"],
    extensions: { lumibooks_codex: { chatId, record: "characters/stale", file: "characters" } },
  }];
  deleteCalls = [];
}

async function pump(ms: number): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  jest.advanceTimersByTime(ms);
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

test("a transient delete rejection is retried instead of surfacing", async () => {
  seed();
  failuresLeft = 1;

  jest.useFakeTimers();
  try {
    const settled = wipeCodexEntries(chatId, userId).then(() => null, (err) => err);
    await pump(1000);
    expect(await settled).toBeNull();
  } finally {
    jest.useRealTimers();
  }

  expect(deleteCalls).toEqual(["entry-1", "entry-1"]);
  expect(entries).toEqual([]);
});

test("a delete that keeps failing is reported with its lingering-injection consequence", async () => {
  seed();
  failuresLeft = Number.POSITIVE_INFINITY;

  jest.useFakeTimers();
  try {
    const settled = wipeCodexEntries(chatId, userId).then(() => null, (err) => err);
    for (const ms of [1000, 2000, 4000, 8000, 16_000]) await pump(ms);
    expect(String(await settled)).toContain("failed to delete 1 codex entry, they may still inject");
  } finally {
    jest.useRealTimers();
  }

  expect(deleteCalls).toHaveLength(6);
  failuresLeft = 0;
});

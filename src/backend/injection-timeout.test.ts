import { afterAll, expect, jest, test } from "bun:test";
import { readFileSync } from "node:fs";

type TestMessage = {
  role: "user" | "assistant";
  content: string;
  [key: string]: unknown;
};

type InterceptorResult = TestMessage[] | {
  messages: TestMessage[];
  breakdown?: unknown;
};

type Interceptor = (
  messages: TestMessage[],
  context: unknown,
) => Promise<InterceptorResult>;

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const activationStarted = deferred<void>();
const activationResult = deferred<Array<{ id: string }>>();
let registeredInterceptor: Interceptor | undefined;

const chatId = "chat-123456789";
const userId = "user-1";
const bookId = "book-1";
const entryId = "entry-1";
const book = {
  id: bookId,
  name: "LumiBooks",
  metadata: { lumibooks_chat_id: chatId },
};
const entry = {
  id: entryId,
  world_book_id: bookId,
  content: "memory",
  comment: "Chapter",
  disabled: false,
  constant: true,
  extensions: {
    lumibooks: {
      tier: 1,
      chatId,
      msgIds: ["message-1"],
    },
  },
};

const globalWithSpindle = globalThis as typeof globalThis & { spindle?: unknown };
const previousSpindle = globalWithSpindle.spindle;

globalWithSpindle.spindle = {
  registerWorldInfoInterceptor(_handler: unknown, _priority?: number): void {},
  registerInterceptor(handler: Interceptor): void {
    registeredInterceptor = handler;
  },
  on(_event: string, _handler: unknown): () => void {
    return () => {};
  },
  onFrontendMessage(_handler: unknown): void {},
  rpcPool: {
    sync(..._args: unknown[]): void {},
  },
  log: {
    info(_message: string): void {},
    warn(_message: string): void {},
    error(_message: string): void {},
  },
  sendToFrontend(_payload: unknown, _userId: string): void {},
  userStorage: {
    async exists(..._args: unknown[]): Promise<boolean> {
      return false;
    },
  },
  chats: {
    async get(..._args: unknown[]): Promise<unknown> {
      return {
        id: chatId,
        name: "Chat",
        metadata: {
          lumibooks_book_id: bookId,
          chat_world_book_ids: [bookId],
        },
      };
    },
  },
  chat: {
    async getMessages(..._args: unknown[]): Promise<unknown[]> {
      return [{
        id: "message-1",
        role: "user",
        content: "hello",
        metadata: {},
      }];
    },
  },
  world_books: {
    getActivated(..._args: unknown[]): Promise<Array<{ id: string }>> {
      activationStarted.resolve();
      return activationResult.promise;
    },
    async get(..._args: unknown[]): Promise<unknown> {
      return book;
    },
    async list(..._args: unknown[]): Promise<{ data: unknown[]; total: number }> {
      return { data: [book], total: 1 };
    },
    entries: {
      async list(..._args: unknown[]): Promise<{ data: unknown[]; total: number }> {
        return { data: [entry], total: 1 };
      },
    },
  },
};

await import("./index");
const { rememberChatUser } = await import("./runtime");

afterAll(() => {
  if (previousSpindle === undefined) delete globalWithSpindle.spindle;
  else globalWithSpindle.spindle = previousSpindle;
});

test("waits for activation beyond three seconds", async () => {
  expect(registeredInterceptor).toBeDefined();
  rememberChatUser(chatId, userId);

  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
  }];

  jest.useFakeTimers();
  try {
    let settled = false;
    const pending = registeredInterceptor!(messages, { chatId }).then((result) => {
      settled = true;
      return result;
    });
    await activationStarted.promise;
    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(settled).toBe(false);
    activationResult.resolve([{ id: entryId }]);
    expect(await pending).toEqual({
      messages: [{ role: "assistant", content: "memory" }],
      breakdown: [{ messageIndex: 0, name: "Chapter" }],
    });
  } finally {
    jest.useRealTimers();
  }
});

test("declares the maximum host interceptor timeout", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../spindle.json", import.meta.url), "utf8"),
  ) as { interceptorTimeoutMs?: number };
  expect(manifest.interceptorTimeoutMs).toBe(300000);
});

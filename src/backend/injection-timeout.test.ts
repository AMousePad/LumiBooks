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

type WorldInfoInterceptor = (context: {
  entries: Array<{
    id: string;
    extensions?: Record<string, unknown>;
  }>;
  chatId: string;
  userId?: string;
}) => Promise<unknown>;

function deferred(): {
  promise: Promise<void>;
  resolve: () => void;
} {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const activationStarted = deferred();
const entryListStarted = deferred();
const entryListRelease = deferred();
const neverActivated = new Promise<never>(() => {});
let registeredInterceptor: Interceptor | undefined;
let registeredPriority: number | undefined;
let registeredWorldInfoInterceptor: WorldInfoInterceptor | undefined;
let getActivatedCalls = 0;
let getMessagesCalls = 0;
let entryListCalls = 0;
let hangEntryList = false;

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
  registerWorldInfoInterceptor(handler: WorldInfoInterceptor, _priority?: number): void {
    registeredWorldInfoInterceptor = handler;
  },
  registerInterceptor(handler: Interceptor, priority?: number): void {
    registeredInterceptor = handler;
    registeredPriority = priority;
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
    async getMessages(..._args: unknown[]): Promise<never> {
      getMessagesCalls++;
      throw new Error("unexpected full chat read");
    },
  },
  world_books: {
    getActivated(..._args: unknown[]): Promise<never> {
      getActivatedCalls++;
      activationStarted.resolve();
      return neverActivated;
    },
    async get(..._args: unknown[]): Promise<unknown> {
      return book;
    },
    async list(..._args: unknown[]): Promise<{ data: unknown[]; total: number }> {
      return { data: [book], total: 1 };
    },
    entries: {
      async list(..._args: unknown[]): Promise<{ data: unknown[]; total: number }> {
        entryListCalls++;
        if (hangEntryList) {
          entryListStarted.resolve();
          await entryListRelease.promise;
        }
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

test("waits for lorebook reads beyond three seconds", async () => {
  expect(registeredPriority).toBe(90);
  expect(registeredInterceptor).toBeDefined();

  rememberChatUser(chatId, userId);
  const mockSpindle = globalWithSpindle.spindle as {
    contracts?: Record<string, number>;
  };
  mockSpindle.contracts = { worldInfoActivationCapture: 1 };
  hangEntryList = true;
  entryListCalls = 0;

  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
    sourceMessageMetadata: {},
  }];

  jest.useFakeTimers();
  try {
    let settled = false;
    const pending = registeredInterceptor!(messages, { chatId }).then((result) => {
      settled = true;
      return result;
    });
    await entryListStarted.promise;
    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(settled).toBe(false);
    hangEntryList = false;
    entryListRelease.resolve();
    expect(await pending).toEqual({
      messages: [{ role: "assistant", content: "memory" }],
      breakdown: [{ messageIndex: 0, name: "Chapter" }],
    });
    expect(entryListCalls).toBe(1);
  } finally {
    hangEntryList = false;
    entryListRelease.resolve();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    delete mockSpindle.contracts;
    jest.useRealTimers();
  }
});

test("bounds and coalesces legacy activation reads", async () => {
  rememberChatUser(chatId, userId);
  getActivatedCalls = 0;
  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
    sourceMessageMetadata: {},
  }];

  jest.useFakeTimers();
  try {
    const first = registeredInterceptor!(messages, { chatId });
    const second = registeredInterceptor!(messages, { chatId });
    await activationStarted.promise;
    expect(getActivatedCalls).toBe(1);
    jest.advanceTimersByTime(2000);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual({
      messages: [{ role: "assistant", content: "memory" }],
      breakdown: [{ messageIndex: 0, name: "Chapter" }],
    });
    expect(secondResult).toEqual(firstResult);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(await registeredInterceptor!(messages, { chatId })).toEqual(firstResult);
    expect(getActivatedCalls).toBe(1);
  } finally {
    jest.useRealTimers();
  }
});

test("uses captured activation and source metadata without full-chat calls", async () => {
  expect(registeredInterceptor).toBeDefined();
  expect(registeredWorldInfoInterceptor).toBeDefined();
  rememberChatUser(chatId, userId);

  const mockSpindle = globalWithSpindle.spindle as {
    contracts?: Record<string, number>;
  };
  mockSpindle.contracts = { worldInfoActivationCapture: 1 };

  const wiResult = await registeredWorldInfoInterceptor!({
    chatId,
    userId,
    entries: [{ id: entryId, extensions: { lumibooks: entry.extensions.lumibooks } }],
  }) as {
    disabled?: string[];
    captured?: string[];
  };
  expect(wiResult.disabled).toEqual([entryId]);
  expect(wiResult.captured).toEqual([entryId]);

  getActivatedCalls = 0;
  getMessagesCalls = 0;
  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
    sourceMessageMetadata: {},
  }];
  const result = await registeredInterceptor!(messages, {
    chatId,
    capturedWorldInfo: [{ id: entryId }],
  });

  expect(result).toEqual({
    messages: [{ role: "assistant", content: "memory" }],
    breakdown: [{ messageIndex: 0, name: "Chapter" }],
  });
  expect(getActivatedCalls).toBe(0);
  expect(getMessagesCalls).toBe(0);
});

test("honors exclusions from source metadata without reading the chat", async () => {
  rememberChatUser(chatId, userId);
  getActivatedCalls = 0;
  getMessagesCalls = 0;
  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
    sourceMessageMetadata: { lmb_excluded: true },
  }];
  const result = await registeredInterceptor!(messages, {
    chatId,
    capturedWorldInfo: [{ id: entryId }],
  });

  expect(result).toEqual({
    messages: [
      messages[0],
      { role: "assistant", content: "memory" },
    ],
    breakdown: [{ messageIndex: 1, name: "Chapter" }],
  });
  expect(getActivatedCalls).toBe(0);
  expect(getMessagesCalls).toBe(0);
});

test("treats an explicit empty activation capture as authoritative", async () => {
  rememberChatUser(chatId, userId);
  getActivatedCalls = 0;
  getMessagesCalls = 0;
  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
    sourceMessageMetadata: {},
  }];
  const result = await registeredInterceptor!(messages, {
    chatId,
    capturedWorldInfo: [],
  });

  expect(result).toBe(messages);
  expect(getActivatedCalls).toBe(0);
  expect(getMessagesCalls).toBe(0);
});

test("new hosts avoid legacy activation when no capture is present", async () => {
  rememberChatUser(chatId, userId);
  const mockSpindle = globalWithSpindle.spindle as {
    contracts?: Record<string, number>;
  };
  mockSpindle.contracts = { worldInfoActivationCapture: 1 };
  getActivatedCalls = 0;
  getMessagesCalls = 0;
  const messages: TestMessage[] = [{
    role: "user",
    content: "hello",
    __isChatHistory: true,
    sourceMessageId: "message-1",
    sourceIndexInChat: 0,
    sourceMessageMetadata: {},
  }];
  const result = await registeredInterceptor!(messages, { chatId });

  expect(result).toEqual({
    messages: [{ role: "assistant", content: "memory" }],
    breakdown: [{ messageIndex: 0, name: "Chapter" }],
  });
  expect(getActivatedCalls).toBe(0);
  expect(getMessagesCalls).toBe(0);
});

test("new hosts verify an empty history when capture is missing", async () => {
  rememberChatUser(chatId, userId);
  const mockSpindle = globalWithSpindle.spindle as {
    contracts?: Record<string, number>;
  };
  mockSpindle.contracts = { worldInfoActivationCapture: 1 };
  getActivatedCalls = 0;
  getMessagesCalls = 0;
  const messages: TestMessage[] = [{
    role: "assistant",
    content: "preset",
  }];

  const result = await registeredInterceptor!(messages, { chatId });

  expect(result).toBe(messages);
  expect(getActivatedCalls).toBe(0);
  expect(getMessagesCalls).toBe(1);
});

test("declares the maximum host interceptor timeout", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../spindle.json", import.meta.url), "utf8"),
  ) as { interceptorTimeoutMs?: number };
  expect(manifest.interceptorTimeoutMs).toBe(300000);
});

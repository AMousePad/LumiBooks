import { afterAll, expect, test } from "bun:test";

const userId = "user-1";
const SRC = "chat-source";
const DST = "chat-dest";

const store = new Map<string, unknown>();

const globalWithSpindle = globalThis as typeof globalThis & { spindle?: unknown };
const previousSpindle = globalWithSpindle.spindle;

globalWithSpindle.spindle = {
  log: { info() {}, warn() {}, error() {} },
  userStorage: {
    async exists(path: string): Promise<boolean> {
      return store.has(path);
    },
    async getJson<T>(path: string, options?: { fallback?: T }): Promise<T> {
      if (!store.has(path)) {
        if (options && "fallback" in options) return options.fallback as T;
        throw new Error(`missing ${path}`);
      }
      return structuredClone(store.get(path)) as T;
    },
    async setJson(path: string, value: unknown): Promise<void> {
      store.set(path, structuredClone(value));
    },
    async list(prefix: string): Promise<string[]> {
      return [...store.keys()].filter((k) => k.startsWith(prefix));
    },
    async delete(path: string): Promise<void> {
      store.delete(path);
    },
    async mkdir(): Promise<void> {},
    async read(path: string): Promise<string> {
      if (!store.has(path)) throw new Error(`missing ${path}`);
      return JSON.stringify(store.get(path));
    },
  },
};

const { adoptCodexFrom, listCodexChatIds, loadCursor } = await import("./store");

afterAll(() => {
  if (previousSpindle === undefined) delete globalWithSpindle.spindle;
  else globalWithSpindle.spindle = previousSpindle;
});

function seedSource(): void {
  store.clear();
  store.set(`codex/${SRC}/cursor.json`, {
    version: 1,
    lastMsgId: "m200",
    consumedSigs: [{ id: "m200", sig: "abc" }],
    fileStates: { threads: "frozen" },
    frozenAtRuns: {},
    refreshPending: [],
    prefixMsgId: null,
    pendingReconcile: false,
    reconcileUntilMsgId: null,
    relationsTableMode: true,
    lastRunAt: 123,
    lastRunStats: null,
    runs: 9,
    updatedAt: 123,
  });
  store.set(`codex/${SRC}/world.json`, { entries: [{ id: "w1", topic: "Magic", facts: ["costs memories"] }] });
}

test("carries the files over and resets consumption to zero", async () => {
  seedSource();
  expect(await adoptCodexFrom(SRC, DST, userId)).toBe("ok");

  expect(store.get(`codex/${DST}/world.json`)).toEqual(store.get(`codex/${SRC}/world.json`));

  const cursor = await loadCursor(DST, userId);
  expect(cursor.runs).toBe(0);
  expect(cursor.lastMsgId).toBeNull();
  expect(cursor.consumedSigs).toEqual([]);
  // Switches and the on-disk relations mode ride along, or the copied files
  // would be validated under the wrong schema.
  expect(cursor.fileStates).toEqual({ threads: "frozen" });
  expect(cursor.relationsTableMode).toBe(true);
  // Origin is recorded the way the shelf records rootOrigin.
  expect(cursor.rootOrigin).toBe(SRC);
});

test("refuses to overwrite a chat that already has codex data", async () => {
  seedSource();
  store.set(`codex/${DST}/world.json`, { entries: [{ id: "keep", topic: "Mine", facts: [] }] });
  expect(await adoptCodexFrom(SRC, DST, userId)).toBe("has_own");
  expect((store.get(`codex/${DST}/world.json`) as any).entries[0].id).toBe("keep");
});

test("refuses a source with no codex and a chat onto itself", async () => {
  store.clear();
  expect(await adoptCodexFrom(SRC, DST, userId)).toBe("no_source");
  expect(await adoptCodexFrom(SRC, SRC, userId)).toBe("same_chat");
});

test("lists chats holding a codex", async () => {
  seedSource();
  store.set(`codex/${DST}/cursor.json`, { version: 1 });
  expect((await listCodexChatIds(userId)).sort()).toEqual([DST, SRC].sort());
});

test("reads the host's listing shapes, backslashes and prefix-relative alike", async () => {
  const bs = String.fromCharCode(92);
  const win = (s: string): string => s.split("/").join(bs);
  const shapes: string[][] = [
    [`${SRC}/cursor.json`, `${SRC}/world.json`, `${DST}/cursor.json`],
    [win(`${SRC}/cursor.json`), win(`${SRC}/world.json`), win(`${DST}/cursor.json`)],
    [`codex/${SRC}/cursor.json`, `codex/${DST}/cursor.json`],
    [win(`codex/${SRC}/cursor.json`), win(`codex/${DST}/cursor.json`)],
  ];
  const spindleMock = globalWithSpindle.spindle as { userStorage: { list: (p: string) => Promise<string[]> } };
  const realList = spindleMock.userStorage.list;
  try {
    for (const listing of shapes) {
      spindleMock.userStorage.list = async () => listing;
      expect((await listCodexChatIds(userId)).sort()).toEqual([DST, SRC].sort());
    }
    // A stray file directly under the codex dir names no chat.
    spindleMock.userStorage.list = async () => ["stray.json"];
    expect(await listCodexChatIds(userId)).toEqual([]);
  } finally {
    spindleMock.userStorage.list = realList;
  }
});

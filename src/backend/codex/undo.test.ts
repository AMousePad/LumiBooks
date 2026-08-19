import { afterAll, expect, test } from "bun:test";

const CHAT = "chat-1";
const U = "u";
const store = new Map<string, unknown>();

const globalWithSpindle = globalThis as typeof globalThis & { spindle?: unknown };
const previousSpindle = globalWithSpindle.spindle;

globalWithSpindle.spindle = {
  log: { info() {}, warn() {}, error() {} },
  userStorage: {
    async exists(p: string): Promise<boolean> { return store.has(p); },
    async getJson<T>(p: string, o?: { fallback?: T }): Promise<T> {
      if (!store.has(p)) {
        if (o && "fallback" in o) return o.fallback as T;
        throw new Error(`missing ${p}`);
      }
      return structuredClone(store.get(p)) as T;
    },
    async setJson(p: string, v: unknown): Promise<void> { store.set(p, structuredClone(v)); },
    async delete(p: string): Promise<void> { store.delete(p); },
    async list(): Promise<string[]> { return [...store.keys()]; },
    async mkdir(): Promise<void> {},
    async read(p: string): Promise<string> {
      if (!store.has(p)) throw new Error(`missing ${p}`);
      return JSON.stringify(store.get(p));
    },
    async write(p: string, data: string): Promise<void> { store.set(p, JSON.parse(data)); },
  },
};

const { applyCodexBackup, parseCodexBackup, readCodexUndo, snapshotCodexForUndo } = await import("./backup");
const { emptyCursor, loadCursor, saveCursor } = await import("./store");

afterAll(() => {
  if (previousSpindle === undefined) delete globalWithSpindle.spindle;
  else globalWithSpindle.spindle = previousSpindle;
});

/** A codex that has consumed 40 messages, snapshotted, then advanced to 80. */
async function seedAndAdvance(): Promise<void> {
  store.clear();
  store.set(`codex/${CHAT}/world.json`, { entries: [{ id: "w1", topic: "Before", facts: ["old"] }] });
  await saveCursor(CHAT, {
    ...emptyCursor(),
    lastMsgId: "m40",
    consumedSigs: [{ id: "m40", sig: "s40" }],
    runs: 5,
    relationsTableMode: false,
  }, U);
  await snapshotCodexForUndo(CHAT, U, "tidy");
  store.set(`codex/${CHAT}/world.json`, { entries: [{ id: "w1", topic: "After", facts: ["new"] }] });
  await saveCursor(CHAT, {
    ...(await loadCursor(CHAT, U)),
    lastMsgId: "m80",
    consumedSigs: [{ id: "m80", sig: "s80" }],
    runs: 6,
  }, U);
}

test("undo rolls back the files and the consumed-message marks together", async () => {
  await seedAndAdvance();
  const snap = await readCodexUndo(CHAT, U);
  expect(snap?.cursor).toBeDefined();

  const parsed = parseCodexBackup(snap, false);
  if ("error" in parsed) throw new Error(parsed.error);
  await applyCodexBackup(CHAT, U, parsed, snap!.cursor);

  expect((store.get(`codex/${CHAT}/world.json`) as any).entries[0].topic).toBe("Before");
  // Without the cursor the files would roll back while the marks stayed at
  // m80, so the undone turns would never be indexed again.
  const after = await loadCursor(CHAT, U);
  expect(after.lastMsgId).toBe("m40");
  expect(after.runs).toBe(5);
});

test("a plain restore leaves consumption alone", async () => {
  await seedAndAdvance();
  const snap = await readCodexUndo(CHAT, U);
  const parsed = parseCodexBackup(snap, false);
  if ("error" in parsed) throw new Error(parsed.error);

  await applyCodexBackup(CHAT, U, parsed);

  // A backup can come from another chat, so importing its marks would be wrong.
  const after = await loadCursor(CHAT, U);
  expect(after.lastMsgId).toBe("m80");
  expect(after.runs).toBe(6);
});

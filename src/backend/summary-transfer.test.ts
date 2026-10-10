import { afterEach, beforeEach, expect, test } from "bun:test";
import { normalizeEntryMeta } from "../shared";
import { buildCoverage } from "./coverage";
import { exportSummaryLorebook } from "./summary-backup";
import { getSummaryTransfer, runSummaryTransfer } from "./summary-transfer";
import { invalidateBookCache } from "./world-book";

const original = (globalThis as any).spindle;
let serial = 0, user: string, chats: Map<string, any[]>, entries: any[], sent: any[], creates: number, failAt = -1;
const message = (i: number) => ({ id: `source-${i}`, role: i % 2 ? "user" : "assistant", content: `Raw ${i} {{random::a::b}}`, index_in_chat: i });
beforeEach(() => {
  user = `summary-transfer-${++serial}`; creates = 0; failAt = -1; sent = [];
  chats = new Map([["source", Array.from({ length: 4 }, (_, i) => message(i))], ["target", Array.from({ length: 5 }, (_, i) => ({ ...message(i), id: `target-${i}` }))]]);
  entries = [0, 1].map((i) => ({ id: `chapter-${i}`, world_book_id: "source-book", content: `Exact summary ${i}`, comment: `Chapter ${i + 1}`, disabled: false,
    extensions: { lumibooks: normalizeEntryMeta({ tier: 1, chatId: "source", msgIds: [`source-${i * 2}`, `source-${i * 2 + 1}`], firstMsgIdx: i * 2, lastMsgIdx: i * 2 + 1 }) } }));
  (globalThis as any).spindle = {
    sendToFrontend(m: any) { sent.push(m); }, log: { info() {}, warn() {}, error() {} },
    chat: { async getMessages(id: string) { return structuredClone(chats.get(id) ?? []); } },
    chats: { async get(id: string) { return { id, metadata: { lumibooks_book_id: `${id}-book`, chat_world_book_ids: [`${id}-book`] } }; }, async update() {} },
    world_books: { async get(id: string) { return { id, metadata: { lumibooks_chat_id: id.replace(/-book$/, "") } }; }, async list() { return { data: [], total: 0 }; }, entries: {
      async list(id: string) { const data = entries.filter((e) => e.world_book_id === id); return { data, total: data.length }; },
      async create(id: string, value: any) { if (++creates === failAt) throw new Error("write failure"); const entry = { ...value, id: `new-${creates}`, world_book_id: id }; entries.push(entry); return entry; },
      async delete(id: string) { entries = entries.filter((e) => e.id !== id); return true; },
    } },
  };
});
afterEach(() => { invalidateBookCache(user, "source"); invalidateBookCache(user, "target"); (globalThis as any).spindle = original; });
const status = () => getSummaryTransfer(user, "target")!;
const choose = (choice: "match" | "specify" | "manual" | "cancel", through?: number) => runSummaryTransfer(user, "target", { type: "resolve", id: status().id, choice, through });
const imported = () => entries.filter((e) => e.world_book_id === "target-book");

test("export raw hashes automatically relink a reimported chat with different IDs and a longer tail", async () => {
  const raw = await exportSummaryLorebook("source", user);
  expect(raw.extensions?.lumibooks_summary.messages).toHaveLength(4);
  expect(JSON.stringify(raw)).not.toContain("{{random");
  expect(await runSummaryTransfer(user, "target", { type: "import", raw })).toBe(true);
  expect(imported().map((e) => e.content)).toEqual(["Exact summary 0", "Exact summary 1"]);
  expect(imported().map((e) => e.extensions.lumibooks.msgIds)).toEqual([["target-0", "target-1"], ["target-2", "target-3"]]);
  expect(imported().every((e) => !e.extensions.lumibooks.isRoot)).toBe(true);
  expect((await buildCoverage("target", user)).coveredBy.size).toBe(4);
  expect(status().stage).toBe("done");
});

test("mismatched chat waits without writes, then uniquely relocates messages leaving new ones uncovered", async () => {
  const raw = await exportSummaryLorebook("source", user);
  chats.get("target")!.splice(1, 0, { ...message(90), id: "inserted" });
  expect(await runSummaryTransfer(user, "target", { type: "import", raw })).toBe(false);
  expect(status().stage).toBe("mismatch"); expect(creates).toBe(0);
  expect(await choose("match")).toBe(true);
  expect((await buildCoverage("target", user)).coveredBy.has("inserted")).toBe(false);
  expect(imported()[0].extensions.lumibooks.msgIds).toEqual(["target-0", "target-1"]);
});

test("overlapping coverage inside one imported file is rejected before any writes", async () => {
  const raw = await exportSummaryLorebook("source", user);
  Object.values(raw.entries)[1]!.extensions.lumibooks_summary.messageIndices.push(1);
  expect(await runSummaryTransfer(user, "target", { type: "import", raw })).toBe(false);
  expect(status().stage).toBe("error");
  expect(status().text).toContain("overlapping");
  expect(creates).toBe(0);
  expect(imported()).toHaveLength(0);
});

test("short or edited chats ask for an endpoint; manual import keeps the bundle atomic", async () => {
  const raw = await exportSummaryLorebook("source", user);
  chats.set("target", chats.get("target")!.slice(0, 2));
  await runSummaryTransfer(user, "target", { type: "import", raw });
  expect(status().stage).toBe("manual"); expect(creates).toBe(0);
  expect(await choose("manual", 3)).toBe(false); expect(creates).toBe(0);
  expect(await choose("manual", 1.5)).toBe(false); expect(creates).toBe(0);
  expect(await choose("manual", 2)).toBe(true);
  expect(imported()).toHaveLength(1);
  expect(imported()[0].content).toBe("Exact summary 0\n\nExact summary 1");
  expect(imported()[0].extensions.lumibooks.msgIds).toEqual(["target-0", "target-1"]);
});

test("edited or ambiguous matching falls back to manual and zero retains separate roots", async () => {
  const raw = await exportSummaryLorebook("source", user);
  chats.get("target")![1].content = "Edited";
  await runSummaryTransfer(user, "target", { type: "import", raw });
  await choose("match"); expect(status().stage).toBe("manual"); expect(creates).toBe(0);
  await choose("manual", 0);
  expect(imported()).toHaveLength(2);
  expect((await buildCoverage("target", user)).coveredBy.size).toBe(0);
});

test("cancel, malformed metadata, overlapping coverage and partial writes never silently change indexing", async () => {
  const raw = await exportSummaryLorebook("source", user);
  const broken = structuredClone(raw); broken.extensions!.lumibooks_summary.contentHash = "0".repeat(64);
  await runSummaryTransfer(user, "target", { type: "import", raw: broken });
  expect(status().stage).toBe("error"); expect(creates).toBe(0);
  await choose("cancel"); expect(getSummaryTransfer(user, "target")).toBeNull();
  failAt = 2;
  await runSummaryTransfer(user, "target", { type: "import", raw });
  expect(status().stage).toBe("error"); expect(imported()).toHaveLength(0);
  await choose("cancel"); failAt = -1;
  await runSummaryTransfer(user, "target", { type: "import", raw });
  const before = imported().length;
  await runSummaryTransfer(user, "target", { type: "import", raw });
  expect(status().stage).toBe("error"); expect(imported()).toHaveLength(before);
});

test("a chat edited during computation cannot receive stale coverage", async () => {
  const raw = await exportSummaryLorebook("source", user);
  let reads = 0;
  (globalThis as any).spindle.chat.getMessages = async () => {
    if (++reads === 2) chats.get("target")![0].content = "Changed while comparing";
    return structuredClone(chats.get("target"));
  };
  await runSummaryTransfer(user, "target", { type: "import", raw });
  expect(status().stage).toBe("manual"); expect(creates).toBe(0);
});

test("closing the frontend during progress does not interrupt or lose the import", async () => {
  const raw = await exportSummaryLorebook("source", user);
  (globalThis as any).spindle.sendToFrontend = () => { throw new Error("frontend detached"); };
  expect(await runSummaryTransfer(user, "target", { type: "import", raw })).toBe(true);
  expect(status().stage).toBe("done");
  expect(imported()).toHaveLength(2);
});

test("unavailable source messages cannot turn a partial old summary into verified coverage", async () => {
  chats.get("source")!.splice(0, 1);
  const raw = await exportSummaryLorebook("source", user);
  const rows = Object.values(raw.entries);
  expect(rows[0]!.extensions.lumibooks_summary.messageIndices).toEqual([]);
  expect(raw.extensions?.lumibooks_summary.messages.map((m) => m.index)).toEqual([1, 2]);
});

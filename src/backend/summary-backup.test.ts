import { expect, test } from "bun:test";
import { importSummaryLorebook, parseSummaryLorebook, summaryLorebook } from "./summary-backup";
import { buildCoverage } from "./coverage";
import { normalizeEntryMeta } from "../shared";
import type { LMBEntry } from "./world-book";
const entry = (id: string, tier: number, sources: string[] = []) => ({
 raw: { id, content: "Keep this exact prose.", comment: "Summary", disabled: false },
 meta: normalizeEntryMeta({ chatId: "old", tier, msgIds: ["foreign-message"], sourceChapterEntryIds: sources }),
} as LMBEntry);
test("lorebook export includes active summaries once and strips foreign coverage and raw reasoning", async () => {
 const source = entry("chapter", 1); source.meta.rawOutput = "private reasoning";
 const coverage = await buildCoverage("old", "u", [source, entry("arc", 2, ["chapter"])]);
 const backup = summaryLorebook(coverage.activeEntries, "Test");
 expect(Object.values(backup.entries)).toHaveLength(1);
 const json = JSON.stringify(backup);
 expect(json).not.toContain("foreign-message"); expect(json).not.toContain("rawOutput");
 expect(parseSummaryLorebook(backup)).toMatchObject([{ tier: 2, content: "Keep this exact prose." }]);
});
test("imports standard array and keyed lorebooks, skips disabled entries and validates before writes", () => {
 const row = { content: "Unchanged", keys: ["key"] };
 expect(parseSummaryLorebook({ entries: [row, { ...row, disabled: true }] })).toHaveLength(1);
 expect(parseSummaryLorebook({ entries: { 0: row } })[0]!.tier).toBe(1);
 expect(() => parseSummaryLorebook({ entries: [row, { content: 12 }] })).toThrow();
 expect(() => parseSummaryLorebook({ entries: [] })).toThrow();
});

for (const fail of [false, true]) test(`root import ${fail ? "rolls back partial writes" : "preserves prose and leaves chat coverage empty"}`, async () => {
 const previous = (globalThis as any).spindle;
 const chatId = `import-${fail}`, userId = `import-${fail}`;
 const rows: any[] = [];
 const book = { id: "import-book", metadata: { lumibooks_chat_id: chatId } };
 (globalThis as any).spindle = {
  log: { warn() {}, error() {}, info() {} },
  chats: { async get() { return { id: chatId, metadata: { lumibooks_book_id: book.id, chat_world_book_ids: [book.id] } }; }, async update() {} },
  world_books: { async get() { return book; }, async list() { return { data: [book], total: 1 }; }, entries: {
   async list() { return { data: rows, total: rows.length }; },
   async create(_book: string, value: any) { if (fail && rows.length === 1) throw new Error("write failure"); const v = { ...value, id: `root-${rows.length}` }; rows.push(v); return v; },
   async delete(id: string) { rows.splice(rows.findIndex((r) => r.id === id), 1); return true; },
  } },
 };
 try {
  const raw = { entries: [{ content: "Precise timeline." }, { content: "Second summary." }] };
  if (fail) { await expect(importSummaryLorebook(chatId, userId, raw)).rejects.toThrow("write failure"); expect(rows).toHaveLength(0); }
  else {
   expect(await importSummaryLorebook(chatId, userId, raw)).toBe(2);
   expect(rows.map((r) => r.content)).toEqual(["Precise timeline.", "Second summary."]);
   const all = rows.map((raw) => ({ raw, meta: raw.extensions.lumibooks }));
   expect(all.every((e) => e.meta.isRoot && e.meta.firstMsgIdx < 0 && e.meta.msgIds.length === 0)).toBe(true);
   expect((await buildCoverage(chatId, userId, all)).coveredBy.size).toBe(0);
  }
 } finally { (globalThis as any).spindle = previous; }
});

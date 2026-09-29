import { approximateTokensFromChars, type SummaryTier } from "../shared";
import { buildCoverage } from "./coverage";
import { createChapterEntry, deleteEntry, ensureBookForChat, invalidateBookCache, listLmbEntries, type LMBEntry } from "./world-book";

const EXPORT_KEY = "lumibooks_summary";
export function summaryLorebook(entries: LMBEntry[], name: string) {
  return { name, description: "LumiBooks summaries. Import through Books to use as an inherited root.",
    entries: Object.fromEntries(entries.filter((e) => !e.meta.ghost).map((e, i) => [i, {
      uid: i, key: e.raw.key ?? [], keysecondary: [], content: e.raw.content,
      comment: e.raw.comment || e.meta.title || `Summary ${i + 1}`, constant: true, disable: false,
      position: 0, order: i, displayIndex: i,
      extensions: { [EXPORT_KEY]: { tier: e.meta.tier } },
    }])) };
}
export async function exportSummaryLorebook(chatId: string, userId: string) {
  const coverage = await buildCoverage(chatId, userId);
  const entries = coverage.activeEntries.slice().sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  return summaryLorebook(entries, `LumiBooks summaries - ${chatId.slice(0, 8)}`);
}
interface ImportedSummary { content: string; comment: string; keys: string[]; tier: SummaryTier }
export function parseSummaryLorebook(raw: unknown): ImportedSummary[] {
  if (!raw || typeof raw !== "object") throw new Error("Choose a lorebook JSON file with entries");
  const entries = (raw as { entries?: unknown }).entries;
  if (!entries || typeof entries !== "object") throw new Error("The lorebook has no entries");
  const rows = Array.isArray(entries) ? entries : Object.values(entries);
  if (rows.length > 10000) throw new Error("The lorebook has more than 10,000 entries");
  const out: ImportedSummary[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") throw new Error("Invalid lorebook entry");
    const v = row as Record<string, any>;
    if (v.disable === true || v.disabled === true || v.enabled === false) continue;
    if (typeof v.content !== "string") throw new Error("Every lorebook entry needs text content");
    if (!v.content.trim()) continue;
    const tier = v.extensions?.[EXPORT_KEY]?.tier;
    const keys = v.key ?? v.keys;
    out.push({ content: v.content, comment: typeof v.comment === "string" ? v.comment : typeof v.name === "string" ? v.name : "Imported summary",
      keys: Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : [],
      tier: Number.isInteger(tier) && tier >= 1 && tier <= 7 ? tier : 1 });
  }
  if (!out.length) throw new Error("The lorebook has no enabled summaries");
  return out;
}
/** Imported prose is a root, never a claim that destination messages were indexed. */
export async function importSummaryLorebook(chatId: string, userId: string, raw: unknown): Promise<number> {
  const rows = parseSummaryLorebook(raw);
  const existing = await listLmbEntries(chatId, userId);
  const before = Math.min(0, ...existing.filter((e) => e.meta.isRoot).map((e) => e.meta.firstMsgIdx ?? 0));
  const book = await ensureBookForChat(chatId, userId);
  const created: string[] = [];
  try {
    for (const [i, row] of rows.entries()) {
      const at = before - rows.length + i;
      const entry = await createChapterEntry(book.id, {
        tier: row.tier, chatId, msgIds: [], sourceChapterEntryIds: [], isRoot: true,
        firstMsgIdx: at, lastMsgIdx: at, tokenCountInput: 0,
        tokenCountOutput: approximateTokensFromChars(row.content.length),
        model: "", connectionId: "", createdAt: Date.now(), title: row.comment,
      }, row.content, row.comment.startsWith("[Root]") ? row.comment : `[Root] ${row.comment}`, userId, row.keys, true);
      created.push(entry.id);
    }
  } catch (err) {
    const rollback = await Promise.allSettled(created.map((id) => deleteEntry(id, userId)));
    if (rollback.some((r) => r.status === "rejected")) throw new Error("Import failed and some imported roots could not be removed; inspect Books before retrying", { cause: err });
    throw err;
  } finally { invalidateBookCache(userId, chatId); }
  return created.length;
}

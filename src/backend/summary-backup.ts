import { approximateTokensFromChars, type SummaryTier } from "../shared";
import { buildCoverage } from "./coverage";
import { createChapterEntry, deleteEntry, ensureBookForChat, invalidateBookCache, listLmbEntries, type LMBEntry } from "./world-book";
import { hashRawMessages, makeFingerprint, parseFingerprint, type SummaryFingerprint, type RawSummaryMessage } from "./summary-matching";

declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

const EXPORT_KEY = "lumibooks_summary";
export function summaryLorebook(entries: LMBEntry[], name: string, fingerprint?: SummaryFingerprint, coverage?: Map<string, number[]>) {
  return { name, description: "LumiBooks summaries. Import through Books to restore message coverage or use as inherited roots.",
    ...(fingerprint ? { extensions: { [EXPORT_KEY]: fingerprint } } : {}),
    entries: Object.fromEntries(entries.filter((e) => !e.meta.ghost).map((e, i) => [i, {
      uid: i, key: e.raw.key ?? [], keysecondary: [], content: e.raw.content,
      comment: e.raw.comment || e.meta.title || `Summary ${i + 1}`, constant: true, disable: false,
      position: 0, order: i, displayIndex: i,
      extensions: { [EXPORT_KEY]: { tier: e.meta.tier, ...(coverage ? { messageIndices: coverage.get(e.raw.id) ?? [] } : {}) } },
    }])) };
}
export async function exportSummaryLorebook(chatId: string, userId: string, progress?: (text: string) => void) {
  const coverage = await buildCoverage(chatId, userId);
  const entries = coverage.activeEntries.slice().sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (!entries.length) throw new Error("There are no active summaries to export");
  progress?.("Fetching raw chat messages…");
  const messages = await spindle.chat.getMessages(chatId);
  const positions = new Map(messages.map((m, i) => [m.id, i]));
  const byEntry = new Map<string, number[]>();
  for (const e of entries) {
    // Roots from another chat have no local source text to fingerprint.
    const ids = new Set(e.meta.msgIds);
    if ([...ids].some((id) => !positions.has(id))) continue;
    byEntry.set(e.raw.id, [...ids].flatMap((id) => positions.has(id) ? [positions.get(id)!] : []).sort((a, b) => a - b));
  }
  for (const [messageId, entryId] of coverage.coveredBy) {
    const at = positions.get(messageId), indices = byEntry.get(entryId);
    if (at !== undefined && indices) indices.push(at);
  }
  for (const [id, indices] of byEntry) byEntry.set(id, [...new Set(indices)].sort((a, b) => a - b));
  const indices = [...new Set([...byEntry.values()].flat())].sort((a, b) => a - b);
  const hashes = await hashRawMessages(indices.map((i) => messages[i]!), (done) => progress?.(`Hashing raw messages… ${done} / ${indices.length}`));
  const fingerprint = await makeFingerprint(indices.map((index, i) => ({ index, hash: hashes[i]! })));
  return summaryLorebook(entries, `LumiBooks summaries - ${chatId.slice(0, 8)}`, fingerprint, byEntry);
}
export interface ImportedSummary { content: string; comment: string; keys: string[]; tier: SummaryTier; messageIndices?: number[] }
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
    const messageIndices = v.extensions?.[EXPORT_KEY]?.messageIndices;
    if (messageIndices !== undefined && (!Array.isArray(messageIndices) || messageIndices.length > 1_000_000
        || messageIndices.some((n: unknown) => !Number.isSafeInteger(n) || (n as number) < 0))) throw new Error("Invalid summary coverage indices");
    const keys = v.key ?? v.keys;
    out.push({ content: v.content, comment: typeof v.comment === "string" ? v.comment : typeof v.name === "string" ? v.name : "Imported summary",
      keys: Array.isArray(keys) ? keys.filter((k): k is string => typeof k === "string") : [],
      tier: Number.isInteger(tier) && tier >= 1 && tier <= 7 ? tier : 1,
      ...(messageIndices !== undefined ? { messageIndices: [...new Set<number>(messageIndices)].sort((a, b) => a - b) } : {}) });
  }
  if (!out.length) throw new Error("The lorebook has no enabled summaries");
  return out;
}
export async function readSummaryImport(raw: unknown) {
  const rows = parseSummaryLorebook(raw);
  const fingerprint = await parseFingerprint((raw as any).extensions?.[EXPORT_KEY]);
  if (fingerprint) {
    const indices = new Set(fingerprint.messages.map((m) => m.index));
    for (const row of rows) {
      if (!row.messageIndices || row.messageIndices.some((i) => !indices.has(i))) throw new Error("The summary coverage does not match its fingerprint");
    }
    // Disabled/deleted summaries should not cause their messages to be linked.
    const used = new Set(rows.flatMap((r) => r.messageIndices!));
    return { rows, fingerprint: await makeFingerprint(fingerprint.messages.filter((m) => used.has(m.index))) };
  }
  return { rows, fingerprint };
}

export interface SummaryImportLinks { messages: readonly RawSummaryMessage[]; indices: number[][] }

/** No links means an ordinary lorebook root. Confirmed links use destination
 * IDs and normal tiers so coverage, binding, release and forks behave normally. */
export async function importSummaryLorebook(chatId: string, userId: string, raw: unknown, links?: SummaryImportLinks): Promise<number> {
  const rows = parseSummaryLorebook(raw);
  return saveImportedSummaries(chatId, userId, rows, links);
}

export async function saveImportedSummaries(chatId: string, userId: string, rows: ImportedSummary[], links?: SummaryImportLinks): Promise<number> {
  if (links && (links.indices.length !== rows.length || links.indices.some((indices) => indices.some((i) => !Number.isInteger(i) || !links.messages[i])))) throw new Error("Invalid destination coverage");
  const existing = await listLmbEntries(chatId, userId);
  const before = Math.min(0, ...existing.filter((e) => e.meta.isRoot).map((e) => e.meta.firstMsgIdx ?? 0));
  const book = await ensureBookForChat(chatId, userId);
  const created: string[] = [];
  try {
    for (const [i, row] of rows.entries()) {
      const at = before - rows.length + i;
      const indices = links?.indices[i] ?? [];
      const isRoot = indices.length === 0;
      const comment = isRoot ? (row.comment.startsWith("[Root]") ? row.comment : `[Root] ${row.comment}`) : row.comment.replace(/^\[Root\]\s*/, "");
      const entry = await createChapterEntry(book.id, {
        tier: row.tier, chatId, msgIds: indices.map((index) => links!.messages[index]!.id), sourceChapterEntryIds: [], isRoot,
        firstMsgIdx: indices[0] ?? at, lastMsgIdx: indices.at(-1) ?? at, tokenCountInput: 0,
        tokenCountOutput: approximateTokensFromChars(row.content.length),
        model: "", connectionId: "", createdAt: Date.now(), title: row.comment,
      }, row.content, comment, userId, row.keys, true);
      created.push(entry.id);
    }
  } catch (err) {
    const rollback = await Promise.allSettled(created.map((id) => deleteEntry(id, userId)));
    if (rollback.some((r) => r.status === "rejected")) throw new Error("Import failed and some imported summaries could not be removed; inspect Books before retrying", { cause: err });
    throw err;
  } finally { invalidateBookCache(userId, chatId); }
  return created.length;
}

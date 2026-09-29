declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { SummaryImportChoice, SummaryTransferStatus } from "../summary-transfer";
import { exportSummaryLorebook, readSummaryImport, saveImportedSummaries, type ImportedSummary } from "./summary-backup";
import { automaticMessageMatch, exactMessageMatch, hashRawMessages, type SummaryFingerprint } from "./summary-matching";
import { send, describeError, warn } from "./runtime";
import { buildCoverage } from "./coverage";

interface Transfer {
  status: SummaryTransferStatus;
  rows?: ImportedSummary[];
  fingerprint?: SummaryFingerprint | null;
  running: boolean;
}
const transfers = new Map<string, Transfer>();
const key = (userId: string, chatId: string) => JSON.stringify([userId, chatId]);
export function getSummaryTransfer(userId: string, chatId: string): SummaryTransferStatus | null {
  return transfers.get(key(userId, chatId))?.status ?? null;
}

function update(userId: string, transfer: Transfer, stage: SummaryTransferStatus["stage"], text: string, extra: Partial<SummaryTransferStatus> = {}) {
  transfer.status = { ...transfer.status, ...extra, stage, text };
  try { send({ type: "summary_transfer_status", status: transfer.status }, userId); }
  catch (err) { warn(`summary transfer progress delivery failed: ${describeError(err)}`); }
}

export async function runSummaryTransfer(userId: string, chatId: string, request:
  { type: "export" } | { type: "import"; raw: unknown } | { type: "resolve"; id: string; choice: SummaryImportChoice; through?: number },
): Promise<boolean> {
  const k = key(userId, chatId);
  let transfer = transfers.get(k);
  if (request.type === "resolve") {
    if (!transfer || transfer.status.id !== request.id) throw new Error("This import is no longer available. Choose the file again.");
    if (transfer.running) return false;
    if (request.choice === "cancel") {
      transfers.delete(k);
      send({ type: "summary_transfer_status", status: { ...transfer.status, stage: "cancelled", text: "Import cancelled" } }, userId);
      return false;
    }
    if (!transfer.rows) return false;
  } else {
    if (transfer?.running || transfer?.rows) {
      send({ type: "summary_transfer_status", status: transfer.status }, userId);
      return false;
    }
    transfer = { status: { id: crypto.randomUUID(), chatId, stage: "working", text: "Reading summaries…" }, running: false };
    if (transfers.size >= 200) {
      for (const [oldKey, old] of transfers) {
        if (!old.running && !old.rows) transfers.delete(oldKey);
        if (transfers.size < 200) break;
      }
    }
    transfers.set(k, transfer);
  }
  const t = transfer!;
  t.running = true;
  let lastProgress = 0;
  const progress = (text: string) => {
    if (Date.now() - lastProgress < 150) return;
    lastProgress = Date.now(); update(userId, t, "working", text);
  };
  update(userId, t, "working", request.type === "export" ? "Preparing summary export…" : "Reading raw chat messages…");
  try {
    if (request.type === "export") {
      const data = await exportSummaryLorebook(chatId, userId, progress);
      send({ type: "summary_export_data", chatId, filename: `lumibooks-summaries-${chatId.slice(0, 8)}.json`, content: JSON.stringify(data, null, 2) }, userId);
      update(userId, t, "done", "Summary export ready");
      return false;
    }
    if (request.type === "import") {
      const parsed = await readSummaryImport(request.raw);
      t.rows = parsed.rows; t.fingerprint = parsed.fingerprint;
    }
    const rows = t.rows!;
    const messages = await spindle.chat.getMessages(chatId);
    const source = t.fingerprint;
    t.status = { ...t.status, messageCount: messages.length, sourceCount: source?.messages.length ?? 0 };
    const manual = (text = "Up until which message should these summaries cover?") => {
      update(userId, t, "manual", text); return false;
    };
    if (request.type === "resolve" && request.choice === "specify") return manual();
    let indices = rows.map(() => [] as number[]);
    let importedRows = rows;
    if (request.type === "resolve" && request.choice === "manual") {
      if (!Number.isSafeInteger(request.through) || request.through! < 0 || request.through! > messages.length) return manual("Enter a whole message number from 0 to " + messages.length + ".");
      if (request.through! > 0) {
        // The user supplies only the bundle's endpoint, not per-entry bounds.
        // Keep it atomic rather than inventing ranges that could let a fork
        // inherit prose from messages beyond its branch point.
        importedRows = [{ content: rows.map((r) => r.content).join("\n\n"), comment: rows.length === 1 ? rows[0]!.comment : "Imported summaries",
          keys: [...new Set(rows.flatMap((r) => r.keys))], tier: Math.max(...rows.map((r) => r.tier)) as ImportedSummary["tier"] }];
        indices = [Array.from({ length: request.through! }, (_, i) => i)];
      }
    } else if (source?.messages.length) {
      if (messages.length < source.messages.length) return manual();
      const relocate = request.type === "resolve" && request.choice === "match";
      const selected = relocate ? messages : source.messages.flatMap((m) => messages[m.index] ? [messages[m.index]!] : []);
      const computed = await hashRawMessages(selected, (done) => progress(`Comparing raw messages… ${done} / ${selected.length}`));
      const hashes = relocate ? computed : new Array<string>(messages.length);
      if (!relocate && computed.length === source.messages.length) source.messages.forEach((m, i) => { hashes[m.index] = computed[i]!; });
      const matched = exactMessageMatch(source, hashes)
        ?? (relocate ? automaticMessageMatch(source, hashes) : null);
      if (!matched) {
        if (request.type === "resolve" && request.choice === "match") return manual("Automatic matching was incomplete or ambiguous. Up until which message should these summaries cover?");
        update(userId, t, "mismatch", "The content of this chat is different to the one encoded by the imported summary. Attempt automatic matching?");
        return false;
      }
      const mapping = new Map(source.messages.map((m, i) => [m.index, matched[i]!]));
      indices = rows.map((r) => (r.messageIndices ?? []).map((i) => mapping.get(i)!));
    }
    const linkedIds = new Set(indices.flat().map((i) => messages[i]!.id));
    if (linkedIds.size) {
      const coverage = await buildCoverage(chatId, userId);
      if ([...linkedIds].some((id) => coverage.coveredBy.has(id))) throw new Error("Some of these messages already have summaries. Release those summaries in Books before importing this coverage.");
      // The user may edit/switch swipes while hashing a large history. Do not
      // commit a mapping calculated from an obsolete snapshot.
      const current = await spindle.chat.getMessages(chatId);
      for (const at of new Set(indices.flat())) {
        const before = messages[at]!, now = current[at];
        if (!now || now.id !== before.id || now.role !== before.role || now.content !== before.content) {
          t.status.messageCount = current.length;
          return manual("The chat changed while preparing the import. Up until which message should these summaries cover?");
        }
      }
    }
    update(userId, t, "working", "Saving imported summaries…");
    await saveImportedSummaries(chatId, userId, importedRows, { messages, indices });
    t.rows = undefined; t.fingerprint = undefined;
    update(userId, t, "done", `Imported ${rows.length} summaries${linkedIds.size ? ` covering ${linkedIds.size} messages` : " as root memories"}`);
    return true;
  } catch (err) {
    update(userId, t, "error", describeError(err));
    return false;
  } finally { t.running = false; }
}

import { t as tr } from "../../i18n";
import { snapshotCodexForUndo } from "./backup";
import { checkIntegrity, restoreMissingEntities, type CodexFileKey } from "./schema";
import { loadCodex, loadCursor, saveCodexFile } from "./store";

/** Caller holds the chat's Codex busy guard. No generation or cursor rewind. */
export async function repairCodexReferences(chatId: string, userId: string, fallbackMode: boolean): Promise<CodexFileKey[]> {
  const cursor = await loadCursor(chatId, userId);
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: cursor.relationsTableMode ?? fallbackMode });
  if (problems.length) throw new Error(tr("codexRepair.unreadable", { files: problems.map(p => `${p.file}.json`).join(", ") }));
  const changed = restoreMissingEntities(bundle);
  const remaining = checkIntegrity(bundle);
  if (remaining.length) throw new Error(remaining.join("\n"));
  if (!changed.length) return [];
  await snapshotCodexForUndo(chatId, userId, "repair references", true);
  for (const file of changed) await saveCodexFile(chatId, file, bundle[file], userId);
  return changed;
}

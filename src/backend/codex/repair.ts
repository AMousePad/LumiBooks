import { t as tr } from "../../i18n";
import { snapshotCodexForUndo } from "./backup";
import { checkIntegrity, pruneDanglingReferences, type CodexBundle, type CodexEntityFile, type CodexFileKey, type CodexFileValue } from "./schema";
import { loadCodex, loadCursor, saveCodexFile, saveCursor, withCursorLock } from "./store";
import { describeError, warn } from "../runtime";
import { renderCodexRecords } from "./prompt";

async function saveChangedFiles(chatId: string, userId: string, before: CodexBundle, after: CodexBundle, changed: CodexFileKey[], reason: string): Promise<void> {
  await snapshotCodexForUndo(chatId, userId, reason, true);
  const survivingRecords = new Set(renderCodexRecords(after, { includeRelations: true }).map(record => record.record));
  const removedRecords = renderCodexRecords(before, { includeRelations: true }).map(record => record.record).filter(record => !survivingRecords.has(record));
  let discardedBefore: string[] | undefined;
  if (removedRecords.length) {
    await withCursorLock(chatId, userId, async () => {
      const cursor = await loadCursor(chatId, userId);
      discardedBefore = cursor.discardedRecords;
      cursor.discardedRecords = [...new Set([...(cursor.discardedRecords ?? []), ...removedRecords])];
      await saveCursor(chatId, cursor, userId);
    });
  }
  const attempted: CodexFileKey[] = [];
  try {
    for (const file of changed) {
      attempted.push(file);
      await saveCodexFile(chatId, file, after[file], userId);
    }
  } catch (error) {
    for (const file of attempted.reverse()) {
      try { await saveCodexFile(chatId, file, before[file], userId); }
      catch (rollbackError) { warn(`Codex reference cleanup rollback failed for ${file}: ${describeError(rollbackError)}`); }
    }
    if (removedRecords.length) {
      try {
        await withCursorLock(chatId, userId, async () => {
          const cursor = await loadCursor(chatId, userId);
          if (discardedBefore) cursor.discardedRecords = discardedBefore;
          else delete cursor.discardedRecords;
          await saveCursor(chatId, cursor, userId);
        });
      } catch (rollbackError) { warn(`Codex deletion intent rollback failed: ${describeError(rollbackError)}`); }
    }
    throw error;
  }
}

/** Caller holds the chat's Codex busy guard. No generation or cursor rewind. */
export async function repairCodexReferences(chatId: string, userId: string, fallbackMode: boolean): Promise<CodexFileKey[]> {
  const cursor = await loadCursor(chatId, userId);
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: cursor.relationsTableMode ?? fallbackMode });
  if (problems.length) throw new Error(tr("codexRepair.unreadable", { files: problems.map(p => `${p.file}.json`).join(", ") }));
  const before = structuredClone(bundle);
  const changed = pruneDanglingReferences(bundle);
  const remaining = checkIntegrity(bundle);
  if (remaining.length) throw new Error(remaining.join("\n"));
  if (!changed.length) return [];
  await saveChangedFiles(chatId, userId, before, bundle, changed, "repair references");
  return changed;
}

/** Caller holds the Codex busy guard and has validated the user's file edit. */
export async function saveCodexEdit(chatId: string, userId: string, file: CodexFileKey, value: CodexFileValue, relationsTable: boolean): Promise<CodexFileKey[]> {
  if (file !== "characters" && file !== "locations" && file !== "things") {
    await saveCodexFile(chatId, file, value, userId);
    return [file];
  }
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable });
  const kept = new Set((value as CodexEntityFile).entities.map(entity => entity.id));
  const removed = new Set(bundle[file].entities.filter(entity => !kept.has(entity.id)).map(entity => entity.id));
  if (!removed.size) {
    await saveCodexFile(chatId, file, value, userId);
    return [file];
  }
  if (problems.length) throw new Error(tr("codexRepair.unreadable", { files: problems.map(p => `${p.file}.json`).join(", ") }));
  const before = structuredClone(bundle);
  bundle[file] = value as CodexEntityFile;
  const changed = [...pruneDanglingReferences(bundle, removed), file];
  await saveChangedFiles(chatId, userId, before, bundle, changed, "delete entity");
  return changed;
}

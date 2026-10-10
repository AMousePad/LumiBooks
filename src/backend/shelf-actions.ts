import { buildCoverage, unhideCoveredMessages } from "./coverage";
import { deleteEntry, invalidateBookCache, listLmbEntries, patchEntryMeta, releaseEntry, type LMBEntry } from "./world-book";
import { withCommitMutex } from "./summary-commit";
import { describeError, warn } from "./runtime";

export async function removeSummaryEntry(chatId: string, entryId: string, userId: string, release = false): Promise<LMBEntry | null> {
  return withCommitMutex(userId, chatId, async () => {
    const entries = await listLmbEntries(chatId, userId, true);
    const entry = entries.find((e) => e.raw.id === entryId);
    if (!entry) return null;
    if (release && entry.meta.ghost) throw new Error("A ghost chapter must be shelved before it can be released.");
    const before = await buildCoverage(chatId, userId, entries);
    const parents = entries.filter((e) => e.meta.tier > entry.meta.tier && e.meta.sourceChapterEntryIds?.includes(entryId));
    try {
      // Preserve the path to lower summaries before removing an intermediate
      // node. Keep the old edge until deletion succeeds: a failed delete must
      // not make the intermediate summary active alongside its parent.
      for (const parent of parents) {
        const patch = {
          sourceChapterEntryIds: [...new Set([...(parent.meta.sourceChapterEntryIds ?? []), ...(entry.meta.sourceChapterEntryIds ?? [])])],
          msgIds: [...new Set([...parent.meta.msgIds, ...entry.meta.msgIds])],
        };
        await patchEntryMeta(parent, patch, userId);
        parent.meta = { ...parent.meta, ...patch };
      }
      if (release) await releaseEntry(entry, userId);
      else await deleteEntry(entryId, userId);
      for (const parent of parents) {
        await patchEntryMeta(parent, { sourceChapterEntryIds: parent.meta.sourceChapterEntryIds!.filter((id) => id !== entryId) }, userId)
          .catch((err) => warn(`removed summary reference cleanup failed: ${describeError(err)}`));
      }
      for (const source of entries) {
        if (source.meta.supersededByEntryId !== entryId) continue;
        const parent = parents.find((p) => !p.raw.disabled);
        await patchEntryMeta(source, { supersededByEntryId: parent?.raw.id ?? null }, userId)
          .catch((err) => warn(`removed summary backlink cleanup failed: ${describeError(err)}`));
      }
    } finally { invalidateBookCache(userId, chatId); }
    const after = await buildCoverage(chatId, userId);
    const uncovered = [...before.coveredBy.keys()].filter((id) => !after.coveredBy.has(id));
    await unhideCoveredMessages(chatId, uncovered, userId);
    return entry;
  });
}

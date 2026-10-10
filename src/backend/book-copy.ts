declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { WorldBookEntryDTO } from "lumiverse-spindle-types";
import type { LMBEntryMeta } from "../shared";
import { EXTENSION_KEY } from "../shared";
import type { LMBEntry } from "./world-book";
import { describeError, warn } from "./runtime";


export interface CopyOverride {
  msgIds: string[];
  firstMsgIdx?: number;
  lastMsgIdx?: number;
  extra?: Partial<LMBEntryMeta>;
  comment?: string;
}

export interface CopyCtx {
  idMap: Map<string, string>;
  /** Meta of every cloned entry (chapters and arcs), keyed by the OLD entry id. */
  clonedMeta: Map<string, LMBEntryMeta>;
}

export type CopyTransform = (entry: LMBEntry, ctx: CopyCtx) => CopyOverride | null;

export async function copyLmbEntries(
  targetBookId: string,
  sourceEntries: LMBEntry[],
  userId: string,
  transform: CopyTransform,
): Promise<Map<string, string>> {
  const createdIds: string[] = [];
  try {
    return await copyEntries(targetBookId, sourceEntries, userId, transform, createdIds);
  } catch (err) {
    // Rebase copies into an existing book. Undo only entries from this attempt,
    // so an interrupted copy cannot leave duplicate active roots on retry.
    for (const id of createdIds.reverse()) {
      try { await spindle.world_books.entries.delete(id, userId); }
      catch (cleanupError) {
        warn(`copy rollback could not delete an entry: ${describeError(cleanupError)}`);
        try { await spindle.world_books.entries.update(id, { disabled: true }, userId); }
        catch (disableError) { warn(`copy rollback could not disable an entry: ${describeError(disableError)}`); }
      }
    }
    throw err;
  }
}

async function copyEntries(
  targetBookId: string,
  sourceEntries: LMBEntry[],
  userId: string,
  transform: CopyTransform,
  createdIds: string[],
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  const clonedMeta = new Map<string, LMBEntryMeta>();
  const ctx: CopyCtx = { idMap, clonedMeta };
  const chapters = sourceEntries.filter((e) => e.meta.tier === 1);
  const groups = [2, 3, 4, 5, 6, 7].map((tier) => sourceEntries.filter((e) => e.meta.tier === tier));

  for (const ch of chapters) {
    const o = transform(ch, ctx);
    if (!o) continue;
    const meta: LMBEntryMeta = {
      ...ch.meta,
      msgIds: o.msgIds,
      firstMsgIdx: o.firstMsgIdx,
      lastMsgIdx: o.lastMsgIdx,
      supersededByEntryId: null,
      ...o.extra,
    };
    const created = await createClone(targetBookId, ch.raw, meta, userId, o.comment);
    createdIds.push(created.id);
    idMap.set(ch.raw.id, created.id);
    clonedMeta.set(ch.raw.id, meta);
  }

  // Arcs after chapters, volumes after arcs, so each pass can remap its
  // source ids (sourceChapterEntryIds) through the ids cloned before it.
  for (const group of groups) {
    for (const entry of group) {
      const o = transform(entry, ctx);
      if (!o) continue;
      const sourceChapterEntryIds = (entry.meta.sourceChapterEntryIds ?? [])
        .map((oldId) => idMap.get(oldId))
        .filter((x): x is string => typeof x === "string");
      const meta: LMBEntryMeta = {
        ...entry.meta,
        msgIds: o.msgIds,
        sourceChapterEntryIds,
        firstMsgIdx: o.firstMsgIdx,
        lastMsgIdx: o.lastMsgIdx,
        supersededByEntryId: null,
        ...o.extra,
      };
      const created = await createClone(targetBookId, entry.raw, meta, userId, o.comment);
      createdIds.push(created.id);
      idMap.set(entry.raw.id, created.id);
      clonedMeta.set(entry.raw.id, meta);
    }
  }

  // Re-point supersededByEntryId on every cloned entry whose old superseder
  // was also cloned: chapters point at their new arc, arcs at their new volume.
  for (const src of sourceEntries) {
    const newId = idMap.get(src.raw.id);
    if (!newId) continue;
    const oldSuperId = src.meta.supersededByEntryId;
    if (!oldSuperId) continue;
    const newSuperId = idMap.get(oldSuperId);
    if (!newSuperId) continue;
    const baseMeta = clonedMeta.get(src.raw.id);
    if (!baseMeta) continue;
    const ext = (src.raw.extensions || {}) as Record<string, unknown>;
    try {
      await spindle.world_books.entries.update(
        newId,
        { extensions: { ...ext, [EXTENSION_KEY]: { ...baseMeta, supersededByEntryId: newSuperId } } },
        userId,
      );
    } catch (err) {
      warn(`copyLmbEntries: failed to re-point entry ${newId.slice(0, 8)}: ${describeError(err)}`);
    }
  }

  return idMap;
}

async function createClone(
  bookId: string,
  source: WorldBookEntryDTO,
  meta: LMBEntryMeta,
  userId: string,
  commentOverride?: string,
): Promise<WorldBookEntryDTO> {
  const ext = (source.extensions || {}) as Record<string, unknown>;
  return spindle.world_books.entries.create(
    bookId,
    {
      content: source.content,
      comment: commentOverride ?? source.comment,
      disabled: source.disabled,
      constant: source.constant,
      key: source.key ?? [],
      keysecondary: source.keysecondary ?? [],
      vectorized: source.vectorized ?? false,
      extensions: { ...ext, [EXTENSION_KEY]: meta },
    },
    userId,
  );
}

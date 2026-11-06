import { describeError } from "./runtime";

type BatchResult = { ok: true; result: unknown } | { ok: false; error: string };
// lumiverse-spindle-types does not declare spindle.batch; the host has had it since before our minimum version 1.2.5.
declare const spindle: import("lumiverse-spindle-types").SpindleAPI & {
  batch(ops: Array<{ domain: string; op: string; args: unknown }>, options?: { userId?: string }): Promise<BatchResult[]>;
};

/** Host limits are 64 ops and 1 MiB per batch; the byte cap leaves room for the envelope. */
const MAX_OPS = 64;
const MAX_BYTES = 900_000;

export type EntryUpdate = { id: string; input: Record<string, unknown> };

/** One host call per chunk instead of one per entry. A chunk rolls back as a whole, so a failed chunk
 * is retried entry by entry to find which entries actually fail. */
export async function updateEntriesBatched(updates: EntryUpdate[], userId: string): Promise<Array<{ id: string; error: string }>> {
  const failures: Array<{ id: string; error: string }> = [];
  for (const chunk of chunkUpdates(updates)) {
    const results = await spindle.batch(chunk.map(({ id, input }) => ({ domain: "world_books", op: "entries.update", args: { id, input } })), { userId });
    if (results.every((r) => r.ok)) continue;
    for (const update of chunk) {
      try { await spindle.world_books.entries.update(update.id, update.input, userId); }
      catch (err) { failures.push({ id: update.id, error: describeError(err) }); }
    }
  }
  return failures;
}

function chunkUpdates(updates: EntryUpdate[]): EntryUpdate[][] {
  const chunks: EntryUpdate[][] = [];
  let chunk: EntryUpdate[] = [];
  let bytes = 0;
  for (const update of updates) {
    const size = new TextEncoder().encode(JSON.stringify(update)).byteLength;
    if (chunk.length && (chunk.length >= MAX_OPS || bytes + size > MAX_BYTES)) {
      chunks.push(chunk);
      chunk = [];
      bytes = 0;
    }
    chunk.push(update);
    bytes += size;
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}

import { describeError } from "./runtime";

type BatchResult = { ok: true; result: unknown } | { ok: false; error: string };
// spindle.batch is missing from lumiverse-spindle-types.
declare const spindle: import("lumiverse-spindle-types").SpindleAPI & {
  batch(ops: Array<{ domain: string; op: string; args: unknown }>, options?: { userId?: string }): Promise<BatchResult[]>;
};

// The host caps a batch at 64 ops and 1 MiB.
const MAX_OPS = 64;
const MAX_BYTES = 900_000;

export type EntryUpdate = { id: string; input: Record<string, unknown> };

export async function updateEntriesBatched(updates: EntryUpdate[], userId: string): Promise<Array<{ id: string; error: string }>> {
  const failures: Array<{ id: string; error: string }> = [];
  for (const chunk of chunkUpdates(updates)) {
    const results = await spindle.batch(chunk.map(({ id, input }) => ({ domain: "world_books", op: "entries.update", args: { id, input } })), { userId });
    if (results.every((r) => r.ok)) continue;
    // The host rolled the whole chunk back, so retry its entries one by one.
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

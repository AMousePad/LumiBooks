export async function fakeBatch(ops: Array<{ args: { id: string; input: Record<string, unknown> } }>, options?: { userId?: string }) {
  const host = (globalThis as any).spindle;
  try {
    const results = [];
    for (const op of ops) results.push({ ok: true as const, result: await host.world_books.entries.update(op.args.id, op.args.input, options?.userId) });
    return results;
  } catch (err) {
    return ops.map(() => ({ ok: false as const, error: `BATCH_ROLLED_BACK: ${err instanceof Error ? err.message : String(err)}` }));
  }
}

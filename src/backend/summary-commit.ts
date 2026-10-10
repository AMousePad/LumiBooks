const commitChain = new Map<string, Promise<unknown>>();

/** Serialize shelf writes across generation, previews, and imports. Model
 * calls and import parsing remain concurrent; validate sources inside this lock. */
export function withCommitMutex<T>(userId: string, chatId: string, fn: () => Promise<T>): Promise<T> {
  const key = JSON.stringify([userId, chatId]);
  const previous = commitChain.get(key) ?? Promise.resolve();
  const result = previous.then(fn, fn);
  const guarded = result.catch(() => undefined);
  commitChain.set(key, guarded);
  void guarded.then(() => {
    if (commitChain.get(key) === guarded) commitChain.delete(key);
  });
  return result;
}

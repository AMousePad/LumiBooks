/** Share warning history across sync and activation, using stable Codex record IDs. */
export function createCodexCutWarning(notify: (userId: string, chatId: string) => void) {
  const chats = new Map<string, Set<string>>();
  return (userId: string, chatId: string, cut: readonly string[], previousCut: readonly string[] = []): void => {
    if (!cut.length && !previousCut.length) return;
    const key = `${userId}::${chatId}`;
    let seen = chats.get(key);
    if (!seen) {
      if (chats.size >= 500) chats.delete(chats.keys().next().value!);
      seen = new Set();
    }
    // Refresh this chat's position without clearing every other chat at the cap.
    chats.delete(key);
    chats.set(key, seen);
    // Existing manifest cuts were already announced before a worker restart.
    for (const record of previousCut) seen.add(record);
    const hasNew = cut.some(record => !seen.has(record));
    for (const record of cut) seen.add(record);
    if (hasNew) notify(userId, chatId);
  };
}

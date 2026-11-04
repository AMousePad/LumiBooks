import { CACHE_FRIENDLY_FROZEN_FILES, type CodexFileKey } from "../../shared";
import { applyCodexFileState, loadCursor, saveCursor, withCursorLock, type CodexFileState } from "./store";

// An inline migration must still read relations, so the mode unfreezes that file.
const MANAGED: readonly CodexFileKey[] = [...CACHE_FRIENDLY_FROZEN_FILES, "relations"];
const wanted = (file: CodexFileKey): CodexFileState => CACHE_FRIENDLY_FROZEN_FILES.includes(file) ? "frozen" : "on";

/** Keep each chat's switches on the mode's values, and hand back the user's on exit. */
export async function alignCacheFileStates(chatId: string, userId: string, on: boolean): Promise<void> {
  await withCursorLock(chatId, userId, async () => {
    const cursor = await loadCursor(chatId, userId);
    if (!on) {
      if (!cursor.cacheSavedStates) return;
      for (const file of MANAGED) applyCodexFileState(cursor, file, cursor.cacheSavedStates[file] ?? "on");
      delete cursor.cacheSavedStates;
      await saveCursor(chatId, cursor, userId);
      return;
    }
    const current = (file: CodexFileKey): CodexFileState => cursor.fileStates[file] ?? "on";
    if (cursor.cacheSavedStates && MANAGED.every((file) => current(file) === wanted(file))) return;
    if (!cursor.cacheSavedStates) {
      cursor.cacheSavedStates = Object.fromEntries(MANAGED.filter((file) => current(file) !== "on").map((file) => [file, current(file)]));
    }
    for (const file of MANAGED) applyCodexFileState(cursor, file, wanted(file));
    await saveCursor(chatId, cursor, userId);
  });
}

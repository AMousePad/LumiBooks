import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, makeDefaultProfile, normalizeEntryMeta } from "../src/shared";
import type { FrontendToBackend } from "../src/types";

/** Exercise the Compose -> worker -> provider -> SQLite path with real ghosts. */
export async function runGhostScenarios(h: {
  api(path: string, method?: string, body?: unknown): Promise<any>;
  action(payload: FrontendToBackend, predicate?: (state: any) => boolean): Promise<any>;
  send(payload: FrontendToBackend): void;
  until(label: string, read: () => Promise<any>, valid: (value: any) => boolean): Promise<any>;
  pass(name: string): void;
  characterId: string;
  connectionId: string;
  requests: any[];
}) {
  const { api, action, send, until, pass, characterId, connectionId, requests } = h;
  for (const preview of [false, true]) {
    const chat = await api("/api/v1/chats", "POST", { character_id: characterId, name: `Manual ghosts ${preview}` });
    const chatId = chat.id;
    const profile = { ...makeDefaultProfile("default", "Ghost integration"), connectionId,
      autoCreate: false, autoCreateChapter: false, autoCreateArc: false, codexEnabled: false,
      codexExtraContext: true, lagValue: 65, codexLagValue: 6, windowValue: 18, previousMemoriesCount: 0, retryCount: 0 };
    await action({ type: "save_settings", chatId, patch: { ...DEFAULT_SETTINGS, profiles: [profile] } });
    const messages: any[] = [];
    for (let i = 0; i < 100; i++) messages.push(await api(`/api/v1/chats/${chatId}/messages`, "POST", {
      name: "User", is_user: true, content: `GHOST_SOURCE_${i}_END`,
    }));
    let state = await action({ type: "create_chapter_range", chatId, messageIds: messages.slice(0, 18).map((m) => m.id) },
      (s) => s.activeChatId === chatId && s.chapters.length === 1 && !s.busy.length);
    for (const [i, start] of [18, 36, 54, 72].entries()) {
      await api(`/api/v1/world-books/${state.bookId}/entries`, "POST", {
        comment: `Staged chapter ${i + 2}`, content: `GHOST_SUMMARY_${i}`, disabled: true,
        extensions: { lumibooks: normalizeEntryMeta({ tier: 1, chatId, ghost: true, sceneNumber: i + 2,
          msgIds: messages.slice(start, start + 18).map((m) => m.id), firstMsgIdx: start, lastMsgIdx: start + 17 }) },
      });
    }
    await action({ type: "save_profile", chatId, profile: { ...profile, codexEnabled: true, showMemoryPreviews: preview } },
      (s) => s.activeChatId === chatId && s.activeProfile.codexEnabled);
    // REST fixture writes do not invalidate the extension's entry cache.
    state = await until("staged ghost fixture visible", () => action({ type: "refresh", chatId }),
      (s) => s.activeChatId === chatId && s.messages.filter((m: any) => m.staged).length === 72);
    assert.equal(state.messages.filter((m: any) => m.covered).length, 18);
    assert(state.messages.filter((m: any) => m.staged).every((m: any) => !m.covered && !m.hidden));
    const start = preview ? 20 : 36;
    const selected = messages.slice(start).map((m) => m.id);
    const beforeRequests = requests.length;
    state = await action({ type: "create_chapter_range", chatId, messageIds: selected },
      (s) => s.activeChatId === chatId && !s.busy.length && (preview ? s.pendingPreviews.length === 1 : s.chapters.some((e: any) => !e.isGhost && e.meta.msgIds.length === selected.length)));
    if (preview) {
      assert.equal(state.chapters.filter((e: any) => e.isGhost).length, 4);
      const draftId = state.pendingPreviews[0].draftId;
      // Edits are deliberately silent; the frontend owns its local draft.
      send({ type: "edit_preview", chatId, draftId, patch: { content: "Reviewed ghost replacement" } });
      await action({ type: "refresh", chatId }, (s) => s.pendingPreviews.some((p: any) => p.draftId === draftId && p.content === "Reviewed ghost replacement"));
      state = await action({ type: "accept_preview", chatId, draftId },
        (s) => s.activeChatId === chatId && !s.pendingPreviews.length && s.chapters.some((e: any) => !e.isGhost && e.meta.msgIds.length === selected.length));
    }
    assert.equal(requests.length - beforeRequests, 1);
    const prompt = JSON.stringify(requests.at(-1).messages);
    const markers = [...new Set([...prompt.matchAll(/GHOST_SOURCE_(\d+)_END/g)].map((m) => Number(m[1])))];
    assert.deepEqual(markers, Array.from({ length: 100 - start }, (_, i) => i + start));
    const saved = state.chapters.find((e: any) => !e.isGhost && e.meta.msgIds.length === selected.length);
    assert.deepEqual(saved.meta.msgIds, selected);
    assert.equal(state.lastFailure, null);
    assert.equal(state.chapters.filter((e: any) => e.isGhost).length, preview ? 0 : 1);
    assert(state.messages.filter((m: any) => selected.includes(m.id)).every((m: any) => m.covered && m.hidden && !m.staged));
    const rows = (await api(`/api/v1/world-books/${state.bookId}/entries?limit=200`)).data;
    assert.equal(rows.filter((e: any) => e.extensions?.lumibooks?.ghost).length, preview ? 0 : 1);
    assert.equal(rows.find((e: any) => e.id === saved.entryId).disabled, false);
    if (preview) {
      assert(state.messages.slice(18, 20).every((m: any) => !m.covered && !m.hidden && !m.staged));
      assert(saved.content.includes("Reviewed ghost replacement"));
    }
    pass(`manual ${selected.length}-message ghost replacement${preview ? " with edited preview and partial overlap" : ""}: exact model input, persisted chapter, retired ghosts and correct hiding`);
  }
}

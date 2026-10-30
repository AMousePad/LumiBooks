import assert from "node:assert/strict";
import { normalizeBreakdown } from "../src/prompt-breakdown";

export async function runPromptScenarios(h: {
  api(path: string, method?: string, body?: unknown): Promise<any>;
  response(payload: any, type: string): Promise<any>;
  action(payload: any, predicate?: (state: any) => boolean): Promise<any>;
  until<T>(label: string, read: () => T | Promise<T>, valid: (value: T) => boolean, timeout?: number): Promise<T>;
  fromHost(path: string): Promise<any>;
  pass(name: string): void;
  characterId: string;
  connectionId: string;
  requests: any[];
}) {
  const { api, response, action, until, fromHost, pass, characterId, connectionId, requests } = h;
  const wire = (value: unknown) => JSON.parse(JSON.stringify(value));
  const chat = await api("/api/v1/chats", "POST", { character_id: characterId, name: "Prompt API integration" });
  const message = await api(`/api/v1/chats/${chat.id}/messages`, "POST", { name: "User", is_user: true, content: "PRIVATE_PROMPT_API_HISTORY" });
  const read = async (mode: "auto" | "dry", messageIds = [message.id]) => {
    const requestId = crypto.randomUUID();
    const reply = await response({ type: "prompt_breakdown", requestId, chatId: chat.id, messageIds, mode }, "prompt_breakdown");
    assert.equal(reply.requestId, requestId);
    assert.equal(reply.chatId, chat.id);
    assert.equal(reply.error, undefined);
    return reply.result;
  };
  const rest = await api("/api/v1/generate/dry-run", "POST", { chat_id: chat.id });
  const preview = await read("auto");
  assert.equal(preview.source, "dry");
  assert.deepEqual(preview.d, wire(normalizeBreakdown({ entries: rest.tokenCount?.breakdown ?? [],
    totalTokens: rest.tokenCount?.total_tokens, maxContext: rest.contextClipStats?.maxContext ?? 0, model: rest.model }, rest.chatHistoryTokens ?? 0)));
  assert(!JSON.stringify(preview).includes("PRIVATE_PROMPT_API_HISTORY"));
  pass("Spindle preview matches real REST assembly counts without returning prompt text");

  const { storeBreakdown } = await fromHost("services/breakdown.service.ts");
  const { getFirstUserId } = await fromHost("auth/seed.ts");
  const snapshot = { entries: [{ name: "System", type: "block", tokens: 12, content: "PRIVATE_SAVED_PROMPT" }],
    messages: [{ role: "user", content: "PRIVATE_SAVED_HISTORY" }], totalTokens: 32, chatHistoryTokens: 20, maxContext: 8192, model: "stored-test" };
  storeBreakdown(getFirstUserId(), message.id, chat.id, snapshot);
  const saved = await read("auto", [message.id, "missing-snapshot"]);
  assert.equal(saved.source, "fire");
  assert.deepEqual(saved.d, wire(normalizeBreakdown(snapshot, 20)));
  assert(!JSON.stringify(saved).includes("PRIVATE_"));
  assert.equal((await read("dry")).source, "dry");
  pass("saved-first lookup skips missing snapshots and explicit preview bypasses saved data");

  const requestId = crypto.randomUUID();
  const failure = await response({ type: "prompt_breakdown", requestId, chatId: "missing-chat", messageIds: [], mode: "dry" }, "prompt_breakdown");
  assert.equal(failure.requestId, requestId);
  assert.equal(failure.chatId, "missing-chat");
  assert.equal(typeof failure.error, "string");
  assert(!failure.result);
  pass("host failures return correlated panel errors through the extension bridge");

  const reply = await api(`/api/v1/chats/${chat.id}/messages`, "POST", { name: "Assistant", is_user: false, content: "COLLAPSE_OLD_REPLY" });
  await api(`/api/v1/chats/${chat.id}/messages`, "POST", { name: "User", is_user: true, content: "COLLAPSE_RECENT_TURN" });
  let state = await action({ type: "refresh", chatId: chat.id }, s => s.activeChatId === chat.id && s.messages.length === 3);
  const originalProfile = state.activeProfile;
  const block = (patch: object) => ({ id: crypto.randomUUID(), name: "Block", role: "system", content: "", enabled: true,
    position: "pre_history", depth: 0, marker: null, isLocked: false, color: null, injectionTrigger: [], group: null, ...patch });
  const createPreset = (collapseMessages: boolean) => api("/api/v1/presets", "POST", {
    name: `Collapse interoperability ${collapseMessages}`, provider: "custom", prompts: { advancedSettings: { collapseMessages } },
    parameters: { samplerOverrides: { enabled: true, contextSize: 8192, maxTokens: 200 } },
    prompt_order: [block({ content: "COLLAPSE_INSTRUCTIONS" }), block({ marker: "chat_history", name: "History" })],
  });
  const structuredPreset = await createPreset(false);
  const collapsedPreset = await createPreset(true);
  const input = { chat_id: chat.id, connection_id: connectionId, preset_id: collapsedPreset.id, force_preset_id: true };
  try {
    state = await action({ type: "create_chapter_range", chatId: chat.id, messageIds: [message.id, reply.id] },
      s => s.activeChatId === chat.id && s.chapters.length === 1 && !s.busy.length);
    const summary = state.chapters[0].content;
    for (const hidden of [false, true]) {
      await action({ type: "save_profile", chatId: chat.id, profile: { ...originalProfile, hideCoveredMessages: hidden } },
        s => s.activeChatId === chat.id && s.activeProfile.hideCoveredMessages === hidden && s.messages.filter((m: any) => m.hidden).length === (hidden ? 2 : 0));
      const structured = await api("/api/v1/generate/dry-run", "POST", { ...input, preset_id: structuredPreset.id });
      assert.deepEqual(structured.messages.map((m: any) => m.content), ["COLLAPSE_INSTRUCTIONS", summary, "COLLAPSE_RECENT_TURN"]);
      const collapsed = await api("/api/v1/generate/dry-run", "POST", input);
      assert.deepEqual(collapsed.messages, [{ role: "user", content: structured.messages.map((m: any) => m.content).join("\n\n") }]);
      assert(collapsed.breakdown.some((e: any) => e.content === summary));
      pass(`real LumiBooks worker replaces ${hidden ? "hidden" : "visible"} covered history before prompt collapse`);
    }
    const countBefore = requests.length;
    await api("/api/v1/generate", "POST", input);
    const sent = await until("collapsed provider request", () => requests.slice(countBefore).find(r => JSON.stringify(r.messages).includes("COLLAPSE_RECENT_TURN")), Boolean);
    assert.deepEqual(sent.messages, [{ role: "user", content: ["COLLAPSE_INSTRUCTIONS", summary, "COLLAPSE_RECENT_TURN"].join("\n\n") }]);
    await until("collapsed reply saved", () => api(`/api/v1/chats/${chat.id}/messages`), rows => rows.total === 4);
    pass("actual provider receives one user message containing the injected summary and recent turn");
  } finally {
    await action({ type: "save_profile", chatId: chat.id, profile: originalProfile });
  }
}

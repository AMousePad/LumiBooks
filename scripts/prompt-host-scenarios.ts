import assert from "node:assert/strict";
import { normalizeBreakdown } from "../src/prompt-breakdown";

export async function runPromptScenarios(h: {
  api(path: string, method?: string, body?: unknown): Promise<any>;
  response(payload: any, type: string): Promise<any>;
  fromHost(path: string): Promise<any>;
  pass(name: string): void;
  characterId: string;
}) {
  const { api, response, fromHost, pass, characterId } = h;
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
}

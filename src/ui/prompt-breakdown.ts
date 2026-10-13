import type { FrontendToBackend } from "../types";
import type { PromptBreakdownRequest, PromptBreakdownResponse, PromptBreakdownResult } from "../prompt-breakdown";

const pending = new Map<string, {
  chatId: string;
  resolve(result: PromptBreakdownResult): void;
  reject(error: Error): void;
  timer: ReturnType<typeof setTimeout>;
}>();

export function requestPromptBreakdown(
  send: (msg: FrontendToBackend) => void,
  input: Omit<PromptBreakdownRequest, "type" | "requestId">,
  timeoutMs = 120_000,
): Promise<PromptBreakdownResult> {
  // getRandomValues also works on HTTP LAN hosts, unlike randomUUID.
  const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error("Prompt breakdown timed out. Try refreshing the panel."));
    }, timeoutMs);
    pending.set(requestId, { chatId: input.chatId, resolve, reject, timer });
    try { send({ type: "prompt_breakdown", requestId, ...input }); }
    catch (error) {
      clearTimeout(timer);
      pending.delete(requestId);
      reject(error);
    }
  });
}

export function deliverPromptBreakdown(message: PromptBreakdownResponse): void {
  const request = pending.get(message.requestId);
  if (!request || request.chatId !== message.chatId) return;
  pending.delete(message.requestId);
  clearTimeout(request.timer);
  if ("error" in message) request.reject(new Error(message.error));
  else request.resolve(message.result);
}

export function clearPromptRequests(): void {
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error("Prompt panel closed."));
  }
  pending.clear();
}

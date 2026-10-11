import type { SpindleAPI } from "lumiverse-spindle-types";
import { normalizeBreakdown, type PromptBreakdownRequest, type PromptBreakdownResult } from "../prompt-breakdown";

// Contract from the pending Lumiverse Spindle API PR; replace when SDK typings ship.
type GenerateAPI = SpindleAPI["generate"] & {
  getBreakdown(messageId: string, userId?: string): Promise<Record<string, unknown> | null>;
};
declare const spindle: SpindleAPI;

export async function loadPromptBreakdown(request: PromptBreakdownRequest, userId: string): Promise<PromptBreakdownResult> {
  const generate = spindle.generate as GenerateAPI;
  if (typeof generate.getBreakdown !== "function") {
    throw new Error("The Prompt panel requires a Lumiverse update with the Spindle prompt-breakdown API.");
  }
  if (request.mode === "auto") {
    for (const messageId of request.messageIds.slice(-15).reverse()) {
      const saved = await generate.getBreakdown(messageId, userId);
      if (!saved) continue;
      const d = normalizeBreakdown(saved, typeof saved.chatHistoryTokens === "number" ? saved.chatHistoryTokens : 0);
      if (d) return { d, source: "fire" };
    }
  }
  const preview = await generate.dryRun({ chatId: request.chatId }, userId) as Awaited<ReturnType<GenerateAPI["dryRun"]>> & {
    chatHistoryTokens?: number;
    contextClipStats?: { maxContext: number };
  };
  const d = normalizeBreakdown({
    entries: preview.tokenCount?.breakdown ?? [],
    totalTokens: preview.tokenCount?.total_tokens,
    maxContext: preview.contextClipStats?.maxContext ?? 0,
    model: preview.model,
  }, preview.chatHistoryTokens ?? 0);
  if (!d || d.entries.length === 0) throw new Error("Dry run returned no breakdown.");
  return { d, source: "dry" };
}

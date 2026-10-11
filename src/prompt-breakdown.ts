export interface HostBreakdownEntry {
  name: string;
  type: string;
  tokens: number;
  extensionName?: string;
  /** Rebuilt from the host's chatHistoryTokens scalar; no real entries. */
  synthetic?: boolean;
}

export interface HostBreakdown {
  entries: HostBreakdownEntry[];
  totalTokens: number;
  maxContext: number;
  model?: string;
  presetName?: string;
}

export interface PromptBreakdownRequest {
  type: "prompt_breakdown";
  requestId: string;
  chatId: string;
  messageIds: string[];
  mode: "auto" | "dry";
}

export interface PromptBreakdownResult {
  d: HostBreakdown;
  source: "fire" | "dry";
}

export type PromptBreakdownResponse = {
  type: "prompt_breakdown";
  requestId: string;
  chatId: string;
} & ({ result: PromptBreakdownResult } | { error: string });

export function normalizeBreakdown(raw: Record<string, unknown>, chatHistoryTokens = 0): HostBreakdown | null {
  const entries = Array.isArray(raw["entries"]) ? raw["entries"] : null;
  if (!entries) return null;
  const clean: HostBreakdownEntry[] = [];
  for (const e of entries as Record<string, unknown>[]) {
    if (!e || typeof e !== "object") continue;
    const tokens = typeof e["tokens"] === "number" ? e["tokens"] : 0;
    clean.push({
      name: typeof e["name"] === "string" ? e["name"] : "?",
      type: typeof e["type"] === "string" ? e["type"] : "utility",
      tokens,
      extensionName: typeof e["extensionName"] === "string" ? e["extensionName"] : undefined,
    });
  }
  // The host strips chat_history entries and reports their sum separately.
  if (chatHistoryTokens > 0 && !clean.some((e) => e.type === "chat_history")) {
    clean.unshift({ name: "Assembled transcript", type: "chat_history", tokens: chatHistoryTokens, synthetic: true });
  }
  const summed = clean.reduce((a, e) => a + e.tokens, 0);
  return {
    entries: clean,
    totalTokens: typeof raw["totalTokens"] === "number" ? (raw["totalTokens"] as number) : summed,
    maxContext: typeof raw["maxContext"] === "number" ? (raw["maxContext"] as number) : 0,
    model: typeof raw["model"] === "string" ? (raw["model"] as string) : undefined,
    presetName: typeof raw["presetName"] === "string" ? (raw["presetName"] as string) : undefined,
  };
}

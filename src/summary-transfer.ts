export interface SummaryTransferStatus {
  id: string;
  chatId: string;
  stage: "working" | "mismatch" | "manual" | "done" | "error" | "cancelled";
  text: string;
  messageCount?: number;
  sourceCount?: number;
  /** The manual-entry label already contains the prompt; omit duplicate text. */
  manualPromptOnly?: boolean;
}

export type SummaryImportChoice = "match" | "specify" | "manual" | "cancel";

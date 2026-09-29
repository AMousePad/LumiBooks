export interface SummaryTransferStatus {
  id: string;
  chatId: string;
  stage: "working" | "mismatch" | "manual" | "done" | "error" | "cancelled";
  text: string;
  messageCount?: number;
  sourceCount?: number;
}

export type SummaryImportChoice = "match" | "specify" | "manual" | "cancel";

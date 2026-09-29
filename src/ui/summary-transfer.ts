import type { FrontendToBackend } from "../types";
import type { SummaryImportChoice, SummaryTransferStatus } from "../summary-transfer";
import { makeButton } from "./components";

/** File reading starts in Books, before a backend request exists. */
export function reportLocalSummaryTransfer(chatId: string, text: string, stage: "working" | "error" | "done" = "working"): void {
  document.dispatchEvent(new CustomEvent("lmb-summary-transfer", { detail: { id: "local", chatId, stage, text } }));
}

export function createSummaryTransferPanel(host: HTMLElement, send: (msg: FrontendToBackend) => void) {
  const pending = new Map<string, { status: SummaryTransferStatus; collapsed: boolean; input: string }>();
  let chatId: string | null = null;
  const draw = () => {
    host.replaceChildren();
    const item = chatId ? pending.get(chatId) : null;
    host.hidden = !item;
    if (!item) return;
    const status = item.status;
    host.className = "lmb-summary-transfer";
    const actions = document.createElement("div"); actions.className = "lmb-actions";
    if (item.collapsed) {
      actions.appendChild(makeButton(status.stage === "working" ? "Summary transfer in progress…" : "Continue summary import/export", () => { item.collapsed = false; draw(); }));
      host.appendChild(actions); return;
    }
    const title = document.createElement("strong"); title.textContent = "Summary import / export";
    const text = document.createElement("p"); text.setAttribute("role", "status"); text.textContent = status.text;
    if (status.stage === "working") {
      const spinner = document.createElement("span"); spinner.className = "lmb-spinner"; spinner.setAttribute("aria-hidden", "true");
      text.prepend(spinner, document.createTextNode(" "));
    }
    host.appendChild(title);
    if (status.stage !== "manual" || status.text !== "Up until which message should these summaries cover?") host.appendChild(text);
    const choose = (choice: SummaryImportChoice, through?: number) => {
      if (choice !== "cancel") { item.status = { ...status, stage: "working", text: "Processing summary import…" }; draw(); }
      send({ type: "summary_import_resolve", chatId: status.chatId, id: status.id, choice, through });
    };
    if (status.stage === "mismatch") {
      actions.append(makeButton("Attempt Matching", () => choose("match")), makeButton("Let me specify", () => choose("specify")));
    }
    if (status.stage === "manual") {
      const label = document.createElement("label");
      label.textContent = "Up until which message should these summaries cover?";
      const input = document.createElement("input"); input.className = "lmb-input"; input.type = "number";
      input.min = "0"; input.max = String(status.messageCount ?? 0); input.step = "1";
      input.value = item.input; input.required = true;
      input.addEventListener("input", () => { item.input = input.value; });
      label.appendChild(input); host.appendChild(label);
      const help = document.createElement("p"); help.className = "lmb-help";
      help.textContent = `This chat has ${status.messageCount ?? 0} messages. Count from 1; 0 imports roots without covering messages. With a chosen endpoint, the summaries are kept together in one entry covering messages 1–N, preserving all their text.`;
      host.appendChild(help);
      actions.appendChild(makeButton("Import summaries", () => {
        if (input.reportValidity()) choose("manual", Number(input.value));
      }));
    }
    if (status.stage !== "working") actions.appendChild(makeButton(status.stage === "done" || status.stage === "error" ? "Dismiss" : "Cancel import", () => {
      if (status.id !== "local" && status.id !== "busy") choose("cancel");
      pending.delete(status.chatId); draw();
    }));
    actions.appendChild(makeButton("Hide", () => { item.collapsed = true; draw(); }));
    host.appendChild(actions);
  };
  return {
    setChat(next: string | null) { if (next !== chatId) { chatId = next; draw(); } },
    deliver(status: SummaryTransferStatus) {
      if (status.stage === "cancelled") {
        pending.delete(status.chatId);
        if (status.chatId === chatId) draw();
        return;
      }
      const old = pending.get(status.chatId);
      if (old && JSON.stringify(old.status) === JSON.stringify(status)) return;
      pending.set(status.chatId, { status, collapsed: old?.collapsed ?? false, input: old?.input ?? "" });
      if (status.chatId === chatId) draw();
    },
  };
}

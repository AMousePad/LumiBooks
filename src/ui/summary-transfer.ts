import { t as tr } from "../i18n";
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
      actions.appendChild(makeButton(status.stage === "working" ? tr("ui.summaryTransfer.draw.summaryTransferInProgress") : tr("ui.summaryTransfer.draw.continueSummaryImportExport"), () => { item.collapsed = false; draw(); }));
      host.appendChild(actions); return;
    }
    const title = document.createElement("strong"); title.textContent = tr("ui.summaryTransfer.draw.summaryImportExport");
    const text = document.createElement("p"); text.setAttribute("role", "status"); text.textContent = status.text;
    if (status.stage === "working") {
      const spinner = document.createElement("span"); spinner.className = "lmb-spinner"; spinner.setAttribute("aria-hidden", "true");
      text.prepend(spinner, document.createTextNode(" "));
    }
    host.appendChild(title);
    if (status.stage !== "manual" || !status.manualPromptOnly) host.appendChild(text);
    const choose = (choice: SummaryImportChoice, through?: number) => {
      if (choice !== "cancel") { item.status = { ...status, stage: "working", text: tr("ui.summaryTransfer.choose.processingSummaryImport") }; draw(); }
      send({ type: "summary_import_resolve", chatId: status.chatId, id: status.id, choice, through });
    };
    if (status.stage === "mismatch") {
      actions.append(makeButton(tr("ui.summaryTransfer.draw.attemptMatching"), () => choose("match")), makeButton(tr("ui.summaryTransfer.draw.letMeSpecify"), () => choose("specify")));
    }
    if (status.stage === "manual") {
      const label = document.createElement("label");
      label.textContent = tr("ui.summaryTransfer.draw.upUntilWhichMessageShouldTheseSummaries");
      const input = document.createElement("input"); input.className = "lmb-input"; input.type = "number";
      input.min = "0"; input.max = String(status.messageCount ?? 0); input.step = "1";
      input.value = item.input; input.required = true;
      input.addEventListener("input", () => { item.input = input.value; });
      label.appendChild(input); host.appendChild(label);
      const help = document.createElement("p"); help.className = "lmb-help";
      help.textContent = tr("ui.summaryTransfer.draw.thisChatHasMessagesCountFrom1", { messageCount0: status.messageCount ?? 0 });
      host.appendChild(help);
      actions.appendChild(makeButton(tr("ui.summaryTransfer.draw.importSummaries"), () => {
        if (input.reportValidity()) choose("manual", Number(input.value));
      }));
    }
    if (status.stage !== "working") actions.appendChild(makeButton(status.stage === "done" || status.stage === "error" ? tr("ui.summaryTransfer.draw.dismiss") : tr("ui.summaryTransfer.draw.cancelImport"), () => {
      if (status.id !== "local" && status.id !== "busy") choose("cancel");
      pending.delete(status.chatId); draw();
    }));
    actions.appendChild(makeButton(tr("ui.summaryTransfer.draw.hide"), () => { item.collapsed = true; draw(); }));
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

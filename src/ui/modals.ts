import { t as tr } from "../i18n";
import { CODEX_FILE_KEYS } from "../shared";
import { resolveTidyTarget, type CodexTidyTarget } from "../codex-tidy";
import { TIER_NAMES, TIER_KINDS, type SummaryKind } from "../shared";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { DryRunDiagnostic, DryRunMessage, FrontendState, FrontendToBackend } from "../types";
import { makeButton, textArea, textInput } from "./components";

function codexCatchupWarnings(state: FrontendState): { booksWarning: string | null; autoBooks: boolean } {
  // Ghost chapters count: both fast and ultra replay them as summaries.
  const hasBooks = state.chapters.some((c) => !c.isRoot)
    || state.arcs.some((a) => !a.isRoot)
    || state.volumes.some((v) => !v.isRoot)
    || state.higherBooks.some((v) => !v.isRoot);
  // Mirrors catchupCodex: preview-mode profiles skip the books phase.
  const autoBooks = state.activeProfile.autoCreate && !state.activeProfile.showMemoryPreviews;
  const bigTailNoAuto = state.coverage.approxUncoveredTokens > 150000 && !autoBooks;
  const booksWarning = !hasBooks
    ? tr("ui.modals.booksWarning.thisChatHasNoFiledChaptersYet")
    : bigTailNoAuto
      ? tr("ui.modals.booksWarning.theUnfiledTailOfThisChatIs")
      : null;
  return { booksWarning, autoBooks };
}

/** Shared Update-codex entry: backlogs over one pass open the mode picker. */
export function requestCodexUpdate(
  state: FrontendState,
  chatId: string,
  send: (msg: FrontendToBackend) => void,
): void {
  if ((state.codexBacklogPasses ?? 0) <= 1) {
    send({ type: "codex_update_now", chatId });
    return;
  }
  const { booksWarning, autoBooks } = codexCatchupWarnings(state);
  showCodexCatchupModal({
    lead: tr("ui.modals.requestCodexUpdate.messageAreWaitingAboutPassesAtThe", { codexBacklog0: state.codexBacklog ?? 0, codexBacklog02: (state.codexBacklog ?? 0), codexBacklogPasses: state.codexBacklogPasses }),
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_update_now", chatId, mode }),
  });
}

/** Rebuild always offers the mode picker: it re-reads the whole chat. */
export function requestCodexRebuild(
  state: FrontendState,
  chatId: string,
  send: (msg: FrontendToBackend) => void,
): void {
  const prof = state.activeProfile;
  const total = state.messages.length;
  const passes = prof.codexWindowUnit === "messages"
    ? Math.max(1, Math.ceil(total / Math.max(1, prof.codexWindowValue)))
    : Math.max(1, Math.ceil(state.messages.reduce((a, m) => a + m.approxTokens, 0) / Math.max(1000, prof.codexWindowValue)));
  const { booksWarning, autoBooks } = codexCatchupWarnings(state);
  showCodexCatchupModal({
    title: tr("ui.modals.requestCodexRebuild.rebuildTheCodex"),
    lead: tr("ui.modals.requestCodexRebuild.memoriaWillEraseTheStoryBibleAnd", { total: total, passes: passes }),
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_rebuild", chatId, mode }),
  });
}

let catchupClose: (() => void) | null = null;

/** Chat switches close the picker so a pick can't start a run on the old chat. */
export function closeCodexCatchupModal(): void {
  catchupClose?.();
  tidyClose?.();
}

let tidyClose: (() => void) | null = null;

/** Preview the target before starting a bounded sequence of compaction calls. */
export function requestCodexTidy(
  state: FrontendState, chatId: string, send: (msg: FrontendToBackend) => void, files?: string[],
): void {
  tidyClose?.();
  const targets = (files ?? [...CODEX_FILE_KEYS]).filter((f) => state.codexFileStates[f] !== "frozen");
  const current = targets.reduce((n, f) => n + (state.codexFileTokens[f] ?? 0), 0);
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-tidy";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(540px, 100%)";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", tr("ui.modals.requestCodexTidy.tidyCodexToATargetSize"));
  const previousFocus = document.activeElement as HTMLElement | null;
  const close = (): void => {
    document.removeEventListener("keydown", onKey);
    if (tidyClose === close) tidyClose = null;
    overlay.remove();
    if (previousFocus?.isConnected) previousFocus.focus();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const focusable = [...modal.querySelectorAll<HTMLElement>("input, select, button:not(:disabled)")];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };
  tidyClose = close;
  document.addEventListener("keydown", onKey);
  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = tr("ui.modals.requestCodexTidy.tidyCodexToATargetSize");
  header.append(title);
  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const lead = document.createElement("p");
  lead.textContent = tr("ui.modals.requestCodexTidy.currentSelectedContentTokensFrozenFilesAre", { choice: (state.codexTokensApproximate) ? "yes" : "no", toLocaleString: current.toLocaleString() });
  const unitLabel = document.createElement("label");
  unitLabel.textContent = tr("ui.modals.requestCodexTidy.targetUnit");
  const unit = document.createElement("select");
  unit.className = "lmb-input";
  for (const [value, text] of [["percent", tr("ui.modals.requestCodexTidy.percentageToKeep")], ["tokens", tr("ui.modals.requestCodexTidy.tokens")]]) {
    const option = document.createElement("option");
    option.value = value!; option.textContent = text!; unit.append(option);
  }
  unitLabel.append(unit);
  const valueLabel = document.createElement("label");
  const valueText = document.createElement("span");
  const value = document.createElement("input");
  value.type = "number";
  value.className = "lmb-input";
  value.value = "75";
  valueLabel.append(valueText, value);
  const preview = document.createElement("p");
  preview.setAttribute("aria-live", "polite");
  const help = document.createElement("p");
  help.className = "lmb-help";
  help.textContent = tr("ui.modals.requestCodexTidy.memoriaAims10BelowYourLimitChecks");
  if (state.codexTokensApproximate) help.textContent += tr("ui.modals.requestCodexTidy.theTokenizerIsUnavailableForThisModel");
  const readTarget = (): CodexTidyTarget => ({ unit: unit.value as CodexTidyTarget["unit"], value: Number(value.value) });
  const start = makeButton(tr("ui.modals.start.startTidy"), () => {
    try {
      resolveTidyTarget(current, readTarget());
      const target = readTarget();
      close();
      send({ type: "codex_tidy", chatId, files: targets, target });
    } catch { refresh(); }
  }, { primary: true });
  const refresh = (): void => {
    const percent = unit.value === "percent";
    valueText.textContent = percent ? tr("ui.modals.refresh.keepThisPercentage") : tr("ui.modals.refresh.maximumTokens");
    value.min = percent ? "0.01" : "1";
    value.step = percent ? "0.01" : "1";
    value.max = percent ? "99.99" : String(Math.max(1, current - 1));
    try {
      const { limit, modelTarget } = resolveTidyTarget(current, readTarget());
      start.disabled = current === 0 || limit >= current;
      preview.textContent = limit >= current ? tr("ui.modals.refresh.chooseATargetBelowTheCurrentSize") : tr("ui.modals.refresh.yourLimitTokensModelTargetWithMargin", { toLocaleString: limit.toLocaleString(), toLocaleString2: modelTarget.toLocaleString() });
    } catch (err) {
      start.disabled = true;
      preview.textContent = err instanceof Error ? err.message : tr("ui.modals.refresh.enterAValidTarget");
    }
  };
  unit.addEventListener("change", () => {
    const old = Number(value.value);
    value.value = unit.value === "tokens" ? String(Math.max(1, Math.floor(current * old / 100))) : String(Math.min(99.99, Math.max(0.01, Math.round(old / Math.max(1, current) * 10000) / 100)));
    refresh();
  });
  value.addEventListener("input", refresh);
  body.append(lead, unitLabel, valueLabel, preview, help);
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(makeButton(tr("ui.modals.requestCodexTidy.cancel"), close), start);
  modal.append(header, body, footer);
  overlay.append(modal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.body.append(overlay);
  refresh();
  value.focus();
  value.select();
}

/** Mode picker for a codex that is several passes behind. */
export function showCodexCatchupModal(opts: {
  title?: string;
  lead: string;
  booksWarning: string | null;
  autoBooks: boolean;
  onPick: (mode: "slow" | "fast" | "ultra") => void;
}): void {
  if (document.querySelector(".lmb-catchup")) return;
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-catchup";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(600px, 100%)";

  const close = (): void => {
    document.removeEventListener("keydown", onKey);
    if (catchupClose === close) catchupClose = null;
    overlay.remove();
  };
  catchupClose = close;
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);

  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = opts.title ?? tr("ui.modals.showCodexCatchupModal.theCodexIsFarBehind");
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = tr("ui.modals.showCodexCatchupModal.value");
  closeBtn.setAttribute("aria-label", tr("ui.modals.showCodexCatchupModal.close"));
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);

  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs: string[] = [
    opts.lead,
    tr("ui.modals.paragraphs.ultraFastReadsTheStorySCurrent"),
    tr("ui.modals.paragraphs.fastReplaysYourFiledChapterSummariesPass"),
    tr("ui.modals.paragraphs.slowReplaysEveryRawMessageWindowBy"),
  ];
  if (opts.autoBooks) {
    paragraphs.push(tr("ui.modals.showCodexCatchupModal.automationIsOnSoFastAndUltra"));
  }
  paragraphs.push(tr("ui.modals.showCodexCatchupModal.fastAndUltraFastNeedTheCodex"));
  for (const text of paragraphs) {
    const p = document.createElement("div");
    p.className = "lmb-help";
    p.style.fontSize = "14px";
    p.textContent = text;
    body.appendChild(p);
  }
  if (opts.booksWarning) {
    const w = document.createElement("div");
    w.className = "lmb-help";
    w.style.fontSize = "14px";
    w.style.fontWeight = "600";
    w.textContent = tr("ui.modals.showCodexCatchupModal.value2", { booksWarning: opts.booksWarning });
    body.appendChild(w);
  }
  modal.appendChild(body);

  const pick = (mode: "slow" | "fast" | "ultra") => (): void => {
    close();
    opts.onPick(mode);
  };
  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(
    makeButton(tr("ui.modals.showCodexCatchupModal.slow"), pick("slow"), { danger: true, title: tr("ui.modals.showCodexCatchupModal.notRecommendedReplaysEveryRawMessageWindow") }),
    makeButton(tr("ui.modals.showCodexCatchupModal.fast"), pick("fast"), { title: tr("ui.modals.showCodexCatchupModal.replayTheFiledSummariesThenOneRaw") }),
    makeButton(tr("ui.modals.showCodexCatchupModal.ultraFast"), pick("ultra"), { primary: true, title: tr("ui.modals.showCodexCatchupModal.oneSinglePassOverTheFiledSummaries") }),
  );
  modal.appendChild(footer);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);
}

/**
 * Offered when a codex run dies because the model narrated instead of
 * emitting tool calls: almost always a provider route that can't carry
 * them. One button flips the profile to JSON mode, and "don't show again"
 * persists account-wide.
 */
export function showCodexToolsHintModal(
  profileId: string,
  send: (msg: FrontendToBackend) => void,
): void {
  // Repeated failures must not stack modals.
  if (document.querySelector(".lmb-tools-hint")) return;
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay lmb-tools-hint";
  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";
  modal.style.width = "min(500px, 100%)";

  let dontShowAgain = false;
  const close = (): void => {
    document.removeEventListener("keydown", onKey);
    if (dontShowAgain) {
      send({ type: "save_settings", patch: { suppressToolCallingPrompt: true } });
    }
    overlay.remove();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);

  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  title.textContent = tr("ui.modals.showCodexToolsHintModal.toolCallsArenTGettingThrough");
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = tr("ui.modals.showCodexToolsHintModal.value");
  closeBtn.setAttribute("aria-label", tr("ui.modals.showCodexToolsHintModal.close"));
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);

  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs = [
    tr("ui.modals.paragraphs.theCodexAgentAskedYourModelTo"),
    tr("ui.modals.paragraphs.memoriaCanSwitchTheCodexToJson"),
    tr("ui.modals.paragraphs.youCanChangeThisAnytimeUnderTuning"),
  ];
  for (const text of paragraphs) {
    const p = document.createElement("div");
    p.className = "lmb-help";
    p.style.fontSize = "12px";
    p.textContent = text;
    body.appendChild(p);
  }
  const dontShow = document.createElement("label");
  dontShow.className = "lmb-check";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.addEventListener("change", () => {
    dontShowAgain = cb.checked;
  });
  const cbLabel = document.createElement("span");
  cbLabel.className = "lmb-check-hint";
  cbLabel.textContent = tr("ui.modals.showCodexToolsHintModal.donTShowThisAgain");
  dontShow.append(cb, cbLabel);
  body.appendChild(dontShow);
  modal.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(
    makeButton(tr("ui.modals.showCodexToolsHintModal.keepToolCalls"), close, { small: true }),
    makeButton(tr("ui.modals.showCodexToolsHintModal.switchToJsonMode"), () => {
      send({ type: "save_profile", profile: { id: profileId, codexUseTools: false } });
      close();
    }, { small: true, primary: true }),
  );
  modal.appendChild(footer);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);
}

export interface EditEntryFields {
  comment: string;
  content: string;
}

export function openEditModal(
  ctx: SpindleFrontendContext,
  title: string,
  fields: EditEntryFields,
  onSave: (next: EditEntryFields) => void,
): void {
  const handle = ctx.ui.showModal({ title, width: 640, maxHeight: 720 });
  const form = document.createElement("div");
  form.className = "lmb-modal-form";
  handle.root.appendChild(form);

  const labelWrap = document.createElement("div");
  labelWrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = tr("ui.modals.openEditModal.label");
  const labelInput = textInput({ value: fields.comment, placeholder: tr("ui.modals.labelInput.label") });
  labelWrap.append(lbl, labelInput);
  form.appendChild(labelWrap);

  const contentWrap = document.createElement("div");
  contentWrap.className = "lmb-field";
  const cLbl = document.createElement("div");
  cLbl.className = "lmb-field-label";
  cLbl.textContent = tr("ui.modals.openEditModal.content");
  const contentInput = textArea({ value: fields.content, rows: 16 });
  contentWrap.append(cLbl, contentInput);
  form.appendChild(contentWrap);

  const actions = document.createElement("div");
  actions.className = "lmb-modal-actions";
  actions.append(
    makeButton(tr("ui.modals.openEditModal.cancel"), () => handle.dismiss()),
    makeButton(tr("ui.modals.openEditModal.save"), () => {
      onSave({ comment: labelInput.value, content: contentInput.value });
      handle.dismiss();
    }, { primary: true }),
  );
  form.appendChild(actions);
}

export async function confirmDelete(
  ctx: SpindleFrontendContext,
  title: string,
  message: string,
): Promise<boolean> {
  try {
    const r = await ctx.ui.showConfirm({
      title,
      message,
      variant: "danger",
      confirmLabel: tr("ui.modals.r.delete"),
      cancelLabel: tr("ui.modals.r.cancel"),
    });
    return !!r.confirmed;
  } catch {
    return window.confirm(message);
  }
}

export function showDryRunModal(
  kind: SummaryKind | "codex",
  messages: DryRunMessage[],
  diagnostics: DryRunDiagnostic[],
): void {
  const overlay = document.createElement("div");
  overlay.className = "lmb-preview-overlay";

  const modal = document.createElement("div");
  modal.className = "lmb-preview-modal";

  const close = (): void => {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);

  const header = document.createElement("div");
  header.className = "lmb-preview-modal__header";
  const title = document.createElement("h3");
  const tierIndex = TIER_KINDS.indexOf(kind as SummaryKind);
  title.textContent = tierIndex > 2
    ? tr("ui.modals.showDryRunModal.higherTier", { name: TIER_NAMES[tierIndex] })
    : tr("ui.modals.showDryRunModal.dryRun", { choice: (kind === "arc") ? "yes" : "no", choice2: ((!(kind === "arc")) && (kind === "volume")) ? "yes" : "no", choice3: (((!(kind === "arc")) && !(kind === "volume")) && (kind === "codex")) ? "yes" : "no" });
  header.appendChild(title);
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = tr("ui.modals.showDryRunModal.value");
  closeBtn.setAttribute("aria-label", tr("ui.modals.showDryRunModal.closeDryRun"));
  closeBtn.addEventListener("click", close);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";

  if (diagnostics.length > 0) {
    const diag = document.createElement("div");
    diag.className = "lmb-preview-modal__diagnostics";
    const diagTitle = document.createElement("h4");
    diagTitle.textContent = tr("ui.modals.showDryRunModal.diagnostics");
    diag.appendChild(diagTitle);
    const ul = document.createElement("ul");
    for (const d of diagnostics) {
      const li = document.createElement("li");
      li.textContent = d.message;
      ul.appendChild(li);
    }
    diag.appendChild(ul);
    body.appendChild(diag);
  }

  for (const m of messages) {
    const msgCard = document.createElement("div");
    msgCard.className = "lmb-preview-msg";
    const roleLabel = document.createElement("div");
    roleLabel.className = "lmb-preview-msg__role";
    roleLabel.textContent = tr("ui.common.role", { role: m.role });
    const contentPre = document.createElement("pre");
    contentPre.className = "lmb-preview-msg__content";
    contentPre.textContent = m.content;
    msgCard.appendChild(roleLabel);
    msgCard.appendChild(contentPre);
    body.appendChild(msgCard);
  }

  modal.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "lmb-btn small";
  copyBtn.textContent = tr("ui.modals.showDryRunModal.copyJson");
  copyBtn.addEventListener("click", async () => {
    const json = JSON.stringify({ kind, messages, diagnostics }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      copyBtn.textContent = tr("ui.modals.showDryRunModal.copied");
      setTimeout(() => (copyBtn.textContent = tr("ui.modals.showDryRunModal.copyJson")), 1500);
    } catch {
      copyBtn.textContent = tr("ui.modals.showDryRunModal.copyFailed");
    }
  });
  footer.appendChild(copyBtn);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.body.appendChild(overlay);
}

export function promptForString(
  ctx: SpindleFrontendContext,
  title: string,
  initial: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const handle = ctx.ui.showModal({ title, width: 420 });
    const form = document.createElement("div");
    form.className = "lmb-modal-form";
    handle.root.appendChild(form);
    const input = textInput({ value: initial, autoFocus: true });
    form.appendChild(input);
    const actions = document.createElement("div");
    actions.className = "lmb-modal-actions";
    actions.append(
      makeButton(tr("ui.modals.promptForString.cancel"), () => { settle(null); handle.dismiss(); }),
      makeButton(tr("ui.modals.promptForString.ok"), () => {
        const v = input.value.trim();
        settle(v || null);
        handle.dismiss();
      }, { primary: true }),
    );
    form.appendChild(actions);
    try { handle.onDismiss?.(() => settle(null)); } catch (_) { void _; }
  });
}

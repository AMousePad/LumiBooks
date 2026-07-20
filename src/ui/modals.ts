import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { DryRunDiagnostic, DryRunMessage, FrontendState, FrontendToBackend } from "../types";
import { makeButton, textArea, textInput } from "./components";

function codexCatchupWarnings(state: FrontendState): { booksWarning: string | null; autoBooks: boolean } {
  // Ghost chapters count: both fast and ultra replay them as summaries.
  const hasBooks = state.chapters.some((c) => !c.isRoot)
    || state.arcs.some((a) => !a.isRoot)
    || state.volumes.some((v) => !v.isRoot);
  // Mirrors catchupCodex: preview-mode profiles skip the books phase.
  const autoBooks = state.activeProfile.autoCreate && !state.activeProfile.showMemoryPreviews;
  const bigTailNoAuto = state.coverage.approxUncoveredTokens > 150000 && !autoBooks;
  const booksWarning = !hasBooks
    ? "This chat has no filed chapters yet, so fast and ultra fast would read the raw story anyway. File chapters first (Home, File all) to get the real speedup."
    : bigTailNoAuto
      ? "The unfiled tail of this chat is very large and will not be filed first, so the final raw pass stays huge. File chapters first (Home, File all) for the full speedup."
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
    lead: `${state.codexBacklog ?? 0} message${(state.codexBacklog ?? 0) === 1 ? "" : "s"} are waiting, about ${state.codexBacklogPasses} passes at the current window. Pick how Memoria catches up.`,
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
    title: "Rebuild the codex",
    lead: `Memoria will erase the story bible and re-read all ${total} messages, about ${passes} slow passes. Pick how she rebuilds.`,
    booksWarning,
    autoBooks,
    onPick: (mode) => send({ type: "codex_rebuild", chatId, mode }),
  });
}

let catchupClose: (() => void) | null = null;

/** Chat switches close the picker so a pick can't start a run on the old chat. */
export function closeCodexCatchupModal(): void {
  catchupClose?.();
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
  title.textContent = opts.title ?? "The codex is far behind";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);

  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs: string[] = [
    opts.lead,
    "Ultra fast reads the story's current context in one single pass: every filed summary plus the raw newest messages. The fastest, with the least detail.",
    "Fast replays your filed chapter summaries pass by pass and reads raw messages only for the final stretch. Around 15x faster than slow while keeping most of the detail.",
    "Slow replays every raw message window by window. The most thorough, and on a long chat it can take hours.",
  ];
  if (opts.autoBooks) {
    paragraphs.push("Automation is on, so fast and ultra fast first bring this chat's chapters and arcs fully up to date.");
  }
  paragraphs.push("Fast and ultra fast need the codex connection's context window to be at least as large as your story model's.");
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
    w.textContent = `⚠ ${opts.booksWarning}`;
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
    makeButton("Slow", pick("slow"), { danger: true, title: "Not recommended. Replays every raw message window by window and can take hours." }),
    makeButton("Fast", pick("fast"), { title: "Replay the filed summaries, then one raw pass for the tail" }),
    makeButton("Ultra fast", pick("ultra"), { primary: true, title: "One single pass over the filed summaries plus the raw tail" }),
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
  title.textContent = "Tool calls aren't getting through";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", close);
  header.append(title, closeBtn);
  modal.appendChild(header);

  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";
  const paragraphs = [
    "The codex agent asked your model to write its records through tool calls, and the reply came back as plain text instead. That is almost always the provider: some routes strip tool support or fail to pass the calls back, and retrying cannot fix it.",
    "Memoria can switch the codex to JSON mode instead. The model writes one plain JSON reply that gets parsed and validated exactly like tool calls. It works on tool-less routes, though it is a little less reliable than real tool calls.",
    "You can change this anytime under Tuning → Connection → Codex → Use tool calls, or pick a tool-capable model under Codex connection.",
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
  cbLabel.textContent = "Don't show this again";
  dontShow.append(cb, cbLabel);
  body.appendChild(dontShow);
  modal.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "lmb-preview-modal__footer";
  footer.append(
    makeButton("Keep tool calls", close, { small: true }),
    makeButton("Switch to JSON mode", () => {
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
  lbl.textContent = "Label";
  const labelInput = textInput({ value: fields.comment, placeholder: "Label" });
  labelWrap.append(lbl, labelInput);
  form.appendChild(labelWrap);

  const contentWrap = document.createElement("div");
  contentWrap.className = "lmb-field";
  const cLbl = document.createElement("div");
  cLbl.className = "lmb-field-label";
  cLbl.textContent = "Content";
  const contentInput = textArea({ value: fields.content, rows: 16 });
  contentWrap.append(cLbl, contentInput);
  form.appendChild(contentWrap);

  const actions = document.createElement("div");
  actions.className = "lmb-modal-actions";
  actions.append(
    makeButton("Cancel", () => handle.dismiss()),
    makeButton("Save", () => {
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
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    return !!r.confirmed;
  } catch {
    return window.confirm(message);
  }
}

export function showDryRunModal(
  kind: "chapter" | "arc" | "volume" | "codex",
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
  title.textContent = `Dry run: ${kind === "arc" ? "Arc" : kind === "volume" ? "Volume" : kind === "codex" ? "Codex" : "Chapter"}`;
  header.appendChild(title);
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "lmb-preview-modal__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close dry run");
  closeBtn.addEventListener("click", close);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const body = document.createElement("div");
  body.className = "lmb-preview-modal__body";

  if (diagnostics.length > 0) {
    const diag = document.createElement("div");
    diag.className = "lmb-preview-modal__diagnostics";
    const diagTitle = document.createElement("h4");
    diagTitle.textContent = "Diagnostics";
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
    roleLabel.textContent = m.role;
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
  copyBtn.textContent = "Copy JSON";
  copyBtn.addEventListener("click", async () => {
    const json = JSON.stringify({ kind, messages, diagnostics }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      copyBtn.textContent = "Copied";
      setTimeout(() => (copyBtn.textContent = "Copy JSON"), 1500);
    } catch {
      copyBtn.textContent = "Copy failed";
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
      makeButton("Cancel", () => { settle(null); handle.dismiss(); }),
      makeButton("OK", () => {
        const v = input.value.trim();
        settle(v || null);
        handle.dismiss();
      }, { primary: true }),
    );
    form.appendChild(actions);
    try { handle.onDismiss?.(() => settle(null)); } catch (_) { void _; }
  });
}

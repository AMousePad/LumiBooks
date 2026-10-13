import { projectUiDiagnostic, UI_BATCH_LIMIT, type UiDiagnostic, type UiDiagnosticRow } from "../frontend-diagnostics";
import type { FrontendToBackend } from "../types";

type Details = Partial<Omit<UiDiagnostic, "kind" | "view" | "count" | "first" | "last">>;
let current: UiDiagnostics | null = null;
export function setUiDiagnostics(log: UiDiagnostics | null): void { current = log; }
export function reportUi(kind: UiDiagnostic["kind"], details: Details = {}): void { current?.record(kind, details); }
export function uiErrorCode(error: unknown): UiDiagnostic["code"] {
  try {
    return projectUiDiagnostic({ kind: "error", view: "unknown", code: error instanceof Error ? error.name : undefined })?.code ?? "unknown";
  } catch { return "unknown"; }
}
export function createUiDiagnostics(options: {
  send(message: FrontendToBackend): void;
  context(): { chatId?: string | null; view: UiDiagnostic["view"] };
  now?: () => number;
  delay?: number;
}) {
  const pending = new Map<string, UiDiagnosticRow>();
  const now = options.now ?? Date.now;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let enabled = true, disposed = false, flushing = false, dropped = 0;
  const clear = () => { clearTimeout(timer); timer = undefined; pending.clear(); dropped = 0; };
  const schedule = () => {
    if (!timer && !disposed && enabled) timer = setTimeout(flush, options.delay ?? 5000);
  };
  function record(kind: UiDiagnostic["kind"], details: Details = {}): void {
    try {
      if (!enabled || disposed) return;
      const context = options.context(), at = now();
      const safe = projectUiDiagnostic({ ...details, kind, view: context.view, count: 1, first: at, last: at });
      if (!safe) return;
      const chatId = typeof context.chatId === "string" && context.chatId.length <= 1024 ? context.chatId : undefined;
      const key = JSON.stringify([chatId, safe.kind, safe.view, safe.code, safe.op, safe.caps, safe.line, safe.column]);
      const previous = pending.get(key);
      if (previous) pending.set(key, { ...previous, count: Math.min(1_000_000, previous.count + 1), last: at });
      else {
        if (pending.size >= UI_BATCH_LIMIT - 1) {
          // Keep an error over routine traffic; always report lost event counts.
          const routine = [...pending].find(([, row]) => !["error", "rejection", "timeout"].includes(row.kind));
          if (["error", "rejection", "timeout"].includes(kind) && routine) {
            dropped = Math.min(1_000_000, dropped + routine[1].count); pending.delete(routine[0]);
          } else { dropped = Math.min(1_000_000, dropped + 1); schedule(); return; }
        }
        pending.set(key, { ...safe, chatId });
      }
      schedule();
    } catch { /* Diagnostics must never break the UI. */ }
  }
  function flush(): void {
    clearTimeout(timer); timer = undefined;
    if (flushing || !enabled || disposed || (!pending.size && !dropped)) return;
    const batch = new Map(pending), lost = dropped;
    const rows = [...batch.values()];
    if (lost) rows.push({ kind: "overflow", view: "unknown", count: lost, first: now(), last: now() });
    flushing = true;
    try {
      options.send({ type: "ui_diagnostics", rows });
      for (const [key, sent] of batch) {
        const remaining = pending.get(key);
        if (remaining === sent) pending.delete(key);
        else if (remaining && remaining.count > sent.count) pending.set(key, { ...remaining, count: remaining.count - sent.count, first: remaining.last });
      }
      dropped = Math.max(0, dropped - lost);
    } catch { /* Retain the bounded queue if the bridge is temporarily unavailable. */ }
    finally { flushing = false; if (pending.size || dropped) schedule(); }
  }
  function capabilities(): void {
    const caps = (globalThis.isSecureContext ? 1 : 0)
      | (typeof globalThis.crypto?.randomUUID === "function" ? 2 : 0)
      | (typeof globalThis.crypto?.getRandomValues === "function" ? 4 : 0);
    record("start", { caps });
  }
  return { record, flush, clear, capabilities,
    setEnabled(value: boolean) { const changed = enabled !== value; enabled = value; if (!value) clear(); else if (changed) capabilities(); },
    dispose() { if (disposed) return; record("stop"); flush(); disposed = true; clear(); },
  };
}
export type UiDiagnostics = ReturnType<typeof createUiDiagnostics>;

/** Inspect attribution locally; never retain or export stack/message/URL text. */
export function isOwnUiError(error: unknown, filename: unknown, source: string): boolean {
  if (!source) return false;
  if (filename === source) return true;
  try {
    return error instanceof Error && typeof error.stack === "string"
      && error.stack.split("\n").slice(1).some((line) => line.includes(`${source}:`));
  } catch { return false; }
}

export function observeUiDiagnostics(log: UiDiagnostics, source: string): () => void {
  const owned = (target: EventTarget | null): target is Element => target instanceof Element
    && !!target.closest(".lmb-root, .lmb-preview-overlay, .lmb-modal-form, .lmb-toast-stack");
  const interaction = (event: Event) => {
    if (!owned(event.target)) return;
    const control = event.target.closest("button, input, select, textarea, [role=button], [data-lesson]");
    if (!control) return;
    const op = control.closest<HTMLElement>("[data-lesson]")?.dataset.lesson;
    log.record(event.type === "click" ? "click" : "change", {
      code: control.tagName.toLowerCase() as UiDiagnostic["code"], op: op as UiDiagnostic["op"],
    });
  };
  const error = (event: ErrorEvent) => {
    if (isOwnUiError(event.error, event.filename, source)) {
      log.record("error", { code: uiErrorCode(event.error), line: event.lineno, column: event.colno });
    } else if (owned(event.target)) {
      log.record("resource", { code: event.target.tagName === "IMG" ? "image" : "unknown" });
    } else if (event.target instanceof HTMLLinkElement && event.target.id === "lmb-deco-fonts") {
      log.record("resource", { code: "stylesheet" });
    }
  };
  const rejection = (event: PromiseRejectionEvent) => {
    if (isOwnUiError(event.reason, undefined, source)) log.record("rejection", { code: uiErrorCode(event.reason) });
  };
  const visibility = () => { if (document.visibilityState === "hidden") log.flush(); };
  document.addEventListener("click", interaction, true);
  document.addEventListener("change", interaction, true);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("error", error, true);
  window.addEventListener("unhandledrejection", rejection);
  window.addEventListener("pagehide", log.flush);
  return () => {
    document.removeEventListener("click", interaction, true);
    document.removeEventListener("change", interaction, true);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("error", error, true);
    window.removeEventListener("unhandledrejection", rejection);
    window.removeEventListener("pagehide", log.flush);
  };
}

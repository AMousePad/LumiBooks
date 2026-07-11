import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { BackendToFrontend, FrontendState, FrontendToBackend } from "../types";
import { ICON_SVG, STYLES } from "./styles";
import { preserveScroll, scrollPaneTop } from "./components";
import { showDryRunModal } from "./modals";
import { deliverStreamText, renderHomeTab, tryUpdateBusyLabelsInPlace } from "./tabs/home-tab";
import { focusShelfEntry, renderBooksTab } from "./tabs/books-tab";
import { codexWantsRefresh, deliverCodexFiles, renderCodexTab } from "./tabs/codex-tab";
import { renderTuningTab } from "./tabs/tuning-tab";
import { renderAboutTab } from "./tabs/about-tab";

type TabKey = "home" | "books" | "codex" | "tuning" | "stuff";

const TAB_ICONS: Record<TabKey, string> = {
  // Sunburst over a horizon: the at-a-glance dashboard.
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v3"/><path d="M5.6 6.6l2.1 2.1"/><path d="M18.4 6.6l-2.1 2.1"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/></svg>`,
  // The shelf: a bound book.
  books: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>`,
  // Compass rose diamond: the story bible.
  codex: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 10-10 10L2 12z"/><path d="M12 7.5l4.5 4.5-4.5 4.5L7.5 12z"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>`,
  // Sliders: settings.
  tuning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6"/><path d="M6 14v6"/><path d="M12 4v2"/><path d="M12 10v10"/><path d="M18 4v8"/><path d="M18 16v4"/><path d="M4 10h4"/><path d="M10 6h4"/><path d="M16 12h4"/></svg>`,
  // Four-point sparkle: extras and lore.
  stuff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l0.9 2.1L22 19l-2.1 0.9L19 22l-0.9-2.1L16 19l2.1-0.9z"/></svg>`,
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "books", label: "Books" },
  { key: "codex", label: "Codex" },
  { key: "tuning", label: "Tuning" },
  { key: "stuff", label: "Stuff" },
];

const FONT_LINK_ID = "lmb-deco-fonts";

/** Marcellus (display) + Josefin Sans (body) carry the Art Deco voice. Loaded
 * once per document; the stylesheet falls back to Georgia/system stacks when
 * offline, so this is progressive enhancement only. */
function ensureDecoFonts(): void {
  if (document.getElementById(FONT_LINK_ID)) return;
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.crossOrigin = "anonymous";
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Marcellus&family=Josefin+Sans:ital,wght@0,400;0,600;1,400&display=swap";
  document.head.append(preconnect, link);
}

export function setup(ctx: SpindleFrontendContext): () => void {
  ensureDecoFonts();
  ctx.dom.addStyle(STYLES);

  const tab = ctx.ui.registerDrawerTab({
    id: "lumi_books_tab",
    title: "LumiBooks",
    shortName: "Books",
    description: "Memoria files your chat into chapters and arcs.",
    keywords: ["lumibooks", "lumi books", "memoria", "memory", "chapters", "arcs", "summary", "codex"],
    headerTitle: "LumiBooks",
    iconSvg: ICON_SVG,
  });

  const root = document.createElement("div");
  root.className = "lmb-root";
  tab.root.appendChild(root);

  const strip = document.createElement("div");
  strip.className = "lmb-tabstrip";
  root.appendChild(strip);

  const content = document.createElement("div");
  content.className = "lmb-tab-content";
  root.appendChild(content);

  let activeTab: TabKey = "home";
  let lastState: FrontendState | null = null;
  let renderPending = false;
  const tabButtons = new Map<TabKey, HTMLButtonElement>();

  for (const t of TABS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-tab";
    const icon = document.createElement("span");
    icon.className = "lmb-tab-icon";
    icon.innerHTML = TAB_ICONS[t.key];
    const label = document.createElement("span");
    label.className = "lmb-tab-label";
    label.textContent = t.label;
    btn.append(icon, label);
    btn.addEventListener("click", () => {
      activeTab = t.key;
      refreshTabStyles();
      doRender();
      // A new tab starts at its top - inheriting the previous tab's scroll
      // position lands the user mid-page.
      scrollPaneTop(content);
    });
    strip.appendChild(btn);
    tabButtons.set(t.key, btn);
  }

  const send = (msg: FrontendToBackend) => ctx.sendToBackend(msg);

  const refreshTabStyles = () => {
    for (const [key, btn] of tabButtons) {
      btn.classList.toggle("active", key === activeTab);
    }
  };

  const hasFocusedEditableChild = () => {
    const active = document.activeElement;
    if (!active || !content.contains(active)) return false;
    const tag = active.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag !== "INPUT") return false;
    const type = ((active as HTMLInputElement).type || "text").toLowerCase();
    return type === "text" || type === "number" || type === "search"
      || type === "email" || type === "url" || type === "tel"
      || type === "password";
  };

  let lastRenderedTab: TabKey | null = null;
  const doRender = () => {
    if (!lastState) {
      content.replaceChildren();
      lastRenderedTab = null;
      return;
    }
    const renderInner = () => {
      if (activeTab === "home") renderHomeTab(content, lastState!, ctx, send);
      else if (activeTab === "books") renderBooksTab(content, lastState!, ctx, send);
      else if (activeTab === "codex") renderCodexTab(content, lastState!, ctx, send);
      else if (activeTab === "tuning") renderTuningTab(content, lastState!, ctx, send);
      else renderAboutTab(content, lastState!, send);
    };
    if (lastRenderedTab === activeTab) {
      preserveScroll(content, renderInner);
    } else {
      renderInner();
    }
    lastRenderedTab = activeTab;
  };

  const renderActive = () => {
    if (hasFocusedEditableChild()) {
      renderPending = true;
      return;
    }
    renderPending = false;
    doRender();
  };

  content.addEventListener("focusout", () => {
    if (!renderPending) return;
    setTimeout(() => {
      if (hasFocusedEditableChild()) return;
      renderPending = false;
      doRender();
    }, 0);
  });

  refreshTabStyles();

  const unsub = ctx.onBackendMessage((raw) => {
    const msg = raw as BackendToFrontend;
    switch (msg.type) {
      case "state":
        lastState = msg.state;
        renderActive();
        break;
      case "toast":
        if (msg.tone === "error") console.error(`[LumiBooks] ${msg.text}`);
        else if (msg.tone === "warn") console.warn(`[LumiBooks] ${msg.text}`);
        else console.info(`[LumiBooks] ${msg.tone}: ${msg.text}`);
        showInlineToast(root, msg.tone, msg.text);
        break;
      case "busy":
        if (lastState) {
          const prev = lastState.busy;
          const next = msg.entries;
          lastState = { ...lastState, busy: next };
          // A codex run finishing while the codex tab or file editor is open
          // means their baseline just went stale - refresh it or a Save would
          // clobber the agent's fresh files.
          const finishedCodexChats = new Set<string>();
          for (const b of prev) {
            if (b.kind !== "codex") continue;
            if (!next.some((n) => n.kind === "codex" && n.chatId === b.chatId)) {
              finishedCodexChats.add(b.chatId);
            }
          }
          for (const chatId of finishedCodexChats) {
            if (codexWantsRefresh(chatId)) send({ type: "codex_read", chatId });
          }
          const sameShape =
            prev.length === next.length
            && prev.every((b, i) => b.kind === next[i]!.kind && b.chatId === next[i]!.chatId);
          if (activeTab === "home") {
            // Per-second progress ticks patch labels in place; only a shape
            // change (run started/finished) justifies a full re-render.
            if (sameShape && tryUpdateBusyLabelsInPlace(next)) break;
            if (hasFocusedEditableChild()) renderPending = true;
            else renderHomeTab(content, lastState, ctx, send);
          } else if (activeTab === "codex" && !sameShape) {
            if (hasFocusedEditableChild()) renderPending = true;
            else renderCodexTab(content, lastState, ctx, send);
          }
        }
        break;
      case "error":
        console.warn(`[LumiBooks] error: ${msg.text}`);
        break;
      case "dry_run_result":
        showDryRunModal(msg.kind, msg.messages, msg.diagnostics);
        break;
      case "codex_files":
        deliverCodexFiles(msg.chatId, msg.files, msg.savedFile, msg.savedSeq);
        if (activeTab === "codex" && lastState) renderActive();
        break;
      case "stream_text":
        deliverStreamText(msg);
        break;
    }
  });

  // Home's coverage spine dispatches this to jump straight to an entry on
  // the Books shelf.
  const onRevealEntry = (e: Event): void => {
    const entryId = (e as CustomEvent<{ entryId?: string }>).detail?.entryId;
    if (!entryId || !lastState) return;
    focusShelfEntry(entryId);
    activeTab = "books";
    refreshTabStyles();
    doRender();
    scrollPaneTop(content);
  };
  document.addEventListener("lmb-reveal-entry", onRevealEntry);

  send({ type: "ready", chatId: null });
  const unsubActivate = tab.onActivate(() => send({ type: "refresh", chatId: null }));

  return () => {
    try { unsub(); } catch (_) { void _; }
    try { unsubActivate?.(); } catch (_) { void _; }
    try { document.removeEventListener("lmb-reveal-entry", onRevealEntry); } catch (_) { void _; }
    try { tab.destroy?.(); } catch (_) { void _; }
  };
}

const TOAST_STACK_CAP = 5;
function showInlineToast(host: HTMLElement, tone: "success" | "info" | "warn" | "error", text: string): void {
  void host;
  let stack = document.body.querySelector(":scope > .lmb-toast-stack") as HTMLDivElement | null;
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "lmb-toast-stack";
    document.body.appendChild(stack);
  }
  while (stack.childElementCount >= TOAST_STACK_CAP) {
    stack.firstElementChild?.remove();
  }
  const el = document.createElement("div");
  el.className = `lmb-toast lmb-toast-${tone}`;
  el.textContent = text;
  stack.appendChild(el);
  const duration = tone === "error" ? 8000 : tone === "warn" ? 6000 : 4000;
  setTimeout(() => {
    el.classList.add("lmb-toast-leaving");
    setTimeout(() => el.remove(), 200);
  }, duration);
}

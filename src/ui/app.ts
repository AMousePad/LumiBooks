import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { BackendToFrontend, FrontendState, FrontendToBackend } from "../types";
import { ICON_SVG, STYLES } from "./styles";
import { preserveScroll, scrollPaneTop, showToast } from "./components";
import { closeCodexCatchupModal, showCodexToolsHintModal, showDryRunModal } from "./modals";
import { deliverStreamText, renderHomeTab, tryUpdateBusyLabelsInPlace } from "./tabs/home-tab";
import { focusShelfEntry, renderBooksTab } from "./tabs/books-tab";
import { codexWantsRefresh, deliverCodexFiles, renderCodexTab } from "./tabs/codex-tab";
import { renderTuningTab } from "./tabs/tuning-tab";
import { renderAboutTab } from "./tabs/about-tab";
import { createLessonEngine } from "./lessons/engine";
import type { LessonRequestDetail } from "./lessons/seal";
import { clearSealBusy, renderSealPanel, updateSealBusy } from "./lessons/seal";
import { APP_TABS, type AppTabKey } from "./tab-meta";

type TabKey = AppTabKey;

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

  const send = (msg: FrontendToBackend) => ctx.sendToBackend(msg);

  const engine = createLessonEngine({
    ctx,
    send,
    getState: () => lastState,
    onModeChange: () => {
      refreshTabStyles();
      doRender();
    },
    applyLessons: (course, patch) => {
      if (!lastState) return;
      const cur = lastState.lessons[course];
      lastState = {
        ...lastState,
        lessons: {
          ...lastState.lessons,
          [course]: {
            ...cur,
            ...patch,
            answers: patch.answers ? { ...cur.answers, ...patch.answers } : cur.answers,
          },
        },
      };
    },
  });

  type ViewMode = "tabs" | "sealed" | "lesson";
  /** The one render-mode rule: every render entry point consults this. */
  const viewMode = (): ViewMode => {
    if (engine.isActive()) return "lesson";
    if (
      lastState
      && lastState.lessons
      && lastState.lessons.books.status !== "done"
      && !lastState.lessons.booksSealSkipped
    ) {
      return "sealed";
    }
    return "tabs";
  };

  const refreshTabStyles = () => {
    for (const [key, btn] of tabButtons) {
      btn.classList.toggle("active", key === activeTab);
    }
    // The lesson stage carries its own working tab strip: leaving the real
    // one visible above it reads as a duplicate nav bar.
    strip.style.display = engine.isActive() ? "none" : "";
  };

  for (const t of APP_TABS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-tab";
    const icon = document.createElement("span");
    icon.className = "lmb-tab-icon";
    icon.innerHTML = t.icon;
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

  const renderTabInto = (host: HTMLElement) => {
    if (!lastState) return;
    if (activeTab === "home") renderHomeTab(host, lastState, ctx, send);
    else if (activeTab === "books") renderBooksTab(host, lastState, ctx, send);
    else if (activeTab === "codex") renderCodexTab(host, lastState, ctx, send);
    else if (activeTab === "tuning") renderTuningTab(host, lastState, ctx, send);
    else renderAboutTab(host, lastState, send);
  };

  let lastRenderedTab: TabKey | null = null;
  const doRender = () => {
    if (!lastState) {
      content.replaceChildren();
      lastRenderedTab = null;
      return;
    }
    const mode = viewMode();
    if (mode === "lesson") {
      lastRenderedTab = null;
      clearSealBusy();
      engine.mount(content);
      return;
    }
    if (mode === "sealed") {
      lastRenderedTab = null;
      content.replaceChildren();
      const wrap = document.createElement("div");
      wrap.className = "lmb-seal-wrap";
      const under = document.createElement("div");
      under.className = "lmb-seal-under";
      under.setAttribute("inert", "");
      renderTabInto(under);
      wrap.appendChild(under);
      renderSealPanel(wrap, lastState, send);
      content.appendChild(wrap);
      return;
    }
    clearSealBusy();
    const renderInner = () => renderTabInto(content);
    if (lastRenderedTab === activeTab) {
      preserveScroll(content, renderInner);
    } else {
      renderInner();
    }
    lastRenderedTab = activeTab;
  };

  const renderActive = () => {
    if (viewMode() === "lesson") {
      engine.onHostState();
      return;
    }
    if (hasFocusedEditableChild()) {
      renderPending = true;
      return;
    }
    renderPending = false;
    doRender();
  };

  content.addEventListener("focusout", () => {
    if (!renderPending) return;
    if (viewMode() === "lesson") return;
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
        if (lastState && lastState.activeChatId !== msg.state.activeChatId) closeCodexCatchupModal();
        lastState = msg.state;
        renderActive();
        break;
      case "toast":
        if (msg.tone === "error") console.error(`[LumiBooks] ${msg.text}`);
        else if (msg.tone === "warn") console.warn(`[LumiBooks] ${msg.text}`);
        else console.info(`[LumiBooks] ${msg.tone}: ${msg.text}`);
        showToast(msg.tone, msg.text);
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
          const mode = viewMode();
          if (mode === "lesson") {
            engine.onHostState();
            break;
          }
          if (mode === "sealed") {
            updateSealBusy(lastState);
            break;
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
        if (viewMode() === "tabs" && activeTab === "codex" && lastState) renderActive();
        // A real-mode lesson pane showing the codex needs the fresh files too.
        else if (viewMode() === "lesson") engine.onHostState();
        break;
      case "stream_text":
        deliverStreamText(msg);
        break;
      case "codex_tools_hint":
        // The backend already checks the suppress flag; re-check the local
        // copy so a just-ticked "don't show again" wins races.
        if (lastState && !lastState.settings.suppressToolCallingPrompt) {
          showCodexToolsHintModal(lastState.activeProfile.id, send);
        }
        break;
    }
  });

  // Home's coverage spine dispatches this to jump straight to an entry on
  // the Books shelf.
  const onRevealEntry = (e: Event): void => {
    if (viewMode() !== "tabs") return;
    const entryId = (e as CustomEvent<{ entryId?: string }>).detail?.entryId;
    if (!entryId || !lastState) return;
    focusShelfEntry(entryId);
    activeTab = "books";
    refreshTabStyles();
    doRender();
    scrollPaneTop(content);
  };
  document.addEventListener("lmb-reveal-entry", onRevealEntry);

  // Sealed surfaces and the Academy request lessons through this event, the
  // tabs cannot import the engine without a cycle.
  const onLessonRequest = (e: Event): void => {
    // The fixture renders the real locked codex surfaces, and their seal
    // buttons dispatch this event. Starting a course from inside a course
    // would eat the running one.
    if (engine.isActive()) return;
    const detail = (e as CustomEvent<LessonRequestDetail>).detail;
    if (!detail || (detail.course !== "books" && detail.course !== "codex")) return;
    engine.start(detail.course, { mode: detail.mode ?? "lesson", section: detail.section, fresh: detail.fresh });
  };
  document.addEventListener("lmb-lesson-request", onLessonRequest);

  send({ type: "ready", chatId: null });
  const unsubActivate = tab.onActivate(() => send({ type: "refresh", chatId: null }));

  return () => {
    try { if (engine.isActive()) engine.exit(); } catch (_) { void _; }
    try { unsub(); } catch (_) { void _; }
    try { unsubActivate?.(); } catch (_) { void _; }
    try { document.removeEventListener("lmb-reveal-entry", onRevealEntry); } catch (_) { void _; }
    try { document.removeEventListener("lmb-lesson-request", onLessonRequest); } catch (_) { void _; }
    try { tab.destroy?.(); } catch (_) { void _; }
  };
}

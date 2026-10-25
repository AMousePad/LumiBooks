import { t as tr } from "../../i18n";
import type { HostBreakdown, HostBreakdownEntry } from "../../prompt-breakdown";
import { requestPromptBreakdown, clearPromptRequests } from "../prompt-breakdown";
import { TIER_NAMES, TIER_KINDS, type SummaryKind } from "../../shared";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { ArcView, ChapterView, FrontendState, FrontendToBackend, PendingPreview } from "../../types";
import { LESSON_CHAT_PREFIX, codexLessonGated } from "../../shared";
import {
  field,
  formatTokens,
  lessonMark,
  makeButton,
  pill,
  relativeTime,
  section,
  span,
  statTile,
  textArea,
  textInput,
  textNode,
} from "../components";
import { memoriaSprite, requestLesson } from "../lessons/seal";
import { requestCodexUpdate } from "../modals";

const inflightBusyLabels = new Map<string, HTMLSpanElement>();

function busyTrackKey(kind: string, chatId: string): string {
  return `${kind}::${chatId}`;
}

/* ---------------------------------------------------- live stream viewer */

type StreamKind = SummaryKind | "codex";

let streamWatch: { chatId: string; kind: StreamKind } | null = null;
let streamData = { content: "", thinking: "", running: false };
let streamEls: {
  panel: HTMLElement;
  body: HTMLElement;
  think: HTMLElement;
  text: HTMLElement;
  empty: HTMLElement;
  status: HTMLElement;
} | null = null;

export function deliverStreamText(msg: { chatId: string; kind: string; content: string; thinking: string; running: boolean }): void {
  if (!streamWatch || streamWatch.chatId !== msg.chatId || streamWatch.kind !== msg.kind) return;
  streamData = { content: msg.content, thinking: msg.thinking, running: msg.running };
  patchStreamPanel();
}

function patchStreamPanel(): void {
  const els = streamEls;
  if (!els || !els.panel.isConnected) return;
  const pinned = els.body.scrollHeight - els.body.scrollTop - els.body.clientHeight < 48;
  els.think.textContent = streamData.thinking;
  els.think.style.display = streamData.thinking ? "" : "none";
  els.text.textContent = streamData.content;
  els.text.style.display = streamData.content ? "" : "none";
  els.empty.style.display = streamData.content || streamData.thinking ? "none" : "";
  els.status.textContent = tr("ui.tabs.homeTab.streamStatus", { running: streamData.running ? "yes" : "no" });
  els.panel.classList.toggle("done", !streamData.running);
  if (pinned) els.body.scrollTop = els.body.scrollHeight;
}

function closeStreamWatch(send: (msg: FrontendToBackend) => void): void {
  if (streamWatch) {
    send({ type: "watch_stream", chatId: streamWatch.chatId, kind: streamWatch.kind, on: false });
  }
  streamWatch = null;
  streamEls?.panel.remove();
  streamEls = null;
}

function buildStreamPanel(send: (msg: FrontendToBackend) => void): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "lmb-stream-panel";

  const head = document.createElement("div");
  head.className = "lmb-stream-head";
  const dot = document.createElement("div");
  dot.className = "lmb-busy-dot";
  const title = document.createElement("span");
  title.className = "lmb-stream-title";
  title.textContent = tr("ui.tabs.homeTab.buildStreamPanel.liveFromMemoriaSDesk");
  const status = document.createElement("span");
  status.className = "lmb-stream-status";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "lmb-stream-close";
  close.textContent = tr("ui.tabs.homeTab.buildStreamPanel.value");
  close.title = tr("ui.tabs.homeTab.buildStreamPanel.closeTheLiveView");
  close.addEventListener("click", () => closeStreamWatch(send));
  head.append(dot, title, status, close);

  const body = document.createElement("div");
  body.className = "lmb-stream-body";
  const think = document.createElement("div");
  think.className = "lmb-stream-think";
  const text = document.createElement("div");
  text.className = "lmb-stream-text";
  const empty = document.createElement("div");
  empty.className = "lmb-stream-empty";
  empty.textContent = tr("ui.tabs.homeTab.buildStreamPanel.waitingForTheFirstTokensFromThe");
  body.append(think, text, empty);

  panel.append(head, body);
  streamEls = { panel, body, think, text, empty, status };
  patchStreamPanel();
  return panel;
}

/** In-place label refresh so per-second progress ticks don't rebuild the DOM. */
export function tryUpdateBusyLabelsInPlace(entries: { kind: string; chatId: string; label: string }[]): boolean {
  const keys = new Set(entries.map((b) => busyTrackKey(b.kind, b.chatId)));
  if (keys.size !== inflightBusyLabels.size) return false;
  for (const k of keys) {
    const el = inflightBusyLabels.get(k);
    if (!el || !el.isConnected) return false;
  }
  for (const b of entries) {
    const el = inflightBusyLabels.get(busyTrackKey(b.kind, b.chatId));
    if (el) el.textContent = b.label;
  }
  return true;
}

function lessonReminder(text: string, course: "books" | "codex"): HTMLElement {
  const strip = document.createElement("div");
  strip.className = "lmb-lesson-reminder";
  strip.appendChild(memoriaSprite(28));
  const label = document.createElement("span");
  label.className = "lmb-grow";
  label.textContent = text;
  strip.append(label, makeButton(tr("ui.tabs.homeTab.lessonReminder.takeALesson"), () => requestLesson({ course, mode: "lesson" }), {
    small: true,
    primary: true,
  }));
  return strip;
}

export function renderHomeTab(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  void ctx;
  host.replaceChildren();

  if (state.lessons.books.status !== "done" && state.lessons.booksSealSkipped) {
    host.appendChild(lessonReminder(tr("ui.tabs.homeTab.renderHomeTab.myLessonIsStillWaitingForYou"), "books"));
  }
  if (state.lessons.codex.status !== "done" && state.lessons.codexSealSkipped) {
    host.appendChild(lessonReminder(tr("ui.tabs.homeTab.renderHomeTab.theCodexLessonIsStillWaitingFor"), "codex"));
  }

  if (!state.activeChatId) {
    const empty = section(tr("ui.tabs.homeTab.empty.overview"));
    empty.body.appendChild(textNode(tr("ui.tabs.homeTab.renderHomeTab.openAChatAndMemoriaWillSet"), "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }

  renderOverview(host, state, send);
  renderPromptPanel(host, state, send);
  renderFailure(host, state, send);
  renderPreviews(host, state, send);
  renderActions(host, state, send);
}

/* -------------------------------------------------- host prompt breakdown */
/* The full prompt the host actually fired, read from Lumiverse's stored
 * per-message breakdowns (same data Loom's context meter uses), with a
 * dry-run simulation as fallback so there is never an N/A state: forks and
 * fresh chats have no stored fire, so we preview one through Spindle. */

/** Mirrors Lumiverse's own grouping so this panel and Loom's meter agree. */
const HOST_GROUPS: { id: string; label: string; color: string }[] = [
  { id: "lumiverse", label: tr("ui.tabs.homeTab.hostGroups.promptBlocks"), color: "#8a7fb0" },
  { id: "chatHistory", label: tr("ui.tabs.homeTab.hostGroups.chatHistory"), color: "#d4a842" },
  { id: "longTermMemory", label: tr("ui.tabs.homeTab.hostGroups.longTermMemory"), color: "#e89b5f" },
  { id: "worldInfo", label: tr("ui.tabs.homeTab.hostGroups.worldInfo"), color: "#68b87a" },
  { id: "sidecar", label: tr("ui.tabs.homeTab.hostGroups.sidecar"), color: "#e05daa" },
  { id: "extensions", label: tr("ui.tabs.homeTab.hostGroups.extensions"), color: "#5bc0c0" },
  { id: "system", label: tr("ui.tabs.homeTab.hostGroups.system"), color: "#5b8ca8" },
];

const HOST_TYPE_TO_GROUP: Record<string, string> = {
  block: "lumiverse",
  chat_history: "chatHistory",
  long_term_memory: "longTermMemory",
  world_info: "worldInfo",
  sidecar: "sidecar",
  extension: "extensions",
  authors_note: "extensions",
  separator: "system",
  utility: "system",
  append: "lumiverse",
};

let promptRevision = 0;
let redrawPrompt: (() => void) | null = null;
const promptCache = {
  chatId: null as string | null,
  newestMsgId: null as string | null,
  data: null as HostBreakdown | null,
  source: null as "fire" | "dry" | null,
  at: 0,
  loading: false,
  error: null as string | null,
  expanded: new Set<string>(),
};

/** Static stand-in for the lesson sandbox. The real panel calls host
 * APIs that a fixture chat id must never reach. */
function renderLessonPromptPanel(body: HTMLElement): void {
  const groups: { label: string; color: string; tokens: number }[] = [
    { label: tr("ui.tabs.homeTab.groups.promptBlocks"), color: "#8a7fb0", tokens: 2400 },
    { label: tr("ui.tabs.homeTab.groups.chatHistory"), color: "#d4a842", tokens: 31200 },
    { label: tr("ui.tabs.homeTab.groups.worldInfo"), color: "#68b87a", tokens: 3800 },
    { label: tr("ui.tabs.homeTab.groups.extensions"), color: "#5bc0c0", tokens: 2100 },
  ];
  const max = 200000;
  const total = groups.reduce((a, g) => a + g.tokens, 0);
  const bar = document.createElement("div");
  bar.className = "lmb-spine";
  for (const g of groups) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg";
    seg.style.flexGrow = String(g.tokens);
    seg.style.background = g.color;
    seg.style.opacity = "0.75";
    seg.title = tr("ui.tabs.homeTab.renderLessonPromptPanel.tokens", { label: g.label, tokens: formatTokens(g.tokens) });
    bar.appendChild(seg);
  }
  const free = document.createElement("div");
  free.className = "lmb-spine-seg free";
  free.style.flexGrow = String(max - total);
  bar.appendChild(free);
  body.appendChild(bar);
  const list = document.createElement("div");
  list.className = "lmb-breakdown";
  for (const g of groups) {
    const row = document.createElement("div");
    row.className = "lmb-breakdown-row";
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    swatch.style.background = g.color;
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = g.label;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    t.textContent = formatTokens(g.tokens);
    row.append(swatch, l, t);
    list.appendChild(row);
  }
  const totalRow = document.createElement("div");
  totalRow.className = "lmb-breakdown-row total";
  const pad = document.createElement("span");
  pad.className = "lmb-spine-swatch";
  pad.style.visibility = "hidden";
  const tl = document.createElement("span");
  tl.className = "lmb-breakdown-label";
  tl.textContent = tr("ui.tabs.homeTab.renderLessonPromptPanel.promptVsContextWindow");
  const tt = document.createElement("span");
  tt.className = "lmb-breakdown-tokens";
  tt.textContent = tr("ui.tabs.homeTab.renderLessonPromptPanel.value", { formatTokens: formatTokens(total), formatTokens2: formatTokens(max), round: Math.round((total / max) * 100) });
  totalRow.append(pad, tl, tt);
  list.appendChild(totalRow);
  body.appendChild(list);
  body.appendChild(textNode(tr("ui.tabs.homeTab.renderLessonPromptPanel.simulatedExampleTheLivePanelReadsYour"), "lmb-help"));
}

function renderPromptPanel(host: HTMLElement, state: FrontendState, send: (msg: FrontendToBackend) => void): void {
  const chatId = state.activeChatId;
  if (!chatId) return;
  const sec = section(tr("ui.tabs.homeTab.sec.thePrompt"));
  lessonMark(sec.wrap, "home.prompt");
  const body = document.createElement("div");
  body.className = "lmb-pane";
  sec.body.appendChild(body);
  host.appendChild(sec.wrap);
  if (chatId.startsWith(LESSON_CHAT_PREFIX)) {
    renderLessonPromptPanel(body);
    return;
  }

  const newestMsgId = state.messages.length ? state.messages[state.messages.length - 1]!.id : null;
  const chatChanged = promptCache.chatId !== chatId;
  const newFire = !chatChanged && promptCache.newestMsgId !== newestMsgId;
  if (chatChanged || newFire) {
    ++promptRevision;
    promptCache.chatId = chatId;
    promptCache.data = null;
    promptCache.source = null;
    promptCache.error = null;
    promptCache.loading = false;
    promptCache.expanded.clear();
  }
  promptCache.newestMsgId = newestMsgId;

  const redraw = (): void => {
    if (!body.isConnected) return;
    body.replaceChildren();
    drawPromptContent(body, state, load);
  };
  redrawPrompt = redraw;

  const load = (mode: "auto" | "dry"): void => {
    if (promptCache.loading) return;
    promptCache.loading = true;
    promptCache.error = null;
    redraw();
    const revision = ++promptRevision;
    requestPromptBreakdown(send, { chatId, messageIds: state.messages.slice(-15).map(m => m.id), mode })
      .then(({ d, source }) => {
        if (revision !== promptRevision) return;
        promptCache.data = d;
        promptCache.source = source;
        promptCache.at = Date.now();
      })
      .catch((err) => {
        if (revision !== promptRevision) return;
        promptCache.error = err instanceof Error ? err.message : String(err);
      })
      .finally(() => {
        if (revision !== promptRevision) return;
        promptCache.loading = false;
        redrawPrompt?.();
      });
  };

  drawPromptContent(body, state, load);
  // First visit or a fresh generation: pull the latest fire automatically.
  if (!promptCache.loading && (chatChanged || newFire || (!promptCache.data && !promptCache.error))) {
    load("auto");
  }
}

function drawPromptContent(
  body: HTMLElement,
  state: FrontendState,
  load: (mode: "auto" | "dry") => void,
): void {
  void state;
  const head = document.createElement("div");
  head.className = "lmb-actions";
  const status = document.createElement("span");
  status.className = "lmb-help lmb-grow";
  const simulate = makeButton(tr("ui.tabs.homeTab.simulate.simulate"), () => load("dry"), {
    small: true,
    disabled: promptCache.loading,
    title: tr("ui.tabs.homeTab.simulate.assembleTheNextPromptThroughTheHost"),
  });
  head.append(status, simulate);
  body.appendChild(head);

  if (promptCache.loading) {
    status.textContent = tr("ui.tabs.homeTab.drawPromptContent.readingTheLastFire");
    body.appendChild(textNode(tr("ui.tabs.homeTab.drawPromptContent.memoriaIsAskingTheHostForThe"), "lmb-empty"));
    return;
  }
  if (promptCache.error) {
    status.textContent = tr("ui.tabs.homeTab.drawPromptContent.couldnTReadTheHostPrompt");
    const err = textNode(promptCache.error, "lmb-help");
    const retry = makeButton(tr("ui.tabs.homeTab.retry.retry"), () => load("auto"), { small: true, primary: true });
    const row = document.createElement("div");
    row.className = "lmb-actions";
    row.append(err, retry);
    body.appendChild(row);
    return;
  }
  const data = promptCache.data;
  if (!data) {
    status.textContent = tr("ui.tabs.homeTab.drawPromptContent.noPromptDataYet");
    return;
  }

  const srcLabel = promptCache.source === "fire" ? tr("ui.tabs.homeTab.srcLabel.lastFire") : tr("ui.tabs.homeTab.srcLabel.simulatedNextFire");
  const bits: string[] = [srcLabel, relativeTime(promptCache.at)];
  if (data.model) bits.push(data.model);
  if (data.presetName) bits.push(data.presetName);
  status.textContent = bits.join(" · ");

  // Group entries the same way Loom does.
  const groups = HOST_GROUPS
    .map((g) => ({
      ...g,
      entries: data.entries.filter((e) => (HOST_TYPE_TO_GROUP[e.type] ?? "system") === g.id),
    }))
    .map((g) => ({ ...g, tokens: g.entries.reduce((a, e) => a + e.tokens, 0) }))
    .filter((g) => g.tokens > 0);

  const freeTokens = data.maxContext > 0 ? Math.max(0, data.maxContext - data.totalTokens) : 0;
  // Percentages share one denominator: the window when known, else the prompt.
  const pctDenom = data.maxContext > 0 ? data.maxContext : data.totalTokens;

  const bar = document.createElement("div");
  bar.className = "lmb-spine";
  for (const g of groups) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg";
    seg.style.flexGrow = String(Math.max(1, g.tokens));
    seg.style.background = g.color;
    seg.style.opacity = "0.75";
    seg.title = tr("ui.tabs.homeTab.drawPromptContent.tokens", { label: g.label, tokens: formatTokens(g.tokens) });
    bar.appendChild(seg);
  }
  if (freeTokens > 0) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg free";
    seg.style.flexGrow = String(freeTokens);
    seg.title = tr("ui.tabs.homeTab.drawPromptContent.freeSpaceTokens", { formatTokens: formatTokens(freeTokens) });
    bar.appendChild(seg);
  }
  body.appendChild(bar);

  // Fullness line: the context-length diagnosis at a glance.
  const fullness = document.createElement("div");
  fullness.className = "lmb-breakdown-row total";
  const spacer = document.createElement("span");
  spacer.className = "lmb-spine-swatch";
  spacer.style.visibility = "hidden";
  const fl = document.createElement("span");
  fl.className = "lmb-breakdown-label";
  fl.textContent = data.maxContext > 0 ? tr("ui.tabs.homeTab.drawPromptContent.promptVsContextWindow") : tr("ui.tabs.homeTab.drawPromptContent.promptTotal");
  const ft = document.createElement("span");
  ft.className = "lmb-breakdown-tokens";
  ft.textContent = data.maxContext > 0
    ? `${formatTokens(data.totalTokens)} / ${formatTokens(data.maxContext)} (${Math.round((data.totalTokens / data.maxContext) * 100)}%)`
    : tr("ui.tabs.homeTab.drawPromptContent.tokens2", { totalTokens: formatTokens(data.totalTokens) });
  fullness.append(spacer, fl, ft);
  body.appendChild(fullness);
  if (data.maxContext > 0 && data.totalTokens / data.maxContext > 0.9) {
    body.appendChild(pill(tr("ui.tabs.homeTab.drawPromptContent.contextNearlyFull"), "warn"));
  }

  const list = document.createElement("div");
  list.className = "lmb-breakdown";
  for (const g of groups) {
    const isSynthetic = g.entries.every((e) => e.synthetic);
    const row = document.createElement(isSynthetic ? "div" : "button") as HTMLElement;
    if (!isSynthetic) (row as HTMLButtonElement).type = "button";
    row.className = `lmb-breakdown-row${isSynthetic ? "" : " lmb-breakdown-click"}`;
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    swatch.style.background = g.color;
    swatch.style.opacity = "0.85";
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = isSynthetic ? g.label : `${g.label} (${g.entries.length})`;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round((g.tokens / pctDenom) * 100) : 0;
    t.textContent = tr("ui.tabs.homeTab.drawPromptContent.value", { tokens: formatTokens(g.tokens), pct: pct });
    row.append(swatch, l, t);
    if (!isSynthetic) {
      const chev = document.createElement("span");
      chev.className = `lmb-chevron${promptCache.expanded.has(g.id) ? " open" : ""}`;
      row.appendChild(chev);
      row.addEventListener("click", () => {
        if (promptCache.expanded.has(g.id)) promptCache.expanded.delete(g.id);
        else promptCache.expanded.add(g.id);
        if (body.isConnected) {
          body.replaceChildren();
          drawPromptContent(body, state, load);
        }
      });
    }
    list.appendChild(row);
    if (!isSynthetic && promptCache.expanded.has(g.id)) {
      for (const e of g.entries) {
        const sub = document.createElement("div");
        sub.className = "lmb-breakdown-row sub";
        const pad = document.createElement("span");
        pad.className = "lmb-spine-swatch";
        pad.style.visibility = "hidden";
        const sl = document.createElement("span");
        sl.className = "lmb-breakdown-label";
        sl.textContent = e.extensionName ? `${e.name} (${e.extensionName})` : e.name;
        const st = document.createElement("span");
        st.className = "lmb-breakdown-tokens";
        st.textContent = formatTokens(e.tokens);
        sub.append(pad, sl, st);
        list.appendChild(sub);
      }
    }
  }
  if (data.maxContext > 0) {
    const row = document.createElement("div");
    row.className = "lmb-breakdown-row";
    const swatch = document.createElement("span");
    swatch.className = "lmb-spine-swatch";
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = tr("ui.tabs.homeTab.drawPromptContent.freeSpace");
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round((freeTokens / pctDenom) * 100) : 0;
    t.textContent = tr("ui.tabs.homeTab.drawPromptContent.value2", { formatTokens: formatTokens(freeTokens), pct: pct });
    row.append(swatch, l, t);
    list.appendChild(row);
  }
  body.appendChild(list);
}

/* ------------------------------------------------------------- overview */

type SpineKind = "codex" | SummaryKind | "ghost" | "excluded" | "free";

interface SpineSeg {
  kind: SpineKind;
  count: number;
  from: number;
  to: number;
  /** Entry covering this run, when there is one - clicking jumps to it. */
  entryId: string | null;
  /** Prompt weight: summary tokens for covered runs, raw tokens otherwise. */
  tokens: number;
}

const SPINE_LABEL: Record<SpineKind, string> = {
  codex: tr("ui.tabs.homeTab.spineLabel.knowledgeCodex"),
  volume: tr("ui.tabs.homeTab.spineLabel.inAVolume"),
  series: tr("ui.tabs.homeTab.spineLabel.inASeries"), saga: tr("ui.tabs.homeTab.spineLabel.inASaga"), library: tr("ui.tabs.homeTab.spineLabel.inALibrary"), universe: tr("ui.tabs.homeTab.spineLabel.inAUniverse"),
  arc: tr("ui.tabs.homeTab.spineLabel.inAnArc"),
  chapter: tr("ui.tabs.homeTab.spineLabel.inAChapter"),
  ghost: tr("ui.tabs.homeTab.spineLabel.stagedAsGhost"),
  excluded: "excluded",
  free: "uncompressed",
};

interface EntryInfo {
  kind: SpineKind;
  tokens: number;
  msgCount: number;
  label: string;
}

/** Prompt cost comes from saved text. Provider usage may include reasoning. */
function injectedTokens(v: ChapterView | ArcView): number {
  return v.contentTokens;
}

function collectEntryInfo(state: FrontendState): Map<string, EntryInfo> {
  const info = new Map<string, EntryInfo>();
  const put = (v: ChapterView | ArcView, kind: SpineKind): void => {
    info.set(v.entryId, {
      kind,
      tokens: injectedTokens(v),
      msgCount: Math.max(1, v.meta.msgIds.length),
      label: v.comment || v.meta.title || "",
    });
  };
  for (const v of state.higherBooks) put(v, TIER_KINDS[v.meta.tier - 1]!);
  for (const v of state.volumes) put(v, "volume");
  for (const a of state.arcs) put(a, "arc");
  for (const c of state.chapters) put(c, c.isGhost ? "ghost" : "chapter");
  return info;
}

/** Segments weighted by PROMPT COST: a covered span weighs its summary
 * tokens (that is all it costs now), the uncompressed tail weighs its raw
 * tokens. Compression becomes visible instead of being hidden by message
 * counts. */
function buildSpine(state: FrontendState, info: Map<string, EntryInfo>): SpineSeg[] {
  const segs: SpineSeg[] = [];
  state.messages.forEach((m, i) => {
    const entryId = m.covered && !m.excluded ? m.coveredByEntryId : null;
    const kind: SpineKind = m.excluded
      ? "excluded"
      : entryId
        ? info.get(entryId)?.kind ?? "chapter"
        : "free";
    const last = segs[segs.length - 1];
    // Runs split per entry, not just per kind, so each chapter/arc/volume is
    // its own clickable segment.
    if (last && last.kind === kind && last.entryId === entryId) {
      last.count++;
      last.to = i;
      if (!entryId) last.tokens += m.approxTokens;
    } else {
      segs.push({ kind, count: 1, from: i, to: i, entryId, tokens: entryId ? 0 : m.approxTokens });
    }
  });
  // Covered runs get their entry's summary tokens, apportioned when an entry
  // is split across several runs (rare, after deletions).
  for (const s of segs) {
    if (!s.entryId) continue;
    const e = info.get(s.entryId);
    if (!e) continue;
    s.tokens = Math.max(1, Math.round(e.tokens * (s.count / e.msgCount)));
  }
  return segs;
}

function renderSpine(body: HTMLElement, state: FrontendState): void {
  // ?? 0 guards the window where an older backend hasn't sent this field yet.
  const codexTokens = state.codexInjectedTokens ?? 0;
  if (state.messages.length === 0 && codexTokens === 0) return;
  const info = collectEntryInfo(state);
  const segs = buildSpine(state, info);
  // Constant codex entries (timeline + threads); keyword-retrieved records
  // only cost when a scene activates them, so they stay out of the spine.
  if (codexTokens > 0) {
    segs.unshift({ kind: "codex", count: 0, from: -1, to: -1, entryId: null, tokens: codexTokens });
  }
  if (segs.length === 0) return;

  const spine = document.createElement("div");
  spine.className = "lmb-spine";
  lessonMark(spine, "home.spine");
  for (const s of segs) {
    const seg = document.createElement("div");
    seg.className = `lmb-spine-seg ${s.kind}`;
    seg.style.flexGrow = String(Math.max(1, s.tokens));
    const name = s.entryId ? info.get(s.entryId)?.label : "";
    const where = s.kind === "codex" ? "" : tr("ui.tabs.homeTab.where.msgs", { from1: s.from + 1, to1: s.to + 1 });
    seg.title = tr("ui.tabs.homeTab.renderSpine.tokens", { where: where, kind: name || SPINE_LABEL[s.kind], tokens: formatTokens(s.tokens), choice: (s.entryId) ? "yes" : "no" });
    if (s.entryId) {
      const entryId = s.entryId;
      seg.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("lmb-reveal-entry", { detail: { entryId } }));
      });
    }
    spine.appendChild(seg);
  }
  body.appendChild(spine);
  body.appendChild(lessonMark(renderBreakdown(state), "home.breakdown"));
}

/** Loom-style itemization of Memoria's contribution to the prompt. Computed
 * entirely from local state, so it can never show "N/A". */
function renderBreakdown(state: FrontendState): HTMLElement {
  const codexTokens = state.codexInjectedTokens ?? 0;
  const wrap = document.createElement("div");
  wrap.className = "lmb-breakdown";
  const row = (kind: SpineKind | "total", label: string, tokens: number, approx: boolean): HTMLElement => {
    const r = document.createElement("div");
    r.className = `lmb-breakdown-row${kind === "total" ? " total" : ""}`;
    const swatch = document.createElement("span");
    swatch.className = `lmb-spine-swatch ${kind === "total" ? "" : kind}`;
    const l = document.createElement("span");
    l.className = "lmb-breakdown-label";
    l.textContent = label;
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    t.textContent = `${approx ? "~" : ""}${formatTokens(tokens)}`;
    r.append(swatch, l, t);
    return r;
  };

  // Injected = active entries (roots included, they inject too); ghosts are
  // staged, not injected, so their spans still ride at raw price in the tail.
  const activeVolumes = [...state.volumes, ...state.higherBooks].filter((v) => v.active);
  const activeArcs = state.arcs.filter((a) => a.active);
  const activeChapters = state.chapters.filter((c) => c.active && !c.isGhost);
  const sum = (list: (ChapterView | ArcView)[]): number => list.reduce((acc, v) => acc + injectedTokens(v), 0);
  const volTokens = sum(activeVolumes);
  const arcTokens = sum(activeArcs);
  const chapTokens = sum(activeChapters);
  let tailTokens = 0;
  let tailCount = 0;
  let excludedTokens = 0;
  let excludedCount = 0;
  for (const m of state.messages) {
    if (m.excluded) {
      excludedTokens += m.approxTokens;
      excludedCount++;
    } else if (!m.covered) {
      tailTokens += m.approxTokens;
      tailCount++;
    }
  }

  if (codexTokens > 0) wrap.appendChild(row("codex", tr("ui.tabs.homeTab.renderBreakdown.knowledgeCodexConstantPart"), codexTokens, state.codexTokensApproximate));
  if (activeVolumes.length) wrap.appendChild(row("volume", tr("ui.tabs.homeTab.renderBreakdown.volumesAndHigher", { length: activeVolumes.length }), volTokens, true));
  if (activeArcs.length) wrap.appendChild(row("arc", tr("ui.tabs.homeTab.renderBreakdown.arcs", { length: activeArcs.length }), arcTokens, true));
  if (activeChapters.length) wrap.appendChild(row("chapter", tr("ui.tabs.homeTab.renderBreakdown.chapters", { length: activeChapters.length }), chapTokens, true));
  if (tailCount > 0) wrap.appendChild(row("free", tr("ui.tabs.homeTab.renderBreakdown.uncompressedTailMsgs", { tailCount: tailCount }), tailTokens, true));
  if (excludedCount > 0) wrap.appendChild(row("excluded", tr("ui.tabs.homeTab.renderBreakdown.excludedMsgs", { excludedCount: excludedCount }), excludedTokens, true));
  wrap.title = tr("ui.tabs.homeTab.renderBreakdown.codexCountsIncludeEnabledConstantLorebookEntries");
  const total = codexTokens + volTokens + arcTokens + chapTokens + tailTokens + excludedTokens;
  wrap.appendChild(row("total", tr("ui.tabs.homeTab.renderBreakdown.storyContextInThePrompt"), total, true));
  return wrap;
}

function renderOverview(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const sec = section(tr("ui.tabs.homeTab.sec.overview"));

  const who = document.createElement("div");
  who.className = "lmb-status-grid";
  addRow(who, tr("ui.tabs.homeTab.renderOverview.chat"), state.activeChatName || state.activeChatId!.slice(0, 8));
  if (state.activeCharacterName) addRow(who, tr("ui.tabs.homeTab.renderOverview.character"), state.activeCharacterName);
  sec.body.appendChild(who);

  renderSpine(sec.body, state);

  const cov = state.coverage;
  const pct = cov.totalMessages > 0 ? Math.round((cov.coveredMessages / cov.totalMessages) * 100) : 0;
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  lessonMark(tiles, "home.tiles");
  tiles.appendChild(statTile(`${pct}%`, tr("ui.tabs.homeTab.renderOverview.filed"), tr("ui.tabs.homeTab.renderOverview.ofMsgs", { coveredMessages: cov.coveredMessages, totalMessages: cov.totalMessages }),
    tr("ui.tabs.homeTab.renderOverview.shareOfThisChatSMessagesAlready")));
  tiles.appendChild(statTile(`~${formatTokens(cov.approxUncoveredTokens)}`, tr("ui.tabs.homeTab.renderOverview.tail"), tr("ui.tabs.homeTab.renderOverview.msgsUncompressed", { uncoveredMessages: cov.uncoveredMessages }),
    tr("ui.tabs.homeTab.renderOverview.recentMessagesStillInThePromptAt")));
  const counts = {
    vol: state.volumes.filter((v) => v.active).length,
    arc: state.arcs.filter((a) => a.active).length,
    chap: state.chapters.filter((c) => !c.isGhost && c.active).length,
  };
  const shelfTile = statTile(`${counts.vol} · ${counts.arc} · ${counts.chap}`, tr("ui.tabs.homeTab.shelfTile.shelf"), tr("ui.tabs.homeTab.shelfTile.volArcChap"),
    tr("ui.tabs.homeTab.shelfTile.uncompressedSummariesHoverForExistingHigherTiers"));
  const higherCounts = TIER_KINDS.slice(3).map((kind, i) => ({ kind, count: state.higherBooks.filter((e) => e.active && e.meta.tier === i + 4).length })).filter((e) => e.count > 0);
  if (higherCounts.length) {
    shelfTile.classList.add("lmb-has-higher"); shelfTile.tabIndex = 0;
    const more = document.createElement("div"); more.className = "lmb-higher-peek";
    more.textContent = higherCounts.map((e) => tr("ui.tabs.homeTab.higherCount", { count: e.count, kind: e.kind })).join(" · ");
    shelfTile.appendChild(more);
  }
  tiles.appendChild(shelfTile);
  if (codexLessonGated(state.lessons)) {
    const locked = statTile("🔒", tr("ui.tabs.homeTab.locked.codex"), tr("ui.tabs.homeTab.locked.takeALesson"),
      tr("ui.tabs.homeTab.locked.theKnowledgeCodexUnlocksAfterMemoriaS"));
    locked.classList.add("lmb-bible-tile");
    locked.addEventListener("click", () => requestLesson({ course: "codex", mode: "lesson" }));
    tiles.appendChild(lessonMark(locked, "home.tile.codex"));
  } else if (state.activeProfile.codexEnabled || state.codexExists) {
    const value = state.codexBacklog > 0 ? String(state.codexBacklog) : "✓";
    const subText = state.codexBacklog > 0
      ? state.activeProfile.codexManualOnly ? tr("ui.tabs.homeTab.subText.msgsUnindexedManualOnly") : tr("ui.tabs.homeTab.subText.msgsUnindexed")
      : state.codexLastRunAt
        ? tr("ui.tabs.homeTab.subText.updated", { codexLastRunAt: relativeTime(state.codexLastRunAt) })
        : tr("ui.tabs.homeTab.subText.noCodexYet");
    tiles.appendChild(statTile(value, tr("ui.tabs.homeTab.renderOverview.codex"), subText,
      tr("ui.tabs.homeTab.renderOverview.messagesTheStoryBibleHasNotRead")));
  } else {
    tiles.appendChild(statTile("—", tr("ui.tabs.homeTab.renderOverview.codex"), tr("ui.tabs.homeTab.renderOverview.offEnableInTuning")));
  }
  sec.body.appendChild(tiles);

  inflightBusyLabels.clear();
  if (streamWatch && streamWatch.chatId !== state.activeChatId) {
    send({ type: "watch_stream", chatId: streamWatch.chatId, kind: streamWatch.kind, on: false });
    streamWatch = null;
    streamEls = null;
  }
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    lessonMark(row, "home.busy");
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    const labelSpan = document.createElement("span");
    labelSpan.className = "lmb-grow";
    labelSpan.textContent = b.label;
    row.append(dot, labelSpan);
    const watching = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
    const watchBtn = makeButton(watching ? tr("ui.tabs.homeTab.watchBtn.hide") : tr("ui.tabs.homeTab.watchBtn.watch"), () => {
      const active = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
      if (active) {
        closeStreamWatch(send);
        watchBtn.textContent = tr("ui.tabs.homeTab.watchBtn.watch");
        return;
      }
      closeStreamWatch(send);
      streamWatch = { chatId: b.chatId, kind: b.kind };
      streamData = { content: "", thinking: "", running: true };
      send({ type: "watch_stream", chatId: b.chatId, kind: b.kind, on: true });
      row.insertAdjacentElement("afterend", buildStreamPanel(send));
      watchBtn.textContent = tr("ui.tabs.homeTab.watchBtn.hide");
    }, { small: true, title: tr("ui.tabs.homeTab.watchBtn.seeMemoriaSRawOutputStreamIn") });
    const abortBtn = makeButton(tr("ui.tabs.homeTab.abortBtn.abort"), () => {
      abortBtn.disabled = true;
      send({ type: "abort_busy", chatId: b.chatId, kind: b.kind });
    }, { danger: true, small: true, title: tr("ui.tabs.homeTab.abortBtn.cancelTheInFlightGeneration") });
    row.append(watchBtn, abortBtn);
    sec.body.appendChild(row);
    if (watching) sec.body.appendChild(buildStreamPanel(send));
    inflightBusyLabels.set(busyTrackKey(b.kind, b.chatId), labelSpan);
  }
  // The run ended but the reader may still be mid-page: keep the finished
  // transcript up until they close it.
  if (streamWatch && !state.busy.some((b) => b.chatId === streamWatch!.chatId && b.kind === streamWatch!.kind)) {
    streamData.running = false;
    sec.body.appendChild(buildStreamPanel(send));
  }

  if (!state.connections.length) {
    sec.body.appendChild(textNode(tr("ui.tabs.homeTab.renderOverview.memoriaHasNoConnectionToWriteWith"), "lmb-empty"));
  } else if (!state.resolvedSidecarConnectionId) {
    sec.body.appendChild(textNode(tr("ui.tabs.homeTab.renderOverview.pickAConnectionInTheTuningTab"), "lmb-empty"));
  }

  host.appendChild(sec.wrap);
}

/* ------------------------------------------------------------- failure */

function renderFailure(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  if (!state.lastFailure || !state.activeChatId) return;
  const f = state.lastFailure;
  const sec = document.createElement("div");
  sec.className = "lmb-failure";
  lessonMark(sec, "home.failure");
  const head = document.createElement("div");
  head.style.fontWeight = "600";
  head.textContent = f.kind === "arc" ? tr("ui.tabs.homeTab.renderFailure.lastArcAttemptFailed")
    : f.kind !== "chapter" ? tr("ui.tabs.homeTab.renderFailure.lastAttemptFailed", { kind: f.kind })
    : tr("ui.tabs.homeTab.renderFailure.lastChapterAttemptFailed");
  const detail = document.createElement("div");
  detail.style.opacity = "0.85";
  detail.textContent = f.phase === "save"
    ? tr("ui.tabs.homeTab.renderFailure.saveFailed", { message: f.message })
    : tr("ui.tabs.homeTab.renderFailure.triedX", { message: f.message, retriedTimes: f.retriedTimes });
  const row = document.createElement("div");
  row.className = "lmb-actions";
  const chatId = state.activeChatId;
  row.append(
    makeButton(tr("ui.tabs.homeTab.renderFailure.retry"), () => send({ type: "retry_last_failure", chatId }), { primary: true, small: true }),
  );
  sec.append(head, detail, row);
  host.appendChild(sec);
}

/* ------------------------------------------------------------- previews */

function renderPreviews(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  if (state.pendingPreviews.length === 0 || !state.activeChatId) return;
  const sec = section(tr("ui.tabs.homeTab.sec.pendingPreviews", { length: state.pendingPreviews.length }));
  for (const p of state.pendingPreviews) {
    sec.body.appendChild(renderPreviewCard(p, state.activeChatId, send));
  }
  host.appendChild(sec.wrap);
}

function renderPreviewCard(preview: PendingPreview, chatId: string, send: (m: FrontendToBackend) => void): HTMLElement {
  const card = document.createElement("div");
  card.className = "lmb-preview-card";

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "center";
  head.style.gap = "8px";
  const tag = document.createElement("span");
  tag.className = `lmb-entry-tag ${preview.kind !== "chapter" ? preview.kind : ""}`.trim();
  tag.textContent = tr("shared.summaryKindTag", { kind: preview.kind });
  head.append(tag, span(preview.title, "lmb-entry-title"));
  card.appendChild(head);

  let lastSentTitle = preview.title;
  let lastSentContent = preview.content;
  const syncEdit = () => {
    const liveTitle = titleInput.value;
    const liveContent = contentInput.value;
    const patch: { title?: string; content?: string } = {};
    if (liveTitle !== lastSentTitle) patch.title = liveTitle;
    if (liveContent !== lastSentContent) patch.content = liveContent;
    if (Object.keys(patch).length === 0) return;
    lastSentTitle = liveTitle;
    lastSentContent = liveContent;
    send({ type: "edit_preview", chatId, draftId: preview.draftId, patch });
  };

  const titleField = field(tr("ui.tabs.homeTab.titleField.title"));
  const titleInput = textInput({ value: preview.title, onChange: syncEdit });
  titleField.body.appendChild(titleInput);
  card.appendChild(titleField.wrap);

  const contentField = field(tr("ui.tabs.homeTab.contentField.content"));
  const contentInput = textArea({ value: preview.content, rows: 10, onChange: syncEdit });
  contentField.body.appendChild(contentInput);
  card.appendChild(contentField.wrap);

  if (preview.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = tr("ui.tabs.homeTab.renderPreviewCard.memoria", { shortComment: preview.shortComment });
    card.appendChild(cm);
  }

  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  meta.append(
    span(tr("ui.common.messageCount", { count: preview.sourceMessageIds.length })),
    span(tr("ui.tabs.homeTab.renderPreviewCard.tokens", { tokenCountOutput: formatTokens(preview.tokenCountOutput) })),
    span(preview.model || ""),
  );
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton(tr("ui.tabs.homeTab.renderPreviewCard.save"), () => {
      send({
        type: "edit_preview",
        chatId,
        draftId: preview.draftId,
        patch: { title: titleInput.value, content: contentInput.value },
      });
      send({ type: "accept_preview", chatId, draftId: preview.draftId });
    }, { primary: true, small: true }),
    makeButton(tr("ui.tabs.homeTab.renderPreviewCard.discard"), () => send({ type: "discard_preview", chatId, draftId: preview.draftId }), { danger: true, small: true }),
  );
  card.appendChild(actions);
  return card;
}

/* ------------------------------------------------------------- actions */

function renderActions(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  if (!state.activeChatId) return;
  const sec = section(tr("ui.tabs.homeTab.sec.actions"));
  const chatId = state.activeChatId;
  const disabled = state.busy.length > 0 || !state.settings.enabled;

  const readiness = document.createElement("div");
  readiness.className = "lmb-actions";
  lessonMark(readiness, "home.pills");
  readiness.append(
    pill(state.coverage.lagSatisfied ? tr("ui.tabs.homeTab.renderActions.lagReady") : tr("ui.tabs.homeTab.renderActions.lagBuilding"), state.coverage.lagSatisfied ? "ok" : "warn"),
    pill(state.coverage.windowAvailable ? tr("ui.tabs.homeTab.renderActions.windowReady") : tr("ui.tabs.homeTab.renderActions.windowBuilding"), state.coverage.windowAvailable ? "ok" : "warn"),
  );
  if (state.backlogChapters > 0) readiness.appendChild(pill(tr("ui.tabs.homeTab.renderActions.chapterReady", { backlogChapters: state.backlogChapters })));
  if (state.backlogArcs > 0) readiness.appendChild(pill(tr("ui.tabs.homeTab.renderActions.arcReady", { backlogArcs: state.backlogArcs })));
  sec.body.appendChild(readiness);

  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "home.actions");
  row.append(
    lessonMark(makeButton(tr("ui.tabs.homeTab.renderActions.fileChapter"), () => send({ type: "create_chapter", chatId }), {
      primary: true,
      disabled,
      title: tr("ui.tabs.homeTab.renderActions.compressTheOldestUncoveredMessagesIntoA"),
    }), "home.actions.file"),
  );
  if (state.backlogChapters > 1) {
    row.append(
      makeButton(tr("ui.tabs.homeTab.renderActions.fileAll", { backlogChapters: state.backlogChapters }), () => send({ type: "create_all_chapters", chatId }), {
        disabled,
        title: tr("ui.tabs.homeTab.renderActions.drainTheChapterBacklogKeepsFilingChapters"),
      }),
    );
  }
  row.append(
    makeButton(tr("ui.tabs.homeTab.renderActions.bindArc"), () => send({ type: "create_arc", chatId }), {
      disabled,
      title: tr("ui.tabs.homeTab.renderActions.rollTheOldestUnsupersededChaptersIntoA"),
    }),
  );
  if (state.backlogArcs > 1) {
    row.append(
      makeButton(tr("ui.tabs.homeTab.renderActions.bindAll", { backlogArcs: state.backlogArcs }), () => send({ type: "create_all_arcs", chatId }), {
        disabled,
        title: tr("ui.tabs.homeTab.renderActions.drainTheArcBacklogKeepsBindingArcs"),
      }),
    );
  }
  if (codexLessonGated(state.lessons)) {
    const lockedBtn = makeButton(tr("ui.tabs.homeTab.lockedBtn.codexTakeALesson"), () => requestLesson({ course: "codex", mode: "lesson" }), {
      title: tr("ui.tabs.homeTab.lockedBtn.theCodexUnlocksAfterMemoriaSCodex"),
    });
    lockedBtn.classList.add("lmb-locked-btn");
    row.append(lessonMark(lockedBtn, "home.actions.updatecodex"));
  } else if (state.activeProfile.codexEnabled) {
    row.append(
      lessonMark(makeButton(tr("ui.tabs.homeTab.renderActions.updateCodex"), () => requestCodexUpdate(state, chatId, send), {
        disabled: disabled || state.busy.some((b) => b.kind === "codex" && b.chatId === chatId),
        title: tr("ui.tabs.homeTab.renderActions.consumeEverythingUpToTheNewestMessage"),
      }), "home.actions.updatecodex"),
    );
  }
  sec.body.appendChild(row);

  // "3 chapters ready" beside dead buttons needs a stated cause, or the
  // buttons just look broken.
  if (state.busy.length > 0 && state.settings.enabled) {
    sec.body.appendChild(textNode(tr("ui.tabs.homeTab.renderActions.actionsUnlockWhenMemoriaFinishesHerCurrent"), "lmb-help"));
  } else if (!state.settings.enabled) {
    sec.body.appendChild(textNode(tr("ui.tabs.homeTab.renderActions.theExtensionIsOffFlipItOn"), "lmb-help"));
  }

  const shelfRow = document.createElement("div");
  shelfRow.className = "lmb-actions";
  lessonMark(shelfRow, "home.bookpill");
  if (!state.bookId) {
    const empty = pill(tr("ui.tabs.homeTab.empty.noBookYet"), "warn");
    empty.title = tr("ui.tabs.homeTab.renderActions.memoriaWillCreateThisChatSWorld");
    shelfRow.appendChild(empty);
  } else {
    const tag = pill(state.bookName ? state.bookName : tr("ui.tabs.homeTab.tag.bookReady"), "ok");
    tag.title = tr("ui.tabs.homeTab.renderActions.worldBookWhereChaptersAndArcsAre");
    shelfRow.appendChild(tag);
  }
  sec.body.appendChild(shelfRow);

  host.appendChild(sec.wrap);
}

function addRow(grid: HTMLElement, label: string, value: string): void {
  const l = document.createElement("div");
  l.className = "lmb-label";
  l.textContent = label;
  const v = document.createElement("div");
  v.className = "lmb-value";
  v.textContent = value;
  grid.append(l, v);
}

/** Lesson-stage exit hook: the fixture chat polluted this module's caches. */
export function resetHomeTabLocal(): void {
  ++promptRevision;
  redrawPrompt = null;
  clearPromptRequests();
  inflightBusyLabels.clear();
  streamWatch = null;
  streamEls = null;
  streamData = { content: "", thinking: "", running: false };
  promptCache.chatId = null;
  promptCache.newestMsgId = null;
  promptCache.data = null;
  promptCache.source = null;
  promptCache.error = null;
  promptCache.loading = false;
  promptCache.expanded.clear();
}

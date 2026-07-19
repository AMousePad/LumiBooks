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

type StreamKind = "chapter" | "arc" | "volume" | "codex";

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
  els.status.textContent = streamData.running ? "streaming" : "finished";
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
  title.textContent = "Live from Memoria's desk";
  const status = document.createElement("span");
  status.className = "lmb-stream-status";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "lmb-stream-close";
  close.textContent = "✕";
  close.title = "Close the live view";
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
  empty.textContent = "Waiting for the first tokens from the model...";
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
  strip.append(label, makeButton("Take a Lesson", () => requestLesson({ course, mode: "lesson" }), {
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
    host.appendChild(lessonReminder("My lesson is still waiting for you", "books"));
  }
  if (state.lessons.codex.status !== "done" && state.lessons.codexSealSkipped) {
    host.appendChild(lessonReminder("The codex lesson is still waiting for you", "codex"));
  }

  if (!state.activeChatId) {
    const empty = section("Overview");
    empty.body.appendChild(textNode("Open a chat and Memoria will set up her desk", "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }

  renderOverview(host, state, send);
  renderPromptPanel(host, state);
  renderFailure(host, state, send);
  renderPreviews(host, state, send);
  renderActions(host, state, send);
}

/* -------------------------------------------------- host prompt breakdown */
/* The full prompt the host actually fired, read from Lumiverse's stored
 * per-message breakdowns (same data Loom's context meter uses), with a
 * dry-run simulation as fallback so there is never an N/A state: forks and
 * fresh chats have no stored fire, so we fire a dry one. Same-origin fetches
 * ride the page session. */

interface HostBreakdownEntry {
  name: string;
  type: string;
  tokens: number;
  extensionName?: string;
  /** Rebuilt from the host's chatHistoryTokens scalar; no real entries. */
  synthetic?: boolean;
}

interface HostBreakdown {
  entries: HostBreakdownEntry[];
  totalTokens: number;
  maxContext: number;
  model?: string;
  presetName?: string;
}

/** Mirrors Lumiverse's own grouping so this panel and Loom's meter agree. */
const HOST_GROUPS: { id: string; label: string; color: string }[] = [
  { id: "lumiverse", label: "Prompt blocks", color: "#8a7fb0" },
  { id: "chatHistory", label: "Chat history", color: "#d4a842" },
  { id: "longTermMemory", label: "Long-term memory", color: "#e89b5f" },
  { id: "worldInfo", label: "World info", color: "#68b87a" },
  { id: "sidecar", label: "Sidecar", color: "#e05daa" },
  { id: "extensions", label: "Extensions", color: "#5bc0c0" },
  { id: "system", label: "System", color: "#5b8ca8" },
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

function normalizeBreakdown(raw: Record<string, unknown>, chatHistoryTokens = 0): HostBreakdown | null {
  const entries = Array.isArray(raw["entries"]) ? raw["entries"] : null;
  if (!entries) return null;
  const clean: HostBreakdownEntry[] = [];
  for (const e of entries as Record<string, unknown>[]) {
    if (!e || typeof e !== "object") continue;
    const tokens = typeof e["tokens"] === "number" ? e["tokens"] : 0;
    clean.push({
      name: typeof e["name"] === "string" ? e["name"] : "?",
      type: typeof e["type"] === "string" ? e["type"] : "utility",
      tokens,
      extensionName: typeof e["extensionName"] === "string" ? e["extensionName"] : undefined,
    });
  }
  // The host strips chat_history entries and reports their sum separately.
  if (chatHistoryTokens > 0 && !clean.some((e) => e.type === "chat_history")) {
    clean.unshift({ name: "Assembled transcript", type: "chat_history", tokens: chatHistoryTokens, synthetic: true });
  }
  const summed = clean.reduce((a, e) => a + e.tokens, 0);
  return {
    entries: clean,
    totalTokens: typeof raw["totalTokens"] === "number" ? (raw["totalTokens"] as number) : summed,
    maxContext: typeof raw["maxContext"] === "number" ? (raw["maxContext"] as number) : 0,
    model: typeof raw["model"] === "string" ? (raw["model"] as string) : undefined,
    presetName: typeof raw["presetName"] === "string" ? (raw["presetName"] as string) : undefined,
  };
}

/** Newest stored fire, walking back over recent messages (stored breakdowns
 * are keyed by generated message id; user messages 404 harmlessly). */
async function fetchStoredBreakdown(messages: { id: string }[]): Promise<HostBreakdown | null> {
  const recent = messages.slice(-15).reverse();
  for (const m of recent) {
    const res = await fetch(`/api/v1/generate/breakdown/${encodeURIComponent(m.id)}`, { credentials: "same-origin" });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`breakdown fetch failed (${res.status})`);
    const j = await res.json() as Record<string, unknown>;
    const historyTokens = typeof j["chatHistoryTokens"] === "number" ? (j["chatHistoryTokens"] as number) : 0;
    const data = normalizeBreakdown(j, historyTokens);
    if (data) return data;
  }
  return null;
}

/** Simulate the next fire through the host's real assembly pipeline. */
async function fetchDryRun(chatId: string): Promise<HostBreakdown> {
  const res = await fetch(`/api/v1/generate/dry-run`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId }),
  });
  if (!res.ok) throw new Error(`dry run failed (${res.status})`);
  const j = await res.json() as Record<string, unknown>;
  const tc = j["tokenCount"] as Record<string, unknown> | undefined;
  // max_context_length is stripped from dry-run parameters; contextClipStats keeps it.
  const clip = j["contextClipStats"] as Record<string, unknown> | undefined;
  const params = j["parameters"] as Record<string, unknown> | undefined;
  const maxContext = clip && typeof clip["maxContext"] === "number" && clip["maxContext"] > 0
    ? (clip["maxContext"] as number)
    : params && typeof params["max_context_length"] === "number"
      ? (params["max_context_length"] as number)
      : 0;
  const historyTokens = typeof j["chatHistoryTokens"] === "number" ? (j["chatHistoryTokens"] as number) : 0;
  const data = normalizeBreakdown({
    entries: tc?.["breakdown"] ?? [],
    totalTokens: tc?.["total_tokens"],
    maxContext,
    model: j["model"],
  }, historyTokens);
  if (!data || data.entries.length === 0) throw new Error("dry run returned no breakdown");
  return data;
}

/** Static stand-in for the lesson sandbox. The real panel fetches host
 * endpoints that a fixture chat id must never reach. */
function renderLessonPromptPanel(body: HTMLElement): void {
  const groups: { label: string; color: string; tokens: number }[] = [
    { label: "Prompt blocks", color: "#8a7fb0", tokens: 2400 },
    { label: "Chat history", color: "#d4a842", tokens: 31200 },
    { label: "World info", color: "#68b87a", tokens: 3800 },
    { label: "Extensions", color: "#5bc0c0", tokens: 2100 },
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
    seg.title = `${g.label} · ${formatTokens(g.tokens)} tokens`;
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
  tl.textContent = "Prompt vs context window";
  const tt = document.createElement("span");
  tt.className = "lmb-breakdown-tokens";
  tt.textContent = `${formatTokens(total)} / ${formatTokens(max)} (${Math.round((total / max) * 100)}%)`;
  totalRow.append(pad, tl, tt);
  list.appendChild(totalRow);
  body.appendChild(list);
  body.appendChild(textNode("Simulated example, the live panel reads your host's real prompt.", "lmb-help"));
}

function renderPromptPanel(host: HTMLElement, state: FrontendState): void {
  const chatId = state.activeChatId;
  if (!chatId) return;
  const sec = section("The Prompt");
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
  if (chatChanged) {
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

  const load = (mode: "auto" | "dry"): void => {
    if (promptCache.loading) return;
    promptCache.loading = true;
    promptCache.error = null;
    redraw();
    (async () => {
      if (mode === "dry") return fetchDryRun(chatId).then((d) => ({ d, source: "dry" as const }));
      const stored = await fetchStoredBreakdown(state.messages);
      if (stored) return { d: stored, source: "fire" as const };
      const dry = await fetchDryRun(chatId);
      return { d: dry, source: "dry" as const };
    })()
      .then(({ d, source }) => {
        promptCache.data = d;
        promptCache.source = source;
        promptCache.at = Date.now();
      })
      .catch((err) => {
        promptCache.error = err instanceof Error ? err.message : String(err);
      })
      .finally(() => {
        promptCache.loading = false;
        redraw();
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
  const simulate = makeButton("Simulate", () => load("dry"), {
    small: true,
    disabled: promptCache.loading,
    title: "Assemble the next prompt through the host pipeline without generating (dry run)",
  });
  head.append(status, simulate);
  body.appendChild(head);

  if (promptCache.loading) {
    status.textContent = "Reading the last fire...";
    body.appendChild(textNode("Memoria is asking the host for the prompt breakdown", "lmb-empty"));
    return;
  }
  if (promptCache.error) {
    status.textContent = "Couldn't read the host prompt";
    const err = textNode(promptCache.error, "lmb-help");
    const retry = makeButton("Retry", () => load("auto"), { small: true, primary: true });
    const row = document.createElement("div");
    row.className = "lmb-actions";
    row.append(err, retry);
    body.appendChild(row);
    return;
  }
  const data = promptCache.data;
  if (!data) {
    status.textContent = "No prompt data yet";
    return;
  }

  const srcLabel = promptCache.source === "fire" ? "last fire" : "simulated next fire";
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
    seg.title = `${g.label} · ${formatTokens(g.tokens)} tokens`;
    bar.appendChild(seg);
  }
  if (freeTokens > 0) {
    const seg = document.createElement("div");
    seg.className = "lmb-spine-seg free";
    seg.style.flexGrow = String(freeTokens);
    seg.title = `Free space · ${formatTokens(freeTokens)} tokens`;
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
  fl.textContent = data.maxContext > 0 ? "Prompt vs context window" : "Prompt total";
  const ft = document.createElement("span");
  ft.className = "lmb-breakdown-tokens";
  ft.textContent = data.maxContext > 0
    ? `${formatTokens(data.totalTokens)} / ${formatTokens(data.maxContext)} (${Math.round((data.totalTokens / data.maxContext) * 100)}%)`
    : `${formatTokens(data.totalTokens)} tokens`;
  fullness.append(spacer, fl, ft);
  body.appendChild(fullness);
  if (data.maxContext > 0 && data.totalTokens / data.maxContext > 0.9) {
    body.appendChild(pill("context nearly full", "warn"));
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
    t.textContent = `${formatTokens(g.tokens)} · ${pct}%`;
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
    l.textContent = "Free space";
    const t = document.createElement("span");
    t.className = "lmb-breakdown-tokens";
    const pct = pctDenom > 0 ? Math.round((freeTokens / pctDenom) * 100) : 0;
    t.textContent = `${formatTokens(freeTokens)} · ${pct}%`;
    row.append(swatch, l, t);
    list.appendChild(row);
  }
  body.appendChild(list);
}

/* ------------------------------------------------------------- overview */

type SpineKind = "codex" | "volume" | "arc" | "chapter" | "ghost" | "excluded" | "free";

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
  codex: "Knowledge Codex",
  volume: "in a volume",
  arc: "in an arc",
  chapter: "in a chapter",
  ghost: "staged as ghost",
  excluded: "excluded",
  free: "uncompressed",
};

interface EntryInfo {
  kind: SpineKind;
  tokens: number;
  msgCount: number;
  label: string;
}

/** The real completion count from generation when we have it, else the
 * char-approximation of what actually gets injected. */
function injectedTokens(v: ChapterView | ArcView): number {
  return v.meta.tokenCountOutput > 0 ? v.meta.tokenCountOutput : v.contentTokens;
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
    const where = s.kind === "codex" ? "" : `msgs ${s.from + 1}–${s.to + 1} · `;
    seg.title = `${where}${name || SPINE_LABEL[s.kind]} · ~${formatTokens(s.tokens)} tokens${s.entryId ? " (click to open)" : ""}`;
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
  const activeVolumes = state.volumes.filter((v) => v.active);
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

  if (codexTokens > 0) wrap.appendChild(row("codex", "Knowledge Codex (constant part)", codexTokens, true));
  if (activeVolumes.length) wrap.appendChild(row("volume", `Volumes (${activeVolumes.length})`, volTokens, false));
  if (activeArcs.length) wrap.appendChild(row("arc", `Arcs (${activeArcs.length})`, arcTokens, false));
  if (activeChapters.length) wrap.appendChild(row("chapter", `Chapters (${activeChapters.length})`, chapTokens, false));
  if (tailCount > 0) wrap.appendChild(row("free", `Uncompressed tail (${tailCount} msgs)`, tailTokens, true));
  if (excludedCount > 0) wrap.appendChild(row("excluded", `Excluded (${excludedCount} msgs)`, excludedTokens, true));
  const total = codexTokens + volTokens + arcTokens + chapTokens + tailTokens + excludedTokens;
  wrap.appendChild(row("total", "Story context in the prompt", total, true));
  return wrap;
}

function renderOverview(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const sec = section("Overview");

  const who = document.createElement("div");
  who.className = "lmb-status-grid";
  addRow(who, "Chat", state.activeChatName || state.activeChatId!.slice(0, 8));
  if (state.activeCharacterName) addRow(who, "Character", state.activeCharacterName);
  sec.body.appendChild(who);

  renderSpine(sec.body, state);

  const cov = state.coverage;
  const pct = cov.totalMessages > 0 ? Math.round((cov.coveredMessages / cov.totalMessages) * 100) : 0;
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  lessonMark(tiles, "home.tiles");
  tiles.appendChild(statTile(`${pct}%`, "Filed", `${cov.coveredMessages} of ${cov.totalMessages} msgs`,
    "Share of this chat's messages already compressed into the shelf"));
  tiles.appendChild(statTile(`~${formatTokens(cov.approxUncoveredTokens)}`, "Tail", `${cov.uncoveredMessages} msgs uncompressed`,
    "Recent messages still in the prompt at full size, waiting to pass the lag"));
  const own = {
    vol: state.volumes.filter((v) => !v.isRoot).length,
    arc: state.arcs.filter((a) => !a.isRoot).length,
    chap: state.chapters.filter((c) => !c.isRoot && !c.isGhost).length,
  };
  tiles.appendChild(statTile(`${own.vol} · ${own.arc} · ${own.chap}`, "Shelf", "vol · arc · chap",
    "Volumes, arcs, and chapters Memoria has filed for this chat"));
  if (codexLessonGated(state.lessons)) {
    const locked = statTile("🔒", "Codex", "take a lesson",
      "The Knowledge Codex unlocks after Memoria's codex lesson");
    locked.classList.add("lmb-bible-tile");
    locked.addEventListener("click", () => requestLesson({ course: "codex", mode: "lesson" }));
    tiles.appendChild(lessonMark(locked, "home.tile.codex"));
  } else if (state.activeProfile.codexEnabled || state.codexExists) {
    const value = state.codexBacklog > 0 ? String(state.codexBacklog) : "✓";
    const subText = state.codexBacklog > 0
      ? "msgs unindexed"
      : state.codexLastRunAt
        ? `updated ${relativeTime(state.codexLastRunAt)}`
        : "no codex yet";
    tiles.appendChild(statTile(value, "Codex", subText,
      "Messages the story bible has not read yet"));
  } else {
    tiles.appendChild(statTile("—", "Codex", "off, enable in Tuning"));
  }
  sec.body.appendChild(tiles);

  inflightBusyLabels.clear();
  // A watch on a chat we're no longer looking at is dead weight.
  if (streamWatch && streamWatch.chatId !== state.activeChatId) {
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
    const watchBtn = makeButton(watching ? "Hide" : "Watch", () => {
      const active = !!streamWatch && streamWatch.chatId === b.chatId && streamWatch.kind === b.kind;
      if (active) {
        closeStreamWatch(send);
        watchBtn.textContent = "Watch";
        return;
      }
      closeStreamWatch(send);
      streamWatch = { chatId: b.chatId, kind: b.kind };
      streamData = { content: "", thinking: "", running: true };
      send({ type: "watch_stream", chatId: b.chatId, kind: b.kind, on: true });
      row.insertAdjacentElement("afterend", buildStreamPanel(send));
      watchBtn.textContent = "Hide";
    }, { small: true, title: "See Memoria's raw output stream in real time" });
    const abortBtn = makeButton("Abort", () => {
      abortBtn.disabled = true;
      send({ type: "abort_busy", chatId: b.chatId, kind: b.kind });
    }, { danger: true, small: true, title: "Cancel the in-flight generation" });
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
    sec.body.appendChild(textNode("Memoria has no connection to write with. Set one up in Lumiverse.", "lmb-empty"));
  } else if (!state.resolvedSidecarConnectionId) {
    sec.body.appendChild(textNode("Pick a connection in the Tuning tab so Memoria can write.", "lmb-empty"));
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
  head.textContent = f.kind === "arc" ? "Last arc attempt failed"
    : f.kind === "volume" ? "Last volume attempt failed"
    : "Last chapter attempt failed";
  const detail = document.createElement("div");
  detail.style.opacity = "0.85";
  detail.textContent = `${f.message} (tried ${f.retriedTimes}x)`;
  const row = document.createElement("div");
  row.className = "lmb-actions";
  const chatId = state.activeChatId;
  row.append(
    makeButton("Retry", () => send({ type: "retry_last_failure", chatId }), { primary: true, small: true }),
  );
  sec.append(head, detail, row);
  host.appendChild(sec);
}

/* ------------------------------------------------------------- previews */

function renderPreviews(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  if (state.pendingPreviews.length === 0 || !state.activeChatId) return;
  const sec = section(`Pending previews (${state.pendingPreviews.length})`);
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
  tag.textContent = preview.kind.toUpperCase();
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

  const titleField = field("Title");
  const titleInput = textInput({ value: preview.title, onChange: syncEdit });
  titleField.body.appendChild(titleInput);
  card.appendChild(titleField.wrap);

  const contentField = field("Content");
  const contentInput = textArea({ value: preview.content, rows: 10, onChange: syncEdit });
  contentField.body.appendChild(contentInput);
  card.appendChild(contentField.wrap);

  if (preview.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = `Memoria: ${preview.shortComment}`;
    card.appendChild(cm);
  }

  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  meta.append(
    span(`${preview.sourceMessageIds.length} msgs`),
    span(`${formatTokens(preview.tokenCountOutput)} tokens`),
    span(preview.model || ""),
  );
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton("Save", () => {
      send({
        type: "edit_preview",
        chatId,
        draftId: preview.draftId,
        patch: { title: titleInput.value, content: contentInput.value },
      });
      send({ type: "accept_preview", chatId, draftId: preview.draftId });
    }, { primary: true, small: true }),
    makeButton("Discard", () => send({ type: "discard_preview", chatId, draftId: preview.draftId }), { danger: true, small: true }),
  );
  card.appendChild(actions);
  return card;
}

/* ------------------------------------------------------------- actions */

function renderActions(host: HTMLElement, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  if (!state.activeChatId) return;
  const sec = section("Actions");
  const chatId = state.activeChatId;
  const disabled = state.busy.length > 0 || !state.settings.enabled;

  const readiness = document.createElement("div");
  readiness.className = "lmb-actions";
  lessonMark(readiness, "home.pills");
  readiness.append(
    pill(state.coverage.lagSatisfied ? "lag ready" : "lag building", state.coverage.lagSatisfied ? "ok" : "warn"),
    pill(state.coverage.windowAvailable ? "window ready" : "window building", state.coverage.windowAvailable ? "ok" : "warn"),
  );
  if (state.backlogChapters > 0) readiness.appendChild(pill(`${state.backlogChapters} chapter${state.backlogChapters === 1 ? "" : "s"} ready`));
  if (state.backlogArcs > 0) readiness.appendChild(pill(`${state.backlogArcs} arc${state.backlogArcs === 1 ? "" : "s"} ready`));
  sec.body.appendChild(readiness);

  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "home.actions");
  row.append(
    lessonMark(makeButton("File chapter", () => send({ type: "create_chapter", chatId }), {
      primary: true,
      disabled,
      title: "Compress the oldest uncovered window into a new chapter using the current profile",
    }), "home.actions.file"),
  );
  if (state.backlogChapters > 1) {
    row.append(
      makeButton(`File all (${state.backlogChapters})`, () => send({ type: "create_all_chapters", chatId }), {
        disabled,
        title: "Drain the chapter backlog - keeps filing chapters until the lag or window threshold blocks further compression",
      }),
    );
  }
  row.append(
    makeButton("Bind arc", () => send({ type: "create_arc", chatId }), {
      disabled,
      title: "Roll the oldest unsuperseded chapters into a single arc",
    }),
  );
  if (state.backlogArcs > 1) {
    row.append(
      makeButton(`Bind all (${state.backlogArcs})`, () => send({ type: "create_all_arcs", chatId }), {
        disabled,
        title: "Drain the arc backlog - keeps binding arcs until the configured arc trigger no longer fires",
      }),
    );
  }
  if (codexLessonGated(state.lessons)) {
    const lockedBtn = makeButton("🔒 Codex · take a lesson", () => requestLesson({ course: "codex", mode: "lesson" }), {
      title: "The codex unlocks after Memoria's codex lesson",
    });
    lockedBtn.classList.add("lmb-locked-btn");
    row.append(lessonMark(lockedBtn, "home.actions.updatecodex"));
  } else if (state.activeProfile.codexEnabled) {
    row.append(
      lessonMark(makeButton("Update codex", () => requestCodexUpdate(state, chatId, send), {
        disabled: disabled || state.busy.some((b) => b.kind === "codex" && b.chatId === chatId),
        title: "Consume everything up to the newest message now, ignoring lag and window. A big backlog offers fast catch-up modes.",
      }), "home.actions.updatecodex"),
    );
  }
  sec.body.appendChild(row);

  // "3 chapters ready" beside dead buttons needs a stated cause, or the
  // buttons just look broken.
  if (state.busy.length > 0 && state.settings.enabled) {
    sec.body.appendChild(textNode("Actions unlock when Memoria finishes her current task", "lmb-help"));
  } else if (!state.settings.enabled) {
    sec.body.appendChild(textNode("The extension is off, flip it on in Tuning", "lmb-help"));
  }

  const shelfRow = document.createElement("div");
  shelfRow.className = "lmb-actions";
  lessonMark(shelfRow, "home.bookpill");
  if (!state.bookId) {
    const empty = pill("No book yet", "warn");
    empty.title = "Memoria will create this chat's world book the first time a chapter is filed";
    shelfRow.appendChild(empty);
  } else {
    const tag = pill(state.bookName ? state.bookName : "Book ready", "ok");
    tag.title = "World book where chapters and arcs are stored for this chat";
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

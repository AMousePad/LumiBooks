import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { ArcView, ChapterView, FrontendState, FrontendToBackend, MessageStub } from "../../types";
import {
  HIDDEN_ICON,
  formatTokens,
  lessonMark,
  makeButton,
  makeSubtabs,
  preserveScroll,
  scrollPaneTop,
  searchField,
  section,
  select,
  span,
  textNode,
} from "../components";
import { confirmDelete, openEditModal } from "../modals";

type BooksSubtab = "shelf" | "compose" | "continuity";

const SUBTABS: { key: BooksSubtab; label: string }[] = [
  { key: "shelf", label: "Shelf" },
  { key: "compose", label: "Compose" },
  { key: "continuity", label: "Advanced" },
];

type ShelfGroup = "volumes" | "arcs" | "chapters";

const localState = {
  subtab: "shelf" as BooksSubtab,
  // Shelf
  shelfQuery: "",
  expandedEntries: new Set<string>(),
  showAllGroups: new Set<ShelfGroup>(),
  // Compose picker
  selectedMessages: new Set<string>(),
  selectedChapters: new Set<string>(),
  selectedArcs: new Set<string>(),
  messageFilter: "uncovered" as "all" | "uncovered" | "covered",
  messageQuery: "",
  pickerShown: 80,
  anchorMessageId: null as string | null,
  suppressNextClick: false,
  rebaseSourceId: "",
  lastChatId: null as string | null,
};

const SHELF_RECENT = 6;
const PICKER_PAGE = 80;
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_PX = 10;

/** Survives the chat-switch reset in renderBooksTab: a spine jump may be the
 * first Books render for this chat, which clears expandedEntries. */
let pendingFocusEntry: string | null = null;

/** Open the Shelf with one entry expanded - the Home coverage spine jumps
 * here. The caller re-renders the tab afterwards. */
export function focusShelfEntry(entryId: string): void {
  localState.subtab = "shelf";
  localState.shelfQuery = "";
  localState.expandedEntries.add(entryId);
  pendingFocusEntry = entryId;
}

/** Lesson-stage navigation: pick the subtab before a demo render. */
export function setBooksSubtab(key: string): void {
  if (key === "shelf" || key === "compose" || key === "continuity") localState.subtab = key;
}

/** Lesson-stage exit hook: the fixture chat polluted this module's state. */
export function resetBooksTabLocal(): void {
  localState.subtab = "shelf";
  localState.shelfQuery = "";
  localState.expandedEntries.clear();
  localState.showAllGroups.clear();
  localState.selectedMessages.clear();
  localState.selectedChapters.clear();
  localState.selectedArcs.clear();
  localState.messageFilter = "uncovered";
  localState.messageQuery = "";
  localState.pickerShown = PICKER_PAGE;
  localState.anchorMessageId = null;
  localState.rebaseSourceId = "";
  localState.lastChatId = null;
  pendingFocusEntry = null;
}

export function renderBooksTab(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  if (localState.lastChatId !== state.activeChatId) {
    localState.shelfQuery = "";
    localState.expandedEntries.clear();
    localState.showAllGroups.clear();
    localState.selectedMessages.clear();
    localState.selectedChapters.clear();
    localState.selectedArcs.clear();
    localState.anchorMessageId = null;
    localState.rebaseSourceId = "";
    localState.pickerShown = PICKER_PAGE;
    localState.lastChatId = state.activeChatId;
  }
  if (pendingFocusEntry) {
    localState.expandedEntries.add(pendingFocusEntry);
    pendingFocusEntry = null;
  }

  const draw = (): void => {
    preserveScroll(host, () => {
      host.replaceChildren();
      host.appendChild(makeSubtabs(SUBTABS, localState.subtab, (key) => {
        localState.subtab = key;
        draw();
        scrollPaneTop(host);
      }));
      if (!state.activeChatId) {
        host.appendChild(textNode("Open a chat to browse Memoria's shelf", "lmb-empty"));
        return;
      }
      if (localState.subtab === "shelf") {
        renderShelf(host, state, ctx, send, draw);
      } else if (localState.subtab === "compose") {
        renderChapterPicker(host, state, send, draw);
        renderArcPicker(host, state, send, draw);
        renderVolumePicker(host, state, send, draw);
      } else {
        renderContinuity(host, state, ctx, send);
        renderMaintenance(host, state, ctx, send);
      }
    });
  };
  draw();
}

/* ---------------------------------------------------------------- shelf */

function renderShelf(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (m: FrontendToBackend) => void,
  redraw: () => void,
): void {
  const sec = section("The Shelf");
  const chapters = state.chapters.filter((c) => !c.isRoot);
  const arcs = state.arcs.filter((a) => !a.isRoot);
  const volumes = state.volumes.filter((v) => !v.isRoot);
  if (chapters.length + arcs.length + volumes.length === 0) {
    sec.body.appendChild(textNode("Empty shelf for now. Memoria will start filing once the lag fills.", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }

  // Typing rebuilds only the list container below, keeping the input focused.
  const search = searchField({
    value: localState.shelfQuery,
    placeholder: "Search titles and summaries...",
    onChange: (v) => {
      localState.shelfQuery = v.toLowerCase();
      buildGroups();
    },
  });
  sec.body.appendChild(search.wrap);
  const listHost = document.createElement("div");
  listHost.className = "lmb-pane";
  lessonMark(listHost, "books.shelf.list");
  sec.body.appendChild(listHost);

  const groups: { key: ShelfGroup; title: string; kind: "volume" | "arc" | "chapter"; items: (ChapterView | ArcView)[] }[] = [
    { key: "volumes", title: "Volumes", kind: "volume", items: volumes },
    { key: "arcs", title: "Arcs", kind: "arc", items: arcs },
    { key: "chapters", title: "Chapters", kind: "chapter", items: chapters },
  ];

  const matchesShelf = (v: ChapterView | ArcView): boolean => {
    const q = localState.shelfQuery;
    if (!q) return true;
    return (v.comment || "").toLowerCase().includes(q)
      || (v.meta.title || "").toLowerCase().includes(q)
      || (v.meta.shortComment || "").toLowerCase().includes(q)
      || (v.content || "").toLowerCase().includes(q);
  };

  const buildGroups = (): void => {
    listHost.replaceChildren();
    const searching = localState.shelfQuery !== "";
    for (const g of groups) {
      if (g.items.length === 0) continue;
      const filtered = searching ? g.items.filter(matchesShelf) : g.items;
      const showAll = searching || localState.showAllGroups.has(g.key);
      // Expanded entries stay visible even when the group is capped to its
      // most recent few (e.g. after a jump from the Home coverage spine).
      const recent = filtered.slice(-SHELF_RECENT);
      const pinned = filtered.filter(
        (v) => localState.expandedEntries.has(v.entryId) && !recent.includes(v),
      );
      const items = showAll ? filtered : [...pinned, ...recent];

      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = searching ? `${g.title} (${filtered.length} of ${g.items.length})` : `${g.title} (${g.items.length})`;
      listHost.appendChild(sub);

      if (searching && filtered.length === 0) {
        listHost.appendChild(textNode("No match", "lmb-empty"));
        continue;
      }

      if (!searching && g.items.length > SHELF_RECENT) {
        const expanded = localState.showAllGroups.has(g.key);
        const toggle = makeButton(
          expanded ? "Show recent only" : `Show all ${g.items.length} (${items.length} shown)`,
          () => {
            if (expanded) localState.showAllGroups.delete(g.key);
            else localState.showAllGroups.add(g.key);
            buildGroups();
          },
          { small: true },
        );
        const row = document.createElement("div");
        row.className = "lmb-actions";
        row.appendChild(toggle);
        listHost.appendChild(row);
      }

      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const view of items) {
        list.appendChild(renderEntryRow(view, g.kind, state, ctx, send, redraw));
      }
      listHost.appendChild(list);
    }
  };
  buildGroups();
  host.appendChild(sec.wrap);
}

function renderEntryRow(
  view: ChapterView | ArcView,
  kind: "chapter" | "arc" | "volume",
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (m: FrontendToBackend) => void,
  redraw: () => void,
): HTMLLIElement {
  const li = document.createElement("li");
  const expanded = localState.expandedEntries.has(view.entryId);
  li.className = `lmb-entry compact ${kind}${view.active ? "" : " superseded"}${expanded ? " expanded" : ""}`;

  const head = document.createElement("button");
  head.type = "button";
  head.className = "lmb-entry-row";
  // Lesson nav steps spotlight a specific entry row by its id.
  lessonMark(head, `books.entry.${view.entryId}`);
  const tag = document.createElement("span");
  tag.className = `lmb-entry-tag ${kind}${view.isGhost ? " ghost" : ""}`;
  tag.textContent = view.isGhost ? "GHOST" : kind.toUpperCase();
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = view.comment || view.meta.title || `${kind} ${view.entryId.slice(0, 6)}`;
  const right = document.createElement("span");
  right.className = "lmb-entry-right";
  const range =
    view.meta.firstMsgIdx !== undefined && view.meta.lastMsgIdx !== undefined
      ? `${view.meta.firstMsgIdx + 1}–${view.meta.lastMsgIdx + 1}`
      : `${view.meta.msgIds.length} msgs`;
  right.textContent = `${range} · ${formatTokens(view.contentTokens)}t`;
  const chevron = document.createElement("span");
  chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
  head.append(tag, title, right, chevron);
  head.addEventListener("click", () => {
    if (expanded) localState.expandedEntries.delete(view.entryId);
    else localState.expandedEntries.add(view.entryId);
    redraw();
  });
  li.appendChild(head);

  if (expanded) {
    li.appendChild(renderEntryDetail(view, kind, state, ctx, send));
  }
  return li;
}

function renderEntryDetail(
  view: ChapterView | ArcView,
  kind: "chapter" | "arc" | "volume",
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (m: FrontendToBackend) => void,
): HTMLElement {
  const detail = document.createElement("div");
  detail.className = "lmb-entry-detail";

  const meta = document.createElement("div");
  meta.className = "lmb-entry-meta";
  const before = view.sourceTokensInput || 0;
  const tokenStr = before > 0
    ? `${formatTokens(before)}→${formatTokens(view.contentTokens)} tokens`
    : `${formatTokens(view.contentTokens)} tokens`;
  meta.append(span(tokenStr));
  if (view.meta.model) meta.append(span(view.meta.model));
  if (view.isGhost) meta.append(span("ghost, not yet injected"));
  else if (!view.active) meta.append(span("superseded"));
  detail.appendChild(meta);

  if (view.meta.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = `Memoria: ${view.meta.shortComment}`;
    detail.appendChild(cm);
  }

  const preview = document.createElement("div");
  preview.className = "lmb-entry-preview";
  preview.textContent = view.content;
  detail.appendChild(preview);

  const chatId = state.activeChatId;
  const actions = document.createElement("div");
  actions.className = "lmb-entry-actions";
  lessonMark(actions, "books.entry.actions");
  actions.append(
    makeButton("Edit", () => {
      openEditModal(ctx, kind === "arc" ? "Edit arc" : kind === "volume" ? "Edit volume" : "Edit chapter", {
        comment: view.comment,
        content: view.content,
      }, (next) => {
        if (!chatId) return;
        const patch: { comment?: string; content?: string } = {};
        if (typeof next.comment === "string" && next.comment !== view.comment) {
          patch.comment = next.comment;
        }
        if (typeof next.content === "string" && next.content !== view.content) {
          patch.content = next.content;
        }
        if (Object.keys(patch).length === 0) return;
        send({ type: "update_entry", chatId, entryId: view.entryId, patch });
      });
    }, { small: true, title: "Edit this entry's label and content" }),
  );
  // Regenerating a ghost would commit a real chapter (and hide its messages)
  // ahead of the injection lag, and releasing one orphans a disabled entry.
  // Ghosts re-summarize on their own when their sources change: Edit + Delete only.
  if (!view.isGhost) {
    actions.append(
      makeButton("Regenerate", async () => {
        const ok = await confirmDelete(ctx, "Regenerate?", "Memoria will delete this entry and resummarize the same range. The old summary text will be lost.");
        if (!ok || !chatId) return;
        send({ type: "regenerate_entry", chatId, entryId: view.entryId });
      }, { small: true, title: "Delete and resummarize the same range" }),
      makeButton("Release", async () => {
        const freed = kind === "chapter"
          ? "Its messages return to the prompt unless a higher tier still covers them."
          : kind === "arc"
            ? "Its chapters revive and keep covering those messages."
            : "Its arcs revive and keep covering those messages.";
        const ok = await confirmDelete(ctx, "Release to lorebook?", `Memoria will hand this entry to your regular lorebook (prefixed with [orphaned]) and stop managing it. ${freed}`);
        if (!ok || !chatId) return;
        send({ type: "release_entry", chatId, entryId: view.entryId });
      }, { small: true, title: "Strip the LumiBooks marker so the entry becomes a regular lorebook entry" }),
    );
  }
  actions.append(
    makeButton("Delete", async () => {
      const ok = await confirmDelete(ctx, "Delete?", view.isGhost
        ? "Memoria will drop this ghost chapter. She will re-summarize the span on her next pass."
        : kind === "chapter"
          ? "Memoria will let those messages back into the prompt."
          : kind === "arc"
            ? "Its chapters revive and keep covering those messages."
            : "Its arcs revive and keep covering those messages.");
      if (!ok || !chatId) return;
      send({ type: "delete_entry", chatId, entryId: view.entryId });
    }, { small: true, danger: true }),
  );
  detail.appendChild(actions);
  return detail;
}

/* -------------------------------------------------------------- compose */

function filterMessages(state: FrontendState): MessageStub[] {
  return state.messages.filter((m) => {
    if (localState.messageFilter === "uncovered" && m.covered) return false;
    if (localState.messageFilter === "covered" && !m.covered) return false;
    if (localState.messageQuery && !(m.preview ?? "").toLowerCase().includes(localState.messageQuery)) return false;
    return true;
  });
}

function sumSelectedTokens(state: FrontendState): number {
  let total = 0;
  const byId = new Map(state.messages.map((m) => [m.id, m] as const));
  for (const id of localState.selectedMessages) {
    const m = byId.get(id);
    if (m) total += m.approxTokens;
  }
  return total;
}

function renderChapterPicker(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
  redraw: () => void,
): void {
  const sec = section("Pick messages for a chapter");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Pick uncompressed messages and file them into a chapter yourself. ✓ marks messages already filed.";
  sec.body.appendChild(help);

  const filterRow = document.createElement("div");
  filterRow.className = "lmb-message-filter-row";
  const filterSel = select({
    value: localState.messageFilter,
    options: [
      { value: "uncovered", label: "Uncompressed only" },
      { value: "all", label: "All messages" },
      { value: "covered", label: "Already filed" },
    ],
    onChange: (v) => {
      localState.messageFilter = (v as typeof localState.messageFilter) ?? "uncovered";
      localState.pickerShown = PICKER_PAGE;
      redraw();
    },
  });
  const query = searchField({
    value: localState.messageQuery,
    placeholder: "Search...",
    onChange: (v) => {
      localState.messageQuery = v.toLowerCase();
      localState.pickerShown = PICKER_PAGE;
      listEl.replaceChildren(...buildRows(state, syncControls, redraw));
      listEl.scrollTop = listEl.scrollHeight;
      syncControls();
    },
  });
  filterRow.append(filterSel, query.wrap);
  sec.body.appendChild(filterRow);

  const counts = document.createElement("div");
  counts.className = "lmb-help";

  const chatId = state.activeChatId!;
  const messageById = new Map(state.messages.map((m) => [m.id, m] as const));
  const allSelectedExcluded = (): boolean => {
    if (localState.selectedMessages.size === 0) return false;
    for (const id of localState.selectedMessages) {
      const m = messageById.get(id);
      if (!m || !m.excluded) return false;
    }
    return true;
  };

  const compressBtn = lessonMark(makeButton("Compress", () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0) return;
    send({ type: "create_chapter_range", chatId, messageIds: ids });
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }, { primary: true, disabled: localState.selectedMessages.size === 0 }), "books.compose.compress");

  const excludeBtn = lessonMark(makeButton("Exclude", () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0) return;
    send({ type: "set_message_excluded", chatId, messageIds: ids, excluded: !allSelectedExcluded() });
  }, { title: "Toggle exclusion for the selected messages. Excluded messages are never hidden, replaced, or summarized, and they split compression. Click again to allow compression." }), "books.compose.exclude");

  const syncControls = (): void => {
    const tokens = sumSelectedTokens(state);
    counts.textContent = `${localState.selectedMessages.size} selected (~${formatTokens(tokens)} tokens before)`;
    const empty = localState.selectedMessages.size === 0;
    compressBtn.disabled = empty;
    excludeBtn.disabled = empty;
    excludeBtn.classList.toggle("active", allSelectedExcluded());
  };

  const listEl = document.createElement("div");
  listEl.className = "lmb-message-list";
  lessonMark(listEl, "books.compose.list");
  listEl.replaceChildren(...buildRows(state, syncControls, redraw));
  sec.body.appendChild(listEl);
  syncControls();
  const hintRow = document.createElement("div");
  hintRow.className = "lmb-help";
  hintRow.style.display = "flex";
  hintRow.style.justifyContent = "space-between";
  hintRow.style.gap = "10px";
  const hint = document.createElement("span");
  hint.textContent = "Shift-click or long-press selects a range";
  hintRow.append(counts, hint);
  sec.body.appendChild(hintRow);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    compressBtn,
    makeButton("Pick uncompressed", () => {
      const visible = filterMessages(state).filter((m) => !m.covered && !m.excluded);
      localState.selectedMessages = new Set(visible.map((m) => m.id));
      redraw();
    }),
    excludeBtn,
    makeButton("Clear", () => {
      localState.selectedMessages.clear();
      localState.anchorMessageId = null;
      redraw();
    }),
  );
  sec.body.appendChild(actions);

  host.appendChild(sec.wrap);
  // Conversations read bottom-up: land on the newest messages, with "Show
  // older" waiting at the top. (preserveScroll keeps the user's own position
  // across redraws once they have scrolled.)
  listEl.scrollTop = listEl.scrollHeight;
}

function buildRows(
  state: FrontendState,
  onToggle: () => void,
  redraw: () => void,
): HTMLElement[] {
  const filtered = filterMessages(state);
  if (filtered.length === 0) {
    return [textNode("No messages match", "lmb-empty")];
  }
  // Chats run to hundreds of messages: render only the most recent page and
  // let "Show older" walk backwards, so the DOM stays light.
  const visible = filtered.slice(-localState.pickerShown);
  const rows: HTMLElement[] = [];
  if (filtered.length > visible.length) {
    const older = filtered.length - visible.length;
    const more = makeButton(`Show older (${older})`, () => {
      localState.pickerShown += PICKER_PAGE;
      redraw();
    }, { small: true });
    const wrap = document.createElement("div");
    wrap.className = "lmb-actions lmb-picker-more";
    wrap.appendChild(more);
    rows.push(wrap);
  }
  for (const m of visible) rows.push(buildMessageRow(m, state, onToggle, redraw));
  return rows;
}

function buildMessageRow(
  m: MessageStub,
  state: FrontendState,
  onToggle: () => void,
  redraw: () => void,
): HTMLElement {
  const row = document.createElement("label");
  row.className = `lmb-message-row${m.covered ? " covered" : ""}${m.excluded ? " excluded" : ""}${localState.selectedMessages.has(m.id) ? " selected" : ""}`;
  row.title = "Shift+click (or long-press on touch) to select a range";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = localState.selectedMessages.has(m.id);
  cb.disabled = m.covered && !m.excluded;
  const triggerRangeFromAnchor = (): boolean => {
    const anchorId = localState.anchorMessageId;
    if (!anchorId || anchorId === m.id) return false;
    const newState = !localState.selectedMessages.has(m.id);
    applyRangeSelection(state, anchorId, m.id, newState);
    localState.anchorMessageId = m.id;
    redraw();
    return true;
  };
  row.addEventListener("click", (e) => {
    if (localState.suppressNextClick) {
      localState.suppressNextClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const mouseEvent = e as MouseEvent;
    if (!mouseEvent.shiftKey || m.covered) return;
    if (!triggerRangeFromAnchor()) return;
    e.preventDefault();
  });
  row.addEventListener("pointerdown", (e) => {
    const pe = e as PointerEvent;
    if (pe.pointerType !== "touch" || m.covered) return;
    const startX = pe.clientX;
    const startY = pe.clientY;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      if (timer !== null) { clearTimeout(timer); timer = null; }
      row.removeEventListener("pointermove", onMove);
      row.removeEventListener("pointerup", cleanup);
      row.removeEventListener("pointercancel", cleanup);
      row.removeEventListener("pointerleave", cleanup);
    };
    const onMove = (mv: Event) => {
      const m2 = mv as PointerEvent;
      if (Math.abs(m2.clientX - startX) > LONG_PRESS_MOVE_PX
        || Math.abs(m2.clientY - startY) > LONG_PRESS_MOVE_PX) cleanup();
    };
    row.addEventListener("pointermove", onMove);
    row.addEventListener("pointerup", cleanup);
    row.addEventListener("pointercancel", cleanup);
    row.addEventListener("pointerleave", cleanup);
    timer = setTimeout(() => {
      timer = null;
      cleanup();
      if (!triggerRangeFromAnchor()) return;
      localState.suppressNextClick = true;
      setTimeout(() => { localState.suppressNextClick = false; }, 150);
      try { navigator.vibrate?.(30); } catch { void 0; }
    }, LONG_PRESS_MS);
  });
  cb.addEventListener("change", () => {
    if (cb.checked) localState.selectedMessages.add(m.id);
    else localState.selectedMessages.delete(m.id);
    localState.anchorMessageId = m.id;
    row.classList.toggle("selected", cb.checked);
    onToggle();
  });
  const idxSpan = document.createElement("span");
  idxSpan.className = "lmb-msg-role";
  idxSpan.textContent = `#${m.indexInChat + 1}`;
  const roleSpan = document.createElement("span");
  roleSpan.className = "lmb-msg-role";
  roleSpan.style.opacity = "0.5";
  roleSpan.textContent = m.role.slice(0, 4).toUpperCase();
  const preview = document.createElement("span");
  preview.className = "lmb-msg-preview";
  preview.textContent = m.preview || "(empty)";
  const icons = document.createElement("span");
  icons.className = "lmb-msg-icons";
  if (m.covered && !m.excluded) {
    const filed = document.createElement("span");
    filed.title = "Already filed into a chapter, arc, or volume";
    filed.className = "lmb-msg-filed";
    filed.textContent = "✓";
    icons.appendChild(filed);
  }
  if (m.excluded) {
    const ex = document.createElement("span");
    ex.title = "Excluded - never hidden, replaced, or summarized";
    ex.className = "lmb-msg-excluded-badge";
    ex.textContent = "⊘";
    icons.appendChild(ex);
  }
  if (m.hidden) {
    const icon = document.createElement("span");
    icon.title = "Hidden in chat";
    icon.innerHTML = HIDDEN_ICON;
    icons.appendChild(icon);
  }
  row.append(cb, idxSpan, roleSpan, preview, icons);
  return row;
}

function applyRangeSelection(
  state: FrontendState,
  anchorId: string,
  targetId: string,
  newState: boolean,
): void {
  const visible = filterMessages(state);
  const anchorIdx = visible.findIndex((m) => m.id === anchorId);
  const targetIdx = visible.findIndex((m) => m.id === targetId);
  if (anchorIdx === -1 || targetIdx === -1) return;
  const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  for (let i = from; i <= to; i++) {
    const m = visible[i];
    if (!m || m.covered || m.excluded) continue;
    if (newState) localState.selectedMessages.add(m.id);
    else localState.selectedMessages.delete(m.id);
  }
}

function renderArcPicker(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
  redraw: () => void,
): void {
  const sec = section("Bind chapters into an arc");
  lessonMark(sec.wrap, "books.compose.arcs");
  // Ghosts sit in state.chapters as inactive, so the gate must count
  // bindable chapters or an all-ghost list renders dead controls.
  const bindable = state.chapters.filter((ch) => ch.active);
  if (bindable.length === 0) {
    sec.body.appendChild(textNode("Memoria has not filed any chapters yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const list = document.createElement("div");
  list.className = "lmb-multiselect";

  const arcCounts = document.createElement("div");
  arcCounts.className = "lmb-help";
  const updateArcCounts = () => {
    let before = 0;
    for (const ch of state.chapters) {
      if (!localState.selectedChapters.has(ch.entryId)) continue;
      before += ch.sourceTokensInput > 0 ? ch.sourceTokensInput : ch.contentTokens;
    }
    arcCounts.textContent = `${localState.selectedChapters.size} selected (~${formatTokens(before)} tokens before)`;
  };

  for (const ch of bindable) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = localState.selectedChapters.has(ch.entryId);
    cb.addEventListener("change", () => {
      if (cb.checked) localState.selectedChapters.add(ch.entryId);
      else localState.selectedChapters.delete(ch.entryId);
      updateArcCounts();
    });
    const text = document.createElement("span");
    const range =
      ch.meta.firstMsgIdx !== undefined && ch.meta.lastMsgIdx !== undefined
        ? ` (msgs ${ch.meta.firstMsgIdx + 1}-${ch.meta.lastMsgIdx + 1})`
        : "";
    const tokenStr = ch.sourceTokensInput > 0
      ? `${formatTokens(ch.sourceTokensInput)}t→${formatTokens(ch.contentTokens)}t`
      : `${formatTokens(ch.contentTokens)}t`;
    text.textContent = `${ch.comment || ch.meta.title || ch.entryId.slice(0, 6)}${range} - ${tokenStr}`;
    row.append(cb, text);
    list.appendChild(row);
  }
  sec.body.appendChild(list);
  updateArcCounts();
  sec.body.appendChild(arcCounts);

  const chatId = state.activeChatId!;
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton("Bind selected", () => {
      const ids = Array.from(localState.selectedChapters);
      if (ids.length === 0) return;
      send({ type: "create_arc_from", chatId, chapterEntryIds: ids });
      localState.selectedChapters.clear();
      redraw();
    }, { primary: true }),
    makeButton("Select all active", () => {
      localState.selectedChapters = new Set(state.chapters.filter((ch) => ch.active).map((ch) => ch.entryId));
      redraw();
    }),
    makeButton("Clear", () => {
      localState.selectedChapters.clear();
      redraw();
    }),
  );
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}

function renderVolumePicker(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
  redraw: () => void,
): void {
  const sec = section("Press arcs into a volume");
  lessonMark(sec.wrap, "books.compose.volumes");
  const activeArcs = state.arcs.filter((a) => a.active && !a.isRoot);
  if (activeArcs.length === 0) {
    sec.body.appendChild(textNode("Memoria has no unbound arcs to press yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "A volume replaces its source arcs in the prompt, the highest compression tier. Volumes are manual only.";
  sec.body.appendChild(help);

  const list = document.createElement("div");
  list.className = "lmb-multiselect";

  const counts = document.createElement("div");
  counts.className = "lmb-help";
  const updateCounts = () => {
    let before = 0;
    for (const a of activeArcs) {
      if (!localState.selectedArcs.has(a.entryId)) continue;
      before += a.sourceTokensInput > 0 ? a.sourceTokensInput : a.contentTokens;
    }
    counts.textContent = `${localState.selectedArcs.size} selected (~${formatTokens(before)} tokens before)`;
  };

  for (const arc of activeArcs) {
    const row = document.createElement("label");
    row.className = "lmb-multiselect-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = localState.selectedArcs.has(arc.entryId);
    cb.addEventListener("change", () => {
      if (cb.checked) localState.selectedArcs.add(arc.entryId);
      else localState.selectedArcs.delete(arc.entryId);
      updateCounts();
    });
    const text = document.createElement("span");
    const range =
      arc.meta.firstMsgIdx !== undefined && arc.meta.lastMsgIdx !== undefined
        ? ` (msgs ${arc.meta.firstMsgIdx + 1}-${arc.meta.lastMsgIdx + 1})`
        : "";
    const tokenStr = arc.sourceTokensInput > 0
      ? `${formatTokens(arc.sourceTokensInput)}t→${formatTokens(arc.contentTokens)}t`
      : `${formatTokens(arc.contentTokens)}t`;
    text.textContent = `${arc.comment || arc.meta.title || arc.entryId.slice(0, 6)}${range} - ${tokenStr}`;
    row.append(cb, text);
    list.appendChild(row);
  }
  sec.body.appendChild(list);
  updateCounts();
  sec.body.appendChild(counts);

  const chatId = state.activeChatId!;
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton("Press selected", () => {
      const ids = Array.from(localState.selectedArcs);
      if (ids.length === 0) return;
      send({ type: "create_volume_from", chatId, arcEntryIds: ids });
      localState.selectedArcs.clear();
      redraw();
    }, { primary: true }),
    makeButton("Select all active", () => {
      localState.selectedArcs = new Set(activeArcs.map((a) => a.entryId));
      redraw();
    }),
    makeButton("Clear", () => {
      localState.selectedArcs.clear();
      redraw();
    }),
  );
  sec.body.appendChild(actions);
  host.appendChild(sec.wrap);
}

/* ----------------------------------------------------------- continuity */

function renderContinuity(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const chatId = state.activeChatId!;
  // Ghosts are disabled entries the backend's rebase gate ignores (it counts
  // only enabled own entries), so counting them here would falsely trip the
  // destructive Rebuild path when a non-destructive Rebase is still allowed.
  const hasOwn = state.chapters.some((ch) => !ch.isRoot && !ch.isGhost)
    || state.arcs.some((a) => !a.isRoot)
    || state.volumes.some((v) => !v.isRoot);
  const hasRoot = state.rootEntryCount > 0;
  const candidates = state.availableRoots;
  if (!hasRoot && candidates.length === 0) {
    const sec = section("Continuity (root)");
    lessonMark(sec.wrap, "books.cont.root");
    sec.body.appendChild(textNode("No other chat has memories to inherit from yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }

  const sec = section("Continuity (root)");
  lessonMark(sec.wrap, "books.cont.root");

  if (hasRoot) {
    const status = document.createElement("div");
    status.className = "lmb-help";
    const originName = state.rootOriginName || state.rootOrigin?.slice(0, 8) || "another chat";
    status.textContent = `Inherited from ${originName}: ${state.rootEntryCount} memor${state.rootEntryCount === 1 ? "y" : "ies"}, injected before the greeting.`;
    sec.body.appendChild(status);

    const rootEntries = [
      ...state.volumes.filter((v) => v.isRoot),
      ...state.arcs.filter((a) => a.isRoot),
      ...state.chapters.filter((ch) => ch.isRoot),
    ];
    if (rootEntries.length) {
      const list = document.createElement("div");
      list.className = "lmb-multiselect";
      for (const e of rootEntries) {
        const rowEl = document.createElement("div");
        rowEl.className = "lmb-multiselect-row";
        rowEl.style.opacity = "0.75";
        const tag = e.meta.tier === 3 ? "VOL" : e.meta.tier === 2 ? "ARC" : "CH";
        rowEl.textContent = `[${tag}] ${e.comment || e.meta.title || e.entryId.slice(0, 6)} (${formatTokens(e.contentTokens)}t)`;
        list.appendChild(rowEl);
      }
      sec.body.appendChild(list);
    }

    const detachRow = document.createElement("div");
    detachRow.className = "lmb-actions";
    detachRow.appendChild(
      makeButton("Detach root", async () => {
        const ok = await confirmDelete(ctx, "Detach inherited memories?", "Memoria will remove the inherited memories from this chat. Your own chapters and arcs stay.");
        if (ok) send({ type: "detach_root", chatId });
      }, { small: true, danger: true, title: "Remove the inherited root memories from this chat" }),
    );
    sec.body.appendChild(detachRow);
  }

  if (candidates.length > 0) {
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = hasOwn
      ? "This chat already has its own memories. Rebuilding deletes them and re-summarizes on top of the chosen root."
      : "Seed this chat with another chat's memories. They inject as a frozen prologue before the greeting.";
    sec.body.appendChild(help);

    const row = document.createElement("div");
    row.className = "lmb-actions";
    // The action button stays dead until a source is chosen - an enabled
    // button that silently no-ops reads as broken.
    let actionBtn: HTMLButtonElement;
    const picker = select({
      value: localState.rebaseSourceId,
      ariaLabel: "Source chat to inherit memories from",
      options: [
        { value: "", label: "Pick a source chat..." },
        ...candidates.map((cand) => ({ value: cand.chatId, label: `${cand.chatName} (${cand.entryCount})` })),
      ],
      onChange: (v) => {
        localState.rebaseSourceId = v;
        actionBtn.disabled = !v;
      },
    });
    row.appendChild(picker);

    if (hasOwn) {
      // Neutral entry point: the danger styling belongs to the confirm step,
      // not the pane's only visible button.
      actionBtn = makeButton("Rebuild from...", async () => {
        const sourceChatId = picker.value;
        if (!sourceChatId) return;
        const ok = await confirmDelete(ctx, "Rebuild from root?", "Memoria will DELETE this chat's existing chapters and arcs, seed the chosen root, then re-summarize this chat from scratch. This cannot be undone.");
        if (ok) send({ type: "rebuild_root", chatId, sourceChatId });
      }, { disabled: !localState.rebaseSourceId, title: "Replaces this chat's memories with the chosen root (asks to confirm)" });
    } else {
      actionBtn = makeButton("Rebase", () => {
        const sourceChatId = picker.value;
        if (!sourceChatId) return;
        send({ type: "rebase_root", chatId, sourceChatId });
      }, { primary: true, disabled: !localState.rebaseSourceId, title: "Seed this chat with the chosen chat's memories" });
    }
    row.appendChild(actionBtn);
    sec.body.appendChild(row);
  }

  host.appendChild(sec.wrap);
}

function renderMaintenance(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const chatId = state.activeChatId!;
  const disabled = state.busy.length > 0 || !state.settings.enabled;
  const sec = section("Maintenance");
  lessonMark(sec.wrap, "books.maint");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Repair tools for when the shelf and the chat drift apart, e.g. after editing entries in the Lorebook drawer.";
  sec.body.appendChild(help);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(
    makeButton("Re-hide covered", () => send({ type: "resync_hidden", chatId }), {
      disabled,
      title: "Re-apply the exclude-from-context flag on every covered message",
    }),
    makeButton("Resync visibility", () => send({ type: "resync_visibility", chatId }), {
      disabled,
      title: "Unhide messages whose chapter or arc no longer exists, and re-align hidden state with current coverage",
    }),
  );
  sec.body.appendChild(row);

  const dangerRow = document.createElement("div");
  dangerRow.className = "lmb-actions";
  dangerRow.append(
    makeButton("Rebuild books", async () => {
      const ok = await confirmDelete(ctx, "Rebuild the shelf?", "Memoria will DELETE every chapter, arc, and volume for this chat, then re-summarize it from scratch. This cannot be undone.");
      if (ok) send({ type: "rebuild_books", chatId });
    }, {
      disabled,
      title: "Wipe the shelf and re-summarize this chat from message one",
    }),
    makeButton("Wipe books", async () => {
      const ok = await confirmDelete(ctx, "Wipe the shelf?", "Memoria will DELETE every chapter, arc, and volume for this chat and let all messages back into the prompt. This cannot be undone.");
      if (ok) send({ type: "wipe_books", chatId });
    }, { danger: true, disabled, title: "Delete every LumiBooks entry for this chat" }),
  );
  sec.body.appendChild(dangerRow);
  host.appendChild(sec.wrap);
}

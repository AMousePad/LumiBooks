import { t as tr } from "../../i18n";
import { HIGHER_TIERS, TIER_KINDS, TIER_NAMES, type SummaryKind } from "../../shared";
import { reportLocalSummaryTransfer } from "../summary-transfer";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { ArcView, ChapterView, FrontendState, FrontendToBackend, MessageStub } from "../../types";
import {
  HIDDEN_ICON,
  checkbox,
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
  showToast,
  textNode,
} from "../components";
import { confirmDelete, openEditModal } from "../modals";
import { renderContinuitySection } from "../continuity";

type BooksSubtab = "shelf" | "compose" | "continuity";

const SUBTABS: { key: BooksSubtab; label: string }[] = [
  { key: "shelf", label: tr("ui.tabs.booksTab.subtabs.shelf") },
  { key: "compose", label: tr("ui.tabs.booksTab.subtabs.compose") },
  { key: "continuity", label: tr("ui.tabs.booksTab.subtabs.advanced") },
];

type ShelfGroup = string;

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
        host.appendChild(textNode(tr("ui.tabs.booksTab.draw.openAChatToBrowseMemoriaS"), "lmb-empty"));
        return;
      }
      if (localState.subtab === "shelf") {
        renderShelf(host, state, ctx, send, draw);
      } else if (localState.subtab === "compose") {
        renderChapterPicker(host, state, send, draw);
        renderArcPicker(host, state, send, draw);
        renderVolumePicker(host, state, send, draw);
        renderHigherPickers(host, state, send);
      } else {
        renderSummaryTransfer(host, state, ctx, send);
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
  const sec = section(tr("ui.tabs.booksTab.sec.theShelf"));
  const chapters = state.chapters;
  const arcs = state.arcs;
  const volumes = state.volumes;
  if (chapters.length + arcs.length + volumes.length + state.higherBooks.length === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.booksTab.renderShelf.emptyShelfForNowMemoriaWillStart"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }

  // Typing rebuilds only the list container below, keeping the input focused.
  const search = searchField({
    value: localState.shelfQuery,
    placeholder: tr("ui.tabs.booksTab.search.searchTitlesAndSummaries"),
    onChange: (v) => {
      localState.shelfQuery = v.toLowerCase();
      buildGroups();
    },
  });
  sec.body.appendChild(search.wrap);
  const listHost = document.createElement("div");
  listHost.className = "lmb-pane";
  lessonMark(listHost, "books.shelf.list");
  listHost.classList.add("lmb-has-higher"); listHost.tabIndex = 0;
  sec.body.appendChild(listHost);

  const groups: { key: ShelfGroup; title: string; kind: SummaryKind; items: (ChapterView | ArcView)[] }[] = [
    ...HIGHER_TIERS.filter((t) => t > 3).reverse().map((t) => ({ key: TIER_KINDS[t - 1]!, title: TIER_NAMES[t - 1]!, kind: TIER_KINDS[t - 1]!, items: state.higherBooks.filter((e) => e.meta.tier === t) })),
    { key: "volumes", title: tr("ui.tabs.booksTab.groups.volumes"), kind: "volume", items: volumes },
    { key: "arcs", title: tr("ui.tabs.booksTab.groups.arcs"), kind: "arc", items: arcs },
    { key: "chapters", title: tr("ui.tabs.booksTab.groups.chapters"), kind: "chapter", items: chapters },
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

      const groupHost = document.createElement("div");
      if (TIER_KINDS.indexOf(g.kind) > 2) groupHost.className = "lmb-higher-peek";
      listHost.appendChild(groupHost);
      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = searching ? tr("ui.tabs.booksTab.buildGroups.of", { title: g.title, length: filtered.length, length2: g.items.length }) : `${g.title} (${g.items.length})`;
      groupHost.appendChild(sub);

      if (searching && filtered.length === 0) {
        groupHost.appendChild(textNode(tr("ui.tabs.booksTab.buildGroups.noMatch"), "lmb-empty"));
        continue;
      }

      if (!searching && g.items.length > SHELF_RECENT) {
        const expanded = localState.showAllGroups.has(g.key);
        const toggle = makeButton(
          expanded ? tr("ui.tabs.booksTab.toggle.showRecentOnly") : tr("ui.tabs.booksTab.toggle.showAllShown", { length: g.items.length, length2: items.length }),
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
        groupHost.appendChild(row);
      }

      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const view of items) {
        list.appendChild(renderEntryRow(view, g.kind, state, ctx, send, redraw));
      }
      groupHost.appendChild(list);
    }
  };
  buildGroups();
  host.appendChild(sec.wrap);
}

function renderEntryRow(
  view: ChapterView | ArcView,
  kind: SummaryKind,
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
  tag.textContent = view.isGhost ? tr("ui.tabs.booksTab.renderEntryRow.ghost") : tr("shared.summaryKindTag", { kind });
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = view.comment || view.meta.title || tr("ui.tabs.booksTab.entryFallback", { kind, id: view.entryId.slice(0, 6) });
  const right = document.createElement("span");
  right.className = "lmb-entry-right";
  const range =
    view.meta.firstMsgIdx !== undefined && view.meta.lastMsgIdx !== undefined
      ? `${view.meta.firstMsgIdx + 1}–${view.meta.lastMsgIdx + 1}`
      : tr("ui.common.messageCount", { count: view.meta.msgIds.length });
  right.textContent = tr("ui.tabs.booksTab.renderEntryRow.t", { range: range, contentTokens: formatTokens(view.contentTokens) });
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
  kind: SummaryKind,
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
    ? tr("ui.tabs.booksTab.tokenStr.tokens", { formatTokens: formatTokens(before), contentTokens: formatTokens(view.contentTokens) })
    : tr("ui.tabs.booksTab.tokenStr.tokens2", { contentTokens: formatTokens(view.contentTokens) });
  meta.append(span(tokenStr));
  if (view.meta.model) meta.append(span(view.meta.model));
  if (view.isGhost) meta.append(span(tr("ui.tabs.booksTab.renderEntryDetail.ghostNotYetInjected")));
  else if (!view.active) meta.append(span("superseded"));
  detail.appendChild(meta);

  if (view.meta.shortComment) {
    const cm = document.createElement("div");
    cm.className = "lmb-entry-comment";
    cm.textContent = tr("ui.tabs.booksTab.renderEntryDetail.memoria", { shortComment: view.meta.shortComment });
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
    makeButton(tr("ui.tabs.booksTab.renderEntryDetail.edit"), () => {
      openEditModal(ctx, tr("ui.tabs.booksTab.renderEntryDetail.edit2", { kind: kind }), {
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
    }, { small: true, title: tr("ui.tabs.booksTab.renderEntryDetail.editThisEntrySLabelAndContent") }),
  );
  // Regenerating a ghost would commit a real chapter (and hide its messages)
  // ahead of the injection lag, and releasing one orphans a disabled entry.
  // Ghosts re-summarize on their own when their sources change: Edit + Delete only.
  const compacted = !view.active && !!view.meta.supersededByEntryId;
  if (!view.isGhost) {
    actions.append(
      makeButton(tr("ui.tabs.booksTab.renderEntryDetail.regenerate"), async () => {
        const ok = await confirmDelete(ctx, tr("ui.tabs.booksTab.ok.regenerate"), tr("ui.tabs.booksTab.ok.memoriaWillResummarizeTheSameSourcesAnd"));
        if (!ok || !chatId) return;
        send({ type: "regenerate_entry", chatId, entryId: view.entryId });
      }, { small: true, disabled: !view.active || (view.isRoot && kind === "chapter"), title: tr("ui.tabs.booksTab.renderEntryDetail.resummarizeTheSameSources") }),
      makeButton(tr("ui.tabs.booksTab.renderEntryDetail.release"), async () => {
        const freed = compacted ? tr("ui.tabs.booksTab.freed.higherTierMemoriesKeepCoveringTheseSources") : kind === "chapter"
          ? tr("ui.tabs.booksTab.freed.itsMessagesReturnToThePromptUnless")
          : kind === "arc"
            ? tr("ui.tabs.booksTab.freed.itsChaptersReviveAndKeepCoveringThose")
            : tr("ui.tabs.booksTab.freed.itsSourceSummariesReviveAndKeepCovering");
        const ok = await confirmDelete(ctx, tr("ui.tabs.booksTab.ok.releaseToLorebook"), tr("ui.tabs.booksTab.ok.memoriaWillHandThisEntryToYour", { freed: freed }));
        if (!ok || !chatId) return;
        send({ type: "release_entry", chatId, entryId: view.entryId });
      }, { small: true, title: tr("ui.tabs.booksTab.renderEntryDetail.stripTheLumiBooksMarkerSoTheEntry") }),
    );
  }
  actions.append(
    makeButton(tr("ui.tabs.booksTab.renderEntryDetail.delete"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.booksTab.ok.delete"), view.isGhost
        ? tr("ui.tabs.booksTab.ok.memoriaWillDropThisGhostChapterShe")
        : compacted ? tr("ui.tabs.booksTab.ok.higherTierMemoriesKeepCoveringTheseSources")
        : kind === "chapter"
          ? tr("ui.tabs.booksTab.ok.memoriaWillLetThoseMessagesBackInto")
          : kind === "arc"
            ? tr("ui.tabs.booksTab.ok.itsChaptersReviveAndKeepCoveringThose")
            : tr("ui.tabs.booksTab.ok.itsSourceSummariesReviveAndKeepCovering"));
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
  const sec = section(tr("ui.tabs.booksTab.sec.pickMessagesForAChapter"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = tr("ui.tabs.booksTab.renderChapterPicker.pickUncompressedMessagesAndFileThemInto");
  sec.body.appendChild(help);

  const filterRow = document.createElement("div");
  filterRow.className = "lmb-message-filter-row";
  const filterSel = select({
    value: localState.messageFilter,
    options: [
      { value: "uncovered", label: tr("ui.tabs.booksTab.filterSel.uncompressedOnly") },
      { value: "all", label: tr("ui.tabs.booksTab.filterSel.allMessages") },
      { value: "covered", label: tr("ui.tabs.booksTab.filterSel.alreadyFiled") },
    ],
    onChange: (v) => {
      localState.messageFilter = (v as typeof localState.messageFilter) ?? "uncovered";
      localState.pickerShown = PICKER_PAGE;
      redraw();
    },
  });
  const query = searchField({
    value: localState.messageQuery,
    placeholder: tr("ui.tabs.booksTab.query.search"),
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

  const compressBtn = lessonMark(makeButton(tr("ui.tabs.booksTab.compressBtn.compress"), () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0) return;
    send({ type: "create_chapter_range", chatId, messageIds: ids });
    localState.selectedMessages.clear();
    localState.anchorMessageId = null;
    redraw();
  }, { primary: true, disabled: localState.selectedMessages.size === 0 }), "books.compose.compress");

  const excludeBtn = lessonMark(makeButton(tr("ui.tabs.booksTab.excludeBtn.exclude"), () => {
    const ids = Array.from(localState.selectedMessages);
    if (ids.length === 0) return;
    send({ type: "set_message_excluded", chatId, messageIds: ids, excluded: !allSelectedExcluded() });
  }, { title: tr("ui.tabs.booksTab.excludeBtn.toggleExclusionForTheSelectedMessagesExcluded") }), "books.compose.exclude");

  const syncControls = (): void => {
    const tokens = sumSelectedTokens(state);
    counts.textContent = tr("ui.tabs.booksTab.syncControls.selectedTokensBefore", { size: localState.selectedMessages.size, formatTokens: formatTokens(tokens) });
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
  hint.textContent = tr("ui.tabs.booksTab.renderChapterPicker.shiftClickOrLongPressSelectsA");
  hintRow.append(counts, hint);
  sec.body.appendChild(hintRow);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    compressBtn,
    makeButton(tr("ui.tabs.booksTab.renderChapterPicker.pickUncompressed"), () => {
      const visible = filterMessages(state).filter((m) => !m.covered && !m.excluded);
      localState.selectedMessages = new Set(visible.map((m) => m.id));
      redraw();
    }),
    excludeBtn,
    makeButton(tr("ui.tabs.booksTab.renderChapterPicker.clear"), () => {
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
    return [textNode(tr("ui.tabs.booksTab.buildRows.noMessagesMatch"), "lmb-empty")];
  }
  // Chats run to hundreds of messages: render only the most recent page and
  // let "Show older" walk backwards, so the DOM stays light.
  const visible = filtered.slice(-localState.pickerShown);
  const rows: HTMLElement[] = [];
  if (filtered.length > visible.length) {
    const older = filtered.length - visible.length;
    const more = makeButton(tr("ui.tabs.booksTab.more.showOlder", { older: older }), () => {
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
  row.title = tr("ui.tabs.booksTab.buildMessageRow.shiftClickOrLongPressOnTouch");
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
  idxSpan.textContent = tr("ui.tabs.booksTab.buildMessageRow.value", { indexInChat1: m.indexInChat + 1 });
  const roleSpan = document.createElement("span");
  roleSpan.className = "lmb-msg-role";
  roleSpan.style.opacity = "0.5";
  roleSpan.textContent = tr("ui.common.compactRole", { role: m.role, fallback: m.role.slice(0, 4).toUpperCase() });
  const preview = document.createElement("span");
  preview.className = "lmb-msg-preview";
  preview.textContent = m.preview || tr("ui.tabs.booksTab.buildMessageRow.empty");
  const icons = document.createElement("span");
  icons.className = "lmb-msg-icons";
  if (m.staged && !m.covered && !m.excluded) {
    const staged = document.createElement("span");
    staged.className = "lmb-entry-tag ghost";
    staged.textContent = tr("ui.tabs.booksTab.renderEntryRow.ghost");
    staged.title = tr("ui.tabs.booksTab.buildMessageRow.stagedGhost");
    icons.appendChild(staged);
  }
  if (m.covered && !m.excluded) {
    const filed = document.createElement("span");
    filed.title = tr("ui.tabs.booksTab.buildMessageRow.alreadyFiledIntoAChapterArcOr");
    filed.className = "lmb-msg-filed";
    filed.textContent = tr("ui.tabs.booksTab.buildMessageRow.value2");
    icons.appendChild(filed);
  }
  if (m.excluded) {
    const ex = document.createElement("span");
    ex.title = tr("ui.tabs.booksTab.buildMessageRow.excludedNeverHiddenReplacedOrSummarized");
    ex.className = "lmb-msg-excluded-badge";
    ex.textContent = tr("ui.tabs.booksTab.buildMessageRow.value3");
    icons.appendChild(ex);
  }
  if (m.hidden) {
    const icon = document.createElement("span");
    icon.title = tr("ui.tabs.booksTab.buildMessageRow.hiddenInChat");
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
  const sec = section(tr("ui.tabs.booksTab.sec.bindChaptersIntoAnArc"));
  lessonMark(sec.wrap, "books.compose.arcs");
  // Ghosts sit in state.chapters as inactive, so the gate must count
  // bindable chapters or an all-ghost list renders dead controls.
  const bindable = state.chapters.filter((ch) => ch.active);
  if (bindable.length === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.booksTab.renderArcPicker.memoriaHasNotFiledAnyChaptersYet"), "lmb-empty"));
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
    arcCounts.textContent = tr("ui.tabs.booksTab.updateArcCounts.selectedTokensBefore", { size: localState.selectedChapters.size, formatTokens: formatTokens(before) });
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
        ? tr("ui.tabs.booksTab.range.msgs", { firstMsgIdx1: ch.meta.firstMsgIdx + 1, lastMsgIdx1: ch.meta.lastMsgIdx + 1 })
        : "";
    const tokenStr = ch.sourceTokensInput > 0
      ? tr("ui.common.compactTokenChange", { before: formatTokens(ch.sourceTokensInput), after: formatTokens(ch.contentTokens) })
      : tr("ui.common.compactTokens", { tokens: formatTokens(ch.contentTokens) });
    text.textContent = tr("ui.tabs.booksTab.renderArcPicker.value", { slice: ch.comment || ch.meta.title || ch.entryId.slice(0, 6), range: range, tokenStr: tokenStr });
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
    makeButton(tr("ui.tabs.booksTab.renderArcPicker.bindSelected"), () => {
      const ids = Array.from(localState.selectedChapters);
      if (ids.length === 0) return;
      send({ type: "create_arc_from", chatId, chapterEntryIds: ids });
      localState.selectedChapters.clear();
      redraw();
    }, { primary: true }),
    makeButton(tr("ui.tabs.booksTab.renderArcPicker.selectAllActive"), () => {
      localState.selectedChapters = new Set(state.chapters.filter((ch) => ch.active).map((ch) => ch.entryId));
      redraw();
    }),
    makeButton(tr("ui.tabs.booksTab.renderArcPicker.clear"), () => {
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
  const sec = section(tr("ui.tabs.booksTab.sec.pressArcsIntoAVolume"));
  lessonMark(sec.wrap, "books.compose.volumes");
  const activeArcs = state.arcs.filter((a) => a.active);
  if (activeArcs.length === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.booksTab.renderVolumePicker.memoriaHasNoUnboundArcsToPress"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = tr("ui.tabs.booksTab.renderVolumePicker.aVolumeReplacesItsSourceArcsIn");
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
    counts.textContent = tr("ui.tabs.booksTab.updateCounts.selectedTokensBefore", { size: localState.selectedArcs.size, formatTokens: formatTokens(before) });
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
        ? tr("ui.tabs.booksTab.range.msgs", { firstMsgIdx1: arc.meta.firstMsgIdx + 1, lastMsgIdx1: arc.meta.lastMsgIdx + 1 })
        : "";
    const tokenStr = arc.sourceTokensInput > 0
      ? tr("ui.common.compactTokenChange", { before: formatTokens(arc.sourceTokensInput), after: formatTokens(arc.contentTokens) })
      : tr("ui.common.compactTokens", { tokens: formatTokens(arc.contentTokens) });
    text.textContent = tr("ui.tabs.booksTab.renderVolumePicker.value", { slice: arc.comment || arc.meta.title || arc.entryId.slice(0, 6), range: range, tokenStr: tokenStr });
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
    makeButton(tr("ui.tabs.booksTab.renderVolumePicker.pressSelected"), () => {
      const ids = Array.from(localState.selectedArcs);
      if (ids.length === 0) return;
      send({ type: "create_volume_from", chatId, arcEntryIds: ids });
      localState.selectedArcs.clear();
      redraw();
    }, { primary: true }),
    makeButton(tr("ui.tabs.booksTab.renderVolumePicker.selectAllActive"), () => {
      localState.selectedArcs = new Set(activeArcs.map((a) => a.entryId));
      redraw();
    }),
    makeButton(tr("ui.tabs.booksTab.renderVolumePicker.clear"), () => {
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
    || state.volumes.some((v) => !v.isRoot)
    || state.higherBooks.some((v) => !v.isRoot);
  const hasRoot = state.rootEntryCount > 0;
  const candidates = state.availableRoots;

  let detail: HTMLElement | null = null;
  if (hasRoot) {
    const rootEntries = [
      ...state.volumes.filter((v) => v.isRoot),
      ...state.higherBooks.filter((v) => v.isRoot),
      ...state.arcs.filter((a) => a.isRoot),
      ...state.chapters.filter((ch) => ch.isRoot),
    ];
    if (rootEntries.length) {
      detail = document.createElement("div");
      detail.className = "lmb-multiselect";
      for (const e of rootEntries) {
        const rowEl = document.createElement("div");
        rowEl.className = "lmb-multiselect-row";
        rowEl.style.opacity = "0.75";
        const tag = TIER_NAMES[e.meta.tier - 1];
        rowEl.textContent = tr("ui.tabs.booksTab.renderContinuity.t", { tag: tag, slice: e.comment || e.meta.title || e.entryId.slice(0, 6), contentTokens: formatTokens(e.contentTokens) });
        detail.appendChild(rowEl);
      }
    }
  }

  const originName = state.rootOriginName || state.rootOrigin?.slice(0, 8) || tr("ui.tabs.booksTab.originName.anImportedLorebook");
  const wrap = renderContinuitySection(host, ctx, {
    emptyText: tr("ui.tabs.booksTab.wrap.noOtherChatHasMemoriesToInherit"),
    inherited: hasRoot
      ? {
          text: tr("ui.tabs.booksTab.wrap.inheritedFromMemor", { originName: originName, rootEntryCount: state.rootEntryCount }),
          detail,
          detach: {
            label: tr("ui.tabs.booksTab.wrap.detachRoot"),
            title: tr("ui.tabs.booksTab.wrap.removeTheInheritedRootMemoriesFromThis"),
            confirmTitle: tr("ui.tabs.booksTab.wrap.detachInheritedMemories"),
            confirmBody: tr("ui.tabs.booksTab.wrap.memoriaWillRemoveTheInheritedMemoriesFrom"),
            run: () => send({ type: "detach_root", chatId }),
          },
        }
      : null,
    picker: candidates.length > 0
      ? {
          help: hasOwn
            ? tr("ui.tabs.booksTab.wrap.thisChatAlreadyHasItsOwnMemories")
            : tr("ui.tabs.booksTab.wrap.seedThisChatWithAnotherChatS"),
          ariaLabel: tr("ui.tabs.booksTab.wrap.sourceChatToInheritMemoriesFrom"),
          placeholder: tr("ui.tabs.booksTab.wrap.pickASourceChat"),
          options: candidates.map((cand) => ({
            chatId: cand.chatId,
            chatName: cand.chatName,
            detail: String(cand.entryCount),
          })),
          selectedId: localState.rebaseSourceId,
          onSelect: (v) => { localState.rebaseSourceId = v; },
          action: hasOwn
            ? {
                label: tr("ui.tabs.booksTab.wrap.rebuildFrom"),
                title: tr("ui.tabs.booksTab.wrap.replacesThisChatSMemoriesWithThe"),
                confirm: {
                  title: tr("ui.tabs.booksTab.wrap.rebuildFromRoot"),
                  body: tr("ui.tabs.booksTab.wrap.memoriaWillDeleteThisChatSExisting"),
                },
                run: (sourceChatId) => send({ type: "rebuild_root", chatId, sourceChatId }),
              }
            : {
                label: tr("ui.tabs.booksTab.wrap.rebase"),
                title: tr("ui.tabs.booksTab.wrap.seedThisChatWithTheChosenChat"),
                primary: true,
                run: (sourceChatId) => send({ type: "rebase_root", chatId, sourceChatId }),
              },
        }
      : null,
  });
  lessonMark(wrap, "books.cont.root");
}

function renderMaintenance(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const chatId = state.activeChatId!;
  const disabled = state.busy.length > 0 || !state.settings.enabled;
  const sec = section(tr("ui.tabs.booksTab.sec.maintenance"));
  lessonMark(sec.wrap, "books.maint");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = tr("ui.tabs.booksTab.renderMaintenance.repairToolsForWhenTheShelfAnd");
  sec.body.appendChild(help);
  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(
    makeButton(tr("ui.tabs.booksTab.renderMaintenance.reHideCovered"), () => send({ type: "resync_hidden", chatId }), {
      disabled,
      title: tr("ui.tabs.booksTab.renderMaintenance.reApplyTheExcludeFromContextFlag"),
    }),
    makeButton(tr("ui.tabs.booksTab.renderMaintenance.resyncVisibility"), () => send({ type: "resync_visibility", chatId }), {
      disabled,
      title: tr("ui.tabs.booksTab.renderMaintenance.unhideMessagesWhoseChapterOrArcNo"),
    }),
  );
  sec.body.appendChild(row);

  const dangerRow = document.createElement("div");
  dangerRow.className = "lmb-actions";
  dangerRow.append(
    makeButton(tr("ui.tabs.booksTab.renderMaintenance.rebuildBooks"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.booksTab.ok.rebuildTheShelf"), tr("ui.tabs.booksTab.ok.memoriaWillDeleteEveryChapterArcAnd"));
      if (ok) send({ type: "rebuild_books", chatId });
    }, {
      disabled,
      title: tr("ui.tabs.booksTab.renderMaintenance.wipeTheShelfAndReSummarizeThis"),
    }),
    makeButton(tr("ui.tabs.booksTab.renderMaintenance.wipeBooks"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.booksTab.ok.wipeTheShelf"), tr("ui.tabs.booksTab.ok.memoriaWillDeleteEveryChapterArcAnd2"));
      if (ok) send({ type: "wipe_books", chatId });
    }, { danger: true, disabled, title: tr("ui.tabs.booksTab.renderMaintenance.deleteEveryLumiBooksEntryForThisChat") }),
  );
  sec.body.appendChild(dangerRow);
  host.appendChild(sec.wrap);
}

function renderHigherPickers(host: HTMLElement, state: FrontendState, send: (msg: FrontendToBackend) => void): void {
  for (const tier of HIGHER_TIERS) {
    const kind = TIER_KINDS[tier - 1]!;
    const sec = section(tr("ui.tabs.booksTab.sec.bind", { tierNamesTier1: TIER_NAMES[tier - 1] }));
    const candidates = [...state.arcs, ...state.volumes, ...state.higherBooks].filter((e) => e.active && e.meta.tier === tier - 1);
    const selected = new Set<string>();
    const busy = state.busy.some((b) => b.chatId === state.activeChatId && b.kind === kind);
    // Volume already has a selection picker immediately above this section.
    if (tier > 3) for (const entry of candidates) {
      const row = document.createElement("label"); row.className = "lmb-multiselect-row";
      const cb = document.createElement("input"); cb.type = "checkbox";
      cb.onchange = () => { if (cb.checked) selected.add(entry.entryId); else selected.delete(entry.entryId); };
      row.append(cb, document.createTextNode(entry.comment || entry.meta.title || entry.entryId));
      sec.body.appendChild(row);
    }
    const actions = document.createElement("div"); actions.className = "lmb-actions";
    if (tier > 3) actions.appendChild(makeButton(tr("ui.tabs.booksTab.renderHigherPickers.bindSelected"), () => {
      if (selected.size) send({ type: "create_higher_from", chatId: state.activeChatId!, tier, entryIds: [...selected] });
    }, { disabled: busy || !candidates.length }));
    actions.appendChild(makeButton(tr("ui.tabs.booksTab.renderHigherPickers.bindReadyBatches"), () => send({ type: "create_higher_auto", chatId: state.activeChatId!, tier }), { disabled: busy || !candidates.length }));
    sec.body.append(actions, textNode(tr("ui.tabs.booksTab.renderHigherPickers.activeSourceEntriesReadyBatchesUseThis", { length: candidates.length }), "lmb-help"));
    host.appendChild(sec.wrap);
  }
}

function renderSummaryTransfer(host: HTMLElement, state: FrontendState, ctx: SpindleFrontendContext, send: (msg: FrontendToBackend) => void): void {
  const sec = section(tr("ui.tabs.booksTab.sec.summaryExportAndImport"));
  sec.body.appendChild(textNode(tr("ui.tabs.booksTab.renderSummaryTransfer.exportTheActiveShelfWithRawMessage"), "lmb-help"));
  const actions = document.createElement("div"); actions.className = "lmb-actions";
  const chatId = state.activeChatId!;
  actions.append(makeButton(tr("ui.tabs.booksTab.renderSummaryTransfer.exportSummaries"), () => send({ type: "summary_export", chatId })),
    makeButton(tr("ui.tabs.booksTab.renderSummaryTransfer.importSummaries"), async () => {
      try {
        const files = await ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 20_000_000 });
        if (files[0]) {
          reportLocalSummaryTransfer(chatId, tr("ui.tabs.booksTab.renderSummaryTransfer.readingSummaryFile"));
          await new Promise((resolve) => setTimeout(resolve, 0));
          send({ type: "summary_import", chatId, raw: JSON.parse(new TextDecoder().decode(files[0].bytes)) });
        }
      } catch (err) { console.warn("[LumiBooks] summary import failed", err); reportLocalSummaryTransfer(chatId, tr("ui.tabs.booksTab.renderSummaryTransfer.couldNotReadThatLorebookJsonFile"), "error"); }
    }, { disabled: state.busy.some((b) => b.chatId === chatId) }));
  sec.body.appendChild(actions); host.appendChild(sec.wrap);
}

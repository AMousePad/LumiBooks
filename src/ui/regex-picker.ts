import { t as tr } from "../i18n";
import type { LMBProfile } from "../shared";
import type { FrontendToBackend, RegexScriptPage, RegexScriptsResponse } from "../types";
import { field, makeButton, multiSelect, numberInput, searchField, section, textNode } from "./components";

// Keep only the visible page. The library can contain thousands of scripts.
let page: RegexScriptPage | null = null;
let loadedAt = 0;
let pending: string | null = null;
let requestedOffset = 0;
let failed = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let query = "", pageQuery = "", pendingQuery = "";
let progress: { scanned: number; total: number } | null = null;
let repaint: (() => void) | undefined;

export function resetRegexPicker(): void {
  clearTimeout(timer);
  clearTimeout(searchTimer); searchTimer = undefined;
  query = ""; pageQuery = ""; pendingQuery = "";
  progress = null;
  page = null; loadedAt = 0; pending = null; requestedOffset = 0; failed = false; repaint = undefined;
}

export function deliverRegexScriptsPage(message: RegexScriptsResponse): void {
  if (message.requestId !== pending) return;
  if ("progress" in message) {
    progress = message.progress;
    armTimeout(message.requestId);
    repaint?.();
    return;
  }
  clearTimeout(timer);
  pending = null;
  failed = "error" in message;
  if ("page" in message) { page = message.page; pageQuery = pendingQuery; loadedAt = Date.now(); }
  repaint?.();
}

function armTimeout(requestId: string): void {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (pending !== requestId) return;
    pending = null; failed = true; repaint?.();
  }, 30_000);
}

export function renderRegex(
  host: HTMLElement,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
  send: (message: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.profileTab.sec.regex"));
  host.appendChild(sec.wrap);
  // Changes on this page must retain IDs selected on all other pages, even
  // while the profile save is still in flight.
  let outgoingIds = profile.regexOutgoingScriptIds.slice();
  let incomingIds = profile.regexIncomingScriptIds.slice();
  sec.body.appendChild(textNode(tr("ui.tabs.profileTab.renderRegex.outgoingRunsOnThePromptBeforeMemoria"), "lmb-help"));
  const search = searchField({ value: query, placeholder: tr("ui.regexPicker.search"), onChange: (value) => {
    query = value;
    clearTimeout(timer); pending = null; failed = false; progress = null;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { searchTimer = undefined; load(0); }, 250);
    draw();
  } });
  const results = document.createElement("div");
  results.className = "lmb-regex-results";
  sec.body.append(search.wrap, results);

  function load(offset: number, refresh = false): void {
    clearTimeout(searchTimer); searchTimer = undefined;
    clearTimeout(timer);
    pendingQuery = query.trim();
    requestedOffset = offset;
    failed = false;
    progress = null;
    const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
    pending = requestId;
    armTimeout(requestId);
    draw();
    try { send({ type: "regex_scripts_page", requestId, offset, query: pendingQuery, refresh }); }
    catch {
      clearTimeout(timer); pending = null; failed = true; draw();
    }
  }

  function draw(): void {
    results.replaceChildren();
    const visiblePage = pageQuery === query.trim() ? page : null;
    const loading = !!pending || !!searchTimer;
    const navigation = document.createElement("div");
    navigation.className = "lmb-regex-toolbar";
    const limit = visiblePage?.limit ?? 50;
    const offset = visiblePage?.offset ?? 0;
    const total = visiblePage?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));
    const pager = document.createElement("div");
    pager.className = "lmb-regex-pager";
    const jump = numberInput({ value: offset / limit + 1, min: 1, max: pages, step: 1, disabled: loading || !visiblePage,
      onBlur: (value) => {
        if (loading || !visiblePage) return;
        const next = (Math.min(pages, Math.max(1, Math.floor(value ?? offset / limit + 1))) - 1) * limit;
        jump.value = String(next / limit + 1);
        if (next !== offset) load(next);
      } });
    jump.className = "lmb-regex-page";
    jump.inputMode = "numeric";
    jump.enterKeyHint = "go";
    jump.setAttribute("aria-label", tr("ui.regexPicker.page"));
    jump.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); jump.blur(); }
    });
    const previous = makeButton("", () => load(Math.max(0, offset - limit)), { title: tr("ui.regexPicker.previous"), disabled: loading || offset === 0 });
    const next = makeButton("", () => load(offset + limit), { title: tr("ui.regexPicker.next"), disabled: loading || offset + limit >= total });
    for (const [button, label, points] of [
      [previous, tr("ui.regexPicker.previous"), "15 18 9 12 15 6"],
      [next, tr("ui.regexPicker.next"), "9 18 15 12 9 6"],
    ] as const) {
      button.className = "lmb-regex-arrow";
      button.setAttribute("aria-label", label);
      button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="${points}"/></svg>`;
    }
    pager.append(previous, jump, next);
    navigation.append(
      pager,
      makeButton(tr("ui.regexPicker.refresh"), () => load(failed ? requestedOffset : Math.min(offset, (pages - 1) * limit), true), { small: true, disabled: loading }),
    );
    if (visiblePage) navigation.appendChild(textNode(tr("ui.regexPicker.range", {
      first: visiblePage.scripts.length ? offset + 1 : 0, last: visiblePage.scripts.length ? offset + visiblePage.scripts.length : 0, total,
    }), "lmb-help lmb-regex-range"));
    results.appendChild(navigation);
    if (loading) results.appendChild(textNode(progress
      ? tr("ui.regexPicker.searchProgress", { scanned: progress.scanned, total: progress.total })
      : tr("ui.regexPicker.loading"), "lmb-help"));
    if (failed) results.appendChild(textNode(tr("ui.regexPicker.failed"), "lmb-help"));
    if (!visiblePage) return;
    if (!visiblePage.scripts.length) {
      results.appendChild(textNode(query.trim() ? tr("ui.regexPicker.noMatches") : tr("ui.tabs.profileTab.renderRegex.noRegexScriptsFoundInLumiverse"), "lmb-empty"));
      return;
    }
    const options = visiblePage.scripts.map((script) => ({ value: script.id, label: script.name }));
    const outgoing = field(tr("ui.tabs.profileTab.outgoing.outgoing"));
    outgoing.wrap.firstElementChild!.classList.add("lmb-regex-group-heading");
    outgoing.wrap.firstElementChild!.appendChild(textNode(tr("ui.regexPicker.selected", { count: outgoingIds.length }), "lmb-help"));
    outgoing.body.append(multiSelect({
      options, selected: outgoingIds, onChange: (ids) => {
        outgoingIds = ids; patch({ regexOutgoingScriptIds: ids }); draw();
      },
    }));
    const incoming = field(tr("ui.tabs.profileTab.incoming.incoming"));
    incoming.wrap.firstElementChild!.classList.add("lmb-regex-group-heading");
    incoming.wrap.firstElementChild!.appendChild(textNode(tr("ui.regexPicker.selected", { count: incomingIds.length }), "lmb-help"));
    incoming.body.append(multiSelect({
      options, selected: incomingIds, onChange: (ids) => {
        incomingIds = ids; patch({ regexIncomingScriptIds: ids }); draw();
      },
    }));
    results.append(outgoing.wrap, incoming.wrap);
  }

  repaint = () => { if (sec.wrap.isConnected) draw(); };
  draw();
  if (!pending && !searchTimer && !failed && (!page || Date.now() - loadedAt >= 5_000)) load(page?.offset ?? 0);
}

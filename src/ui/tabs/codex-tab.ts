import { t as tr } from "../../i18n";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { FrontendState, FrontendToBackend } from "../../types";
import { CODEX_FILE_KEYS, codexLessonGated, type CodexFileKey } from "../../shared";
import {
  formatTokens,
  lessonMark,
  makeButton,
  makeSubtabs,
  pill,
  preserveScroll,
  relativeTime,
  scrollPaneTop,
  searchField,
  section,
  select,
  showToast,
  textArea,
  textInput,
  textNode,
} from "../components";
import { confirmDelete, requestCodexRebuild, requestCodexTidy, requestCodexUpdate } from "../modals";
import { renderContinuitySection } from "../continuity";
import { renderCodexTabLock } from "../lessons/seal";
import { CodexFileStateChanges } from "../codex-file-state";
import { applyExtraFields, draftExtraFields, type ExtraFieldDraft } from "../codex-extra-fields";

const fileStateChanges = new CodexFileStateChanges();
export function deliverCodexFileState(chatId: string, file: string, seq: number, error?: string): "on" | "noInject" | "frozen" | null {
  const confirmed = fileStateChanges.acknowledge(chatId, file, seq, !!error);
  if (error && confirmed !== null) showToast("error", tr("ui.tabs.codexTab.deliverCodexFileState.couldnTSaveThisCategorySSetting", { error: error }));
  return confirmed;
}

type CodexSubtab = "overview" | "entities" | "relations" | "timeline" | "threads" | "lore" | "secrets" | "manage";

const SUBTABS: { key: CodexSubtab; label: string }[] = [
  { key: "overview", label: tr("ui.tabs.codexTab.subtabs.overview") },
  { key: "entities", label: tr("ui.tabs.codexTab.subtabs.entities") },
  { key: "relations", label: tr("ui.tabs.codexTab.subtabs.relations") },
  { key: "timeline", label: tr("ui.tabs.codexTab.subtabs.timeline") },
  { key: "threads", label: tr("ui.tabs.codexTab.subtabs.threads") },
  { key: "lore", label: tr("ui.tabs.codexTab.subtabs.lore") },
  { key: "secrets", label: tr("ui.tabs.codexTab.subtabs.secrets") },
  { key: "manage", label: tr("ui.tabs.codexTab.subtabs.manage") },
];

/* ------------------------------------------------------- tolerant parsing */
/* The viewer renders whatever is on disk without judging it - files were
   validated on save, and a half-broken hand edit should still display. */

type EntityGroup = "characters" | "locations" | "things";

const ENTITY_GROUPS: { key: EntityGroup; title: string; singular: string; ns: string }[] = [
  { key: "characters", title: tr("ui.tabs.codexTab.entityGroups.characters"), singular: "character", ns: "char" },
  { key: "locations", title: tr("ui.tabs.codexTab.entityGroups.locations"), singular: "location", ns: "loc" },
  { key: "things", title: tr("ui.tabs.codexTab.entityGroups.things"), singular: "thing", ns: "thing" },
];

interface ParsedCodex {
  characters: Record<string, unknown>[];
  locations: Record<string, unknown>[];
  things: Record<string, unknown>[];
  relations: Record<string, unknown>[];
  events: Record<string, unknown>[];
  threads: Record<string, unknown>[];
  seeds: string[];
  world: Record<string, unknown>[];
  knowledge: Record<string, unknown>[];
  /** Files that exist but failed to parse as JSON. */
  broken: string[];
}

function objArray(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x));
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseCodexFiles(files: Record<string, string>): ParsedCodex {
  const out: ParsedCodex = {
    characters: [], locations: [], things: [], relations: [],
    events: [], threads: [], seeds: [], world: [], knowledge: [], broken: [],
  };
  const read = (key: string): Record<string, unknown> | null => {
    const raw = files[key];
    if (raw === undefined) return null;
    try {
      const v = JSON.parse(raw) as unknown;
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      out.broken.push(`${key}.json`);
      return null;
    }
  };
  for (const key of ["characters", "locations", "things"] as const) {
    const v = read(key);
    if (v) out[key] = objArray(v["entities"]);
  }
  const rel = read("relations");
  if (rel) out.relations = objArray(rel["relations"]);
  const tl = read("timeline");
  if (tl) out.events = objArray(tl["events"]);
  const th = read("threads");
  if (th) {
    out.threads = objArray(th["threads"]);
    out.seeds = strArray(th["seeds"]);
  }
  const wo = read("world");
  if (wo) out.world = objArray(wo["entries"]);
  const kn = read("knowledge");
  if (kn) out.knowledge = objArray(kn["items"]);
  return out;
}

/** char:elias -> Elias (via entity sheets), or a humanized fallback. */
function makeNameResolver(parsed: ParsedCodex): (ref: string) => string {
  const names = new Map<string, string>();
  for (const list of [parsed.characters, parsed.locations, parsed.things]) {
    for (const e of list) {
      const id = str(e["id"]);
      const name = str(e["name"]);
      if (id && name) names.set(id, name);
    }
  }
  return (ref: string): string => {
    const hit = names.get(ref);
    if (hit) return hit;
    const m = /^(?:char|loc|thing):(.+)$/.exec(ref);
    return m ? m[1]!.replace(/_/g, " ") : ref;
  };
}

/* ------------------------------------------------------------ tab state */

interface CodexTabCache {
  chatId: string | null;
  files: Record<string, string> | null;
  parsed: ParsedCodex | null;
  pending: boolean;
  /** Backend revision these files came from; a mismatch means refetch. */
  revision: number;
}

const cache: CodexTabCache = { chatId: null, files: null, parsed: null, pending: false, revision: -1 };

interface EntityDraft {
  group: EntityGroup;
  /** Entity id being edited; also used for entities not yet acked. */
  id: string;
  fields: Record<string, string>;
  extras: ExtraFieldDraft[];
  /** Per-field locks: the agent sees "Locked, do not edit" for these. */
  lockedFields: Set<string>;
  saving: boolean;
}

type RecordKind = "relation" | "event" | "thread" | "seeds" | "world" | "knowledge";

interface RecordDraft {
  kind: RecordKind;
  /** Index in the file's array, -1 for a new record ("seeds" edits the whole list). */
  index: number;
  /** JSON at draft time, so saves relocate the record after an agent rewrite. */
  orig?: string;
  fields: Record<string, string>;
  saving: boolean;
}

function resolveDraftIndex(list: Record<string, unknown>[], draft: RecordDraft): number {
  if (draft.index < 0) return -1;
  if (draft.orig !== undefined) {
    if (draft.index < list.length && JSON.stringify(list[draft.index]) === draft.orig) return draft.index;
    return list.findIndex((x) => JSON.stringify(x) === draft.orig);
  }
  return draft.index < list.length ? draft.index : -1;
}

function staleDraftAbort(): void {
  local.recordDraft = null;
  showToast("warn", tr("ui.tabs.codexTab.staleDraftAbort.memoriaRewroteThatRecordWhileYouWere"));
  rerender();
}

function spliceOutIfCurrent(
  list: Record<string, unknown>[],
  index: number,
  expected: Record<string, unknown>,
): Record<string, unknown>[] | null {
  const expectedJson = JSON.stringify(expected);
  if (index < list.length && JSON.stringify(list[index]) === expectedJson) {
    return list.filter((_, j) => j !== index);
  }
  const found = list.findIndex((x) => JSON.stringify(x) === expectedJson);
  if (found >= 0) return list.filter((_, j) => j !== found);
  return null;
}

const local = {
  subtab: "overview" as CodexSubtab,
  query: "",
  queryRaw: "",
  expandedEntity: null as string | null,
  entityDraft: null as EntityDraft | null,
  recordDraft: null as RecordDraft | null,
  addFormGroup: null as EntityGroup | null,
  addFormName: "",
  expandedRelations: new Set<number>(),
  expandedEvents: new Set<number>(),
  expandedWorld: new Set<number>(),
  expandedSecrets: new Set<number>(),
  relationsView: "list" as "list" | "graph",
  expandedThreads: new Set<string>(),
  showFullTimeline: false,
  codexSourceId: null as string | null,
};

function clearExpansions(): void {
  local.expandedRelations.clear();
  local.expandedEvents.clear();
  local.expandedWorld.clear();
  local.expandedSecrets.clear();
  local.expandedThreads.clear();
}

/** One save nonce per file, so parallel editors can never steal each other's ack. */
let globalSaveSeq = 0;
const pendingCodexSaves = new Map<string, number>();

function draftFile(d: RecordDraft): CodexFileKey {
  switch (d.kind) {
    case "relation": return "relations";
    case "event": return "timeline";
    case "thread":
    case "seeds": return "threads";
    case "world": return "world";
    default: return "knowledge";
  }
}

const TIMELINE_RECENT = 12;

/** True when a finished codex run for this chat should trigger a re-read. */
export function codexWantsRefresh(chatId: string): boolean {
  return cache.chatId === chatId;
}

/** Lesson-stage navigation: pick the subtab before a demo render. Mirrors a
 * real subtab click so a draft or filter left by free play can't linger. */
export function setCodexSubtab(key: string): void {
  if (key === "overview" || key === "entities" || key === "relations"
    || key === "timeline" || key === "threads" || key === "lore" || key === "secrets"
    || key === "manage") {
    if (local.subtab !== key) {
      local.query = "";
      local.queryRaw = "";
      local.recordDraft = null;
      clearExpansions();
    }
    local.subtab = key;
  }
}

/** Lesson-stage navigation: list or graph in the Relations pane. */
export function setCodexRelationsView(v: "list" | "graph"): void {
  local.relationsView = v;
}

/** Lesson-stage navigation: open an entity sheet before a demo render. */
export function setCodexExpandedEntity(id: string | null): void {
  local.expandedEntity = id;
  local.entityDraft = null;
}

/** Lesson-stage exit hook: the fixture chat owned this module's cache, so the
 * real chat must re-read on its next render. */
export function resetCodexTabLocal(): void {
  cache.chatId = null;
  cache.files = null;
  cache.parsed = null;
  cache.pending = false;
  local.subtab = "overview";
  local.query = "";
  local.queryRaw = "";
  local.expandedEntity = null;
  local.entityDraft = null;
  local.recordDraft = null;
  local.addFormGroup = null;
  local.addFormName = "";
  clearExpansions();
  local.relationsView = "list";
  local.showFullTimeline = false;
  pendingCodexSaves.clear();
}

interface RenderArgs {
  host: HTMLElement;
  state: FrontendState;
  ctx: SpindleFrontendContext;
  send: (msg: FrontendToBackend) => void;
}

let lastArgs: RenderArgs | null = null;

/** Re-render after a local interaction (expand, subtab, show-all), keeping scroll. */
function rerender(): void {
  const a = lastArgs;
  if (!a || !a.host.isConnected) return;
  preserveScroll(a.host, () => renderCodexTab(a.host, a.state, a.ctx, a.send));
}

export function deliverCodexFiles(
  chatId: string,
  files: Record<string, string>,
  revision: number,
  savedFile?: string,
  savedSeq?: number,
): void {
  if (cache.chatId === chatId) {
    cache.files = files;
    cache.parsed = parseCodexFiles(files);
    cache.pending = false;
    cache.revision = revision;
  }
  // Editor ack: the save landed, close whichever form was in flight. An
  // unsolicited refresh (agent run finished) carries no seq and leaves
  // drafts open.
  if (savedFile !== undefined && savedSeq !== undefined && pendingCodexSaves.get(savedFile) === savedSeq) {
    pendingCodexSaves.delete(savedFile);
    if (savedFile === "characters" || savedFile === "locations" || savedFile === "things") {
      if (local.entityDraft?.group === savedFile) local.entityDraft = null;
    } else if (local.recordDraft && draftFile(local.recordDraft) === savedFile) {
      local.recordDraft = null;
    }
  }
}

function sendCodexWrite(
  file: CodexFileKey,
  value: unknown,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const chatId = state.activeChatId;
  if (!chatId) return;
  globalSaveSeq++;
  const seq = globalSaveSeq;
  pendingCodexSaves.set(file, seq);
  send({
    type: "codex_write_file",
    chatId,
    file,
    content: JSON.stringify(value, null, 2),
    seq,
  });
  // A rejected write is reported as an error toast with no codex_files ack.
  // Unstick the form after a grace period so the user can correct and retry.
  setTimeout(() => {
    if (pendingCodexSaves.get(file) !== seq) return;
    pendingCodexSaves.delete(file);
    let touched = false;
    if (local.entityDraft?.saving && local.entityDraft.group === file) { local.entityDraft.saving = false; touched = true; }
    if (local.recordDraft?.saving && draftFile(local.recordDraft) === file) { local.recordDraft.saving = false; touched = true; }
    if (touched) rerender();
  }, 5000);
}

/* ------------------------------------------------------------ rendering */

export function renderCodexTab(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  lastArgs = { host, state, ctx, send };
  host.replaceChildren();
  if (codexLessonGated(state.lessons)) {
    renderCodexTabLock(host, send);
    return;
  }
  const chatId = state.activeChatId;
  if (!chatId) {
    const empty = section(tr("ui.tabs.codexTab.empty.knowledgeCodex"));
    empty.body.appendChild(textNode(tr("ui.tabs.codexTab.renderCodexTab.openAChatToConsultTheCodex"), "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }

  if (cache.chatId !== chatId) {
    cache.chatId = chatId;
    cache.files = null;
    cache.parsed = null;
    cache.pending = false;
    local.query = "";
    local.queryRaw = "";
    local.expandedEntity = null;
    local.entityDraft = null;
    local.recordDraft = null;
    local.addFormGroup = null;
    local.addFormName = "";
    clearExpansions();
    local.showFullTimeline = false;
    pendingCodexSaves.clear();
  }
  // Any mutation bumps the revision, a wipe included, so this one check covers
  // runs, tidies, rebuilds, imports, and resets alike. Drafts in flight hold
  // the refresh so a save cannot be clobbered mid-edit.
  const stale = cache.files !== null && cache.revision !== state.codexRevision;
  const editing = local.entityDraft !== null || local.recordDraft !== null || pendingCodexSaves.size > 0;
  if (stale && !editing) {
    cache.files = null;
    cache.parsed = null;
  }
  // Fetched whether or not a codex exists: the backend answers with empty
  // scaffolds, which is what lets the panes be hand-authored from nothing.
  if (!cache.files && !cache.pending) {
    cache.pending = true;
    send({ type: "codex_read", chatId });
  }

  host.appendChild(makeSubtabs(SUBTABS, local.subtab, (key) => {
    local.subtab = key;
    // "Search this section" means this section: a filter silently carrying
    // into the next pane looks like lost data.
    local.query = "";
    local.queryRaw = "";
    local.recordDraft = null;
    clearExpansions();
    rerender();
    scrollPaneTop(host);
  }));

  const parsed = cache.parsed;
  if (local.subtab === "overview") {
    renderOverview(host, state, ctx, send, parsed);
    return;
  }
  // Manage reads no records, and an empty chat is exactly when carrying a
  // codex over or importing one matters, so it sits ahead of the file gates.
  if (local.subtab === "manage") {
    renderManage(host, state, ctx, send);
    return;
  }

  if (!parsed) {
    const sec = section(tr("ui.tabs.codexTab.sec.knowledgeCodex"));
    sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderCodexTab.memoriaIsFetchingTheCodexFiles"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }

  // Search filters the current pane; typing only rebuilds the pane container
  // below so the input keeps focus.
  const search = searchField({
    value: local.queryRaw,
    placeholder: tr("ui.tabs.codexTab.search.searchThisSection"),
    onChange: (v) => {
      local.queryRaw = v;
      local.query = v.toLowerCase();
      drawPane();
    },
  });
  host.appendChild(search.wrap);

  const paneHost = document.createElement("div");
  paneHost.className = "lmb-pane";
  host.appendChild(paneHost);

  const drawPane = (): void => {
    paneHost.replaceChildren();
    switch (local.subtab) {
      case "entities": renderEntities(paneHost, parsed, state, ctx, send); break;
      case "relations": renderRelations(paneHost, parsed, state, ctx, send); break;
      case "timeline": renderTimeline(paneHost, parsed, state, ctx, send); break;
      case "threads": renderThreads(paneHost, parsed, state, ctx, send); break;
      case "lore": renderLore(paneHost, parsed, state, ctx, send); break;
      case "secrets": renderSecrets(paneHost, parsed, state, ctx, send); break;
      default: break;
    }
  };
  drawPane();
}

function matches(q: string, ...bits: (string | string[] | undefined)[]): boolean {
  if (!q) return true;
  for (const b of bits) {
    if (b === undefined) continue;
    if (typeof b === "string") {
      if (b.toLowerCase().includes(q)) return true;
    } else if (b.some((x) => x.toLowerCase().includes(q))) {
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------- overview */

// One tile per file, labelled to match the section tabs above.
const BIBLE_TILES: { id: string; label: string; files: CodexFileKey[] }[] = [
  { id: "characters", label: tr("ui.tabs.codexTab.bibleTiles.characters"), files: ["characters"] },
  { id: "locations", label: tr("ui.tabs.codexTab.bibleTiles.locations"), files: ["locations"] },
  { id: "things", label: tr("ui.tabs.codexTab.bibleTiles.things"), files: ["things"] },
  { id: "relations", label: tr("ui.tabs.codexTab.bibleTiles.relations"), files: ["relations"] },
  { id: "timeline", label: tr("ui.tabs.codexTab.bibleTiles.timeline"), files: ["timeline"] },
  { id: "threads", label: tr("ui.tabs.codexTab.bibleTiles.threads"), files: ["threads"] },
  { id: "lore", label: tr("ui.tabs.codexTab.bibleTiles.lore"), files: ["world"] },
  { id: "secrets", label: tr("ui.tabs.codexTab.bibleTiles.secrets"), files: ["knowledge"] },
];

type FileState = "on" | "noInject" | "frozen";

/** Zeroed stand-in so the overview renders its tiles before the first run:
 * the switches already persist, so records can be frozen ahead of time. */
function emptyParsedCodex(): ParsedCodex {
  return {
    characters: [], locations: [], things: [], relations: [],
    events: [], threads: [], seeds: [], world: [], knowledge: [], broken: [],
  };
}

/** Empty scaffold written by the per-category Purge button. */
const PURGE_SCAFFOLD: Record<CodexFileKey, unknown> = {
  characters: { entities: [] },
  locations: { entities: [] },
  things: { entities: [] },
  relations: { relations: [] },
  timeline: { events: [] },
  threads: { threads: [], seeds: [] },
  world: { entries: [] },
  knowledge: { items: [] },
};

function purgeMessage(def: { id: string; label: string }): string {
  const bits = [tr("ui.tabs.codexTab.bits.memoriaWillDeleteEveryRecordInFor", { label: def.label })];
  if (def.id === "characters" || def.id === "locations" || def.id === "things") {
    bits.push(tr("ui.tabs.codexTab.purgeMessage.referencesToThemInOtherRecordsBecome"));
  }
  if (def.id === "threads") bits.push(tr("ui.tabs.codexTab.purgeMessage.theResolvedThreadArchiveClearsToo"));
  bits.push(tr("ui.tabs.codexTab.purgeMessage.thisCannotBeUndone"));
  return bits.join(" ");
}

function tileCount(parsed: ParsedCodex, id: string): number {
  switch (id) {
    case "characters": return parsed.characters.length;
    case "locations": return parsed.locations.length;
    case "things": return parsed.things.length;
    case "relations": return parsed.relations.length;
    case "timeline": return parsed.events.length;
    case "threads": return parsed.threads.length;
    case "lore": return parsed.world.length;
    case "secrets": return parsed.knowledge.length;
    default: return 0;
  }
}

function tileState(state: FrontendState, files: CodexFileKey[]): FileState {
  const states = files.map((f) => {
    const s = state.codexFileStates?.[f];
    return fileStateChanges.value(state.activeChatId!, f, s === "noInject" || s === "frozen" ? s : "on");
  });
  if (states.includes("on")) return "on";
  if (states.includes("noInject")) return "noInject";
  return "frozen";
}

const TILE_STATE_LABEL: Record<FileState, string> = {
  on: tr("ui.tabs.codexTab.tileStateLabel.injectedUpdated"),
  noInject: tr("ui.tabs.codexTab.tileStateLabel.notInjectedStillUpdated"),
  frozen: tr("ui.tabs.codexTab.tileStateLabel.frozenNoUpdates"),
};

function renderOverview(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
  parsed: ParsedCodex | null,
): void {
  const chatId = state.activeChatId!;
  const profile = state.activeProfile;
  const sec = section(tr("ui.tabs.codexTab.sec.storyBible"));

  const bits: string[] = [];
  bits.push(state.codexExists ? tr("ui.tabs.codexTab.renderOverview.codexOnFile") : tr("ui.tabs.codexTab.renderOverview.noCodexYet"));
  bits.push(tr("ui.tabs.codexTab.renderOverview.messageUnindexed", { codexBacklog: state.codexBacklog }));
  if (state.codexLastRunAt) bits.push(tr("ui.tabs.codexTab.renderOverview.updated", { codexLastRunAt: relativeTime(state.codexLastRunAt) }));
  sec.body.appendChild(lessonMark(textNode(bits.join(" · "), "lmb-help"), "codex.status"));

  if (!profile.codexEnabled) {
    sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderOverview.theCodexAgentIsOffForThis"), "lmb-empty"));
  }

  const busy = state.busy.some((b) => b.kind === "codex" && b.chatId === chatId);
  if (busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    row.append(dot, document.createTextNode(tr("ui.tabs.codexTab.renderOverview.memoriaIsWorkingOnTheCodexWatch")));
    sec.body.appendChild(row);
  }

  // Before the first run the tiles render zeroed instead of vanishing: the
  // per-file switches persist in the cursor, so a record can be frozen ahead
  // of time and never costs a single pass.
  const shownParsed = parsed ?? (!state.codexExists ? emptyParsedCodex() : null);
  if (shownParsed) {
    if (shownParsed.broken.length > 0) {
      sec.body.appendChild(textNode(
        tr("ui.tabs.codexTab.renderOverview.unreadableOnDiskRebuildCodexRegeneratesThem", { join: shownParsed.broken.join(", ") }),
        "lmb-help",
      ));
    }
    const tiles = document.createElement("div");
    tiles.className = "lmb-tiles";
    lessonMark(tiles, "codex.tiles");
    for (const def of BIBLE_TILES) {
      tiles.appendChild(renderBibleTile(def, shownParsed, state, ctx, send, busy));
    }
    sec.body.appendChild(tiles);
    if (!state.codexExists) {
      sec.body.appendChild(textNode(
        tr("ui.tabs.codexTab.renderOverview.noCodexYet2"),
        "lmb-help",
      ));
    }
    if ((state.codexRefreshPending?.length ?? 0) + (state.codexStaleFiles?.length ?? 0) > 0) {
      sec.body.appendChild(makeButton(tr("ui.tabs.codexTab.renderOverview.clearStaleTags"), () => send({ type: "codex_clear_stale", chatId }), {
        small: true, disabled: busy,
        title: tr("ui.tabs.codexTab.renderOverview.acceptTheCurrentRecordsAsUpTo"),
      }));
    }
    const pending = state.codexRefreshPending ?? [];
    if (pending.length > 0) {
      const banner = document.createElement("div");
      banner.className = "lmb-actions";
      banner.append(
        textNode(
          tr("ui.tabs.codexTab.renderOverview.recordMissedUpdatesWhileFrozen", { length: pending.length }),
          "lmb-help",
        ),
        makeButton(tr("ui.tabs.codexTab.renderOverview.catchUp1Pass"), () => send({ type: "codex_refresh", chatId }), {
          primary: true,
          small: true,
          disabled: busy || !state.settings.enabled || !profile.codexEnabled,
          title: tr("ui.tabs.codexTab.renderOverview.onePassRebuildsJustTheReEnabled"),
        }),
        makeButton(tr("ui.tabs.codexTab.renderOverview.rebuildInstead"), async () => {
          const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.rebuildTheCodex"), tr("ui.tabs.codexTab.ok.memoriaWillEraseTheStoryBibleAnd"));
          if (ok) requestCodexRebuild(state, chatId, send);
        }, {
          small: true,
          disabled: busy || !state.settings.enabled || !profile.codexEnabled,
          title: tr("ui.tabs.codexTab.renderOverview.wipeEverythingAndRegenerateFromTheStart"),
        }),
      );
      sec.body.appendChild(banner);
    }
    sec.body.appendChild(textNode(
      tr("ui.tabs.codexTab.renderOverview.clickARecordCardToCycleIt"),
      "lmb-help",
    ));
    sec.body.appendChild(textNode(
      tr("ui.tabs.codexTab.renderOverview.shorterAndSimplerChatsOftenRunBetter"),
      "lmb-help",
    ));
  }

  const row = document.createElement("div");
  row.className = "lmb-actions";
  lessonMark(row, "codex.actions");
  row.append(
    lessonMark(makeButton(tr("ui.tabs.codexTab.renderOverview.updateNow"), () => requestCodexUpdate(state, chatId, send), {
      primary: true,
      disabled: busy || !state.settings.enabled || !profile.codexEnabled,
      title: tr("ui.tabs.codexTab.renderOverview.consumeEverythingUpToTheNewestMessage"),
    }), "codex.actions.update"),
    busy
      ? makeButton(tr("ui.tabs.codexTab.renderOverview.cancel"), () => send({ type: "abort_busy", chatId, kind: "codex" }), {
          danger: true,
          title: tr("ui.tabs.codexTab.renderOverview.abortTheCodexTaskInFlight"),
        })
      : makeButton(tr("ui.tabs.codexTab.renderOverview.tidyUp"), () => requestCodexTidy(state, chatId, send), {
          disabled: !state.settings.enabled || !profile.codexEnabled || !state.codexExists,
          title: tr("ui.tabs.codexTab.renderOverview.chooseATargetSizeThenCompactUp"),
        }),
    makeButton(
      state.codexUndoAt ? tr("ui.tabs.codexTab.renderOverview.undo", { codexUndoReasonUpdate: state.codexUndoReason ?? "update" }) : tr("ui.tabs.codexTab.renderOverview.undo2"),
      async () => {
        const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.undoTheLastCodexChange"), tr("ui.tabs.codexTab.ok.memoriaWillRollTheCodexBackTo", { codexUndoReasonUpdate: state.codexUndoReason ?? "update", codexUndoAt: relativeTime(state.codexUndoAt!) }));
        if (ok) send({ type: "codex_undo", chatId });
      },
      {
        disabled: busy || !state.codexUndoAt,
        title: state.codexUndoAt
          ? tr("ui.tabs.codexTab.renderOverview.rollBackToTheSnapshotTakenBefore")
          : tr("ui.tabs.codexTab.renderOverview.nothingToUndoYetMemoriaSnapshotsThe"),
      },
    ),
  );
  sec.body.appendChild(row);
  host.appendChild(sec.wrap);
}

/** Rebuild, wipe, and file transfer, plus the continuity picker. Kept off the
 * Overview so the everyday row stays down to Update, Tidy, and Undo. */
function renderManage(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const chatId = state.activeChatId!;
  const profile = state.activeProfile;
  const busy = state.busy.some((b) => b.kind === "codex" && b.chatId === chatId);
  const sources = state.codexSources;

  const known = sources.some((s) => s.chatId === local.codexSourceId);
  if (!known) local.codexSourceId = "";

  renderContinuitySection(host, ctx, {
    emptyText: tr("ui.tabs.codexTab.renderManage.noOtherChatHasACodexTo"),
    inherited: state.codexRootOrigin
      ? {
          text: tr("ui.tabs.codexTab.renderManage.carriedOverFromMemoriaIndexesThisChat", { codexRootOriginName: state.codexRootOriginName }),
          detach: {
            label: tr("ui.tabs.codexTab.renderManage.detachCodex"),
            title: tr("ui.tabs.codexTab.renderManage.eraseTheCarriedOverCodexFromThis"),
            confirmTitle: tr("ui.tabs.codexTab.renderManage.detachTheCarriedOverCodex"),
            confirmBody: tr("ui.tabs.codexTab.renderManage.codexRecordsMergeAsMemoriaWorksSo"),
            run: () => send({ type: "codex_reset", chatId }),
          },
        }
      : null,
    picker: !state.codexExists && sources.length > 0
      ? {
          help: tr("ui.tabs.codexTab.renderManage.continuingAnEarlierChatCarryItsStory"),
          ariaLabel: tr("ui.tabs.codexTab.renderManage.sourceChatToCarryTheCodexFrom"),
          placeholder: tr("ui.tabs.codexTab.renderManage.pickASourceChat"),
          options: sources.map((s) => ({ chatId: s.chatId, chatName: s.chatName })),
          selectedId: local.codexSourceId ?? "",
          onSelect: (v) => { local.codexSourceId = v; },
          action: {
            label: tr("ui.tabs.codexTab.renderManage.carryCodexOver"),
            title: tr("ui.tabs.codexTab.renderManage.copyAnotherChatSCodexIntoThis"),
            primary: true,
            confirm: {
              title: tr("ui.tabs.codexTab.renderManage.carryTheCodexOver"),
              body: tr("ui.tabs.codexTab.renderManage.memoriaWillCopyTheChosenChatS"),
            },
            run: (sourceChatId) => send({ type: "codex_adopt", chatId, sourceChatId }),
          },
        }
      : null,
  });

  const files = section(tr("ui.tabs.codexTab.files.codexFiles"));
  files.body.appendChild(textNode(
    tr("ui.tabs.codexTab.renderManage.exportWritesEveryCodexFileAndIts"),
    "lmb-help",
  ));
  const fileRow = document.createElement("div");
  fileRow.className = "lmb-actions";
  fileRow.append(
    makeButton(tr("ui.tabs.codexTab.renderManage.export"), () => send({ type: "codex_backup", chatId }), {
      disabled: busy || !state.codexExists,
      title: tr("ui.tabs.codexTab.renderManage.downloadEveryCodexFilePlusItsInject"),
    }),
    makeButton(tr("ui.tabs.codexTab.renderManage.import"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.importACodexFile"), tr("ui.tabs.codexTab.ok.memoriaWillReplaceEveryCodexFileIn"));
      if (ok) restoreBackup(ctx, chatId, send);
    }, { disabled: busy, title: tr("ui.tabs.codexTab.renderManage.replaceThisChatSCodexFromAn") }),
  );
  files.body.appendChild(fileRow);
  host.appendChild(files.wrap);

  const danger = section(tr("ui.tabs.codexTab.danger.startOver"));
  danger.body.appendChild(textNode(
    tr("ui.tabs.codexTab.renderManage.rebuildReReadsTheWholeChatFrom"),
    "lmb-help",
  ));
  const dangerRow = document.createElement("div");
  dangerRow.className = "lmb-actions";
  lessonMark(dangerRow, "codex.manage.startover");
  dangerRow.append(
    makeButton(tr("ui.tabs.codexTab.renderManage.rebuildCodex"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.rebuildTheCodex"), tr("ui.tabs.codexTab.ok.memoriaWillEraseTheStoryBibleAnd"));
      if (ok) requestCodexRebuild(state, chatId, send);
    }, {
      disabled: busy || !state.settings.enabled || !profile.codexEnabled,
      title: tr("ui.tabs.codexTab.renderManage.wipeAndRegenerateTheWholeStoryBible"),
    }),
    makeButton(tr("ui.tabs.codexTab.renderManage.wipeCodex"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.wipeTheCodex"), tr("ui.tabs.codexTab.ok.memoriaWillEraseEveryCodexRecordFor"));
      if (ok) send({ type: "codex_reset", chatId });
    }, { danger: true, disabled: busy || !state.codexExists }),
  );
  danger.body.appendChild(dangerRow);
  host.appendChild(danger.wrap);
}

function restoreBackup(
  ctx: SpindleFrontendContext,
  chatId: string,
  send: (msg: FrontendToBackend) => void,
): void {
  ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 20_000_000 })
    .then((files) => {
      if (!files.length) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(new TextDecoder().decode(files[0]!.bytes));
      } catch (err) {
        console.warn("[LumiBooks] codex backup parse failed", err);
        showToast("error", tr("ui.tabs.codexTab.restoreBackup.memoriaCouldnTReadThatBackupFile"));
        return;
      }
      send({ type: "codex_restore", chatId, raw: parsed });
    })
    .catch((err) => {
      console.warn("[LumiBooks] codex backup picker failed", err);
    });
}

/** Backup content arrives from the backend so it reflects disk, not the tab cache. */
export function downloadCodexBackup(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderBibleTile(
  def: { id: string; label: string; files: CodexFileKey[] },
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
  busy: boolean,
): HTMLElement {
  const chatId = state.activeChatId!;
  let st = tileState(state, def.files);
  const stale = def.files.some((f) => state.codexStaleFiles?.includes(f));
  const needsCatchup = def.files.some((f) => state.codexRefreshPending?.includes(f));
  // Rendered-injection pricing from the backend; raw JSON length (with its
  // syntax overhead) only as a version-skew fallback.
  const tokens = state.codexFileTokens
    ? def.files.reduce((acc, f) => acc + (state.codexFileTokens[f] ?? 0), 0)
    : def.files.reduce((acc, f) => acc + Math.ceil((cache.files?.[f]?.length ?? 0) / 4), 0);

  const tile = document.createElement("div");
  tile.className = `lmb-tile lmb-bible-tile ${st}${stale || needsCatchup ? " stale" : ""}`;
  lessonMark(tile, `codex.tile.${def.id}`);
  tile.title = tr("ui.tabs.codexTab.renderBibleTile.clickToCycle", { tileStateLabelSt: TILE_STATE_LABEL[st], choice: (stale) ? "yes" : "no", choice2: (needsCatchup) ? "yes" : "no" });

  const v = document.createElement("div");
  v.className = "lmb-tile-value";
  v.textContent = String(tileCount(parsed, def.id));
  const l = document.createElement("div");
  l.className = "lmb-tile-label";
  l.textContent = def.label;
  const s = document.createElement("div");
  s.className = "lmb-tile-sub";
  s.textContent = tr("ui.tabs.codexTab.renderBibleTile.tokens", { choice: (state.codexTokensApproximate) ? "yes" : "no", formatTokens: formatTokens(tokens) });
  const stateLine = document.createElement("div");
  stateLine.className = "lmb-tile-state";
  stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? tr("ui.tabs.codexTab.renderBibleTile.stale") : ""}${needsCatchup ? tr("ui.tabs.codexTab.renderBibleTile.needsCatchUp") : ""}`;
  tile.append(v, l, s, stateLine);

  const tools = document.createElement("div");
  tools.className = "lmb-tile-tools";
  const tidyBtn = makeButton(busy ? tr("ui.tabs.codexTab.tidyBtn.cancel") : tr("ui.tabs.codexTab.tidyBtn.tidy"), () => {
    if (busy) send({ type: "abort_busy", chatId, kind: "codex" });
    else requestCodexTidy(state, chatId, send, def.files);
  }, {
    small: true,
    disabled: !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled || !state.codexExists),
    title: busy ? tr("ui.tabs.codexTab.tidyBtn.abortTheCodexTaskInFlight") : tr("ui.tabs.codexTab.tidyBtn.chooseATargetSizeForThisRecord"),
  });
  tidyBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(tidyBtn);
  const rebuildBtn = makeButton(tr("ui.tabs.codexTab.rebuildBtn.rebuild"), () => {
    void (async () => {
      const ok = await confirmDelete(
        ctx,
        tr("ui.tabs.codexTab.ok.rebuildThisRecord"),
        tr("ui.tabs.codexTab.ok.memoriaWillRegenerateEveryRecordInFrom", { label: def.label }),
      );
      if (ok) send({ type: "codex_rebuild_files", chatId, files: def.files });
    })();
  }, {
    small: true,
    disabled: busy || st === "frozen" || !state.codexExists || !state.settings.enabled || !state.activeProfile.codexEnabled,
    title: tr("ui.tabs.codexTab.rebuildBtn.regenerateJustThisCategoryFromTheWhole"),
  });
  rebuildBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(rebuildBtn);
  const purgeBtn = makeButton(tr("ui.tabs.codexTab.purgeBtn.purge"), () => {
    void (async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.purgeThisRecord"), purgeMessage(def));
      if (!ok) return;
      sendCodexWrite(def.files[0]!, PURGE_SCAFFOLD[def.files[0]!], state, send);
    })();
  }, {
    small: true,
    danger: true,
    disabled: busy || st === "frozen" || !state.codexExists || tileCount(parsed, def.id) === 0,
    title: tr("ui.tabs.codexTab.purgeBtn.deleteEveryRecordInThisCategoryAt"),
  });
  purgeBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(purgeBtn);
  tile.appendChild(tools);

  tile.addEventListener("click", () => {
    cycleTileState(def, st, state, send);
    st = tileState(state, def.files);
    tile.classList.remove("on", "noInject", "frozen");
    tile.classList.add(st);
    tile.title = tr("ui.tabs.codexTab.renderBibleTile.clickToCycle2", { tileStateLabelSt: TILE_STATE_LABEL[st] });
    stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? tr("ui.tabs.codexTab.renderBibleTile.stale") : ""}${needsCatchup ? tr("ui.tabs.codexTab.renderBibleTile.needsCatchUp") : ""}`;
    tidyBtn.disabled = !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled || !state.codexExists);
    rebuildBtn.disabled = busy || st === "frozen" || !state.codexExists || !state.settings.enabled || !state.activeProfile.codexEnabled;
    purgeBtn.disabled = busy || st === "frozen" || !state.codexExists || tileCount(parsed, def.id) === 0;
  });
  return tile;
}

/** on -> noInject -> frozen -> on. Re-enabling a stale record is instant;
 * the backend flags it for the one-pass catch-up and the banner offers it. */
function cycleTileState(
  def: { files: CodexFileKey[] },
  st: FileState,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const chatId = state.activeChatId!;
  const next: FileState = st === "on" ? "noInject" : st === "noInject" ? "frozen" : "on";
  for (const f of def.files) fileStateChanges.change(chatId, f, st, next, send);
}

/* ------------------------------------------------------------- entities */

const ENTITY_TEXT_FIELDS = ["kind", "role", "significance"] as const;
const ENTITY_LONG_FIELDS = ["appearance", "description", "notes"] as const;
const ENTITY_LIST_FIELDS = ["aliases", "traits", "goals", "ties", "keywords"] as const;
const ENTITY_FIELD_LABELS: Record<string, string> = {
  kind: tr("ui.tabs.codexTab.entityFields.kind"), role: tr("ui.tabs.codexTab.entityFields.role"),
  significance: tr("ui.tabs.codexTab.entityFields.significance"), appearance: tr("ui.tabs.codexTab.entityFields.appearance"),
  description: tr("ui.tabs.codexTab.entityFields.description"), notes: tr("ui.tabs.codexTab.entityFields.notes"),
  aliases: tr("ui.tabs.codexTab.entityFields.aliases"), traits: tr("ui.tabs.codexTab.entityFields.traits"),
  goals: tr("ui.tabs.codexTab.entityFields.goals"), ties: tr("ui.tabs.codexTab.entityFields.ties"),
  keywords: tr("ui.tabs.codexTab.entityFields.keywords"),
};
// "status" is deprecated, "locked"/"lockedFields"/"noInject" user-owned, "rid"
// plumbing: never shown as extras.
const ENTITY_KNOWN = new Set<string>(["id", "name", "status", "locked", "lockedFields", "lockedfields", "noInject", "noinject", "rid", ...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);

/** Fields a per-field lock can hold. Name stays writable, it identifies the
 * sheet to the agent. */
const LOCKABLE_FIELDS = new Set<string>([...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);

/** Where the Lock button sits in its cycle: open, then locked, then held back. */
type EntitySheetState = "open" | "locked" | "held";

function entityNoInject(e: Record<string, unknown>): boolean {
  return e["noInject"] === true || e["noinject"] === true;
}

function entitySheetState(e: Record<string, unknown>): EntitySheetState {
  if (entityNoInject(e)) return "held";
  return e["locked"] === true ? "locked" : "open";
}

const SHEET_STATE_TITLE: Record<EntitySheetState, string> = {
  open: tr("ui.tabs.codexTab.sheetStateTitle.memoriaMaintainsThisSheetClickToLock"),
  locked: tr("ui.tabs.codexTab.sheetStateTitle.frozenAndStillInjectedClickToHold"),
  held: tr("ui.tabs.codexTab.sheetStateTitle.frozenAndHeldOutOfThePrompt"),
};

// Both axes, so a hand-authored noInject without a lock still reads true.
function sheetStateLabel(e: Record<string, unknown>): string {
  const locked = e["locked"] === true;
  return tr("ui.tabs.codexTab.sheetStateLabel.state", { locked: locked ? "yes" : "no", injected: entityNoInject(e) ? "no" : "yes" });
}

function entitySearchText(e: Record<string, unknown>): string[] {
  const bits: string[] = [];
  for (const v of Object.values(e)) {
    if (typeof v === "string") bits.push(v);
    else if (Array.isArray(v)) bits.push(...strArray(v));
  }
  return bits;
}

function slugId(ns: string, name: string, taken: Set<string>): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unnamed";
  let id = `${ns}:${base}`;
  let n = 2;
  while (taken.has(id)) id = `${ns}:${base}_${n++}`;
  return id;
}

function renderEntities(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.codexTab.sec.entities"));
  lessonMark(sec.wrap, "codex.entities");
  sec.body.appendChild(textNode(
    tr("ui.tabs.codexTab.renderEntities.clickANameToOpenItsSheet"),
    "lmb-help",
  ));
  let any = false;
  for (const g of ENTITY_GROUPS) {
    const all = parsed[g.key];
    const list = all.filter((e) => matches(local.query, ...entitySearchText(e)));
    if (all.length > 0) any = true;

    const searching = local.query !== "";
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = searching ? tr("ui.tabs.codexTab.renderEntities.of", { title: g.title, length: list.length, length2: all.length }) : `${g.title} (${all.length})`;
    sec.body.appendChild(sub);

    const grid = document.createElement("div");
    grid.className = "lmb-chipgrid";
    for (const e of list) {
      const id = str(e["id"]) || str(e["name"]);
      const chipEl = document.createElement("button");
      chipEl.type = "button";
      chipEl.className = `lmb-chip${local.expandedEntity === id ? " active" : ""}`;
      chipEl.textContent = str(e["name"]) || id || "?";
      chipEl.addEventListener("click", () => {
        local.expandedEntity = local.expandedEntity === id ? null : id;
        local.entityDraft = null;
        rerender();
      });
      grid.appendChild(chipEl);
    }
    // Add button lives in the chip grid like a ghost chip - but not amid
    // search results, where it would read as a match.
    if (!searching) {
      const addChip = document.createElement("button");
      addChip.type = "button";
      addChip.className = "lmb-chip add";
      if (g.key === "characters") lessonMark(addChip, "codex.entities.add");
      addChip.textContent = tr("ui.tabs.codexTab.renderEntities.value", { singular: g.singular });
      addChip.addEventListener("click", () => {
        local.addFormGroup = local.addFormGroup === g.key ? null : g.key;
        local.addFormName = "";
        rerender();
      });
      grid.appendChild(addChip);
    }
    sec.body.appendChild(grid);

    if (local.addFormGroup === g.key) {
      sec.body.appendChild(renderAddForm(g.key, g.ns, parsed));
    }

    const draft = local.entityDraft;
    if (draft && draft.group === g.key) {
      sec.body.appendChild(renderEntityForm(draft, state, send));
    } else {
      const open = all.find((e) => (str(e["id"]) || str(e["name"])) === local.expandedEntity);
      if (open) sec.body.appendChild(renderEntityCard(g.key, open, parsed, state, ctx, send));
    }
  }
  if (!any) sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderEntities.noEntitiesRecordedYetAddOneOr"), "lmb-empty"));
  host.appendChild(sec.wrap);
}

function renderAddForm(
  group: EntityGroup,
  ns: string,
  parsed: ParsedCodex,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "lmb-add-form";
  // Lesson do-steps keep their spotlight on this form as it appears.
  lessonMark(row, "codex.entities.addform");
  const input = textInput({
    value: local.addFormName,
    placeholder: tr("ui.tabs.codexTab.input.name"),
    autoFocus: true,
    onChange: (v) => { local.addFormName = v; },
  });
  input.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") submit();
  });
  const submit = (): void => {
    const name = local.addFormName.trim();
    if (!name) return;
    const taken = new Set(parsed[group].map((e) => str(e["id"])));
    const id = slugId(ns, name, taken);
    // Open the sheet editor immediately; Save writes the whole file.
    local.entityDraft = makeDraft(group, { id, name });
    local.expandedEntity = id;
    local.addFormGroup = null;
    local.addFormName = "";
    rerender();
  };
  row.append(
    input,
    makeButton(tr("ui.tabs.codexTab.renderAddForm.create"), submit, { primary: true, small: true }),
    makeButton(tr("ui.tabs.codexTab.renderAddForm.cancel"), () => {
      local.addFormGroup = null;
      local.addFormName = "";
      rerender();
    }, { small: true }),
  );
  return row;
}

function entityLockedFields(e: Record<string, unknown>): string[] {
  return strArray(e["lockedFields"] ?? e["lockedfields"]);
}

function makeDraft(group: EntityGroup, e: Record<string, unknown>): EntityDraft {
  const fields: Record<string, string> = { name: str(e["name"]) };
  for (const f of ENTITY_TEXT_FIELDS) fields[f] = str(e[f]);
  for (const f of ENTITY_LONG_FIELDS) fields[f] = str(e[f]);
  for (const f of ENTITY_LIST_FIELDS) fields[f] = strArray(e[f]).join(", ");
  return { group, id: str(e["id"]), fields, extras: draftExtraFields(e, ENTITY_KNOWN), lockedFields: new Set(entityLockedFields(e)), saving: false };
}

function renderEntityCard(
  group: EntityGroup,
  e: Record<string, unknown>,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "lmb-entity-card";
  // Where a do-step's spotlight lands once the sheet editor closes.
  lessonMark(card, "codex.entities.card");
  const locked = e["locked"] === true;
  const sheetState = entitySheetState(e);
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = str(e["name"]) || "?";
  const id = str(e["id"]);
  if (id) {
    const idEl = document.createElement("span");
    idEl.className = "lmb-entity-id";
    idEl.textContent = id;
    name.appendChild(idEl);
  }
  if (sheetState === "held") name.appendChild(lessonMark(pill(tr("ui.tabs.codexTab.renderEntityCard.notInjected"), "warn"), "codex.entities.statepill"));
  else if (locked) name.appendChild(lessonMark(pill(tr("ui.tabs.codexTab.renderEntityCard.locked"), "warn"), "codex.entities.statepill"));
  card.appendChild(name);

  const kv = document.createElement("div");
  kv.className = "lmb-kv";
  const fieldLocks = new Set(entityLockedFields(e));
  const addKv = (label: string, value: string): void => {
    if (!value) return;
    const k = document.createElement("div");
    k.className = "lmb-kv-key";
    const displayLabel = Object.hasOwn(ENTITY_FIELD_LABELS, label) ? ENTITY_FIELD_LABELS[label]! : label;
    k.textContent = fieldLocks.has(label) ? `${displayLabel} 🔒` : displayLabel;
    if (fieldLocks.has(label)) k.title = tr("ui.tabs.codexTab.addKv.lockedFieldMemoriaCanNeverChangeIt");
    const v = document.createElement("div");
    v.className = "lmb-kv-value";
    v.textContent = value;
    kv.append(k, v);
  };
  for (const f of [...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS]) addKv(f, str(e[f]));
  for (const f of ENTITY_LIST_FIELDS) {
    const list = strArray(e[f]);
    if (list.length) addKv(f, list.join(" · "));
  }
  for (const [k, v] of Object.entries(e)) {
    if (ENTITY_KNOWN.has(k)) continue;
    if (typeof v === "string" && v) addKv(k, v);
    else if (typeof v === "number" || typeof v === "boolean") addKv(k, String(v));
    else if (Array.isArray(v)) addKv(k, strArray(v).join(" · "));
  }
  card.appendChild(kv);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton(tr("ui.tabs.codexTab.renderEntityCard.editSheet"), () => {
      local.entityDraft = makeDraft(group, e);
      rerender();
    }, { primary: true, small: true }),
    lessonMark(makeButton(sheetStateLabel(e), () => {
      const list = (cache.parsed ?? parsed)[group];
      const next = list.map((x) => {
        if (str(x["id"]) !== id) return x;
        const row = { ...x };
        delete row["locked"];
        delete row["noInject"];
        delete row["noinject"];
        if (sheetState === "open") row["locked"] = true;
        else if (sheetState === "locked") {
          row["locked"] = true;
          row["noInject"] = true;
        }
        return row;
      });
      sendCodexWrite(group, { entities: next }, state, send);
    }, {
      small: true,
      title: SHEET_STATE_TITLE[sheetState],
    }), "codex.entities.lock"),
    makeButton(tr("ui.tabs.codexTab.renderEntityCard.delete"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.deleteEntity"), tr("ui.tabs.codexTab.ok.memoriaWillRemoveFromTheCodexReferences", { str: str(e["name"]) }));
      if (!ok) return;
      const next = (cache.parsed ?? parsed)[group].filter((x) => str(x["id"]) !== id);
      sendCodexWrite(group, { entities: next }, state, send);
    }, { danger: true, small: true }),
  );
  card.appendChild(actions);
  return card;
}

function renderEntityForm(
  draft: EntityDraft,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  // Lesson do-steps expand their spotlight onto the open sheet editor.
  lessonMark(card, "codex.entities.editor");
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = draft.fields["name"] || tr("ui.tabs.codexTab.renderEntityForm.newEntity");
  const idEl = document.createElement("span");
  idEl.className = "lmb-entity-id";
  idEl.textContent = draft.id;
  name.appendChild(idEl);
  card.appendChild(name);

  const bind = (key: string, el: HTMLInputElement | HTMLTextAreaElement): void => {
    el.addEventListener("input", () => { draft.fields[key] = el.value; });
  };

  // Per-field lock toggle in the label row: a locked field is user-owned, the
  // agent reads "Locked, do not edit" in its place and its writes revert.
  const lockableWrap = (key: string, label: string): HTMLElement => {
    const w = fieldWrap(label);
    if (!LOCKABLE_FIELDS.has(key) && !draft.extras.some(extra => extra.key === key)) return w;
    const lbl = w.firstElementChild as HTMLElement;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lmb-field-lock";
    const sync = (): void => {
      const on = draft.lockedFields.has(key);
      btn.textContent = on ? tr("ui.tabs.codexTab.sync.locked") : "🔓";
      btn.title = on
        ? tr("ui.tabs.codexTab.sync.lockedMemoriaReadsALockMarkerInstead")
        : tr("ui.tabs.codexTab.sync.lockThisFieldSoOnlyYouCan");
      btn.classList.toggle("active", on);
    };
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (draft.lockedFields.has(key)) draft.lockedFields.delete(key);
      else draft.lockedFields.add(key);
      sync();
    });
    sync();
    lbl.appendChild(btn);
    return w;
  };

  const form = document.createElement("div");
  form.className = "lmb-entity-form";

  const nameField = fieldWrap(tr("ui.tabs.codexTab.nameField.name"));
  const nameInput = textInput({ value: draft.fields["name"] ?? "" });
  bind("name", nameInput);
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  for (const f of ENTITY_TEXT_FIELDS) {
    const w = lockableWrap(f, ENTITY_FIELD_LABELS[f]!);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    grid.appendChild(w);
  }
  form.appendChild(grid);

  for (const f of ENTITY_LONG_FIELDS) {
    const w = lockableWrap(f, ENTITY_FIELD_LABELS[f]!);
    const ta = textArea({ value: draft.fields[f] ?? "", rows: 2 });
    bind(f, ta);
    w.appendChild(ta);
    form.appendChild(w);
  }

  const relationsOn = state.activeProfile.codexRelationsTable;
  for (const f of ENTITY_LIST_FIELDS) {
    if (f === "ties" && relationsOn) continue;
    const w = lockableWrap(f, tr("ui.tabs.codexTab.w.commaSeparated", { f: ENTITY_FIELD_LABELS[f]! }));
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    form.appendChild(w);
  }
  for (const extra of draft.extras) {
    const label = extra.type === "list" ? tr("ui.tabs.codexTab.label.onePerLine", { key: extra.key }) : extra.key;
    const w = lockableWrap(extra.key, label);
    const input = extra.type === "list" || extra.type === "string"
      ? textArea({ value: extra.value, rows: 2 })
      : extra.type === "boolean"
        ? select({ value: extra.value, options: [{ value: "true", label: tr("ui.tabs.codexTab.input.true") }, { value: "false", label: tr("ui.tabs.codexTab.input.false") }], onChange: value => { extra.value = value; } })
        : textInput({ value: extra.value });
    if (extra.type === "number") (input as HTMLInputElement).inputMode = "decimal";
    input.addEventListener("input", () => { extra.value = input.value; });
    w.appendChild(input);
    form.appendChild(w);
  }
  const fieldError = textNode("", "lmb-help");
  fieldError.setAttribute("role", "alert");
  form.appendChild(fieldError);
  card.appendChild(form);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const saveBtn = makeButton(draft.saving ? tr("ui.tabs.codexTab.saveBtn.saving") : tr("ui.tabs.codexTab.saveBtn.save"), () => {
    if (draft.saving) return;
    const parsed = cache.parsed;
    if (!parsed) return;
    let entity: Record<string, unknown> | null;
    try { entity = buildEntityFromDraft(draft, parsed); }
    catch (error) {
      fieldError.textContent = error instanceof Error ? error.message : String(error);
      return;
    }
    if (!entity) {
      showToast("warn", tr("ui.tabs.codexTab.saveBtn.theEntityNeedsAName"));
      return;
    }
    const list = parsed[draft.group];
    const idx = list.findIndex((x) => str(x["id"]) === draft.id);
    const next = idx >= 0 ? [...list.slice(0, idx), entity, ...list.slice(idx + 1)] : [...list, entity];
    draft.saving = true;
    sendCodexWrite(draft.group, { entities: next }, state, send);
    rerender();
  }, { primary: true, small: true, disabled: draft.saving });
  actions.append(
    saveBtn,
    makeButton(tr("ui.tabs.codexTab.renderEntityForm.cancel"), () => {
      local.entityDraft = null;
      rerender();
    }, { small: true }),
  );
  card.appendChild(actions);
  return card;
}

function fieldWrap(label: string): HTMLElement {
  const w = document.createElement("div");
  w.className = "lmb-field";
  const l = document.createElement("div");
  l.className = "lmb-field-label";
  l.textContent = label;
  w.appendChild(l);
  return w;
}

function buildEntityFromDraft(draft: EntityDraft, parsed: ParsedCodex): Record<string, unknown> | null {
  const name = (draft.fields["name"] ?? "").trim();
  if (!name) return null;
  const orig = parsed[draft.group].find((x) => str(x["id"]) === draft.id);
  const out: Record<string, unknown> = {};
  // Preserve fields outside this draft, then apply the editable primitive extras.
  if (orig) {
    for (const [k, v] of Object.entries(orig)) {
      if (!ENTITY_KNOWN.has(k)) out[k] = v;
    }
    if (orig["locked"] === true) out["locked"] = true;
    if (entityNoInject(orig)) out["noInject"] = true;
  }
  out["id"] = draft.id;
  out["name"] = name;
  applyExtraFields(out, draft.extras);
  for (const f of [...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS]) {
    const v = (draft.fields[f] ?? "").trim();
    if (v) out[f] = v;
  }
  for (const f of ENTITY_LIST_FIELDS) {
    const items = (draft.fields[f] ?? "")
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length) out[f] = items;
  }
  const locks = [...draft.lockedFields].filter((f) => LOCKABLE_FIELDS.has(f) || (draft.extras.some(extra => extra.key === f) && Object.hasOwn(out, f)));
  if (locks.length) out["lockedFields"] = locks;
  return out;
}

/* ------------------------------------------------ generic record editing */

function splitLines(v: string): string[] {
  return v.split(/\n/).map((x) => x.trim()).filter(Boolean);
}

function splitComma(v: string): string[] {
  return v.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}

/** Datalist of entity refs so relation/knowledge fields autocomplete. */
function ensureRefDatalist(parsed: ParsedCodex): string {
  const ID = "lmb-entity-refs";
  document.getElementById(ID)?.remove();
  const dl = document.createElement("datalist");
  dl.id = ID;
  for (const list of [parsed.characters, parsed.locations, parsed.things]) {
    for (const e of list) {
      const id = str(e["id"]);
      if (!id) continue;
      const opt = document.createElement("option");
      opt.value = id;
      opt.label = str(e["name"]);
      dl.appendChild(opt);
    }
  }
  document.body.appendChild(dl);
  return ID;
}

interface RecordFieldSpec {
  key: string;
  label: string;
  widget: "input" | "textarea" | "lines" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  refList?: boolean;
}

function renderRecordForm(
  title: string,
  specs: RecordFieldSpec[],
  draft: RecordDraft,
  refListId: string | null,
  onSave: () => void,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "lmb-entity-card editing";
  const head = document.createElement("div");
  head.className = "lmb-entity-name";
  head.textContent = title;
  card.appendChild(head);

  const form = document.createElement("div");
  form.className = "lmb-entity-form";
  for (const spec of specs) {
    const w = fieldWrap(spec.label);
    let el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (spec.widget === "select") {
      el = select({
        value: draft.fields[spec.key] ?? spec.options?.[0]?.value ?? "",
        options: spec.options ?? [],
        onChange: (v) => { draft.fields[spec.key] = v; },
      });
    } else if (spec.widget === "input") {
      el = textInput({ value: draft.fields[spec.key] ?? "", placeholder: spec.placeholder });
      if (spec.refList && refListId) el.setAttribute("list", refListId);
      el.addEventListener("input", () => { draft.fields[spec.key] = (el as HTMLInputElement).value; });
    } else {
      el = textArea({ value: draft.fields[spec.key] ?? "", rows: spec.widget === "lines" ? 3 : 2, placeholder: spec.placeholder });
      el.addEventListener("input", () => { draft.fields[spec.key] = (el as HTMLTextAreaElement).value; });
    }
    w.appendChild(el);
    form.appendChild(w);
  }
  card.appendChild(form);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton(draft.saving ? tr("ui.tabs.codexTab.renderRecordForm.saving") : tr("ui.tabs.codexTab.renderRecordForm.save"), () => {
      if (!draft.saving) onSave();
    }, { primary: true, small: true, disabled: draft.saving }),
    makeButton(tr("ui.tabs.codexTab.renderRecordForm.cancel"), () => {
      local.recordDraft = null;
      rerender();
    }, { small: true }),
  );
  card.appendChild(actions);
  return card;
}

function recordItemActions(
  onEdit: () => void,
  onDelete: () => void,
  ctx: SpindleFrontendContext,
  deleteMessage: string,
): HTMLElement {
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton(tr("ui.tabs.codexTab.recordItemActions.edit"), onEdit, { small: true }),
    makeButton(tr("ui.tabs.codexTab.recordItemActions.delete"), async () => {
      const ok = await confirmDelete(ctx, tr("ui.tabs.codexTab.ok.delete"), deleteMessage);
      if (ok) onDelete();
    }, { small: true, danger: true }),
  );
  return actions;
}

/* ------------------------------------------------------------ relations */

function relationSearchText(r: Record<string, unknown>, nameOf: (ref: string) => string): string[] {
  const bits: string[] = [str(r["kind"]), str(r["state"]), ...strArray(r["history"])];
  if (r["type"] === "group") bits.push(...strArray(r["members"]).map(nameOf));
  else bits.push(nameOf(str(r["a"])), nameOf(str(r["b"])));
  return bits;
}

function relationDraftFrom(r: Record<string, unknown> | null, index: number): RecordDraft {
  return {
    kind: "relation",
    index,
    ...(r ? { orig: JSON.stringify(r) } : {}),
    saving: false,
    fields: {
      type: r?.["type"] === "group" ? "group" : "pair",
      a: str(r?.["a"]),
      b: str(r?.["b"]),
      members: strArray(r?.["members"]).join(", "),
      kind: str(r?.["kind"]),
      state: str(r?.["state"]),
      history: strArray(r?.["history"]).join("\n"),
    },
  };
}

function buildRelationFromDraft(d: RecordDraft): Record<string, unknown> | null {
  const kind = (d.fields["kind"] ?? "").trim();
  const stateText = (d.fields["state"] ?? "").trim();
  if (!kind || !stateText) return null;
  const history = splitLines(d.fields["history"] ?? "");
  if (d.fields["type"] === "group") {
    const members = splitComma(d.fields["members"] ?? "");
    if (members.length < 2) return null;
    return { type: "group", kind, members, state: stateText, ...(history.length ? { history } : {}) };
  }
  const a = (d.fields["a"] ?? "").trim();
  const b = (d.fields["b"] ?? "").trim();
  if (!a || !b) return null;
  return { type: "pair", a, b, kind, state: stateText, ...(history.length ? { history } : {}) };
}

function saveRelationDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const rel = buildRelationFromDraft(d);
  if (!rel) {
    showToast("warn", d.fields["type"] === "group"
      ? tr("ui.tabs.codexTab.saveRelationDraft.theGroupNeedsAtLeastTwoMembers")
      : tr("ui.tabs.codexTab.saveRelationDraft.theRelationNeedsFromToAKind"));
    return;
  }
  const idx = resolveDraftIndex(parsed.relations, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  // The row key survives a hand edit so agent patch ops keep addressing it.
  if (idx >= 0) {
    const rid = str(parsed.relations[idx]!["rid"]);
    if (rid) rel["rid"] = rid;
    const roles = parsed.relations[idx]!["roles"];
    if (rel["type"] === "group" && roles && typeof roles === "object" && !Array.isArray(roles)) {
      rel["roles"] = roles;
    }
  }
  const next = idx >= 0
    ? [...parsed.relations.slice(0, idx), rel, ...parsed.relations.slice(idx + 1)]
    : [...parsed.relations, rel];
  d.saving = true;
  sendCodexWrite("relations", { relations: next }, state, send);
  rerender();
}

function relationFormEl(
  draft: RecordDraft,
  refListId: string,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): HTMLElement {
  const isGroup = draft.fields["type"] === "group";
  const specs: RecordFieldSpec[] = [
    { key: "type", label: tr("ui.tabs.codexTab.specs.type"), widget: "select", options: [{ value: "pair", label: tr("ui.tabs.codexTab.specs.pairAB") }, { value: "group", label: tr("ui.tabs.codexTab.specs.group") }] },
    ...(isGroup
      ? [{ key: "members", label: tr("ui.tabs.codexTab.specs.membersCommaSeparatedRefs"), widget: "input" as const, refList: true, placeholder: tr("ui.tabs.codexTab.specs.charEliasCharWren") }]
      : [
          { key: "a", label: tr("ui.tabs.codexTab.specs.fromA"), widget: "input" as const, refList: true, placeholder: tr("ui.tabs.codexTab.specs.charElias") },
          { key: "b", label: tr("ui.tabs.codexTab.specs.toB"), widget: "input" as const, refList: true, placeholder: tr("ui.tabs.codexTab.specs.charWren") },
        ]),
    { key: "kind", label: tr("ui.tabs.codexTab.specs.kind"), widget: "input", placeholder: tr("ui.tabs.codexTab.specs.bondOwnsAtRival") },
    { key: "state", label: tr("ui.tabs.codexTab.specs.state"), widget: "textarea", placeholder: tr("ui.tabs.codexTab.specs.lovesHerHidesIt") },
    { key: "history", label: tr("ui.tabs.codexTab.specs.historyOnePerLine"), widget: "lines", placeholder: tr("ui.tabs.codexTab.specs.day12SheSawHimKill") },
  ];
  const form = renderRecordForm(
    draft.index >= 0 ? tr("ui.tabs.codexTab.form.editRelation") : tr("ui.tabs.codexTab.form.newRelation"),
    specs,
    draft,
    refListId,
    () => saveRelationDraft(draft, state, send),
  );
  // Lesson do-steps expand their spotlight onto the open relation form.
  lessonMark(form, "codex.rel.form");
  // Type flips rebuild the form so the member/pair fields swap.
  form.querySelector("select")?.addEventListener("change", () => rerender());
  return form;
}

function renderRelations(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.codexTab.sec.relations"));
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const relationsOn = state.activeProfile.codexRelationsTable;

  const viewRow = document.createElement("div");
  viewRow.className = "lmb-actions";
  lessonMark(viewRow, "codex.rel.view");
  viewRow.append(
    makeButton(tr("ui.tabs.codexTab.renderRelations.list"), () => {
      if (local.relationsView === "list") return;
      local.relationsView = "list";
      local.recordDraft = null;
      rerender();
    }, { small: true }),
    lessonMark(makeButton(tr("ui.tabs.codexTab.renderRelations.graph"), () => {
      if (local.relationsView === "graph") return;
      local.relationsView = "graph";
      // An open editor doesn't exist in graph view: leaving it live would
      // strand a form the user can no longer see the context of.
      local.recordDraft = null;
      rerender();
    }, { small: true }), "codex.rel.graphbtn"),
  );
  (viewRow.children[local.relationsView === "list" ? 0 : 1] as HTMLElement).classList.add("active");
  if (relationsOn && local.relationsView === "list") {
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    viewRow.append(spacer, lessonMark(makeButton(tr("ui.tabs.codexTab.renderRelations.relation"), () => {
      local.recordDraft = relationDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }), "codex.rel.add"));
  }
  sec.body.appendChild(viewRow);

  const draft = local.recordDraft;
  // Only NEW relations form at the top; edits render in place of their row.
  if (draft?.kind === "relation" && draft.index === -1) {
    sec.body.appendChild(relationFormEl(draft, refListId, state, send));
  }

  if (parsed.relations.length === 0) {
    sec.body.appendChild(textNode(
      relationsOn
        ? tr("ui.tabs.codexTab.renderRelations.noRelationsRecordedYetAddOneOr")
        : tr("ui.tabs.codexTab.renderRelations.theRelationsTableIsOffForThis"),
      "lmb-empty",
    ));
    host.appendChild(sec.wrap);
    return;
  }

  if (local.relationsView === "graph") {
    renderRelationGraph(sec.body, parsed, nameOf);
    host.appendChild(sec.wrap);
    return;
  }

  const list = document.createElement("div");
  list.className = "lmb-relation-list";
  let shown = 0;
  parsed.relations.forEach((r, i) => {
    if (!matches(local.query, ...relationSearchText(r, nameOf))) return;
    shown++;
    // The row under edit is replaced by its form, right where it was.
    if (draft?.kind === "relation" && draft.index === i) {
      list.appendChild(relationFormEl(draft, refListId, state, send));
      return;
    }
    const expanded = local.expandedRelations.has(i);
    const row = document.createElement("div");
    row.className = "lmb-relation";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "lmb-record-head";

    const names = document.createElement("span");
    names.className = "lmb-relation-names lmb-grow";
    if (r["type"] === "group") {
      names.textContent = strArray(r["members"]).map(nameOf).join(" · ");
    } else {
      names.append(
        document.createTextNode(nameOf(str(r["a"]))),
        arrowSpan(),
        document.createTextNode(nameOf(str(r["b"]))),
      );
    }
    const kind = str(r["kind"]);
    head.appendChild(names);
    if (kind) {
      const tag = document.createElement("span");
      tag.className = "lmb-entry-tag";
      tag.textContent = kind;
      head.appendChild(tag);
    }
    const chevron = document.createElement("span");
    chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
    head.appendChild(chevron);
    head.addEventListener("click", () => {
      if (expanded) local.expandedRelations.delete(i);
      else local.expandedRelations.add(i);
      rerender();
    });
    row.appendChild(head);

    const stateText = str(r["state"]);
    if (stateText) row.appendChild(textNode(stateText, "lmb-relation-state"));

    if (expanded) {
      const history = strArray(r["history"]);
      if (history.length) {
        const ul = document.createElement("ul");
        ul.className = "lmb-history";
        for (const h of history) {
          const li = document.createElement("li");
          li.textContent = h;
          ul.appendChild(li);
        }
        row.appendChild(ul);
      }
      const roles = r["roles"];
      if (roles && typeof roles === "object" && !Array.isArray(roles)) {
        for (const [ref, role] of Object.entries(roles as Record<string, unknown>)) {
          if (typeof role === "string") row.appendChild(textNode(`${role}: ${nameOf(ref)}`, "lmb-thread-detail"));
        }
      }
      row.appendChild(recordItemActions(
        () => { local.recordDraft = relationDraftFrom(r, i); rerender(); },
        () => {
          const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.relations, i, r) : null;
          if (!next) { staleDraftAbort(); return; }
          sendCodexWrite("relations", { relations: next }, state, send);
        },
        ctx,
        tr("ui.tabs.codexTab.renderRelations.memoriaWillRemoveThisRelationFromThe"),
      ));
    }
    list.appendChild(row);
  });
  if (shown === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderRelations.noRelationMatchesTheSearch"), "lmb-empty"));
  } else {
    sec.body.appendChild(list);
  }
  host.appendChild(sec.wrap);
}

function arrowSpan(): HTMLElement {
  const s = document.createElement("span");
  s.className = "lmb-relation-arrow";
  s.textContent = tr("ui.tabs.codexTab.arrowSpan.value");
  return s;
}

/* ------------------------------------------------------- relation graph */
/* Dependency-free force-directed layout: entities as deco diamonds, pair
   relations as directed edges, group relations as dashed cliques. Nodes are
   draggable; a plain click jumps to the entity sheet. */

type GraphNs = "char" | "loc" | "thing" | "other";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  ns: GraphNs;
  x: number;
  y: number;
}

interface GraphEdge {
  a: string;
  b: string;
  kind: string;
  state: string;
  directed: boolean;
  group: boolean;
  /** Fan-out index among edges sharing the same unordered pair. */
  lane: number;
  lanes: number;
}

const GRAPH_W = 520;
const GRAPH_H = 360;
/** Hardest zoom-in the camera allows (viewBox width in layout units). */
const GRAPH_MIN_W = 180;
const NODE_CLEAR = 14;
const SVG_NS = "http://www.w3.org/2000/svg";

function nsOf(ref: string): GraphNs {
  if (ref.startsWith("char:")) return "char";
  if (ref.startsWith("loc:")) return "loc";
  if (ref.startsWith("thing:")) return "thing";
  return "other";
}

function buildGraph(
  parsed: ParsedCodex,
  nameOf: (ref: string) => string,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeIds = new Set<string>();
  const raw: Omit<GraphEdge, "lane" | "lanes">[] = [];
  for (const r of parsed.relations) {
    if (!matches(local.query, ...relationSearchText(r, nameOf))) continue;
    const kind = str(r["kind"]);
    const stateText = str(r["state"]);
    if (r["type"] === "group") {
      const members = strArray(r["members"]);
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          raw.push({ a: members[i]!, b: members[j]!, kind, state: stateText, directed: false, group: true });
        }
      }
      members.forEach((m) => nodeIds.add(m));
    } else {
      const a = str(r["a"]);
      const b = str(r["b"]);
      if (!a || !b) continue;
      raw.push({ a, b, kind, state: stateText, directed: true, group: false });
      nodeIds.add(a);
      nodeIds.add(b);
    }
  }
  // Fan out parallel edges (A→B and B→A, or several kinds) into lanes so
  // they curve apart instead of overlapping.
  const laneCounts = new Map<string, number>();
  const pairKey = (a: string, b: string): string => (a < b ? `${a}\0${b}` : `${b}\0${a}`);
  for (const e of raw) laneCounts.set(pairKey(e.a, e.b), (laneCounts.get(pairKey(e.a, e.b)) ?? 0) + 1);
  const laneUsed = new Map<string, number>();
  const edges: GraphEdge[] = raw.map((e) => {
    const key = pairKey(e.a, e.b);
    const lane = laneUsed.get(key) ?? 0;
    laneUsed.set(key, lane + 1);
    return { ...e, lane, lanes: laneCounts.get(key) ?? 1 };
  });
  const nodes: GraphNode[] = [...nodeIds].map((id) => ({
    id,
    name: nameOf(id),
    ns: nsOf(id),
    // NaN lets d3's deterministic phyllotaxis initializer place them.
    x: NaN,
    y: NaN,
  }));
  return { nodes, edges };
}

/** d3-force layout, run to completion synchronously. d3 seeds positions and
 * jiggle from a fixed LCG, so the layout is deterministic for a given codex.
 * Positions stay at natural force scale (labels readable at 1:1), and the
 * camera below frames them instead of shrinking the layout to fit. */
function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): void {
  if (nodes.length === 0) return;
  const ids = new Set(nodes.map((n) => n.id));
  const links: SimulationLinkDatum<GraphNode>[] = edges
    .filter((e) => ids.has(e.a) && ids.has(e.b) && e.a !== e.b)
    .map((e) => ({ source: e.a, target: e.b }));
  const sim = forceSimulation(nodes)
    .force("link", forceLink<GraphNode, SimulationLinkDatum<GraphNode>>(links)
      .id((d) => d.id)
      .distance(85)
      .strength(0.55))
    .force("charge", forceManyBody().strength(-220))
    .force("collide", forceCollide(34))
    .force("x", forceX(GRAPH_W / 2).strength(0.05))
    .force("y", forceY(GRAPH_H / 2).strength(0.09))
    .stop();
  sim.tick(300);
}

function edgePath(a: GraphNode, b: GraphNode, e: GraphEdge): string {
  const ddx = b.x - a.x;
  const ddy = b.y - a.y;
  const d = Math.max(0.15, Math.hypot(ddx, ddy));
  const ux = ddx / d;
  const uy = ddy / d;
  // Perpendicular fan offset for parallel edges.
  const off = (e.lane - (e.lanes - 1) / 2) * 18;
  const mx = (a.x + b.x) / 2 - uy * off;
  const my = (a.y + b.y) / 2 + ux * off;
  // Pull endpoints back so arrowheads clear the diamond.
  const ax = a.x + ux * NODE_CLEAR;
  const ay = a.y + uy * NODE_CLEAR;
  const bx = b.x - ux * (e.directed ? NODE_CLEAR + 3 : NODE_CLEAR);
  const by = b.y - uy * (e.directed ? NODE_CLEAR + 3 : NODE_CLEAR);
  return off === 0
    ? `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`
    : `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function renderRelationGraph(
  host: HTMLElement,
  parsed: ParsedCodex,
  nameOf: (ref: string) => string,
): void {
  const { nodes, edges } = buildGraph(parsed, nameOf);
  if (nodes.length === 0) {
    host.appendChild(textNode(
      local.query ? tr("ui.tabs.codexTab.renderRelationGraph.noRelationMatchesTheSearch") : tr("ui.tabs.codexTab.renderRelationGraph.noRelationsToChartYet"),
      "lmb-empty",
    ));
    return;
  }
  layoutGraph(nodes, edges);
  const byId = new Map(nodes.map((node) => [node.id, node] as const));

  // Label-inclusive bounds of the settled layout, in natural units.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  }
  const PAD = 46;
  const bbox = { x: minX - PAD, y: minY - PAD, w: maxX - minX + PAD * 2, h: maxY - minY + PAD * 2 };

  const svg = svgEl("svg");
  svg.setAttribute("class", "lmb-graph");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");

  /* Camera: the viewBox is a movable window over the layout. Drag the
     background to pan, pinch or scroll or the corner tools to zoom. The
     default framing shows the whole web only while its labels stay
     readable, otherwise it opens on a readable window at the center. */
  let aspect = GRAPH_W / GRAPH_H;
  const cam = { cx: bbox.x + bbox.w / 2, cy: bbox.y + bbox.h / 2, w: Math.max(bbox.w, GRAPH_W) };
  const clampNum = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
  const fitW = (): number => Math.max(bbox.w, bbox.h * aspect);
  const maxW = (): number => fitW() * 1.4 + 160;
  const applyCamera = (): void => {
    const h = cam.w / aspect;
    svg.setAttribute(
      "viewBox",
      `${(cam.cx - cam.w / 2).toFixed(1)} ${(cam.cy - h / 2).toFixed(1)} ${cam.w.toFixed(1)} ${h.toFixed(1)}`,
    );
  };
  const clampCenter = (): void => {
    cam.cx = clampNum(cam.cx, bbox.x - cam.w / 4, bbox.x + bbox.w + cam.w / 4);
    const h = cam.w / aspect;
    cam.cy = clampNum(cam.cy, bbox.y - h / 4, bbox.y + bbox.h + h / 4);
  };
  const zoomAt = (clientX: number, clientY: number, factor: number): void => {
    const p = toSvgPoint(clientX, clientY);
    const newW = clampNum(cam.w / factor, GRAPH_MIN_W, maxW());
    const scale = newW / cam.w;
    cam.cx = p.x + (cam.cx - p.x) * scale;
    cam.cy = p.y + (cam.cy - p.y) * scale;
    cam.w = newW;
    clampCenter();
    applyCamera();
  };
  const fitCamera = (): void => {
    cam.cx = bbox.x + bbox.w / 2;
    cam.cy = bbox.y + bbox.h / 2;
    cam.w = clampNum(fitW(), GRAPH_MIN_W, maxW());
    applyCamera();
  };
  applyCamera();
  requestAnimationFrame(() => {
    if (!svg.isConnected) return;
    const r = svg.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) aspect = r.width / r.height;
    // Readability cap: never open zoomed out past ~1.15 layout units per
    // screen pixel, big webs start on a legible window instead.
    cam.w = clampNum(fitW(), GRAPH_MIN_W, Math.max(r.width * 1.15, 340));
    clampCenter();
    applyCamera();
  });
  // Window resizes bend the element's aspect: keep the viewBox aspect in
  // step or the "slice" fitting starts cropping and skewing the framing.
  const graphRo = new ResizeObserver(() => {
    if (!svg.isConnected) {
      graphRo.disconnect();
      return;
    }
    const r = svg.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) {
      aspect = r.width / r.height;
      clampCenter();
      applyCamera();
    }
  });
  graphRo.observe(svg);

  const defs = svgEl("defs");
  const marker = svgEl("marker");
  marker.setAttribute("id", "lmb-arrow");
  marker.setAttribute("viewBox", "0 0 8 8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto-start-reverse");
  const arrow = svgEl("path");
  arrow.setAttribute("d", "M 0 0.5 L 8 4 L 0 7.5 z");
  arrow.setAttribute("class", "lmb-graph-arrow");
  marker.appendChild(arrow);
  defs.appendChild(marker);
  svg.appendChild(defs);

  const edgeLayer = svgEl("g");
  const nodeLayer = svgEl("g");
  svg.append(edgeLayer, nodeLayer);

  // Tapping an edge prints the relation here - hover tooltips don't exist on
  // touch, and a 1px line is no hit target anyway.
  const detail = document.createElement("div");
  detail.className = "lmb-graph-detail";
  let selectedEdge: SVGGElement | null = null;

  const edgePaths: { visible: SVGPathElement; hit: SVGPathElement; edge: GraphEdge }[] = [];
  for (const e of edges) {
    const a = byId.get(e.a);
    const b = byId.get(e.b);
    if (!a || !b) continue;
    const g = svgEl("g");
    g.setAttribute("class", "lmb-graph-edgeg");
    const path = svgEl("path");
    path.setAttribute("class", `lmb-graph-edge${e.group ? tr("ui.tabs.codexTab.renderRelationGraph.group") : ""}`);
    path.setAttribute("d", edgePath(a, b, e));
    if (e.directed) path.setAttribute("marker-end", "url(#lmb-arrow)");
    const hit = svgEl("path");
    hit.setAttribute("class", "lmb-graph-hit");
    hit.setAttribute("d", edgePath(a, b, e));
    const story = e.group
      ? `${nameOf(e.a)} · ${nameOf(e.b)}${e.kind ? ` [${e.kind}]` : ""}: ${e.state}`
      : `${nameOf(e.a)} → ${nameOf(e.b)}${e.kind ? ` [${e.kind}]` : ""}: ${e.state}`;
    const tip = svgEl("title");
    tip.textContent = story;
    hit.appendChild(tip);
    hit.addEventListener("click", () => {
      selectedEdge?.classList.remove("selected");
      selectedEdge = g;
      g.classList.add("selected");
      detail.replaceChildren();
      const names = document.createElement("b");
      names.textContent = e.group
        ? `${nameOf(e.a)} · ${nameOf(e.b)}`
        : `${nameOf(e.a)} → ${nameOf(e.b)}`;
      detail.append(names, document.createTextNode(`${e.kind ? ` [${e.kind}] ` : " "}${e.state}`));
    });
    g.append(path, hit);
    edgeLayer.appendChild(g);
    edgePaths.push({ visible: path, hit, edge: e });
  }

  const refreshEdgesFor = (id: string): void => {
    for (const { visible, hit, edge } of edgePaths) {
      if (edge.a !== id && edge.b !== id) continue;
      const a = byId.get(edge.a);
      const b = byId.get(edge.b);
      if (!a || !b) continue;
      const d = edgePath(a, b, edge);
      visible.setAttribute("d", d);
      hit.setAttribute("d", d);
    }
  };

  const toSvgPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  };

  for (const node of nodes) {
    const g = svgEl("g");
    g.setAttribute("class", `lmb-graph-node ${node.ns}`);
    g.setAttribute("transform", `translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
    const rect = svgEl("rect");
    rect.setAttribute("x", "-7.5");
    rect.setAttribute("y", "-7.5");
    rect.setAttribute("width", "15");
    rect.setAttribute("height", "15");
    rect.setAttribute("rx", "2");
    rect.setAttribute("transform", "rotate(45)");
    const label = svgEl("text");
    label.setAttribute("y", "22");
    label.setAttribute("text-anchor", "middle");
    label.textContent = node.name.length > 14 ? `${node.name.slice(0, 13)}…` : node.name;
    const tip = svgEl("title");
    tip.textContent = tr("ui.tabs.codexTab.renderRelationGraph.value", { name: node.name, id: node.id });
    g.append(rect, label, tip);

    // Drag to rearrange; a sub-threshold drag counts as a click and opens
    // the entity sheet.
    let dragging = false;
    let moved = 0;
    g.addEventListener("pointerdown", (ev) => {
      dragging = true;
      moved = 0;
      g.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    g.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const p = toSvgPoint(ev.clientX, ev.clientY);
      moved += Math.hypot(p.x - node.x, p.y - node.y);
      node.x = p.x;
      node.y = p.y;
      g.setAttribute("transform", `translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`);
      refreshEdgesFor(node.id);
    });
    g.addEventListener("pointerup", () => {
      const wasClick = moved < 5;
      dragging = false;
      if (wasClick && node.ns !== "other") {
        local.subtab = "entities";
        local.expandedEntity = node.id;
        local.entityDraft = null;
        rerender();
      }
    });
    g.addEventListener("pointercancel", () => { dragging = false; });
    nodeLayer.appendChild(g);
  }

  // Background pan and pinch zoom. Pointer capture starts only after real
  // movement, so plain taps still reach the edges and diamonds underneath.
  const pointers = new Map<number, { x: number; y: number }>();
  const captured = new Set<number>();
  let pinch: { dist: number; w: number } | null = null;
  svg.addEventListener("pointerdown", (e) => {
    if ((e.target as Element | null)?.closest?.(".lmb-graph-node")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.max(8, Math.hypot(a.x - b.x, a.y - b.y)), w: cam.w };
    }
  });
  svg.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (!captured.has(e.pointerId) && Math.hypot(cur.x - prev.x, cur.y - prev.y) > 3) {
      try { svg.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      captured.add(e.pointerId);
    }
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.max(8, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const targetW = clampNum(pinch.w * (pinch.dist / dist), GRAPH_MIN_W, maxW());
      zoomAt(mid.x, mid.y, cam.w / targetW);
      return;
    }
    // Convert both points through the SVG's own transform so a pixel of
    // cursor travel is exactly a pixel of graph travel at any element size.
    // Deriving the scale from the element width alone drifts once a window
    // resize bends the element's aspect away from the viewBox's.
    const p0 = toSvgPoint(prev.x, prev.y);
    const p1 = toSvgPoint(cur.x, cur.y);
    cam.cx -= p1.x - p0.x;
    cam.cy -= p1.y - p0.y;
    clampCenter();
    applyCamera();
  });
  const endPointer = (e: PointerEvent): void => {
    pointers.delete(e.pointerId);
    captured.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
  };
  svg.addEventListener("pointerup", endPointer);
  svg.addEventListener("pointercancel", endPointer);
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0018));
  }, { passive: false });

  const tools = document.createElement("div");
  tools.className = "lmb-graph-tools";
  const viewCenter = (): { x: number; y: number } => {
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  tools.append(
    makeButton("−", () => { const c = viewCenter(); zoomAt(c.x, c.y, 1 / 1.4); }, { small: true, title: tr("ui.tabs.codexTab.renderRelationGraph.zoomOut") }),
    makeButton("+", () => { const c = viewCenter(); zoomAt(c.x, c.y, 1.4); }, { small: true, title: tr("ui.tabs.codexTab.renderRelationGraph.zoomIn") }),
    makeButton(tr("ui.tabs.codexTab.renderRelationGraph.fit"), fitCamera, { small: true, title: tr("ui.tabs.codexTab.renderRelationGraph.frameTheWholeWeb") }),
  );

  const wrap = document.createElement("div");
  wrap.className = "lmb-graph-wrap";
  lessonMark(wrap, "codex.rel.graph");
  wrap.appendChild(svg);
  wrap.appendChild(tools);
  host.appendChild(wrap);
  host.appendChild(detail);

  const legend = document.createElement("div");
  legend.className = "lmb-spine-legend";
  const present = new Set(nodes.map((node) => node.ns));
  const entries: { ns: GraphNs; label: string }[] = [
    { ns: "char", label: tr("ui.tabs.codexTab.entries.character") },
    { ns: "loc", label: tr("ui.tabs.codexTab.entries.location") },
    { ns: "thing", label: tr("ui.tabs.codexTab.entries.thing") },
  ];
  for (const e of entries) {
    if (!present.has(e.ns)) continue;
    const item = document.createElement("span");
    item.className = "lmb-spine-key";
    const swatch = document.createElement("span");
    swatch.className = `lmb-graph-swatch ${e.ns}`;
    item.append(swatch, document.createTextNode(e.label));
    legend.appendChild(item);
  }
  host.appendChild(legend);
  host.appendChild(textNode(
    tr("ui.tabs.codexTab.renderRelationGraph.tapAnEdgeForTheStoryTap"),
    "lmb-help",
  ));
}

/* ------------------------------------------------------------- timeline */

function eventDraftFrom(e: Record<string, unknown> | null, index: number): RecordDraft {
  return {
    kind: "event",
    index,
    ...(e ? { orig: JSON.stringify(e) } : {}),
    saving: false,
    fields: {
      when: str(e?.["when"]),
      event: str(e?.["event"]),
      participants: strArray(e?.["participants"]).join(", "),
      where: str(e?.["where"]),
      causes: str(e?.["causes"]),
    },
  };
}

function saveEventDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const when = (d.fields["when"] ?? "").trim();
  const eventText = (d.fields["event"] ?? "").trim();
  if (!when || !eventText) {
    showToast("warn", tr("ui.tabs.codexTab.saveEventDraft.theEventNeedsAWhenAndWhat"));
    return;
  }
  const participants = splitComma(d.fields["participants"] ?? "");
  const where = (d.fields["where"] ?? "").trim();
  const causes = (d.fields["causes"] ?? "").trim();
  const ev: Record<string, unknown> = { when, event: eventText };
  if (participants.length) ev["participants"] = participants;
  if (where) ev["where"] = where;
  if (causes) ev["causes"] = causes;
  const idx = resolveDraftIndex(parsed.events, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.events[idx]!["rid"]);
    if (rid) ev["rid"] = rid;
  }
  const next = idx >= 0
    ? [...parsed.events.slice(0, idx), ev, ...parsed.events.slice(idx + 1)]
    : [...parsed.events, ev];
  d.saving = true;
  sendCodexWrite("timeline", { events: next }, state, send);
  rerender();
}

const EVENT_SPECS: RecordFieldSpec[] = [
  { key: "when", label: tr("ui.tabs.codexTab.eventSpecs.when"), widget: "input", placeholder: tr("ui.tabs.codexTab.eventSpecs.day12") },
  { key: "event", label: tr("ui.tabs.codexTab.eventSpecs.event"), widget: "textarea", placeholder: tr("ui.tabs.codexTab.eventSpecs.maraSeesEliasKillTheDuke") },
  { key: "participants", label: tr("ui.tabs.codexTab.eventSpecs.participantsCommaSeparatedRefs"), widget: "input", refList: true },
  { key: "where", label: tr("ui.tabs.codexTab.eventSpecs.where"), widget: "input", refList: true, placeholder: tr("ui.tabs.codexTab.eventSpecs.locAshfordManor") },
  { key: "causes", label: tr("ui.tabs.codexTab.eventSpecs.causes"), widget: "input", placeholder: tr("ui.tabs.codexTab.eventSpecs.sheFleesTheCity") },
];

function renderTimeline(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.codexTab.sec.timeline"));
  lessonMark(sec.wrap, "codex.tl");
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);

  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.appendChild(makeButton(tr("ui.tabs.codexTab.renderTimeline.event"), () => {
    local.recordDraft = eventDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  sec.body.appendChild(toolbar);

  const draft = local.recordDraft;
  if (draft?.kind === "event" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm(
      tr("ui.tabs.codexTab.renderTimeline.newEvent"),
      EVENT_SPECS,
      draft,
      refListId,
      () => saveEventDraft(draft, state, send),
    ));
  }

  if (parsed.events.length === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderTimeline.noEventsRecordedYet"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const withIndex = parsed.events.map((e, i) => ({ e, i }));
  const all = withIndex.filter(({ e }) =>
    matches(local.query, str(e["when"]), str(e["event"]), str(e["causes"]), strArray(e["participants"]).map(nameOf)),
  );
  if (all.length === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderTimeline.noEventMatchesTheSearch"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  // A search means "find it": show every hit, not just the recent page.
  const paged = !local.query && !local.showFullTimeline && all.length > TIMELINE_RECENT;
  // Newest first: the question a timeline answers mid-story is "what just
  // happened", so the fresh end leads and "Show earlier" waits at the bottom.
  const shown = (paged ? all.slice(-TIMELINE_RECENT) : all).slice().reverse();
  const rail = document.createElement("div");
  rail.className = "lmb-timeline";
  let prevContext = "";
  for (const { e, i } of shown) {
    // The event under edit is replaced by its form, right where it was.
    if (draft?.kind === "event" && draft.index === i) {
      rail.appendChild(renderRecordForm(
        tr("ui.tabs.codexTab.renderTimeline.editEvent"),
        EVENT_SPECS,
        draft,
        refListId,
        () => saveEventDraft(draft, state, send),
      ));
      prevContext = "";
      continue;
    }
    const expanded = local.expandedEvents.has(i);
    const item = document.createElement("div");
    item.className = `lmb-timeline-item lmb-record-click${expanded ? " expanded" : ""}`;
    item.title = tr("ui.tabs.codexTab.renderTimeline.clickForEditAndDelete");
    const when = document.createElement("div");
    when.className = "lmb-timeline-when";
    when.textContent = str(e["when"]) || "?";
    const eventText = document.createElement("div");
    eventText.className = "lmb-timeline-event";
    eventText.textContent = str(e["event"]);
    item.append(when, eventText);
    const contextBits: string[] = [];
    const participants = strArray(e["participants"]).map(nameOf);
    if (participants.length) contextBits.push(participants.join(", "));
    const where = str(e["where"]);
    if (where) contextBits.push(`@ ${nameOf(where)}`);
    // The same cast in the same place event after event is noise: only
    // render the context line when it changes.
    const context = contextBits.join("  ·  ");
    const detailBits: string[] = [];
    if (context && context !== prevContext) detailBits.push(context);
    prevContext = context;
    const causes = str(e["causes"]);
    if (causes) detailBits.push(`→ ${causes}`);
    if (detailBits.length) {
      item.appendChild(textNode(detailBits.join("  ·  "), "lmb-timeline-detail"));
    }
    item.addEventListener("click", () => {
      if (expanded) local.expandedEvents.delete(i);
      else local.expandedEvents.add(i);
      rerender();
    });
    if (expanded) {
      const actions = recordItemActions(
        () => { local.recordDraft = eventDraftFrom(e, i); rerender(); },
        () => {
          const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.events, i, e) : null;
          if (!next) { staleDraftAbort(); return; }
          sendCodexWrite("timeline", { events: next }, state, send);
        },
        ctx,
        tr("ui.tabs.codexTab.actions.memoriaWillRemoveThisEventFromThe"),
      );
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      item.appendChild(actions);
    }
    rail.appendChild(item);
  }
  sec.body.appendChild(rail);
  if (!local.query && all.length > TIMELINE_RECENT) {
    sec.body.appendChild(makeButton(
      local.showFullTimeline ? tr("ui.tabs.codexTab.renderTimeline.showRecentOnly") : tr("ui.tabs.codexTab.renderTimeline.showEarlier", { lengthTimelineRecent: all.length - TIMELINE_RECENT }),
      () => {
        local.showFullTimeline = !local.showFullTimeline;
        rerender();
      },
      { small: true },
    ));
  }
  host.appendChild(sec.wrap);
}

/* -------------------------------------------------------------- threads */

const THREAD_TONE: Record<string, "ok" | "warn" | "danger" | undefined> = {
  open: "ok",
  stalled: "warn",
  abandoned: "danger",
  resolved: undefined,
};

function threadDraftFrom(t: Record<string, unknown> | null, index: number): RecordDraft {
  return {
    kind: "thread",
    index,
    ...(t ? { orig: JSON.stringify(t) } : {}),
    saving: false,
    fields: {
      name: str(t?.["name"]),
      status: str(t?.["status"]) || "open",
      summary: str(t?.["summary"]),
      latest: str(t?.["latest"]),
      planted: strArray(t?.["planted"]).join("\n"),
    },
  };
}

const THREAD_SPECS: RecordFieldSpec[] = [
  { key: "name", label: tr("ui.tabs.codexTab.threadSpecs.name"), widget: "input", placeholder: tr("ui.tabs.codexTab.threadSpecs.theStolenCrown") },
  { key: "status", label: tr("ui.tabs.codexTab.threadSpecs.status"), widget: "select", options: [
    { value: "open", label: tr("ui.tabs.codexTab.threadSpecs.open") },
    { value: "stalled", label: tr("ui.tabs.codexTab.threadSpecs.stalled") },
    { value: "resolved", label: tr("ui.tabs.codexTab.threadSpecs.resolved") },
    { value: "abandoned", label: tr("ui.tabs.codexTab.threadSpecs.abandoned") },
  ] },
  { key: "summary", label: tr("ui.tabs.codexTab.threadSpecs.summary"), widget: "textarea" },
  { key: "latest", label: tr("ui.tabs.codexTab.threadSpecs.latestDevelopment"), widget: "input" },
  { key: "planted", label: tr("ui.tabs.codexTab.threadSpecs.plantedDetailsOnePerLine"), widget: "lines" },
];

function saveThreadDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const name = (d.fields["name"] ?? "").trim();
  const summary = (d.fields["summary"] ?? "").trim();
  if (!name || !summary) {
    showToast("warn", tr("ui.tabs.codexTab.saveThreadDraft.theThreadNeedsANameAndA"));
    return;
  }
  const t: Record<string, unknown> = { name, status: d.fields["status"] || "open", summary };
  const latest = (d.fields["latest"] ?? "").trim();
  if (latest) t["latest"] = latest;
  const planted = splitLines(d.fields["planted"] ?? "");
  if (planted.length) t["planted"] = planted;
  const idx = resolveDraftIndex(parsed.threads, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.threads[idx]!["rid"]);
    if (rid) t["rid"] = rid;
  }
  const next = idx >= 0
    ? [...parsed.threads.slice(0, idx), t, ...parsed.threads.slice(idx + 1)]
    : [...parsed.threads, t];
  d.saving = true;
  sendCodexWrite("threads", { threads: next, seeds: parsed.seeds }, state, send);
  rerender();
}

function renderThreads(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.codexTab.sec.threads"));
  lessonMark(sec.wrap, "codex.th");

  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.append(
    makeButton(tr("ui.tabs.codexTab.renderThreads.thread"), () => {
      local.recordDraft = threadDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }),
    makeButton(tr("ui.tabs.codexTab.renderThreads.editSeeds"), () => {
      local.recordDraft = { kind: "seeds", index: -1, saving: false, fields: { seeds: parsed.seeds.join("\n") } };
      rerender();
    }, { small: true }),
  );
  sec.body.appendChild(toolbar);

  const draft = local.recordDraft;
  if (draft?.kind === "thread" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm(
      tr("ui.tabs.codexTab.renderThreads.newThread"),
      THREAD_SPECS,
      draft,
      null,
      () => saveThreadDraft(draft, state, send),
    ));
  } else if (draft?.kind === "seeds") {
    sec.body.appendChild(renderRecordForm(
      tr("ui.tabs.codexTab.renderThreads.editSeeds"),
      [{ key: "seeds", label: tr("ui.tabs.codexTab.renderThreads.seedsOnePerLine"), widget: "lines" }],
      draft,
      null,
      () => {
        draft.saving = true;
        sendCodexWrite("threads", { threads: parsed.threads, seeds: splitLines(draft.fields["seeds"] ?? "") }, state, send);
        rerender();
      },
    ));
  }

  if (parsed.threads.length === 0 && parsed.seeds.length === 0) {
    sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderThreads.noOpenStorylinesTrackedYet"), "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  if (parsed.threads.some((t) => str(t["status"]) === "resolved")) {
    sec.body.appendChild(textNode(
      tr("ui.tabs.codexTab.renderThreads.resolvedThreadsStayHereAsYourArchive"),
      "lmb-help",
    ));
  }
  const list = document.createElement("div");
  list.className = "lmb-thread-list";
  let shown = 0;
  parsed.threads.forEach((t, i) => {
    if (!matches(local.query, str(t["name"]), str(t["summary"]), str(t["latest"]), strArray(t["planted"]))) return;
    shown++;
    // The thread under edit is replaced by its form, right where it was.
    if (draft?.kind === "thread" && draft.index === i) {
      list.appendChild(renderRecordForm(
        tr("ui.tabs.codexTab.renderThreads.editThread"),
        THREAD_SPECS,
        draft,
        null,
        () => saveThreadDraft(draft, state, send),
      ));
      return;
    }
    const name = str(t["name"]);
    const row = document.createElement("div");
    row.className = "lmb-thread";
    const head = document.createElement("button");
    head.type = "button";
    head.className = "lmb-thread-head";
    const status = str(t["status"]) || "open";
    head.append(pill(tr("ui.tabs.codexTab.threadStatus", { status }), THREAD_TONE[status]));
    const title = document.createElement("span");
    title.className = "lmb-thread-name";
    title.textContent = name || "?";
    head.appendChild(title);
    const chevron = document.createElement("span");
    chevron.className = `lmb-chevron${local.expandedThreads.has(name) ? " open" : ""}`;
    head.appendChild(chevron);
    head.addEventListener("click", () => {
      if (local.expandedThreads.has(name)) local.expandedThreads.delete(name);
      else local.expandedThreads.add(name);
      rerender();
    });
    row.appendChild(head);
    row.appendChild(textNode(str(t["summary"]), "lmb-thread-summary"));
    if (local.expandedThreads.has(name)) {
      const latest = str(t["latest"]);
      if (latest) row.appendChild(textNode(tr("ui.tabs.codexTab.renderThreads.latest", { latest: latest }), "lmb-thread-detail"));
      for (const p of strArray(t["planted"])) {
        row.appendChild(textNode(tr("ui.tabs.codexTab.renderThreads.planted", { p: p }), "lmb-thread-detail"));
      }
      row.appendChild(recordItemActions(
        () => { local.recordDraft = threadDraftFrom(t, i); rerender(); },
        () => {
          const cur = cache.parsed;
          const next = cur ? spliceOutIfCurrent(cur.threads, i, t) : null;
          if (!cur || !next) { staleDraftAbort(); return; }
          sendCodexWrite("threads", { threads: next, seeds: cur.seeds }, state, send);
        },
        ctx,
        tr("ui.tabs.codexTab.renderThreads.memoriaWillRemoveThisThreadFromThe"),
      ));
    }
    list.appendChild(row);
  });
  if (shown > 0) sec.body.appendChild(list);
  else if (parsed.threads.length > 0) sec.body.appendChild(textNode(tr("ui.tabs.codexTab.renderThreads.noThreadMatchesTheSearch"), "lmb-empty"));

  const seeds = parsed.seeds.filter((s) => matches(local.query, s));
  if (seeds.length) {
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = tr("ui.tabs.codexTab.renderThreads.seeds", { length: parsed.seeds.length });
    sec.body.appendChild(sub);
    for (const s of seeds) {
      sec.body.appendChild(textNode(`◆ ${s}`, "lmb-thread-detail"));
    }
  }
  host.appendChild(sec.wrap);
}

/* ----------------------------------------------------------------- lore */

function worldDraftFrom(w: Record<string, unknown> | null, index: number): RecordDraft {
  return {
    kind: "world",
    index,
    ...(w ? { orig: JSON.stringify(w) } : {}),
    saving: false,
    fields: {
      topic: str(w?.["topic"]),
      facts: strArray(w?.["facts"]).join("\n"),
      keywords: strArray(w?.["keywords"]).join(", "),
    },
  };
}

function knowledgeDraftFrom(k: Record<string, unknown> | null, index: number): RecordDraft {
  const beliefs = objArray(k?.["falseBeliefs"])
    .map((b) => `${str(b["who"])} => ${str(b["believes"])}`)
    .join("\n");
  return {
    kind: "knowledge",
    index,
    ...(k ? { orig: JSON.stringify(k) } : {}),
    saving: false,
    fields: {
      fact: str(k?.["fact"]),
      knownBy: strArray(k?.["knownBy"]).join(", "),
      hiddenFrom: strArray(k?.["hiddenFrom"]).join(", "),
      falseBeliefs: beliefs,
      note: str(k?.["note"]),
      keywords: strArray(k?.["keywords"]).join(", "),
    },
  };
}

function saveWorldDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const topic = (d.fields["topic"] ?? "").trim();
  const facts = splitLines(d.fields["facts"] ?? "");
  if (!topic || facts.length === 0) {
    showToast("warn", tr("ui.tabs.codexTab.saveWorldDraft.theTopicNeedsANameAndAt"));
    return;
  }
  const entry: Record<string, unknown> = { topic, facts };
  const keywords = splitComma(d.fields["keywords"] ?? "");
  if (keywords.length) entry["keywords"] = keywords;
  const idx = resolveDraftIndex(parsed.world, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.world[idx]!["rid"]);
    if (rid) entry["rid"] = rid;
  }
  const next = idx >= 0
    ? [...parsed.world.slice(0, idx), entry, ...parsed.world.slice(idx + 1)]
    : [...parsed.world, entry];
  d.saving = true;
  sendCodexWrite("world", { entries: next }, state, send);
  rerender();
}

function saveKnowledgeDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const fact = (d.fields["fact"] ?? "").trim();
  if (!fact) {
    showToast("warn", tr("ui.tabs.codexTab.saveKnowledgeDraft.theSecretNeedsItsFact"));
    return;
  }
  const item: Record<string, unknown> = { fact };
  const knownBy = splitComma(d.fields["knownBy"] ?? "");
  if (knownBy.length) item["knownBy"] = knownBy;
  const hiddenFrom = splitComma(d.fields["hiddenFrom"] ?? "");
  if (hiddenFrom.length) item["hiddenFrom"] = hiddenFrom;
  const falseBeliefs = splitLines(d.fields["falseBeliefs"] ?? "")
    .map((line) => {
      const at = line.indexOf("=>");
      if (at === -1) return null;
      const who = line.slice(0, at).trim();
      const believes = line.slice(at + 2).trim();
      return who && believes ? { who, believes } : null;
    })
    .filter((x): x is { who: string; believes: string } => !!x);
  if (falseBeliefs.length) item["falseBeliefs"] = falseBeliefs;
  const note = (d.fields["note"] ?? "").trim();
  if (note) item["note"] = note;
  const kws = splitComma(d.fields["keywords"] ?? "");
  if (kws.length) item["keywords"] = kws;
  const idx = resolveDraftIndex(parsed.knowledge, d);
  if (d.index >= 0 && idx === -1) {
    staleDraftAbort();
    return;
  }
  if (idx >= 0) {
    const rid = str(parsed.knowledge[idx]!["rid"]);
    if (rid) item["rid"] = rid;
  }
  const next = idx >= 0
    ? [...parsed.knowledge.slice(0, idx), item, ...parsed.knowledge.slice(idx + 1)]
    : [...parsed.knowledge, item];
  d.saving = true;
  sendCodexWrite("knowledge", { items: next }, state, send);
  rerender();
}

const WORLD_SPECS: RecordFieldSpec[] = [
  { key: "topic", label: tr("ui.tabs.codexTab.worldSpecs.topic"), widget: "input", placeholder: tr("ui.tabs.codexTab.worldSpecs.magic") },
  { key: "facts", label: tr("ui.tabs.codexTab.worldSpecs.factsOnePerLine"), widget: "lines", placeholder: tr("ui.tabs.codexTab.worldSpecs.bloodMagicCostsMemories") },
  { key: "keywords", label: tr("ui.tabs.codexTab.worldSpecs.keywordsCommaSeparatedRetrievalTags"), widget: "input", placeholder: tr("ui.tabs.codexTab.worldSpecs.ritualMemoriesBloodMagic") },
];

const KNOWLEDGE_SPECS: RecordFieldSpec[] = [
  { key: "fact", label: tr("ui.tabs.codexTab.knowledgeSpecs.fact"), widget: "textarea", placeholder: tr("ui.tabs.codexTab.knowledgeSpecs.eliasKilledTheDuke") },
  { key: "knownBy", label: tr("ui.tabs.codexTab.knowledgeSpecs.knownByCommaSeparatedRefs"), widget: "input", refList: true },
  { key: "hiddenFrom", label: tr("ui.tabs.codexTab.knowledgeSpecs.hiddenFromCommaSeparatedRefs"), widget: "input", refList: true },
  { key: "falseBeliefs", label: tr("ui.tabs.codexTab.knowledgeSpecs.falseBeliefsOnePerLineWhoBelief"), widget: "lines", placeholder: tr("ui.tabs.codexTab.knowledgeSpecs.charCaptainBanditsDidIt") },
  { key: "note", label: tr("ui.tabs.codexTab.knowledgeSpecs.note"), widget: "input" },
  { key: "keywords", label: tr("ui.tabs.codexTab.knowledgeSpecs.keywordsCommaSeparatedRetrievalTags"), widget: "input", placeholder: tr("ui.tabs.codexTab.knowledgeSpecs.murderDaggerDuke") },
];

function renderLore(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const draft = local.recordDraft;

  const world = section(tr("ui.tabs.codexTab.world.worldRules"));
  lessonMark(world.wrap, "codex.lore");
  const worldBar = document.createElement("div");
  worldBar.className = "lmb-actions";
  worldBar.appendChild(makeButton(tr("ui.tabs.codexTab.renderLore.topic"), () => {
    local.recordDraft = worldDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  world.body.appendChild(worldBar);
  if (draft?.kind === "world" && draft.index === -1) {
    world.body.appendChild(renderRecordForm(
      tr("ui.tabs.codexTab.renderLore.newTopic"),
      WORLD_SPECS,
      draft,
      null,
      () => saveWorldDraft(draft, state, send),
    ));
  }
  const worldShown = parsed.world
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => matches(local.query, str(w["topic"]), strArray(w["facts"]), strArray(w["keywords"])));
  if (parsed.world.length === 0) {
    world.body.appendChild(textNode(tr("ui.tabs.codexTab.renderLore.noWorldLoreRecordedYet"), "lmb-empty"));
  } else if (worldShown.length === 0) {
    world.body.appendChild(textNode(tr("ui.tabs.codexTab.renderLore.noTopicMatchesTheSearch"), "lmb-empty"));
  }
  for (const { w, i } of worldShown) {
    // The topic under edit is replaced by its form, right where it was.
    if (draft?.kind === "world" && draft.index === i) {
      world.body.appendChild(renderRecordForm(
        tr("ui.tabs.codexTab.renderLore.editTopic"),
        WORLD_SPECS,
        draft,
        null,
        () => saveWorldDraft(draft, state, send),
      ));
      continue;
    }
    const expanded = local.expandedWorld.has(i);
    const block = document.createElement("div");
    block.className = "lmb-lore-topic lmb-record-click";
    block.title = tr("ui.tabs.codexTab.renderLore.clickForEditAndDelete");
    const t = document.createElement("div");
    t.className = "lmb-lore-title";
    t.textContent = str(w["topic"]) || "?";
    block.appendChild(t);
    const ul = document.createElement("ul");
    ul.className = "lmb-lore-facts";
    for (const f of strArray(w["facts"])) {
      const li = document.createElement("li");
      li.textContent = f;
      ul.appendChild(li);
    }
    block.appendChild(ul);
    block.addEventListener("click", () => {
      if (expanded) local.expandedWorld.delete(i);
      else local.expandedWorld.add(i);
      rerender();
    });
    if (expanded) {
      const kws = strArray(w["keywords"]);
      if (kws.length) block.appendChild(textNode(tr("ui.tabs.codexTab.renderLore.keywords", { join: kws.join(" · ") }), "lmb-thread-detail"));
      const actions = recordItemActions(
        () => { local.recordDraft = worldDraftFrom(w, i); rerender(); },
        () => {
          const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.world, i, w) : null;
          if (!next) { staleDraftAbort(); return; }
          sendCodexWrite("world", { entries: next }, state, send);
        },
        ctx,
        tr("ui.tabs.codexTab.actions.memoriaWillRemoveThisTopicAndIts"),
      );
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    world.body.appendChild(block);
  }
  host.appendChild(world.wrap);
}

function renderSecrets(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const draft = local.recordDraft;

  const secrets = section(tr("ui.tabs.codexTab.secrets.whoKnowsWhat"));
  lessonMark(secrets.wrap, "codex.secrets");
  const secretBar = document.createElement("div");
  secretBar.className = "lmb-actions";
  secretBar.appendChild(makeButton(tr("ui.tabs.codexTab.renderSecrets.secret"), () => {
    local.recordDraft = knowledgeDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  secrets.body.appendChild(secretBar);
  if (draft?.kind === "knowledge" && draft.index === -1) {
    secrets.body.appendChild(renderRecordForm(
      tr("ui.tabs.codexTab.renderSecrets.newSecret"),
      KNOWLEDGE_SPECS,
      draft,
      refListId,
      () => saveKnowledgeDraft(draft, state, send),
    ));
  }
  const knowledgeShown = parsed.knowledge
    .map((k, i) => ({ k, i }))
    .filter(({ k }) => matches(
      local.query,
      str(k["fact"]),
      str(k["note"]),
      strArray(k["knownBy"]).map(nameOf),
      strArray(k["hiddenFrom"]).map(nameOf),
      objArray(k["falseBeliefs"]).map((b) => str(b["believes"])),
      objArray(k["falseBeliefs"]).map((b) => nameOf(str(b["who"]))),
      strArray(k["keywords"]),
    ));
  if (parsed.knowledge.length === 0) {
    secrets.body.appendChild(textNode(tr("ui.tabs.codexTab.renderSecrets.noSecretsOrAsymmetricKnowledgeTrackedYet"), "lmb-empty"));
  } else if (knowledgeShown.length === 0) {
    secrets.body.appendChild(textNode(tr("ui.tabs.codexTab.renderSecrets.noSecretMatchesTheSearch"), "lmb-empty"));
  }
  for (const { k, i } of knowledgeShown) {
    // The secret under edit is replaced by its form, right where it was.
    if (draft?.kind === "knowledge" && draft.index === i) {
      secrets.body.appendChild(renderRecordForm(
        tr("ui.tabs.codexTab.renderSecrets.editSecret"),
        KNOWLEDGE_SPECS,
        draft,
        refListId,
        () => saveKnowledgeDraft(draft, state, send),
      ));
      continue;
    }
    const expanded = local.expandedSecrets.has(i);
    const block = document.createElement("div");
    block.className = "lmb-secret lmb-record-click";
    block.title = tr("ui.tabs.codexTab.renderSecrets.clickForEditAndDelete");
    block.appendChild(textNode(str(k["fact"]), "lmb-secret-fact"));
    const chips = document.createElement("div");
    chips.className = "lmb-actions";
    for (const who of strArray(k["knownBy"])) chips.appendChild(pill(tr("ui.tabs.codexTab.renderSecrets.knows", { nameOf: nameOf(who) }), "ok"));
    for (const who of strArray(k["hiddenFrom"])) chips.appendChild(pill(tr("ui.tabs.codexTab.renderSecrets.hidden", { nameOf: nameOf(who) }), "warn"));
    if (chips.childElementCount) block.appendChild(chips);
    for (const b of objArray(k["falseBeliefs"])) {
      block.appendChild(textNode(tr("ui.tabs.codexTab.renderSecrets.wronglyBelieves", { nameOf: nameOf(str(b["who"])), str: str(b["believes"]) }), "lmb-thread-detail"));
    }
    const note = str(k["note"]);
    if (note) block.appendChild(textNode(note, "lmb-thread-detail"));
    block.addEventListener("click", () => {
      if (expanded) local.expandedSecrets.delete(i);
      else local.expandedSecrets.add(i);
      rerender();
    });
    if (expanded) {
      const kws = strArray(k["keywords"]);
      if (kws.length) block.appendChild(textNode(tr("ui.tabs.codexTab.renderSecrets.keywords", { join: kws.join(" · ") }), "lmb-thread-detail"));
      const actions = recordItemActions(
        () => { local.recordDraft = knowledgeDraftFrom(k, i); rerender(); },
        () => {
          const next = cache.parsed ? spliceOutIfCurrent(cache.parsed.knowledge, i, k) : null;
          if (!next) { staleDraftAbort(); return; }
          sendCodexWrite("knowledge", { items: next }, state, send);
        },
        ctx,
        tr("ui.tabs.codexTab.actions.memoriaWillRemoveThisSecretFromThe"),
      );
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    secrets.body.appendChild(block);
  }
  host.appendChild(secrets.wrap);
}

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
import { CODEX_FILE_KEYS, type CodexFileKey } from "../../shared";
import {
  formatTokens,
  makeButton,
  makeSubtabs,
  pill,
  preserveScroll,
  relativeTime,
  scrollPaneTop,
  searchField,
  section,
  select,
  textArea,
  textInput,
  textNode,
} from "../components";
import { confirmDelete } from "../modals";

type CodexSubtab = "overview" | "entities" | "relations" | "timeline" | "threads" | "lore";

const SUBTABS: { key: CodexSubtab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "entities", label: "Entities" },
  { key: "relations", label: "Relations" },
  { key: "timeline", label: "Timeline" },
  { key: "threads", label: "Threads" },
  { key: "lore", label: "Lore" },
];

/* ------------------------------------------------------- tolerant parsing */
/* The viewer renders whatever is on disk without judging it - files were
   validated on save, and a half-broken hand edit should still display. */

type EntityGroup = "characters" | "locations" | "things";

const ENTITY_GROUPS: { key: EntityGroup; title: string; singular: string; ns: string }[] = [
  { key: "characters", title: "Characters", singular: "character", ns: "char" },
  { key: "locations", title: "Locations", singular: "location", ns: "loc" },
  { key: "things", title: "Things", singular: "thing", ns: "thing" },
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
}

const cache: CodexTabCache = { chatId: null, files: null, parsed: null, pending: false };

interface EntityDraft {
  group: EntityGroup;
  /** Entity id being edited; also used for entities not yet acked. */
  id: string;
  fields: Record<string, string>;
  saving: boolean;
}

type RecordKind = "relation" | "event" | "thread" | "seeds" | "world" | "knowledge";

interface RecordDraft {
  kind: RecordKind;
  /** Index in the file's array, -1 for a new record ("seeds" edits the whole list). */
  index: number;
  fields: Record<string, string>;
  saving: boolean;
}

const local = {
  subtab: "overview" as CodexSubtab,
  query: "",
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
};

function clearExpansions(): void {
  local.expandedRelations.clear();
  local.expandedEvents.clear();
  local.expandedWorld.clear();
  local.expandedSecrets.clear();
  local.expandedThreads.clear();
}

/** One save nonce namespace for every editor, so acks can never be
 * attributed to the wrong writer. */
let globalSaveSeq = 0;
let pendingCodexSave: { file: string; seq: number } | null = null;

const TIMELINE_RECENT = 12;

/** True when a finished codex run for this chat should trigger a re-read. */
export function codexWantsRefresh(chatId: string): boolean {
  return cache.chatId === chatId;
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
  savedFile?: string,
  savedSeq?: number,
): void {
  if (cache.chatId === chatId) {
    cache.files = files;
    cache.parsed = parseCodexFiles(files);
    cache.pending = false;
  }
  // Editor ack: the save landed, close whichever form was in flight. An
  // unsolicited refresh (agent run finished) carries no seq and leaves
  // drafts open.
  if (
    pendingCodexSave
    && savedFile === pendingCodexSave.file
    && savedSeq === pendingCodexSave.seq
  ) {
    pendingCodexSave = null;
    local.entityDraft = null;
    local.recordDraft = null;
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
  pendingCodexSave = { file, seq };
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
    if (pendingCodexSave?.seq !== seq) return;
    pendingCodexSave = null;
    let touched = false;
    if (local.entityDraft?.saving) { local.entityDraft.saving = false; touched = true; }
    if (local.recordDraft?.saving) { local.recordDraft.saving = false; touched = true; }
    if (touched) rerender();
  }, 15000);
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
  const chatId = state.activeChatId;
  if (!chatId) {
    const empty = section("Knowledge Codex");
    empty.body.appendChild(textNode("Open a chat to consult the codex", "lmb-empty"));
    host.appendChild(empty.wrap);
    return;
  }

  if (cache.chatId !== chatId) {
    cache.chatId = chatId;
    cache.files = null;
    cache.parsed = null;
    cache.pending = false;
    local.query = "";
    local.expandedEntity = null;
    local.entityDraft = null;
    local.recordDraft = null;
    local.addFormGroup = null;
    local.addFormName = "";
    clearExpansions();
    local.showFullTimeline = false;
    pendingCodexSave = null;
  }
  // A reset wiped the files behind our back: drop the stale view.
  if (!state.codexExists && cache.files) {
    cache.files = null;
    cache.parsed = null;
  }
  if (state.codexExists && !cache.files && !cache.pending) {
    cache.pending = true;
    send({ type: "codex_read", chatId });
  }

  host.appendChild(makeSubtabs(SUBTABS, local.subtab, (key) => {
    local.subtab = key;
    // "Search this section" means this section: a filter silently carrying
    // into the next pane looks like lost data.
    local.query = "";
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

  // Content panes need files.
  if (!state.codexExists) {
    const sec = section("Knowledge Codex");
    sec.body.appendChild(textNode(
      state.activeProfile.codexEnabled
        ? "No codex yet. Memoria starts writing once enough messages pile up, or use Update now in Overview."
        : "The codex is off. Enable it in Tuning to start tracking entities, relations, and threads.",
      "lmb-empty",
    ));
    host.appendChild(sec.wrap);
    return;
  }
  if (!parsed) {
    const sec = section("Knowledge Codex");
    sec.body.appendChild(textNode("Memoria is fetching the codex files...", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }

  // Search filters the current pane; typing only rebuilds the pane container
  // below so the input keeps focus.
  const search = searchField({
    value: local.query,
    placeholder: "Search this section...",
    onChange: (v) => {
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

const BIBLE_TILES: { id: string; label: string; files: CodexFileKey[] }[] = [
  { id: "characters", label: "Characters", files: ["characters"] },
  { id: "places", label: "Places · Things", files: ["locations", "things"] },
  { id: "relations", label: "Relations", files: ["relations"] },
  { id: "events", label: "Events", files: ["timeline"] },
  { id: "threads", label: "Threads", files: ["threads"] },
  { id: "lore", label: "Lore", files: ["world", "knowledge"] },
];

type FileState = "on" | "noInject" | "frozen";

function tileCount(parsed: ParsedCodex, id: string): number {
  switch (id) {
    case "characters": return parsed.characters.length;
    case "places": return parsed.locations.length + parsed.things.length;
    case "relations": return parsed.relations.length;
    case "events": return parsed.events.length;
    case "threads": return parsed.threads.length;
    case "lore": return parsed.world.length + parsed.knowledge.length;
    default: return 0;
  }
}

function tileState(state: FrontendState, files: CodexFileKey[]): FileState {
  const s = state.codexFileStates?.[files[0]!];
  return s === "noInject" || s === "frozen" ? s : "on";
}

const TILE_STATE_LABEL: Record<FileState, string> = {
  on: "injected · updated",
  noInject: "not injected · still updated",
  frozen: "frozen · no updates",
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
  const sec = section("Story Bible");

  const bits: string[] = [];
  bits.push(state.codexExists ? "codex on file" : "no codex yet");
  bits.push(`${state.codexBacklog} message${state.codexBacklog === 1 ? "" : "s"} unindexed`);
  if (state.codexLastRunAt) bits.push(`updated ${relativeTime(state.codexLastRunAt)}`);
  sec.body.appendChild(textNode(bits.join(" · "), "lmb-help"));

  if (!profile.codexEnabled) {
    sec.body.appendChild(textNode("The codex agent is off for this profile. Enable it in Tuning → Codex.", "lmb-empty"));
  }

  const busy = state.busy.some((b) => b.kind === "codex" && b.chatId === chatId);
  if (busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    row.append(dot, document.createTextNode("Memoria is working on the codex, watch Home for progress"));
    sec.body.appendChild(row);
  }

  if (parsed) {
    if (parsed.broken.length > 0) {
      sec.body.appendChild(textNode(
        `Unreadable on disk: ${parsed.broken.join(", ")} - Rebuild codex regenerates them from the story`,
        "lmb-help",
      ));
    }
    const tiles = document.createElement("div");
    tiles.className = "lmb-tiles";
    for (const def of BIBLE_TILES) {
      tiles.appendChild(renderBibleTile(def, parsed, state, ctx, send, busy));
    }
    sec.body.appendChild(tiles);
    sec.body.appendChild(textNode(
      "Click a record card to cycle it: injected → kept out of the prompt → frozen. Records stay editable in their sections either way.",
      "lmb-help",
    ));
  }

  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(
    makeButton("Update now", () => send({ type: "codex_update_now", chatId }), {
      primary: true,
      disabled: busy || !state.settings.enabled || !profile.codexEnabled,
      title: "Consume everything up to the newest message now, ignoring lag and window",
    }),
    busy
      ? makeButton("Cancel", () => send({ type: "abort_busy", chatId, kind: "codex" }), {
          danger: true,
          title: "Abort the codex task in flight",
        })
      : makeButton("Tidy up", () => send({ type: "codex_tidy", chatId }), {
          disabled: !state.settings.enabled || !profile.codexEnabled || !state.codexExists,
          title: "One LLM pass that rewrites every record to be leaner without losing plot-relevant information",
        }),
    makeButton("Rebuild codex", async () => {
      const ok = await confirmDelete(ctx, "Rebuild the codex?", "Memoria will erase the story bible and re-read the whole chat from message one. Costs one full backfill of agent runs.");
      if (ok) send({ type: "codex_rebuild", chatId });
    }, {
      disabled: busy || !state.settings.enabled || !profile.codexEnabled,
      title: "Wipe and regenerate the whole story bible from the start of the chat",
    }),
    makeButton("Wipe codex", async () => {
      const ok = await confirmDelete(ctx, "Wipe the codex?", "Memoria will erase every codex record for this chat and start blank on the next update. This cannot be undone.");
      if (ok) send({ type: "codex_reset", chatId });
    }, { danger: true, disabled: busy }),
  );
  sec.body.appendChild(row);
  host.appendChild(sec.wrap);
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
  const st = tileState(state, def.files);
  const stale = def.files.some((f) => state.codexStaleFiles?.includes(f));
  // Rendered-injection pricing from the backend; raw JSON length (with its
  // syntax overhead) only as a version-skew fallback.
  const tokens = state.codexFileTokens
    ? def.files.reduce((acc, f) => acc + (state.codexFileTokens[f] ?? 0), 0)
    : def.files.reduce((acc, f) => acc + Math.ceil((cache.files?.[f]?.length ?? 0) / 4), 0);

  const tile = document.createElement("div");
  tile.className = `lmb-tile lmb-bible-tile ${st}${stale ? " stale" : ""}`;
  tile.title = `${TILE_STATE_LABEL[st]}${stale ? " · missed updates while frozen" : ""} - click to cycle`;

  const v = document.createElement("div");
  v.className = "lmb-tile-value";
  v.textContent = String(tileCount(parsed, def.id));
  const l = document.createElement("div");
  l.className = "lmb-tile-label";
  l.textContent = def.label;
  const s = document.createElement("div");
  s.className = "lmb-tile-sub";
  s.textContent = `~${formatTokens(tokens)} tokens`;
  const stateLine = document.createElement("div");
  stateLine.className = "lmb-tile-state";
  stateLine.textContent = `${TILE_STATE_LABEL[st]}${stale ? " · stale" : ""}`;
  tile.append(v, l, s, stateLine);

  const tools = document.createElement("div");
  tools.className = "lmb-tile-tools";
  const tidyBtn = makeButton(busy ? "Cancel" : "Tidy", () => {
    if (busy) send({ type: "abort_busy", chatId, kind: "codex" });
    else send({ type: "codex_tidy", chatId, files: def.files });
  }, {
    small: true,
    disabled: !busy && (st === "frozen" || !state.settings.enabled || !state.activeProfile.codexEnabled),
    title: busy ? "Abort the codex task in flight" : "Compress just this record with one LLM pass",
  });
  tidyBtn.addEventListener("click", (e) => e.stopPropagation());
  tools.appendChild(tidyBtn);
  tile.appendChild(tools);

  tile.addEventListener("click", () => {
    void cycleTileState(def, st, stale, state, ctx, send);
  });
  return tile;
}

async function cycleTileState(
  def: { files: CodexFileKey[] },
  st: FileState,
  stale: boolean,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): Promise<void> {
  const chatId = state.activeChatId!;
  const setAll = (next: FileState): void => {
    for (const f of def.files) send({ type: "codex_set_file_state", chatId, file: f, state: next });
  };
  if (st === "on") {
    setAll("noInject");
    return;
  }
  if (st === "noInject") {
    setAll("frozen");
    return;
  }
  // frozen -> on. A frozen record that missed runs is out of date: offer a
  // rebuild, or just switch it back on as-is.
  if (stale) {
    let rebuild = false;
    try {
      const r = await ctx.ui.showConfirm({
        title: "This record is out of date",
        message: "Memoria kept updating the story while this record was frozen, so it may be missing recent events. Rebuild the codex from the start of the chat, or just re-enable it as-is?",
        variant: "warning",
        confirmLabel: "Rebuild",
        cancelLabel: "Re-enable as-is",
      });
      rebuild = !!r.confirmed;
    } catch {
      rebuild = window.confirm("This record missed updates while frozen. Rebuild the codex from the start? (Cancel re-enables it as-is)");
    }
    setAll("on");
    if (rebuild) send({ type: "codex_rebuild", chatId });
    return;
  }
  setAll("on");
}

/* ------------------------------------------------------------- entities */

const ENTITY_TEXT_FIELDS = ["kind", "role", "status", "significance"] as const;
const ENTITY_LONG_FIELDS = ["appearance", "description", "notes"] as const;
const ENTITY_LIST_FIELDS = ["aliases", "traits", "goals", "ties"] as const;
const ENTITY_KNOWN = new Set<string>(["id", "name", ...ENTITY_TEXT_FIELDS, ...ENTITY_LONG_FIELDS, ...ENTITY_LIST_FIELDS]);

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
  const sec = section("Entities");
  sec.body.appendChild(textNode(
    "Click a name to open its sheet. Edits are validated and saved to the codex, Memoria builds on them from her next pass.",
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
    sub.textContent = searching ? `${g.title} · ${list.length} of ${all.length}` : `${g.title} (${all.length})`;
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
      addChip.textContent = `+ ${g.singular}`;
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
  if (!any) sec.body.appendChild(textNode("No entities recorded yet, add one or let Memoria find them", "lmb-empty"));
  host.appendChild(sec.wrap);
}

function renderAddForm(
  group: EntityGroup,
  ns: string,
  parsed: ParsedCodex,
): HTMLElement {
  const row = document.createElement("div");
  row.className = "lmb-add-form";
  const input = textInput({
    value: local.addFormName,
    placeholder: "Name...",
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
    makeButton("Create", submit, { primary: true, small: true }),
    makeButton("Cancel", () => {
      local.addFormGroup = null;
      local.addFormName = "";
      rerender();
    }, { small: true }),
  );
  return row;
}

function makeDraft(group: EntityGroup, e: Record<string, unknown>): EntityDraft {
  const fields: Record<string, string> = { name: str(e["name"]) };
  for (const f of ENTITY_TEXT_FIELDS) fields[f] = str(e[f]);
  for (const f of ENTITY_LONG_FIELDS) fields[f] = str(e[f]);
  for (const f of ENTITY_LIST_FIELDS) fields[f] = strArray(e[f]).join(", ");
  return { group, id: str(e["id"]), fields, saving: false };
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
  card.appendChild(name);

  const kv = document.createElement("div");
  kv.className = "lmb-kv";
  const addKv = (label: string, value: string): void => {
    if (!value) return;
    const k = document.createElement("div");
    k.className = "lmb-kv-key";
    k.textContent = label;
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
    else if (typeof v === "number") addKv(k, String(v));
    else if (Array.isArray(v)) addKv(k, strArray(v).join(" · "));
  }
  card.appendChild(kv);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  actions.append(
    makeButton("Edit sheet", () => {
      local.entityDraft = makeDraft(group, e);
      rerender();
    }, { primary: true, small: true }),
    makeButton("Delete", async () => {
      const ok = await confirmDelete(ctx, "Delete entity?", `Memoria will remove "${str(e["name"])}" from the codex. References to it elsewhere become plain text.`);
      if (!ok) return;
      const next = parsed[group].filter((x) => str(x["id"]) !== id);
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
  const name = document.createElement("div");
  name.className = "lmb-entity-name";
  name.textContent = draft.fields["name"] || "New entity";
  const idEl = document.createElement("span");
  idEl.className = "lmb-entity-id";
  idEl.textContent = draft.id;
  name.appendChild(idEl);
  card.appendChild(name);

  const bind = (key: string, el: HTMLInputElement | HTMLTextAreaElement): void => {
    el.addEventListener("input", () => { draft.fields[key] = el.value; });
  };

  const form = document.createElement("div");
  form.className = "lmb-entity-form";

  const nameField = fieldWrap("Name");
  const nameInput = textInput({ value: draft.fields["name"] ?? "" });
  bind("name", nameInput);
  nameField.appendChild(nameInput);
  form.appendChild(nameField);

  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  for (const f of ENTITY_TEXT_FIELDS) {
    const w = fieldWrap(f);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    grid.appendChild(w);
  }
  form.appendChild(grid);

  for (const f of ENTITY_LONG_FIELDS) {
    const w = fieldWrap(f);
    const ta = textArea({ value: draft.fields[f] ?? "", rows: 2 });
    bind(f, ta);
    w.appendChild(ta);
    form.appendChild(w);
  }

  const relationsOn = state.activeProfile.codexRelationsTable;
  for (const f of ENTITY_LIST_FIELDS) {
    if (f === "ties" && relationsOn) continue;
    const w = fieldWrap(`${f} (comma separated)`);
    const input = textInput({ value: draft.fields[f] ?? "" });
    bind(f, input);
    w.appendChild(input);
    form.appendChild(w);
  }
  card.appendChild(form);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const saveBtn = makeButton(draft.saving ? "Saving..." : "Save", () => {
    if (draft.saving) return;
    const parsed = cache.parsed;
    if (!parsed) return;
    const entity = buildEntityFromDraft(draft, parsed);
    if (!entity) return;
    const list = parsed[draft.group];
    const idx = list.findIndex((x) => str(x["id"]) === draft.id);
    const next = idx >= 0 ? [...list.slice(0, idx), entity, ...list.slice(idx + 1)] : [...list, entity];
    draft.saving = true;
    sendCodexWrite(draft.group, { entities: next }, state, send);
    rerender();
  }, { primary: true, small: true, disabled: draft.saving });
  actions.append(
    saveBtn,
    makeButton("Cancel", () => {
      local.entityDraft = null;
      rerender();
    }, { small: true, disabled: draft.saving }),
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
  // Unknown extra fields the agent added (e.g. "age") survive untouched.
  if (orig) {
    for (const [k, v] of Object.entries(orig)) {
      if (!ENTITY_KNOWN.has(k)) out[k] = v;
    }
  }
  out["id"] = draft.id;
  out["name"] = name;
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
    makeButton(draft.saving ? "Saving..." : "Save", () => {
      if (!draft.saving) onSave();
    }, { primary: true, small: true, disabled: draft.saving }),
    makeButton("Cancel", () => {
      local.recordDraft = null;
      rerender();
    }, { small: true, disabled: draft.saving }),
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
    makeButton("Edit", onEdit, { small: true }),
    makeButton("Delete", async () => {
      const ok = await confirmDelete(ctx, "Delete?", deleteMessage);
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
  if (!rel) return;
  const next = d.index >= 0
    ? [...parsed.relations.slice(0, d.index), rel, ...parsed.relations.slice(d.index + 1)]
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
    { key: "type", label: "Type", widget: "select", options: [{ value: "pair", label: "pair (a → b)" }, { value: "group", label: "group" }] },
    ...(isGroup
      ? [{ key: "members", label: "Members (comma separated refs)", widget: "input" as const, refList: true, placeholder: "char:elias, char:wren" }]
      : [
          { key: "a", label: "From (a)", widget: "input" as const, refList: true, placeholder: "char:elias" },
          { key: "b", label: "To (b)", widget: "input" as const, refList: true, placeholder: "char:wren" },
        ]),
    { key: "kind", label: "Kind", widget: "input", placeholder: "bond, owns, at, rival..." },
    { key: "state", label: "State", widget: "textarea", placeholder: "loves her, hides it" },
    { key: "history", label: "History (one per line)", widget: "lines", placeholder: "day 12: she saw him kill" },
  ];
  const form = renderRecordForm(
    draft.index >= 0 ? "Edit relation" : "New relation",
    specs,
    draft,
    refListId,
    () => saveRelationDraft(draft, state, send),
  );
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
  const sec = section("Relations");
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const relationsOn = state.activeProfile.codexRelationsTable;

  const viewRow = document.createElement("div");
  viewRow.className = "lmb-actions";
  viewRow.append(
    makeButton("List", () => {
      if (local.relationsView === "list") return;
      local.relationsView = "list";
      local.recordDraft = null;
      rerender();
    }, { small: true }),
    makeButton("Graph", () => {
      if (local.relationsView === "graph") return;
      local.relationsView = "graph";
      // An open editor doesn't exist in graph view: leaving it live would
      // strand a form the user can no longer see the context of.
      local.recordDraft = null;
      rerender();
    }, { small: true }),
  );
  (viewRow.children[local.relationsView === "list" ? 0 : 1] as HTMLElement).classList.add("active");
  if (relationsOn && local.relationsView === "list") {
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    viewRow.append(spacer, makeButton("+ Relation", () => {
      local.recordDraft = relationDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }));
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
        ? "No relations recorded yet, add one or let Memoria find them."
        : "The relations table is off for this profile, connections live as ties on each entity sheet.",
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
      row.appendChild(recordItemActions(
        () => { local.recordDraft = relationDraftFrom(r, i); rerender(); },
        () => {
          const next = parsed.relations.filter((_, j) => j !== i);
          sendCodexWrite("relations", { relations: next }, state, send);
        },
        ctx,
        "Memoria will remove this relation from the codex.",
      ));
    }
    list.appendChild(row);
  });
  if (shown === 0) {
    sec.body.appendChild(textNode("No relation matches the search", "lmb-empty"));
  } else {
    sec.body.appendChild(list);
  }
  host.appendChild(sec.wrap);
}

function arrowSpan(): HTMLElement {
  const s = document.createElement("span");
  s.className = "lmb-relation-arrow";
  s.textContent = "→";
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
const GRAPH_PAD = 34;
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

/** d3-force layout, run to completion synchronously, then fitted to the
 * canvas. d3 seeds positions and jiggle from a fixed LCG, so the layout is
 * deterministic for a given codex. */
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
    .force("collide", forceCollide(30))
    .force("x", forceX(GRAPH_W / 2).strength(0.05))
    .force("y", forceY(GRAPH_H / 2).strength(0.09))
    .stop();
  sim.tick(300);

  // Fit the settled layout into the padded viewbox with uniform scale, so
  // the graph always fills the canvas without touching the frame.
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
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const labelPad = 10; // extra room under nodes for their labels
  const scale = Math.min(
    (GRAPH_W - GRAPH_PAD * 2) / spanX,
    (GRAPH_H - GRAPH_PAD * 2 - labelPad) / spanY,
    2.1, // don't blow tiny graphs up until edges look like chopsticks
  );
  const offX = (GRAPH_W - spanX * scale) / 2 - minX * scale;
  const offY = (GRAPH_H - labelPad - spanY * scale) / 2 - minY * scale;
  for (const n of nodes) {
    n.x = n.x * scale + offX;
    n.y = n.y * scale + offY;
  }
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
      local.query ? "No relation matches the search" : "No relations to chart yet",
      "lmb-empty",
    ));
    return;
  }
  layoutGraph(nodes, edges);
  const byId = new Map(nodes.map((node) => [node.id, node] as const));

  const svg = svgEl("svg");
  svg.setAttribute("class", "lmb-graph");
  svg.setAttribute("viewBox", `0 0 ${GRAPH_W} ${GRAPH_H}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

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
    path.setAttribute("class", `lmb-graph-edge${e.group ? " group" : ""}`);
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
    tip.textContent = `${node.name} (${node.id})`;
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
      node.x = Math.min(GRAPH_W - 10, Math.max(10, p.x));
      node.y = Math.min(GRAPH_H - 10, Math.max(10, p.y));
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

  const wrap = document.createElement("div");
  wrap.className = "lmb-graph-wrap";
  wrap.appendChild(svg);
  host.appendChild(wrap);
  host.appendChild(detail);

  const legend = document.createElement("div");
  legend.className = "lmb-spine-legend";
  const present = new Set(nodes.map((node) => node.ns));
  const entries: { ns: GraphNs; label: string }[] = [
    { ns: "char", label: "character" },
    { ns: "loc", label: "location" },
    { ns: "thing", label: "thing" },
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
  host.appendChild(textNode("Tap an edge for the story, tap a diamond to open its sheet, drag to rearrange.", "lmb-help"));
}

/* ------------------------------------------------------------- timeline */

function eventDraftFrom(e: Record<string, unknown> | null, index: number): RecordDraft {
  return {
    kind: "event",
    index,
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
  if (!when || !eventText) return;
  const participants = splitComma(d.fields["participants"] ?? "");
  const where = (d.fields["where"] ?? "").trim();
  const causes = (d.fields["causes"] ?? "").trim();
  const ev: Record<string, unknown> = { when, event: eventText };
  if (participants.length) ev["participants"] = participants;
  if (where) ev["where"] = where;
  if (causes) ev["causes"] = causes;
  const next = d.index >= 0
    ? [...parsed.events.slice(0, d.index), ev, ...parsed.events.slice(d.index + 1)]
    : [...parsed.events, ev];
  d.saving = true;
  sendCodexWrite("timeline", { events: next }, state, send);
  rerender();
}

const EVENT_SPECS: RecordFieldSpec[] = [
  { key: "when", label: "When", widget: "input", placeholder: "day 12" },
  { key: "event", label: "Event", widget: "textarea", placeholder: "Mara sees Elias kill the duke" },
  { key: "participants", label: "Participants (comma separated refs)", widget: "input", refList: true },
  { key: "where", label: "Where", widget: "input", refList: true, placeholder: "loc:ashford_manor" },
  { key: "causes", label: "Causes", widget: "input", placeholder: "she flees the city" },
];

function renderTimeline(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Timeline");
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);

  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.appendChild(makeButton("+ Event", () => {
    local.recordDraft = eventDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  sec.body.appendChild(toolbar);

  const draft = local.recordDraft;
  if (draft?.kind === "event" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm(
      "New event",
      EVENT_SPECS,
      draft,
      refListId,
      () => saveEventDraft(draft, state, send),
    ));
  }

  if (parsed.events.length === 0) {
    sec.body.appendChild(textNode("No events recorded yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const withIndex = parsed.events.map((e, i) => ({ e, i }));
  const all = withIndex.filter(({ e }) =>
    matches(local.query, str(e["when"]), str(e["event"]), str(e["causes"]), strArray(e["participants"]).map(nameOf)),
  );
  if (all.length === 0) {
    sec.body.appendChild(textNode("No event matches the search", "lmb-empty"));
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
        "Edit event",
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
    item.title = "Click for edit and delete";
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
          const next = parsed.events.filter((_, j) => j !== i);
          sendCodexWrite("timeline", { events: next }, state, send);
        },
        ctx,
        "Memoria will remove this event from the timeline.",
      );
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      item.appendChild(actions);
    }
    rail.appendChild(item);
  }
  sec.body.appendChild(rail);
  if (!local.query && all.length > TIMELINE_RECENT) {
    sec.body.appendChild(makeButton(
      local.showFullTimeline ? "Show recent only" : `Show earlier (${all.length - TIMELINE_RECENT})`,
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
  { key: "name", label: "Name", widget: "input", placeholder: "The stolen crown" },
  { key: "status", label: "Status", widget: "select", options: [
    { value: "open", label: "open" },
    { value: "stalled", label: "stalled" },
    { value: "resolved", label: "resolved" },
    { value: "abandoned", label: "abandoned" },
  ] },
  { key: "summary", label: "Summary", widget: "textarea" },
  { key: "latest", label: "Latest development", widget: "input" },
  { key: "planted", label: "Planted details (one per line)", widget: "lines" },
];

function saveThreadDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const name = (d.fields["name"] ?? "").trim();
  const summary = (d.fields["summary"] ?? "").trim();
  if (!name || !summary) return;
  const t: Record<string, unknown> = { name, status: d.fields["status"] || "open", summary };
  const latest = (d.fields["latest"] ?? "").trim();
  if (latest) t["latest"] = latest;
  const planted = splitLines(d.fields["planted"] ?? "");
  if (planted.length) t["planted"] = planted;
  const next = d.index >= 0
    ? [...parsed.threads.slice(0, d.index), t, ...parsed.threads.slice(d.index + 1)]
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
  const sec = section("Threads");

  const toolbar = document.createElement("div");
  toolbar.className = "lmb-actions";
  toolbar.append(
    makeButton("+ Thread", () => {
      local.recordDraft = threadDraftFrom(null, -1);
      rerender();
    }, { small: true, primary: true }),
    makeButton("Edit seeds", () => {
      local.recordDraft = { kind: "seeds", index: -1, saving: false, fields: { seeds: parsed.seeds.join("\n") } };
      rerender();
    }, { small: true }),
  );
  sec.body.appendChild(toolbar);

  const draft = local.recordDraft;
  if (draft?.kind === "thread" && draft.index === -1) {
    sec.body.appendChild(renderRecordForm(
      "New thread",
      THREAD_SPECS,
      draft,
      null,
      () => saveThreadDraft(draft, state, send),
    ));
  } else if (draft?.kind === "seeds") {
    sec.body.appendChild(renderRecordForm(
      "Edit seeds",
      [{ key: "seeds", label: "Seeds (one per line)", widget: "lines" }],
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
    sec.body.appendChild(textNode("No open storylines tracked yet", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
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
        "Edit thread",
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
    head.append(pill(status, THREAD_TONE[status]));
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
      if (latest) row.appendChild(textNode(`Latest: ${latest}`, "lmb-thread-detail"));
      for (const p of strArray(t["planted"])) {
        row.appendChild(textNode(`◆ planted: ${p}`, "lmb-thread-detail"));
      }
      row.appendChild(recordItemActions(
        () => { local.recordDraft = threadDraftFrom(t, i); rerender(); },
        () => {
          const next = parsed.threads.filter((_, j) => j !== i);
          sendCodexWrite("threads", { threads: next, seeds: parsed.seeds }, state, send);
        },
        ctx,
        "Memoria will remove this thread from the codex.",
      ));
    }
    list.appendChild(row);
  });
  if (shown > 0) sec.body.appendChild(list);
  else if (parsed.threads.length > 0) sec.body.appendChild(textNode("No thread matches the search", "lmb-empty"));

  const seeds = parsed.seeds.filter((s) => matches(local.query, s));
  if (seeds.length) {
    const sub = document.createElement("div");
    sub.className = "lmb-section-title";
    sub.textContent = `Seeds (${parsed.seeds.length})`;
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
    saving: false,
    fields: {
      topic: str(w?.["topic"]),
      facts: strArray(w?.["facts"]).join("\n"),
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
    saving: false,
    fields: {
      fact: str(k?.["fact"]),
      knownBy: strArray(k?.["knownBy"]).join(", "),
      hiddenFrom: strArray(k?.["hiddenFrom"]).join(", "),
      falseBeliefs: beliefs,
      note: str(k?.["note"]),
    },
  };
}

function saveWorldDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const topic = (d.fields["topic"] ?? "").trim();
  const facts = splitLines(d.fields["facts"] ?? "");
  if (!topic || facts.length === 0) return;
  const entry = { topic, facts };
  const next = d.index >= 0
    ? [...parsed.world.slice(0, d.index), entry, ...parsed.world.slice(d.index + 1)]
    : [...parsed.world, entry];
  d.saving = true;
  sendCodexWrite("world", { entries: next }, state, send);
  rerender();
}

function saveKnowledgeDraft(d: RecordDraft, state: FrontendState, send: (m: FrontendToBackend) => void): void {
  const parsed = cache.parsed;
  if (!parsed) return;
  const fact = (d.fields["fact"] ?? "").trim();
  if (!fact) return;
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
  const next = d.index >= 0
    ? [...parsed.knowledge.slice(0, d.index), item, ...parsed.knowledge.slice(d.index + 1)]
    : [...parsed.knowledge, item];
  d.saving = true;
  sendCodexWrite("knowledge", { items: next }, state, send);
  rerender();
}

const WORLD_SPECS: RecordFieldSpec[] = [
  { key: "topic", label: "Topic", widget: "input", placeholder: "Magic" },
  { key: "facts", label: "Facts (one per line)", widget: "lines", placeholder: "blood magic costs memories" },
];

const KNOWLEDGE_SPECS: RecordFieldSpec[] = [
  { key: "fact", label: "Fact", widget: "textarea", placeholder: "Elias killed the duke" },
  { key: "knownBy", label: "Known by (comma separated refs)", widget: "input", refList: true },
  { key: "hiddenFrom", label: "Hidden from (comma separated refs)", widget: "input", refList: true },
  { key: "falseBeliefs", label: "False beliefs (one per line, \"who => belief\")", widget: "lines", placeholder: "char:captain => bandits did it" },
  { key: "note", label: "Note", widget: "input" },
];

function renderLore(
  host: HTMLElement,
  parsed: ParsedCodex,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const nameOf = makeNameResolver(parsed);
  const refListId = ensureRefDatalist(parsed);
  const draft = local.recordDraft;

  const world = section("World rules");
  const worldBar = document.createElement("div");
  worldBar.className = "lmb-actions";
  worldBar.appendChild(makeButton("+ Topic", () => {
    local.recordDraft = worldDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  world.body.appendChild(worldBar);
  if (draft?.kind === "world" && draft.index === -1) {
    world.body.appendChild(renderRecordForm(
      "New topic",
      WORLD_SPECS,
      draft,
      null,
      () => saveWorldDraft(draft, state, send),
    ));
  }
  const worldShown = parsed.world
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => matches(local.query, str(w["topic"]), strArray(w["facts"])));
  if (parsed.world.length === 0) {
    world.body.appendChild(textNode("No world lore recorded yet", "lmb-empty"));
  } else if (worldShown.length === 0) {
    world.body.appendChild(textNode("No topic matches the search", "lmb-empty"));
  }
  for (const { w, i } of worldShown) {
    // The topic under edit is replaced by its form, right where it was.
    if (draft?.kind === "world" && draft.index === i) {
      world.body.appendChild(renderRecordForm(
        "Edit topic",
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
    block.title = "Click for edit and delete";
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
      const actions = recordItemActions(
        () => { local.recordDraft = worldDraftFrom(w, i); rerender(); },
        () => {
          const next = parsed.world.filter((_, j) => j !== i);
          sendCodexWrite("world", { entries: next }, state, send);
        },
        ctx,
        "Memoria will remove this topic and its facts.",
      );
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    world.body.appendChild(block);
  }
  host.appendChild(world.wrap);

  const secrets = section("Who knows what");
  const secretBar = document.createElement("div");
  secretBar.className = "lmb-actions";
  secretBar.appendChild(makeButton("+ Secret", () => {
    local.recordDraft = knowledgeDraftFrom(null, -1);
    rerender();
  }, { small: true, primary: true }));
  secrets.body.appendChild(secretBar);
  if (draft?.kind === "knowledge" && draft.index === -1) {
    secrets.body.appendChild(renderRecordForm(
      "New secret",
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
    ));
  if (parsed.knowledge.length === 0) {
    secrets.body.appendChild(textNode("No secrets or asymmetric knowledge tracked yet", "lmb-empty"));
  } else if (knowledgeShown.length === 0) {
    secrets.body.appendChild(textNode("No secret matches the search", "lmb-empty"));
  }
  for (const { k, i } of knowledgeShown) {
    // The secret under edit is replaced by its form, right where it was.
    if (draft?.kind === "knowledge" && draft.index === i) {
      secrets.body.appendChild(renderRecordForm(
        "Edit secret",
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
    block.title = "Click for edit and delete";
    block.appendChild(textNode(str(k["fact"]), "lmb-secret-fact"));
    const chips = document.createElement("div");
    chips.className = "lmb-actions";
    for (const who of strArray(k["knownBy"])) chips.appendChild(pill(`knows: ${nameOf(who)}`, "ok"));
    for (const who of strArray(k["hiddenFrom"])) chips.appendChild(pill(`hidden: ${nameOf(who)}`, "warn"));
    if (chips.childElementCount) block.appendChild(chips);
    for (const b of objArray(k["falseBeliefs"])) {
      block.appendChild(textNode(`${nameOf(str(b["who"]))} wrongly believes: ${str(b["believes"])}`, "lmb-thread-detail"));
    }
    const note = str(k["note"]);
    if (note) block.appendChild(textNode(note, "lmb-thread-detail"));
    block.addEventListener("click", () => {
      if (expanded) local.expandedSecrets.delete(i);
      else local.expandedSecrets.add(i);
      rerender();
    });
    if (expanded) {
      const actions = recordItemActions(
        () => { local.recordDraft = knowledgeDraftFrom(k, i); rerender(); },
        () => {
          const next = parsed.knowledge.filter((_, j) => j !== i);
          sendCodexWrite("knowledge", { items: next }, state, send);
        },
        ctx,
        "Memoria will remove this secret from the codex.",
      );
      actions.addEventListener("click", (ev) => ev.stopPropagation());
      block.appendChild(actions);
    }
    secrets.body.appendChild(block);
  }
  host.appendChild(secrets.wrap);
}

/**
 * The Knowledge Codex data model: eight JSON files per chat, each a snapshot
 * of the story's present state. Validation is hand-rolled in the same style
 * as shared.ts (this repo has no runtime deps). Validators return precise,
 * path-labelled errors because they are fed back to the codex agent verbatim
 * as tool_result errors for self-correction.
 */

import { CODEX_FILE_KEYS, type CodexFileKey } from "../../shared";

export { CODEX_FILE_KEYS, type CodexFileKey };

export function isCodexFileKey(v: unknown): v is CodexFileKey {
  return typeof v === "string" && (CODEX_FILE_KEYS as readonly string[]).includes(v);
}

export type EntityNamespace = "char" | "loc" | "thing";

const ENTITY_REF_RE = /^(char|loc|thing):[a-z0-9_]+$/;

function isEntityRef(v: unknown): v is string {
  return typeof v === "string" && ENTITY_REF_RE.test(v);
}

/** Ref-shaped strings get integrity-checked; plain prose strings are left alone. */
function looksLikeEntityRef(v: string): boolean {
  return /^(char|loc|thing):/.test(v);
}

const FILE_NAMESPACE: Partial<Record<CodexFileKey, EntityNamespace>> = {
  characters: "char",
  locations: "loc",
  things: "thing",
};

/**
 * One shape serves all three entity files. Required: id, name. The rest are
 * optional, and unknown extra fields are kept when they are primitive
 * (string / number / string[]) so the agent can add sheet fields like "age"
 * without the validator eating them. The compress directive keeps this from
 * becoming a junk drawer.
 */
export interface CodexEntity {
  id: string;
  name: string;
  aliases?: string[];
  kind?: string;
  role?: string;
  appearance?: string;
  description?: string;
  traits?: string[];
  goals?: string[];
  significance?: string;
  /** Inline relationship notes - only legal when the relations table is disabled. */
  ties?: string[];
  notes?: string;
  /** Retrieval tags for the synced lorebook entry; never rendered into the prompt body. */
  keywords?: string[];
  /** User-owned: the agent may not modify or drop a locked entity. */
  locked?: boolean;
  /** User-owned fields on an otherwise agent-managed sheet: the agent sees
   * LOCKED_FIELD_MASK instead of their values and its writes to them revert. */
  lockedFields?: string[];
  [extra: string]: unknown;
}

/** What the agent reads in place of a locked field's value. */
export const LOCKED_FIELD_MASK = "Locked, do not edit" as const;

export interface CodexEntityFile {
  entities: CodexEntity[];
}

export type CodexRelation =
  | {
      type: "pair";
      /** Stable row key for patch-mode writes; assigned on load when absent. */
      rid?: string;
      a: string;
      b: string;
      kind: string;
      state: string;
      history?: string[];
    }
  | {
      type: "group";
      rid?: string;
      kind: string;
      members: string[];
      state: string;
      roles?: Record<string, string>;
      history?: string[];
    };

export interface CodexRelationsFile {
  relations: CodexRelation[];
}

export interface CodexTimelineEvent {
  rid?: string;
  when: string;
  event: string;
  participants?: string[];
  where?: string;
  causes?: string;
}

export interface CodexTimelineFile {
  events: CodexTimelineEvent[];
}

export type CodexThreadStatus = "open" | "stalled" | "resolved" | "abandoned";

export interface CodexThread {
  rid?: string;
  name: string;
  status: CodexThreadStatus;
  summary: string;
  latest?: string;
  planted?: string[];
}

export interface CodexThreadsFile {
  threads: CodexThread[];
  /** Planted details awaiting payoff that don't belong to a named thread. */
  seeds: string[];
}

export interface CodexWorldEntry {
  rid?: string;
  topic: string;
  facts: string[];
  /** Retrieval tags for the synced lorebook entry; never rendered into the prompt body. */
  keywords?: string[];
}

export interface CodexWorldFile {
  entries: CodexWorldEntry[];
}

export interface CodexFalseBelief {
  who: string;
  believes: string;
}

/**
 * One item covers plain asymmetric knowledge and secrets alike: a secret is
 * a fact with hiddenFrom. Facts every character knows don't belong here at
 * all - those live in world or timeline.
 */
export interface CodexKnowledgeItem {
  rid?: string;
  fact: string;
  knownBy?: string[];
  hiddenFrom?: string[];
  falseBeliefs?: CodexFalseBelief[];
  note?: string;
  /** Retrieval tags for the synced lorebook entry; never rendered into the prompt body. */
  keywords?: string[];
}

export interface CodexKnowledgeFile {
  items: CodexKnowledgeItem[];
}

export interface CodexBundle {
  characters: CodexEntityFile;
  locations: CodexEntityFile;
  things: CodexEntityFile;
  relations: CodexRelationsFile;
  timeline: CodexTimelineFile;
  threads: CodexThreadsFile;
  world: CodexWorldFile;
  knowledge: CodexKnowledgeFile;
}

export type CodexFileValue = CodexBundle[CodexFileKey];

export function emptyCodexFile(key: CodexFileKey): CodexFileValue {
  switch (key) {
    case "characters":
    case "locations":
    case "things":
      return { entities: [] };
    case "relations":
      return { relations: [] };
    case "timeline":
      return { events: [] };
    case "threads":
      return { threads: [], seeds: [] };
    case "world":
      return { entries: [] };
    case "knowledge":
      return { items: [] };
  }
}

export function emptyBundle(): CodexBundle {
  return {
    characters: { entities: [] },
    locations: { entities: [] },
    things: { entities: [] },
    relations: { relations: [] },
    timeline: { events: [] },
    threads: { threads: [], seeds: [] },
    world: { entries: [] },
    knowledge: { items: [] },
  };
}

export function bundleIsEmpty(bundle: CodexBundle): boolean {
  return (
    bundle.characters.entities.length === 0
    && bundle.locations.entities.length === 0
    && bundle.things.entities.length === 0
    && bundle.relations.relations.length === 0
    && bundle.timeline.events.length === 0
    && bundle.threads.threads.length === 0
    && bundle.threads.seeds.length === 0
    && bundle.world.entries.length === 0
    && bundle.knowledge.items.length === 0
  );
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

interface Ctx {
  errors: string[];
}

function fail<T>(errors: string[]): ValidationResult<T> {
  return { ok: false, errors };
}

function str(ctx: Ctx, v: unknown, path: string, required: boolean): string | undefined {
  if (v === undefined || v === null || v === "") {
    if (required) ctx.errors.push(`${path}: required non-empty string`);
    return undefined;
  }
  if (typeof v !== "string") {
    ctx.errors.push(`${path}: expected a string`);
    return undefined;
  }
  const t = v.trim();
  if (!t && required) {
    ctx.errors.push(`${path}: required non-empty string`);
    return undefined;
  }
  return t || undefined;
}

function strArray(ctx: Ctx, v: unknown, path: string): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v)) {
    ctx.errors.push(`${path}: expected an array of strings`);
    return undefined;
  }
  const out: string[] = [];
  v.forEach((x, i) => {
    if (typeof x !== "string") ctx.errors.push(`${path}[${i}]: expected a string`);
    else if (x.trim()) out.push(x.trim());
  });
  return out.length ? out : undefined;
}

function objArray(ctx: Ctx, v: unknown, path: string): Record<string, unknown>[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    ctx.errors.push(`${path}: expected an array`);
    return [];
  }
  const out: Record<string, unknown>[] = [];
  v.forEach((x, i) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) {
      ctx.errors.push(`${path}[${i}]: expected an object`);
    } else {
      out.push(x as Record<string, unknown>);
    }
  });
  return out;
}

function asRecord(ctx: Ctx, raw: unknown, path: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    ctx.errors.push(`${path}: expected a JSON object`);
    return null;
  }
  return raw as Record<string, unknown>;
}

/** Known fields whose canonical spelling is not all-lowercase, exempt from
 * the strict-mode lowercase complaint below. */
const CANONICAL_MIXED_CASE = new Set(["lockedFields"]);

/** Keep primitive extra fields; strict mode rejects the rest instead of dropping them. */
function keepExtras(
  ctx: Ctx,
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  known: readonly string[],
  path: string,
  strict: boolean,
): void {
  for (const [k, v] of Object.entries(source)) {
    const lower = k.toLowerCase();
    if (known.some((f) => f === lower)) {
      if (k !== lower && strict && !CANONICAL_MIXED_CASE.has(k)) ctx.errors.push(`${path}.${k}: use lowercase "${lower}"`);
      continue;
    }
    // JSON.parse can produce an own "__proto__" key; assigning it would hit
    // the prototype accessor instead of storing a field.
    if (k === "__proto__") continue;
    if (typeof v === "string") {
      if (v.trim()) target[k] = v.trim();
    } else if (typeof v === "number" && Number.isFinite(v)) {
      target[k] = v;
    } else if (typeof v === "boolean") {
      // The prompt advertises "extra primitive fields", and a boolean is one.
      // Keep it as a string so the durable fact isn't silently dropped behind
      // an ok ack while the flat-structure rule still holds.
      target[k] = v ? "true" : "false";
    } else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      const arr = (v as string[]).map((x) => x.trim()).filter(Boolean);
      if (arr.length) target[k] = arr;
    } else if (v !== null && v !== undefined && strict) {
      ctx.errors.push(`${path}.${k}: extra fields must be primitive (string, number, boolean, or string[]), flatten this`);
    }
    // Lenient mode drops the rest (nested objects, null): structure stays flat.
  }
}

// "status" and "rid" are listed so keepExtras never keeps them as extras:
// status is deprecated, and entities key by id so a parroted rid is noise.
const ENTITY_KNOWN_FIELDS = [
  "id", "name", "aliases", "kind", "role", "appearance", "description",
  "traits", "goals", "significance", "status", "ties", "notes", "keywords", "locked", "lockedfields", "rid",
] as const;

/** Optional stable row key, kept short so it stays cheap in the prompt. */
function ridOf(ctx: Ctx, v: unknown, path: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string" || !v.trim()) {
    ctx.errors.push(`${path}.rid: expected a short string`);
    return undefined;
  }
  return v.trim().slice(0, 24);
}

export interface ValidateOptions {
  /** Whether the relations table is enabled for this profile. */
  relationsTable: boolean;
  /** On for agent writes, off for loads and hand-saves so legacy files never brick. */
  strictExtras?: boolean;
}

function validateEntityFile(
  key: "characters" | "locations" | "things",
  raw: unknown,
  opts: ValidateOptions,
): ValidationResult<CodexEntityFile> {
  const ctx: Ctx = { errors: [] };
  const root = asRecord(ctx, raw, key);
  if (!root) return fail(ctx.errors);
  const ns = FILE_NAMESPACE[key]!;
  const seen = new Set<string>();
  const entities: CodexEntity[] = [];
  for (const [i, e] of objArray(ctx, root["entities"], "entities").entries()) {
    const path = `entities[${i}]`;
    const id = str(ctx, e["id"], `${path}.id`, true);
    const name = str(ctx, e["name"], `${path}.name`, true);
    if (!id || !name) continue;
    if (!ENTITY_REF_RE.test(id)) {
      ctx.errors.push(`${path}.id: "${id}" must match ${ns}:<lowercase_snake_case>`);
      continue;
    }
    if (!id.startsWith(`${ns}:`)) {
      ctx.errors.push(`${path}.id: "${id}" belongs in another file, ids here must start with "${ns}:"`);
      continue;
    }
    if (seen.has(id)) {
      ctx.errors.push(`${path}.id: duplicate id "${id}"`);
      continue;
    }
    seen.add(id);
    const out: CodexEntity = { id, name };
    const aliases = strArray(ctx, e["aliases"], `${path}.aliases`);
    if (aliases) out.aliases = aliases;
    for (const f of ["kind", "role", "appearance", "description", "significance", "notes"] as const) {
      const v = str(ctx, e[f], `${path}.${f}`, false);
      if (v) out[f] = v;
    }
    if (e["locked"] === true || e["locked"] === "true") out.locked = true;
    // Accept either spelling on read; canonical is lockedFields.
    const lockedFields = strArray(ctx, e["lockedFields"] ?? e["lockedfields"], `${path}.lockedFields`);
    if (lockedFields) {
      const cleaned = [...new Set(lockedFields.filter((f) => f !== "id" && f !== "name"))];
      if (cleaned.length) out.lockedFields = cleaned;
    }
    if (opts.strictExtras === true && e["status"] !== undefined && e["status"] !== null && e["status"] !== "") {
      ctx.errors.push(`${path}.status: this field was removed - keep durable state in description, drop scene-of-the-moment state`);
    }
    for (const f of ["traits", "goals", "keywords"] as const) {
      const v = strArray(ctx, e[f], `${path}.${f}`);
      if (v) out[f] = v;
    }
    const ties = strArray(ctx, e["ties"], `${path}.ties`);
    if (ties) {
      // Locked rows keep their ties even in table mode: the agent may not
      // rewrite them, so rejecting would brick the whole file.
      if (opts.relationsTable && !out.locked) {
        ctx.errors.push(`${path}.ties: the relations table is enabled, move these into relations.json rows`);
      } else {
        out.ties = ties;
      }
    }
    keepExtras(ctx, out, e, ENTITY_KNOWN_FIELDS, path, opts.strictExtras === true);
    entities.push(out);
  }
  if (ctx.errors.length) return fail(ctx.errors);
  return { ok: true, value: { entities } };
}

function validateRelationsFile(raw: unknown, opts: ValidateOptions): ValidationResult<CodexRelationsFile> {
  const ctx: Ctx = { errors: [] };
  const root = asRecord(ctx, raw, "relations");
  if (!root) return fail(ctx.errors);
  // Check the raw array length, not the object-filtered rows: a populated but
  // malformed payload in inline mode should still get the mode-specific
  // guidance rather than generic per-row shape errors.
  const rawLen = Array.isArray(root["relations"]) ? (root["relations"] as unknown[]).length : 0;
  if (!opts.relationsTable && rawLen > 0) {
    return fail(["relations: the relations table is disabled for this profile, keep connections as ties on entity sheets instead"]);
  }
  const rows = objArray(ctx, root["relations"], "relations");
  const relations: CodexRelation[] = [];
  for (const [i, r] of rows.entries()) {
    const path = `relations[${i}]`;
    const type = r["type"];
    const rid = ridOf(ctx, r["rid"], path);
    if (type === "pair") {
      const a = str(ctx, r["a"], `${path}.a`, true);
      const b = str(ctx, r["b"], `${path}.b`, true);
      const kind = str(ctx, r["kind"], `${path}.kind`, true);
      const state = str(ctx, r["state"], `${path}.state`, true);
      if (!a || !b || !kind || !state) continue;
      if (!isEntityRef(a)) ctx.errors.push(`${path}.a: "${a}" is not a valid entity ref`);
      if (!isEntityRef(b)) ctx.errors.push(`${path}.b: "${b}" is not a valid entity ref`);
      if (a === b) ctx.errors.push(`${path}: a and b are the same entity`);
      const history = strArray(ctx, r["history"], `${path}.history`);
      relations.push({ type: "pair", ...(rid ? { rid } : {}), a, b, kind, state, ...(history ? { history } : {}) });
    } else if (type === "group") {
      const kind = str(ctx, r["kind"], `${path}.kind`, true);
      const state = str(ctx, r["state"], `${path}.state`, true);
      const members = [...new Set(strArray(ctx, r["members"], `${path}.members`) ?? [])];
      if (!kind || !state) continue;
      if (members.length < 2) ctx.errors.push(`${path}.members: a group needs at least 2 distinct members`);
      for (const m of members) {
        if (!isEntityRef(m)) ctx.errors.push(`${path}.members: "${m}" is not a valid entity ref`);
      }
      let roles: Record<string, string> | undefined;
      const rawRoles = r["roles"];
      if (rawRoles !== undefined && rawRoles !== null) {
        const rec = asRecord(ctx, rawRoles, `${path}.roles`);
        if (rec) {
          roles = {};
          for (const [k, v] of Object.entries(rec)) {
            if (!isEntityRef(k)) ctx.errors.push(`${path}.roles: key "${k}" is not a valid entity ref`);
            else if (typeof v !== "string" || !v.trim()) ctx.errors.push(`${path}.roles["${k}"]: expected a string role`);
            else roles[k] = v.trim();
          }
          if (Object.keys(roles).length === 0) roles = undefined;
        }
      }
      const history = strArray(ctx, r["history"], `${path}.history`);
      relations.push({
        type: "group", ...(rid ? { rid } : {}), kind, members, state,
        ...(roles ? { roles } : {}),
        ...(history ? { history } : {}),
      });
    } else {
      ctx.errors.push(`${path}.type: expected "pair" or "group"`);
    }
  }
  if (ctx.errors.length) return fail(ctx.errors);
  return { ok: true, value: { relations } };
}

function validateTimelineFile(raw: unknown): ValidationResult<CodexTimelineFile> {
  const ctx: Ctx = { errors: [] };
  const root = asRecord(ctx, raw, "timeline");
  if (!root) return fail(ctx.errors);
  const events: CodexTimelineEvent[] = [];
  for (const [i, e] of objArray(ctx, root["events"], "events").entries()) {
    const path = `events[${i}]`;
    const when = str(ctx, e["when"], `${path}.when`, true);
    const event = str(ctx, e["event"], `${path}.event`, true);
    const rid = ridOf(ctx, e["rid"], path);
    if (!when || !event) continue;
    const out: CodexTimelineEvent = { ...(rid ? { rid } : {}), when, event };
    const participants = strArray(ctx, e["participants"], `${path}.participants`);
    if (participants) out.participants = participants;
    const where = str(ctx, e["where"], `${path}.where`, false);
    if (where) out.where = where;
    const causes = str(ctx, e["causes"], `${path}.causes`, false);
    if (causes) out.causes = causes;
    events.push(out);
  }
  if (ctx.errors.length) return fail(ctx.errors);
  return { ok: true, value: { events } };
}

function validateThreadsFile(raw: unknown): ValidationResult<CodexThreadsFile> {
  const ctx: Ctx = { errors: [] };
  const root = asRecord(ctx, raw, "threads");
  if (!root) return fail(ctx.errors);
  const threads: CodexThread[] = [];
  for (const [i, t] of objArray(ctx, root["threads"], "threads").entries()) {
    const path = `threads[${i}]`;
    const name = str(ctx, t["name"], `${path}.name`, true);
    const summary = str(ctx, t["summary"], `${path}.summary`, true);
    const status = t["status"];
    const rid = ridOf(ctx, t["rid"], path);
    if (!name || !summary) continue;
    if (status !== "open" && status !== "stalled" && status !== "resolved" && status !== "abandoned") {
      ctx.errors.push(`${path}.status: expected open | stalled | resolved | abandoned`);
      continue;
    }
    const out: CodexThread = { ...(rid ? { rid } : {}), name, status, summary };
    const latest = str(ctx, t["latest"], `${path}.latest`, false);
    if (latest) out.latest = latest;
    const planted = strArray(ctx, t["planted"], `${path}.planted`);
    if (planted) out.planted = planted;
    threads.push(out);
  }
  const seeds = strArray(ctx, root["seeds"], "seeds") ?? [];
  if (ctx.errors.length) return fail(ctx.errors);
  return { ok: true, value: { threads, seeds } };
}

function validateWorldFile(raw: unknown): ValidationResult<CodexWorldFile> {
  const ctx: Ctx = { errors: [] };
  const root = asRecord(ctx, raw, "world");
  if (!root) return fail(ctx.errors);
  const entries: CodexWorldEntry[] = [];
  for (const [i, e] of objArray(ctx, root["entries"], "entries").entries()) {
    const path = `entries[${i}]`;
    const topic = str(ctx, e["topic"], `${path}.topic`, true);
    const facts = strArray(ctx, e["facts"], `${path}.facts`) ?? [];
    const rid = ridOf(ctx, e["rid"], path);
    if (!topic) continue;
    if (facts.length === 0) {
      ctx.errors.push(`${path}.facts: at least one fact required, drop the topic if it has none`);
      continue;
    }
    const keywords = strArray(ctx, e["keywords"], `${path}.keywords`);
    entries.push({ ...(rid ? { rid } : {}), topic, facts, ...(keywords ? { keywords } : {}) });
  }
  if (ctx.errors.length) return fail(ctx.errors);
  return { ok: true, value: { entries } };
}

function validateKnowledgeFile(raw: unknown): ValidationResult<CodexKnowledgeFile> {
  const ctx: Ctx = { errors: [] };
  const root = asRecord(ctx, raw, "knowledge");
  if (!root) return fail(ctx.errors);
  const items: CodexKnowledgeItem[] = [];
  for (const [i, k] of objArray(ctx, root["items"], "items").entries()) {
    const path = `items[${i}]`;
    const fact = str(ctx, k["fact"], `${path}.fact`, true);
    const rid = ridOf(ctx, k["rid"], path);
    if (!fact) continue;
    const out: CodexKnowledgeItem = { ...(rid ? { rid } : {}), fact };
    const knownBy = strArray(ctx, k["knownBy"], `${path}.knownBy`);
    if (knownBy) out.knownBy = knownBy;
    const hiddenFrom = strArray(ctx, k["hiddenFrom"], `${path}.hiddenFrom`);
    if (hiddenFrom) out.hiddenFrom = hiddenFrom;
    const rawBeliefs = k["falseBeliefs"];
    if (rawBeliefs !== undefined && rawBeliefs !== null) {
      const beliefs: CodexFalseBelief[] = [];
      for (const [j, b] of objArray(ctx, rawBeliefs, `${path}.falseBeliefs`).entries()) {
        const who = str(ctx, b["who"], `${path}.falseBeliefs[${j}].who`, true);
        const believes = str(ctx, b["believes"], `${path}.falseBeliefs[${j}].believes`, true);
        if (who && believes) beliefs.push({ who, believes });
      }
      if (beliefs.length) out.falseBeliefs = beliefs;
    }
    const note = str(ctx, k["note"], `${path}.note`, false);
    if (note) out.note = note;
    const keywords = strArray(ctx, k["keywords"], `${path}.keywords`);
    if (keywords) out.keywords = keywords;
    if (!out.knownBy && !out.hiddenFrom && !out.falseBeliefs) {
      ctx.errors.push(`${path}: needs at least one of knownBy, hiddenFrom, falseBeliefs - facts everyone knows belong in world or timeline`);
      continue;
    }
    items.push(out);
  }
  if (ctx.errors.length) return fail(ctx.errors);
  return { ok: true, value: { items } };
}

export function validateCodexFile(
  key: CodexFileKey,
  raw: unknown,
  opts: ValidateOptions,
): ValidationResult<CodexFileValue> {
  switch (key) {
    case "characters":
    case "locations":
    case "things":
      return validateEntityFile(key, raw, opts);
    case "relations":
      return validateRelationsFile(raw, opts);
    case "timeline":
      return validateTimelineFile(raw);
    case "threads":
      return validateThreadsFile(raw);
    case "world":
      return validateWorldFile(raw);
    case "knowledge":
      return validateKnowledgeFile(raw);
  }
}

function collectEntityIds(bundle: CodexBundle): Set<string> {
  const ids = new Set<string>();
  for (const file of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of file.entities) ids.add(e.id);
  }
  return ids;
}

interface DanglingRef {
  path: string;
  ref: string;
  /** File holding the reference, so tolerance budgets stay per file. */
  file: CodexFileKey;
}

function collectDangling(bundle: CodexBundle): DanglingRef[] {
  const ids = collectEntityIds(bundle);
  const out: DanglingRef[] = [];
  const check = (ref: string, path: string, file: CodexFileKey): void => {
    if (looksLikeEntityRef(ref) && !ids.has(ref)) out.push({ ref, path, file });
  };
  bundle.relations.relations.forEach((r, i) => {
    if (r.type === "pair") {
      check(r.a, `relations[${i}].a`, "relations");
      check(r.b, `relations[${i}].b`, "relations");
    } else {
      r.members.forEach((m) => check(m, `relations[${i}].members`, "relations"));
      for (const k of Object.keys(r.roles ?? {})) check(k, `relations[${i}].roles`, "relations");
    }
  });
  bundle.knowledge.items.forEach((k, i) => {
    (k.knownBy ?? []).forEach((w) => check(w, `knowledge items[${i}].knownBy`, "knowledge"));
    (k.hiddenFrom ?? []).forEach((w) => check(w, `knowledge items[${i}].hiddenFrom`, "knowledge"));
    (k.falseBeliefs ?? []).forEach((b, j) => check(b.who, `knowledge items[${i}].falseBeliefs[${j}].who`, "knowledge"));
  });
  bundle.timeline.events.forEach((e, i) => {
    (e.participants ?? []).forEach((p) => check(p, `timeline events[${i}].participants`, "timeline"));
    if (e.where) check(e.where, `timeline events[${i}].where`, "timeline");
  });
  return out;
}

function formatDangling(d: DanglingRef): string {
  return d.file === "relations"
    ? `${d.path}: "${d.ref}" is not defined in any entity file - add the entity, or drop or retarget the row (relations only take entity refs)`
    : `${d.path}: "${d.ref}" is not defined in any entity file - add the entity or use plain text`;
}

/**
 * Cross-file referential integrity: every ref-shaped string in relations,
 * knowledge, and timeline must name an entity that exists. Plain prose
 * strings (a participant written as "the innkeeper") are left alone. Errors
 * name the offending path so the agent can either add the entity or demote
 * the ref to prose.
 */
export function checkIntegrity(bundle: CodexBundle): string[] {
  return collectDangling(bundle).map(formatDangling);
}

/**
 * Dangling refs a run must be held responsible for: everything currently
 * broken minus what was already broken on disk. Tolerance is per file and
 * ref, so a new occurrence can never consume an untouched file's budget.
 */
export function newDanglingErrors(bundle: CodexBundle, tolerate: Map<string, number>): string[] {
  const used = new Map<string, number>();
  const out: string[] = [];
  for (const d of collectDangling(bundle)) {
    const key = `${d.file}::${d.ref}`;
    const budget = tolerate.get(key) ?? 0;
    const spent = used.get(key) ?? 0;
    used.set(key, spent + 1);
    if (spent < budget) continue; // within the pre-existing count, tolerate
    out.push(formatDangling(d));
  }
  return out;
}

export function danglingRefCounts(bundle: CodexBundle): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of collectDangling(bundle)) {
    const key = `${d.file}::${d.ref}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

/* --------------------------------------------------------- patch-mode keys */

/** The keyed collection each file's patch ops address. Entity files key by
 * entity id; every other file keys by the per-row rid. */
export const FILE_ROW_KEY: Readonly<Record<CodexFileKey, { field: string; key: "id" | "rid" }>> = {
  characters: { field: "entities", key: "id" },
  locations: { field: "entities", key: "id" },
  things: { field: "entities", key: "id" },
  relations: { field: "relations", key: "rid" },
  timeline: { field: "events", key: "rid" },
  threads: { field: "threads", key: "rid" },
  world: { field: "entries", key: "rid" },
  knowledge: { field: "items", key: "rid" },
};

export function fileRows(value: CodexFileValue, key: CodexFileKey): Record<string, unknown>[] {
  const arr = (value as unknown as Record<string, unknown>)[FILE_ROW_KEY[key].field];
  return Array.isArray(arr) ? (arr as Record<string, unknown>[]) : [];
}

/** Assign rids to rows missing one (healing duplicates), numbering past the
 * highest existing "r<n>". Deterministic per file content, mutates in place. */
export function assignMissingRids(key: CodexFileKey, value: CodexFileValue): void {
  if (FILE_ROW_KEY[key].key !== "rid") return;
  const rows = fileRows(value, key);
  let max = 0;
  const seen = new Set<string>();
  for (const row of rows) {
    const rid = typeof row["rid"] === "string" ? row["rid"] : "";
    if (!rid || seen.has(rid)) {
      delete row["rid"];
      continue;
    }
    seen.add(rid);
    const m = /^r(\d+)$/.exec(rid);
    if (m) max = Math.max(max, parseInt(m[1]!, 10));
  }
  for (const row of rows) {
    if (typeof row["rid"] === "string" && row["rid"]) continue;
    let next = `r${++max}`;
    while (seen.has(next)) next = `r${++max}`;
    row["rid"] = next;
    seen.add(next);
  }
}

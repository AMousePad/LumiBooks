import type { CodexBundle, CodexEntity, CodexFileKey, CodexRelation } from "./schema";
import { CODEX_FILE_KEYS } from "./schema";
import { DEFAULT_CODEX_DIRECTIVES } from "../../shared";
import type { ChatMessage } from "../coverage";
import { renderTranscript } from "../summarizer";

const SCHEMA_TABLE_MODE = `File schemas (JSON):

characters.json / locations.json / things.json
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "", "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Entity sheets describe ONLY the entity itself,
and only its stable, medium-to-long-lived facts - never the state of the current
scene. Never put relationship info on a sheet, that lives in relations.json. An
entity carrying "locked": true is user-owned: never set or drop it.

relations.json
{ "relations": [
  { "rid": "r1", "type": "pair", "a": "char:elias", "b": "char:mara", "kind": "bond",
    "state": "loves her, hides it", "history"?: ["day 12: she saw him kill"] },
  { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:ashford_manor", "kind": "at",
    "state": "hiding in the attic since the murder" },
  { "rid": "r3", "type": "group", "kind": "pact", "members": ["char:a","char:b","char:c"],
    "state": "non-aggression, signed day 12", "roles"?: { "loc:manor": "where" } } ] }
Rows connect ANY entities, not just characters: character-character (bond,
rival, kin), character-thing (owns, seeks, guards), character-location (at,
rules, banished_from), thing-location (hidden_at). Whenever an entity sheet is
tempted to mention another entity, that connection belongs here instead.
Prefer ONE group row whenever a fact is genuinely shared by several entities
(a faction, a pact, a household, a shared secret): it replaces a pile of
redundant pairs and keeps future edits to one row. Use a pair only when the
relationship is purely binary or directional a->b (two pair rows when the two
sides differ). Never store how one member individually feels about another
inside a group row - that stance is its own pair.

Relations coverage (mandatory):
- The table is the story's FULL web, never a hub around one protagonist. Encode
  every standing connection the story establishes between ANY two entities,
  however minor. Side characters' links to each other, to places, and to things
  matter as much as their links to the lead - if two entities are related in any
  way at all, that relation belongs in the table.
- Every named character should end up tied to MULTIPLE other entities
  (characters, locations, things). A character with a single row is usually an
  under-recorded character: sweep the story for their other connections.
- Write "state" to survive the story moving on: name the standing arrangement
  ("owes her a life debt", "banned from the guildhall"), not the scene of the
  moment ("currently arguing in the kitchen"). Anchor pivotal shifts in
  "history" using the story's own dates so the row stays meaningful as it ages.
- Keep every row CURRENT. Each pass, re-check the rows touching the entities in
  the new turns and rewrite any state the story has outdated (demote the old
  state to "history" only when the shift is pivotal). A row that no longer holds
  is stale data: correct it, never leave it standing.`;

const SCHEMA_INLINE_MODE = `File schemas (JSON):

characters.json / locations.json / things.json
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "",
  "ties"?: ["loves Mara, hides it", "owns the silver locket", "hiding at Ashford Manor"], "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Sheets hold only stable, medium-to-long-lived
facts, never the state of the current scene. An entity carrying "locked": true
is user-owned: never set or drop it. Relationships live in each entity's "ties"
list as short present-tense notes - to other characters, to things, and to
places alike. Do NOT write relations.json, it is disabled.
Ties coverage (mandatory): record the story's FULL web, never a hub around one
protagonist - every standing connection an entity has, to side characters,
places, and things alike, so each named character carries several ties. Phrase
ties as standing arrangements that survive scene changes ("owes her a life
debt"), not moment-of-scene notes. Each pass, rewrite any tie the new turns have
outdated: a stale tie is an error, never leave one standing.`;

const SCHEMA_REST = `timeline.json
{ "events": [ { "rid": "r1", "when": "day 12", "event": "Mara sees Elias kill the duke",
  "participants"?: ["char:mara","char:elias"], "where"?: "loc:ashford_manor",
  "causes"?: "she flees the city" } ] }
Major events only, oldest first. "when" uses the story's own reckoning. The
timeline is APPEND-ONLY: record new events as set rows without a rid, and
never rewrite or drop existing events - history does not change behind the
story. Editing an existing row is reserved for an outright factual error or
a reference the validator flags; removals happen only in reconcile or tidy
passes.

threads.json
{ "threads": [ { "rid": "r1", "name": "The stolen crown", "status": "open|stalled|resolved|abandoned",
  "summary": "", "latest"?: "", "planted"?: ["the pawnbroker kept a receipt"] } ],
  "seeds": ["unexplained scar on the ferryman's hand"] }
Threads are storylines. planted/seeds are Chekhov setups awaiting payoff. A
thread you mark resolved leaves your view from the next pass on - the app
archives it for the user - so never re-add a storyline you already resolved.

world.json
{ "entries": [ { "rid": "r1", "topic": "Magic", "facts": ["blood magic costs memories", ...],
  "keywords": ["ritual", "memories", "blood magic"] } ] }
Rules and lore true of the WORLD itself, not any single entity's state. A topic
needs at least one fact - drop the topic when its last fact goes.

knowledge.json
{ "items": [ { "rid": "r1", "fact": "Elias killed the duke",
  "knownBy"?: ["char:mara"], "hiddenFrom"?: ["char:captain"],
  "falseBeliefs"?: [{ "who": "char:captain", "believes": "bandits did it" }],
  "note"?: "",
  "keywords": ["murder", "dagger", "duke"] } ] }
ONLY asymmetric knowledge: secrets, false beliefs, who-knows-what gaps. Every
item needs knownBy, hiddenFrom, or falseBeliefs. Facts every character knows
belong in world or timeline, never here.

Retrieval keywords (mandatory):
Every entity sheet, world entry, and knowledge item carries a "keywords" list of
4-10 tags. Each record is stored as a separate lorebook entry and only enters the
prompt when the recent story mentions one of its keywords, so a record with weak
keywords effectively disappears. Rules:
- Mix generality with specificity: most keywords are SINGLE words the story will
  plausibly say ("locket", "duke", "tower", "murder"). Add a 2-word keyword only
  when the single word would be too ambiguous to pin this record ("north tower"
  when several towers exist). Never longer than 2 words.
- Concrete nouns tied to THIS record: places, objects, epithets, events.
- One concept per keyword, retrievable when mentioned alone.
- The record's own name, aliases, and topic (and a knowledge item's participants)
  match automatically - never repeat them as keywords.
- No abstract themes (love, betrayal, tension), no filler verbs.
- Keep keywords current: when a record's contents change, re-check its keywords.
timeline.json and threads.json need no keywords, they are always in the prompt.`;

/** Tool protocol block, or its strict-JSON twin for connections whose routes
 * can't carry structured tool calls (codexUseTools off). */
function protocolBlock(useTools: boolean): string[] {
  const patchRules = [
    '- "set": rows to add or replace. Each row must be COMPLETE on its own. A row carrying its key (entity "id", or "rid" elsewhere) replaces that existing row; a row without a rid (or with a brand-new entity id) is added. Send ONLY rows that actually changed - every untouched row survives without being resent.',
    '- "drop": keys (ids or rids) of rows to delete.',
    '- "seeds": threads.json only, replaces the whole seeds list when provided.',
    '- "content": the COMPLETE new file, replacing everything in it. Only for a ground-up rewrite of most of a file; never combine it with set or drop.',
  ];
  if (useTools) {
    return [
      "Tools:",
      "- codex_write(file, set?, drop?, seeds?, content?): edit one file.",
      ...patchRules,
      "- codex_done(note): call when the codex is current. If the new turns changed nothing durable, call codex_done without writing.",
      "",
      "Emit ALL of your codex_write calls plus codex_done together in a single response - they run as one batch. Do not narrate, do not explain your edits, just call the tools.",
      "Think briefly. The moment your plan is solid and covers the directives, stop deliberating and emit the calls - re-checking a bulletproof plan again is pure waste.",
      "A rejected write stages nothing at all: fix the validation errors you get back and resend that file's ENTIRE write, every row of it.",
    ];
  }
  return [
    "Output protocol (JSON only, no tools):",
    'Respond with exactly ONE JSON object and nothing else, in this shape:',
    '{ "writes": [ { "file": "characters", "set": [ ...changed rows... ], "drop": ["char:gone"] } ], "done": true, "note": "one short line on what changed" }',
    '"writes" holds one item per file you change. Each item may carry:',
    ...patchRules,
    '- Set "done": true when the codex is current. If the new turns changed nothing durable, respond { "writes": [], "done": true }.',
    "Do not narrate, do not explain your edits, do not wrap the object in prose.",
    "Think briefly. The moment your plan is solid and covers the directives, stop deliberating and emit the object - re-checking a bulletproof plan again is pure waste.",
    "A rejected write stages nothing at all: fix the validation errors you get back and respond with that file's ENTIRE write again, every row of it.",
  ];
}

export function buildCodexSystemPrompt(
  relationsTable: boolean,
  useTools: boolean,
  directivesOverride?: string | null,
): string {
  return [
    directivesOverride?.trim() ? directivesOverride : DEFAULT_CODEX_DIRECTIVES,
    "",
    relationsTable ? SCHEMA_TABLE_MODE : SCHEMA_INLINE_MODE,
    "",
    SCHEMA_REST,
    "",
    ...protocolBlock(useTools),
  ].join("\n");
}

/** File JSON as the agent sees it: resolved threads stay hidden. */
export function agentFileJson(bundle: CodexBundle, key: CodexFileKey): string {
  if (key === "threads") {
    return JSON.stringify({
      threads: bundle.threads.threads.filter((t) => t.status !== "resolved"),
      seeds: bundle.threads.seeds,
    });
  }
  return JSON.stringify(bundle[key]);
}

function lockedEntityIds(bundle: CodexBundle): string[] {
  const out: string[] = [];
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities) if (e.locked === true) out.push(e.id);
  }
  return out;
}

export interface CodexRunNotes {
  reconcile: boolean;
  migrateToTable: boolean;
  migrateToInline: boolean;
  loadProblems: string[];
  /** Files the user froze: shown to the agent so it doesn't try to write them. */
  frozenFiles?: string[];
}

/** Run-specific caveat block shared by every user-message builder. */
function specialNotes(bundle: CodexBundle, notes: CodexRunNotes): string | null {
  const special: string[] = [];
  if (notes.reconcile) {
    special.push(
      "RECONCILE: the story was edited or regenerated behind the codex. Statements in the codex may describe events that no longer happened. Treat the codex as suspect, verify its claims against the turns below, and correct anything the current story contradicts.",
    );
  }
  if (notes.migrateToTable) {
    special.push(
      "MIGRATE: the relations table was just enabled. Lift every \"ties\" note off the entity sheets into relations.json rows, then remove all \"ties\" fields.",
    );
  }
  if (notes.migrateToInline) {
    special.push(
      "MIGRATE: the relations table was just disabled. Fold relations.json into short \"ties\" notes on the involved entity sheets. Do not write relations.json.",
    );
  }
  if (notes.loadProblems.length) {
    special.push(
      `REPAIR: these files were invalid on disk and are shown empty, rebuild them from the story if they held anything: ${notes.loadProblems.join(", ")}.`,
    );
  }
  if (notes.frozenFiles?.length) {
    special.push(
      `FROZEN: the user locked these files, do NOT write them: ${notes.frozenFiles.join(", ")}.`,
    );
  }
  const locked = lockedEntityIds(bundle);
  if (locked.length) {
    special.push(
      `LOCKED: the user owns these entities, do NOT set or drop them: ${locked.join(", ")}.`,
    );
  }
  return special.length ? special.join("\n\n") : null;
}

export function buildCodexUserMessage(
  bundle: CodexBundle,
  chunk: ChatMessage[],
  chunkLabel: string,
  chunkFirstIndex: number,
  notes: CodexRunNotes,
  lore: string | null,
  storySoFar: string | null,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes);
  if (special) parts.push(special);

  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  if (storySoFar) {
    parts.push(`<<STORY SO FAR (chapter summaries, context only - this span is already recorded in the codex)>>\n${storySoFar}`);
  }

  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${agentFileJson(bundle, key)}`);
  }
  parts.push(`<<NEW STORY TURNS (${chunkLabel})>>`);
  // Header numbers carry the chunk's global offset so they agree with the label.
  parts.push(renderTranscript(chunk, true, chunkFirstIndex));
  parts.push("Update the codex now.");
  return parts.join("\n\n");
}

/** Fast catch-up: a batch of chapter summaries replayed as story input. */
export function buildCodexSummaryCatchupMessage(
  bundle: CodexBundle,
  blocks: string[],
  chunkLabel: string,
  notes: CodexRunNotes,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes);
  if (special) parts.push(special);
  parts.push(
    `CATCH-UP FROM SUMMARIES: the story below is compressed chapter summaries covering ${chunkLabel}, not raw turns (raw turns appear only where no chapter covers a span). Update the codex from them. Summaries omit detail: record what is durable, and never invent specifics they do not state.`,
  );
  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${agentFileJson(bundle, key)}`);
  }
  parts.push(`<<STORY (${chunkLabel}, compressed)>>`);
  parts.push(blocks.join("\n\n"));
  parts.push("Update the codex now.");
  return parts.join("\n\n");
}

/** Ultra catch-up: one pass over filed summaries plus the raw tail. */
export function buildCodexUltraMessage(
  bundle: CodexBundle,
  books: string[],
  tailTranscript: string | null,
  chunkLabel: string,
  notes: CodexRunNotes,
  lore: string | null,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes);
  if (special) parts.push(special);
  const shape = books.length && tailTranscript
    ? "The story arrives as its filed summaries, oldest first, followed by the raw newest turns."
    : books.length
      ? "The story arrives as its filed summaries, oldest first."
      : "The story arrives as raw turns.";
  parts.push(
    `CATCH-UP: this single pass covers ${chunkLabel}. ${shape} Update the codex to reflect ALL of it. Summaries omit detail: record what is durable, and never invent specifics they do not state.`,
  );
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${agentFileJson(bundle, key)}`);
  }
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>\n${books.join("\n\n")}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push("Update the codex now.");
  return parts.join("\n\n");
}

/** Refresh pass: rewrite re-enabled files from the story's active context. */
export function buildCodexRefreshMessage(
  bundle: CodexBundle,
  targets: readonly CodexFileKey[],
  books: string[],
  tailTranscript: string | null,
  notes: CodexRunNotes,
  lore: string | null,
  useTools: boolean,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes);
  if (special) parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript
    ? "its filed summaries, oldest first, followed by the raw newest turns"
    : books.length
      ? "its filed summaries, oldest first"
      : "raw turns";
  parts.push(
    `REFRESH PASS: the user re-enabled ${list} after ${targets.length === 1 ? "it" : "they"} missed updates, so ${targets.length === 1 ? "it lags" : "they lag"} the story. The story arrives as ${shape}. Rewrite ONLY the target files as complete new "content" so they fully reflect the story, keeping every schema exactly as specified. Summaries omit detail: record what is durable, and never invent specifics they do not state.`,
  );
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${agentFileJson(bundle, key)}`);
  }
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>\n${books.join("\n\n")}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(useTools
    ? "Rewrite the target files now, then call codex_done."
    : 'Rewrite the target files now, each as full "content" in "writes", and set "done": true.');
  return parts.join("\n\n");
}

/** User message for a tidy pass: compress in place, no new story material. */
export function buildCodexTidyMessage(
  bundle: CodexBundle,
  targets: readonly CodexFileKey[],
  useTools: boolean,
): string {
  const parts: string[] = [];
  parts.push(
    "TIDY PASS: no new story turns this time. Rewrite the target files to be leaner: merge redundant entries, strip filler words and verbose phrasing, drop details that carry no plot weight. You must NOT lose any plot-relevant fact, relationship, timeline event, open thread, or secret - when in doubt, keep it. Keep every schema exactly as specified.",
  );
  parts.push(
    "A tidy is a ground-up rewrite: send each improved file as complete new \"content\" (not set/drop patches).",
  );
  parts.push(
    "While you are in there: any target entity sheet, world entry, or knowledge item missing its \"keywords\" list gets one, following the retrieval keyword rules.",
  );
  const locked = lockedEntityIds(bundle);
  if (locked.length) {
    parts.push(`LOCKED: the user owns these entities, reproduce them untouched: ${locked.join(", ")}.`);
  }
  parts.push(`TARGET FILES: ${targets.map((t) => `${t}.json`).join(", ")}. Do not write any other file.`);
  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${agentFileJson(bundle, key)}`);
  }
  parts.push(useTools
    ? "Rewrite the target files now. Write only files you actually improved, then call codex_done."
    : 'Rewrite the target files now. Put only files you actually improved in "writes", and set "done": true.');
  return parts.join("\n\n");
}

export function verifyNudge(useTools: boolean): string {
  return (
    "Verification pass: sweep every file for stale claims the new turns contradict, compress any row that carries bloat, and drop any row the story invalidated. "
    + (useTools
      ? "Resend corrections if you find anything, otherwise call codex_done."
      : 'Respond with a JSON object: corrections in "writes" if you find anything (else an empty "writes"), and "done": true.')
  );
}

function entityLine(e: CodexEntity): string {
  const bits: string[] = [];
  const skip = new Set(["id", "name", "aliases", "ties", "notes", "keywords", "locked"]);
  if (e.aliases?.length) bits.push(`aka ${e.aliases.join(", ")}`);
  for (const [k, v] of Object.entries(e)) {
    if (skip.has(k.toLowerCase()) || v === undefined) continue;
    if (Array.isArray(v)) bits.push(`${k}: ${v.join(", ")}`);
    else bits.push(`${k}: ${String(v)}`);
  }
  if (e.notes) bits.push(String(e.notes));
  return `- ${e.name} (${e.id})${bits.length ? ` | ${bits.join(" | ")}` : ""}`;
}

const ENTITY_REF_HEAD = /^(?:char|loc|thing):(.+)$/;

/**
 * A ref's display name. An unresolved entity ref (from a hand-saved or
 * migration-repaired file with a dangling reference) is humanized rather than
 * leaked as raw "char:elias" id syntax into the story prompt.
 */
function resolveRefName(names: Map<string, string>, ref: string): string {
  const n = names.get(ref);
  if (n) return n;
  const m = ENTITY_REF_HEAD.exec(ref);
  return m ? m[1]!.replace(/_/g, " ") : ref;
}

function relationLine(r: CodexRelation, names: Map<string, string>): string {
  const nameOf = (ref: string): string => resolveRefName(names, ref);
  if (r.type === "pair") {
    const hist = r.history?.length ? ` (${r.history.join("; ")})` : "";
    return `- ${nameOf(r.a)} -> ${nameOf(r.b)} [${r.kind}]: ${r.state}${hist}`;
  }
  const members = r.members.map((m) => {
    const role = r.roles?.[m];
    return role ? `${nameOf(m)} (${role})` : nameOf(m);
  });
  // Roles may be keyed by non-members (the prompt's own example attaches a
  // location as "where") - they must not vanish from the rendered line.
  const extras = Object.entries(r.roles ?? {})
    .filter(([ref]) => !r.members.includes(ref))
    .map(([ref, role]) => `${role}: ${nameOf(ref)}`);
  const hist = r.history?.length ? ` (${r.history.join("; ")})` : "";
  return `- [${r.kind}] ${members.join(", ")}${extras.length ? ` (${extras.join(", ")})` : ""}: ${r.state}${hist}`;
}

/* ------------------------------------------------- per-record rendering */

/** One codex record rendered for its synced lorebook entry. */
export interface CodexRecordRender {
  /** Stable identity of the record among this chat's synced entries. */
  record: string;
  file: CodexFileKey;
  comment: string;
  content: string;
  /** Activation keywords; empty for constant records. */
  keys: string[];
  constant: boolean;
}

export interface RenderRecordsOptions {
  /** False when the relations file is switched off: entity entries then
   * render without their relation lines. */
  includeRelations: boolean;
}

const ENTITY_FILE_LABEL = {
  characters: "Character",
  locations: "Location",
  things: "Thing",
} as const;

function relationInvolves(r: CodexRelation, id: string): boolean {
  if (r.type === "pair") return r.a === id || r.b === id;
  return r.members.includes(id) || Object.prototype.hasOwnProperty.call(r.roles ?? {}, id);
}

function uniqKeys(parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** FNV-1a hex, for record identities whose text slugs to nothing. */
function fnvHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function recordKey(prefix: string, raw: string, taken: Set<string>): string {
  // Non-Latin text slugs to nothing, so fall back to a hash of the raw text.
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  const base = slug || `h${fnvHex(raw)}`;
  let key = `${prefix}:${base}`;
  let n = 2;
  while (taken.has(key)) key = `${prefix}:${base}_${n++}`;
  taken.add(key);
  return key;
}

/**
 * The codex as retrievable records: one per entity (its relation lines folded
 * in, both directions), one per world topic, one per knowledge item, plus one
 * constant record each for timeline and threads. This is the source shape for
 * the lorebook sync - keys come from names/aliases/participants plus the
 * record's own agent-written keywords.
 */
export function renderCodexRecords(bundle: CodexBundle, opts: RenderRecordsOptions): CodexRecordRender[] {
  const names = new Map<string, string>();
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities) names.set(e.id, e.name);
  }
  const out: CodexRecordRender[] = [];
  const taken = new Set<string>();

  const foldedRelations = new Set<number>();
  for (const fileKey of ["characters", "locations", "things"] as const) {
    const label = ENTITY_FILE_LABEL[fileKey];
    for (const e of bundle[fileKey].entities) {
      const lines = [entityLine(e)];
      for (const t of e.ties ?? []) lines.push(`  * ${t}`);
      if (opts.includeRelations) {
        bundle.relations.relations.forEach((r, i) => {
          if (!relationInvolves(r, e.id)) return;
          foldedRelations.add(i);
          lines.push(relationLine(r, names));
        });
      }
      out.push({
        record: recordKey("ent", e.id, taken),
        file: fileKey,
        comment: `[Codex] ${label}: ${e.name}`,
        content: `[Story Bible - ${label}: ${e.name}]\n${lines.join("\n")}`,
        keys: uniqKeys([e.name, ...(e.aliases ?? []), ...(e.keywords ?? [])]),
        constant: false,
      });
    }
  }

  // Rows whose every endpoint dangles fold under no entity: keep them in one record.
  if (opts.includeRelations) {
    const orphans = bundle.relations.relations.filter((_, i) => !foldedRelations.has(i));
    if (orphans.length > 0) {
      const endpointNames = orphans.flatMap((r) =>
        r.type === "pair" ? [r.a, r.b] : [...r.members, ...Object.keys(r.roles ?? {})],
      ).map((ref) => resolveRefName(names, ref));
      out.push({
        record: "rel:unlinked",
        file: "relations",
        comment: "[Codex] Relations (unlinked)",
        content: `[Story Bible - Relations]\n${orphans.map((r) => relationLine(r, names)).join("\n")}`,
        keys: uniqKeys(endpointNames),
        constant: false,
      });
      taken.add("rel:unlinked");
    }
  }

  for (const w of bundle.world.entries) {
    out.push({
      record: recordKey("world", w.topic, taken),
      file: "world",
      comment: `[Codex] World: ${w.topic}`,
      content: `[Story Bible - World rules: ${w.topic}]\n- ${w.topic}: ${w.facts.join(" | ")}`,
      keys: uniqKeys([w.topic, ...(w.keywords ?? [])]),
      constant: false,
    });
  }

  for (const k of bundle.knowledge.items) {
    const bits: string[] = [];
    if (k.knownBy?.length) bits.push(`known by ${k.knownBy.map((r) => resolveRefName(names, r)).join(", ")}`);
    if (k.hiddenFrom?.length) bits.push(`hidden from ${k.hiddenFrom.map((r) => resolveRefName(names, r)).join(", ")}`);
    for (const b of k.falseBeliefs ?? []) {
      bits.push(`${resolveRefName(names, b.who)} wrongly believes: ${b.believes}`);
    }
    if (k.note) bits.push(k.note);
    // Only ref-shaped participants become activation keys, prose would be junk keys.
    const participants = [
      ...(k.knownBy ?? []),
      ...(k.hiddenFrom ?? []),
      ...(k.falseBeliefs ?? []).map((b) => b.who),
    ].filter((r) => ENTITY_REF_HEAD.test(r)).map((r) => resolveRefName(names, r));
    out.push({
      record: recordKey("know", k.fact, taken),
      file: "knowledge",
      comment: `[Codex] Secret: ${k.fact.slice(0, 60)}`,
      content: `[Story Bible - Who knows what]\n- ${k.fact}${bits.length ? ` (${bits.join("; ")})` : ""}`,
      keys: uniqKeys([...participants, ...(k.keywords ?? [])]),
      constant: false,
    });
  }

  const sections = renderCodexFileSections(bundle);
  if (sections.timeline) {
    out.push({
      record: "timeline",
      file: "timeline",
      comment: "[Codex] Timeline",
      content: `[Story Bible - current story state]\n${sections.timeline}`,
      keys: [],
      constant: true,
    });
  }
  if (sections.threads) {
    out.push({
      record: "threads",
      file: "threads",
      comment: "[Codex] Threads",
      content: `[Story Bible - current story state]\n${sections.threads}`,
      keys: [],
      constant: true,
    });
  }
  return out;
}

/**
 * Denormalized, token-lean text block injected into the story prompt.
 * Normalized at rest, denormalized on the wire.
 */
export function renderCodexForInjection(bundle: CodexBundle): string {
  const rendered = renderCodexFileSections(bundle);
  const sections: string[] = [];
  for (const key of CODEX_FILE_KEYS) {
    const s = rendered[key];
    if (s) sections.push(s);
  }
  // Nothing renderable (e.g. only resolved threads survive) must produce
  // nothing, not a bare header.
  if (sections.length === 0) return "";
  return ["KNOWLEDGE CODEX (current story state, authoritative)", ...sections].join("\n\n");
}

/** One rendered section per file (empty string when the file adds nothing),
 * so token estimates can price exactly what each file injects. */
export function renderCodexFileSections(bundle: CodexBundle): Record<CodexFileKey, string> {
  const names = new Map<string, string>();
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities) names.set(e.id, e.name);
  }
  const out = {} as Record<CodexFileKey, string>;

  const entitySection = (key: CodexFileKey, title: string, entities: CodexEntity[]): void => {
    if (!entities.length) { out[key] = ""; return; }
    const lines = [`== ${title} ==`];
    for (const e of entities) {
      lines.push(entityLine(e));
      for (const t of e.ties ?? []) lines.push(`  * ${t}`);
    }
    out[key] = lines.join("\n");
  };
  entitySection("characters", "Characters", bundle.characters.entities);
  entitySection("locations", "Locations", bundle.locations.entities);
  entitySection("things", "Things", bundle.things.entities);

  out.relations = bundle.relations.relations.length
    ? ["== Relations =="].concat(bundle.relations.relations.map((r) => relationLine(r, names))).join("\n")
    : "";

  if (bundle.timeline.events.length) {
    const lines = ["== Timeline =="];
    for (const e of bundle.timeline.events) {
      const who = e.participants?.length ? ` [${e.participants.map((p) => resolveRefName(names, p)).join(", ")}]` : "";
      const where = e.where ? ` @ ${resolveRefName(names, e.where)}` : "";
      const causes = e.causes ? ` -> ${e.causes}` : "";
      lines.push(`- ${e.when}: ${e.event}${who}${where}${causes}`);
    }
    out.timeline = lines.join("\n");
  } else {
    out.timeline = "";
  }

  // Resolved threads are archive for the UI only: they never enter the
  // prompt or the lorebook mirror.
  const liveThreads = bundle.threads.threads.filter((t) => t.status !== "resolved");
  if (liveThreads.length || bundle.threads.seeds.length) {
    const lines = ["== Threads =="];
    for (const t of liveThreads) {
      const latest = t.latest ? ` | latest: ${t.latest}` : "";
      lines.push(`- ${t.name} (${t.status}): ${t.summary}${latest}`);
      for (const p of t.planted ?? []) lines.push(`  * planted: ${p}`);
    }
    for (const s of bundle.threads.seeds) lines.push(`- planted: ${s}`);
    out.threads = lines.join("\n");
  } else {
    out.threads = "";
  }

  if (bundle.world.entries.length) {
    const lines = ["== World =="];
    for (const w of bundle.world.entries) {
      lines.push(`- ${w.topic}: ${w.facts.join(" | ")}`);
    }
    out.world = lines.join("\n");
  } else {
    out.world = "";
  }

  if (bundle.knowledge.items.length) {
    const lines = ["== Who knows what =="];
    const nameList = (refs: string[] | undefined): string =>
      (refs ?? []).map((r) => resolveRefName(names, r)).join(", ");
    for (const k of bundle.knowledge.items) {
      const bits: string[] = [];
      if (k.knownBy?.length) bits.push(`known by ${nameList(k.knownBy)}`);
      if (k.hiddenFrom?.length) bits.push(`hidden from ${nameList(k.hiddenFrom)}`);
      for (const b of k.falseBeliefs ?? []) {
        bits.push(`${resolveRefName(names, b.who)} wrongly believes: ${b.believes}`);
      }
      if (k.note) bits.push(k.note);
      lines.push(`- ${k.fact} (${bits.join("; ")})`);
    }
    out.knowledge = lines.join("\n");
  } else {
    out.knowledge = "";
  }
  return out;
}

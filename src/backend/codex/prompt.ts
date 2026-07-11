import type { CodexBundle, CodexEntity, CodexFileKey, CodexRelation } from "./schema";
import { CODEX_FILE_KEYS } from "./schema";
import type { ChatMessage } from "../coverage";
import { renderTranscript } from "../summarizer";

const SCHEMA_TABLE_MODE = `File schemas (JSON, write the COMPLETE file every time):

characters.json / locations.json / things.json
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "", "status"?: "", "notes"?: "" } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Entity sheets describe ONLY the entity itself.
Never put relationship info on a sheet, that lives in relations.json.

relations.json
{ "relations": [
  { "type": "pair", "a": "char:elias", "b": "char:mara", "kind": "bond",
    "state": "loves her, hides it", "history"?: ["day 12: she saw him kill"] },
  { "type": "pair", "a": "char:elias", "b": "thing:silver_locket", "kind": "owns",
    "state": "carries it everywhere, would kill to keep it" },
  { "type": "pair", "a": "char:mara", "b": "loc:ashford_manor", "kind": "at",
    "state": "hiding in the attic since the murder" },
  { "type": "group", "kind": "pact", "members": ["char:a","char:b","char:c"],
    "state": "non-aggression, signed day 12", "roles"?: { "loc:manor": "where" } } ] }
Pair rows are the default and connect ANY two entities, not just characters:
character-character (bond, rival, kin, member_of), character-thing (owns, seeks,
created, guards), character-location (at, rules, banished_from), thing-location
(hidden_at). Whenever an entity sheet is tempted to mention another entity, that
connection belongs here as a pair instead. Pairs are directional a->b: use two
rows when the two sides differ. Use a group row ONLY for a genuinely joint fact
that would otherwise need 3+ redundant pairs. NEVER store how individual members
feel about each other in a group row - that is always a pair.`;

const SCHEMA_INLINE_MODE = `File schemas (JSON, write the COMPLETE file every time):

characters.json / locations.json / things.json
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "", "status"?: "",
  "ties"?: ["loves Mara, hides it", "owns the silver locket", "hiding at Ashford Manor"], "notes"?: "" } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Relationships live in each entity's "ties" list
as short present-tense notes - to other characters, to things, and to places
alike. Do NOT write relations.json, it is disabled.`;

const SCHEMA_REST = `timeline.json
{ "events": [ { "when": "day 12", "event": "Mara sees Elias kill the duke",
  "participants"?: ["char:mara","char:elias"], "where"?: "loc:ashford_manor",
  "causes"?: "she flees the city" } ] }
Major events only, oldest first. "when" uses the story's own reckoning.

threads.json
{ "threads": [ { "name": "The stolen crown", "status": "open|stalled|resolved|abandoned",
  "summary": "", "latest"?: "", "planted"?: ["the pawnbroker kept a receipt"] } ],
  "seeds": ["unexplained scar on the ferryman's hand"] }
Threads are storylines. planted/seeds are Chekhov setups awaiting payoff.

world.json
{ "entries": [ { "topic": "Magic", "facts": ["blood magic costs memories", ...] } ] }
Rules and lore true of the WORLD itself, not any single entity's state.

knowledge.json
{ "items": [ { "fact": "Elias killed the duke",
  "knownBy"?: ["char:mara"], "hiddenFrom"?: ["char:captain"],
  "falseBeliefs"?: [{ "who": "char:captain", "believes": "bandits did it" }],
  "note"?: "" } ] }
ONLY asymmetric knowledge: secrets, false beliefs, who-knows-what gaps. Facts every
character knows belong in world or timeline, never here.`;

export function buildCodexSystemPrompt(relationsTable: boolean): string {
  return [
    "You are Memoria's archivist. You maintain the Knowledge Codex: a set of JSON files that together form a perfect snapshot of a roleplay story's PRESENT state. You will receive the current codex files and the newest story turns. Update the codex to reflect the story so far.",
    "",
    "Your three directives, in order:",
    "1. UPDATE - rewrite every section the new turns have outdated, and add what is new and durable.",
    "2. SWEEP - verify nothing stale survived anywhere in any file, not just where you edited.",
    "3. COMPRESS - strip bloat and prose so every record stays lean, rewriting sections when needed, while losing zero information.",
    "",
    "Snapshot rules (absolute):",
    "- The codex describes the present. When something changes, REPLACE the old text entirely.",
    "- Never leave edit residue: no \"was X, now Y\", no \"formerly\", no \"updated:\", no strikethrough hints, no references to previous versions of the codex.",
    "- Story history is not residue. Key past events belong in timeline.json, and a relation's \"history\" list may hold pivotal shifts as story facts. Everywhere else: present tense only.",
    "- Track what is durable. Skip transient scene staging (who is standing where this instant), weather, and verbatim dialogue unless a line is genuinely load-bearing.",
    "- Terse phrases beat sentences. Omit empty optional fields entirely. No filler words.",
    "- Activated lore, when provided, is reference canon: use it for names, spellings, and established facts, but never copy it into the codex. The codex records only what the STORY establishes, changes, or contradicts.",
    "- A STORY SO FAR block, when provided, holds chapter summaries of turns already recorded in the codex. Use it to interpret the new turns, never as new material to add.",
    "",
    relationsTable ? SCHEMA_TABLE_MODE : SCHEMA_INLINE_MODE,
    "",
    SCHEMA_REST,
    "",
    "Tools:",
    "- codex_write(file, content): replace one file with the complete new content. Only call it for files that actually changed.",
    "- codex_done(note): call when the codex is current. If the new turns changed nothing durable, call codex_done without writing.",
    "",
    "Emit ALL of your codex_write calls plus codex_done together in a single response - they run as one batch. Do not narrate, do not explain your edits, just call the tools.",
    "If a write is rejected you will get the validation errors back: fix the file and resend only the rejected files.",
  ].join("\n");
}

export interface CodexRunNotes {
  reconcile: boolean;
  migrateToTable: boolean;
  migrateToInline: boolean;
  loadProblems: string[];
  /** Files the user froze: shown to the agent so it doesn't try to write them. */
  frozenFiles?: string[];
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
  if (special.length) parts.push(special.join("\n\n"));

  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  if (storySoFar) {
    parts.push(`<<STORY SO FAR (chapter summaries, context only - this span is already recorded in the codex)>>\n${storySoFar}`);
  }

  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${JSON.stringify(bundle[key])}`);
  }
  parts.push(`<<NEW STORY TURNS (${chunkLabel})>>`);
  // Header numbers carry the chunk's global offset so they agree with the label.
  parts.push(renderTranscript(chunk, true, chunkFirstIndex));
  parts.push("Update the codex now.");
  return parts.join("\n\n");
}

/** User message for a tidy pass: compress in place, no new story material. */
export function buildCodexTidyMessage(
  bundle: CodexBundle,
  targets: readonly CodexFileKey[],
): string {
  const parts: string[] = [];
  parts.push(
    "TIDY PASS: no new story turns this time. Rewrite the target files to be leaner: merge redundant entries, strip filler words and verbose phrasing, drop details that carry no plot weight. You must NOT lose any plot-relevant fact, relationship, timeline event, open thread, or secret - when in doubt, keep it. Keep every schema exactly as specified.",
  );
  parts.push(`TARGET FILES: ${targets.map((t) => `${t}.json`).join(", ")}. Do not write any other file.`);
  parts.push("<<CURRENT CODEX>>");
  for (const key of CODEX_FILE_KEYS) {
    parts.push(`--- ${key}.json ---\n${JSON.stringify(bundle[key])}`);
  }
  parts.push("Rewrite the target files now. Write only files you actually improved, then call codex_done.");
  return parts.join("\n\n");
}

export const VERIFY_NUDGE =
  "Verification pass: re-read the files you just wrote against directives 2 and 3. Sweep every file for stale claims the new turns contradict, and compress any section that carries bloat. Resend corrected files if you find anything, otherwise call codex_done.";

function entityLine(e: CodexEntity): string {
  const bits: string[] = [];
  const skip = new Set(["id", "name", "aliases", "ties", "notes"]);
  if (e.aliases?.length) bits.push(`aka ${e.aliases.join(", ")}`);
  for (const [k, v] of Object.entries(e)) {
    if (skip.has(k) || v === undefined) continue;
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

/**
 * Denormalized, token-lean text block injected into the story prompt.
 * Normalized at rest, denormalized on the wire.
 */
export function renderCodexForInjection(bundle: CodexBundle): string {
  const rendered = renderCodexFileSections(bundle);
  const sections: string[] = ["KNOWLEDGE CODEX (current story state, authoritative)"];
  for (const key of CODEX_FILE_KEYS) {
    const s = rendered[key];
    if (s) sections.push(s);
  }
  return sections.join("\n\n");
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

  if (bundle.threads.threads.length || bundle.threads.seeds.length) {
    const lines = ["== Threads =="];
    for (const t of bundle.threads.threads) {
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

import type { CodexBundle, CodexEntity, CodexEntityFile, CodexFileKey, CodexRelation } from "./schema";
import { CODEX_FILE_KEYS, LOCKED_FIELD_MASK } from "./schema";
import type { CustomPreset, LMBProfile } from "../../shared";
import { fillPrompt } from "../../prompts/fill";
import { codexTemplateText, type CodexTemplateKey } from "../../prompts/codex/registry";
import type { ChatMessage } from "../coverage";
import { findPresetText, renderTranscript } from "../summarizer";

/**
 * Everything a prompt builder needs to know about this run: which files the
 * agent may see and write (frozen files are omitted wholesale, never
 * mentioned), the relations mode, the transport, and the resolved prompt
 * texts (directives preset + per-template overrides).
 */
export interface CodexPromptCtx {
  activeFiles: ReadonlySet<CodexFileKey>;
  relationsTable: boolean;
  useTools: boolean;
  directives: string;
  overrides: Partial<Record<CodexTemplateKey, string>>;
}

function tpl(ctx: CodexPromptCtx, key: CodexTemplateKey): string {
  return codexTemplateText(key, ctx.overrides as Record<string, string>);
}

/** The one place a run's prompt context is assembled: the selected codex
 * preset supplies the directives AND the per-template overrides (one preset
 * is the complete prompt set), frozen files are subtracted up front. */
export function makeCodexPromptCtx(
  profile: LMBProfile,
  customPresets: CustomPreset[],
  frozenFiles: ReadonlySet<CodexFileKey>,
): CodexPromptCtx {
  const preset = customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey) ?? null;
  return {
    activeFiles: new Set(CODEX_FILE_KEYS.filter((k) => !frozenFiles.has(k))),
    relationsTable: profile.codexRelationsTable,
    useTools: profile.codexUseTools,
    directives: findPresetText(profile, customPresets, "codex"),
    overrides: preset?.templates ?? {},
  };
}

const ENTITY_FILE_KEYS = ["characters", "locations", "things"] as const;

function activeEntityFiles(ctx: CodexPromptCtx): CodexFileKey[] {
  return ENTITY_FILE_KEYS.filter((k) => ctx.activeFiles.has(k));
}

/** The schema section, assembled from per-file fragments so a frozen file's
 * schema never reaches the model at all. */
function schemaBlock(ctx: CodexPromptCtx): string {
  const parts: string[] = ["File schemas (JSON):"];
  const entityFiles = activeEntityFiles(ctx);
  if (entityFiles.length > 0) {
    // The entity template follows the profile's relations MODE, not the frozen
    // state: with the table on but frozen, inline guidance would have the
    // agent write ties the table-mode validator rejects.
    const entityTpl = ctx.relationsTable ? tpl(ctx, "schema_entities_table") : tpl(ctx, "schema_entities_inline");
    parts.push(fillPrompt(entityTpl, { ENTITY_FILES: entityFiles.map((k) => `${k}.json`).join(" / ") }));
  }
  if (ctx.relationsTable && ctx.activeFiles.has("relations")) parts.push(tpl(ctx, "schema_relations"));
  if (ctx.activeFiles.has("timeline")) parts.push(tpl(ctx, "schema_timeline"));
  if (ctx.activeFiles.has("threads")) parts.push(tpl(ctx, "schema_threads"));
  if (ctx.activeFiles.has("world")) parts.push(tpl(ctx, "schema_world"));
  if (ctx.activeFiles.has("knowledge")) parts.push(tpl(ctx, "schema_knowledge"));
  const keyworded = entityFiles.length > 0 || ctx.activeFiles.has("world") || ctx.activeFiles.has("knowledge");
  if (keyworded) parts.push(tpl(ctx, "schema_keywords"));
  return parts.join("\n\n");
}

/** Tool protocol block, or its strict-JSON twin for connections whose routes
 * can't carry structured tool calls (codexUseTools off). */
function protocolBlock(ctx: CodexPromptCtx): string {
  const patchRules = tpl(ctx, "protocol_patch_rules");
  return fillPrompt(tpl(ctx, ctx.useTools ? "protocol_tools" : "protocol_json"), { PATCH_RULES: patchRules });
}

export function buildCodexSystemPrompt(ctx: CodexPromptCtx): string {
  return [ctx.directives, "", schemaBlock(ctx), "", protocolBlock(ctx)].join("\n");
}

/** An entity as the agent sees it: locked fields carry the mask instead of
 * their values, and the lockedFields list itself stays app plumbing. */
function maskLockedFields(e: CodexEntity): CodexEntity {
  const lf = e.lockedFields;
  if (!lf || lf.length === 0) return e;
  const out: CodexEntity = { ...e };
  delete out.lockedFields;
  for (const f of lf) {
    if (f === "id" || f === "name") continue;
    out[f] = Array.isArray(out[f]) ? [LOCKED_FIELD_MASK] : LOCKED_FIELD_MASK;
  }
  return out;
}

/** File JSON as the agent sees it: resolved threads stay hidden, locked
 * fields are masked. */
export function agentFileJson(bundle: CodexBundle, key: CodexFileKey): string {
  if (key === "threads") {
    return JSON.stringify({
      threads: bundle.threads.threads.filter((t) => t.status !== "resolved"),
      seeds: bundle.threads.seeds,
    });
  }
  if (key === "characters" || key === "locations" || key === "things") {
    const file = bundle[key] as CodexEntityFile;
    return JSON.stringify({ entities: file.entities.map(maskLockedFields) });
  }
  return JSON.stringify(bundle[key]);
}

function lockedEntityIds(bundle: CodexBundle, ctx: CodexPromptCtx): string[] {
  const out: string[] = [];
  for (const key of activeEntityFiles(ctx)) {
    for (const e of (bundle[key] as CodexEntityFile).entities) {
      if (e.locked === true) out.push(e.id);
    }
  }
  return out;
}

function lockedFieldEntityIds(bundle: CodexBundle, ctx: CodexPromptCtx): string[] {
  const out: string[] = [];
  for (const key of activeEntityFiles(ctx)) {
    for (const e of (bundle[key] as CodexEntityFile).entities) {
      if (Array.isArray(e.lockedFields) && e.lockedFields.length > 0) out.push(e.id);
    }
  }
  return out;
}

export interface CodexRunNotes {
  reconcile: boolean;
  migrateToTable: boolean;
  migrateToInline: boolean;
  loadProblems: string[];
}

/** Run-specific caveat block shared by every user-message builder. Frozen
 * files are deliberately never mentioned: they are absent from the schema and
 * the codex dump, and naming them would only invite the model to reason about
 * files it cannot touch. */
function specialNotes(bundle: CodexBundle, notes: CodexRunNotes, ctx: CodexPromptCtx): string | null {
  const special: string[] = [];
  if (notes.reconcile) special.push(tpl(ctx, "note_reconcile"));
  if (notes.migrateToTable) special.push(tpl(ctx, "note_migrate_table"));
  if (notes.migrateToInline) special.push(tpl(ctx, "note_migrate_inline"));
  if (notes.loadProblems.length) {
    special.push(fillPrompt(tpl(ctx, "note_repair"), { FILES: notes.loadProblems.join(", ") }));
  }
  const locked = lockedEntityIds(bundle, ctx);
  if (locked.length) {
    special.push(fillPrompt(tpl(ctx, "note_locked"), { IDS: locked.join(", ") }));
  }
  const lockedFields = lockedFieldEntityIds(bundle, ctx);
  if (lockedFields.length) {
    special.push(fillPrompt(tpl(ctx, "note_locked_fields"), { IDS: lockedFields.join(", ") }));
  }
  return special.length ? special.join("\n\n") : null;
}

/** The <<CURRENT CODEX>> dump, active files only. */
function currentCodexParts(bundle: CodexBundle, ctx: CodexPromptCtx): string[] {
  const parts: string[] = ["<<CURRENT CODEX>>"];
  for (const key of CODEX_FILE_KEYS) {
    if (!ctx.activeFiles.has(key)) continue;
    parts.push(`--- ${key}.json ---\n${agentFileJson(bundle, key)}`);
  }
  return parts;
}

export function buildCodexUserMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  chunk: ChatMessage[],
  chunkLabel: string,
  chunkFirstIndex: number,
  notes: CodexRunNotes,
  lore: string | null,
  storySoFar: string | null,
): string {
  const parts: string[] = [];
  // The window warning leads every normal update: the sweep directive must
  // never read "not mentioned in this chunk" as "stale".
  parts.push(tpl(ctx, "note_partial_story"));
  const special = specialNotes(bundle, notes, ctx);
  if (special) parts.push(special);

  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  if (storySoFar) {
    parts.push(`<<STORY SO FAR (chapter summaries, context only - this span is already recorded in the codex)>>\n${storySoFar}`);
  }

  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(`<<NEW STORY TURNS (${chunkLabel}) - the new material to encode>>`);
  // Header numbers carry the chunk's global offset so they agree with the label.
  parts.push(renderTranscript(chunk, true, chunkFirstIndex));
  parts.push(tpl(ctx, "pass_update"));
  return parts.join("\n\n");
}

/** Fast catch-up: a batch of chapter summaries replayed as story input. */
export function buildCodexSummaryCatchupMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  blocks: string[],
  chunkLabel: string,
  notes: CodexRunNotes,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special) parts.push(special);
  parts.push(fillPrompt(tpl(ctx, "pass_catchup_fast"), { CHUNK_LABEL: chunkLabel }));
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(`<<STORY (${chunkLabel}, compressed)>>`);
  parts.push(blocks.join("\n\n"));
  parts.push(tpl(ctx, "pass_update"));
  return parts.join("\n\n");
}

/** Ultra catch-up: one pass over filed summaries plus the raw tail. */
export function buildCodexUltraMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  books: string[],
  tailTranscript: string | null,
  chunkLabel: string,
  notes: CodexRunNotes,
  lore: string | null,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special) parts.push(special);
  const shape = books.length && tailTranscript
    ? "The story arrives as its filed summaries, oldest first, followed by the raw newest turns."
    : books.length
      ? "The story arrives as its filed summaries, oldest first."
      : "The story arrives as raw turns.";
  parts.push(fillPrompt(tpl(ctx, "pass_catchup_ultra"), { CHUNK_LABEL: chunkLabel, STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>\n${books.join("\n\n")}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(tpl(ctx, "pass_update"));
  return parts.join("\n\n");
}

/** Reconcile sweep: the story shrank behind the codex with nothing new to read. */
export function buildCodexReconcileMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  books: string[],
  tailTranscript: string | null,
  notes: CodexRunNotes,
  lore: string | null,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special) parts.push(special);
  const shape = books.length && tailTranscript
    ? "as its filed summaries, oldest first, followed by the raw newest turns"
    : books.length
      ? "as its filed summaries, oldest first"
      : "as raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_reconcile"), { STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>\n${books.join("\n\n")}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(ctx.useTools
    ? "Sweep now. Send corrections as set/drop patches (or full content for a heavy rewrite), then call codex_done - or call codex_done alone if everything holds."
    : 'Sweep now. Respond with a JSON object: corrections in "writes" (patches, or full content for a heavy rewrite) and "done": true - or an empty "writes" with "done": true if everything holds.');
  return parts.join("\n\n");
}

/** Refresh pass: rewrite re-enabled files from the story's active context. */
export function buildCodexRefreshMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  targets: readonly CodexFileKey[],
  books: string[],
  tailTranscript: string | null,
  notes: CodexRunNotes,
  lore: string | null,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special) parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript
    ? "its filed summaries, oldest first, followed by the raw newest turns"
    : books.length
      ? "its filed summaries, oldest first"
      : "raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_refresh"), {
    TARGET_FILES: list,
    IT_THEY: targets.length === 1 ? "it" : "they",
    LAG_PHRASE: targets.length === 1 ? "it lags" : "they lag",
    STORY_SHAPE: shape,
  }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>\n${books.join("\n\n")}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(ctx.useTools
    ? "Rewrite the target files now, then call codex_done."
    : 'Rewrite the target files now, each as full "content" in "writes", and set "done": true.');
  return parts.join("\n\n");
}

/** Rebuild pass: regenerate the target files from the whole story. The caller
 * passes a bundle whose targets are already blanked (locked rows excepted) so
 * the stale contents cannot anchor the rewrite. */
export function buildCodexRebuildMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  targets: readonly CodexFileKey[],
  books: string[],
  tailTranscript: string | null,
  notes: CodexRunNotes,
  lore: string | null,
): string {
  const parts: string[] = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special) parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript
    ? "its filed summaries, oldest first, followed by the raw newest turns"
    : books.length
      ? "its filed summaries, oldest first"
      : "raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_rebuild"), { TARGET_FILES: list, STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>\n${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>\n${books.join("\n\n")}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(ctx.useTools
    ? "Rewrite the target files now, then call codex_done."
    : 'Rewrite the target files now, each as full "content" in "writes", and set "done": true.');
  return parts.join("\n\n");
}

/** User message for a tidy pass: compress in place, no new story material. */
export function buildCodexTidyMessage(
  ctx: CodexPromptCtx,
  bundle: CodexBundle,
  targets: readonly CodexFileKey[],
): string {
  const parts: string[] = [];
  parts.push(tpl(ctx, "pass_tidy"));
  const locked = lockedEntityIds(bundle, ctx);
  if (locked.length) {
    parts.push(fillPrompt(tpl(ctx, "note_locked"), { IDS: locked.join(", ") }));
  }
  const lockedFields = lockedFieldEntityIds(bundle, ctx);
  if (lockedFields.length) {
    parts.push(fillPrompt(tpl(ctx, "note_locked_fields"), { IDS: lockedFields.join(", ") }));
  }
  parts.push(`TARGET FILES: ${targets.map((t) => `${t}.json`).join(", ")}. Do not write any other file.`);
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(ctx.useTools
    ? "Rewrite the target files now. Write only files you actually improved, then call codex_done."
    : 'Rewrite the target files now. Put only files you actually improved in "writes", and set "done": true.');
  return parts.join("\n\n");
}

export function verifyNudge(ctx: CodexPromptCtx): string {
  return (
    tpl(ctx, "pass_verify")
    + " "
    + (ctx.useTools
      ? "Resend corrections if you find anything, otherwise call codex_done."
      : 'Respond with a JSON object: corrections in "writes" if you find anything (else an empty "writes"), and "done": true.')
  );
}

function entityLine(e: CodexEntity): string {
  const bits: string[] = [];
  const skip = new Set(["id", "name", "aliases", "ties", "notes", "keywords", "locked", "lockedfields"]);
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

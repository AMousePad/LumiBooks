/**
 * Every user-editable codex prompt template: stable key, default text, and the
 * UI copy (label, group, How To, fill tokens). The backend assembles prompts
 * through these keys and the Prompts tab renders its editors from this list,
 * so the two can never drift apart.
 *
 * Structural text stays in code on purpose: section headers like
 * <<CURRENT CODEX>>, the TARGET FILES line, and the short transport closing
 * sentences encode the write protocol the validator enforces.
 */
import directivesTxt from "./directives.txt";
import entitiesTableTxt from "./schema/entities-table.txt";
import entitiesInlineTxt from "./schema/entities-inline.txt";
import relationsTxt from "./schema/relations.txt";
import timelineTxt from "./schema/timeline.txt";
import threadsTxt from "./schema/threads.txt";
import worldTxt from "./schema/world.txt";
import knowledgeTxt from "./schema/knowledge.txt";
import keywordsTxt from "./schema/keywords.txt";
import patchRulesTxt from "./protocol/patch-rules.txt";
import protocolToolsTxt from "./protocol/tools.txt";
import protocolJsonTxt from "./protocol/json.txt";
import passUpdateTxt from "./passes/update.txt";
import passVerifyTxt from "./passes/verify.txt";
import passTidyTxt from "./passes/tidy.txt";
import passRefreshTxt from "./passes/refresh.txt";
import passRebuildTxt from "./passes/rebuild.txt";
import passReconcileTxt from "./passes/reconcile.txt";
import passCatchupFastTxt from "./passes/catchup-fast.txt";
import passCatchupUltraTxt from "./passes/catchup-ultra.txt";
import notePartialStoryTxt from "./notes/partial-story.txt";
import noteReconcileTxt from "./notes/reconcile.txt";
import noteMigrateTableTxt from "./notes/migrate-table.txt";
import noteMigrateInlineTxt from "./notes/migrate-inline.txt";
import noteRepairTxt from "./notes/repair.txt";
import noteLockedTxt from "./notes/locked.txt";
import noteLockedFieldsTxt from "./notes/locked-fields.txt";

/** The directives block is preset-driven (Tuning -> Prompts -> Codex), not an
 * override, so it lives outside the template list. */
export const CODEX_DIRECTIVES_DEFAULT = directivesTxt;

export type CodexTemplateKey =
  | "schema_entities_table"
  | "schema_entities_inline"
  | "schema_relations"
  | "schema_timeline"
  | "schema_threads"
  | "schema_world"
  | "schema_knowledge"
  | "schema_keywords"
  | "protocol_patch_rules"
  | "protocol_tools"
  | "protocol_json"
  | "pass_update"
  | "pass_verify"
  | "pass_tidy"
  | "pass_refresh"
  | "pass_rebuild"
  | "pass_reconcile"
  | "pass_catchup_fast"
  | "pass_catchup_ultra"
  | "note_partial_story"
  | "note_reconcile"
  | "note_migrate_table"
  | "note_migrate_inline"
  | "note_repair"
  | "note_locked"
  | "note_locked_fields";

export type CodexTemplateGroup = "File schemas" | "Write protocol" | "Pass instructions" | "Run notes";

export interface CodexTemplateVar {
  token: string;
  meaning: string;
}

export interface CodexTemplateDef {
  key: CodexTemplateKey;
  label: string;
  group: CodexTemplateGroup;
  /** Shown in the UI's How To expander. Plain language, what breaks if misused. */
  howTo: string;
  vars: CodexTemplateVar[];
  defaultText: string;
}

const SCHEMA_HOWTO_TAIL =
  "The JSON shape shown here must match what the validator accepts. You can reword the guidance freely. If you change the shape itself, the agent's writes will be rejected until it matches the validator again.";

export const CODEX_TEMPLATES: readonly CodexTemplateDef[] = [
  {
    key: "schema_entities_table",
    label: "Entity sheets (relations table on)",
    group: "File schemas",
    howTo: `Describes characters.json, locations.json, and things.json when the relations table is enabled. Relationship info is directed to relations.json. ${SCHEMA_HOWTO_TAIL}`,
    vars: [{ token: "{{ENTITY_FILES}}", meaning: "the entity files active this run, e.g. characters.json / locations.json" }],
    defaultText: entitiesTableTxt,
  },
  {
    key: "schema_entities_inline",
    label: "Entity sheets (relations table off)",
    group: "File schemas",
    howTo: `Describes the entity files when the relations table is disabled. Relationships live as "ties" notes on each sheet instead. ${SCHEMA_HOWTO_TAIL}`,
    vars: [{ token: "{{ENTITY_FILES}}", meaning: "the entity files active this run" }],
    defaultText: entitiesInlineTxt,
  },
  {
    key: "schema_relations",
    label: "Relations table",
    group: "File schemas",
    howTo: `Describes relations.json and the coverage rules that push the agent to record the story's full web. Only sent when the relations table is enabled and not frozen. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: relationsTxt,
  },
  {
    key: "schema_timeline",
    label: "Timeline",
    group: "File schemas",
    howTo: `Describes timeline.json, including the append-only rule the app also enforces on normal runs. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: timelineTxt,
  },
  {
    key: "schema_threads",
    label: "Threads",
    group: "File schemas",
    howTo: `Describes threads.json. Resolved threads are archived by the app and hidden from the agent, and this text tells it not to re-add them. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: threadsTxt,
  },
  {
    key: "schema_world",
    label: "World rules",
    group: "File schemas",
    howTo: `Describes world.json. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: worldTxt,
  },
  {
    key: "schema_knowledge",
    label: "Secrets",
    group: "File schemas",
    howTo: `Describes knowledge.json. The validator rejects items without knownBy, hiddenFrom, or falseBeliefs, and this text explains that rule to the agent. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: knowledgeTxt,
  },
  {
    key: "schema_keywords",
    label: "Retrieval keywords",
    group: "File schemas",
    howTo: "The rules for the keywords lists on entity sheets, world entries, and knowledge items. Weak keywords make records unreachable, since each record only enters the story prompt when a keyword matches recent messages.",
    vars: [],
    defaultText: keywordsTxt,
  },
  {
    key: "protocol_patch_rules",
    label: "Patch rules (set / drop / content)",
    group: "Write protocol",
    howTo: "The shared explanation of set, drop, seeds, and content, embedded into both protocol blocks below. The app really does merge patches this way, so keep the described behavior accurate or the agent will send writes that do the wrong thing.",
    vars: [],
    defaultText: patchRulesTxt,
  },
  {
    key: "protocol_tools",
    label: "Protocol (tool calls)",
    group: "Write protocol",
    howTo: "Sent when the profile uses tool calls. It names the codex_write and codex_done tools the app registers, so those names must stay. It also defines the <think> scratchpad convention for models without native reasoning.",
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: protocolToolsTxt,
  },
  {
    key: "protocol_json",
    label: "Protocol (JSON mode)",
    group: "Write protocol",
    howTo: 'Sent when the profile writes strict JSON instead of tool calls. The reply is parsed for a "writes" array and a "done" flag, so that shape must stay.',
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: protocolJsonTxt,
  },
  {
    key: "pass_update",
    label: "Task closing block",
    group: "Pass instructions",
    howTo: "The closing block of every normal update and catch-up message. It sits after the long story text on purpose, regrounding the agent in the three passes and the scratchpad right before it answers.",
    vars: [],
    defaultText: passUpdateTxt,
  },
  {
    key: "pass_verify",
    label: "Verification nudge",
    group: "Pass instructions",
    howTo: "Sent as an extra round after a clean update when Thorough mode is on. A short transport-specific closing is appended by the app.",
    vars: [],
    defaultText: passVerifyTxt,
  },
  {
    key: "pass_tidy",
    label: "Tidy pass",
    group: "Pass instructions",
    howTo: "The instruction block for Tidy up. The app appends the target file list, the locked entity note, the current codex, and the closing line.",
    vars: [],
    defaultText: passTidyTxt,
  },
  {
    key: "pass_refresh",
    label: "Refresh pass",
    group: "Pass instructions",
    howTo: "Sent when re-enabled records catch up after being frozen. The targets must come back as complete file rewrites, and this text says so.",
    vars: [
      { token: "{{TARGET_FILES}}", meaning: "the files being refreshed" },
      { token: "{{IT_THEY}}", meaning: '"it" or "they" to match the target count' },
      { token: "{{LAG_PHRASE}}", meaning: '"it lags" or "they lag" to match the target count' },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged, e.g. filed summaries plus raw turns" },
    ],
    defaultText: passRefreshTxt,
  },
  {
    key: "pass_rebuild",
    label: "Rebuild pass",
    group: "Pass instructions",
    howTo: "Sent when a category's Rebuild button regenerates that file from the whole story. The target shows as empty (locked rows excepted) and must come back as a complete rewrite. The file on disk is only replaced when the pass succeeds, and the cursor does not move.",
    vars: [
      { token: "{{TARGET_FILES}}", meaning: "the files being rebuilt" },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" },
    ],
    defaultText: passRebuildTxt,
  },
  {
    key: "pass_reconcile",
    label: "Reconcile sweep",
    group: "Pass instructions",
    howTo: "Sent when messages were deleted behind the codex and nothing new is left to read. The agent checks every claim against the surviving story.",
    vars: [{ token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }],
    defaultText: passReconcileTxt,
  },
  {
    key: "pass_catchup_fast",
    label: "Fast catch-up",
    group: "Pass instructions",
    howTo: "The preamble for each fast catch-up batch, which replays filed chapter summaries instead of raw turns.",
    vars: [{ token: "{{CHUNK_LABEL}}", meaning: "the message range this batch covers" }],
    defaultText: passCatchupFastTxt,
  },
  {
    key: "pass_catchup_ultra",
    label: "Ultra catch-up",
    group: "Pass instructions",
    howTo: "The preamble for the single-pass ultra catch-up over every filed summary plus the raw tail.",
    vars: [
      { token: "{{CHUNK_LABEL}}", meaning: "the message range covered" },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" },
    ],
    defaultText: passCatchupUltraTxt,
  },
  {
    key: "note_partial_story",
    label: "Partial view guard",
    group: "Run notes",
    howTo: "Prepended to every normal update. The agent only sees a window of the story, and this is the guard that keeps it from rewriting or deleting records the visible turns simply do not mention.",
    vars: [],
    defaultText: notePartialStoryTxt,
  },
  {
    key: "note_reconcile",
    label: "Reconcile warning",
    group: "Run notes",
    howTo: "Prepended when edits or deletions were detected behind the codex cursor, so the agent treats existing records as suspect.",
    vars: [],
    defaultText: noteReconcileTxt,
  },
  {
    key: "note_migrate_table",
    label: "Migration to relations table",
    group: "Run notes",
    howTo: "Prepended on the first run after the relations table is switched on. The app verifies the migration actually happened, so keep the instruction intact.",
    vars: [],
    defaultText: noteMigrateTableTxt,
  },
  {
    key: "note_migrate_inline",
    label: "Migration to inline ties",
    group: "Run notes",
    howTo: "Prepended on the first run after the relations table is switched off.",
    vars: [],
    defaultText: noteMigrateInlineTxt,
  },
  {
    key: "note_repair",
    label: "Repair warning",
    group: "Run notes",
    howTo: "Prepended when files on disk were unreadable and are shown empty.",
    vars: [{ token: "{{FILES}}", meaning: "the unreadable files" }],
    defaultText: noteRepairTxt,
  },
  {
    key: "note_locked",
    label: "Locked entities",
    group: "Run notes",
    howTo: "Prepended when entities are locked. The app also reverts any write that touches a locked entity.",
    vars: [{ token: "{{IDS}}", meaning: "the locked entity ids" }],
    defaultText: noteLockedTxt,
  },
  {
    key: "note_locked_fields",
    label: "Locked fields",
    group: "Run notes",
    howTo: 'Prepended when individual fields are locked on an entity. Those fields show "Locked, do not edit" to the agent instead of their contents, and the app restores the real values on every write.',
    vars: [{ token: "{{IDS}}", meaning: "the entities carrying locked fields" }],
    defaultText: noteLockedFieldsTxt,
  },
] as const;

export const CODEX_TEMPLATE_KEYS: readonly CodexTemplateKey[] = CODEX_TEMPLATES.map((t) => t.key);

export function isCodexTemplateKey(v: unknown): v is CodexTemplateKey {
  return typeof v === "string" && (CODEX_TEMPLATE_KEYS as readonly string[]).includes(v);
}

const BY_KEY = new Map(CODEX_TEMPLATES.map((t) => [t.key, t] as const));

/** The effective text for one template: the profile's override, or the default. */
export function codexTemplateText(key: CodexTemplateKey, overrides: Record<string, string>): string {
  const o = overrides[key];
  if (typeof o === "string" && o.trim()) return o;
  return BY_KEY.get(key)!.defaultText;
}

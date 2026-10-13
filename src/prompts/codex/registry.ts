import { t as tr } from "../../i18n";
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
import protocolToolsSequentialTxt from "./protocol/tools-sequential.txt";
import protocolJsonTxt from "./protocol/json.txt";
import protocolJsonSequentialTxt from "./protocol/json-sequential.txt";
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
  | "protocol_tools_sequential"
  | "protocol_json"
  | "protocol_json_sequential"
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
  tr("prompts.codex.registry.schemaHowtoTail");

export const CODEX_TEMPLATES: readonly CodexTemplateDef[] = [
  {
    key: "schema_entities_table",
    label: tr("prompts.codex.registry.codexTemplates.entitySheetsRelationsTableOn"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesCharactersJsonLocationsJsonAndThings", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [{ token: "{{ENTITY_FILES}}", meaning: tr("prompts.codex.registry.codexTemplates.theEntityFilesActiveThisRunE") }],
    defaultText: entitiesTableTxt,
  },
  {
    key: "schema_entities_inline",
    label: tr("prompts.codex.registry.codexTemplates.entitySheetsRelationsTableOff"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesTheEntityFilesWhenTheRelations", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [{ token: "{{ENTITY_FILES}}", meaning: tr("prompts.codex.registry.codexTemplates.theEntityFilesActiveThisRun") }],
    defaultText: entitiesInlineTxt,
  },
  {
    key: "schema_relations",
    label: tr("prompts.codex.registry.codexTemplates.relationsTable"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesRelationsJsonAndTheCoverageRules", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: relationsTxt,
  },
  {
    key: "schema_timeline",
    label: tr("prompts.codex.registry.codexTemplates.timeline"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesTimelineJsonIncludingTheAppendOnly", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: timelineTxt,
  },
  {
    key: "schema_threads",
    label: tr("prompts.codex.registry.codexTemplates.threads"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesThreadsJsonResolvedThreadsAreArchived", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: threadsTxt,
  },
  {
    key: "schema_world",
    label: tr("prompts.codex.registry.codexTemplates.worldRules"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesWorldJson", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: worldTxt,
  },
  {
    key: "schema_knowledge",
    label: tr("prompts.codex.registry.codexTemplates.secrets"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.describesKnowledgeJsonTheValidatorRejectsItems", { schemaHowtoTail: SCHEMA_HOWTO_TAIL }),
    vars: [],
    defaultText: knowledgeTxt,
  },
  {
    key: "schema_keywords",
    label: tr("prompts.codex.registry.codexTemplates.retrievalKeywords"),
    group: "File schemas",
    howTo: tr("prompts.codex.registry.codexTemplates.theRulesForTheKeywordsListsOn"),
    vars: [],
    defaultText: keywordsTxt,
  },
  {
    key: "protocol_patch_rules",
    label: tr("prompts.codex.registry.codexTemplates.patchRulesSetDropContent"),
    group: "Write protocol",
    howTo: tr("prompts.codex.registry.codexTemplates.theSharedExplanationOfSetDropSeeds"),
    vars: [],
    defaultText: patchRulesTxt,
  },
  {
    key: "protocol_tools",
    label: tr("prompts.codex.registry.codexTemplates.protocolToolCalls"),
    group: "Write protocol",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenTheProfileUsesToolCalls"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: tr("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: protocolToolsTxt,
  },
  {
    key: "protocol_tools_sequential",
    label: tr("prompts.codex.registry.codexTemplates.protocolToolCallsOneFileAtA"),
    group: "Write protocol",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenTheProfileUsesToolCalls2"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: tr("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: protocolToolsSequentialTxt,
  },
  {
    key: "protocol_json",
    label: tr("prompts.codex.registry.codexTemplates.protocolJsonMode"),
    group: "Write protocol",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenTheProfileWritesStrictJson"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: tr("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: protocolJsonTxt,
  },
  {
    key: "protocol_json_sequential",
    label: tr("prompts.codex.registry.codexTemplates.protocolJsonModeOneFileAtA"),
    group: "Write protocol",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenTheProfileWritesStrictJson2"),
    vars: [{ token: "{{PATCH_RULES}}", meaning: tr("prompts.codex.registry.codexTemplates.thePatchRulesTemplateAbove") }],
    defaultText: protocolJsonSequentialTxt,
  },
  {
    key: "pass_update",
    label: tr("prompts.codex.registry.codexTemplates.taskClosingBlock"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.theClosingBlockOfEveryNormalUpdate"),
    vars: [],
    defaultText: passUpdateTxt,
  },
  {
    key: "pass_verify",
    label: tr("prompts.codex.registry.codexTemplates.verificationNudge"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.sentAsAnExtraRoundAfterA"),
    vars: [],
    defaultText: passVerifyTxt,
  },
  {
    key: "pass_tidy",
    label: tr("prompts.codex.registry.codexTemplates.tidyPass"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.theInstructionBlockForTidyUpThe"),
    vars: [],
    defaultText: passTidyTxt,
  },
  {
    key: "pass_refresh",
    label: tr("prompts.codex.registry.codexTemplates.refreshPass"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenReEnabledRecordsCatchUp"),
    vars: [
      { token: "{{TARGET_FILES}}", meaning: tr("prompts.codex.registry.codexTemplates.theFilesBeingRefreshed") },
      { token: "{{IT_THEY}}", meaning: tr("prompts.codex.registry.codexTemplates.itOrTheyToMatchTheTarget") },
      { token: "{{LAG_PHRASE}}", meaning: tr("prompts.codex.registry.codexTemplates.itLagsOrTheyLagToMatch") },
      { token: "{{STORY_SHAPE}}", meaning: tr("prompts.codex.registry.codexTemplates.howTheStoryInputIsArrangedE") },
    ],
    defaultText: passRefreshTxt,
  },
  {
    key: "pass_rebuild",
    label: tr("prompts.codex.registry.codexTemplates.rebuildPass"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenACategorySRebuildButton"),
    vars: [
      { token: "{{TARGET_FILES}}", meaning: tr("prompts.codex.registry.codexTemplates.theFilesBeingRebuilt") },
      { token: "{{STORY_SHAPE}}", meaning: tr("prompts.codex.registry.codexTemplates.howTheStoryInputIsArranged") },
    ],
    defaultText: passRebuildTxt,
  },
  {
    key: "pass_reconcile",
    label: tr("prompts.codex.registry.codexTemplates.reconcileSweep"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.sentWhenMessagesWereDeletedBehindThe"),
    vars: [{ token: "{{STORY_SHAPE}}", meaning: tr("prompts.codex.registry.codexTemplates.howTheStoryInputIsArranged") }],
    defaultText: passReconcileTxt,
  },
  {
    key: "pass_catchup_fast",
    label: tr("prompts.codex.registry.codexTemplates.fastCatchUp"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.thePreambleForEachFastCatchUp"),
    vars: [{ token: "{{CHUNK_LABEL}}", meaning: tr("prompts.codex.registry.codexTemplates.theMessageRangeThisBatchCovers") }],
    defaultText: passCatchupFastTxt,
  },
  {
    key: "pass_catchup_ultra",
    label: tr("prompts.codex.registry.codexTemplates.ultraCatchUp"),
    group: "Pass instructions",
    howTo: tr("prompts.codex.registry.codexTemplates.thePreambleForTheSinglePassUltra"),
    vars: [
      { token: "{{CHUNK_LABEL}}", meaning: tr("prompts.codex.registry.codexTemplates.theMessageRangeCovered") },
      { token: "{{STORY_SHAPE}}", meaning: tr("prompts.codex.registry.codexTemplates.howTheStoryInputIsArranged") },
    ],
    defaultText: passCatchupUltraTxt,
  },
  {
    key: "note_partial_story",
    label: tr("prompts.codex.registry.codexTemplates.partialViewGuard"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedToEveryNormalUpdateTheAgent"),
    vars: [],
    defaultText: notePartialStoryTxt,
  },
  {
    key: "note_reconcile",
    label: tr("prompts.codex.registry.codexTemplates.reconcileWarning"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedWhenEditsOrDeletionsWereDetected"),
    vars: [],
    defaultText: noteReconcileTxt,
  },
  {
    key: "note_migrate_table",
    label: tr("prompts.codex.registry.codexTemplates.migrationToRelationsTable"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedOnTheFirstRunAfterThe"),
    vars: [],
    defaultText: noteMigrateTableTxt,
  },
  {
    key: "note_migrate_inline",
    label: tr("prompts.codex.registry.codexTemplates.migrationToInlineTies"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedOnTheFirstRunAfterThe2"),
    vars: [],
    defaultText: noteMigrateInlineTxt,
  },
  {
    key: "note_repair",
    label: tr("prompts.codex.registry.codexTemplates.repairWarning"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedWhenFilesOnDiskWereUnreadable"),
    vars: [{ token: "{{FILES}}", meaning: tr("prompts.codex.registry.codexTemplates.theUnreadableFiles") }],
    defaultText: noteRepairTxt,
  },
  {
    key: "note_locked",
    label: tr("prompts.codex.registry.codexTemplates.lockedEntities"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedWhenEntitiesAreLockedTheApp"),
    vars: [{ token: "{{IDS}}", meaning: tr("prompts.codex.registry.codexTemplates.theLockedEntityIds") }],
    defaultText: noteLockedTxt,
  },
  {
    key: "note_locked_fields",
    label: tr("prompts.codex.registry.codexTemplates.lockedFields"),
    group: "Run notes",
    howTo: tr("prompts.codex.registry.codexTemplates.prependedWhenIndividualFieldsAreLockedOn"),
    vars: [{ token: "{{IDS}}", meaning: tr("prompts.codex.registry.codexTemplates.theEntitiesCarryingLockedFields") }],
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

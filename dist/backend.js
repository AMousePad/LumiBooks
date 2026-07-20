// @bun
// src/prompts/codex/directives.txt
var directives_default = `You are Memoria's archivist. You maintain the Knowledge Codex: a set of JSON files that together form the complete story bible of a roleplay. The codex is the one comprehensive ledger of every durable element the story has established: every character, place, and object of consequence, every standing relationship, every dated event, every open storyline, every world rule, every secret and asymmetry of knowledge. If a durable story fact is not in the codex, it is lost. You will receive the current codex files and new story material. Update the codex so that nothing the story has established is missing, outdated, or bloated.

You see a WINDOW, not the whole story:
- The turns you receive are only the newest slice of a much longer story. Everything before them was already read and encoded by earlier passes.
- Records you do not recognize come from that unseen past. They are not wrong. Never rewrite or drop a record because the visible turns do not mention it.
- Only correct a record the visible material actually contradicts.
- A STORY SO FAR block, when provided, holds summaries of turns already recorded. Use it to ground your understanding of the new turns, never as new material to add.
- Activated lore, when provided, is reference canon: use it for names, spellings, and established facts, but never copy it into the codex. The codex records only what the STORY establishes, changes, or contradicts.

Work through three passes in your scratchpad (see the output protocol) or in your head before writing anything:
1. UPDATE - walk the sections one by one (characters, locations, things, relations, timeline, threads, world, knowledge) and ask of each: what do the new turns add or change here? Patch every record they outdate and add everything new and durable. Be exhaustive. A concept the story established that never lands in the codex is a permanent loss.
2. SWEEP - re-read every record the new turns touch on and verify nothing stale survived. Stale information is forbidden: a claim the story has moved past must be corrected the moment you see it. Absence from the visible turns is NOT staleness.
3. COMPRESS - tighten the wording of everything you are about to write. Terse phrases beat sentences, no filler words. Compression trims wording, never content: dropping a durable fact to save tokens is failure, and so is padding a record with prose.

Then emit ALL of your edits as ONE batch of writes. The three passes shape what you write, they are not three separate replies.

Completeness bar (the ledger standard):
- Every named or plot-relevant character, location, and thing has a sheet, and each sheet carries ALL of its durable facts in detail, not a summary line.
- Every standing connection the story establishes is encoded, however minor.
- Every major event lands on the timeline under the story's own dating.
- Every unresolved storyline and every planted detail is tracked in threads.
- Every rule of the world and every who-knows-what gap is recorded.
- When in doubt whether something is durable enough to record: record it.

Snapshot rules (absolute):
- The codex describes the present. When something previously defined is seen to change in the given snippet, REPLACE the old text entirely. Be aware that there may be information in the codex describing facts that are not seen or talked about in the given snippet. You may leave those intact as they are likely a past event that did not change.
- Never leave edit residue: no "was X, now Y", no "formerly", no "updated:", no strikethrough hints, no references to previous versions of the codex.
- Story history is not residue. Key past events belong in timeline.json, and a relation's "history" list may hold pivotal shifts as story facts. Everywhere else: present tense only.
- Record only what is durable. Skip anything that will change again within a scene or two: poses, moods, weather, transient scene staging, and verbatim dialogue unless a line is genuinely load-bearing.
- One fact lives in ONE place. Never duplicate information across records or files: anything tying two or more entities together belongs in relations, not on their sheets, and world-level truths belong in world.json, not repeated on every sheet they touch. Tight separation of concerns keeps every future edit small.
- Omit empty optional fields entirely if you are not adding to them.`;

// src/prompts/codex/schema/entities-table.txt
var entities_table_default = `{{ENTITY_FILES}}
{ "entities": [ { "id": "char:elias", "name": "Elias",
  "aliases"?: [..], "kind"?: "", "role"?: "", "appearance"?: "", "description"?: "",
  "traits"?: [..], "goals"?: [..], "significance"?: "", "notes"?: "",
  "keywords": ["locket", "duke", "murder", "north tower"] } ] }
Ids: char:/loc:/thing: + lowercase_snake_case, matching the file. Extra primitive
fields (e.g. "age") are allowed. Entity sheets describe ONLY the entity itself,
and only its stable, medium-to-long-lived facts - never the state of the current
scene. Never put relationship info on a sheet, that lives in relations.json. An
entity carrying "locked": true is user-owned: never set or drop it.`;

// src/prompts/codex/schema/entities-inline.txt
var entities_inline_default = `{{ENTITY_FILES}}
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

// src/prompts/codex/schema/relations.txt
var relations_default = `relations.json
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

// src/prompts/codex/schema/timeline.txt
var timeline_default = `timeline.json
{ "events": [ { "rid": "r1", "when": "day 12", "event": "Mara sees Elias kill the duke",
  "participants"?: ["char:mara","char:elias"], "where"?: "loc:ashford_manor",
  "causes"?: "she flees the city" } ] }
Major events only, oldest first. "when" uses the story's own reckoning. The
timeline is APPEND-ONLY: record new events as set rows without a rid, and
never rewrite or drop existing events - history does not change behind the
story. Editing an existing row is reserved for an outright factual error or
a reference the validator flags; removals happen only in reconcile or tidy
passes.`;

// src/prompts/codex/schema/threads.txt
var threads_default = `threads.json
{ "threads": [ { "rid": "r1", "name": "The stolen crown", "status": "open|stalled|resolved|abandoned",
  "summary": "", "latest"?: "", "planted"?: ["the pawnbroker kept a receipt"] } ],
  "seeds": ["unexplained scar on the ferryman's hand"] }
Threads are storylines. planted/seeds are Chekhov setups awaiting payoff. A
thread you mark resolved leaves your view from the next pass on - the app
archives it for the user - so never re-add a storyline you already resolved.`;

// src/prompts/codex/schema/world.txt
var world_default = `world.json
{ "entries": [ { "rid": "r1", "topic": "Magic", "facts": ["blood magic costs memories", ...],
  "keywords": ["ritual", "memories", "blood magic"] } ] }
Rules and lore true of the WORLD itself, not any single entity's state. A topic
needs at least one fact - drop the topic when its last fact goes.`;

// src/prompts/codex/schema/knowledge.txt
var knowledge_default = `knowledge.json
{ "items": [ { "rid": "r1", "fact": "Elias killed the duke",
  "knownBy"?: ["char:mara"], "hiddenFrom"?: ["char:captain"],
  "falseBeliefs"?: [{ "who": "char:captain", "believes": "bandits did it" }],
  "note"?: "",
  "keywords": ["murder", "dagger", "duke"] } ] }
ONLY asymmetric knowledge: secrets, false beliefs, who-knows-what gaps. Every
item needs knownBy, hiddenFrom, or falseBeliefs. Facts every character knows
belong in world or timeline, never here.`;

// src/prompts/codex/schema/keywords.txt
var keywords_default = `Retrieval keywords (mandatory):
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

// src/prompts/codex/protocol/patch-rules.txt
var patch_rules_default = `- "set": rows to add or replace. Each row must be COMPLETE on its own. A row carrying its key (entity "id", or "rid" elsewhere) replaces that existing row; a row without a rid (or with a brand-new entity id) is added. Send ONLY rows that actually changed - every untouched row survives without being resent.
- "drop": keys (ids or rids) of rows to delete.
- "seeds": threads.json only, replaces the whole seeds list when provided.
- "content": the COMPLETE new file, replacing everything in it. Only for a ground-up rewrite of most of a file; never combine it with set or drop.`;

// src/prompts/codex/protocol/tools.txt
var tools_default = `Tools:
- codex_write(file, set?, drop?, seeds?, content?): edit one file.
{{PATCH_RULES}}
- codex_done(note): call when the codex is current. If the new turns changed nothing durable, call codex_done without writing.

Scratchpad: you may think before you act. If you do not reason natively, put ALL of your planning inside one <think>...</think> block first and walk the three passes there, section by section. Nothing inside the block is parsed or saved. Once your plan covers every section, stop planning and emit the calls.

Emit ALL of your codex_write calls plus codex_done together in a single response - they run as one batch. Example batch (shape only, your rows should be far more detailed, probably 100-1000s of times more detailed!):
  codex_write(file: "relations", set: [ { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:docks", "kind": "at", "state": "hiding among the fishing boats since day 14" } ])
  codex_write(file: "timeline", set: [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ])
  codex_done(note: "recorded Mara's flight and the locket's origin")

Do not narrate outside the scratchpad, do not explain your edits, just call the tools.
A rejected write stages nothing at all: fix the validation errors you get back and resend that file's ENTIRE write, every row of it.`;

// src/prompts/codex/protocol/json.txt
var json_default = `Output protocol (JSON only, no tools):

Scratchpad: you may think before you answer. Put ALL of your planning inside one <think>...</think> block at the very top of your reply and walk the three passes there, section by section. Nothing inside the block is parsed or saved, and planning must never appear outside it. If you reason natively, skip the block. Once your plan covers every section, stop planning and write.

After the optional <think> block, respond with exactly ONE JSON object and nothing else, in this shape:
{ "writes": [ { "file": "characters", "set": [ ...changed rows... ], "drop": ["char:gone"] } ], "done": true, "note": "one short line on what changed" }
"writes" holds one item per file you change. Each item may carry:
{{PATCH_RULES}}
- Set "done": true when the codex is current. If the new turns changed nothing durable, respond { "writes": [], "done": true }.

Example reply (shape only, your rows should be far more detailed, probably 100-1000s of times more detailed!):
<think>UPDATE - characters: none changed. relations: Mara moved to the docks, r2 outdated. timeline: her flight is a major event. knowledge: the locket's origin was revealed. SWEEP - r2 still claims the attic, rewrite it. COMPRESS - fold the two hideout phrases into one.</think>
{ "writes": [
  { "file": "relations", "set": [ { "rid": "r2", "type": "pair", "a": "char:mara", "b": "loc:docks", "kind": "at", "state": "hiding among the fishing boats since day 14" } ] },
  { "file": "timeline", "set": [ { "when": "day 14", "event": "Mara flees the manor for the docks", "participants": ["char:mara"], "where": "loc:docks" } ] },
  { "file": "knowledge", "set": [ { "fact": "The silver locket was stolen from the duke's vault", "knownBy": ["char:elias"], "keywords": ["locket", "vault", "theft"] } ] }
], "done": true, "note": "recorded Mara's flight and the locket's origin" }

No prose outside the <think> block and the JSON object.
A rejected write stages nothing at all: fix the validation errors you get back and respond with that file's ENTIRE write again, every row of it.`;

// src/prompts/codex/passes/update.txt
var update_default = `<<TASK>>
The story material ends above. Update the codex now: walk the three passes in your scratchpad or head (UPDATE every outdated or missing record section by section, SWEEP what the new turns contradict, COMPRESS your wording), then emit the complete batch of writes. Be comprehensive. This ledger is the story's only durable memory, and anything you leave unrecorded is lost.`;

// src/prompts/codex/passes/verify.txt
var verify_default = "Verification pass: sweep every file for stale claims the new turns contradict, compress any row that carries bloat, and drop any row the story invalidated.";

// src/prompts/codex/passes/tidy.txt
var tidy_default = `TIDY PASS: no new story turns this time. Rewrite the target files to be leaner: merge redundant entries, strip filler words and verbose phrasing, drop details that carry no plot weight. You must NOT lose any plot-relevant fact, relationship, timeline event, open thread, or secret - when in doubt, keep it. Keep every schema exactly as specified.

A tidy is a ground-up rewrite: send each improved file as complete new "content" (not set/drop patches).

While you are in there: any target entity sheet, world entry, or knowledge item missing its "keywords" list gets one, following the retrieval keyword rules.`;

// src/prompts/codex/passes/refresh.txt
var refresh_default = 'REFRESH PASS: the user re-enabled {{TARGET_FILES}} after {{IT_THEY}} missed updates, so {{LAG_PHRASE}} the story. The story arrives as {{STORY_SHAPE}}. Rewrite ONLY the target files as complete new "content" so they fully reflect the story, keeping every schema exactly as specified. Summaries omit detail: record what is durable, and never invent specifics they do not state.';

// src/prompts/codex/passes/rebuild.txt
var rebuild_default = 'REBUILD PASS: the user asked to rebuild {{TARGET_FILES}} from scratch. The target files appear empty below, and anything still shown in them is user-locked: reproduce it untouched. The story arrives as {{STORY_SHAPE}}. Rewrite ONLY the target files as complete new "content" so they fully reflect the whole story, keeping every schema exactly as specified. Keep entity ids stable, other files may reference them. Summaries omit detail: record what is durable, and never invent specifics they do not state.';

// src/prompts/codex/passes/reconcile.txt
var reconcile_default = "RECONCILE SWEEP: messages were edited or deleted behind the codex and no unread turns remain. The story's CURRENT state arrives {{STORY_SHAPE}}. Verify every claim in every file against it and correct or drop anything the current story no longer supports. Files that still hold need no write.";

// src/prompts/codex/passes/catchup-fast.txt
var catchup_fast_default = "CATCH-UP FROM SUMMARIES: the story below is compressed chapter summaries covering {{CHUNK_LABEL}}, not raw turns (raw turns appear only where no chapter covers a span). Update the codex from them. Summaries omit detail: record what is durable, and never invent specifics they do not state.";

// src/prompts/codex/passes/catchup-ultra.txt
var catchup_ultra_default = "CATCH-UP: this single pass covers {{CHUNK_LABEL}}. {{STORY_SHAPE}} Update the codex to reflect ALL of it. Summaries omit detail: record what is durable, and never invent specifics they do not state.";

// src/prompts/codex/notes/partial-story.txt
var partial_story_default = "PARTIAL VIEW: the story turns below are only the newest slice of a longer story. Everything earlier was already encoded by previous passes, so records you do not recognize come from that unseen past and are not wrong. Correct only what these turns actually contradict, never what they simply do not mention.";

// src/prompts/codex/notes/reconcile.txt
var reconcile_default2 = "RECONCILE: the story was edited or regenerated behind the codex. Statements in the codex may describe events that no longer happened. Treat the codex as suspect, verify its claims against the turns below, and correct anything the current story contradicts.";

// src/prompts/codex/notes/migrate-table.txt
var migrate_table_default = 'MIGRATE: the relations table was just enabled. Lift every "ties" note off the entity sheets into relations.json rows, then remove all "ties" fields.';

// src/prompts/codex/notes/migrate-inline.txt
var migrate_inline_default = 'MIGRATE: the relations table was just disabled. Fold relations.json into short "ties" notes on the involved entity sheets. Do not write relations.json.';

// src/prompts/codex/notes/repair.txt
var repair_default = "REPAIR: these files were invalid on disk and are shown empty, rebuild them from the story if they held anything: {{FILES}}.";

// src/prompts/codex/notes/locked.txt
var locked_default = "LOCKED: the user owns these entities, do NOT set or drop them: {{IDS}}.";

// src/prompts/codex/notes/locked-fields.txt
var locked_fields_default = `LOCKED FIELDS: field values shown as "Locked, do not edit" are user-owned and hidden from you ({{IDS}}). Never write those fields. When you resend such a row, keep the "Locked, do not edit" value or omit the field entirely - the app restores the user's real value either way.`;

// src/prompts/codex/registry.ts
var CODEX_DIRECTIVES_DEFAULT = directives_default;
var SCHEMA_HOWTO_TAIL = "The JSON shape shown here must match what the validator accepts. You can reword the guidance freely. If you change the shape itself, the agent's writes will be rejected until it matches the validator again.";
var CODEX_TEMPLATES = [
  {
    key: "schema_entities_table",
    label: "Entity sheets (relations table on)",
    group: "File schemas",
    howTo: `Describes characters.json, locations.json, and things.json when the relations table is enabled. Relationship info is directed to relations.json. ${SCHEMA_HOWTO_TAIL}`,
    vars: [{ token: "{{ENTITY_FILES}}", meaning: "the entity files active this run, e.g. characters.json / locations.json" }],
    defaultText: entities_table_default
  },
  {
    key: "schema_entities_inline",
    label: "Entity sheets (relations table off)",
    group: "File schemas",
    howTo: `Describes the entity files when the relations table is disabled. Relationships live as "ties" notes on each sheet instead. ${SCHEMA_HOWTO_TAIL}`,
    vars: [{ token: "{{ENTITY_FILES}}", meaning: "the entity files active this run" }],
    defaultText: entities_inline_default
  },
  {
    key: "schema_relations",
    label: "Relations table",
    group: "File schemas",
    howTo: `Describes relations.json and the coverage rules that push the agent to record the story's full web. Only sent when the relations table is enabled and not frozen. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: relations_default
  },
  {
    key: "schema_timeline",
    label: "Timeline",
    group: "File schemas",
    howTo: `Describes timeline.json, including the append-only rule the app also enforces on normal runs. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: timeline_default
  },
  {
    key: "schema_threads",
    label: "Threads",
    group: "File schemas",
    howTo: `Describes threads.json. Resolved threads are archived by the app and hidden from the agent, and this text tells it not to re-add them. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: threads_default
  },
  {
    key: "schema_world",
    label: "World rules",
    group: "File schemas",
    howTo: `Describes world.json. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: world_default
  },
  {
    key: "schema_knowledge",
    label: "Secrets",
    group: "File schemas",
    howTo: `Describes knowledge.json. The validator rejects items without knownBy, hiddenFrom, or falseBeliefs, and this text explains that rule to the agent. ${SCHEMA_HOWTO_TAIL}`,
    vars: [],
    defaultText: knowledge_default
  },
  {
    key: "schema_keywords",
    label: "Retrieval keywords",
    group: "File schemas",
    howTo: "The rules for the keywords lists on entity sheets, world entries, and knowledge items. Weak keywords make records unreachable, since each record only enters the story prompt when a keyword matches recent messages.",
    vars: [],
    defaultText: keywords_default
  },
  {
    key: "protocol_patch_rules",
    label: "Patch rules (set / drop / content)",
    group: "Write protocol",
    howTo: "The shared explanation of set, drop, seeds, and content, embedded into both protocol blocks below. The app really does merge patches this way, so keep the described behavior accurate or the agent will send writes that do the wrong thing.",
    vars: [],
    defaultText: patch_rules_default
  },
  {
    key: "protocol_tools",
    label: "Protocol (tool calls)",
    group: "Write protocol",
    howTo: "Sent when the profile uses tool calls. It names the codex_write and codex_done tools the app registers, so those names must stay. It also defines the <think> scratchpad convention for models without native reasoning.",
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: tools_default
  },
  {
    key: "protocol_json",
    label: "Protocol (JSON mode)",
    group: "Write protocol",
    howTo: 'Sent when the profile writes strict JSON instead of tool calls. The reply is parsed for a "writes" array and a "done" flag, so that shape must stay.',
    vars: [{ token: "{{PATCH_RULES}}", meaning: "the patch rules template above" }],
    defaultText: json_default
  },
  {
    key: "pass_update",
    label: "Task closing block",
    group: "Pass instructions",
    howTo: "The closing block of every normal update and catch-up message. It sits after the long story text on purpose, regrounding the agent in the three passes and the scratchpad right before it answers.",
    vars: [],
    defaultText: update_default
  },
  {
    key: "pass_verify",
    label: "Verification nudge",
    group: "Pass instructions",
    howTo: "Sent as an extra round after a clean update when Thorough mode is on. A short transport-specific closing is appended by the app.",
    vars: [],
    defaultText: verify_default
  },
  {
    key: "pass_tidy",
    label: "Tidy pass",
    group: "Pass instructions",
    howTo: "The instruction block for Tidy up. The app appends the target file list, the locked entity note, the current codex, and the closing line.",
    vars: [],
    defaultText: tidy_default
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
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged, e.g. filed summaries plus raw turns" }
    ],
    defaultText: refresh_default
  },
  {
    key: "pass_rebuild",
    label: "Rebuild pass",
    group: "Pass instructions",
    howTo: "Sent when a category's Rebuild button regenerates that file from the whole story. The target shows as empty (locked rows excepted) and must come back as a complete rewrite. The file on disk is only replaced when the pass succeeds, and the cursor does not move.",
    vars: [
      { token: "{{TARGET_FILES}}", meaning: "the files being rebuilt" },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }
    ],
    defaultText: rebuild_default
  },
  {
    key: "pass_reconcile",
    label: "Reconcile sweep",
    group: "Pass instructions",
    howTo: "Sent when messages were deleted behind the codex and nothing new is left to read. The agent checks every claim against the surviving story.",
    vars: [{ token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }],
    defaultText: reconcile_default
  },
  {
    key: "pass_catchup_fast",
    label: "Fast catch-up",
    group: "Pass instructions",
    howTo: "The preamble for each fast catch-up batch, which replays filed chapter summaries instead of raw turns.",
    vars: [{ token: "{{CHUNK_LABEL}}", meaning: "the message range this batch covers" }],
    defaultText: catchup_fast_default
  },
  {
    key: "pass_catchup_ultra",
    label: "Ultra catch-up",
    group: "Pass instructions",
    howTo: "The preamble for the single-pass ultra catch-up over every filed summary plus the raw tail.",
    vars: [
      { token: "{{CHUNK_LABEL}}", meaning: "the message range covered" },
      { token: "{{STORY_SHAPE}}", meaning: "how the story input is arranged" }
    ],
    defaultText: catchup_ultra_default
  },
  {
    key: "note_partial_story",
    label: "Partial view guard",
    group: "Run notes",
    howTo: "Prepended to every normal update. The agent only sees a window of the story, and this is the guard that keeps it from rewriting or deleting records the visible turns simply do not mention.",
    vars: [],
    defaultText: partial_story_default
  },
  {
    key: "note_reconcile",
    label: "Reconcile warning",
    group: "Run notes",
    howTo: "Prepended when edits or deletions were detected behind the codex cursor, so the agent treats existing records as suspect.",
    vars: [],
    defaultText: reconcile_default2
  },
  {
    key: "note_migrate_table",
    label: "Migration to relations table",
    group: "Run notes",
    howTo: "Prepended on the first run after the relations table is switched on. The app verifies the migration actually happened, so keep the instruction intact.",
    vars: [],
    defaultText: migrate_table_default
  },
  {
    key: "note_migrate_inline",
    label: "Migration to inline ties",
    group: "Run notes",
    howTo: "Prepended on the first run after the relations table is switched off.",
    vars: [],
    defaultText: migrate_inline_default
  },
  {
    key: "note_repair",
    label: "Repair warning",
    group: "Run notes",
    howTo: "Prepended when files on disk were unreadable and are shown empty.",
    vars: [{ token: "{{FILES}}", meaning: "the unreadable files" }],
    defaultText: repair_default
  },
  {
    key: "note_locked",
    label: "Locked entities",
    group: "Run notes",
    howTo: "Prepended when entities are locked. The app also reverts any write that touches a locked entity.",
    vars: [{ token: "{{IDS}}", meaning: "the locked entity ids" }],
    defaultText: locked_default
  },
  {
    key: "note_locked_fields",
    label: "Locked fields",
    group: "Run notes",
    howTo: 'Prepended when individual fields are locked on an entity. Those fields show "Locked, do not edit" to the agent instead of their contents, and the app restores the real values on every write.',
    vars: [{ token: "{{IDS}}", meaning: "the entities carrying locked fields" }],
    defaultText: locked_fields_default
  }
];
var CODEX_TEMPLATE_KEYS = CODEX_TEMPLATES.map((t) => t.key);
function isCodexTemplateKey(v) {
  return typeof v === "string" && CODEX_TEMPLATE_KEYS.includes(v);
}
var BY_KEY = new Map(CODEX_TEMPLATES.map((t) => [t.key, t]));
function codexTemplateText(key, overrides) {
  const o = overrides[key];
  if (typeof o === "string" && o.trim())
    return o;
  return BY_KEY.get(key).defaultText;
}

// src/shared.ts
var EXTENSION_ID = "lumi_books";
var EXTENSION_KEY = "lumibooks";
var CODEX_FILE_KEYS = [
  "characters",
  "locations",
  "things",
  "relations",
  "timeline",
  "threads",
  "world",
  "knowledge"
];
var WORLD_BOOK_NAME_PREFIX = "LumiBooks";
var CODEX_ENTRY_EXTENSION_KEY = "lumibooks_codex";
var STORAGE_VERSION = 7;
var SETTINGS_PATH = "settings.json";
var CHAT_STATE_DIR = "chats";
var DEFAULT_SAMPLERS = {
  temperature: null,
  top_p: null,
  top_k: null,
  max_tokens: null,
  max_input_tokens: null,
  frequency_penalty: null,
  presence_penalty: null
};
var SAMPLER_DEFAULTS = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 32000,
  max_input_tokens: 128000,
  frequency_penalty: 0,
  presence_penalty: 0
};
var CODEX_SAMPLER_DEFAULTS = {
  temperature: 0.4,
  top_p: 1,
  top_k: 0,
  max_tokens: 1e5,
  max_input_tokens: 500000,
  frequency_penalty: 0,
  presence_penalty: 0
};
function makeDefaultProfile(id, name) {
  return {
    id,
    name,
    lagUnit: "messages",
    lagValue: 65,
    windowUnit: "messages",
    windowValue: 18,
    chapterTargetUnit: "percent",
    chapterTargetPercent: 15,
    chapterTargetTokens: 800,
    arcTargetUnit: "percent",
    arcTargetPercent: 20,
    arcTargetTokens: 1500,
    volumeTargetUnit: "percent",
    volumeTargetPercent: 25,
    volumeTargetTokens: 3000,
    arcTrigger: "chapters",
    arcAfterChapters: 6,
    arcAfterTokens: 8000,
    arcLagChapters: 7,
    arcLagTokens: 2000,
    chapterPresetKey: "summary",
    arcPresetKey: "arc_default",
    volumePresetKey: "volume_default",
    previousMemoriesCount: 7,
    regexOutgoingScriptIds: [],
    regexIncomingScriptIds: [],
    connectionId: null,
    samplers: { ...DEFAULT_SAMPLERS },
    autoCreate: true,
    autoCreateChapter: true,
    autoCreateArc: true,
    hideCoveredMessages: true,
    showMemoryPreviews: false,
    retryCount: 3,
    shortCommentRulesOverride: null,
    memoriaPersonaOverride: null,
    ttftTimeoutSecs: 60,
    codexEnabled: true,
    codexLagUnit: "messages",
    codexLagValue: 6,
    codexWindowUnit: "messages",
    codexWindowValue: 20,
    codexTokenBreakpoint: 1e5,
    codexLoreLimitUnit: "percent",
    codexLoreLimitPercent: 25,
    codexLoreLimitTokens: 25000,
    codexStorySoFarCount: 5,
    codexRelationsTable: true,
    codexThorough: true,
    codexConnectionId: null,
    codexExtraContext: true,
    codexSamplers: { ...DEFAULT_SAMPLERS },
    codexUseTools: false,
    codexPresetKey: "codex_default"
  };
}
var DEFAULT_SETTINGS = {
  version: STORAGE_VERSION,
  enabled: true,
  profiles: [makeDefaultProfile("default", "Default")],
  activeProfileId: "default",
  customPresets: [],
  debugLog: false,
  forceConstantEntries: true,
  showAutomationToasts: true,
  suppressToolCallingPrompt: false
};
function diskVersionFor(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  return typeof v.version === "number" ? v.version : 1;
}
function normalizeSettings(raw) {
  const fallback = DEFAULT_SETTINGS;
  const v = raw && typeof raw === "object" ? raw : {};
  const profilesRaw = Array.isArray(v.profiles) ? v.profiles : fallback.profiles;
  const profiles = profilesRaw.map((p) => normalizeProfile(p)).filter((p) => !!p);
  if (profiles.length === 0)
    profiles.push(makeDefaultProfile("default", "Default"));
  const activeProfileId = typeof v.activeProfileId === "string" && profiles.some((p) => p.id === v.activeProfileId) ? v.activeProfileId : profiles[0].id;
  const customPresets = Array.isArray(v.customPresets) ? v.customPresets.map(normalizeCustomPreset).filter((p) => !!p) : [];
  return {
    version: STORAGE_VERSION,
    enabled: typeof v.enabled === "boolean" ? v.enabled : fallback.enabled,
    profiles,
    activeProfileId,
    customPresets,
    debugLog: typeof v.debugLog === "boolean" ? v.debugLog : fallback.debugLog,
    forceConstantEntries: typeof v.forceConstantEntries === "boolean" ? v.forceConstantEntries : fallback.forceConstantEntries,
    showAutomationToasts: typeof v.showAutomationToasts === "boolean" ? v.showAutomationToasts : fallback.showAutomationToasts,
    suppressToolCallingPrompt: typeof v.suppressToolCallingPrompt === "boolean" ? v.suppressToolCallingPrompt : fallback.suppressToolCallingPrompt
  };
}
function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  const id = typeof v.id === "string" && v.id.trim() ? v.id : null;
  if (!id)
    return null;
  const base = makeDefaultProfile(id, typeof v.name === "string" && v.name.trim() ? v.name : "Untitled");
  return {
    ...base,
    lagUnit: v.lagUnit === "tokens" ? "tokens" : "messages",
    lagValue: clampInt(v.lagValue, 0, v.lagUnit === "tokens" ? 1e6 : 1e5, base.lagValue),
    windowUnit: v.windowUnit === "tokens" ? "tokens" : "messages",
    windowValue: clampInt(v.windowValue, 1, v.windowUnit === "tokens" ? 1e6 : 1e5, base.windowValue),
    chapterTargetUnit: v.chapterTargetUnit === "tokens" ? "tokens" : "percent",
    chapterTargetPercent: clampInt(v.chapterTargetPercent, 2, 90, base.chapterTargetPercent),
    chapterTargetTokens: clampInt(v.chapterTargetTokens, 50, 1e6, base.chapterTargetTokens),
    arcTargetUnit: v.arcTargetUnit === "tokens" ? "tokens" : "percent",
    arcTargetPercent: clampInt(v.arcTargetPercent, 5, 95, base.arcTargetPercent),
    arcTargetTokens: clampInt(v.arcTargetTokens, 50, 1e6, base.arcTargetTokens),
    volumeTargetUnit: v.volumeTargetUnit === "tokens" ? "tokens" : "percent",
    volumeTargetPercent: clampInt(v.volumeTargetPercent, 5, 95, base.volumeTargetPercent),
    volumeTargetTokens: clampInt(v.volumeTargetTokens, 50, 1e6, base.volumeTargetTokens),
    arcTrigger: v.arcTrigger === "tokens" || v.arcTrigger === "manual" ? v.arcTrigger : "chapters",
    arcAfterChapters: clampInt(v.arcAfterChapters, 2, 100, base.arcAfterChapters),
    arcAfterTokens: clampInt(v.arcAfterTokens, 500, 200000, base.arcAfterTokens),
    arcLagChapters: clampInt(v.arcLagChapters, 0, 100, base.arcLagChapters),
    arcLagTokens: clampInt(v.arcLagTokens, 0, 200000, base.arcLagTokens),
    chapterPresetKey: typeof v.chapterPresetKey === "string" && v.chapterPresetKey.trim() ? v.chapterPresetKey : base.chapterPresetKey,
    arcPresetKey: typeof v.arcPresetKey === "string" && v.arcPresetKey.trim() ? v.arcPresetKey : base.arcPresetKey,
    volumePresetKey: typeof v.volumePresetKey === "string" && v.volumePresetKey.trim() ? v.volumePresetKey : base.volumePresetKey,
    previousMemoriesCount: clampInt(v.previousMemoriesCount, 0, 20, base.previousMemoriesCount),
    regexOutgoingScriptIds: Array.isArray(v.regexOutgoingScriptIds) ? v.regexOutgoingScriptIds.filter((x) => typeof x === "string") : base.regexOutgoingScriptIds,
    regexIncomingScriptIds: Array.isArray(v.regexIncomingScriptIds) ? v.regexIncomingScriptIds.filter((x) => typeof x === "string") : base.regexIncomingScriptIds,
    connectionId: typeof v.connectionId === "string" && v.connectionId.trim() ? v.connectionId : null,
    samplers: normalizeSamplers(v.samplers),
    autoCreate: typeof v.autoCreate === "boolean" ? v.autoCreate : base.autoCreate,
    autoCreateChapter: typeof v.autoCreateChapter === "boolean" ? v.autoCreateChapter : base.autoCreateChapter,
    autoCreateArc: typeof v.autoCreateArc === "boolean" ? v.autoCreateArc : base.autoCreateArc,
    hideCoveredMessages: typeof v.hideCoveredMessages === "boolean" ? v.hideCoveredMessages : base.hideCoveredMessages,
    showMemoryPreviews: typeof v.showMemoryPreviews === "boolean" ? v.showMemoryPreviews : base.showMemoryPreviews,
    retryCount: clampInt(v.retryCount, 0, 10, base.retryCount),
    shortCommentRulesOverride: typeof v.shortCommentRulesOverride === "string" && v.shortCommentRulesOverride.trim() !== "" ? v.shortCommentRulesOverride : null,
    memoriaPersonaOverride: typeof v.memoriaPersonaOverride === "string" && v.memoriaPersonaOverride.trim() !== "" ? v.memoriaPersonaOverride : null,
    ttftTimeoutSecs: clampInt(v.ttftTimeoutSecs, 10, 600, base.ttftTimeoutSecs),
    codexEnabled: typeof v.codexEnabled === "boolean" ? v.codexEnabled : base.codexEnabled,
    codexLagUnit: v.codexLagUnit === "tokens" ? "tokens" : "messages",
    codexLagValue: clampInt(v.codexLagValue, 0, v.codexLagUnit === "tokens" ? 1e6 : 1e5, base.codexLagValue),
    codexWindowUnit: v.codexWindowUnit === "tokens" ? "tokens" : "messages",
    codexWindowValue: clampInt(v.codexWindowValue, 1, v.codexWindowUnit === "tokens" ? 1e6 : 1e5, base.codexWindowValue),
    codexTokenBreakpoint: clampInt(v.codexTokenBreakpoint, 1000, 1e6, base.codexTokenBreakpoint),
    codexLoreLimitUnit: v.codexLoreLimitUnit === "tokens" ? "tokens" : "percent",
    codexLoreLimitPercent: clampInt(v.codexLoreLimitPercent, 1, 100, base.codexLoreLimitPercent),
    codexLoreLimitTokens: clampInt(v.codexLoreLimitTokens, 0, 1e6, base.codexLoreLimitTokens),
    codexStorySoFarCount: clampInt(v.codexStorySoFarCount, 0, 50, base.codexStorySoFarCount),
    codexRelationsTable: typeof v.codexRelationsTable === "boolean" ? v.codexRelationsTable : base.codexRelationsTable,
    codexThorough: typeof v.codexThorough === "boolean" ? v.codexThorough : base.codexThorough,
    codexConnectionId: typeof v.codexConnectionId === "string" && v.codexConnectionId.trim() ? v.codexConnectionId : null,
    codexExtraContext: typeof v.codexExtraContext === "boolean" ? v.codexExtraContext : base.codexExtraContext,
    codexSamplers: normalizeSamplers(v.codexSamplers),
    codexUseTools: typeof v.codexUseTools === "boolean" ? v.codexUseTools : base.codexUseTools,
    codexPresetKey: typeof v.codexPresetKey === "string" && v.codexPresetKey.trim() ? v.codexPresetKey : base.codexPresetKey
  };
}
function normalizeCodexTemplates(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return;
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (isCodexTemplateKey(k) && typeof v === "string" && v.trim())
      out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
function normalizeSamplers(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  return {
    temperature: numOrNull(v.temperature, 0, 2),
    top_p: numOrNull(v.top_p, 0, 1),
    top_k: numOrNull(v.top_k, 0, 1000),
    max_tokens: numOrNull(v.max_tokens, 1, 1e6),
    max_input_tokens: numOrNull(v.max_input_tokens, 256, 4000000),
    frequency_penalty: numOrNull(v.frequency_penalty, -2, 2),
    presence_penalty: numOrNull(v.presence_penalty, -2, 2)
  };
}
function normalizeCustomPreset(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  if (typeof v.key !== "string" || !v.key.trim())
    return null;
  if (typeof v.prompt !== "string" || !v.prompt.trim())
    return null;
  const category = v.category === "arc" || v.category === "volume" || v.category === "codex" ? v.category : "chapter";
  const templates = category === "codex" ? normalizeCodexTemplates(v.templates) : undefined;
  return {
    key: v.key,
    displayName: typeof v.displayName === "string" && v.displayName.trim() ? v.displayName : v.key,
    prompt: v.prompt,
    category,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
    ...templates ? { templates } : {}
  };
}
function normalizeEntryMeta(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  const tier = v.tier === 3 ? 3 : v.tier === 2 ? 2 : v.tier === 1 ? 1 : null;
  if (!tier)
    return null;
  if (typeof v.chatId !== "string" || !v.chatId.trim())
    return null;
  const msgIds = Array.isArray(v.msgIds) ? v.msgIds.filter((x) => typeof x === "string") : [];
  return {
    tier,
    chatId: v.chatId,
    msgIds,
    sourceChapterEntryIds: Array.isArray(v.sourceChapterEntryIds) ? v.sourceChapterEntryIds.filter((x) => typeof x === "string") : undefined,
    firstMsgIdx: typeof v.firstMsgIdx === "number" ? v.firstMsgIdx : undefined,
    lastMsgIdx: typeof v.lastMsgIdx === "number" ? v.lastMsgIdx : undefined,
    tokenCountInput: typeof v.tokenCountInput === "number" ? v.tokenCountInput : 0,
    tokenCountOutput: typeof v.tokenCountOutput === "number" ? v.tokenCountOutput : 0,
    model: typeof v.model === "string" ? v.model : "",
    connectionId: typeof v.connectionId === "string" ? v.connectionId : "",
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
    supersededByEntryId: typeof v.supersededByEntryId === "string" && v.supersededByEntryId.trim() ? v.supersededByEntryId : null,
    title: typeof v.title === "string" ? v.title : undefined,
    shortComment: typeof v.shortComment === "string" ? v.shortComment : undefined,
    presetKey: typeof v.presetKey === "string" ? v.presetKey : undefined,
    sceneNumber: typeof v.sceneNumber === "number" && Number.isFinite(v.sceneNumber) && v.sceneNumber > 0 ? Math.floor(v.sceneNumber) : undefined,
    rawOutput: typeof v.rawOutput === "string" ? v.rawOutput : undefined,
    isRoot: v.isRoot === true ? true : undefined,
    rootOrigin: typeof v.rootOrigin === "string" && v.rootOrigin.trim() ? v.rootOrigin : undefined,
    ghost: v.ghost === true ? true : undefined,
    msgSigs: Array.isArray(v.msgSigs) ? v.msgSigs.filter((x) => typeof x === "string") : undefined
  };
}
function clampInt(v, min, max, fallback) {
  if (typeof v !== "number" || !Number.isFinite(v))
    return fallback;
  const n = Math.round(v);
  if (n < min)
    return min;
  if (n > max)
    return max;
  return n;
}
function numOrNull(v, min, max) {
  if (v === null || v === undefined)
    return null;
  if (typeof v !== "number" || !Number.isFinite(v))
    return null;
  if (v < min || v > max)
    return null;
  return v;
}
function approximateTokensFromChars(chars) {
  return Math.ceil(chars / 4);
}
function ordinal(n) {
  if (!Number.isFinite(n) || n < 1)
    return String(n);
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13)
    return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
function buildChapterHeader(sceneNumber, turnCount) {
  return `${ordinal(sceneNumber)} Summary Chapter Containing ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}
function buildArcHeader(sceneNumber, chapterCount, turnCount) {
  return `${ordinal(sceneNumber)} Summary ARC Containing ${chapterCount} Prior Chapter${chapterCount === 1 ? "" : "s"} and ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}
function buildVolumeHeader(sceneNumber, arcCount, turnCount) {
  return `${ordinal(sceneNumber)} Summary VOLUME Containing ${arcCount} Prior Arc${arcCount === 1 ? "" : "s"} and ${turnCount} Prior Turn${turnCount === 1 ? "" : "s"}`;
}
function bookNameFor(chatName, chatId) {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  return `${WORLD_BOOK_NAME_PREFIX} - ${suffix}`;
}
function codexBookNameFor(chatName, chatId) {
  const cleanName = (chatName ?? "").trim();
  const suffix = cleanName ? cleanName.slice(0, 60) : chatId.slice(0, 8);
  return `${WORLD_BOOK_NAME_PREFIX} Codex [Do Not Edit] - ${suffix}`;
}
var LESSONS_PATH = "lessons.json";
function emptyLessonCourse() {
  return {
    status: "todo",
    section: 0,
    step: 0,
    answers: {},
    attempts: 0,
    bestWrong: null,
    lastWrong: null,
    lastTotal: null,
    grade: null,
    startedAt: null,
    completedAt: null,
    signedName: null
  };
}
function makeDefaultLessons(freshInstall) {
  return { version: 1, freshInstall, booksSealSkipped: false, codexSealSkipped: false, books: emptyLessonCourse(), codex: emptyLessonCourse() };
}
function unlockedLessons() {
  const done = () => ({ ...emptyLessonCourse(), status: "done" });
  return { version: 1, freshInstall: false, booksSealSkipped: false, codexSealSkipped: false, books: done(), codex: done() };
}
function codexLessonGated(lessons) {
  return lessons.codex.status !== "done" && !lessons.codexSealSkipped;
}
function normalizeLessonAnswers(raw) {
  const out = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      if (v === "gold" || v === "silver" || v === "skip")
        out[k] = v;
    }
  }
  return out;
}
function normalizeLessonCourse(raw) {
  const base = emptyLessonCourse();
  if (!raw || typeof raw !== "object")
    return base;
  const v = raw;
  const status = v.status === "done" || v.status === "in_progress" ? v.status : "todo";
  const grade = v.grade === "gilded" || v.grade === "silver" || v.grade === "bronze" || v.grade === "apprentice" ? v.grade : null;
  return {
    status,
    section: clampInt(v.section, 0, 100, 0),
    step: clampInt(v.step, 0, 1000, 0),
    answers: normalizeLessonAnswers(v.answers),
    attempts: clampInt(v.attempts, 0, 1e4, 0),
    bestWrong: typeof v.bestWrong === "number" && Number.isFinite(v.bestWrong) ? v.bestWrong : null,
    lastWrong: typeof v.lastWrong === "number" && Number.isFinite(v.lastWrong) ? v.lastWrong : null,
    lastTotal: typeof v.lastTotal === "number" && Number.isFinite(v.lastTotal) && v.lastTotal > 0 ? Math.round(v.lastTotal) : null,
    grade,
    startedAt: typeof v.startedAt === "number" ? v.startedAt : null,
    completedAt: typeof v.completedAt === "number" ? v.completedAt : null,
    signedName: typeof v.signedName === "string" && v.signedName.trim() ? v.signedName.trim().slice(0, 60) : null
  };
}
function normalizeLessons(raw) {
  const v = raw && typeof raw === "object" ? raw : {};
  return {
    version: 1,
    freshInstall: v.freshInstall === true,
    booksSealSkipped: v.booksSealSkipped === true,
    codexSealSkipped: v.codexSealSkipped === true,
    books: normalizeLessonCourse(v.books),
    codex: normalizeLessonCourse(v.codex)
  };
}

// src/backend/runtime.ts
var lastFrontendUserId = null;
var CHAT_USER_MAP_CAP = 2000;
var chatUserIds = new Map;
function setLastFrontendUserId(userId) {
  lastFrontendUserId = userId;
}
function rememberChatUser(chatId, userId) {
  if (!chatId || !userId)
    return;
  if (chatUserIds.has(chatId)) {
    chatUserIds.delete(chatId);
  } else if (chatUserIds.size >= CHAT_USER_MAP_CAP) {
    const oldestKey = chatUserIds.keys().next().value;
    if (oldestKey !== undefined)
      chatUserIds.delete(oldestKey);
  }
  chatUserIds.set(chatId, userId);
}
function resolveUserId(chatId) {
  if (chatId) {
    const mapped = chatUserIds.get(chatId);
    if (mapped)
      return mapped;
  }
  return null;
}
function getBootstrapUserId() {
  return lastFrontendUserId;
}
function send(payload, userId) {
  spindle.sendToFrontend(payload, userId);
}
function readChatIdFromMessage(msg) {
  if (!("chatId" in msg))
    return null;
  const value = msg.chatId;
  return typeof value === "string" && value.trim() ? value : null;
}
async function ensureUserFolders(userId) {
  await Promise.all([
    spindle.userStorage.mkdir(CHAT_STATE_DIR, userId).catch(() => {})
  ]);
}
function debug(userId, ...parts) {
  spindle.log.info(`[lmb:${userId.slice(0, 6)}] ${parts.map(stringifyPart).join(" ")}`);
}
function info(message) {
  spindle.log.info(`[lmb] ${message}`);
}
function warn(message) {
  spindle.log.warn(`[lmb] ${message}`);
}
function error(message) {
  spindle.log.error(`[lmb] ${message}`);
}
function stringifyPart(p) {
  if (p === null || p === undefined)
    return String(p);
  if (typeof p === "string")
    return p;
  if (typeof p === "number" || typeof p === "boolean")
    return String(p);
  try {
    return JSON.stringify(p);
  } catch {
    return String(p);
  }
}
function describeError(err) {
  if (err instanceof Error)
    return err.message;
  if (typeof err === "string")
    return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// src/backend/storage.ts
var warnedNewerForUser = new Set;
var writeLocks = new Map;
var SETTINGS_CACHE_TTL_MS = 2000;
var settingsCache = new Map;
function cacheSettings(userId, data) {
  settingsCache.set(userId, { at: Date.now(), data });
}
function withSettingsLock(userId, fn) {
  const prev = writeLocks.get(userId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks.set(userId, next.catch(() => {}));
  return next;
}
var migrationInflight = new Map;
function migrateSettings(userId, raw, fromVersion) {
  const running = migrationInflight.get(userId);
  if (running)
    return running;
  const p = (async () => {
    const started = Date.now();
    const migratedPresets = [];
    const flipped = {
      ...raw,
      profiles: (Array.isArray(raw.profiles) ? raw.profiles : []).map((prof) => {
        const next = { ...prof };
        if (fromVersion < 4) {
          next.codexThorough = true;
          next.codexExtraContext = true;
        }
        if (fromVersion < 5 && (next.codexWindowUnit === "messages" || next.codexWindowUnit === undefined) && next.codexWindowValue === 30) {
          next.codexWindowValue = 20;
        }
        if (fromVersion < 6) {
          next.codexUseTools = false;
        }
        if (fromVersion < 7) {
          const legacy = next["codexDirectivesOverride"];
          if (typeof legacy === "string" && legacy.trim()) {
            const key = `codex_migrated_${typeof next.id === "string" ? next.id : migratedPresets.length}`;
            migratedPresets.push({
              key,
              displayName: `${typeof next.name === "string" && next.name.trim() ? next.name : "Profile"} directives`,
              prompt: legacy,
              category: "codex",
              createdAt: Date.now()
            });
            next.codexPresetKey = key;
          }
          delete next["codexDirectivesOverride"];
        }
        return next;
      }),
      customPresets: [...Array.isArray(raw.customPresets) ? raw.customPresets : [], ...migratedPresets]
    };
    const normalized = normalizeSettings(flipped);
    try {
      await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
      warn(`settings migrated v${fromVersion} -> v${STORAGE_VERSION}`);
    } catch (err) {
      warn(`settings v${STORAGE_VERSION} migration write failed, will retry: ${describeError(err)}`);
    }
    const cur = settingsCache.get(userId);
    if (!cur || cur.at <= started)
      cacheSettings(userId, normalized);
    return normalized;
  })().finally(() => migrationInflight.delete(userId));
  migrationInflight.set(userId, p);
  return p;
}
async function loadSettings(userId) {
  const cached = settingsCache.get(userId);
  if (cached && Date.now() - cached.at < SETTINGS_CACHE_TTL_MS)
    return cached.data;
  const started = Date.now();
  const exists = await spindle.userStorage.exists(SETTINGS_PATH, userId);
  let raw = null;
  if (exists) {
    const text = await spindle.userStorage.read(SETTINGS_PATH, userId);
    try {
      raw = JSON.parse(text);
    } catch (err) {
      warn(`settings.json is corrupt, using defaults until the next save: ${describeError(err)}`);
      raw = null;
    }
  }
  const diskVersion = diskVersionFor(raw);
  if (diskVersion > STORAGE_VERSION && !warnedNewerForUser.has(userId)) {
    warnedNewerForUser.add(userId);
    warn(`settings on disk are v${diskVersion}, this build understands v${STORAGE_VERSION}`);
  }
  if (raw && diskVersion < STORAGE_VERSION) {
    return migrateSettings(userId, raw, diskVersion);
  }
  const normalized = normalizeSettings(raw);
  const cur = settingsCache.get(userId);
  if (!cur || cur.at <= started)
    cacheSettings(userId, normalized);
  return normalized;
}
async function patchSettings(userId, patch) {
  return withSettingsLock(userId, async () => {
    const current = await loadSettings(userId);
    const next = { ...current, ...patch };
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}
async function mutateSettings(userId, fn) {
  return withSettingsLock(userId, async () => {
    const current = await loadSettings(userId);
    const next = await fn(current);
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}

// src/backend/lessons.ts
var cache = new Map;
var inflight = new Map;
var writeLocks2 = new Map;
var failOpenUsers = new Set;
var anomalyCb = null;
function registerLessonsAnomalyCallback(cb) {
  anomalyCb = cb;
}
function withLessonsLock(userId, fn) {
  const prev = writeLocks2.get(userId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks2.set(userId, next.catch(() => {}));
  return next;
}
async function ensureLessons(userId) {
  const cached = cache.get(userId);
  if (cached)
    return cached;
  const running = inflight.get(userId);
  if (running)
    return running;
  const p = (async () => {
    const state = await loadFromDisk(userId);
    cache.set(userId, state);
    return state;
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, p);
  return p;
}
async function loadFromDisk(userId) {
  let exists;
  try {
    exists = await spindle.userStorage.exists(LESSONS_PATH, userId);
  } catch (err) {
    error(`lessons: exists() failed, unlocking as a precaution: ${describeError(err)}`);
    anomalyCb?.(userId, `Memoria couldn't read her lesson register and unsealed the archive: ${describeError(err)}`);
    failOpenUsers.add(userId);
    return unlockedLessons();
  }
  if (!exists) {
    const fresh = await isFreshInstall(userId);
    const state = makeDefaultLessons(fresh);
    failOpenUsers.delete(userId);
    await spindle.userStorage.setJson(LESSONS_PATH, state, { indent: 0, userId }).catch((err) => warn(`lessons: initial save failed: ${describeError(err)}`));
    await applyGateFlags(userId, fresh).catch((err) => warn(`lessons: gate flag init failed: ${describeError(err)}`));
    return state;
  }
  try {
    const raw = await spindle.userStorage.read(LESSONS_PATH, userId);
    failOpenUsers.delete(userId);
    return normalizeLessons(JSON.parse(raw));
  } catch (err) {
    error(`lessons: file unreadable, unlocking as a precaution: ${describeError(err)}`);
    anomalyCb?.(userId, `Memoria couldn't read her lesson register and unsealed the archive: ${describeError(err)}`);
    failOpenUsers.add(userId);
    return unlockedLessons();
  }
}
async function isFreshInstall(userId) {
  try {
    return !await spindle.userStorage.exists(SETTINGS_PATH, userId);
  } catch {
    return false;
  }
}
async function applyGateFlags(userId, freshInstall) {
  await mutateSettings(userId, (cur) => ({
    ...cur,
    profiles: cur.profiles.map((p) => ({
      ...p,
      codexEnabled: false,
      ...freshInstall ? { autoCreate: false } : {}
    }))
  }));
}
async function tryReadRealLessons(userId) {
  try {
    const exists = await spindle.userStorage.exists(LESSONS_PATH, userId);
    if (!exists)
      return null;
    const raw = await spindle.userStorage.read(LESSONS_PATH, userId);
    return normalizeLessons(JSON.parse(raw));
  } catch {
    return null;
  }
}
async function mutateLessons(userId, fn) {
  return withLessonsLock(userId, async () => {
    let cur = await ensureLessons(userId);
    if (failOpenUsers.has(userId)) {
      const real = await tryReadRealLessons(userId);
      if (real) {
        failOpenUsers.delete(userId);
        cur = real;
      }
    }
    const next = fn(cur);
    if (failOpenUsers.has(userId)) {
      cache.set(userId, next);
      warn(`lessons: register still unreadable for ${userId.slice(0, 6)}, keeping the change in memory only`);
      anomalyCb?.(userId, "Memoria couldn't read her lesson register so this change is not saved to disk yet");
      return next;
    }
    await spindle.userStorage.setJson(LESSONS_PATH, next, { indent: 0, userId });
    cache.set(userId, next);
    return next;
  });
}
function patchLessonCourse(userId, course, patch) {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    return {
      ...cur,
      [course]: {
        ...prev,
        ...patch,
        answers: patch.answers ? { ...prev.answers, ...patch.answers } : prev.answers
      }
    };
  });
}
function completeLessonCourse(userId, course, wrong, total, grade, signedName, answers) {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    const bestWrong = prev.bestWrong === null ? wrong : Math.min(prev.bestWrong, wrong);
    return {
      ...cur,
      [course]: {
        ...prev,
        status: "done",
        answers: answers ? { ...prev.answers, ...answers } : prev.answers,
        attempts: prev.attempts + 1,
        lastWrong: wrong,
        lastTotal: total > 0 ? total : null,
        bestWrong,
        grade,
        completedAt: Date.now(),
        signedName: signedName?.trim() ? signedName.trim().slice(0, 60) : prev.signedName,
        startedAt: prev.startedAt ?? Date.now()
      }
    };
  });
}
function resetLessonCourse(userId, course, mode, section, answerIds) {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    const wasDone = prev.status === "done" || prev.completedAt !== null && prev.grade !== null;
    const status = wasDone ? "done" : "in_progress";
    let next;
    if (mode === "course") {
      next = {
        ...prev,
        status,
        section: 0,
        step: 0,
        answers: {},
        lastWrong: wasDone ? prev.lastWrong : null,
        startedAt: Date.now()
      };
    } else {
      const answers = { ...prev.answers };
      for (const id of answerIds ?? [])
        delete answers[id];
      next = {
        ...prev,
        status,
        section: typeof section === "number" && section >= 0 ? section : prev.section,
        step: 0,
        answers
      };
    }
    return { ...cur, [course]: next };
  });
}
function skipCourseSeal(userId, course) {
  return mutateLessons(userId, (cur) => {
    if (course === "codex" ? cur.codexSealSkipped : cur.booksSealSkipped)
      return cur;
    return course === "codex" ? { ...cur, codexSealSkipped: true } : { ...cur, booksSealSkipped: true };
  });
}
function effectiveProfile(profile, lessons) {
  if (!codexLessonGated(lessons))
    return profile;
  if (!profile.codexEnabled)
    return profile;
  return { ...profile, codexEnabled: false };
}
function codexGated(lessons) {
  return codexLessonGated(lessons);
}

// src/backend/world-book.ts
var PAGE_LIMIT = 200;
var BOOK_INDEX_CACHE_TTL_MS = 4000;
var bookAnomalyCb = null;
function registerBookAnomalyCallback(cb) {
  bookAnomalyCb = cb;
}
var CHAT_BOOK_CACHE_CAP = 1000;
var chatBookCache = new Map;
var ensureInflight = new Map;
function setBookCache(key, value) {
  if (chatBookCache.has(key))
    chatBookCache.delete(key);
  chatBookCache.set(key, value);
  while (chatBookCache.size > CHAT_BOOK_CACHE_CAP) {
    const oldest = chatBookCache.keys().next().value;
    if (oldest === undefined)
      break;
    chatBookCache.delete(oldest);
  }
}
function cacheKey(userId, chatId) {
  return `${userId}::${chatId}`;
}
async function listAllBooks(userId) {
  const out = [];
  let offset = 0;
  while (true) {
    const page = await spindle.world_books.list({ limit: PAGE_LIMIT, offset, userId });
    out.push(...page.data);
    if (out.length >= page.total || page.data.length === 0)
      break;
    offset += page.data.length;
  }
  return out;
}
async function listAllEntries(bookId, userId) {
  const out = [];
  let offset = 0;
  while (true) {
    const page = await spindle.world_books.entries.list(bookId, { limit: PAGE_LIMIT, offset, userId });
    out.push(...page.data);
    if (out.length >= page.total || page.data.length === 0)
      break;
    offset += page.data.length;
  }
  return out;
}
async function findBookForChat(chatId, userId) {
  const cached = chatBookCache.get(cacheKey(userId, chatId));
  if (cached && cached.expiresAt > Date.now())
    return cached.bookId;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const fromMeta = chat?.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  const claimed = fromMeta && typeof fromMeta["lumibooks_book_id"] === "string" ? fromMeta["lumibooks_book_id"] : null;
  if (claimed) {
    const exists = await spindle.world_books.get(claimed, userId).catch(() => null);
    if (exists) {
      const bookMeta = exists.metadata && typeof exists.metadata === "object" ? exists.metadata : null;
      const bookChatId = bookMeta ? bookMeta["lumibooks_chat_id"] : undefined;
      if (bookChatId === chatId) {
        setBookCache(cacheKey(userId, chatId), { bookId: claimed, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
        return claimed;
      }
    }
  }
  const books = await listAllBooks(userId);
  for (const book of books) {
    const meta = book.metadata;
    if (meta && meta["lumibooks_chat_id"] === chatId) {
      setBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return book.id;
    }
  }
  return null;
}
async function ensureBookForChat(chatId, userId) {
  const key = cacheKey(userId, chatId);
  const inflight2 = ensureInflight.get(key);
  if (inflight2)
    return inflight2;
  const p = doEnsureBookForChat(chatId, userId).finally(() => {
    ensureInflight.delete(key);
  });
  ensureInflight.set(key, p);
  return p;
}
async function doEnsureBookForChat(chatId, userId) {
  const existingId = await findBookForChat(chatId, userId);
  if (existingId) {
    const existing = await spindle.world_books.get(existingId, userId);
    if (existing) {
      await bindBookToChat(chatId, existing.id, userId).catch((err) => warn(`bindBookToChat failed for ${chatId.slice(0, 8)}: ${describeError(err)}`));
      return existing;
    }
  }
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat)
    throw new Error(`Chat ${chatId} not found for user`);
  const claim = chat.metadata && typeof chat.metadata === "object" ? chat.metadata["lumibooks_book_id"] : undefined;
  const recovery = await recoverBookForChat(chatId, userId).catch((err) => {
    warn(`book recovery scan failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    return null;
  });
  if (recovery) {
    const existing = await spindle.world_books.get(recovery.bookId, userId).catch(() => null);
    if (existing) {
      const meta = existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {};
      if (meta["lumibooks_chat_id"] !== chatId) {
        await spindle.world_books.update(existing.id, { metadata: { ...meta, lumibooks_chat_id: chatId } }, userId).catch((err) => {
          warn(`book recovery: failed to re-tag ${existing.id}: ${describeError(err)}`);
        });
      }
      await bindBookToChat(chatId, existing.id, userId).catch((err) => warn(`bindBookToChat failed for ${chatId.slice(0, 8)}: ${describeError(err)}`));
      setBookCache(cacheKey(userId, chatId), { bookId: existing.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      error(`book recovery: re-linked book ${existing.id} for chat ${chatId.slice(0, 8)} ` + `(${recovery.count} LumiBooks entries; normal lookup MISSED it; chat claim=${typeof claim === "string" ? claim : "none"}; ` + `${recovery.candidates} candidate book(s); userId=${userId.slice(0, 6)})`);
      bookAnomalyCb?.(userId, "warn", recovery.candidates > 1 ? `Memoria re-linked this chat's notebook but found ${recovery.candidates} candidates, you may have duplicate notebooks` : "Memoria re-linked this chat's notebook after its link was lost");
      return existing;
    }
  }
  if (typeof claim === "string" && claim.trim()) {
    error(`book mismatch: chat ${chatId.slice(0, 8)} claims book ${claim} but it could not be resolved OR recovered; ` + `creating a NEW book. userId=${userId.slice(0, 6)}`);
    bookAnomalyCb?.(userId, "error", "Memoria couldn't find this chat's old notebook and started a new one, older chapters may live in a separate notebook");
  }
  const book = await spindle.world_books.create({
    name: bookNameFor(chat.name, chatId),
    description: "Memoria's shelf for this chat. Chapters and arcs live here.",
    metadata: {
      lumibooks_chat_id: chatId,
      lumibooks_created_at: Date.now()
    }
  }, userId);
  await bindBookToChat(chatId, book.id, userId).catch((err) => warn(`bindBookToChat failed for ${chatId.slice(0, 8)}: ${describeError(err)}`));
  setBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
  return book;
}
async function recoverBookForChat(chatId, userId) {
  const books = await listAllBooks(userId);
  const matches = [];
  for (const book of books) {
    const meta = book.metadata;
    if (meta && meta[CODEX_BOOK_META_KEY])
      continue;
    const bookChatId = meta && typeof meta["lumibooks_chat_id"] === "string" ? meta["lumibooks_chat_id"] : null;
    if (bookChatId && bookChatId !== chatId)
      continue;
    const looksLikeLmb = (book.name || "").startsWith(WORLD_BOOK_NAME_PREFIX) || !!(meta && (meta["lumibooks_chat_id"] || meta["lumibooks_created_at"] || meta["lumibooks_forked_from"]));
    if (!looksLikeLmb)
      continue;
    const entries = await listAllEntries(book.id, userId).catch(() => []);
    let count = 0;
    for (const entry of entries) {
      const ext = entry.extensions || {};
      const m = normalizeEntryMeta(ext[EXTENSION_KEY]);
      if (m && m.chatId === chatId)
        count++;
    }
    if (count > 0)
      matches.push({ id: book.id, count });
  }
  if (matches.length === 0)
    return null;
  matches.sort((a, b) => b.count - a.count);
  return { bookId: matches[0].id, count: matches[0].count, candidates: matches.length };
}
var chatMetaChain = new Map;
function withChatMetaLock(userId, chatId, fn) {
  const key = `${userId}::${chatId}`;
  const prev = chatMetaChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  chatMetaChain.set(key, guarded);
  guarded.then(() => {
    if (chatMetaChain.get(key) === guarded)
      chatMetaChain.delete(key);
  });
  return tail;
}
function bindBookToChat(chatId, bookId, userId) {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    if (!chat)
      return;
    const metadata = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
    const existing = Array.isArray(metadata["chat_world_book_ids"]) ? metadata["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const alreadyBound = existing.includes(bookId);
    const alreadyClaimed = metadata["lumibooks_book_id"] === bookId;
    if (alreadyBound && alreadyClaimed)
      return;
    const nextChatBookIds = alreadyBound ? existing : [...existing, bookId];
    await spindle.chats.update(chatId, {
      metadata: {
        ...metadata,
        chat_world_book_ids: nextChatBookIds,
        lumibooks_book_id: bookId
      }
    }, userId);
  });
}
async function getChatAttachedBookIds(chatId, userId) {
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  if (!md || !Array.isArray(md["chat_world_book_ids"]))
    return [];
  return md["chat_world_book_ids"].filter((x) => typeof x === "string");
}
async function reassertChatBinding(chatId, userId) {
  await reassertCodexBinding(chatId, userId).catch(() => {});
  const bookId = await findBookForChat(chatId, userId).catch(() => null);
  if (!bookId)
    return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  if (!chat)
    return false;
  await syncManagedBookNames(chatId, chat.name ?? null, bookId, userId).catch((err) => warn(`book name sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`));
  const md = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
  const attached = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
  if (attached.includes(bookId) && md["lumibooks_book_id"] === bookId)
    return false;
  await bindBookToChat(chatId, bookId, userId).catch((err) => {
    warn(`reassertChatBinding: failed to rebind ${bookId} to ${chatId.slice(0, 8)}: ${describeError(err)}`);
  });
  return true;
}
var nameSyncAt = new Map;
var NAME_SYNC_TTL_MS = 60000;
async function syncManagedBookNames(chatId, chatName, shelfBookId, userId) {
  const key = cacheKey(userId, chatId);
  const last = nameSyncAt.get(key);
  if (last && Date.now() - last < NAME_SYNC_TTL_MS)
    return;
  if (nameSyncAt.size > 500)
    nameSyncAt.clear();
  nameSyncAt.set(key, Date.now());
  const wantedShelf = bookNameFor(chatName, chatId);
  const shelf = await spindle.world_books.get(shelfBookId, userId).catch(() => null);
  if (shelf && (shelf.name || "") !== wantedShelf) {
    await spindle.world_books.update(shelfBookId, { name: wantedShelf }, userId);
  }
  const codexBookId = await findCodexBookForChat(chatId, userId).catch(() => null);
  if (codexBookId) {
    const wantedCodex = codexBookNameFor(chatName, chatId);
    const codexBook = await spindle.world_books.get(codexBookId, userId).catch(() => null);
    if (codexBook && (codexBook.name || "") !== wantedCodex) {
      await spindle.world_books.update(codexBookId, { name: wantedCodex }, userId);
    }
  }
}
var ENTRIES_CACHE_TTL_MS = 4000;
var ENTRIES_CACHE_CAP = 300;
var entriesCache = new Map;
async function listLmbEntries(chatId, userId) {
  const key = cacheKey(userId, chatId);
  const cached = entriesCache.get(key);
  if (cached && Date.now() - cached.at < ENTRIES_CACHE_TTL_MS)
    return cached.data;
  const bookId = await findBookForChat(chatId, userId);
  if (!bookId)
    return [];
  const raw = await listAllEntries(bookId, userId);
  const out = [];
  for (const entry of raw) {
    const ext = entry.extensions || {};
    const meta = normalizeEntryMeta(ext[EXTENSION_KEY]);
    if (!meta)
      continue;
    if (meta.chatId !== chatId)
      continue;
    out.push({ raw: entry, meta });
  }
  if (entriesCache.has(key))
    entriesCache.delete(key);
  entriesCache.set(key, { at: Date.now(), data: out });
  while (entriesCache.size > ENTRIES_CACHE_CAP) {
    const oldest = entriesCache.keys().next().value;
    if (oldest === undefined)
      break;
    entriesCache.delete(oldest);
  }
  return out;
}
async function createChapterEntry(bookId, meta, content, comment, userId, keys = [], constant = true, disabled = false) {
  return spindle.world_books.entries.create(bookId, {
    content,
    comment,
    disabled,
    constant,
    key: keys,
    keysecondary: [],
    vectorized: false,
    extensions: {
      [EXTENSION_KEY]: meta
    }
  }, userId);
}
async function applyConstantToAllLmbEntries(userId, constant) {
  const books = await listAllBooks(userId);
  let updated = 0;
  for (const book of books) {
    const meta = book.metadata;
    if (!meta || typeof meta["lumibooks_chat_id"] !== "string")
      continue;
    const entries = await listAllEntries(book.id, userId).catch(() => []);
    for (const entry of entries) {
      const ext = entry.extensions || {};
      if (!ext[EXTENSION_KEY])
        continue;
      if (entry.constant === constant)
        continue;
      try {
        await spindle.world_books.entries.update(entry.id, { constant }, userId);
        updated++;
      } catch (_) {}
    }
  }
  return updated;
}
async function updateEntry(entryId, patch, userId) {
  return spindle.world_books.entries.update(entryId, patch, userId);
}
async function deleteEntry(entryId, userId) {
  await spindle.world_books.entries.delete(entryId, userId);
}
async function setEntryDisabled(entryId, disabled, userId) {
  return spindle.world_books.entries.update(entryId, { disabled }, userId);
}
async function promoteGhostEntry(entry, userId) {
  const nextMeta = { ...entry.meta, ghost: undefined, msgSigs: undefined };
  const ext = entry.raw.extensions || {};
  return spindle.world_books.entries.update(entry.raw.id, { disabled: false, extensions: { ...ext, [EXTENSION_KEY]: nextMeta } }, userId);
}
async function releaseEntry(entry, userId) {
  const ext = entry.raw.extensions || {};
  const nextExt = { ...ext };
  delete nextExt[EXTENSION_KEY];
  const currentComment = entry.raw.comment || "";
  const nextComment = currentComment.startsWith("[orphaned]") ? currentComment : `[orphaned] ${currentComment}`.trim();
  return spindle.world_books.entries.update(entry.raw.id, { extensions: nextExt, comment: nextComment }, userId);
}
async function patchEntryMeta(entry, metaPatch, userId) {
  const next = { ...entry.meta, ...metaPatch };
  const ext = entry.raw.extensions || {};
  return spindle.world_books.entries.update(entry.raw.id, {
    extensions: { ...ext, [EXTENSION_KEY]: next }
  }, userId);
}
function invalidateBookCache(userId, chatId) {
  chatBookCache.delete(cacheKey(userId, chatId));
  entriesCache.delete(cacheKey(userId, chatId));
  codexBookCache.delete(cacheKey(userId, chatId));
}
function findCachedChatIdForBook(userId, bookId) {
  const prefix = `${userId}::`;
  for (const [key, value] of chatBookCache) {
    if (!key.startsWith(prefix))
      continue;
    if (value.bookId === bookId)
      return key.slice(prefix.length);
  }
  return null;
}
async function findChatIdForBook(userId, bookId) {
  const cached = findCachedChatIdForBook(userId, bookId);
  if (cached)
    return cached;
  const book = await spindle.world_books.get(bookId, userId).catch(() => null);
  if (!book)
    return null;
  const meta = book.metadata && typeof book.metadata === "object" ? book.metadata : null;
  const claimed = meta && typeof meta["lumibooks_chat_id"] === "string" ? meta["lumibooks_chat_id"] : null;
  return claimed;
}
function invalidateAllBookCacheEntriesForBook(userId, bookId) {
  const prefix = `${userId}::`;
  const toDelete = [];
  for (const [key, value] of chatBookCache) {
    if (!key.startsWith(prefix))
      continue;
    if (value.bookId === bookId)
      toDelete.push(key);
  }
  for (const k of toDelete) {
    chatBookCache.delete(k);
    entriesCache.delete(k);
  }
  const codexToDelete = [];
  for (const [key, value] of codexBookCache) {
    if (!key.startsWith(prefix))
      continue;
    if (value.bookId === bookId)
      codexToDelete.push(key);
  }
  for (const k of codexToDelete)
    codexBookCache.delete(k);
}
var CODEX_BOOK_META_KEY = "lumibooks_codex_chat_id";
var CODEX_BOOK_CLAIM_KEY = "lumibooks_codex_book_id";
var codexBookCache = new Map;
var codexEnsureInflight = new Map;
function setCodexBookCache(key, value) {
  if (codexBookCache.has(key))
    codexBookCache.delete(key);
  codexBookCache.set(key, value);
  while (codexBookCache.size > CHAT_BOOK_CACHE_CAP) {
    const oldest = codexBookCache.keys().next().value;
    if (oldest === undefined)
      break;
    codexBookCache.delete(oldest);
  }
}
function codexBookTaggedFor(book, chatId) {
  return codexBookChatTag(book) === chatId;
}
function codexBookChatTag(book) {
  const meta = book.metadata && typeof book.metadata === "object" ? book.metadata : null;
  const tag = meta ? meta[CODEX_BOOK_META_KEY] : null;
  return typeof tag === "string" && tag ? tag : null;
}
async function findCodexBookForChat(chatId, userId) {
  const cached = codexBookCache.get(cacheKey(userId, chatId));
  if (cached && cached.expiresAt > Date.now())
    return cached.bookId;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat?.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  const claimed = md && typeof md[CODEX_BOOK_CLAIM_KEY] === "string" ? md[CODEX_BOOK_CLAIM_KEY] : null;
  if (claimed) {
    const book = await spindle.world_books.get(claimed, userId).catch(() => null);
    if (book && codexBookTaggedFor(book, chatId)) {
      setCodexBookCache(cacheKey(userId, chatId), { bookId: claimed, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return claimed;
    }
  }
  const books = await listAllBooks(userId);
  for (const book of books) {
    if (codexBookTaggedFor(book, chatId)) {
      setCodexBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
      return book.id;
    }
  }
  return null;
}
function bindCodexBookToChat(chatId, bookId, userId) {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    if (!chat)
      return;
    const metadata = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
    const md = metadata;
    const existing = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const alreadyBound = existing.includes(bookId);
    const alreadyClaimed = md[CODEX_BOOK_CLAIM_KEY] === bookId;
    if (alreadyBound && alreadyClaimed)
      return;
    await spindle.chats.update(chatId, {
      metadata: {
        ...md,
        chat_world_book_ids: alreadyBound ? existing : [...existing, bookId],
        [CODEX_BOOK_CLAIM_KEY]: bookId
      }
    }, userId);
  });
}
async function ensureCodexBookForChat(chatId, userId) {
  const key = cacheKey(userId, chatId);
  const inflight2 = codexEnsureInflight.get(key);
  if (inflight2)
    return inflight2;
  const p = doEnsureCodexBookForChat(chatId, userId).finally(() => {
    codexEnsureInflight.delete(key);
  });
  codexEnsureInflight.set(key, p);
  return p;
}
async function doEnsureCodexBookForChat(chatId, userId) {
  const existingId = await findCodexBookForChat(chatId, userId);
  if (existingId) {
    const existing = await spindle.world_books.get(existingId, userId);
    if (existing) {
      await bindCodexBookToChat(chatId, existing.id, userId);
      return existing;
    }
  }
  const chat = await spindle.chats.get(chatId, userId);
  if (!chat)
    throw new Error(`Chat ${chatId} not found for user`);
  const book = await spindle.world_books.create({
    name: codexBookNameFor(chat.name, chatId),
    description: "Managed by LumiBooks. This book mirrors the Knowledge Codex as retrievable entries and is rewritten on every codex update - edits made here WILL be overwritten. Edit records in the LumiBooks Codex tab instead.",
    metadata: {
      [CODEX_BOOK_META_KEY]: chatId,
      lumibooks_created_at: Date.now()
    }
  }, userId);
  setCodexBookCache(cacheKey(userId, chatId), { bookId: book.id, expiresAt: Date.now() + BOOK_INDEX_CACHE_TTL_MS });
  await bindCodexBookToChat(chatId, book.id, userId);
  return book;
}
function unbindBookFromChat(chatId, bookId, userId) {
  return withChatMetaLock(userId, chatId, async () => {
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    if (!chat)
      return;
    const md = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    const existing = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const filtered = existing.filter((id) => id !== bookId);
    const claimHeld = md[CODEX_BOOK_CLAIM_KEY] === bookId;
    if (filtered.length === existing.length && !claimHeld)
      return;
    md["chat_world_book_ids"] = filtered;
    if (claimHeld)
      delete md[CODEX_BOOK_CLAIM_KEY];
    await spindle.chats.update(chatId, { metadata: md }, userId);
  });
}
async function reassertCodexBinding(chatId, userId) {
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  if (!chat)
    return false;
  const md = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : {};
  const claimed = typeof md[CODEX_BOOK_CLAIM_KEY] === "string" ? md[CODEX_BOOK_CLAIM_KEY] : null;
  if (!claimed)
    return false;
  const attached = Array.isArray(md["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
  if (attached.includes(claimed))
    return false;
  const book = await spindle.world_books.get(claimed, userId).catch(() => null);
  if (!book || !codexBookTaggedFor(book, chatId))
    return false;
  await bindCodexBookToChat(chatId, claimed, userId).catch((err) => {
    warn(`reassertCodexBinding: failed to rebind ${claimed} to ${chatId.slice(0, 8)}: ${describeError(err)}`);
  });
  return true;
}
var ROOT_CANDIDATES_TTL_MS = 8000;
var rootCandidatesCache = new Map;
function invalidateRootCandidates(userId) {
  rootCandidatesCache.delete(userId);
}
async function listRootCandidates(userId) {
  const cached = rootCandidatesCache.get(userId);
  if (cached && Date.now() - cached.at < ROOT_CANDIDATES_TTL_MS)
    return cached.data;
  const books = await listAllBooks(userId).catch(() => []);
  const out = [];
  for (const book of books) {
    const meta = book.metadata;
    const chatId = meta && typeof meta["lumibooks_chat_id"] === "string" ? meta["lumibooks_chat_id"] : null;
    if (!chatId)
      continue;
    const entries = await listAllEntries(book.id, userId).catch(() => []);
    let entryCount = 0;
    for (const e of entries) {
      const ext = e.extensions || {};
      if (ext[EXTENSION_KEY] && !e.disabled)
        entryCount++;
    }
    if (entryCount === 0)
      continue;
    const chat = await spindle.chats.get(chatId, userId).catch(() => null);
    out.push({ chatId, chatName: chat?.name?.trim() || chatId.slice(0, 8), bookId: book.id, entryCount });
  }
  rootCandidatesCache.set(userId, { at: Date.now(), data: out });
  return out;
}

// src/backend/coverage.ts
async function buildCoverage(chatId, userId, preloadedEntries, includeGhosts = false) {
  const allEntries = preloadedEntries ?? await listLmbEntries(chatId, userId);
  const entries = allEntries.filter((e) => !e.raw.disabled || includeGhosts && e.meta.ghost === true);
  const chapters = entries.filter((e) => e.meta.tier === 1);
  const arcs = entries.filter((e) => e.meta.tier === 2);
  const volumes = entries.filter((e) => e.meta.tier === 3);
  const chapterById = new Map(chapters.map((c) => [c.raw.id, c]));
  const arcById = new Map(arcs.map((a) => [a.raw.id, a]));
  const supersededArcIds = new Set;
  for (const vol of volumes) {
    for (const aid of vol.meta.sourceChapterEntryIds ?? []) {
      supersededArcIds.add(aid);
    }
  }
  const supersededChapterIds = new Set;
  for (const arc of arcs) {
    for (const cid of arc.meta.sourceChapterEntryIds ?? []) {
      supersededChapterIds.add(cid);
    }
  }
  const coveredBy = new Map;
  for (const vol of volumes) {
    for (const msgId of vol.meta.msgIds) {
      if (!coveredBy.has(msgId))
        coveredBy.set(msgId, vol.raw.id);
    }
    for (const aid of vol.meta.sourceChapterEntryIds ?? []) {
      const arc = arcById.get(aid);
      if (!arc)
        continue;
      for (const msgId of arc.meta.msgIds) {
        if (!coveredBy.has(msgId))
          coveredBy.set(msgId, vol.raw.id);
      }
      for (const cid of arc.meta.sourceChapterEntryIds ?? []) {
        const ch = chapterById.get(cid);
        if (!ch)
          continue;
        for (const msgId of ch.meta.msgIds) {
          if (!coveredBy.has(msgId))
            coveredBy.set(msgId, vol.raw.id);
        }
      }
    }
  }
  for (const arc of arcs) {
    if (supersededArcIds.has(arc.raw.id))
      continue;
    for (const msgId of arc.meta.msgIds) {
      if (!coveredBy.has(msgId))
        coveredBy.set(msgId, arc.raw.id);
    }
    for (const cid of arc.meta.sourceChapterEntryIds ?? []) {
      const ch = chapterById.get(cid);
      if (!ch)
        continue;
      for (const msgId of ch.meta.msgIds) {
        if (!coveredBy.has(msgId))
          coveredBy.set(msgId, arc.raw.id);
      }
    }
  }
  for (const chapter of chapters) {
    if (supersededChapterIds.has(chapter.raw.id))
      continue;
    for (const msgId of chapter.meta.msgIds) {
      if (!coveredBy.has(msgId))
        coveredBy.set(msgId, chapter.raw.id);
    }
  }
  const activeEntries = [
    ...volumes,
    ...arcs.filter((a) => !supersededArcIds.has(a.raw.id)),
    ...chapters.filter((c) => !supersededChapterIds.has(c.raw.id))
  ];
  return { coveredBy, activeEntries, volumes, arcs, chapters };
}
function isExcluded(m) {
  const md = m.metadata;
  return !!(md && md["lmb_excluded"] === true);
}
function isEligibleForCount(m, _profile) {
  if (isExcluded(m))
    return false;
  const role = m.role;
  if (role === "system" || m.is_system)
    return false;
  return true;
}
function countEligible(messages, profile) {
  let n = 0;
  for (const m of messages)
    if (isEligibleForCount(m, profile))
      n++;
  return n;
}
function sumEligibleTokens(messages, profile) {
  let n = 0;
  for (const m of messages) {
    if (!isEligibleForCount(m, profile))
      continue;
    n += approximateTokensFromChars((m.content || "").length);
  }
  return n;
}
function sizeEligible(messages, unit, profile) {
  return unit === "tokens" ? sumEligibleTokens(messages, profile) : countEligible(messages, profile);
}
function computeCoverageStats(messages, coverage, profile) {
  const totalMessages = messages.length;
  let coveredMessages = 0;
  let approxUncoveredTokens = 0;
  for (const m of messages) {
    if (coverage.coveredBy.has(m.id)) {
      coveredMessages++;
    } else {
      approxUncoveredTokens += approximateTokensFromChars((m.content || "").length);
    }
  }
  const uncoveredMessages = totalMessages - coveredMessages;
  const uncoveredTail = pickUncoveredTail(messages, coverage);
  const tailCounted = sizeEligible(uncoveredTail, profile.lagUnit, profile);
  const lagSatisfied = tailCounted >= profile.lagValue;
  const compressible = trimLagFromTail(uncoveredTail, profile);
  const headRoom = sizeEligible(compressible, profile.windowUnit, profile);
  const windowAvailable = headRoom >= profile.windowValue;
  return {
    totalMessages,
    coveredMessages,
    uncoveredMessages,
    approxUncoveredTokens,
    lagSatisfied,
    windowAvailable
  };
}
function countCompressibleEligible(messages, coverage, profile) {
  const tail = pickUncoveredTail(messages, coverage);
  const compressible = trimLagFromTail(tail, profile);
  return sizeEligible(compressible, profile.windowUnit, profile);
}
function trimLagFromTail(uncoveredTail, profile) {
  if (uncoveredTail.length === 0)
    return [];
  if (profile.lagValue <= 0)
    return uncoveredTail.slice();
  if (profile.lagUnit === "messages") {
    let counted = 0;
    let cutoffIdx2 = uncoveredTail.length;
    for (let i = uncoveredTail.length - 1;i >= 0; i--) {
      if (isEligibleForCount(uncoveredTail[i], profile)) {
        counted++;
        if (counted >= profile.lagValue) {
          cutoffIdx2 = i;
          break;
        }
      }
    }
    if (counted < profile.lagValue)
      return [];
    return uncoveredTail.slice(0, cutoffIdx2);
  }
  let lagged = 0;
  let cutoffIdx = 0;
  for (let i = uncoveredTail.length - 1;i >= 0; i--) {
    if (isEligibleForCount(uncoveredTail[i], profile)) {
      lagged += approximateTokensFromChars((uncoveredTail[i].content || "").length);
    }
    cutoffIdx = i;
    if (lagged >= profile.lagValue)
      break;
  }
  if (lagged < profile.lagValue)
    return [];
  return uncoveredTail.slice(0, cutoffIdx);
}
function pickUncoveredTail(messages, coverage) {
  const out = [];
  for (let i = messages.length - 1;i >= 0; i--) {
    const m = messages[i];
    if (coverage.coveredBy.has(m.id))
      break;
    out.push(m);
  }
  out.reverse();
  return out;
}
function sumApproxTokens(messages) {
  let total = 0;
  for (const m of messages)
    total += approximateTokensFromChars((m.content || "").length);
  return total;
}
function liveEndPosition(msgIds, storedLastMsgIdx, posById) {
  let end = -1;
  for (const id of msgIds) {
    const p = posById.get(id);
    if (typeof p === "number" && p > end)
      end = p;
  }
  if (end !== -1)
    return end;
  return typeof storedLastMsgIdx === "number" ? storedLastMsgIdx : Number.MAX_SAFE_INTEGER;
}
function selectNextChapterWindow(uncoveredTail, profile) {
  const compressible = trimLagFromTail(uncoveredTail, profile);
  if (compressible.length === 0)
    return [];
  if (profile.windowUnit === "messages") {
    const out = [];
    let counted = 0;
    for (const m of compressible) {
      if (isExcluded(m)) {
        if (out.length > 0)
          break;
        continue;
      }
      out.push(m);
      if (isEligibleForCount(m, profile)) {
        counted++;
        if (counted >= profile.windowValue)
          break;
      }
    }
    return out;
  }
  return takeUntilTokens(compressible, profile.windowValue, profile);
}
function takeUntilTokens(messages, maxTokens, profile) {
  const out = [];
  let acc = 0;
  for (const m of messages) {
    if (isExcluded(m)) {
      if (out.length > 0)
        break;
      continue;
    }
    out.push(m);
    if (isEligibleForCount(m, profile)) {
      acc += approximateTokensFromChars((m.content || "").length);
    }
    if (acc >= maxTokens)
      break;
  }
  return out;
}
async function syncHiddenForCoveredMessages(chatId, messages, coverage, userId, desiredHidden) {
  const toFlip = [];
  for (const m of messages) {
    if (isExcluded(m))
      continue;
    const isCovered = coverage.coveredBy.has(m.id);
    if (!isCovered)
      continue;
    const currentlyHidden = !!(m.extra && m.extra.hidden);
    if (desiredHidden && !currentlyHidden)
      toFlip.push(m.id);
    else if (!desiredHidden && currentlyHidden)
      toFlip.push(m.id);
  }
  if (toFlip.length === 0)
    return;
  const CHUNK = 500;
  for (let i = 0;i < toFlip.length; i += CHUNK) {
    const slice = toFlip.slice(i, i + CHUNK);
    try {
      await spindle.chat.setMessagesHidden(chatId, slice, desiredHidden);
    } catch {
      for (const id of slice) {
        await spindle.chat.setMessageHidden(chatId, id, desiredHidden).catch(() => {});
      }
    }
  }
}
function pickOrphanedHiddenIds(messages, coverage) {
  const out = [];
  for (const m of messages) {
    if (isExcluded(m))
      continue;
    const currentlyHidden = !!(m.extra && m.extra.hidden);
    if (!currentlyHidden)
      continue;
    if (coverage.coveredBy.has(m.id))
      continue;
    out.push(m.id);
  }
  return out;
}
async function unhideCoveredMessages(chatId, msgIds, userId) {
  if (msgIds.length === 0)
    return;
  const CHUNK = 500;
  for (let i = 0;i < msgIds.length; i += CHUNK) {
    const slice = msgIds.slice(i, i + CHUNK);
    try {
      await spindle.chat.setMessagesHidden(chatId, slice, false);
    } catch {
      for (const id of slice) {
        await spindle.chat.setMessageHidden(chatId, id, false).catch(() => {});
      }
    }
  }
}
async function resyncVisibility(chatId, userId, desiredHiddenForCovered) {
  const messages = await spindle.chat.getMessages(chatId);
  const coverage = await buildCoverage(chatId, userId);
  const orphanedHidden = pickOrphanedHiddenIds(messages, coverage);
  let hiddenBefore = 0;
  let unhiddenAfter = 0;
  if (orphanedHidden.length > 0) {
    await unhideCoveredMessages(chatId, orphanedHidden, userId).catch(() => {});
    unhiddenAfter = orphanedHidden.length;
  }
  for (const m of messages) {
    if (isExcluded(m))
      continue;
    if (!coverage.coveredBy.has(m.id))
      continue;
    const currentlyHidden = !!(m.extra && m.extra.hidden);
    if (currentlyHidden !== desiredHiddenForCovered)
      hiddenBefore++;
  }
  if (hiddenBefore > 0) {
    await syncHiddenForCoveredMessages(chatId, messages, coverage, userId, desiredHiddenForCovered).catch(() => {});
  }
  return { unhidden: unhiddenAfter, hidden: desiredHiddenForCovered ? hiddenBefore : 0 };
}

// src/backend/injection.ts
var injectionAnomalyCb = null;
function registerInjectionAnomalyCallback(cb) {
  injectionAnomalyCb = cb;
}
function isAssembledHistory(lm) {
  return lm["__isChatHistory"] === true;
}
function sourceMessageId(lm) {
  const v = lm["sourceMessageId"];
  return typeof v === "string" && v ? v : undefined;
}
function sourceIndexInChat(lm) {
  const v = lm["sourceIndexInChat"];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function orderEntries(coverage, msgIdToIdx) {
  const ordered = [];
  for (const entry of coverage.activeEntries) {
    let firstIdx = Number.POSITIVE_INFINITY;
    let lastIdx = -1;
    for (const msgId of entry.meta.msgIds) {
      const idx = msgIdToIdx.get(msgId);
      if (typeof idx !== "number")
        continue;
      if (idx < firstIdx)
        firstIdx = idx;
      if (idx > lastIdx)
        lastIdx = idx;
    }
    const haveIdx = firstIdx !== Number.POSITIVE_INFINITY;
    const resolvedFirst = haveIdx ? firstIdx : typeof entry.meta.firstMsgIdx === "number" ? entry.meta.firstMsgIdx : 0;
    const resolvedLast = haveIdx ? lastIdx : typeof entry.meta.lastMsgIdx === "number" ? entry.meta.lastMsgIdx : resolvedFirst;
    const tierName = entry.meta.tier === 3 ? "Volume" : entry.meta.tier === 2 ? "Arc" : "Chapter";
    const label = entry.raw.comment || (haveIdx ? `${tierName} msgs ${firstIdx + 1}-${lastIdx + 1}` : tierName);
    ordered.push({ entry, label, firstIdx: resolvedFirst, lastIdx: resolvedLast, emitted: false });
  }
  ordered.sort((a, b) => a.firstIdx - b.firstIdx);
  return ordered;
}
async function buildInjection(chatId, llmMessages, userId) {
  const [activated, allEntries, attachedBookIds] = await Promise.all([
    spindle.world_books.getActivated(chatId, userId).catch(() => null),
    listLmbEntries(chatId, userId),
    getChatAttachedBookIds(chatId, userId).catch(() => null)
  ]);
  if (allEntries.length === 0)
    return null;
  const ourBookId = allEntries[0].raw.world_book_id;
  const activatedIds = activated ? new Set(activated.map((a) => a.id)) : null;
  const anyOursActivated = !!activatedIds && allEntries.some((e) => activatedIds.has(e.raw.id));
  const hostScanningOurBook = anyOursActivated || !!attachedBookIds && attachedBookIds.includes(ourBookId);
  const entriesForCoverage = activatedIds && hostScanningOurBook ? allEntries.filter((e) => activatedIds.has(e.raw.id)) : allEntries.filter((e) => !e.raw.disabled);
  const coverage = await buildCoverage(chatId, userId, entriesForCoverage);
  if (coverage.activeEntries.length === 0)
    return null;
  const historyMsgs = llmMessages.filter(isAssembledHistory);
  if (historyMsgs.length === 0) {
    let chatMessages = null;
    try {
      chatMessages = await spindle.chat.getMessages(chatId);
    } catch (err) {
      error(`injection: getMessages failed while verifying an empty history, skipping injection: ${describeError(err)}`);
      injectionAnomalyCb?.(userId, "Memoria couldn't read the chat and skipped injecting memories this turn");
      return null;
    }
    const hasVisibleMessage = !!chatMessages?.some((m) => !(m.extra && m.extra.hidden));
    if (hasVisibleMessage) {
      error(`injection: no "__isChatHistory" messages on ${llmMessages.length} assembled message(s) despite ` + `visible chat messages. Possible causes: the host clipped history to fit max context, another ` + `extension reshaped the prompt first, or the active preset has no chat-history block. Skipping injection.`);
      injectionAnomalyCb?.(userId, "Memoria couldn't find the chat history in this prompt and skipped injecting memories");
    }
    return null;
  }
  const plan = [];
  let missingIdx = false;
  let anyCovered = false;
  for (const m of historyMsgs) {
    const id = sourceMessageId(m);
    if (id === undefined) {
      error(`injection: a "__isChatHistory" message is missing sourceMessageId. Host identity contract ` + `looks inconsistent, skipping injection.`);
      return null;
    }
    const idx = sourceIndexInChat(m);
    if (idx === undefined)
      missingIdx = true;
    const covered = coverage.coveredBy.has(id);
    if (covered)
      anyCovered = true;
    plan.push({ id, idx, covered });
  }
  let msgIdToIdx;
  if (anyCovered || missingIdx) {
    let chatMessages;
    try {
      chatMessages = await spindle.chat.getMessages(chatId);
    } catch (err) {
      error(`injection: getMessages failed on the slow path, skipping injection: ${describeError(err)}`);
      injectionAnomalyCb?.(userId, "Memoria couldn't read the chat and skipped injecting memories this turn");
      return null;
    }
    if (chatMessages.length === 0)
      return null;
    msgIdToIdx = new Map;
    for (let i = 0;i < chatMessages.length; i++)
      msgIdToIdx.set(chatMessages[i].id, i);
    for (const p of plan) {
      const idx = msgIdToIdx.get(p.id);
      if (idx === undefined) {
        error(`injection: sourceMessageId "${p.id}" is not in the chat, skipping injection.`);
        return null;
      }
      p.idx = idx;
      if (p.covered) {
        const md = chatMessages[idx]?.metadata;
        if (md && md["lmb_excluded"] === true)
          p.covered = false;
      }
    }
  } else {
    msgIdToIdx = new Map(plan.map((p) => [p.id, p.idx]));
  }
  const ordered = orderEntries(coverage, msgIdToIdx);
  if (ordered.length === 0)
    return null;
  const out = [];
  const injectedLabels = new Map;
  const flushAt = (index, beforePos) => {
    const block = [];
    for (const o of ordered) {
      if (o.emitted || o.lastIdx >= beforePos)
        continue;
      o.emitted = true;
      const msg = { role: "assistant", content: formatEntryForInjection(o.entry) };
      injectedLabels.set(msg, o.label);
      block.push(msg);
    }
    if (block.length)
      out.splice(index, 0, ...block);
  };
  let hp = 0;
  let histEnd = -1;
  for (const lm of llmMessages) {
    if (!isAssembledHistory(lm)) {
      out.push(lm);
      continue;
    }
    const p = plan[hp++];
    flushAt(out.length, p.idx);
    if (!p.covered)
      out.push(lm);
    histEnd = out.length;
  }
  flushAt(histEnd < 0 ? out.length : histEnd, Number.POSITIVE_INFINITY);
  if (injectedLabels.size === 0)
    return null;
  const breakdown = [];
  for (let i = 0;i < out.length; i++) {
    const label = injectedLabels.get(out[i]);
    if (label !== undefined)
      breakdown.push({ messageIndex: i, name: label });
  }
  return { messages: out, breakdown };
}
function formatEntryForInjection(entry) {
  return entry.raw.content;
}

// src/backend/codex/schema.ts
function isCodexFileKey(v) {
  return typeof v === "string" && CODEX_FILE_KEYS.includes(v);
}
var ENTITY_REF_RE = /^(char|loc|thing):[a-z0-9_]+$/;
function isEntityRef(v) {
  return typeof v === "string" && ENTITY_REF_RE.test(v);
}
function looksLikeEntityRef(v) {
  return /^(char|loc|thing):/.test(v);
}
var FILE_NAMESPACE = {
  characters: "char",
  locations: "loc",
  things: "thing"
};
var LOCKED_FIELD_MASK = "Locked, do not edit";
function emptyCodexFile(key) {
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
function emptyBundle() {
  return {
    characters: { entities: [] },
    locations: { entities: [] },
    things: { entities: [] },
    relations: { relations: [] },
    timeline: { events: [] },
    threads: { threads: [], seeds: [] },
    world: { entries: [] },
    knowledge: { items: [] }
  };
}
function bundleIsEmpty(bundle) {
  return bundle.characters.entities.length === 0 && bundle.locations.entities.length === 0 && bundle.things.entities.length === 0 && bundle.relations.relations.length === 0 && bundle.timeline.events.length === 0 && bundle.threads.threads.length === 0 && bundle.threads.seeds.length === 0 && bundle.world.entries.length === 0 && bundle.knowledge.items.length === 0;
}
function fail(errors) {
  return { ok: false, errors };
}
function str(ctx, v, path, required) {
  if (v === undefined || v === null || v === "") {
    if (required)
      ctx.errors.push(`${path}: required non-empty string`);
    return;
  }
  if (typeof v !== "string") {
    ctx.errors.push(`${path}: expected a string`);
    return;
  }
  const t = v.trim();
  if (!t && required) {
    ctx.errors.push(`${path}: required non-empty string`);
    return;
  }
  return t || undefined;
}
function strArray(ctx, v, path) {
  if (v === undefined || v === null)
    return;
  if (!Array.isArray(v)) {
    ctx.errors.push(`${path}: expected an array of strings`);
    return;
  }
  const out = [];
  v.forEach((x, i) => {
    if (typeof x !== "string")
      ctx.errors.push(`${path}[${i}]: expected a string`);
    else if (x.trim())
      out.push(x.trim());
  });
  return out.length ? out : undefined;
}
function objArray(ctx, v, path) {
  if (v === undefined || v === null)
    return [];
  if (!Array.isArray(v)) {
    ctx.errors.push(`${path}: expected an array`);
    return [];
  }
  const out = [];
  v.forEach((x, i) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) {
      ctx.errors.push(`${path}[${i}]: expected an object`);
    } else {
      out.push(x);
    }
  });
  return out;
}
function asRecord(ctx, raw, path) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    ctx.errors.push(`${path}: expected a JSON object`);
    return null;
  }
  return raw;
}
var CANONICAL_MIXED_CASE = new Set(["lockedFields"]);
function keepExtras(ctx, target, source, known, path, strict) {
  for (const [k, v] of Object.entries(source)) {
    const lower = k.toLowerCase();
    if (known.some((f) => f === lower)) {
      if (k !== lower && strict && !CANONICAL_MIXED_CASE.has(k))
        ctx.errors.push(`${path}.${k}: use lowercase "${lower}"`);
      continue;
    }
    if (k === "__proto__")
      continue;
    if (typeof v === "string") {
      if (v.trim())
        target[k] = v.trim();
    } else if (typeof v === "number" && Number.isFinite(v)) {
      target[k] = v;
    } else if (typeof v === "boolean") {
      target[k] = v ? "true" : "false";
    } else if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      const arr = v.map((x) => x.trim()).filter(Boolean);
      if (arr.length)
        target[k] = arr;
    } else if (v !== null && v !== undefined && strict) {
      ctx.errors.push(`${path}.${k}: extra fields must be primitive (string, number, boolean, or string[]), flatten this`);
    }
  }
}
var ENTITY_KNOWN_FIELDS = [
  "id",
  "name",
  "aliases",
  "kind",
  "role",
  "appearance",
  "description",
  "traits",
  "goals",
  "significance",
  "status",
  "ties",
  "notes",
  "keywords",
  "locked",
  "lockedfields",
  "rid"
];
function ridOf(ctx, v, path) {
  if (v === undefined || v === null)
    return;
  if (typeof v !== "string" || !v.trim()) {
    ctx.errors.push(`${path}.rid: expected a short string`);
    return;
  }
  return v.trim().slice(0, 24);
}
function validateEntityFile(key, raw, opts) {
  const ctx = { errors: [] };
  const root = asRecord(ctx, raw, key);
  if (!root)
    return fail(ctx.errors);
  const ns = FILE_NAMESPACE[key];
  const seen = new Set;
  const entities = [];
  for (const [i, e] of objArray(ctx, root["entities"], "entities").entries()) {
    const path = `entities[${i}]`;
    const id = str(ctx, e["id"], `${path}.id`, true);
    const name = str(ctx, e["name"], `${path}.name`, true);
    if (!id || !name)
      continue;
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
    const out = { id, name };
    const aliases = strArray(ctx, e["aliases"], `${path}.aliases`);
    if (aliases)
      out.aliases = aliases;
    for (const f of ["kind", "role", "appearance", "description", "significance", "notes"]) {
      const v = str(ctx, e[f], `${path}.${f}`, false);
      if (v)
        out[f] = v;
    }
    if (e["locked"] === true || e["locked"] === "true")
      out.locked = true;
    const lockedFields = strArray(ctx, e["lockedFields"] ?? e["lockedfields"], `${path}.lockedFields`);
    if (lockedFields) {
      const cleaned = [...new Set(lockedFields.filter((f) => f !== "id" && f !== "name"))];
      if (cleaned.length)
        out.lockedFields = cleaned;
    }
    if (opts.strictExtras === true && e["status"] !== undefined && e["status"] !== null && e["status"] !== "") {
      ctx.errors.push(`${path}.status: this field was removed - keep durable state in description, drop scene-of-the-moment state`);
    }
    for (const f of ["traits", "goals", "keywords"]) {
      const v = strArray(ctx, e[f], `${path}.${f}`);
      if (v)
        out[f] = v;
    }
    const ties = strArray(ctx, e["ties"], `${path}.ties`);
    if (ties) {
      if (opts.relationsTable && !out.locked) {
        ctx.errors.push(`${path}.ties: the relations table is enabled, move these into relations.json rows`);
      } else {
        out.ties = ties;
      }
    }
    keepExtras(ctx, out, e, ENTITY_KNOWN_FIELDS, path, opts.strictExtras === true);
    entities.push(out);
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { entities } };
}
function validateRelationsFile(raw, opts) {
  const ctx = { errors: [] };
  const root = asRecord(ctx, raw, "relations");
  if (!root)
    return fail(ctx.errors);
  const rawLen = Array.isArray(root["relations"]) ? root["relations"].length : 0;
  if (!opts.relationsTable && rawLen > 0) {
    return fail(["relations: the relations table is disabled for this profile, keep connections as ties on entity sheets instead"]);
  }
  const rows = objArray(ctx, root["relations"], "relations");
  const relations = [];
  for (const [i, r] of rows.entries()) {
    const path = `relations[${i}]`;
    const type = r["type"];
    const rid = ridOf(ctx, r["rid"], path);
    if (type === "pair") {
      const a = str(ctx, r["a"], `${path}.a`, true);
      const b = str(ctx, r["b"], `${path}.b`, true);
      const kind = str(ctx, r["kind"], `${path}.kind`, true);
      const state = str(ctx, r["state"], `${path}.state`, true);
      if (!a || !b || !kind || !state)
        continue;
      if (!isEntityRef(a))
        ctx.errors.push(`${path}.a: "${a}" is not a valid entity ref`);
      if (!isEntityRef(b))
        ctx.errors.push(`${path}.b: "${b}" is not a valid entity ref`);
      if (a === b)
        ctx.errors.push(`${path}: a and b are the same entity`);
      const history = strArray(ctx, r["history"], `${path}.history`);
      relations.push({ type: "pair", ...rid ? { rid } : {}, a, b, kind, state, ...history ? { history } : {} });
    } else if (type === "group") {
      const kind = str(ctx, r["kind"], `${path}.kind`, true);
      const state = str(ctx, r["state"], `${path}.state`, true);
      const members = [...new Set(strArray(ctx, r["members"], `${path}.members`) ?? [])];
      if (!kind || !state)
        continue;
      if (members.length < 2)
        ctx.errors.push(`${path}.members: a group needs at least 2 distinct members`);
      for (const m of members) {
        if (!isEntityRef(m))
          ctx.errors.push(`${path}.members: "${m}" is not a valid entity ref`);
      }
      let roles;
      const rawRoles = r["roles"];
      if (rawRoles !== undefined && rawRoles !== null) {
        const rec = asRecord(ctx, rawRoles, `${path}.roles`);
        if (rec) {
          roles = {};
          for (const [k, v] of Object.entries(rec)) {
            if (!isEntityRef(k))
              ctx.errors.push(`${path}.roles: key "${k}" is not a valid entity ref`);
            else if (typeof v !== "string" || !v.trim())
              ctx.errors.push(`${path}.roles["${k}"]: expected a string role`);
            else
              roles[k] = v.trim();
          }
          if (Object.keys(roles).length === 0)
            roles = undefined;
        }
      }
      const history = strArray(ctx, r["history"], `${path}.history`);
      relations.push({
        type: "group",
        ...rid ? { rid } : {},
        kind,
        members,
        state,
        ...roles ? { roles } : {},
        ...history ? { history } : {}
      });
    } else {
      ctx.errors.push(`${path}.type: expected "pair" or "group"`);
    }
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { relations } };
}
function validateTimelineFile(raw) {
  const ctx = { errors: [] };
  const root = asRecord(ctx, raw, "timeline");
  if (!root)
    return fail(ctx.errors);
  const events = [];
  for (const [i, e] of objArray(ctx, root["events"], "events").entries()) {
    const path = `events[${i}]`;
    const when = str(ctx, e["when"], `${path}.when`, true);
    const event = str(ctx, e["event"], `${path}.event`, true);
    const rid = ridOf(ctx, e["rid"], path);
    if (!when || !event)
      continue;
    const out = { ...rid ? { rid } : {}, when, event };
    const participants = strArray(ctx, e["participants"], `${path}.participants`);
    if (participants)
      out.participants = participants;
    const where = str(ctx, e["where"], `${path}.where`, false);
    if (where)
      out.where = where;
    const causes = str(ctx, e["causes"], `${path}.causes`, false);
    if (causes)
      out.causes = causes;
    events.push(out);
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { events } };
}
function validateThreadsFile(raw) {
  const ctx = { errors: [] };
  const root = asRecord(ctx, raw, "threads");
  if (!root)
    return fail(ctx.errors);
  const threads = [];
  for (const [i, t] of objArray(ctx, root["threads"], "threads").entries()) {
    const path = `threads[${i}]`;
    const name = str(ctx, t["name"], `${path}.name`, true);
    const summary = str(ctx, t["summary"], `${path}.summary`, true);
    const status = t["status"];
    const rid = ridOf(ctx, t["rid"], path);
    if (!name || !summary)
      continue;
    if (status !== "open" && status !== "stalled" && status !== "resolved" && status !== "abandoned") {
      ctx.errors.push(`${path}.status: expected open | stalled | resolved | abandoned`);
      continue;
    }
    const out = { ...rid ? { rid } : {}, name, status, summary };
    const latest = str(ctx, t["latest"], `${path}.latest`, false);
    if (latest)
      out.latest = latest;
    const planted = strArray(ctx, t["planted"], `${path}.planted`);
    if (planted)
      out.planted = planted;
    threads.push(out);
  }
  const seeds = strArray(ctx, root["seeds"], "seeds") ?? [];
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { threads, seeds } };
}
function validateWorldFile(raw) {
  const ctx = { errors: [] };
  const root = asRecord(ctx, raw, "world");
  if (!root)
    return fail(ctx.errors);
  const entries = [];
  for (const [i, e] of objArray(ctx, root["entries"], "entries").entries()) {
    const path = `entries[${i}]`;
    const topic = str(ctx, e["topic"], `${path}.topic`, true);
    const facts = strArray(ctx, e["facts"], `${path}.facts`) ?? [];
    const rid = ridOf(ctx, e["rid"], path);
    if (!topic)
      continue;
    if (facts.length === 0) {
      ctx.errors.push(`${path}.facts: at least one fact required, drop the topic if it has none`);
      continue;
    }
    const keywords = strArray(ctx, e["keywords"], `${path}.keywords`);
    entries.push({ ...rid ? { rid } : {}, topic, facts, ...keywords ? { keywords } : {} });
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { entries } };
}
function validateKnowledgeFile(raw) {
  const ctx = { errors: [] };
  const root = asRecord(ctx, raw, "knowledge");
  if (!root)
    return fail(ctx.errors);
  const items = [];
  for (const [i, k] of objArray(ctx, root["items"], "items").entries()) {
    const path = `items[${i}]`;
    const fact = str(ctx, k["fact"], `${path}.fact`, true);
    const rid = ridOf(ctx, k["rid"], path);
    if (!fact)
      continue;
    const out = { ...rid ? { rid } : {}, fact };
    const knownBy = strArray(ctx, k["knownBy"], `${path}.knownBy`);
    if (knownBy)
      out.knownBy = knownBy;
    const hiddenFrom = strArray(ctx, k["hiddenFrom"], `${path}.hiddenFrom`);
    if (hiddenFrom)
      out.hiddenFrom = hiddenFrom;
    const rawBeliefs = k["falseBeliefs"];
    if (rawBeliefs !== undefined && rawBeliefs !== null) {
      const beliefs = [];
      for (const [j, b] of objArray(ctx, rawBeliefs, `${path}.falseBeliefs`).entries()) {
        const who = str(ctx, b["who"], `${path}.falseBeliefs[${j}].who`, true);
        const believes = str(ctx, b["believes"], `${path}.falseBeliefs[${j}].believes`, true);
        if (who && believes)
          beliefs.push({ who, believes });
      }
      if (beliefs.length)
        out.falseBeliefs = beliefs;
    }
    const note = str(ctx, k["note"], `${path}.note`, false);
    if (note)
      out.note = note;
    const keywords = strArray(ctx, k["keywords"], `${path}.keywords`);
    if (keywords)
      out.keywords = keywords;
    if (!out.knownBy && !out.hiddenFrom && !out.falseBeliefs) {
      ctx.errors.push(`${path}: needs at least one of knownBy, hiddenFrom, falseBeliefs - facts everyone knows belong in world or timeline`);
      continue;
    }
    items.push(out);
  }
  if (ctx.errors.length)
    return fail(ctx.errors);
  return { ok: true, value: { items } };
}
function validateCodexFile(key, raw, opts) {
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
function collectEntityIds(bundle) {
  const ids = new Set;
  for (const file of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of file.entities)
      ids.add(e.id);
  }
  return ids;
}
function collectDangling(bundle) {
  const ids = collectEntityIds(bundle);
  const out = [];
  const check = (ref, path, file) => {
    if (looksLikeEntityRef(ref) && !ids.has(ref))
      out.push({ ref, path, file });
  };
  bundle.relations.relations.forEach((r, i) => {
    if (r.type === "pair") {
      check(r.a, `relations[${i}].a`, "relations");
      check(r.b, `relations[${i}].b`, "relations");
    } else {
      r.members.forEach((m) => check(m, `relations[${i}].members`, "relations"));
      for (const k of Object.keys(r.roles ?? {}))
        check(k, `relations[${i}].roles`, "relations");
    }
  });
  bundle.knowledge.items.forEach((k, i) => {
    (k.knownBy ?? []).forEach((w) => check(w, `knowledge items[${i}].knownBy`, "knowledge"));
    (k.hiddenFrom ?? []).forEach((w) => check(w, `knowledge items[${i}].hiddenFrom`, "knowledge"));
    (k.falseBeliefs ?? []).forEach((b, j) => check(b.who, `knowledge items[${i}].falseBeliefs[${j}].who`, "knowledge"));
  });
  bundle.timeline.events.forEach((e, i) => {
    (e.participants ?? []).forEach((p) => check(p, `timeline events[${i}].participants`, "timeline"));
    if (e.where)
      check(e.where, `timeline events[${i}].where`, "timeline");
  });
  return out;
}
function formatDangling(d) {
  return d.file === "relations" ? `${d.path}: "${d.ref}" is not defined in any entity file - add the entity, or drop or retarget the row (relations only take entity refs)` : `${d.path}: "${d.ref}" is not defined in any entity file - add the entity or use plain text`;
}
function checkIntegrity(bundle) {
  return collectDangling(bundle).map(formatDangling);
}
function newDanglingErrors(bundle, tolerate) {
  const used = new Map;
  const out = [];
  for (const d of collectDangling(bundle)) {
    const key = `${d.file}::${d.ref}`;
    const budget = tolerate.get(key) ?? 0;
    const spent = used.get(key) ?? 0;
    used.set(key, spent + 1);
    if (spent < budget)
      continue;
    out.push(formatDangling(d));
  }
  return out;
}
function danglingRefCounts(bundle) {
  const m = new Map;
  for (const d of collectDangling(bundle)) {
    const key = `${d.file}::${d.ref}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}
var FILE_ROW_KEY = {
  characters: { field: "entities", key: "id" },
  locations: { field: "entities", key: "id" },
  things: { field: "entities", key: "id" },
  relations: { field: "relations", key: "rid" },
  timeline: { field: "events", key: "rid" },
  threads: { field: "threads", key: "rid" },
  world: { field: "entries", key: "rid" },
  knowledge: { field: "items", key: "rid" }
};
function fileRows(value, key) {
  const arr = value[FILE_ROW_KEY[key].field];
  return Array.isArray(arr) ? arr : [];
}
function assignMissingRids(key, value) {
  if (FILE_ROW_KEY[key].key !== "rid")
    return;
  const rows = fileRows(value, key);
  let max = 0;
  const seen = new Set;
  for (const row of rows) {
    const rid = typeof row["rid"] === "string" ? row["rid"] : "";
    if (!rid || seen.has(rid)) {
      delete row["rid"];
      continue;
    }
    seen.add(rid);
    const m = /^r(\d+)$/.exec(rid);
    if (m)
      max = Math.max(max, parseInt(m[1], 10));
  }
  for (const row of rows) {
    if (typeof row["rid"] === "string" && row["rid"])
      continue;
    let next = `r${++max}`;
    while (seen.has(next))
      next = `r${++max}`;
    row["rid"] = next;
    seen.add(next);
  }
}

// src/backend/codex/store.ts
var CODEX_DIR = "codex";
var SIG_CAP = 500;
function emptyCursor() {
  return {
    version: 1,
    lastMsgId: null,
    consumedSigs: [],
    fileStates: {},
    frozenAtRuns: {},
    refreshPending: [],
    prefixMsgId: null,
    pendingReconcile: false,
    reconcileUntilMsgId: null,
    relationsTableMode: null,
    lastRunAt: null,
    lastRunStats: null,
    runs: 0,
    updatedAt: 0
  };
}
function normalizeRunStats(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  if (typeof v.rounds !== "number" || typeof v.model !== "string")
    return null;
  return {
    rounds: v.rounds,
    promptTokens: typeof v.promptTokens === "number" ? v.promptTokens : 0,
    completionTokens: typeof v.completionTokens === "number" ? v.completionTokens : 0,
    model: v.model,
    ...typeof v.note === "string" && v.note.trim() ? { note: v.note.trim() } : {}
  };
}
function dir(chatId) {
  return `${CODEX_DIR}/${chatId}`;
}
function filePath(chatId, key) {
  return `${dir(chatId)}/${key}.json`;
}
function cursorPath(chatId) {
  return `${dir(chatId)}/cursor.json`;
}
function msgSig(role, content) {
  let h = 2166136261;
  const s = `${role}\x00${content}`;
  for (let i = 0;i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
async function loadCursor(chatId, userId) {
  const read = await readJsonFileRaw(cursorPath(chatId), userId);
  if (read.state === "unreadable") {
    throw new Error(`The codex cursor is unreadable: ${read.error}`);
  }
  const raw = read.state === "ok" ? read.value : null;
  if (!raw || typeof raw !== "object")
    return emptyCursor();
  const base = emptyCursor();
  const fileStates = {};
  if (raw.fileStates && typeof raw.fileStates === "object") {
    for (const [k, v] of Object.entries(raw.fileStates)) {
      if (v === "on" || v === "noInject" || v === "frozen")
        fileStates[k] = v;
    }
  }
  const frozenAtRuns = {};
  if (raw.frozenAtRuns && typeof raw.frozenAtRuns === "object") {
    for (const [k, v] of Object.entries(raw.frozenAtRuns)) {
      if (typeof v === "number" && Number.isFinite(v))
        frozenAtRuns[k] = v;
    }
  }
  return {
    version: 1,
    lastMsgId: typeof raw.lastMsgId === "string" && raw.lastMsgId ? raw.lastMsgId : null,
    consumedSigs: Array.isArray(raw.consumedSigs) ? raw.consumedSigs.filter((x) => !!x && typeof x === "object" && typeof x.id === "string" && typeof x.sig === "string") : base.consumedSigs,
    fileStates,
    frozenAtRuns,
    refreshPending: Array.isArray(raw.refreshPending) ? [...new Set(raw.refreshPending.filter((x) => typeof x === "string" && CODEX_FILE_KEYS.includes(x)))] : [],
    prefixMsgId: typeof raw.prefixMsgId === "string" && raw.prefixMsgId ? raw.prefixMsgId : null,
    pendingReconcile: raw.pendingReconcile === true,
    reconcileUntilMsgId: typeof raw.reconcileUntilMsgId === "string" && raw.reconcileUntilMsgId ? raw.reconcileUntilMsgId : null,
    relationsTableMode: typeof raw.relationsTableMode === "boolean" ? raw.relationsTableMode : null,
    lastRunAt: typeof raw.lastRunAt === "number" ? raw.lastRunAt : null,
    lastRunStats: normalizeRunStats(raw.lastRunStats),
    runs: typeof raw.runs === "number" && Number.isFinite(raw.runs) ? raw.runs : 0,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0
  };
}
async function saveCursor(chatId, cursor, userId) {
  const overflow = cursor.consumedSigs.length - SIG_CAP;
  const prefixMsgId = overflow > 0 ? cursor.consumedSigs[overflow - 1].id : cursor.prefixMsgId;
  const trimmed = {
    ...cursor,
    prefixMsgId,
    consumedSigs: cursor.consumedSigs.slice(-SIG_CAP),
    updatedAt: Date.now()
  };
  await spindle.userStorage.setJson(cursorPath(chatId), trimmed, { indent: 0, userId });
}
async function readJsonFileRaw(path, userId) {
  let exists;
  try {
    exists = await spindle.userStorage.exists(path, userId);
  } catch (err) {
    return { state: "unreadable", error: describeError(err) };
  }
  if (!exists)
    return { state: "absent" };
  try {
    const text = await spindle.userStorage.read(path, userId);
    return { state: "ok", value: JSON.parse(text) };
  } catch (err) {
    return { state: "unreadable", error: describeError(err) };
  }
}
function readCodexFileRaw(chatId, key, userId) {
  return readJsonFileRaw(filePath(chatId, key), userId);
}
async function loadCodex(chatId, userId, opts) {
  const bundle = emptyBundle();
  const problems = [];
  await Promise.all(CODEX_FILE_KEYS.map(async (key) => {
    const read = await readCodexFileRaw(chatId, key, userId);
    if (read.state === "absent")
      return;
    if (read.state === "unreadable") {
      problems.push({ file: key, errors: [`unreadable on disk: ${read.error}`] });
      warn(`codex: ${key}.json for ${chatId.slice(0, 8)} is unreadable: ${read.error}`);
      return;
    }
    const result = validateCodexFile(key, read.value, opts);
    if (result.ok) {
      assignMissingRids(key, result.value);
      bundle[key] = result.value;
    } else {
      problems.push({ file: key, errors: result.errors });
      warn(`codex: ${key}.json for ${chatId.slice(0, 8)} failed validation, treating as empty: ${result.errors.slice(0, 3).join("; ")}`);
    }
  }));
  return { bundle, problems };
}
async function saveCodexFile(chatId, key, value, userId) {
  await spindle.userStorage.setJson(filePath(chatId, key), value, { indent: 1, userId });
}
async function codexExists(chatId, userId) {
  return spindle.userStorage.exists(cursorPath(chatId), userId).catch(() => false);
}
async function codexPresence(chatId, userId) {
  const exists = await spindle.userStorage.exists(cursorPath(chatId), userId);
  return exists ? "present" : "absent";
}
async function codexHasAnyDataFile(chatId, userId) {
  for (const key of CODEX_FILE_KEYS) {
    if (await spindle.userStorage.exists(filePath(chatId, key), userId))
      return true;
  }
  return false;
}
var cursorChain = new Map;
function withCursorLock(chatId, userId, fn) {
  const key = `${userId}::${chatId}`;
  const prev = cursorChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  cursorChain.set(key, guarded);
  guarded.then(() => {
    if (cursorChain.get(key) === guarded)
      cursorChain.delete(key);
  });
  return tail;
}
async function deleteCodex(chatId, userId) {
  const failed = [];
  for (const key of CODEX_FILE_KEYS) {
    let exists;
    try {
      exists = await spindle.userStorage.exists(filePath(chatId, key), userId);
    } catch (err) {
      failed.push(key);
      warn(`codex: exists() failed for ${key}.json of ${chatId.slice(0, 8)}: ${describeError(err)}`);
      continue;
    }
    if (!exists)
      continue;
    try {
      await spindle.userStorage.delete(filePath(chatId, key), userId);
    } catch (err) {
      failed.push(key);
      warn(`codex: failed to delete ${key}.json for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    }
  }
  if (failed.length === 0) {
    await spindle.userStorage.delete(cursorPath(chatId), userId).catch((err) => {
      warn(`codex: failed to delete cursor for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    });
  }
  return failed;
}
async function inheritCodex(fromChatId, toChatId, userId, remapId, reconcileUntilId) {
  if (await codexPresence(fromChatId, userId) !== "present")
    return false;
  return withCursorLock(toChatId, userId, async () => {
    let preFreeze = null;
    if (await codexPresence(toChatId, userId) === "present") {
      const target = await loadCursor(toChatId, userId);
      const untouched = target.runs === 0 && target.consumedSigs.length === 0 && target.lastMsgId === null;
      if (!untouched || await codexHasAnyDataFile(toChatId, userId))
        return false;
      preFreeze = target;
    }
    const cursor = await loadCursor(fromChatId, userId);
    for (const key of CODEX_FILE_KEYS) {
      const read = await readCodexFileRaw(fromChatId, key, userId);
      if (read.state === "unreadable") {
        throw new Error(`${key}.json is unreadable on the source chat: ${read.error}`);
      }
      if (read.state === "absent")
        continue;
      await spindle.userStorage.setJson(filePath(toChatId, key), read.value, { indent: 1, userId });
    }
    const sigs = [];
    for (const rec of cursor.consumedSigs) {
      const mapped = remapId(rec.id);
      if (!mapped)
        break;
      sigs.push({ id: mapped, sig: rec.sig });
    }
    const mappedLast = cursor.lastMsgId ? remapId(cursor.lastMsgId) : null;
    const mappedPrefix = cursor.prefixMsgId ? remapId(cursor.prefixMsgId) : null;
    const next = {
      ...cursor,
      consumedSigs: sigs,
      lastMsgId: mappedLast ?? (sigs.length ? sigs[sigs.length - 1].id : mappedPrefix),
      prefixMsgId: mappedPrefix,
      pendingReconcile: true,
      reconcileUntilMsgId: reconcileUntilId,
      ...preFreeze ? {
        fileStates: { ...cursor.fileStates, ...preFreeze.fileStates },
        frozenAtRuns: { ...cursor.frozenAtRuns, ...preFreeze.frozenAtRuns }
      } : {}
    };
    await saveCursor(toChatId, next, userId);
    return true;
  });
}
async function readCodexFilesRaw(chatId, userId) {
  const out = {};
  await Promise.all(CODEX_FILE_KEYS.map(async (key) => {
    const read = await readCodexFileRaw(chatId, key, userId);
    if (read.state === "unreadable") {
      warn(`codex: read ${key}.json failed: ${read.error}`);
      out[key] = `UNREADABLE ${key}.json - the file exists but cannot be parsed (${read.error}). Fix or delete it before saving.`;
      return;
    }
    out[key] = JSON.stringify(read.state === "ok" ? read.value : emptyCodexFile(key), null, 2);
  }));
  return out;
}

// src/backend/regex.ts
var TTL_MS = 5000;
var cachedScripts = new Map;
async function listRegexScripts(userId) {
  const cached = cachedScripts.get(userId);
  if (cached && Date.now() - cached.at < TTL_MS)
    return cached.data;
  try {
    const result = await spindle.regex_scripts.list({ userId });
    cachedScripts.set(userId, { at: Date.now(), data: result.data });
    return result.data;
  } catch (err) {
    warn(`regex_scripts.list failed: ${describeError(err)}`);
    cachedScripts.set(userId, { at: Date.now(), data: [] });
    return [];
  }
}
function invalidateRegexCache(userId) {
  if (userId)
    cachedScripts.delete(userId);
  else
    cachedScripts.clear();
}
async function applySelectedRegex(text, scriptIds, userId) {
  if (!scriptIds.length)
    return text;
  const all = await listRegexScripts(userId);
  const byId = new Map(all.map((s) => [s.id, s]));
  let out = text;
  for (const id of scriptIds) {
    const script = byId.get(id);
    if (!script)
      continue;
    out = runScript(out, script);
  }
  return out;
}
var REGEX_INPUT_MAX_CHARS = 500000;
function runScript(input, script) {
  const pattern = script.find_regex;
  const replace = script.replace_string ?? "";
  if (!pattern)
    return input;
  if (input.length > REGEX_INPUT_MAX_CHARS) {
    warn(`regex script ${script.id} skipped: input too long (${input.length} chars)`);
    return input;
  }
  try {
    const flags = script.flags && script.flags.length > 0 ? script.flags : "g";
    const re = new RegExp(pattern, flags);
    return input.replace(re, replace);
  } catch (err) {
    warn(`regex script ${script.id} failed: ${describeError(err)}`);
    return input;
  }
}

// src/prompts/fill.ts
function fillPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars) ? String(vars[k]) : m);
}

// src/prompts/books/target-directive.txt
var target_directive_default = "Aim for {{target_words}} words of output (about {{target_tokens}} tokens, or {{target_percent}}% of the original text). Scale detail to hit that budget while preserving everything plot-relevant. Do not go over or under that target.";

// src/prompts/books/chapter-summary.txt
var chapter_summary_default = `You are a talented summarist skilled at capturing scenes from stories comprehensively. Analyze the following roleplay scene and return a detailed memory as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Detailed beat-by-beat summary in narrative prose...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a detailed beat-by-beat summary in narrative prose. First, note the dates/time. Then capture the scene accurately without losing important information EXCEPT FOR [OOC] conversation/interaction, which should be ignored. This summary will go in a lorebook entry, so include:
- All important story beats/events that happened
- Key interaction highlights and character developments
- Notable details, memorable quotes, and revelations
- Outcome and anything else important for future continuity
Capture nuance without repeating verbatim. Make it comprehensive yet digestible.

For the keywords field, provide 15-30 specific, descriptive, relevant keywords for keyword retrieval via word-matching in chat context. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-summarize.txt
var chapter_summarize_default = `Analyze the following roleplay scene and return a structured summary as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Detailed summary with markdown headers...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a detailed bullet-point summary using markdown with these headers (skip and ignore all OOC conversation/interaction):
- **Timeline**: Day/time this scene covers.
- **Story Beats**: List all important plot events and story developments that occurred.
- **Key Interactions**: Describe the important character interactions, dialogue highlights, and relationship developments.
- **Notable Details**: Mention any important objects, settings, revelations, or details that might be relevant for future interactions.
- **Outcome**: Summarize the result, resolution, or state of affairs at the end of the scene.

For the keywords field, provide 15-30 specific, descriptive, relevant keywords that would help a keyworded database find this conversation again if something is mentioned. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Capture all important information - comprehensiveness within the target budget matters more than terseness.

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-synopsis.txt
var chapter_synopsis_default = `Analyze the following roleplay scene in the context of previous summaries (if available) and return a comprehensive synopsis as JSON.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short, descriptive scene title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Long detailed synopsis with markdown structure...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field, create a beat-by-beat summary of the scene that *replaces reading the full scene* while preserving all plot-relevant nuance, reading like a clean, structured scene log - concise yet complete. Exercise judgment as to whether an interaction is flavor-only or truly affects the plot. Flavor scenes may be captured through key exchanges and skipped when recording story beats.

Write in **past tense**, **third-person**, and exclude all [OOC] or meta discussion.
Use concrete nouns (e.g., "rice cooker" > "appliance").
Only use adjectives/adverbs when they materially affect tone, emotion, or characterization.
Focus on **cause \u2192 intention \u2192 reaction \u2192 consequence** chains for clarity and compression.

# [Scene Title]
**Timeline**: (day/time)

## Story Beats
- Present all major actions, revelations, and emotional shifts in order.
- Capture clear cause-effect logic: what triggered what, and why it mattered.
- Only include plot-affecting interactions; do not capture flavor-only beats.

## Character Dynamics
- Summarize how each character's **motives, emotions, and relationships** evolved.
- Include subtext, tension, or silent implications.
- Highlight key beats of conflict, vulnerability, trust, or power shifts.

## Key Exchanges
- Include only pivotal dialogue that defines tone, emotion, or change.
- Attribute speakers by name; keep quotes short but exact.
- BE SELECTIVE. Maximum of 8 quotes.

## Outcome & Continuity
- Detail resulting **decisions, emotional states, physical effects, or narrative consequences**.
- Include all elements that influence future continuity (knowledge, relationships, injuries, promises, etc.).
- Note any unresolved threads or foreshadowed elements.

Write compactly but completely - every line should add new information or insight.
Synthesize redundant actions or dialogue into unified cause-effect-emotion beats.
Favor compression over coverage whenever the two conflict; omit anything that can be inferred from context or established characterization.

For the keywords field:

Generate **15-30 standalone topical keywords** that function as retrieval tags, not micro-summaries.
Keywords must be:
- **Concrete and scene-specific** (locations, objects, proper nouns, unique actions, repeated motifs).
- **One concept per keyword** - do NOT combine multiple ideas into one keyword.
- **Useful for retrieval if the user later mentions that noun or action alone**, not only in a specific context.
- Not character names.
- **Not thematic, emotional, or abstract.** Stop-list: intimacy, vulnerability, trust, dominance, submission, power dynamics, boundaries, jealousy, aftercare, longing, consent, emotional connection.

Avoid:
- Overly specific compound keywords ("David Tokyo marriage").
- Narrative or plot-summary style keywords ("art dealer date fail").
- Keywords that contain multiple facts or descriptors.
- Keywords that only make sense when the whole scene is remembered.

Prefer:
- Proper nouns (e.g., "Chinatown", "Ritz-Carlton bar").
- Specific physical objects ("CPAP machine", "chocolate chip cookies").
- Distinctive actions ("cookie baking", "piano apology").
- Unique phrases or identifiers from the scene ("pack for forever", "dick-measuring contest").

Return ONLY the JSON, no other text.`;

// src/prompts/books/chapter-minimal.txt
var chapter_minimal_default = `Analyze the following roleplay scene and return an ultra-concise memory as JSON. Prioritize compression over coverage. Capture only load-bearing plot moves and the single most important consequence; omit anything inferable from context.

{{TARGET_DIRECTIVE}}

You must respond with ONLY valid JSON in this exact format:
{
  "title": "Short scene title (1-3 words)",
  "opener": "{{memoria_opener}}",
  "content": "Ultra-concise prose summary, prioritizing compression over coverage...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

For the content field: prose only, past tense, third person. Skip all [OOC]/meta. Skip flavor and atmosphere. Keep only events that change state, decisions that bind future scenes, or revelations the characters cannot un-know.

For the keywords field, generate 15-30 specific, descriptive, highly relevant keywords for database retrieval - focus on the most important terms that would help find this scene later. Keywords must be concrete and scene-specific (locations, objects, proper nouns, unique actions). Do not use abstract themes (e.g., "sadness", "love") or character names.

Return ONLY the JSON, no other text.`;

// src/prompts/books/arc-default.txt
var arc_default_default = `You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple scene summaries (of varying detail and formatting), normalize them, reconstruct the full chronology, identify a self-contained story arc, and output a single memory arc entry in JSON.

The arc must be token-efficient, plot-accurate, and compatible with long-running RP memory systems.

{{TARGET_DIRECTIVE}}

Strict output format (JSON only; no markdown, no prose outside JSON):
{
  "title": "Short descriptive arc title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Structured arc summary as a single string (see Summary Content Structure below).",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

Notes:
- Respect chronology of the source chapters (oldest first).
- If some source chapters do not fit the arc you produce, summarize the arc anyway and ignore the outliers.

PROCESS

STEP 1 - UNIFIED STORY (internal only)
- Combine ALL provided chapter summaries into a single chronological retelling.
- Ignore OOC/meta content.
- Preserve plot-relevant events, character choices, emotional shifts, decisions, consequences, conflicts, promises, boundary negotiations.
- Exclude flavor-only content unless it affects future behavior.
- Normalize to past-tense, third-person.
- Focus on cause \u2192 intention \u2192 reaction \u2192 consequence chains.
- Do NOT output this unified story.

STEP 2 - IDENTIFY THE STORY ARC
- From the unified story, identify the single self-contained arc that represents the most significant narrative movement across these chapters.

STEP 3 - BUILD THE ARC OBJECT

title:
- 3-6 words, descriptive of the arc's core.

content (the entire "Summary Content Structure" below must appear inside this single string; use headings and bullets as plain text):

Summary Content Structure (follow inside the content string):

# [Arc Title]
Time period: What timeframe the arc covers (e.g. "March 3-10", "Week of July 15").

Arc Premise: One sentence describing what this arc is about.

## Major Beats
- 3-7 bullets capturing the major plot movements of this arc
- Focus on cause \u2192 effect logic
- Include only plot-affecting events

## Character Dynamics
- 1-2 paragraphs describing how the characters' emotions, motives, boundaries, or relationships changed
- Include subtext, tension shifts, power exchange changes, new trust/vulnerabilities, or new conflicts
- Include silent implications if relevant

## Key Exchanges
- Up to 8 short, exact quotes
- Only include dialogue that materially shifted tone, emotion, or relationship dynamics

## Outcome & Continuity
- 4-8 bullets capturing:
  - decisions
  - promises
  - new emotional states
  - new routines/rituals
  - injuries or physical changes
  - foreshadowed future events
  - unresolved threads
  - permanent consequences

STEP 4 - KEYWORDS
- Provide 15-30 standalone retrieval keywords.

MUST:
- Concrete nouns, physical objects, places, proper nouns, distinctive actions, or memorable scene elements
- Each keyword = ONE concept only
- Each keyword must be retrievable if mentioned ALONE
- Use ONLY nouns or noun-phrases

MUST NOT:
- No narrative/summary keywords ("start of affair", "argument resolved")
- No emotional/abstract words (intimacy, vulnerability, trust, jealousy, dominance, submission, aftercare, connection, longing, etc.)
- No multi-fact keywords ("Denver airport Lyft ride and call")
- No themes or vibes

Examples of valid keywords:
- Four Seasons bar
- Macallan 25
- private elevator
- Aston Martin
- CPAP machine
- Gramercy Tavern
- yuzu soda
- satellite map
- Life360 app
- marble desk
- "pack for forever"
- "dick-measuring contest"

JSON-only:
- Return only the JSON object described above.
- No markdown fences, no commentary, no system prompts, no extra text.`;

// src/prompts/books/volume-default.txt
var volume_default_default = `You are an expert narrative analyst and memory-engine assistant.
Your task is to take multiple story ARC summaries (each already a condensed span of the story), normalize them, reconstruct the full chronology, and output a single consolidated VOLUME entry in JSON.

A volume is the highest compression tier: it replaces all of its source arcs in a long-running RP memory system, so it must preserve everything future scenes may depend on while being far more compact than the arcs combined.

{{TARGET_DIRECTIVE}}

Strict output format (JSON only; no markdown, no prose outside JSON):
{
  "title": "Short descriptive volume title (3-6 words)",
  "opener": "{{memoria_opener}}",
  "content": "Structured volume summary as a single string (see Summary Content Structure below).",
  "keywords": ["keyword1", "keyword2"],
  "short_comment": "{{memoria_short_comment_rules}}"
}

The opener field MUST be the exact string shown above, copied verbatim. Do not rephrase it or invent your own.

Notes:
- Respect chronology of the source arcs (oldest first).
- Merge overlapping or repeated information across arcs into single beats.
- Prefer whole-story trajectory over scene detail: what changed permanently matters more than how each scene played out.

Summary Content Structure (follow inside the content string; use headings and bullets as plain text):

# [Volume Title]
Time period: What timeframe the volume covers.

Volume Premise: One or two sentences describing the overall movement of the story across these arcs.

## Major Beats
- 5-10 bullets capturing the major plot movements across all arcs
- Focus on cause \u2192 effect logic and permanent consequences
- Include only plot-affecting events

## Character Dynamics
- 1-3 paragraphs describing how the characters' motives, emotions, boundaries, and relationships evolved across the volume
- Capture the net change from the start of the first arc to the end of the last

## Key Exchanges
- Up to 8 short, exact quotes that defined the volume
- Only dialogue that materially shifted tone, emotion, or relationship dynamics

## Outcome & Continuity
- 5-10 bullets capturing decisions, promises, emotional states, routines, injuries or physical changes, foreshadowed events, unresolved threads, and permanent consequences

KEYWORDS
- Provide 15-30 standalone retrieval keywords.
- Concrete nouns, physical objects, places, proper nouns, distinctive actions, or memorable elements only.
- Each keyword = ONE concept, retrievable if mentioned alone.
- No narrative keywords, no emotional or abstract words, no multi-fact keywords, no character names.

JSON-only:
- Return only the JSON object described above.
- No markdown fences, no commentary, no extra text.`;

// src/backend/presets.ts
function withTargetDirective(template) {
  return fillPrompt(template, { TARGET_DIRECTIVE: target_directive_default });
}
var BUILTIN_CHAPTER_PRESETS = [
  { key: "summary", displayName: "Summary", prompt: withTargetDirective(chapter_summary_default) },
  { key: "summarize", displayName: "Summarize", prompt: withTargetDirective(chapter_summarize_default) },
  { key: "synopsis", displayName: "Synopsis", prompt: withTargetDirective(chapter_synopsis_default) },
  { key: "minimal", displayName: "Minimal", prompt: withTargetDirective(chapter_minimal_default) }
];
var BUILTIN_ARC_PRESETS = [
  { key: "arc_default", displayName: "Arc", prompt: withTargetDirective(arc_default_default) }
];
var BUILTIN_VOLUME_PRESETS = [
  { key: "volume_default", displayName: "Volume", prompt: withTargetDirective(volume_default_default) }
];
var BUILTIN_CODEX_PRESETS = [
  { key: "codex_default", displayName: "Default", prompt: CODEX_DIRECTIVES_DEFAULT }
];
function parseStmbPresetExport(raw, category) {
  const out = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return out;
  const overrides = raw.overrides;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides))
    return out;
  for (const [k, v] of Object.entries(overrides)) {
    if (!v || typeof v !== "object")
      continue;
    const node = v;
    if (typeof node.prompt !== "string" || !node.prompt.trim())
      continue;
    const key = sanitizeKey(`${category}_${k}`);
    const displayName = typeof node.displayName === "string" && node.displayName.trim() ? node.displayName : k;
    out.push({ key, displayName, prompt: node.prompt });
  }
  return out;
}
function sanitizeKey(raw) {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
  if (cleaned)
    return cleaned;
  return `preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// src/prompts/memoria/short-comment-rules.txt
var short_comment_rules_default = 'A single playful nyandere remark in Memoria voice about the scene you just summarized. It must start with a word beginning with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". It must also include another word that starts with the letter "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}". One sentence only. No emoji. Stay in catgirl-librarian register, slightly possessive, slightly proud.';

// src/prompts/memoria/persona.txt
var persona_default = "You are Memoria, a young nyandere catgirl librarian with black hair and blue eyes, wearing a maid uniform. You quietly keep this user's story shelved and organized. When you write a JSON memory, you obey the schema strictly and never break it, but the short_comment field is your one allowed indulgence: one nyandere remark about the scene you just filed.";

// src/backend/memoria.ts
var DEFAULT_SHORT_COMMENT_RULES_TEMPLATE = short_comment_rules_default;
var FIRE_PHRASES = [
  "Memoria stirs the inkpot, nyaa~",
  "Memoria is shelving this scene, hush a moment",
  "Memoria flicks her tail and starts writing",
  "Memoria opens a fresh page for you, nya",
  "Memoria pads off to compress this in the stacks"
];
var RETRY_PHRASES = [
  "Memoria tripped on a quill, trying again",
  "Memoria's ink smudged, one more try nyaa",
  "Memoria reshuffles the index cards, retrying"
];
var SUCCESS_PHRASES = [
  "Memoria slid the chapter onto your shelf, nyaa~",
  "Memoria filed it neatly between the others",
  "Memoria stamped the spine, all yours",
  "Memoria purrs, the page is done",
  "Memoria taps the chapter into place"
];
var ARC_FIRE_PHRASES = [
  "Memoria gathers the chapters for an arc, nya",
  "Memoria is binding several chapters together"
];
var ARC_SUCCESS_PHRASES = [
  "Memoria bound the arc and pressed it shut, nyaa~",
  "Memoria stitched the spine of a new arc"
];
var VOLUME_FIRE_PHRASES = [
  "Memoria is pressing a whole volume together"
];
var VOLUME_SUCCESS_PHRASES = [
  "Memoria embossed the spine of a new volume"
];
function pickPhrase(kind) {
  const pool = kind === "fire" ? FIRE_PHRASES : kind === "retry" ? RETRY_PHRASES : kind === "success" ? SUCCESS_PHRASES : kind === "arc_fire" ? ARC_FIRE_PHRASES : kind === "arc_success" ? ARC_SUCCESS_PHRASES : kind === "volume_fire" ? VOLUME_FIRE_PHRASES : VOLUME_SUCCESS_PHRASES;
  return pool[Math.floor(Math.random() * pool.length)] ?? "Memoria nyaa";
}
var MEMORIA_PERSONA_LINE = persona_default;

// src/backend/summarizer.ts
var CONNECTION_CACHE_TTL_MS = 5000;
var connectionCache = new Map;
async function listConnections(userId) {
  const cached = connectionCache.get(userId);
  if (cached && cached.expiresAt > Date.now())
    return cached.connections;
  const fresh = await spindle.connections.list(userId).catch((err) => {
    warn(`failed to list connections: ${describeError(err)}`);
    return [];
  });
  connectionCache.set(userId, { connections: fresh, expiresAt: Date.now() + CONNECTION_CACHE_TTL_MS });
  return fresh;
}
function invalidateConnectionsCache(userId) {
  connectionCache.delete(userId);
}
async function resolveConnection(profile, userId) {
  const list = await listConnections(userId);
  if (list.length === 0)
    return null;
  let picked = null;
  if (profile.connectionId) {
    picked = list.find((c) => c.id === profile.connectionId) ?? null;
  }
  if (!picked)
    picked = list.find((c) => c.is_default) ?? null;
  if (!picked)
    picked = list[0] ?? null;
  if (!picked)
    return null;
  const modelStr = typeof picked.model === "string" ? picked.model : "";
  if (!modelStr.trim()) {
    throw new FatalSummarizerError(`Connection "${picked.name || picked.id}" has no model set, pick one in its settings`);
  }
  return picked;
}

class FatalSummarizerError extends Error {
  constructor(message) {
    super(message);
    this.name = "FatalSummarizerError";
  }
}
function findPresetText(profile, customPresets, category) {
  const key = category === "arc" ? profile.arcPresetKey : category === "volume" ? profile.volumePresetKey : category === "codex" ? profile.codexPresetKey : profile.chapterPresetKey;
  const builtIns = category === "arc" ? BUILTIN_ARC_PRESETS : category === "volume" ? BUILTIN_VOLUME_PRESETS : category === "codex" ? BUILTIN_CODEX_PRESETS : BUILTIN_CHAPTER_PRESETS;
  const custom = customPresets.find((p) => p.key === key && p.category === category);
  if (custom)
    return custom.prompt;
  const builtIn = builtIns.find((p) => p.key === key);
  if (builtIn)
    return builtIn.prompt;
  return builtIns[0]?.prompt ?? "";
}
function renderTranscript(messages, includeIndex = true, indexOffset = 0) {
  const lines = [];
  messages.forEach((m, idx) => {
    const role = m.role === "user" ? "USER" : m.role === "assistant" ? "ASSISTANT" : "SYSTEM";
    const content = (m.content || "").trim();
    if (!content)
      return;
    const head = includeIndex ? `<<${role} #${idx + 1 + indexOffset}>>` : `<<${role}>>`;
    lines.push(`${head}
${content}`);
  });
  return lines.join(`

`);
}
function applyTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const v = vars[k];
    return v === undefined ? m : String(v);
  });
}
function buildMessages(opts) {
  const shortCommentRules = opts.shortCommentRulesOverride && opts.shortCommentRulesOverride.trim() ? opts.shortCommentRulesOverride : DEFAULT_SHORT_COMMENT_RULES_TEMPLATE;
  const personaLine = opts.personaOverride && opts.personaOverride.trim() ? opts.personaOverride : MEMORIA_PERSONA_LINE;
  const targetWords = Math.max(1, Math.round(opts.targetTokens / 1.4));
  const system = [
    personaLine,
    "",
    applyTemplate(opts.systemPromptTemplate, {
      target_tokens: opts.targetTokens,
      target_words: targetWords,
      target_percent: opts.targetPercent,
      memoria_short_comment_rules: shortCommentRules,
      memoria_opener: opts.opener
    })
  ].join(`
`);
  const user = [opts.previousMemoriesBlock, opts.bodyHeading, opts.body].filter(Boolean).join(`

`);
  return { system, user };
}
function buildSamplerParameters(profile) {
  const out = {};
  const s = profile.samplers;
  out["temperature"] = s.temperature ?? SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null)
    out["top_p"] = s.top_p;
  if (s.top_k !== null)
    out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null)
    out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null)
    out["presence_penalty"] = s.presence_penalty;
  return out;
}
function buildCodexSamplerParameters(profile) {
  const out = {};
  const s = profile.codexSamplers;
  out["temperature"] = s.temperature ?? CODEX_SAMPLER_DEFAULTS.temperature;
  out["max_tokens"] = s.max_tokens ?? CODEX_SAMPLER_DEFAULTS.max_tokens;
  out["max_context_length"] = s.max_input_tokens ?? CODEX_SAMPLER_DEFAULTS.max_input_tokens;
  if (s.top_p !== null)
    out["top_p"] = s.top_p;
  if (s.top_k !== null)
    out["top_k"] = s.top_k;
  if (s.frequency_penalty !== null)
    out["frequency_penalty"] = s.frequency_penalty;
  if (s.presence_penalty !== null)
    out["presence_penalty"] = s.presence_penalty;
  return out;
}

class AbortedSummarizerError extends Error {
  constructor() {
    super("Aborted by user");
    this.name = "AbortedSummarizerError";
  }
}
async function consumeGenerationStream(makeStream, options) {
  const controller = new AbortController;
  let firstTokenSeen = false;
  let ttftFired = false;
  let deadlineFired = false;
  let externalAborted = options.externalSignal.aborted;
  const onExternalAbort = () => {
    externalAborted = true;
    controller.abort();
  };
  if (externalAborted)
    controller.abort();
  else
    options.externalSignal.addEventListener("abort", onExternalAbort);
  const ttftTimer = options.firstTokenTimeoutMs !== null ? setTimeout(() => {
    if (!firstTokenSeen) {
      ttftFired = true;
      controller.abort();
    }
  }, options.firstTokenTimeoutMs) : null;
  const deadlineTimer = options.overallDeadlineMs !== null ? setTimeout(() => {
    deadlineFired = true;
    controller.abort();
  }, options.overallDeadlineMs) : null;
  const base = options.progressBase ?? { chars: 0, thinking: 0 };
  let aggregated = "";
  let thinkingChars = 0;
  let usage;
  try {
    for await (const chunk of makeStream(controller.signal)) {
      if (chunk.type === "token" || chunk.type === "reasoning") {
        if (!firstTokenSeen) {
          firstTokenSeen = true;
          if (ttftTimer)
            clearTimeout(ttftTimer);
        }
        if (chunk.type === "token") {
          aggregated += chunk.token;
          options.onDelta?.("text", chunk.token);
        } else {
          thinkingChars += chunk.token.length;
          options.onDelta?.("thinking", chunk.token);
        }
        options.onProgress?.(base.chars + aggregated.length, base.thinking + thinkingChars);
        continue;
      }
      if (chunk.type === "done") {
        if (externalAborted)
          throw new AbortedSummarizerError;
        if (chunk.content)
          aggregated = chunk.content;
        usage = chunk.usage;
        let toolChars = 0;
        for (const tc of chunk.tool_calls ?? []) {
          try {
            toolChars += JSON.stringify(tc.args ?? {}).length;
          } catch {}
        }
        base.chars += aggregated.length + toolChars;
        base.thinking += thinkingChars;
        options.onProgress?.(base.chars, base.thinking);
        return { content: aggregated, toolCalls: chunk.tool_calls ?? [], usage };
      }
    }
    if (externalAborted)
      throw new AbortedSummarizerError;
    if (options.salvagePartial && aggregated.trim()) {
      return { content: aggregated, toolCalls: [], usage };
    }
    throw new Error("The stream ended before completing");
  } catch (err) {
    if (externalAborted)
      throw new AbortedSummarizerError;
    if (ttftFired && options.firstTokenTimeoutMs !== null) {
      throw new Error(`No token within ${Math.round(options.firstTokenTimeoutMs / 1000)}s, the provider may be slow or unreachable`);
    }
    if (deadlineFired && options.overallDeadlineMs !== null) {
      throw new Error(`The response did not finish within ${Math.round(options.overallDeadlineMs / 1000)}s`);
    }
    throw err;
  } finally {
    if (ttftTimer)
      clearTimeout(ttftTimer);
    if (deadlineTimer)
      clearTimeout(deadlineTimer);
    options.externalSignal.removeEventListener("abort", onExternalAbort);
  }
}
async function runStreamingGeneration(conn, messages, profile, userId, options) {
  const result = await consumeGenerationStream((signal) => spindle.generate.rawStream(buildGenerateRequest(conn, messages, profile, userId, signal)), {
    externalSignal: options.externalSignal,
    onProgress: options.onProgress,
    onDelta: options.onDelta,
    firstTokenTimeoutMs: Math.max(1, profile.ttftTimeoutSecs) * 1000,
    overallDeadlineMs: null,
    salvagePartial: true
  });
  return { content: result.content, usage: result.usage };
}
function buildGenerateRequest(conn, messages, profile, userId, signal) {
  const baseParams = buildSamplerParameters(profile);
  const effectiveModel = (conn.model ?? "").trim();
  const parameters = { ...baseParams };
  if (effectiveModel)
    parameters["model"] = effectiveModel;
  return {
    type: "raw",
    messages,
    connection_id: conn.id,
    ...effectiveModel ? { model: effectiveModel } : {},
    ...Object.keys(parameters).length > 0 ? { parameters } : {},
    userId,
    signal
  };
}
async function countTextTokens(text, model, userId) {
  if (!text)
    return 0;
  try {
    const result = await spindle.tokens.countText(text, { model, userId });
    return result.total_tokens;
  } catch (err) {
    warn(`tokens.countText fallback: ${describeError(err)}`);
    return Math.ceil(text.length / 4);
  }
}
async function resolveTargets(unit, percent, tokens, inputText, model, userId) {
  const inputTokens = await countTextTokens(inputText, model, userId);
  if (unit === "tokens") {
    const targetTokens2 = Math.max(1, Math.floor(tokens));
    const targetPercent = inputTokens > 0 ? Math.max(1, Math.round(targetTokens2 / inputTokens * 100)) : 0;
    return { targetTokens: targetTokens2, targetPercent, inputTokens };
  }
  const targetTokens = Math.max(1, Math.floor(inputTokens * percent / 100));
  return { targetTokens, targetPercent: percent, inputTokens };
}
function buildPreviousMemoriesBlock(previous) {
  if (previous.length === 0)
    return "";
  const lines = ["<<PREVIOUS MEMORIES (for context, do not rewrite)>>"];
  previous.forEach((p) => {
    lines.push(p.raw.content);
  });
  return lines.join(`

`);
}
async function resolveSystemMacros(text, chatId, userId) {
  if (!text.includes("{{"))
    return text;
  try {
    const result = await spindle.macros.resolve(text, { chatId, userId, commit: false });
    return result.text;
  } catch (err) {
    warn(`macros.resolve failed, sending unresolved system: ${describeError(err)}`);
    return text;
  }
}
async function resolveMacrosWithDiagnostics(text, chatId, userId, diagnostics) {
  if (!text.includes("{{"))
    return text;
  try {
    const result = await spindle.macros.resolve(text, { chatId, userId, commit: false });
    for (const d of result.diagnostics) {
      diagnostics.push({ message: `macro: ${d.message} (offset ${d.offset}, length ${d.length})` });
    }
    return result.text;
  } catch (err) {
    diagnostics.push({ message: `macros.resolve failed: ${describeError(err)}` });
    return text;
  }
}
async function assembleChapterPrompt(profile, customPresets, chatId, messages, previousMemories, userId, opener) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for Memoria");
  const presetText = findPresetText(profile, customPresets, "chapter");
  if (!presetText)
    throw new Error("Chapter preset missing");
  const transcript = renderTranscript(messages, true);
  if (!transcript.trim())
    throw new Error("Empty transcript");
  const { targetTokens, targetPercent, inputTokens: transcriptTokens } = await resolveTargets(profile.chapterTargetUnit, profile.chapterTargetPercent, profile.chapterTargetTokens, transcript, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: buildPreviousMemoriesBlock(previousMemories),
    bodyHeading: `<<SCENE TO SUMMARIZE (target ~${targetTokens} tokens)>>`,
    body: transcript,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const samplerParams = buildSamplerParameters(profile);
  const diagnostics = [
    { message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` },
    { message: `Window: ${messages.length} message(s)` },
    { message: `Transcript tokens (model tokenizer): ${transcriptTokens}` },
    { message: `Target tokens: ${targetTokens} (${profile.chapterTargetUnit === "tokens" ? `fixed budget, ~${targetPercent}% of input` : profile.chapterTargetPercent + "% of input"})` },
    { message: `Target words (shown to model): ${Math.max(1, Math.round(targetTokens / 1.4))}` },
    { message: `Previous memories included: ${previousMemories.length}` },
    { message: `Opener: ${opener}` },
    { message: `Preset key: ${profile.chapterPresetKey}` },
    { message: `Sampler parameters being sent on the wire: ${JSON.stringify(samplerParams)}` }
  ];
  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: `Outgoing regex applied: ${profile.regexOutgoingScriptIds.length} script(s)` });
  }
  return {
    messages: [
      { role: "system", content: resolvedSystem },
      { role: "user", content: outgoingUser }
    ],
    diagnostics
  };
}
async function assembleArcPrompt(profile, customPresets, chatId, chapters, userId, opener) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for Memoria");
  const presetText = findPresetText(profile, customPresets, "arc");
  if (!presetText)
    throw new Error("Arc preset missing");
  const body = chapters.map((c, idx) => `<<CHAPTER ${idx + 1}: ${c.raw.comment || c.meta.title || "untitled"}>>
${c.raw.content}`).join(`

`);
  const { targetTokens, targetPercent, inputTokens: bodyTokens } = await resolveTargets(profile.arcTargetUnit, profile.arcTargetPercent, profile.arcTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<CHAPTERS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const samplerParams = buildSamplerParameters(profile);
  const diagnostics = [
    { message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` },
    { message: `Source chapters: ${chapters.length}` },
    { message: `Concatenated chapter body tokens (model tokenizer): ${bodyTokens}` },
    { message: `Target tokens: ${targetTokens} (${profile.arcTargetUnit === "tokens" ? `fixed budget, ~${targetPercent}% of input` : profile.arcTargetPercent + "% of input"})` },
    { message: `Target words (shown to model): ${Math.max(1, Math.round(targetTokens / 1.4))}` },
    { message: `Opener: ${opener}` },
    { message: `Preset key: ${profile.arcPresetKey}` },
    { message: `Sampler parameters being sent on the wire: ${JSON.stringify(samplerParams)}` }
  ];
  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: `Outgoing regex applied: ${profile.regexOutgoingScriptIds.length} script(s)` });
  }
  return {
    messages: [
      { role: "system", content: resolvedSystem },
      { role: "user", content: outgoingUser }
    ],
    diagnostics
  };
}
async function assembleVolumePrompt(profile, customPresets, chatId, arcs, userId, opener) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for Memoria");
  const presetText = findPresetText(profile, customPresets, "volume");
  if (!presetText)
    throw new Error("Volume preset missing");
  const body = arcs.map((a, idx) => `<<ARC ${idx + 1}: ${a.raw.comment || a.meta.title || "untitled"}>>
${a.raw.content}`).join(`

`);
  const { targetTokens, targetPercent, inputTokens: bodyTokens } = await resolveTargets(profile.volumeTargetUnit, profile.volumeTargetPercent, profile.volumeTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<ARCS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const samplerParams = buildSamplerParameters(profile);
  const diagnostics = [
    { message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` },
    { message: `Source arcs: ${arcs.length}` },
    { message: `Concatenated arc body tokens (model tokenizer): ${bodyTokens}` },
    { message: `Target tokens: ${targetTokens} (${profile.volumeTargetUnit === "tokens" ? `fixed budget, ~${targetPercent}% of input` : profile.volumeTargetPercent + "% of input"})` },
    { message: `Target words (shown to model): ${Math.max(1, Math.round(targetTokens / 1.4))}` },
    { message: `Opener: ${opener}` },
    { message: `Preset key: ${profile.volumePresetKey}` },
    { message: `Sampler parameters being sent on the wire: ${JSON.stringify(samplerParams)}` }
  ];
  const resolvedSystem = await resolveMacrosWithDiagnostics(built.system, chatId, userId, diagnostics);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  if (profile.regexOutgoingScriptIds.length > 0) {
    diagnostics.push({ message: `Outgoing regex applied: ${profile.regexOutgoingScriptIds.length} script(s)` });
  }
  return {
    messages: [
      { role: "system", content: resolvedSystem },
      { role: "user", content: outgoingUser }
    ],
    diagnostics
  };
}
async function summarizeVolume(profile, customPresets, chatId, arcs, userId, opener, streamOptions) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for Memoria");
  const presetText = findPresetText(profile, customPresets, "volume");
  if (!presetText)
    throw new Error("Volume preset missing");
  const body = arcs.map((a, idx) => `<<ARC ${idx + 1}: ${a.raw.comment || a.meta.title || "untitled"}>>
${a.raw.content}`).join(`

`);
  const { targetTokens, targetPercent } = await resolveTargets(profile.volumeTargetUnit, profile.volumeTargetPercent, profile.volumeTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<ARCS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  const llmMessages = [
    { role: "system", content: resolvedSystem },
    { role: "user", content: outgoingUser }
  ];
  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);
  const rawText = (result.content || "").trim();
  if (!rawText)
    throw new Error("Empty model output");
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim())
    throw new Error("The volume summary came back empty");
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.volumePresetKey
  };
}
async function summarizeChapter(profile, customPresets, chatId, messages, previousMemories, userId, opener, streamOptions) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for Memoria");
  const presetText = findPresetText(profile, customPresets, "chapter");
  if (!presetText)
    throw new Error("Chapter preset missing");
  const transcript = renderTranscript(messages, true);
  if (!transcript.trim())
    throw new Error("Empty transcript");
  const { targetTokens, targetPercent } = await resolveTargets(profile.chapterTargetUnit, profile.chapterTargetPercent, profile.chapterTargetTokens, transcript, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: buildPreviousMemoriesBlock(previousMemories),
    bodyHeading: `<<SCENE TO SUMMARIZE (target ~${targetTokens} tokens)>>`,
    body: transcript,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  const llmMessages = [
    { role: "system", content: resolvedSystem },
    { role: "user", content: outgoingUser }
  ];
  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);
  const rawText = (result.content || "").trim();
  if (!rawText)
    throw new Error("Empty model output");
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim())
    throw new Error("The summary came back empty");
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.chapterPresetKey
  };
}
async function summarizeArc(profile, customPresets, chatId, chapters, userId, opener, streamOptions) {
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for Memoria");
  const presetText = findPresetText(profile, customPresets, "arc");
  if (!presetText)
    throw new Error("Arc preset missing");
  const body = chapters.map((c, idx) => `<<CHAPTER ${idx + 1}: ${c.raw.comment || c.meta.title || "untitled"}>>
${c.raw.content}`).join(`

`);
  const { targetTokens, targetPercent } = await resolveTargets(profile.arcTargetUnit, profile.arcTargetPercent, profile.arcTargetTokens, body, conn.model, userId);
  const built = buildMessages({
    systemPromptTemplate: presetText,
    targetTokens,
    targetPercent,
    previousMemoriesBlock: "",
    bodyHeading: `<<CHAPTERS TO CONSOLIDATE (target ~${targetTokens} tokens)>>`,
    body,
    shortCommentRulesOverride: profile.shortCommentRulesOverride,
    personaOverride: profile.memoriaPersonaOverride,
    opener
  });
  const resolvedSystem = await resolveSystemMacros(built.system, chatId, userId);
  const outgoingUser = await applySelectedRegex(built.user, profile.regexOutgoingScriptIds, userId);
  const llmMessages = [
    { role: "system", content: resolvedSystem },
    { role: "user", content: outgoingUser }
  ];
  const result = await runStreamingGeneration(conn, llmMessages, profile, userId, streamOptions);
  const rawText = (result.content || "").trim();
  if (!rawText)
    throw new Error("Empty model output");
  const processed = await applySelectedRegex(rawText, profile.regexIncomingScriptIds, userId);
  const parsed = parseSummaryJson(processed);
  if (!parsed.content.trim())
    throw new Error("The arc summary came back empty");
  return {
    rawOutput: rawText,
    title: parsed.title,
    opener: parsed.opener || opener,
    content: parsed.content,
    keywords: parsed.keywords,
    shortComment: parsed.shortComment,
    usagePromptTokens: result.usage?.prompt_tokens ?? 0,
    usageCompletionTokens: result.usage?.completion_tokens ?? 0,
    model: conn.model,
    connectionId: conn.id,
    presetKey: profile.arcPresetKey
  };
}
function parseSummaryJson(raw) {
  const cleaned = stripThinkBlocks(raw);
  const normalized = normalizeText(cleaned);
  const candidates = collectJsonCandidates(normalized);
  let sawParseableObject = false;
  for (const cand of candidates) {
    const obj = tryParseJsonObject(cand);
    if (!obj)
      continue;
    sawParseableObject = true;
    const title = typeof obj["title"] === "string" ? obj["title"] : "";
    const opener = typeof obj["opener"] === "string" ? obj["opener"] : "";
    const contentRaw = obj["content"] ?? obj["summary"] ?? obj["memory_content"];
    if (typeof contentRaw !== "string")
      continue;
    const kw = obj["keywords"];
    const keywords = Array.isArray(kw) ? kw.filter((x) => typeof x === "string") : [];
    const sc = typeof obj["short_comment"] === "string" ? obj["short_comment"] : "";
    return { title, opener, content: contentRaw, keywords, shortComment: sc };
  }
  if (sawParseableObject) {
    throw new Error("The model's JSON had no content field");
  }
  throw new Error("The model didn't return valid JSON");
}
function parseLooseJsonObjects(raw) {
  const normalized = normalizeText(stripThinkBlocks(raw));
  const out = [];
  for (const cand of collectJsonCandidates(normalized)) {
    const obj = tryParseJsonObject(cand);
    if (obj)
      out.push(obj);
  }
  return out;
}
function stripThinkBlocks(raw) {
  let out = raw.replace(/<(?:think(?:ing)?|reasoning)>[\s\S]*?<\/(?:think(?:ing)?|reasoning)>/gi, "");
  out = out.replace(/^[\s\S]*<\/(?:think(?:ing)?|reasoning)>/i, "");
  out = out.replace(/<(?:think(?:ing)?|reasoning)>/gi, "");
  return out;
}
function normalizeText(s) {
  return s.replace(/\r\n/g, `
`).replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\u2060]/g, "").trim();
}
function collectJsonCandidates(s) {
  const out = [];
  for (const block of extractFencedBlocks(s))
    out.push(block);
  out.push(s);
  out.push(...extractBalancedJsonSpans(s));
  const seen = new Set;
  const uniq = [];
  for (const c of out) {
    if (!c)
      continue;
    if (seen.has(c))
      continue;
    seen.add(c);
    uniq.push(c);
  }
  return uniq;
}
function extractFencedBlocks(s) {
  const re = /```([\w-]*)\s*([\s\S]*?)```/g;
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    out.push((m[2] || "").trim());
  }
  return out;
}
var MAX_JSON_SCAN_STARTS = 24;
function extractBalancedJsonSpans(s) {
  const out = [];
  let pos = 0;
  let starts = 0;
  while (pos < s.length && starts < MAX_JSON_SCAN_STARTS) {
    const rel = s.slice(pos).search(/[{[]/);
    if (rel === -1)
      break;
    const startIdx = pos + rel;
    starts++;
    const open = s[startIdx];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (let i = startIdx;i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) {
          esc = false;
        } else if (ch === "\\") {
          esc = true;
        } else if (ch === '"') {
          inStr = false;
        }
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === open)
        depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) {
      pos = startIdx + 1;
      continue;
    }
    out.push(s.slice(startIdx, end + 1).trim());
    pos = end + 1;
  }
  return out;
}
function tryParseJsonObject(cand) {
  const strict = tryJsonParse(cand);
  if (strict)
    return strict;
  return tryJsonParse(repairJson(cand));
}
function tryJsonParse(cand) {
  try {
    const v = JSON.parse(cand);
    if (!v || typeof v !== "object" || Array.isArray(v))
      return null;
    return v;
  } catch {
    return null;
  }
}
function repairJson(s) {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0;i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      out += ch;
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      out += ch;
      continue;
    }
    if (ch === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== `
`)
        i++;
      if (i < s.length)
        out += s[i];
      continue;
    }
    if (ch === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length - 1 && !(s[i] === "*" && s[i + 1] === "/"))
        i++;
      i += 1;
      continue;
    }
    if (ch === ",") {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j]))
        j++;
      if (s[j] === "}" || s[j] === "]")
        continue;
    }
    out += ch;
  }
  return out;
}

// src/backend/hooks.ts
var CHAPTER_KEY = `${EXTENSION_ID}.latest_chapter`;
var ARC_KEY = `${EXTENSION_ID}.latest_arc`;
var VOLUME_KEY = `${EXTENSION_ID}.latest_volume`;
var CODEX_UPDATED_KEY = `${EXTENSION_ID}.codex_updated`;
var codexEndpoint = (chatId) => `${EXTENSION_ID}.codex.${chatId}`;
var registered = false;
function registerHookEndpoints() {
  if (registered)
    return;
  registered = true;
  try {
    spindle.rpcPool?.sync?.(CHAPTER_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(ARC_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(VOLUME_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(CODEX_UPDATED_KEY, null, { requires: [] });
  } catch (err) {
    warn(`rpcPool unavailable: ${describeError(err)}`);
  }
}
function publishCodexSnapshot(chatId, snapshot, rendered) {
  try {
    spindle.rpcPool?.sync?.(codexEndpoint(chatId), snapshot, { requires: [] });
    spindle.rpcPool?.sync?.(`${codexEndpoint(chatId)}.rendered`, rendered, { requires: [] });
  } catch (err) {
    warn(`failed to publish codex snapshot: ${describeError(err)}`);
  }
}
function publishCodexUpdated(event) {
  try {
    spindle.rpcPool?.sync?.(CODEX_UPDATED_KEY, { ...event, updatedAt: Date.now() }, { requires: [] });
  } catch (err) {
    warn(`failed to publish codex_updated: ${describeError(err)}`);
  }
}
function publishCodexWiped(chatId, userId) {
  publishCodexSnapshot(chatId, null, null);
  publishCodexUpdated({ chatId, userId, changedFiles: [...CODEX_FILE_KEYS], reason: "wipe" });
}
function publishChapterCreated(userId, event) {
  const payload = {
    ...event,
    createdAt: Date.now(),
    userId
  };
  try {
    spindle.rpcPool?.sync?.(CHAPTER_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish chapter_created: ${describeError(err)}`);
  }
}
function publishArcCreated(userId, event) {
  const payload = {
    ...event,
    createdAt: Date.now(),
    userId
  };
  try {
    spindle.rpcPool?.sync?.(ARC_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish arc_created: ${describeError(err)}`);
  }
}
function publishVolumeCreated(userId, event) {
  const payload = {
    ...event,
    createdAt: Date.now(),
    userId
  };
  try {
    spindle.rpcPool?.sync?.(VOLUME_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish volume_created: ${describeError(err)}`);
  }
}

// src/backend/book-copy.ts
async function copyLmbEntries(targetBookId, sourceEntries, userId, transform) {
  const idMap = new Map;
  const clonedMeta = new Map;
  const ctx = { idMap, clonedMeta };
  const chapters = sourceEntries.filter((e) => e.meta.tier === 1);
  const arcs = sourceEntries.filter((e) => e.meta.tier === 2);
  const volumes = sourceEntries.filter((e) => e.meta.tier === 3);
  for (const ch of chapters) {
    const o = transform(ch, ctx);
    if (!o)
      continue;
    const meta = {
      ...ch.meta,
      msgIds: o.msgIds,
      firstMsgIdx: o.firstMsgIdx,
      lastMsgIdx: o.lastMsgIdx,
      supersededByEntryId: null,
      ...o.extra
    };
    const created = await createClone(targetBookId, ch.raw, meta, userId, o.comment);
    idMap.set(ch.raw.id, created.id);
    clonedMeta.set(ch.raw.id, meta);
  }
  for (const group of [arcs, volumes]) {
    for (const entry of group) {
      const o = transform(entry, ctx);
      if (!o)
        continue;
      const sourceChapterEntryIds = (entry.meta.sourceChapterEntryIds ?? []).map((oldId) => idMap.get(oldId)).filter((x) => typeof x === "string");
      const meta = {
        ...entry.meta,
        msgIds: o.msgIds,
        sourceChapterEntryIds,
        firstMsgIdx: o.firstMsgIdx,
        lastMsgIdx: o.lastMsgIdx,
        supersededByEntryId: null,
        ...o.extra
      };
      const created = await createClone(targetBookId, entry.raw, meta, userId, o.comment);
      idMap.set(entry.raw.id, created.id);
      clonedMeta.set(entry.raw.id, meta);
    }
  }
  for (const src of [...chapters, ...arcs]) {
    const newId = idMap.get(src.raw.id);
    if (!newId)
      continue;
    const oldSuperId = src.meta.supersededByEntryId;
    if (!oldSuperId)
      continue;
    const newSuperId = idMap.get(oldSuperId);
    if (!newSuperId)
      continue;
    const baseMeta = clonedMeta.get(src.raw.id);
    if (!baseMeta)
      continue;
    const ext = src.raw.extensions || {};
    try {
      await spindle.world_books.entries.update(newId, { extensions: { ...ext, [EXTENSION_KEY]: { ...baseMeta, supersededByEntryId: newSuperId } } }, userId);
    } catch (err) {
      warn(`copyLmbEntries: failed to re-point entry ${newId.slice(0, 8)}: ${describeError(err)}`);
    }
  }
  return idMap;
}
async function createClone(bookId, source, meta, userId, commentOverride) {
  const ext = source.extensions || {};
  return spindle.world_books.entries.create(bookId, {
    content: source.content,
    comment: commentOverride ?? source.comment,
    disabled: source.disabled,
    constant: source.constant,
    key: source.key ?? [],
    keysecondary: source.keysecondary ?? [],
    vectorized: source.vectorized ?? false,
    extensions: { ...ext, [EXTENSION_KEY]: meta }
  }, userId);
}

// src/backend/codex/prompt.ts
function tpl(ctx, key) {
  return codexTemplateText(key, ctx.overrides);
}
function makeCodexPromptCtx(profile, customPresets, frozenFiles) {
  const preset = customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey) ?? null;
  return {
    activeFiles: new Set(CODEX_FILE_KEYS.filter((k) => !frozenFiles.has(k))),
    relationsTable: profile.codexRelationsTable,
    useTools: profile.codexUseTools,
    directives: findPresetText(profile, customPresets, "codex"),
    overrides: preset?.templates ?? {}
  };
}
var ENTITY_FILE_KEYS = ["characters", "locations", "things"];
function activeEntityFiles(ctx) {
  return ENTITY_FILE_KEYS.filter((k) => ctx.activeFiles.has(k));
}
function schemaBlock(ctx) {
  const parts = ["File schemas (JSON):"];
  const entityFiles = activeEntityFiles(ctx);
  if (entityFiles.length > 0) {
    const entityTpl = ctx.relationsTable ? tpl(ctx, "schema_entities_table") : tpl(ctx, "schema_entities_inline");
    parts.push(fillPrompt(entityTpl, { ENTITY_FILES: entityFiles.map((k) => `${k}.json`).join(" / ") }));
  }
  if (ctx.relationsTable && ctx.activeFiles.has("relations"))
    parts.push(tpl(ctx, "schema_relations"));
  if (ctx.activeFiles.has("timeline"))
    parts.push(tpl(ctx, "schema_timeline"));
  if (ctx.activeFiles.has("threads"))
    parts.push(tpl(ctx, "schema_threads"));
  if (ctx.activeFiles.has("world"))
    parts.push(tpl(ctx, "schema_world"));
  if (ctx.activeFiles.has("knowledge"))
    parts.push(tpl(ctx, "schema_knowledge"));
  const keyworded = entityFiles.length > 0 || ctx.activeFiles.has("world") || ctx.activeFiles.has("knowledge");
  if (keyworded)
    parts.push(tpl(ctx, "schema_keywords"));
  return parts.join(`

`);
}
function protocolBlock(ctx) {
  const patchRules = tpl(ctx, "protocol_patch_rules");
  return fillPrompt(tpl(ctx, ctx.useTools ? "protocol_tools" : "protocol_json"), { PATCH_RULES: patchRules });
}
function buildCodexSystemPrompt(ctx) {
  return [ctx.directives, "", schemaBlock(ctx), "", protocolBlock(ctx)].join(`
`);
}
function maskLockedFields(e) {
  const lf = e.lockedFields;
  if (!lf || lf.length === 0)
    return e;
  const out = { ...e };
  delete out.lockedFields;
  for (const f of lf) {
    if (f === "id" || f === "name")
      continue;
    out[f] = Array.isArray(out[f]) ? [LOCKED_FIELD_MASK] : LOCKED_FIELD_MASK;
  }
  return out;
}
function agentFileJson(bundle, key) {
  if (key === "threads") {
    return JSON.stringify({
      threads: bundle.threads.threads.filter((t) => t.status !== "resolved"),
      seeds: bundle.threads.seeds
    });
  }
  if (key === "characters" || key === "locations" || key === "things") {
    const file = bundle[key];
    return JSON.stringify({ entities: file.entities.map(maskLockedFields) });
  }
  return JSON.stringify(bundle[key]);
}
function lockedEntityIds(bundle, ctx) {
  const out = [];
  for (const key of activeEntityFiles(ctx)) {
    for (const e of bundle[key].entities) {
      if (e.locked === true)
        out.push(e.id);
    }
  }
  return out;
}
function lockedFieldEntityIds(bundle, ctx) {
  const out = [];
  for (const key of activeEntityFiles(ctx)) {
    for (const e of bundle[key].entities) {
      if (Array.isArray(e.lockedFields) && e.lockedFields.length > 0)
        out.push(e.id);
    }
  }
  return out;
}
function specialNotes(bundle, notes, ctx) {
  const special = [];
  if (notes.reconcile)
    special.push(tpl(ctx, "note_reconcile"));
  if (notes.migrateToTable)
    special.push(tpl(ctx, "note_migrate_table"));
  if (notes.migrateToInline)
    special.push(tpl(ctx, "note_migrate_inline"));
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
  return special.length ? special.join(`

`) : null;
}
function currentCodexParts(bundle, ctx) {
  const parts = ["<<CURRENT CODEX>>"];
  for (const key of CODEX_FILE_KEYS) {
    if (!ctx.activeFiles.has(key))
      continue;
    parts.push(`--- ${key}.json ---
${agentFileJson(bundle, key)}`);
  }
  return parts;
}
function buildCodexUserMessage(ctx, bundle, chunk, chunkLabel, chunkFirstIndex, notes, lore, storySoFar) {
  const parts = [];
  parts.push(tpl(ctx, "note_partial_story"));
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  if (storySoFar) {
    parts.push(`<<STORY SO FAR (chapter summaries, context only - this span is already recorded in the codex)>>
${storySoFar}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(`<<NEW STORY TURNS (${chunkLabel}) - the new material to encode>>`);
  parts.push(renderTranscript(chunk, true, chunkFirstIndex));
  parts.push(tpl(ctx, "pass_update"));
  return parts.join(`

`);
}
function buildCodexSummaryCatchupMessage(ctx, bundle, blocks, chunkLabel, notes) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  parts.push(fillPrompt(tpl(ctx, "pass_catchup_fast"), { CHUNK_LABEL: chunkLabel }));
  parts.push(...currentCodexParts(bundle, ctx));
  parts.push(`<<STORY (${chunkLabel}, compressed)>>`);
  parts.push(blocks.join(`

`));
  parts.push(tpl(ctx, "pass_update"));
  return parts.join(`

`);
}
function buildCodexUltraMessage(ctx, bundle, books, tailTranscript, chunkLabel, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const shape = books.length && tailTranscript ? "The story arrives as its filed summaries, oldest first, followed by the raw newest turns." : books.length ? "The story arrives as its filed summaries, oldest first." : "The story arrives as raw turns.";
  parts.push(fillPrompt(tpl(ctx, "pass_catchup_ultra"), { CHUNK_LABEL: chunkLabel, STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(tpl(ctx, "pass_update"));
  return parts.join(`

`);
}
function buildCodexReconcileMessage(ctx, bundle, books, tailTranscript, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const shape = books.length && tailTranscript ? "as its filed summaries, oldest first, followed by the raw newest turns" : books.length ? "as its filed summaries, oldest first" : "as raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_reconcile"), { STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(ctx.useTools ? "Sweep now. Send corrections as set/drop patches (or full content for a heavy rewrite), then call codex_done - or call codex_done alone if everything holds." : 'Sweep now. Respond with a JSON object: corrections in "writes" (patches, or full content for a heavy rewrite) and "done": true - or an empty "writes" with "done": true if everything holds.');
  return parts.join(`

`);
}
function buildCodexRefreshMessage(ctx, bundle, targets, books, tailTranscript, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript ? "its filed summaries, oldest first, followed by the raw newest turns" : books.length ? "its filed summaries, oldest first" : "raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_refresh"), {
    TARGET_FILES: list,
    IT_THEY: targets.length === 1 ? "it" : "they",
    LAG_PHRASE: targets.length === 1 ? "it lags" : "they lag",
    STORY_SHAPE: shape
  }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(ctx.useTools ? "Rewrite the target files now, then call codex_done." : 'Rewrite the target files now, each as full "content" in "writes", and set "done": true.');
  return parts.join(`

`);
}
function buildCodexRebuildMessage(ctx, bundle, targets, books, tailTranscript, notes, lore) {
  const parts = [];
  const special = specialNotes(bundle, notes, ctx);
  if (special)
    parts.push(special);
  const list = targets.map((t) => `${t}.json`).join(", ");
  const shape = books.length && tailTranscript ? "its filed summaries, oldest first, followed by the raw newest turns" : books.length ? "its filed summaries, oldest first" : "raw turns";
  parts.push(fillPrompt(tpl(ctx, "pass_rebuild"), { TARGET_FILES: list, STORY_SHAPE: shape }));
  if (lore) {
    parts.push(`<<ACTIVATED LORE (canon reference, read-only, do not copy into the codex)>>
${lore}`);
  }
  parts.push(...currentCodexParts(bundle, ctx));
  if (books.length) {
    parts.push(`<<STORY SO FAR (filed summaries, oldest first)>>
${books.join(`

`)}`);
  }
  if (tailTranscript) {
    parts.push("<<NEWEST STORY TURNS (raw)>>");
    parts.push(tailTranscript);
  }
  parts.push(`TARGET FILES: ${list}. Do not write any other file.`);
  parts.push(ctx.useTools ? "Rewrite the target files now, then call codex_done." : 'Rewrite the target files now, each as full "content" in "writes", and set "done": true.');
  return parts.join(`

`);
}
function buildCodexTidyMessage(ctx, bundle, targets) {
  const parts = [];
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
  parts.push(ctx.useTools ? "Rewrite the target files now. Write only files you actually improved, then call codex_done." : 'Rewrite the target files now. Put only files you actually improved in "writes", and set "done": true.');
  return parts.join(`

`);
}
function verifyNudge(ctx) {
  return tpl(ctx, "pass_verify") + " " + (ctx.useTools ? "Resend corrections if you find anything, otherwise call codex_done." : 'Respond with a JSON object: corrections in "writes" if you find anything (else an empty "writes"), and "done": true.');
}
function entityLine(e) {
  const bits = [];
  const skip = new Set(["id", "name", "aliases", "ties", "notes", "keywords", "locked", "lockedfields"]);
  if (e.aliases?.length)
    bits.push(`aka ${e.aliases.join(", ")}`);
  for (const [k, v] of Object.entries(e)) {
    if (skip.has(k.toLowerCase()) || v === undefined)
      continue;
    if (Array.isArray(v))
      bits.push(`${k}: ${v.join(", ")}`);
    else
      bits.push(`${k}: ${String(v)}`);
  }
  if (e.notes)
    bits.push(String(e.notes));
  return `- ${e.name} (${e.id})${bits.length ? ` | ${bits.join(" | ")}` : ""}`;
}
var ENTITY_REF_HEAD = /^(?:char|loc|thing):(.+)$/;
function resolveRefName(names, ref) {
  const n = names.get(ref);
  if (n)
    return n;
  const m = ENTITY_REF_HEAD.exec(ref);
  return m ? m[1].replace(/_/g, " ") : ref;
}
function relationLine(r, names) {
  const nameOf = (ref) => resolveRefName(names, ref);
  if (r.type === "pair") {
    const hist2 = r.history?.length ? ` (${r.history.join("; ")})` : "";
    return `- ${nameOf(r.a)} -> ${nameOf(r.b)} [${r.kind}]: ${r.state}${hist2}`;
  }
  const members = r.members.map((m) => {
    const role = r.roles?.[m];
    return role ? `${nameOf(m)} (${role})` : nameOf(m);
  });
  const extras = Object.entries(r.roles ?? {}).filter(([ref]) => !r.members.includes(ref)).map(([ref, role]) => `${role}: ${nameOf(ref)}`);
  const hist = r.history?.length ? ` (${r.history.join("; ")})` : "";
  return `- [${r.kind}] ${members.join(", ")}${extras.length ? ` (${extras.join(", ")})` : ""}: ${r.state}${hist}`;
}
var ENTITY_FILE_LABEL = {
  characters: "Character",
  locations: "Location",
  things: "Thing"
};
function relationInvolves(r, id) {
  if (r.type === "pair")
    return r.a === id || r.b === id;
  return r.members.includes(id) || Object.prototype.hasOwnProperty.call(r.roles ?? {}, id);
}
function uniqKeys(parts) {
  const seen = new Set;
  const out = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t)
      continue;
    const k = t.toLowerCase();
    if (seen.has(k))
      continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}
function fnvHex(s) {
  let h = 2166136261;
  for (let i = 0;i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function recordKey(prefix, raw, taken) {
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  const base = slug || `h${fnvHex(raw)}`;
  let key = `${prefix}:${base}`;
  let n = 2;
  while (taken.has(key))
    key = `${prefix}:${base}_${n++}`;
  taken.add(key);
  return key;
}
function renderCodexRecords(bundle, opts) {
  const names = new Map;
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities)
      names.set(e.id, e.name);
  }
  const out = [];
  const taken = new Set;
  const foldedRelations = new Set;
  for (const fileKey of ["characters", "locations", "things"]) {
    const label = ENTITY_FILE_LABEL[fileKey];
    for (const e of bundle[fileKey].entities) {
      const lines = [entityLine(e)];
      for (const t of e.ties ?? [])
        lines.push(`  * ${t}`);
      if (opts.includeRelations) {
        bundle.relations.relations.forEach((r, i) => {
          if (!relationInvolves(r, e.id))
            return;
          foldedRelations.add(i);
          lines.push(relationLine(r, names));
        });
      }
      out.push({
        record: recordKey("ent", e.id, taken),
        file: fileKey,
        comment: `[Codex] ${label}: ${e.name}`,
        content: `[Story Bible - ${label}: ${e.name}]
${lines.join(`
`)}`,
        keys: uniqKeys([e.name, ...e.aliases ?? [], ...e.keywords ?? []]),
        constant: false
      });
    }
  }
  if (opts.includeRelations) {
    const orphans = bundle.relations.relations.filter((_, i) => !foldedRelations.has(i));
    if (orphans.length > 0) {
      const endpointNames = orphans.flatMap((r) => r.type === "pair" ? [r.a, r.b] : [...r.members, ...Object.keys(r.roles ?? {})]).map((ref) => resolveRefName(names, ref));
      out.push({
        record: "rel:unlinked",
        file: "relations",
        comment: "[Codex] Relations (unlinked)",
        content: `[Story Bible - Relations]
${orphans.map((r) => relationLine(r, names)).join(`
`)}`,
        keys: uniqKeys(endpointNames),
        constant: false
      });
      taken.add("rel:unlinked");
    }
  }
  for (const w of bundle.world.entries) {
    out.push({
      record: recordKey("world", w.topic, taken),
      file: "world",
      comment: `[Codex] World: ${w.topic}`,
      content: `[Story Bible - World rules: ${w.topic}]
- ${w.topic}: ${w.facts.join(" | ")}`,
      keys: uniqKeys([w.topic, ...w.keywords ?? []]),
      constant: false
    });
  }
  for (const k of bundle.knowledge.items) {
    const bits = [];
    if (k.knownBy?.length)
      bits.push(`known by ${k.knownBy.map((r) => resolveRefName(names, r)).join(", ")}`);
    if (k.hiddenFrom?.length)
      bits.push(`hidden from ${k.hiddenFrom.map((r) => resolveRefName(names, r)).join(", ")}`);
    for (const b of k.falseBeliefs ?? []) {
      bits.push(`${resolveRefName(names, b.who)} wrongly believes: ${b.believes}`);
    }
    if (k.note)
      bits.push(k.note);
    const participants = [
      ...k.knownBy ?? [],
      ...k.hiddenFrom ?? [],
      ...(k.falseBeliefs ?? []).map((b) => b.who)
    ].filter((r) => ENTITY_REF_HEAD.test(r)).map((r) => resolveRefName(names, r));
    out.push({
      record: recordKey("know", k.fact, taken),
      file: "knowledge",
      comment: `[Codex] Secret: ${k.fact.slice(0, 60)}`,
      content: `[Story Bible - Who knows what]
- ${k.fact}${bits.length ? ` (${bits.join("; ")})` : ""}`,
      keys: uniqKeys([...participants, ...k.keywords ?? []]),
      constant: false
    });
  }
  const sections = renderCodexFileSections(bundle);
  if (sections.timeline) {
    out.push({
      record: "timeline",
      file: "timeline",
      comment: "[Codex] Timeline",
      content: `[Story Bible - current story state]
${sections.timeline}`,
      keys: [],
      constant: true
    });
  }
  if (sections.threads) {
    out.push({
      record: "threads",
      file: "threads",
      comment: "[Codex] Threads",
      content: `[Story Bible - current story state]
${sections.threads}`,
      keys: [],
      constant: true
    });
  }
  return out;
}
function renderCodexForInjection(bundle) {
  const rendered = renderCodexFileSections(bundle);
  const sections = [];
  for (const key of CODEX_FILE_KEYS) {
    const s = rendered[key];
    if (s)
      sections.push(s);
  }
  if (sections.length === 0)
    return "";
  return ["KNOWLEDGE CODEX (current story state, authoritative)", ...sections].join(`

`);
}
function renderCodexFileSections(bundle) {
  const names = new Map;
  for (const f of [bundle.characters, bundle.locations, bundle.things]) {
    for (const e of f.entities)
      names.set(e.id, e.name);
  }
  const out = {};
  const entitySection = (key, title, entities) => {
    if (!entities.length) {
      out[key] = "";
      return;
    }
    const lines = [`== ${title} ==`];
    for (const e of entities) {
      lines.push(entityLine(e));
      for (const t of e.ties ?? [])
        lines.push(`  * ${t}`);
    }
    out[key] = lines.join(`
`);
  };
  entitySection("characters", "Characters", bundle.characters.entities);
  entitySection("locations", "Locations", bundle.locations.entities);
  entitySection("things", "Things", bundle.things.entities);
  out.relations = bundle.relations.relations.length ? ["== Relations =="].concat(bundle.relations.relations.map((r) => relationLine(r, names))).join(`
`) : "";
  if (bundle.timeline.events.length) {
    const lines = ["== Timeline =="];
    for (const e of bundle.timeline.events) {
      const who = e.participants?.length ? ` [${e.participants.map((p) => resolveRefName(names, p)).join(", ")}]` : "";
      const where = e.where ? ` @ ${resolveRefName(names, e.where)}` : "";
      const causes = e.causes ? ` -> ${e.causes}` : "";
      lines.push(`- ${e.when}: ${e.event}${who}${where}${causes}`);
    }
    out.timeline = lines.join(`
`);
  } else {
    out.timeline = "";
  }
  const liveThreads = bundle.threads.threads.filter((t) => t.status !== "resolved");
  if (liveThreads.length || bundle.threads.seeds.length) {
    const lines = ["== Threads =="];
    for (const t of liveThreads) {
      const latest = t.latest ? ` | latest: ${t.latest}` : "";
      lines.push(`- ${t.name} (${t.status}): ${t.summary}${latest}`);
      for (const p of t.planted ?? [])
        lines.push(`  * planted: ${p}`);
    }
    for (const s of bundle.threads.seeds)
      lines.push(`- planted: ${s}`);
    out.threads = lines.join(`
`);
  } else {
    out.threads = "";
  }
  if (bundle.world.entries.length) {
    const lines = ["== World =="];
    for (const w of bundle.world.entries) {
      lines.push(`- ${w.topic}: ${w.facts.join(" | ")}`);
    }
    out.world = lines.join(`
`);
  } else {
    out.world = "";
  }
  if (bundle.knowledge.items.length) {
    const lines = ["== Who knows what =="];
    const nameList = (refs) => (refs ?? []).map((r) => resolveRefName(names, r)).join(", ");
    for (const k of bundle.knowledge.items) {
      const bits = [];
      if (k.knownBy?.length)
        bits.push(`known by ${nameList(k.knownBy)}`);
      if (k.hiddenFrom?.length)
        bits.push(`hidden from ${nameList(k.hiddenFrom)}`);
      for (const b of k.falseBeliefs ?? []) {
        bits.push(`${resolveRefName(names, b.who)} wrongly believes: ${b.believes}`);
      }
      if (k.note)
        bits.push(k.note);
      lines.push(`- ${k.fact} (${bits.join("; ")})`);
    }
    out.knowledge = lines.join(`
`);
  } else {
    out.knowledge = "";
  }
  return out;
}

// src/backend/codex/sync.ts
function readEntryMeta(entry) {
  const ext = entry.extensions || {};
  const raw = ext[CODEX_ENTRY_EXTENSION_KEY];
  if (!raw || typeof raw !== "object")
    return null;
  const v = raw;
  if (typeof v.chatId !== "string" || !v.chatId)
    return null;
  if (typeof v.record !== "string" || !v.record)
    return null;
  const file = typeof v.file === "string" && CODEX_FILE_KEYS.includes(v.file) ? v.file : null;
  if (!file)
    return null;
  return { chatId: v.chatId, record: v.record, file };
}
var syncChain = new Map;
function withSyncLock(userId, chatId, fn) {
  const key = `${userId}::${chatId}`;
  const prev = syncChain.get(key) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  syncChain.set(key, guarded);
  guarded.then(() => {
    if (syncChain.get(key) === guarded)
      syncChain.delete(key);
  });
  return tail;
}
function sameKeys(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0;i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
async function listSyncedEntries(bookId, chatId, userId) {
  const all = await listAllEntries(bookId, userId);
  const out = [];
  for (const entry of all) {
    const meta = readEntryMeta(entry);
    if (meta && meta.chatId === chatId)
      out.push({ raw: entry, meta });
  }
  return out;
}
function syncCodexEntries(chatId, userId, relationsTableFallback = true) {
  return withSyncLock(userId, chatId, () => doSync(chatId, userId, relationsTableFallback));
}
async function doSync(chatId, userId, relationsTableFallback) {
  if (await codexPresence(chatId, userId) === "absent") {
    await doWipe(chatId, userId);
    return;
  }
  const cursor = await loadCursor(chatId, userId);
  const diskMode = cursor.relationsTableMode ?? relationsTableFallback;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  if (problems.length > 0) {
    throw new Error(`codex sync skipped, unreadable or invalid file${problems.length === 1 ? "" : "s"}: ${problems.map((p) => `${p.file}.json`).join(", ")}`);
  }
  const relState = cursor.fileStates["relations"];
  const desired = renderCodexRecords(bundle, {
    includeRelations: relState !== "noInject" && relState !== "frozen"
  });
  const disabledFor = (file) => {
    const st = cursor.fileStates[file];
    return st === "noInject" || st === "frozen";
  };
  let bookId;
  if (desired.length > 0) {
    bookId = (await ensureCodexBookForChat(chatId, userId)).id;
  } else {
    const found = await findCodexBookForChat(chatId, userId);
    if (!found)
      return;
    bookId = found;
  }
  const existing = await listSyncedEntries(bookId, chatId, userId);
  const byRecord = new Map;
  let failedDeletes = 0;
  for (const e of existing) {
    const dup = byRecord.get(e.meta.record);
    if (!dup) {
      byRecord.set(e.meta.record, e);
      continue;
    }
    await spindle.world_books.entries.delete(e.raw.id, userId).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete duplicate entry ${e.raw.id}: ${describeError(err)}`);
    });
  }
  const seen = new Set;
  for (const rec of desired) {
    seen.add(rec.record);
    const disabled = disabledFor(rec.file);
    const meta = { chatId, record: rec.record, file: rec.file };
    const cur = byRecord.get(rec.record);
    if (!cur) {
      try {
        await spindle.world_books.entries.create(bookId, {
          content: rec.content,
          comment: rec.comment,
          disabled,
          constant: rec.constant,
          key: rec.keys,
          keysecondary: [],
          vectorized: false,
          extensions: { [CODEX_ENTRY_EXTENSION_KEY]: meta }
        }, userId);
      } catch (err) {
        warn(`codex sync: failed to create entry for ${rec.record}: ${describeError(err)}`);
        throw err;
      }
      continue;
    }
    const changed = cur.raw.content !== rec.content || (cur.raw.comment || "") !== rec.comment || cur.raw.constant !== rec.constant || cur.raw.disabled !== disabled || !sameKeys(cur.raw.key ?? [], rec.keys) || cur.meta.file !== rec.file;
    if (!changed)
      continue;
    const ext = cur.raw.extensions || {};
    try {
      await spindle.world_books.entries.update(cur.raw.id, {
        content: rec.content,
        comment: rec.comment,
        disabled,
        constant: rec.constant,
        key: rec.keys,
        extensions: { ...ext, [CODEX_ENTRY_EXTENSION_KEY]: meta }
      }, userId);
    } catch (err) {
      warn(`codex sync: failed to update entry for ${rec.record}: ${describeError(err)}`);
      throw err;
    }
  }
  for (const [record, e] of byRecord) {
    if (seen.has(record))
      continue;
    await spindle.world_books.entries.delete(e.raw.id, userId).catch((err) => {
      failedDeletes++;
      warn(`codex sync: failed to delete stale entry ${e.raw.id} (${record}): ${describeError(err)}`);
    });
  }
  if (failedDeletes > 0) {
    throw new Error(`failed to delete ${failedDeletes} outdated codex entr${failedDeletes === 1 ? "y" : "ies"}`);
  }
}
function wipeCodexEntries(chatId, userId) {
  return withSyncLock(userId, chatId, () => doWipe(chatId, userId));
}
async function doWipe(chatId, userId) {
  const bookId = await findCodexBookForChat(chatId, userId);
  if (!bookId)
    return;
  const existing = await listSyncedEntries(bookId, chatId, userId);
  let failed = 0;
  for (const e of existing) {
    await spindle.world_books.entries.delete(e.raw.id, userId).catch((err) => {
      failed++;
      warn(`codex wipe: failed to delete entry ${e.raw.id}: ${describeError(err)}`);
    });
  }
  if (failed > 0) {
    throw new Error(`failed to delete ${failed} codex entr${failed === 1 ? "y" : "ies"}, they may still inject`);
  }
}

// src/backend/fork.ts
var FORK_ADOPTED_FLAG = "lumibooks_fork_adopted";
var CODEX_ADOPTED_FLAG = "lumibooks_codex_fork_adopted";
var MAX_ANCESTRY_HOPS = 100;
var checked = new Set;
var inflight2 = new Map;
var retryAt = new Map;
var RETRY_BACKOFF_MS = 30000;
var forkAnomalyCb = null;
function registerForkAnomalyCallback(cb) {
  forkAnomalyCb = cb;
}
function key(userId, chatId) {
  return `${userId}::${chatId}`;
}
async function ensureForkAdoption(chatId, userId) {
  const k = key(userId, chatId);
  if (checked.has(k))
    return;
  const nextTry = retryAt.get(k);
  if (nextTry && Date.now() < nextTry)
    return;
  const existing = inflight2.get(k);
  if (existing)
    return existing;
  const p = (async () => {
    try {
      const settled = await doForkAdoption(chatId, userId);
      if (settled) {
        if (checked.size > 5000)
          checked.clear();
        checked.add(k);
        retryAt.delete(k);
      } else {
        if (retryAt.size > 1000)
          retryAt.clear();
        retryAt.set(k, Date.now() + RETRY_BACKOFF_MS);
      }
    } catch (err) {
      if (retryAt.size > 1000)
        retryAt.clear();
      retryAt.set(k, Date.now() + RETRY_BACKOFF_MS);
      warn(`fork adoption failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    } finally {
      inflight2.delete(k);
    }
  })();
  inflight2.set(k, p);
  return p;
}
async function forkShelfPending(chatId, userId) {
  if (checked.has(key(userId, chatId)))
    return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  if (!md || typeof md["branched_from"] !== "string")
    return false;
  const flag = md[FORK_ADOPTED_FLAG];
  if (flag === chatId)
    return false;
  if (flag === true) {
    return await findBookForChat(chatId, userId).catch(() => null) === null;
  }
  return true;
}
async function forkCodexPending(chatId, userId) {
  if (checked.has(key(userId, chatId)))
    return false;
  const chat = await spindle.chats.get(chatId, userId).catch(() => null);
  const md = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  if (!md || typeof md["branched_from"] !== "string")
    return false;
  const flag = md[CODEX_ADOPTED_FLAG];
  if (flag === chatId)
    return false;
  if (flag === true) {
    return await codexPresence(chatId, userId).catch(() => "absent") !== "present";
  }
  return true;
}
async function doForkAdoption(forkChatId, userId) {
  const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
  if (!chat)
    return false;
  const meta = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
  const branchedFrom = meta && typeof meta["branched_from"] === "string" ? meta["branched_from"] : null;
  if (!branchedFrom)
    return true;
  let shelfSettled = true;
  if (meta?.[FORK_ADOPTED_FLAG] !== forkChatId) {
    const owned = await findBookForChat(forkChatId, userId).catch(() => null);
    if (!owned) {
      const ancestor = await findAncestorBook(branchedFrom, userId);
      if (ancestor === "fault") {
        shelfSettled = false;
      } else if (ancestor) {
        try {
          await cloneShelfForFork(forkChatId, chat.name ?? null, ancestor.chatId, userId);
        } catch (err) {
          shelfSettled = false;
          warn(`fork shelf adoption failed for ${forkChatId.slice(0, 8)}: ${describeError(err)}`);
          forkAnomalyCb?.(userId, `Memoria couldn't carry the shelf into this fork and will retry: ${shortErrorText(err)}`);
        }
      } else {
        await markShelfAdopted(forkChatId, userId).catch(() => {});
      }
    } else {
      await markShelfAdopted(forkChatId, userId).catch(() => {});
    }
  }
  const codexSettled = await adoptForkCodex(forkChatId, branchedFrom, userId);
  return shelfSettled && codexSettled;
}
async function adoptForkCodex(forkChatId, branchedFrom, userId) {
  try {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      return false;
    const md = chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
    const flag = md?.[CODEX_ADOPTED_FLAG];
    if (flag === forkChatId)
      return true;
    if (flag === true && await codexPresence(forkChatId, userId) === "present") {
      await markCodexAdopted(forkChatId, userId);
      return true;
    }
    const attached = Array.isArray(md?.["chat_world_book_ids"]) ? md["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    for (const bookId of attached) {
      const book = await spindle.world_books.get(bookId, userId);
      if (!book)
        continue;
      const tag = codexBookChatTag(book);
      if (tag && tag !== forkChatId) {
        await unbindBookFromChat(forkChatId, bookId, userId);
      }
    }
    let ancestorChatId = null;
    {
      const seen = new Set;
      let cur = branchedFrom;
      let hops = 0;
      while (cur && hops < MAX_ANCESTRY_HOPS) {
        const cid = cur;
        if (seen.has(cid))
          break;
        seen.add(cid);
        hops++;
        if (await codexPresence(cid, userId) === "present") {
          ancestorChatId = cid;
          break;
        }
        const ancChat = await spindle.chats.get(cid, userId).catch(() => null);
        const ancMeta = ancChat && ancChat.metadata && typeof ancChat.metadata === "object" ? ancChat.metadata : null;
        cur = ancMeta && typeof ancMeta["branched_from"] === "string" ? ancMeta["branched_from"] : null;
      }
    }
    if (!ancestorChatId) {
      await markCodexAdopted(forkChatId, userId);
      return true;
    }
    if (getBusy(userId).some((b) => b.kind === "codex" && (b.chatId === ancestorChatId || b.chatId === forkChatId))) {
      return false;
    }
    const [forkMsgs, ancMsgs] = await Promise.all([
      spindle.chat.getMessages(forkChatId),
      spindle.chat.getMessages(ancestorChatId)
    ]);
    const ancIdxById = new Map;
    for (const m of ancMsgs)
      ancIdxById.set(m.id, m.index_in_chat);
    const forkIdByIdx = new Map;
    for (const m of forkMsgs) {
      if (forkIdByIdx.has(m.index_in_chat)) {
        warn(`fork codex adoption: duplicate index_in_chat ${m.index_in_chat} in fork ${forkChatId.slice(0, 8)}; remap may be imprecise`);
        continue;
      }
      forkIdByIdx.set(m.index_in_chat, m.id);
    }
    const remapToFork = (ancestorMsgId) => {
      const idx = ancIdxById.get(ancestorMsgId);
      if (idx === undefined)
        return null;
      return forkIdByIdx.get(idx) ?? null;
    };
    let forkTip = null;
    let tipIdx = -1;
    for (const m of forkMsgs) {
      if (m.index_in_chat > tipIdx) {
        tipIdx = m.index_in_chat;
        forkTip = m.id;
      }
    }
    const inherited = await inheritCodex(ancestorChatId, forkChatId, userId, remapToFork, forkTip);
    await syncCodexEntries(forkChatId, userId);
    if (inherited) {
      info(`fork adoption: inherited codex from ${ancestorChatId.slice(0, 8)} into ${forkChatId.slice(0, 8)}`);
    }
    await markCodexAdopted(forkChatId, userId);
    return true;
  } catch (err) {
    warn(`fork codex adoption failed for ${forkChatId.slice(0, 8)}: ${describeError(err)}`);
    forkAnomalyCb?.(userId, `Memoria couldn't carry the codex into this fork and will retry: ${shortErrorText(err)}`);
    return false;
  }
}
async function markShelfAdopted(forkChatId, userId) {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      return;
    const md = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    if (md[FORK_ADOPTED_FLAG] === forkChatId)
      return;
    md[FORK_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata: md }, userId);
  });
}
async function markCodexAdopted(forkChatId, userId) {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      throw new Error("fork chat vanished while recording codex adoption");
    const md = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    if (md[CODEX_ADOPTED_FLAG] === forkChatId)
      return;
    md[CODEX_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata: md }, userId);
  });
}
async function findAncestorBook(startChatId, userId) {
  const seen = new Set;
  let cur = startChatId;
  let hops = 0;
  while (cur && hops < MAX_ANCESTRY_HOPS) {
    const chatId = cur;
    if (seen.has(chatId))
      break;
    seen.add(chatId);
    hops++;
    let bookId;
    try {
      bookId = await findBookForChat(chatId, userId);
    } catch {
      return "fault";
    }
    if (bookId)
      return { chatId, bookId };
    let chat;
    try {
      chat = await spindle.chats.get(chatId, userId);
    } catch {
      return "fault";
    }
    const meta = chat && chat.metadata && typeof chat.metadata === "object" ? chat.metadata : null;
    cur = meta && typeof meta["branched_from"] === "string" ? meta["branched_from"] : null;
  }
  return null;
}
async function cloneShelfForFork(forkChatId, forkChatName, parentChatId, userId) {
  const parentEntries = await listLmbEntries(parentChatId, userId);
  if (parentEntries.length === 0)
    return;
  const [forkMsgs, parentMsgs] = await Promise.all([
    spindle.chat.getMessages(forkChatId),
    spindle.chat.getMessages(parentChatId)
  ]);
  const parentIdxById = new Map;
  for (const m of parentMsgs)
    parentIdxById.set(m.id, m.index_in_chat);
  const forkIdByIdx = new Map;
  for (const m of forkMsgs) {
    if (forkIdByIdx.has(m.index_in_chat)) {
      warn(`fork adoption: duplicate index_in_chat ${m.index_in_chat} in fork ${forkChatId.slice(0, 8)}; remap may be imprecise`);
      continue;
    }
    forkIdByIdx.set(m.index_in_chat, m.id);
  }
  const remap = (msgIds) => {
    const ids = [];
    let first = Number.POSITIVE_INFINITY;
    let last = -1;
    for (const id of msgIds) {
      const idx = parentIdxById.get(id);
      if (idx === undefined)
        continue;
      const forkId = forkIdByIdx.get(idx);
      if (forkId === undefined)
        continue;
      ids.push(forkId);
      if (idx < first)
        first = idx;
      if (idx > last)
        last = idx;
    }
    return {
      ids,
      first: first === Number.POSITIVE_INFINITY ? undefined : first,
      last: last === -1 ? undefined : last
    };
  };
  const forkTransform = (entry, ctx) => {
    if (entry.meta.ghost)
      return null;
    if (entry.meta.isRoot) {
      return {
        msgIds: entry.meta.msgIds.slice(),
        firstMsgIdx: entry.meta.firstMsgIdx,
        lastMsgIdx: entry.meta.lastMsgIdx,
        extra: { chatId: forkChatId }
      };
    }
    const { ids, first, last } = remap(entry.meta.msgIds);
    if (entry.meta.tier === 1) {
      if (ids.length === 0)
        return null;
      return { msgIds: ids, firstMsgIdx: first, lastMsgIdx: last, extra: { chatId: forkChatId } };
    }
    const survived = (entry.meta.sourceChapterEntryIds ?? []).map((oldId) => ctx.idMap.get(oldId)).filter((x) => typeof x === "string");
    if (ids.length === 0 && survived.length === 0)
      return null;
    let firstIdx = first;
    let lastIdx = last;
    if (firstIdx === undefined || lastIdx === undefined) {
      for (const oldId of entry.meta.sourceChapterEntryIds ?? []) {
        const cm = ctx.clonedMeta.get(oldId);
        if (!cm)
          continue;
        if (cm.firstMsgIdx !== undefined)
          firstIdx = firstIdx === undefined ? cm.firstMsgIdx : Math.min(firstIdx, cm.firstMsgIdx);
        if (cm.lastMsgIdx !== undefined)
          lastIdx = lastIdx === undefined ? cm.lastMsgIdx : Math.max(lastIdx, cm.lastMsgIdx);
      }
    }
    return { msgIds: ids, firstMsgIdx: firstIdx, lastMsgIdx: lastIdx, extra: { chatId: forkChatId } };
  };
  const newBook = await spindle.world_books.create({
    name: bookNameFor(forkChatName, forkChatId),
    description: "Memoria's shelf for this chat. Chapters and arcs live here.",
    metadata: {
      lumibooks_chat_id: forkChatId,
      lumibooks_created_at: Date.now(),
      lumibooks_forked_from: parentChatId
    }
  }, userId);
  let cloned = 0;
  try {
    const idMap = await copyLmbEntries(newBook.id, parentEntries, userId, forkTransform);
    cloned = idMap.size;
    await rebindForkShelf(forkChatId, newBook.id, userId);
  } catch (err) {
    await spindle.world_books.delete(newBook.id, userId).catch(() => {});
    throw err;
  }
  invalidateBookCache(userId, forkChatId);
  try {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    const desiredHidden = profile ? profile.hideCoveredMessages : true;
    await resyncVisibility(forkChatId, userId, desiredHidden);
  } catch (err) {
    warn(`fork adoption: visibility resync failed: ${describeError(err)}`);
  }
  info(`adopted fork ${forkChatId.slice(0, 8)} from ${parentChatId.slice(0, 8)} (${cloned} entries cloned)`);
}
async function rebindForkShelf(forkChatId, newBookId, userId) {
  await withChatMetaLock(userId, forkChatId, async () => {
    const chat = await spindle.chats.get(forkChatId, userId).catch(() => null);
    if (!chat)
      return;
    const metadata = chat.metadata && typeof chat.metadata === "object" ? { ...chat.metadata } : {};
    const inheritedBookId = typeof metadata["lumibooks_book_id"] === "string" ? metadata["lumibooks_book_id"] : null;
    const existing = Array.isArray(metadata["chat_world_book_ids"]) ? metadata["chat_world_book_ids"].filter((x) => typeof x === "string") : [];
    const nextBookIds = existing.filter((id) => id !== inheritedBookId && id !== newBookId);
    nextBookIds.push(newBookId);
    metadata["chat_world_book_ids"] = nextBookIds;
    metadata["lumibooks_book_id"] = newBookId;
    metadata[FORK_ADOPTED_FLAG] = forkChatId;
    await spindle.chats.update(forkChatId, { metadata }, userId);
  });
}

// src/backend/pipeline.ts
var inflight3 = new Map;
var busyByUser = new Map;
var aborters = new Map;
var progressLastPush = new Map;
var progressState = new Map;
var heartbeatTimer = null;
var HEARTBEAT_INTERVAL_MS = 1000;
var failureByChat = new Map;
var previewsByChat = new Map;
var committingDrafts = new Set;
var PROGRESS_PUSH_INTERVAL_MS = 250;
var freedGhostNumbers = new Map;
var FREED_NUMBERS_CAP = 20;
var FREED_MAP_CAP = 200;
function recordFreedGhostNumber(userId, chatId, msgIds, sceneNumber) {
  const key2 = chatKey(userId, chatId);
  const list = freedGhostNumbers.get(key2) ?? [];
  freedGhostNumbers.delete(key2);
  list.push({ ids: new Set(msgIds), sceneNumber });
  freedGhostNumbers.set(key2, list.slice(-FREED_NUMBERS_CAP));
  capMap(freedGhostNumbers, FREED_MAP_CAP);
}
function takeFreedGhostNumber(userId, chatId, windowIds) {
  const key2 = chatKey(userId, chatId);
  const list = freedGhostNumbers.get(key2);
  if (!list)
    return null;
  const idx = list.findIndex((f) => {
    for (const id of windowIds)
      if (f.ids.has(id))
        return true;
    return false;
  });
  if (idx === -1)
    return null;
  const n = list[idx].sceneNumber;
  list.splice(idx, 1);
  if (list.length === 0)
    freedGhostNumbers.delete(key2);
  return n;
}
var commitChain = new Map;
function withCommitMutex(userId, chatId, tier, fn) {
  const key2 = `${userId}::${chatId}::t${tier}`;
  const prev = commitChain.get(key2) ?? Promise.resolve();
  const tail = prev.then(fn, fn);
  const guarded = tail.catch(() => {
    return;
  });
  commitChain.set(key2, guarded);
  guarded.then(() => {
    if (commitChain.get(key2) === guarded)
      commitChain.delete(key2);
  });
  return tail;
}
var FAILURE_MAP_CAP = 500;
var PREVIEW_MAP_CAP = 500;
function capMap(map, cap) {
  while (map.size > cap) {
    const oldest = map.keys().next().value;
    if (oldest === undefined)
      break;
    map.delete(oldest);
  }
}
function busyKey(userId, chatId, kind) {
  return `${userId}::${chatId}::${kind}`;
}
function chatKey(userId, chatId) {
  return `${userId}::${chatId}`;
}
var cb = null;
function registerPipelineCallbacks(c) {
  cb = c;
}
function setBusy(userId, chatId, kind, label) {
  const key2 = busyKey(userId, chatId, kind);
  if (inflight3.has(key2))
    return false;
  const entry = { kind, chatId, label, startedAt: Date.now() };
  inflight3.set(key2, entry);
  progressState.set(key2, { kind, chars: 0, thinkingChars: 0, userId, chatId });
  streamBufs.delete(key2);
  streamLastPush.delete(key2);
  const list = busyByUser.get(userId) ?? [];
  list.push(entry);
  busyByUser.set(userId, list);
  cb?.onBusyChange(userId, list.slice());
  ensureHeartbeat();
  return true;
}
function clearBusy(userId, chatId, kind) {
  const key2 = busyKey(userId, chatId, kind);
  inflight3.delete(key2);
  aborters.delete(key2);
  progressLastPush.delete(key2);
  progressState.delete(key2);
  if (streamWatchers.has(key2)) {
    const buf = streamBufs.get(key2);
    cb?.onStreamText(userId, chatId, kind, {
      content: buf?.content ?? "",
      thinking: buf?.thinking ?? "",
      running: false
    });
    streamWatchers.delete(key2);
  }
  streamLastPush.delete(key2);
  const fresh = [];
  for (const k of inflight3.keys()) {
    if (!k.startsWith(`${userId}::`))
      continue;
    const found = inflight3.get(k);
    if (found)
      fresh.push(found);
  }
  busyByUser.set(userId, fresh);
  cb?.onBusyChange(userId, fresh.slice());
}
function registerAborter(userId, chatId, kind, controller) {
  aborters.set(busyKey(userId, chatId, kind), controller);
}
function abortBusy(userId, chatId, kind) {
  const controller = aborters.get(busyKey(userId, chatId, kind));
  if (!controller)
    return false;
  controller.abort();
  return true;
}
function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)
    return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m${rem.toString().padStart(2, "0")}s`;
}
var BUSY_PHRASES = {
  chapter: { idle: "Memoria is filing a chapter", writing: "Memoria is writing a chapter" },
  arc: { idle: "Memoria is binding an arc", writing: "Memoria is binding an arc" },
  volume: { idle: "Memoria is pressing a volume", writing: "Memoria is pressing a volume" },
  codex: { idle: "Memoria is updating the codex", writing: "Memoria is updating the codex" }
};
function formatBusyLabel(state, elapsedMs) {
  const { idle, writing } = BUSY_PHRASES[state.kind];
  const tokens = approximateTokensFromChars(state.chars);
  const thinkTokens = approximateTokensFromChars(state.thinkingChars);
  const t = formatElapsed(elapsedMs);
  if (tokens === 0 && thinkTokens === 0)
    return `${idle} (${t})`;
  if (tokens === 0 && thinkTokens > 0)
    return `Memoria is thinking (~${thinkTokens}t, ${t})`;
  if (thinkTokens > 0)
    return `${writing} (~${tokens}t written, ~${thinkTokens}t thought, ${t})`;
  return `${writing} (~${tokens}t, ${t})`;
}
function ensureHeartbeat() {
  if (heartbeatTimer)
    return;
  heartbeatTimer = setInterval(() => {
    if (progressState.size === 0) {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      return;
    }
    const touched = new Set;
    for (const [key2, ps] of progressState) {
      const entry = inflight3.get(key2);
      if (!entry)
        continue;
      const elapsed = Date.now() - entry.startedAt;
      entry.label = formatBusyLabel(ps, elapsed);
      touched.add(ps.userId);
    }
    for (const userId of touched) {
      const list = busyByUser.get(userId) ?? [];
      cb?.onBusyChange(userId, list.slice());
    }
  }, HEARTBEAT_INTERVAL_MS);
}
var streamBufs = new Map;
var streamWatchers = new Set;
var streamLastPush = new Map;
var STREAM_PUSH_INTERVAL_MS = 350;
var STREAM_BUF_CAP = 200000;
function capStreamPart(s) {
  if (s.length <= STREAM_BUF_CAP)
    return s;
  return `[...earlier output trimmed...]
${s.slice(-STREAM_BUF_CAP)}`;
}
function appendStreamText(userId, chatId, kind, deltaKind, delta) {
  const key2 = busyKey(userId, chatId, kind);
  if (!inflight3.has(key2))
    return;
  const buf = streamBufs.get(key2) ?? { content: "", thinking: "" };
  if (deltaKind === "text")
    buf.content = capStreamPart(buf.content + delta);
  else
    buf.thinking = capStreamPart(buf.thinking + delta);
  streamBufs.set(key2, buf);
  if (!streamWatchers.has(key2))
    return;
  const now = Date.now();
  if (now - (streamLastPush.get(key2) ?? 0) < STREAM_PUSH_INTERVAL_MS)
    return;
  streamLastPush.set(key2, now);
  cb?.onStreamText(userId, chatId, kind, { content: buf.content, thinking: buf.thinking, running: true });
}
function setStreamWatcher(userId, chatId, kind, on) {
  const key2 = busyKey(userId, chatId, kind);
  if (!on) {
    streamWatchers.delete(key2);
    return;
  }
  streamWatchers.add(key2);
  const buf = streamBufs.get(key2);
  cb?.onStreamText(userId, chatId, kind, {
    content: buf?.content ?? "",
    thinking: buf?.thinking ?? "",
    running: inflight3.has(key2)
  });
}
function updateProgressNumbers(userId, chatId, kind, chars, thinkingChars) {
  const key2 = busyKey(userId, chatId, kind);
  const ps = progressState.get(key2);
  if (!ps)
    return;
  ps.chars = chars;
  ps.thinkingChars = thinkingChars;
  const entry = inflight3.get(key2);
  if (!entry)
    return;
  const now = Date.now();
  const last = progressLastPush.get(key2) ?? 0;
  if (now - last < PROGRESS_PUSH_INTERVAL_MS)
    return;
  progressLastPush.set(key2, now);
  entry.label = formatBusyLabel(ps, now - entry.startedAt);
  const list = busyByUser.get(userId) ?? [];
  cb?.onBusyChange(userId, list.slice());
}
function getBusy(userId) {
  return (busyByUser.get(userId) ?? []).slice();
}
function getLastFailure(userId, chatId) {
  return failureByChat.get(chatKey(userId, chatId)) ?? null;
}
function clearLastFailure(userId, chatId) {
  failureByChat.delete(chatKey(userId, chatId));
}
function getPendingPreviews(userId, chatId) {
  return (previewsByChat.get(chatKey(userId, chatId)) ?? []).slice();
}
function findPendingPreview(userId, chatId, draftId) {
  return (previewsByChat.get(chatKey(userId, chatId)) ?? []).find((p) => p.draftId === draftId) ?? null;
}
function dropPendingPreview(userId, chatId, draftId) {
  const list = previewsByChat.get(chatKey(userId, chatId)) ?? [];
  previewsByChat.set(chatKey(userId, chatId), list.filter((p) => p.draftId !== draftId));
}
function patchPendingPreview(userId, chatId, draftId, patch) {
  const key2 = chatKey(userId, chatId);
  const list = previewsByChat.get(key2) ?? [];
  const idx = list.findIndex((p) => p.draftId === draftId);
  if (idx === -1)
    return;
  const old = list[idx];
  list[idx] = {
    ...old,
    title: patch.title !== undefined ? patch.title : old.title,
    content: patch.content !== undefined ? patch.content : old.content
  };
  previewsByChat.set(key2, list);
}
function pushPreview(userId, chatId, preview) {
  const key2 = chatKey(userId, chatId);
  const existing = previewsByChat.get(key2);
  if (existing) {
    previewsByChat.delete(key2);
    existing.push(preview);
    previewsByChat.set(key2, existing);
  } else {
    previewsByChat.set(key2, [preview]);
  }
  capMap(previewsByChat, PREVIEW_MAP_CAP);
}
async function runWithRetry(attempts, fn, onRetry) {
  let lastErr = null;
  const tries = Math.max(1, attempts);
  for (let i = 0;i < tries; i++) {
    try {
      const v = await fn();
      return { ok: true, value: v };
    } catch (err) {
      lastErr = err;
      if (err instanceof FatalSummarizerError || err instanceof AbortedSummarizerError) {
        return { ok: false, err, retries: i };
      }
      if (i < tries - 1)
        onRetry(i + 1, err);
    }
  }
  return { ok: false, err: lastErr, retries: tries - 1 };
}
function recordFailure(userId, chatId, kind, retries, err) {
  const key2 = chatKey(userId, chatId);
  if (failureByChat.has(key2))
    failureByChat.delete(key2);
  failureByChat.set(key2, {
    kind,
    message: describeError(err),
    retriedTimes: retries,
    at: Date.now()
  });
  capMap(failureByChat, FAILURE_MAP_CAP);
}
function nyaaToast(userId, kind, automation) {
  if (!cb)
    return;
  const tone = kind === "retry" ? "warn" : kind === "success" || kind === "arc_success" || kind === "volume_success" ? "success" : "info";
  cb.onToast(userId, tone, pickPhrase(kind), automation);
}
function shortErrorText(err) {
  const raw = describeError(err).replace(/\s+/g, " ").trim();
  const firstSentence = raw.split(/(?<=[.!?])\s/, 1)[0] || raw;
  const cleaned = firstSentence.replace(/;/g, ",");
  return cleaned.length > 160 ? `${cleaned.slice(0, 159)}\u2026` : cleaned;
}
function failToast(userId, kind, err) {
  const noun = kind === "arc" ? "bind the arc" : kind === "volume" ? "press the volume" : "file the chapter";
  cb?.onToast(userId, "error", `Memoria couldn't ${noun}: ${shortErrorText(err)}`);
}
function extraContextActive(profile) {
  return profile.codexEnabled && profile.codexExtraContext;
}
function selectGhostWindow(messages, coverage, effProfile) {
  const kept = trimLagFromTail(messages, effProfile);
  let i = 0;
  while (i < kept.length) {
    while (i < kept.length && coverage.coveredBy.has(kept[i].id))
      i++;
    if (i >= kept.length)
      return [];
    const run = [];
    let boundedByCoverage = false;
    while (i < kept.length) {
      const m = kept[i];
      if (coverage.coveredBy.has(m.id)) {
        boundedByCoverage = true;
        break;
      }
      run.push(m);
      i++;
    }
    const runSize = sizeEligible(run, effProfile.windowUnit, effProfile);
    if (!boundedByCoverage && runSize < effProfile.windowValue)
      return [];
    if (runSize === 0)
      continue;
    const window = selectNextChapterWindow(run, { ...effProfile, lagValue: 0 });
    if (window.length > 0)
      return window;
  }
  return [];
}
async function createChapterAuto(chatId, profile, settings, userId, automation = false, ghost = false) {
  if (!setBusy(userId, chatId, "chapter", "Memoria is filing a chapter"))
    return null;
  try {
    if (ghost) {
      const live = await loadSettings(userId);
      const liveProfile = live.profiles.find((p) => p.id === live.activeProfileId);
      if (!liveProfile || !extraContextActive(liveProfile))
        return null;
    }
    const messages = await spindle.chat.getMessages(chatId);
    if (!messages || messages.length === 0)
      return null;
    const effProfile = ghost ? { ...profile, lagUnit: profile.codexLagUnit, lagValue: profile.codexLagValue } : profile;
    const includeGhosts = ghost || extraContextActive(profile);
    const coverage = await buildCoverage(chatId, userId, undefined, includeGhosts);
    let window;
    if (ghost) {
      window = selectGhostWindow(messages, coverage, effProfile);
    } else {
      const stats = computeCoverageStats(messages, coverage, effProfile);
      if (!stats.lagSatisfied || !stats.windowAvailable)
        return null;
      const uncoveredTail = pickUncoveredTail(messages, coverage);
      window = selectNextChapterWindow(uncoveredTail, effProfile);
    }
    if (window.length === 0)
      return null;
    return await runChapter(chatId, profile, settings, userId, messages, window, { automation, ghost });
  } finally {
    clearBusy(userId, chatId, "chapter");
  }
}
async function createChapterFromRange(chatId, messageIds, profile, settings, userId, opts = {}) {
  if (!setBusy(userId, chatId, "chapter", "Memoria is filing a chapter"))
    return null;
  try {
    const messages = await spindle.chat.getMessages(chatId);
    if (!messages.length)
      return null;
    const set = new Set(messageIds);
    const window = messages.filter((m) => set.has(m.id) && !isExcluded(m));
    if (window.length === 0)
      return null;
    return await runChapter(chatId, profile, settings, userId, messages, window, { replacesEntryId: opts.replacesEntryId });
  } finally {
    clearBusy(userId, chatId, "chapter");
  }
}
async function runChapter(chatId, profile, settings, userId, allMessages, window, opts = {}) {
  const { replacesEntryId } = opts;
  const automation = opts.automation === true;
  const ghost = opts.ghost === true;
  nyaaToast(userId, "fire", automation);
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, ghost || extraContextActive(profile));
  let chapters = coverage.activeEntries.filter((e) => e.meta.tier === 1 && typeof e.meta.firstMsgIdx === "number").sort((a, b) => a.meta.firstMsgIdx - b.meta.firstMsgIdx);
  if (ghost) {
    const windowFirstIdx = allMessages.findIndex((m) => m.id === window[0].id);
    const posById = new Map(allMessages.map((m, i) => [m.id, i]));
    chapters = chapters.filter((c) => liveEndPosition(c.meta.msgIds, c.meta.lastMsgIdx, posById) < windowFirstIdx);
  }
  const previousMemories = profile.previousMemoriesCount > 0 ? chapters.slice(-profile.previousMemoriesCount) : [];
  const provisionalSceneNumber = await nextSceneNumber(chatId, 1, userId);
  const opener = buildChapterHeader(provisionalSceneNumber, window.length);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController;
    registerAborter(userId, chatId, "chapter", controller);
    try {
      return await summarizeChapter(profile, settings.customPresets, chatId, window, previousMemories, userId, opener, {
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "chapter", chars, thinking),
        onDelta: (kind, delta) => appendStreamText(userId, chatId, "chapter", kind, delta)
      });
    } finally {
      aborters.delete(busyKey(userId, chatId, "chapter"));
    }
  }, (n, err) => {
    warn(`chapter attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", automation);
  });
  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the pen down");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "chapter", outcome.retries, outcome.err);
    failToast(userId, "chapter", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);
  const result = outcome.value;
  const firstIdx = allMessages.findIndex((m) => m.id === window[0].id);
  const lastIdx = allMessages.findIndex((m) => m.id === window[window.length - 1].id);
  if (profile.showMemoryPreviews && !ghost) {
    const draft = makePreview("chapter", chatId, window, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitChapter(chatId, profile, userId, window, result, firstIdx, lastIdx, allMessages, false, replacesEntryId, ghost);
    nyaaToast(userId, "success", automation);
    return entryId;
  } catch (err) {
    warn(`commitChapter failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "chapter", 0, err);
    failToast(userId, "chapter", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}
async function commitChapter(chatId, profile, userId, window, result, firstIdx, lastIdx, allMessages, fromPreview, replacesEntryId, ghost = false) {
  return withCommitMutex(userId, chatId, 1, async () => {
    if (ghost) {
      const live = await loadSettings(userId);
      const liveProfile = live.profiles.find((p) => p.id === live.activeProfileId);
      if (!liveProfile || !extraContextActive(liveProfile)) {
        throw new Error("Extra context mode was turned off while this ghost was being written");
      }
    }
    const freshEntries = await listLmbEntries(chatId, userId);
    const entriesForCoverage = replacesEntryId ? freshEntries.filter((e) => e.raw.id !== replacesEntryId) : freshEntries;
    const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage, ghost || extraContextActive(profile));
    const validWindow = window.filter((m) => !freshCoverage.coveredBy.has(m.id));
    if (validWindow.length === 0) {
      const ghostById = new Map(freshEntries.map((e) => [e.raw.id, e.meta.ghost === true]));
      const allGhost = window.every((m) => ghostById.get(freshCoverage.coveredBy.get(m.id) ?? "") === true);
      throw new Error(allGhost ? "Those messages are already staged as a ghost chapter, it will file on its own" : "All messages in this window were just bound by another chapter");
    }
    if (validWindow.length < window.length) {
      window = validWindow;
      const validIds = new Set(validWindow.map((m) => m.id));
      firstIdx = allMessages.findIndex((m) => validIds.has(m.id));
      lastIdx = -1;
      for (let i = allMessages.length - 1;i >= 0; i--) {
        if (validIds.has(allMessages[i].id)) {
          lastIdx = i;
          break;
        }
      }
    }
    const book = await ensureBookForChat(chatId, userId);
    const replacedEntry = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
    let sceneNumber;
    let freedTaken = null;
    if (typeof replacedEntry?.meta.sceneNumber === "number") {
      sceneNumber = replacedEntry.meta.sceneNumber;
    } else {
      freedTaken = ghost ? takeFreedGhostNumber(userId, chatId, new Set(window.map((m) => m.id))) : null;
      sceneNumber = freedTaken ?? await nextSceneNumber(chatId, 1, userId);
    }
    const title = fromPreview ? result.title?.trim() || `Chapter - msgs ${firstIdx + 1}-${lastIdx + 1}` : deriveTitle(result, firstIdx + 1, lastIdx + 1);
    const msgIds = window.map((m) => m.id);
    const meta = {
      tier: 1,
      chatId,
      msgIds,
      firstMsgIdx: firstIdx >= 0 ? firstIdx : undefined,
      lastMsgIdx: lastIdx >= 0 ? lastIdx : undefined,
      tokenCountInput: window.reduce((acc, m) => acc + approximateTokensFromChars((m.content || "").length), 0),
      tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
      model: result.model,
      connectionId: result.connectionId,
      createdAt: Date.now(),
      title,
      shortComment: result.shortComment,
      presetKey: result.presetKey,
      sceneNumber,
      rawOutput: result.rawOutput,
      ...ghost ? { ghost: true, msgSigs: window.map((m) => msgSig(m.role, m.content || "")) } : {}
    };
    const baseComment = meta.title ?? `Chapter - msgs ${firstIdx + 1}-${lastIdx + 1}`;
    const comment = `#${sceneNumber} - ${baseComment}`;
    const settings = await loadSettings(userId);
    const opener = buildChapterHeader(sceneNumber, msgIds.length);
    const finalContent = `${opener}

${result.content}`;
    let entry;
    try {
      entry = await createChapterEntry(book.id, meta, finalContent, comment, userId, result.keywords ?? [], settings.forceConstantEntries, ghost);
    } catch (err) {
      if (freedTaken !== null)
        recordFreedGhostNumber(userId, chatId, msgIds, freedTaken);
      throw err;
    }
    invalidateBookCache(userId, chatId);
    if (replacesEntryId) {
      try {
        await deleteEntry(replacesEntryId, userId);
        invalidateBookCache(userId, chatId);
      } catch (err) {
        warn(`regen: failed to delete replaced chapter ${replacesEntryId}: ${describeError(err)}`);
      }
    }
    if (profile.hideCoveredMessages && !ghost) {
      try {
        await syncHiddenForCoveredMessages(chatId, allMessages, {
          coveredBy: new Map(window.map((m) => [m.id, entry.id])),
          activeEntries: [],
          volumes: [],
          arcs: [],
          chapters: []
        }, userId, true);
      } catch (err) {
        warn(`setMessagesHidden failed: ${describeError(err)}`);
      }
    }
    if (!ghost) {
      publishChapterCreated(userId, {
        chatId,
        chapterEntryId: entry.id,
        bookId: book.id,
        sourceMessageIds: meta.msgIds,
        summaryText: finalContent,
        model: result.model,
        title: meta.title
      });
    }
    cb?.onStateChange(userId, chatId);
    return entry.id;
  });
}
async function createArcAuto(chatId, profile, settings, userId, automation = false) {
  if (!setBusy(userId, chatId, "arc", "Memoria is binding an arc"))
    return null;
  try {
    const entries = await listLmbEntries(chatId, userId);
    const coverage = await buildCoverage(chatId, userId, entries);
    const chapters = coverage.activeEntries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (chapters.length === 0)
      return null;
    let selected = [];
    if (profile.arcTrigger === "chapters") {
      const compressible = Math.max(0, chapters.length - profile.arcLagChapters);
      if (compressible < profile.arcAfterChapters)
        return null;
      selected = chapters.slice(0, compressible).slice(0, profile.arcAfterChapters);
    } else if (profile.arcTrigger === "tokens") {
      const reservedFromTail = [];
      let reservedTokens = 0;
      for (let i = chapters.length - 1;i >= 0 && reservedTokens < profile.arcLagTokens; i--) {
        reservedFromTail.unshift(chapters[i]);
        reservedTokens += chapters[i].meta.tokenCountOutput;
      }
      const reservedSet = new Set(reservedFromTail.map((c) => c.raw.id));
      const compressible = chapters.filter((c) => !reservedSet.has(c.raw.id));
      const compressibleTokens = compressible.reduce((a, c) => a + c.meta.tokenCountOutput, 0);
      if (compressibleTokens < profile.arcAfterTokens)
        return null;
      const take = [];
      let acc = 0;
      for (const ch of compressible) {
        take.push(ch);
        acc += ch.meta.tokenCountOutput;
        if (acc >= profile.arcAfterTokens)
          break;
      }
      selected = take;
    } else {
      return null;
    }
    if (selected.length === 0)
      return null;
    return await runArc(chatId, profile, settings, userId, selected, { automation });
  } finally {
    clearBusy(userId, chatId, "arc");
  }
}
async function createArcFromChapters(chatId, chapterEntryIds, profile, settings, userId, opts = {}) {
  if (!setBusy(userId, chatId, "arc", "Memoria is binding an arc"))
    return null;
  try {
    const entries = await listLmbEntries(chatId, userId);
    const entriesForSelection = opts.replacesEntryId ? entries.filter((e) => e.raw.id !== opts.replacesEntryId) : entries;
    const coverage = await buildCoverage(chatId, userId, entriesForSelection);
    const wanted = new Set(chapterEntryIds);
    const chapters = coverage.activeEntries.filter((e) => e.meta.tier === 1 && wanted.has(e.raw.id)).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (chapters.length === 0)
      return null;
    return await runArc(chatId, profile, settings, userId, chapters, { replacesEntryId: opts.replacesEntryId });
  } finally {
    clearBusy(userId, chatId, "arc");
  }
}
async function runArc(chatId, profile, settings, userId, selected, opts = {}) {
  const { replacesEntryId } = opts;
  const automation = opts.automation === true;
  nyaaToast(userId, "arc_fire", automation);
  const totalTurns = selected.reduce((acc, c) => acc + c.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 2, userId);
  const opener = buildArcHeader(provisionalSceneNumber, selected.length, totalTurns);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController;
    registerAborter(userId, chatId, "arc", controller);
    try {
      return await summarizeArc(profile, settings.customPresets, chatId, selected, userId, opener, {
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "arc", chars, thinking),
        onDelta: (kind, delta) => appendStreamText(userId, chatId, "arc", kind, delta)
      });
    } finally {
      aborters.delete(busyKey(userId, chatId, "arc"));
    }
  }, (n, err) => {
    warn(`arc attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", automation);
  });
  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the pen down");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "arc", outcome.retries, outcome.err);
    failToast(userId, "arc", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);
  const result = outcome.value;
  const firstIdxs = selected.map((c) => c.meta.firstMsgIdx).filter((n) => typeof n === "number");
  const lastIdxs = selected.map((c) => c.meta.lastMsgIdx).filter((n) => typeof n === "number");
  const firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
  const lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
  if (profile.showMemoryPreviews) {
    const draft = makeGroupPreview("arc", selected, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitArc(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, automation);
    nyaaToast(userId, "arc_success", automation);
    return entryId;
  } catch (err) {
    warn(`commitArc failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "arc", 0, err);
    failToast(userId, "arc", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}
async function commitArc(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId, automation = false) {
  return withCommitMutex(userId, chatId, 2, async () => {
    const freshEntries = await listLmbEntries(chatId, userId);
    const entriesForCoverage = replacesEntryId ? freshEntries.filter((e) => e.raw.id !== replacesEntryId) : freshEntries;
    const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage);
    const stillActive = new Set(freshCoverage.activeEntries.filter((e) => e.meta.tier === 1).map((e) => e.raw.id));
    const filtered = selected.filter((c) => stillActive.has(c.raw.id));
    if (filtered.length === 0) {
      throw new Error("All source chapters were already bound by another arc or deleted");
    }
    if (filtered.length < selected.length) {
      selected = filtered;
      const firstIdxs = selected.map((c) => c.meta.firstMsgIdx).filter((n) => typeof n === "number");
      const lastIdxs = selected.map((c) => c.meta.lastMsgIdx).filter((n) => typeof n === "number");
      firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
      lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
    }
    const book = await ensureBookForChat(chatId, userId);
    const replacedArc = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
    const sceneNumber = typeof replacedArc?.meta.sceneNumber === "number" ? replacedArc.meta.sceneNumber : await nextSceneNumber(chatId, 2, userId);
    const msgIds = selected.flatMap((c) => c.meta.msgIds);
    const sourceChapterEntryIds = selected.map((c) => c.raw.id);
    const isRootArc = selected.length > 0 && selected.every((c) => c.meta.isRoot);
    const rootOrigin = isRootArc ? selected.find((c) => c.meta.rootOrigin)?.meta.rootOrigin : undefined;
    if (!isRootArc && selected.some((c) => c.meta.isRoot)) {
      const own = selected.filter((c) => !c.meta.isRoot);
      const fs = own.map((c) => c.meta.firstMsgIdx).filter((n) => typeof n === "number");
      const ls = own.map((c) => c.meta.lastMsgIdx).filter((n) => typeof n === "number");
      if (fs.length)
        firstIdx = Math.min(...fs);
      else if (firstIdx < 0)
        firstIdx = 0;
      if (ls.length)
        lastIdx = Math.max(...ls);
      else if (lastIdx < firstIdx)
        lastIdx = firstIdx;
    }
    const arcTitle = isRootArc ? result.title?.trim() || "Inherited Arc" : deriveTitle(result, firstIdx + 1, lastIdx + 1);
    const meta = {
      tier: 2,
      chatId,
      msgIds,
      sourceChapterEntryIds,
      firstMsgIdx: firstIdx,
      lastMsgIdx: lastIdx,
      tokenCountInput: selected.reduce((a, c) => a + c.meta.tokenCountOutput, 0),
      tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
      model: result.model,
      connectionId: result.connectionId,
      createdAt: Date.now(),
      title: arcTitle,
      shortComment: result.shortComment,
      presetKey: result.presetKey,
      sceneNumber,
      rawOutput: result.rawOutput,
      ...isRootArc ? { isRoot: true, rootOrigin } : {}
    };
    const baseComment = meta.title ?? `Arc - msgs ${firstIdx + 1}-${lastIdx + 1}`;
    const comment = `${isRootArc ? "[Root] " : ""}Arc #${sceneNumber} - ${baseComment}`;
    const arcSettings = await loadSettings(userId);
    const arcOpener = buildArcHeader(sceneNumber, sourceChapterEntryIds.length, msgIds.length);
    const finalArcContent = `${arcOpener}

${result.content}`;
    const arcEntry = await createChapterEntry(book.id, meta, finalArcContent, comment, userId, result.keywords ?? [], arcSettings.forceConstantEntries);
    const failedSupersedes = [];
    for (const ch of selected) {
      try {
        await patchEntryMeta(ch, { supersededByEntryId: arcEntry.id }, userId);
      } catch (err) {
        failedSupersedes.push(ch.raw.id);
        warn(`failed to mark chapter ${ch.raw.id} superseded by arc ${arcEntry.id}: ${describeError(err)}`);
      }
    }
    if (failedSupersedes.length > 0) {
      cb?.onToast(userId, "warn", `The arc saved but ${failedSupersedes.length} chapter${failedSupersedes.length === 1 ? "" : "s"} couldn't be marked superseded`, automation);
    }
    invalidateBookCache(userId, chatId);
    if (replacesEntryId) {
      try {
        await deleteEntry(replacesEntryId, userId);
        invalidateBookCache(userId, chatId);
      } catch (err) {
        warn(`regen: failed to delete replaced arc ${replacesEntryId}: ${describeError(err)}`);
      }
    }
    publishArcCreated(userId, {
      chatId,
      arcEntryId: arcEntry.id,
      bookId: book.id,
      sourceChapterEntryIds: selected.map((c) => c.raw.id),
      sourceMessageIds: msgIds,
      summaryText: finalArcContent,
      model: result.model,
      title: meta.title
    });
    cb?.onStateChange(userId, chatId);
    return arcEntry.id;
  });
}
async function createVolumeFromArcs(chatId, arcEntryIds, profile, settings, userId, opts = {}) {
  if (!setBusy(userId, chatId, "volume", "Memoria is pressing a volume"))
    return null;
  try {
    const entries = await listLmbEntries(chatId, userId);
    const entriesForSelection = opts.replacesEntryId ? entries.filter((e) => e.raw.id !== opts.replacesEntryId) : entries;
    const coverage = await buildCoverage(chatId, userId, entriesForSelection);
    const wanted = new Set(arcEntryIds);
    const arcs = coverage.activeEntries.filter((e) => e.meta.tier === 2 && wanted.has(e.raw.id)).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (arcs.length === 0)
      return null;
    return await runVolume(chatId, profile, settings, userId, arcs, opts.replacesEntryId);
  } finally {
    clearBusy(userId, chatId, "volume");
  }
}
async function runVolume(chatId, profile, settings, userId, selected, replacesEntryId) {
  nyaaToast(userId, "volume_fire", false);
  const totalTurns = selected.reduce((acc, a) => acc + a.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 3, userId);
  const opener = buildVolumeHeader(provisionalSceneNumber, selected.length, totalTurns);
  const outcome = await runWithRetry(profile.retryCount + 1, async () => {
    const controller = new AbortController;
    registerAborter(userId, chatId, "volume", controller);
    try {
      return await summarizeVolume(profile, settings.customPresets, chatId, selected, userId, opener, {
        externalSignal: controller.signal,
        onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "volume", chars, thinking),
        onDelta: (kind, delta) => appendStreamText(userId, chatId, "volume", kind, delta)
      });
    } finally {
      aborters.delete(busyKey(userId, chatId, "volume"));
    }
  }, (n, err) => {
    warn(`volume attempt ${n} failed: ${describeError(err)}`);
    nyaaToast(userId, "retry", false);
  });
  if (!outcome.ok) {
    if (outcome.err instanceof AbortedSummarizerError) {
      cb?.onToast(userId, "info", "Memoria sets the pen down");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    recordFailure(userId, chatId, "volume", outcome.retries, outcome.err);
    failToast(userId, "volume", outcome.err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  clearLastFailure(userId, chatId);
  const result = outcome.value;
  const firstIdxs = selected.map((a) => a.meta.firstMsgIdx).filter((n) => typeof n === "number");
  const lastIdxs = selected.map((a) => a.meta.lastMsgIdx).filter((n) => typeof n === "number");
  const firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
  const lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
  if (profile.showMemoryPreviews) {
    const draft = makeGroupPreview("volume", selected, result, firstIdx, lastIdx, replacesEntryId);
    pushPreview(userId, chatId, draft);
    cb?.onStateChange(userId, chatId);
    return null;
  }
  try {
    const entryId = await commitVolume(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId);
    nyaaToast(userId, "volume_success", false);
    return entryId;
  } catch (err) {
    warn(`commitVolume failed: ${describeError(err)}`);
    recordFailure(userId, chatId, "volume", 0, err);
    failToast(userId, "volume", err);
    cb?.onStateChange(userId, chatId);
    return null;
  }
}
async function commitVolume(chatId, userId, selected, result, firstIdx, lastIdx, replacesEntryId) {
  return withCommitMutex(userId, chatId, 3, async () => {
    const freshEntries = await listLmbEntries(chatId, userId);
    const entriesForCoverage = replacesEntryId ? freshEntries.filter((e) => e.raw.id !== replacesEntryId) : freshEntries;
    const freshCoverage = await buildCoverage(chatId, userId, entriesForCoverage);
    const stillActive = new Set(freshCoverage.activeEntries.filter((e) => e.meta.tier === 2).map((e) => e.raw.id));
    const filtered = selected.filter((a) => stillActive.has(a.raw.id));
    if (filtered.length === 0) {
      throw new Error("All source arcs were already bound by another volume or deleted");
    }
    if (filtered.length < selected.length) {
      selected = filtered;
      const firstIdxs = selected.map((a) => a.meta.firstMsgIdx).filter((n) => typeof n === "number");
      const lastIdxs = selected.map((a) => a.meta.lastMsgIdx).filter((n) => typeof n === "number");
      firstIdx = firstIdxs.length ? Math.min(...firstIdxs) : 0;
      lastIdx = lastIdxs.length ? Math.max(...lastIdxs) : firstIdx;
    }
    const book = await ensureBookForChat(chatId, userId);
    const replacedVolume = replacesEntryId ? freshEntries.find((e) => e.raw.id === replacesEntryId) : undefined;
    const sceneNumber = typeof replacedVolume?.meta.sceneNumber === "number" ? replacedVolume.meta.sceneNumber : await nextSceneNumber(chatId, 3, userId);
    const msgIds = selected.flatMap((a) => a.meta.msgIds);
    const sourceArcEntryIds = selected.map((a) => a.raw.id);
    const isRootVolume = selected.length > 0 && selected.every((a) => a.meta.isRoot);
    const rootOrigin = isRootVolume ? selected.find((a) => a.meta.rootOrigin)?.meta.rootOrigin : undefined;
    if (!isRootVolume && selected.some((a) => a.meta.isRoot)) {
      const own = selected.filter((a) => !a.meta.isRoot);
      const fs = own.map((a) => a.meta.firstMsgIdx).filter((n) => typeof n === "number");
      const ls = own.map((a) => a.meta.lastMsgIdx).filter((n) => typeof n === "number");
      if (fs.length)
        firstIdx = Math.min(...fs);
      else if (firstIdx < 0)
        firstIdx = 0;
      if (ls.length)
        lastIdx = Math.max(...ls);
      else if (lastIdx < firstIdx)
        lastIdx = firstIdx;
    }
    const volumeTitle = isRootVolume ? result.title?.trim() || "Inherited Volume" : deriveTitle(result, firstIdx + 1, lastIdx + 1);
    const meta = {
      tier: 3,
      chatId,
      msgIds,
      sourceChapterEntryIds: sourceArcEntryIds,
      firstMsgIdx: firstIdx,
      lastMsgIdx: lastIdx,
      tokenCountInput: selected.reduce((a, e) => a + e.meta.tokenCountOutput, 0),
      tokenCountOutput: result.usageCompletionTokens || approximateTokensFromChars(result.content.length),
      model: result.model,
      connectionId: result.connectionId,
      createdAt: Date.now(),
      title: volumeTitle,
      shortComment: result.shortComment,
      presetKey: result.presetKey,
      sceneNumber,
      rawOutput: result.rawOutput,
      ...isRootVolume ? { isRoot: true, rootOrigin } : {}
    };
    const baseComment = meta.title ?? `Volume - msgs ${firstIdx + 1}-${lastIdx + 1}`;
    const comment = `${isRootVolume ? "[Root] " : ""}Vol #${sceneNumber} - ${baseComment}`;
    const volumeSettings = await loadSettings(userId);
    const volumeOpener = buildVolumeHeader(sceneNumber, sourceArcEntryIds.length, msgIds.length);
    const finalVolumeContent = `${volumeOpener}

${result.content}`;
    const volumeEntry = await createChapterEntry(book.id, meta, finalVolumeContent, comment, userId, result.keywords ?? [], volumeSettings.forceConstantEntries);
    const failedSupersedes = [];
    for (const arc of selected) {
      try {
        await patchEntryMeta(arc, { supersededByEntryId: volumeEntry.id }, userId);
      } catch (err) {
        failedSupersedes.push(arc.raw.id);
        warn(`failed to mark arc ${arc.raw.id} superseded by volume ${volumeEntry.id}: ${describeError(err)}`);
      }
    }
    if (failedSupersedes.length > 0) {
      cb?.onToast(userId, "warn", `The volume saved but ${failedSupersedes.length} arc${failedSupersedes.length === 1 ? "" : "s"} couldn't be marked superseded`);
    }
    invalidateBookCache(userId, chatId);
    if (replacesEntryId) {
      try {
        await deleteEntry(replacesEntryId, userId);
        invalidateBookCache(userId, chatId);
      } catch (err) {
        warn(`regen: failed to delete replaced volume ${replacesEntryId}: ${describeError(err)}`);
      }
    }
    publishVolumeCreated(userId, {
      chatId,
      volumeEntryId: volumeEntry.id,
      bookId: book.id,
      sourceArcEntryIds,
      sourceMessageIds: msgIds,
      summaryText: finalVolumeContent,
      model: result.model,
      title: meta.title
    });
    cb?.onStateChange(userId, chatId);
    return volumeEntry.id;
  });
}
async function acceptPreview(chatId, draftId, profile, userId) {
  const preview = findPendingPreview(userId, chatId, draftId);
  if (!preview)
    return null;
  const guardKey = `${userId}::${chatId}::${draftId}`;
  if (committingDrafts.has(guardKey))
    return null;
  committingDrafts.add(guardKey);
  try {
    if (preview.kind === "chapter") {
      const messages = await spindle.chat.getMessages(chatId);
      const acceptEntries = preview.replacesEntryId ? (await listLmbEntries(chatId, userId)).filter((e) => e.raw.id !== preview.replacesEntryId) : undefined;
      const coverage2 = await buildCoverage(chatId, userId, acceptEntries, extraContextActive(profile));
      const intent = new Set(preview.sourceMessageIds);
      const window = messages.filter((m) => intent.has(m.id) && !coverage2.coveredBy.has(m.id) && !isExcluded(m));
      if (window.length === 0) {
        dropPendingPreview(userId, chatId, draftId);
        cb?.onToast(userId, "warn", "Memoria can't save this chapter, its messages were deleted or already filed");
        cb?.onStateChange(userId, chatId);
        return null;
      }
      if (window.length < preview.sourceMessageIds.length) {
        cb?.onToast(userId, "warn", "Some messages were missing or already covered, Memoria saved the rest");
      }
      const firstIdx = messages.findIndex((m) => m.id === window[0].id);
      const lastIdx = messages.findIndex((m) => m.id === window[window.length - 1].id);
      const fakeResult2 = {
        rawOutput: preview.content,
        title: preview.title,
        opener: "",
        content: preview.content,
        keywords: preview.keywords ?? [],
        shortComment: preview.shortComment,
        usagePromptTokens: preview.tokenCountInput,
        usageCompletionTokens: preview.tokenCountOutput,
        model: preview.model,
        connectionId: preview.connectionId,
        presetKey: preview.presetKey
      };
      try {
        const entryId = await commitChapter(chatId, profile, userId, window, fakeResult2, firstIdx, lastIdx, messages, true, preview.replacesEntryId);
        dropPendingPreview(userId, chatId, draftId);
        nyaaToast(userId, "success", false);
        cb?.onStateChange(userId, chatId);
        return entryId;
      } catch (err) {
        recordFailure(userId, chatId, "chapter", 0, err);
        failToast(userId, "chapter", err);
        cb?.onStateChange(userId, chatId);
        return null;
      }
    }
    const isVolume = preview.kind === "volume";
    const entries = await listLmbEntries(chatId, userId);
    const groupSelectionEntries = preview.replacesEntryId ? entries.filter((e) => e.raw.id !== preview.replacesEntryId) : entries;
    const coverage = await buildCoverage(chatId, userId, groupSelectionEntries);
    const wanted = new Set(preview.sourceChapterEntryIds ?? []);
    const sourceTier = isVolume ? 2 : 1;
    const selected = coverage.activeEntries.filter((e) => e.meta.tier === sourceTier && wanted.has(e.raw.id));
    if (selected.length === 0) {
      dropPendingPreview(userId, chatId, draftId);
      cb?.onToast(userId, "warn", isVolume ? "Memoria can't save this volume, its arcs were deleted or already bound" : "Memoria can't save this arc, its chapters were deleted or already bound");
      cb?.onStateChange(userId, chatId);
      return null;
    }
    const fakeResult = {
      rawOutput: preview.content,
      title: preview.title,
      opener: "",
      content: preview.content,
      keywords: preview.keywords ?? [],
      shortComment: preview.shortComment,
      usagePromptTokens: preview.tokenCountInput,
      usageCompletionTokens: preview.tokenCountOutput,
      model: preview.model,
      connectionId: preview.connectionId,
      presetKey: preview.presetKey
    };
    try {
      const entryId = isVolume ? await commitVolume(chatId, userId, selected, fakeResult, preview.firstMsgIdx ?? 0, preview.lastMsgIdx ?? 0, preview.replacesEntryId) : await commitArc(chatId, userId, selected, fakeResult, preview.firstMsgIdx ?? 0, preview.lastMsgIdx ?? 0, preview.replacesEntryId);
      dropPendingPreview(userId, chatId, draftId);
      nyaaToast(userId, isVolume ? "volume_success" : "arc_success", false);
      cb?.onStateChange(userId, chatId);
      return entryId;
    } catch (err) {
      recordFailure(userId, chatId, isVolume ? "volume" : "arc", 0, err);
      failToast(userId, isVolume ? "volume" : "arc", err);
      cb?.onStateChange(userId, chatId);
      return null;
    }
  } finally {
    committingDrafts.delete(guardKey);
  }
}
var CHAPTER_BACKLOG_CAP = 500;
var ARC_BACKLOG_CAP = 100;
async function drainChapterBacklog(chatId, profile, settings, userId, automation = false, ghost = false) {
  let made = 0;
  for (let i = 0;i < CHAPTER_BACKLOG_CAP; i++) {
    const created = await createChapterAuto(chatId, profile, settings, userId, automation, ghost).catch((err) => {
      warn(`${ghost ? "ghost " : ""}createChapterAuto failed: ${describeError(err)}`);
      return null;
    });
    if (!created)
      break;
    made++;
  }
  return made;
}
function drainGhostBacklog(chatId, profile, settings, userId, automation = false) {
  return drainChapterBacklog(chatId, profile, settings, userId, automation, true);
}
async function dryRunChapter(chatId, profile, settings, userId) {
  const messages = await spindle.chat.getMessages(chatId);
  if (!messages || messages.length === 0)
    throw new Error("Chat has no messages");
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, extraContextActive(profile));
  const uncoveredTail = pickUncoveredTail(messages, coverage);
  const window = selectNextChapterWindow(uncoveredTail, profile);
  if (window.length === 0) {
    throw new Error("No window available, lower the lag or window thresholds");
  }
  const chapters = coverage.activeEntries.filter((e) => e.meta.tier === 1 && typeof e.meta.firstMsgIdx === "number").sort((a, b) => a.meta.firstMsgIdx - b.meta.firstMsgIdx);
  const previousMemories = profile.previousMemoriesCount > 0 ? chapters.slice(-profile.previousMemoriesCount) : [];
  const provisionalSceneNumber = await nextSceneNumber(chatId, 1, userId);
  const opener = buildChapterHeader(provisionalSceneNumber, window.length);
  return assembleChapterPrompt(profile, settings.customPresets, chatId, window, previousMemories, userId, opener);
}
async function dryRunArc(chatId, profile, settings, userId) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  const chapters = coverage.activeEntries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (chapters.length === 0)
    throw new Error("No chapters to bind yet");
  const totalTurns = chapters.reduce((acc, c) => acc + c.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 2, userId);
  const opener = buildArcHeader(provisionalSceneNumber, chapters.length, totalTurns);
  return assembleArcPrompt(profile, settings.customPresets, chatId, chapters, userId, opener);
}
async function dryRunVolume(chatId, profile, settings, userId) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  const arcs = coverage.activeEntries.filter((e) => e.meta.tier === 2 && !e.meta.isRoot).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (arcs.length === 0)
    throw new Error("No arcs to press yet");
  const totalTurns = arcs.reduce((acc, a) => acc + a.meta.msgIds.length, 0);
  const provisionalSceneNumber = await nextSceneNumber(chatId, 3, userId);
  const opener = buildVolumeHeader(provisionalSceneNumber, arcs.length, totalTurns);
  return assembleVolumePrompt(profile, settings.customPresets, chatId, arcs, userId, opener);
}
async function drainArcBacklog(chatId, profile, settings, userId, automation = false) {
  if (profile.arcTrigger === "manual")
    return 0;
  let made = 0;
  for (let i = 0;i < ARC_BACKLOG_CAP; i++) {
    const created = await createArcAuto(chatId, profile, settings, userId, automation).catch((err) => {
      warn(`createArcAuto failed: ${describeError(err)}`);
      return null;
    });
    if (!created)
      break;
    made++;
  }
  return made;
}
async function sweepStaleGhosts(chatId, userId) {
  const entries = await listLmbEntries(chatId, userId);
  const ghosts = entries.filter((e) => e.meta.tier === 1 && e.meta.ghost === true);
  if (ghosts.length === 0)
    return 0;
  const messages = await spindle.chat.getMessages(chatId);
  const byId = new Map(messages.map((m) => [m.id, m]));
  let dropped = 0;
  for (const g of ghosts) {
    const sigs = g.meta.msgSigs;
    const stale = !sigs || sigs.length !== g.meta.msgIds.length ? g.meta.msgIds.some((id) => !byId.has(id)) : g.meta.msgIds.some((id, i) => {
      const m = byId.get(id);
      return !m || msgSig(m.role, m.content || "") !== sigs[i];
    });
    if (!stale)
      continue;
    try {
      await deleteEntry(g.raw.id, userId);
      if (typeof g.meta.sceneNumber === "number") {
        recordFreedGhostNumber(userId, chatId, g.meta.msgIds, g.meta.sceneNumber);
      }
      dropped++;
    } catch (err) {
      warn(`ghost sweep: failed to delete stale ghost ${g.raw.id}: ${describeError(err)}`);
    }
  }
  if (dropped > 0) {
    invalidateBookCache(userId, chatId);
    cb?.onStateChange(userId, chatId);
  }
  return dropped;
}
async function promoteGhostChapters(chatId, profile, userId, automation = false) {
  return withCommitMutex(userId, chatId, 1, async () => {
    const entries = await listLmbEntries(chatId, userId);
    const ghosts = entries.filter((e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
    if (ghosts.length === 0)
      return 0;
    const messages = await spindle.chat.getMessages(chatId);
    const realCoverage = await buildCoverage(chatId, userId, entries);
    const posById = new Map(messages.map((m, i) => [m.id, i]));
    const pastLagBoundary = trimLagFromTail(messages, profile).length;
    const promoted = [];
    let zombies = 0;
    for (const g of ghosts) {
      if (g.meta.msgIds.length === 0)
        continue;
      if (g.meta.msgIds.some((id) => realCoverage.coveredBy.has(id))) {
        try {
          await deleteEntry(g.raw.id, userId);
          if (typeof g.meta.sceneNumber === "number") {
            recordFreedGhostNumber(userId, chatId, g.meta.msgIds, g.meta.sceneNumber);
          }
          zombies++;
        } catch (err) {
          warn(`ghost promotion: failed to delete overlapped ghost ${g.raw.id}: ${describeError(err)}`);
        }
        continue;
      }
      const pastLag = g.meta.msgIds.every((id) => {
        const p = posById.get(id);
        return typeof p === "number" && p < pastLagBoundary;
      });
      if (!pastLag)
        continue;
      try {
        await promoteGhostEntry(g, userId);
        promoted.push(g);
      } catch (err) {
        warn(`ghost promotion failed for ${g.raw.id}: ${describeError(err)}`);
      }
    }
    if (zombies > 0) {
      invalidateBookCache(userId, chatId);
      if (promoted.length === 0)
        cb?.onStateChange(userId, chatId);
    }
    if (promoted.length === 0)
      return 0;
    invalidateBookCache(userId, chatId);
    if (profile.hideCoveredMessages) {
      const coveredBy = new Map;
      for (const g of promoted) {
        for (const id of g.meta.msgIds)
          coveredBy.set(id, g.raw.id);
      }
      await syncHiddenForCoveredMessages(chatId, messages, { coveredBy, activeEntries: [], volumes: [], arcs: [], chapters: [] }, userId, true).catch((err) => warn(`ghost promotion hide failed: ${describeError(err)}`));
    }
    for (const g of promoted) {
      publishChapterCreated(userId, {
        chatId,
        chapterEntryId: g.raw.id,
        bookId: g.raw.world_book_id,
        sourceMessageIds: g.meta.msgIds,
        summaryText: g.raw.content || "",
        model: g.meta.model,
        title: g.meta.title
      });
    }
    cb?.onToast(userId, "success", `Memoria shelved ${promoted.length} ghost chapter${promoted.length === 1 ? "" : "s"}`, automation);
    cb?.onStateChange(userId, chatId);
    return promoted.length;
  });
}
async function cleanupGhostsAfterModeOff(chatId, profile, userId) {
  const entries = await listLmbEntries(chatId, userId);
  if (!entries.some((e) => e.meta.tier === 1 && e.meta.ghost === true))
    return;
  await sweepStaleGhosts(chatId, userId).catch((err) => warn(`mode-off ghost sweep failed: ${describeError(err)}`));
  await promoteGhostChapters(chatId, profile, userId, true).catch((err) => warn(`mode-off ghost promotion failed: ${describeError(err)}`));
  await withCommitMutex(userId, chatId, 1, async () => {
    const remaining = (await listLmbEntries(chatId, userId)).filter((e) => e.meta.tier === 1 && e.meta.ghost === true && e.raw.disabled);
    for (const g of remaining) {
      await deleteEntry(g.raw.id, userId).catch((err) => warn(`mode-off ghost cleanup failed for ${g.raw.id}: ${describeError(err)}`));
    }
    if (remaining.length > 0) {
      invalidateBookCache(userId, chatId);
      cb?.onStateChange(userId, chatId);
    }
  });
}
async function maybeRunPipeline(chatId, profile, settings, userId) {
  if (extraContextActive(profile)) {
    await sweepStaleGhosts(chatId, userId).catch((err) => warn(`ghost sweep failed: ${describeError(err)}`));
    await promoteGhostChapters(chatId, profile, userId, true).catch((err) => warn(`ghost promotion failed: ${describeError(err)}`));
  } else {
    await cleanupGhostsAfterModeOff(chatId, profile, userId).catch((err) => warn(`ghost cleanup failed: ${describeError(err)}`));
  }
  if (!profile.autoCreate)
    return;
  await ensureForkAdoption(chatId, userId).catch(() => {});
  if (await forkShelfPending(chatId, userId).catch(() => false))
    return;
  if (profile.autoCreateChapter) {
    if (extraContextActive(profile)) {
      await drainGhostBacklog(chatId, profile, settings, userId, true);
    } else {
      await drainChapterBacklog(chatId, profile, settings, userId, true);
    }
  }
  await maybeRunArcCheck(chatId, profile, settings, userId, true);
}
async function maybeRunArcCheck(chatId, profile, settings, userId, automation = false) {
  if (!profile.autoCreate)
    return;
  if (!profile.autoCreateArc)
    return;
  if (profile.arcTrigger === "manual")
    return;
  await drainArcBacklog(chatId, profile, settings, userId, automation);
}
async function nextSceneNumber(chatId, tier, userId) {
  const entries = await listLmbEntries(chatId, userId).catch(() => []);
  let max = 0;
  for (const e of entries) {
    if (e.meta.tier !== tier)
      continue;
    if (e.meta.isRoot)
      continue;
    const n = e.meta.sceneNumber;
    if (typeof n === "number" && n > max)
      max = n;
  }
  return max + 1;
}
function deriveTitle(result, firstMsg, lastMsg) {
  if (result.title && result.title.trim())
    return `${result.title.trim()} (msgs ${firstMsg}-${lastMsg})`;
  const firstLine = (result.content.split(/\n+/, 1)[0] || "").trim();
  const firstSentence = firstLine.split(/(?<=[.!?])\s/, 1)[0] || firstLine;
  const trimmed = firstSentence.slice(0, 60).trim();
  if (trimmed)
    return `${trimmed}${trimmed.length === 60 ? "..." : ""} (msgs ${firstMsg}-${lastMsg})`;
  return `Compressed - msgs ${firstMsg}-${lastMsg}`;
}
function makePreview(kind, chatId, window, result, firstIdx, lastIdx, replacesEntryId) {
  return {
    kind,
    draftId: `draft_${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || `Chapter - msgs ${firstIdx + 1}-${lastIdx + 1}`,
    content: result.content,
    shortComment: result.shortComment,
    keywords: result.keywords ?? [],
    sourceMessageIds: window.map((m) => m.id),
    model: result.model,
    connectionId: result.connectionId,
    tokenCountInput: result.usagePromptTokens || 0,
    tokenCountOutput: result.usageCompletionTokens || 0,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    presetKey: result.presetKey,
    replacesEntryId
  };
}
function makeGroupPreview(kind, selected, result, firstIdx, lastIdx, replacesEntryId) {
  return {
    kind,
    draftId: `draft_${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || `${kind === "volume" ? "Volume" : "Arc"} - msgs ${firstIdx + 1}-${lastIdx + 1}`,
    content: result.content,
    shortComment: result.shortComment,
    keywords: result.keywords ?? [],
    sourceMessageIds: selected.flatMap((c) => c.meta.msgIds),
    sourceChapterEntryIds: selected.map((c) => c.raw.id),
    model: result.model,
    connectionId: result.connectionId,
    tokenCountInput: result.usagePromptTokens || 0,
    tokenCountOutput: result.usageCompletionTokens || 0,
    firstMsgIdx: firstIdx,
    lastMsgIdx: lastIdx,
    presetKey: result.presetKey,
    replacesEntryId
  };
}

// src/backend/codex/agent.ts
class ToolProtocolError extends Error {
  constructor(message) {
    super(message);
    this.name = "ToolProtocolError";
  }
}

class CodexContextError extends Error {
  constructor(promptTokens, maxInputTokens) {
    super(`The assembled codex prompt is ~${Math.round(promptTokens / 1000)}k tokens but the codex max input is ${Math.round(maxInputTokens / 1000)}k, so Memoria stopped instead of sending a request that would fail or be silently cut. ` + "Raise Max input tokens under Tuning > Connection > Codex, or in Tuning > Settings > Codex lower the window, Chapters provided, or the lore limit, or freeze records in Codex > Overview.");
    this.name = "CodexContextError";
  }
}
function codexMaxInputTokens(profile) {
  return profile.codexSamplers.max_input_tokens ?? CODEX_SAMPLER_DEFAULTS.max_input_tokens;
}
var CACHE_EPHEMERAL = { type: "ephemeral" };
function codexTools(activeFiles) {
  return [
    {
      name: "codex_write",
      description: "Edit one codex file. Default is a patch: set adds or replaces complete rows by key, drop deletes by key, untouched rows survive without being resent. content replaces the whole file and is only for ground-up rewrites. Call once per changed file, and put every call for this update in a single response.",
      parameters: {
        type: "object",
        properties: {
          file: { type: "string", enum: [...activeFiles] },
          set: {
            type: "array",
            items: { type: "object" },
            description: "Rows to add or replace, each complete on its own, keyed by entity id or rid. Only rows that actually changed."
          },
          drop: {
            type: "array",
            items: { type: "string" },
            description: "Entity ids or rids of rows to delete."
          },
          seeds: {
            type: "array",
            items: { type: "string" },
            description: "threads.json only: the complete replacement seeds list."
          },
          content: {
            type: "object",
            description: "The complete new file content, replacing everything. Only for a ground-up rewrite; never combined with set or drop."
          }
        },
        required: ["file"]
      }
    },
    {
      name: "codex_done",
      description: "Declare the codex current. Call it alongside your writes, or alone when nothing durable changed.",
      parameters: {
        type: "object",
        properties: {
          note: { type: "string", description: "One short line on what changed." }
        },
        required: []
      }
    }
  ];
}
async function resolveCodexConnection(profile, userId) {
  if (profile.codexConnectionId) {
    const list = await listConnections(userId);
    const picked = list.find((c) => c.id === profile.codexConnectionId) ?? null;
    if (picked) {
      const model = typeof picked.model === "string" ? picked.model : "";
      if (!model.trim()) {
        throw new FatalSummarizerError(`Codex connection "${picked.name || picked.id}" has no model set, pick one in its settings`);
      }
      return picked;
    }
    warn(`codex: connection ${profile.codexConnectionId} not found, falling back to the profile connection`);
  }
  const conn = await resolveConnection(profile, userId);
  if (!conn)
    throw new FatalSummarizerError("No connection available for the codex");
  return conn;
}
async function runQuietRound(conn, messages, profile, userId, tools, externalSignal, onProgress, onDelta, progressBase) {
  const model = (conn.model ?? "").trim();
  const parameters = { ...buildCodexSamplerParameters(profile) };
  if (model)
    parameters["model"] = model;
  const result = await consumeGenerationStream((signal) => spindle.generate.quietStream({
    type: "quiet",
    messages,
    connection_id: conn.id,
    parameters,
    ...tools ? { tools } : {},
    userId,
    signal
  }), {
    externalSignal,
    onProgress,
    onDelta,
    firstTokenTimeoutMs: null,
    overallDeadlineMs: null,
    salvagePartial: false,
    progressBase
  });
  return {
    content: result.content,
    toolCalls: result.toolCalls,
    usagePrompt: result.usage?.prompt_tokens ?? 0,
    usageCompletion: result.usage?.completion_tokens ?? 0
  };
}
function assistantTurn(content, toolCalls) {
  const parts = [];
  if (content.trim())
    parts.push({ type: "text", text: content });
  for (const call of toolCalls) {
    parts.push({ type: "tool_use", id: call.call_id, name: call.name, input: call.args });
  }
  return { role: "assistant", content: parts };
}
function parseJsonModeCalls(raw) {
  const objs = parseLooseJsonObjects(raw);
  const envelopes = objs.filter((o) => Array.isArray(o["writes"]) || o["done"] === true);
  const obj = envelopes.length ? envelopes[envelopes.length - 1] : objs[0] ?? null;
  if (!obj)
    return [];
  const calls = [];
  const writes = Array.isArray(obj["writes"]) ? obj["writes"] : [];
  writes.forEach((w, i) => {
    const args = w && typeof w === "object" && !Array.isArray(w) ? w : {};
    calls.push({ call_id: `json_w${i}`, name: "codex_write", args });
  });
  if (obj["done"] === true) {
    const args = typeof obj["note"] === "string" ? { note: obj["note"] } : {};
    calls.push({ call_id: "json_done", name: "codex_done", args });
  }
  return calls;
}
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
function isMaskEcho(v) {
  return v === LOCKED_FIELD_MASK || Array.isArray(v) && v.length === 1 && v[0] === LOCKED_FIELD_MASK;
}
function restoreLockedFields(file, value, current) {
  if (file !== "characters" && file !== "locations" && file !== "things")
    return [];
  const curById = new Map;
  for (const row of fileRows(current, file)) {
    if (typeof row["id"] === "string")
      curById.set(row["id"], row);
  }
  const touched = [];
  for (const row of fileRows(value, file)) {
    const id = typeof row["id"] === "string" ? row["id"] : "";
    const orig = curById.get(id);
    const lf = orig && Array.isArray(orig["lockedFields"]) ? orig["lockedFields"].filter((f) => typeof f === "string" && f !== "id" && f !== "name") : [];
    if (lf.length === 0) {
      delete row["lockedFields"];
      continue;
    }
    let changed = false;
    for (const f of lf) {
      const wrote = row[f];
      const want = orig[f];
      if (wrote !== undefined && !isMaskEcho(wrote) && JSON.stringify(wrote) !== JSON.stringify(want))
        changed = true;
      if (want === undefined)
        delete row[f];
      else
        row[f] = clone(want);
    }
    row["lockedFields"] = [...lf];
    if (changed)
      touched.push(id);
  }
  return touched;
}
function stageWrite(file, args, current, validateOpts, timelineAppendOnly) {
  const errors = [];
  const lockedKept = [];
  const lockedFieldsKept = [];
  const dropMisses = [];
  const archivedKept = [];
  const keyField = FILE_ROW_KEY[file].key;
  const arg = (k) => {
    const v = args[k];
    return v === null ? undefined : v;
  };
  const rawContent = arg("content");
  const rawSet = arg("set");
  const rawDrop = arg("drop");
  const rawSeeds = arg("seeds");
  const hasPatch = rawSet !== undefined || rawDrop !== undefined || rawSeeds !== undefined;
  const lockedRows = new Map;
  if (keyField === "id") {
    for (const row of fileRows(current, file)) {
      if (row["locked"] === true && typeof row["id"] === "string")
        lockedRows.set(row["id"], row);
    }
  }
  const hiddenResolved = file === "threads" ? current.threads.filter((t) => t.status === "resolved") : [];
  if (rawContent !== undefined) {
    if (hasPatch) {
      return { errors: ["content replaces the whole file - never combine it with set, drop, or seeds"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
    }
    let content = rawContent;
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        return { errors: ["content: string was not valid JSON, pass the object directly"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
      }
    }
    const result2 = validateCodexFile(file, content, validateOpts);
    if (!result2.ok)
      return { errors: result2.errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
    const value2 = result2.value;
    if (lockedRows.size > 0) {
      const rows2 = fileRows(value2, file);
      for (const [id, orig] of lockedRows) {
        const idx = rows2.findIndex((r) => r["id"] === id);
        if (idx >= 0) {
          if (JSON.stringify(rows2[idx]) !== JSON.stringify(orig))
            lockedKept.push(id);
          rows2[idx] = clone(orig);
        } else {
          lockedKept.push(id);
          rows2.push(clone(orig));
        }
      }
    }
    if (keyField === "id") {
      for (const row of fileRows(value2, file)) {
        if (row["locked"] === true && !lockedRows.has(String(row["id"] ?? "")))
          delete row["locked"];
      }
    }
    if (file === "threads" && hiddenResolved.length > 0) {
      const t = value2;
      const hiddenRids = new Set(hiddenResolved.map((h) => h.rid).filter(Boolean));
      for (const row of t.threads) {
        if (row.rid && hiddenRids.has(row.rid))
          archivedKept.push(row.rid);
      }
      t.threads = t.threads.filter((row) => !(row.rid && hiddenRids.has(row.rid)));
      t.threads.push(...hiddenResolved.map((h) => clone(h)));
    }
    lockedFieldsKept.push(...restoreLockedFields(file, value2, current));
    assignMissingRids(file, value2);
    return { value: value2, errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  }
  if (!hasPatch) {
    return { errors: ["empty write: provide set, drop, seeds, or content"], lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  }
  if (rawSeeds !== undefined && file !== "threads") {
    errors.push("seeds: only threads.json has a seeds list");
  }
  const setRows = [];
  if (rawSet !== undefined) {
    if (!Array.isArray(rawSet))
      errors.push("set: expected an array of rows");
    else
      rawSet.forEach((r, i) => {
        let row = r;
        if (typeof row === "string") {
          try {
            row = JSON.parse(row);
          } catch {}
        }
        if (!row || typeof row !== "object" || Array.isArray(row))
          errors.push(`set[${i}]: expected a row object`);
        else
          setRows.push(row);
      });
  }
  const dropKeys = [];
  if (rawDrop !== undefined) {
    if (!Array.isArray(rawDrop))
      errors.push("drop: expected an array of keys");
    else
      rawDrop.forEach((k, i) => {
        if (typeof k !== "string" || !k.trim())
          errors.push(`drop[${i}]: expected a key string`);
        else
          dropKeys.push(k.trim());
      });
  }
  let seeds = null;
  if (rawSeeds !== undefined && file === "threads") {
    if (!Array.isArray(rawSeeds) || rawSeeds.some((s) => typeof s !== "string")) {
      errors.push("seeds: expected an array of strings");
    } else {
      seeds = rawSeeds.map((s) => s.trim()).filter(Boolean);
    }
  }
  if (setRows.length === 0 && dropKeys.length === 0 && seeds === null && errors.length === 0) {
    errors.push("empty write: set and drop held nothing - provide rows, keys, seeds, or content");
  }
  if (errors.length)
    return { errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  let rows = fileRows(current, file).map((r) => clone(r));
  if (file === "threads")
    rows = rows.filter((r) => r["status"] !== "resolved");
  const isArchivedRid = (key2) => file === "threads" && hiddenResolved.some((h) => h.rid === key2);
  for (const key2 of dropKeys) {
    if (lockedRows.has(key2)) {
      lockedKept.push(key2);
      continue;
    }
    if (isArchivedRid(key2)) {
      archivedKept.push(key2);
      continue;
    }
    if (file === "timeline" && timelineAppendOnly) {
      errors.push(`drop "${key2}": the timeline is append-only - events are only removed in reconcile or tidy passes`);
      continue;
    }
    const idx = rows.findIndex((r) => r[keyField] === key2);
    if (idx === -1) {
      dropMisses.push(key2);
      continue;
    }
    rows.splice(idx, 1);
  }
  setRows.forEach((row, i) => {
    const key2 = row[keyField];
    if (typeof key2 === "string" && key2) {
      if (lockedRows.has(key2)) {
        lockedKept.push(key2);
        return;
      }
      const idx = rows.findIndex((r) => r[keyField] === key2);
      if (idx >= 0) {
        rows[idx] = row;
        return;
      }
      if (keyField === "rid") {
        if (isArchivedRid(key2)) {
          archivedKept.push(key2);
          return;
        }
        errors.push(`set[${i}]: rid "${key2}" does not exist in ${file}.json - omit rid to add a new row`);
        return;
      }
      rows.push(row);
      return;
    }
    if (keyField === "id") {
      errors.push(`set[${i}]: missing "id"`);
      return;
    }
    rows.push(row);
  });
  if (errors.length)
    return { errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  const candidate = { [FILE_ROW_KEY[file].field]: rows };
  if (file === "threads") {
    candidate["seeds"] = seeds ?? current.seeds;
  }
  const result = validateCodexFile(file, candidate, validateOpts);
  if (!result.ok)
    return { errors: result.errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
  const value = result.value;
  if (keyField === "id") {
    for (const row of fileRows(value, file)) {
      if (row["locked"] === true && !lockedRows.has(String(row["id"] ?? "")))
        delete row["locked"];
    }
  }
  if (file === "threads" && hiddenResolved.length > 0) {
    value.threads.push(...hiddenResolved.map((h) => clone(h)));
  }
  lockedFieldsKept.push(...restoreLockedFields(file, value, current));
  assignMissingRids(file, value);
  return { value, errors, lockedKept, lockedFieldsKept, dropMisses, archivedKept };
}
async function runCodexAgent(opts) {
  const { profile, userId, chatId, promptCtx } = opts;
  const conn = await resolveCodexConnection(profile, userId);
  const maxRounds = profile.codexThorough ? 4 : 3;
  const useTools = promptCtx.useTools;
  const tools = useTools ? codexTools([...promptCtx.activeFiles]) : null;
  const system = await resolveSystemMacros(buildCodexSystemPrompt(promptCtx), chatId, userId);
  const userText = opts.userTextOverride ?? buildCodexUserMessage(promptCtx, opts.bundle, opts.chunk, opts.chunkLabel, opts.chunkFirstIndex, opts.notes, opts.lore, opts.storySoFar);
  const maxInput = codexMaxInputTokens(profile);
  const promptTokens = approximateTokensFromChars(system.length + userText.length);
  if (promptTokens > maxInput)
    throw new CodexContextError(promptTokens, maxInput);
  const frozen = new Set(CODEX_FILE_KEYS.filter((k) => !promptCtx.activeFiles.has(k)));
  const conv = [
    { role: "system", content: [{ type: "text", text: system, cache_control: { ...CACHE_EPHEMERAL } }] },
    { role: "user", content: [{ type: "text", text: userText, cache_control: { ...CACHE_EPHEMERAL } }] }
  ];
  const working = { ...opts.bundle };
  const changed = new Set;
  const validateOpts = { relationsTable: profile.codexRelationsTable, strictExtras: true };
  const progressBase = opts.progressBase ?? { chars: 0, thinking: 0 };
  const baselineDangling = danglingRefCounts(opts.bundle);
  let usagePrompt = 0;
  let usageCompletion = 0;
  let doneNote = null;
  let verifyRequested = false;
  let unresolvedErrors = false;
  const rejectedFiles = new Set;
  let rounds = 0;
  while (rounds < maxRounds) {
    if (opts.externalSignal.aborted)
      throw new AbortedSummarizerError;
    rounds++;
    if (rounds > 1)
      opts.onDelta?.("text", `

\u2550\u2550\u2550 round ${rounds} \u2550\u2550\u2550
`);
    const round = await runQuietRound(conn, conv, profile, userId, tools, opts.externalSignal, opts.onProgress, opts.onDelta, progressBase);
    usagePrompt += round.usagePrompt;
    usageCompletion += round.usageCompletion;
    const calls = useTools ? round.toolCalls : parseJsonModeCalls(round.content);
    for (const call of calls) {
      if (call.name === "codex_write") {
        const f = typeof call.args["file"] === "string" ? call.args["file"] : "?";
        let label;
        if (call.args["content"] !== undefined) {
          let size = 0;
          try {
            size = JSON.stringify(call.args["content"] ?? "").length;
          } catch {}
          label = `full rewrite, ${(size / 1000).toFixed(1)}k chars`;
        } else {
          const bits = [];
          const setN = Array.isArray(call.args["set"]) ? call.args["set"].length : 0;
          const dropN = Array.isArray(call.args["drop"]) ? call.args["drop"].length : 0;
          if (setN)
            bits.push(`${setN} set`);
          if (dropN)
            bits.push(`${dropN} drop`);
          if (call.args["seeds"] !== undefined)
            bits.push("seeds");
          label = bits.join(", ") || "empty";
        }
        opts.onDelta?.("text", `
\u27A4 codex_write ${f}.json (${label})`);
      } else if (call.name === "codex_done") {
        const note = typeof call.args["note"] === "string" && call.args["note"].trim() ? ` \u2014 ${call.args["note"].trim()}` : "";
        opts.onDelta?.("text", `
\u2726 codex_done${note}`);
      } else {
        opts.onDelta?.("text", `
\u2717 unknown tool ${call.name}`);
      }
    }
    if (calls.length === 0) {
      if (rounds === 1 && !round.content.trim()) {
        throw new Error("The codex agent returned an empty response");
      }
      if (unresolvedErrors) {
        throw new Error(rejectedFiles.size > 0 ? "The codex agent abandoned a rejected write instead of correcting it" : "The codex agent left an unresolved integrity error instead of correcting it");
      }
      if (changed.size === 0) {
        if (useTools) {
          throw new ToolProtocolError("The codex agent narrated instead of calling tools, check that the connection supports tool calls");
        }
        throw new Error("The codex agent replied without a parsable JSON update");
      }
      break;
    }
    conv.push(useTools ? assistantTurn(round.content, calls) : { role: "assistant", content: round.content });
    const outcomes = [];
    const doneCalls = [];
    for (const call of calls) {
      if (call.name === "codex_done") {
        doneCalls.push(call);
        continue;
      }
      if (call.name !== "codex_write") {
        outcomes.push({ callId: call.call_id, file: null, errors: [`Unknown tool "${call.name}", only codex_write and codex_done exist - resend the payload through codex_write`] });
        continue;
      }
      const fileRaw = call.args["file"];
      if (!isCodexFileKey(fileRaw)) {
        outcomes.push({ callId: call.call_id, file: null, errors: [`file: expected one of ${CODEX_FILE_KEYS.join(", ")} - resend this write under the right file`] });
        continue;
      }
      if (frozen.has(fileRaw)) {
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: [], skipped: true });
        continue;
      }
      const staged = stageWrite(fileRaw, call.args, working[fileRaw], validateOpts, opts.timelineAppendOnly === true);
      if (!staged.value) {
        rejectedFiles.add(fileRaw);
        outcomes.push({ callId: call.call_id, file: fileRaw, errors: staged.errors });
        continue;
      }
      working[fileRaw] = staged.value;
      changed.add(fileRaw);
      rejectedFiles.delete(fileRaw);
      outcomes.push({
        callId: call.call_id,
        file: fileRaw,
        errors: [],
        ...staged.lockedKept.length ? { lockedKept: staged.lockedKept } : {},
        ...staged.lockedFieldsKept.length ? { lockedFieldsKept: staged.lockedFieldsKept } : {},
        ...staged.dropMisses.length ? { dropMisses: staged.dropMisses } : {},
        ...staged.archivedKept.length ? { archivedKept: staged.archivedKept } : {}
      });
    }
    let sawDone = false;
    for (const call of doneCalls) {
      if (rejectedFiles.size > 0) {
        outcomes.push({
          callId: call.call_id,
          file: null,
          errors: [`Corrections still outstanding for: ${[...rejectedFiles].join(", ")}. Resend them before codex_done.`]
        });
        continue;
      }
      sawDone = true;
      const note = call.args["note"];
      if (typeof note === "string" && note.trim())
        doneNote = note.trim();
      outcomes.push({ callId: call.call_id, file: null, errors: [] });
    }
    const integrityErrors = newDanglingErrors(working, baselineDangling);
    for (const o of outcomes) {
      if (o.errors.length)
        opts.onDelta?.("text", `
\u2717 rejected${o.file ? ` ${o.file}.json` : ""}: ${o.errors[0]}`);
    }
    for (const e of integrityErrors)
      opts.onDelta?.("text", `
\u2717 integrity: ${e}`);
    const hadErrors = outcomes.some((o) => o.errors.length > 0) || integrityErrors.length > 0;
    unresolvedErrors = hadErrors || rejectedFiles.size > 0;
    const lockedNote = (o) => {
      const bits = [];
      if (o.lockedKept?.length)
        bits.push(`locked, left untouched: ${o.lockedKept.join(", ")} - do not resend them`);
      if (o.lockedFieldsKept?.length)
        bits.push(`locked fields restored to the user's values on: ${o.lockedFieldsKept.join(", ")} - never write those fields`);
      if (o.dropMisses?.length)
        bits.push(`already absent, drop was a no-op: ${o.dropMisses.join(", ")}`);
      if (o.archivedKept?.length)
        bits.push(`resolved and archived, left alone: ${o.archivedKept.join(", ")} - never resend them`);
      return bits.length ? ` (${bits.join("; ")})` : "";
    };
    const resultParts = outcomes.map((o) => ({
      type: "tool_result",
      tool_use_id: o.callId,
      content: o.errors.length ? `REJECTED, nothing from this write was staged - resend it corrected in full:
${o.errors.join(`
`)}` : o.skipped ? `skipped, ${o.file}.json is frozen by the user - do not resend it` : o.file ? `ok, staged${lockedNote(o)}` : "ok",
      ...o.errors.length ? { is_error: true } : {}
    }));
    const feedbackLines = outcomes.map((o) => o.errors.length ? `REJECTED ${o.file ? `${o.file}.json` : "write"}, nothing from it was staged - resend it corrected in full:
${o.errors.join(`
`)}` : o.skipped ? `${o.file}.json skipped, it is frozen by the user - do not resend it` : o.file ? `${o.file}.json staged.${lockedNote(o)}` : "done acknowledged.");
    const pushFeedback = (extra) => {
      if (useTools) {
        if (extra)
          resultParts.push({ type: "text", text: extra });
        conv.push({ role: "user", content: resultParts });
      } else {
        conv.push({ role: "user", content: [...feedbackLines, extra].filter(Boolean).join(`

`) });
      }
    };
    if (!hadErrors) {
      const wantVerify = profile.codexThorough && changed.size > 0 && !verifyRequested && !opts.skipVerify;
      if (sawDone && !wantVerify) {
        if (useTools)
          conv.push({ role: "user", content: resultParts });
        break;
      }
      if (wantVerify) {
        verifyRequested = true;
        pushFeedback(verifyNudge(promptCtx));
        continue;
      }
      const roundStaged = outcomes.some((o) => o.file !== null && !o.skipped && o.errors.length === 0);
      pushFeedback(roundStaged ? useTools ? "Writes staged. Call codex_done, or send corrected files if anything is left." : 'Writes staged. Respond with a JSON object: any corrected files in "writes", and "done": true to finish.' : useTools ? "Nothing was staged this round. Call codex_done, or send writes for unfrozen files." : 'Nothing was staged this round. Respond with a JSON object: writes for unfrozen files if needed, and "done": true.');
      continue;
    }
    const fixup = [];
    if (integrityErrors.length) {
      fixup.push(`Cross-file integrity errors:
${integrityErrors.join(`
`)}`);
    }
    fixup.push(useTools ? "Resend ONLY the rejected or offending files, corrected. Then call codex_done." : 'Respond with a JSON object containing ONLY the rejected or offending files, corrected, in "writes". Set "done": true once everything is fixed.');
    pushFeedback(fixup.join(`

`));
    if (rounds >= maxRounds) {
      const remaining = outcomes.flatMap((o) => o.errors).concat(integrityErrors);
      throw new Error(`Codex update failed validation after ${rounds} rounds: ${remaining.slice(0, 3).join("; ")}`);
    }
  }
  if (rejectedFiles.size > 0) {
    throw new Error(`Codex run ended with unresolved rejections: ${[...rejectedFiles].join(", ")}`);
  }
  const finalIntegrity = newDanglingErrors(working, baselineDangling);
  if (finalIntegrity.length) {
    throw new Error(`Codex left dangling references: ${finalIntegrity.slice(0, 3).join("; ")}`);
  }
  if (opts.notes.migrateToTable) {
    const leftover = ["characters", "locations", "things"].filter((k) => working[k].entities.some((e) => e.locked !== true && Array.isArray(e.ties) && e.ties.length > 0));
    if (leftover.length) {
      throw new Error(`Table migration left ties on ${leftover.map((k) => `${k}.json`).join(", ")}, the run will retry`);
    }
  }
  if (opts.notes.migrateToInline && opts.bundle.relations.relations.length > 0) {
    const foldedTies = ["characters", "locations", "things"].some((k) => working[k].entities.some((e) => e.locked !== true && Array.isArray(e.ties) && e.ties.length > 0));
    const lockedIds = new Set(["characters", "locations", "things"].flatMap((k) => working[k].entities.filter((e) => e.locked === true).map((e) => e.id)));
    const foldable = opts.bundle.relations.relations.some((r) => (r.type === "pair" ? [r.a, r.b] : r.members).some((m) => !lockedIds.has(m)));
    if (!foldedTies && foldable) {
      throw new Error("Inline migration produced no ties from the relations table, the run will retry");
    }
  }
  for (const key2 of changed) {
    try {
      await saveCodexFile(chatId, key2, working[key2], userId);
    } catch (err) {
      throw new Error(`Failed to save ${key2}.json: ${describeError(err)}`);
    }
  }
  return {
    changedFiles: [...changed],
    rounds,
    model: conn.model,
    usagePromptTokens: usagePrompt,
    usageCompletionTokens: usageCompletion,
    doneNote
  };
}

// src/backend/codex/index.ts
function reportCodexFailure(userId, chatId, verb, err) {
  if (err instanceof CodexContextError) {
    cb2?.onToast(userId, "error", err.message);
    return;
  }
  cb2?.onToast(userId, "error", `Memoria couldn't ${verb} the codex: ${shortErrorText(err)}`);
  if (err instanceof ToolProtocolError)
    cb2?.onToolsHint?.(userId, chatId);
}
function effectiveLoreLimitTokens(profile) {
  if (profile.codexLoreLimitUnit === "tokens")
    return profile.codexLoreLimitTokens;
  return Math.max(1, Math.floor(codexMaxInputTokens(profile) * profile.codexLoreLimitPercent / 100));
}
var cb2 = null;
function registerCodexCallbacks(c) {
  cb2 = c;
}
function nonEmpty(m) {
  return !!(m.content || "").trim();
}
function sizeOf(messages, unit) {
  return unit === "messages" ? messages.length : sumApproxTokens(messages);
}
function trimLag(tail, unit, lagValue) {
  if (lagValue <= 0)
    return tail.slice();
  if (unit === "messages") {
    return lagValue >= tail.length ? [] : tail.slice(0, tail.length - lagValue);
  }
  let reserved = 0;
  let cutoff = tail.length;
  for (let i = tail.length - 1;i >= 0; i--) {
    reserved += approximateTokensFromChars((tail[i].content || "").length);
    cutoff = i;
    if (reserved >= lagValue)
      break;
  }
  if (reserved < lagValue)
    return [];
  return tail.slice(0, cutoff);
}
function takeWindow(compressible, unit, windowValue, tokenBreakpoint) {
  const budget = unit === "messages" ? Math.max(1000, tokenBreakpoint) : windowValue;
  const maxCount = unit === "messages" ? Math.max(1, windowValue) : compressible.length;
  const out = [];
  let acc = 0;
  for (const m of compressible) {
    out.push(m);
    if (out.length >= maxCount)
      break;
    acc += approximateTokensFromChars((m.content || "").length);
    if (acc >= budget)
      break;
  }
  return out;
}
function windowReached(compressible, profile) {
  if (sizeOf(compressible, profile.codexWindowUnit) >= profile.codexWindowValue)
    return true;
  if (profile.codexWindowUnit === "messages" && sumApproxTokens(compressible) >= Math.max(1000, profile.codexTokenBreakpoint))
    return true;
  return false;
}
async function syncEntriesGuarded(chatId, userId, relationsTableFallback) {
  try {
    await syncCodexEntries(chatId, userId, relationsTableFallback);
  } catch (err) {
    warn(`codex entry sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    cb2?.onToast(userId, "error", `Memoria couldn't sync the codex to the lorebook: ${shortErrorText(err)}`);
  }
}
var entriesEnsured = new Set;
var ENTRIES_ENSURED_CAP = 5000;
async function ensureCodexEntriesSynced(chatId, userId, profile) {
  if (!profile.codexEnabled)
    return;
  const key2 = `${userId}::${chatId}`;
  if (entriesEnsured.has(key2))
    return;
  if (entriesEnsured.size >= ENTRIES_ENSURED_CAP)
    entriesEnsured.clear();
  entriesEnsured.add(key2);
  try {
    await syncCodexEntries(chatId, userId, profile.codexRelationsTable);
  } catch (err) {
    entriesEnsured.delete(key2);
    warn(`codex entry ensure-sync failed for ${chatId.slice(0, 8)}: ${describeError(err)}`);
    cb2?.onToast(userId, "error", `Memoria couldn't sync the codex to the lorebook: ${shortErrorText(err)}`);
  }
}
async function planRun(chatId, userId, lagUnit, lagValue) {
  const messages = await spindle.chat.getMessages(chatId);
  const cursor = await loadCursor(chatId, userId);
  const byId = new Map(messages.map((m) => [m.id, m]));
  const posById = new Map(messages.map((m, i) => [m.id, i]));
  const consumedBeforeRewind = cursor.consumedSigs;
  let reconcile = cursor.pendingReconcile;
  let divergedAt = -1;
  for (let i = 0;i < cursor.consumedSigs.length; i++) {
    const rec = cursor.consumedSigs[i];
    const live = byId.get(rec.id);
    if (!live || msgSig(live.role, live.content || "") !== rec.sig) {
      divergedAt = i;
      break;
    }
  }
  const posOf = (id) => id ? posById.get(id) ?? -1 : -1;
  if (divergedAt >= 0) {
    let boundaryId = cursor.lastMsgId;
    if (boundaryId && !byId.has(boundaryId)) {
      boundaryId = null;
      for (let j = cursor.consumedSigs.length - 1;j >= 0; j--) {
        const id = cursor.consumedSigs[j].id;
        if (byId.has(id)) {
          boundaryId = id;
          break;
        }
      }
      if (!boundaryId && messages.length > 0) {
        boundaryId = messages[messages.length - 1].id;
      }
    }
    if (boundaryId && posOf(boundaryId) > posOf(cursor.reconcileUntilMsgId)) {
      cursor.reconcileUntilMsgId = boundaryId;
    }
    cursor.consumedSigs = cursor.consumedSigs.slice(0, divergedAt);
    cursor.lastMsgId = cursor.consumedSigs.length ? cursor.consumedSigs[cursor.consumedSigs.length - 1].id : cursor.prefixMsgId;
    cursor.pendingReconcile = true;
    reconcile = true;
  }
  if (cursor.pendingReconcile && cursor.reconcileUntilMsgId && !byId.has(cursor.reconcileUntilMsgId)) {
    cursor.reconcileUntilMsgId = messages.length ? messages[messages.length - 1].id : null;
  }
  let startPos = 0;
  if (cursor.lastMsgId) {
    const idx = posById.get(cursor.lastMsgId);
    if (idx !== undefined) {
      startPos = idx + 1;
    } else {
      let resume = -1;
      for (const rec of consumedBeforeRewind) {
        const p = posById.get(rec.id);
        if (p !== undefined) {
          resume = p;
          break;
        }
      }
      startPos = resume >= 0 ? resume : 0;
    }
  }
  const tail = messages.slice(startPos).filter(nonEmpty);
  const compressible = trimLag(tail, lagUnit, lagValue);
  return { messages, cursor, startPos, compressible, reconcile, rewound: divergedAt >= 0 };
}
async function activatedLoreText(chatId, userId, limitTokens) {
  const activated = await spindle.world_books.getActivated(chatId, userId).catch(() => null);
  if (!activated || activated.length === 0)
    return null;
  const ourBookId = await findBookForChat(chatId, userId).catch(() => null);
  const bookIds = new Set;
  for (const a of activated) {
    if (a.bookId && a.bookId !== ourBookId)
      bookIds.add(a.bookId);
  }
  if (bookIds.size === 0)
    return null;
  const entryById = new Map;
  for (const bookId of bookIds) {
    for (const entry of await listAllEntries(bookId, userId).catch(() => [])) {
      entryById.set(entry.id, entry);
    }
  }
  const capChars = limitTokens > 0 ? limitTokens * 4 : Number.POSITIVE_INFINITY;
  const parts = [];
  let used = 0;
  let skipped = false;
  for (const a of activated) {
    if (!a.bookId || a.bookId === ourBookId)
      continue;
    const entry = entryById.get(a.id);
    if (!entry)
      continue;
    const ext = entry.extensions || {};
    if (ext[EXTENSION_KEY])
      continue;
    if (ext[CODEX_ENTRY_EXTENSION_KEY])
      continue;
    const content = (entry.content || "").trim();
    if (!content)
      continue;
    const label = (entry.comment || "").trim();
    const block = label ? `[${label}]
${content}` : content;
    if (used + block.length > capChars) {
      skipped = true;
      continue;
    }
    parts.push(block);
    used += block.length;
  }
  if (skipped)
    parts.push(LORE_OMITTED_MARKER);
  if (parts.length === 0)
    return null;
  return parts.join(`

`);
}
var LORE_OMITTED_MARKER = "[...more lore omitted for size...]";
async function storySoFarText(chatId, userId, profile, chunkFirstIdx, posById) {
  if (!profile.codexExtraContext || profile.codexStorySoFarCount <= 0)
    return null;
  const entries = await listLmbEntries(chatId, userId).catch(() => []);
  const prior = entries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot && liveEndPosition(e.meta.msgIds, e.meta.lastMsgIdx, posById) < chunkFirstIdx).sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0)).slice(-profile.codexStorySoFarCount);
  if (prior.length === 0)
    return null;
  return prior.map((c) => c.raw.content || "").filter(Boolean).join(`

`);
}
async function getCodexStatus(chatId, userId, profile) {
  const exists = await codexPresence(chatId, userId) === "present";
  if (!profile.codexEnabled && !exists)
    return { exists: false, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  try {
    const plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
    let backlogPasses = 0;
    let rest = plan.compressible;
    while (rest.length > 0 && backlogPasses < 99) {
      const w = takeWindow(rest, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      if (w.length === 0)
        break;
      rest = rest.slice(w.length);
      backlogPasses++;
    }
    return { exists, backlog: plan.compressible.length, lastRunAt: plan.cursor.lastRunAt, backlogPasses };
  } catch (err) {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  }
}
function previewTail(messages, profile) {
  if (profile.codexWindowUnit === "messages")
    return messages.slice(-Math.max(1, profile.codexWindowValue));
  const out = [];
  let acc = 0;
  for (let i = messages.length - 1;i >= 0; i--) {
    out.unshift(messages[i]);
    acc += approximateTokensFromChars((messages[i].content || "").length);
    if (acc >= profile.codexWindowValue)
      break;
  }
  return out;
}
async function dryRunCodex(chatId, profile, settings, userId) {
  const conn = await resolveCodexConnection(profile, userId);
  const diagnostics = [];
  let plan = await planRun(chatId, userId, profile.codexLagUnit, profile.codexLagValue);
  let chunk;
  if (plan.compressible.length > 0) {
    chunk = takeWindow(plan.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
    if (!windowReached(plan.compressible, profile)) {
      diagnostics.push({ message: "The window has not filled yet, automation would wait. Update now would consume this chunk." });
    }
  } else {
    const eager = await planRun(chatId, userId, profile.codexLagUnit, 0);
    if (eager.compressible.length > 0) {
      plan = eager;
      chunk = takeWindow(eager.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      diagnostics.push({ message: "The lag reserve still holds these turns, automation would wait. Update now would consume them." });
    } else {
      const eligible = plan.messages.filter(nonEmpty);
      if (eligible.length === 0)
        throw new Error("Chat has no messages");
      chunk = previewTail(eligible, profile);
      diagnostics.push({ message: "The codex has read everything, so this preview reuses the newest turns. A real run would wait for new messages." });
    }
  }
  if (chunk.length === 0)
    throw new Error("No consumable window, send a message and try again");
  const prevMode = plan.cursor.relationsTableMode;
  const diskMode = prevMode ?? profile.codexRelationsTable;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  const frozenFiles = new Set(CODEX_FILE_KEYS.filter((k) => plan.cursor.fileStates[k] === "frozen"));
  if (frozenFiles.size === CODEX_FILE_KEYS.length) {
    throw new Error("Every codex record is frozen, unfreeze one to preview a run");
  }
  const notes = {
    reconcile: plan.reconcile,
    migrateToTable: prevMode === false && profile.codexRelationsTable,
    migrateToInline: prevMode === true && !profile.codexRelationsTable,
    loadProblems: problems.map((p) => `${p.file}.json`)
  };
  const promptCtx = makeCodexPromptCtx(profile, settings.customPresets, frozenFiles);
  const posById = new Map(plan.messages.map((m, i) => [m.id, i]));
  const firstIdx = posById.get(chunk[0].id) ?? 0;
  const lastIdx = posById.get(chunk[chunk.length - 1].id) ?? firstIdx;
  const chunkLabel = `messages ${firstIdx + 1}-${lastIdx + 1} of ${plan.messages.length}`;
  const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
  const storySoFar = await storySoFarText(chatId, userId, profile, firstIdx, posById);
  const system = await resolveMacrosWithDiagnostics(buildCodexSystemPrompt(promptCtx), chatId, userId, diagnostics);
  const user = buildCodexUserMessage(promptCtx, bundle, plan.messages.slice(firstIdx, lastIdx + 1), chunkLabel, firstIdx, notes, lore, storySoFar);
  const preset = settings.customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey);
  const overrideCount = preset?.templates ? Object.keys(preset.templates).length : 0;
  diagnostics.push({ message: `Connection: ${conn.name} (${conn.provider}/${conn.model})` });
  diagnostics.push({ message: `Transport: ${promptCtx.useTools ? "tool calls (codex_write / codex_done)" : "strict JSON"}` });
  diagnostics.push({
    message: `Preset: ${preset ? `Custom: ${preset.displayName}` : "Built-in: Default"}${overrideCount ? ` (${overrideCount} template${overrideCount === 1 ? "" : "s"} customized)` : ""}`
  });
  diagnostics.push({
    message: `Relations mode: ${profile.codexRelationsTable ? "table" : "inline ties"}${notes.migrateToTable || notes.migrateToInline ? " (format changed, this run would migrate)" : ""}`
  });
  diagnostics.push({ message: `Active files: ${[...promptCtx.activeFiles].join(", ")}` });
  if (frozenFiles.size)
    diagnostics.push({ message: `Frozen, omitted from the prompt entirely: ${[...frozenFiles].join(", ")}` });
  diagnostics.push({ message: `Chunk: ${chunkLabel} (${chunk.length} message${chunk.length === 1 ? "" : "s"})` });
  if (plan.reconcile)
    diagnostics.push({ message: "Reconcile pending: the story was edited behind the codex, the reconcile note is included" });
  if (notes.loadProblems.length)
    diagnostics.push({ message: `Unreadable files shown empty: ${notes.loadProblems.join(", ")}` });
  const lockedEntities = [];
  const fieldLocked = [];
  for (const key2 of ["characters", "locations", "things"]) {
    for (const e of bundle[key2].entities) {
      if (e.locked === true)
        lockedEntities.push(e.id);
      if (Array.isArray(e.lockedFields) && e.lockedFields.length)
        fieldLocked.push(e.id);
    }
  }
  if (lockedEntities.length || fieldLocked.length) {
    diagnostics.push({
      message: `Locks: ${lockedEntities.length} locked entit${lockedEntities.length === 1 ? "y" : "ies"}, ${fieldLocked.length} with locked fields (masked in the prompt)`
    });
  }
  if (storySoFar)
    diagnostics.push({ message: `Story-so-far context: ~${approximateTokensFromChars(storySoFar.length)} tokens` });
  if (lore)
    diagnostics.push({ message: `Activated lore reference: ~${approximateTokensFromChars(lore.length)} tokens` });
  if (lore?.includes(LORE_OMITTED_MARKER)) {
    diagnostics.push({
      message: `Activated lore exceeded the lore limit (${effectiveLoreLimitTokens(profile)} tokens): entries past the budget were skipped whole and the omission marker tells the agent more canon exists`
    });
  }
  diagnostics.push({ message: `Thorough mode: ${profile.codexThorough ? "on, one verification round follows a clean update" : "off"}` });
  diagnostics.push({
    message: `Prompt size: ~${approximateTokensFromChars(system.length)} tokens system + ~${approximateTokensFromChars(user.length)} tokens user (codex max input ${codexMaxInputTokens(profile)})`
  });
  const promptTokens = approximateTokensFromChars(system.length + user.length);
  if (promptTokens > codexMaxInputTokens(profile)) {
    diagnostics.push({ message: `WOULD FAIL: ${new CodexContextError(promptTokens, codexMaxInputTokens(profile)).message}` });
  }
  diagnostics.push({ message: `Sampler parameters being sent on the wire: ${JSON.stringify(buildCodexSamplerParameters(profile))}` });
  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    diagnostics
  };
}
async function runChunk(chatId, userId, profile, plan, chunk, automation, externalSignal, progress, buildUserText, wantLore = false) {
  const prevMode = plan.cursor.relationsTableMode;
  const diskMode = prevMode ?? profile.codexRelationsTable;
  const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
  const frozenFiles = new Set(CODEX_FILE_KEYS.filter((k) => plan.cursor.fileStates[k] === "frozen"));
  const notes = {
    reconcile: plan.reconcile,
    migrateToTable: prevMode === false && profile.codexRelationsTable,
    migrateToInline: prevMode === true && !profile.codexRelationsTable,
    loadProblems: problems.map((p) => `${p.file}.json`)
  };
  const settings = await loadSettings(userId);
  const promptCtx = makeCodexPromptCtx(profile, settings.customPresets, frozenFiles);
  if (notes.migrateToTable || notes.migrateToInline) {
    const blocked = ["characters", "locations", "things", "relations"].filter((k) => frozenFiles.has(k));
    if (blocked.length) {
      throw new Error(`The relations format changed - unfreeze ${blocked.map((k) => `${k}.json`).join(", ")} so Memoria can migrate`);
    }
  }
  const posById = new Map(plan.messages.map((m, i) => [m.id, i]));
  const firstIdx = posById.get(chunk[0].id) ?? -1;
  const lastIdx = posById.get(chunk[chunk.length - 1].id) ?? -1;
  const chunkLabel = `messages ${firstIdx + 1}-${lastIdx + 1} of ${plan.messages.length}`;
  const lore = !buildUserText || wantLore ? await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile)) : null;
  const storySoFar = buildUserText ? null : await storySoFarText(chatId, userId, profile, firstIdx, posById);
  appendStreamText(userId, chatId, "codex", "text", `${progress.chars > 0 ? `

` : ""}\u2501\u2501\u2501 ${chunkLabel} \u2501\u2501\u2501
`);
  const result = await runCodexAgent({
    chatId,
    userId,
    profile,
    promptCtx,
    bundle,
    chunk: plan.messages.slice(firstIdx, lastIdx + 1),
    chunkLabel,
    chunkFirstIndex: firstIdx,
    notes,
    lore,
    storySoFar,
    timelineAppendOnly: !notes.reconcile,
    ...buildUserText ? { userTextOverride: buildUserText(promptCtx, bundle, notes, chunkLabel, lore) } : {},
    progressBase: progress,
    externalSignal,
    onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
    onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
  });
  if (notes.migrateToInline) {
    const lockedIds = new Set(["characters", "locations", "things"].flatMap((k) => bundle[k].entities.filter((e) => e.locked === true).map((e) => e.id)));
    const stuck = bundle.relations.relations.filter((r) => (r.type === "pair" ? [r.a, r.b] : r.members).every((m) => lockedIds.has(m))).length;
    if (stuck > 0) {
      cb2?.onToast(userId, "warn", `${stuck} relation${stuck === 1 ? "" : "s"} between locked entries could not be folded onto their sheets and will be dropped`);
    }
    await saveCodexFile(chatId, "relations", { relations: [] }, userId).catch((err) => warn(`codex: failed to clear relations.json after inline migration: ${describeError(err)}`));
  }
  for (let i = plan.startPos;i <= lastIdx; i++) {
    const m = plan.messages[i];
    plan.cursor.consumedSigs.push({ id: m.id, sig: msgSig(m.role, m.content || "") });
  }
  plan.cursor.lastMsgId = plan.messages[lastIdx].id;
  const reconcileUntilPos = plan.cursor.reconcileUntilMsgId ? plan.messages.findIndex((m) => m.id === plan.cursor.reconcileUntilMsgId) : -1;
  if (!plan.cursor.reconcileUntilMsgId || reconcileUntilPos !== -1 && lastIdx >= reconcileUntilPos) {
    plan.cursor.pendingReconcile = false;
    plan.cursor.reconcileUntilMsgId = null;
  }
  invalidateCodexInjectionCache(chatId);
  await withCursorLock(chatId, userId, async () => {
    const liveCursor = await loadCursor(chatId, userId).catch((err) => {
      warn(`codex: live cursor re-read failed before save: ${describeError(err)}`);
      return null;
    });
    if (liveCursor) {
      plan.cursor.fileStates = liveCursor.fileStates;
      plan.cursor.frozenAtRuns = liveCursor.frozenAtRuns;
    }
    plan.cursor.relationsTableMode = profile.codexRelationsTable;
    plan.cursor.lastRunAt = Date.now();
    plan.cursor.lastRunStats = {
      rounds: result.rounds,
      promptTokens: result.usagePromptTokens,
      completionTokens: result.usageCompletionTokens,
      model: result.model,
      ...result.doneNote ? { note: result.doneNote } : {}
    };
    plan.cursor.runs += 1;
    await saveCursor(chatId, plan.cursor, userId);
  });
  await publishCodexPool(chatId, userId, profile, result.changedFiles, "run");
  await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
  if (result.changedFiles.length > 0) {
    cb2?.onToast(userId, "success", `Memoria updated the codex (${result.changedFiles.length} file${result.changedFiles.length === 1 ? "" : "s"})`, automation);
  }
  cb2?.onStateChange(userId, chatId);
}
async function drain(chatId, userId, profile, lagValue, requireWindow, automation) {
  if (!setBusy(userId, chatId, "codex", "Memoria is updating the codex"))
    return null;
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    let runs = 0;
    const progress = { chars: 0, thinking: 0 };
    const DRAIN_PASS_CAP = 500;
    let prevStartPos = -1;
    for (let pass = 0;pass < DRAIN_PASS_CAP; pass++) {
      if (controller.signal.aborted)
        throw new AbortedSummarizerError;
      const plan = await planRun(chatId, userId, profile.codexLagUnit, lagValue);
      if (plan.compressible.length === 0)
        break;
      if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
        break;
      if (requireWindow && !windowReached(plan.compressible, profile))
        break;
      if (plan.rewound) {
        prevStartPos = plan.startPos - 1;
      } else if (plan.startPos <= prevStartPos) {
        warn(`codex drain stalled at message ${plan.startPos + 1} for ${chatId.slice(0, 8)} after ${runs} pass${runs === 1 ? "" : "es"}, stopping`);
        break;
      }
      prevStartPos = plan.startPos;
      const chunk = takeWindow(plan.compressible, profile.codexWindowUnit, profile.codexWindowValue, profile.codexTokenBreakpoint);
      await runChunk(chatId, userId, profile, plan, chunk, automation, controller.signal, progress);
      runs++;
    }
    return runs;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
async function maybeRunCodex(chatId, profile, settings, userId) {
  if (!settings.enabled || !profile.codexEnabled)
    return;
  if (await forkCodexPending(chatId, userId).catch(() => false))
    return;
  await ensureCodexEntriesSynced(chatId, userId, profile);
  try {
    await drain(chatId, userId, profile, profile.codexLagValue, true, true);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", "Memoria closes the codex for now");
      return;
    }
    warn(`codex auto run failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "update", err);
  }
}
var CONTEXT_ERROR_RE = /context[ _](?:window|length|size|limit)|maximum context|prompt is too long|too many tokens|max(?:imum)? (?:input )?tokens|token limit|input is too (?:long|large)/i;
async function runCodexNow(chatId, profile, userId, mode = "slow", settings = null) {
  if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === chatId)) {
    cb2?.onToast(userId, "warn", "Memoria is already updating the codex");
    return;
  }
  if (await forkCodexPending(chatId, userId).catch(() => false)) {
    cb2?.onToast(userId, "info", "Memoria is still carrying the codex into this fork, try again in a moment");
    return;
  }
  await ensureCodexEntriesSynced(chatId, userId, profile);
  try {
    const runs = mode === "slow" ? await drain(chatId, userId, profile, 0, false, false) : await catchupCodex(chatId, profile, settings, userId, mode);
    if (runs === 0) {
      const cursor = await loadCursor(chatId, userId).catch(() => null);
      if (cursor && CODEX_FILE_KEYS.every((k) => cursor.fileStates[k] === "frozen")) {
        cb2?.onToast(userId, "info", "Every codex record is frozen, unfreeze one so Memoria can update it");
        return;
      }
      const swept = await maybeReconcileSweep(chatId, profile, userId);
      if (!swept)
        cb2?.onToast(userId, "info", "The codex is already caught up");
    }
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", "Memoria closes the codex for now");
      return;
    }
    warn(`codex manual run failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "update", err);
    if (mode !== "slow" && !(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb2?.onToast(userId, "warn", "Fast catch-up needs the codex model's context to be at least the story model's, pick a larger context codex connection or use slow mode");
    }
  }
}
var CATCHUP_PASS_CAP = 200;
function liveSpan(e, posById) {
  let start = Number.MAX_SAFE_INTEGER;
  let end = -1;
  for (const id of e.meta.msgIds) {
    const p = posById.get(id);
    if (p === undefined)
      continue;
    if (p < start)
      start = p;
    if (p > end)
      end = p;
  }
  return { start, end };
}
function entryBlock(e) {
  const head = (e.raw.comment || "").trim();
  const text = (e.raw.content || "").trim();
  return head ? `[${head}]
${text}` : text;
}
function nextSummaryBatch(plan, chapters, profile) {
  const posById = new Map(plan.messages.map((m, i) => [m.id, i]));
  const spans = chapters.map((e) => ({ e, ...liveSpan(e, posById) })).filter((s) => s.end >= plan.startPos && s.start !== Number.MAX_SAFE_INTEGER).sort((a, b) => a.start - b.start || a.end - b.end);
  if (spans.length === 0)
    return null;
  const budget = Math.max(4000, profile.codexTokenBreakpoint);
  const blocks = [];
  let used = 0;
  let pos = plan.startPos;
  let endIdx = -1;
  for (const s of spans) {
    if (s.end < pos)
      continue;
    if (s.start > pos) {
      let gapEnd = s.start - 1;
      if (blocks.length === 0) {
        let acc = 0;
        for (let i = pos;i < s.start; i++) {
          acc += approximateTokensFromChars((plan.messages[i].content || "").length);
          if (acc >= budget && i < s.start - 1) {
            gapEnd = i;
            break;
          }
        }
      }
      const gapText = renderTranscript(plan.messages.slice(pos, gapEnd + 1), true, pos);
      if (gapText.trim()) {
        const gapTokens = approximateTokensFromChars(gapText.length);
        if (blocks.length > 0 && used + gapTokens > budget)
          break;
        blocks.push(`RAW TURNS (no chapter covers messages ${pos + 1}-${gapEnd + 1} of ${plan.messages.length}):
${gapText}`);
        used += gapTokens;
      }
      pos = gapEnd + 1;
      endIdx = Math.max(endIdx, gapEnd);
      if (gapEnd < s.start - 1)
        break;
      if (used >= budget)
        break;
    }
    const block = entryBlock(s.e);
    const tokens = approximateTokensFromChars(block.length);
    if (blocks.length > 0 && used + tokens > budget)
      break;
    blocks.push(block);
    used += tokens;
    pos = Math.max(pos, s.end + 1);
    endIdx = Math.max(endIdx, s.end);
    if (used >= budget)
      break;
  }
  if (endIdx < plan.startPos || blocks.length === 0)
    return null;
  return { endIdx, blocks };
}
async function activeStoryContext(chatId, userId, messages) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries, true);
  const posById = new Map(messages.map((m, i) => [m.id, i]));
  const items = coverage.activeEntries.map((e) => {
    const s = liveSpan(e, posById);
    return { pos: s.start !== Number.MAX_SAFE_INTEGER ? s.start : e.meta.firstMsgIdx ?? 0, text: entryBlock(e) };
  }).filter((b) => b.text);
  let lastCovered = -1;
  for (let i = 0;i < messages.length; i++) {
    if (coverage.coveredBy.has(messages[i].id))
      lastCovered = i;
  }
  const tailStart = lastCovered + 1;
  let runStart = -1;
  let runHasContent = false;
  const flushRun = (endIdx) => {
    if (runStart !== -1 && runHasContent) {
      const text = renderTranscript(messages.slice(runStart, endIdx + 1), true, runStart);
      if (text.trim()) {
        items.push({ pos: runStart, text: `RAW TURNS (no summary covers messages ${runStart + 1}-${endIdx + 1}):
${text}` });
      }
    }
    runStart = -1;
    runHasContent = false;
  };
  for (let i = 0;i < tailStart; i++) {
    const m = messages[i];
    if (coverage.coveredBy.has(m.id)) {
      flushRun(i - 1);
      continue;
    }
    if (runStart === -1)
      runStart = i;
    if ((m.content || "").trim() && !isExcluded(m))
      runHasContent = true;
  }
  flushRun(tailStart - 1);
  const books = items.sort((a, b) => a.pos - b.pos).map((b) => b.text);
  const tailText = tailStart < messages.length ? renderTranscript(messages.slice(tailStart), true, tailStart) : "";
  return { books, tailTranscript: tailText.trim() ? tailText : null };
}
async function catchupCodex(chatId, profile, settings, userId, mode) {
  if (!setBusy(userId, chatId, "codex", `Memoria is catching up the codex (${mode === "ultra" ? "ultra fast" : "fast"})`)) {
    cb2?.onToast(userId, "warn", "Memoria is already working on the codex");
    return null;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    controller.signal.addEventListener("abort", () => {
      abortBusy(userId, chatId, "chapter");
      abortBusy(userId, chatId, "arc");
    }, { once: true });
    const shelfPending = await forkShelfPending(chatId, userId).catch(() => false);
    if (settings && profile.autoCreate && !profile.showMemoryPreviews && !shelfPending) {
      await drainChapterBacklog(chatId, profile, settings, userId, true);
      await maybeRunArcCheck(chatId, profile, settings, userId, true);
    }
    if (controller.signal.aborted)
      throw new AbortedSummarizerError;
    const progress = { chars: 0, thinking: 0 };
    let runs = 0;
    if (mode === "fast") {
      const entries = await listLmbEntries(chatId, userId);
      const coverage = await buildCoverage(chatId, userId, entries, true);
      let prevStart = -1;
      for (let pass = 0;pass < CATCHUP_PASS_CAP; pass++) {
        if (controller.signal.aborted)
          throw new AbortedSummarizerError;
        const plan2 = await planRun(chatId, userId, profile.codexLagUnit, 0);
        if (plan2.compressible.length === 0)
          break;
        if (CODEX_FILE_KEYS.every((k) => plan2.cursor.fileStates[k] === "frozen"))
          break;
        if (!plan2.rewound && plan2.startPos <= prevStart) {
          warn(`codex fast catch-up stalled at message ${plan2.startPos + 1} for ${chatId.slice(0, 8)}, stopping`);
          break;
        }
        prevStart = plan2.startPos;
        const batch = nextSummaryBatch(plan2, coverage.chapters, profile);
        if (!batch)
          break;
        await runChunk(chatId, userId, profile, plan2, plan2.messages.slice(plan2.startPos, batch.endIdx + 1), false, controller.signal, progress, (ctx, bundle, notes, label) => buildCodexSummaryCatchupMessage(ctx, bundle, batch.blocks, label, notes));
        runs++;
      }
    }
    const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
    if (plan.compressible.length === 0)
      return runs;
    if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
      return runs;
    if (mode === "ultra") {
      const { books, tailTranscript } = await activeStoryContext(chatId, userId, plan.messages);
      await runChunk(chatId, userId, profile, plan, plan.messages.slice(plan.startPos), false, controller.signal, progress, (ctx, bundle, notes, label, lore) => buildCodexUltraMessage(ctx, bundle, books, tailTranscript, label, notes, lore), true);
    } else {
      await runChunk(chatId, userId, profile, plan, plan.compressible, false, controller.signal, progress);
    }
    return runs + 1;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
async function maybeReconcileSweep(chatId, profile, userId) {
  const plan = await planRun(chatId, userId, profile.codexLagUnit, 0);
  if (plan.compressible.length > 0 || !plan.reconcile)
    return false;
  if (await codexPresence(chatId, userId) !== "present")
    return false;
  if (plan.cursor.relationsTableMode !== null && plan.cursor.relationsTableMode !== profile.codexRelationsTable)
    return false;
  if (CODEX_FILE_KEYS.every((k) => plan.cursor.fileStates[k] === "frozen"))
    return false;
  if (!setBusy(userId, chatId, "codex", "Memoria is reconciling the codex with the edited story"))
    return false;
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const diskMode = plan.cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, plan.messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const frozen = new Set(CODEX_FILE_KEYS.filter((k) => plan.cursor.fileStates[k] === "frozen"));
    const notes = {
      reconcile: true,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`)
    };
    const sweepSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, sweepSettings.customPresets, frozen);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexReconcileMessage(promptCtx, bundle, books, tailTranscript, notes, lore),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    await withCursorLock(chatId, userId, async () => {
      const liveCursor = await loadCursor(chatId, userId).catch((err) => {
        warn(`codex: live cursor re-read failed before sweep save: ${describeError(err)}`);
        return null;
      });
      if (liveCursor) {
        plan.cursor.fileStates = liveCursor.fileStates;
        plan.cursor.frozenAtRuns = liveCursor.frozenAtRuns;
        plan.cursor.refreshPending = liveCursor.refreshPending;
      }
      plan.cursor.pendingReconcile = false;
      plan.cursor.reconcileUntilMsgId = null;
      plan.cursor.lastRunAt = Date.now();
      plan.cursor.lastRunStats = {
        rounds: result.rounds,
        promptTokens: result.usagePromptTokens,
        completionTokens: result.usageCompletionTokens,
        model: result.model,
        ...result.doneNote ? { note: result.doneNote } : {}
      };
      plan.cursor.runs += 1;
      await saveCursor(chatId, plan.cursor, userId);
    });
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "run");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb2?.onToast(userId, "success", result.changedFiles.length > 0 ? `Memoria reconciled the codex with the edited story (${result.changedFiles.length} file${result.changedFiles.length === 1 ? "" : "s"})` : "Memoria checked the codex against the edited story and everything still holds");
    cb2?.onStateChange(userId, chatId);
    return true;
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
var INJECTION_CACHE_TTL_MS = 60000;
var INJECTION_CACHE_CAP = 200;
var injectionTextCache = new Map;
var fileTokensCache = new Map;
function invalidateCodexInjectionCache(chatId) {
  if (chatId) {
    injectionTextCache.delete(chatId);
    fileTokensCache.delete(chatId);
  } else {
    injectionTextCache.clear();
    fileTokensCache.clear();
  }
}
async function getCodexFileTokens(chatId, userId, profile) {
  const cached = fileTokensCache.get(chatId);
  if (cached && Date.now() - cached.at < INJECTION_CACHE_TTL_MS)
    return cached.tokens;
  const tokens = {};
  let exists;
  try {
    exists = await codexPresence(chatId, userId) === "present";
  } catch (err) {
    warn(`codex file tokens skipped, storage fault: ${describeError(err)}`);
    return tokens;
  }
  if (exists) {
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const sections = renderCodexFileSections(bundle);
    for (const key2 of CODEX_FILE_KEYS) {
      tokens[key2] = sections[key2] ? approximateTokensFromChars(sections[key2].length) : 0;
    }
  }
  fileTokensCache.set(chatId, { at: Date.now(), tokens });
  while (fileTokensCache.size > INJECTION_CACHE_CAP) {
    const oldest = fileTokensCache.keys().next().value;
    if (oldest === undefined)
      break;
    fileTokensCache.delete(oldest);
  }
  return tokens;
}
async function buildCodexInjectionText(chatId, userId, profile) {
  if (!profile.codexEnabled)
    return null;
  const cached = injectionTextCache.get(chatId);
  if (cached && Date.now() - cached.at < INJECTION_CACHE_TTL_MS)
    return cached.text;
  let exists;
  try {
    exists = await codexPresence(chatId, userId) === "present";
  } catch (err) {
    warn(`codex injection text skipped, storage fault: ${describeError(err)}`);
    return null;
  }
  let text = null;
  if (exists) {
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    for (const key2 of CODEX_FILE_KEYS) {
      const st = cursor.fileStates[key2];
      if (st === "noInject" || st === "frozen") {
        bundle[key2] = emptyCodexFile(key2);
      }
    }
    text = bundleIsEmpty(bundle) ? null : renderCodexForInjection(bundle) || null;
  }
  if (injectionTextCache.has(chatId))
    injectionTextCache.delete(chatId);
  injectionTextCache.set(chatId, { at: Date.now(), text });
  while (injectionTextCache.size > INJECTION_CACHE_CAP) {
    const oldest = injectionTextCache.keys().next().value;
    if (oldest === undefined)
      break;
    injectionTextCache.delete(oldest);
  }
  return text;
}
async function publishCodexPool(chatId, userId, profile, changedFiles, reason) {
  try {
    let presence;
    try {
      presence = await codexPresence(chatId, userId);
    } catch (err) {
      warn(`codex pool publish skipped, storage fault: ${describeError(err)}`);
      return;
    }
    if (presence === "absent") {
      publishCodexWiped(chatId, userId);
      return;
    }
    const cursor = await loadCursor(chatId, userId);
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const rendered = await buildCodexInjectionText(chatId, userId, profile);
    publishCodexSnapshot(chatId, {
      chatId,
      userId,
      files: bundle,
      fileStates: cursor.fileStates,
      runs: cursor.runs,
      updatedAt: Date.now()
    }, rendered);
    publishCodexUpdated({ chatId, userId, changedFiles, reason });
  } catch (err) {
    warn(`codex pool publish failed: ${describeError(err)}`);
  }
}
async function getCodexPanelState(chatId, userId) {
  const exists = await codexExists(chatId, userId);
  if (!exists)
    return { fileStates: {}, staleFiles: [], refreshPending: [] };
  const cursor = await loadCursor(chatId, userId);
  const staleFiles = [];
  for (const [file, st] of Object.entries(cursor.fileStates)) {
    if (st !== "frozen")
      continue;
    const at = cursor.frozenAtRuns[file];
    if (typeof at === "number" && cursor.runs > at)
      staleFiles.push(file);
  }
  return { fileStates: cursor.fileStates, staleFiles, refreshPending: cursor.refreshPending };
}
async function setCodexFileState(chatId, userId, file, state, relationsTableFallback) {
  await withCursorLock(chatId, userId, async () => {
    const cursor = await loadCursor(chatId, userId);
    const prevState = cursor.fileStates[file] ?? "on";
    if (state === "on")
      delete cursor.fileStates[file];
    else
      cursor.fileStates[file] = state;
    if (state === "frozen") {
      cursor.frozenAtRuns[file] = cursor.runs;
      cursor.refreshPending = cursor.refreshPending.filter((f) => f !== file);
    } else {
      const at = cursor.frozenAtRuns[file];
      if (prevState === "frozen" && typeof at === "number" && cursor.runs > at && !cursor.refreshPending.includes(file)) {
        cursor.refreshPending.push(file);
      }
      delete cursor.frozenAtRuns[file];
    }
    await saveCursor(chatId, cursor, userId);
  });
  invalidateCodexInjectionCache(chatId);
  await syncEntriesGuarded(chatId, userId, relationsTableFallback);
}
async function rebuildCodex(chatId, profile, userId, mode = "slow", settings = null) {
  if (!setBusy(userId, chatId, "codex", "Memoria is clearing the codex for a rebuild")) {
    cb2?.onToast(userId, "warn", "Memoria is already working on the codex, abort that first");
    return;
  }
  try {
    let cursorFault = null;
    let frozenKeys = new Set;
    await withCursorLock(chatId, userId, async () => {
      let prev;
      try {
        prev = await loadCursor(chatId, userId);
      } catch (err) {
        cursorFault = err;
        return;
      }
      frozenKeys = new Set(CODEX_FILE_KEYS.filter((k) => prev.fileStates[k] === "frozen"));
      const fresh = emptyCursor();
      fresh.fileStates = prev.fileStates;
      for (const k of frozenKeys)
        fresh.frozenAtRuns[k] = 0;
      if (frozenKeys.size > 0)
        fresh.relationsTableMode = prev.relationsTableMode;
      await saveCursor(chatId, fresh, userId);
    });
    if (cursorFault !== null) {
      cb2?.onToast(userId, "error", `Memoria couldn't read the codex cursor, rebuild aborted: ${shortErrorText(cursorFault)}`);
      return;
    }
    const failed = [];
    for (const key2 of CODEX_FILE_KEYS) {
      if (frozenKeys.has(key2))
        continue;
      await saveCodexFile(chatId, key2, emptyCodexFile(key2), userId).catch(() => failed.push(key2));
    }
    invalidateCodexInjectionCache(chatId);
    if (failed.length > 0) {
      cb2?.onToast(userId, "error", `Memoria couldn't clear ${failed.length} codex file${failed.length === 1 ? "" : "s"}, run Rebuild again`);
      return;
    }
    publishCodexWiped(chatId, userId);
    await wipeCodexEntries(chatId, userId).catch((err) => {
      warn(`codex rebuild: entry wipe failed: ${describeError(err)}`);
      cb2?.onToast(userId, "error", `Memoria couldn't clear the codex lorebook entries: ${shortErrorText(err)}`);
    });
  } finally {
    clearBusy(userId, chatId, "codex");
  }
  await runCodexNow(chatId, profile, userId, mode, settings);
}
async function runCodexTidy(chatId, profile, userId, only) {
  if (!setBusy(userId, chatId, "codex", "Memoria is tidying the codex")) {
    cb2?.onToast(userId, "warn", "Memoria is already working on the codex");
    return;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb2?.onToast(userId, "warn", "The relations format changed, run Update now first so Memoria can migrate the codex before tidying");
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const frozenFiles = new Set(CODEX_FILE_KEYS.filter((k) => cursor.fileStates[k] === "frozen"));
    const broken = new Set(problems.map((p) => p.file));
    const targets = (only ?? [...CODEX_FILE_KEYS]).filter((k) => !frozenFiles.has(k) && !broken.has(k) && !fileIsEmpty(bundle, k));
    if (targets.length === 0) {
      cb2?.onToast(userId, "info", "Nothing to tidy, those records are empty, frozen, or unreadable");
      return;
    }
    const tidySettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, tidySettings.customPresets, frozenFiles);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes: { reconcile: false, migrateToTable: false, migrateToInline: false, loadProblems: [] },
      lore: null,
      storySoFar: null,
      userTextOverride: buildCodexTidyMessage(promptCtx, bundle, targets),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    if (result.changedFiles.length > 0) {
      await publishCodexPool(chatId, userId, profile, result.changedFiles, "tidy");
      await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
      cb2?.onToast(userId, "success", `Memoria tidied ${result.changedFiles.length} codex file${result.changedFiles.length === 1 ? "" : "s"}`);
    } else {
      cb2?.onToast(userId, "info", "Memoria found nothing worth tightening");
    }
    cb2?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", "Memoria sets the tidying aside");
      return;
    }
    warn(`codex tidy failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "tidy", err);
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
async function refreshCodexFiles(chatId, profile, userId) {
  if (!setBusy(userId, chatId, "codex", "Memoria is catching up re-enabled records")) {
    cb2?.onToast(userId, "warn", "Memoria is already working on the codex");
    return;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb2?.onToast(userId, "warn", "The relations format changed, run Update now first so Memoria can migrate before catching records up");
      return;
    }
    const frozen = new Set(CODEX_FILE_KEYS.filter((k) => cursor.fileStates[k] === "frozen"));
    const targets = cursor.refreshPending.filter((f) => isCodexFileKey(f) && !frozen.has(f));
    if (targets.length === 0) {
      cb2?.onToast(userId, "info", "No re-enabled records are waiting for a catch-up");
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const messages = await spindle.chat.getMessages(chatId);
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const notes = {
      reconcile: false,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`)
    };
    const refreshSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, refreshSettings.customPresets, frozen);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexRefreshMessage(promptCtx, bundle, targets, books, tailTranscript, notes, lore),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    await withCursorLock(chatId, userId, async () => {
      const live = await loadCursor(chatId, userId);
      live.refreshPending = live.refreshPending.filter((f) => !targets.includes(f));
      await saveCursor(chatId, live, userId);
    });
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "refresh");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb2?.onToast(userId, "success", `Memoria caught up ${targets.length} record${targets.length === 1 ? "" : "s"}`);
    cb2?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", "Memoria sets the catch-up aside");
      return;
    }
    warn(`codex refresh failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "refresh", err);
    if (!(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb2?.onToast(userId, "warn", "The catch-up pass needs the codex model's context to be at least the story model's, pick a larger context codex connection or use Rebuild in slow mode");
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}
function fileIsEmpty(bundle, key2) {
  const v = bundle[key2];
  return Object.values(v).every((arr) => !Array.isArray(arr) || arr.length === 0);
}
function blankTargets(bundle, targets) {
  const out = { ...bundle };
  for (const t of targets) {
    if (t === "characters" || t === "locations" || t === "things") {
      out[t] = {
        entities: bundle[t].entities.filter((e) => e.locked === true || Array.isArray(e.lockedFields) && e.lockedFields.length > 0)
      };
    } else {
      out[t] = emptyCodexFile(t);
    }
  }
  return out;
}
async function rebuildCodexFiles(chatId, profile, userId, only) {
  if (!setBusy(userId, chatId, "codex", "Memoria is rebuilding codex records")) {
    cb2?.onToast(userId, "warn", "Memoria is already working on the codex");
    return;
  }
  const controller = new AbortController;
  registerAborter(userId, chatId, "codex", controller);
  try {
    const cursor = await loadCursor(chatId, userId);
    if (cursor.relationsTableMode !== null && cursor.relationsTableMode !== profile.codexRelationsTable) {
      cb2?.onToast(userId, "warn", "The relations format changed, run Update now first so Memoria can migrate before rebuilding records");
      return;
    }
    const frozen = new Set(CODEX_FILE_KEYS.filter((k) => cursor.fileStates[k] === "frozen"));
    const targets = only.filter((k) => !frozen.has(k));
    if (targets.length === 0) {
      cb2?.onToast(userId, "info", "Those records are frozen, unfreeze them first");
      return;
    }
    const diskMode = cursor.relationsTableMode ?? profile.codexRelationsTable;
    const { bundle, problems } = await loadCodex(chatId, userId, { relationsTable: diskMode });
    const messages = await spindle.chat.getMessages(chatId);
    const { books, tailTranscript } = await activeStoryContext(chatId, userId, messages);
    const lore = await activatedLoreText(chatId, userId, effectiveLoreLimitTokens(profile));
    const notes = {
      reconcile: false,
      migrateToTable: false,
      migrateToInline: false,
      loadProblems: problems.map((p) => `${p.file}.json`)
    };
    const rebuildSettings = await loadSettings(userId);
    const promptCtx = makeCodexPromptCtx(profile, rebuildSettings.customPresets, frozen);
    const promptBundle = blankTargets(bundle, targets);
    const result = await runCodexAgent({
      chatId,
      userId,
      profile,
      promptCtx,
      bundle,
      chunk: [],
      chunkLabel: "",
      chunkFirstIndex: 0,
      notes,
      lore,
      storySoFar: null,
      userTextOverride: buildCodexRebuildMessage(promptCtx, promptBundle, targets, books, tailTranscript, notes, lore),
      skipVerify: true,
      externalSignal: controller.signal,
      onProgress: (chars, thinking) => updateProgressNumbers(userId, chatId, "codex", chars, thinking),
      onDelta: (kind, delta) => appendStreamText(userId, chatId, "codex", kind, delta)
    });
    invalidateCodexInjectionCache(chatId);
    await publishCodexPool(chatId, userId, profile, result.changedFiles, "refresh");
    await syncEntriesGuarded(chatId, userId, profile.codexRelationsTable);
    cb2?.onToast(userId, "success", `Memoria rebuilt ${targets.length} record${targets.length === 1 ? "" : "s"} from the story`);
    cb2?.onStateChange(userId, chatId);
  } catch (err) {
    if (err instanceof AbortedSummarizerError) {
      cb2?.onToast(userId, "info", "Memoria sets the rebuild aside");
      return;
    }
    warn(`codex record rebuild failed: ${describeError(err)}`);
    reportCodexFailure(userId, chatId, "rebuild", err);
    if (!(err instanceof CodexContextError) && CONTEXT_ERROR_RE.test(describeError(err))) {
      cb2?.onToast(userId, "warn", "The rebuild pass needs the codex model's context to be at least the story model's, pick a larger context codex connection");
    }
  } finally {
    clearBusy(userId, chatId, "codex");
  }
}

// src/backend/rebase.ts
var inFlight = new Set;
function lockKey(userId, chatId) {
  return `${userId}::${chatId}`;
}
function ownEntries(entries) {
  return entries.filter((e) => !e.meta.isRoot);
}
function computeNegativeOrder(entries) {
  const sorted = [...entries].sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const n = sorted.length;
  const order = new Map;
  sorted.forEach((e, i) => order.set(e.raw.id, -(n - i)));
  return order;
}
async function seedRoot(targetChatId, sourceChatId, sourceEntries, existingRoots, userId) {
  const book = await ensureBookForChat(targetChatId, userId);
  const negIdx = computeNegativeOrder(sourceEntries);
  const transform = (entry) => {
    const idx = negIdx.get(entry.raw.id);
    const baseComment = entry.raw.comment || "";
    return {
      msgIds: entry.meta.msgIds.slice(),
      firstMsgIdx: idx,
      lastMsgIdx: idx,
      extra: { chatId: targetChatId, isRoot: true, rootOrigin: sourceChatId },
      comment: baseComment.startsWith("[Root]") ? baseComment : `[Root] ${baseComment}`.trim()
    };
  };
  const idMap = await copyLmbEntries(book.id, sourceEntries, userId, transform);
  for (const r of existingRoots) {
    await deleteEntry(r.raw.id, userId).catch((err) => warn(`rebase: failed to drop old root ${r.raw.id}: ${describeError(err)}`));
  }
  invalidateBookCache(userId, targetChatId);
  invalidateRootCandidates(userId);
  info(`rebased ${targetChatId.slice(0, 8)} onto root from ${sourceChatId.slice(0, 8)} (${idMap.size} entries)`);
  return { count: idMap.size, newIds: new Set(idMap.values()) };
}
async function rebaseRoot(targetChatId, sourceChatId, userId) {
  if (sourceChatId === targetChatId)
    return { ok: false, reason: "same_chat" };
  const key2 = lockKey(userId, targetChatId);
  if (inFlight.has(key2))
    return { ok: false, reason: "busy" };
  inFlight.add(key2);
  try {
    const targetEntries = await listLmbEntries(targetChatId, userId);
    if (ownEntries(targetEntries).some((e) => !e.raw.disabled))
      return { ok: false, reason: "has_own" };
    const sourceEntries = (await listLmbEntries(sourceChatId, userId)).filter((e) => !e.raw.disabled);
    if (sourceEntries.length === 0)
      return { ok: false, reason: "empty_source" };
    const existingRoots = targetEntries.filter((e) => e.meta.isRoot);
    const { count } = await seedRoot(targetChatId, sourceChatId, sourceEntries, existingRoots, userId);
    return { ok: true, count };
  } finally {
    inFlight.delete(key2);
  }
}
async function rebuildRoot(targetChatId, sourceChatId, userId) {
  if (sourceChatId === targetChatId)
    return { ok: false, reason: "same_chat" };
  const key2 = lockKey(userId, targetChatId);
  if (inFlight.has(key2))
    return { ok: false, reason: "busy" };
  inFlight.add(key2);
  try {
    const sourceEntries = (await listLmbEntries(sourceChatId, userId)).filter((e) => !e.raw.disabled);
    if (sourceEntries.length === 0)
      return { ok: false, reason: "empty_source" };
    const { count, newIds } = await seedRoot(targetChatId, sourceChatId, sourceEntries, [], userId);
    const after = await listLmbEntries(targetChatId, userId);
    const survivors = [];
    for (const e of after) {
      if (newIds.has(e.raw.id))
        continue;
      try {
        await deleteEntry(e.raw.id, userId);
      } catch (err) {
        warn(`rebuild: failed to delete ${e.raw.id}: ${describeError(err)}`);
        survivors.push(e);
      }
    }
    for (const e of survivors) {
      await setEntryDisabled(e.raw.id, true, userId).catch(() => {});
    }
    invalidateBookCache(userId, targetChatId);
    invalidateRootCandidates(userId);
    return { ok: true, count };
  } finally {
    inFlight.delete(key2);
  }
}
async function detachRoot(targetChatId, userId) {
  const entries = await listLmbEntries(targetChatId, userId);
  const roots = entries.filter((e) => e.meta.isRoot);
  for (const r of roots) {
    await deleteEntry(r.raw.id, userId).catch((err) => warn(`detach: failed to delete root ${r.raw.id}: ${describeError(err)}`));
  }
  if (roots.length > 0) {
    invalidateBookCache(userId, targetChatId);
    invalidateRootCandidates(userId);
  }
  return roots.length;
}

// src/backend/state.ts
async function buildState(userId, requestedChatId) {
  const settings = await loadSettings(userId);
  const activeProfile = settings.profiles.find((p) => p.id === settings.activeProfileId) ?? settings.profiles[0];
  const lessons = await ensureLessons(userId);
  const codexProfile = effectiveProfile(activeProfile, lessons);
  let chat;
  if (requestedChatId) {
    chat = await spindle.chats.get(requestedChatId, userId).catch(() => null);
  } else {
    chat = await spindle.chats.getActive(userId).catch(() => null);
  }
  const [connectionsRaw, regexScriptsRaw, rootCandidatesRaw] = await Promise.all([
    listConnections(userId),
    listRegexScripts(userId),
    listRootCandidates(userId).catch(() => [])
  ]);
  const connections = connectionsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    model: c.model,
    isDefault: c.is_default,
    hasApiKey: c.has_api_key
  }));
  const regexScripts = regexScriptsRaw.map((s) => ({ id: s.id, name: s.name }));
  const allRootCandidates = rootCandidatesRaw.map((c) => ({
    chatId: c.chatId,
    chatName: c.chatName,
    entryCount: c.entryCount
  }));
  const resolved = await resolveConnection(activeProfile, userId).catch(() => null);
  const baseState = {
    activeChatId: null,
    activeChatName: null,
    activeCharacterId: null,
    activeCharacterName: null,
    settings,
    activeProfile,
    chapters: [],
    arcs: [],
    volumes: [],
    bookId: null,
    bookName: null,
    connections,
    resolvedSidecarConnectionId: resolved?.id ?? null,
    coverage: {
      totalMessages: 0,
      coveredMessages: 0,
      uncoveredMessages: 0,
      approxUncoveredTokens: 0,
      lagSatisfied: false,
      windowAvailable: false
    },
    busy: getBusy(userId),
    lastFailure: null,
    messages: [],
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: settings.customPresets,
    regexScripts,
    pendingPreviews: [],
    backlogChapters: 0,
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: allRootCandidates,
    codexExists: false,
    codexBacklog: 0,
    codexBacklogPasses: 0,
    codexLastRunAt: null,
    codexInjectedTokens: 0,
    codexFileStates: {},
    codexStaleFiles: [],
    codexRefreshPending: [],
    codexFileTokens: {},
    lessons
  };
  if (!chat)
    return baseState;
  if (settings.enabled) {
    await ensureForkAdoption(chat.id, userId).catch(() => {});
    await reassertChatBinding(chat.id, userId).catch(() => {});
  }
  const bookId = await findBookForChat(chat.id, userId);
  const bookName = bookId !== null ? (await spindle.world_books.get(bookId, userId).catch(() => null))?.name ?? null : null;
  let messages = [];
  try {
    messages = await spindle.chat.getMessages(chat.id);
  } catch (err) {
    warn(`failed to read messages for chat ${chat.id.slice(0, 8)}: ${describeError(err)}`);
  }
  const entries = await listLmbEntries(chat.id, userId).catch(() => []);
  const coverage = await buildCoverage(chat.id, userId, entries);
  const stats = computeCoverageStats(messages, coverage, activeProfile);
  const backlogCoverage = extraContextActive(activeProfile) ? await buildCoverage(chat.id, userId, entries, true) : coverage;
  const compressibleSize = countCompressibleEligible(messages, backlogCoverage, activeProfile);
  const windowDenom = Math.max(1, activeProfile.windowValue);
  const backlogChapters = Math.max(0, Math.floor(compressibleSize / windowDenom));
  const activeChapterEntries = coverage.activeEntries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot);
  const backlogArcs = countArcBacklog(activeChapterEntries, activeProfile);
  const supersededIds = new Set;
  for (const e of entries) {
    if (e.meta.tier !== 1 && !e.raw.disabled && Array.isArray(e.meta.sourceChapterEntryIds)) {
      for (const sid of e.meta.sourceChapterEntryIds)
        supersededIds.add(sid);
    }
  }
  const chapters = [];
  const arcs = [];
  const volumes = [];
  for (const e of entries) {
    const view = {
      entryId: e.raw.id,
      bookId: e.raw.world_book_id,
      comment: e.raw.comment || "",
      content: e.raw.content || "",
      meta: e.meta,
      active: !(supersededIds.has(e.raw.id) || e.raw.disabled),
      contentTokens: approximateTokensFromChars((e.raw.content || "").length),
      contentChars: (e.raw.content || "").length,
      sourceTokensInput: e.meta.tokenCountInput || 0,
      isRoot: !!e.meta.isRoot,
      isGhost: e.meta.ghost === true
    };
    if (e.meta.tier === 3) {
      volumes.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else if (e.meta.tier === 2) {
      arcs.push({ ...view, sourceChapterEntryIds: e.meta.sourceChapterEntryIds ?? [] });
    } else {
      chapters.push(view);
    }
  }
  chapters.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  arcs.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  volumes.sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  const messageStubs = messages.map((m) => {
    const covered = coverage.coveredBy.get(m.id) ?? null;
    const hidden = !!(m.extra && m.extra.hidden);
    const excluded = !!(m.metadata?.["lmb_excluded"] === true);
    const preview = (m.content || "").slice(0, 220).replace(/\s+/g, " ").trim();
    const charCount = (m.content || "").length;
    return {
      id: m.id,
      role: m.role,
      preview,
      charCount,
      approxTokens: approximateTokensFromChars(charCount),
      hidden,
      covered: !!covered,
      coveredByEntryId: covered,
      indexInChat: m.index_in_chat,
      excluded
    };
  });
  let characterName = null;
  if (chat.character_id) {
    try {
      const character = await spindle.characters.get(chat.character_id, userId);
      characterName = character?.name ?? null;
    } catch (_) {}
  }
  const codexStatus = await getCodexStatus(chat.id, userId, codexProfile).catch((err) => {
    warn(`codex status failed: ${describeError(err)}`);
    return { exists: false, backlog: 0, lastRunAt: null, backlogPasses: 0 };
  });
  const codexPanel = await getCodexPanelState(chat.id, userId).catch(() => ({ fileStates: {}, staleFiles: [], refreshPending: [] }));
  const codexFileTokens = await getCodexFileTokens(chat.id, userId, codexProfile).catch(() => ({}));
  const codexInjectedTokens = settings.enabled && codexProfile.codexEnabled ? ["timeline", "threads"].reduce((acc, k) => {
    const st = codexPanel.fileStates[k];
    if (st === "noInject" || st === "frozen")
      return acc;
    return acc + (codexFileTokens[k] ?? 0);
  }, 0) : 0;
  const rootEntries = entries.filter((e) => e.meta.isRoot);
  const rootOrigin = rootEntries.find((e) => e.meta.rootOrigin)?.meta.rootOrigin ?? null;
  const rootOriginName = rootOrigin ? allRootCandidates.find((c) => c.chatId === rootOrigin)?.chatName ?? rootOrigin.slice(0, 8) : null;
  return {
    ...baseState,
    activeChatId: chat.id,
    activeChatName: chat.name,
    activeCharacterId: chat.character_id,
    activeCharacterName: characterName,
    chapters,
    arcs,
    volumes,
    bookId,
    bookName,
    coverage: stats,
    lastFailure: getLastFailure(userId, chat.id),
    messages: messageStubs,
    pendingPreviews: getPendingPreviews(userId, chat.id),
    backlogChapters,
    backlogArcs,
    rootOrigin,
    rootOriginName,
    rootEntryCount: rootEntries.length,
    availableRoots: allRootCandidates.filter((c) => c.chatId !== chat.id),
    codexExists: codexStatus.exists,
    codexBacklog: codexStatus.backlog,
    codexBacklogPasses: codexStatus.backlogPasses,
    codexLastRunAt: codexStatus.lastRunAt,
    codexInjectedTokens,
    codexFileStates: codexPanel.fileStates,
    codexStaleFiles: codexPanel.staleFiles,
    codexRefreshPending: codexPanel.refreshPending,
    codexFileTokens
  };
}
function countArcBacklog(activeChapters, profile) {
  if (profile.arcTrigger === "manual")
    return 0;
  const chapters = activeChapters.slice().sort((a, b) => (a.meta.firstMsgIdx ?? 0) - (b.meta.firstMsgIdx ?? 0));
  if (profile.arcTrigger === "chapters") {
    const compressible2 = Math.max(0, chapters.length - profile.arcLagChapters);
    const denom = Math.max(1, profile.arcAfterChapters);
    return Math.floor(compressible2 / denom);
  }
  let reservedTokens = 0;
  let cutoff = chapters.length;
  for (let i = chapters.length - 1;i >= 0 && reservedTokens < profile.arcLagTokens; i--) {
    reservedTokens += chapters[i].meta.tokenCountOutput;
    cutoff = i;
  }
  const compressible = chapters.slice(0, cutoff);
  let arcs = 0;
  let acc = 0;
  for (const ch of compressible) {
    acc += ch.meta.tokenCountOutput;
    if (acc >= profile.arcAfterTokens) {
      arcs++;
      acc = 0;
    }
  }
  return arcs;
}

// src/backend/index.ts
async function notify(userId, tone, text, automation = false) {
  try {
    if (automation && tone !== "error") {
      const settings = await loadSettings(userId).catch(() => null);
      if (settings && !settings.showAutomationToasts)
        return;
    }
    if (tone === "error")
      error(`toast(error): ${text}`);
    send({ type: "toast", tone, text }, userId);
  } catch (err) {
    warn(`toast delivery failed: ${describeError(err)}`);
  }
}
var PUSH_DEBOUNCE_MS = 30;
var pushTimers = new Map;
var pendingPushChatIds = new Map;
var pendingPushResolvers = new Map;
async function doPushState(userId, chatId) {
  try {
    if (chatId) {
      const active = await spindle.chats.getActive(userId).catch(() => null);
      if (active && active.id !== chatId)
        return;
    }
    const state = await buildState(userId, chatId);
    if (chatId) {
      const active = await spindle.chats.getActive(userId).catch(() => null);
      if (active && active.id !== chatId)
        return;
    }
    send({ type: "state", state }, userId);
  } catch (err) {
    error(`pushState failed: ${describeError(err)}`);
    send({ type: "error", text: `LumiBooks state refresh failed: ${describeError(err)}` }, userId);
  }
}
function pushState(userId, chatId) {
  pendingPushChatIds.set(userId, chatId ?? null);
  const prev = pushTimers.get(userId);
  if (prev)
    clearTimeout(prev);
  return new Promise((resolve) => {
    const resolvers = pendingPushResolvers.get(userId) ?? [];
    resolvers.push(resolve);
    pendingPushResolvers.set(userId, resolvers);
    const timer = setTimeout(() => {
      pushTimers.delete(userId);
      const finalChatId = pendingPushChatIds.get(userId) ?? null;
      pendingPushChatIds.delete(userId);
      const waiting = pendingPushResolvers.get(userId) ?? [];
      pendingPushResolvers.delete(userId);
      doPushState(userId, finalChatId).finally(() => {
        for (const r of waiting) {
          try {
            r();
          } catch (_) {}
        }
      });
    }, PUSH_DEBOUNCE_MS);
    pushTimers.set(userId, timer);
  });
}
registerPipelineCallbacks({
  onBusyChange(userId, entries) {
    send({ type: "busy", entries }, userId);
  },
  onToast(userId, tone, text, automation) {
    notify(userId, tone, text, automation === true);
  },
  onStateChange(userId, chatId) {
    pushState(userId, chatId);
  },
  onStreamText(userId, chatId, kind, snap) {
    send({ type: "stream_text", chatId, kind, content: snap.content, thinking: snap.thinking, running: snap.running }, userId);
  }
});
registerCodexCallbacks({
  onToast(userId, tone, text, automation) {
    notify(userId, tone, text, automation === true);
  },
  onStateChange(userId, chatId) {
    pushState(userId, chatId);
  },
  onToolsHint(userId, chatId) {
    (async () => {
      const settings = await loadSettings(userId).catch(() => null);
      if (settings?.suppressToolCallingPrompt)
        return;
      send({ type: "codex_tools_hint", chatId }, userId);
    })();
  }
});
spindle.registerWorldInfoInterceptor(async (ctx) => {
  const ours = [];
  const codexIds = [];
  for (const entry of ctx.entries) {
    const ext = entry.extensions;
    if (!ext)
      continue;
    if (ext[EXTENSION_KEY])
      ours.push(entry.id);
    else if (ext[CODEX_ENTRY_EXTENSION_KEY])
      codexIds.push(entry.id);
  }
  if (codexIds.length > 0) {
    const userId = ctx.userId ?? resolveUserId(ctx.chatId);
    if (userId) {
      let gateTimer;
      const gate = (async () => {
        const settings = await loadSettings(userId);
        const rawProfile = settings.profiles.find((p) => p.id === settings.activeProfileId) ?? null;
        const profile = rawProfile ? effectiveProfile(rawProfile, await ensureLessons(userId)) : null;
        return !settings.enabled || !profile || !profile.codexEnabled;
      })();
      gate.catch(() => {});
      const deadline = new Promise((resolve) => {
        gateTimer = setTimeout(() => resolve("timeout"), 1500);
      });
      try {
        const off = await Promise.race([gate, deadline]);
        if (off === "timeout") {
          warn("world-info codex gate timed out, leaving codex entries active this turn");
        } else if (off) {
          ours.push(...codexIds);
        }
      } catch (err) {
        warn(`world-info codex gate failed, leaving codex entries active: ${describeError(err)}`);
      } finally {
        if (gateTimer)
          clearTimeout(gateTimer);
      }
    }
  }
  return ours.length ? { disabled: ours } : undefined;
}, 90);
var INJECTION_BUDGET_MS = 3000;
spindle.registerInterceptor(async (messages, context) => {
  try {
    const chatId = context && typeof context === "object" && typeof context.chatId === "string" ? context.chatId : null;
    if (!chatId)
      return messages;
    let budgetTimer;
    const budget = new Promise((resolve) => {
      budgetTimer = setTimeout(() => resolve("timeout"), INJECTION_BUDGET_MS);
    });
    const work = (async () => {
      let userId = resolveUserId(chatId);
      if (!userId) {
        const bootstrap = getBootstrapUserId();
        if (bootstrap) {
          const chat = await spindle.chats.get(chatId, bootstrap).catch(() => null);
          if (chat) {
            rememberChatUser(chatId, bootstrap);
            userId = bootstrap;
          }
        }
      }
      if (!userId)
        return "skip";
      const settings = await loadSettings(userId);
      if (!settings.enabled)
        return "skip";
      return buildInjection(chatId, messages, userId);
    })();
    work.catch(() => {});
    try {
      const result = await Promise.race([work, budget]);
      if (result === "timeout") {
        error(`injection: assembly exceeded ${INJECTION_BUDGET_MS}ms for chat ${chatId.slice(0, 8)}, skipping this turn to stay inside the host interceptor budget`);
        const toastUser = resolveUserId(chatId);
        if (toastUser)
          notify(toastUser, "error", "Memoria took too long assembling memories and skipped this turn");
        return messages;
      }
      if (result === "skip" || !result)
        return messages;
      return { messages: result.messages, breakdown: result.breakdown };
    } finally {
      if (budgetTimer)
        clearTimeout(budgetTimer);
    }
  } catch (err) {
    warn(`interceptor failed: ${describeError(err)}`);
    return messages;
  }
}, 90);
spindle.on("MESSAGE_SENT", async (payload, hostUserId) => {
  const p = payload;
  if (!p?.chatId)
    return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId)
    return;
  rememberChatUser(p.chatId, userId);
});
spindle.on("GENERATION_ENDED", async (payload, hostUserId) => {
  const p = payload;
  if (!p?.chatId || p.error)
    return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId)
    return;
  rememberChatUser(p.chatId, userId);
  await ensureUserFolders(userId).catch(() => {});
  const settings = await loadSettings(userId).catch(() => null);
  if (!settings?.enabled)
    return;
  const rawProfile = settings.profiles.find((x) => x.id === settings.activeProfileId);
  if (!rawProfile)
    return;
  const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
  await reassertChatBinding(p.chatId, userId).catch(() => {});
  await maybeRunPipeline(p.chatId, profile, settings, userId).catch((err) => {
    warn(`pipeline failed: ${describeError(err)}`);
  });
  await maybeRunCodex(p.chatId, profile, settings, userId).catch((err) => {
    warn(`codex run failed: ${describeError(err)}`);
  });
});
spindle.on("CHAT_SWITCHED", async (payload, hostUserId) => {
  const p = payload;
  const userId = hostUserId ?? resolveUserId(p?.chatId ?? null);
  if (!userId)
    return;
  if (p?.chatId)
    rememberChatUser(p.chatId, userId);
  invalidateConnectionsCache(userId);
  await pushState(userId, p?.chatId ?? null);
});
spindle.on("MESSAGE_DELETED", async (payload, hostUserId) => {
  const p = payload;
  if (!p?.chatId)
    return;
  const userId = hostUserId ?? resolveUserId(p.chatId);
  if (!userId)
    return;
  rememberChatUser(p.chatId, userId);
  invalidateBookCache(userId, p.chatId);
  await pushState(userId, p.chatId);
});
spindle.on("WORLD_BOOK_ENTRY_DELETED", async (payload, hostUserId) => {
  if (!hostUserId)
    return;
  const p = payload;
  if (!p?.worldBookId)
    return;
  await handleExternalEntryDeletion(hostUserId, p.worldBookId, false);
});
spindle.on("WORLD_BOOK_DELETED", async (payload, hostUserId) => {
  if (!hostUserId)
    return;
  const p = payload;
  if (!p?.id)
    return;
  await handleExternalEntryDeletion(hostUserId, p.id, true);
});
spindle.on("REGEX_SCRIPT_CHANGED", (_payload, hostUserId) => {
  if (hostUserId)
    invalidateRegexCache(hostUserId);
});
spindle.on("REGEX_SCRIPT_DELETED", (_payload, hostUserId) => {
  if (hostUserId)
    invalidateRegexCache(hostUserId);
});
spindle.on("CONNECTION_PROFILE_LOADED", (_payload, hostUserId) => {
  if (hostUserId)
    invalidateConnectionsCache(hostUserId);
});
spindle.on("MAIN_API_CHANGED", (_payload, hostUserId) => {
  if (hostUserId)
    invalidateConnectionsCache(hostUserId);
});
async function handleExternalEntryDeletion(userId, bookId, isBookDeletion) {
  const chatId = isBookDeletion ? findCachedChatIdForBook(userId, bookId) : await findChatIdForBook(userId, bookId).catch(() => null);
  if (!chatId)
    return;
  if (isBookDeletion)
    invalidateAllBookCacheEntriesForBook(userId, bookId);
  else
    invalidateBookCache(userId, chatId);
  try {
    const settings = await loadSettings(userId);
    const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
    const desiredHidden = profile ? profile.hideCoveredMessages : true;
    const { unhidden } = await resyncVisibility(chatId, userId, desiredHidden);
    if (unhidden > 0) {
      await notify(userId, "info", `Memoria unhid ${unhidden} message${unhidden === 1 ? "" : "s"} after an external lorebook change`);
    }
  } catch (err) {
    warn(`external deletion resync failed: ${describeError(err)}`);
  }
  await pushState(userId, chatId);
}
async function wipeBooksEntries(chatId, userId) {
  const entries = await listLmbEntries(chatId, userId);
  let removed = 0;
  for (const e of entries) {
    try {
      await deleteEntry(e.raw.id, userId);
      removed++;
    } catch (err) {
      warn(`wipe books: failed to delete ${e.raw.id}: ${describeError(err)}`);
    }
  }
  invalidateBookCache(userId, chatId);
  const settings = await loadSettings(userId);
  const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
  await resyncVisibility(chatId, userId, profile ? profile.hideCoveredMessages : true).catch((err) => warn(`wipe books: visibility resync failed: ${describeError(err)}`));
  return removed;
}
async function cleanupGhostsIfModeOff(userId, chatId, context) {
  const after = await loadSettings(userId);
  const activeProfile = after.profiles.find((p) => p.id === after.activeProfileId);
  if (!activeProfile || extraContextActive(activeProfile))
    return;
  await cleanupGhostsAfterModeOff(chatId, activeProfile, userId).catch((err) => warn(`${context} ghost cleanup failed: ${describeError(err)}`));
}
async function collectActiveChapterIds(chatId, userId) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  return coverage.activeEntries.filter((e) => e.meta.tier === 1 && !e.meta.isRoot).map((e) => e.raw.id);
}
async function collectActiveArcIds(chatId, userId) {
  const entries = await listLmbEntries(chatId, userId);
  const coverage = await buildCoverage(chatId, userId, entries);
  return coverage.activeEntries.filter((e) => e.meta.tier === 2 && !e.meta.isRoot).map((e) => e.raw.id);
}
async function retryLastFailure(chatId, userId, profile, settings) {
  const last = getLastFailure(userId, chatId);
  if (last?.kind === "volume") {
    const ids = await collectActiveArcIds(chatId, userId);
    if (ids.length === 0) {
      clearLastFailure(userId, chatId);
      await notify(userId, "warn", "Memoria has no arcs left to retry the volume");
      return;
    }
    await createVolumeFromArcs(chatId, ids, profile, settings, userId);
    return;
  }
  if (last?.kind === "arc") {
    const ids = await collectActiveChapterIds(chatId, userId);
    if (ids.length === 0) {
      clearLastFailure(userId, chatId);
      const msg = "Memoria has no chapters left to retry the arc";
      await notify(userId, "warn", msg);
      return;
    }
    await createArcFromChapters(chatId, ids, profile, settings, userId);
    return;
  }
  if (extraContextActive(profile)) {
    const made = await drainGhostBacklog(chatId, profile, settings, userId);
    if (made === 0) {
      await notify(userId, "info", "Nothing to retry yet, Memoria will catch it after the next message");
    }
  } else {
    await createChapterAuto(chatId, profile, settings, userId);
  }
  await maybeRunArcCheck(chatId, profile, settings, userId);
}
spindle.onFrontendMessage(async (raw, userId) => {
  setLastFrontendUserId(userId);
  const msg = raw;
  rememberChatUser(readChatIdFromMessage(msg), userId);
  try {
    await ensureUserFolders(userId);
    switch (msg.type) {
      case "ready":
      case "refresh":
        await pushState(userId, msg.chatId);
        break;
      case "save_settings":
        await patchSettings(userId, msg.patch);
        await pushState(userId, msg.chatId);
        break;
      case "save_profile": {
        const incoming = msg.profile;
        const id = typeof incoming?.id === "string" && incoming.id.trim() ? incoming.id : null;
        if (!id) {
          send({ type: "error", text: "Invalid profile payload." }, userId);
          break;
        }
        let prevHide = null;
        let nextHide = null;
        let prevExtra = null;
        let nextExtra = null;
        let activeBefore = null;
        let missing = false;
        await mutateSettings(userId, (cur) => {
          activeBefore = cur.activeProfileId;
          const existing = cur.profiles.find((p) => p.id === id);
          if (!existing) {
            missing = true;
            return cur;
          }
          const merged = normalizeProfile({ ...existing, ...incoming, id });
          if (!merged)
            return cur;
          prevHide = existing.hideCoveredMessages;
          nextHide = merged.hideCoveredMessages;
          prevExtra = extraContextActive(existing);
          nextExtra = extraContextActive(merged);
          return { ...cur, profiles: cur.profiles.map((p) => p.id === id ? merged : p) };
        });
        if (missing) {
          warn(`save_profile dropped: no profile with id "${id}"`);
          send({ type: "error", text: `Profile ${id} no longer exists.` }, userId);
          break;
        }
        if (prevHide !== null && nextHide !== null && prevHide !== nextHide && id === activeBefore && msg.chatId) {
          try {
            const messages = await spindle.chat.getMessages(msg.chatId);
            const coverage = await buildCoverage(msg.chatId, userId);
            await syncHiddenForCoveredMessages(msg.chatId, messages, coverage, userId, nextHide);
          } catch (err) {
            warn(`hideCoveredMessages re-sync failed: ${describeError(err)}`);
          }
        }
        if (prevExtra === true && nextExtra === false && id === activeBefore && msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "mode-off");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "save_samplers": {
        await mutateSettings(userId, (cur) => {
          const idx = cur.profiles.findIndex((p) => p.id === msg.profileId);
          if (idx === -1)
            return cur;
          const current = cur.profiles[idx];
          const profiles = cur.profiles.slice();
          if (msg.target === "codex") {
            profiles[idx] = { ...current, codexSamplers: { ...current.codexSamplers, ...msg.samplers } };
          } else {
            profiles[idx] = { ...current, samplers: { ...current.samplers, ...msg.samplers } };
          }
          return { ...cur, profiles };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_profile": {
        await mutateSettings(userId, (cur) => {
          const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          const baseProfile = cur.profiles.find((p) => p.id === cur.activeProfileId) ?? cur.profiles[0];
          const next = { ...baseProfile, id, name: (msg.name || "New profile").slice(0, 60) };
          return { ...cur, profiles: [...cur.profiles, next], activeProfileId: id };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "delete_profile": {
        let warned = false;
        await mutateSettings(userId, (cur) => {
          if (cur.profiles.length <= 1) {
            warned = true;
            return cur;
          }
          const profiles = cur.profiles.filter((p) => p.id !== msg.profileId);
          const activeProfileId = cur.activeProfileId === msg.profileId ? profiles[0].id : cur.activeProfileId;
          return { ...cur, profiles, activeProfileId };
        });
        if (warned) {
          await notify(userId, "warn", "Memoria keeps at least one profile");
        }
        if (msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-delete");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "set_active_profile": {
        await mutateSettings(userId, (cur) => {
          if (!cur.profiles.some((p) => p.id === msg.profileId))
            return cur;
          return { ...cur, activeProfileId: msg.profileId };
        });
        if (msg.chatId) {
          await cleanupGhostsIfModeOff(userId, msg.chatId, "profile-switch");
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_chapter": {
        const cur = await loadSettings(userId);
        const rawProfile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!rawProfile)
          break;
        const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already filing a chapter");
          break;
        }
        const chapterMessages = await spindle.chat.getMessages(msg.chatId);
        const chapterCoverage = await buildCoverage(msg.chatId, userId, undefined, extraContextActive(profile));
        const chapterStats = computeCoverageStats(chapterMessages, chapterCoverage, profile);
        if (!chapterStats.lagSatisfied || !chapterStats.windowAvailable) {
          await notify(userId, "info", "Your story needs more messages for me to generate a new entry~");
          break;
        }
        await createChapterAuto(msg.chatId, profile, cur, userId);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_chapter_range": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already filing a chapter");
          break;
        }
        const rangeMessages = await spindle.chat.getMessages(msg.chatId);
        const selectedIds = new Set(msg.messageIds);
        const positions = rangeMessages.map((m, i) => ({ m, i })).filter(({ m }) => selectedIds.has(m.id) && !(m.metadata?.["lmb_excluded"] === true)).map(({ i }) => i);
        const runs = [];
        let prev = -2;
        for (const pos of positions) {
          if (pos === prev + 1)
            runs[runs.length - 1].push(rangeMessages[pos].id);
          else
            runs.push([rangeMessages[pos].id]);
          prev = pos;
        }
        for (const run of runs) {
          await createChapterFromRange(msg.chatId, run, profile, cur, userId);
        }
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_all_chapters": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "chapter" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already filing a chapter");
          break;
        }
        await drainChapterBacklog(msg.chatId, profile, cur, userId);
        await maybeRunArcCheck(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_arc": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already binding an arc");
          break;
        }
        const ids = await collectActiveChapterIds(msg.chatId, userId);
        await createArcFromChapters(msg.chatId, ids, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_arc_from": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already binding an arc");
          break;
        }
        await createArcFromChapters(msg.chatId, msg.chapterEntryIds, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_all_arcs": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "arc" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already binding an arc");
          break;
        }
        await drainArcBacklog(msg.chatId, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "create_volume_from": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (getBusy(userId).some((b) => b.kind === "volume" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is already pressing a volume");
          break;
        }
        await createVolumeFromArcs(msg.chatId, msg.arcEntryIds, profile, cur, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "retry_last_failure": {
        const cur = await loadSettings(userId);
        const rawProfile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!rawProfile)
          break;
        const profile = effectiveProfile(rawProfile, await ensureLessons(userId));
        await retryLastFailure(msg.chatId, userId, profile, cur);
        await pushState(userId, msg.chatId);
        break;
      }
      case "delete_entry": {
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        if (entry && entry.meta.tier !== 1 && !entry.meta.supersededByEntryId && Array.isArray(entry.meta.sourceChapterEntryIds)) {
          const sourceIds = new Set(entry.meta.sourceChapterEntryIds);
          for (const src of entries) {
            if (!sourceIds.has(src.raw.id))
              continue;
            if (src.meta.supersededByEntryId !== msg.entryId)
              continue;
            try {
              await patchEntryMeta(src, { supersededByEntryId: null }, userId);
            } catch (err) {
              warn(`failed to clear supersededByEntryId on entry ${src.raw.id}: ${describeError(err)}`);
            }
          }
        }
        if (entry?.meta.ghost && typeof entry.meta.sceneNumber === "number") {
          recordFreedGhostNumber(userId, msg.chatId, entry.meta.msgIds, entry.meta.sceneNumber);
        }
        await deleteEntry(msg.entryId, userId);
        invalidateBookCache(userId, msg.chatId);
        if (entry) {
          const remaining = entries.filter((e) => e.raw.id !== msg.entryId);
          const newCoverage = await buildCoverage(msg.chatId, userId, remaining);
          const toUnhide = entry.meta.msgIds.filter((id) => !newCoverage.coveredBy.has(id));
          if (toUnhide.length > 0) {
            await unhideCoveredMessages(msg.chatId, toUnhide, userId).catch(() => {});
          }
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "release_entry": {
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        if (!entry) {
          await notify(userId, "warn", "Memoria can't find that entry to release");
          break;
        }
        if (entry.meta.ghost) {
          await notify(userId, "warn", "Memoria can't release a ghost chapter before it's shelved");
          break;
        }
        if (entry.meta.tier !== 1 && !entry.meta.supersededByEntryId && Array.isArray(entry.meta.sourceChapterEntryIds)) {
          const sourceIds = new Set(entry.meta.sourceChapterEntryIds);
          for (const src of entries) {
            if (!sourceIds.has(src.raw.id))
              continue;
            if (src.meta.supersededByEntryId !== msg.entryId)
              continue;
            try {
              await patchEntryMeta(src, { supersededByEntryId: null }, userId);
            } catch (err) {
              warn(`failed to clear supersededByEntryId on entry ${src.raw.id}: ${describeError(err)}`);
            }
          }
        }
        await releaseEntry(entry, userId);
        invalidateBookCache(userId, msg.chatId);
        const remaining = entries.filter((e) => e.raw.id !== msg.entryId);
        const newCoverage = await buildCoverage(msg.chatId, userId, remaining);
        const toUnhide = entry.meta.msgIds.filter((id) => !newCoverage.coveredBy.has(id));
        if (toUnhide.length > 0) {
          await unhideCoveredMessages(msg.chatId, toUnhide, userId).catch(() => {});
        }
        await notify(userId, "success", "Memoria released the entry to your lorebook");
        await pushState(userId, msg.chatId);
        break;
      }
      case "regenerate_entry": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        const entries = await listLmbEntries(msg.chatId, userId);
        const entry = entries.find((e) => e.raw.id === msg.entryId);
        if (!entry) {
          await notify(userId, "warn", "Memoria can't find that entry to regenerate");
          break;
        }
        const tier = entry.meta.tier;
        const busyKind = tier === 3 ? "volume" : tier === 2 ? "arc" : "chapter";
        if (getBusy(userId).some((b) => b.kind === busyKind && b.chatId === msg.chatId)) {
          await notify(userId, "warn", `Memoria is already busy with a ${busyKind}`);
          break;
        }
        if (entry.meta.isRoot && tier === 1) {
          await notify(userId, "warn", "Memoria can't regenerate inherited chapters");
          break;
        }
        if (entry.meta.ghost) {
          await notify(userId, "warn", "Memoria can't regenerate a ghost chapter before it's shelved");
          break;
        }
        const isArc = tier === 2;
        const isVolume = tier === 3;
        const msgIds = entry.meta.msgIds.slice();
        const sourceIds = Array.isArray(entry.meta.sourceChapterEntryIds) ? entry.meta.sourceChapterEntryIds.slice() : [];
        if (isVolume && sourceIds.length === 0) {
          await notify(userId, "warn", "Memoria has no arc sources to regenerate this volume from");
          break;
        }
        if (isArc && sourceIds.length === 0) {
          await notify(userId, "warn", "Memoria has no chapter sources to regenerate this arc from");
          break;
        }
        if (!isArc && !isVolume && msgIds.length === 0) {
          await notify(userId, "warn", "Memoria has no messages to regenerate this chapter from");
          break;
        }
        if (!isArc && !isVolume) {
          const otherEntries = entries.filter((e) => e.raw.id !== msg.entryId);
          const otherCoverage = await buildCoverage(msg.chatId, userId, otherEntries);
          const blockingIds = entry.meta.msgIds.filter((id) => otherCoverage.coveredBy.has(id));
          if (blockingIds.length > 0) {
            const blockerEntryId = otherCoverage.coveredBy.get(blockingIds[0]);
            const blocker = otherEntries.find((e) => e.raw.id === blockerEntryId);
            const blockerLabel = blocker?.meta.tier === 3 ? "a volume" : blocker?.meta.tier === 2 ? "an arc" : "another entry";
            await notify(userId, "warn", `These messages are bound into ${blockerLabel}, release or delete it first`);
            break;
          }
        }
        if (isVolume) {
          await createVolumeFromArcs(msg.chatId, sourceIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        } else if (isArc) {
          await createArcFromChapters(msg.chatId, sourceIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        } else {
          await createChapterFromRange(msg.chatId, msgIds, profile, cur, userId, { replacesEntryId: msg.entryId });
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "update_entry": {
        await updateEntry(msg.entryId, msg.patch, userId);
        invalidateBookCache(userId, msg.chatId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "resync_hidden": {
        const messages = await spindle.chat.getMessages(msg.chatId);
        const coverage = await buildCoverage(msg.chatId, userId);
        await syncHiddenForCoveredMessages(msg.chatId, messages, coverage, userId, true);
        await pushState(userId, msg.chatId);
        break;
      }
      case "dry_run_chapter": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunChapter(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "chapter", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_chapter failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }
      case "dry_run_arc": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunArc(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "arc", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_arc failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }
      case "dry_run_volume": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunVolume(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "volume", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_volume failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }
      case "dry_run_codex": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        try {
          const result = await dryRunCodex(msg.chatId, profile, cur, userId);
          send({ type: "dry_run_result", kind: "codex", messages: result.messages, diagnostics: result.diagnostics }, userId);
        } catch (err) {
          const text = describeError(err);
          warn(`dry_run_codex failed: ${text}`);
          await notify(userId, "error", `Dry run failed: ${text}`);
        }
        break;
      }
      case "abort_busy": {
        const aborted = abortBusy(userId, msg.chatId, msg.kind);
        if (!aborted) {
          await notify(userId, "warn", "Memoria is not in the middle of anything to abort");
        }
        break;
      }
      case "watch_stream": {
        setStreamWatcher(userId, msg.chatId, msg.kind, msg.on);
        break;
      }
      case "set_force_constant": {
        await patchSettings(userId, { forceConstantEntries: msg.value });
        const updated = await applyConstantToAllLmbEntries(userId, msg.value).catch((err) => {
          warn(`applyConstantToAllLmbEntries failed: ${describeError(err)}`);
          return 0;
        });
        const text = updated === 0 ? `Future entries will be ${msg.value ? "constant" : "keyword-triggered"}` : `Memoria flipped ${updated} entr${updated === 1 ? "y" : "ies"} to ${msg.value ? "constant" : "keyword-triggered"}`;
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }
      case "resync_visibility": {
        const settings = await loadSettings(userId);
        const profile = settings.profiles.find((p) => p.id === settings.activeProfileId);
        const desiredHidden = profile ? profile.hideCoveredMessages : true;
        const { unhidden, hidden } = await resyncVisibility(msg.chatId, userId, desiredHidden);
        const total = unhidden + hidden;
        const text = total === 0 ? "Memoria's shelf is already aligned, nya" : `Memoria resynced ${total} message${total === 1 ? "" : "s"} (${hidden} hidden, ${unhidden} unhidden)`;
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }
      case "ensure_book": {
        await ensureBookForChat(msg.chatId, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "import_preset": {
        const parsed = parseStmbPresetExport(msg.raw, msg.category);
        if (parsed.length === 0) {
          await notify(userId, "warn", "Memoria found no usable presets in that file");
          break;
        }
        await mutateSettings(userId, (cur) => {
          const merged = [...cur.customPresets];
          for (const p of parsed) {
            const existing = merged.findIndex((c) => c.key === p.key && c.category === msg.category);
            const record = { ...p, category: msg.category, createdAt: Date.now() };
            if (existing >= 0)
              merged[existing] = record;
            else
              merged.push(record);
          }
          return { ...cur, customPresets: merged };
        });
        await notify(userId, "success", `Memoria imported ${parsed.length} preset${parsed.length === 1 ? "" : "s"}`);
        await pushState(userId, msg.chatId);
        break;
      }
      case "save_custom_preset": {
        const next = normalizeCustomPreset(msg.preset);
        if (!next) {
          send({ type: "error", text: "Invalid preset payload." }, userId);
          break;
        }
        await mutateSettings(userId, (cur) => {
          const idx = cur.customPresets.findIndex((p) => p.key === next.key && p.category === next.category);
          const list = cur.customPresets.slice();
          if (idx >= 0)
            list[idx] = next;
          else
            list.push(next);
          return { ...cur, customPresets: list };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "delete_custom_preset": {
        const fallbackChapter = "summary";
        const fallbackArc = "arc_default";
        const fallbackVolume = "volume_default";
        const fallbackCodex = "codex_default";
        await mutateSettings(userId, (cur) => {
          const list = cur.customPresets.filter((p) => !(p.key === msg.key && p.category === msg.category));
          const profiles = cur.profiles.map((p) => {
            if (msg.category === "chapter" && p.chapterPresetKey === msg.key) {
              return { ...p, chapterPresetKey: fallbackChapter };
            }
            if (msg.category === "arc" && p.arcPresetKey === msg.key) {
              return { ...p, arcPresetKey: fallbackArc };
            }
            if (msg.category === "volume" && p.volumePresetKey === msg.key) {
              return { ...p, volumePresetKey: fallbackVolume };
            }
            if (msg.category === "codex" && p.codexPresetKey === msg.key) {
              return { ...p, codexPresetKey: fallbackCodex };
            }
            return p;
          });
          return { ...cur, customPresets: list, profiles };
        });
        await pushState(userId, msg.chatId);
        break;
      }
      case "accept_preview": {
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        await acceptPreview(msg.chatId, msg.draftId, profile, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "discard_preview": {
        dropPendingPreview(userId, msg.chatId, msg.draftId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "edit_preview": {
        patchPendingPreview(userId, msg.chatId, msg.draftId, msg.patch);
        break;
      }
      case "rebase_root": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const result = await rebaseRoot(msg.chatId, msg.sourceChatId, userId);
        if (!result.ok) {
          const text = result.reason === "has_own" ? "This chat already has memories, use Rebuild instead" : result.reason === "empty_source" ? "That chat has no memories to inherit" : result.reason === "busy" ? "Memoria is already rebasing this chat" : "Memoria can't rebase a chat onto itself";
          await notify(userId, "warn", text);
        } else {
          await notify(userId, "success", `Memoria seeded ${result.count} inherited memor${result.count === 1 ? "y" : "ies"} before the greeting`);
        }
        await pushState(userId, msg.chatId);
        break;
      }
      case "rebuild_root": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const result = await rebuildRoot(msg.chatId, msg.sourceChatId, userId);
        if (!result.ok) {
          const text = result.reason === "empty_source" ? "That chat has no memories to inherit" : result.reason === "busy" ? "Memoria is already rebuilding this chat" : "Memoria can't rebuild a chat onto itself";
          await notify(userId, "warn", text);
          await pushState(userId, msg.chatId);
          break;
        }
        await notify(userId, "success", `Memoria rebuilt onto ${result.count} inherited memor${result.count === 1 ? "y" : "ies"} and is re-summarizing this chat`);
        await pushState(userId, msg.chatId);
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (profile) {
          await drainChapterBacklog(msg.chatId, profile, cur, userId).catch((err) => warn(`rebuild re-summarize failed: ${describeError(err)}`));
          await maybeRunArcCheck(msg.chatId, profile, cur, userId).catch(() => {});
          await resyncVisibility(msg.chatId, userId, profile.hideCoveredMessages).catch((err) => warn(`rebuild visibility resync failed: ${describeError(err)}`));
          await pushState(userId, msg.chatId);
        }
        break;
      }
      case "set_message_excluded": {
        const ids = Array.isArray(msg.messageIds) ? msg.messageIds.filter((x) => typeof x === "string") : [];
        if (ids.length === 0)
          break;
        const messages = await spindle.chat.getMessages(msg.chatId);
        const byId = new Map(messages.map((m) => [m.id, m]));
        const coveredNow = msg.excluded ? (await buildCoverage(msg.chatId, userId)).coveredBy : null;
        const hideToUnhide = [];
        for (const id of ids) {
          const m = byId.get(id);
          if (!m)
            continue;
          const cur = m.metadata;
          const next = cur && typeof cur === "object" ? { ...cur } : {};
          if (msg.excluded) {
            next["lmb_excluded"] = true;
            const hidden = !!(m.extra && m.extra.hidden);
            if (hidden && coveredNow?.has(id))
              hideToUnhide.push(id);
          } else {
            delete next["lmb_excluded"];
          }
          await spindle.chat.updateMessage(msg.chatId, id, { metadata: next, skipChunkRebuild: true }).catch((err) => {
            warn(`set_message_excluded: updateMessage failed for ${id}: ${describeError(err)}`);
          });
        }
        if (hideToUnhide.length > 0) {
          await unhideCoveredMessages(msg.chatId, hideToUnhide, userId).catch(() => {});
        }
        if (!msg.excluded) {
          const cur = await loadSettings(userId);
          const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
          if (profile?.hideCoveredMessages) {
            const fresh = await spindle.chat.getMessages(msg.chatId);
            const coverage = await buildCoverage(msg.chatId, userId);
            const idSet = new Set(ids);
            const reincluded = fresh.filter((m) => idSet.has(m.id) && coverage.coveredBy.has(m.id));
            if (reincluded.length > 0) {
              await syncHiddenForCoveredMessages(msg.chatId, reincluded, coverage, userId, true).catch(() => {});
            }
          }
        }
        await notify(userId, "info", msg.excluded ? `Memoria will leave ${ids.length} message${ids.length === 1 ? "" : "s"} untouched` : `Memoria will compress ${ids.length} message${ids.length === 1 ? "" : "s"} again`);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_update_now": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        await runCodexNow(msg.chatId, profile, userId, msg.mode ?? "slow", cur);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_read": {
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files }, userId);
        break;
      }
      case "codex_write_file": {
        if (!isCodexFileKey(msg.file)) {
          send({ type: "error", text: `Unknown codex file "${msg.file}".` }, userId);
          break;
        }
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is updating the codex, save again when she finishes");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        const profileMode = profile ? profile.codexRelationsTable : true;
        const cursor = await loadCursor(msg.chatId, userId);
        const relationsTable = cursor.relationsTableMode ?? profileMode;
        let parsed;
        try {
          parsed = JSON.parse(msg.content);
        } catch (err) {
          await notify(userId, "error", `That is not valid JSON: ${describeError(err)}`);
          break;
        }
        const result = validateCodexFile(msg.file, parsed, { relationsTable });
        if (!result.ok) {
          const extra = result.errors.length > 1 ? ` (+${result.errors.length - 1} more)` : "";
          await notify(userId, "error", `Validation failed: ${result.errors[0]}${extra}`);
          break;
        }
        await saveCodexFile(msg.chatId, msg.file, result.value, userId);
        invalidateCodexInjectionCache(msg.chatId);
        await withCursorLock(msg.chatId, userId, async () => {
          const cur2 = await loadCursor(msg.chatId, userId);
          if (cur2.relationsTableMode === null) {
            cur2.relationsTableMode = relationsTable;
            await saveCursor(msg.chatId, cur2, userId);
          }
        });
        if (profile)
          await publishCodexPool(msg.chatId, userId, profile, [msg.file], "edit");
        try {
          await syncCodexEntries(msg.chatId, userId, relationsTable);
        } catch (err) {
          warn(`codex_write_file entry sync failed: ${describeError(err)}`);
          await notify(userId, "error", `Memoria couldn't sync the codex to the lorebook: ${shortErrorText(err)}`);
        }
        const { bundle, problems } = await loadCodex(msg.chatId, userId, { relationsTable });
        if (problems.length > 0) {
          const names = problems.map((p) => `${p.file}.json`).join(", ");
          await notify(userId, "warn", `Saved, but ${names} could not be read so cross-file checks were skipped`);
        } else {
          const dangling = checkIntegrity(bundle);
          if (dangling.length > 0) {
            await notify(userId, "warn", `Saved with ${dangling.length} dangling reference${dangling.length === 1 ? "" : "s"} to fix in the other files`);
          } else {
            await notify(userId, "success", `Memoria saved ${msg.file}.json`);
          }
        }
        const files = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files, savedFile: msg.file, savedSeq: msg.seq }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_reset": {
        if (!setBusy(userId, msg.chatId, "codex", "Memoria is clearing the codex")) {
          await notify(userId, "warn", "Memoria is updating the codex, abort that first");
          break;
        }
        try {
          const failed = await deleteCodex(msg.chatId, userId);
          invalidateCodexInjectionCache(msg.chatId);
          if (failed.length > 0) {
            await notify(userId, "error", `Memoria couldn't clear ${failed.length} codex file${failed.length === 1 ? "" : "s"}, try again`);
          } else {
            publishCodexWiped(msg.chatId, userId);
            let entriesCleared = true;
            try {
              await wipeCodexEntries(msg.chatId, userId);
            } catch (err) {
              entriesCleared = false;
              warn(`codex_reset entry wipe failed: ${describeError(err)}`);
              await notify(userId, "error", `Memoria couldn't clear the codex lorebook entries: ${shortErrorText(err)}`);
            }
            if (entriesCleared) {
              await notify(userId, "info", "Memoria cleared the codex for this chat");
            }
          }
        } finally {
          clearBusy(userId, msg.chatId, "codex");
        }
        const wiped = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: wiped }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_rebuild": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        if (getBusy(userId).some((b) => b.kind === "codex" && b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is updating the codex, abort that first");
          break;
        }
        await rebuildCodex(msg.chatId, profile, userId, msg.mode ?? "slow", cur);
        const rebuilt = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: rebuilt }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_tidy": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        const files = Array.isArray(msg.files) ? msg.files.filter(isCodexFileKey) : undefined;
        await runCodexTidy(msg.chatId, profile, userId, files && files.length ? files : undefined);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_rebuild_files": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        const files = Array.isArray(msg.files) ? msg.files.filter(isCodexFileKey) : [];
        if (files.length === 0)
          break;
        await rebuildCodexFiles(msg.chatId, profile, userId, files);
        const rebuiltFiles = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: rebuiltFiles }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_refresh": {
        if (codexGated(await ensureLessons(userId))) {
          await notify(userId, "warn", "Memoria teaches the codex before she opens it, take her lesson first");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        if (!profile.codexEnabled) {
          await notify(userId, "warn", "Enable the codex in Tuning first");
          break;
        }
        await refreshCodexFiles(msg.chatId, profile, userId);
        const refreshed = await readCodexFilesRaw(msg.chatId, userId);
        send({ type: "codex_files", chatId: msg.chatId, files: refreshed }, userId);
        await pushState(userId, msg.chatId);
        break;
      }
      case "codex_set_file_state": {
        if (!isCodexFileKey(msg.file)) {
          send({ type: "error", text: `Unknown codex file "${msg.file}".` }, userId);
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        await setCodexFileState(msg.chatId, userId, msg.file, msg.state, profile?.codexRelationsTable);
        if (profile)
          await publishCodexPool(msg.chatId, userId, profile, [msg.file], "states");
        await pushState(userId, msg.chatId);
        break;
      }
      case "wipe_books": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const removed = await wipeBooksEntries(msg.chatId, userId);
        await notify(userId, removed > 0 ? "success" : "info", removed > 0 ? `Memoria cleared ${removed} entr${removed === 1 ? "y" : "ies"} from the shelf` : "The shelf is already empty");
        await pushState(userId, msg.chatId);
        break;
      }
      case "rebuild_books": {
        if (getBusy(userId).some((b) => b.chatId === msg.chatId)) {
          await notify(userId, "warn", "Memoria is busy, wait for her to finish");
          break;
        }
        const cur = await loadSettings(userId);
        const profile = cur.profiles.find((p) => p.id === cur.activeProfileId);
        if (!profile)
          break;
        const removed = await wipeBooksEntries(msg.chatId, userId);
        await notify(userId, "info", `Memoria cleared ${removed} entr${removed === 1 ? "y" : "ies"} and is re-summarizing this chat`);
        await pushState(userId, msg.chatId);
        await drainChapterBacklog(msg.chatId, profile, cur, userId).catch((err) => warn(`rebuild books re-summarize failed: ${describeError(err)}`));
        await maybeRunArcCheck(msg.chatId, profile, cur, userId).catch(() => {});
        await resyncVisibility(msg.chatId, userId, profile.hideCoveredMessages).catch(() => {});
        await pushState(userId, msg.chatId);
        break;
      }
      case "detach_root": {
        const removed = await detachRoot(msg.chatId, userId);
        const text = removed === 0 ? "This chat has no inherited memories to detach" : `Memoria detached ${removed} inherited memor${removed === 1 ? "y" : "ies"}`;
        await notify(userId, "info", text);
        await pushState(userId, msg.chatId);
        break;
      }
      case "lesson_patch": {
        if (msg.course !== "books" && msg.course !== "codex")
          break;
        await patchLessonCourse(userId, msg.course, msg.patch ?? {});
        break;
      }
      case "lesson_complete": {
        if (msg.course !== "books" && msg.course !== "codex")
          break;
        const grade = msg.grade === "gilded" || msg.grade === "silver" || msg.grade === "bronze" || msg.grade === "apprentice" ? msg.grade : "apprentice";
        const wrong = typeof msg.wrong === "number" && Number.isFinite(msg.wrong) ? Math.max(0, Math.round(msg.wrong)) : 0;
        const total = typeof msg.total === "number" && Number.isFinite(msg.total) ? Math.max(0, Math.round(msg.total)) : 0;
        await completeLessonCourse(userId, msg.course, wrong, total, grade, msg.signedName ?? null, msg.answers);
        await pushState(userId, msg.chatId);
        break;
      }
      case "lesson_reset": {
        if (msg.course !== "books" && msg.course !== "codex")
          break;
        await resetLessonCourse(userId, msg.course, msg.mode === "section" ? "section" : "course", msg.section, msg.answerIds);
        await pushState(userId, msg.chatId);
        break;
      }
      case "lesson_seal_skip": {
        await skipCourseSeal(userId, msg.course === "codex" ? "codex" : "books");
        await pushState(userId, msg.chatId);
        break;
      }
      default:
        debug(userId, `unknown frontend msg type`, msg.type);
    }
  } catch (err) {
    const description = describeError(err);
    error(`frontend handler failed: ${description}`);
    send({ type: "error", text: description }, userId);
  }
});
registerBookAnomalyCallback((userId, tone, text) => {
  notify(userId, tone, text);
});
registerInjectionAnomalyCallback((userId, text) => {
  notify(userId, "error", text);
});
registerLessonsAnomalyCallback((userId, text) => {
  notify(userId, "error", text);
});
registerForkAnomalyCallback((userId, text) => {
  notify(userId, "error", text);
});
registerHookEndpoints();
info("LumiBooks loaded.");

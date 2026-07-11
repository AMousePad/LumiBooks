# The Knowledge Codex

Models lose facts, muddle timelines, and drift out of character as the context grows and overflows. Researchers have measured these failure modes in long-run roleplay: fact loss, timeline confusion, and persona drift ([ARPM, 2026](https://arxiv.org/pdf/2605.14802), [PCL](https://arxiv.org/html/2503.17662v1), [CloneMem](https://arxiv.org/pdf/2601.07023)).

LumiBooks already fights this partially with compression. Memoria files your chat into chapters, binds chapters into arcs, and presses arcs into volumes.

In short, these summaries answer *what happened* in chronological order. The main problem with pure summarization is that you are relying on the summary capturing all hierarchical, high value information like entity relationships or details. This is hard to do as you compress further, therefore, you need explicit tracking.

This is what knowledge codex solves.

## What it is

The Codex is a story bible for chats. As your story grows, an agent reads every new turn, and updates a small set of records:

- **Characters, Locations, and Things.** Entity sheets are the backbone of most story systems, from hierarchical screenwriting to structured story generation ([Dramatron](https://arxiv.org/pdf/2209.14958), [Narrative Planning](https://arxiv.org/pdf/1401.3841), [Decomposed Screenwriting](https://arxiv.org/html/2510.23163v1)).
- **Relationships.** A shared table that describes the relationships and trajectories between entities. Research on narrative knowledge graphs shows relations must be tracked as they evolve rather than as static snapshots ([Iyyer et al., NAACL 2016](https://aclanthology.org/N16-1180/), [Narrative Graph](https://www.researchgate.net/publication/370272383_Narrative_Graph_Telling_Evolving_Stories_Based_on_Event-centric_Temporal_Knowledge_Graph), [Relation Clustering](https://www.researchgate.net/publication/346475960_Relation_Clustering_in_Narrative_Knowledge_Graphs)). This table is optional as it is difficult for some models to maintain.
- **Timeline.** A dated record of major events. Timeline confusion is one of the most common failure modes, and a maintained timeline is the classic defense ([ARPM](https://arxiv.org/pdf/2605.14802), [narrative dimensions](https://arxiv.org/pdf/2604.10786), [event relation extraction](https://arxiv.org/pdf/2106.08629)).
- **Threads.** Open/stalled storylines, and the details planted for later payoff. Explicit thread and outline state is what keeps plots coherent over thousands of words ([DOC](https://arxiv.org/pdf/2212.10077), [Writing Path](https://arxiv.org/html/2404.13919v1), [plot structure management](https://www.sciencedirect.com/science/article/pii/S1875952123000459)).
- **World.** The rules of your setting (Magic systems, factions, geography, lore, facts true of the world itself). Important for narrative depth ([KG-guided storytelling](https://arxiv.org/html/2505.24803v2), [KG + literary theory](https://arxiv.org/pdf/2508.03137), [hierarchical story KGs](https://arxiv.org/html/2506.10008v1)).
- **Knowledge and secrets.** Who knows what. Models improve greatly when memory is limited to what each character actually witnessed, and belief tracking is where LLMs are shit ([perspective-bounded memory](https://arxiv.org/pdf/2606.25632), [MREval](https://aclanthology.org/2026.findings-acl.1175/), [ToMATO, AAAI 2025](https://ojs.aaai.org/index.php/AAAI/article/view/32143), [EnigmaToM](https://arxiv.org/pdf/2503.03340)).

## Why these records?

These are either proven failure modes or a mechanism shown to improve long-form coherence. A story bible must be functional and minimal while maintaining the high information content that is prone to being compressed and lost. ([Generative Agents](https://arxiv.org/abs/2304.03442), [MemGPT](https://arxiv.org/abs/2310.08560), [MemoryBank, AAAI 2024](https://arxiv.org/abs/2305.10250)).

Some things other trackers keep were left out on purpose:

- **Numeric affection and trust meters.** Some research shows relationships benefit more from trajectories vs scores ([Narrative Graph](https://www.researchgate.net/publication/370272383_Narrative_Graph_Telling_Evolving_Stories_Based_on_Event-centric_Temporal_Knowledge_Graph)). A number like affection 62 is pseudo-precision an LLM can interpret in arbitrary ways. "Loves her, hides it, betrayed on day 12" carries far more information. We track this as relationships.
- **Per-turn scene state.** Who is standing where, current weather, momentary moods, etc. The uncompressed tail of your chat already shows the present scene, so tracking it twice is not needed and would need to be updated every turn.
- **Possession ledgers, personality drift logs, faction standing matrices.** Each extra table multiplies the agent's upkeep and adds a place for old data to accumulate and relationships to track. Significant objects already live as Things, lasting character change belongs on the sheet itself, and pivotal shifts go in the timeline as events.
- **Verbatim dialogue.** Potentially in the future, could track dialogues. idk.

## How it works

Every so often, on a schedule you control, LB hands a slice of your story to a lightweight agent along with the current records and some context of the past. The agent then does three things:

1. **Update.** Rewrite every section the story has outdated.
2. **Sweep.** Verify nothing stale survived.
3. **Compress.** Strip bloat and prose, duplicate info, verbosity.

You can edit the records yourself in the new and beautiful glass UI.

## For extension developers

LumiBooks publishes the codex to Spindle's shared RPC pool. Read it from any extension backend:

```ts
// Full snapshot: all 8 files as parsed JSON, plus per-file states.
const snap = await spindle.rpcPool.read(`lumi_books.codex.${chatId}`);
// snap: { chatId, userId, files: { characters, locations, things, relations,
//         timeline, threads, world, knowledge }, fileStates, runs, updatedAt }

// Injection-ready text block, the same one LumiBooks puts in the prompt.
const text = await spindle.rpcPool.read(`lumi_books.codex.${chatId}.rendered`);

// Change signal: the most recent codex mutation across all chats.
const evt = await spindle.rpcPool.read("lumi_books.codex_updated");
// evt: { chatId, userId, changedFiles, reason: "run"|"tidy"|"edit"|"states"|"wipe", updatedAt }
```

Notes:

- Endpoints appear after the first codex activity of a session. `read` rejects before that, so wrap it in a try/catch.
- A wiped codex publishes `null` at both chat endpoints.
- `fileStates` marks files the user switched off (`noInject`) or froze (`frozen`). The `rendered` text already excludes them. If you consume `files` directly, respect these flags.
- `lumi_books.latest_chapter`, `lumi_books.latest_arc`, and `lumi_books.latest_volume` carry the summary events and were already published.

import type { ArcView, ChapterView, CoverageStats, FrontendState, MessageStub } from "../../types";
import type { LMBEntryMeta, LessonsState } from "../../shared";
import {
  DEFAULT_SETTINGS,
  LESSON_CHAT_PREFIX,
  emptyLessonCourse,
  makeDefaultProfile,
  unlockedLessons,
} from "../../shared";
import { BUILTIN_ARC_PRESETS, BUILTIN_CHAPTER_PRESETS, BUILTIN_CODEX_PRESETS, BUILTIN_VOLUME_PRESETS } from "../../backend/presets";

export const FIXTURE_CHAT_ID = `${LESSON_CHAT_PREFIX}ashford` as const;
const FIXTURE_MODEL = "example/tutor-model";
const FIXTURE_CONN = "lesson_conn";

/* --------------------------------------------------------- sample story */

const LINES = [
  "The rain had not let up since the duke's carriage was found empty on the north road.",
  "Elias pressed the silver locket into his palm until the clasp bit skin.",
  "\"You were there,\" Mara said quietly, not looking up from her stitching.",
  "The captain's men went door to door along Wren Street before dawn.",
  "I keep my voice level and ask what the pawnbroker wanted for his silence.",
  "Ashford Manor stood dark except for a single lamp in the study window.",
  "\"Bandits,\" the captain repeated, writing it down like he believed it.",
  "Mara folded the receipt into the hem of her sleeve and said nothing.",
  "The bells rang for the duke at noon, and half the city wore borrowed black.",
  "Elias slept in the loft above the tannery and dreamed of the study door.",
  "\"If they find the locket, they find you,\" she whispered on the bridge.",
  "The ferryman's scar caught the light when he took my coin.",
];

function makeMessages(total: number): MessageStub[] {
  const out: MessageStub[] = [];
  for (let i = 0; i < total; i++) {
    const role = i % 2 === 0 ? "user" : "assistant";
    const approxTokens = role === "user" ? 150 : 640;
    out.push({
      id: `m${i + 1}`,
      role,
      preview: LINES[i % LINES.length]!,
      charCount: approxTokens * 4,
      approxTokens,
      hidden: false,
      covered: false,
      coveredByEntryId: null,
      indexInChat: i,
      excluded: false,
    });
  }
  return out;
}

/* ------------------------------------------------------------- entries */

interface EntrySpec {
  id: string;
  tier: 1 | 2 | 3;
  n: number;
  first: number;
  last: number;
  title: string;
  body: string;
  nyaa: string;
  ghost?: boolean;
  superseded?: boolean;
  sources?: string[];
  outTokens: number;
  inTokens: number;
}

function msgIds(first: number, last: number): string[] {
  const out: string[] = [];
  for (let i = first; i <= last; i++) out.push(`m${i + 1}`);
  return out;
}

function makeMeta(e: EntrySpec): LMBEntryMeta {
  return {
    tier: e.tier,
    chatId: FIXTURE_CHAT_ID,
    msgIds: msgIds(e.first, e.last),
    sourceChapterEntryIds: e.sources,
    firstMsgIdx: e.first,
    lastMsgIdx: e.last,
    tokenCountInput: e.inTokens,
    tokenCountOutput: e.outTokens,
    model: FIXTURE_MODEL,
    connectionId: FIXTURE_CONN,
    createdAt: Date.now() - (100 - e.n) * 3600_000,
    title: `${e.title} (msgs ${e.first + 1}-${e.last + 1})`,
    shortComment: e.nyaa,
    presetKey: e.tier === 1 ? "summary" : e.tier === 2 ? "arc_default" : "volume_default",
    sceneNumber: e.n,
    ...(e.ghost ? { ghost: true } : {}),
  };
}

function makeView(e: EntrySpec): ChapterView {
  const tag = e.tier === 3 ? "Vol" : e.tier === 2 ? "Arc" : "";
  const comment = e.tier === 1
    ? `#${e.n} - ${e.title} (msgs ${e.first + 1}-${e.last + 1})`
    : `${tag} #${e.n} - ${e.title} (msgs ${e.first + 1}-${e.last + 1})`;
  return {
    entryId: e.id,
    bookId: "book_lesson",
    comment,
    content: e.body,
    meta: makeMeta(e),
    active: !e.superseded && !e.ghost,
    contentTokens: e.outTokens,
    contentChars: e.outTokens * 4,
    sourceTokensInput: e.inTokens,
    isRoot: false,
    isGhost: !!e.ghost,
  };
}

const CH: EntrySpec[] = [
  {
    id: "c1", tier: 1, n: 1, first: 0, last: 17,
    title: "The Duke Falls",
    body: "1st Summary Chapter Containing 18 Prior Turns\n\nDay 3. The Duke of Ashford is found dead in his study. Elias, the duke's valet, flees through the servant stair carrying the silver locket. Mara sees him cross the yard with blood on his cuff and says nothing. The city watch seals the manor by nightfall.",
    nyaa: "Neatly filed, one nefarious night on the shelf.",
    outTokens: 430, inTokens: 7100,
  },
  {
    id: "c2", tier: 1, n: 2, first: 18, last: 35,
    title: "A Seamstress's Silence",
    body: "2nd Summary Chapter Containing 18 Prior Turns\n\nDay 5. The captain interviews the manor staff. Mara claims she saw bandits on the north road and is dismissed. Elias hides in the tannery loft and pays the pawnbroker to hold the locket. Mara keeps the pawnbroker's receipt sewn into her sleeve.",
    nyaa: "Secrets stitched into a sleeve, so tidy nya.",
    outTokens: 445, inTokens: 7050,
  },
  {
    id: "c3", tier: 1, n: 3, first: 36, last: 53,
    title: "The Pawnbroker's Receipt",
    body: "3rd Summary Chapter Containing 18 Prior Turns\n\nDay 8. The pawnbroker raises his price for silence. Elias and Mara meet on the bridge and argue about running. The captain announces the bandit theory publicly at the duke's funeral while quietly reopening the staff interviews.",
    nyaa: "Pricey promises pressed between the pages.",
    outTokens: 460, inTokens: 6900,
  },
  {
    id: "c4", tier: 1, n: 4, first: 54, last: 71,
    title: "The Captain Asks Questions",
    body: "4th Summary Chapter Containing 18 Prior Turns\n\nDay 11. The captain searches the tannery district on a tip. Elias escapes over the rooftops but drops a glove with the manor's crest. Mara burns her bloodied stitching and tells the captain she is leaving the city to mourn.",
    nyaa: "Curious captains collect such clumsy clues.",
    outTokens: 420, inTokens: 7200,
  },
  {
    id: "c5", tier: 1, n: 5, first: 72, last: 89,
    title: "Locket at the Bridge",
    body: "5th Summary Chapter Containing 18 Prior Turns\n\nDay 14. The pawnbroker sells the locket's description to the captain. Elias buys it back with the last of his wages minutes before the watch arrives. On the bridge, Mara tells Elias she saw everything on day 3, and that she has kept the receipt as leverage of her own.",
    nyaa: "Bridges bear the best and boldest bargains.",
    outTokens: 455, inTokens: 6850,
  },
  {
    id: "g1", tier: 1, n: 6, first: 90, last: 107, ghost: true,
    title: "Rooftop Confessions",
    body: "6th Summary Chapter Containing 18 Prior Turns\n\nDay 16. Elias admits the killing was not planned: the duke caught him returning the locket Mara's mother once pawned. The pair agree to frame the ferryman, then abandon the plan when Mara recognizes his scar.",
    nyaa: "Ghostly gossip glides in before the glue dries.",
    outTokens: 440, inTokens: 7000,
  },
];

const ARC1: EntrySpec = {
  id: "a1", tier: 2, n: 1, first: 0, last: 53,
  title: "The Murder at Ashford Manor",
  body: "1st Summary ARC Containing 3 Prior Chapters and 54 Prior Turns\n\nDays 3-8. The duke dies, Elias flees with the silver locket, and Mara chooses silence over safety. The captain publicly blames bandits while privately doubting the staff. The pawnbroker becomes the hinge every secret turns on.",
  nyaa: "An arc of alibis, bound and beautifully shelved.",
  sources: ["c1", "c2", "c3"],
  outTokens: 820, inTokens: 1335,
};

/* ---------------------------------------------------------- codex files */

export function codexFixtureFiles(): Record<string, string> {
  const files: Record<string, unknown> = {
    characters: {
      entities: [
        {
          id: "char:elias", name: "Elias", kind: "human", role: "the duke's former valet, fugitive",
          description: "hiding in the tannery loft", traits: ["careful", "sentimental", "quick over rooftops"],
          goals: ["keep the locket", "keep Mara out of it"],
          significance: "killed the duke on day 3",
        },
        {
          id: "char:mara", name: "Mara", kind: "human", role: "seamstress at Ashford Manor",
          description: "publicly mourning, privately bargaining", traits: ["observant", "steady"],
          goals: ["leverage over Elias", "leave the city"],
        },
        {
          id: "char:captain", name: "The Captain", kind: "human", role: "leads the city watch",
          description: "publicly backs the bandit theory", goals: ["reopen the staff interviews quietly"],
        },
      ],
    },
    locations: {
      entities: [
        { id: "loc:ashford_manor", name: "Ashford Manor", kind: "estate", description: "the duke's seat, sealed by the watch, dark except the study lamp" },
        { id: "loc:the_bridge", name: "The Bridge", kind: "landmark", significance: "where Elias and Mara trade truths" },
      ],
    },
    things: {
      entities: [
        { id: "thing:silver_locket", name: "The Silver Locket", kind: "heirloom", description: "back in Elias's coat", significance: "ties Elias to the study on day 3" },
      ],
    },
    relations: {
      relations: [
        { type: "pair", a: "char:elias", b: "char:mara", kind: "bond", state: "trusts her with his life, not his reasons", history: ["day 3: she saw him flee", "day 14: she revealed she kept the receipt"] },
        { type: "pair", a: "char:elias", b: "thing:silver_locket", kind: "owns", state: "carries it everywhere, bought it back twice" },
        { type: "pair", a: "char:captain", b: "char:mara", kind: "suspects", state: "doubts her bandit story, lacks proof" },
        { type: "group", kind: "pact", members: ["char:elias", "char:mara"], state: "silence about the murder, uneasy since the bridge" },
      ],
    },
    timeline: {
      events: [
        { when: "day 3", event: "The Duke of Ashford is killed in his study", participants: ["char:elias"], where: "loc:ashford_manor", causes: "Elias flees with the locket" },
        { when: "day 5", event: "Mara tells the captain she saw bandits", participants: ["char:mara", "char:captain"] },
        { when: "day 8", event: "The pawnbroker raises his price for silence", causes: "Elias runs out of money" },
        { when: "day 11", event: "Elias escapes the tannery search, drops a crested glove", participants: ["char:elias", "char:captain"] },
        { when: "day 14", event: "Mara reveals she kept the pawnbroker's receipt", participants: ["char:mara", "char:elias"], where: "loc:the_bridge" },
      ],
    },
    threads: {
      threads: [
        { name: "The duke's murder", status: "open", summary: "The captain's bandit theory is public cover while he reworks the staff interviews.", latest: "a crested glove is in the watch's evidence box", planted: ["the pawnbroker kept a receipt"] },
        { name: "Leaving the city", status: "stalled", summary: "Mara wants out before the interviews resume, Elias will not leave the locket." },
      ],
      seeds: ["unexplained scar on the ferryman's hand"],
    },
    world: {
      entries: [
        { topic: "The City Watch", facts: ["answers to the magistrate, not the crown", "funeral custom bars arrests during mourning bells"] },
        { topic: "Mourning customs", facts: ["half-black worn for a week by anyone the deceased employed"] },
      ],
    },
    knowledge: {
      items: [
        {
          fact: "Elias killed the duke",
          knownBy: ["char:mara"],
          hiddenFrom: ["char:captain"],
          falseBeliefs: [{ who: "char:captain", believes: "bandits did it" }],
        },
        {
          fact: "Mara keeps the pawnbroker's receipt sewn in her sleeve",
          knownBy: ["char:mara"],
          hiddenFrom: ["char:elias", "char:captain"],
          note: "her leverage if Elias runs alone",
        },
      ],
    },
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(files)) out[k] = JSON.stringify(v, null, 2);
  return out;
}

const CODEX_FILE_TOKENS: Record<string, number> = {
  characters: 240, locations: 80, things: 60, relations: 170,
  timeline: 160, threads: 120, world: 70, knowledge: 110,
};

/* ------------------------------------------------------------ variants */

function coverageFor(stubs: MessageStub[], profileLag: number, profileWindow: number): CoverageStats {
  let covered = 0;
  let uncoveredTokens = 0;
  for (const m of stubs) {
    if (m.covered) covered++;
    else uncoveredTokens += m.approxTokens;
  }
  const uncovered = stubs.length - covered;
  return {
    totalMessages: stubs.length,
    coveredMessages: covered,
    uncoveredMessages: uncovered,
    approxUncoveredTokens: uncoveredTokens,
    lagSatisfied: uncovered >= profileLag,
    windowAvailable: uncovered - profileLag >= profileWindow,
  };
}

function applyCoverage(stubs: MessageStub[], entries: ChapterView[], hide: boolean): void {
  for (const e of entries) {
    if (e.isGhost || !e.active) continue;
    for (const id of e.meta.msgIds) {
      const idx = Number(id.slice(1)) - 1;
      const m = stubs[idx];
      if (!m) continue;
      m.covered = true;
      m.coveredByEntryId = e.entryId;
      m.hidden = hide;
    }
  }
}

function booksLessons(): LessonsState {
  return {
    version: 1,
    freshInstall: false,
    booksSealSkipped: false,
    codexSealSkipped: false,
    books: { ...emptyLessonCourse(), status: "in_progress" },
    codex: emptyLessonCourse(),
  };
}

interface VariantSpec {
  total: number;
  chapters: EntrySpec[];
  arcs?: EntrySpec[];
  ghost?: boolean;
  excluded?: number[];
  busy?: boolean;
  failure?: boolean;
  codex?: boolean;
  codexFileStates?: Record<string, "on" | "noInject" | "frozen">;
  codexStale?: string[];
  roots?: boolean;
}

const VARIANTS: Record<string, VariantSpec> = {
  // Enough tail that the do-beat's filing still leaves a 2-chapter backlog,
  // the next step points at the File all button and it must exist.
  filing: { total: 160, chapters: [CH[0]!, CH[1]!] },
  // The exact state after the do-beat files chapter #3. The explanation
  // steps pin this so navigation order can never change what they show.
  "filing-after": { total: 160, chapters: [CH[0]!, CH[1]!, CH[2]!] },
  pills: { total: 124, chapters: [CH[0]!, CH[1]!, CH[2]!] },
  desk: { total: 165, chapters: [CH[0]!, CH[1]!, CH[2]!, CH[3]!, CH[4]!], arcs: [ARC1], ghost: true, busy: true, failure: true },
  shelf: { total: 165, chapters: [CH[0]!, CH[1]!, CH[2]!, CH[3]!, CH[4]!], arcs: [ARC1], ghost: true },
  compose: { total: 140, chapters: [CH[0]!, CH[1]!], excluded: [100, 101, 102] },
  continuity: { total: 140, chapters: [CH[0]!, CH[1]!], roots: true },
  tuning: { total: 140, chapters: [CH[0]!, CH[1]!] },
  codex: { total: 165, chapters: [CH[0]!, CH[1]!, CH[2]!, CH[3]!, CH[4]!], arcs: [ARC1], codex: true },
  "codex-noinject": {
    total: 165, chapters: [CH[0]!, CH[1]!, CH[2]!, CH[3]!, CH[4]!], arcs: [ARC1], codex: true,
    codexFileStates: { relations: "noInject" },
  },
  "codex-stale": {
    total: 165, chapters: [CH[0]!, CH[1]!, CH[2]!, CH[3]!, CH[4]!], arcs: [ARC1], codex: true,
    codexFileStates: { relations: "frozen" }, codexStale: ["relations"],
  },
};

export const FIXTURE_VARIANTS: readonly string[] = Object.keys(VARIANTS);

export function buildFixture(variant: string): FrontendState {
  const spec = VARIANTS[variant] ?? VARIANTS["filing"]!;
  const profile = makeDefaultProfile("default", "Default");
  profile.codexEnabled = !!spec.codex;
  const stubs = makeMessages(spec.total);
  for (const idx of spec.excluded ?? []) {
    const m = stubs[idx];
    if (m) m.excluded = true;
  }

  const superseded = new Set((spec.arcs ?? []).flatMap((a) => a.sources ?? []));
  const chapters = spec.chapters.map((c) => makeView({ ...c, superseded: superseded.has(c.id) }));
  if (spec.ghost) chapters.push(makeView(CH[5]!));
  const arcs = (spec.arcs ?? []).map((a) => makeView(a) as ArcView);
  for (const a of arcs) a.sourceChapterEntryIds = (spec.arcs ?? []).find((s) => s.id === a.entryId)?.sources ?? [];

  applyCoverage(stubs, [...arcs, ...chapters], profile.hideCoveredMessages);
  const coverage = coverageFor(stubs, profile.lagValue, profile.windowValue);
  const headroom = Math.max(0, coverage.uncoveredMessages - profile.lagValue);
  const lessons = spec.codex ? unlockedLessons() : booksLessons();

  return {
    activeChatId: FIXTURE_CHAT_ID,
    activeChatName: "The Ashford Case",
    activeCharacterId: "lesson_char",
    activeCharacterName: "Elias",
    settings: { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: "default" },
    activeProfile: profile,
    chapters,
    arcs,
    volumes: [],
    bookId: "book_lesson",
    bookName: "LumiBooks - The Ashford Case",
    connections: [
      { id: FIXTURE_CONN, name: "Storyteller", provider: "example", model: FIXTURE_MODEL, isDefault: true, hasApiKey: true },
    ],
    resolvedSidecarConnectionId: FIXTURE_CONN,
    coverage,
    busy: spec.busy
      ? [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: "Memoria is writing a chapter (~1.3kt written, ~0.8kt thought, 24s)", startedAt: Date.now() - 24_000 }]
      : [],
    lastFailure: spec.failure
      ? { kind: "chapter", message: "No token within 60s, the provider may be slow or unreachable", retriedTimes: 4, at: Date.now() - 90_000 }
      : null,
    messages: stubs,
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: [],
    regexScripts: [],
    pendingPreviews: [],
    backlogChapters: Math.floor(headroom / Math.max(1, profile.windowValue)),
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: spec.roots
      ? [{ chatId: `${LESSON_CHAT_PREFIX}vol1`, chatName: "The Ashford Case, Vol. 1", entryCount: 5 }]
      : [],
    codexExists: !!spec.codex,
    codexBacklog: spec.codex ? 4 : 0,
    codexBacklogPasses: spec.codex ? 1 : 0,
    codexLastRunAt: spec.codex ? Date.now() - 11 * 60_000 : null,
    codexUndoAt: null,
    codexUndoReason: null,
    codexInjectedTokens: spec.codex ? 940 : 0,
    codexFileStates: spec.codexFileStates ?? {},
    codexStaleFiles: spec.codexStale ?? [],
    codexRefreshPending: [],
    codexFileTokens: spec.codex ? { ...CODEX_FILE_TOKENS } : {},
    codexRevision: 0,
    lessons,
  };
}

/** The S2 do-beat: chapter #3 lands on the fixture shelf. Idempotent, a
 * double fire must not shelve it twice. */
export function applyFiledChapter(state: FrontendState): void {
  if (state.chapters.some((c) => c.entryId === "c3")) return;
  const spec = CH[2]!;
  const view = makeView(spec);
  state.chapters.push(view);
  applyCoverage(state.messages, [view], state.activeProfile.hideCoveredMessages);
  const cov = coverageFor(state.messages, state.activeProfile.lagValue, state.activeProfile.windowValue);
  state.coverage = cov;
  const headroom = Math.max(0, cov.uncoveredMessages - state.activeProfile.lagValue);
  state.backlogChapters = Math.floor(headroom / Math.max(1, state.activeProfile.windowValue));
}

export const FIXTURE_BUSY_FILING = {
  kind: "chapter" as const,
  chatId: FIXTURE_CHAT_ID,
  label: "Memoria is filing a chapter (2s)",
  startedAt: 0,
};

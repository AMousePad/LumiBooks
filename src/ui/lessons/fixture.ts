import { t as tr } from "../../i18n";
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
  tr("ui.lessons.fixture.lines.theRainHadNotLetUpSince"),
  tr("ui.lessons.fixture.lines.eliasPressedTheSilverLocketIntoHis"),
  tr("ui.lessons.fixture.lines.youWereThereMaraSaidQuietlyNot"),
  tr("ui.lessons.fixture.lines.theCaptainSMenWentDoorTo"),
  tr("ui.lessons.fixture.lines.iKeepMyVoiceLevelAndAsk"),
  tr("ui.lessons.fixture.lines.ashfordManorStoodDarkExceptForA"),
  tr("ui.lessons.fixture.lines.banditsTheCaptainRepeatedWritingItDown"),
  tr("ui.lessons.fixture.lines.maraFoldedTheReceiptIntoTheHem"),
  tr("ui.lessons.fixture.lines.theBellsRangForTheDukeAt"),
  tr("ui.lessons.fixture.lines.eliasSleptInTheLoftAboveThe"),
  tr("ui.lessons.fixture.lines.ifTheyFindTheLocketTheyFind"),
  tr("ui.lessons.fixture.lines.theFerrymanSScarCaughtTheLight"),
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
      staged: false,
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
    title: tr("ui.lessons.fixture.makeMeta.msgs", { title: e.title, first1: e.first + 1, last1: e.last + 1 }),
    shortComment: e.nyaa,
    presetKey: e.tier === 1 ? "summary" : e.tier === 2 ? "arc_default" : "volume_default",
    sceneNumber: e.n,
    ...(e.ghost ? { ghost: true } : {}),
  };
}

function makeView(e: EntrySpec): ChapterView {
  const tag = e.tier === 3 ? tr("ui.lessons.fixture.tag.vol") : e.tier === 2 ? tr("ui.lessons.fixture.tag.arc") : "";
  const comment = e.tier === 1
    ? tr("ui.lessons.fixture.comment.msgs", { n: e.n, title: e.title, first1: e.first + 1, last1: e.last + 1 })
    : tr("ui.lessons.fixture.comment.msgs2", { tag: tag, n: e.n, title: e.title, first1: e.first + 1, last1: e.last + 1 });
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
    title: tr("ui.lessons.fixture.ch.theDukeFalls"),
    body: tr("ui.lessons.fixture.ch.1stSummaryChapterContaining18PriorTurns"),
    nyaa: tr("ui.lessons.fixture.ch.neatlyFiledOneNefariousNightOnThe"),
    outTokens: 430, inTokens: 7100,
  },
  {
    id: "c2", tier: 1, n: 2, first: 18, last: 35,
    title: tr("ui.lessons.fixture.ch.aSeamstressSSilence"),
    body: tr("ui.lessons.fixture.ch.2ndSummaryChapterContaining18PriorTurns"),
    nyaa: tr("ui.lessons.fixture.ch.secretsStitchedIntoASleeveSoTidy"),
    outTokens: 445, inTokens: 7050,
  },
  {
    id: "c3", tier: 1, n: 3, first: 36, last: 53,
    title: tr("ui.lessons.fixture.ch.thePawnbrokerSReceipt"),
    body: tr("ui.lessons.fixture.ch.3rdSummaryChapterContaining18PriorTurns"),
    nyaa: tr("ui.lessons.fixture.ch.priceyPromisesPressedBetweenThePages"),
    outTokens: 460, inTokens: 6900,
  },
  {
    id: "c4", tier: 1, n: 4, first: 54, last: 71,
    title: tr("ui.lessons.fixture.ch.theCaptainAsksQuestions"),
    body: tr("ui.lessons.fixture.ch.4thSummaryChapterContaining18PriorTurns"),
    nyaa: tr("ui.lessons.fixture.ch.curiousCaptainsCollectSuchClumsyClues"),
    outTokens: 420, inTokens: 7200,
  },
  {
    id: "c5", tier: 1, n: 5, first: 72, last: 89,
    title: tr("ui.lessons.fixture.ch.locketAtTheBridge"),
    body: tr("ui.lessons.fixture.ch.5thSummaryChapterContaining18PriorTurns"),
    nyaa: tr("ui.lessons.fixture.ch.bridgesBearTheBestAndBoldestBargains"),
    outTokens: 455, inTokens: 6850,
  },
  {
    id: "g1", tier: 1, n: 6, first: 90, last: 107, ghost: true,
    title: tr("ui.lessons.fixture.ch.rooftopConfessions"),
    body: tr("ui.lessons.fixture.ch.6thSummaryChapterContaining18PriorTurns"),
    nyaa: tr("ui.lessons.fixture.ch.ghostlyGossipGlidesInBeforeTheGlue"),
    outTokens: 440, inTokens: 7000,
  },
];

const ARC1: EntrySpec = {
  id: "a1", tier: 2, n: 1, first: 0, last: 53,
  title: tr("ui.lessons.fixture.arc1.theMurderAtAshfordManor"),
  body: tr("ui.lessons.fixture.arc1.1stSummaryArcContaining3PriorChapters"),
  nyaa: tr("ui.lessons.fixture.arc1.anArcOfAlibisBoundAndBeautifully"),
  sources: ["c1", "c2", "c3"],
  outTokens: 820, inTokens: 1335,
};

/* ---------------------------------------------------------- codex files */

export function codexFixtureFiles(): Record<string, string> {
  const files: Record<string, unknown> = {
    characters: {
      entities: [
        {
          id: "char:elias", name: tr("ui.lessons.fixture.files.elias"), kind: tr("ui.lessons.fixture.files.human"), role: tr("ui.lessons.fixture.files.theDukeSFormerValetFugitive"),
          description: tr("ui.lessons.fixture.files.hidingInTheTanneryLoft"), traits: [tr("ui.lessons.fixture.files.careful"), tr("ui.lessons.fixture.files.sentimental"), tr("ui.lessons.fixture.files.quickOverRooftops")],
          goals: [tr("ui.lessons.fixture.files.keepTheLocket"), tr("ui.lessons.fixture.files.keepMaraOutOfIt")],
          significance: tr("ui.lessons.fixture.files.killedTheDukeOnDay3"),
        },
        {
          id: "char:mara", name: tr("ui.lessons.fixture.files.mara"), kind: tr("ui.lessons.fixture.files.human"), role: tr("ui.lessons.fixture.files.seamstressAtAshfordManor"),
          description: tr("ui.lessons.fixture.files.publiclyMourningPrivatelyBargaining"), traits: [tr("ui.lessons.fixture.files.observant"), tr("ui.lessons.fixture.files.steady")],
          goals: [tr("ui.lessons.fixture.files.leverageOverElias"), tr("ui.lessons.fixture.files.leaveTheCity")],
        },
        {
          id: "char:captain", name: tr("ui.lessons.fixture.files.theCaptain"), kind: tr("ui.lessons.fixture.files.human"), role: tr("ui.lessons.fixture.files.leadsTheCityWatch"),
          description: tr("ui.lessons.fixture.files.publiclyBacksTheBanditTheory"), goals: [tr("ui.lessons.fixture.files.reopenTheStaffInterviewsQuietly")],
          locked: true,
        },
      ],
    },
    locations: {
      entities: [
        { id: "loc:ashford_manor", name: tr("ui.lessons.fixture.files.ashfordManor"), kind: tr("ui.lessons.fixture.files.estate"), description: tr("ui.lessons.fixture.files.theDukeSSeatSealedByThe") },
        { id: "loc:the_bridge", name: tr("ui.lessons.fixture.files.theBridge"), kind: tr("ui.lessons.fixture.files.landmark"), significance: tr("ui.lessons.fixture.files.whereEliasAndMaraTradeTruths") },
      ],
    },
    things: {
      entities: [
        { id: "thing:silver_locket", name: tr("ui.lessons.fixture.files.theSilverLocket"), kind: tr("ui.lessons.fixture.files.heirloom"), description: tr("ui.lessons.fixture.files.backInEliasSCoat"), significance: tr("ui.lessons.fixture.files.tiesEliasToTheStudyOnDay") },
      ],
    },
    relations: {
      relations: [
        { type: "pair", a: "char:elias", b: "char:mara", kind: tr("ui.lessons.fixture.files.bond"), state: tr("ui.lessons.fixture.files.trustsHerWithHisLifeNotHis"), history: [tr("ui.lessons.fixture.files.day3SheSawHimFlee"), tr("ui.lessons.fixture.files.day14SheRevealedSheKeptThe")] },
        { type: "pair", a: "char:elias", b: "thing:silver_locket", kind: tr("ui.lessons.fixture.files.owns"), state: tr("ui.lessons.fixture.files.carriesItEverywhereBoughtItBackTwice") },
        { type: "pair", a: "char:captain", b: "char:mara", kind: tr("ui.lessons.fixture.files.suspects"), state: tr("ui.lessons.fixture.files.doubtsHerBanditStoryLacksProof") },
        { type: "group", kind: tr("ui.lessons.fixture.files.pact"), members: ["char:elias", "char:mara"], state: tr("ui.lessons.fixture.files.silenceAboutTheMurderUneasySinceThe") },
      ],
    },
    timeline: {
      events: [
        { when: tr("ui.lessons.fixture.files.day3"), event: tr("ui.lessons.fixture.files.theDukeOfAshfordIsKilledIn"), participants: ["char:elias"], where: "loc:ashford_manor", causes: tr("ui.lessons.fixture.files.eliasFleesWithTheLocket") },
        { when: tr("ui.lessons.fixture.files.day5"), event: tr("ui.lessons.fixture.files.maraTellsTheCaptainSheSawBandits"), participants: ["char:mara", "char:captain"] },
        { when: tr("ui.lessons.fixture.files.day8"), event: tr("ui.lessons.fixture.files.thePawnbrokerRaisesHisPriceForSilence"), causes: tr("ui.lessons.fixture.files.eliasRunsOutOfMoney") },
        { when: tr("ui.lessons.fixture.files.day11"), event: tr("ui.lessons.fixture.files.eliasEscapesTheTannerySearchDropsA"), participants: ["char:elias", "char:captain"] },
        { when: tr("ui.lessons.fixture.files.day14"), event: tr("ui.lessons.fixture.files.maraRevealsSheKeptThePawnbrokerS"), participants: ["char:mara", "char:elias"], where: "loc:the_bridge" },
      ],
    },
    threads: {
      threads: [
        { name: tr("ui.lessons.fixture.files.theDukeSMurder"), status: "open", summary: tr("ui.lessons.fixture.files.theCaptainSBanditTheoryIsPublic"), latest: tr("ui.lessons.fixture.files.aCrestedGloveIsInTheWatch"), planted: [tr("ui.lessons.fixture.files.thePawnbrokerKeptAReceipt")] },
        { name: tr("ui.lessons.fixture.files.leavingTheCity"), status: "stalled", summary: tr("ui.lessons.fixture.files.maraWantsOutBeforeTheInterviewsResume") },
      ],
      seeds: [tr("ui.lessons.fixture.files.unexplainedScarOnTheFerrymanSHand")],
    },
    world: {
      entries: [
        { topic: tr("ui.lessons.fixture.files.theCityWatch"), facts: [tr("ui.lessons.fixture.files.answersToTheMagistrateNotTheCrown"), tr("ui.lessons.fixture.files.funeralCustomBarsArrestsDuringMourningBells")] },
        { topic: tr("ui.lessons.fixture.files.mourningCustoms"), facts: [tr("ui.lessons.fixture.files.halfBlackWornForAWeekBy")] },
      ],
    },
    knowledge: {
      items: [
        {
          fact: tr("ui.lessons.fixture.files.eliasKilledTheDuke"),
          knownBy: ["char:mara"],
          hiddenFrom: ["char:captain"],
          falseBeliefs: [{ who: "char:captain", believes: tr("ui.lessons.fixture.files.banditsDidIt") }],
        },
        {
          fact: tr("ui.lessons.fixture.files.maraKeepsThePawnbrokerSReceiptSewn"),
          knownBy: ["char:mara"],
          hiddenFrom: ["char:elias", "char:captain"],
          note: tr("ui.lessons.fixture.files.herLeverageIfEliasRunsAlone"),
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
  const profile = makeDefaultProfile("default", tr("ui.lessons.fixture.profile.default"));
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
    activeChatName: tr("ui.lessons.fixture.buildFixture.theAshfordCase"),
    activeCharacterId: "lesson_char",
    activeCharacterName: tr("ui.lessons.fixture.buildFixture.elias"),
    settings: { ...DEFAULT_SETTINGS, profiles: [profile], activeProfileId: "default" },
    activeProfile: profile,
    chapters,
    arcs,
    higherBooks: [],
    volumes: [],
    bookId: "book_lesson",
    bookName: tr("ui.lessons.fixture.buildFixture.lumiBooksTheAshfordCase"),
    connections: [
      { id: FIXTURE_CONN, name: tr("ui.lessons.fixture.buildFixture.storyteller"), provider: "example", model: FIXTURE_MODEL, isDefault: true, hasApiKey: true },
    ],
    resolvedSidecarConnectionId: FIXTURE_CONN,
    coverage,
    busy: spec.busy
      ? [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: tr("ui.lessons.fixture.buildFixture.memoriaIsWritingAChapter13kt"), startedAt: Date.now() - 24_000 }]
      : [],
    lastFailure: spec.failure
      ? { kind: "chapter", message: tr("ui.lessons.fixture.buildFixture.noTokenWithin60sTheProviderMay"), retriedTimes: 4, at: Date.now() - 90_000 }
      : null,
    messages: stubs,
    chapterPresets: BUILTIN_CHAPTER_PRESETS,
    arcPresets: BUILTIN_ARC_PRESETS,
    volumePresets: BUILTIN_VOLUME_PRESETS,
    codexPresets: BUILTIN_CODEX_PRESETS,
    customPresets: [],
    pendingPreviews: [],
    backlogChapters: Math.floor(headroom / Math.max(1, profile.windowValue)),
    backlogArcs: 0,
    rootOrigin: null,
    rootOriginName: null,
    rootEntryCount: 0,
    availableRoots: spec.roots
      ? [{ chatId: `${LESSON_CHAT_PREFIX}vol1`, chatName: tr("ui.lessons.fixture.buildFixture.theAshfordCaseVol1"), entryCount: 5 }]
      : [],
    codexExists: !!spec.codex,
    codexBacklog: spec.codex ? 4 : 0,
    codexBacklogPasses: spec.codex ? 1 : 0,
    codexLastRunAt: spec.codex ? Date.now() - 11 * 60_000 : null,
    codexUndoAt: null,
    codexUndoReason: null,
    codexSources: [],
    codexRootOrigin: null,
    codexRootOriginName: null,
    codexTokensApproximate: true,
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
  label: tr("ui.lessons.fixture.fixtureBusyFiling.memoriaIsFilingAChapter2s"),
  startedAt: 0,
};

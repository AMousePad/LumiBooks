import { t as tr } from "../../i18n";
import type { LessonCourseDef } from "./lesson-types";
import { setCodexExpandedEntity, setCodexRelationsView, setCodexSubtab } from "../tabs/codex-tab";
import { setSettingsView, setTuningSubtab } from "../tabs/tuning-tab";

/** Course 2: The Archivist's Codex. A quick guided walkthrough: the user
 * navigates every pane themselves, tries the unique interactions, and only
 * answers questions about things the UI can't teach by being clicked. */
export const COURSE_CODEX: LessonCourseDef = {
  key: "codex",
  title: tr("ui.lessons.contentCodex.courseCodex.theArchivistSCodex"),
  sections: [
    {
      id: "s1",
      title: tr("ui.lessons.contentCodex.courseCodex.whyAStoryBible"),
      steps: [
        {
          kind: "say",
          diagram: "fade",
          text: tr("ui.lessons.contentCodex.courseCodex.summaryChaptersAreAGoodOutlineBut"),
        },
        {
          kind: "nav",
          tab: "home",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["tab.codex"],
          arrive: "codex.tiles",
          text: tr("ui.lessons.contentCodex.courseCodex.beholdTheKnowledgeCodexLetSWalk"),
          done: tr("ui.lessons.contentCodex.courseCodex.thereItIs"),
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: tr("ui.lessons.contentCodex.courseCodex.eightRecordsMakeTheCodexCharactersLocations"),
        },
        {
          kind: "quiz",
          id: "c1",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: tr("ui.lessons.contentCodex.courseCodex.yourCharacterCardSaysEliasHasA"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.noTheCodexOnlyRecordsWhatThe"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.yesTheCodexShouldCopyEverythingFrom") },
            { text: tr("ui.lessons.contentCodex.courseCodex.theCardHasToBeImportedInto") },
            { text: tr("ui.lessons.contentCodex.courseCodex.theCodexOnlyTracksCharactersYouAdd") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.iReadYourLoreAsReferenceFor"),
        },
      ],
    },
    {
      id: "s2",
      title: tr("ui.lessons.contentCodex.courseCodex.readingTheCodex"),
      steps: [
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.status",
          text: tr("ui.lessons.contentCodex.courseCodex.theLineUpTopIsMyLedger"),
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.actions",
          text: tr("ui.lessons.contentCodex.courseCodex.theseAreTheEverydayActionsUpdateNow"),
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          expect: "codex_set_file_state",
          text: tr("ui.lessons.contentCodex.courseCodex.everyTileIsOneRecordItsCount"),
          done: tr("ui.lessons.contentCodex.courseCodex.dashedMeansNotInjectedButStillUpdated"),
        },
        {
          kind: "quiz",
          id: "c4",
          scored: true,
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex-stale" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          text: tr("ui.lessons.contentCodex.courseCodex.youFrozeRelations40MessagesAgoAnd"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.itSMarkedAsNeedingACatch"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.theGapFillsInAutomaticallyOnThe") },
            { text: tr("ui.lessons.contentCodex.courseCodex.nothingCanRecoverTheMissedEventsExcept") },
            { text: tr("ui.lessons.contentCodex.courseCodex.tidyItTidyingReReadsTheMissed") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.myReadingPositionIsAlreadyPastThose"),
        },
        {
          kind: "quiz",
          id: "c5",
          scored: true,
          tab: "codex",
          subtab: "manage",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("manage"),
          anchor: "codex.manage.startover",
          text: tr("ui.lessons.contentCodex.courseCodex.rebuildCodexAndWipeCodexBothErase"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.wipeHelpsLumiAgentWipeHerAss") },
            { text: tr("ui.lessons.contentCodex.courseCodex.rebuildKeepsYourEntriesAndOnlyRewrites") },
            { text: tr("ui.lessons.contentCodex.courseCodex.wipeAlsoDeletesYourChaptersAndArcs") },
            { text: tr("ui.lessons.contentCodex.courseCodex.rebuildKeepsYourTileSettingsAndRemakes"), correct: true },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.bothEraseTheRecordsAndMyReading"),
        },
      ],
    },
    {
      id: "s3",
      title: tr("ui.lessons.contentCodex.courseCodex.theRecordsHandsOn"),
      steps: [
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["subtab.entities"],
          arrive: "codex.entities",
          text: tr("ui.lessons.contentCodex.courseCodex.tapEntitiesAndBehold"),
          done: tr("ui.lessons.contentCodex.courseCodex.thePeoplePlacesAndThings"),
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities",
          text: tr("ui.lessons.contentCodex.courseCodex.everyChipIsAnEntityClickOne"),
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities.add",
          path: ["codex.entities.add", "codex.entities.addform", "codex.entities.editor"],
          expect: "codex_write_file",
          text: tr("ui.lessons.contentCodex.courseCodex.iAddAndUpdateAllOfThese"),
          done: tr("ui.lessons.contentCodex.courseCodex.savedYourEditsAreCanonNowI"),
          doneAnchor: "codex.entities.card",
        },
        {
          kind: "quiz",
          id: "c2",
          scored: true,
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("entities");
            setCodexExpandedEntity(tr("ui.lessons.contentCodex.courseCodex.charElias"));
          },
          anchor: "codex.entities",
          text: tr("ui.lessons.contentCodex.courseCodex.theStoryHasMovedOnEliasIsn"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.theAgentHasnTReadThatFar"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.theCodexIsBrokenDeleteTheExtension") },
            { text: tr("ui.lessons.contentCodex.courseCodex.sheetsNeverChangeOnceWritten") },
            { text: tr("ui.lessons.contentCodex.courseCodex.youHaveToDeleteEliasAndRe") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.theCodexUpdatesOnAScheduleSo"),
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("entities");
            setCodexExpandedEntity(tr("ui.lessons.contentCodex.courseCodex.charCaptain"));
          },
          anchor: "codex.entities.lock",
          hintAnchor: "codex.entities.statepill",
          expect: "codex_write_file",
          text: tr("ui.lessons.contentCodex.courseCodex.considerTheCaptainLetSSayThat"),
          done: tr("ui.lessons.contentCodex.courseCodex.greatHeIsNoLongerUpdatedOr")
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexRelationsView("list"),
          path: ["subtab.relations"],
          arrive: "codex.rel.view",
          text: tr("ui.lessons.contentCodex.courseCodex.letSExploreTheWorldWideWeb"),
          done: tr("ui.lessons.contentCodex.courseCodex.thisIsTheListView"),
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          anchor: "codex.rel.add",
          path: ["codex.rel.add", "codex.rel.form"],
          expect: "codex_write_file",
          text: tr("ui.lessons.contentCodex.courseCodex.iCreateTheseAndKeepTheseUpdated"),
          done: tr("ui.lessons.contentCodex.courseCodex.recorded"),
          doneAnchor: "codex.rel.view",
        },
        {
          kind: "quiz",
          id: "c7",
          scored: true,
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          anchor: "codex.rel.view",
          text: tr("ui.lessons.contentCodex.courseCodex.youJustAddedARelationByHand"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.noYourEditsBecomePartOfThe"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.yesTheAgentRewritesEverythingFromScratch") },
            { text: tr("ui.lessons.contentCodex.courseCodex.yesUnlessYouFreezeTheRelationsTile") },
            { text: tr("ui.lessons.contentCodex.courseCodex.handEditsOnlySurviveWhileTheRelations") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.theAgentAlwaysStartsFromTheCurrent"),
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("list");
          },
          path: ["codex.rel.graphbtn"],
          arrive: "codex.rel.graph",
          text: tr("ui.lessons.contentCodex.courseCodex.tapGraph"),
          done: tr("ui.lessons.contentCodex.courseCodex.thereSYourWebARealStory"),
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "relations",
          fixture: { variant: "codex" },
          prep: () => {
            setCodexSubtab("relations");
            setCodexRelationsView("graph");
          },
          anchor: "codex.rel.graph",
          text: tr("ui.lessons.contentCodex.courseCodex.thisIsTheWebForThisSmall"),
        },
      ],
    },
    {
      id: "s4",
      title: tr("ui.lessons.contentCodex.courseCodex.theAgentAndItsDials"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "codex" },
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings", "tuning.settings.codex"],
          arrive: "tuning.codex.enabled",
          text: tr("ui.lessons.contentCodex.courseCodex.lastStopMyRulesOpenTheTuning"),
          done: tr("ui.lessons.contentCodex.courseCodex.myDials"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          text: tr("ui.lessons.contentCodex.courseCodex.myCodexSettingsLiveHereByDefault"),
        },
        {
          kind: "quiz",
          id: "c10",
          scored: true,
          tab: "tuning",
          subtab: "codex",
          fixture: {
            variant: "codex",
            patch: (s) => {
              s.activeProfile.codexLagValue = 65;
            },
          },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          chip: tr("ui.lessons.contentCodex.courseCodex.codexLag65"),
          text: tr("ui.lessons.contentCodex.courseCodex.youRaiseTheCodexLagFrom6"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.theBibleAlwaysRuns65MessagesBehind"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.nothingTheLagOnlyAffectsChapters") },
            { text: tr("ui.lessons.contentCodex.courseCodex.theCodexGetsCheaperWithNoDownside") },
            { text: tr("ui.lessons.contentCodex.courseCodex.theAgentRunsMoreOften") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.chaptersActAsReplacementsOfOldMessages"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.relations",
          text: tr("ui.lessons.contentCodex.courseCodex.twoMoreThingsRelationsTableOffMoves"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          text: tr("ui.lessons.contentCodex.courseCodex.oneMoreThingEditAnyRecordWhenever"),
        },
        {
          kind: "quiz",
          id: "c14",
          scored: true,
          exhibit: tr("ui.lessons.contentCodex.courseCodex.memoriaCouldnTUpdateTheCodexThe"),
          exhibitTone: "error",
          text: tr("ui.lessons.contentCodex.courseCodex.everyCodexRunFailsWithThisWhat"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.theCodexModelCannotMakeToolCalls"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.theChatIsTooLong") },
            { text: tr("ui.lessons.contentCodex.courseCodex.aCodexFileIsCorrupted") },
            { text: tr("ui.lessons.contentCodex.courseCodex.theRelationsTableIsOff") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.withUseToolCallsOnTheAgent"),
        },
        {
          kind: "quiz",
          id: "c13",
          scored: true,
          text: tr("ui.lessons.contentCodex.courseCodex.withExtraContextModeOnAChapter"),
          options: [
            { text: tr("ui.lessons.contentCodex.courseCodex.noItSAChapterWrittenEarly"), correct: true },
            { text: tr("ui.lessons.contentCodex.courseCodex.pleaseReadThisOneCarefullyOrMousepad") },
            { text: tr("ui.lessons.contentCodex.courseCodex.yesItSCorruptedDeleteItAnd") },
            { text: tr("ui.lessons.contentCodex.courseCodex.itSADraftWaitingForYour") },
          ],
          why: tr("ui.lessons.contentCodex.courseCodex.ghostsGiveTheCodexContextEarlyAnd"),
        },
      ],
    },
    {
      id: "finale",
      title: tr("ui.lessons.contentCodex.courseCodex.openingCeremony"),
      steps: [
        {
          kind: "nav",
          real: true,
          optional: true,
          tab: "home",
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings", "tuning.settings.codex"],
          arrive: "tuning.codex.enabled",
          text: tr("ui.lessons.contentCodex.courseCodex.practiceIsOverThisIsYourReal"),
          done: tr("ui.lessons.contentCodex.courseCodex.alreadyThereGood"),
        },
        {
          kind: "do",
          real: true,
          optional: true,
          tab: "tuning",
          subtab: "codex",
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.enabled",
          expect: "save_profile",
          text: tr("ui.lessons.contentCodex.courseCodex.flipEnableCodexOnTheDefaultSettings"),
          done: tr("ui.lessons.contentCodex.courseCodex.enabledFromNowOnIKeepYour"),
        },
        {
          kind: "nav",
          real: true,
          optional: true,
          path: ["tab.home"],
          arrive: "home.actions.updatecodex",
          text: tr("ui.lessons.contentCodex.courseCodex.homeHasAnUpdateCodexButtonNow"),
          done: tr("ui.lessons.contentCodex.courseCodex.thereItIs"),
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.updatecodex",
          expect: "codex_update_now",
          optional: true,
          text: tr("ui.lessons.contentCodex.courseCodex.pressItAndILlReadThis"),
          done: tr("ui.lessons.contentCodex.courseCodex.readingWatchTheBusyRowOnHome"),
        },
        {
          kind: "say",
          text: tr("ui.lessons.contentCodex.courseCodex.thatSAllGoForthAndMake"),
        },
      ],
    },
  ],
};

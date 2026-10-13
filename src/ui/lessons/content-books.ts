import { t as tr } from "../../i18n";
import type { LessonCourseDef } from "./lesson-types";
import { focusShelfEntry, setBooksSubtab } from "../tabs/books-tab";
import { setSamplerView } from "../tabs/profile-tab";
import { setPromptsCategory } from "../tabs/prompts-tab";
import { setSettingsView, setTuningSubtab } from "../tabs/tuning-tab";

/** Course 1: The Librarian's Primer. Home, Books, and the Books side of
 * Tuning. Every pane change is a nav step the user clicks themselves, and
 * every step pins its own fixture so free play can't corrupt what follows. */
export const COURSE_BOOKS: LessonCourseDef = {
  key: "books",
  title: tr("ui.lessons.contentBooks.courseBooks.theLibrarianSPrimer"),
  sections: [
    {
      id: "s1",
      title: tr("ui.lessons.contentBooks.courseBooks.whyMemoriaExists"),
      steps: [
        {
          kind: "say",
          diagram: "rot",
          text: tr("ui.lessons.contentBooks.courseBooks.goodMorningWhyDoIExistAs"),
        },
        {
          kind: "say",
          diagram: "fold",
          text: tr("ui.lessons.contentBooks.courseBooks.beholdMeITakeYourOlderMessages"),
        },
        {
          kind: "say",
          diagram: "unfold",
          text: tr("ui.lessons.contentBooks.courseBooks.compactedMessagesAreHiddenSoYourLlm"),
        },
        {
          kind: "quiz",
          id: "b1",
          scored: true,
          diagram: "fold",
          text: tr("ui.lessons.contentBooks.courseBooks.afterICompactMessagesOfRange1"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.bothTheSummaryAndTheOriginalMessages") },
            { text: tr("ui.lessons.contentBooks.courseBooks.nothingItSForgotten") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theChapterSummariesThereInstead"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.aLorebookEntryInTheWorldInfo") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.theSummariesReplaceTheMessagesInPlace"),
        },
      ],
    },
    {
      id: "s2",
      title: tr("ui.lessons.contentBooks.courseBooks.theFirstFiling"),
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions",
          text: tr("ui.lessons.contentBooks.courseBooks.thisIsAPracticeChatIMade"),
        },
        {
          kind: "do",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions.file",
          expect: "create_chapter",
          text: tr("ui.lessons.contentBooks.courseBooks.thisPracticeStoryHasPlentyOfOld"),
          done: tr("ui.lessons.contentBooks.courseBooks.boomTheStoryIsNowMoreCompact"),
          doneAnchor: "home.spine",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: tr("ui.lessons.contentBooks.courseBooks.importantThereSAutomationTooNowYou"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: tr("ui.lessons.contentBooks.courseBooks.theSecondSettingIsTheWindowWe"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: tr("ui.lessons.contentBooks.courseBooks.theDefaultValuesAreMadeFor200k"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: tr("ui.lessons.contentBooks.courseBooks.fileAllFilesChaptersUntilTheLag"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.bookpill",
          text: tr("ui.lessons.contentBooks.courseBooks.everythingIFileIsStoredInA"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: tr("ui.lessons.contentBooks.courseBooks.normallyYouNeverNeedTheseButtonsWith"),
        },
        {
          kind: "quiz",
          id: "b3",
          scored: true,
          tab: "home",
          fixture: { variant: "pills" },
          anchor: "home.pills",
          chip: tr("ui.lessons.contentBooks.courseBooks.70OldMessagesLag65Window18"),
          text: tr("ui.lessons.contentBooks.courseBooks.thesePillsSayLagReadyButWindow"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.theLagHasNotFilledUpYet") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theChatHasNoLorebookYet") },
            { text: tr("ui.lessons.contentBooks.courseBooks.70MessagesMinusThe65ProtectedBy"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.aChapterCanOnlyBeFiledAfter") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.theWindowOnlyCountsMessagesOlderThan"),
        },
      ],
    },
    {
      id: "s3",
      title: tr("ui.lessons.contentBooks.courseBooks.theDesk"),
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: tr("ui.lessons.contentBooks.courseBooks.thisColoredBarIsTheSpineA"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: tr("ui.lessons.contentBooks.courseBooks.clickAnyColoredBlockAndILl"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.breakdown",
          text: tr("ui.lessons.contentBooks.courseBooks.theListUnderItShowsTheSame"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: tr("ui.lessons.contentBooks.courseBooks.theseTilesAreTheQuickSummaryFiled"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.prompt",
          text: tr("ui.lessons.contentBooks.courseBooks.thePromptPanelShowsThePromptBreakdown"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.busy",
          text: tr("ui.lessons.contentBooks.courseBooks.iWroteTooMuchThePreviousStep"),
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.failure",
          text: tr("ui.lessons.contentBooks.courseBooks.ifIFailEvenAfterRetryingThis"),
        },
        {
          kind: "quiz",
          id: "b6",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          chip: tr("ui.lessons.contentBooks.courseBooks.arc154Msgs08kTokens"),
          text: tr("ui.lessons.contentBooks.courseBooks.lookAtTheSpineTheArcBlock"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.witnessThePowerOfLumibooks"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.newerStoryIsAlwaysDrawnBigger") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theArcLostMostOfItsMessages") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theBarShowsTimePassingNotSize") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.theSpineIsACostMapThin"),
        },
        {
          kind: "quiz",
          id: "r1",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: tr("ui.lessons.contentBooks.courseBooks.compressionIsRunningYetYourPromptIs"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.theTailRecentMessagesAreUncompressedUntil"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.theFiledTileFilingGrowsThePrompt") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theShelfTileTooManyChapters") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theCodexTileEvenThoughYouDon") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.theUncompressedTailIsUsuallyTheFat"),
        },
      ],
    },
    {
      id: "s4",
      title: tr("ui.lessons.contentBooks.courseBooks.theShelf"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["tab.books"],
          arrive: "books.shelf.list",
          text: tr("ui.lessons.contentBooks.courseBooks.everythingIFileEndsUpOnMy"),
          done: tr("ui.lessons.contentBooks.courseBooks.myShelf"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: tr("ui.lessons.contentBooks.courseBooks.witnessMyShelfEverythingIVeFiled"),
        },
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["books.entry.c4"],
          arrive: "books.entry.actions",
          text: tr("ui.lessons.contentBooks.courseBooks.entriesOpenWithAClickTapThe"),
          done: tr("ui.lessons.contentBooks.courseBooks.thereSTheWholeRecord"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: tr("ui.lessons.contentBooks.courseBooks.youLlSeeItsSizeBeforeAnd"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: tr("ui.lessons.contentBooks.courseBooks.fadedEntriesMeansAnArcOrVolume"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: tr("ui.lessons.contentBooks.courseBooks.importantTheGhostTagMarksAChapter"),
        },
        {
          kind: "quiz",
          id: "b8",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: tr("ui.lessons.contentBooks.courseBooks.youDeleteAnArcThatWasMade"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.the3ChaptersUnhideAndInjectAgain"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.theChaptersAndAllTheirMessagesReturn") },
            { text: tr("ui.lessons.contentBooks.courseBooks.the3ChaptersAreDeletedAlongWith") },
            { text: tr("ui.lessons.contentBooks.courseBooks.prolixTakesAShit") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.deletingATierHandsTheJobBack"),
        },
        {
          kind: "quiz",
          id: "r2",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: tr("ui.lessons.contentBooks.courseBooks.halfTheChaptersHereAreFadedAnd"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.noAnArcReplacedThemTheyStay"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.yesTheyFailedToSave") },
            { text: tr("ui.lessons.contentBooks.courseBooks.yesTheirMessagesWereDeleted") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theyWereAccidentallyExcluded") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.supersededIsNormalHousekeepingAfterAnArc"),
        },
        {
          kind: "quiz",
          id: "b10",
          scored: true,
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: tr("ui.lessons.contentBooks.courseBooks.whichOfTheseButtonsActuallyCallsThe"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.regenerate"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.delete") },
            { text: tr("ui.lessons.contentBooks.courseBooks.release") },
            { text: tr("ui.lessons.contentBooks.courseBooks.exclude") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.value"),
        },
      ],
    },
    {
      id: "s5",
      title: tr("ui.lessons.contentBooks.courseBooks.composeManualControl"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "compose" },
          path: ["subtab.compose"],
          arrive: "books.compose.list",
          text: tr("ui.lessons.contentBooks.courseBooks.anywayManualControlsNext"),
          done: tr("ui.lessons.contentBooks.courseBooks.ready"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.list",
          text: tr("ui.lessons.contentBooks.courseBooks.theComposeTabIsManualModeFilter"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.compress",
          text: tr("ui.lessons.contentBooks.courseBooks.compressFilesWhatYouSelectedIntoA"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: tr("ui.lessons.contentBooks.courseBooks.excludeProtectsMessagesFromMeCompletelyPerfect"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.arcs",
          text: tr("ui.lessons.contentBooks.courseBooks.furtherDownYouCanPickChaptersTo"),
        },
        {
          kind: "quiz",
          id: "b13",
          scored: true,
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: tr("ui.lessons.contentBooks.courseBooks.whenIsExcludeTheRightToolInstead"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.whenAMessageMustStayInThe"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.whenYouWantAMessageGoneFrom") },
            { text: tr("ui.lessons.contentBooks.courseBooks.whenAChapterCameOutBadly") },
            { text: tr("ui.lessons.contentBooks.courseBooks.whenYouWishToDeceiveYourEnemy") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.excludeKeepsTheMessageFromCompressionDelete"),
        },
      ],
    },
    {
      id: "s6",
      title: tr("ui.lessons.contentBooks.courseBooks.continuityAndRepair"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "continuity" },
          path: ["subtab.continuity"],
          arrive: "books.cont.root",
          text: tr("ui.lessons.contentBooks.courseBooks.oneMoreIPromiseTapAdvanced"),
          done: tr("ui.lessons.contentBooks.courseBooks.theContinuityDesk"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: tr("ui.lessons.contentBooks.courseBooks.continuityLetsANewChatInheritAn"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: tr("ui.lessons.contentBooks.courseBooks.rebuildFromDeletesThisChatSOwn"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: tr("ui.lessons.contentBooks.courseBooks.maintenanceFixesThingsWhenTheShelfAnd"),
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: tr("ui.lessons.contentBooks.courseBooks.someRepairsIHandleMyselfDeleteOne"),
        },
        {
          kind: "quiz",
          id: "b14",
          scored: true,
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: tr("ui.lessons.contentBooks.courseBooks.youStartASequelChatItsShelf"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.rebaseDuh"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.rebuildItIsAlwaysTheSaferOption") },
            { text: tr("ui.lessons.contentBooks.courseBooks.neitherCopyTheEntriesOverByHand") },
            { text: tr("ui.lessons.contentBooks.courseBooks.detachFirstThenRebuild") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.rebaseIsForFreshChatsRebuildIs"),
        },
      ],
    },
    {
      id: "s7",
      title: tr("ui.lessons.contentBooks.courseBooks.tuningThePress"),
      steps: [
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          path: ["tab.tuning"],
          arrive: "tuning.profile.select",
          text: tr("ui.lessons.contentBooks.courseBooks.okThisIsActuallyTheLastPart"),
          done: tr("ui.lessons.contentBooks.courseBooks.myDials"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          anchor: "tuning.profile.select",
          text: tr("ui.lessons.contentBooks.courseBooks.everythingIDoIsControlledByA"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("profile");
            setSamplerView("main");
          },
          anchor: "tuning.model.connection",
          text: tr("ui.lessons.contentBooks.courseBooks.rightBelowSitsMyWritingDeskWhich"),
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setSettingsView("books"),
          path: ["subtab.settings"],
          arrive: "tuning.window",
          text: tr("ui.lessons.contentBooks.courseBooks.nextRoomTapSettings"),
          done: tr("ui.lessons.contentBooks.courseBooks.thePressRoom"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          text: tr("ui.lessons.contentBooks.courseBooks.thisIsThatWindowThingITold"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.arc",
          text: tr("ui.lessons.contentBooks.courseBooks.arcsCanBuildAutomaticallyAfterEnoughChapters"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          text: tr("ui.lessons.contentBooks.courseBooks.andThisIsTheAutomationSettingI"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "settings",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.ctx",
          text: tr("ui.lessons.contentBooks.courseBooks.contextIsJustHowManyPreviousChapters"),
        },
        {
          kind: "quiz",
          id: "b4",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.windowUnit = "tokens";
              s.activeProfile.windowValue = 18;
            },
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.window",
          chip: tr("ui.lessons.contentBooks.courseBooks.windowTokens18"),
          text: tr("ui.lessons.contentBooks.courseBooks.youSwitchTheWindowUnitFromMessages"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.chaptersOfAbout18MessagesSameAs") },
            { text: tr("ui.lessons.contentBooks.courseBooks.idk") },
            { text: tr("ui.lessons.contentBooks.courseBooks.youAskedMeToConvert18Messages") },
            { text: tr("ui.lessons.contentBooks.courseBooks.chaptersWillAutomaticallyFileAfterOnly18"), correct: true },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.theUnitChangesWhatTheNumberMeans"),
        },
        {
          kind: "quiz",
          id: "b5",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.lagValue = 10;
            },
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.lag",
          chip: tr("ui.lessons.contentBooks.courseBooks.lag10Messages"),
          text: tr("ui.lessons.contentBooks.courseBooks.youLowerTheLagFrom65Down"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.iStartSummarizingMuchCloserToThe"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.chaptersGetBigger") },
            { text: tr("ui.lessons.contentBooks.courseBooks.nothingUntilTheWindowAlsoChanges") },
            { text: tr("ui.lessons.contentBooks.courseBooks.iGoBackAndReSummarizeOld") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.aSmallLagSavesMoreSpaceBut"),
        },
        {
          kind: "quiz",
          id: "b16",
          scored: true,
          tab: "tuning",
          subtab: "settings",
          fixture: {
            variant: "tuning",
            patch: (s) => {
              s.activeProfile.windowValue = 40;
              s.activeProfile.chapterTargetPercent = 4;
            },
          },
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.chapter",
          chip: tr("ui.lessons.contentBooks.courseBooks.window40TargetPercent4"),
          text: tr("ui.lessons.contentBooks.courseBooks.youSetTheWindowTo40And"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.chaptersBecomeSmallerAndTheyCover40"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.chaptersBecomeSmallerAndMoreFrequent") },
            { text: tr("ui.lessons.contentBooks.courseBooks.theSameTheRatioOnlyAffectsArcs") },
            { text: tr("ui.lessons.contentBooks.courseBooks.unchangedUntilTheLagChangesToo") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.theWindowIsWhatGoesInThe"),
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setPromptsCategory("chapter"),
          path: ["subtab.prompts"],
          arrive: "tuning.prompts",
          text: tr("ui.lessons.contentBooks.courseBooks.andTheLastPartOfTheSettings"),
          done: tr("ui.lessons.contentBooks.courseBooks.myInstructions"),
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "prompts",
          fixture: { variant: "tuning" },
          prep: () => {
            setTuningSubtab("prompts");
            setPromptsCategory("chapter");
          },
          anchor: "tuning.prompts",
          text: tr("ui.lessons.contentBooks.courseBooks.thePromptsPaneHoldsMyInstructionsFour"),
        },
        {
          kind: "quiz",
          id: "b20",
          scored: true,
          exhibit: tr("ui.lessons.contentBooks.courseBooks.memoriaCouldnTFileTheChapterThe"),
          exhibitTone: "error",
          text: tr("ui.lessons.contentBooks.courseBooks.everyOneOfMyChaptersFailsLike"),
          options: [
            { text: tr("ui.lessons.contentBooks.courseBooks.giveMeAStrongerModelOrA"), correct: true },
            { text: tr("ui.lessons.contentBooks.courseBooks.raiseTheLag") },
            { text: tr("ui.lessons.contentBooks.courseBooks.turnOffMessageHiding") },
            { text: tr("ui.lessons.contentBooks.courseBooks.lowerTheRetryCount") },
          ],
          why: tr("ui.lessons.contentBooks.courseBooks.retriesCannotFixAModelThatKeeps"),
        },
      ],
    },
    {
      id: "finale",
      title: tr("ui.lessons.contentBooks.courseBooks.finalFuckingLee"),
      steps: [
        {
          kind: "say",
          real: true,
          tab: "home",
          text: tr("ui.lessons.contentBooks.courseBooks.practiceIsOverThisIsYourReal"),
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.file",
          expect: "create_chapter",
          optional: true,
          text: tr("ui.lessons.contentBooks.courseBooks.ifYourChatAlreadyHasEnoughStory"),
          done: tr("ui.lessons.contentBooks.courseBooks.aRealChapterFiledByYourOwn"),
          doneAnchor: "home.spine",
        },
        {
          kind: "nav",
          real: true,
          onlyFreshInstall: true,
          prep: () => {
            setTuningSubtab("profile");
            setSettingsView("books");
          },
          path: ["tab.tuning", "subtab.settings"],
          arrive: "tuning.auto",
          text: tr("ui.lessons.contentBooks.courseBooks.myAutomationSwitchLivesInTuningTap"),
          done: tr("ui.lessons.contentBooks.courseBooks.thereSTheSwitch"),
        },
        {
          kind: "do",
          real: true,
          optional: true,
          onlyFreshInstall: true,
          tab: "tuning",
          subtab: "settings",
          prep: () => {
            setTuningSubtab("settings");
            setSettingsView("books");
          },
          anchor: "tuning.auto",
          expect: "save_profile",
          text: tr("ui.lessons.contentBooks.courseBooks.turnRunAutomationOnAndILl"),
          done: tr("ui.lessons.contentBooks.courseBooks.automationIsOnILlTakeIt"),
        },
        {
          kind: "say",
          text: tr("ui.lessons.contentBooks.courseBooks.wellDoneMousepadHasLetMeKnow"),
        },
      ],
    },
  ],
};

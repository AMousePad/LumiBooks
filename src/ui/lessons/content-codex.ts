import type { LessonCourseDef } from "./lesson-types";
import { setCodexExpandedEntity, setCodexRelationsView, setCodexSubtab } from "../tabs/codex-tab";
import { setSettingsView, setTuningSubtab } from "../tabs/tuning-tab";

/** Course 2: The Archivist's Codex. A quick guided walkthrough: the user
 * navigates every pane themselves, tries the unique interactions, and only
 * answers questions about things the UI can't teach by being clicked. */
export const COURSE_CODEX: LessonCourseDef = {
  key: "codex",
  title: "The Archivist's Codex",
  sections: [
    {
      id: "s1",
      title: "Why a story bible",
      steps: [
        {
          kind: "say",
          diagram: "fade",
          text: "My chapters remember the plot. But if you compress a story hard enough you'll start losing information, like who loves whom, or who still keeps which secret. This means that somehow, we must separately track the important parts of the story as we compress it.",
        },
        {
          kind: "nav",
          tab: "home",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["tab.codex"],
          arrive: "codex.tiles",
          text: "The Knowledge Codex does this. Let's walk though a practice one for a little murder mystery, let me show you. Tap the Codex tab up top.",
          done: "There it is.",
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tiles",
          text: "Eight records make the bible: characters, locations, things, relations, a timeline, story threads, world rules, and who knows what. A small agent reads your new messages on a schedule and keeps all of it current. Each record becomes an entry in a lorebook I manage for you. The timeline and threads will always be on, and the others activate by keyword.",
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
          text: "Your character card says Elias has a scar. It never comes up in the story, and the codex never records it. Is that a bug?",
          options: [
            { text: "No. The codex only records what the story itself mentions", correct: true },
            { text: "Yes, the codex should copy everything from the card" },
            { text: "The card has to be imported into the codex first" },
            { text: "The codex only tracks characters you add by hand" },
          ],
          why: "I read your lore as reference for names and spellings, but copying it in would be duplicating information.",
        },
      ],
    },
    {
      id: "s2",
      title: "Reading the codex",
      steps: [
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.status",
          text: "The line up top is my ledger. It tells you whether a codex exists, how many new messages I haven't read yet, and when I last ran.",
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.actions",
          text: "These are the everyday actions. Update now makes me read everything up to your newest message right away. Tidy rewrites the records leaner without reading anything new. Undo rolls back my last change. Rebuild and Wipe live in the Manage tab, along with import and export.",
        },
        {
          kind: "do",
          tab: "codex",
          subtab: "overview",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          anchor: "codex.tile.relations",
          expect: "codex_set_file_state",
          text: "Every tile is one record, its count, and what it costs your prompt. The tiles are also switches. Click the Relations tile once.",
          done: "Dashed means not injected but still updated, I keep the record current while it costs you zero tokens. A second click freezes it completely, a third turns it back on. Try the full cycle if you like, then we move on.",
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
          text: "You froze Relations 40 messages ago and it now says stale. What happens when you re-enable it?",
          options: [
            { text: "It's marked as needing a catch-up, and one refresh pass rebuilds just that record from the summaries and recent messages", correct: true },
            { text: "The gap fills in automatically on the next normal update" },
            { text: "Nothing can recover the missed events except a full rebuild" },
            { text: "Tidy it, tidying re-reads the missed messages" },
          ],
          why: "My reading position is already past those messages, so normal updates never go back. The Overview offers a one-pass catch-up for every re-enabled record at once, and Rebuild stays the from-scratch option.",
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
          text: "Rebuild codex and Wipe codex both erase everything. What is actually different afterward?",
          options: [
            { text: "Rebuild re-reads the whole chat right away and keeps your tile settings. Wipe waits, and the next update starts from message one anyway", correct: true },
            { text: "After Wipe, only new messages ever get read" },
            { text: "Rebuild keeps your entries and only rewrites the stale ones" },
            { text: "Wipe also deletes your chapters and arcs" },
          ],
          why: "Both erase the records and my reading position. The difference is when the re-reading happens and whether your tile switches survive.",
        },
      ],
    },
    {
      id: "s3",
      title: "The records, hands on",
      steps: [
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("overview"),
          path: ["subtab.entities"],
          arrive: "codex.entities",
          text: "Time to meet the cast. Tap Entities.",
          done: "The cast list.",
        },
        {
          kind: "say",
          tab: "codex",
          subtab: "entities",
          fixture: { variant: "codex" },
          prep: () => setCodexSubtab("entities"),
          anchor: "codex.entities",
          text: "Every chip is an entity. Click a name and its sheet opens. A sheet describes only that one entity, and connections between entities live in the Relations record. Poke around as much as you like.",
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
          text: "I add and update all of these myself as the story goes, you never have to! But you can, if I ever write something strange, and it's a good way to learn the interface now. Try it: click the + character chip, type a name, the pawnbroker maybe, then press Save on the sheet.",
          done: "Saved. Your edits are canon now, I read them as truth and build on them.",
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
            setCodexExpandedEntity("char:elias");
          },
          anchor: "codex.entities",
          text: "The story has moved on, Elias isn't hiding anymore, but his sheet still says \"hiding in the tannery loft\". What's happening?",
          options: [
            { text: "The agent hasn't read that far yet. It catches up on its own, and you can also just edit the line right now", correct: true },
            { text: "The codex is broken, wipe it" },
            { text: "Sheets never change once written" },
            { text: "You have to delete Elias and re-add him" },
          ],
          why: "The codex updates on a schedule, so it can trail the story by a few messages. Hand edits are always safe, I treat them as canon.",
        },
        {
          kind: "nav",
          tab: "codex",
          fixture: { variant: "codex" },
          prep: () => setCodexRelationsView("list"),
          path: ["subtab.relations"],
          arrive: "codex.rel.view",
          text: "Now the web between everyone. Tap Relations.",
          done: "The web, as a list.",
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
          text: "I create these and keep these updated on my own too, but again, we can edit them manually too. Let's try it so you can see the fields. Press + Relation, connect your new character to someone. The From and To boxes suggest ids as you type. Give it a kind, like owes, and a short state, then Save.",
          done: "Recorded. Let's see it drawn.",
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
          text: "You just added a relation by hand. Will my agent overwrite or delete your work on its next pass?",
          options: [
            { text: "No. Your edits become part of the record, the agent builds on them and only rewrites what the story contradicts", correct: true },
            { text: "Yes, the agent rewrites everything from scratch each pass" },
            { text: "Yes, unless you freeze the Relations tile first" },
            { text: "Hand edits only survive while the relations table is off" },
          ],
          why: "The agent always starts from the current records, so your corrections are canon it preserves. Freezing is only for stopping updates entirely.",
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
          text: "Tap Graph.",
          done: "There's your web.",
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
          text: "This is the web for this small demo. If you tap a line, the relationship description will be under the graph, tap a diamond to open that entity's sheet, and drag nodes around freely. The remaining panes hold the rest of the bible: Timeline keeps dated events, Threads tracks open storylines, Lore holds world rules, and Secrets holds the who-knows-what. Browse them any time.",
        },
      ],
    },
    {
      id: "s4",
      title: "The agent and its dials",
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
          text: "Last stop, my dials. Open the Tuning tab, its Settings pane, then the Codex side.",
          done: "My dials.",
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.lag",
          text: "My reading rhythm lives here. By default, I hang back only 6 messages, then read about 20 per pass. If a chat falls far behind, Update catches me up in increments.",
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
          chip: "Codex lag · 65",
          text: "You raise the codex lag from 6 up to 65, same as the chapter lag. What changes?",
          options: [
            { text: "The bible always runs ~65 messages behind, which may be too far behind for what you want!", correct: true },
            { text: "Nothing, the lag only affects chapters" },
            { text: "The codex gets cheaper with no downside" },
            { text: "The agent runs more often" },
          ],
          why: "Chapters act as replacements of old messages, where the codex is a snapshot of the truth of the chat. It may be a good idea to keep it closer to the present.",
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          anchor: "tuning.codex.relations",
          text: "Two switches worth knowing here. Relations table off moves connections onto each sheet as short notes, an easier format for weaker models. Extra context mode has me write chapters early as ghosts, so I always know the story so far. My own model connection and samplers live on the Connection pane, behind its Codex toggle, and Use tool calls lives there too for providers that support them.",
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "codex",
          fixture: { variant: "codex" },
          prep: () => setTuningSubtab("codex"),
          text: "One more thing! Edit any record whenever you like, and if you edit or delete an old message I already read, my next pass notices, rewinds, and re-checks everything the codex claimed about that stretch.",
        },
        {
          kind: "quiz",
          id: "c14",
          scored: true,
          exhibit: "Memoria couldn't update the codex: The codex agent narrated instead of calling tools, check that the connection supports tool calls",
          exhibitTone: "error",
          text: "Every codex run fails with this. What is the most likely cause?",
          options: [
            { text: "The codex model cannot make tool calls, pick one that can under Codex connection", correct: true },
            { text: "The chat is too long" },
            { text: "A codex file is corrupted" },
            { text: "The Relations table is off" },
          ],
          why: "With Use tool calls on, the agent writes its records through tool calls, and a model that can only write prose cannot keep the codex that way. Turning it back off (Connection pane, Codex toggle) returns me to JSON mode, which works on every connection.",
        },
        {
          kind: "quiz",
          id: "c13",
          scored: true,
          text: "With extra context mode on, a chapter shows up on your Shelf tagged GHOST, and it isn't in the prompt. Is something wrong?",
          options: [
            { text: "No. It's a chapter written early to feed the codex, it shelves itself once its span passes the chapter lag, and deleting it is safe", correct: true },
            { text: "Yes, it's corrupted, delete it and resync" },
            { text: "Yes, it leaked in from another chat" },
            { text: "It's a draft waiting for your approval" },
          ],
          why: "Ghosts give the codex story-so-far context without touching your prompt. If you delete one I just write it again, and turning the mode off cleans them all up.",
        },
      ],
    },
    {
      id: "finale",
      title: "Opening ceremony",
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
          text: "Practice is over, this is your real archive. Walk to your own codex pane: the Tuning tab, then Settings, then its Codex side.",
          done: "Already there. Good.",
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
          text: "Flip Enabled on. The default settings below suit most chats.",
          done: "Enabled! From now on I keep your story bible current after every message.",
        },
        {
          kind: "nav",
          real: true,
          optional: true,
          path: ["tab.home"],
          arrive: "home.actions.updatecodex",
          text: "Home has an Update codex button now. Let's go find it. Tap Home.",
          done: "There it is.",
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.updatecodex",
          expect: "codex_update_now",
          optional: true,
          text: "Press it and I'll read this chat right away, or skip and I'll start after your next message.",
          done: "Reading! Watch the busy row on Home if you want to see me think.",
        },
        {
          kind: "say",
          text: "And that's the whole archive. Your diploma is ready, signed by the proudest librarian you know.",
        },
      ],
    },
  ],
};

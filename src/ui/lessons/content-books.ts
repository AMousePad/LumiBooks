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
  title: "The Librarian's Primer",
  sections: [
    {
      id: "s1",
      title: "Why Memoria exists",
      steps: [
        {
          kind: "say",
          diagram: "rot",
          text: "Why do I exist? As you roleplay, you'll notice that chats that are very large can't fit in model's context. Old messages get clipped out, and your model will soon forget important information. How do we fix that?",
        },
        {
          kind: "say",
          diagram: "fold",
          text: "That's what I do! I take your older messages, and compact, or file, chunks of them into summaries called chapters. When there are too many summaries, I compact them into arcs, and then volumes. Each summary is injected in place of the messages it replaces, so your chat history timeline is preserved!",
        },
        {
          kind: "say",
          diagram: "unfold",
          text: "Compacted messages are hidden so your writer reads my compact summary instead. If you delete a chapter, the messages that it once covered unhide.",
        },
        {
          kind: "quiz",
          id: "b1",
          scored: true,
          diagram: "fold",
          text: "After I compact messages of range 1-18 into a chapter, what does the LLM model see for that range?",
          options: [
            { text: "Both the summary and the original messages" },
            { text: "Nothing, it's forgotten!" },
            { text: "The chapter summary, at the same spot in the history", correct: true },
            { text: "A lorebook entry in the world-info section of the prompt" },
          ],
          why: "The summary replaces the messages in place. I also keep my entries out of the normal lore section to prevent double injections.",
        },
      ],
    },
    {
      id: "s2",
      title: "The first filing",
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions",
          text: "This is a practice chat I made just for teaching, so nothing you do here touches your real stories. These highlighted buttons are my quick actions.",
        },
        {
          kind: "do",
          tab: "home",
          fixture: { variant: "filing" },
          anchor: "home.actions.file",
          expect: "create_chapter",
          text: "This practice story has plenty of old messages ready to compact. Press the File chapter button and watch what happens.",
          done: "Filed! The new chapter is on my shelf, and this colored bar changed shape, because those messages now exist as a summary.",
          doneAnchor: "home.spine",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: "There's automation too! When do I file on my own? There's two numbers that decide. The first is the lag: the newest messages that I won't begin to compact, 65 by default. Uncompressed messages are large, but always hold more information, so we let the model have the most recent ones when we can.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: "The second is the window: how many messages get bundled into one chapter, 18 by default. Once 18 old messages have piled up behind the 65 protected ones, these two \"pills\" both say \"ready\", I begin compressing them.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.pills",
          text: "The default values are made for 200k context chats. Adjust the lag and window to your liking, depending on your context, and your message size!",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: "\"File all\" files chapters until the lag is reached. Bind arc takes my oldest chapters and compresses them into one smaller summary called an arc. When work is waiting to be done, a little pill appears here telling you how much.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.bookpill",
          text: "Everything I file is stored in a lorebook created just for this chat, named after it. It appears the first time a chapter is filed.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "filing-after" },
          anchor: "home.actions",
          text: "Normally you never need these buttons with automation on, I do all of this myself after each message. If a button looks dead, the small text under it says why, usually that I'm busy or the extension is switched off.",
        },
        {
          kind: "quiz",
          id: "b3",
          scored: true,
          tab: "home",
          fixture: { variant: "pills" },
          anchor: "home.pills",
          chip: "70 old messages · lag 65 · window 18",
          text: "These pills say lag ready but window building, and I'm not filing. Why not?",
          options: [
            { text: "The lag has not filled up yet" },
            { text: "The chat has no lorebook yet" },
            { text: "70 messages minus the 65 protected by the lag leaves only 5, and a chapter needs 18", correct: true },
            { text: "A chapter can only be filed after an arc exists" },
          ],
          why: "The window only counts messages older than the lag. 70 minus 65 is 5, short of 18. This is also when I'd notify you that your story needs more messages if you click file~",
        },
      ],
    },
    {
      id: "s3",
      title: "The desk",
      steps: [
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: "This colored bar is the spine, a map of your whole chat. Each block is a stretch of story, sized by how much prompt space it costs right now. The pale block at the front is the codex, that's my second course.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          text: "Click any colored block and I'll jump you straight to that chapter or arc on my shelf. Handy when you want to check what I wrote about a scene.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.breakdown",
          text: "The list under it shows the same picture in numbers: what my volumes, arcs, and chapters cost, plus the recent messages I haven't touched yet.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: "These tiles are the quick summary. Filed is how much of the chat I've compacted. Tail is the recent part I haven't. Shelf counts everything I've made. The Codex tile belongs to my second course.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.prompt",
          text: "The Prompt panel shows the actual prompt your last generation sent, split into groups. Simulate builds the next prompt without generating anything. And if the prompt goes past 90% of the model's limit, I warn you here.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.busy",
          text: "While I write, a busy row like this appears. Watch lets you read my raw output live as it streams, thoughts included. Abort cancels me mid-write.",
        },
        {
          kind: "say",
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.failure",
          text: "If I fail even after retrying, this red box keeps the error and gives you a Retry button.",
        },
        {
          kind: "quiz",
          id: "b6",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.spine",
          chip: "ARC 1 · 54 msgs → 0.8k tokens",
          text: "Look at the spine. The arc block at the far left covers 54 messages but is drawn as a thin sliver, while the uncompressed tail at the end takes most of the bar. Why?",
          options: [
            { text: "Blocks are sized by what they cost the prompt now, and the arc squeezed its 54 messages into a few hundred tokens", correct: true },
            { text: "Newer story is always drawn bigger" },
            { text: "The arc lost most of its messages" },
            { text: "The bar shows time passing, not size" },
          ],
          why: "The spine is a cost map. Thin blocks mean compression is working, the fat block is the raw tail still riding at full price.",
        },
        {
          kind: "quiz",
          id: "r1",
          scored: true,
          tab: "home",
          fixture: { variant: "desk" },
          anchor: "home.tiles",
          text: "Compression is running and plenty is filed, yet your prompt is still huge. Which number on this desk explains it?",
          options: [
            { text: "The Tail tile, recent messages ride at full size until they pass the lag", correct: true },
            { text: "The Filed tile, filing grows the prompt" },
            { text: "The Shelf tile, too many chapters" },
            { text: "The Codex tile, the bible got too big" },
          ],
          why: "The uncompressed tail is usually the fat part of the prompt. If it doesn't fit your context, lower the lag so I file closer to the present.",
        },
      ],
    },
    {
      id: "s4",
      title: "The Shelf",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["tab.books"],
          arrive: "books.shelf.list",
          text: "Everything I file ends up on my Shelf. Let's visit it. Tap the Books tab.",
          done: "My shelf.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Welcome to my Shelf. Everything I've filed for this chat lives here, sorted into volumes, arcs, and chapters. The search box digs through titles and the full summary text.",
        },
        {
          kind: "nav",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          path: ["books.entry.c4"],
          arrive: "books.entry.actions",
          text: "Entries open with a click. Tap the chapter called The Captain Asks Questions.",
          done: "There's the whole record.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => focusShelfEntry("c4"),
          anchor: "books.entry.actions",
          text: "You'll see its size before and after compacting, my little note, and four buttons. Edit rewrites the text. Regenerate throws the summary away and writes it again from the same messages. Release turns it into a normal lorebook entry that I stop managing. Delete removes it.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Faded entries are marked superseded. That means an arc or volume replaced them, so they stay stored but no longer go into the prompt. Delete the arc and its chapters wake up and take over again.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "shelf",
          fixture: { variant: "shelf" },
          prep: () => setBooksSubtab("shelf"),
          anchor: "books.shelf.list",
          text: "Hidden messages only return to the prompt when nothing covers them at all, no chapter, arc, or volume. Oh, and a GHOST tag marks a chapter I prepared early but haven't shelved yet. My codex course explains those.",
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
          text: "You delete an arc that was made from 3 chapters. What happens?",
          options: [
            { text: "The 3 chapters wake up and inject again, and the messages stay hidden", correct: true },
            { text: "The chapters and all their messages return to the prompt" },
            { text: "The 3 chapters are deleted along with the arc" },
            { text: "Nothing happens until you resync" },
          ],
          why: "Deleting a tier hands the job back down to the one below. The messages themselves only return when nothing covers them at all.",
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
          text: "Half the chapters here are faded and labeled superseded. Did something break?",
          options: [
            { text: "No, an arc replaced them, they stay stored while the arc speaks for those scenes", correct: true },
            { text: "Yes, they failed to save" },
            { text: "Yes, their messages were deleted" },
            { text: "They were accidentally excluded" },
          ],
          why: "Superseded is normal housekeeping after an arc binds. Delete the arc and those chapters wake up again.",
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
          text: "Which of these buttons actually calls the AI model?",
          options: [
            { text: "Regenerate", correct: true },
            { text: "Delete" },
            { text: "Release" },
            { text: "Exclude" },
          ],
          why: "Delete, release, and exclude are just bookkeeping. Regenerate asks the model to write the summary again, which costs a call.",
        },
      ],
    },
    {
      id: "s5",
      title: "Compose, manual control",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "compose" },
          path: ["subtab.compose"],
          arrive: "books.compose.list",
          text: "Next door is manual mode. Tap Compose.",
          done: "Manual controls.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.list",
          text: "The Compose tab is manual mode, every message in the chat listed for you. Filter or search them, tick the boxes, and shift-click (or long-press on a phone) to grab a whole range. A ✓ means already filed, a ⊘ means excluded.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.compress",
          text: "Compress takes exactly what you selected and files it as one chapter. Here your selection is the boss, my 18-message window setting only applies to automatic filing.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.exclude",
          text: "Exclude protects messages from me completely. Perfect for OOC notes or instructions that must stay word-for-word. I also never bundle across an excluded message.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "compose",
          fixture: { variant: "compose" },
          prep: () => setBooksSubtab("compose"),
          anchor: "books.compose.arcs",
          text: "Further down you can pick chapters to bind into an arc, and arcs to press into a volume. Volumes are the strongest compression, and they are only ever made by hand, right here.",
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
          text: "When is Exclude the right tool, instead of Delete?",
          options: [
            { text: "When a message must stay in the prompt word-for-word and never be summarized", correct: true },
            { text: "When you want a message gone from the chat" },
            { text: "When a chapter came out badly" },
            { text: "When you want to hide spoilers from yourself" },
          ],
          why: "Exclude keeps the message and protects it from me. Delete removes it from the chat entirely.",
        },
      ],
    },
    {
      id: "s6",
      title: "Continuity and repair",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "continuity" },
          path: ["subtab.continuity"],
          arrive: "books.cont.root",
          text: "One pane left here. Tap Advanced.",
          done: "The continuity desk.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: "Continuity lets a new chat inherit an old chat's memories. Rebase copies another chat's chapters and arcs in as a frozen prologue, marked [Root], injected before your very first message.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.cont.root",
          text: "\"Rebuild from\"  deletes this chat's own memories first, then starts over on top of the inherited ones. Detach removes inherited memories again. And if you branch a chat, the new branch inherits my shelf automatically.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: "Maintenance fixes things when the shelf and the chat disagree. Resync visibility unhides any message whose chapter no longer exists and re-hides the rest properly. Rebuild books wipes my work and re-summarizes the whole chat. Wipe books just wipes.",
        },
        {
          kind: "say",
          tab: "books",
          subtab: "continuity",
          fixture: { variant: "continuity" },
          prep: () => setBooksSubtab("continuity"),
          anchor: "books.maint",
          text: "Some repairs I handle myself. Delete one of my entries in the Lorebook drawer and I notice, unhide its messages, and toast you about it. If a chat's lorebook link ever breaks, I re-link it and tell you.",
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
          text: "You start a sequel chat. Its shelf is empty, and you pick the old chat as a source. Rebase or Rebuild?",
          options: [
            { text: "Rebase, there is nothing to delete and the old memories arrive as a prologue", correct: true },
            { text: "Rebuild, it is always the safer option" },
            { text: "Neither, copy the entries over by hand" },
            { text: "Detach first, then Rebuild" },
          ],
          why: "Rebase is for fresh chats. Rebuild is for chats that already have their own memories that need replacing.",
        },
      ],
    },
    {
      id: "s7",
      title: "Tuning the press",
      steps: [
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          path: ["tab.tuning"],
          arrive: "tuning.profile.select",
          text: "Last room, where all my dials live. Tap the Tuning tab.",
          done: "My dials.",
        },
        {
          kind: "say",
          tab: "tuning",
          subtab: "profile",
          fixture: { variant: "tuning" },
          prep: () => setTuningSubtab("profile"),
          anchor: "tuning.profile.select",
          text: "Everything I do is controlled by a profile, and the active profile applies to all of your chats at once. The Extension checkbox is my master switch, off means I do nothing anywhere.",
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
          text: "Right below sits my writing desk: which AI connection I write with, plus my sampler settings. Empty sampler fields fall back to my summarizing defaults, temperature 0.4 among them. The big toggle up top switches to the codex's own connection and samplers, that's my second course.",
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setSettingsView("books"),
          path: ["subtab.settings"],
          arrive: "tuning.window",
          text: "Next room. Tap Settings.",
          done: "The press room.",
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
          text: "Compression targets shape my chapters. The window is how much story goes in, 18 messages by default. The ratio is how much text comes out, either a percent of the input or a fixed token amount.",
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
          text: "Arcs can build automatically after enough chapters pile up, after enough tokens, or only by hand. The arc lag holds back your newest chapters so recent scenes keep their chapter-level detail.",
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
          text: "The Automation section is my hands-free mode. The master toggle covers chapters, arcs, and branch adoption. The codex has its own switch on this pane's Codex side.",
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
          text: "Context: how many of my previous chapters I re-read for continuity when writing a new one (7 by default), how many times I retry after a failure, and how long I wait for a slow provider before giving up.",
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
          anchor: "tuning.behavior.preview",
          text: "Behavior: Hide messages once filed greys out covered messages in your chat. Preview before saving makes me show you drafts in Home → Pending previews instead of saving directly. Regex scripts can rewrite what I read and what I write. Below that, Everywhere holds switches for your whole account, like Force constant.",
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
          chip: "Window · tokens · 18",
          text: "You switch the window unit from messages to tokens, but leave the value at 18. What did you just ask me for?",
          options: [
            { text: "Chapters of about 18 messages, same as before" },
            { text: "Nothing changes until the lag unit is also switched" },
            { text: "You asked me to convert 18 messages into tokens" },
            { text: "Chapters will automatically file after only ~18 tokens of story, about one sentence each. Uh oh. ", correct: true },
          ],
          why: "The unit changes what the number means. Tokens are little word-pieces, one message is hundreds of them, so token windows want values in the thousands.",
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
          anchor: "tuning.auto",
          chip: "Lag · 10 messages",
          text: "You lower the lag from 65 down to 10. What changes?",
          options: [
            { text: "I start summarizing much closer to the present, only your 10 newest messages stay untouched", correct: true },
            { text: "Chapters get bigger" },
            { text: "Nothing until the window also changes" },
            { text: "I go back and re-summarize old chapters" },
          ],
          why: "A small lag saves more space but summarizes your recent scenes sooner. Keep it big enough that your current scene survives in full.",
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
          anchor: "tuning.window",
          chip: "Window · 40 · Chapter % · 4",
          text: "You set the window to 40 and the chapter ratio to 4% (defaults are 18 and 15%). What do your chapters become?",
          options: [
            { text: "Chapters become smaller, and they cover 40 messages each.", correct: true },
            { text: "Chapters become smaller and more frequent" },
            { text: "The same, the ratio only affects arcs" },
            { text: "Unchanged until the lag changes too" },
          ],
          why: "The window is what goes in, the ratio is what comes out. At 4%, a whole scene keeps barely a sentence.",
        },
        {
          kind: "nav",
          fixture: { variant: "tuning" },
          prep: () => setPromptsCategory("chapter"),
          path: ["subtab.prompts"],
          arrive: "tuning.prompts",
          text: "And the last one. Tap Prompts.",
          done: "My instructions.",
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
          text: "The Prompts pane holds my instructions. Four built-in chapter styles, or duplicate one and edit it, or import your old STMB presets. Dry run shows the exact final prompt I would send, without spending a single token.",
        },
        {
          kind: "quiz",
          id: "b20",
          scored: true,
          exhibit: "Memoria couldn't file the chapter: The model didn't return valid JSON",
          exhibitTone: "error",
          text: "Every one of my chapters fails like this, even after retries. The most likely fix?",
          options: [
            { text: "Give me a stronger model or a different connection", correct: true },
            { text: "Raise the lag" },
            { text: "Turn off message hiding" },
            { text: "Lower the retry count" },
          ],
          why: "Retries cannot fix a model that keeps writing broken JSON. Also check that custom prompts or regex scripts are not mangling my output.",
        },
      ],
    },
    {
      id: "finale",
      title: "The first real filing",
      steps: [
        {
          kind: "say",
          real: true,
          tab: "home",
          text: "Practice is over. This is your real desk, live and yours.",
        },
        {
          kind: "do",
          real: true,
          tab: "home",
          anchor: "home.actions.file",
          expect: "create_chapter",
          optional: true,
          text: "If your chat already has enough story, press File chapter for real and watch me work. If not, skip this, I'll start on my own once it does.",
          done: "A real chapter, filed by your own hand!",
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
          text: "One more walk. My automation switch lives in Tuning. Tap the Tuning tab, then Settings.",
          done: "There's the switch.",
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
          text: "One last act. Turn Run automation on, and I'll handle the filing myself after every message from now on.",
          done: "Automation is on. I'll take it from here!",
        },
        {
          kind: "say",
          text: "That's the whole Primer. Sign my register and take your diploma. The Codex course is waiting whenever you're curious.",
        },
      ],
    },
  ],
};

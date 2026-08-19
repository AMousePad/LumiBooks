import type { FrontendState, FrontendToBackend } from "../../types";
import type { LMBProfile, SamplerSet } from "../../shared";
import { CODEX_SAMPLER_DEFAULTS, SAMPLER_DEFAULTS, makeDefaultProfile } from "../../shared";

const PROFILE_DEFAULTS = makeDefaultProfile("__defaults__", "Defaults");
// Token-mode blank-field fallbacks for the codex cadence: the shared defaults
// (6 / 24) are message counts and would be nonsense as token budgets.
const CODEX_LAG_TOKENS_DEFAULT = 2000;
const CODEX_WINDOW_TOKENS_DEFAULT = 8000;
import {
  checkbox,
  field,
  labelled,
  lessonMark,
  makeButton,
  multiSelect,
  numberInput,
  section,
  select,
  textInput,
  textNode,
} from "../components";
import { promptForString } from "../modals";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";

/* Section renderers below are composed into subtab panes by tuning-tab.ts. */

export function renderCodexSettings(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
): void {
  void state;
  const sec = section("Knowledge Codex");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "An agent reads new turns and keeps per-chat lorebook records of characters, locations, things, relations, timeline, threads, world rules, and who-knows-what.";
  sec.body.appendChild(help);

  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexEnabled,
    label: "Enabled",
    hint: "Runs automatically after generations once the backlog fills. Manual updates live on Home and the Codex tab.",
    onChange: (v) => patch({ codexEnabled: v }),
  }), "tuning.codex.enabled"));

  sec.body.appendChild(checkbox({
    checked: profile.codexManualOnly,
    label: "Manual only",
    hint: "Memoria never updates the codex on her own. Lag and window are ignored, use Update now on Home or the Codex tab.",
    onChange: (v) => patch({ codexManualOnly: v }),
  }));

  const fields = document.createElement("div");
  fields.className = profile.codexEnabled && !profile.codexManualOnly
    ? "lmb-subgroup"
    : "lmb-subgroup lmb-greyed";
  sec.body.appendChild(fields);

  const lagGrid = document.createElement("div");
  lagGrid.className = "lmb-grid-2";
  lessonMark(lagGrid, "tuning.codex.lag");
  lagGrid.append(
    labelled("Lag unit", select({
      value: profile.codexLagUnit,
      options: [
        { value: "messages", label: "messages" },
        { value: "tokens", label: "tokens" },
      ],
      onChange: (v) => patch({ codexLagUnit: v === "tokens" ? "tokens" : "messages" }),
    })),
    labelled(
      profile.codexLagUnit === "tokens" ? "Lag tokens" : "Lag messages",
      numberInput({
        value: profile.codexLagValue,
        min: 0,
        max: profile.codexLagUnit === "tokens" ? 1000000 : 100000,
        step: profile.codexLagUnit === "tokens" ? 50 : 1,
        defaultValue: profile.codexLagUnit === "tokens" ? CODEX_LAG_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexLagValue,
        onBlur: (v) => patch({ codexLagValue: v ?? (profile.codexLagUnit === "tokens" ? CODEX_LAG_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexLagValue) }),
      }),
    ),
  );
  fields.appendChild(lagGrid);

  const windowGrid = document.createElement("div");
  windowGrid.className = "lmb-grid-2";
  lessonMark(windowGrid, "tuning.codex.window");
  windowGrid.append(
    labelled("Window unit", select({
      value: profile.codexWindowUnit,
      options: [
        { value: "messages", label: "messages" },
        { value: "tokens", label: "tokens" },
      ],
      onChange: (v) => patch({ codexWindowUnit: v === "tokens" ? "tokens" : "messages" }),
    })),
    labelled(
      profile.codexWindowUnit === "tokens" ? "Window tokens" : "Window messages",
      numberInput({
        value: profile.codexWindowValue,
        min: 1,
        max: profile.codexWindowUnit === "tokens" ? 1000000 : 100000,
        step: profile.codexWindowUnit === "tokens" ? 100 : 1,
        defaultValue: profile.codexWindowUnit === "tokens" ? CODEX_WINDOW_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexWindowValue,
        onBlur: (v) => patch({ codexWindowValue: v ?? (profile.codexWindowUnit === "tokens" ? CODEX_WINDOW_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexWindowValue) }),
      }),
    ),
  );
  fields.appendChild(windowGrid);

  if (profile.codexWindowUnit === "messages") {
    fields.appendChild(
      lessonMark(labelled("Tokens breakpoint", numberInput({
        value: profile.codexTokenBreakpoint,
        min: 1000,
        max: 1000000,
        step: 5000,
        defaultValue: PROFILE_DEFAULTS.codexTokenBreakpoint,
        onBlur: (v) => patch({ codexTokenBreakpoint: v ?? PROFILE_DEFAULTS.codexTokenBreakpoint }),
      })), "tuning.codex.breakpoint"),
    );
    const bpHint = document.createElement("div");
    bpHint.className = "lmb-field-hint";
    bpHint.textContent = "The window fires at whichever arrives first: the message count above or this many tokens. Keeps verbose chats from building enormous chunks.";
    fields.appendChild(bpHint);
  }

  const cadenceHint = document.createElement("div");
  cadenceHint.className = "lmb-field-hint";
  cadenceHint.textContent =
    "Lag is the recent tail the codex leaves alone until it settles. Once a window's worth of older messages piles up behind it, the agent consumes them in one pass. Keep the lag smaller than the chapter lag if you want the codex fresher than the summaries.";
  fields.appendChild(cadenceHint);

  const loreGrid = document.createElement("div");
  loreGrid.className = "lmb-grid-2";
  loreGrid.append(
    labelled("Lore limit", select({
      value: profile.codexLoreLimitUnit,
      options: [
        { value: "percent", label: "% of max context" },
        { value: "tokens", label: "token cap" },
      ],
      onChange: (v) => patch({ codexLoreLimitUnit: v === "tokens" ? "tokens" : "percent" }),
    })),
    labelled(
      profile.codexLoreLimitUnit === "tokens" ? "Lore tokens (0 = no limit)" : "Lore % of max context",
      numberInput({
        value: profile.codexLoreLimitUnit === "tokens" ? profile.codexLoreLimitTokens : profile.codexLoreLimitPercent,
        min: profile.codexLoreLimitUnit === "tokens" ? 0 : 1,
        max: profile.codexLoreLimitUnit === "tokens" ? 1000000 : 100,
        step: profile.codexLoreLimitUnit === "tokens" ? 500 : 1,
        defaultValue: profile.codexLoreLimitUnit === "tokens" ? PROFILE_DEFAULTS.codexLoreLimitTokens : PROFILE_DEFAULTS.codexLoreLimitPercent,
        onBlur: (v) => {
          if (v === null) return;
          if (profile.codexLoreLimitUnit === "tokens") patch({ codexLoreLimitTokens: v });
          else patch({ codexLoreLimitPercent: v });
        },
      }),
    ),
  );
  fields.appendChild(loreGrid);
  const loreHint = document.createElement("div");
  loreHint.className = "lmb-field-hint";
  loreHint.textContent =
    "Your activated lorebook entries ride every codex pass as read-only canon reference, budgeted at a quarter of the codex max input by default. Entries past the limit are skipped whole in activation order and the omission is marked for the agent. In token mode 0 removes the limit.";
  fields.appendChild(loreHint);

  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexRelationsTable,
    label: "Relations table",
    hint: "Tracks connections between entities as one shared table with integrity checks. When off, relationships live as short notes on each entity sheet instead.",
    onChange: (v) => patch({ codexRelationsTable: v }),
  }), "tuning.codex.relations"));

  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexThorough,
    label: "Thorough mode",
    hint: "Spends one extra verification round per update to sweep for stale info and compress bloat.",
    onChange: (v) => patch({ codexThorough: v }),
  }), "tuning.codex.thorough"));

  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexExtraContext,
    label: "Extra context mode",
    hint: "Summarizes chapters early at the codex lag as ghost chapters. Ghosts feed the agent story-so-far context and are promoted into real chapters once the chapter lag arrives, with no second summarization.",
    onChange: (v) => patch({ codexExtraContext: v }),
  }), "tuning.codex.extra"));

  const soFarFields = document.createElement("div");
  soFarFields.className = profile.codexExtraContext ? "" : "lmb-greyed";
  soFarFields.appendChild(
    labelled("Chapters provided", numberInput({
      value: profile.codexStorySoFarCount,
      min: 0,
      max: 50,
      defaultValue: PROFILE_DEFAULTS.codexStorySoFarCount,
      onBlur: (v) => patch({ codexStorySoFarCount: v ?? PROFILE_DEFAULTS.codexStorySoFarCount }),
    })),
  );
  const soFarHint = document.createElement("div");
  soFarHint.className = "lmb-field-hint";
  soFarHint.textContent = "How many recent chapter summaries extra context mode hands the agent as story-so-far grounding.";
  soFarFields.appendChild(soFarHint);
  fields.appendChild(soFarFields);

  const modelHint = document.createElement("div");
  modelHint.className = "lmb-field-hint";
  modelHint.textContent = "The codex agent's connection and samplers live on the Connection pane, behind the Codex toggle.";
  fields.appendChild(modelHint);

  host.appendChild(sec.wrap);
}

/** The codex agent's own connection plus its tool-calling switch. Lives on
 * the Connection pane behind the Codex toggle, next to the codex samplers. */
export function renderCodexConnection(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
): void {
  const sec = section("Codex connection");
  const connOpts = [
    { value: "", label: "Same as Summary Connection" },
    ...state.connections.map((c) => ({
      value: c.id,
      label: `${c.name} - ${c.provider}${c.model ? "/" + c.model : ""}${c.isDefault ? " (default)" : ""}`,
    })),
  ];
  sec.body.appendChild(
    lessonMark(select({
      value: profile.codexConnectionId ?? "",
      options: connOpts,
      onChange: (v) => patch({ codexConnectionId: v || null }),
    }), "tuning.codex.connection"),
  );

  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexUseTools,
    label: "Use tool calls",
    hint: "Off by default: the agent writes one strict JSON reply, which every provider route can carry. Turn on for structured tool calls if your connection delivers them reliably.",
    onChange: (v) => patch({ codexUseTools: v }),
  }), "tuning.codex.usetools"));

  sec.body.appendChild(labelled("Update delivery", select({
    value: profile.codexWriteMode,
    options: [
      { value: "batch", label: "All records at once" },
      { value: "sequential", label: "One record at a time" },
    ],
    onChange: (v) => patch({ codexWriteMode: v === "sequential" ? "sequential" : "batch" }),
  })));
  const seqHelp = document.createElement("div");
  seqHelp.className = "lmb-help";
  seqHelp.textContent =
    "Memoria always makes sure every record is dealt with before she accepts an update, so all at once is the cheaper choice and is fine for most models. Switch to one at a time if your model keeps getting cut off partway through a long answer.";
  sec.body.appendChild(seqHelp);

  host.appendChild(sec.wrap);
}

export function renderResetSettings(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const profile = state.activeProfile;
  const sec = section("Reset");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "Resets this profile's settings to their defaults.";
  sec.body.appendChild(help);

  const IDLE = "Reset profile to defaults";
  const CONFIRM = "Click again to confirm";
  let btn: HTMLButtonElement;
  let armed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const disarm = (): void => {
    armed = false;
    if (timer) { clearTimeout(timer); timer = undefined; }
    btn.textContent = IDLE;
  };
  btn = makeButton(IDLE, () => {
    if (!armed) {
      armed = true;
      btn.textContent = CONFIRM;
      timer = setTimeout(disarm, 3000);
      return;
    }
    disarm();
    send({
      type: "save_profile",
      profile: makeDefaultProfile(profile.id, profile.name),
      chatId: state.activeChatId,
    });
  }, { danger: true });
  sec.body.appendChild(btn);

  host.appendChild(sec.wrap);
}

export function renderProfilePicker(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Profile");
  const row = document.createElement("div");
  row.className = "lmb-field-row";
  lessonMark(row, "tuning.profile.select");

  const grow = document.createElement("div");
  grow.className = "lmb-grow";
  grow.appendChild(
    select({
      value: state.activeProfile.id,
      options: state.settings.profiles.map((p) => ({ value: p.id, label: p.name })),
      onChange: (v) => send({ type: "set_active_profile", profileId: v, chatId: state.activeChatId }),
    }),
  );
  row.appendChild(grow);
  row.append(
    makeButton("New", async () => {
      const name = await promptForString(ctx, "New profile name", "");
      if (!name) return;
      send({ type: "create_profile", name, chatId: state.activeChatId });
    }, { small: true }),
    makeButton("Delete", () => {
      send({ type: "delete_profile", profileId: state.activeProfile.id, chatId: state.activeChatId });
    }, { small: true, danger: true, disabled: state.settings.profiles.length <= 1 }),
  );
  sec.body.appendChild(row);

  const profile = state.activeProfile;
  const nameField = field("Profile name");
  nameField.body.appendChild(
    textInput({
      value: profile.name,
      onBlur: (v) => send({ type: "save_profile", profile: { id: profile.id, name: v.slice(0, 60) }, chatId: state.activeChatId }),
    }),
  );
  sec.body.appendChild(nameField.wrap);

  const enableWrap = field("Extension");
  enableWrap.body.appendChild(
    checkbox({
      checked: state.settings.enabled,
      label: "Enabled",
      hint: "Master switch. When off, Memoria does nothing on this account.",
      onChange: (v) => send({ type: "save_settings", patch: { enabled: v }, chatId: state.activeChatId }),
    }),
  );
  sec.body.appendChild(enableWrap.wrap);

  host.appendChild(sec.wrap);
}

export function renderAutomation(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section("Automation");
  lessonMark(sec.wrap, "tuning.auto");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "Everything in this section runs in the background after each generation. Manual actions on Home and in Books → Compose always work regardless of these toggles.";
  sec.body.appendChild(help);

  sec.body.appendChild(checkbox({
    checked: profile.autoCreate,
    label: "Run automation",
    hint: "Master toggle. When off, Memoria only acts on manual triggers.",
    onChange: (v) => patch({ autoCreate: v }),
  }));

  const subsWrap = document.createElement("div");
  subsWrap.className = profile.autoCreate ? "lmb-subgroup" : "lmb-subgroup lmb-greyed";
  sec.body.appendChild(subsWrap);

  const chapterGroupTitle = document.createElement("div");
  chapterGroupTitle.className = "lmb-subgroup-title";
  chapterGroupTitle.textContent = "Auto-file chapters";
  subsWrap.appendChild(chapterGroupTitle);

  subsWrap.appendChild(checkbox({
    checked: profile.autoCreateChapter,
    label: "Enabled",
    hint: "Compresses the oldest uncovered window into a chapter once thresholds are met.",
    onChange: (v) => patch({ autoCreateChapter: v }),
  }));

  const chapterFields = document.createElement("div");
  chapterFields.className = profile.autoCreateChapter ? "" : "lmb-greyed";
  subsWrap.appendChild(chapterFields);

  const lagGrid = document.createElement("div");
  lagGrid.className = "lmb-grid-2";
  lagGrid.append(
    labelled("Lag unit", select({
      value: profile.lagUnit,
      options: [
        { value: "messages", label: "messages" },
        { value: "tokens", label: "tokens" },
      ],
      onChange: (v) => patch({ lagUnit: v === "tokens" ? "tokens" : "messages" }),
    })),
    labelled(
      profile.lagUnit === "tokens" ? "Lag tokens" : "Lag messages",
      numberInput({
        value: profile.lagValue,
        min: 0,
        max: profile.lagUnit === "tokens" ? 1000000 : 100000,
        step: profile.lagUnit === "tokens" ? 50 : 1,
        defaultValue: PROFILE_DEFAULTS.lagValue,
        onBlur: (v) => patch({ lagValue: v ?? PROFILE_DEFAULTS.lagValue }),
      }),
    ),
  );
  chapterFields.appendChild(lagGrid);

  const scheduleHint = document.createElement("div");
  scheduleHint.className = "lmb-field-hint";
  scheduleHint.textContent = "Lag is the most-recent portion Memoria leaves uncompressed. Once the lag is full and there's a window's worth of older messages behind it, Memoria files them. In token mode, the lag bucket includes messages up to and including the one that hits the token limit.";
  chapterFields.appendChild(scheduleHint);

  const arcGroupTitle = document.createElement("div");
  arcGroupTitle.className = "lmb-subgroup-title";
  arcGroupTitle.style.marginTop = "6px";
  arcGroupTitle.textContent = "Auto-bind arcs";
  subsWrap.appendChild(arcGroupTitle);

  subsWrap.appendChild(checkbox({
    checked: profile.autoCreateArc,
    label: "Enabled",
    hint: "Rolls oldest chapters into an arc once the threshold is met, leaving the recent ones as lag.",
    onChange: (v) => patch({ autoCreateArc: v }),
  }));

  const arcFields = document.createElement("div");
  arcFields.className = profile.autoCreateArc ? "" : "lmb-greyed";
  subsWrap.appendChild(arcFields);

  const arcGrid = document.createElement("div");
  arcGrid.className = "lmb-grid-2";
  lessonMark(arcGrid, "tuning.arc");
  arcGrid.append(
    labelled("Trigger", select({
      value: profile.arcTrigger,
      options: [
        { value: "chapters", label: "after N chapters" },
        { value: "tokens", label: "after N tokens" },
        { value: "manual", label: "manual only" },
      ],
      onChange: (v) => patch({ arcTrigger: v === "tokens" || v === "manual" ? v : "chapters" }),
    })),
    labelled(
      profile.arcTrigger === "tokens" ? "Lag tokens" : "Lag chapters",
      numberInput({
        value: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters,
        min: 0,
        max: profile.arcTrigger === "tokens" ? 200000 : 100,
        step: profile.arcTrigger === "tokens" ? 100 : 1,
        disabled: profile.arcTrigger === "manual",
        defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcLagTokens : PROFILE_DEFAULTS.arcLagChapters,
        onBlur: (v) => {
          if (v === null) return;
          if (profile.arcTrigger === "tokens") patch({ arcLagTokens: v });
          else patch({ arcLagChapters: v });
        },
      }),
    ),
  );
  arcFields.appendChild(arcGrid);

  const arcHint = document.createElement("div");
  arcHint.className = "lmb-field-hint";
  arcHint.textContent = "Arc lag reserves the most-recent chapters and never binds them, so you keep some chapter-level detail.";
  arcFields.appendChild(arcHint);

  host.appendChild(sec.wrap);
}

export function renderCompressionTargets(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section("Compression targets");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "How much Memoria compresses each chapter and arc, and how much input goes into each. Used by both manual and automatic triggers.";
  sec.body.appendChild(help);

  const chapterTitle = document.createElement("div");
  chapterTitle.className = "lmb-subgroup-title";
  chapterTitle.textContent = "Chapter";
  sec.body.appendChild(chapterTitle);

  const windowGrid = document.createElement("div");
  windowGrid.className = "lmb-grid-2";
  lessonMark(windowGrid, "tuning.window");
  windowGrid.append(
    labelled("Window unit", select({
      value: profile.windowUnit,
      options: [
        { value: "messages", label: "messages" },
        { value: "tokens", label: "tokens" },
      ],
      onChange: (v) => patch({ windowUnit: v === "tokens" ? "tokens" : "messages" }),
    })),
    labelled(
      profile.windowUnit === "tokens" ? "Tokens to chapterize" : "Messages to chapterize",
      numberInput({
        value: profile.windowValue,
        min: 1,
        max: profile.windowUnit === "tokens" ? 1000000 : 100000,
        step: profile.windowUnit === "tokens" ? 100 : 1,
        defaultValue: PROFILE_DEFAULTS.windowValue,
        onBlur: (v) => patch({ windowValue: v ?? PROFILE_DEFAULTS.windowValue }),
      }),
    ),
  );
  sec.body.appendChild(windowGrid);

  const windowHint = document.createElement("div");
  windowHint.className = "lmb-field-hint";
  windowHint.textContent = "In token mode, the window includes messages up to and including the one that hits the token limit.";
  sec.body.appendChild(windowHint);

  const chapterRatioGrid = document.createElement("div");
  chapterRatioGrid.className = "lmb-grid-2";
  chapterRatioGrid.append(
    labelled("Chapter ratio", select({
      value: profile.chapterTargetUnit,
      options: [
        { value: "percent", label: "% of input" },
        { value: "tokens", label: "token budget" },
      ],
      onChange: (v) => patch({ chapterTargetUnit: v === "tokens" ? "tokens" : "percent" }),
    })),
    labelled(
      profile.chapterTargetUnit === "tokens" ? "Chapter tokens" : "Chapter %",
      numberInput({
        value: profile.chapterTargetUnit === "tokens" ? profile.chapterTargetTokens : profile.chapterTargetPercent,
        min: profile.chapterTargetUnit === "tokens" ? 50 : 2,
        max: profile.chapterTargetUnit === "tokens" ? 1000000 : 90,
        step: profile.chapterTargetUnit === "tokens" ? 50 : 1,
        defaultValue: profile.chapterTargetUnit === "tokens" ? PROFILE_DEFAULTS.chapterTargetTokens : PROFILE_DEFAULTS.chapterTargetPercent,
        onBlur: (v) => {
          if (v === null) return;
          if (profile.chapterTargetUnit === "tokens") patch({ chapterTargetTokens: v });
          else patch({ chapterTargetPercent: v });
        },
      }),
    ),
  );
  sec.body.appendChild(chapterRatioGrid);

  const arcTitle = document.createElement("div");
  arcTitle.className = "lmb-subgroup-title";
  arcTitle.style.marginTop = "6px";
  arcTitle.textContent = "Arc";
  sec.body.appendChild(arcTitle);

  sec.body.appendChild(
    labelled(
      profile.arcTrigger === "tokens" ? "Tokens to bind" : "Chapters to bind",
      numberInput({
        value: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
        min: profile.arcTrigger === "tokens" ? 500 : 2,
        max: profile.arcTrigger === "tokens" ? 200000 : 100,
        step: profile.arcTrigger === "tokens" ? 500 : 1,
        disabled: profile.arcTrigger === "manual",
        defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcAfterTokens : PROFILE_DEFAULTS.arcAfterChapters,
        onBlur: (v) => {
          if (v === null) return;
          if (profile.arcTrigger === "tokens") patch({ arcAfterTokens: v });
          else patch({ arcAfterChapters: v });
        },
      }),
    ),
  );

  const arcRatioGrid = document.createElement("div");
  arcRatioGrid.className = "lmb-grid-2";
  arcRatioGrid.append(
    labelled("Arc ratio", select({
      value: profile.arcTargetUnit,
      options: [
        { value: "percent", label: "% of input" },
        { value: "tokens", label: "token budget" },
      ],
      onChange: (v) => patch({ arcTargetUnit: v === "tokens" ? "tokens" : "percent" }),
    })),
    labelled(
      profile.arcTargetUnit === "tokens" ? "Arc tokens" : "Arc %",
      numberInput({
        value: profile.arcTargetUnit === "tokens" ? profile.arcTargetTokens : profile.arcTargetPercent,
        min: profile.arcTargetUnit === "tokens" ? 50 : 5,
        max: profile.arcTargetUnit === "tokens" ? 1000000 : 95,
        step: profile.arcTargetUnit === "tokens" ? 50 : 1,
        defaultValue: profile.arcTargetUnit === "tokens" ? PROFILE_DEFAULTS.arcTargetTokens : PROFILE_DEFAULTS.arcTargetPercent,
        onBlur: (v) => {
          if (v === null) return;
          if (profile.arcTargetUnit === "tokens") patch({ arcTargetTokens: v });
          else patch({ arcTargetPercent: v });
        },
      }),
    ),
  );
  sec.body.appendChild(arcRatioGrid);

  const volumeTitle = document.createElement("div");
  volumeTitle.className = "lmb-subgroup-title";
  volumeTitle.style.marginTop = "6px";
  volumeTitle.textContent = "Volume";
  sec.body.appendChild(volumeTitle);

  const volumeHint = document.createElement("div");
  volumeHint.className = "lmb-field-hint";
  volumeHint.textContent = "Volumes are manual only. Press arcs into a volume from Books → Compose.";
  sec.body.appendChild(volumeHint);

  const volumeRatioGrid = document.createElement("div");
  volumeRatioGrid.className = "lmb-grid-2";
  volumeRatioGrid.append(
    labelled("Volume ratio", select({
      value: profile.volumeTargetUnit,
      options: [
        { value: "percent", label: "% of input" },
        { value: "tokens", label: "token budget" },
      ],
      onChange: (v) => patch({ volumeTargetUnit: v === "tokens" ? "tokens" : "percent" }),
    })),
    labelled(
      profile.volumeTargetUnit === "tokens" ? "Volume tokens" : "Volume %",
      numberInput({
        value: profile.volumeTargetUnit === "tokens" ? profile.volumeTargetTokens : profile.volumeTargetPercent,
        min: profile.volumeTargetUnit === "tokens" ? 50 : 5,
        max: profile.volumeTargetUnit === "tokens" ? 1000000 : 95,
        step: profile.volumeTargetUnit === "tokens" ? 50 : 1,
        defaultValue: profile.volumeTargetUnit === "tokens" ? PROFILE_DEFAULTS.volumeTargetTokens : PROFILE_DEFAULTS.volumeTargetPercent,
        onBlur: (v) => {
          if (v === null) return;
          if (profile.volumeTargetUnit === "tokens") patch({ volumeTargetTokens: v });
          else patch({ volumeTargetPercent: v });
        },
      }),
    ),
  );
  sec.body.appendChild(volumeRatioGrid);

  host.appendChild(sec.wrap);
}

export function renderConnection(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
): void {
  const sec = section("Summary Connection");
  lessonMark(sec.wrap, "tuning.model.connection");
  const opts = [
    { value: "", label: state.connections.length ? "Default connection" : "No connections available" },
    ...state.connections.map((c) => ({
      value: c.id,
      label: `${c.name} - ${c.provider}${c.model ? "/" + c.model : ""}${c.isDefault ? " (default)" : ""}`,
    })),
  ];
  sec.body.appendChild(
    select({
      value: profile.connectionId ?? "",
      options: opts,
      onChange: (v) => patch({ connectionId: v || null }),
    }),
  );
  if (state.resolvedSidecarConnectionId) {
    const resolved = state.connections.find((c) => c.id === state.resolvedSidecarConnectionId);
    if (resolved) {
      const hint = document.createElement("div");
      hint.className = "lmb-field-hint";
      hint.textContent = `Memoria writes with ${resolved.name}`;
      sec.body.appendChild(hint);
    }
  }
  host.appendChild(sec.wrap);
}

export function renderSamplers(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Summary samplers");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "Used when Memoria writes chapters, arcs, and volumes. Empty fields use defaults tuned for summarization - placeholders show what will be sent. Temperature, max output, and max input are always sent on the wire; top_p / top_k / penalties are only sent when you set them.";
  sec.body.appendChild(help);

  const saveSampler = (key: keyof SamplerSet) => (v: number | null) => {
    const patch = { [key]: v } as Partial<SamplerSet>;
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, chatId: state.activeChatId });
  };

  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(
    labelled("Max input tokens", numberInput({
      value: profile.samplers.max_input_tokens, min: 256, max: 4000000, step: 1024,
      placeholder: String(SAMPLER_DEFAULTS.max_input_tokens),
      onBlur: saveSampler("max_input_tokens"),
    })),
    labelled("Max output tokens", numberInput({
      value: profile.samplers.max_tokens, min: 1, max: 1000000, step: 256,
      placeholder: String(SAMPLER_DEFAULTS.max_tokens),
      onBlur: saveSampler("max_tokens"),
    })),
  );
  sec.body.appendChild(grid);

  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(
    labelled("Temperature", numberInput({
      value: profile.samplers.temperature, min: 0, max: 2, step: 0.05,
      placeholder: String(SAMPLER_DEFAULTS.temperature),
      onBlur: saveSampler("temperature"),
    })),
    labelled("Top P", numberInput({
      value: profile.samplers.top_p, min: 0, max: 1, step: 0.01,
      placeholder: String(SAMPLER_DEFAULTS.top_p),
      onBlur: saveSampler("top_p"),
    })),
    labelled("Top K", numberInput({
      value: profile.samplers.top_k, min: 0, max: 1000, step: 1,
      placeholder: String(SAMPLER_DEFAULTS.top_k),
      onBlur: saveSampler("top_k"),
    })),
    labelled("Freq penalty", numberInput({
      value: profile.samplers.frequency_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(SAMPLER_DEFAULTS.frequency_penalty),
      onBlur: saveSampler("frequency_penalty"),
    })),
    labelled("Pres penalty", numberInput({
      value: profile.samplers.presence_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(SAMPLER_DEFAULTS.presence_penalty),
      onBlur: saveSampler("presence_penalty"),
    })),
  );
  sec.body.appendChild(sampleGrid);
  host.appendChild(sec.wrap);
}

let samplerView: "main" | "codex" = "main";

/** Lesson-stage navigation: pin the Connection pane's sampler toggle before
 * a demo render, so anchors on one side can't hide behind the other. */
export function setSamplerView(v: "main" | "codex"): void {
  samplerView = v;
}

export function renderSamplersSwitch(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  send: (msg: FrontendToBackend) => void,
): void {
  const patch = (p: Partial<LMBProfile>): void =>
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  const wrap = document.createElement("div");
  wrap.className = "lmb-pane";
  const switchRow = document.createElement("div");
  switchRow.className = "lmb-sampler-switch";
  const body = document.createElement("div");
  body.className = "lmb-pane";

  const options: { key: "main" | "codex"; label: string; btn?: HTMLButtonElement }[] = [
    { key: "main", label: "Books" },
    { key: "codex", label: "Codex" },
  ];
  const sync = (): void => {
    for (const o of options) o.btn?.classList.toggle("active", samplerView === o.key);
    body.replaceChildren();
    if (samplerView === "main") {
      renderConnection(body, state, profile, patch);
      renderSamplers(body, state, profile, send);
    } else {
      renderCodexConnection(body, state, profile, patch);
      renderCodexSamplers(body, state, profile, send);
    }
  };
  for (const o of options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = o.label;
    lessonMark(btn, `tuning.samplers.${o.key}`);
    btn.addEventListener("click", () => {
      if (samplerView === o.key) return;
      samplerView = o.key;
      sync();
    });
    o.btn = btn;
    switchRow.appendChild(btn);
  }

  wrap.append(switchRow, body);
  host.appendChild(wrap);
  sync();
}

/** Mirror of renderSamplers for the codex agent's own sampler set. The codex
 * rewrites whole files against a big context, so its wire fallbacks
 * (CODEX_SAMPLER_DEFAULTS) run far larger than the summarizer's. */
export function renderCodexSamplers(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Codex samplers");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "Samplers for the codex agent only, separate from the summary samplers. Empty fields use codex defaults.";
  sec.body.appendChild(help);

  const saveSampler = (key: keyof SamplerSet) => (v: number | null) => {
    const patch = { [key]: v } as Partial<SamplerSet>;
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, target: "codex", chatId: state.activeChatId });
  };

  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(
    labelled("Max input tokens", numberInput({
      value: profile.codexSamplers.max_input_tokens, min: 256, max: 4000000, step: 1024,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.max_input_tokens),
      onBlur: saveSampler("max_input_tokens"),
    })),
    labelled("Max output tokens", numberInput({
      value: profile.codexSamplers.max_tokens, min: 1, max: 1000000, step: 256,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.max_tokens),
      onBlur: saveSampler("max_tokens"),
    })),
  );
  sec.body.appendChild(grid);

  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(
    labelled("Temperature", numberInput({
      value: profile.codexSamplers.temperature, min: 0, max: 2, step: 0.05,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.temperature),
      onBlur: saveSampler("temperature"),
    })),
    labelled("Top P", numberInput({
      value: profile.codexSamplers.top_p, min: 0, max: 1, step: 0.01,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.top_p),
      onBlur: saveSampler("top_p"),
    })),
    labelled("Top K", numberInput({
      value: profile.codexSamplers.top_k, min: 0, max: 1000, step: 1,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.top_k),
      onBlur: saveSampler("top_k"),
    })),
    labelled("Freq penalty", numberInput({
      value: profile.codexSamplers.frequency_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.frequency_penalty),
      onBlur: saveSampler("frequency_penalty"),
    })),
    labelled("Pres penalty", numberInput({
      value: profile.codexSamplers.presence_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.presence_penalty),
      onBlur: saveSampler("presence_penalty"),
    })),
  );
  sec.body.appendChild(sampleGrid);
  host.appendChild(sec.wrap);
}

export function renderRegex(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
): void {
  const sec = section("Regex");
  if (state.regexScripts.length === 0) {
    sec.body.appendChild(textNode("No regex scripts found in Lumiverse", "lmb-empty"));
    host.appendChild(sec.wrap);
    return;
  }
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "Outgoing runs on the prompt before Memoria reads it. Incoming runs on the result after Memoria writes.";
  sec.body.appendChild(help);

  const outgoing = field("Outgoing");
  outgoing.body.appendChild(
    multiSelect({
      options: state.regexScripts.map((s) => ({ value: s.id, label: s.name })),
      selected: profile.regexOutgoingScriptIds,
      onChange: (ids) => patch({ regexOutgoingScriptIds: ids }),
    }),
  );
  sec.body.appendChild(outgoing.wrap);

  const incoming = field("Incoming");
  incoming.body.appendChild(
    multiSelect({
      options: state.regexScripts.map((s) => ({ value: s.id, label: s.name })),
      selected: profile.regexIncomingScriptIds,
      onChange: (ids) => patch({ regexIncomingScriptIds: ids }),
    }),
  );
  sec.body.appendChild(incoming.wrap);

  host.appendChild(sec.wrap);
}

export function renderContext(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section("Context");
  lessonMark(sec.wrap, "tuning.ctx");
  const f = field("Chapter context");
  f.body.appendChild(
    numberInput({
      value: profile.previousMemoriesCount,
      min: 0,
      max: 20,
      defaultValue: PROFILE_DEFAULTS.previousMemoriesCount,
      onBlur: (v) => patch({ previousMemoriesCount: v ?? PROFILE_DEFAULTS.previousMemoriesCount }),
    }),
  );
  const hint = document.createElement("div");
  hint.className = "lmb-field-hint";
  hint.textContent = "How many recent chapters to feed Memoria as continuity context.";
  f.body.appendChild(hint);
  sec.body.appendChild(f.wrap);

  const retry = field("Retries");
  retry.body.appendChild(
    numberInput({
      value: profile.retryCount,
      min: 0,
      max: 10,
      defaultValue: PROFILE_DEFAULTS.retryCount,
      onBlur: (v) => patch({ retryCount: v ?? PROFILE_DEFAULTS.retryCount }),
    }),
  );
  const retryHint = document.createElement("div");
  retryHint.className = "lmb-field-hint";
  retryHint.textContent = "Tries per attempt. After the last try, Memoria will pick the same messages again next turn.";
  retry.body.appendChild(retryHint);
  sec.body.appendChild(retry.wrap);

  const ttft = field("First-token timeout (seconds)");
  ttft.body.appendChild(
    numberInput({
      value: profile.ttftTimeoutSecs,
      min: 10,
      max: 600,
      step: 5,
      defaultValue: PROFILE_DEFAULTS.ttftTimeoutSecs,
      onBlur: (v) => patch({ ttftTimeoutSecs: v ?? PROFILE_DEFAULTS.ttftTimeoutSecs }),
    }),
  );
  const ttftHint = document.createElement("div");
  ttftHint.className = "lmb-field-hint";
  ttftHint.textContent = "How long Memoria waits for the first streamed token before giving up. After the first token she lets the stream run.";
  ttft.body.appendChild(ttftHint);
  sec.body.appendChild(ttft.wrap);

  host.appendChild(sec.wrap);
}

export function renderBehavior(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section("Behavior");
  sec.body.appendChild(checkbox({
    checked: profile.hideCoveredMessages,
    label: "Hide messages once filed",
    hint: "Greys out covered messages in the chat. Enforcement runs in the interceptor either way.",
    onChange: (v) => patch({ hideCoveredMessages: v }),
  }));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.showMemoryPreviews,
    label: "Preview before saving",
    hint: "Memoria stages new chapters and arcs in Home → Pending previews for your approval.",
    onChange: (v) => patch({ showMemoryPreviews: v }),
  }), "tuning.behavior.preview"));
  host.appendChild(sec.wrap);
}

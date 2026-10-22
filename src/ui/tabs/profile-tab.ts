import { t as tr } from "../../i18n";
import { HIGHER_TIERS, TIER_NAMES, type HigherTierSettings } from "../../shared";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { LMBProfile, SamplerSet } from "../../shared";
import { CODEX_SAMPLER_DEFAULTS, SAMPLER_DEFAULTS, makeDefaultProfile } from "../../shared";

const PROFILE_DEFAULTS = makeDefaultProfile("__defaults__", tr("ui.tabs.profileTab.profileDefaults.defaults"));
// Token-mode blank-field fallbacks for the codex cadence: the shared defaults
// (6 / 20) are message counts and would be nonsense as token budgets.
const CODEX_LAG_TOKENS_DEFAULT = 2000;
const CODEX_WINDOW_TOKENS_DEFAULT = 8000;
import {
  checkbox,
  field,
  labelled,
  lessonMark,
  makeButton,
  numberInput,
  section,
  select,
  textNode,
} from "../components";
import { promptForString } from "../modals";
import { activationControl, vectorSetupHint } from "../activation-control";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";

/* Section renderers below are composed into subtab panes by tuning-tab.ts. */

export function renderCodexSettings(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
): void {
  void state;
  const sec = section(tr("ui.tabs.profileTab.sec.knowledgeCodex"));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.codexEnabled, label: tr("ui.tabs.profileTab.renderCodexSettings.enableCodex"),
    onChange: (codexEnabled) => patch({ codexEnabled }),
  }), "tuning.codex.enabled"));

  const updating = section(tr("ui.tabs.profileTab.updating.codexUpdating"));
  const lag = document.createElement("div");
  for (const kind of ["window", "lag"] as const) {
    const label = kind === "window" ? tr("ui.tabs.profileTab.renderCodexSettings.window") : tr("ui.tabs.profileTab.renderCodexSettings.lag");
    const unit = kind === "window" ? profile.codexWindowUnit : profile.codexLagUnit;
    const value = kind === "window" ? profile.codexWindowValue : profile.codexLagValue;
    const fallback = kind === "window"
      ? unit === "tokens" ? CODEX_WINDOW_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexWindowValue
      : unit === "tokens" ? CODEX_LAG_TOKENS_DEFAULT : PROFILE_DEFAULTS.codexLagValue;
    const group = kind === "lag" ? lag : document.createElement("div");
    group.className = "lmb-collapsible-body";
    if (kind === "window") lessonMark(group, "tuning.codex.window");
    else lessonMark(group, "tuning.codex.lag");
    group.append(
      labelled(tr("ui.tabs.profileTab.renderCodexSettings.unit", { kind: label }), select({ value: unit,
        options: [{ value: "messages", label: tr("ui.tabs.profileTab.renderCodexSettings.messages") }, { value: "tokens", label: tr("ui.tabs.profileTab.renderCodexSettings.messageTokens") }],
        onChange: (v) => {
          const next = v === "tokens" ? "tokens" : "messages";
          patch(kind === "window" ? { codexWindowUnit: next } : { codexLagUnit: next });
        },
      })),
      labelled(label, numberInput({ value, min: kind === "window" ? 1 : 0,
        max: unit === "tokens" ? 1000000 : 100000, step: unit === "tokens" ? kind === "window" ? 100 : 50 : 1,
        defaultValue: fallback,
        onBlur: (v) => patch(kind === "window" ? { codexWindowValue: v ?? fallback } : { codexLagValue: v ?? fallback }),
      })),
    );
    if (kind === "window") updating.body.appendChild(group);
  }
  if (profile.codexWindowUnit === "messages") {
    updating.body.appendChild(lessonMark(labelled(tr("ui.tabs.profileTab.renderCodexSettings.tokensBreakpoint"), numberInput({
      value: profile.codexTokenBreakpoint, min: 1000, max: 1000000, step: 5000,
      defaultValue: PROFILE_DEFAULTS.codexTokenBreakpoint,
      onBlur: (v) => patch({ codexTokenBreakpoint: v ?? PROFILE_DEFAULTS.codexTokenBreakpoint }),
    })), "tuning.codex.breakpoint"));
    updating.body.appendChild(textNode(tr("ui.tabs.profileTab.renderCodexSettings.runsWhenEitherTheWindowOrThis"), "lmb-field-hint"));
  }
  appendAutomationControls(updating.body, lag, !profile.codexManualOnly,
    (enabled) => patch({ codexManualOnly: !enabled }));
  sec.body.appendChild(updating.wrap);

  const fields = document.createElement("div");
  fields.className = "lmb-collapsible-body";
  sec.body.appendChild(fields);

  const loreGrid = document.createElement("div");
  loreGrid.className = "lmb-grid-2";
  loreGrid.append(
    labelled(tr("ui.tabs.profileTab.renderCodexSettings.loreLimit"), select({
      value: profile.codexLoreLimitUnit,
      options: [
        { value: "percent", label: tr("ui.tabs.profileTab.renderCodexSettings.ofMaxContext") },
        { value: "tokens", label: tr("ui.tabs.profileTab.renderCodexSettings.tokenCap") },
      ],
      onChange: (v) => patch({ codexLoreLimitUnit: v === "tokens" ? "tokens" : "percent" }),
    })),
    labelled(
      profile.codexLoreLimitUnit === "tokens" ? tr("ui.tabs.profileTab.renderCodexSettings.loreTokens0NoLimit") : tr("ui.tabs.profileTab.renderCodexSettings.loreOfMaxContext"),
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
    tr("ui.tabs.profileTab.renderCodexSettings.yourActivatedLorebookEntriesRideEveryCodex");
  fields.appendChild(loreHint);

  fields.appendChild(activationControl(tr("ui.tabs.profileTab.renderCodexSettings.codexRecall"), profile.codexActivationMode,
    (codexActivationMode) => patch({ codexActivationMode })));
  fields.appendChild(textNode(tr("ui.tabs.profileTab.renderCodexSettings.theActiveProfileSetsRecallForEnabled"), "lmb-field-hint"));
  if (profile.codexActivationMode === "vector") fields.appendChild(vectorSetupHint());
  fields.appendChild(labelled(tr("ui.tabs.profileTab.renderCodexSettings.codexPlacement"), select({
    value: profile.codexInjectionPosition,
    options: [{ value: "lorebook", label: tr("ui.tabs.profileTab.renderCodexSettings.lorebookBefore") }, { value: "depth", label: tr("ui.tabs.profileTab.renderCodexSettings.atHistoryDepth") }, { value: "after_history", label: tr("ui.tabs.profileTab.renderCodexSettings.afterChatHistory") }],
    onChange: (v) => patch({ codexInjectionPosition: v as LMBProfile["codexInjectionPosition"] }),
  })));
  if (profile.codexInjectionPosition === "depth") fields.appendChild(labelled(tr("ui.tabs.profileTab.renderCodexSettings.depthFromNewestTurn"), numberInput({
    value: profile.codexInjectionDepth, min: 0, max: 10000,
    onBlur: (v) => patch({ codexInjectionDepth: v ?? 4 }),
  })));
  const placementHint = document.createElement("div");
  placementHint.className = "lmb-help";
  placementHint.textContent = tr("ui.tabs.profileTab.renderCodexSettings.summariesReplaceTheirSourceHistoryInPlace");
  fields.appendChild(placementHint);

  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexRelationsTable,
    label: tr("ui.tabs.profileTab.renderCodexSettings.relationsTable"),
    hint: tr("ui.tabs.profileTab.renderCodexSettings.tracksConnectionsBetweenEntitiesAsOneShared"),
    onChange: (v) => patch({ codexRelationsTable: v }),
  }), "tuning.codex.relations"));

  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexThorough,
    label: tr("ui.tabs.profileTab.renderCodexSettings.thoroughMode"),
    hint: tr("ui.tabs.profileTab.renderCodexSettings.spendsOneExtraVerificationRoundPerUpdate"),
    onChange: (v) => patch({ codexThorough: v }),
  }), "tuning.codex.thorough"));

  fields.appendChild(lessonMark(checkbox({
    checked: profile.codexExtraContext,
    label: tr("ui.tabs.profileTab.renderCodexSettings.extraContextMode"),
    hint: tr("ui.tabs.profileTab.renderCodexSettings.summarizesChaptersEarlyAtTheCodexLag"),
    onChange: (v) => patch({ codexExtraContext: v }),
  }), "tuning.codex.extra"));

  const soFarFields = document.createElement("div");
  soFarFields.className = profile.codexExtraContext ? "" : "lmb-greyed";
  soFarFields.appendChild(
    labelled(tr("ui.tabs.profileTab.renderCodexSettings.chaptersProvided"), numberInput({
      value: profile.codexStorySoFarCount,
      min: 0,
      max: 50,
      defaultValue: PROFILE_DEFAULTS.codexStorySoFarCount,
      onBlur: (v) => patch({ codexStorySoFarCount: v ?? PROFILE_DEFAULTS.codexStorySoFarCount }),
    })),
  );
  const soFarHint = document.createElement("div");
  soFarHint.className = "lmb-field-hint";
  soFarHint.textContent = tr("ui.tabs.profileTab.renderCodexSettings.howManyRecentChapterSummariesExtraContext");
  soFarFields.appendChild(soFarHint);
  fields.appendChild(soFarFields);

  const modelHint = document.createElement("div");
  modelHint.className = "lmb-field-hint";
  modelHint.textContent = tr("ui.tabs.profileTab.renderCodexSettings.theCodexAgentSConnectionAndSamplers");
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
  const sec = section(tr("ui.tabs.profileTab.sec.codexConnection"));
  const connOpts = [
    { value: "", label: tr("ui.tabs.profileTab.connOpts.sameAsSummaryConnection") },
    ...state.connections.map((c) => ({
      value: c.id,
      label: tr("ui.tabs.profileTab.connOpts.value", { name: c.name, provider: c.provider, choice: (c.model) ? "yes" : "no", model: (c.model) ? (c.model) : "", choice2: (c.isDefault) ? "yes" : "no" }),
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
    label: tr("ui.tabs.profileTab.renderCodexConnection.useToolCalls"),
    hint: tr("ui.tabs.profileTab.renderCodexConnection.offByDefaultTheAgentWritesOne"),
    onChange: (v) => patch({ codexUseTools: v }),
  }), "tuning.codex.usetools"));

  sec.body.appendChild(labelled(tr("ui.tabs.profileTab.renderCodexConnection.updateDelivery"), select({
    value: profile.codexWriteMode,
    options: [
      { value: "batch", label: tr("ui.tabs.profileTab.renderCodexConnection.allRecordsAtOnce") },
      { value: "sequential", label: tr("ui.tabs.profileTab.renderCodexConnection.oneRecordAtATime") },
    ],
    onChange: (v) => patch({ codexWriteMode: v === "sequential" ? "sequential" : "batch" }),
  })));
  const seqHelp = document.createElement("div");
  seqHelp.className = "lmb-help";
  seqHelp.textContent =
    tr("ui.tabs.profileTab.renderCodexConnection.memoriaAlwaysMakesSureEveryRecordIs");
  sec.body.appendChild(seqHelp);

  host.appendChild(sec.wrap);
}

export function renderResetSettings(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const profile = state.activeProfile;
  const sec = section(tr("ui.tabs.profileTab.sec.reset"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    tr("ui.tabs.profileTab.renderResetSettings.resetsThisProfileSSettingsToTheir");
  sec.body.appendChild(help);

  const IDLE = tr("ui.tabs.profileTab.idle.resetProfileToDefaults");
  const CONFIRM = tr("ui.tabs.profileTab.confirm.clickAgainToConfirm");
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
  const sec = section(tr("ui.tabs.profileTab.sec.profile"));
  const row = document.createElement("div");
  row.className = "lmb-field-row lmb-profile-picker-row";
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
  const iconButton = (title: string, drawing: string, onClick: () => void): HTMLButtonElement => {
    const button = makeButton("", onClick, { small: true, title });
    button.classList.add("lmb-profile-action");
    button.setAttribute("aria-label", title);
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;
    return button;
  };
  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  row.appendChild(actions);
  actions.append(
    iconButton(tr("ui.tabs.profileTab.renderProfilePicker.new"), '<path d="M12 5v14M5 12h14"/>', async () => {
      const name = await promptForString(ctx, tr("ui.tabs.profileTab.name.newProfileName"), "");
      if (!name) return;
      send({ type: "create_profile", name, chatId: state.activeChatId });
    }),
    iconButton(tr("ui.tabs.profileTab.renderProfilePicker.rename"), '<path d="m16 3 5 5-12 12H4v-5L16 3ZM14 5l5 5"/>', async () => {
      const name = await promptForString(ctx, tr("ui.tabs.profileTab.nameField.profileName"), state.activeProfile.name);
      if (name) send({ type: "save_profile", profile: { id: state.activeProfile.id, name: name.slice(0, 60) }, chatId: state.activeChatId });
    }),
    iconButton(tr("ui.tabs.profileTab.renderProfilePicker.duplicate"), '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>', () => {
      send({ type: "create_profile", name: tr("ui.tabs.profileTab.renderProfilePicker.copyName", { name: state.activeProfile.name }), copyFromId: state.activeProfile.id, chatId: state.activeChatId });
    }),
    makeButton(tr("ui.tabs.profileTab.renderProfilePicker.delete"), () => {
      send({ type: "delete_profile", profileId: state.activeProfile.id, chatId: state.activeChatId });
    }, { small: true, danger: true, disabled: state.settings.profiles.length <= 1 }),
  );
  sec.body.appendChild(row);

  const enableWrap = field(tr("ui.tabs.profileTab.enableWrap.extension"));
  enableWrap.body.appendChild(
    checkbox({
      checked: state.settings.enabled,
      label: tr("ui.tabs.profileTab.renderProfilePicker.enabled"),
      hint: tr("ui.tabs.profileTab.renderProfilePicker.masterSwitchWhenOffMemoriaDoesNothing"),
      onChange: (v) => send({ type: "save_settings", patch: { enabled: v }, chatId: state.activeChatId }),
    }),
  );
  sec.body.appendChild(enableWrap.wrap);

  host.appendChild(sec.wrap);
}

const expandedSummaryTiers = new Set<number>();

function summaryTierSection(title: string, tier: number): ReturnType<typeof section> {
  if (tier <= 3) return section(title);
  const wrap = document.createElement("details");
  wrap.className = "lmb-section lmb-summary-tier";
  wrap.open = expandedSummaryTiers.has(tier);
  wrap.addEventListener("toggle", () => {
    if (wrap.open) expandedSummaryTiers.add(tier);
    else expandedSummaryTiers.delete(tier);
  });
  const head = document.createElement("summary");
  head.className = "lmb-section-title";
  head.append(document.createTextNode(title), textNode("", "lmb-chevron"));
  const body = document.createElement("div");
  body.className = "lmb-collapsible-body";
  wrap.append(head, body);
  return { wrap, head, body };
}

/** Each tier owns one card containing both its cadence and output target. */
export function renderSummarySettings(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section(tr("ui.tabs.profileTab.sec.summarySettings"));
  sec.body.appendChild(textNode(tr("ui.tabs.profileTab.renderSummarySettings.windowLagAndCompressionSettingsForEach"), "lmb-help"));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.autoCreate, label: tr("ui.tabs.profileTab.renderSummarySettings.runAutomation"),
    onChange: (autoCreate) => patch({ autoCreate }),
  }), "tuning.auto"));

  for (const tier of [1, 2, ...HIGHER_TIERS] as const) {
    const name = TIER_NAMES[tier - 1]!;
    const card = summaryTierSection(tier === 1 ? tr("ui.tabs.profileTab.card.chapterFiling") : tr("ui.tabs.profileTab.card.binding", { name: name }), tier);
    const lag = document.createElement("div");
    lag.className = "lmb-collapsible-body";
    if (tier === 1) {
      lessonMark(card.wrap, "tuning.chapter");
      const window = document.createElement("div");
      window.className = "lmb-collapsible-body";
      lessonMark(window, "tuning.window");
      window.append(
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.windowUnit"), select({ value: profile.windowUnit,
          options: [{ value: "messages", label: tr("ui.tabs.profileTab.renderSummarySettings.messages") }, { value: "tokens", label: tr("ui.tabs.profileTab.renderSummarySettings.messageTokens") }],
          onChange: (v) => patch({ windowUnit: v === "tokens" ? "tokens" : "messages" }),
        })),
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.window"), numberInput({ value: profile.windowValue, min: 1,
          max: profile.windowUnit === "tokens" ? 1000000 : 100000, step: profile.windowUnit === "tokens" ? 100 : 1,
          defaultValue: PROFILE_DEFAULTS.windowValue, onBlur: (v) => patch({ windowValue: v ?? PROFILE_DEFAULTS.windowValue }),
        })),
      );
      card.body.appendChild(window);
      // Chapter lag has its own unit. Keep mixed-unit profiles editable
      // without converting or silently overwriting their settings.
      lag.append(
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.lagUnit"), select({ value: profile.lagUnit,
          options: [{ value: "messages", label: tr("ui.tabs.profileTab.renderSummarySettings.messages") }, { value: "tokens", label: tr("ui.tabs.profileTab.renderSummarySettings.messageTokens") }],
          onChange: (v) => patch({ lagUnit: v === "tokens" ? "tokens" : "messages" }),
        })),
        lessonMark(labelled(tr("ui.tabs.profileTab.renderSummarySettings.lag"), numberInput({ value: profile.lagValue, min: 0,
          max: profile.lagUnit === "tokens" ? 1000000 : 100000, step: profile.lagUnit === "tokens" ? 50 : 1,
          defaultValue: PROFILE_DEFAULTS.lagValue, onBlur: (v) => patch({ lagValue: v ?? PROFILE_DEFAULTS.lagValue }),
        })), "tuning.lag"),
      );
    } else if (tier === 2) {
      lessonMark(card.wrap, "tuning.arc");
      card.body.append(
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.windowUnit"), select({ value: profile.arcTrigger,
          options: [{ value: "chapters", label: tr("ui.tabs.profileTab.renderSummarySettings.chapterEntries") }, { value: "tokens", label: tr("ui.tabs.profileTab.renderSummarySettings.summaryTokens") }, { value: "manual", label: tr("ui.tabs.profileTab.renderSummarySettings.manualOnly") }],
          onChange: (v) => patch({ arcTrigger: v === "tokens" || v === "manual" ? v : "chapters" }),
        })),
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.window"), numberInput({
          value: profile.arcTrigger === "tokens" ? profile.arcAfterTokens : profile.arcAfterChapters,
          min: profile.arcTrigger === "tokens" ? 500 : 2, max: profile.arcTrigger === "tokens" ? 200000 : 100,
          step: profile.arcTrigger === "tokens" ? 500 : 1, disabled: profile.arcTrigger === "manual",
          defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcAfterTokens : PROFILE_DEFAULTS.arcAfterChapters,
          onBlur: (v) => { if (v !== null) patch(profile.arcTrigger === "tokens" ? { arcAfterTokens: v } : { arcAfterChapters: v }); },
        })),
      );
      lag.appendChild(labelled(tr("ui.tabs.profileTab.renderSummarySettings.lag"), numberInput({
          value: profile.arcTrigger === "tokens" ? profile.arcLagTokens : profile.arcLagChapters,
          min: 0, max: profile.arcTrigger === "tokens" ? 200000 : 100, step: profile.arcTrigger === "tokens" ? 100 : 1,
          disabled: profile.arcTrigger === "manual",
          defaultValue: profile.arcTrigger === "tokens" ? PROFILE_DEFAULTS.arcLagTokens : PROFILE_DEFAULTS.arcLagChapters,
          onBlur: (v) => { if (v !== null) patch(profile.arcTrigger === "tokens" ? { arcLagTokens: v } : { arcLagChapters: v }); },
        })));
    } else {
      const config = profile.higherTiers[tier];
      const change = (v: Partial<HigherTierSettings>) => patch({ higherTiers: { ...profile.higherTiers, [tier]: { ...config, ...v } } });
      card.body.append(
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.windowUnit"), select({ value: config.unit,
          options: [{ value: "entries", label: tr("ui.tabs.profileTab.renderSummarySettings.entries", { tierNamesTier2: TIER_NAMES[tier - 2] }) }, { value: "tokens", label: tr("ui.tabs.profileTab.renderSummarySettings.summaryTokens") }],
          onChange: (v) => change({ unit: v === "tokens" ? "tokens" : "entries", batch: v === "tokens" ? 8000 : 6, lag: v === "tokens" ? 2000 : 2 }),
        })),
        labelled(tr("ui.tabs.profileTab.renderSummarySettings.window"), numberInput({ value: config.batch, min: config.unit === "tokens" ? 100 : 2,
          max: config.unit === "tokens" ? 1000000 : 100, step: config.unit === "tokens" ? 100 : 1,
          defaultValue: config.unit === "tokens" ? 8000 : 6, onBlur: (v) => change({ batch: v ?? config.batch }),
        })),
      );
      lag.appendChild(labelled(tr("ui.tabs.profileTab.renderSummarySettings.lag"), numberInput({ value: config.lag, min: 0,
          max: config.unit === "tokens" ? 1000000 : 100, step: config.unit === "tokens" ? 100 : 1,
          defaultValue: config.unit === "tokens" ? 2000 : 2, onBlur: (v) => change({ lag: v ?? config.lag }),
        })));
    }
    appendCompressionTarget(card.body, profile, tier, patch);
    const enabled = tier === 1 ? profile.autoCreateChapter : tier === 2 ? profile.autoCreateArc : profile.higherTiers[tier].enabled;
    appendAutomationControls(card.body, lag, enabled, (enabled) => {
      if (tier === 1) patch({ autoCreateChapter: enabled });
      else if (tier === 2) patch({ autoCreateArc: enabled });
      else patch({ higherTiers: { ...profile.higherTiers, [tier]: { ...profile.higherTiers[tier], enabled } } });
    });
    sec.body.appendChild(card.wrap);
  }
  host.appendChild(sec.wrap);
}

function appendAutomationControls(host: HTMLElement, lag: HTMLElement, enabled: boolean, onChange: (enabled: boolean) => void): void {
  const controls = [...lag.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")]
    .map((input) => ({ input, disabled: input.disabled }));
  const update = (enabled: boolean) => {
    lag.classList.toggle("lmb-greyed", !enabled);
    for (const { input, disabled } of controls) input.disabled = !enabled || disabled;
  };
  update(enabled);
  host.append(checkbox({ checked: enabled, label: tr("ui.tabs.profileTab.appendAutomationControls.automate"), onChange: (enabled) => {
    update(enabled);
    onChange(enabled);
  } }), lag);
}

function appendCompressionTarget(host: HTMLElement, profile: LMBProfile, tier: 1 | 2 | 3 | 4 | 5 | 6 | 7, patch: (p: Partial<LMBProfile>) => void): void {
  const prefix = tier === 1 ? "chapter" : tier === 2 ? "arc" : "volume";
  const target = tier <= 3 ? {
    targetUnit: profile[`${prefix}TargetUnit`], targetPercent: profile[`${prefix}TargetPercent`], targetTokens: profile[`${prefix}TargetTokens`],
  } : profile.higherTiers[tier as 4 | 5 | 6 | 7];
  const change = (v: Partial<Pick<HigherTierSettings, "targetUnit" | "targetPercent" | "targetTokens">>) => {
    if (tier > 3) {
      patch({ higherTiers: { ...profile.higherTiers, [tier]: { ...profile.higherTiers[tier as 4 | 5 | 6 | 7], ...v } } });
    } else {
      patch({
        ...(v.targetUnit !== undefined ? { [tr("ui.tabs.profileTab.change.targetUnit", { prefix: prefix })]: v.targetUnit } : {}),
        ...(v.targetPercent !== undefined ? { [tr("ui.tabs.profileTab.change.targetPercent", { prefix: prefix })]: v.targetPercent } : {}),
        ...(v.targetTokens !== undefined ? { [tr("ui.tabs.profileTab.change.targetTokens", { prefix: prefix })]: v.targetTokens } : {}),
      });
    }
  };
  host.append(
    labelled(tr("ui.tabs.profileTab.appendCompressionTarget.compressionTarget"), select({ value: target.targetUnit,
      options: [{ value: "percent", label: tr("ui.tabs.profileTab.appendCompressionTarget.percentOfInput") }, { value: "tokens", label: tr("ui.tabs.profileTab.appendCompressionTarget.fixedTokens") }],
      onChange: (v) => change({ targetUnit: v === "tokens" ? "tokens" : "percent" }),
    })),
    labelled(target.targetUnit === "tokens" ? tr("ui.tabs.profileTab.appendCompressionTarget.targetTokens") : tr("ui.tabs.profileTab.appendCompressionTarget.targetPercent"), numberInput({
      value: target.targetUnit === "tokens" ? target.targetTokens : target.targetPercent,
      min: target.targetUnit === "tokens" ? 50 : tier === 1 ? 2 : 5,
      max: target.targetUnit === "tokens" ? 1000000 : tier === 1 ? 90 : 95, step: target.targetUnit === "tokens" ? 50 : 1,
      defaultValue: target.targetUnit === "tokens" ? PROFILE_DEFAULTS[`${prefix}TargetTokens`] : PROFILE_DEFAULTS[`${prefix}TargetPercent`],
      onBlur: (v) => { if (v !== null) change(target.targetUnit === "tokens" ? { targetTokens: v } : { targetPercent: v }); },
    })),
  );
}


export function renderConnection(
  host: HTMLElement,
  state: FrontendState,
  profile: LMBProfile,
  patch: (p: Partial<LMBProfile>) => void,
): void {
  const sec = section(tr("ui.tabs.profileTab.sec.summaryConnection"));
  lessonMark(sec.wrap, "tuning.model.connection");
  const opts = [
    { value: "", label: state.connections.length ? tr("ui.tabs.profileTab.opts.defaultConnection") : tr("ui.tabs.profileTab.opts.noConnectionsAvailable") },
    ...state.connections.map((c) => ({
      value: c.id,
      label: tr("ui.tabs.profileTab.opts.value", { name: c.name, provider: c.provider, choice: (c.model) ? "yes" : "no", model: (c.model) ? (c.model) : "", choice2: (c.isDefault) ? "yes" : "no" }),
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
      hint.textContent = tr("ui.tabs.profileTab.renderConnection.memoriaWritesWith", { name: resolved.name });
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
  const sec = section(tr("ui.tabs.profileTab.sec.summarySamplers"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    tr("ui.tabs.profileTab.renderSamplers.usedWhenMemoriaWritesChaptersArcsAnd");
  sec.body.appendChild(help);

  const saveSampler = (key: keyof SamplerSet) => (v: number | null) => {
    const patch = { [key]: v } as Partial<SamplerSet>;
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, chatId: state.activeChatId });
  };

  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(
    labelled(tr("ui.tabs.profileTab.renderSamplers.maxInputTokens"), numberInput({
      value: profile.samplers.max_input_tokens, min: 256, max: 4000000, step: 1024,
      placeholder: String(SAMPLER_DEFAULTS.max_input_tokens),
      onBlur: saveSampler("max_input_tokens"),
    })),
    labelled(tr("ui.tabs.profileTab.renderSamplers.maxOutputTokens"), numberInput({
      value: profile.samplers.max_tokens, min: 1, max: 1000000, step: 256,
      placeholder: String(SAMPLER_DEFAULTS.max_tokens),
      onBlur: saveSampler("max_tokens"),
    })),
  );
  sec.body.appendChild(grid);

  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(
    labelled(tr("ui.tabs.profileTab.renderSamplers.temperature"), numberInput({
      value: profile.samplers.temperature, min: 0, max: 2, step: 0.05,
      placeholder: String(SAMPLER_DEFAULTS.temperature),
      onBlur: saveSampler("temperature"),
    })),
    labelled(tr("ui.tabs.profileTab.renderSamplers.topP"), numberInput({
      value: profile.samplers.top_p, min: 0, max: 1, step: 0.01,
      placeholder: String(SAMPLER_DEFAULTS.top_p),
      onBlur: saveSampler("top_p"),
    })),
    labelled(tr("ui.tabs.profileTab.renderSamplers.topK"), numberInput({
      value: profile.samplers.top_k, min: 0, max: 1000, step: 1,
      placeholder: String(SAMPLER_DEFAULTS.top_k),
      onBlur: saveSampler("top_k"),
    })),
    labelled(tr("ui.tabs.profileTab.renderSamplers.freqPenalty"), numberInput({
      value: profile.samplers.frequency_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(SAMPLER_DEFAULTS.frequency_penalty),
      onBlur: saveSampler("frequency_penalty"),
    })),
    labelled(tr("ui.tabs.profileTab.renderSamplers.presPenalty"), numberInput({
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
    { key: "main", label: tr("ui.tabs.profileTab.options.books") },
    { key: "codex", label: tr("ui.tabs.profileTab.options.codex") },
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
  const sec = section(tr("ui.tabs.profileTab.sec.codexSamplers"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    tr("ui.tabs.profileTab.renderCodexSamplers.samplersForTheCodexAgentOnlySeparate");
  sec.body.appendChild(help);

  const saveSampler = (key: keyof SamplerSet) => (v: number | null) => {
    const patch = { [key]: v } as Partial<SamplerSet>;
    send({ type: "save_samplers", profileId: profile.id, samplers: patch, target: "codex", chatId: state.activeChatId });
  };

  const grid = document.createElement("div");
  grid.className = "lmb-grid-2";
  grid.append(
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.maxInputTokens"), numberInput({
      value: profile.codexSamplers.max_input_tokens, min: 256, max: 4000000, step: 1024,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.max_input_tokens),
      onBlur: saveSampler("max_input_tokens"),
    })),
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.maxOutputTokens"), numberInput({
      value: profile.codexSamplers.max_tokens, min: 1, max: 1000000, step: 256,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.max_tokens),
      onBlur: saveSampler("max_tokens"),
    })),
  );
  sec.body.appendChild(grid);

  const sampleGrid = document.createElement("div");
  sampleGrid.className = "lmb-grid-3";
  sampleGrid.append(
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.temperature"), numberInput({
      value: profile.codexSamplers.temperature, min: 0, max: 2, step: 0.05,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.temperature),
      onBlur: saveSampler("temperature"),
    })),
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.topP"), numberInput({
      value: profile.codexSamplers.top_p, min: 0, max: 1, step: 0.01,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.top_p),
      onBlur: saveSampler("top_p"),
    })),
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.topK"), numberInput({
      value: profile.codexSamplers.top_k, min: 0, max: 1000, step: 1,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.top_k),
      onBlur: saveSampler("top_k"),
    })),
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.freqPenalty"), numberInput({
      value: profile.codexSamplers.frequency_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.frequency_penalty),
      onBlur: saveSampler("frequency_penalty"),
    })),
    labelled(tr("ui.tabs.profileTab.renderCodexSamplers.presPenalty"), numberInput({
      value: profile.codexSamplers.presence_penalty, min: -2, max: 2, step: 0.05,
      placeholder: String(CODEX_SAMPLER_DEFAULTS.presence_penalty),
      onBlur: saveSampler("presence_penalty"),
    })),
  );
  sec.body.appendChild(sampleGrid);
  host.appendChild(sec.wrap);
}

export { renderRegex } from "../regex-picker";

export function renderContext(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section(tr("ui.tabs.profileTab.sec.context"));
  lessonMark(sec.wrap, "tuning.ctx");
  const f = field(tr("ui.tabs.profileTab.f.chapterContext"));
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
  hint.textContent = tr("ui.tabs.profileTab.renderContext.howManyRecentChaptersToFeedMemoria");
  f.body.appendChild(hint);
  sec.body.appendChild(f.wrap);

  const retry = field(tr("ui.tabs.profileTab.retry.retries"));
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
  retryHint.textContent = tr("ui.tabs.profileTab.renderContext.triesPerAttemptAfterTheLastTry");
  retry.body.appendChild(retryHint);
  sec.body.appendChild(retry.wrap);

  const ttft = field(tr("ui.tabs.profileTab.ttft.firstTokenTimeoutSeconds"));
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
  ttftHint.textContent = tr("ui.tabs.profileTab.renderContext.howLongMemoriaWaitsForTheFirst");
  ttft.body.appendChild(ttftHint);
  sec.body.appendChild(ttft.wrap);

  host.appendChild(sec.wrap);
}

export function renderBehavior(host: HTMLElement, profile: LMBProfile, patch: (p: Partial<LMBProfile>) => void): void {
  const sec = section(tr("ui.tabs.profileTab.sec.behavior"));
  sec.body.appendChild(checkbox({
    checked: profile.hideCoveredMessages,
    label: tr("ui.tabs.profileTab.renderBehavior.hideMessagesOnceFiled"),
    hint: tr("ui.tabs.profileTab.renderBehavior.greysOutCoveredMessagesInTheChat"),
    onChange: (v) => patch({ hideCoveredMessages: v }),
  }));
  sec.body.appendChild(lessonMark(checkbox({
    checked: profile.showMemoryPreviews,
    label: tr("ui.tabs.profileTab.renderBehavior.previewBeforeSaving"),
    hint: tr("ui.tabs.profileTab.renderBehavior.memoriaStagesNewChaptersAndArcsIn"),
    onChange: (v) => patch({ showMemoryPreviews: v }),
  }), "tuning.behavior.preview"));
  host.appendChild(sec.wrap);
}

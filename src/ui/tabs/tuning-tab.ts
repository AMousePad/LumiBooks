import { t as tr } from "../../i18n";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { LMBProfile } from "../../shared";
import { codexLessonGated } from "../../shared";
import { checkbox, lessonMark, makeSubtabs, scrollPaneTop, section } from "../components";
import { renderCodexPaneLock } from "../lessons/seal";
import {
  renderSummarySettings,
  renderBehavior,
  renderCodexSettings,
  renderContext,
  renderProfilePicker,
  renderRegex,
  renderResetSettings,
  renderSamplersSwitch,
} from "./profile-tab";
import { renderPromptsPane } from "./prompts-tab";
import { activationControl, vectorSetupHint } from "../activation-control";

type TuningSubtab = "profile" | "settings" | "prompts";

const SUBTABS: { key: TuningSubtab; label: string }[] = [
  { key: "profile", label: tr("ui.tabs.tuningTab.subtabs.connection") },
  { key: "settings", label: tr("ui.tabs.tuningTab.subtabs.settings") },
  { key: "prompts", label: tr("ui.tabs.tuningTab.subtabs.prompts") },
];

const local = { subtab: "profile" as TuningSubtab, settingsView: "books" as "books" | "codex" };

/** Lesson-stage navigation; legacy keys map onto the merged layout. */
export function setTuningSubtab(key: string): void {
  const mapped = key === "model" ? "profile" : key === "codex" ? "settings" : key;
  if (mapped === "profile" || mapped === "settings" || mapped === "prompts") local.subtab = mapped;
  if (key === "codex") local.settingsView = "codex";
}

/** Lesson-stage navigation: pin the Settings pane's Books/Codex side. */
export function setSettingsView(v: "books" | "codex"): void {
  local.settingsView = v;
}

/** Lesson exit: the demo pinned these, put the real tab back at its default. */
export function resetTuningTabLocal(): void {
  local.subtab = "profile";
  local.settingsView = "books";
}

export function renderTuningTab(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  host.replaceChildren();

  renderProfilePicker(host, state, ctx, send);
  host.appendChild(makeSubtabs(SUBTABS, local.subtab, (key) => {
    local.subtab = key;
    renderTuningTab(host, state, ctx, send);
    scrollPaneTop(host);
  }));

  const profile = state.activeProfile;
  const patch = (p: Partial<LMBProfile>) =>
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });

  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  if (!state.settings.enabled && local.subtab !== "profile") {
    pane.classList.add("lmb-greyed");
    pane.setAttribute("inert", "");
  }
  host.appendChild(pane);

  switch (local.subtab) {
    case "profile": {
      const rest = document.createElement("div");
      rest.className = "lmb-pane";
      if (!state.settings.enabled) {
        rest.classList.add("lmb-greyed");
        rest.setAttribute("inert", "");
      }
      pane.appendChild(rest);
      // Connections sit inside the switch, Books and Codex each above their samplers.
      renderSamplersSwitch(rest, state, profile, send);
      break;
    }
    case "settings": {
      const switchRow = document.createElement("div");
      switchRow.className = "lmb-sampler-switch";
      const body = document.createElement("div");
      body.className = "lmb-pane";
      const options: { key: "books" | "codex"; label: string; btn?: HTMLButtonElement }[] = [
        { key: "books", label: tr("ui.tabs.tuningTab.options.books") },
        { key: "codex", label: tr("ui.tabs.tuningTab.options.codex") },
      ];
      const sync = (): void => {
        for (const o of options) o.btn?.classList.toggle("active", local.settingsView === o.key);
        body.replaceChildren();
        if (local.settingsView === "books") {
          renderSummarySettings(body, profile, patch);
          renderContext(body, profile, patch);
          renderBehavior(body, profile, patch);
          renderRegex(body, profile, patch, send);
          renderGlobalSettings(body, state, send);
          renderResetSettings(body, state, send);
        } else if (codexLessonGated(state.lessons)) {
          renderCodexPaneLock(body);
        } else {
          renderCodexSettings(body, state, profile, patch);
        }
      };
      for (const o of options) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = o.label;
        lessonMark(btn, `tuning.settings.${o.key}`);
        btn.addEventListener("click", () => {
          if (local.settingsView === o.key) return;
          local.settingsView = o.key;
          sync();
        });
        o.btn = btn;
        switchRow.appendChild(btn);
      }
      pane.append(switchRow, body);
      sync();
      break;
    }
    case "prompts":
      renderPromptsPane(pane, state, ctx, send);
      break;
  }
}

/** Account-wide switches (not per-profile) - functional settings belong in
 * Tuning, not buried in the about tab. */
function renderGlobalSettings(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.tuningTab.sec.everywhere"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = tr("ui.tabs.tuningTab.renderGlobalSettings.theseApplyToEveryChatAndProfile");
  sec.body.appendChild(help);

  sec.body.appendChild(checkbox({
    checked: state.settings.showAutomationToasts,
    label: tr("ui.tabs.tuningTab.renderGlobalSettings.automationToasts"),
    hint: tr("ui.tabs.tuningTab.renderGlobalSettings.whenOffMemoriaSBackgroundRunsStay"),
    onChange: (v) => send({ type: "save_settings", patch: { showAutomationToasts: v }, chatId: state.activeChatId }),
  }));

  sec.body.appendChild(lessonMark(activationControl(tr("ui.tabs.tuningTab.renderGlobalSettings.summaryRecall"), state.settings.summaryActivationMode,
    (mode) => send({ type: "set_summary_activation", mode, chatId: state.activeChatId }), tr("ui.activationControl.activationControl.constant")), "tuning.every.constant"));
  const hint = document.createElement("div");
  hint.className = "lmb-field-hint";
  hint.textContent = tr("ui.tabs.tuningTab.renderGlobalSettings.appliesToExistingAndFutureChapterAnd");
  sec.body.appendChild(hint);
  if (state.settings.summaryActivationMode === "vector") sec.body.appendChild(vectorSetupHint());
  sec.body.appendChild(checkbox({
    checked: state.settings.followChatNames,
    label: tr("ui.tabs.tuningTab.renderGlobalSettings.lorebookNamesFollowChatNames"),
    hint: tr("ui.tabs.tuningTab.renderGlobalSettings.turnOffToRenameYourBooksAnd"),
    onChange: (followChatNames) => send({ type: "save_settings", patch: { followChatNames }, chatId: state.activeChatId }),
  }));

  host.appendChild(sec.wrap);
}

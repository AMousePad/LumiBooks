import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { LMBProfile } from "../../shared";
import { codexLessonGated } from "../../shared";
import { checkbox, lessonMark, makeSubtabs, scrollPaneTop, section } from "../components";
import { renderCodexPaneLock } from "../lessons/seal";
import {
  renderAutomation,
  renderBehavior,
  renderCodexSettings,
  renderCompressionTargets,
  renderContext,
  renderProfilePicker,
  renderRegex,
  renderResetSettings,
  renderSamplersSwitch,
} from "./profile-tab";
import { renderPromptsPane } from "./prompts-tab";

type TuningSubtab = "profile" | "settings" | "prompts";

const SUBTABS: { key: TuningSubtab; label: string }[] = [
  { key: "profile", label: "Connection" },
  { key: "settings", label: "Settings" },
  { key: "prompts", label: "Prompts" },
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

  // The full profile-management block lives in the Connection pane; the other
  // panes get a one-line context strip so it doesn't repeat above everything.
  if (local.subtab !== "profile") {
    const strip = document.createElement("div");
    strip.className = "lmb-profile-strip";
    strip.append(document.createTextNode("Profile"));
    const name = document.createElement("b");
    name.textContent = state.activeProfile.name;
    strip.appendChild(name);
    if (!state.settings.enabled) {
      strip.appendChild(document.createTextNode("· extension off"));
    }
    strip.title = "Switch or manage profiles in the Connection pane";
    host.appendChild(strip);
  }

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
      renderProfilePicker(pane, state, ctx, send);
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
        { key: "books", label: "Books" },
        { key: "codex", label: "Codex" },
      ];
      const sync = (): void => {
        for (const o of options) o.btn?.classList.toggle("active", local.settingsView === o.key);
        body.replaceChildren();
        if (local.settingsView === "books") {
          renderCompressionTargets(body, profile, patch);
          renderAutomation(body, profile, patch);
          renderContext(body, profile, patch);
          renderBehavior(body, profile, patch);
          renderRegex(body, state, profile, patch);
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
  const sec = section("Everywhere");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent = "These apply to every chat and profile on this account.";
  sec.body.appendChild(help);

  sec.body.appendChild(checkbox({
    checked: state.settings.showAutomationToasts,
    label: "Automation toasts",
    hint: "When off, Memoria's background runs stay quiet. Errors and your own actions still toast.",
    onChange: (v) => send({ type: "save_settings", patch: { showAutomationToasts: v }, chatId: state.activeChatId }),
  }));

  sec.body.appendChild(lessonMark(checkbox({
    checked: state.settings.forceConstantEntries,
    label: "Force constant entries",
    hint: "When on, every LumiBooks lorebook entry (current and future) is marked constant so it activates without keyword matching. Toggling re-flips every existing LumiBooks entry across all chats.",
    onChange: (v) => send({ type: "set_force_constant", value: v, chatId: state.activeChatId }),
  }), "tuning.every.constant"));

  host.appendChild(sec.wrap);
}

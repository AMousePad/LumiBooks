import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { LMBProfile } from "../../shared";
import { checkbox, makeSubtabs, scrollPaneTop, section } from "../components";
import {
  renderAutomation,
  renderBehavior,
  renderCodexSettings,
  renderCompressionTargets,
  renderConnection,
  renderContext,
  renderProfilePicker,
  renderRegex,
  renderResetSettings,
  renderSamplers,
} from "./profile-tab";
import { renderPromptsPane } from "./prompts-tab";

type TuningSubtab = "profile" | "codex" | "model" | "prompts";

const SUBTABS: { key: TuningSubtab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "codex", label: "Codex" },
  { key: "model", label: "Model" },
  { key: "prompts", label: "Prompts" },
];

const local = { subtab: "profile" as TuningSubtab };

export function renderTuningTab(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  host.replaceChildren();

  // The full profile-management block lives in the Profile pane; the other
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
    strip.title = "Switch or manage profiles in the Profile pane";
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
      renderCompressionTargets(rest, profile, patch);
      renderAutomation(rest, profile, patch);
      renderContext(rest, profile, patch);
      renderBehavior(rest, profile, patch);
      renderGlobalSettings(rest, state, send);
      renderResetSettings(rest, state, send);
      break;
    }
    case "codex":
      renderCodexSettings(pane, state, profile, patch);
      break;
    case "model":
      renderConnection(pane, state, profile, patch);
      renderSamplers(pane, state, profile, send);
      renderRegex(pane, state, profile, patch);
      break;
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

  sec.body.appendChild(checkbox({
    checked: state.settings.forceConstantEntries,
    label: "Force constant entries",
    hint: "When on, every LumiBooks lorebook entry (current and future) is marked constant so it activates without keyword matching. Toggling re-flips every existing LumiBooks entry across all chats.",
    onChange: (v) => send({ type: "set_force_constant", value: v, chatId: state.activeChatId }),
  }));

  host.appendChild(sec.wrap);
}

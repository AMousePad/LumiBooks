import { t as tr } from "../i18n";
import type { ActivationMode } from "../activation";
import { textNode } from "./components";

let nextGroup = 0;

/** Native radio inputs provide keyboard navigation and one selected option. */
export function activationControl(label: string, value: ActivationMode, onChange: (mode: ActivationMode) => void, alwaysLabel = tr("ui.activationControl.activationControl.always")): HTMLElement {
  const group = document.createElement("fieldset");
  group.className = "lmb-activation";
  const legend = document.createElement("legend");
  legend.textContent = label;
  group.append(legend);
  const row = document.createElement("div");
  row.className = "lmb-activation-options";
  const name = `lmb-activation-${++nextGroup}`;
  for (const [mode, title] of [["always", alwaysLabel], ["keywords", tr("ui.activationControl.activationControl.keywords")], ["vector", tr("ui.activationControl.activationControl.vectorKeywords")]] as const) {
    const option = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = mode;
    input.checked = value === mode;
    input.addEventListener("change", () => { if (input.checked) onChange(mode); });
    option.append(input, textNode(title, "lmb-activation-label"));
    row.append(option);
  }
  group.append(row);
  return group;
}

export function vectorSetupHint(): HTMLElement {
  return textNode(tr("ui.activationControl.vectorSetupHint.vectorRecallNeedsATestedEmbeddingConnection"), "lmb-field-hint");
}

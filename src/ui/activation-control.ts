import { t as tr } from "../i18n";
import type { ActivationMode } from "../activation";
import { textNode } from "./components";

let nextGroup = 0;

/** Native radio inputs provide keyboard navigation and one selected option. */
export function activationControl<Extra extends string = never>(label: string, value: ActivationMode | Extra, onChange: (mode: ActivationMode | Extra) => void, alwaysLabel = tr("ui.activationControl.activationControl.always"), extra: ReadonlyArray<readonly [Extra, string]> = []): HTMLElement {
  const group = document.createElement("fieldset");
  group.className = "lmb-activation";
  const legend = document.createElement("legend");
  legend.textContent = label;
  group.append(legend);
  const row = document.createElement("div");
  row.className = "lmb-activation-options";
  const name = `lmb-activation-${++nextGroup}`;
  const base: ReadonlyArray<readonly [ActivationMode, string]> = [["always", alwaysLabel], ["keywords", tr("ui.activationControl.activationControl.keywords")], ["vector", tr("ui.activationControl.activationControl.vectorKeywords")]];
  for (const [mode, title] of [...base, ...extra]) {
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

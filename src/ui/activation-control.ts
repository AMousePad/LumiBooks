import type { ActivationMode } from "../activation";
import { textNode } from "./components";

/** Native radio inputs provide keyboard navigation and one selected option. */
export function activationControl(label: string, value: ActivationMode, onChange: (mode: ActivationMode) => void): HTMLElement {
  const group = document.createElement("fieldset");
  group.className = "lmb-activation";
  const legend = document.createElement("legend");
  legend.textContent = label;
  group.append(legend);
  const row = document.createElement("div");
  row.className = "lmb-activation-options";
  const name = `activation-${crypto.randomUUID()}`;
  for (const [mode, title] of [["always", "Always"], ["keywords", "Keywords"], ["vector", "Vector + keywords"]] as const) {
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
  return textNode("Vector recall needs a tested embedding connection and lorebook vectorization enabled in Lumiverse. Indexing runs in the background. Until ready, or if retrieval fails, only keyword matches activate. Embeddings use the provider configured in Lumiverse.", "lmb-field-hint");
}

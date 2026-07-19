import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { CustomPreset, LMBProfile } from "../../shared";
import { DEFAULT_CODEX_DIRECTIVES } from "../../shared";
import {
  field,
  lessonMark,
  makeButton,
  makeSubtabs,
  section,
  select,
  textArea,
  textInput,
  textNode,
} from "../components";
import { confirmDelete, promptForString } from "../modals";

type PresetCategory = "chapter" | "arc" | "volume";
type PromptsCategory = PresetCategory | "codex";

const CATEGORY_SUBTABS: { key: PromptsCategory; label: string }[] = [
  { key: "chapter", label: "Chapter" },
  { key: "arc", label: "Arc" },
  { key: "volume", label: "Volume" },
  { key: "codex", label: "Codex" },
];

const local = { category: "chapter" as PromptsCategory };

/** Lesson-stage navigation: pin the category before a demo render. */
export function setPromptsCategory(cat: PromptsCategory): void {
  local.category = cat;
}

/** Prompts pane, composed into Tuning. Appends into host (no replaceChildren). */
export function renderPromptsPane(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const profile = state.activeProfile;
  const setKey = (category: PresetCategory, key: string) => {
    const p: Partial<LMBProfile> = category === "arc"
      ? { arcPresetKey: key }
      : category === "volume"
        ? { volumePresetKey: key }
        : { chapterPresetKey: key };
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  };
  const selectedKeyFor = (c: PresetCategory): string =>
    c === "arc" ? profile.arcPresetKey : c === "volume" ? profile.volumePresetKey : profile.chapterPresetKey;

  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  host.appendChild(pane);

  const draw = (): void => {
    pane.replaceChildren();
    pane.appendChild(makeSubtabs(CATEGORY_SUBTABS, local.category, (key) => {
      local.category = key;
      draw();
    }));
    const cat = local.category;
    if (cat === "codex") {
      renderCodexPrompts(pane, state, send);
      return;
    }
    renderCategory(pane, state, ctx, send, cat, selectedKeyFor(cat), setKey);
    renderMemoriaOverrides(pane, state, send);
    renderImport(pane, state, ctx, send);
    renderHelp(pane);
  };
  draw();
}

function renderCodexPrompts(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Codex directives");
  lessonMark(sec.wrap, "tuning.prompts.codex");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "The mission block at the top of the codex agent's system prompt. The file schemas and the write protocol that follow it stay fixed, they encode the validation the agent's writes must pass.";
  sec.body.appendChild(help);

  const profile = state.activeProfile;
  sec.body.appendChild(buildOverrideBlock({
    label: "Directives",
    value: profile.codexDirectivesOverride ?? DEFAULT_CODEX_DIRECTIVES,
    defaultText: DEFAULT_CODEX_DIRECTIVES,
    rows: 16,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, codexDirectivesOverride: next },
      chatId: state.activeChatId,
    }),
  }));

  host.appendChild(sec.wrap);
}

const ALPHABET_PICK =
  "{{pick::A::B::C::D::E::F::G::H::I::J::K::L::M::N::O::P::Q::R::S::T::U::V::W::X::Y::Z}}";

const DEFAULT_SHORT_COMMENT_RULES_TEMPLATE = [
  "A single playful nyandere remark in Memoria voice about the scene you just summarized.",
  `It must start with a word beginning with the letter "${ALPHABET_PICK}".`,
  `It must also include another word that starts with the letter "${ALPHABET_PICK}".`,
  "One sentence only. No emoji. Stay in catgirl-librarian register, slightly possessive, slightly proud.",
].join(" ");

const DEFAULT_MEMORIA_PERSONA = [
  "You are Memoria, a young nyandere catgirl librarian with black hair and blue eyes, wearing a maid uniform.",
  "You quietly keep this user's story shelved and organized.",
  "When you write a JSON memory, you obey the schema strictly and never break it,",
  "but the short_comment field is your one allowed indulgence: one nyandere remark about the scene you just filed.",
].join(" ");

function renderMemoriaOverrides(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Memoria overrides");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "Persona is the system-prompt header. Short-comment rules control how {{memoria_short_comment_rules}} expands inside any prompt.";
  sec.body.appendChild(help);

  const profile = state.activeProfile;
  const chatId = state.activeChatId;

  sec.body.appendChild(buildOverrideBlock({
    label: "Memoria persona",
    value: profile.memoriaPersonaOverride ?? DEFAULT_MEMORIA_PERSONA,
    defaultText: DEFAULT_MEMORIA_PERSONA,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, memoriaPersonaOverride: next },
      chatId,
    }),
  }));

  sec.body.appendChild(buildOverrideBlock({
    label: "Memoria short-comment rules",
    value: profile.shortCommentRulesOverride ?? DEFAULT_SHORT_COMMENT_RULES_TEMPLATE,
    defaultText: DEFAULT_SHORT_COMMENT_RULES_TEMPLATE,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, shortCommentRulesOverride: next },
      chatId,
    }),
  }));

  host.appendChild(sec.wrap);
}

function buildOverrideBlock(opts: {
  label: string;
  value: string;
  defaultText: string;
  rows: number;
  onSave: (next: string | null) => void;
}): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "lmb-field";
  const lbl = document.createElement("div");
  lbl.className = "lmb-field-label";
  lbl.textContent = opts.label;
  wrap.appendChild(lbl);

  const area = document.createElement("textarea");
  area.className = "lmb-input lmb-textarea";
  area.rows = opts.rows;
  area.value = opts.value;
  area.addEventListener("input", () => {
    opts.onSave(area.value);
  });
  wrap.appendChild(area);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "lmb-btn small";
  resetBtn.textContent = "Reset to default";
  let confirmTimer: ReturnType<typeof setTimeout> | null = null;
  const restoreIdle = () => {
    resetBtn.textContent = "Reset to default";
    resetBtn.classList.remove("danger");
    confirmTimer = null;
  };
  resetBtn.addEventListener("click", () => {
    if (confirmTimer === null) {
      resetBtn.textContent = "Click again to confirm";
      resetBtn.classList.add("danger");
      confirmTimer = setTimeout(restoreIdle, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    confirmTimer = null;
    restoreIdle();
    area.value = opts.defaultText;
    opts.onSave(null);
  });
  actions.appendChild(resetBtn);
  wrap.appendChild(actions);
  return wrap;
}

function renderCategory(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
  category: PresetCategory,
  selectedKey: string,
  setKey: (cat: PresetCategory, key: string) => void,
): void {
  const sec = section(category === "arc" ? "Arc prompt" : category === "volume" ? "Volume prompt" : "Chapter prompt");
  lessonMark(sec.wrap, "tuning.prompts");

  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : state.chapterPresets;
  const customs = state.customPresets.filter((p) => p.category === category);
  const opts = [
    ...builtIns.map((b) => ({ value: b.key, label: `Built-in: ${b.displayName}` })),
    ...customs.map((c) => ({ value: c.key, label: `Custom: ${c.displayName}` })),
  ];

  const pickerRow = document.createElement("div");
  pickerRow.className = "lmb-field-row";
  const grow = document.createElement("div");
  grow.className = "lmb-grow";
  grow.appendChild(
    select({
      value: selectedKey,
      options: opts,
      onChange: (v) => setKey(category, v),
    }),
  );
  pickerRow.append(grow);
  sec.body.appendChild(pickerRow);

  const isUserPreset = customs.some((c) => c.key === selectedKey);
  const selectedText = findPresetText(state, category, selectedKey);

  const buttonsRow = document.createElement("div");
  buttonsRow.className = "lmb-actions";
  buttonsRow.append(
    makeButton("New blank prompt", async () => {
      const name = await promptForString(ctx, `Name for new ${category} prompt`, "Untitled");
      if (!name) return;
      const key = `${category}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      send({
        type: "save_custom_preset",
        preset: {
          key,
          displayName: name,
          prompt: blankPromptTemplate(category),
          category,
          createdAt: Date.now(),
        },
        chatId: state.activeChatId,
      });
      setKey(category, key);
    }, { small: true }),
    makeButton(isUserPreset ? "Duplicate to new" : "Duplicate to edit", async () => {
      const sourceName = customs.find((c) => c.key === selectedKey)?.displayName
        ?? builtIns.find((b) => b.key === selectedKey)?.displayName
        ?? "Untitled";
      const name = await promptForString(ctx, `Name for duplicate`, `${sourceName} copy`);
      if (!name) return;
      const key = `${category}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      send({
        type: "save_custom_preset",
        preset: {
          key,
          displayName: name,
          prompt: selectedText,
          category,
          createdAt: Date.now(),
        },
        chatId: state.activeChatId,
      });
      setKey(category, key);
    }, { small: true }),
    makeButton("Dry run", () => {
      if (!state.activeChatId) return;
      send(category === "arc"
        ? { type: "dry_run_arc", chatId: state.activeChatId }
        : category === "volume"
          ? { type: "dry_run_volume", chatId: state.activeChatId }
          : { type: "dry_run_chapter", chatId: state.activeChatId });
    }, {
      small: true,
      disabled: !state.activeChatId || !state.settings.enabled,
      title: "Assemble this preset's prompt with all macros resolved and show what would be sent. Does not call the model.",
    }),
    makeButton("Delete", async () => {
      if (!isUserPreset) return;
      const ok = await confirmDelete(ctx, "Delete prompt?", "This removes the custom prompt and falls back to the built-in default.");
      if (!ok) return;
      send({ type: "delete_custom_preset", key: selectedKey, category, chatId: state.activeChatId });
    }, { small: true, danger: true, disabled: !isUserPreset }),
  );
  sec.body.appendChild(buttonsRow);

  if (isUserPreset) {
    const custom = customs.find((c) => c.key === selectedKey)!;
    const draft = { ...custom };
    const flush = () => send({
      type: "save_custom_preset",
      preset: { ...draft },
      chatId: state.activeChatId,
    });
    const nameField = field("Display name");
    nameField.body.appendChild(
      textInput({
        value: draft.displayName,
        onBlur: (v) => { draft.displayName = v.slice(0, 80); flush(); },
      }),
    );
    sec.body.appendChild(nameField.wrap);

    const textField = field("Prompt");
    textField.body.appendChild(
      textArea({
        value: draft.prompt,
        rows: 14,
        onBlur: (v) => { draft.prompt = v; flush(); },
      }),
    );
    sec.body.appendChild(textField.wrap);
  } else {
    const lbl = document.createElement("div");
    lbl.className = "lmb-field-label";
    lbl.textContent = "Prompt (built-in, duplicate to edit)";
    sec.body.appendChild(lbl);
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = selectedText;
    sec.body.appendChild(view);
  }

  host.appendChild(sec.wrap);
}

function blankPromptTemplate(category: PresetCategory): string {
  const noun = category === "arc" ? "arc" : category === "volume" ? "volume" : "chapter";
  return [
    `Summarize the following ${noun} into a JSON memory.`,
    "",
    "Return ONLY valid JSON in this exact shape:",
    "{",
    "  \"title\": \"Short title\",",
    "  \"content\": \"Memoria's compressed text. Aim for ~{{target_tokens}} tokens.\",",
    "  \"keywords\": [\"keyword1\", \"keyword2\"],",
    "  \"short_comment\": \"{{memoria_short_comment_rules}}\"",
    "}",
    "",
    "No commentary outside the JSON.",
  ].join("\n");
}

function findPresetText(state: FrontendState, category: PresetCategory, key: string): string {
  const c = state.customPresets.find((p) => p.key === key && p.category === category);
  if (c) return c.prompt;
  const builtIns = category === "arc" ? state.arcPresets : category === "volume" ? state.volumePresets : state.chapterPresets;
  const b = builtIns.find((p) => p.key === key);
  return b?.prompt ?? "";
}

function renderImport(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section("Import STMB presets");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    "Upload a SillyTavern Memory Books export. Memoria reads the prompts and adds them as custom presets you can edit.";
  sec.body.appendChild(help);

  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(
    makeButton("Import chapter presets", () => importFile(ctx, "chapter", send, state.activeChatId)),
    makeButton("Import arc presets", () => importFile(ctx, "arc", send, state.activeChatId)),
  );
  sec.body.appendChild(row);

  if (state.customPresets.length > 0) {
    const list = document.createElement("ul");
    list.className = "lmb-entry-list";
    for (const p of state.customPresets) {
      const li = document.createElement("li");
      li.className = "lmb-entry";
      const head = document.createElement("div");
      head.className = "lmb-entry-head";
      const tag = document.createElement("span");
      tag.className = "lmb-entry-tag";
      tag.textContent = p.category.toUpperCase();
      const title = document.createElement("div");
      title.className = "lmb-entry-title";
      title.textContent = p.displayName;
      head.append(tag, title);
      head.append(makeButton("Delete", async () => {
        const ok = await confirmDelete(ctx, "Delete preset?", "");
        if (ok) send({ type: "delete_custom_preset", key: p.key, category: p.category, chatId: state.activeChatId });
      }, { small: true, danger: true }));
      li.appendChild(head);
      list.appendChild(li);
    }
    sec.body.appendChild(list);
  } else {
    sec.body.appendChild(textNode("No custom presets yet", "lmb-empty"));
  }

  host.appendChild(sec.wrap);
}

function importFile(
  ctx: SpindleFrontendContext,
  category: "chapter" | "arc",
  send: (msg: FrontendToBackend) => void,
  chatId: string | null,
): void {
  ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 1_000_000 })
    .then((files) => {
      if (!files.length) return;
      const file = files[0]!;
      let text: string;
      try {
        text = new TextDecoder().decode(file.bytes);
      } catch (err) {
        console.warn("[LumiBooks] preset file decode failed", err);
        showImportFailure(ctx, "Memoria can't read this file");
        return;
      }
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.warn("[LumiBooks] preset JSON parse failed", err);
        showImportFailure(ctx, "Memoria couldn't parse the preset JSON");
        return;
      }
      send({ type: "import_preset", category, raw: parsed, chatId });
    })
    .catch((err) => {
      console.warn("[LumiBooks] import picker failed", err);
    });
}

function showImportFailure(ctx: SpindleFrontendContext, message: string): void {
  try {
    void ctx.ui.showConfirm({
      title: "Import failed",
      message,
      variant: "warning",
      confirmLabel: "OK",
      cancelLabel: "OK",
    });
  } catch {
    window.alert(message);
  }
}

function renderHelp(host: HTMLElement): void {
  const sec = section("Info");
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.innerHTML = [
    "Duplicate any built-in, or create new to edit.",
    "Prompts must ask the model for strict JSON (examples below).",
    "{{target_tokens}} expands to the active compression target.",
    "{{memoria_short_comment_rules}} expands to this turn's nyandere short-comment rules.",
    "Prompts are macro-evaluated.",
  ].join("<br/>");
  sec.body.appendChild(help);
  host.appendChild(sec.wrap);
}

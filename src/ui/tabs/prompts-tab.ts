import { t as tr } from "../../i18n";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { FrontendState, FrontendToBackend } from "../../types";
import { TIER_KINDS, TIER_NAMES, promptRoleFor, type CustomPreset, type LMBProfile, type PresetCategory, type HigherTier, type PromptRole, type SummaryKind } from "../../shared";
import { builtInPresetsFor, isExtraCategory, presetKeyFor, presetKeyPatch, resolvePresetText } from "../../prompts/categories";
import { fillPrompt } from "../../prompts/fill";
import blankTemplateTxt from "../../prompts/books/blank-template.txt";
import personaTxt from "../../prompts/memoria/persona.txt";
import shortCommentRulesTxt from "../../prompts/memoria/short-comment-rules.txt";
import {
  CODEX_DIRECTIVES_DEFAULT,
  CODEX_TEMPLATES,
  type CodexTemplateDef,
  type CodexTemplateGroup,
  type CodexTemplateKey,
} from "../../prompts/codex/registry";
import {
  field,
  lessonMark,
  makeButton,
  makeSubtabs,
  pill,
  section,
  select,
  textArea,
  textInput,
  textNode,
} from "../components";
import { confirmDelete, promptForString } from "../modals";

const CATEGORY_SUBTABS = [
  { key: "summaries", label: tr("ui.tabs.promptsTab.categorySubtabs.summaries") },
  { key: "codex", label: tr("ui.tabs.promptsTab.categorySubtabs.codex") },
] as const;
const SUMMARY_LABELS = [tr("ui.tabs.promptsTab.categorySubtabs.chapter"), tr("ui.tabs.promptsTab.categorySubtabs.arc"), tr("ui.tabs.promptsTab.categorySubtabs.volume"), ...TIER_NAMES.slice(3)];
const SUMMARY_SUBTABS = TIER_KINDS.map((key, index) => ({ key, label: SUMMARY_LABELS[index]! }));

const local = {
  category: "summaries" as "summaries" | "codex",
  summary: "chapter" as SummaryKind,
  /** Codex template rows the user opened, by template key. */
  codexExpanded: new Set<string>(),
  /** How To panels open inside expanded rows. */
  codexHowTo: new Set<string>(),
};

/** Lesson-stage navigation: pin the category before a demo render. */
export function setPromptsCategory(cat: PresetCategory): void {
  local.category = cat === "codex" ? "codex" : "summaries";
  if (cat !== "codex") local.summary = cat;
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
    const p = presetKeyPatch(category, key);
    send({ type: "save_profile", profile: { id: profile.id, ...p }, chatId: state.activeChatId });
  };

  const pane = document.createElement("div");
  pane.className = "lmb-pane";
  host.appendChild(pane);

  const draw = (): void => {
    pane.replaceChildren();
    pane.appendChild(makeSubtabs([...CATEGORY_SUBTABS], local.category, (key) => {
      local.category = key;
      draw();
    }));
    if (local.category === "codex") {
      renderCategory(pane, state, ctx, send, "codex", presetKeyFor(profile, "codex"), setKey);
      renderCodexTemplates(pane, state, send);
      return;
    }
    pane.appendChild(makeSubtabs(SUMMARY_SUBTABS, local.summary, (key) => { local.summary = key; draw(); }));
    renderCategory(pane, state, ctx, send, local.summary, presetKeyFor(profile, local.summary), setKey);
    renderMemoriaOverrides(pane, state, send);
    renderImport(pane, state, ctx, send);
    renderHelp(pane);
  };
  draw();
}

/* --------------------------------------------------- codex template list */

const TEMPLATE_GROUPS: CodexTemplateGroup[] = ["File schemas", "Write protocol", "Pass instructions", "Run notes"];
const GROUP_LABELS: Record<CodexTemplateGroup, string> = {
  "File schemas": tr("ui.tabs.promptsTab.groups.fileSchemas"),
  "Write protocol": tr("ui.tabs.promptsTab.groups.writeProtocol"),
  "Pass instructions": tr("ui.tabs.promptsTab.groups.passInstructions"),
  "Run notes": tr("ui.tabs.promptsTab.groups.runNotes"),
};

const GROUP_HELP: Record<CodexTemplateGroup, string> = {
  "File schemas": tr("ui.tabs.promptsTab.groupHelp.oneBlockPerCodexFile"),
  "Write protocol": tr("ui.tabs.promptsTab.groupHelp.howTheAgentIsToldToDeliver"),
  "Pass instructions": tr("ui.tabs.promptsTab.groupHelp.theTaskTextForEachKindOf"),
  "Run notes": tr("ui.tabs.promptsTab.groupHelp.warningsPrependedOnlyWhenTheirSituationApplies"),
};

function renderCodexTemplates(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const profile = state.activeProfile;
  const preset = state.customPresets.find((p) => p.category === "codex" && p.key === profile.codexPresetKey) ?? null;
  const sec = section(tr("ui.tabs.promptsTab.sec.codexPromptTemplates"));
  const draw = (): void => {
    sec.body.replaceChildren();
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent = preset
      ? tr("ui.tabs.promptsTab.draw.everyOtherBlockOfTheCodexAgent", { displayName: preset.displayName })
      : tr("ui.tabs.promptsTab.draw.otherBlocksOfTheCodexAgentS");
    sec.body.appendChild(help);

    const overridden = preset?.templates ? Object.keys(preset.templates).length : 0;
    if (overridden > 0) {
      sec.body.appendChild(textNode(
        tr("ui.tabs.promptsTab.draw.templateCustomizedInThisPreset", { overridden: overridden }),
        "lmb-help",
      ));
    }

    for (const group of TEMPLATE_GROUPS) {
      const defs = CODEX_TEMPLATES.filter((t) => t.group === group);
      if (defs.length === 0) continue;
      const sub = document.createElement("div");
      sub.className = "lmb-section-title";
      sub.textContent = GROUP_LABELS[group];
      sec.body.appendChild(sub);
      sec.body.appendChild(textNode(GROUP_HELP[group], "lmb-help"));
      const list = document.createElement("ul");
      list.className = "lmb-entry-list";
      for (const def of defs) {
        list.appendChild(renderTemplateRow(def, preset, state, send, draw));
      }
      sec.body.appendChild(list);
    }
  };
  draw();
  host.appendChild(sec.wrap);
}

function renderTemplateRow(
  def: CodexTemplateDef,
  preset: CustomPreset | null,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
  redraw: () => void,
): HTMLElement {
  const override = preset?.templates?.[def.key];
  const expanded = local.codexExpanded.has(def.key);

  const row = document.createElement("li");
  row.className = `lmb-entry compact${expanded ? " expanded" : ""}`;

  const head = document.createElement("button");
  head.type = "button";
  head.className = "lmb-entry-row";
  const title = document.createElement("span");
  title.className = "lmb-entry-title";
  title.textContent = def.label;
  head.appendChild(title);
  if (override !== undefined) head.appendChild(pill(tr("ui.tabs.promptsTab.renderTemplateRow.customized"), "warn"));
  const chevron = document.createElement("span");
  chevron.className = `lmb-chevron${expanded ? " open" : ""}`;
  head.appendChild(chevron);
  head.addEventListener("click", () => {
    if (expanded) local.codexExpanded.delete(def.key);
    else local.codexExpanded.add(def.key);
    redraw();
  });
  row.appendChild(head);
  if (!expanded) return row;

  const detail = document.createElement("div");
  detail.className = "lmb-entry-detail";

  // Compact How To expander: closed by default so the list stays scannable.
  const howToOpen = local.codexHowTo.has(def.key);
  const howBtn = makeButton(howToOpen ? tr("ui.tabs.promptsTab.howBtn.hideHowTo") : tr("ui.tabs.promptsTab.howBtn.howTo"), () => {
    if (howToOpen) local.codexHowTo.delete(def.key);
    else local.codexHowTo.add(def.key);
    redraw();
  }, { small: true });
  detail.appendChild(howBtn);
  if (howToOpen) {
    const how = document.createElement("div");
    how.className = "lmb-help";
    how.textContent = def.howTo;
    detail.appendChild(how);
    for (const v of def.vars) {
      detail.appendChild(textNode(`${v.token} - ${v.meaning}`, "lmb-field-hint"));
    }
    detail.appendChild(textNode(
      tr("ui.tabs.promptsTab.renderTemplateRow.hostMacrosLikeUserAlsoWorkThey"),
      "lmb-field-hint",
    ));
  }

  if (!preset) {
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = def.defaultText;
    detail.appendChild(view);
    detail.appendChild(textNode(tr("ui.tabs.promptsTab.renderTemplateRow.builtInPresetDuplicateItAboveTo"), "lmb-field-hint"));
    row.appendChild(detail);
    return row;
  }

  const area = textArea({
    value: override ?? def.defaultText,
    rows: Math.min(16, Math.max(4, def.defaultText.split("\n").length + 1)),
  });
  const save = (): void => {
    const templates: Partial<Record<CodexTemplateKey, string>> = { ...(preset.templates ?? {}) };
    if (!area.value.trim() || area.value === def.defaultText) delete templates[def.key];
    else templates[def.key] = area.value;
    send({
      type: "save_custom_preset",
      preset: { ...preset, templates },
      chatId: state.activeChatId,
    });
  };
  area.addEventListener("input", save);
  detail.appendChild(area);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  let resetArmed = false;
  const resetBtn = makeButton(tr("ui.tabs.promptsTab.resetBtn.resetToDefault"), () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = tr("ui.tabs.promptsTab.resetBtn.clickAgainToConfirm");
      resetBtn.classList.add("danger");
      setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = tr("ui.tabs.promptsTab.resetBtn.resetToDefault");
        resetBtn.classList.remove("danger");
      }, 3000);
      return;
    }
    area.value = def.defaultText;
    save();
    redraw();
  }, { small: true, disabled: override === undefined });
  actions.appendChild(resetBtn);
  detail.appendChild(actions);

  row.appendChild(detail);
  return row;
}

/* -------------------------------------------------------- memoria blocks */

function renderMemoriaOverrides(
  host: HTMLElement,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.promptsTab.sec.memoriaOverrides"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    tr("ui.tabs.promptsTab.renderMemoriaOverrides.personaIsTheSystemPromptHeaderShort");
  sec.body.appendChild(help);

  const profile = state.activeProfile;
  const chatId = state.activeChatId;

  sec.body.appendChild(buildOverrideBlock({
    label: tr("ui.tabs.promptsTab.renderMemoriaOverrides.memoriaPersona"),
    value: profile.memoriaPersonaOverride ?? personaTxt,
    defaultText: personaTxt,
    rows: 4,
    onSave: (next) => send({
      type: "save_profile",
      profile: { id: profile.id, memoriaPersonaOverride: next },
      chatId,
    }),
  }));

  sec.body.appendChild(buildOverrideBlock({
    label: tr("ui.tabs.promptsTab.renderMemoriaOverrides.memoriaShortCommentRules"),
    value: profile.shortCommentRulesOverride ?? shortCommentRulesTxt,
    defaultText: shortCommentRulesTxt,
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
  resetBtn.textContent = tr("ui.tabs.promptsTab.buildOverrideBlock.resetToDefault");
  let confirmTimer: ReturnType<typeof setTimeout> | null = null;
  const restoreIdle = () => {
    resetBtn.textContent = tr("ui.tabs.promptsTab.restoreIdle.resetToDefault");
    resetBtn.classList.remove("danger");
    confirmTimer = null;
  };
  resetBtn.addEventListener("click", () => {
    if (confirmTimer === null) {
      resetBtn.textContent = tr("ui.tabs.promptsTab.buildOverrideBlock.clickAgainToConfirm");
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

/* ---------------------------------------------------------- preset picker */

function renderCategory(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
  category: PresetCategory,
  selectedKey: string,
  setKey: (cat: PresetCategory, key: string) => void,
): void {
  const isCodex = category === "codex";
  const sec = section(
    category === "chapter" ? tr("ui.tabs.promptsTab.sec.chapterPrompt")
      : category === "arc" ? tr("ui.tabs.promptsTab.sec.arcPrompt")
      : category === "volume" ? tr("ui.tabs.promptsTab.sec.volumePrompt")
      : isCodex ? tr("ui.tabs.promptsTab.sec.codexDirectives")
      : tr("ui.tabs.promptsTab.sec.summaryPrompt", { name: TIER_NAMES[TIER_KINDS.indexOf(category)] }),
  );
  lessonMark(sec.wrap, isCodex ? "tuning.prompts.codex" : "tuning.prompts");
  if (isCodex) {
    const help = document.createElement("div");
    help.className = "lmb-help";
    help.textContent =
      tr("ui.tabs.promptsTab.renderCategory.theMissionBlockAtTheTopOf");
    sec.body.appendChild(help);
  }

  const roleRow = document.createElement("label");
  roleRow.className = "lmb-field-row lmb-prompt-role-row";
  roleRow.append(textNode(tr("ui.tabs.promptsTab.sendAs.label"), "lmb-field-label"));
  const role = select({ value: promptRoleFor(state.activeProfile, category),
    options: [
      { value: "system", label: tr("ui.tabs.promptsTab.sendAs.system") },
      { value: "assistant", label: tr("ui.tabs.promptsTab.sendAs.assistant") },
      { value: "user", label: tr("ui.tabs.promptsTab.sendAs.user") },
    ],
    onChange: (value) => send({ type: "save_profile", profile: { id: state.activeProfile.id, promptRoles: { [category]: value as PromptRole } }, chatId: state.activeChatId }),
  });
  role.classList.add("lmb-prompt-role");
  role.setAttribute("aria-label", tr("ui.tabs.promptsTab.sendAs.label"));
  roleRow.append(role);
  sec.body.append(roleRow, textNode(tr("ui.tabs.promptsTab.sendAs.help"), "lmb-field-hint"));

  const builtIns = builtInPresetsFor(state, category);
  const customs = state.customPresets.filter((p) => p.category === category);
  const opts = [
    ...(isExtraCategory(category) ? [{ value: "", label: tr("ui.tabs.promptsTab.opts.useVolume") }] : []),
    ...builtIns.map((b) => ({ value: b.key, label: tr("ui.tabs.promptsTab.opts.builtIn", { displayName: b.displayName }) })),
    ...customs.map((c) => ({ value: c.key, label: tr("ui.tabs.promptsTab.opts.custom", { displayName: c.displayName }) })),
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
  sec.body.appendChild(textNode(tr("ui.tabs.promptsTab.renderCategory.presetScope"), "lmb-field-hint"));

  const isUserPreset = customs.some((c) => c.key === selectedKey);
  const selectedText = resolvePresetText(state.activeProfile, state.customPresets, state, category);

  const buttonsRow = document.createElement("div");
  buttonsRow.className = "lmb-actions";
  buttonsRow.append(
    makeButton(tr("ui.tabs.promptsTab.renderCategory.newBlankPrompt"), async () => {
      const name = await promptForString(ctx, tr("ui.tabs.promptsTab.name.nameForNewPrompt", { category: category }), tr("ui.tabs.promptsTab.name.untitled"));
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
    makeButton(isUserPreset ? tr("ui.tabs.promptsTab.renderCategory.duplicateToNew") : tr("ui.tabs.promptsTab.renderCategory.duplicateToEdit"), async () => {
      const sourceName = customs.find((c) => c.key === selectedKey)?.displayName
        ?? builtIns.find((b) => b.key === selectedKey)?.displayName
        ?? tr("ui.tabs.promptsTab.sourceName.untitled");
      const name = await promptForString(ctx, tr("ui.tabs.promptsTab.name.nameForDuplicate"), `${sourceName} copy`);
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
  );
  buttonsRow.append(
    makeButton(tr("ui.tabs.promptsTab.renderCategory.dryRun"), () => {
      if (!state.activeChatId) return;
      send(category === "arc"
        ? { type: "dry_run_arc", chatId: state.activeChatId }
        : category === "codex"
            ? { type: "dry_run_codex", chatId: state.activeChatId }
            : category === "chapter"
              ? { type: "dry_run_chapter", chatId: state.activeChatId }
              : { type: "dry_run_volume", chatId: state.activeChatId, tier: (TIER_KINDS.indexOf(category) + 1) as HigherTier });
    }, {
      small: true,
      disabled: !state.activeChatId || !state.settings.enabled,
      title: isCodex
        ? tr("ui.tabs.promptsTab.renderCategory.assembleTheNextCodexRunSComplete")
        : tr("ui.tabs.promptsTab.renderCategory.assembleThisPresetSPromptWithAll"),
    }),
  );
  buttonsRow.append(
    makeButton(tr("ui.tabs.promptsTab.renderCategory.delete"), async () => {
      if (!isUserPreset) return;
      const ok = await confirmDelete(ctx, tr("ui.tabs.promptsTab.ok.deletePrompt"), tr("ui.tabs.promptsTab.ok.thisRemovesTheCustomPromptAndFalls"));
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
    const nameField = field(tr("ui.tabs.promptsTab.nameField.displayName"));
    nameField.body.appendChild(
      textInput({
        value: draft.displayName,
        onBlur: (v) => { draft.displayName = v.slice(0, 80); flush(); },
      }),
    );
    sec.body.appendChild(nameField.wrap);

    const textField = field(tr("ui.tabs.promptsTab.textField.prompt"));
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
    lbl.textContent = tr("ui.tabs.promptsTab.renderCategory.promptBuiltInDuplicateToEdit");
    sec.body.appendChild(lbl);
    const view = document.createElement("div");
    view.className = "lmb-preset-text";
    view.textContent = selectedText;
    sec.body.appendChild(view);
  }

  host.appendChild(sec.wrap);
}

function blankPromptTemplate(category: PresetCategory): string {
  if (category === "codex") return CODEX_DIRECTIVES_DEFAULT;
  return fillPrompt(blankTemplateTxt, { NOUN: category });
}

function renderImport(
  host: HTMLElement,
  state: FrontendState,
  ctx: SpindleFrontendContext,
  send: (msg: FrontendToBackend) => void,
): void {
  const sec = section(tr("ui.tabs.promptsTab.sec.importStmbPresets"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  help.textContent =
    tr("ui.tabs.promptsTab.renderImport.uploadASillyTavernMemoryBooksExportMemoria");
  sec.body.appendChild(help);

  const row = document.createElement("div");
  row.className = "lmb-actions";
  row.append(
    makeButton(tr("ui.tabs.promptsTab.renderImport.importChapterPresets"), () => importFile(ctx, "chapter", send, state.activeChatId)),
    makeButton(tr("ui.tabs.promptsTab.renderImport.importArcPresets"), () => importFile(ctx, "arc", send, state.activeChatId)),
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
      tag.textContent = tr("shared.summaryKindTag", { kind: p.category });
      const title = document.createElement("div");
      title.className = "lmb-entry-title";
      title.textContent = p.displayName;
      head.append(tag, title);
      head.append(makeButton(tr("ui.tabs.promptsTab.renderImport.delete"), async () => {
        const ok = await confirmDelete(ctx, tr("ui.tabs.promptsTab.ok.deletePreset"), "");
        if (ok) send({ type: "delete_custom_preset", key: p.key, category: p.category, chatId: state.activeChatId });
      }, { small: true, danger: true }));
      li.appendChild(head);
      list.appendChild(li);
    }
    sec.body.appendChild(list);
  } else {
    sec.body.appendChild(textNode(tr("ui.tabs.promptsTab.renderImport.noCustomPresetsYet"), "lmb-empty"));
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
        showImportFailure(ctx, tr("ui.tabs.promptsTab.importFile.memoriaCanTReadThisFile"));
        return;
      }
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.warn("[LumiBooks] preset JSON parse failed", err);
        showImportFailure(ctx, tr("ui.tabs.promptsTab.importFile.memoriaCouldnTParseThePresetJson"));
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
      title: tr("ui.tabs.promptsTab.showImportFailure.importFailed"),
      message,
      variant: "warning",
      confirmLabel: tr("ui.tabs.promptsTab.showImportFailure.ok"),
      cancelLabel: tr("ui.tabs.promptsTab.showImportFailure.ok"),
    });
  } catch {
    window.alert(message);
  }
}

function renderHelp(host: HTMLElement): void {
  const sec = section(tr("ui.tabs.promptsTab.sec.info"));
  const help = document.createElement("div");
  help.className = "lmb-help";
  const lines = [
    tr("ui.tabs.promptsTab.lines.duplicateAnyBuiltInOrCreateNew"),
    tr("ui.tabs.promptsTab.lines.promptsMustAskTheModelForStrict"),
    tr("ui.tabs.promptsTab.lines.targetTokensExpandsToTheActiveCompression"),
    tr("ui.tabs.promptsTab.lines.memoriaShortCommentRulesExpandsToThis"),
    tr("ui.tabs.promptsTab.lines.promptsAreMacroEvaluated"),
  ];
  lines.forEach((line, index) => {
    if (index) help.appendChild(document.createElement("br"));
    help.appendChild(document.createTextNode(line));
  });
  sec.body.appendChild(help);
  host.appendChild(sec.wrap);
}

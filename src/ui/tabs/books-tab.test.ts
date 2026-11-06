import { afterEach, beforeEach, expect, test } from "bun:test";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { normalizeEntryMeta, TIER_NAMES, type SummaryTier } from "../../shared";
import type { ArcView, FrontendState } from "../../types";
import { activationControl } from "../activation-control";
import { applyCacheLocks } from "../components";
import { buildFixture } from "../lessons/fixture";
import { renderBooksTab, resetBooksTabLocal, setBooksSubtab } from "./books-tab";
import { renderHomeTab, resetHomeTabLocal } from "./home-tab";
import { deliverPromptBreakdown } from "../prompt-breakdown";
import { renderCodexSettings, renderProfilePicker, renderRegex } from "./profile-tab";
import { deliverRegexScriptsPage, resetRegexPicker } from "../regex-picker";
import { renderAboutTab } from "./about-tab";
import { renderPromptsPane, setPromptsCategory } from "./prompts-tab";
import { renderTuningTab, resetTuningTabLocal, setTuningSubtab } from "./tuning-tab";
import { createSummaryTransferPanel } from "../summary-transfer";
import { makeDefaultProfile } from "../../shared";
import { deliverCodexFiles, renderCodexTab, resetCodexTabLocal, setCodexSubtab, setCodexExpandedEntity } from "./codex-tab";

class Element {
  isConnected = true;
  children: Element[] = [];
  parentElement: Element | null = null;
  className = "";
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  attributes: Record<string, string> = {};
  value = "";
  disabled = false;
  checked = false;
  open = false;
  private text = "";
  private listeners = new Map<string, ((event: { preventDefault(): void }) => void)[]>();
  constructor(readonly tagName: string) {}
  get firstElementChild(): Element | null { return this.children[0] ?? null; }
  get textContent(): string { return this.text + this.children.map((c) => c.textContent).join(""); }
  set textContent(value: string) { this.text = value; this.children = []; }
  classList = { add: (name: string) => { this.className += ` ${name}`; }, remove: (..._names: string[]) => {}, toggle: (_name: string, _force?: boolean) => {} };
  appendChild(child: Element): Element { child.parentElement = this; this.children.push(child); return child; }
  append(...children: Element[]): void { children.forEach((c) => this.appendChild(c)); }
  replaceChildren(...children: Element[]): void { this.children = []; this.text = ""; this.append(...children); }
  setAttribute(name: string, value: string): void { this.attributes[name] = value; }
  querySelectorAll(selector: string): Element[] {
    if (selector === "[data-cache-locked]") return this.children.flatMap(walk).filter((node) => node.dataset.cacheLocked);
    const tags = selector.split(",").map((tag) => tag.trim());
    return this.children.flatMap(walk).filter((node) => tags.includes(node.tagName));
  }
  addEventListener(name: string, listener: (event: { preventDefault(): void }) => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }
  dispatch(name: string): void {
    let stopped = false, prevented = false;
    const event = { type: name, target: this, preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } };
    for (const owner of [...this.ancestors().reverse(), this]) {
      owner.listeners.get(name)?.forEach((fn) => { if (!stopped) fn(event); });
      if (stopped) break;
    }
    this.lastPrevented = prevented;
  }
  lastPrevented = false;
  private ancestors(): Element[] { return this.parentElement ? [this.parentElement, ...this.parentElement.ancestors()] : []; }
  closest(_selector: string): Element | null { return this.dataset.cacheLocked ? this : this.parentElement?.closest(_selector) ?? null; }
  getBoundingClientRect() { return { left: 0, top: 0 }; }
  remove(): void { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((c) => c !== this); }
  focus(): void {}
}

const walk = (root: Element): Element[] => [root, ...root.children.flatMap(walk)];
const documentEvents: { type: string; detail?: unknown }[] = [];
const dom = {
  document: {
    body: new Element("body"),
    querySelector: (selector: string) => walk(dom.document.body).find((n) => n.className.split(" ").includes(selector.slice(1))) ?? null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: (event: { type: string; detail?: unknown }) => { documentEvents.push(event); return true; },
    createElement: (tag: string) => new Element(tag),
    createTextNode: (text: string) => { const node = new Element("#text"); node.textContent = text; return node; },
    createTreeWalker: (root: Element) => {
      const nodes = walk(root); let index = 0;
      return { currentNode: root, nextNode: () => nodes[++index] ?? null };
    },
  },
  HTMLElement: Element,
  NodeFilter: { SHOW_ELEMENT: 1 },
  getComputedStyle: () => ({ overflowY: "visible" }),
};
const originals = new Map<string, PropertyDescriptor | undefined>();
beforeEach(() => {
  for (const [key, value] of Object.entries(dom)) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  resetBooksTabLocal();
});
afterEach(() => {
  resetTuningTabLocal();
  setPromptsCategory("chapter");
  resetRegexPicker();
  resetCodexTabLocal();
  resetHomeTabLocal();
  resetBooksTabLocal();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

test("regex pages load on demand and both selectors preserve off-page selections", () => {
  const profile = makeDefaultProfile("regex-test");
  profile.regexOutgoingScriptIds = ["regex-9999"];
  profile.regexIncomingScriptIds = ["regex-8000"];
  const patches: any[] = [], sent: any[] = [];
  const host = new Element("div");
  renderRegex(host as unknown as HTMLElement, profile, (patch) => patches.push(patch), (message) => sent.push(message));
  const reply = () => {
    const request = sent.at(-1);
    deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: request.requestId, page: {
      offset: request.offset, limit: 50, total: 10_001,
      scripts: Array.from({ length: 50 }, (_, i) => ({ id: `regex-${request.offset + i}`, name: `Regex ${request.offset + i}` })),
    } });
  };
  const button = (text: string) => walk(host).find((e) => e.tagName === "button" && (e.attributes["aria-label"] ?? e.textContent) === text)!;
  const selectors = () => walk(host).filter((e) => e.className === "lmb-multiselect");
  const select = (group: number, row: number, checked: boolean) => {
    const box = selectors()[group]!.children[row]!.children[0]!;
    box.checked = checked; box.dispatch("change");
  };
  expect(sent).toHaveLength(1);
  expect(sent[0].offset).toBe(0);
  reply();
  expect(button("Previous").disabled).toBe(true);
  expect(selectors().map((s) => s.children.length)).toEqual([50, 50]);
  select(0, 0, true);
  button("Next").dispatch("click");
  expect(sent.at(-1).offset).toBe(50);
  expect(button("Next").disabled).toBe(true);
  reply();
  expect(selectors()[0]!.children[0]!.textContent).toBe("Regex 50");
  select(0, 0, true);
  select(1, 1, true);
  expect(patches.at(-2)).toEqual({ regexOutgoingScriptIds: ["regex-9999", "regex-0", "regex-50"] });
  expect(patches.at(-1)).toEqual({ regexIncomingScriptIds: ["regex-8000", "regex-51"] });
  button("Previous").dispatch("click"); reply();
  expect(selectors()[0]!.children[0]!.children[0]!.checked).toBe(true);
  select(0, 0, false);
  expect(patches.at(-1)).toEqual({ regexOutgoingScriptIds: ["regex-9999", "regex-50"] });
  const jump = walk(host).find((e) => e.tagName === "input" && e.attributes["aria-label"] === "Page")!;
  jump.value = "201"; jump.dispatch("blur");
  expect(sent.at(-1).offset).toBe(10_000);
  const request = sent.at(-1);
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: request.requestId, page: { offset: 10_000, limit: 50, total: 10_001, scripts: [{ id: "regex-10000", name: "Last" }] } });
  expect(button("Next").disabled).toBe(true);
  expect(selectors().map((s) => s.children.length)).toEqual([1, 1]);
});

test("regex page responses survive rerenders, reject stale replies and allow retry after failure", () => {
  const profile = makeDefaultProfile("regex-test"), sent: any[] = [];
  const first = new Element("div"), current = new Element("div");
  renderRegex(first as unknown as HTMLElement, profile, () => {}, (message) => sent.push(message));
  renderRegex(current as unknown as HTMLElement, profile, () => {}, (message) => sent.push(message));
  expect(sent).toHaveLength(1);
  const request = sent[0];
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: "stale", page: { scripts: [], offset: 0, limit: 50, total: 0 } });
  expect(current.textContent).toContain("Loading regex scripts");
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: request.requestId, error: "failed" });
  expect(current.textContent).toContain("Could not load this page");
  walk(current).find((e) => e.tagName === "button" && e.textContent === "Refresh")!.dispatch("click");
  expect(sent).toHaveLength(2);
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: sent[1].requestId, page: { scripts: [], offset: 0, limit: 50, total: 0 } });
  expect(current.textContent).toContain("No regex scripts");
});

test("regex search reuses the shared field, debounces requests and keeps selections across queries", async () => {
  const profile = makeDefaultProfile("regex-search"), sent: any[] = [], patches: any[] = [];
  profile.regexOutgoingScriptIds = ["off-page"];
  const host = new Element("div");
  renderRegex(host as unknown as HTMLElement, profile, (patch) => patches.push(patch), (message) => sent.push(message));
  const initial = sent[0];
  const input = walk(host).find((e) => e.className === "lmb-search-input")!;
  expect(input).toBeDefined();
  input.value = "R"; input.dispatch("input");
  input.value = "Rare"; input.dispatch("input");
  expect(sent).toHaveLength(1);
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: initial.requestId,
    page: { offset: 0, limit: 50, total: 1, scripts: [{ id: "old", name: "Old response" }] } });
  expect(host.textContent).not.toContain("Old response");
  await Bun.sleep(280);
  expect(sent).toHaveLength(2);
  expect(sent[1]).toMatchObject({ query: "Rare", offset: 0 });
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: sent[1].requestId, progress: { scanned: 200, total: 10_001 } });
  expect(host.textContent).toContain("200 of 10,001 checked");
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: initial.requestId, progress: { scanned: 999, total: 999 } });
  expect(host.textContent).not.toContain("999 of 999");
  deliverRegexScriptsPage({ type: "regex_scripts_page", requestId: sent[1].requestId,
    page: { offset: 0, limit: 50, total: 1, scripts: [{ id: "rare", name: "Rare match" }] } });
  expect(walk(host).find((e) => e.className === "lmb-search-input")).toBe(input);
  const select = walk(host).find((e) => e.className === "lmb-multiselect")!.children[0]!.children[0]!;
  select.checked = true; select.dispatch("change");
  expect(patches.at(-1)).toEqual({ regexOutgoingScriptIds: ["off-page", "rare"] });
  walk(host).find((e) => e.className === "lmb-search-clear")!.dispatch("click");
  await Bun.sleep(280);
  expect(sent.at(-1)).toMatchObject({ query: "", offset: 0 });
});

function entry(tier: SummaryTier, index: number, active = true, isRoot = false, isGhost = false): ArcView {
  const id = `${isRoot ? "root" : "own"}-${tier}-${index}`;
  return {
    entryId: id, bookId: "book", comment: id, content: `Summary ${id}`,
    meta: normalizeEntryMeta({ tier, chatId: "chat", msgIds: [], sceneNumber: index + 1, isRoot, ghost: isGhost })!,
    active, isRoot, isGhost, contentTokens: 10, contentChars: 40, sourceTokensInput: 100,
    sourceChapterEntryIds: [],
  };
}
function state(): FrontendState {
  const result = buildFixture("shelf");
  const tiers = Array.from({ length: 7 }, (_, i) => {
    const tier = (i + 1) as SummaryTier;
    return [...Array.from({ length: 8 }, (_, j) => entry(tier, j, j >= 2)), entry(tier, 8, true, true), entry(tier, 10, false, true)];
  });
  result.chapters = [...tiers[0]!, entry(1, 9, false, false, true)];
  result.arcs = tiers[1]!;
  result.volumes = tiers[2]!;
  result.higherBooks = tiers.slice(3).flat();
  result.busy = []; result.lastFailure = null; result.pendingPreviews = [];
  return result;
}
function render(data: FrontendState): Element {
  const host = new Element("host");
  renderBooksTab(host as unknown as HTMLElement, data, {} as SpindleFrontendContext, () => {});
  return host;
}
function group(host: Element, title: string): Element {
  const heading = walk(host).find((n) => n.className === "lmb-section-title" && n.textContent === title);
  expect(heading).toBeDefined();
  return heading!.parentElement!;
}

test("Compose identifies staged ghosts and keeps them selectable for manual compression", () => {
  const data = state(), host = new Element("host"), sent: any[] = [];
  data.messages = data.messages.slice(0, 2).map((m, i) => ({ ...m, covered: false, coveredByEntryId: null, excluded: false, staged: i === 0 }));
  setBooksSubtab("compose");
  renderBooksTab(host as any, data, {} as any, (msg) => sent.push(msg));
  const rows = walk(host).filter((node) => node.className.startsWith("lmb-message-row"));
  expect(rows).toHaveLength(2);
  expect(rows[0]!.textContent).toContain("GHOST");
  expect(rows[1]!.textContent).not.toContain("GHOST");
  const box = rows[0]!.children.find((node) => node.tagName === "input")!;
  expect(box.disabled).toBe(false);
  box.checked = true; box.dispatch("change");
  walk(host).find((node) => node.tagName === "button" && node.textContent === "Compress")!.dispatch("click");
  expect(sent).toContainEqual({ type: "create_chapter_range", chatId: data.activeChatId, messageIds: [data.messages[0]!.id] });
});

test("Home distinguishes save failures from generation retries", () => {
  const data = state(), host = new Element("host");
  data.lastFailure = { kind: "chapter", message: "Summary sources changed.", retriedTimes: 0, at: Date.now(), phase: "save" };
  renderHomeTab(host as any, data, {} as any, () => {});
  expect(host.textContent).toContain("Summary generated, but saving failed. Summary sources changed.");
  expect(host.textContent).not.toContain("tried 0x");
});

test("Prompts groups all summary tiers and saves roles and presets for the selected category", () => {
  const host = new Element("host"), sent: any[] = [], data = state();
  setPromptsCategory("chapter");
  renderPromptsPane(host as unknown as HTMLElement, data, {} as SpindleFrontendContext, message => sent.push(message));
  const tabs = () => walk(host).filter((node) => node.className === "lmb-subtabs");
  expect(tabs()[0]!.children.map((node) => node.textContent)).toEqual(["Summaries", "Codex"]);
  expect(tabs()[1]!.children.map((node) => node.textContent)).toEqual([...TIER_NAMES]);
  for (const [index, category] of ["chapter", "arc", "volume", "series", "saga", "library", "universe"].entries()) {
    tabs()[1]!.children[index]!.dispatch("click");
    const role = walk(host).find((node) => node.attributes["aria-label"] === "Send as:")!;
    role.value = "assistant"; role.dispatch("change");
    expect(sent.at(-1)).toMatchObject({ type: "save_profile", profile: { id: data.activeProfile.id, promptRoles: { [category]: "assistant" } } });
    if (index > 2) {
      const picker = walk(host).find((node) => node.tagName === "select" && node !== role)!;
      expect(picker.children[0]!.value).toBe("");
      picker.value = `${category}_default`; picker.dispatch("change");
      expect(sent.at(-1).profile.higherTierPresetKeys).toEqual({ [category]: `${category}_default` });
      walk(host).find((node) => node.tagName === "button" && node.textContent === "Dry run")!.dispatch("click");
      expect(sent.at(-1)).toMatchObject({ type: "dry_run_volume", tier: index + 1 });
    }
  }
  tabs()[0]!.children[1]!.dispatch("click");
  const role = walk(host).find((node) => node.attributes["aria-label"] === "Send as:")!;
  role.value = "user"; role.dispatch("change");
  expect(sent.at(-1).profile.promptRoles).toEqual({ codex: "user" });
});

test("Tuning puts the profile picker above navigation, collapses later tiers, and labels summary recall Constant", () => {
  const host = new Element("host"), data = state();
  setTuningSubtab("settings");
  renderTuningTab(host as unknown as HTMLElement, data, {} as SpindleFrontendContext, () => {});
  expect(host.children[0]!.children[0]!.textContent).toBe("Profile");
  expect(host.children[1]!.className).toBe("lmb-subtabs");
  expect(walk(host).some((node) => node.className === "lmb-profile-strip")).toBe(false);
  const disclosures = walk(host).filter((node) => node.tagName === "details");
  expect(disclosures.map((node) => node.children[0]!.textContent)).toEqual(["Series Binding", "Saga Binding", "Library Binding", "Universe Binding"]);
  expect(disclosures.every((node) => !node.open)).toBe(true);
  disclosures[0]!.open = true; disclosures[0]!.dispatch("toggle");
  renderTuningTab(host as unknown as HTMLElement, data, {} as SpindleFrontendContext, () => {});
  const reopened = walk(host).find((node) => node.tagName === "details")!;
  expect(reopened.open).toBe(true);
  reopened.open = false; reopened.dispatch("toggle");
  const recall = walk(host).find((node) => node.tagName === "fieldset" && node.textContent.includes("Summary recall"))!;
  expect(recall.textContent).toContain("Constant");
  expect(recall.textContent).not.toContain("Always");
});

test("profile icon actions create, rename, and explicitly duplicate the selected profile", async () => {
  const host = new Element("host"), modal = new Element("modal"), data = state(), sent: any[] = [];
  const ctx = { ui: { showModal: () => ({ root: modal, dismiss() { modal.replaceChildren(); } }) } } as unknown as SpindleFrontendContext;
  renderProfilePicker(host as unknown as HTMLElement, data, ctx, message => sent.push(message));
  expect(walk(host).filter(node => node.tagName === "input" && node.value === data.activeProfile.name)).toHaveLength(0);
  const action = (name: string) => walk(host).find(node => node.attributes["aria-label"] === name)!;
  action("Duplicate profile").dispatch("click");
  expect(sent.at(-1)).toMatchObject({ type: "create_profile", copyFromId: data.activeProfile.id, name: `${data.activeProfile.name} copy` });
  for (const name of ["New", "Rename profile"]) {
    action(name).dispatch("click");
    const input = walk(modal).find(node => node.tagName === "input")!;
    expect(input.value).toBe(name === "New" ? "" : data.activeProfile.name);
    input.value = "Changed profile";
    walk(modal).find(node => node.tagName === "button" && node.textContent === "OK")!.dispatch("click");
    await Promise.resolve();
    if (name === "New") {
      expect(sent.at(-1)).toMatchObject({ type: "create_profile", name: "Changed profile" });
      expect(sent.at(-1).copyFromId).toBeUndefined();
    } else expect(sent.at(-1).profile).toEqual({ id: data.activeProfile.id, name: "Changed profile" });
  }
});

test("Codex settings render the activation controls without secure-context crypto", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto")!;
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: {} });
  try {
    const host = new Element("host");
    renderCodexSettings(host as unknown as HTMLElement, state(), makeDefaultProfile("p", "Test"), () => {});
    expect(host.textContent).toContain("Vector + keywords");
    expect(host.textContent).toContain("Enable Codex");
  } finally {
    Object.defineProperty(globalThis, "crypto", descriptor);
  }
});

test("Codex window and lag controls keep distinct data bindings after text extraction", () => {
  const host = new Element("host"), patches: any[] = [];
  renderCodexSettings(host as unknown as HTMLElement, state(), makeDefaultProfile("p", "Test"), patch => patches.push(patch));
  for (const [kind, value] of [["window", "32"], ["lag", "9"]] as const) {
    const container = walk(host).find(node => node.dataset.lesson === `tuning.codex.${kind}`)!;
    const input = walk(container).find(node => node.tagName === "input")!;
    input.value = value; input.dispatch("blur");
    const unit = walk(container).find(node => node.tagName === "select")!;
    unit.value = "tokens"; unit.dispatch("change");
  }
  expect(patches).toEqual([{ codexWindowValue: 32 }, { codexWindowUnit: "tokens" }, { codexLagValue: 9 }, { codexLagUnit: "tokens" }]);
});

test("Codex recall uses the Summary radio control with an extra Vector only mode", () => {
  const host = new Element("host"), patches: any[] = [];
  renderCodexSettings(host as unknown as HTMLElement, state(), makeDefaultProfile("p", "Test"), patch => patches.push(patch));
  const group = walk(host).find(node => node.className === "lmb-activation")!;
  const radios = walk(group).filter(node => node.tagName === "input");
  expect(radios.map(node => node.value)).toEqual(["always", "keywords", "vector", "vector_only"]);
  expect(radios.filter(node => node.checked).map(node => node.value)).toEqual(["keywords"]);
  expect(group.dataset.cacheLocked).toBe("Cache Friendly mode controls this setting.");
  const only = radios[3]!;
  only.checked = true; only.dispatch("change");
  expect(patches).toEqual([{ codexActivationMode: "vector_only" }]);
});

test("Summary recall keeps its three modes", () => {
  const modes: unknown[] = [];
  const group = activationControl("Recall", "always", mode => modes.push(mode)) as unknown as Element;
  expect(walk(group).filter(node => node.tagName === "input").map(node => node.value)).toEqual(["always", "keywords", "vector"]);
});

test("manual summary import visibility follows its status flag rather than English copy", () => {
  const host = new Element("host");
  const panel = createSummaryTransferPanel(host as unknown as HTMLElement, () => {});
  panel.setChat("chat");
  panel.deliver({ id: "import", chatId: "chat", stage: "manual", text: "Translated prompt", manualPromptOnly: true, messageCount: 30 });
  expect(host.textContent).not.toContain("Translated prompt");
  expect(host.textContent).toContain("Which message should coverage end at?");
  panel.deliver({ id: "import", chatId: "chat", stage: "manual", text: "Translated error", manualPromptOnly: false, messageCount: 30 });
  expect(host.textContent).toContain("Translated error");
});

test("Show all reveals rooted and compacted summaries at every tier and retains ghost chapters", () => {
  const host = render(state());
  for (const [index, name] of TIER_NAMES.entries()) {
    const title = index < 3 ? `${name}s` : name;
    const count = index === 0 ? 11 : 10;
    let section = group(host, `${title} (${count})`);
    expect(walk(section).filter((n) => n.tagName === "li")).toHaveLength(6);
    walk(section).find((n) => n.textContent === `Show all ${count} (6 shown)` && n.tagName === "button")!.dispatch("click");
    section = group(host, `${title} (${count})`);
    const rows = walk(section).filter((n) => n.tagName === "li");
    expect(rows).toHaveLength(count);
    expect(rows.filter((n) => n.className.includes("superseded"))).toHaveLength(index === 0 ? 4 : 3);
    expect(rows.filter((n) => n.textContent.includes("root-"))).toHaveLength(2);
  }
  expect(walk(host).some((n) => n.textContent === "GHOST")).toBe(true);
});

test("search finds a compacted chapter and its summary can be opened", () => {
  const host = render(state());
  const input = walk(host).find((n) => n.className === "lmb-search-input")!;
  input.value = "own-1-0"; input.dispatch("input");
  const section = group(host, "Chapters (1 of 11)");
  walk(section).find((n) => n.className === "lmb-entry-row")!.dispatch("click");
  expect(walk(host).find((n) => n.className === "lmb-entry-preview")?.textContent).toBe("Summary own-1-0");
  expect(walk(host).some((n) => n.textContent === "superseded")).toBe(true);
  expect(walk(host).find((n) => n.tagName === "button" && n.textContent === "Regenerate")?.disabled).toBe(true);
});

test("an active rooted chapter can be opened while regeneration remains disabled", () => {
  const host = render(state());
  const input = walk(host).find((n) => n.className === "lmb-search-input")!;
  input.value = "root-1-8"; input.dispatch("input");
  walk(group(host, "Chapters (1 of 11)")).find((n) => n.className === "lmb-entry-row")!.dispatch("click");
  expect(walk(host).find((n) => n.className === "lmb-entry-preview")?.textContent).toBe("Summary root-1-8");
  expect(walk(host).find((n) => n.tagName === "button" && n.textContent === "Regenerate")?.disabled).toBe(true);
  expect(walk(host).find((n) => n.tagName === "button" && n.textContent === "Edit")?.disabled).toBe(false);
});

test("a shelf containing only compacted rooted summaries is still browsable", () => {
  const data = state();
  data.chapters = [entry(1, 0, false, true)]; data.arcs = []; data.volumes = []; data.higherBooks = [];
  expect(walk(group(render(data), "Chapters (1)")).filter((n) => n.tagName === "li")).toHaveLength(1);
});

test("Home counts active rooted summaries and omits compacted summaries and ghosts", () => {
  const host = new Element("host");
  renderHomeTab(host as unknown as HTMLElement, state(), {} as SpindleFrontendContext, () => {});
  const shelf = walk(host).find((n) => n.className === "lmb-tile-label" && n.textContent === "Shelf")!.parentElement!;
  expect(walk(shelf).find((n) => n.className === "lmb-tile-value")?.textContent).toBe("7 · 7 · 7");
  expect(walk(shelf).find((n) => n.className === "lmb-higher-peek")?.textContent).toBe("7 series · 7 saga · 7 library · 7 universe");
  const labels = walk(host).filter((n) => n.className === "lmb-breakdown-label").map((n) => n.textContent);
  expect(labels).toContain("Arcs (7)");
  expect(labels).toContain("Chapters (7)");
});

test("Home offers Cache Friendly mode under Actions, and explains when it is blocked", () => {
  const data = state(), sent: any[] = [];
  data.activeChatId = "cache-chat";
  data.lessons.codex.status = "done";
  const toggle = (host: Element) => walk(host).find(n => n.tagName === "input" && n.type === "checkbox" && n.parentElement?.textContent.includes("Cache Friendly mode"))!;
  const blocked = new Element("host");
  data.lumiCacheAvailable = false;
  renderHomeTab(blocked as any, data, {} as any, msg => sent.push(msg));
  expect(toggle(blocked).disabled).toBe(true);
  expect(blocked.textContent).toContain("LumiCache Extension required for this option. Find Here.");
  expect((walk(blocked).find(n => n.tagName === "a" && n.textContent === "Find Here.") as any)?.href).toBe("https://github.com/AMousePad/LumiCache");
  const ready = new Element("host");
  data.lumiCacheAvailable = true;
  renderHomeTab(ready as any, data, {} as any, msg => sent.push(msg));
  const input = toggle(ready);
  expect(input.disabled).toBe(false);
  input.checked = true; input.dispatch("change");
  expect(sent.filter(msg => msg.type === "cache_friendly_set")).toEqual([{ type: "cache_friendly_set", enabled: true, chatId: "cache-chat" }]);
  const about = new Element("host");
  renderAboutTab(about as any, data, () => {});
  expect(about.textContent).not.toContain("Cache Friendly mode");
});

test("Cache Friendly mode before the Codex course asks what to do with the Codex", () => {
  const data = state(), sent: any[] = [];
  data.activeChatId = "cache-chat";
  data.lumiCacheAvailable = true;
  data.lessons.codex.status = "todo";
  data.lessons.codexSealSkipped = false;
  const host = new Element("host");
  renderHomeTab(host as any, data, {} as any, msg => sent.push(msg));
  const input = walk(host).find(n => n.tagName === "input" && n.type === "checkbox" && n.parentElement?.textContent.includes("Cache Friendly mode"))!;
  expect(input.disabled).toBe(false);
  const body = dom.document.body;
  const choose = (label: string) => {
    body.replaceChildren();
    input.checked = true; input.dispatch("change");
    expect(input.checked).toBe(false);
    const modal = walk(body).find(n => n.className.includes("lmb-cache-codex"))!;
    expect(walk(modal).filter(n => n.tagName === "button").map(n => n.textContent))
      .toEqual(["Cancel", "Run without Codex", "Force Codex on", "Do the tutorial first"]);
    walk(modal).find(n => n.tagName === "button" && n.textContent === label)!.dispatch("click");
    expect(walk(body).some(n => n.className.includes("lmb-cache-codex"))).toBe(false);
  };
  const sets = () => sent.filter(msg => msg.type === "cache_friendly_set");
  choose("Cancel");
  expect(sets()).toEqual([]);
  choose("Run without Codex");
  choose("Force Codex on");
  expect(sets()).toEqual([
    { type: "cache_friendly_set", enabled: true, chatId: "cache-chat", codex: "off" },
    { type: "cache_friendly_set", enabled: true, chatId: "cache-chat", codex: "force" },
  ]);
  documentEvents.length = 0;
  choose("Do the tutorial first");
  expect(sets()).toHaveLength(2);
  expect(documentEvents.map(e => [e.type, e.detail])).toEqual([["lmb-lesson-request", { course: "codex", mode: "lesson" }]]);
});

test("Cache Friendly mode locks only the Codex tiles it owns", () => {
  resetCodexTabLocal();
  const data = state(), host = new Element("host"), sent: any[] = [];
  data.activeChatId = "cache-tiles";
  data.lessons.codex.status = "done";
  data.activeProfile.codexEnabled = true;
  data.settings.cacheFriendly = true;
  renderCodexTab(host as any, data, {} as any, msg => sent.push(msg));
  deliverCodexFiles(data.activeChatId, {}, data.codexRevision);
  renderCodexTab(host as any, data, {} as any, msg => sent.push(msg));
  const tile = (id: string) => walk(host).find(n => n.dataset.lesson === `codex.tile.${id}`)!;
  for (const id of ["timeline", "threads", "relations"]) {
    expect(tile(id).className).toContain("locked");
    tile(id).dispatch("click");
  }
  expect(sent.filter(msg => msg.type === "codex_set_file_state")).toEqual([]);
  expect(tile("timeline").textContent).toContain("Disabled in Cache Friendly Mode");
  expect(dom.document.body.children.at(-1)?.textContent).toBe("Disabled in Cache Friendly Mode");
  for (const subtab of ["relations", "timeline", "threads"]) {
    setCodexSubtab(subtab);
    renderCodexTab(host as any, data, {} as any, msg => sent.push(msg));
    expect(walk(host).find(n => n.className === "lmb-pane")!.textContent).toBe("Disabled in Cache Friendly Mode");
  }
  setCodexSubtab("overview");
  renderCodexTab(host as any, data, {} as any, msg => sent.push(msg));
  expect(tile("lore").className).not.toContain("locked");
  tile("lore").dispatch("click");
  expect(sent.filter(msg => msg.type === "codex_set_file_state").map(msg => msg.file)).toEqual(["world"]);
});

test("locked settings refuse the attempt and pop up why, with its own text for the Codex window", () => {
  const host = new Element("host"), patches: any[] = [];
  renderCodexSettings(host as any, state(), makeDefaultProfile("p", "Test"), patch => patches.push(patch));
  applyCacheLocks(host as any, true);
  const body = dom.document.body;
  const windowGroup = walk(host).find(n => n.dataset.lesson === "tuning.codex.window")!;
  const lagGroup = walk(host).find(n => n.dataset.lesson === "tuning.codex.lag")!;
  for (const group of [windowGroup, lagGroup]) {
    const unit = walk(group).find(n => n.tagName === "select")!;
    unit.dispatch("click");
    expect(unit.lastPrevented).toBe(true);
    expect(body.children.at(-1)?.textContent).toBe("Matches Chapter Summary Window in Cache Friendly Mode.");
  }
  const recall = walk(host).find(n => n.className.startsWith("lmb-activation"))!;
  const radio = walk(recall).find(n => n.tagName === "input")!;
  radio.dispatch("click");
  expect(radio.lastPrevented).toBe(true);
  expect(body.children.at(-1)?.textContent).toBe("Cache Friendly mode controls this setting.");
  expect(patches).toEqual([]);
});

test("prompt replies update a rerendered panel and cannot overwrite a newer chat", async () => {
  const data = state(), sent: any[] = [], host = new Element("host");
  data.activeChatId = "chat-a";
  const renderHome = () => renderHomeTab(host as any, data, {} as any, msg => sent.push(msg));
  const reply = (request: any, model: string) => deliverPromptBreakdown({ ...request,
    result: { source: "fire", d: { entries: [], totalTokens: 0, maxContext: 0, model } } });
  const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  renderHome();
  renderHome();
  expect(sent).toHaveLength(1);
  reply(sent[0], "CURRENT_MODEL");
  await flush();
  expect(host.textContent).toContain("CURRENT_MODEL");
  data.activeChatId = "chat-b";
  renderHome();
  data.activeChatId = "chat-c";
  renderHome();
  reply(sent[2], "NEW_MODEL");
  await flush();
  reply(sent[1], "STALE_MODEL");
  await flush();
  renderHome();
  expect(host.textContent).toContain("NEW_MODEL");
  expect(host.textContent).not.toContain("STALE_MODEL");
});


for (const withChat of [true, false]) test(`Info exposes account diagnostics with${withChat ? "" : "out"} an active chat`, () => {
  setBooksSubtab("continuity");
  const current = state(), sent: any[] = [], host = new Element("div");
  renderBooksTab(host as any, current, {} as any, (msg) => sent.push(msg));
  expect(host.textContent).not.toContain("Private diagnostics");
  if (!withChat) current.activeChatId = null;
  renderAboutTab(host as any, current, (msg) => sent.push(msg));
  expect(host.textContent).toContain("Private diagnostics");
  expect(host.textContent).not.toContain("How it works");
  expect(host.textContent).not.toContain("Where things live");
  expect(host.textContent).toContain("Nyandere catgirl");
  expect(host.textContent).not.toContain("Young nyandere");
  expect(host.textContent).toContain("pseudonymous IDs");
  expect(host.textContent).toContain("Excludes chat/summary text");
  const optOut = walk(host).find((e) => e.tagName === "label" && e.textContent === "Turn off local logs. This isn't recommended")!;
  const toggle = walk(optOut).find((e) => e.tagName === "input")!;
  expect(toggle.checked).toBe(false);
  toggle.checked = true;
  toggle.dispatch("change");
  expect(sent.pop()).toEqual({ type: "save_settings", chatId: current.activeChatId, patch: { localLogsDisabled: true } });
  current.settings.localLogsDisabled = true;
  const disabledHost = new Element("div");
  renderAboutTab(disabledHost as any, current, (msg) => sent.push(msg));
  const disabledToggle = walk(disabledHost).find((e) => e.tagName === "label" && e.textContent === "Turn off local logs. This isn't recommended")!;
  expect(walk(disabledToggle).find((e) => e.tagName === "input")!.checked).toBe(true);
  toggle.checked = false;
  toggle.dispatch("change");
  expect(sent.pop()).toEqual({ type: "save_settings", chatId: current.activeChatId, patch: { localLogsDisabled: false } });
  walk(host).find((e) => e.tagName === "button" && e.textContent === "Export diagnostics")!.dispatch("click");
  walk(host).find((e) => e.tagName === "button" && e.textContent === "Clear diagnostics")!.dispatch("click");
  expect(sent).toEqual([{ type: "diagnostics_export", chatId: current.activeChatId }, { type: "diagnostics_clear", chatId: current.activeChatId }]);
});

function customEntityEditor() {
  resetCodexTabLocal();
  const data = state(), host = new Element("host"), sent: any[] = [];
  data.activeChatId = "custom-fields-chat";
  data.lessons.codex.status = "done";
  data.activeProfile.codexEnabled = true;
  renderCodexTab(host as any, data, {} as any, msg => sent.push(msg));
  deliverCodexFiles(data.activeChatId, { characters: JSON.stringify({ entities: [{
    id: "char:test", name: "Test", age: 20, occupation: "Captain", favorites: ["tea, coffee", "books"],
    lockedFields: ["age"], noInject: true,
  }] }) }, data.codexRevision);
  setCodexSubtab("entities");
  setCodexExpandedEntity("char:test");
  renderCodexTab(host as any, data, {} as any, msg => sent.push(msg));
  walk(host).find(n => n.tagName === "button" && n.textContent === "Edit sheet")!.dispatch("click");
  const input = (label: string) => {
    const wrapper = walk(host).find(n => n.className === "lmb-field" && n.firstElementChild?.textContent.startsWith(label));
    return wrapper?.children.find(n => n.tagName === "input" || n.tagName === "textarea")!;
  };
  const save = () => walk(host).find(n => n.tagName === "button" && n.textContent === "Save")!.dispatch("click");
  return { host, sent, input, save };
}

test("Codex Edit sheet exposes LLM fields and preserves their values and locks on save", () => {
  const { sent, input, save } = customEntityEditor();
  expect(input("age").value).toBe("20");
  input("age").value = "21"; input("age").dispatch("input");
  input("occupation").value = "Admiral"; input("occupation").dispatch("input");
  expect(input("favorites").value).toBe("tea, coffee\nbooks");
  save();
  const saved = sent.find(m => m.type === "codex_write_file");
  expect(JSON.parse(saved.content).entities[0]).toMatchObject({ age: 21, occupation: "Admiral", favorites: ["tea, coffee", "books"], lockedFields: ["age"], noInject: true });
});

test("Codex rejects invalid numeric custom fields without sending a save", () => {
  const { host, sent, input, save } = customEntityEditor();
  input("age").value = "twenty"; input("age").dispatch("input");
  save();
  expect(host.textContent).toContain("age must be a valid number");
  expect(sent.some(m => m.type === "codex_write_file")).toBe(false);
});

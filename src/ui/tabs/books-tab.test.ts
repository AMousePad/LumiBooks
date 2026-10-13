import { afterEach, beforeEach, expect, test } from "bun:test";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { normalizeEntryMeta, TIER_NAMES, type SummaryTier } from "../../shared";
import type { ArcView, FrontendState } from "../../types";
import { buildFixture } from "../lessons/fixture";
import { renderBooksTab, resetBooksTabLocal, setBooksSubtab } from "./books-tab";
import { renderHomeTab, resetHomeTabLocal } from "./home-tab";
import { deliverPromptBreakdown } from "../prompt-breakdown";
import { renderCodexSettings } from "./profile-tab";
import { renderAboutTab } from "./about-tab";
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
  private text = "";
  private listeners = new Map<string, ((event: { preventDefault(): void }) => void)[]>();
  constructor(readonly tagName: string) {}
  get firstElementChild(): Element | null { return this.children[0] ?? null; }
  get textContent(): string { return this.text + this.children.map((c) => c.textContent).join(""); }
  set textContent(value: string) { this.text = value; this.children = []; }
  classList = { add: (name: string) => { this.className += ` ${name}`; }, toggle: (_name: string, _force?: boolean) => {} };
  appendChild(child: Element): Element { child.parentElement = this; this.children.push(child); return child; }
  append(...children: Element[]): void { children.forEach((c) => this.appendChild(c)); }
  replaceChildren(): void { this.children = []; this.text = ""; }
  setAttribute(name: string, value: string): void { this.attributes[name] = value; }
  querySelectorAll(selector: string): Element[] {
    const tags = selector.split(",").map((tag) => tag.trim());
    return this.children.flatMap(walk).filter((node) => tags.includes(node.tagName));
  }
  addEventListener(name: string, listener: (event: { preventDefault(): void }) => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }
  dispatch(name: string): void { this.listeners.get(name)?.forEach((fn) => fn({ preventDefault() {} })); }
}

const walk = (root: Element): Element[] => [root, ...root.children.flatMap(walk)];
const dom = {
  document: {
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
  resetCodexTabLocal();
  resetHomeTabLocal();
  resetBooksTabLocal();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
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

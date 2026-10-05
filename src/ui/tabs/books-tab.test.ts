import { afterEach, beforeEach, expect, test } from "bun:test";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { normalizeEntryMeta, TIER_NAMES, type SummaryTier } from "../../shared";
import type { ArcView, FrontendState } from "../../types";
import { buildFixture } from "../lessons/fixture";
import { renderBooksTab, resetBooksTabLocal } from "./books-tab";
import { renderHomeTab } from "./home-tab";

class Element {
  children: Element[] = [];
  parentElement: Element | null = null;
  className = "";
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  attributes: Record<string, string> = {};
  value = "";
  disabled = false;
  private text = "";
  private listeners = new Map<string, ((event: { preventDefault(): void }) => void)[]>();
  constructor(readonly tagName: string) {}
  get textContent(): string { return this.text + this.children.map((c) => c.textContent).join(""); }
  set textContent(value: string) { this.text = value; this.children = []; }
  classList = { add: (name: string) => { this.className += ` ${name}`; } };
  appendChild(child: Element): Element { child.parentElement = this; this.children.push(child); return child; }
  append(...children: Element[]): void { children.forEach((c) => this.appendChild(c)); }
  replaceChildren(): void { this.children = []; this.text = ""; }
  setAttribute(name: string, value: string): void { this.attributes[name] = value; }
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

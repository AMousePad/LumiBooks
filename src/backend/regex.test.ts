import { afterEach, beforeEach, expect, test } from "bun:test";
import type { RegexScriptDTO, RegexScriptListOptionsDTO } from "lumiverse-spindle-types";
import { applySelectedRegex, invalidateRegexCache, listRegexScriptsPage } from "./regex";

const original = (globalThis as any).spindle;
let scripts: RegexScriptDTO[];
let lists: RegexScriptListOptionsDTO[];
let gets: [string, string][];

function script(index: number): RegexScriptDTO {
  return {
    id: `regex-${index}`, name: `Regex ${index}`, script_id: `script-${index}`,
    find_regex: `SOURCE_${index}`, replace_string: `RESULT_${index}`, flags: "g",
    placement: ["ai_output"], scope: "global", scope_id: null, target: "response",
    min_depth: null, max_depth: null, trim_strings: [], run_on_edit: false,
    substitute_macros: "none", disabled: false, sort_order: index,
    description: "", folder: "", metadata: {}, created_at: 0, updated_at: 0,
  };
}

beforeEach(() => {
  invalidateRegexCache();
  scripts = Array.from({ length: 10_001 }, (_, i) => script(i));
  lists = []; gets = [];
  (globalThis as any).spindle = {
    log: { warn() {} },
    regex_scripts: {
      async list(options: RegexScriptListOptionsDTO = {}) {
        lists.push(options);
        const limit = Math.min(options.limit || 50, 200), offset = options.offset || 0;
        return { data: scripts.slice(offset, offset + limit), total: scripts.length };
      },
      async get(id: string, userId: string) {
        gets.push([id, userId]);
        return structuredClone(scripts.find((s) => s.id === id) ?? null);
      },
    },
  };
});

afterEach(() => {
  invalidateRegexCache();
  (globalThis as any).spindle = original;
});

test("browsing 10,001 regexes fetches only the requested page and returns names and IDs", async () => {
  const first = await listRegexScriptsPage("user-a", 0);
  expect(first.scripts).toHaveLength(50);
  expect(first.scripts[0]).toEqual({ id: "regex-0", name: "Regex 0" });
  expect(first.total).toBe(10_001);
  const last = await listRegexScriptsPage("user-a", 10_000);
  expect(last).toEqual({ offset: 10_000, limit: 50, total: 10_001, scripts: [{ id: "regex-10000", name: "Regex 10000" }] });
  expect(lists).toEqual([{ userId: "user-a", offset: 0, limit: 50 }, { userId: "user-a", offset: 10_000, limit: 50 }]);
  expect(gets).toHaveLength(0);
});

test("page offsets are normalized to nonnegative page positions", async () => {
  for (const offset of [-1, NaN, Infinity, 1.5]) expect((await listRegexScriptsPage("user-a", offset)).offset).toBe(0);
  expect((await listRegexScriptsPage("user-a", 99)).offset).toBe(50);
});

test("search scans the library once, paginates matching names and reuses the slim index for new queries", async () => {
  const progress: { scanned: number; total: number }[] = [];
  const matches = scripts.filter((s) => s.name.toLowerCase().includes("regex 99"));
  const first = await listRegexScriptsPage("user-a", 0, "  REGEX 99  ", (p) => progress.push(p));
  expect(first.total).toBe(matches.length);
  expect(first.scripts).toEqual(matches.slice(0, 50).map(({ id, name }) => ({ id, name })));
  expect(lists).toHaveLength(51);
  expect(lists.every((call) => call.userId === "user-a" && call.limit === 200)).toBe(true);
  expect(progress.at(-1)).toEqual({ scanned: 10_001, total: 10_001 });
  const next = await listRegexScriptsPage("user-a", 50, "regex 99");
  expect(next.scripts).toEqual(matches.slice(50, 100).map(({ id, name }) => ({ id, name })));
  const different = await listRegexScriptsPage("user-a", 0, "regex 10000");
  expect(different.scripts).toEqual([{ id: "regex-10000", name: "Regex 10000" }]);
  expect((await listRegexScriptsPage("user-a", 0, "%_.*")).total).toBe(0);
  expect(lists).toHaveLength(51);
  expect(gets).toHaveLength(0);
});

test("simultaneous queries share one scan and a failing progress listener cannot stop it", async () => {
  const [one, two] = await Promise.all([
    listRegexScriptsPage("user-a", 0, "regex 9999", () => { throw new Error("viewer disconnected"); }),
    listRegexScriptsPage("user-a", 0, "regex 10000"),
  ]);
  expect(one.scripts[0]!.id).toBe("regex-9999");
  expect(two.scripts[0]!.id).toBe("regex-10000");
  expect(lists).toHaveLength(51);
});

test("search caches are user-scoped and changes or explicit refresh rebuild them", async () => {
  scripts = [script(1)];
  expect((await listRegexScriptsPage("user-a", 0, "regex")).total).toBe(1);
  scripts = [script(2), script(3)];
  expect((await listRegexScriptsPage("user-b", 0, "regex")).total).toBe(2);
  expect((await listRegexScriptsPage("user-a", 0, "regex")).total).toBe(1);
  invalidateRegexCache("user-a");
  expect((await listRegexScriptsPage("user-a", 0, "regex")).total).toBe(2);
  scripts = [script(4)];
  expect((await listRegexScriptsPage("user-a", 0, "regex", undefined, true)).scripts[0]!.id).toBe("regex-4");
});

test("a failed later search page is retried instead of caching an incomplete library", async () => {
  const api = (globalThis as any).spindle.regex_scripts, list = api.list;
  api.list = async (options: RegexScriptListOptionsDTO) => {
    if (options.offset) throw new Error("page unavailable");
    return list(options);
  };
  await expect(listRegexScriptsPage("user-a", 0, "regex 9999")).rejects.toThrow("page unavailable");
  api.list = list;
  expect((await listRegexScriptsPage("user-a", 0, "regex 9999")).scripts[0]!.id).toBe("regex-9999");
});

test("invalidation during a search prevents a stale index from being cached or returned", async () => {
  const api = (globalThis as any).spindle.regex_scripts, list = api.list;
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  api.list = async (options: RegexScriptListOptionsDTO) => { await paused; return list(options); };
  const reading = listRegexScriptsPage("user-a", 0, "regex 9999").catch((err) => err);
  invalidateRegexCache("user-a");
  release();
  expect(await reading).toBeInstanceOf(Error);
  expect((await reading).message).toContain("Regex scripts changed");
  api.list = list;
  expect((await listRegexScriptsPage("user-a", 0, "regex 9999")).scripts[0]!.id).toBe("regex-9999");
});

test("short search pages advance by returned rows and an empty page ends a stale total", async () => {
  scripts = scripts.slice(0, 451);
  const api = (globalThis as any).spindle.regex_scripts, list = api.list;
  api.list = async (options: RegexScriptListOptionsDTO) => ({ ...await list({ ...options, limit: 73 }), total: 999 });
  expect((await listRegexScriptsPage("user-a", 0, "regex")).total).toBe(451);
  expect(lists.map((call) => call.offset)).toEqual([0, 73, 146, 219, 292, 365, 438, 451]);
});

test("selected regexes are fetched directly and execute in selection order without listing the library", async () => {
  Object.assign(scripts[9999]!, { find_regex: "first", replace_string: "second" });
  Object.assign(scripts[250]!, { find_regex: "second", replace_string: "third" });
  Object.assign(scripts[50]!, { find_regex: "third", replace_string: "done" });
  const ids = ["regex-9999", "regex-250", "regex-50"];
  expect(await applySelectedRegex("first", ids, "user-a")).toBe("done");
  expect(gets).toEqual(ids.map((id) => [id, "user-a"]));
  expect(lists).toHaveLength(0);
  expect(await applySelectedRegex("first", ids, "user-a")).toBe("done");
  expect(gets).toHaveLength(3);
});

test("selected-script caching is scoped to the user and invalidated by changes", async () => {
  expect(await applySelectedRegex("SOURCE_1", ["regex-1"], "user-a")).toBe("RESULT_1");
  scripts[1]!.replace_string = "NEW";
  expect(await applySelectedRegex("SOURCE_1", ["regex-1"], "user-b")).toBe("NEW");
  expect(await applySelectedRegex("SOURCE_1", ["regex-1"], "user-a")).toBe("RESULT_1");
  invalidateRegexCache("user-a");
  expect(await applySelectedRegex("SOURCE_1", ["regex-1"], "user-a")).toBe("NEW");
});

test("empty selections make no host requests and deleted scripts do not block remaining selections", async () => {
  expect(await applySelectedRegex("SOURCE_1", [], "user-a")).toBe("SOURCE_1");
  expect(gets).toHaveLength(0);
  expect(await applySelectedRegex("SOURCE_1", ["deleted", "regex-1"], "user-a")).toBe("RESULT_1");
  expect(lists).toHaveLength(0);
});

test("listing and selected-script fetch failures propagate so they can be retried", async () => {
  (globalThis as any).spindle.regex_scripts.list = async () => { throw new Error("list unavailable"); };
  await expect(listRegexScriptsPage("user-a", 50)).rejects.toThrow("list unavailable");
  (globalThis as any).spindle.regex_scripts.get = async () => { throw new Error("get unavailable"); };
  await expect(applySelectedRegex("SOURCE_1", ["regex-1"], "user-a")).rejects.toThrow("get unavailable");
});

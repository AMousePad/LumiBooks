import { afterAll, beforeEach, expect, test } from "bun:test";
import { applyContextRelief, DEFAULT_SETTINGS, enterCacheFriendly, leaveCacheFriendly, makeDefaultProfile, normalizeSettings } from "../shared";
import { contextIsFull, relieveContext, rememberContextStats, takeContextStats } from "./context-relief";
import { loadSettings, saveSettings } from "./storage";

const original = (globalThis as any).spindle;
const data = new Map<string, unknown>();
const user = "relief-user";

beforeEach(() => {
  data.clear();
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    userStorage: {
      async exists(p: string) { return data.has(p); },
      async read(p: string) { return JSON.stringify(data.get(p)); },
      async setJson(p: string, value: unknown) { data.set(p, structuredClone(value)); },
    },
  };
});
afterAll(() => { (globalThis as any).spindle = original; });

test("new profiles use the lower lag and larger window", () => {
  const profile = makeDefaultProfile("p", "P");
  expect(profile.lagValue).toBe(40);
  expect(profile.windowValue).toBe(20);
  expect(DEFAULT_SETTINGS.contextRelief).toBe(true);
});

test("a saved profile keeps its own lag and window", () => {
  const settings = normalizeSettings({ profiles: [{ ...makeDefaultProfile("p", "P"), lagValue: 65, windowValue: 18 }], activeProfileId: "p" });
  expect(settings.profiles[0]!.lagValue).toBe(65);
  expect(settings.profiles[0]!.windowValue).toBe(18);
});

test("context counts as full at 90%, and whenever the host clipped history", () => {
  const stats = { enabled: true, maxContext: 1000, fixedTokens: 400, chatHistoryTokensAfter: 400, messagesDropped: 0 };
  expect(contextIsFull(stats, undefined)).toBe(false);
  expect(contextIsFull(stats, 899)).toBe(false);
  expect(contextIsFull(stats, 900)).toBe(true);
  expect(contextIsFull({ ...stats, chatHistoryTokensAfter: 500 }, undefined)).toBe(true);
  expect(contextIsFull({ ...stats, messagesDropped: 1 }, undefined)).toBe(true);
});

test("context stays unknown without host stats or a context size", () => {
  expect(contextIsFull(undefined, 999999)).toBe(false);
  expect(contextIsFull({ enabled: false, maxContext: 1000 }, 999)).toBe(false);
  expect(contextIsFull({ enabled: true, maxContext: 0 }, 999)).toBe(false);
});

test("stats are handed over once per generation", () => {
  rememberContextStats("g", { enabled: true });
  expect(takeContextStats("g")).toEqual({ enabled: true });
  expect(takeContextStats("g")).toBeUndefined();
});

test("relief lowers lag by 30%, summary targets and Codex limits by 33%", () => {
  const base = makeDefaultProfile("p", "P");
  const out = applyContextRelief(base);
  expect(out.lagValue).toBe(28);
  expect(out.arcLagChapters).toBe(5);
  expect(out.arcLagTokens).toBe(1400);
  expect(out.chapterTargetPercent).toBe(10);
  expect(out.chapterTargetTokens).toBe(536);
  expect(out.arcTargetPercent).toBe(13);
  expect(out.volumeTargetPercent).toBe(17);
  expect(out.higherTiers[3].lag).toBe(1);
  expect(out.higherTiers[3].targetPercent).toBe(17);
  expect(out.higherTiers[7].targetTokens).toBe(2010);
  expect(out.codexTokenLimits.world).toBe(6700);
  expect(out.contextReliefApplied).toBe(true);
  expect(out.windowValue).toBe(base.windowValue);
  expect(out.codexLagValue).toBe(base.codexLagValue);
});

test("relief respects setting floors and leaves unlimited Codex categories alone", () => {
  const base = makeDefaultProfile("p", "P");
  const out = applyContextRelief({ ...base, chapterTargetPercent: 2, arcTargetPercent: 5, chapterTargetTokens: 50, lagValue: 0,
    codexTokenLimits: { ...base.codexTokenLimits, world: 0 } });
  expect(out.chapterTargetPercent).toBe(2);
  expect(out.arcTargetPercent).toBe(5);
  expect(out.chapterTargetTokens).toBe(50);
  expect(out.lagValue).toBe(0);
  expect(out.codexTokenLimits.world).toBe(0);
  expect(normalizeSettings({ profiles: [out], activeProfileId: "p" }).profiles[0]).toMatchObject({ contextReliefApplied: true, chapterTargetPercent: 2 });
});

test("relief survives leaving Cache Friendly mode", () => {
  const entered = enterCacheFriendly(makeDefaultProfile("p", "P"));
  const relieved = applyContextRelief(entered);
  expect(relieved.lagValue).toBe(28);
  expect(relieved.codexLagValue).toBe(28);
  expect(leaveCacheFriendly(relieved).lagValue).toBe(28);
});

test("relief fires once per profile, warns, and only touches the active one", async () => {
  const profiles = [makeDefaultProfile("a", "A"), makeDefaultProfile("b", "B")];
  await saveSettings(user, normalizeSettings({ ...DEFAULT_SETTINGS, profiles, activeProfileId: "a" }));
  const warnings: string[] = [];
  const first = await relieveContext(user, (text) => warnings.push(text));
  expect(first!.profiles[0]!.lagValue).toBe(28);
  expect(first!.profiles[1]!.lagValue).toBe(40);
  expect(warnings).toHaveLength(2);
  expect(await relieveContext(user, (text) => warnings.push(text))).toBeNull();
  expect((await loadSettings(user)).profiles[0]!.lagValue).toBe(28);
  expect(warnings).toHaveLength(2);
});

test("relief does nothing when the option is off", async () => {
  await saveSettings(user, normalizeSettings({ ...DEFAULT_SETTINGS, contextRelief: false }));
  expect(await relieveContext(user, () => { throw new Error("should not warn"); })).toBeNull();
});

test("Cache Friendly mode skips the advice about locked features", async () => {
  await saveSettings(user, normalizeSettings({ ...DEFAULT_SETTINGS, cacheFriendly: true, profiles: [enterCacheFriendly(makeDefaultProfile("a", "A"))], activeProfileId: "a" }));
  const warnings: string[] = [];
  await relieveContext(user, (text) => warnings.push(text));
  expect(warnings).toHaveLength(1);
});

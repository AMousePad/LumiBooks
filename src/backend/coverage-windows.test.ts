import { expect, test } from "bun:test";
import { makeDefaultProfile, approximateTokensFromChars } from "../shared";
import { isEligibleForCount, isExcluded, selectUncoveredChapterWindow, type ChatMessage, type CoverageMap } from "./coverage";

const emptyCoverage = (): CoverageMap => ({ coveredBy: new Map(), activeEntries: [], chapters: [], arcs: [], volumes: [] });
const message = (i: number, role = "user", excluded = false) => ({ id: `m${i}`, index_in_chat: i * 2, role, content: "A turn.", metadata: { lmb_excluded: excluded }, extra: {} }) as ChatMessage;

test("a system-only segment before an exclusion cannot become an empty chapter", () => {
  const messages = [message(0, "system"), message(1, "user", true), message(2)];
  const profile = { ...makeDefaultProfile("p"), windowValue: 1, lagValue: 0 };
  expect(selectUncoveredChapterWindow(messages, emptyCoverage(), profile).map((m) => m.id)).toEqual(["m2"]);
});

test("an exclusion closes a short older gap even when the newer tail is below the window", () => {
  const messages = [message(0), message(1, "user", true), message(2)];
  const profile = { ...makeDefaultProfile("p"), windowValue: 12, lagValue: 0 };
  expect(selectUncoveredChapterWindow(messages, emptyCoverage(), profile).map((m) => m.id)).toEqual(["m0"]);
});

test("mixed histories drain eligible gaps without crossing exclusions, reusing coverage, or consuming lag", () => {
  let seed = 82719;
  const random = (max: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
  for (let trial = 0; trial < 500; trial++) {
    const messages = Array.from({ length: 10 + random(70) }, (_, i) => ({
      ...message(i, random(6) === 0 ? "system" : "user", random(7) === 0), content: "x".repeat(1 + random(80)),
    }));
    const profile = { ...makeDefaultProfile("p"), lagValue: random(15), windowValue: 1 + random(15),
      lagUnit: trial % 2 ? "messages" as const : "tokens" as const, windowUnit: trial % 4 < 2 ? "messages" as const : "tokens" as const };
    const coverage = emptyCoverage();
    messages.forEach((m) => { if (random(3) === 0) coverage.coveredBy.set(m.id, "existing"); });
    let boundary = messages.length, reserved = 0;
    while (boundary > 0 && reserved < profile.lagValue) {
      const m = messages[--boundary]!;
      if (isEligibleForCount(m, profile)) reserved += profile.lagUnit === "messages" ? 1 : approximateTokensFromChars(m.content.length);
    }
    const allowed = new Set(messages.slice(0, boundary).map((m) => m.id));
    for (let pass = 0; pass <= messages.length; pass++) {
      const window = selectUncoveredChapterWindow(messages, coverage, profile, true);
      if (!window.length) break;
      expect(window.some((m) => isEligibleForCount(m, profile))).toBe(true);
      const positions = window.map((m) => messages.indexOf(m));
      expect(messages.slice(positions[0], positions.at(-1)! + 1).some(isExcluded)).toBe(false);
      for (const m of window) {
        expect(allowed.has(m.id)).toBe(true);
        expect(coverage.coveredBy.has(m.id)).toBe(false);
        coverage.coveredBy.set(m.id, "filed");
      }
    }
    for (const m of messages) if (allowed.has(m.id) && isEligibleForCount(m, profile)) expect(coverage.coveredBy.has(m.id)).toBe(true);
  }
});

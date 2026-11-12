import { expect, test } from "bun:test";
import { COURSE_BOOKS } from "./content-books";
import { COURSE_CODEX } from "./content-codex";
import { buildFixture } from "./fixture";
import type { LessonStep } from "./lesson-types";

const finaleSteps = (course: typeof COURSE_CODEX) => course.sections.find((s) => s.id === "finale")!.steps;
const target = (step: LessonStep) => step.kind === "nav" ? step.arrive : step.anchor;
const state = (patch: { chat: boolean; codex: boolean }) => {
  const s = buildFixture("filing");
  s.activeChatId = patch.chat ? s.activeChatId : null;
  s.activeProfile = { ...s.activeProfile, codexEnabled: patch.codex };
  return s;
};

test("real steps aimed at Home actions only run when a chat can show them", () => {
  const steps = [...finaleSteps(COURSE_BOOKS), ...finaleSteps(COURSE_CODEX)]
    .filter((step) => step.real && (step.kind === "nav" || step.kind === "do") && target(step)?.startsWith("home.actions."));
  expect(steps.length).toBe(3);
  for (const step of steps) {
    expect(step.requires).toBeFunction();
    expect(step.requires!(state({ chat: false, codex: true }))).toBe(false);
    expect(step.requires!(state({ chat: true, codex: true }))).toBe(true);
  }
});

test("the Update Codex steps are skipped when Codex is off", () => {
  const steps = finaleSteps(COURSE_CODEX).filter((step) => target(step) === "home.actions.updatecodex");
  expect(steps.map((step) => step.kind)).toEqual(["nav", "do"]);
  for (const step of steps) expect(step.requires!(state({ chat: true, codex: false }))).toBe(false);
});

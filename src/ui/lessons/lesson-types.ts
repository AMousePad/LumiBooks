import type { FrontendState } from "../../types";
import type { LessonCourseKey } from "../../shared";
import type { DiagramKind } from "./diagrams";

export type LessonTab = "home" | "books" | "codex" | "tuning";

export interface FixtureSpec {
  /** Named fixture variant from fixture.ts. */
  variant: string;
  /** Applied on top of the variant build. */
  patch?: (s: FrontendState) => void;
}

interface StepBase {
  /** Tab rendered in the demo container. Omit to keep the previous demo. */
  tab?: LessonTab;
  /** Animated concept diagram shown instead of a tab. */
  diagram?: DiagramKind;
  /** Subtab key passed to the tab's exported subtab setter. */
  subtab?: string;
  fixture?: FixtureSpec;
  /** data-lesson id to spotlight after render. */
  anchor?: string;
  /** Second id outlined alongside the spotlight, for prose that points at a
   * control the user is meant to read rather than click. */
  hintAnchor?: string;
  /** Render against the real app state and real send (finale steps). */
  real?: boolean;
  /** Runs before the demo render (pre-expand an entry, pick a view mode). */
  prep?: () => void;
  /** Step only applies to fresh installs (Course 1 automation flip). */
  onlyFreshInstall?: boolean;
}

export interface SayStep extends StepBase {
  kind: "say";
  text: string;
}

export interface DoStep extends StepBase {
  kind: "do";
  text: string;
  /** Message type that must be observed (sandbox or real send) to advance. */
  expect: string;
  /** Progressive focus for multi-stage interactions (open a form, then fill
   * it): the spotlight sits on the deepest anchor of this list that is
   * rendered, so freshly spawned forms light up instead of staying dimmed. */
  path?: string[];
  /** Shown once the action lands, before Next. */
  done?: string;
  /** Spotlight target once done, when the result lives elsewhere on the pane. */
  doneAnchor?: string;
  /** A visible Skip affordance (real steps where no chat qualifies). */
  optional?: boolean;
}

export interface NavStep extends StepBase {
  kind: "nav";
  /** Instruction shown unchanged until the user arrives. */
  text: string;
  /** Anchors to click, in order. The spotlight sits on the last one already
   * rendered, so multi-hop navs (a tab, then its subtab) guide one click at
   * a time. */
  path: string[];
  /** Anchor that must exist in the pane for the step to complete. */
  arrive: string;
  /** Shown with Next when the destination is already open at render time. */
  done?: string;
  /** A visible Skip affordance (real navs that can dead-end without a chat). */
  optional?: boolean;
}

export interface QuizOption {
  text: string;
  correct?: boolean;
}

export interface QuizStep extends StepBase {
  kind: "quiz";
  /** Stable question id (b1..b20, c1..c16, r1..r3). */
  id: string;
  scored: boolean;
  text: string;
  /** Static toast or failure-card replica shown inside the card. */
  exhibit?: string;
  exhibitTone?: "error" | "warn" | "info";
  /** Compact live-readout chip, e.g. "Window · 40 messages". Badged example. */
  chip?: string;
  options: QuizOption[];
  /** One line shown after answering. */
  why: string;
}

export type LessonStep = SayStep | DoStep | QuizStep | NavStep;

export interface LessonSection {
  id: string;
  title: string;
  steps: LessonStep[];
}

export interface LessonCourseDef {
  key: LessonCourseKey;
  title: string;
  sections: LessonSection[];
}

export function scoredQuestions(course: LessonCourseDef): QuizStep[] {
  const out: QuizStep[] = [];
  for (const s of course.sections) {
    for (const st of s.steps) {
      if (st.kind === "quiz" && st.scored) out.push(st);
    }
  }
  return out;
}

export function allQuestionIds(course: LessonCourseDef, sectionIdx?: number): string[] {
  const sections = sectionIdx === undefined ? course.sections : [course.sections[sectionIdx]].filter(Boolean);
  const out: string[] = [];
  for (const s of sections) {
    for (const st of s!.steps) {
      if (st.kind === "quiz") out.push(st.id);
    }
  }
  return out;
}

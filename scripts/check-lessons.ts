/**
 * Lesson content checks, run with: bun run check:lessons
 * Fails the build when a lesson anchor, fixture premise, or error exhibit
 * drifts from the source it points at. No DOM required.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SAMPLER_DEFAULTS, makeDefaultProfile } from "../src/shared";
import { COURSE_BOOKS } from "../src/ui/lessons/content-books";
import { COURSE_CODEX } from "../src/ui/lessons/content-codex";
import { FIXTURE_VARIANTS, buildFixture } from "../src/ui/lessons/fixture";
import { scoredQuestions } from "../src/ui/lessons/lesson-types";
import type { LessonCourseDef, QuizStep } from "../src/ui/lessons/lesson-types";

let failures = 0;
function fail(msg: string): void {
  failures++;
  console.error(`  ✗ ${msg}`);
}
function ok(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

const SRC = join(import.meta.dir, "..", "src");
const files = walk(SRC);
const sourceText = files.map((f) => readFileSync(f, "utf8")).join("\n");

/* ------------------------------------------------------------- anchors */

/** Walk each lessonMark(...) call to its matching close paren and take the
 * last id-shaped string literal, the anchor is always the final argument. */
const marks: string[] = [];
let idx = 0;
while ((idx = sourceText.indexOf("lessonMark(", idx)) !== -1) {
  let depth = 0;
  let end = -1;
  for (let i = idx + "lessonMark".length; i < sourceText.length; i++) {
    const ch = sourceText[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) break;
  const call = sourceText.slice(idx, end + 1);
  const strRe = /[`"]([\w.${}-]+)[`"]/g;
  let last: string | null = null;
  let sm: RegExpExecArray | null;
  while ((sm = strRe.exec(call)) !== null) last = sm[1]!;
  if (last) marks.push(last);
  idx = end;
}

function anchorExists(anchor: string): boolean {
  if (marks.includes(anchor)) return true;
  // Template-literal marks (e.g. codex.tile.${def.id}) match by prefix.
  for (const mark of marks) {
    const hole = mark.indexOf("${");
    if (hole > 0 && anchor.startsWith(mark.slice(0, hole))) return true;
  }
  return false;
}

const courses: LessonCourseDef[] = [COURSE_BOOKS, COURSE_CODEX];
console.log("anchors:");
const usedAnchors = new Set<string>();
for (const course of courses) {
  for (const section of course.sections) {
    for (const step of section.steps) {
      if (step.anchor) usedAnchors.add(step.anchor);
      if (step.kind === "do") {
        if (step.doneAnchor) usedAnchors.add(step.doneAnchor);
        for (const p of step.path ?? []) usedAnchors.add(p);
      }
      if (step.kind === "nav") {
        for (const p of step.path) usedAnchors.add(p);
        usedAnchors.add(step.arrive);
      }
    }
  }
}
for (const a of [...usedAnchors].sort()) {
  if (anchorExists(a)) ok(a);
  else fail(`anchor "${a}" has no lessonMark in src`);
}

/* ------------------------------------------------------------ nav shape */

/** A nav hands control to the user, so the step that follows must pin its
 * own tab (or be another nav) or the pane it renders would depend on where
 * the user wandered. */
console.log("navs:");
for (const course of courses) {
  for (const section of course.sections) {
    section.steps.forEach((step, i) => {
      if (step.kind !== "nav") return;
      if (step.path.length === 0) fail(`${course.key}/${section.id}: nav with empty path`);
      if (!step.arrive) fail(`${course.key}/${section.id}: nav with no arrive anchor`);
      const next = section.steps[i + 1];
      if (next && next.kind !== "nav" && !next.tab) {
        fail(`${course.key}/${section.id}: step after nav (arrive ${step.arrive}) does not pin a tab`);
      }
    });
  }
}
ok("every nav has a path, an arrival anchor, and a tab-pinned successor");

/* ------------------------------------------------------------ questions */

console.log("questions:");
const seenIds = new Set<string>();
for (const course of courses) {
  for (const section of course.sections) {
    for (const step of section.steps) {
      if (step.kind !== "quiz") continue;
      const q = step as QuizStep;
      if (seenIds.has(q.id)) fail(`duplicate question id ${q.id}`);
      seenIds.add(q.id);
      const correct = q.options.filter((o) => o.correct).length;
      if (correct !== 1) fail(`${q.id}: ${correct} correct options, expected 1`);
      if (q.options.length < 3) fail(`${q.id}: only ${q.options.length} options`);
      if (!q.why.trim()) fail(`${q.id}: empty why`);
      if (step.fixture && !FIXTURE_VARIANTS.includes(step.fixture.variant)) {
        fail(`${q.id}: unknown fixture variant "${step.fixture.variant}"`);
      }
    }
    for (const step of section.steps) {
      if (step.kind === "quiz") continue;
      if (step.fixture && !FIXTURE_VARIANTS.includes(step.fixture.variant)) {
        fail(`${course.key}/${section.id}: unknown fixture variant "${step.fixture.variant}"`);
      }
    }
  }
}
const booksScored = scoredQuestions(COURSE_BOOKS).length;
const codexScored = scoredQuestions(COURSE_CODEX).length;
if (booksScored === 13) ok(`books: ${booksScored} scored questions`);
else fail(`books: expected 13 scored questions, found ${booksScored}`);
// The codex course is a quick walkthrough: 10 questions is the hard cap.
if (codexScored === 8) ok(`codex: ${codexScored} scored questions`);
else fail(`codex: expected 8 scored questions, found ${codexScored}`);

/* ------------------------------------------------------------- exhibits */

/** Each exhibit must contain a fragment, and that fragment must still exist
 * in the live source, so a reworded error fails here instead of teaching a
 * message the app no longer shows. */
const EXHIBIT_FRAGMENTS = [
  "the provider may be slow or unreachable",
  "Last chapter attempt failed",
  "These messages are bound into",
  "The model didn't return valid JSON",
  "the relations table is enabled, move these into relations.json rows",
  "is not a valid entity ref",
  "dangling reference",
  "narrated instead of calling tools",
];

console.log("exhibits:");
for (const frag of EXHIBIT_FRAGMENTS) {
  if (sourceText.includes(frag)) ok(`fragment in source: "${frag.slice(0, 48)}"`);
  else fail(`fragment missing from source: "${frag}"`);
}
for (const course of courses) {
  for (const section of course.sections) {
    for (const step of section.steps) {
      if (step.kind !== "quiz" || !step.exhibit) continue;
      const hit = EXHIBIT_FRAGMENTS.some((f) => step.exhibit!.includes(f));
      if (hit) ok(`${step.id}: exhibit anchored to a known fragment`);
      else fail(`${step.id}: exhibit matches no known source fragment`);
    }
  }
}

/* -------------------------------------------------------------- fixtures */

console.log("fixtures:");
const pills = buildFixture("pills");
if (pills.coverage.lagSatisfied && !pills.coverage.windowAvailable && pills.coverage.uncoveredMessages === 70) {
  ok("pills: 70 uncovered, lag ready, window building (B3 premise)");
} else {
  fail(
    `pills: uncovered=${pills.coverage.uncoveredMessages} lag=${pills.coverage.lagSatisfied} window=${pills.coverage.windowAvailable}, B3 premise broken`,
  );
}
const filing = buildFixture("filing");
if (filing.coverage.lagSatisfied && filing.coverage.windowAvailable && filing.backlogChapters >= 2) {
  ok(`filing: ready with backlog ${filing.backlogChapters}`);
} else {
  fail(`filing: lag=${filing.coverage.lagSatisfied} window=${filing.coverage.windowAvailable} backlog=${filing.backlogChapters}`);
}
const desk = buildFixture("desk");
if (desk.busy.length > 0 && desk.lastFailure) ok("desk: busy row and failure card present");
else fail("desk: expected a busy row and a failure record");
const codex = buildFixture("codex");
if (codex.codexExists && codex.lessons.codex.status === "done") ok("codex: exists and unlocked");
else fail("codex: expected codexExists and unlocked lessons");
const stale = buildFixture("codex-stale");
if (stale.codexFileStates["relations"] === "frozen" && stale.codexStaleFiles.includes("relations")) {
  ok("codex-stale: relations frozen and stale (C4 premise)");
} else {
  fail("codex-stale: C4 premise broken");
}
const noinject = buildFixture("codex-noinject");
if (noinject.codexFileStates["relations"] === "noInject") ok("codex-noinject: relations noInject");
else fail("codex-noinject: premise broken");

/* ------------------------------------------------------------- defaults */

/** Numbers the lesson texts state as facts; a default change must trip here. */
console.log("defaults taught by lessons:");
const prof = makeDefaultProfile("check", "check");
const taught: [string, number, number][] = [
  ["chapter lag 65", prof.lagValue, 65],
  ["chapter window 18", prof.windowValue, 18],
  ["chapter ratio 15%", prof.chapterTargetPercent, 15],
  ["codex lag 6", prof.codexLagValue, 6],
  ["codex window 20", prof.codexWindowValue, 20],
  ["chapter context 7", prof.previousMemoriesCount, 7],
  ["summary temperature 0.4", SAMPLER_DEFAULTS.temperature, 0.4],
];
for (const [label, actual, expected] of taught) {
  if (actual === expected) ok(label);
  else fail(`${label}: default is now ${actual}, update the lesson texts and this table`);
}

/* --------------------------------------------------------------- result */

if (failures > 0) {
  console.error(`\n${failures} lesson check${failures === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall lesson checks passed");

import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { LessonAnswer, LessonCourseKey, LessonCourseState, LessonGrade } from "../../shared";
import { lessonGradeForWrong } from "../../shared";
import type { DoStep, LessonCourseDef, LessonSection, LessonStep, NavStep, QuizStep } from "./lesson-types";
import { allQuestionIds, scoredQuestions } from "./lesson-types";
import { COURSE_BOOKS } from "./content-books";
import { COURSE_CODEX } from "./content-codex";
import { FIXTURE_CHAT_ID, applyFiledChapter, buildFixture, codexFixtureFiles } from "./fixture";
import { lessonMark, makeButton, showToast } from "../components";
import { APP_TABS, type AppTabKey } from "../tab-meta";
import { renderHomeTab, resetHomeTabLocal } from "../tabs/home-tab";
import { renderBooksTab, resetBooksTabLocal } from "../tabs/books-tab";
import { deliverCodexFiles, renderCodexTab, resetCodexTabLocal } from "../tabs/codex-tab";
import { renderTuningTab } from "../tabs/tuning-tab";
import { renderAboutTab } from "../tabs/about-tab";
import { memoriaSprite } from "./seal";
import { renderDiploma, renderRegister } from "./diploma";
import { renderDiagram } from "./diagrams";

const EXAM_SIZE = 10;
const EXAM_PASS_MAX_WRONG = 1;

export interface LessonEngineDeps {
  ctx: SpindleFrontendContext;
  send: (m: FrontendToBackend) => void;
  getState: () => FrontendState | null;
  /** App recomputes viewMode and re-renders. */
  onModeChange: () => void;
  /** Progress saves are silent on the backend (a push would re-render over
   * the stage), so the app's local lessons copy is patched through this or
   * Resume and the seal read stale positions. */
  applyLessons: (course: LessonCourseKey, patch: Partial<LessonCourseState>) => void;
}

export interface LessonEngine {
  isActive(): boolean;
  start(
    course: LessonCourseKey,
    opts?: { mode?: "lesson" | "exam" | "diploma"; section?: number; fresh?: boolean },
  ): void;
  mount(host: HTMLElement): void;
  onHostState(): void;
  exit(): void;
}

/** Tabs the demo pane can show. "stuff" exists only for strip wandering. */
type DemoTab = AppTabKey;

interface ActiveLesson {
  key: LessonCourseKey;
  course: LessonCourseDef;
  mode: "lesson" | "exam";
  main: LessonSection[];
  finale: LessonSection | null;
  sIdx: number;
  tIdx: number;
  fIdx: number;
  phase: "steps" | "register" | "finale" | "diploma";
  answers: Record<string, LessonAnswer>;
  fixture: FrontendState | null;
  /** Step that built the current fixture. Re-renders of the same step reuse
   * it, otherwise a do-script's mutations vanish on its own re-render. */
  fixtureStep: LessonStep | null;
  codexFiles: Record<string, string>;
  /** Do/nav step lifecycle. Scripts fire from idle only, so repeated clicks
   * during the animation cannot double-run them. */
  doPhase: "idle" | "running" | "done";
  /** Tab the demo pane last rendered, so tab-less steps keep it. */
  demoTab: DemoTab | null;
  /** Mid-step tab override from the demo strip, cleared on every new step. */
  navTab: DemoTab | null;
  examSet: QuizStep[];
  examIdx: number;
  signedName: string | null;
  wrong: number;
  grade: LessonGrade;
  total: number;
  completedAt: number;
  viewOnly: boolean;
}

export function createLessonEngine(deps: LessonEngineDeps): LessonEngine {
  let active: ActiveLesson | null = null;
  let host: HTMLElement | null = null;
  let stage: HTMLElement | null = null;
  let demoWrap: HTMLElement | null = null;
  let demoStrip: HTMLElement | null = null;
  let demoInner: HTMLElement | null = null;
  let overlay: HTMLElement[] = [];
  let ring: HTMLElement | null = null;
  let spotTag: HTMLElement | null = null;
  let sheetBody: HTMLElement | null = null;
  let railEl: HTMLElement | null = null;
  let headLabel: HTMLElement | null = null;
  let resizeObs: ResizeObserver | null = null;
  /** Watches the rendered pane: async reflows (web fonts landing) shift the
   * layout after the ring is measured, and the ring must follow. */
  let paneObs: ResizeObserver | null = null;
  let patchTimer: ReturnType<typeof setTimeout> | null = null;
  let anchorRaf = 0;
  /** Last anchor the ring actually landed on: a mid-step focus change (chip
   * to spawned form) scrolls into view even on scroll-less re-anchors. */
  let lastSpotAnchor: string | null = null;

  /* ------------------------------------------------------------ helpers */

  function courseDef(key: LessonCourseKey): LessonCourseDef {
    return key === "books" ? COURSE_BOOKS : COURSE_CODEX;
  }

  function currentStep(): LessonStep | null {
    if (!active) return null;
    if (active.mode === "exam" && active.phase === "steps") {
      return active.examSet[active.examIdx] ?? null;
    }
    if (active.phase === "steps") return active.main[active.sIdx]?.steps[active.tIdx] ?? null;
    if (active.phase === "finale") return active.finale?.steps[active.fIdx] ?? null;
    return null;
  }

  function schedulePatch(): void {
    if (!active || active.viewOnly || active.mode === "exam" || active.phase !== "steps") return;
    if (patchTimer) clearTimeout(patchTimer);
    patchTimer = setTimeout(flushPatch, 400);
  }

  /** Only the teaching phase writes in_progress saves, and a graduate's
   * retake never writes status at all: the diploma stands however it ends. */
  function flushPatch(): void {
    if (patchTimer) {
      clearTimeout(patchTimer);
      patchTimer = null;
    }
    if (!active || active.viewOnly || active.mode === "exam" || active.phase !== "steps") return;
    const saved = deps.getState()?.lessons?.[active.key];
    const patch: Partial<LessonCourseState> = {
      ...(saved?.status === "done" ? {} : { status: "in_progress" }),
      section: active.sIdx,
      step: active.tIdx,
      answers: { ...active.answers },
      startedAt: saved?.startedAt ?? Date.now(),
    };
    deps.send({ type: "lesson_patch", course: active.key, patch });
    deps.applyLessons(active.key, patch);
  }

  /** Deepest anchor of a focus path that is currently rendered, so the
   * spotlight follows an interaction as it spawns new UI. */
  function deepestPresent(path: string[]): string | undefined {
    for (let i = path.length - 1; i >= 0; i--) {
      const a = path[i]!;
      if (demoWrap?.querySelector(`[data-lesson="${a}"]`)) return a;
    }
    return path[0];
  }

  /** The step's live spotlight target: completed do-steps pan to the result,
   * nav and do paths guide the deepest hop that is already rendered. */
  function anchorFor(step: LessonStep | null): string | undefined {
    if (!step) return undefined;
    if (step.kind === "nav") {
      if (active?.doPhase === "done") return undefined;
      return deepestPresent(step.path);
    }
    if (step.kind === "do") {
      if (active?.doPhase === "done") return step.doneAnchor ?? step.anchor;
      if (step.path) return deepestPresent(step.path) ?? step.anchor;
      return step.anchor;
    }
    return step.anchor;
  }

  /* --------------------------------------------------------------- nav */

  function navArrived(step: NavStep): boolean {
    return !!demoWrap?.querySelector(`[data-lesson="${step.arrive}"]`);
  }

  /**
   * Completes a nav step once its destination is on screen. A click-driven
   * arrival advances on its own after a beat; a destination that was already
   * open when the step rendered keeps the sheet up with a Next button, so
   * walking Back over a nav can never bounce forward again.
   */
  function checkNavArrival(step: NavStep, fromClick: boolean): void {
    if (!active || active.doPhase !== "idle") return;
    if (!navArrived(step)) return;
    active.doPhase = "done";
    demoWrap?.classList.remove("lmb-demo-funnel");
    hideSpotlight();
    renderSheet(step);
    if (fromClick) {
      setTimeout(() => {
        if (active && currentStep() === step) advance();
      }, 350);
    }
  }

  /** Deterministic option order per question so re-renders never reshuffle. */
  function shuffled(q: QuizStep): { text: string; correct: boolean }[] {
    let seed = 0;
    for (let i = 0; i < q.id.length; i++) seed = (seed * 31 + q.id.charCodeAt(i)) >>> 0;
    const arr = q.options.map((o) => ({ text: o.text, correct: !!o.correct }));
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const j = seed % (i + 1);
      const tmp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = tmp;
    }
    return arr;
  }

  /* ------------------------------------------------------------- public */

  function isActive(): boolean {
    return active !== null;
  }

  function start(
    courseKey: LessonCourseKey,
    opts?: { mode?: "lesson" | "exam" | "diploma"; section?: number; fresh?: boolean },
  ): void {
    const course = courseDef(courseKey);
    const main = course.sections.filter((s) => s.id !== "finale");
    const finale = course.sections.find((s) => s.id === "finale") ?? null;
    const saved = deps.getState()?.lessons?.[courseKey];
    const base: ActiveLesson = {
      key: courseKey,
      course,
      mode: opts?.mode === "exam" ? "exam" : "lesson",
      main,
      finale,
      sIdx: 0,
      tIdx: 0,
      fIdx: 0,
      phase: "steps",
      answers: { ...(saved?.answers ?? {}) },
      fixture: null,
      fixtureStep: null,
      codexFiles: codexFixtureFiles(),
      doPhase: "idle",
      demoTab: null,
      navTab: null,
      examSet: [],
      examIdx: 0,
      signedName: saved?.signedName ?? null,
      wrong: saved?.lastWrong ?? 0,
      grade: saved?.grade ?? "apprentice",
      total: scoredQuestions(course).length,
      completedAt: saved?.completedAt ?? Date.now(),
      viewOnly: false,
    };
    if (opts?.mode === "diploma") {
      base.viewOnly = true;
      base.phase = "diploma";
    } else if (opts?.mode === "exam") {
      const pool = scoredQuestions(course);
      const picked: QuizStep[] = [];
      const used = new Set<number>();
      while (picked.length < Math.min(EXAM_SIZE, pool.length)) {
        const i = Math.floor(Math.random() * pool.length);
        if (used.has(i)) continue;
        used.add(i);
        picked.push(pool[i]!);
      }
      base.examSet = picked;
      base.answers = {};
    } else {
      // Retakes: the backend reset may still be in flight, so the saved
      // answers we seeded from state can be stale. Clear locally too.
      if (opts?.fresh) base.answers = {};
      if (typeof opts?.section === "number") {
        base.sIdx = Math.min(Math.max(0, opts.section), main.length - 1);
        for (const id of allQuestionIds(course, base.sIdx)) delete base.answers[id];
      } else if (saved?.status === "in_progress") {
        if (saved.section >= main.length) {
          // They left during the register screen, resume there, not in the
          // last section.
          base.phase = "register";
        } else {
          base.sIdx = saved.section;
          base.tIdx = Math.min(saved.step, (main[saved.section]?.steps.length ?? 1) - 1);
        }
      }
    }
    active = base;
    schedulePatch();
    deps.onModeChange();
  }

  function exit(): void {
    flushPatch();
    if (patchTimer) clearTimeout(patchTimer);
    resizeObs?.disconnect();
    resizeObs = null;
    paneObs?.disconnect();
    paneObs = null;
    active = null;
    stage = null;
    demoWrap = null;
    demoStrip = null;
    demoInner = null;
    sheetBody = null;
    railEl = null;
    headLabel = null;
    overlay = [];
    ring = null;
    // The demo polluted per-tab module state (chat keyed caches, expansion
    // sets). Reset so the real chat re-reads clean.
    resetHomeTabLocal();
    resetBooksTabLocal();
    resetCodexTabLocal();
    deps.onModeChange();
  }

  function mount(target: HTMLElement): void {
    if (!active) return;
    if (stage && stage.isConnected && host === target) return;
    host = target;
    buildStage();
    renderStep();
  }

  function onHostState(): void {
    if (!active || !stage) return;
    const step = currentStep();
    if (step && step.real) {
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
      // A real-state push can reveal a nav destination (e.g. the profile
      // save landing turns the Update codex button on).
      if (step.kind === "nav") checkNavArrival(step, true);
    }
  }

  /* -------------------------------------------------------------- stage */

  function buildStage(): void {
    if (!host || !active) return;
    host.replaceChildren();
    stage = document.createElement("div");
    stage.className = "lmb-lesson-stage";
    stage.setAttribute("role", "dialog");
    stage.setAttribute("aria-label", active.course.title);

    const head = document.createElement("div");
    head.className = "lmb-lesson-head";
    const title = document.createElement("span");
    title.className = "lmb-lesson-title";
    title.textContent = active.mode === "exam" ? `${active.course.title} · Exam` : active.course.title;
    headLabel = document.createElement("span");
    headLabel.className = "lmb-lesson-headlabel";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "lmb-lesson-close";
    close.textContent = "✕";
    close.title = active.mode === "exam"
      ? "Leave the exam, an unfinished exam is not saved"
      : deps.getState()?.lessons?.[active.key]?.status === "done"
        ? "Leave anytime, your diploma and previous grade stand"
        : "Leave the lesson, progress is saved";
    close.setAttribute("aria-label", "Leave the lesson");
    close.addEventListener("click", exit);
    head.append(title, headLabel, close);

    railEl = document.createElement("div");
    railEl.className = "lmb-lesson-rail";

    demoWrap = document.createElement("div");
    demoWrap.className = "lmb-lesson-demo";
    demoStrip = document.createElement("div");
    demoStrip.className = "lmb-lesson-demostrip";
    demoStrip.style.display = "none";
    demoWrap.appendChild(demoStrip);
    demoInner = document.createElement("div");
    demoInner.className = "lmb-lesson-demo-inner";
    demoWrap.appendChild(demoInner);
    for (let i = 0; i < 4; i++) {
      const p = document.createElement("div");
      p.className = "lmb-spot-panel";
      p.style.display = "none";
      demoWrap.appendChild(p);
      overlay.push(p);
    }
    ring = document.createElement("div");
    ring.className = "lmb-spot-ring";
    ring.style.display = "none";
    demoWrap.appendChild(ring);
    spotTag = document.createElement("div");
    spotTag.className = "lmb-spot-tag";
    spotTag.style.display = "none";
    demoWrap.appendChild(spotTag);
    // Nav steps advance off the user's own clicks: after any click in the
    // demo (strip or pane), wait for the pane's own handlers to re-render,
    // then re-aim the spotlight and test for arrival.
    demoWrap.addEventListener("click", () => {
      const step = currentStep();
      if (!active || !step || step.kind !== "nav" || active.doPhase !== "idle") return;
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!active || currentStep() !== step) return;
          scheduleAnchor(anchorFor(step), false);
          checkNavArrival(step, true);
        }, 40);
      });
    });

    const sheet = document.createElement("div");
    sheet.className = "lmb-lesson-sheet";
    const grab = document.createElement("button");
    grab.type = "button";
    grab.className = "lmb-lesson-grab";
    grab.setAttribute("aria-label", "Collapse the dialogue");
    grab.addEventListener("click", () => sheet.classList.toggle("collapsed"));
    sheetBody = document.createElement("div");
    sheetBody.className = "lmb-lesson-sheet-body";
    sheet.append(grab, sheetBody);

    stage.append(head, railEl, demoWrap, sheet);
    host.appendChild(stage);

    resizeObs?.disconnect();
    resizeObs = new ResizeObserver(() => scheduleAnchor(anchorFor(currentStep()), false));
    resizeObs.observe(demoWrap);
    demoInner.addEventListener("scroll", () => scheduleAnchor(anchorFor(currentStep()), false), { passive: true });
  }

  function renderRail(): void {
    if (!railEl || !active) return;
    railEl.replaceChildren();
    if (active.mode === "exam") {
      const label = document.createElement("span");
      label.className = "lmb-lesson-headlabel";
      label.textContent = active.phase === "steps" ? `Question ${active.examIdx + 1} of ${active.examSet.length}` : "";
      railEl.appendChild(label);
      return;
    }
    const nodes = active.main.length + (active.finale ? 1 : 0);
    for (let i = 0; i < nodes; i++) {
      const node = document.createElement("span");
      const isFinale = i >= active.main.length;
      const done = active.phase !== "steps" ? (isFinale ? active.phase === "diploma" : true) : i < active.sIdx;
      const current = active.phase === "steps" ? i === active.sIdx : active.phase === "finale" && isFinale;
      node.className = `lmb-rail-node${done ? " done" : ""}${current ? " current" : ""}`;
      const sec = isFinale ? active.finale! : active.main[i]!;
      node.title = sec.title;
      railEl.appendChild(node);
    }
    if (headLabel) {
      if (active.phase === "steps") {
        const sec = active.main[active.sIdx];
        headLabel.textContent = sec ? `${roman(active.sIdx + 1)} · ${sec.title}` : "";
      } else if (active.phase === "finale") {
        headLabel.textContent = active.finale?.title ?? "";
      } else {
        headLabel.textContent = "";
      }
    }
  }

  function roman(n: number): string {
    const table: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    let v = n;
    for (const [num, sym] of table) {
      while (v >= num) {
        out += sym;
        v -= num;
      }
    }
    return out;
  }

  /* --------------------------------------------------------------- demo */

  function fixtureFor(step: LessonStep): FrontendState | null {
    if (!active) return null;
    if (step.fixture && active.fixtureStep !== step) {
      const s = buildFixture(step.fixture.variant);
      step.fixture.patch?.(s);
      active.fixture = s;
      active.fixtureStep = step;
    }
    return active.fixture;
  }

  function makeSandboxSend(step: LessonStep): (m: FrontendToBackend) => void {
    return (m: FrontendToBackend) => {
      if (!active) return;
      if (m.type === "codex_set_file_state") {
        // Tile cycling works on every step, so the switches always feel real.
        const fx = active.fixture;
        if (fx) {
          const states = { ...fx.codexFileStates };
          if (m.state === "on") delete states[m.file];
          else states[m.file] = m.state;
          fx.codexFileStates = states;
          if (m.state !== "frozen") fx.codexStaleFiles = fx.codexStaleFiles.filter((f) => f !== m.file);
        }
        if (step.kind === "do" && step.expect === "codex_set_file_state" && active.doPhase === "idle") {
          markDoDone(step);
        }
        scheduleDemoRerender(step);
        return;
      }
      if (step.kind === "do" && m.type === step.expect && active.doPhase === "idle") {
        runDoScript(step, m);
        return;
      }
      if (m.type === "codex_read") {
        deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles);
        scheduleDemoRerender(step);
        return;
      }
      if (m.type === "codex_write_file") {
        // Free-play edits in the sandbox still land, so Save buttons work.
        active.codexFiles = { ...active.codexFiles, [m.file]: m.content };
        deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, m.file, m.seq);
        showToast("success", `Memoria saved ${m.file}.json`);
        scheduleDemoRerender(step);
        return;
      }
      if (m.type === "edit_preview" || m.type === "watch_stream" || m.type === "lesson_patch") return;
      shimmer();
    };
  }

  function runDoScript(step: DoStep, m: FrontendToBackend): void {
    if (!active) return;
    if (m.type === "create_chapter") {
      const fx = active.fixture;
      if (!fx) {
        markDoDone(step);
        return;
      }
      active.doPhase = "running";
      fx.busy = [{ kind: "chapter", chatId: FIXTURE_CHAT_ID, label: "Memoria is filing a chapter (1s)", startedAt: Date.now() }];
      scheduleDemoRerender(step);
      showToast("info", "Memoria opens a fresh page for you, nya");
      // Completion re-reads the live fixture instead of trusting the captured
      // object, so a re-render between click and finish can't strand the step.
      setTimeout(() => {
        if (!active || currentStep() !== step) return;
        const cur = active.fixture;
        if (cur) {
          cur.busy = [];
          applyFiledChapter(cur);
        }
        showToast("success", "Memoria slid the chapter onto your shelf, nyaa~");
        markDoDone(step);
        scheduleDemoRerender(step);
      }, 1400);
      return;
    }
    if (m.type === "codex_write_file") {
      active.codexFiles = { ...active.codexFiles, [m.file]: m.content };
      deliverCodexFiles(FIXTURE_CHAT_ID, active.codexFiles, m.file, m.seq);
      showToast("success", `Memoria saved ${m.file}.json`);
      markDoDone(step);
      scheduleDemoRerender(step);
      return;
    }
    markDoDone(step);
  }

  function markDoDone(step: DoStep): void {
    if (!active) return;
    active.doPhase = "done";
    renderSheet(step);
    if (step.doneAnchor) scheduleAnchor(step.doneAnchor);
  }

  function shimmer(): void {
    if (!demoWrap) return;
    demoWrap.classList.remove("lmb-shimmer");
    void demoWrap.offsetWidth;
    demoWrap.classList.add("lmb-shimmer");
  }

  function makeSandboxCtx(): SpindleFrontendContext {
    const base = deps.ctx as unknown as Record<string, unknown>;
    const baseUi = (base["ui"] ?? {}) as Record<string, unknown>;
    const fake = {
      ...base,
      ui: {
        ...baseUi,
        showConfirm: async () => ({ confirmed: true }),
        showModal: (opts: { title?: string } | undefined) => makeStageModal(opts?.title ?? ""),
      },
    };
    return fake as unknown as SpindleFrontendContext;
  }

  function makeStageModal(title: string): { root: HTMLElement; dismiss: () => void; onDismiss?: (cb: () => void) => void } {
    const overlayEl = document.createElement("div");
    overlayEl.className = "lmb-lesson-modal";
    const card = document.createElement("div");
    card.className = "lmb-lesson-modal-card";
    const head = document.createElement("div");
    head.className = "lmb-seal-title";
    head.textContent = title;
    const root = document.createElement("div");
    card.append(head, root);
    overlayEl.appendChild(card);
    (stage ?? document.body).appendChild(overlayEl);
    let dismissCb: (() => void) | null = null;
    const dismiss = (): void => {
      overlayEl.remove();
      dismissCb?.();
    };
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) dismiss();
    });
    return { root, dismiss, onDismiss: (cb: () => void) => { dismissCb = cb; } };
  }

  /** The working strip above the pane. Marked buttons let nav steps guide
   * the user's own tab clicks instead of teleporting them. */
  function renderDemoStrip(current: DemoTab | null): void {
    if (!demoStrip) return;
    demoStrip.replaceChildren();
    if (!current) {
      demoStrip.style.display = "none";
      return;
    }
    demoStrip.style.display = "";
    for (const t of APP_TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `lmb-demo-tab${t.key === current ? " active" : ""}`;
      lessonMark(btn, `tab.${t.key}`);
      const icon = document.createElement("span");
      icon.className = "lmb-demo-tab-icon";
      icon.innerHTML = t.icon;
      const label = document.createElement("span");
      label.className = "lmb-demo-tab-label";
      label.textContent = t.label;
      btn.append(icon, label);
      btn.addEventListener("click", () => {
        if (!active) return;
        const step = currentStep();
        if (!step) return;
        active.navTab = t.key;
        renderDemoFor(step);
        scheduleAnchor(anchorFor(step), false);
      });
      demoStrip.appendChild(btn);
    }
  }

  function renderDemoFor(step: LessonStep): void {
    if (!demoInner || !active) return;
    const tab: DemoTab | null = active.navTab ?? step.tab ?? active.demoTab;
    if (!tab) return;
    active.demoTab = tab;
    renderDemoStrip(tab);
    const real = step.real === true;
    const state = real ? deps.getState() : fixtureFor(step);
    if (!state) {
      demoInner.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "lmb-empty";
      empty.textContent = real ? "No chat is open right now, skip this step." : "";
      demoInner.appendChild(empty);
      return;
    }
    step.prep?.();
    const send = real
      ? (m: FrontendToBackend) => {
          deps.send(m);
          if (step.kind === "do" && m.type === step.expect && active!.doPhase !== "done") markDoDone(step);
        }
      : makeSandboxSend(step);
    const ctx = real ? deps.ctx : makeSandboxCtx();
    demoInner.replaceChildren();
    const pane = document.createElement("div");
    pane.className = "lmb-root lmb-lesson-demo-root";
    demoInner.appendChild(pane);
    paneObs?.disconnect();
    paneObs = new ResizeObserver(() => scheduleAnchor(anchorFor(currentStep()), false));
    paneObs.observe(pane);
    switch (tab) {
      case "home":
        renderHomeTab(pane, state, ctx, send);
        break;
      case "books":
        renderBooksTab(pane, state, ctx, send);
        break;
      case "codex":
        renderCodexTab(pane, state, ctx, send);
        break;
      case "tuning":
        renderTuningTab(pane, state, ctx, send);
        break;
      case "stuff":
        renderAboutTab(pane, state, send);
        break;
    }
    // Panes stay live on every step: exploring is allowed, fixtures are
    // pinned per step, and the sandbox absorbs anything mutating. Only nav
    // steps funnel clicks to the spotlighted control.
    demoInner.removeAttribute("inert");
    demoWrap?.classList.toggle("lmb-demo-funnel", step.kind === "nav" && active.doPhase === "idle");
  }

  function scheduleDemoRerender(step: LessonStep): void {
    requestAnimationFrame(() => {
      if (!active || currentStep() !== step) return;
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
      // A sandbox reply can complete a nav (codex files landing renders the
      // destination the arrival anchor lives on).
      if (step.kind === "nav") checkNavArrival(step, true);
    });
  }

  /** Cover page for dialogue-only stretches, the demo pane must never sit
   * black (section 1, the register, exam questions without a pane). */
  function renderCover(subtitle?: string): void {
    if (!demoInner || !active) return;
    demoInner.replaceChildren();
    demoInner.removeAttribute("inert");
    demoWrap?.classList.remove("lmb-demo-funnel");
    renderDemoStrip(null);
    hideSpotlight();
    const cover = document.createElement("div");
    cover.className = "lmb-lesson-cover";
    cover.appendChild(memoriaSprite(96));
    const title = document.createElement("div");
    title.className = "lmb-lesson-cover-title";
    title.textContent = active.course.title;
    const orn = document.createElement("div");
    orn.className = "lmb-lesson-cover-orn";
    orn.textContent = "◆ ◇ ◆";
    cover.append(title, orn);
    const secTitle = subtitle
      ?? (active.mode === "lesson" && active.phase === "steps" ? active.main[active.sIdx]?.title : undefined);
    if (secTitle) {
      const sec = document.createElement("div");
      sec.className = "lmb-lesson-cover-sec";
      sec.textContent = secTitle;
      cover.appendChild(sec);
    }
    demoInner.appendChild(cover);
  }

  function demoIsShowing(): boolean {
    return !!demoInner?.querySelector(".lmb-lesson-demo-root, .lmb-lesson-diagram");
  }

  /* ------------------------------------------------------------ spotlight */

  function scheduleAnchor(anchor: string | undefined, scroll = true): void {
    cancelAnimationFrame(anchorRaf);
    anchorRaf = requestAnimationFrame(() => positionSpotlight(anchor, scroll));
  }

  function hideSpotlight(): void {
    for (const p of overlay) p.style.display = "none";
    if (ring) ring.style.display = "none";
    if (spotTag) spotTag.style.display = "none";
  }

  function positionSpotlight(anchor: string | undefined, scroll: boolean): void {
    if (!demoWrap || !demoInner) return;
    if (!anchor) {
      hideSpotlight();
      return;
    }
    // Search the whole demo (the strip lives above the scrolling pane).
    const target = demoWrap.querySelector<HTMLElement>(`[data-lesson="${anchor}"]`);
    if (!target) {
      hideSpotlight();
      return;
    }
    const focusMoved = anchor !== lastSpotAnchor;
    lastSpotAnchor = anchor;
    if ((scroll || focusMoved) && demoInner.contains(target)) {
      // Manual centering: scrollIntoView also scrolls outer containers and
      // yanks the whole drawer around. Strip targets never scroll, and a
      // target taller than the pane aligns to the top instead of centering.
      const cRect = demoInner.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      if (tRect.height > cRect.height * 0.75) {
        demoInner.scrollTop += tRect.top - cRect.top - 10;
      } else {
        demoInner.scrollTop += tRect.top + tRect.height / 2 - (cRect.top + cRect.height / 2);
      }
    }
    const c = demoWrap.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const pad = 5;
    const top = Math.max(0, r.top - c.top - pad);
    const left = Math.max(0, r.left - c.left - pad);
    const right = Math.min(c.width, r.right - c.left + pad);
    const bottom = Math.min(c.height, r.bottom - c.top + pad);
    const [pT, pL, pR, pB] = overlay as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    Object.assign(pT.style, { display: "", top: "0", left: "0", right: "0", height: `${top}px` });
    Object.assign(pB.style, { display: "", top: `${bottom}px`, left: "0", right: "0", bottom: "0", height: "auto" });
    Object.assign(pL.style, { display: "", top: `${top}px`, left: "0", width: `${left}px`, height: `${bottom - top}px` });
    Object.assign(pR.style, { display: "", top: `${top}px`, left: `${right}px`, right: "0", width: "auto", height: `${bottom - top}px` });
    if (ring) {
      Object.assign(ring.style, {
        display: "",
        top: `${top}px`,
        left: `${left}px`,
        width: `${right - left}px`,
        height: `${bottom - top}px`,
      });
    }
    if (spotTag) {
      const step = currentStep();
      const chip = step?.kind === "quiz"
        ? step.chip
        : step?.kind === "nav" && active?.doPhase === "idle"
          ? "tap"
          : undefined;
      if (chip) {
        spotTag.textContent = `◆ ${chip}`;
        spotTag.style.display = "";
        const tagTop = top - 27;
        spotTag.style.top = tagTop < 4 ? `${bottom + 7}px` : `${tagTop}px`;
        spotTag.style.left = `${Math.max(4, left)}px`;
      } else {
        spotTag.style.display = "none";
      }
    }
  }

  /* -------------------------------------------------------------- sheet */

  function renderStep(): void {
    if (!active || !stage) return;
    renderRail();
    if (active.phase === "register") {
      renderCover("Sign the register");
      if (sheetBody) {
        renderRegister(sheetBody, active.signedName ?? "", onSigned);
      }
      return;
    }
    if (active.phase === "diploma") {
      hideSpotlight();
      renderDemoStrip(null);
      if (demoInner) demoInner.replaceChildren();
      renderDiplomaPhase();
      return;
    }
    const step = currentStep();
    if (!step) {
      advance();
      return;
    }
    if (!stepApplies(step)) {
      advance();
      return;
    }
    active.doPhase = "idle";
    active.navTab = null;
    demoWrap?.classList.remove("lmb-demo-funnel");
    if (step.kind === "nav") {
      // Navs show their origin (or whatever is already up) and wait for the
      // user's own clicks. An already-open destination turns into a Next.
      if (!step.tab && !active.demoTab) active.demoTab = lastTabBefore() ?? "home";
      renderDemoFor(step);
      renderSheet(step);
      scheduleAnchor(anchorFor(step));
      checkNavArrival(step, false);
      return;
    }
    if (step.tab) {
      renderDemoFor(step);
      scheduleAnchor(anchorFor(step));
    } else if (step.diagram) {
      if (demoInner) {
        renderDiagram(demoInner, step.diagram);
        demoInner.setAttribute("inert", "");
        renderDemoStrip(null);
      }
      hideSpotlight();
    } else if (demoIsShowing()) {
      // Tab-less steps keep the previous demo on display.
      scheduleAnchor(step.anchor);
    } else {
      renderCover();
    }
    renderSheet(step);
  }

  function renderSheet(step: LessonStep): void {
    if (!sheetBody || !active) return;
    sheetBody.replaceChildren();
    const row = document.createElement("div");
    row.className = "lmb-lesson-row";
    row.appendChild(memoriaSprite(44));
    const content = document.createElement("div");
    content.className = "lmb-lesson-content";
    row.appendChild(content);
    sheetBody.appendChild(row);

    if (step.kind === "quiz") {
      renderQuiz(content, step);
      return;
    }

    const done = active.doPhase === "done";
    const text = document.createElement("div");
    text.className = "lmb-lesson-text";
    text.textContent = step.kind === "do" && done && step.done
      ? step.done
      : step.kind === "nav" && done
        ? (step.done ?? "Right where we need to be.")
        : step.text;
    text.setAttribute("aria-live", "polite");
    content.appendChild(text);

    const nav = document.createElement("div");
    nav.className = "lmb-lesson-nav";
    nav.appendChild(makeButton("Back", back, { small: true, disabled: atStart() }));
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    nav.appendChild(spacer);
    if ((step.kind === "do" || step.kind === "nav") && !done) {
      if (step.optional && active.doPhase === "idle") {
        nav.appendChild(makeButton("Skip", advance, { small: true }));
      }
      const hint = document.createElement("span");
      hint.className = "lmb-lesson-waiting";
      hint.textContent = active.doPhase === "running" ? "working…" : "your move…";
      nav.appendChild(hint);
    } else {
      nav.appendChild(makeButton("Next", advance, { small: true, primary: true }));
    }
    content.appendChild(nav);
  }

  function renderQuiz(content: HTMLElement, q: QuizStep): void {
    if (!active) return;
    const already = active.mode === "lesson" && active.answers[q.id];
    const stem = document.createElement("div");
    stem.className = "lmb-lesson-text";
    stem.textContent = q.text;
    content.appendChild(stem);

    if (q.exhibit) {
      const ex = document.createElement("div");
      ex.className = `lmb-lesson-exhibit ${q.exhibitTone ?? "info"}`;
      ex.textContent = q.exhibit;
      content.appendChild(ex);
    }

    const verdict = document.createElement("div");
    verdict.className = "lmb-lesson-verdict";
    verdict.setAttribute("aria-live", "polite");

    const nav = document.createElement("div");
    nav.className = "lmb-lesson-nav";

    if (already) {
      const note = document.createElement("div");
      note.className = "lmb-lesson-why";
      note.textContent = already === "gold"
        ? "Already stamped gold, from the exam or an earlier pass."
        : "Answered on an earlier pass.";
      content.appendChild(note);
      nav.appendChild(makeButton("Back", back, { small: true, disabled: atStart() }));
      const spacer = document.createElement("span");
      spacer.className = "lmb-spacer";
      nav.appendChild(spacer);
      nav.appendChild(makeButton("Next", advance, { small: true, primary: true }));
      content.appendChild(nav);
      return;
    }

    const group = document.createElement("div");
    group.className = "lmb-lesson-options";
    group.setAttribute("role", "radiogroup");
    const options = shuffled(q);
    let locked = false;
    const btns: HTMLButtonElement[] = [];
    options.forEach((o) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lmb-lesson-option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.textContent = o.text;
      btn.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        btn.setAttribute("aria-checked", "true");
        const answer: LessonAnswer = o.correct ? "gold" : "silver";
        recordAnswer(q, answer);
        for (const b of btns) {
          b.disabled = true;
          const wasCorrect = options[btns.indexOf(b)]!.correct;
          if (wasCorrect) b.classList.add("correct");
        }
        if (!o.correct) btn.classList.add("wrong");
        verdict.textContent = o.correct ? "Filed! ◆" : "Not quite.";
        verdict.classList.add(o.correct ? "ok" : "miss");
        const why = document.createElement("div");
        why.className = "lmb-lesson-why";
        why.textContent = q.why;
        content.insertBefore(why, nav);
        skipLink.remove();
        nav.appendChild(makeButton("Continue", advance, { small: true, primary: true }));
      });
      btns.push(btn);
      group.appendChild(btn);
    });
    content.appendChild(group);
    content.appendChild(verdict);

    const skipLink = document.createElement("button");
    skipLink.type = "button";
    skipLink.className = "lmb-lesson-skip";
    skipLink.textContent = "Skip, mark for revisit";
    skipLink.addEventListener("click", () => {
      if (locked) return;
      locked = true;
      recordAnswer(q, "skip");
      advance();
    });
    nav.appendChild(makeButton("Back", back, { small: true, disabled: atStart() }));
    const spacer = document.createElement("span");
    spacer.className = "lmb-spacer";
    nav.append(spacer, skipLink);
    content.appendChild(nav);

    if (q.anchor || q.tab) {
      const peek = document.createElement("button");
      peek.type = "button";
      peek.className = "lmb-lesson-peek";
      peek.textContent = "Hold to peek at the pane";
      const sheet = sheetBody?.parentElement;
      const down = (): void => sheet?.classList.add("peeking");
      const up = (): void => sheet?.classList.remove("peeking");
      peek.addEventListener("pointerdown", down);
      peek.addEventListener("pointerup", up);
      peek.addEventListener("pointercancel", up);
      peek.addEventListener("pointerleave", up);
      content.appendChild(peek);
    }
  }

  function recordAnswer(q: QuizStep, answer: LessonAnswer): void {
    if (!active) return;
    active.answers[q.id] = answer;
    schedulePatch();
  }

  /* --------------------------------------------------------- navigation */

  function atStart(): boolean {
    if (!active) return true;
    if (active.mode === "exam") return active.examIdx === 0;
    if (active.phase === "finale") return active.fIdx === 0;
    return active.sIdx === 0 && active.tIdx === 0;
  }

  function stepApplies(step: LessonStep | null | undefined): boolean {
    if (!step) return false;
    if (step.onlyFreshInstall && !(deps.getState()?.lessons?.freshInstall ?? false)) return false;
    return true;
  }

  /** Origin surface for a tab-less nav entered cold (resume, section retake):
   * the nearest earlier step that pinned a tab. */
  function lastTabBefore(): DemoTab | null {
    if (!active) return null;
    if (active.phase === "finale") {
      const steps = active.finale?.steps ?? [];
      for (let t = Math.min(active.fIdx, steps.length - 1); t >= 0; t--) {
        const tab = steps[t]?.tab;
        if (tab) return tab;
      }
      return null;
    }
    for (let s = active.sIdx; s >= 0; s--) {
      const steps = active.main[s]?.steps ?? [];
      const from = s === active.sIdx ? Math.min(active.tIdx, steps.length - 1) : steps.length - 1;
      for (let t = from; t >= 0; t--) {
        const tab = steps[t]?.tab;
        if (tab) return tab;
      }
    }
    return null;
  }

  function back(): void {
    if (!active || atStart()) return;
    if (active.mode === "exam") {
      active.examIdx = Math.max(0, active.examIdx - 1);
      renderStep();
      return;
    }
    // Walk back past steps that do not apply (fresh-install-only), otherwise
    // renderStep bounces forward and Back looks dead.
    for (let guard = 0; guard < 50; guard++) {
      if (atStart()) break;
      if (active.phase === "finale") {
        active.fIdx = Math.max(0, active.fIdx - 1);
      } else if (active.tIdx > 0) {
        active.tIdx--;
      } else {
        active.sIdx--;
        active.tIdx = Math.max(0, (active.main[active.sIdx]?.steps.length ?? 1) - 1);
      }
      if (stepApplies(currentStep())) break;
    }
    renderStep();
  }

  function advance(): void {
    if (!active) return;
    if (active.mode === "exam") {
      active.examIdx++;
      if (active.examIdx >= active.examSet.length) {
        finishExam();
        return;
      }
      renderStep();
      return;
    }
    if (active.phase === "finale") {
      active.fIdx++;
      if (!active.finale || active.fIdx >= active.finale.steps.length) {
        active.phase = "diploma";
      }
      renderStep();
      return;
    }
    const section = active.main[active.sIdx];
    if (!section) {
      enterRegister();
      return;
    }
    active.tIdx++;
    if (active.tIdx >= section.steps.length) {
      active.sIdx++;
      active.tIdx = 0;
      if (active.sIdx >= active.main.length) {
        enterRegister();
        return;
      }
    }
    schedulePatch();
    renderStep();
  }

  function enterRegister(): void {
    if (!active) return;
    // Flush while still in the steps phase, the register itself never saves.
    flushPatch();
    active.phase = "register";
    renderStep();
  }

  function onSigned(name: string): void {
    if (!active) return;
    active.signedName = name;
    if (active.mode === "lesson") {
      const scored = scoredQuestions(active.course);
      // Only answered questions count as wrong: graduates hold sparse sheets.
      active.wrong = scored.filter((s) => {
        const a = active!.answers[s.id];
        return a !== undefined && a !== "gold";
      }).length;
      active.total = scored.length;
    }
    active.grade = active.mode === "exam"
      ? (active.wrong === 0 ? "gilded" : "silver")
      : lessonGradeForWrong(active.wrong);
    active.completedAt = Date.now();
    deps.send({
      type: "lesson_complete",
      course: active.key,
      wrong: active.wrong,
      total: active.total,
      grade: active.grade,
      signedName: active.signedName,
      answers: active.answers,
    });
    // Apply locally too, or exiting the diploma before the backend's push
    // arrives briefly re-seals the archive.
    deps.applyLessons(active.key, {
      status: "done",
      grade: active.grade,
      lastWrong: active.wrong,
      signedName: active.signedName,
      completedAt: active.completedAt,
      answers: { ...active.answers },
    });
    active.phase = active.finale ? "finale" : "diploma";
    active.fIdx = 0;
    renderStep();
  }

  function finishExam(): void {
    if (!active) return;
    const wrong = active.examSet.filter((q) => active!.answers[q.id] !== "gold").length;
    if (wrong <= EXAM_PASS_MAX_WRONG) {
      active.wrong = wrong;
      active.total = active.examSet.length;
      active.mode = "lesson";
      active.phase = "register";
      // Exam grading is its own scale: flawless is Gilded, one miss is Silver.
      active.grade = wrong === 0 ? "gilded" : "silver";
      active.completedAt = Date.now();
      // Bank the pass now, exiting at the register must not evaporate it.
      deps.send({
        type: "lesson_complete",
        course: active.key,
        wrong,
        total: active.total,
        grade: active.grade,
        signedName: null,
        answers: active.answers,
      });
      deps.applyLessons(active.key, {
        status: "done",
        grade: active.grade,
        lastWrong: wrong,
        lastTotal: active.total,
        completedAt: active.completedAt,
        answers: { ...active.answers },
      });
      renderStepExamPass();
      return;
    }
    // Failed: keep the gold stamps as pre-passed topics and enter the course.
    const gold: Record<string, LessonAnswer> = {};
    for (const q of active.examSet) {
      if (active.answers[q.id] === "gold") gold[q.id] = "gold";
    }
    const key = active.key;
    const failPatch: Partial<LessonCourseState> = { status: "in_progress", section: 0, step: 0, answers: gold };
    deps.send({ type: "lesson_patch", course: key, patch: failPatch });
    deps.applyLessons(key, failPatch);
    const correct = active.examSet.length - wrong;
    active.mode = "lesson";
    active.answers = gold;
    active.sIdx = 0;
    active.tIdx = 0;
    active.phase = "steps";
    renderStep();
    showToast("info", `${correct} of ${active.examSet.length}, the passed topics stay stamped while we walk the rest`);
  }

  function renderStepExamPass(): void {
    if (!active || !sheetBody) return;
    renderRail();
    renderCover("Sign the register");
    renderRegister(sheetBody, active.signedName ?? "", (name) => {
      if (!active) return;
      active.signedName = name;
      // A second lesson_complete here would double-count the attempt.
      deps.send({ type: "lesson_patch", course: active.key, patch: { signedName: name } });
      deps.applyLessons(active.key, { signedName: name });
      active.phase = active.finale ? "finale" : "diploma";
      active.fIdx = 0;
      renderStep();
    });
  }

  function renderDiplomaPhase(): void {
    if (!active || !sheetBody) return;
    const saved = deps.getState()?.lessons?.[active.key];
    const data = {
      courseTitle: active.course.title,
      name: (active.viewOnly ? saved?.signedName : active.signedName) ?? saved?.signedName ?? "Reader",
      grade: active.viewOnly ? (saved?.grade ?? active.grade) : active.grade,
      wrong: active.viewOnly ? (saved?.lastWrong ?? active.wrong) : active.wrong,
      total: active.viewOnly ? (saved?.lastTotal ?? active.total) : active.total,
      completedAt: active.viewOnly ? (saved?.completedAt ?? active.completedAt) : active.completedAt,
    };
    const actions: { label: string; onClick: () => void; primary?: boolean }[] = [];
    if (!active.viewOnly && active.key === "books") {
      actions.push({ label: "Enter the Archive", onClick: exit, primary: true });
    } else if (!active.viewOnly) {
      actions.push({ label: "Open the Codex", onClick: exit, primary: true });
    } else {
      actions.push({ label: "Close", onClick: exit, primary: true });
    }
    if (demoInner) {
      demoInner.replaceChildren();
      demoInner.removeAttribute("inert");
      renderDiploma(demoInner, data, actions);
    }
    sheetBody.replaceChildren();
    const row = document.createElement("div");
    row.className = "lmb-lesson-row";
    row.appendChild(memoriaSprite(44));
    const text = document.createElement("div");
    text.className = "lmb-lesson-text";
    text.textContent = active.viewOnly
      ? "Your diploma, as filed in the Academy."
      : "Signed, stamped, and shelved. Congratulations, nyaa.";
    row.appendChild(text);
    sheetBody.appendChild(row);
  }

  return { isActive, start, mount, onHostState, exit };
}

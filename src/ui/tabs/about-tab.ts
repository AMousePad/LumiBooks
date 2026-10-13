import { t as tr } from "../../i18n";
import type { FrontendState, FrontendToBackend } from "../../types";
import type { LessonCourseKey } from "../../shared";
import { LESSON_GRADE_LABEL } from "../../shared";
import { checkbox, makeButton, section, textNode } from "../components";
import { memoriaSprite, requestLesson } from "../lessons/seal";
import { COURSE_BOOKS } from "../lessons/content-books";
import { COURSE_CODEX } from "../lessons/content-codex";
import { allQuestionIds } from "../lessons/lesson-types";
import type { LessonCourseDef } from "../lessons/lesson-types";

export function renderAboutTab(
  host: HTMLElement,
  state: FrontendState | null,
  send: (msg: FrontendToBackend) => void,
): void {
  host.replaceChildren();

  const hero = section(tr("ui.tabs.aboutTab.hero.memoria"));
  const card = document.createElement("div");
  card.className = "lmb-about-hero";
  card.appendChild(memoriaSprite(64));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-hero-title";
  title.textContent = tr("ui.tabs.aboutTab.renderAboutTab.memoriaTheLumiBooksLibrarian");
  const tag = document.createElement("div");
  tag.className = "lmb-about-line";
  tag.textContent =
    tr("ui.tabs.aboutTab.renderAboutTab.nyandereCatgirlInAMaidUniformBlack");
  right.append(title, tag);
  card.append(right);
  hero.body.appendChild(card);
  host.appendChild(hero.wrap);

  if (state) {
    renderDiagnostics(host, state, send);
    renderAcademy(host, state, send);
  }

  const ack = section(tr("ui.tabs.aboutTab.ack.acknowledgements"));
  const a = document.createElement("div");
  a.className = "lmb-about-line";
  a.textContent =
    tr("ui.tabs.aboutTab.renderAboutTab.builtOnLumiverseSpindleWithPromptsAnd");
  ack.body.appendChild(a);
  host.appendChild(ack.wrap);
}

const GRADE_CLASS: Record<string, string> = {
  gilded: "lmb-grade-gilded",
  silver: "lmb-grade-silver",
  bronze: "lmb-grade-bronze",
  apprentice: "lmb-grade-apprentice",
};

function renderAcademy(host: HTMLElement, state: FrontendState, send: (msg: FrontendToBackend) => void): void {
  const sec = section(tr("ui.tabs.aboutTab.sec.memoriaSAcademy"));
  sec.body.appendChild(textNode(
    tr("ui.tabs.aboutTab.renderAcademy.bothCoursesLiveHereForRetakesPer"),
    "lmb-help",
  ));
  sec.body.appendChild(courseCard("books", COURSE_BOOKS, state, send));
  sec.body.appendChild(courseCard("codex", COURSE_CODEX, state, send));
  host.appendChild(sec.wrap);
}

function courseCard(
  key: LessonCourseKey,
  course: LessonCourseDef,
  state: FrontendState,
  send: (msg: FrontendToBackend) => void,
): HTMLElement {
  const cs = state.lessons[key];
  const card = document.createElement("div");
  card.className = "lmb-academy-course";

  const head = document.createElement("div");
  head.className = "lmb-academy-head";
  const title = document.createElement("span");
  title.className = "lmb-academy-title";
  title.textContent = course.title;
  head.appendChild(title);
  if (cs.status === "done" && cs.grade) {
    const grade = document.createElement("span");
    grade.className = `lmb-academy-grade ${GRADE_CLASS[cs.grade] ?? ""}`;
    grade.textContent = LESSON_GRADE_LABEL[cs.grade];
    head.appendChild(grade);
  }
  card.appendChild(head);

  const sub = document.createElement("div");
  sub.className = "lmb-help";
  sub.textContent = cs.status === "done"
    ? tr("ui.tabs.aboutTab.courseCard.completedAttempt", { choice: (cs.signedName) ? "yes" : "no", signedName: (cs.signedName) ? (cs.signedName) : "", attempts: cs.attempts })
    : cs.status === "in_progress"
      ? tr("ui.tabs.aboutTab.courseCard.inProgressSection", { section1: cs.section + 1 })
      : key === "codex"
        ? tr("ui.tabs.aboutTab.courseCard.lockedBehindNothingButYourTimeThis")
        : tr("ui.tabs.aboutTab.courseCard.theMandatoryPrimer");
  card.appendChild(sub);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  if (cs.status === "done") {
    actions.append(
      makeButton(tr("ui.tabs.aboutTab.courseCard.viewDiploma"), () => requestLesson({ course: key, mode: "diploma" }), { small: true }),
      makeButton(tr("ui.tabs.aboutTab.courseCard.retakeCourse"), () => {
        send({ type: "lesson_reset", course: key, mode: "course", chatId: state.activeChatId });
        requestLesson({ course: key, mode: "lesson", section: 0, fresh: true });
      }, {
        small: true,
        title: tr("ui.tabs.aboutTab.courseCard.leaveAnytimeTheCourseStaysCompletedOn"),
      }),
    );
  } else {
    actions.append(
      makeButton(cs.status === "in_progress" ? tr("ui.tabs.aboutTab.courseCard.resume") : tr("ui.tabs.aboutTab.courseCard.start"), () => requestLesson({ course: key, mode: "lesson" }), {
        small: true,
        primary: true,
      }),
    );
    if (key === "books") {
      actions.append(makeButton(tr("ui.tabs.aboutTab.courseCard.sitTheExam"), () => requestLesson({ course: key, mode: "exam" }), { small: true }));
    }
  }
  card.appendChild(actions);

  if (cs.status === "done") {
    const sections = document.createElement("div");
    sections.className = "lmb-academy-sections";
    course.sections.forEach((s, i) => {
      if (s.id === "finale") return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lmb-academy-section";
      const ids = allQuestionIds(course, i);
      const missed = ids.some((id) => cs.answers[id] !== "gold");
      btn.textContent = tr("ui.tabs.aboutTab.courseCard.value", { i1: i + 1, title: s.title, choice: (missed) ? "yes" : "no" });
      btn.title = missed ? tr("ui.tabs.aboutTab.courseCard.hasSilverOrSkippedStampsRetakeTo") : tr("ui.tabs.aboutTab.courseCard.allGold");
      btn.addEventListener("click", () => {
        send({ type: "lesson_reset", course: key, mode: "section", section: i, answerIds: ids, chatId: state.activeChatId });
        requestLesson({ course: key, mode: "lesson", section: i });
      });
      sections.appendChild(btn);
    });
    card.appendChild(sections);
  }
  return card;
}

function renderDiagnostics(host: HTMLElement, state: FrontendState, send: (msg: FrontendToBackend) => void): void {
  const sec = section(tr("ui.tabs.aboutTab.sec.privateDiagnostics"));
  sec.body.appendChild(checkbox({
    checked: state.settings.localLogsDisabled,
    label: tr("ui.tabs.aboutTab.renderDiagnostics.turnOffLocalLogsThisIsNot"),
    onChange: (localLogsDisabled) => send({ type: "save_settings", chatId: state.activeChatId, patch: { localLogsDisabled } }),
  }));
  sec.body.appendChild(textNode(tr("ui.tabs.aboutTab.renderDiagnostics.tracksUiFailuresNavigationRequestsFilingCoverage"), "lmb-help"));
  const actions = document.createElement("div"); actions.className = "lmb-actions";
  const chatId = state.activeChatId;
  actions.append(makeButton(tr("ui.tabs.aboutTab.renderDiagnostics.exportDiagnostics"), () => send({ type: "diagnostics_export", chatId })),
    makeButton(tr("ui.tabs.aboutTab.renderDiagnostics.clearDiagnostics"), () => send({ type: "diagnostics_clear", chatId })));
  sec.body.appendChild(actions); host.appendChild(sec.wrap);
}

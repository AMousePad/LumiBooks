import type { FrontendState, FrontendToBackend } from "../../types";
import type { LessonCourseKey } from "../../shared";
import { LESSON_GRADE_LABEL } from "../../shared";
import { makeButton, section, textNode } from "../components";
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

  const hero = section("Memoria");
  const card = document.createElement("div");
  card.className = "lmb-about-hero";
  card.appendChild(memoriaSprite(64));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-hero-title";
  title.textContent = "Memoria, the LumiBooks librarian";
  const tag = document.createElement("div");
  tag.className = "lmb-about-line";
  tag.textContent =
    "Young nyandere catgirl in a maid uniform. Black hair, blue eyes. " +
    "Files your chats into chapters, binds chapters into arcs, and leaves a tiny nyaa note on every shelf.";
  right.append(title, tag);
  card.append(right);
  hero.body.appendChild(card);
  host.appendChild(hero.wrap);

  if (state) renderAcademy(host, state, send);

  const how = section("How it works");
  const lines = [
    "Tail messages stay uncompressed until they pass the lag.",
    "Once the window fills, Memoria writes a chapter, hides those messages in the chat, and slices the chapter into the prompt at the same spot.",
    "Several chapters can be bound into a single arc that replaces them.",
    "Arcs can be pressed into a volume the same way, manually from the Books tab.",
    "The Knowledge Codex tracks entities, relations, timeline, threads, and lore as a story bible injected alongside the summaries.",
    "Storage lives in a per-chat world book named LumiBooks. Renaming or deleting entries there releases the messages back.",
  ];
  for (const l of lines) {
    how.body.appendChild(textNode(l, "lmb-about-line"));
  }
  host.appendChild(how.wrap);

  const where = section("Where things live");
  for (const l of [
    "Settings and toggles moved to Tuning (Connection, Settings, Prompts).",
    "Shelf repair tools live under Books → Advanced.",
  ]) {
    where.body.appendChild(textNode(l, "lmb-about-line"));
  }
  host.appendChild(where.wrap);

  const ack = section("Acknowledgements");
  const a = document.createElement("div");
  a.className = "lmb-about-line";
  a.textContent =
    "Built on Lumiverse Spindle, with prompts and UX inspired by SillyTavern Memory Books. " +
    "Memoria thanks the original Memory Books authors for the inspiration.";
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
  const sec = section("Memoria's Academy");
  sec.body.appendChild(textNode(
    "Both courses live here for retakes, per-section revisits, and diplomas.",
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
    ? `Completed${cs.signedName ? ` by ${cs.signedName}` : ""}, ${cs.attempts} attempt${cs.attempts === 1 ? "" : "s"}.`
    : cs.status === "in_progress"
      ? `In progress, section ${cs.section + 1}.`
      : key === "codex"
        ? "Locked behind nothing but your time. This one turns the codex on."
        : "The mandatory primer.";
  card.appendChild(sub);

  const actions = document.createElement("div");
  actions.className = "lmb-actions";
  if (cs.status === "done") {
    actions.append(
      makeButton("View diploma", () => requestLesson({ course: key, mode: "diploma" }), { small: true }),
      makeButton("Retake course", () => {
        send({ type: "lesson_reset", course: key, mode: "course", chatId: state.activeChatId });
        requestLesson({ course: key, mode: "lesson", section: 0, fresh: true });
      }, {
        small: true,
        title: "Leave anytime, the course stays completed on your previous grade until you finish a new run",
      }),
    );
  } else {
    actions.append(
      makeButton(cs.status === "in_progress" ? "Resume" : "Start", () => requestLesson({ course: key, mode: "lesson" }), {
        small: true,
        primary: true,
      }),
    );
    if (key === "books") {
      actions.append(makeButton("Sit the Exam", () => requestLesson({ course: key, mode: "exam" }), { small: true }));
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
      btn.textContent = `${i + 1}. ${s.title}${missed ? " ◇" : " ◆"}`;
      btn.title = missed ? "Has silver or skipped stamps, retake to gild it" : "All gold";
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

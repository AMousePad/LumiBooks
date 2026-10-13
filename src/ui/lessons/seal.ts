import { t as tr } from "../../i18n";
import type { FrontendState, FrontendToBackend } from "../../types";
import { makeButton } from "../components";
import { MEMORIA_AVATAR } from "./avatar";

export type LessonRequestDetail = {
  course: "books" | "codex";
  mode?: "lesson" | "exam" | "diploma";
  section?: number;
  /** Start with a blank answer sheet (course retakes). */
  fresh?: boolean;
};

/** Tabs cannot import the engine (cycle), so locked surfaces ask for a lesson
 * through this event and app.ts forwards it. */
export function requestLesson(detail: LessonRequestDetail): void {
  document.dispatchEvent(new CustomEvent("lmb-lesson-request", { detail }));
}

export function memoriaSprite(size = 56): HTMLImageElement {
  const img = document.createElement("img");
  img.className = "lmb-memoria-sprite";
  img.src = MEMORIA_AVATAR;
  img.alt = tr("ui.lessons.seal.memoriaSprite.memoria");
  img.width = size;
  img.height = size;
  return img;
}

function runeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = makeButton(label, onClick, { primary: true });
  btn.classList.add("lmb-rune-btn");
  const ring = document.createElement("span");
  ring.className = "lmb-rune-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.textContent = tr("ui.lessons.seal.runeButton.value");
  btn.appendChild(ring);
  return btn;
}

/* ------------------------------------------------- course 1 seal panel */

let busyStrip: HTMLElement | null = null;
let busyStripSend: ((m: FrontendToBackend) => void) | null = null;

/** The floating seal over the read-only archive. Abort and Retry stay live
 * here because the veil underneath is inert. */
export function renderSealPanel(
  host: HTMLElement,
  state: FrontendState,
  send: (m: FrontendToBackend) => void,
): void {
  const panel = document.createElement("div");
  panel.className = "lmb-seal-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", tr("ui.lessons.seal.renderSealPanel.lessonsFromMemoria"));

  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(72));
  const heroText = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = tr("ui.lessons.seal.renderSealPanel.welcomeTutorial");
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent = tr("ui.lessons.seal.renderSealPanel.hiUserIMTeachingATutorial");
  heroText.append(title, pitch);
  hero.appendChild(heroText);
  panel.appendChild(hero);

  const inProgress = state.lessons.books.status === "in_progress";
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(
    runeButton(
      inProgress ? tr("ui.lessons.seal.renderSealPanel.resumeTheLesson") : tr("ui.lessons.seal.renderSealPanel.takeLessonFromMemoria"),
      () => requestLesson({ course: "books", mode: "lesson" }),
    ),
  );
  actions.appendChild(
    makeButton(tr("ui.lessons.seal.renderSealPanel.sitTheExam"), () => requestLesson({ course: "books", mode: "exam" }), {
      small: true,
      title: tr("ui.lessons.seal.renderSealPanel.tenQuestionsFromTheCourse9Of"),
    }),
  );
  const skip = document.createElement("button");
  skip.type = "button";
  skip.className = "lmb-lesson-skip";
  skip.textContent = tr("ui.lessons.seal.renderSealPanel.skipForNow");
  skip.addEventListener("click", () => renderGrumpySkip(panel, send));
  actions.appendChild(skip);
  panel.appendChild(actions);

  if (inProgress) {
    const sec = state.lessons.books.section + 1;
    const note = document.createElement("div");
    note.className = "lmb-seal-note";
    note.textContent = tr("ui.lessons.seal.renderSealPanel.progressSavedAtSection", { sec: sec });
    panel.appendChild(note);
  }

  busyStrip = document.createElement("div");
  busyStrip.className = "lmb-seal-busy";
  busyStripSend = send;
  panel.appendChild(busyStrip);
  updateSealBusy(state);

  host.appendChild(panel);
}

/** The grumpy gatekeeper: skipping is allowed, approved of it is not. */
function renderGrumpySkip(panel: HTMLElement, send: (m: FrontendToBackend) => void): void {
  panel.replaceChildren();
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(72));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = tr("ui.lessons.seal.renderGrumpySkip.hmphFine");
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent =
    tr("ui.lessons.seal.renderGrumpySkip.skipIfYouMustButYouHad");
  right.append(title, pitch);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(tr("ui.lessons.seal.renderGrumpySkip.fineTeachMe"), () => requestLesson({ course: "books", mode: "lesson" })));
  actions.appendChild(makeButton(tr("ui.lessons.seal.renderGrumpySkip.skipAnyway"), () => send({ type: "lesson_seal_skip" }), { small: true }));
  panel.append(hero, actions);
}

/** Live busy and failure rows on the seal. Re-rendered per busy push. */
export function updateSealBusy(state: FrontendState): void {
  const strip = busyStrip;
  const send = busyStripSend;
  if (!strip || !strip.isConnected || !send) return;
  strip.replaceChildren();
  for (const b of state.busy) {
    const row = document.createElement("div");
    row.className = "lmb-busy";
    const dot = document.createElement("div");
    dot.className = "lmb-busy-dot";
    const label = document.createElement("span");
    label.className = "lmb-grow";
    label.textContent = b.label;
    row.append(dot, label, makeButton(tr("ui.lessons.seal.updateSealBusy.abort"), () => send({ type: "abort_busy", chatId: b.chatId, kind: b.kind }), {
      danger: true,
      small: true,
    }));
    strip.appendChild(row);
  }
  if (state.lastFailure && state.activeChatId) {
    const chatId = state.activeChatId;
    const row = document.createElement("div");
    row.className = "lmb-seal-failure";
    const label = document.createElement("span");
    label.className = "lmb-grow";
    label.textContent = tr("ui.lessons.seal.updateSealBusy.lastAttemptFailed", { kind: state.lastFailure.kind });
    row.append(label, makeButton(tr("ui.lessons.seal.updateSealBusy.retry"), () => send({ type: "retry_last_failure", chatId }), { small: true, primary: true }));
    strip.appendChild(row);
  }
}

export function clearSealBusy(): void {
  busyStrip = null;
  busyStripSend = null;
}

/* --------------------------------------------------- codex lock surfaces */

const PREVIEW_TILES: { value: string; label: string; sub: string }[] = [
  { value: "3", label: tr("ui.lessons.seal.previewTiles.characters"), sub: tr("ui.lessons.seal.previewTiles.240Tokens") },
  { value: "2", label: tr("ui.lessons.seal.previewTiles.locations"), sub: tr("ui.lessons.seal.previewTiles.90Tokens") },
  { value: "1", label: tr("ui.lessons.seal.previewTiles.things"), sub: tr("ui.lessons.seal.previewTiles.50Tokens") },
  { value: "4", label: tr("ui.lessons.seal.previewTiles.relations"), sub: tr("ui.lessons.seal.previewTiles.170Tokens") },
  { value: "5", label: tr("ui.lessons.seal.previewTiles.timeline"), sub: tr("ui.lessons.seal.previewTiles.160Tokens") },
  { value: "2", label: tr("ui.lessons.seal.previewTiles.threads"), sub: tr("ui.lessons.seal.previewTiles.120Tokens") },
  { value: "2", label: tr("ui.lessons.seal.previewTiles.lore"), sub: tr("ui.lessons.seal.previewTiles.110Tokens") },
  { value: "2", label: tr("ui.lessons.seal.previewTiles.secrets"), sub: tr("ui.lessons.seal.previewTiles.90Tokens") },
];

/** Full Codex tab lock: hatched fixture preview plus the seal. Nobody has a
 * codex before Course 2, so the preview is the shop window. */
export function renderCodexTabLock(host: HTMLElement, send?: (m: FrontendToBackend) => void): void {
  const wrap = document.createElement("div");
  wrap.className = "lmb-codex-lock";

  const preview = document.createElement("div");
  preview.className = "lmb-codex-lock-preview";
  preview.setAttribute("aria-hidden", "true");
  const watermark = document.createElement("div");
  watermark.className = "lmb-codex-lock-watermark";
  watermark.textContent = tr("ui.lessons.seal.renderCodexTabLock.example");
  preview.appendChild(watermark);
  const tiles = document.createElement("div");
  tiles.className = "lmb-tiles";
  for (const t of PREVIEW_TILES) {
    const tile = document.createElement("div");
    tile.className = "lmb-tile";
    const v = document.createElement("div");
    v.className = "lmb-tile-value";
    v.textContent = t.value;
    const l = document.createElement("div");
    l.className = "lmb-tile-label";
    l.textContent = t.label;
    const s = document.createElement("div");
    s.className = "lmb-tile-sub";
    s.textContent = t.sub;
    tile.append(v, l, s);
    tiles.appendChild(tile);
  }
  preview.appendChild(tiles);
  wrap.appendChild(preview);

  wrap.appendChild(codexSealCard(
    tr("ui.lessons.seal.renderCodexTabLock.theKnowledgeCodex"),
    tr("ui.lessons.seal.renderCodexTabLock.aStoryBibleAnAgentKeepsFor"),
    send,
  ));
  host.appendChild(wrap);
}

/** Compact lock for the Tuning → Codex pane and other small surfaces. */
export function renderCodexPaneLock(host: HTMLElement): void {
  host.appendChild(codexSealCard(
    tr("ui.lessons.seal.renderCodexPaneLock.sealedUntilTheLesson"),
    tr("ui.lessons.seal.renderCodexPaneLock.theCodexSettingsUnlockWhenYouFinish"),
  ));
}

function codexSealCard(title: string, text: string, send?: (m: FrontendToBackend) => void): HTMLElement {
  const card = document.createElement("div");
  card.className = "lmb-codex-lock-card";
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(56));
  const right = document.createElement("div");
  const t = document.createElement("div");
  t.className = "lmb-seal-title";
  t.textContent = title;
  const p = document.createElement("div");
  p.className = "lmb-seal-pitch";
  p.textContent = text;
  right.append(t, p);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(tr("ui.lessons.seal.codexSealCard.takeALessonFromMemoria"), () => requestLesson({ course: "codex", mode: "lesson" })));
  if (send) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "lmb-lesson-skip";
    skip.textContent = tr("ui.lessons.seal.codexSealCard.skipForNow");
    skip.addEventListener("click", () => renderCodexGrumpySkip(card, send));
    actions.appendChild(skip);
  }
  card.append(hero, actions);
  return card;
}

/** Same grumpy gatekeeper as Course 1, codex flavor. */
function renderCodexGrumpySkip(card: HTMLElement, send: (m: FrontendToBackend) => void): void {
  card.replaceChildren();
  const hero = document.createElement("div");
  hero.className = "lmb-seal-hero";
  hero.appendChild(memoriaSprite(56));
  const right = document.createElement("div");
  const title = document.createElement("div");
  title.className = "lmb-seal-title";
  title.textContent = tr("ui.lessons.seal.renderCodexGrumpySkip.hmphFine");
  const pitch = document.createElement("div");
  pitch.className = "lmb-seal-pitch";
  pitch.textContent =
    tr("ui.lessons.seal.renderCodexGrumpySkip.skipIfYouMustTheCodexUnlocks");
  right.append(title, pitch);
  hero.appendChild(right);
  const actions = document.createElement("div");
  actions.className = "lmb-seal-actions";
  actions.appendChild(runeButton(tr("ui.lessons.seal.renderCodexGrumpySkip.fineTeachMe"), () => requestLesson({ course: "codex", mode: "lesson" })));
  actions.appendChild(makeButton(tr("ui.lessons.seal.renderCodexGrumpySkip.skipAnyway"), () => send({ type: "lesson_seal_skip", course: "codex" }), { small: true }));
  card.append(hero, actions);
}

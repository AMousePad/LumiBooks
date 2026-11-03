import { t as tr } from "../i18n";
declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { LMBProfile, LessonCourseKey, LessonCourseState, LessonsState } from "../shared";
import {
  LESSONS_PATH,
  SETTINGS_PATH,
  codexLessonGated,
  makeDefaultLessons,
  normalizeLessons,
  unlockedLessons,
} from "../shared";
import { mutateSettings } from "./storage";
import { describeError, error, warn } from "./runtime";

/** One in-memory copy per user. Only this process writes lessons.json, so the
 * cache is authoritative after the first load. */
const cache = new Map<string, LessonsState>();
const inflight = new Map<string, Promise<LessonsState>>();
const writeLocks = new Map<string, Promise<unknown>>();
/** Fail-open synthetic state must never be persisted over the real file. */
const failOpenUsers = new Set<string>();

let anomalyCb: ((userId: string, text: string) => void) | null = null;
export function registerLessonsAnomalyCallback(cb: (userId: string, text: string) => void): void {
  anomalyCb = cb;
}

function withLessonsLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(userId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks.set(userId, next.catch(() => {}));
  return next;
}

/**
 * Load (initializing on first sight) the lessons state for a user.
 * Absent file: this is the first load after the update. Detect fresh installs
 * by the absence of settings.json, create the default state, and force the
 * course-gated profile flags off so the graduation acts are real toggles.
 * Unreadable file: fail OPEN (both courses done) with an error toast. The
 * gates are UX and a storage fault must never lock a working install.
 */
export async function ensureLessons(userId: string): Promise<LessonsState> {
  const cached = cache.get(userId);
  if (cached) return cached;
  const running = inflight.get(userId);
  if (running) return running;
  const p = (async () => {
    const state = await loadFromDisk(userId);
    cache.set(userId, state);
    return state;
  })().finally(() => inflight.delete(userId));
  inflight.set(userId, p);
  return p;
}

async function loadFromDisk(userId: string): Promise<LessonsState> {
  let exists: boolean;
  try {
    exists = await spindle.userStorage.exists(LESSONS_PATH, userId);
  } catch (err) {
    error(`lessons: exists() failed, unlocking as a precaution: ${describeError(err)}`);
    anomalyCb?.(userId, tr("backend.lessons.loadFromDisk.memoriaCouldnTReadHerLessonRegister", { describeError: describeError(err) }));
    failOpenUsers.add(userId);
    return unlockedLessons();
  }
  if (!exists) {
    const fresh = await isFreshInstall(userId);
    const state = makeDefaultLessons(fresh);
    failOpenUsers.delete(userId);
    // Direct write: taking the mutation lock here would deadlock a fail-open retry.
    await spindle.userStorage
      .setJson(LESSONS_PATH, state, { indent: 0, userId })
      .catch((err) => warn(`lessons: initial save failed: ${describeError(err)}`));
    await applyGateFlags(userId, fresh).catch((err) => warn(`lessons: gate flag init failed: ${describeError(err)}`));
    return state;
  }
  try {
    const raw = await spindle.userStorage.read(LESSONS_PATH, userId);
    failOpenUsers.delete(userId);
    return normalizeLessons(JSON.parse(raw) as unknown);
  } catch (err) {
    error(`lessons: file unreadable, unlocking as a precaution: ${describeError(err)}`);
    anomalyCb?.(userId, tr("backend.lessons.loadFromDisk.memoriaCouldnTReadHerLessonRegister", { describeError: describeError(err) }));
    failOpenUsers.add(userId);
    return unlockedLessons();
  }
}

/** No settings.json means LumiBooks has never run for this user. A failed
 * check counts as a veteran so we never hold a working install's automation. */
async function isFreshInstall(userId: string): Promise<boolean> {
  try {
    return !(await spindle.userStorage.exists(SETTINGS_PATH, userId));
  } catch {
    return false;
  }
}

/**
 * The graduation acts must be real toggles. Codex ships with this update, so
 * codexEnabled goes off for everyone until Course 2's ceremony flips it on.
 * Fresh installs also start with Run automation off until Course 1's finale.
 */
async function applyGateFlags(userId: string, freshInstall: boolean): Promise<void> {
  await mutateSettings(userId, (cur) => ({
    ...cur,
    profiles: cur.profiles.map((p) => ({
      ...p,
      codexEnabled: false,
      ...(freshInstall ? { autoCreate: false } : {}),
    })),
  }));
}

async function tryReadRealLessons(userId: string): Promise<LessonsState | null> {
  try {
    const exists = await spindle.userStorage.exists(LESSONS_PATH, userId);
    if (!exists) return null;
    const raw = await spindle.userStorage.read(LESSONS_PATH, userId);
    return normalizeLessons(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

async function mutateLessons(userId: string, fn: (cur: LessonsState) => LessonsState, delivery?: { id: string; course: LessonCourseKey }): Promise<LessonsState> {
  return withLessonsLock(userId, async () => {
    let cur = await ensureLessons(userId);
    if (failOpenUsers.has(userId)) {
      const real = await tryReadRealLessons(userId);
      if (real) {
        failOpenUsers.delete(userId);
        cur = real;
      }
    }
    if (delivery && cur[delivery.course].deliveryIds?.includes(delivery.id)) return cur;
    const next = { ...fn(cur) };
    for (const course of ["books", "codex"] as const) {
      if (next[course] !== cur[course] || delivery?.course === course) {
        next[course] = { ...next[course], revision: (cur[course].revision ?? 0) + 1,
          deliveryIds: delivery?.course === course ? [...(cur[course].deliveryIds ?? []), delivery.id].slice(-128) : cur[course].deliveryIds };
      }
    }
    if (failOpenUsers.has(userId)) {
      if (delivery) throw new Error("Lesson progress has not been saved yet; the lesson register is unavailable");
      cache.set(userId, next);
      warn(`lessons: register still unreadable for ${userId.slice(0, 6)}, keeping the change in memory only`);
      anomalyCb?.(userId, tr("backend.lessons.mutateLessons.memoriaCouldnTReadHerLessonRegister"));
      return next;
    }
    await spindle.userStorage.setJson(LESSONS_PATH, next, { indent: 0, userId });
    cache.set(userId, next);
    return next;
  });
}

export function patchLessonCourse(
  userId: string,
  course: LessonCourseKey,
  patch: Partial<LessonCourseState>,
  deliveryId?: string,
): Promise<LessonsState> {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    return {
      ...cur,
      [course]: {
        ...prev,
        ...patch,
        status: prev.status === "done" ? "done" : patch.status ?? prev.status,
        answers: patch.answers ? { ...prev.answers, ...patch.answers } : prev.answers,
      },
    };
  }, deliveryId ? { id: deliveryId, course } : undefined);
}

export function completeLessonCourse(
  userId: string,
  course: LessonCourseKey,
  wrong: number,
  total: number,
  grade: LessonCourseState["grade"],
  signedName: string | null,
  answers?: LessonCourseState["answers"],
  deliveryId?: string,
): Promise<LessonsState> {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    const bestWrong = prev.bestWrong === null ? wrong : Math.min(prev.bestWrong, wrong);
    return {
      ...cur,
      [course]: {
        ...prev,
        status: "done",
        answers: answers ? { ...prev.answers, ...answers } : prev.answers,
        attempts: prev.attempts + 1,
        lastWrong: wrong,
        lastTotal: total > 0 ? total : null,
        bestWrong,
        grade,
        completedAt: Date.now(),
        signedName: signedName?.trim() ? signedName.trim().slice(0, 60) : prev.signedName,
        startedAt: prev.startedAt ?? Date.now(),
      },
    };
  }, deliveryId ? { id: deliveryId, course } : undefined);
}

export function resetLessonCourse(
  userId: string,
  course: LessonCourseKey,
  mode: "course" | "section",
  section?: number,
  answerIds?: string[],
  deliveryId?: string,
): Promise<LessonsState> {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    // A graduate's retake never revokes the diploma: status stays "done" (the
    // completedAt check also heals retakes abandoned under older builds), so
    // leaving mid-retake keeps every gate open and the previous score standing.
    const wasDone = prev.status === "done" || (prev.completedAt !== null && prev.grade !== null);
    const status: LessonCourseState["status"] = wasDone ? "done" : "in_progress";
    let next: LessonCourseState;
    if (mode === "course") {
      next = {
        ...prev,
        status,
        section: 0,
        step: 0,
        answers: {},
        lastWrong: wasDone ? prev.lastWrong : null,
        startedAt: Date.now(),
      };
    } else {
      const answers = { ...prev.answers };
      for (const id of answerIds ?? []) delete answers[id];
      next = {
        ...prev,
        status,
        section: typeof section === "number" && section >= 0 ? section : prev.section,
        step: 0,
        answers,
      };
    }
    return { ...cur, [course]: next };
  }, deliveryId ? { id: deliveryId, course } : undefined);
}

/** Seal skip: the gated surface opens, the Home reminder takes over. */
export function skipCourseSeal(userId: string, course: LessonCourseKey, deliveryId?: string): Promise<LessonsState> {
  return mutateLessons(userId, (cur) => {
    if (course === "codex" ? cur.codexSealSkipped : cur.booksSealSkipped) return cur;
    return course === "codex"
      ? { ...cur, codexSealSkipped: true }
      : { ...cur, booksSealSkipped: true };
  }, deliveryId ? { id: deliveryId, course } : undefined);
}

export async function applyLessonDelivery(userId: string, delivery: Extract<import("../types").FrontendToBackend, { type: "lesson_delivery" }>): Promise<LessonsState> {
  if (delivery.ownerUserId !== userId || typeof delivery.id !== "string" || !delivery.id || delivery.id.length > 200) throw new Error("Invalid lesson delivery identity");
  const msg = delivery.message;
  if (!msg || !["lesson_patch", "lesson_complete", "lesson_reset", "lesson_seal_skip"].includes(msg.type)) throw new Error("Invalid lesson delivery");
  const course = msg.course ?? (msg.type === "lesson_seal_skip" ? "books" : undefined);
  if (course !== "books" && course !== "codex") throw new Error("Unknown lesson course");
  if (msg.type === "lesson_patch") return patchLessonCourse(userId, course, msg.patch, delivery.id);
  if (msg.type === "lesson_complete") {
    const grade = ["gilded", "silver", "bronze", "apprentice"].includes(msg.grade) ? msg.grade : "apprentice";
    return completeLessonCourse(userId, course, Number.isFinite(msg.wrong) ? Math.max(0, Math.round(msg.wrong)) : 0,
      Number.isFinite(msg.total) ? Math.max(0, Math.round(msg.total)) : 0, grade, msg.signedName, msg.answers, delivery.id);
  }
  if (msg.type === "lesson_reset") return resetLessonCourse(userId, course, msg.mode, msg.section, msg.answerIds, delivery.id);
  return skipCourseSeal(userId, course, delivery.id);
}

/** The one codex gate. While Course 2 is incomplete (and not skipped) the
 * profile behaves as if the codex is off: no agent runs, no entries, no
 * ghosts. */
export function effectiveProfile(profile: LMBProfile, lessons: LessonsState): LMBProfile {
  if (!codexLessonGated(lessons)) return profile;
  if (!profile.codexEnabled) return profile;
  return { ...profile, codexEnabled: false };
}

export function codexGated(lessons: LessonsState): boolean {
  return codexLessonGated(lessons);
}

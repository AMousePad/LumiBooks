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
    anomalyCb?.(userId, `Memoria couldn't read her lesson register and unsealed the archive: ${describeError(err)}`);
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
    anomalyCb?.(userId, `Memoria couldn't read her lesson register and unsealed the archive: ${describeError(err)}`);
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

async function mutateLessons(userId: string, fn: (cur: LessonsState) => LessonsState): Promise<LessonsState> {
  return withLessonsLock(userId, async () => {
    let cur = await ensureLessons(userId);
    if (failOpenUsers.has(userId)) {
      const real = await tryReadRealLessons(userId);
      if (real) {
        failOpenUsers.delete(userId);
        cur = real;
      }
    }
    const next = fn(cur);
    if (failOpenUsers.has(userId)) {
      cache.set(userId, next);
      warn(`lessons: register still unreadable for ${userId.slice(0, 6)}, keeping the change in memory only`);
      anomalyCb?.(userId, "Memoria couldn't read her lesson register so this change is not saved to disk yet");
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
): Promise<LessonsState> {
  return mutateLessons(userId, (cur) => {
    const prev = cur[course];
    return {
      ...cur,
      [course]: {
        ...prev,
        ...patch,
        answers: patch.answers ? { ...prev.answers, ...patch.answers } : prev.answers,
      },
    };
  });
}

export function completeLessonCourse(
  userId: string,
  course: LessonCourseKey,
  wrong: number,
  total: number,
  grade: LessonCourseState["grade"],
  signedName: string | null,
  answers?: LessonCourseState["answers"],
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
  });
}

export function resetLessonCourse(
  userId: string,
  course: LessonCourseKey,
  mode: "course" | "section",
  section?: number,
  answerIds?: string[],
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
  });
}

/** Seal skip: the gated surface opens, the Home reminder takes over. */
export function skipCourseSeal(userId: string, course: LessonCourseKey): Promise<LessonsState> {
  return mutateLessons(userId, (cur) => {
    if (course === "codex" ? cur.codexSealSkipped : cur.booksSealSkipped) return cur;
    return course === "codex"
      ? { ...cur, codexSealSkipped: true }
      : { ...cur, booksSealSkipped: true };
  });
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

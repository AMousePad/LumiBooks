import type { FrontendToBackend, LessonMutation } from "../types";
import type { LessonsState } from "../shared";
import { newId } from "./uuid";

type Delivery = Extract<FrontendToBackend, { type: "lesson_delivery" }>;
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const isLessonMutation = (value: { type?: string }): value is LessonMutation =>
  ["lesson_patch", "lesson_complete", "lesson_reset", "lesson_seal_skip"].includes(value.type ?? "");

/** Persist before sending and remove only on a matching durable-save ack.
 * The same delivery ID is reused after disconnects and page reloads. */
export class LessonOutbox {
  private userId: string | null = null;
  private queue: Delivery[] = [];
  private confirmed: LessonsState | null = null;
  constructor(private transmit: (message: Delivery) => void, private storage: StoragePort | null, private changed: () => void = () => {}) {}
  get pending(): number { return this.queue.length; }
  private key(): string { return `lumibooks.lesson-outbox.v1:${this.userId}`; }

  setUser(userId: string): void {
    if (this.userId === userId) return;
    this.userId = userId;
    this.queue = [];
    this.confirmed = null;
    try {
      const raw: unknown = JSON.parse(this.storage?.getItem(this.key()) ?? "[]");
      if (Array.isArray(raw)) this.queue = raw.filter((item): item is Delivery =>
        item?.type === "lesson_delivery" && item.ownerUserId === userId && typeof item.id === "string" && item.message && isLessonMutation(item.message));
    } catch { /* An unavailable browser store still permits in-memory retries. */ }
    this.changed();
  }

  private persist(): void {
    if (!this.userId) return;
    try {
      if (this.queue.length) this.storage?.setItem(this.key(), JSON.stringify(this.queue));
      else this.storage?.removeItem(this.key());
    } catch { /* Keep the pending message in memory until the backend saves it. */ }
    this.changed();
  }

  enqueue(message: FrontendToBackend): boolean {
    if (!this.userId || !isLessonMutation(message)) return false;
    this.queue.push({ type: "lesson_delivery", id: newId(), ownerUserId: this.userId, message: structuredClone(message) });
    this.persist();
    if (this.queue.length === 1) this.flush();
    return true;
  }

  flush(): void {
    const first = this.queue[0];
    if (first) try { this.transmit(first); } catch { /* Retry the same delivery after reconnect. */ }
  }

  acknowledge(id: string, userId: string, lessons: LessonsState): boolean {
    if (userId !== this.userId || this.queue[0]?.id !== id) return false;
    this.accept(lessons);
    this.queue.shift();
    this.persist();
    this.flush();
    return true;
  }

  private accept(lessons: LessonsState): LessonsState {
    const next = { ...lessons };
    if (this.confirmed) {
      for (const course of ["books", "codex"] as const) {
        if ((this.confirmed[course].revision ?? 0) > (lessons[course].revision ?? 0)) next[course] = this.confirmed[course];
      }
      next.booksSealSkipped ||= this.confirmed.booksSealSkipped;
      next.codexSealSkipped ||= this.confirmed.codexSealSkipped;
    }
    this.confirmed = next;
    return next;
  }

  overlay(lessons: LessonsState): LessonsState {
    const result = { ...this.accept(lessons) };
    for (const { message } of this.queue) {
      const course = message.course ?? "books";
      const prev = result[course];
      if (message.type === "lesson_complete") {
        result[course] = { ...prev, status: "done", grade: message.grade, lastWrong: message.wrong, lastTotal: message.total,
          signedName: message.signedName, answers: { ...prev.answers, ...message.answers } };
      } else if (message.type === "lesson_patch") {
        result[course] = { ...prev, ...message.patch, status: prev.status === "done" ? "done" : message.patch.status ?? prev.status,
          answers: { ...prev.answers, ...message.patch.answers } };
      } else if (message.type === "lesson_reset") {
        const answers = { ...prev.answers };
        for (const id of message.answerIds ?? []) delete answers[id];
        result[course] = { ...prev, status: prev.status === "done" ? "done" : "in_progress", step: 0,
          section: message.mode === "course" ? 0 : message.section ?? prev.section, answers: message.mode === "course" ? {} : answers };
      } else if (course === "books") result.booksSealSkipped = true;
      else result.codexSealSkipped = true;
    }
    return result;
  }
}

import { afterEach, beforeEach, expect, test } from "bun:test";
import { applyLessonDelivery, ensureLessons, patchLessonCourse } from "./lessons";
import { makeDefaultLessons, normalizeLessons } from "../shared";
import { LessonOutbox } from "../ui/lesson-outbox";
import type { FrontendToBackend } from "../types";

const original = (globalThis as any).spindle;
type Delivery = Extract<FrontendToBackend, { type: "lesson_delivery" }>;
let user = "", serial = 0, saved: any, writes = 0;
const complete = { type: "lesson_complete" as const, course: "codex" as const, wrong: 0, total: 8, grade: "gilded" as const, signedName: "Reader", answers: { c1: "gold" as const } };
beforeEach(() => {
  user = `lesson-delivery-${++serial}`;
  saved = makeDefaultLessons(false); writes = 0;
  (globalThis as any).spindle = { log: { warn() {}, error() {} }, userStorage: {
    async exists() { return true; }, async read() { return JSON.stringify(saved); },
    async setJson(_p: string, value: any) { writes++; saved = structuredClone(value); },
  } };
});
afterEach(() => { (globalThis as any).spindle = original; });

test("a dropped completion and dropped acknowledgement recover after reload without a second attempt", async () => {
  const browser = new Map<string, string>();
  const storage = { getItem: (k: string) => browser.get(k) ?? null, setItem: (k: string, v: string) => { browser.set(k, v); }, removeItem: (k: string) => { browser.delete(k); } };
  const sent: Delivery[] = [];
  const first = new LessonOutbox(msg => sent.push(msg), storage);
  first.setUser(user);
  first.enqueue(complete);
  expect(browser.size).toBe(1);
  expect(first.overlay(saved).codex.status).toBe("done");
  const delivery = sent[0]!;
  first.flush();
  expect(sent[1]).toEqual(delivery);
  await applyLessonDelivery(user, sent[1]!);
  expect(saved.codex.attempts).toBe(1);
  expect(normalizeLessons(saved).codex.deliveryIds).toContain(delivery.id);
  const reloaded = new LessonOutbox(msg => sent.push(msg), storage);
  reloaded.setUser(user); reloaded.flush();
  const ack = await applyLessonDelivery(user, sent.at(-1)!);
  expect(ack.codex.attempts).toBe(1);
  expect(writes).toBe(1);
  expect(reloaded.acknowledge(delivery.id, user, ack)).toBe(true);
  expect(browser.size).toBe(0);
  expect(reloaded.pending).toBe(0);
  expect(reloaded.overlay(makeDefaultLessons(false)).codex.status).toBe("done");
});

test("progress is ordered before completion and stale patches cannot revoke graduation", async () => {
  const sent: Delivery[] = [];
  const outbox = new LessonOutbox(msg => sent.push(msg), null);
  outbox.setUser(user);
  outbox.enqueue({ type: "lesson_patch", course: "codex", patch: { status: "in_progress", section: 3, answers: { c1: "gold" } } });
  outbox.enqueue(complete);
  expect(sent).toHaveLength(1);
  outbox.acknowledge(sent[0]!.id, user, await applyLessonDelivery(user, sent[0]!));
  expect(sent).toHaveLength(2);
  outbox.acknowledge(sent[1]!.id, user, await applyLessonDelivery(user, sent[1]!));
  expect(saved.codex.section).toBe(3);
  expect(saved.codex.attempts).toBe(1);
  expect((await patchLessonCourse(user, "codex", { status: "in_progress" })).codex.status).toBe("done");
});

test("duplicate concurrent deliveries are idempotent and failed writes stay retryable", async () => {
  const delivery: Delivery = { type: "lesson_delivery", id: "retry", ownerUserId: user, message: complete };
  const store = (globalThis as any).spindle.userStorage, write = store.setJson;
  store.setJson = async () => { throw new Error("disk unavailable"); };
  await expect(applyLessonDelivery(user, delivery)).rejects.toThrow("disk unavailable");
  expect((await ensureLessons(user)).codex.status).toBe("todo");
  store.setJson = write;
  const results = await Promise.all([applyLessonDelivery(user, delivery), applyLessonDelivery(user, delivery)]);
  expect(results.every(result => result.codex.attempts === 1)).toBe(true);
  expect(writes).toBe(1);
});

test("pending tutorial saves cannot cross accounts or acknowledge unrelated deliveries", async () => {
  const sent: Delivery[] = [];
  const outbox = new LessonOutbox(msg => sent.push(msg), null);
  outbox.setUser(user); outbox.enqueue(complete);
  expect(outbox.acknowledge("other", user, saved)).toBe(false);
  expect(outbox.acknowledge(sent[0]!.id, "another-user", saved)).toBe(false);
  await expect(applyLessonDelivery("another-user", sent[0]!)).rejects.toThrow("identity");
  outbox.setUser("another-user"); outbox.flush();
  expect(sent).toHaveLength(1);
  expect(outbox.overlay(makeDefaultLessons(false)).codex.status).toBe("todo");
});

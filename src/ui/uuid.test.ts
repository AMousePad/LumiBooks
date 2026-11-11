import { afterEach, expect, test } from "bun:test";
import { bindHostUuid, newId } from "./uuid";
import { LessonOutbox } from "./lesson-outbox";

afterEach(() => bindHostUuid({}));

function withoutCrypto(run: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto")!;
  Object.defineProperty(globalThis, "crypto", { configurable: true, get() { throw new Error("crypto is blocked"); } });
  try { run(); } finally { Object.defineProperty(globalThis, "crypto", descriptor); }
}

test("IDs come from the host when it provides ctx.uuid", () => {
  bindHostUuid({ uuid: { v4: () => "host-id", v7: () => "unused" } });
  withoutCrypto(() => expect(newId()).toBe("host-id"));
});

test("older hosts get unique IDs without touching crypto", () => {
  withoutCrypto(() => {
    const ids = new Set(Array.from({ length: 200 }, newId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(200);
  });
});

test("lesson deliveries take their ID from the host without touching crypto", () => {
  bindHostUuid({ uuid: { v4: () => "host-id", v7: () => "unused" } });
  withoutCrypto(() => {
    const sent: { id: string }[] = [];
    const outbox = new LessonOutbox(message => sent.push(message), null);
    outbox.setUser("user");
    expect(outbox.enqueue({ type: "lesson_reset", course: "codex" } as any)).toBe(true);
    expect(sent[0]!.id).toBe("host-id");
  });
});

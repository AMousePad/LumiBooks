import { expect, test } from "bun:test";
import { createUiDiagnostics, isOwnUiError, uiErrorCode } from "./diagnostics";
import { projectUiDiagnostic, UI_BATCH_LIMIT } from "../frontend-diagnostics";

test("repeated events aggregate, strip arbitrary text, and keep their original chat", () => {
  const sent: any[] = [];
  let chatId = "first-chat", clock = 100;
  const log = createUiDiagnostics({ send: (m) => { sent.push(m); }, context: () => ({ chatId, view: "tuning" }), now: () => clock });
  try {
    for (let i = 0; i < 1000; i++) log.record("error", { code: "TypeError", op: "tuning.settings.codex", message: "PRIVATE CHAT", stack: "SECRET URL" } as any);
    clock = 200; log.record("error", { code: "TypeError", op: "tuning.settings.codex" });
    chatId = "second-chat"; log.record("view"); log.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0].rows).toHaveLength(2);
    expect(sent[0].rows[0]).toMatchObject({ chatId: "first-chat", count: 1001, first: 100, last: 200, code: "TypeError" });
    expect(sent[0].rows[1].chatId).toBe("second-chat");
    expect(JSON.stringify(sent)).not.toMatch(/PRIVATE|SECRET/);
  } finally { log.dispose(); }
});

test("floods and disconnected bridges retain a bounded queue with lost-event counts", () => {
  let fail = true;
  const sent: any[] = [];
  const log = createUiDiagnostics({ send(m) { if (fail) throw new Error("private backend response"); sent.push(m); }, context: () => ({ view: "codex" }) });
  try {
    for (let line = 0; line < 10000; line++) log.record("render", { line });
    log.record("error", { code: "TypeError", line: 999999 });
    log.flush();
    fail = false; log.flush();
    expect(sent[0].rows).toHaveLength(UI_BATCH_LIMIT);
    expect(sent[0].rows.find((r: any) => r.kind === "error").code).toBe("TypeError");
    expect(sent[0].rows.reduce((n: number, r: any) => n + r.count, 0)).toBe(10001);
    expect(JSON.stringify(sent)).not.toContain("private backend");
  } finally { log.dispose(); }
});

test("opt-out and clear discard pending events; disposal prevents later sends", async () => {
  const sent: any[] = [];
  const log = createUiDiagnostics({ send: (m) => { sent.push(m); }, context: () => ({ view: "home" }), delay: 1 });
  log.record("error"); log.setEnabled(false); log.record("error"); log.flush();
  expect(sent).toHaveLength(0);
  log.setEnabled(true); log.record("click"); log.clear(); log.flush();
  expect(sent).toHaveLength(0);
  log.record("view");
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(sent).toHaveLength(1);
  log.dispose();
  const count = sent.length;
  log.record("error"); log.flush(); log.setEnabled(true);
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(sent).toHaveLength(count);
});

test("events recorded synchronously by a bridge callback survive the current flush", () => {
  const sent: any[] = [];
  const log = createUiDiagnostics({ send(m) {
    sent.push(m);
    if (sent.length === 1) { log.record("error", { code: "TypeError" }); log.record("receive"); log.flush(); }
  }, context: () => ({ view: "codex" }) });
  try {
    log.record("error", { code: "TypeError" }); log.flush(); log.flush();
    expect(sent).toHaveLength(2);
    expect(sent[1].rows).toHaveLength(2);
    expect(sent.flatMap((m) => m.rows).reduce((n, row) => n + row.count, 0)).toBe(3);
  } finally { log.dispose(); }
});

test("only owned bundle errors are attributed, and custom names cannot enter exports", () => {
  const source = "blob:https://host.test/owned";
  const own = new TypeError("PRIVATE CHAT"); own.stack = `TypeError: PRIVATE CHAT\n at render (${source}:4:8)`;
  expect(isOwnUiError(own, undefined, source)).toBe(true);
  expect(uiErrorCode(own)).toBe("TypeError");
  const host = new Error("PRIVATE CHAT"); host.stack = "Error: PRIVATE CHAT\n at host (https://host.test/app.js:4:8)";
  expect(isOwnUiError(host, undefined, source)).toBe(false);
  host.name = "SECRET CHARACTER";
  expect(uiErrorCode(host)).toBe("unknown");
  expect(projectUiDiagnostic({ kind: "error", view: "codex", code: host.name, op: "PRIVATE CHAT", count: Infinity, line: -1, caps: 99 })).toMatchObject({ count: 1, code: undefined, op: undefined, line: undefined, caps: undefined });
  expect(projectUiDiagnostic({ kind: "PRIVATE CHAT", view: "codex" })).toBeNull();
});

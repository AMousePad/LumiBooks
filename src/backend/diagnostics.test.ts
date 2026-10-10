import { afterAll, beforeEach, expect, test } from "bun:test";
import { captureDiagnosticSnapshot, clearDiagnostics, diagnosticErrorReason, DIAGNOSTICS_MAX_BYTES, DIAGNOSTICS_PATH, exportDiagnostics, recordDiagnostic } from "./diagnostics";
import { DEFAULT_SETTINGS, normalizeSettings, SETTINGS_PATH } from "../shared";
import { patchSettings } from "./storage";

const original = (globalThis as any).spindle;
let disk: Map<string, any>;
let diskBytes: Map<string, number>;
const key = (user: string) => `${user}/${DIAGNOSTICS_PATH}`;
beforeEach(() => {
  disk = new Map();
  diskBytes = new Map();
  (globalThis as any).spindle = { userStorage: {
    async exists(path: string, userId: string) { return disk.has(`${userId}/${path}`); },
    async read(path: string, userId: string) { return JSON.stringify(disk.get(`${userId}/${path}`)); },
    async getJson(path: string, opts: any) { return structuredClone(disk.get(`${opts.userId}/${path}`) ?? opts.fallback); },
    async setJson(path: string, value: any, opts: any) {
      const serialized = JSON.stringify(value, null, opts?.indent ?? 2);
      diskBytes.set(`${opts.userId}/${path}`, new TextEncoder().encode(serialized).length);
      disk.set(`${opts.userId}/${path}`, JSON.parse(serialized));
    },
  } };
});
afterAll(() => { (globalThis as any).spindle = original; });

test("local logging defaults on and respects persisted per-account opt-out, clear and re-enable", async () => {
  expect(normalizeSettings({}).localLogsDisabled).toBe(false);
  disk.set(`opt-out-user/${SETTINGS_PATH}`, { ...DEFAULT_SETTINGS, localLogsDisabled: true });
  const input = { event: "operation" as const, chatId: "chat" };
  await recordDiagnostic("opt-out-user", input);
  expect(disk.has(key("opt-out-user"))).toBe(false);
  await recordDiagnostic("other-user", input);
  expect(JSON.parse(await exportDiagnostics("other-user")).events).toHaveLength(1);
  await patchSettings("opt-out-user", { localLogsDisabled: false });
  await recordDiagnostic("opt-out-user", input);
  const saved = JSON.stringify(disk.get(key("opt-out-user")));
  await patchSettings("opt-out-user", { localLogsDisabled: true });
  await recordDiagnostic("opt-out-user", input);
  let snapshotReads = 0;
  (globalThis as any).spindle.chats = { get() { snapshotReads++; throw new Error("Must not inspect chat while opted out"); } };
  await captureDiagnosticSnapshot("opt-out-user", "chat");
  expect(snapshotReads).toBe(0);
  expect(JSON.stringify(disk.get(key("opt-out-user")))).toBe(saved);
  expect(JSON.parse(await exportDiagnostics("opt-out-user")).events).toHaveLength(1);
  await clearDiagnostics("opt-out-user");
  await recordDiagnostic("opt-out-user", input);
  expect(JSON.parse(await exportDiagnostics("opt-out-user")).events).toEqual([]);
  expect(disk.get(`opt-out-user/${SETTINGS_PATH}`).localLogsDisabled).toBe(true);
  await patchSettings("opt-out-user", { localLogsDisabled: false });
  await recordDiagnostic("opt-out-user", input);
  expect(JSON.parse(await exportDiagnostics("opt-out-user")).events).toHaveLength(1);
});

test("failure categories never use provider text or arbitrary error names", () => {
  const error = new Error("PRIVATE_RESPONSE");
  error.name = "PRIVATE_CHARACTER_NAME";
  expect(diagnosticErrorReason(error)).toBe("unknown");
  error.name = "CodexContextError";
  expect(diagnosticErrorReason(error)).toBe("context_limit");
  error.name = "AbortedSummarizerError";
  expect(diagnosticErrorReason(error)).toBe("cancelled");
  expect(diagnosticErrorReason("PRIVATE_RESPONSE")).toBe("unknown");
});

test("writer and exporter allow only structural fields, including nested hostile values", async () => {
  const secret = "PRIVATE_CHAT_REASONING_NAME_API_KEY";
  await recordDiagnostic("privacy-user", {
    event: "context", chatId: "real-chat-id", entryId: "real-entry-id", replacesEntryId: "real-entry-id", content: secret, name: secret,
    error: secret, reason: secret, model: secret, prompt: secret, token: secret, mode: secret,
    numbers: { total: 12, output: secret, extra: secret, selected: NaN }, flags: { ghost: false, active: secret },
    messages: [{ id: "real-message-id", index: 55, position: 50, coveredBy: "real-entry-id", content: secret, metadata: { secret }, selected: true }],
    entries: [{ id: "real-entry-id", tier: 1, messages: ["real-message-id"], sources: [], title: secret, raw: { content: secret }, first: 55, last: 66 }],
  } as any);
  const saved = JSON.stringify(disk.get(key("privacy-user")));
  const output = await exportDiagnostics("privacy-user");
  for (const text of [secret, "real-chat-id", "real-entry-id", "real-message-id"]) { expect(saved).not.toContain(text); expect(output).not.toContain(text); }
  expect(output).not.toContain(disk.get(key("privacy-user")).salt);
  const [event] = JSON.parse(output).events;
  expect(event.entryId).toBe(event.replacesEntryId);
  expect(event.messages[0].coveredBy).toBe(event.entryId);
  expect(event.messages[0].id).toBe(event.entries[0].messages[0]);
  expect(event.messages[0].index).toBe(55);
  expect(event.messages[0].position).toBe(50);
  expect(event.reason).toBeUndefined();
  expect(event.mode).toBeUndefined();
  expect(event.numbers).toEqual({ total: 12 });
});

test("pseudonyms persist across reads, differ per account, and reset on clear", async () => {
  const input = { event: "operation" as const, chatId: "same-chat", outcome: "started" as const };
  await recordDiagnostic("account-a", input);
  const a = JSON.parse(await exportDiagnostics("account-a")).events[0].chatId;
  await recordDiagnostic("account-a", input);
  expect(JSON.parse(await exportDiagnostics("account-a")).events[1].chatId).toBe(a);
  await recordDiagnostic("account-b", input);
  expect(JSON.parse(await exportDiagnostics("account-b")).events[0].chatId).not.toBe(a);
  await clearDiagnostics("account-a");
  expect(JSON.parse(await exportDiagnostics("account-a")).events).toEqual([]);
  await recordDiagnostic("account-a", input);
  expect(JSON.parse(await exportDiagnostics("account-a")).events[0].chatId).not.toBe(a);
});

test("export revalidates saved records instead of trusting arbitrary disk text", async () => {
  await recordDiagnostic("disk-user", { event: "operation", chatId: "chat" });
  const store = disk.get(key("disk-user"));
  store.events[0].prompt = "LEAKED_HISTORY";
  store.events[0].reason = "LEAKED_HISTORY";
  store.events[0].numbers = { total: "LEAKED_HISTORY" };
  store.events[0].messages = [{ id: "LEAKED_HISTORY", index: 1 }];
  store.events.push({ event: "LEAKED_HISTORY", chatId: store.events[0].chatId });
  const output = await exportDiagnostics("disk-user");
  expect(output).not.toContain("LEAKED_HISTORY");
  expect(JSON.parse(output).events).toHaveLength(1);
});

test("retention has no event-count cap and bounds compact disk/export bytes", async () => {
  await recordDiagnostic("bounded-user", { event: "operation", chatId: "chat" });
  const store = disk.get(key("bounded-user"));
  const row = store.events[0];
  store.events = Array.from({ length: 20_000 }, (_, i) => ({ ...row, seq: i + 1 }));
  store.next = store.events.length + 1;
  await recordDiagnostic("bounded-user", { event: "operation", chatId: "chat" });
  let report = JSON.parse(await exportDiagnostics("bounded-user"));
  expect(report.events).toHaveLength(20_001);
  expect(report.droppedEvents).toBe(0);
  expect(report.maxEvents).toBeUndefined();
  expect(report.maxBytes).toBe(10_000_000);
  const large = disk.get(key("bounded-user"));
  large.events = Array.from({ length: 80 }, (_, i) => ({ ...row, seq: i + 1,
    messages: Array.from({ length: 2000 }, (_, n) => ({ id: row.chatId, index: n, position: n, selected: false })) }));
  await recordDiagnostic("bounded-user", { event: "snapshot", chatId: "chat", messages: Array.from({ length: 4200 }, (_, n) => ({ id: "same-message", index: n })) });
  expect(new TextEncoder().encode(JSON.stringify(disk.get(key("bounded-user")))).length).toBeLessThanOrEqual(DIAGNOSTICS_MAX_BYTES);
  expect(diskBytes.get(key("bounded-user"))).toBeLessThanOrEqual(DIAGNOSTICS_MAX_BYTES);
  const output = await exportDiagnostics("bounded-user");
  expect(new TextEncoder().encode(output).length).toBeLessThanOrEqual(DIAGNOSTICS_MAX_BYTES);
  expect(output).toBe(JSON.stringify(JSON.parse(output)));
  report = JSON.parse(output);
  expect(report.events.at(-1).truncated).toBe(true);
  expect(report.events.at(-1).messages.length).toBeLessThanOrEqual(4096);
  expect(report.droppedEvents).toBeGreaterThan(0);
  expect(report.events[0].seq).toBe(report.droppedEvents + 1);
  // One more evicted event would exceed the budget: byte capacity is used fully.
  const evicted = large.events[report.droppedEvents - 1];
  expect(new TextEncoder().encode(output).length + new TextEncoder().encode(JSON.stringify(evicted)).length + 1).toBeGreaterThan(DIAGNOSTICS_MAX_BYTES);
});

test("clear serializes with pending records and later events use a new salt", async () => {
  const first = recordDiagnostic("race-user", { event: "operation", chatId: "old" });
  const clear = clearDiagnostics("race-user");
  const after = recordDiagnostic("race-user", { event: "commit", chatId: "new" });
  await Promise.all([first, clear, after]);
  const events = JSON.parse(await exportDiagnostics("race-user")).events;
  expect(events.map((e: any) => e.event)).toEqual(["commit"]);
  expect(events[0].seq).toBe(1);
});

test("storage failures never reject logging or export raw exception text", async () => {
  const storage = (globalThis as any).spindle.userStorage;
  const save = storage.setJson;
  storage.setJson = async () => { throw new Error("SECRET_SERVER_RESPONSE_WITH_CHAT_TEXT"); };
  await expect(recordDiagnostic("failure-user", { event: "operation", chatId: "chat" })).resolves.toBeUndefined();
  storage.setJson = save;
  const output = await exportDiagnostics("failure-user");
  expect(JSON.parse(output).writeFailuresThisSession).toBe(1);
  expect(output).not.toContain("SECRET_SERVER_RESPONSE");
});

test("queued diagnostics have a fixed cap under a blocked storage write", async () => {
  const storage = (globalThis as any).spindle.userStorage;
  const save = storage.setJson;
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  storage.setJson = async (...args: any[]) => { await gate; await save(...args); };
  const jobs = Array.from({ length: 100 }, () => recordDiagnostic("queue-user", { event: "operation", chatId: "chat" }));
  release();
  await Promise.all(jobs);
  const report = JSON.parse(await exportDiagnostics("queue-user"));
  expect(report.events).toHaveLength(64);
  expect(report.queueDropsThisSession).toBe(36);
});

import { afterEach, beforeEach, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, makeDefaultProfile, STORAGE_VERSION } from "../shared";
import { loadSettings, patchSettings, saveSettings } from "./storage";

const original = (globalThis as any).spindle;
let serial = 0, user: string, disk: any;
beforeEach(() => {
  user = `settings-race-${++serial}`;
  disk = { ...DEFAULT_SETTINGS, profiles: [makeDefaultProfile("p")], activeProfileId: "p" };
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    userStorage: {
      async exists() { return true; },
      async read() { return JSON.stringify(disk); },
      async setJson(_path: string, value: any) { disk = structuredClone(value); },
    },
  };
});
afterEach(() => { (globalThis as any).spindle = original; });

test("a migration cannot overwrite settings saved while its disk write is pending", async () => {
  disk.version = STORAGE_VERSION - 1;
  let entered!: () => void, release!: () => void, first = true;
  const writing = new Promise<void>((resolve) => { entered = resolve; });
  const paused = new Promise<void>((resolve) => { release = resolve; });
  const api = (globalThis as any).spindle.userStorage, write = api.setJson;
  api.setJson = async (...args: any[]) => {
    if (first) { first = false; entered(); await paused; }
    return write(...args);
  };
  const loading = loadSettings(user);
  await writing;
  const next = { ...DEFAULT_SETTINGS, profiles: [makeDefaultProfile("new")], activeProfileId: "new", localLogsDisabled: true };
  const saving = saveSettings(user, next);
  await new Promise((resolve) => setTimeout(resolve, 0));
  release();
  await Promise.all([loading, saving]);
  expect(disk.activeProfileId).toBe("new");
  expect(disk.localLogsDisabled).toBe(true);
  expect((await loadSettings(user)).activeProfileId).toBe("new");
});

test("a delayed settings read cannot overwrite a same-millisecond save in the cache", async () => {
  let entered!: () => void, release!: () => void;
  const reading = new Promise<void>((resolve) => { entered = resolve; });
  const paused = new Promise<void>((resolve) => { release = resolve; });
  (globalThis as any).spindle.userStorage.read = async () => { const snapshot = JSON.stringify(disk); entered(); await paused; return snapshot; };
  const now = Date.now; Date.now = () => 1234567;
  try {
    const loading = loadSettings(user);
    await reading;
    const saving = saveSettings(user, { ...disk, localLogsDisabled: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    release();
    await Promise.all([loading, saving]);
    expect((await loadSettings(user)).localLogsDisabled).toBe(true);
    expect((await patchSettings(user, { enabled: false })).localLogsDisabled).toBe(true);
    expect(disk.localLogsDisabled).toBe(true);
  } finally { Date.now = now; release(); }
});

test("a patch can migrate an old settings file without deadlocking", async () => {
  disk.version = STORAGE_VERSION - 1;
  expect((await patchSettings(user, { localLogsDisabled: true })).localLogsDisabled).toBe(true);
  expect(disk.version).toBe(STORAGE_VERSION);
});

test("a failed settings write leaves the last saved values available for retry", async () => {
  await loadSettings(user);
  const api = (globalThis as any).spindle.userStorage, write = api.setJson;
  api.setJson = async () => { throw new Error("write unavailable"); };
  await expect(patchSettings(user, { localLogsDisabled: true })).rejects.toThrow("write unavailable");
  expect((await loadSettings(user)).localLogsDisabled).toBe(false);
  expect(disk.localLogsDisabled).toBe(false);
  api.setJson = write;
  expect((await patchSettings(user, { localLogsDisabled: true })).localLogsDisabled).toBe(true);
  expect(disk.localLogsDisabled).toBe(true);
});

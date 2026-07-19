declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { LMBSettings } from "../shared";
import { SETTINGS_PATH, STORAGE_VERSION, diskVersionFor, normalizeSettings } from "../shared";
import { describeError, warn } from "./runtime";

const warnedNewerForUser = new Set<string>();
const writeLocks = new Map<string, Promise<unknown>>();

/** All writes flow through this module, so the TTL only bounds external edits. */
const SETTINGS_CACHE_TTL_MS = 2000;
const settingsCache = new Map<string, { at: number; data: LMBSettings }>();

function cacheSettings(userId: string, data: LMBSettings): void {
  settingsCache.set(userId, { at: Date.now(), data });
}

function withSettingsLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(userId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  writeLocks.set(userId, next.catch(() => {}));
  return next;
}

/** Dedups the first burst of concurrent loads while the one-time write runs. */
const migrationInflight = new Map<string, Promise<LMBSettings>>();

/** One-time default flips for older settings files (v4: thorough + extra
 * context on; v5: codex window 30 -> 20; v6: codex tool calls off). Lock-free:
 * mutateSettings calls loadSettings while holding the settings lock, taking
 * it here would deadlock. */
function migrateSettings(userId: string, raw: Partial<LMBSettings>, fromVersion: number): Promise<LMBSettings> {
  const running = migrationInflight.get(userId);
  if (running) return running;
  const p = (async () => {
    const started = Date.now();
    const flipped: Partial<LMBSettings> = {
      ...raw,
      profiles: (Array.isArray(raw.profiles) ? raw.profiles : []).map((prof) => {
        const next = { ...prof };
        if (fromVersion < 4) {
          next.codexThorough = true;
          next.codexExtraContext = true;
        }
        if (fromVersion < 5
          && (next.codexWindowUnit === "messages" || next.codexWindowUnit === undefined)
          && next.codexWindowValue === 30) {
          next.codexWindowValue = 20;
        }
        if (fromVersion < 6) {
          next.codexUseTools = false;
        }
        return next;
      }),
    };
    const normalized = normalizeSettings(flipped);
    try {
      await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
      warn(`settings migrated v${fromVersion} -> v${STORAGE_VERSION}`);
    } catch (err) {
      // The flip still applies in memory; the old on-disk version means the
      // next uncached load retries this write.
      warn(`settings v${STORAGE_VERSION} migration write failed, will retry: ${describeError(err)}`);
    }
    // Same freshness guard as loadSettings: a locked save that landed while
    // this ran must not be shadowed by the migration payload.
    const cur = settingsCache.get(userId);
    if (!cur || cur.at <= started) cacheSettings(userId, normalized);
    return normalized;
  })().finally(() => migrationInflight.delete(userId));
  migrationInflight.set(userId, p);
  return p;
}

export async function loadSettings(userId: string): Promise<LMBSettings> {
  const cached = settingsCache.get(userId);
  if (cached && Date.now() - cached.at < SETTINGS_CACHE_TTL_MS) return cached.data;
  const started = Date.now();
  // Transport faults propagate: a locked mutation reading defaults here would
  // persist them over the user's file. Corrupt JSON is deterministic and
  // falls back to defaults so the next save can recover the install.
  const exists = await spindle.userStorage.exists(SETTINGS_PATH, userId);
  let raw: Partial<LMBSettings> | null = null;
  if (exists) {
    const text = await spindle.userStorage.read(SETTINGS_PATH, userId);
    try {
      raw = JSON.parse(text) as Partial<LMBSettings>;
    } catch (err) {
      warn(`settings.json is corrupt, using defaults until the next save: ${describeError(err)}`);
      raw = null;
    }
  }
  const diskVersion = diskVersionFor(raw);
  if (diskVersion > STORAGE_VERSION && !warnedNewerForUser.has(userId)) {
    warnedNewerForUser.add(userId);
    warn(`settings on disk are v${diskVersion}, this build understands v${STORAGE_VERSION}`);
  }
  // An older readable file gets its one-time flips applied and re-stamped.
  // Absent and corrupt files skip this: defaults already carry the current
  // version, and a corrupt file stays inspectable on disk until the next
  // real save.
  if (raw && diskVersion < STORAGE_VERSION) {
    return migrateSettings(userId, raw, diskVersion);
  }
  const normalized = normalizeSettings(raw);
  const cur = settingsCache.get(userId);
  if (!cur || cur.at <= started) cacheSettings(userId, normalized);
  return normalized;
}

export async function saveSettings(userId: string, next: LMBSettings): Promise<LMBSettings> {
  return withSettingsLock(userId, async () => {
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}

export async function patchSettings(userId: string, patch: Partial<LMBSettings>): Promise<LMBSettings> {
  return withSettingsLock(userId, async () => {
    const current = await loadSettings(userId);
    const next = { ...current, ...patch };
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}

export async function mutateSettings(
  userId: string,
  fn: (current: LMBSettings) => LMBSettings | Promise<LMBSettings>,
): Promise<LMBSettings> {
  return withSettingsLock(userId, async () => {
    const current = await loadSettings(userId);
    const next = await fn(current);
    const normalized = normalizeSettings(next);
    await spindle.userStorage.setJson(SETTINGS_PATH, normalized, { indent: 2, userId });
    cacheSettings(userId, normalized);
    return normalized;
  });
}

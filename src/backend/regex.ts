declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { RegexScriptDTO } from "lumiverse-spindle-types";
import type { RegexScriptOption, RegexScriptPage } from "../types";
import { t as tr } from "../i18n";
import { describeError, warn } from "./runtime";

const TTL_MS = 5_000;
const PAGE_LIMIT = 50;
const CACHE_LIMIT = 500;
const cachedScripts = new Map<string, { userId: string; at: number; script: RegexScriptDTO | null }>();
const SEARCH_TTL_MS = 60_000;
const SEARCH_PAGE_LIMIT = 200;
type SearchProgress = { scanned: number; total: number };
interface SearchIndex {
  rows: RegexScriptOption[];
  at: number;
  invalidated: boolean;
  progress: SearchProgress;
  listeners: Set<(progress: SearchProgress) => void>;
  ready: Promise<void>;
}
const searchIndexes = new Map<string, SearchIndex>();

export async function listRegexScriptsPage(userId: string, requestedOffset: number,
  query = "", onProgress?: (progress: SearchProgress) => void, refresh = false): Promise<RegexScriptPage> {
  const offset = Number.isSafeInteger(requestedOffset) && requestedOffset >= 0
    ? Math.floor(requestedOffset / PAGE_LIMIT) * PAGE_LIMIT : 0;
  const needle = typeof query === "string" ? query.trim().toLowerCase() : "";
  if (refresh) invalidateRegexCache(userId);
  if (needle) {
    const rows = await searchIndex(userId, onProgress);
    const matches = rows.filter((row) => row.name.toLowerCase().includes(needle));
    return { scripts: matches.slice(offset, offset + PAGE_LIMIT), total: matches.length, offset, limit: PAGE_LIMIT };
  }
  const page = await spindle.regex_scripts.list({ userId, limit: PAGE_LIMIT, offset });
  return { scripts: page.data.map(({ id, name }) => ({ id, name })), total: page.total, offset, limit: PAGE_LIMIT };
}

/** The host has no search filter. Scan only on a search, sharing the scan
 * across queries and keeping names/IDs rather than complete regex scripts. */
async function searchIndex(userId: string, onProgress?: (progress: SearchProgress) => void): Promise<RegexScriptOption[]> {
  let index = searchIndexes.get(userId);
  if (!index || (index.at && Date.now() - index.at >= SEARCH_TTL_MS)) {
    index = { rows: [], at: 0, invalidated: false, progress: { scanned: 0, total: 0 }, listeners: new Set(), ready: Promise.resolve() };
    const current = index;
    searchIndexes.delete(userId);
    searchIndexes.set(userId, current);
    while (searchIndexes.size > 8) searchIndexes.delete(searchIndexes.keys().next().value!);
    current.ready = (async () => {
      let offset = 0;
      try {
        while (true) {
          const page = await spindle.regex_scripts.list({ userId, limit: SEARCH_PAGE_LIMIT, offset });
          if (current.invalidated) throw new Error(tr("backend.regex.searchChanged"));
          current.rows.push(...page.data.map(({ id, name }) => ({ id, name })));
          offset += page.data.length;
          current.progress = { scanned: offset, total: page.total };
          for (const listener of current.listeners) {
            try { listener(current.progress); } catch { /* Progress delivery cannot fail a search. */ }
          }
          if (offset >= page.total || page.data.length === 0) break;
        }
        current.at = Date.now();
      } catch (err) {
        if (searchIndexes.get(userId) === current) searchIndexes.delete(userId);
        throw err;
      }
    })();
  }
  if (onProgress) index.listeners.add(onProgress);
  try {
    if (onProgress && index.progress.scanned) {
      try { onProgress(index.progress); } catch { /* Ignore disconnected viewers. */ }
    }
    await index.ready;
    if (index.invalidated) throw new Error(tr("backend.regex.searchChanged"));
    return index.rows;
  } finally {
    if (onProgress) index.listeners.delete(onProgress);
  }
}

export function invalidateRegexCache(userId?: string): void {
  if (!userId) {
    cachedScripts.clear();
    for (const index of searchIndexes.values()) index.invalidated = true;
    searchIndexes.clear();
  } else {
    for (const [key, value] of cachedScripts) if (value.userId === userId) cachedScripts.delete(key);
    const index = searchIndexes.get(userId);
    if (index) index.invalidated = true;
    searchIndexes.delete(userId);
  }
}

async function getScript(userId: string, id: string): Promise<RegexScriptDTO | null> {
  const key = JSON.stringify([userId, id]);
  const cached = cachedScripts.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.script;
  const script = await spindle.regex_scripts.get(id, userId);
  cachedScripts.delete(key);
  cachedScripts.set(key, { userId, at: Date.now(), script });
  while (cachedScripts.size > CACHE_LIMIT) cachedScripts.delete(cachedScripts.keys().next().value!);
  return script;
}

export async function applySelectedRegex(text: string, scriptIds: string[], userId: string): Promise<string> {
  if (!scriptIds.length) return text;
  let out = text;
  for (const id of scriptIds) {
    const script = await getScript(userId, id);
    if (!script) continue;
    out = runScript(out, script);
  }
  return out;
}

const REGEX_INPUT_MAX_CHARS = 500_000;

function runScript(input: string, script: RegexScriptDTO): string {
  const pattern = script.find_regex;
  const replace = script.replace_string ?? "";
  if (!pattern) return input;
  if (input.length > REGEX_INPUT_MAX_CHARS) {
    warn(`regex script ${script.id} skipped: input too long (${input.length} chars)`);
    return input;
  }
  try {
    const flags = script.flags && script.flags.length > 0 ? script.flags : "g";
    const re = new RegExp(pattern, flags);
    return input.replace(re, replace);
  } catch (err) {
    warn(`regex script ${script.id} failed: ${describeError(err)}`);
    return input;
  }
}

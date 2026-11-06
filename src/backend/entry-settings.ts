import { loadSettings } from "./storage";
import { describeError } from "./runtime";
import { applySummaryActivation } from "./world-book";
import { codexSettingsStamp, readCodexSettingsStamp, syncCodexChatSettings } from "./codex/sync";
import { invalidateCodexInjectionCache } from "./codex";

const KNOWN_CAP = 5000;
const known = new Map<string, string>();
const queues = new Map<string, Promise<unknown>>();

export type ChatEntrySettingsResult = { summaryFailed: number; codexError: string | null };

const keyFor = (userId: string, chatId: string) => `${userId}\n${chatId}`;

export function ensureChatEntrySettings(userId: string, chatId: string): Promise<ChatEntrySettingsResult> {
  const key = keyFor(userId, chatId);
  // Queued behind earlier runs so a settings change made mid-run is applied by this one.
  const run = (queues.get(key) ?? Promise.resolve()).then(() => undefined, () => undefined).then(() => reconcile(userId, chatId, key));
  queues.set(key, run);
  const clear = () => { if (queues.get(key) === run) queues.delete(key); };
  run.then(clear, clear);
  return run;
}

export function forgetChatEntrySettings(userId: string, chatId: string): void {
  known.delete(keyFor(userId, chatId));
}

async function reconcile(userId: string, chatId: string, key: string): Promise<ChatEntrySettingsResult> {
  const settings = await loadSettings(userId);
  const codexStamp = codexSettingsStamp(settings);
  const stamp = `${settings.summaryActivationMode}\n${codexStamp}`;
  if (known.get(key) === stamp) return { summaryFailed: 0, codexError: null };
  const { failed } = await applySummaryActivation(chatId, userId);
  let codexError: string | null = null;
  try {
    if ((await readCodexSettingsStamp(chatId, userId)) !== codexStamp) {
      await syncCodexChatSettings(chatId, userId);
      invalidateCodexInjectionCache(chatId, false);
    }
  } catch (err) {
    codexError = describeError(err);
  }
  if (failed === 0 && codexError === null) remember(key, stamp);
  return { summaryFailed: failed, codexError };
}

function remember(key: string, stamp: string): void {
  known.delete(key);
  known.set(key, stamp);
  while (known.size > KNOWN_CAP) {
    const oldest = known.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    known.delete(oldest);
  }
}

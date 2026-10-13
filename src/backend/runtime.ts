import { t as tr } from "../i18n";
declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import type { BackendToFrontend, FrontendToBackend } from "../types";
import { CHAT_STATE_DIR } from "../shared";

let lastFrontendUserId: string | null = null;
const CHAT_USER_MAP_CAP = 2000;
const chatUserIds = new Map<string, string>();

export function setLastFrontendUserId(userId: string): void {
  lastFrontendUserId = userId;
}

export function getLastFrontendUserId(): string | null {
  return lastFrontendUserId;
}

export function rememberChatUser(chatId: string | null | undefined, userId: string | null | undefined): void {
  if (!chatId || !userId) return;
  if (chatUserIds.has(chatId)) {
    chatUserIds.delete(chatId);
  } else if (chatUserIds.size >= CHAT_USER_MAP_CAP) {
    const oldestKey = chatUserIds.keys().next().value;
    if (oldestKey !== undefined) chatUserIds.delete(oldestKey);
  }
  chatUserIds.set(chatId, userId);
}

export function resolveUserId(chatId?: string | null): string | null {
  if (chatId) {
    const mapped = chatUserIds.get(chatId);
    if (mapped) return mapped;
  }
  return null;
}

export function getBootstrapUserId(): string | null {
  return lastFrontendUserId;
}

export function send(payload: BackendToFrontend, userId: string): void {
  spindle.sendToFrontend(payload as unknown, userId);
}

export function hostToast(
  userId: string,
  tone: "success" | "info" | "warn" | "error",
  text: string,
): void {
  const t = (spindle as unknown as {
    toast?: Record<string, (m: string, o: { userId?: string; duration?: number }) => void>;
  }).toast;
  if (!t) return;
  const method =
    tone === "warn" ? "warning" : tone === "success" || tone === "info" || tone === "error" ? tone : "info";
  if (typeof t[method] !== "function") return;
  try {
    t[method]!(text, { userId, duration: tone === "error" ? 8000 : 4000 });
  } catch (err) {
    warn(`toast call failed: ${describeError(err)}`);
  }
}

export function readChatIdFromMessage(msg: FrontendToBackend): string | null {
  if (!("chatId" in msg)) return null;
  const value = (msg as { chatId?: unknown }).chatId;
  return typeof value === "string" && value.trim() ? value : null;
}

export function getChatStateDir(chatId: string): string {
  return `${CHAT_STATE_DIR}/${chatId}`;
}

export async function ensureUserFolders(userId: string): Promise<void> {
  await Promise.all([
    spindle.userStorage.mkdir(CHAT_STATE_DIR, userId).catch(() => {}),
  ]);
}

export function debug(userId: string, ...parts: unknown[]): void {
  spindle.log.info(tr("backend.runtime.debug.lmb", { slice: userId.slice(0, 6), join: parts.map(stringifyPart).join(" ") }));
}

export function info(message: string): void {
  spindle.log.info(`[lmb] ${message}`);
}

export function warn(message: string): void {
  spindle.log.warn(`[lmb] ${message}`);
}

export function error(message: string): void {
  spindle.log.error(`[lmb] ${message}`);
}

function stringifyPart(p: unknown): string {
  if (p === null || p === undefined) return String(p);
  if (typeof p === "string") return p;
  if (typeof p === "number" || typeof p === "boolean") return String(p);
  try {
    return JSON.stringify(p);
  } catch {
    return String(p);
  }
}

export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

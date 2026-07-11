declare const spindle: import("lumiverse-spindle-types").SpindleAPI;

import { CODEX_FILE_KEYS, EXTENSION_ID } from "../shared";
import { describeError, warn } from "./runtime";

export interface ChapterCreatedEvent {
  chatId: string;
  chapterEntryId: string;
  bookId: string;
  sourceMessageIds: string[];
  summaryText: string;
  model: string;
  title?: string | undefined;
  createdAt: number;
}

export interface ArcCreatedEvent {
  chatId: string;
  arcEntryId: string;
  bookId: string;
  sourceChapterEntryIds: string[];
  sourceMessageIds: string[];
  summaryText: string;
  model: string;
  title?: string | undefined;
  createdAt: number;
}

export interface VolumeCreatedEvent {
  chatId: string;
  volumeEntryId: string;
  bookId: string;
  sourceArcEntryIds: string[];
  sourceMessageIds: string[];
  summaryText: string;
  model: string;
  title?: string | undefined;
  createdAt: number;
}

export type CodexChangeReason = "run" | "tidy" | "edit" | "states" | "wipe";

/** Snapshot published at `lumi_books.codex.<chatId>` for other extensions. */
export interface CodexSnapshotPayload {
  chatId: string;
  userId: string;
  /** All 8 codex files as parsed JSON, keyed by file name (no .json suffix). */
  files: Record<string, unknown>;
  /** Per-file switches; absent key = "on". Consumers should respect these. */
  fileStates: Record<string, string>;
  runs: number;
  updatedAt: number;
}

/** Change signal published at `lumi_books.codex_updated`. */
export interface CodexUpdatedEvent {
  chatId: string;
  userId: string;
  changedFiles: string[];
  reason: CodexChangeReason;
  updatedAt: number;
}

const CHAPTER_KEY = `${EXTENSION_ID}.latest_chapter`;
const ARC_KEY = `${EXTENSION_ID}.latest_arc`;
const VOLUME_KEY = `${EXTENSION_ID}.latest_volume`;
const CODEX_UPDATED_KEY = `${EXTENSION_ID}.codex_updated`;

const codexEndpoint = (chatId: string): string => `${EXTENSION_ID}.codex.${chatId}`;

let registered = false;

export function registerHookEndpoints(): void {
  if (registered) return;
  registered = true;
  try {
    spindle.rpcPool?.sync?.(CHAPTER_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(ARC_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(VOLUME_KEY, null, { requires: [] });
    spindle.rpcPool?.sync?.(CODEX_UPDATED_KEY, null, { requires: [] });
  } catch (err) {
    warn(`rpcPool unavailable: ${describeError(err)}`);
  }
}

export function publishCodexSnapshot(
  chatId: string,
  snapshot: CodexSnapshotPayload | null,
  rendered: string | null,
): void {
  try {
    spindle.rpcPool?.sync?.(codexEndpoint(chatId), snapshot, { requires: [] });
    spindle.rpcPool?.sync?.(`${codexEndpoint(chatId)}.rendered`, rendered, { requires: [] });
  } catch (err) {
    warn(`failed to publish codex snapshot: ${describeError(err)}`);
  }
}

export function publishCodexUpdated(event: Omit<CodexUpdatedEvent, "updatedAt">): void {
  try {
    spindle.rpcPool?.sync?.(CODEX_UPDATED_KEY, { ...event, updatedAt: Date.now() }, { requires: [] });
  } catch (err) {
    warn(`failed to publish codex_updated: ${describeError(err)}`);
  }
}

export function publishCodexWiped(chatId: string, userId: string): void {
  publishCodexSnapshot(chatId, null, null);
  publishCodexUpdated({ chatId, userId, changedFiles: [...CODEX_FILE_KEYS], reason: "wipe" });
}

export function publishChapterCreated(userId: string, event: Omit<ChapterCreatedEvent, "createdAt">): void {
  const payload: ChapterCreatedEvent & { userId: string } = {
    ...event,
    createdAt: Date.now(),
    userId,
  };
  try {
    spindle.rpcPool?.sync?.(CHAPTER_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish chapter_created: ${describeError(err)}`);
  }
}

export function publishArcCreated(userId: string, event: Omit<ArcCreatedEvent, "createdAt">): void {
  const payload: ArcCreatedEvent & { userId: string } = {
    ...event,
    createdAt: Date.now(),
    userId,
  };
  try {
    spindle.rpcPool?.sync?.(ARC_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish arc_created: ${describeError(err)}`);
  }
}

export function publishVolumeCreated(userId: string, event: Omit<VolumeCreatedEvent, "createdAt">): void {
  const payload: VolumeCreatedEvent & { userId: string } = {
    ...event,
    createdAt: Date.now(),
    userId,
  };
  try {
    spindle.rpcPool?.sync?.(VOLUME_KEY, payload, { requires: [] });
  } catch (err) {
    warn(`failed to publish volume_created: ${describeError(err)}`);
  }
}

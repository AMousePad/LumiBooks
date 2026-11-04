import { t as tr } from "../i18n";
import { applyContextRelief, CONTEXT_RELIEF_THRESHOLD, type LMBSettings } from "../shared";
import { loadSettings, mutateSettings } from "./storage";

export interface ContextStats { enabled?: boolean; maxContext?: number; fixedTokens?: number; chatHistoryTokensAfter?: number; messagesDropped?: number }

const statsByGeneration = new Map<string, ContextStats>();

export function rememberContextStats(generationId: string | undefined, stats: ContextStats | undefined): void {
  if (generationId && stats) statsByGeneration.set(generationId, stats);
}

export function takeContextStats(generationId: string | undefined): ContextStats | undefined {
  if (!generationId) return undefined;
  const stats = statsByGeneration.get(generationId);
  statsByGeneration.delete(generationId);
  return stats;
}

/** Host stats predate interceptors, so provider usage can report injected summaries they miss. */
export function contextIsFull(stats: ContextStats | undefined, promptTokens: number | undefined): boolean {
  if (!stats?.enabled || !stats.maxContext || stats.maxContext <= 0) return false;
  if ((stats.messagesDropped ?? 0) > 0) return true;
  const assembled = (stats.fixedTokens ?? 0) + (stats.chatHistoryTokensAfter ?? 0);
  return Math.max(promptTokens ?? 0, assembled) / stats.maxContext >= CONTEXT_RELIEF_THRESHOLD;
}

/** Returns the updated settings when this call lowered the active profile. */
export async function relieveContext(userId: string, warn: (text: string) => void): Promise<LMBSettings | null> {
  const needed = (settings: LMBSettings) => settings.contextRelief
    && settings.profiles.some((p) => p.id === settings.activeProfileId && !p.contextReliefApplied);
  if (!needed(await loadSettings(userId))) return null;
  let applied = false;
  const next = await mutateSettings(userId, (current) => {
    if (!needed(current)) return current;
    applied = true;
    return { ...current, profiles: current.profiles.map((p) => p.id === current.activeProfileId ? applyContextRelief(p) : p) };
  });
  if (!applied) return null;
  warn(tr("backend.contextRelief.applied"));
  // Cache Friendly mode locks these features, so the advice would point at disabled controls.
  if (!next.cacheFriendly) warn(tr("backend.contextRelief.advice"));
  return next;
}

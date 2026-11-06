import { HIGHER_TIERS, type LMBProfile } from "./shared";
import type { ProfilePatch } from "./types";

/** Nested maps merge key by key, so two saves in flight never overwrite each other. */
export function mergeProfilePatch(existing: LMBProfile, patch: ProfilePatch): LMBProfile {
  return {
    ...existing,
    ...patch,
    promptRoles: Object.keys(patch.promptRoles ?? {}).length
      ? { ...existing.promptRoles, ...patch.promptRoles } : patch.promptRoles ?? existing.promptRoles,
    higherTierPresetKeys: Object.keys(patch.higherTierPresetKeys ?? {}).length
      ? { ...existing.higherTierPresetKeys, ...patch.higherTierPresetKeys } : patch.higherTierPresetKeys ?? existing.higherTierPresetKeys,
    codexTokenLimits: { ...existing.codexTokenLimits, ...patch.codexTokenLimits },
    higherTiers: Object.fromEntries(HIGHER_TIERS.map((tier) => [tier, { ...existing.higherTiers[tier], ...patch.higherTiers?.[tier] }])) as LMBProfile["higherTiers"],
  } as LMBProfile;
}

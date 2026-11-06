import { describe, expect, test } from "bun:test";
import { makeDefaultProfile } from "./shared";
import { mergeProfilePatch } from "./profile-patch";

describe("mergeProfilePatch", () => {
  test("saves of different limit fields in any order keep both values", () => {
    const base = makeDefaultProfile("p", "P");
    const a = { id: "p", codexTokenLimits: { things: 4000 } };
    const b = { id: "p", codexTokenLimits: { world: 4500 } };
    for (const merged of [mergeProfilePatch(mergeProfilePatch(base, a), b), mergeProfilePatch(mergeProfilePatch(base, b), a)]) {
      expect(merged.codexTokenLimits.things).toBe(4000);
      expect(merged.codexTokenLimits.world).toBe(4500);
      expect(merged.codexTokenLimits.characters).toBe(base.codexTokenLimits.characters);
    }
  });

  test("a higher tier field save keeps the other fields of that tier and other tiers", () => {
    const base = makeDefaultProfile("p", "P");
    const merged = mergeProfilePatch(mergeProfilePatch(base, { id: "p", higherTiers: { 4: { lag: 7 } } }), { id: "p", higherTiers: { 4: { enabled: true } } });
    expect(merged.higherTiers[4]).toEqual({ ...base.higherTiers[4], lag: 7, enabled: true });
    expect(merged.higherTiers[5]).toEqual(base.higherTiers[5]);
  });
});

import { expect, test } from "bun:test";
import { normalizeProfile, normalizeSettings } from "./shared";
import { codexEntryPlacement } from "./backend/codex/sync";

test("old saved switches migrate without changing activation defaults", () => {
  expect(normalizeSettings({}).summaryActivationMode).toBe("always");
  expect(normalizeSettings({ forceConstantEntries: false } as any).summaryActivationMode).toBe("keywords");
  expect(normalizeSettings({ summaryActivationMode: "vector", forceConstantEntries: true } as any).summaryActivationMode).toBe("vector");
  expect(normalizeProfile({ id: "p", name: "P" })!.codexActivationMode).toBe("keywords");
  expect(normalizeProfile({ id: "p", name: "P", codexForceConstant: true } as any)!.codexActivationMode).toBe("always");
  const vector = normalizeProfile({ id: "p", name: "P", codexActivationMode: "vector", codexForceConstant: true } as any)!;
  expect(normalizeProfile(vector)!.codexActivationMode).toBe("vector");
  expect(codexEntryPlacement(vector, false)).toMatchObject({ constant: false, vectorized: true });
  expect(codexEntryPlacement(vector, true)).toMatchObject({ constant: true, vectorized: false });
});

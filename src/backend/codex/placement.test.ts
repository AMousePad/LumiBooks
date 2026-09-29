import { expect, test } from "bun:test";
import { makeDefaultProfile, normalizeProfile } from "../../shared";
import { codexEntryPlacement } from "./sync";
test("codex defaults preserve keyword activation and the lorebook bucket", () => {
 const p = makeDefaultProfile("p", "test");
 expect(codexEntryPlacement(p, false)).toEqual({ constant: false, position: 0, depth: 0, role: "system" });
 expect(codexEntryPlacement(p, true).constant).toBe(true);
});
test("constant and depth settings survive profile normalization and repeated sync projections", () => {
 const p = normalizeProfile({ ...makeDefaultProfile("p", "test"), codexForceConstant: true, codexInjectionPosition: "depth", codexInjectionDepth: 6 })!;
 expect(codexEntryPlacement(p, false)).toEqual({ constant: true, position: 4, depth: 6, role: "system" });
 expect(codexEntryPlacement({ ...p, codexInjectionPosition: "after_history" }, false).depth).toBe(0);
});

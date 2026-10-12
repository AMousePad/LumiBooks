import { expect, test } from "bun:test";
import { applyExtraFields, draftExtraFields } from "./codex-extra-fields";
import { validateCodexFile } from "../backend/codex/schema";

test("custom fields preserve numbers, text, lists and false values through editing", () => {
  const entity = { id: "char:test", name: "Test", age: 20, title: "Captain", hobbies: ["music, dance", "reading"], retired: false };
  const fields = draftExtraFields(entity, new Set(["id", "name"]));
  fields.find(f => f.key === "age")!.value = "21";
  fields.find(f => f.key === "title")!.value = "Admiral";
  applyExtraFields(entity, fields);
  expect(entity).toEqual({ id: "char:test", name: "Test", age: 21, title: "Admiral", hobbies: ["music, dance", "reading"], retired: false });
  const validated = validateCodexFile("characters", { entities: [entity] }, { relationsTable: true });
  expect(validated.ok).toBe(true);
});

test("empty custom fields are removed while numeric zero is retained", () => {
  const entity: Record<string, unknown> = { age: 20, nickname: "Old", labels: ["old"] };
  const fields = draftExtraFields(entity, new Set());
  fields.forEach(f => { f.value = f.key === "age" ? "0" : "  "; });
  applyExtraFields(entity, fields);
  expect(entity).toEqual({ age: 0 });
});

test("invalid numbers cannot become NaN or null in saved JSON", () => {
  for (const value of ["unknown", "Infinity", "NaN"]) {
    expect(() => applyExtraFields({}, [{ key: "age", type: "number", value }])).toThrow("age must be a valid number");
  }
});

test("reserved and unsupported fields are not offered as custom primitives", () => {
  const fields = draftExtraFields(JSON.parse('{"__proto__": "bad", "id": "char:test", "locked": true, "nested": {}, "mixed": [1, "x"], "age": 5}'), new Set(["id", "locked"]));
  expect(fields.map(f => f.key)).toEqual(["age"]);
});

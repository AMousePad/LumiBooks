import { expect, test } from "bun:test";
import { emptyBundle } from "./schema";
import { renderCodexRecords } from "./prompt";

function story() {
  const b = emptyBundle();
  b.characters.entities = [{ id: "a", name: "Alice", aliases: ["Al"] }, { id: "b", name: "Bob" }];
  b.relations.relations = [{ type: "pair", a: "a", b: "b", kind: "friendship", state: "friends" }];
  return b;
}
test("enabled relations remain retrievable when the entity category is not injected", () => {
  const records = renderCodexRecords(story(), { includeRelations: true, disabledFiles: new Set(["characters"]) });
  const relation = records.find((r) => r.file === "relations")!;
  expect(relation.content).toContain("Alice");
  expect(relation.keys).toContain("Al");
  expect(records.filter((r) => r.file === "characters").every((r) => !r.content.includes("friends"))).toBe(true);
});
test("individually hidden entities also get a relations fallback", () => {
  const b = story();
  b.characters.entities.forEach((e) => e.noInject = true);
  expect(renderCodexRecords(b, { includeRelations: true }).some((r) => r.file === "relations")).toBe(true);
});
test("ordinary entity activation carries relations, and the relation switch suppresses them", () => {
  const b = story();
  expect(renderCodexRecords(b, { includeRelations: true }).filter((r) => r.file === "characters").every((r) => r.content.includes("friends"))).toBe(true);
  expect(renderCodexRecords(b, { includeRelations: false }).every((r) => !r.content.includes("friends"))).toBe(true);
});

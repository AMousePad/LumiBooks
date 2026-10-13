import { expect, test } from "bun:test";
import { validateCodexFile, type CodexKnowledgeFile, type CodexKnowledgeItem } from "./schema";

const fact = { fact: "The gate has a hidden latch.", knownBy: ["Alice", "Bob"], hiddenFrom: ["Eve"] };
function validate(items: CodexKnowledgeItem[]): CodexKnowledgeFile {
  const result = validateCodexFile("knowledge", { items }, { relationsTable: false });
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return result.value as CodexKnowledgeFile;
}

test("identical knowledge rows collapse without changing the first stable ID", () => {
  expect(validate([
    { ...fact, rid: "r7" },
    { ...fact, rid: "r8", knownBy: ["Bob", "Alice"] },
    { ...fact },
  ]).items).toEqual([{ ...fact, rid: "r7" }]);
});

test("deduplication retains a saved ID when an identifier-less copy precedes it", () => {
  expect(validate([{ ...fact }, { ...fact, rid: "r7" }]).items).toEqual([{ ...fact, rid: "r7" }]);
});

test("similar facts with different audiences, beliefs, notes or keywords stay distinct", () => {
  const items = [
    fact,
    { ...fact, fact: "The gate had a hidden latch." },
    { ...fact, knownBy: ["Alice"] },
    { ...fact, hiddenFrom: ["Frank"] },
    { ...fact, falseBeliefs: [{ who: "Eve", believes: "The gate is sealed." }] },
    { ...fact, note: "Confirmed yesterday." },
    { ...fact, keywords: ["latch"] },
  ];
  expect(validate(items).items).toEqual(items);
});

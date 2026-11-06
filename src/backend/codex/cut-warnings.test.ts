import { expect, test } from "bun:test";
import { createCodexCutWarning } from "./cut-warnings";

test("alternating activation sets and modes only warn for previously unseen records", () => {
  const warnings: string[] = [];
  const report = createCodexCutWarning((user, chat) => warnings.push(`${user}/${chat}`));
  report("u", "c", ["a"]);
  report("u", "c", [], ["a"]);
  report("u", "c", ["a"]);
  report("u", "c", ["b"]);
  report("u", "c", ["a", "b"]);
  expect(warnings).toEqual(["u/c", "u/c"]);
});

test("existing manifest cuts seed both sync and activation warning history after restart", () => {
  let warnings = 0;
  const report = createCodexCutWarning(() => warnings++);
  report("u", "c", [], ["a"]);
  report("u", "c", ["a"]);
  expect(warnings).toBe(0);
  report("u", "c", ["a", "b"], ["a"]);
  expect(warnings).toBe(1);
});

test("warning history is scoped by user and chat", () => {
  let warnings = 0;
  const report = createCodexCutWarning(() => warnings++);
  report("u1", "c1", ["a"]);
  report("u2", "c1", ["a"]);
  report("u1", "c2", ["a"]);
  expect(warnings).toBe(3);
});

test("the history cap preserves recently used chats instead of clearing all warnings", () => {
  const warnings: string[] = [];
  const report = createCodexCutWarning((_, chat) => warnings.push(chat));
  for (let i = 0; i < 500; i++) report("u", String(i), ["a"]);
  report("u", "0", ["a"]);
  report("u", "500", ["a"]);
  report("u", "0", ["a"]);
  report("u", "499", ["a"]);
  expect(warnings).toHaveLength(501);
});

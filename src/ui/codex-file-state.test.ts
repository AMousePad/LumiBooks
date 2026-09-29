import { expect, test } from "bun:test";
import { CodexFileStateChanges } from "./codex-file-state";
import type { FrontendToBackend } from "../types";

test("rapid tile clicks update immediately and coalesce saves until acknowledgement", () => {
  const changes = new CodexFileStateChanges(), sent: FrontendToBackend[] = [];
  const send = (m: FrontendToBackend) => { sent.push(m); };
  changes.change("chat", "world", "on", "noInject", send);
  expect(changes.value("chat", "world", "on")).toBe("noInject");
  changes.change("chat", "world", "noInject", "frozen", send);
  expect(changes.value("chat", "world", "on")).toBe("frozen");
  expect(sent).toHaveLength(1);
  expect(changes.acknowledge("chat", "world", 1)).toBe("noInject");
  expect(sent[1]).toMatchObject({ state: "frozen", seq: 2 });
  expect(changes.value("chat", "world", "noInject")).toBe("frozen");
  expect(changes.acknowledge("chat", "world", 1)).toBeNull();
  expect(changes.acknowledge("chat", "world", 2)).toBe("frozen");
});

test("failed saves return to the last confirmed state and allow another click", () => {
  const changes = new CodexFileStateChanges();
  changes.change("chat", "world", "on", "noInject", () => {});
  changes.change("chat", "world", "noInject", "frozen", () => {});
  expect(changes.acknowledge("chat", "world", 1)).toBe("noInject");
  expect(changes.acknowledge("chat", "world", 2, true)).toBe("noInject");
  expect(changes.value("chat", "world", "noInject")).toBe("noInject");
  changes.change("chat", "world", "noInject", "frozen", () => {});
  expect(changes.acknowledge("chat", "world", 3)).toBe("frozen");
});

test("pending switches stay isolated across files and chats", () => {
  const changes = new CodexFileStateChanges();
  changes.change("a", "world", "on", "noInject", () => {});
  changes.change("b", "world", "on", "frozen", () => {});
  expect(changes.value("a", "characters", "on")).toBe("on");
  expect(changes.acknowledge("b", "world", 1)).toBeNull();
  expect(changes.value("a", "world", "on")).toBe("noInject");
  expect(changes.value("b", "world", "on")).toBe("frozen");
});

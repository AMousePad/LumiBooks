import { expect, test } from "bun:test";
import { CODEX_BACKUP_KIND, CODEX_BACKUP_VERSION, parseCodexBackup } from "./backup";

function envelope(files: Record<string, string>, extra: Record<string, unknown> = {}): unknown {
  return {
    kind: CODEX_BACKUP_KIND,
    version: CODEX_BACKUP_VERSION,
    chatId: "chat-1",
    savedAt: 1,
    files,
    fileStates: {},
    relationsTableMode: false,
    ...extra,
  };
}

const validWorld = JSON.stringify({ entries: [] });
const validKnowledge = JSON.stringify({ items: [] });

test("accepts a backup and reports the files it will write", () => {
  const parsed = parseCodexBackup(envelope({ world: validWorld, knowledge: validKnowledge }), true);
  expect("error" in parsed).toBe(false);
  if ("error" in parsed) return;
  expect(parsed.values.map((v) => v.key).sort()).toEqual(["knowledge", "world"]);
  expect(parsed.relationsTableMode).toBe(false);
});

test("carries recognised file states and drops unknown ones", () => {
  const parsed = parseCodexBackup(
    envelope({ world: validWorld }, { fileStates: { world: "frozen", bogus: "on", threads: "nonsense" } }),
    true,
  );
  if ("error" in parsed) throw new Error(parsed.error);
  expect(parsed.fileStates).toEqual({ world: "frozen" });
});

test("rejects a file that is not a codex backup", () => {
  expect(parseCodexBackup({ hello: "world" }, true)).toEqual({ error: "that file is not a codex backup" });
  expect(parseCodexBackup(null, true)).toEqual({ error: "that file is not a codex backup" });
});

test("refuses a backup from a newer LumiBooks", () => {
  const parsed = parseCodexBackup(envelope({ world: validWorld }, { version: CODEX_BACKUP_VERSION + 1 }), true);
  expect("error" in parsed && parsed.error).toContain("newer LumiBooks");
});

test("one bad file rejects the whole backup so nothing is half-restored", () => {
  const parsed = parseCodexBackup(envelope({ world: validWorld, knowledge: "{not json" }), true);
  expect("error" in parsed && parsed.error).toContain("knowledge.json");
});

test("rejects a structurally invalid file", () => {
  const parsed = parseCodexBackup(envelope({ world: JSON.stringify({ entries: [{ id: 42 }] }) }), true);
  expect("error" in parsed && parsed.error).toContain("world.json");
});

test("rejects an envelope with no codex files", () => {
  const parsed = parseCodexBackup(envelope({}), true);
  expect(parsed).toEqual({ error: "the backup has no codex files in it" });
});

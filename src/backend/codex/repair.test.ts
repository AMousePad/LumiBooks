import { afterAll, beforeEach, expect, test } from "bun:test";
import { repairCodexReferences, saveCodexEdit } from "./repair";
import { checkIntegrity, emptyBundle, pruneDanglingReferences, validateCodexFile } from "./schema";
import { emptyCursor, loadCodex } from "./store";
import { applyCodexBackup, parseCodexBackup, readCodexUndo } from "./backup";

const original = (globalThis as any).spindle;
const data = new Map<string, any>();
beforeEach(() => {
  data.clear();
  (globalThis as any).spindle = {
    log: { warn() {} },
    userStorage: {
      async exists(p: string) { return data.has(p); },
      async read(p: string) { return JSON.stringify(data.get(p)); },
      async getJson(p: string) { return structuredClone(data.get(p)); },
      async setJson(p: string, value: any) { data.set(p, structuredClone(value)); },
    },
  };
});
afterAll(() => { (globalThis as any).spindle = original; });

test("cleanup keeps deliberately deleted entities absent and preserves surviving facts and links", () => {
  const bundle = emptyBundle();
  bundle.characters.entities = [{ id: "char:alice", name: "Alice", locked: true }, { id: "char:carol", name: "Carol" }];
  bundle.relations.relations = [
    { type: "pair", a: "char:alice", b: "char:bob", kind: "friend", state: "close" },
    { type: "pair", a: "char:alice", b: "char:carol", kind: "friend", state: "close" },
    { type: "group", members: ["char:bob", "char:alice", "char:carol"], roles: { "char:bob": "leader", "char:carol": "scout" }, kind: "team", state: "active", history: ["Joined forces"] },
    { type: "group", members: ["char:bob", "char:alice"], kind: "duo", state: "active" },
  ];
  bundle.knowledge.items = [{ fact: "The gate is trapped", knownBy: ["char:bob", "char:alice", "the guard"], hiddenFrom: ["char:bob", "char:carol"],
    falseBeliefs: [{ who: "char:bob", believes: "safe" }, { who: "char:carol", believes: "open" }], note: "Keep the fact" }];
  bundle.timeline.events = [{ when: "today", event: "Found the key", participants: ["char:bob", "char:alice", "thing:key"], where: "loc:old_tower" }];
  const entities = structuredClone(bundle.characters);
  expect(pruneDanglingReferences(bundle).sort()).toEqual(["knowledge", "relations", "timeline"]);
  expect(checkIntegrity(bundle)).toEqual([]);
  expect(bundle.characters).toEqual(entities);
  expect(bundle.locations.entities).toEqual([]);
  expect(bundle.things.entities).toEqual([]);
  expect(bundle.relations.relations).toEqual([
    { type: "pair", a: "char:alice", b: "char:carol", kind: "friend", state: "close" },
    { type: "group", members: ["char:alice", "char:carol"], roles: { "char:carol": "scout" }, kind: "team", state: "active", history: ["Joined forces"] },
  ]);
  expect(bundle.knowledge.items).toEqual([{ fact: "The gate is trapped", knownBy: ["char:alice", "the guard"], hiddenFrom: ["char:carol"], falseBeliefs: [{ who: "char:carol", believes: "open" }], note: "Keep the fact" }]);
  expect(bundle.timeline.events).toEqual([{ when: "today", event: "Found the key", participants: ["char:alice"] }]);
  for (const file of ["relations", "knowledge", "timeline"] as const) expect(validateCodexFile(file, bundle[file], { relationsTable: true }).ok).toBe(true);
  expect(pruneDanglingReferences(bundle)).toEqual([]);
});

test("repair saves Undo, leaves indexing progress and entities alone, and does not call a model", async () => {
  const cursor = { ...emptyCursor(), lastMsgId: "m200", runs: 10, fileStates: { relations: "frozen" }, consumedSigs: [{ id: "m200", sig: "sig" }] };
  const relations = { relations: [{ type: "pair", a: "char:a", b: "char:b", kind: "friend", state: "close" }] };
  data.set("codex/chat/cursor.json", cursor);
  data.set("codex/chat/relations.json", relations);
  expect(await repairCodexReferences("chat", "user", true)).toEqual(["relations"]);
  expect(data.get("codex/chat/cursor.json")).toMatchObject({ lastMsgId: "m200", runs: 10, consumedSigs: cursor.consumedSigs, fileStates: cursor.fileStates, pendingReconcile: false });
  expect(data.has("codex/chat/characters.json")).toBe(false);
  const undo = structuredClone(data.get("codex-undo/chat.json"));
  expect(JSON.parse(undo.files.relations)).toEqual(relations);
  expect(checkIntegrity((await loadCodex("chat", "user", { relationsTable: true })).bundle)).toEqual([]);
  expect(await repairCodexReferences("chat", "user", true)).toEqual([]);
  expect(data.get("codex-undo/chat.json")).toEqual(undo);
});

test("entity deletion cleans its references automatically and Undo restores the entity and its links together", async () => {
  const entities = { entities: [{ id: "char:alice", name: "Alice" }, { id: "char:bob", name: "Bob" }] };
  data.set("codex/chat/characters.json", entities);
  data.set("codex/chat/relations.json", { relations: [{ type: "pair", a: "char:alice", b: "char:bob", kind: "friend", state: "close" }] });
  data.set("codex/chat/knowledge.json", { items: [{ fact: "secret", knownBy: ["char:bob", "char:unrelated_missing"] }] });
  data.set("codex/chat/timeline.json", { events: [{ when: "today", event: "A meeting", participants: ["char:alice", "char:bob"] }] });
  const changed = await saveCodexEdit("chat", "user", "characters", { entities: [entities.entities[0]!] }, true);
  expect(changed.sort()).toEqual(["characters", "knowledge", "relations", "timeline"]);
  expect(data.get("codex/chat/characters.json").entities).toEqual([entities.entities[0]]);
  expect(data.get("codex/chat/relations.json").relations).toEqual([]);
  expect(data.get("codex/chat/knowledge.json").items[0].knownBy).toEqual(["char:unrelated_missing"]);
  expect(data.get("codex/chat/timeline.json").events[0].participants).toEqual(["char:alice"]);
  const undo = (await readCodexUndo("chat", "user"))!;
  const parsed = parseCodexBackup(undo, true);
  if ("error" in parsed) throw new Error(parsed.error);
  await applyCodexBackup("chat", "user", parsed, undo.cursor);
  expect(data.get("codex/chat/characters.json")).toEqual(entities);
  expect(data.get("codex/chat/relations.json").relations).toHaveLength(1);
  expect(data.get("codex/chat/knowledge.json").items[0].knownBy).toContain("char:bob");
  expect(data.get("codex/chat/cursor.json").discardedRecords).toBeUndefined();
});

test("failed deletion cleanup rolls back completed writes without deleting the entity", async () => {
  const entities = { entities: [{ id: "char:alice", name: "Alice" }, { id: "char:bob", name: "Bob" }] };
  data.set("codex/chat/characters.json", entities);
  data.set("codex/chat/relations.json", { relations: [{ type: "pair", a: "char:alice", b: "char:bob", kind: "friend", state: "close" }] });
  const write = (globalThis as any).spindle.userStorage.setJson;
  (globalThis as any).spindle.userStorage.setJson = async (path: string, value: any) => {
    if (path === "codex/chat/characters.json") throw new Error("write failed");
    await write(path, value);
  };
  await expect(saveCodexEdit("chat", "user", "characters", { entities: [] }, true)).rejects.toThrow("write failed");
  expect(data.get("codex/chat/characters.json")).toEqual(entities);
  expect(data.get("codex/chat/relations.json").relations).toHaveLength(1);
  expect(data.get("codex/chat/cursor.json").discardedRecords).toBeUndefined();
});

test("unreadable siblings and failed Undo snapshots prevent cleanup writes", async () => {
  data.set("codex/chat/knowledge.json", { items: [{ fact: "secret", knownBy: ["char:a"] }] });
  data.set("codex/chat/characters.json", { entities: "broken" });
  await expect(repairCodexReferences("chat", "user", true)).rejects.toThrow("Cannot repair");
  data.delete("codex/chat/characters.json");
  (globalThis as any).spindle.userStorage.setJson = async () => { throw new Error("storage unavailable"); };
  await expect(repairCodexReferences("chat", "user", true)).rejects.toThrow("storage unavailable");
  expect(data.get("codex/chat/knowledge.json").items[0].knownBy).toEqual(["char:a"]);
});

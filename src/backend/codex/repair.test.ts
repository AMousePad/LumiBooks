import { afterAll, beforeEach, expect, test } from "bun:test";
import { repairCodexReferences } from "./repair";
import { checkIntegrity, emptyBundle, restoreMissingEntities } from "./schema";
import { emptyCursor, loadCodex } from "./store";

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

test("repair preserves every relationship and secret, creates each missing identity once, and leaves valid entities alone", () => {
  const bundle = emptyBundle();
  bundle.characters.entities = [{ id: "char:alice", name: "Alice", locked: true }];
  bundle.relations.relations = [
    { type: "pair", a: "char:alice", b: "char:bob", kind: "friend", state: "close" },
    { type: "group", members: ["char:bob", "char:alice"], roles: { "char:bob": "leader" }, kind: "team", state: "active" },
  ];
  bundle.knowledge.items = [{ fact: "secret", knownBy: ["char:bob"], hiddenFrom: ["char:alice"], falseBeliefs: [{ who: "char:bob", believes: "safe" }] }];
  bundle.timeline.events = [{ when: "today", event: "found the key", participants: ["char:bob", "thing:key"], where: "loc:old_tower" }];
  const before = structuredClone(bundle);
  expect(restoreMissingEntities(bundle).sort()).toEqual(["characters", "locations", "things"]);
  expect(checkIntegrity(bundle)).toEqual([]);
  expect(bundle.relations).toEqual(before.relations);
  expect(bundle.knowledge).toEqual(before.knowledge);
  expect(bundle.timeline).toEqual(before.timeline);
  expect(bundle.characters.entities).toEqual([before.characters.entities[0], { id: "char:bob", name: "bob", noInject: true }]);
  expect(restoreMissingEntities(bundle)).toEqual([]);
});

test("repair saves Undo and preserves indexing progress without a model request", async () => {
  const cursor = { ...emptyCursor(), lastMsgId: "m200", runs: 10, fileStates: { characters: "frozen" }, consumedSigs: [{ id: "m200", sig: "sig" }] };
  const relations = { relations: [{ type: "pair", a: "char:a", b: "char:b", kind: "friend", state: "close" }] };
  data.set("codex/chat/cursor.json", cursor);
  data.set("codex/chat/relations.json", relations);
  expect(await repairCodexReferences("chat", "user", true)).toEqual(["characters"]);
  expect(data.get("codex/chat/cursor.json")).toEqual(cursor);
  const undo = structuredClone(data.get("codex-undo/chat.json"));
  expect(JSON.parse(undo.files.relations)).toEqual(relations);
  expect(JSON.parse(undo.files.characters)).toEqual({ entities: [] });
  expect(checkIntegrity((await loadCodex("chat", "user", { relationsTable: true })).bundle)).toEqual([]);
  expect(await repairCodexReferences("chat", "user", true)).toEqual([]);
  expect(data.get("codex-undo/chat.json")).toEqual(undo);
});

test("unreadable siblings and failed Undo snapshots prevent repair writes", async () => {
  data.set("codex/chat/knowledge.json", { items: [{ fact: "secret", knownBy: ["char:a"] }] });
  data.set("codex/chat/characters.json", { entities: "broken" });
  await expect(repairCodexReferences("chat", "user", true)).rejects.toThrow("Cannot repair");
  data.delete("codex/chat/characters.json");
  (globalThis as any).spindle.userStorage.setJson = async () => { throw new Error("storage unavailable"); };
  await expect(repairCodexReferences("chat", "user", true)).rejects.toThrow("storage unavailable");
  expect(data.has("codex/chat/characters.json")).toBe(false);
});

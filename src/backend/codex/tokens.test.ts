import { afterAll, expect, test } from "bun:test";
import { emptyBundle } from "./schema";
import { renderCodexRecords, renderCodexFileSections } from "./prompt";
import { countCodexText, measureCodexTokens } from "./tokens";
const previous = (globalThis as any).spindle;
afterAll(() => { (globalThis as any).spindle = previous; });

test("Codex uses tokenized saved prose and full enabled lorebook records", async () => {
  (globalThis as any).spindle = { tokens: { async countText(text: string, opts: any) {
    expect(opts).toEqual({ userId: "u", modelSource: "main" });
    return { total_tokens: text.length, approximate: false };
  } } };
  const bundle = emptyBundle();
  bundle.characters.entities = [{ id: "char:a", name: "Alice" }, { id: "char:b", name: "Bob", noInject: true }];
  bundle.relations.relations = [{ type: "pair", a: "char:a", b: "char:b", kind: "friend", state: "Friends." }];
  bundle.world.entries = [{ topic: "Weather", facts: ["Cold."] }];
  const records = renderCodexRecords(bundle, { includeRelations: true });
  const counts = await measureCodexTokens(bundle, "u", { world: "noInject" }, true);
  expect(counts.constant).toBe(records.filter((r) => !r.disabled && r.file !== "world").reduce((n, r) => n + r.content.length, 0));
  expect(counts.files.relations).toBe(renderCodexFileSections(bundle).relations.length);
  expect(counts.files.world).toBeGreaterThan(0);
  expect(counts.approximate).toBe(false);
  expect((await measureCodexTokens(bundle, "u")).constant).toBe(0);
  // Both endpoints enabled means the relation really appears twice in the prompt.
  delete bundle.characters.entities[1]!.noInject;
  const all = renderCodexRecords(bundle, { includeRelations: true });
  expect((await measureCodexTokens(bundle, "u", {}, true)).constant).toBe(all.reduce((n, r) => n + r.content.length, 0));
});

test("Codex tokenizer failures and host estimates are explicitly approximate", async () => {
  (globalThis as any).spindle = { tokens: { async countText() { throw new Error("offline"); } } };
  expect(await countCodexText("12345678", "u")).toEqual({ tokens: 2, approximate: true });
  expect(await countCodexText("", "u")).toEqual({ tokens: 0, approximate: false });
  (globalThis as any).spindle.tokens.countText = async () => ({ total_tokens: 7, approximate: true });
  expect(await countCodexText("content", "u")).toEqual({ tokens: 7, approximate: true });
});

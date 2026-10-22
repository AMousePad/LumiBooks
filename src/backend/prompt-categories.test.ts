import { afterAll, beforeEach, expect, test } from "bun:test";
import { EXTRA_PRESET_CATEGORIES, TIER_KINDS, MODEL_TIER_NAMES, makeDefaultProfile, normalizeCustomPreset, normalizeProfile, promptRoleFor, type HigherTier, type PromptRole } from "../shared";
import { presetKeyFor, resolvePresetText } from "../prompts/categories";
import { BUILTIN_PRESET_POOLS } from "./presets";
import { assembleArcPrompt, assembleChapterPrompt, assembleVolumePrompt, summarizeArc, summarizeChapter, summarizeVolume } from "./summarizer";
import { runCodexAgent } from "./codex/agent";
import { makeCodexPromptCtx } from "./codex/prompt";
import { CODEX_FILE_KEYS, emptyBundle } from "./codex/schema";

const original = (globalThis as any).spindle;
const requests: any[] = [];
const userId = "prompt-categories-user";
beforeEach(() => {
  requests.length = 0;
  (globalThis as any).spindle = {
    log: { info() {}, warn() {}, error() {} },
    userStorage: { async getJson(_path: string, opts: any) { return opts?.fallback; }, async setJson() {} },
    connections: { async list() { return [{ id: "conn", model: "test", is_default: true }]; } },
    tokens: { async countText(text: string) { return { total_tokens: Math.ceil(text.length / 4) }; } },
    macros: { async resolve(text: string) { return { text: text.replaceAll("{{user}}", "Resolved user"), diagnostics: [] }; } },
    generate: {
      async *rawStream(req: any) {
        requests.push(req);
        yield { type: "done", content: JSON.stringify({ title: "Summary", content: "Compressed story", keywords: [] }) };
      },
      async *quietStream(req: any) {
        requests.push({ messages: structuredClone(req.messages) });
        yield { type: "done", content: JSON.stringify({ skip: [...CODEX_FILE_KEYS], done: true }) };
      },
    },
  };
});
afterAll(() => { (globalThis as any).spindle = original; });

test("old profiles retain System roles and inherit their custom Volume prompt for later tiers", () => {
  const profile = normalizeProfile({ id: "old", volumePresetKey: "volume-custom" })!;
  const custom = normalizeCustomPreset({ key: "volume-custom", category: "volume", prompt: "Combine ARCS into a VOLUME. {{user}}" })!;
  for (const category of [...TIER_KINDS, "codex"] as const) expect(promptRoleFor(profile, category)).toBe("system");
  for (const category of EXTRA_PRESET_CATEGORIES) {
    expect(presetKeyFor(profile, category)).toBe("");
    expect(resolvePresetText(profile, [custom], BUILTIN_PRESET_POOLS, category)).toContain(MODEL_TIER_NAMES[TIER_KINDS.indexOf(category)]!.toUpperCase());
  }
});

test("profile and preset normalization retain new categories and reject invalid roles", () => {
  const profile = normalizeProfile({ id: "p", promptRoles: { chapter: "assistant", codex: "user", saga: "tool", other: "system" },
    higherTierPresetKeys: { series: "custom-series", saga: "", library: 123, other: "bad" } })!;
  expect(profile.promptRoles).toEqual({ chapter: "assistant", codex: "user" });
  expect(profile.higherTierPresetKeys).toEqual({ series: "custom-series" });
  for (const category of EXTRA_PRESET_CATEGORIES) expect(normalizeCustomPreset({ key: "custom", prompt: "Keep this exactly.", category })?.category).toBe(category);
});

for (const role of ["system", "assistant", "user"] as PromptRole[]) {
  for (const [index, category] of TIER_KINDS.entries()) {
    test(`${category} instructions use ${role} in preview and generation without changing source roles`, async () => {
      const profile = makeDefaultProfile("roles", "Roles");
      profile.promptRoles[category] = role;
      const key = `${category}-custom`;
      if (category === "chapter") profile.chapterPresetKey = key;
      else if (category === "arc") profile.arcPresetKey = key;
      else if (category === "volume") profile.volumePresetKey = key;
      else profile.higherTierPresetKeys[category] = key;
      const custom = normalizeCustomPreset({ key, category, prompt: `${category} custom: preserve the words arcs and volumes. {{user}}` })!;
      const source = [{ raw: { id: "source", comment: "Source", content: "Source {{user}} stays literal" }, meta: { title: "Source" } }] as any;
      const messages = [{ id: "m1", role: "user", content: "Source {{user}} stays literal", index_in_chat: 0 }] as any;
      const signal = { externalSignal: new AbortController().signal };
      let preview;
      if (category === "chapter") {
        preview = await assembleChapterPrompt(profile, [custom], "chat", messages, [], userId, "Opener");
        await summarizeChapter(profile, [custom], "chat", messages, [], userId, "Opener", signal);
      } else if (category === "arc") {
        preview = await assembleArcPrompt(profile, [custom], "chat", source, userId, "Opener");
        await summarizeArc(profile, [custom], "chat", source, userId, "Opener", signal);
      } else {
        preview = await assembleVolumePrompt(profile, [custom], "chat", source, userId, "Opener", (index + 1) as HigherTier);
        const result = await summarizeVolume(profile, [custom], "chat", source, userId, "Opener", signal, (index + 1) as HigherTier);
        expect(result.presetKey).toBe(key);
      }
      expect(preview.messages.map((m) => m.role)).toEqual([role, "user"]);
      expect(preview.messages[0]!.content).toContain(`${category} custom: preserve the words arcs and volumes. Resolved user`);
      expect(preview.messages[1]!.content).toContain("Source {{user}} stays literal");
      expect(requests[0].messages).toEqual(preview.messages);
    });
  }
  test(`Codex sends instructions as ${role} while retaining the User source message`, async () => {
    const profile = makeDefaultProfile("roles", "Roles");
    profile.promptRoles.codex = role;
    profile.codexThorough = false;
    await runCodexAgent({ profile, chatId: "chat", userId, promptCtx: makeCodexPromptCtx(profile, [], new Set()),
      bundle: emptyBundle(), chunk: [], chunkLabel: "Test", chunkFirstIndex: 0, notes: {} as any,
      lore: null, storySoFar: null, userTextOverride: "Raw source {{user}}", externalSignal: new AbortController().signal });
    expect(requests[0].messages.map((m: any) => m.role)).toEqual([role, "user"]);
    expect(requests[0].messages[1].content[0].text).toBe("Raw source {{user}}");
  });
}

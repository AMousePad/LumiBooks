import { afterAll, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, normalizeEntryMeta } from "../shared";
import { saveSettings } from "./storage";
import { applySummaryActivation, createChapterEntry } from "./world-book";
import { copyLmbEntries } from "./book-copy";

const previous = (globalThis as any).spindle;
afterAll(() => { (globalThis as any).spindle = previous; });

test("summary conversion reports partial failure and retries without changing coverage or disabled state", async () => {
  const userId = "activation-retry", chatId = "activation-chat";
  const meta = normalizeEntryMeta({ tier: 1, chatId, msgIds: ["source"] })!;
  const rows = ["first", "second", "ghost"].map((id) => ({ id, constant: true, vectorized: false, disabled: id === "ghost",
    extensions: { lumibooks: { ...meta, ghost: id === "ghost" } } }));
  let fail = true;
  const updates: string[] = [];
  (globalThis as any).spindle = {
    userStorage: { async exists() { return false; }, async setJson() {} },
    world_books: { async list() { return { data: [{ id: "shelf", metadata: { lumibooks_chat_id: chatId } }, { id: "foreign" }], total: 2 }; },
      entries: {
        async list(id: string) { expect(id).toBe("shelf"); return { data: rows, total: rows.length }; },
        async update(id: string, patch: any) { if (id === "second" && fail) throw new Error("unavailable"); updates.push(id); Object.assign(rows.find((r) => r.id === id)!, patch); },
      } },
  };
  await saveSettings(userId, { ...DEFAULT_SETTINGS, summaryActivationMode: "vector" });
  expect(await applySummaryActivation(userId)).toEqual({ updated: 2, failed: 1 });
  fail = false;
  expect(await applySummaryActivation(userId)).toEqual({ updated: 1, failed: 0 });
  expect(updates).toEqual(["first", "ghost", "second"]);
  expect(rows.every((r) => r.vectorized && !r.constant)).toBe(true);
  expect(rows[2]!.disabled).toBe(true);
  expect(rows.every((r) => r.extensions.lumibooks.msgIds[0] === "source")).toBe(true);
});

test("new and regenerated summaries read the current mode at commit, preserving metadata and keys", async () => {
  const userId = "activation-commit", meta = normalizeEntryMeta({ tier: 2, chatId: "chat", msgIds: ["source"] })!;
  let row: any;
  (globalThis as any).spindle = { userStorage: { async exists() { return false; }, async setJson() {} }, world_books: { entries: {
    async create(_book: string, payload: any) { return row = { ...payload, id: "stable" }; },
    async update(id: string, payload: any) { expect(id).toBe("stable"); return row = { ...row, ...payload }; },
  } } };
  await saveSettings(userId, { ...DEFAULT_SETTINGS, summaryActivationMode: "vector" });
  await createChapterEntry("book", meta, "old", "Title", userId, ["name"]);
  expect(row).toMatchObject({ vectorized: true, constant: false, key: ["name"] });
  row.extensions.foreign = { keep: true };
  await saveSettings(userId, { ...DEFAULT_SETTINGS, summaryActivationMode: "keywords" });
  await createChapterEntry("book", meta, "new", "Title", userId, ["updated"], false, { raw: row, meta });
  expect(row).toMatchObject({ id: "stable", content: "new", vectorized: false, constant: false, key: ["updated"], extensions: { foreign: { keep: true } } });
  await saveSettings(userId, { ...DEFAULT_SETTINGS, summaryActivationMode: "vector" });
  await copyLmbEntries("fork-book", [{ raw: row, meta }], userId, () => ({ msgIds: ["fork-source"], extra: { chatId: "fork" } }));
  expect(row).toMatchObject({ vectorized: true, constant: false, extensions: { lumibooks: { chatId: "fork", msgIds: ["fork-source"] } } });
});

import { afterEach, expect, test } from "bun:test";
import type { SpindleAPI } from "lumiverse-spindle-types";
import { handleLumiAgentCodex, registerLumiAgentCodex } from "./lumiagent";

const original = (globalThis as any).spindle;
afterEach(() => { (globalThis as any).spindle = original; });

test("guide discovery and topic reads need no character, chat or storage calls", async () => {
  (globalThis as any).spindle = new Proxy({}, { get: () => { throw new Error("Unexpected host data access"); } });
  const changed = () => { throw new Error("Unexpected write callback"); };
  const manifest = await handleLumiAgentCodex({ op: "describe" }, changed) as any;
  expect(manifest.surfaces.some((s: any) => s.id === "lumi_books.codex")).toBe(true);
  const surface = manifest.surfaces.find((s: any) => s.id === "lumibooks_docs");
  expect(surface.scope).toBe("global");
  const request = { surfaceId: surface.id };
  const listed = await handleLumiAgentCodex({ ...request, op: "list_items" }, changed) as any;
  expect(listed.total).toBe(listed.items.length);
  expect(new Set(listed.items.map((item: any) => item.id)).size).toBe(listed.total);
  expect(JSON.stringify(listed).length).toBeLessThan(1300);
  for (const item of listed.items) {
    expect(item.text).toBeUndefined();
    const page = await handleLumiAgentCodex({ ...request, op: "read_item", itemId: item.id }, changed) as any;
    expect(typeof page.value).toBe("string");
    expect(page.value.length).toBeGreaterThan(100);
    expect(page.value.length).toBeLessThan(2300);
    expect(await handleLumiAgentCodex({ ...request, op: "read_item", itemId: item.id, field: "text" }, changed)).toEqual(page);
  }
  const prompt = await handleLumiAgentCodex({ op: "system_prompt", userId: "user" }, changed) as any;
  expect(prompt.text.length).toBeLessThan(400);
  expect(prompt.text).toContain("lumibooks_docs");
});

test("documentation rejects invalid targets and cannot become a Codex mutation", async () => {
  const changed = () => { throw new Error("Unexpected write callback"); };
  const request = { surfaceId: "lumibooks_docs", itemId: "overview" };
  await expect(handleLumiAgentCodex({ ...request, op: "read_item", itemId: "missing" }, changed)).rejects.toThrow("Unknown LumiBooks topic");
  await expect(handleLumiAgentCodex({ ...request, op: "read_item", field: "content" }, changed)).rejects.toThrow("field text");
  expect(await handleLumiAgentCodex({ ...request, op: "write_field", field: "text", value: "changed" }, changed)).toEqual({ ok: false, error: "LumiBooks documentation is read-only" });
  await expect(handleLumiAgentCodex({ ...request, op: "delete_item" }, changed)).rejects.toThrow("Unknown LumiBooks documentation operation");
  await expect(handleLumiAgentCodex({ op: "read_item", surfaceId: "lumi_books.codex", itemId: "record" }, changed)).rejects.toThrow("Missing userId");
});

test("registered phone line checks attested caller before accepting a documentation envelope", async () => {
  let handler!: (context: { requesterExtensionId: string }) => Promise<any>;
  let reads = 0, envelope: unknown = { op: "list_items", surfaceId: "lumibooks_docs" };
  (globalThis as any).spindle = { rpcPool: {
    handle: (endpoint: string, fn: typeof handler, policy: unknown) => {
      expect(endpoint).toBe("lumi_books.phoneline");
      expect(policy).toEqual({ requires: ["characters", "chats", "world_books"] }); handler = fn;
    },
    read: async (endpoint: string) => { expect(endpoint).toBe("lumiagent.phoneline_request"); reads++; return envelope; },
  } } as unknown as SpindleAPI;
  registerLumiAgentCodex(() => { throw new Error("Unexpected write callback"); });
  await expect(handler({ requesterExtensionId: "foreign" })).rejects.toThrow("Unauthorized");
  expect(reads).toBe(0);
  expect((await handler({ requesterExtensionId: "lumiagent" })).total).toBeGreaterThan(0);
  envelope = null;
  await expect(handler({ requesterExtensionId: "lumiagent" })).rejects.toThrow("Invalid Codex request");
});

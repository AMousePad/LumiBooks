import { expect, test } from "bun:test";
import { automaticMessageMatch, exactMessageMatch, hashRawMessages, makeFingerprint, parseFingerprint } from "./summary-matching";

test("raw fingerprints preserve macro text, whitespace and roles but ignore host IDs", async () => {
  const raw = { id: "old", role: "user", content: "{{random::a::b}}\n你好 " };
  const hashes = await hashRawMessages([raw, { ...raw, id: "new" }, { ...raw, content: raw.content.trim() }, { ...raw, role: "assistant" }]);
  expect(hashes[0]).toBe(hashes[1]);
  expect(hashes[0]).not.toBe(hashes[2]);
  expect(hashes[0]).not.toBe(hashes[3]);
  const fingerprint = await makeFingerprint([{ index: 0, hash: hashes[0]! }]);
  expect(await parseFingerprint(fingerprint)).toEqual(fingerprint);
  await expect(parseFingerprint({ ...fingerprint, messages: [{ index: 1, hash: hashes[0] }] })).rejects.toThrow("damaged");
});

test("exact and automatic matching preserve sparse coverage without guessing repeated or edited text", async () => {
  const source = await makeFingerprint([{ index: 0, hash: "a" }, { index: 2, hash: "b" }]);
  expect(exactMessageMatch(source, ["a", "gap", "b", "later"])).toEqual([0, 2]);
  expect(exactMessageMatch(source, ["intro", "a", "b"])).toBeNull();
  expect(automaticMessageMatch(source, ["intro", "a", "inserted", "b", "tail"])).toEqual([1, 3]);
  expect(automaticMessageMatch(source, ["a", "a", "b"])).toBeNull();
  expect(automaticMessageMatch(source, ["a", "edited"])).toBeNull();
});

test("matching large histories is ordered and handles repeated content with a unique alignment", async () => {
  const hashes = Array.from({ length: 50000 }, (_, i) => String(i));
  const source = await makeFingerprint(hashes.filter((_, i) => i % 2 === 0).map((hash, index) => ({ hash, index: index * 2 })));
  expect(automaticMessageMatch(source, ["extra", ...hashes])?.length).toBe(25000);
  expect(automaticMessageMatch(await makeFingerprint([{ index: 0, hash: "a" }, { index: 1, hash: "a" }]), ["a", "a"])).toEqual([0, 1]);
});

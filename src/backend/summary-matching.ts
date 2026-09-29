/** Hash stored content, never prompt/rendered text or message IDs. */
export interface RawSummaryMessage { id: string; role: string; content: string }
export interface SummaryFingerprint {
  version: 1;
  algorithm: "sha256-role-content-v1";
  contentHash: string;
  messages: Array<{ index: number; hash: string }>;
}

const encoder = new TextEncoder();
async function sha256(text: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
  return Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("");
}

export async function hashRawMessages(messages: readonly RawSummaryMessage[], progress?: (done: number) => void): Promise<string[]> {
  const hashes: string[] = [];
  // Bound concurrency/memory and yield between batches so other chats and
  // progress updates remain responsive even for very large histories.
  for (let offset = 0; offset < messages.length; offset += 64) {
    hashes.push(...await Promise.all(messages.slice(offset, offset + 64).map((m) => sha256(JSON.stringify([m.role, m.content])))));
    progress?.(hashes.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return hashes;
}

export async function makeFingerprint(messages: SummaryFingerprint["messages"]): Promise<SummaryFingerprint> {
  return { version: 1, algorithm: "sha256-role-content-v1", contentHash: await sha256(JSON.stringify(messages)), messages };
}

export async function parseFingerprint(raw: unknown): Promise<SummaryFingerprint | null> {
  if (raw === undefined) return null; // Ordinary/older lorebooks remain usable.
  const v = raw as SummaryFingerprint;
  if (!v || v.version !== 1 || v.algorithm !== "sha256-role-content-v1" || !Array.isArray(v.messages)
      || v.messages.length > 1_000_000 || !/^[a-f0-9]{64}$/.test(v.contentHash)) throw new Error("Invalid summary message fingerprint");
  let previous = -1;
  for (const m of v.messages) {
    if (!m || !Number.isSafeInteger(m.index) || m.index <= previous || !/^[a-f0-9]{64}$/.test(m.hash)) throw new Error("Invalid summary message fingerprint");
    previous = m.index;
  }
  if ((await makeFingerprint(v.messages)).contentHash !== v.contentHash) throw new Error("The summary message fingerprint is damaged");
  return v;
}

export function exactMessageMatch(source: SummaryFingerprint, hashes: readonly string[]): number[] | null {
  return source.messages.every((m) => hashes[m.index] === m.hash) ? source.messages.map((m) => m.index) : null;
}

/** Linear time subsequence matching. Earliest and latest valid alignments
 * must agree, otherwise repeated messages make the destination ambiguous. */
export function automaticMessageMatch(source: SummaryFingerprint, hashes: readonly string[]): number[] | null {
  const first: number[] = [], last: number[] = [];
  let cursor = 0;
  for (const m of source.messages) {
    while (cursor < hashes.length && hashes[cursor] !== m.hash) cursor++;
    if (cursor === hashes.length) return null;
    first.push(cursor++);
  }
  cursor = hashes.length - 1;
  for (let i = source.messages.length - 1; i >= 0; i--) {
    while (cursor >= 0 && hashes[cursor] !== source.messages[i]!.hash) cursor--;
    if (cursor < 0) return null;
    last[i] = cursor--;
  }
  return first.every((at, i) => at === last[i]) ? first : null;
}

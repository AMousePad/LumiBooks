import type { FrontendToBackend } from "../types";

type FileState = "on" | "noInject" | "frozen";
type Pending = { confirmed: FileState; desired: FileState; sent: FileState; seq: number; send: (msg: FrontendToBackend) => void };

/** Coalesce rapid clicks while keeping at most one save per chat/file in flight. */
export class CodexFileStateChanges {
  private pending = new Map<string, Pending>();
  private sequence = 0;
  private key(chatId: string, file: string): string { return JSON.stringify([chatId, file]); }

  value(chatId: string, file: string, fallback: FileState): FileState {
    return this.pending.get(this.key(chatId, file))?.desired ?? fallback;
  }

  change(chatId: string, file: string, current: FileState, desired: FileState, send: Pending["send"]): void {
    const key = this.key(chatId, file);
    const existing = this.pending.get(key);
    if (existing) { existing.desired = desired; return; }
    const pending: Pending = { confirmed: current, desired, sent: desired, seq: ++this.sequence, send };
    this.pending.set(key, pending);
    send({ type: "codex_set_file_state", chatId, file, state: desired, seq: pending.seq });
  }

  acknowledge(chatId: string, file: string, seq: number, error = false): FileState | null {
    const key = this.key(chatId, file), pending = this.pending.get(key);
    if (!pending || pending.seq !== seq) return null;
    if (error) { this.pending.delete(key); return pending.confirmed; }
    pending.confirmed = pending.sent;
    if (pending.desired === pending.sent) this.pending.delete(key);
    else {
      pending.sent = pending.desired;
      pending.seq = ++this.sequence;
      pending.send({ type: "codex_set_file_state", chatId, file, state: pending.sent, seq: pending.seq });
    }
    return pending.confirmed;
  }

  clear(): void { this.pending.clear(); }
}

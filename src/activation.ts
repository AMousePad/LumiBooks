export type ActivationMode = "always" | "keywords" | "vector";

export function normalizeActivationMode(value: unknown, fallback: ActivationMode): ActivationMode {
  return value === "always" || value === "keywords" || value === "vector" ? value : fallback;
}

/** Timeline and threads remain the Codex's always-present context. */
export function activationFlags(mode: ActivationMode, pinned = false) {
  return { constant: pinned || mode === "always", vectorized: !pinned && mode === "vector" };
}

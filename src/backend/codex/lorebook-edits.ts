/** Compare against what we last wrote, so profile/model changes and manual
 * edits are distinguishable. Each edited field stays owned by the lorebook. */
export const EDITABLE_CODEX_FIELDS = ["content", "comment", "key", "keysecondary", "constant", "vectorized", "disabled", "position", "depth", "role"] as const;
export type EntryFields = Record<string, unknown>;
export interface LorebookEditState { applied?: EntryFields; overrides?: EntryFields }

export function mergeLorebookEdits(raw: EntryFields, generated: EntryFields, previous: LorebookEditState, constraints: { disabled: boolean; vectorOnly: boolean }): { fields: EntryFields; state: LorebookEditState } {
  const overrides: EntryFields = {};
  for (const field of EDITABLE_CODEX_FIELDS) if (previous.overrides?.[field] !== undefined) overrides[field] = previous.overrides[field];
  for (const field of EDITABLE_CODEX_FIELDS) {
    const baseline = previous.applied?.[field] ?? generated[field];
    if (raw[field] !== undefined && JSON.stringify(raw[field]) !== JSON.stringify(baseline)) overrides[field] = raw[field];
  }
  const fields = { ...generated, ...overrides };
  if (constraints.disabled) fields.disabled = true;
  if (constraints.vectorOnly) Object.assign(fields, { constant: false, vectorized: true, key: [], keysecondary: [] });
  return { fields, state: { applied: fields, overrides } };
}

export interface ExtraFieldDraft {
  key: string;
  type: "string" | "number" | "boolean" | "list";
  value: string;
}

export function draftExtraFields(entity: Record<string, unknown>, known: ReadonlySet<string>): ExtraFieldDraft[] {
  return Object.entries(entity).flatMap(([key, value]): ExtraFieldDraft[] => {
    if (known.has(key) || key === "__proto__") return [];
    if (typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) {
      return [{ key, type: typeof value as "string" | "number" | "boolean", value: String(value) }];
    }
    if (Array.isArray(value) && value.every(item => typeof item === "string")) {
      return [{ key, type: "list", value: value.join("\n") }];
    }
    return [];
  });
}

export function applyExtraFields(entity: Record<string, unknown>, fields: ExtraFieldDraft[]): void {
  for (const field of fields) {
    if (field.key === "__proto__") continue;
    const value = field.value.trim();
    if (!value) { delete entity[field.key]; continue; }
    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number)) throw new Error(`${field.key} must be a valid number.`);
      entity[field.key] = number;
    } else if (field.type === "list") {
      entity[field.key] = value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    } else if (field.type === "boolean") {
      entity[field.key] = value === "true";
    } else {
      entity[field.key] = value;
    }
  }
}

import type { SpindleFrontendContext } from "lumiverse-spindle-types";

let hostUuid: SpindleFrontendContext["uuid"];

export function bindHostUuid(ctx: Pick<SpindleFrontendContext, "uuid">): void {
  hostUuid = ctx.uuid;
}

/** Hosts below 1.3.0 have no ctx.uuid, and these IDs only correlate messages. */
export function newId(): string {
  return hostUuid?.v4() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

import shortCommentRulesTxt from "../prompts/memoria/short-comment-rules.txt";
import personaTxt from "../prompts/memoria/persona.txt";

export const DEFAULT_SHORT_COMMENT_RULES_TEMPLATE = shortCommentRulesTxt;

const FIRE_PHRASES: string[] = [
  "Memoria stirs the inkpot, nyaa~",
  "Memoria is shelving this scene, hush a moment",
  "Memoria flicks her tail and starts writing",
  "Memoria opens a fresh page for you, nya",
  "Memoria pads off to compress this in the stacks",
];

const RETRY_PHRASES: string[] = [
  "Memoria tripped on a quill, trying again",
  "Memoria's ink smudged, one more try nyaa",
  "Memoria reshuffles the index cards, retrying",
];

const SUCCESS_PHRASES: string[] = [
  "Memoria slid the chapter onto your shelf, nyaa~",
  "Memoria filed it neatly between the others",
  "Memoria stamped the spine, all yours",
  "Memoria purrs, the page is done",
  "Memoria taps the chapter into place",
];

const ARC_FIRE_PHRASES: string[] = [
  "Memoria gathers the chapters for an arc, nya",
  "Memoria is binding several chapters together",
];

const ARC_SUCCESS_PHRASES: string[] = [
  "Memoria bound the arc and pressed it shut, nyaa~",
  "Memoria stitched the spine of a new arc",
];

const VOLUME_FIRE_PHRASES: string[] = [
  "Memoria is pressing a whole volume together",
];

const VOLUME_SUCCESS_PHRASES: string[] = [
  "Memoria embossed the spine of a new volume",
];

export type PhraseKind = "fire" | "retry" | "success" | "arc_fire" | "arc_success" | "volume_fire" | "volume_success";

export function pickPhrase(kind: PhraseKind): string {
  const pool =
    kind === "fire" ? FIRE_PHRASES
      : kind === "retry" ? RETRY_PHRASES
      : kind === "success" ? SUCCESS_PHRASES
      : kind === "arc_fire" ? ARC_FIRE_PHRASES
      : kind === "arc_success" ? ARC_SUCCESS_PHRASES
      : kind === "volume_fire" ? VOLUME_FIRE_PHRASES
      : VOLUME_SUCCESS_PHRASES;
  return pool[Math.floor(Math.random() * pool.length)] ?? "Memoria nyaa";
}

export const MEMORIA_PERSONA_LINE = personaTxt;

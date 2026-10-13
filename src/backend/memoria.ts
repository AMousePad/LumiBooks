import { t as tr } from "../i18n";
import shortCommentRulesTxt from "../prompts/memoria/short-comment-rules.txt";
import personaTxt from "../prompts/memoria/persona.txt";

export const DEFAULT_SHORT_COMMENT_RULES_TEMPLATE = shortCommentRulesTxt;

const FIRE_PHRASES: string[] = [
  tr("backend.memoria.firePhrases.memoriaStirsTheInkpotNyaa"),
  tr("backend.memoria.firePhrases.memoriaIsShelvingThisSceneHushA"),
  tr("backend.memoria.firePhrases.memoriaFlicksHerTailAndStartsWriting"),
  tr("backend.memoria.firePhrases.memoriaOpensAFreshPageForYou"),
  tr("backend.memoria.firePhrases.memoriaPadsOffToCompressThisIn"),
];

const RETRY_PHRASES: string[] = [
  tr("backend.memoria.retryPhrases.memoriaTrippedOnAQuillTryingAgain"),
  tr("backend.memoria.retryPhrases.memoriaSInkSmudgedOneMoreTry"),
  tr("backend.memoria.retryPhrases.memoriaReshufflesTheIndexCardsRetrying"),
];

const SUCCESS_PHRASES: string[] = [
  tr("backend.memoria.successPhrases.memoriaSlidTheChapterOntoYourShelf"),
  tr("backend.memoria.successPhrases.memoriaFiledItNeatlyBetweenTheOthers"),
  tr("backend.memoria.successPhrases.memoriaStampedTheSpineAllYours"),
  tr("backend.memoria.successPhrases.memoriaPurrsThePageIsDone"),
  tr("backend.memoria.successPhrases.memoriaTapsTheChapterIntoPlace"),
];

const ARC_FIRE_PHRASES: string[] = [
  tr("backend.memoria.arcFirePhrases.memoriaGathersTheChaptersForAnArc"),
  tr("backend.memoria.arcFirePhrases.memoriaIsBindingSeveralChaptersTogether"),
];

const ARC_SUCCESS_PHRASES: string[] = [
  tr("backend.memoria.arcSuccessPhrases.memoriaBoundTheArcAndPressedIt"),
  tr("backend.memoria.arcSuccessPhrases.memoriaStitchedTheSpineOfANew"),
];

const VOLUME_FIRE_PHRASES: string[] = [
  tr("backend.memoria.volumeFirePhrases.memoriaIsPressingAWholeVolumeTogether"),
];

const VOLUME_SUCCESS_PHRASES: string[] = [
  tr("backend.memoria.volumeSuccessPhrases.memoriaEmbossedTheSpineOfANew"),
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
  return pool[Math.floor(Math.random() * pool.length)] ?? tr("backend.memoria.pickPhrase.memoriaNyaa");
}

export const MEMORIA_PERSONA_LINE = personaTxt;

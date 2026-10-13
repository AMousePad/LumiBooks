import { describe, expect, test } from "bun:test";
import { createTranslator, t, type Catalog, type MessageKey } from "./index";
import english from "../locales/en.json";
import { flattenCatalog, messageArguments } from "../../scripts/locale-tools";
import { IntlMessageFormat } from "intl-messageformat";

const key: MessageKey = "ui.common.messageCount";
const catalog = (message: string): Catalog => ({ ui: { common: { messageCount: message } } });

describe("locale formatting and fallback", () => {
  test("keeps interpolation values literal, including markup and ICU syntax", () => {
    const value = '<img src=x onerror=alert(1)> {count, plural, other {oops}}';
    expect(t("ui.components.formatTokens.thousands", { value })).toBe(`${value}k`);
    expect(t("ui.tabs.promptsTab.renderTemplateRow.hostMacrosLikeUserAlsoWorkThey")).toContain("{{user}}");
    expect(t("ui.tabs.promptsTab.lines.memoriaShortCommentRulesExpandsToThis")).toBe("{{memoria_short_comment_rules}} expands to this turn's nyandere short-comment rules.");
    expect(t("ui.tabs.booksTab.buildMessageRow.value", { indexInChat1: 68 })).toBe("#68");
  });

  test("preserves English ranges and conditional labels", () => {
    expect(t("ui.lessons.fixture.comment.msgs", { n: 72, title: "Title", first1: 56, last1: 67 })).toBe("#72 - Title (msgs 56-67)");
    expect(t("backend.pipeline.comment.arc", { choice: "yes", sceneNumber: 4, baseComment: "Test" })).toBe("[Root] Arc #4 - Test");
    expect(t("backend.pipeline.comment.arc", { choice: "no", sceneNumber: 4, baseComment: "Test" })).toBe("Arc #4 - Test");
    expect(t("backend.codex.index.reportCodexFailure.memoriaCouldnTTheCodex", { verb: "tidy", shortErrorText: "test" })).toBe("Couldn't tidy the Codex: test");
    expect(t("shared.summaryKindTag", { kind: "codex" })).toBe("Codex");
    expect(t("ui.tabs.codexTab.renderOverview.messageUnindexed", { codexBacklog: 2 })).toBe("2 messages unindexed");
  });

  test("uses locale plural rules and allows complete sentence reordering", () => {
    const fr = createTranslator("fr", { fr: catalog("{count, plural, one {# message} other {# messages}}") });
    expect(fr(key, { count: 0 })).toBe("0 message");
    expect(fr(key, { count: 2 })).toBe("2 messages");
    const ar = createTranslator("ar", { ar: catalog("{count, plural, zero {zero} one {one} two {two} few {few} many {many} other {other}}") });
    expect([0, 1, 2, 3, 11, 100].map(count => ar(key, { count }))).toEqual(["zero", "one", "two", "few", "many", "other"]);
    const ordinal = createTranslator("en-GB", { "en-GB": catalog("{count, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}") });
    expect([1, 2, 3, 11, 21].map(count => ordinal(key, { count }))).toEqual(["1st", "2nd", "3rd", "11th", "21st"]);
  });

  test("falls back from regional resources to language, then English", () => {
    const tr = createTranslator("fr-CA", { "fr-CA": catalog("{count} régional"), fr: { ui: { common: { role: "rôle {role}" } } } });
    expect(tr(key, { count: 2 })).toBe("2 régional");
    expect(tr("ui.common.role", { role: "user" })).toBe("rôle user");
    expect(tr("ui.tabs.booksTab.buildMessageRow.empty")).toBe("(empty)");
    expect(createTranslator("fr-CA", { fr: catalog("{count} français") })(key, { count: 3 })).toBe("3 français");
    expect(createTranslator("de")(key, { count: 2 })).toBe("2 msgs");
    expect(createTranslator("not_a_locale")(key, { count: 2 })).toBe("2 msgs");
  });

  test("recovers from invalid translations without hiding English authoring mistakes", () => {
    for (const message of ["", "{broken", "{missing}"]) {
      expect(createTranslator("fr", { fr: catalog(message) })(key, { count: 2 })).toBe("2 msgs");
    }
    expect(() => t(key)).toThrow();
    expect(() => t("missing.key" as MessageKey)).toThrow("Missing English message");
    expect(() => t("constructor.toString" as MessageKey)).toThrow("Missing English message");
  });

  test("keeps translator instances independent", () => {
    const a = createTranslator("fr", { fr: catalog("{count} français") });
    const b = createTranslator("fr", { fr: catalog("{count} autre") });
    expect(a(key, { count: 1 })).toBe("1 français");
    expect(b(key, { count: 1 })).toBe("1 autre");
    expect(t(key, { count: 1 })).toBe("1 msgs");
  });

  test("every English message parses and formats with representative arguments", () => {
    for (const [key, message] of flattenCatalog(english)) {
      const args = messageArguments(message);
      for (const count of [0, 1, 2]) {
        const values = Object.fromEntries([...args].map(name => [name, count]));
        expect(typeof new IntlMessageFormat(message, "en", undefined, { ignoreTag: true }).format(values), key).toBe("string");
      }
    }
  });
});

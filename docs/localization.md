# Localization

Edit application copy in [`src/locales/en.json`](../src/locales/en.json). It is the source of truth for labels, tooltips, notices, backend errors, lessons, sample lesson content, and the Codex guide. Keys are grouped by feature and component; keep existing keys stable when rewording their values. `guides.codex.markdown` generates the readable `src/codex.md` during the build.

The app still runs in English. There is no language picker, automatic language detection, or translated language pack. User chat content, model output, host-supplied names/errors, custom field names, and saved user-authored text are displayed as supplied. Model prompts and their protocol identifiers, diagnostic logs, and developer console messages are separate from the application catalog.

## Messages

The formatter uses [FormatJS IntlMessageFormat](https://formatjs.github.io/docs/intl-messageformat/) and [ICU MessageFormat syntax](https://formatjs.github.io/docs/core-concepts/icu-syntax/). The same implementation runs in Bun and the browser, with bundled resources and no runtime downloads.

```ts
import { t as tr } from "../i18n";

tr("ui.common.messageCount", { count: messages.length });
```

Named arguments remain outside the text. Translate complete messages; arguments can be moved to suit the language. Use ICU `plural`, `selectordinal`, and `select` for grammatical choices, rather than appending English suffixes in TypeScript. A translation of the message above might be:

```json
{
  "ui": {
    "common": {
      "messageCount": "{count, plural, one {# message} other {# messages}}"
    }
  }
}
```

Preserve argument names, macro tokens, technical identifiers, and branch selector values. An apostrophe is written as `''` in ICU text. Quote literal brace sequences as a unit: `'{{user}}'` displays `{{user}}`. Inside a plural branch, `#` is the formatted count; use `'#'` there for a literal hash. Outside a plural branch, write a normal `#`.

Messages and interpolated values are plain text, rendered through `textContent` or text nodes. Never insert a translated message with `innerHTML`. ICU rich-text tags are disabled. Do not use displayed labels as control values or compare translated text to determine state.

## Future language packs

Add a partial catalog at `src/locales/<BCP-47 locale>.json`, such as `fr.json` or `fr-CA.json`, following the English key structure. Omit unfinished entries. Build validation rejects unknown keys, empty values, malformed ICU, and mismatched arguments.

`createTranslator(locale, catalogs)` accepts bundled catalogs and creates an isolated formatter. Resolution tries the requested region, its language, and English. Missing or invalid translated messages fall back; missing English messages and invalid English arguments throw. The formatter cache is bounded to 512 messages per instance.

Language-pack files are not loaded automatically. When language preferences are introduced, explicitly bundle/register the packs and pass the selected account's translator to UI and backend consumers before constructing their metadata. The current `t` export and module-level lesson/label definitions deliberately remain English; they do not support live language switching. Avoid a mutable global backend locale shared by accounts.

## Checks

- `bun run check:locales` checks ICU syntax, catalog references, argument parity, and unused English entries.
- `bun run check:lessons` checks lesson anchors and error exhibits against messages referenced by the live implementation.
- `bun test src` covers formatting, fallback, literal macros, plurals, and the existing application regressions.
- `bun run build` runs both catalog checks, exports the guide, and bundles the extension.

The checker verifies explicit catalog calls; it cannot prove that arbitrary new strings are user-facing. Route new application copy through the catalog during review. Keep operational IDs, model protocols, user text, and diagnostic event data out of it.

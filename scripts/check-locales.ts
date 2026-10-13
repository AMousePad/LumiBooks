import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { flattenCatalog, messageArguments, messageCalls, sourceFiles } from "./locale-tools";

const root = join(import.meta.dir, "..");
const directory = join(root, "src/locales");
const english = flattenCatalog(JSON.parse(readFileSync(join(directory, "en.json"), "utf8")));
const expected = new Map([...english].map(([key, value]) => [key, messageArguments(value)]));
let failures = 0;
const fail = (message: string) => { console.error(message); failures++; };
const same = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(key => b.has(key));

for (const file of readdirSync(directory).filter(name => name.endsWith(".json"))) {
  const locale = file.slice(0, -5);
  if (Intl.getCanonicalLocales(locale)[0] !== locale) fail(`${file}: use a canonical BCP 47 locale name`);
  const catalog = flattenCatalog(JSON.parse(readFileSync(join(directory, file), "utf8")));
  for (const [key, value] of catalog) {
    if (!expected.has(key)) { fail(`${file}: unknown message ${key}`); continue; }
    if (!value.trim()) { fail(`${file}: empty message ${key}; omit untranslated keys for fallback`); continue; }
    try {
      if (!same(messageArguments(value, locale), expected.get(key)!)) fail(`${file}: placeholder mismatch for ${key}`);
    } catch (error) { fail(`${file}: invalid ICU message ${key}: ${error}`); }
  }
}

const calls = sourceFiles(join(root, "src")).flatMap(messageCalls);
// This guide is exported to Markdown for readers, rather than rendered in the app.
const used = new Set(["guides.codex.markdown"]);
for (const call of calls) {
  used.add(call.key);
  const args = expected.get(call.key);
  if (!args) fail(`${call.location}: missing message ${call.key}`);
  else if (!same(args, call.args)) fail(`${call.location}: ${call.key} expects [${[...args]}], received [${[...call.args]}]`);
}
for (const key of english.keys()) if (!used.has(key)) fail(`en.json: unused message ${key}`);
if (failures) process.exit(1);
console.log(`Locales checked: ${english.size} English messages, ${calls.length} source references.`);

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import ts from "typescript";

export function flattenCatalog(value: unknown, prefix = "", out = new Map<string, string>()): Map<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid catalog group: ${prefix}`);
  for (const [key, child] of Object.entries(value)) {
    if (!/^[a-zA-Z0-9]+$/.test(key) || ["__proto__", "constructor", "prototype"].includes(key)) throw new Error(`Invalid catalog key: ${prefix}.${key}`);
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") out.set(path, child);
    else flattenCatalog(child, path, out);
  }
  return out;
}

/** Includes arguments in every select/plural branch, not just the default. */
export function messageArguments(message: string, locale = "en"): Set<string> {
  const result = new Set<string>();
  const visit = (nodes: ReturnType<IntlMessageFormat["getAst"]>) => {
    for (const node of nodes) {
      if (node.type >= 1 && node.type <= 6) result.add(node.value);
      if (node.type === 5 || node.type === 6) for (const option of Object.values(node.options)) visit(option.value);
    }
  };
  visit(new IntlMessageFormat(message, locale, undefined, { ignoreTag: true }).getAst());
  return result;
}

export function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : [];
  });
}

export interface MessageCall { key: string; args: Set<string>; location: string }
export function messageCalls(file: string): MessageCall[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const names = new Set<string>();
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || !/\/i18n(?:\/index)?$/.test(node.moduleSpecifier.text)) continue;
    const bindings = node.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const spec of bindings.elements) {
      if ((spec.propertyName ?? spec.name).text === "t") names.add(spec.name.text);
    }
  }
  const calls: MessageCall[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && names.has(node.expression.text)) {
      const location = `${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
      const key = node.arguments[0];
      if (!key || !ts.isStringLiteral(key)) throw new Error(`${location}: message keys must be static`);
      const values = node.arguments[1];
      const args = new Set<string>();
      if (values) {
        if (!ts.isObjectLiteralExpression(values)) throw new Error(`${location}: message arguments must be explicit`);
        for (const prop of values.properties) {
          if ((!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) || !prop.name || (!ts.isIdentifier(prop.name) && !ts.isStringLiteral(prop.name))) throw new Error(`${location}: unsupported message argument`);
          args.add(prop.name.text);
        }
      }
      calls.push({ key: key.text, args, location });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return calls;
}

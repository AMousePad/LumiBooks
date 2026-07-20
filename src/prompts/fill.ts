/** Fill {{TOKEN}} holes in a prompt template. Unknown tokens survive
 * untouched so host macros ({{user}}, {{pick::...}}) pass through to the
 * host's macro resolver instead of being eaten here. */
export function fillPrompt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

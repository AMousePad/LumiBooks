// Prompt text lives in .txt files under src/prompts and is imported as a
// string. Bun's text loader inlines the content into both bundles at build
// time (dist/ ships no loose .txt), so these imports are static.
declare module "*.txt" {
  const content: string;
  export default content;
}

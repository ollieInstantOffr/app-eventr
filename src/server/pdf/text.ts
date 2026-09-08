/**
 * pdf-lib's standard fonts are WinAnsi-encoded and throw on anything outside
 * it — an arrow or a curly quote in the copy is enough to fail a download.
 * Rather than police the source text, transliterate on the way into a PDF.
 */
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/[‘’‚‹›]/g, "'"],
  [/[“”„]/g, '"'],
  [/[–—−]/g, "-"],
  [/…/g, "..."],
  [/[→⇒]/g, "->"],
  [/[←⇐]/g, "<-"],
  [/•/g, "-"],
  [/ /g, " "],
  [/[✓✔]/g, "v"],
  [/×/g, "x"],
];

export function pdfText(value: string): string {
  let text = value;
  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  // Anything still outside WinAnsi would throw, so drop it rather than fail
  // the whole document.
  return text.replace(/[^ -ÿ]/g, "");
}

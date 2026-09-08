import "server-only";

/**
 * A leading =, +, - or @ makes a spreadsheet treat a cell as a formula, so a
 * guest could type one into their company field and have it execute when the
 * organiser opens the export. Prefixing with a quote defuses it.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = typeof value === "boolean" ? (value ? "yes" : "no") : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(escapeCell).join(",") + "\r\n";
}

/** UTF-8 BOM, so Excel gets the diacritics right. */
export const CSV_BOM = "﻿";

/**
 * Streams the rows a page at a time, so a 50,000-entry export doesn't
 * assemble the whole file in memory first.
 */
export function csvStream(
  header: string[],
  pages: () => AsyncGenerator<unknown[][], void, unknown>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(CSV_BOM + csvRow(header)));
      try {
        for await (const page of pages()) {
          let chunk = "";
          for (const row of page) chunk += csvRow(row);
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        controller.error(error);
        return;
      }
      controller.close();
    },
  });
}

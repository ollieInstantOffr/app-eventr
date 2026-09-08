import "server-only";
import QRCode from "qrcode";

/** The URL printed on posters and shown on the booth screen. */
export function entryUrl(appUrl: string, slug: string): string {
  return `${appUrl.replace(/\/$/, "")}/${slug}`;
}

/** Short form for print, without the scheme — "eventr.instantoffr.com/nordic26". */
export function displayUrl(appUrl: string, slug: string): string {
  return entryUrl(appUrl, slug).replace(/^https?:\/\//, "");
}

const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 1,
  color: { dark: "#1c1a27", light: "#ffffff" },
};

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...OPTIONS, type: "svg", width: 512 });
}

export async function qrPng(url: string, width = 1024): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTIONS, type: "png", width });
}

export async function qrDataUrl(url: string, width = 512): Promise<string> {
  return QRCode.toDataURL(url, { ...OPTIONS, width });
}

/**
 * The raw module matrix, so the screens can draw the code as DOM cells that
 * inherit the event's colours instead of embedding a bitmap.
 */
export async function qrMatrix(url: string): Promise<boolean[][]> {
  const { create } = await import("qrcode");
  const code = create(url, { errorCorrectionLevel: OPTIONS.errorCorrectionLevel });
  const size = code.modules.size;
  const data = code.modules.data;

  const matrix: boolean[][] = [];
  for (let row = 0; row < size; row += 1) {
    const cells: boolean[] = [];
    for (let column = 0; column < size; column += 1) {
      cells.push(Boolean(data[row * size + column]));
    }
    matrix.push(cells);
  }
  return matrix;
}

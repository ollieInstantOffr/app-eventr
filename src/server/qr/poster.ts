import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { qrPng } from "@/server/qr/qr";
import { storage } from "@/server/storage";
import { pdfText } from "@/server/pdf/text";

// Points, at 72pt/inch.
const SIZES = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
} as const;

export type PosterSize = keyof typeof SIZES;

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return rgb(
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  );
}

/**
 * The printable poster from screen 1c: organiser logo, the scan line, the
 * prize hook, a large QR and the short URL. The QR is rendered at 1024px so
 * it stays crisp at A3.
 */
export async function buildPosterPdf(options: {
  size: PosterSize;
  eventName: string;
  organisationName: string;
  headline: string;
  prizeLine: string;
  url: string;
  displayUrl: string;
  accentColour: string;
  logoKey: string | null;
  closesAt: string | null;
}): Promise<Uint8Array> {
  const { width, height } = SIZES[options.size];
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([width, height]);

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const accent = hexToRgb(options.accentColour);
  const ink = rgb(0.11, 0.102, 0.153);
  const muted = rgb(0.431, 0.416, 0.522);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.949, 0.941, 0.921) });

  const margin = width * 0.1;
  let cursor = height - margin;

  // Organiser logo, when it is a raster we can embed. SVG logos fall back to
  // the organisation name set in type, which prints just as well.
  if (options.logoKey && /\.(png|jpg)$/.test(options.logoKey)) {
    const file = await storage.get(options.logoKey);
    if (file) {
      const image = options.logoKey.endsWith(".png")
        ? await pdf.embedPng(file.body)
        : await pdf.embedJpg(file.body);
      const logoHeight = height * 0.05;
      const scaled = image.scaleToFit(width * 0.4, logoHeight);
      page.drawImage(image, {
        x: margin,
        y: cursor - scaled.height,
        width: scaled.width,
        height: scaled.height,
      });
      cursor -= scaled.height + height * 0.03;
    }
  } else {
    const size = width * 0.035;
    page.drawText(pdfText(options.organisationName), { x: margin, y: cursor - size, size, font: bold, color: ink });
    cursor -= size + height * 0.035;
  }

  const headlineSize = width * 0.072;
  for (const line of wrap(options.headline, regular, headlineSize, width - margin * 2, bold)) {
    page.drawText(pdfText(line), { x: margin, y: cursor - headlineSize, size: headlineSize, font: bold, color: ink });
    cursor -= headlineSize * 1.15;
  }
  cursor -= height * 0.018;

  const bodySize = width * 0.032;
  for (const line of wrap(options.prizeLine, regular, bodySize, width - margin * 2, regular)) {
    page.drawText(pdfText(line), { x: margin, y: cursor - bodySize, size: bodySize, font: regular, color: muted });
    cursor -= bodySize * 1.4;
  }

  // The QR itself, on a white card.
  const qrSize = width * 0.62;
  const qrX = (width - qrSize) / 2;
  const qrY = height * 0.2;
  const pad = width * 0.035;

  page.drawRectangle({
    x: qrX - pad,
    y: qrY - pad,
    width: qrSize + pad * 2,
    height: qrSize + pad * 2,
    color: rgb(1, 1, 1),
    borderColor: accent,
    borderWidth: 2,
  });

  const qrImage = await pdf.embedPng(await qrPng(options.url, 1024));
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  const urlSize = width * 0.03;
  const urlWidth = bold.widthOfTextAtSize(pdfText(options.displayUrl), urlSize);
  page.drawText(pdfText(options.displayUrl), {
    x: (width - urlWidth) / 2,
    y: qrY - pad - urlSize * 1.6,
    size: urlSize,
    font: bold,
    color: accent,
  });

  if (options.closesAt) {
    const footSize = width * 0.026;
    const footWidth = regular.widthOfTextAtSize(pdfText(options.closesAt), footSize);
    page.drawText(pdfText(options.closesAt), {
      x: (width - footWidth) / 2,
      y: height * 0.075,
      size: footSize,
      font: regular,
      color: muted,
    });
  }

  return pdf.save();
}

type Font = Awaited<ReturnType<PDFDocument["embedFont"]>>;

function wrap(text: string, _font: Font, size: number, maxWidth: number, measure: Font): string[] {
  const words = pdfText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

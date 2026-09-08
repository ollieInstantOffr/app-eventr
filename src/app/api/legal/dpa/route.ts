import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CURRENT_DPA_VERSION, LEGAL_UPDATED_AT } from "@/lib/legal-versions";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { DPA_CLAUSES } from "@/server/gdpr/dpa";
import { pdfText } from "@/server/pdf/text";

/**
 * "Download PDF" from screen 6a. Signed in, it names the actual controller and
 * the acceptance date; signed out it renders the generic version, so a
 * prospective customer can read it before creating an account.
 */
export async function GET() {
  const session = await getSession();
  const organisation = session?.membership?.organisation ?? null;

  const acceptedBy = organisation?.dpaAcceptedById
    ? await prisma.user.findUnique({
        where: { id: organisation.dpaAcceptedById },
        select: { firstName: true, lastName: true, email: true },
      })
    : null;

  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.11, 0.102, 0.153);
  const muted = rgb(0.431, 0.416, 0.522);
  const margin = 56;
  const pageWidth = 595.28;

  let page = pdf.addPage([pageWidth, 841.89]);
  let cursor = page.getHeight() - margin;

  const write = (text: string, size: number, font = regular, colour = ink, gap = 1.45) => {
    if (cursor < margin + size * 2) {
      page = pdf.addPage([pageWidth, 841.89]);
      cursor = page.getHeight() - margin;
    }
    page.drawText(pdfText(text), { x: margin, y: cursor - size, size, font, color: colour });
    cursor -= size * gap;
  };

  const paragraph = (text: string, size = 10, font = regular, colour = muted, indent = 0) => {
    const maxWidth = pageWidth - margin * 2 - indent;
    const words = pdfText(text).split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        if (cursor < margin + size * 2) {
          page = pdf.addPage([pageWidth, 841.89]);
          cursor = page.getHeight() - margin;
        }
        page.drawText(line, { x: margin + indent, y: cursor - size, size, font, color: colour });
        cursor -= size * 1.45;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      if (cursor < margin + size * 2) {
        page = pdf.addPage([pageWidth, 841.89]);
        cursor = page.getHeight() - margin;
      }
      page.drawText(line, { x: margin + indent, y: cursor - size, size, font, color: colour });
      cursor -= size * 1.45;
    }
  };

  write("Data Processing Agreement", 20, bold);
  write(`Version ${CURRENT_DPA_VERSION} · Updated ${LEGAL_UPDATED_AT}`, 10, regular, muted, 2.6);

  paragraph(
    "This agreement forms part of the Terms of Service and governs how instantoffr (the \"Processor\") processes personal data of event guests on behalf of the Organiser (the \"Controller\") when the Controller uses Eventr. It is accepted automatically when an account is created and applies to every event in the account.",
  );
  cursor -= 10;

  write("Controller", 11, bold);
  write(organisation?.name ?? "[Organisation name]", 10, regular, muted);
  if (organisation?.replyToEmail) write(organisation.replyToEmail, 10, regular, muted);
  cursor -= 6;

  write("Processor", 11, bold);
  write("instantoffr, provider of Eventr - privacy@instantoffr.com", 10, regular, muted, 2.4);

  if (organisation?.dpaAcceptedAt) {
    const name = acceptedBy
      ? [acceptedBy.firstName, acceptedBy.lastName].filter(Boolean).join(" ") || acceptedBy.email
      : "an owner";
    paragraph(
      `Accepted by ${name} for ${organisation.name} on ${organisation.dpaAcceptedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}, version ${organisation.dpaVersion ?? CURRENT_DPA_VERSION}.`,
      10,
      bold,
      ink,
    );
    cursor -= 12;
  }

  DPA_CLAUSES.forEach((clause, index) => {
    cursor -= 8;
    write(`${String(index + 1).padStart(2, "0")}  ${clause.title}`, 12, bold, ink, 1.8);
    for (const text of clause.paragraphs) paragraph(text);
    for (const bullet of clause.bullets ?? []) paragraph(`•  ${bullet}`, 10, regular, muted, 12);
  });

  return new NextResponse(new Uint8Array(await pdf.save()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="eventr-dpa-v${CURRENT_DPA_VERSION}.pdf"`,
    },
  });
}

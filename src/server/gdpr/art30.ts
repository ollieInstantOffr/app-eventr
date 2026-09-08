import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { RETENTION_LABELS } from "@/server/consent";
import { prisma } from "@/server/db";
import { pdfText } from "@/server/pdf/text";

/**
 * The Art. 30 record of processing, generated from what the organisation
 * actually does rather than from a template — the fields each event collects,
 * the retention period in force, the justifications given for extra fields.
 */
export async function buildProcessingRecord(organisationId: string): Promise<Uint8Array> {
  const organisation = await prisma.organisation.findUniqueOrThrow({
    where: { id: organisationId },
    include: {
      events: {
        where: { deletedAt: null },
        include: { fields: { orderBy: { order: "asc" } }, _count: { select: { entries: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.11, 0.102, 0.153);
  const muted = rgb(0.431, 0.416, 0.522);
  const margin = 56;

  let page = pdf.addPage([595.28, 841.89]);
  let cursor = page.getHeight() - margin;

  const line = (text: string, size: number, font = regular, colour = ink, gap = 1.5) => {
    if (cursor < margin + size * 2) {
      page = pdf.addPage([595.28, 841.89]);
      cursor = page.getHeight() - margin;
    }
    page.drawText(pdfText(text), { x: margin, y: cursor - size, size, font, color: colour });
    cursor -= size * gap;
  };

  const wrap = (text: string, size: number) => {
    const maxWidth = page.getWidth() - margin * 2;
    const words = pdfText(text).split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (regular.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        line(current, size, regular, muted);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) line(current, size, regular, muted);
  };

  line("Record of processing activities", 20, bold);
  line("Article 30(1) GDPR", 11, regular, muted, 2.4);

  line("Controller", 13, bold);
  line(organisation.name, 11);
  if (organisation.replyToEmail) line(organisation.replyToEmail, 11, regular, muted);
  line(`Generated ${new Date().toLocaleDateString("en-GB")}`, 10, regular, muted, 2.4);

  line("Processor", 13, bold);
  line("instantoffr, provider of Eventr - privacy@instantoffr.com", 11, regular, muted, 1.6);
  wrap(
    "No sub-processors. Guest data is processed on systems operated by the processor, including email delivery.",
    10,
  );
  cursor -= 10;

  line("Purposes of processing", 13, bold);
  wrap(
    "Running prize draws at events: collecting entries from guests, identifying duplicates, selecting winners at random, notifying winners, and deleting entries at the end of the retention period.",
    10,
  );
  cursor -= 10;

  line("Categories of data subjects", 13, bold);
  wrap("Guests who enter a raffle, and members of the controller's own team.", 10);
  cursor -= 10;

  line("Retention", 13, bold);
  wrap(
    `Default: guest entries deleted ${RETENTION_LABELS[organisation.retentionPeriod]} after the event. Winners' contact details are kept until the prize is marked delivered, then normal retention applies.`,
    10,
  );
  cursor -= 10;

  line("Transfers outside the EU/EEA", 13, bold);
  wrap("None.", 10);
  cursor -= 14;

  line("Processing per event", 13, bold);

  if (organisation.events.length === 0) {
    wrap("No events yet.", 10);
  }

  for (const event of organisation.events) {
    line(event.name || "Untitled event", 11, bold, ink, 1.6);
    wrap(
      `Categories of personal data: ${event.fields.map((field) => field.label).join(", ") || "none configured"}.`,
      10,
    );
    wrap(`Entries held: ${event._count.entries}.`, 10);

    for (const field of event.fields.filter((item) => item.justification)) {
      wrap(`Justification for ${field.label}: ${field.justification}`, 10);
    }
    cursor -= 8;
  }

  return pdf.save();
}

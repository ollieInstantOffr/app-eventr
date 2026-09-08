import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string): string {
  return value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** "Add draw time to calendar" from the guest confirmation page. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: { organisation: { select: { name: true } } },
  });

  if (!event?.drawAt) return new NextResponse("Not found", { status: 404 });

  const end = new Date(event.drawAt.getTime() + 30 * 60 * 1000);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//instantoffr//Eventr//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventr.instantoffr.com`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(event.drawAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(`${event.organisation.name} raffle draw`)}`,
    `DESCRIPTION:${escapeIcs(`The winners of ${event.name} are drawn live.`)}`,
    ...(event.venueLabel ? [`LOCATION:${escapeIcs(event.venueLabel)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-draw.ics"`,
    },
  });
}

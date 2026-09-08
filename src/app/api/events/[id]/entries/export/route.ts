import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan, assertEventInScope } from "@/server/auth/rbac";
import { csvStream } from "@/server/entries/csv";

const BATCH = 500;

/**
 * "Export CSV" from screen 1e. Columns follow the event's field config, and
 * every export is recorded — it is a disclosure of personal data, and the
 * organiser needs the record for their Art. 30 obligations.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  assertCan(session, "entry:export");
  assertEventInScope(session, id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!event) return new NextResponse("Not found", { status: 404 });

  const filter = new URL(request.url).searchParams.get("filter") ?? "all";
  const where = {
    eventId: event.id,
    erasedAt: null,
    ...(filter === "eligible" ? { isDuplicate: false, winner: null } : {}),
    ...(filter === "duplicates" ? { isDuplicate: true } : {}),
    ...(filter === "winners" ? { winner: { isNot: null } } : {}),
  } satisfies Prisma.EntryWhereInput;

  const header = [
    "Entry",
    ...event.fields.map((field) => field.label),
    "Duplicate",
    "Winner",
    "Marketing opt-in",
    "Consent version",
    "Consented at",
    "Entered at",
  ];

  await prisma.auditLog.create({
    data: {
      organisationId: session.membership.organisationId,
      userId: session.user.id,
      action: "entries.exported",
      targetType: "event",
      targetId: event.id,
      detail: { filter } as Prisma.InputJsonValue,
    },
  });

  const stream = csvStream(header, async function* () {
    let cursor: string | undefined;

    for (;;) {
      const rows = await prisma.entry.findMany({
        where,
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: { winner: { include: { prize: { select: { name: true } } } } },
      });

      if (rows.length === 0) return;
      cursor = rows[rows.length - 1]!.id;

      yield rows.map((entry) => {
        const data = (entry.data ?? {}) as Record<string, unknown>;
        return [
          entry.number,
          ...event.fields.map((field) => data[field.key] ?? ""),
          entry.isDuplicate,
          entry.winner?.prize.name ?? "",
          entry.marketingOptIn,
          entry.consentVersion,
          entry.consentedAt.toISOString(),
          entry.createdAt.toISOString(),
        ];
      });

      if (rows.length < BATCH) return;
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-entries.csv"`,
    },
  });
}

import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan } from "@/server/auth/rbac";
import { buildProcessingRecord } from "@/server/gdpr/art30";

/** "Export everything" and "Processing record" from screen 4d. */
export async function GET(request: Request) {
  const session = await requireSession();
  assertCan(session, "privacy:manage");

  const organisationId = session.membership.organisationId;
  const format = new URL(request.url).searchParams.get("format");

  await prisma.auditLog.create({
    data: {
      organisationId,
      userId: session.user.id,
      action: format === "art30" ? "processing_record.downloaded" : "organisation.exported",
      detail: {} as Prisma.InputJsonValue,
    },
  });

  if (format === "art30") {
    const pdf = await buildProcessingRecord(organisationId);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="processing-record.pdf"',
      },
    });
  }

  const organisation = await prisma.organisation.findUniqueOrThrow({
    where: { id: organisationId },
    include: {
      events: {
        where: { deletedAt: null },
        include: {
          fields: { orderBy: { order: "asc" } },
          prizes: { orderBy: { order: "asc" } },
          entries: { orderBy: { number: "asc" } },
          winners: true,
          drawLogs: { orderBy: { createdAt: "asc" } },
        },
      },
      consentVersions: true,
    },
  });

  return new NextResponse(JSON.stringify(organisation, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="eventr-export.json"',
    },
  });
}

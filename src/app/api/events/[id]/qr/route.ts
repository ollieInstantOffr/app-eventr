import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertEventInScope } from "@/server/auth/rbac";
import { entryUrl, qrPng, qrSvg } from "@/server/qr/qr";

/** "Download QR as PNG / SVG" from screen 1c. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  assertEventInScope(session, id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
    select: { slug: true, name: true },
  });
  if (!event) return new NextResponse("Not found", { status: 404 });

  const format = new URL(request.url).searchParams.get("format") === "svg" ? "svg" : "png";
  const url = entryUrl(env.APP_URL, event.slug);
  const filename = `${event.slug}-qr.${format}`;

  if (format === "svg") {
    return new NextResponse(await qrSvg(url), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(new Uint8Array(await qrPng(url)), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

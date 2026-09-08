import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan, assertEventInScope } from "@/server/auth/rbac";
import { drawWinner, nextPrize, redrawPrize } from "@/server/draw/engine";

/**
 * What Space and R on the public screen call. Kept as a route handler rather
 * than a server action so the screen can fall back to an offline draw when
 * the fetch fails, which a server action would not let it detect cleanly.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  assertCan(session, "draw:run");
  assertEventInScope(session, id);

  const event = await prisma.event.findFirst({
    where: { id, organisationId: session.membership.organisationId, deletedAt: null },
  });
  if (!event) return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    redraw?: boolean;
    prizeId?: string;
    allowPreviousWinners?: boolean;
    includeDuplicates?: boolean;
  };

  if (body.redraw && body.prizeId) {
    const result = await redrawPrize({
      event,
      prizeId: body.prizeId,
      triggeredByUserId: session.user.id,
    });
    return NextResponse.json(result.ok ? { ok: true } : { ok: false, reason: result.reason });
  }

  const prize = await nextPrize(event.id);
  if (!prize) return NextResponse.json({ ok: false, reason: "complete" });

  const result = await drawWinner({
    event,
    prizeId: prize.id,
    triggeredByUserId: session.user.id,
    drawOptions: {
      allowPreviousWinners: body.allowPreviousWinners,
      includeDuplicates: body.includeDuplicates,
    },
  });

  return NextResponse.json(result.ok ? { ok: true } : { ok: false, reason: result.reason });
}

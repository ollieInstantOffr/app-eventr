import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { hashToken } from "@/server/auth/tokens";
import { createSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * "Accept invitation" from the invite email. A route handler because it signs
 * the person in, and rendering cannot set cookies.
 *
 * Accepting is itself proof of inbox access — the same proof a magic link
 * gives — so it creates the membership and the session in one step.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt <= new Date()) {
    redirect("/link-expired?reason=expired");
  }

  const user = await prisma.user.upsert({
    where: { email: invite.email },
    create: { email: invite.email },
    update: {},
  });

  await prisma.$transaction(async (tx) => {
    await tx.membership.upsert({
      where: { userId_organisationId: { userId: user.id, organisationId: invite.organisationId } },
      create: {
        userId: user.id,
        organisationId: invite.organisationId,
        role: invite.role,
        scopedEventId: invite.scopedEventId,
      },
      update: { role: invite.role, scopedEventId: invite.scopedEventId },
    });

    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  });

  await createSession({
    userId: user.id,
    organisationId: invite.organisationId,
    mfaSatisfied: user.totpEnabledAt === null,
  });

  redirect(invite.role === "KIOSK" ? "/kiosk" : "/events");
}

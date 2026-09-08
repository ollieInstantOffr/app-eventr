import "server-only";
import { prisma } from "@/server/db";

/**
 * Housekeeping for the short-lived tokens. Expired rows are useless and are
 * personal data of a sort — a magic link records an email address — so they
 * are deleted rather than left to accumulate.
 */
export async function runExpiries(): Promise<void> {
  const now = new Date();

  await prisma.magicLink.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.kioskPairing.deleteMany({ where: { expiresAt: { lt: now }, claimedAt: null } });

  await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  await prisma.kioskDevice.updateMany({
    where: { expiresAt: { lt: now }, revokedAt: null },
    data: { revokedAt: now },
  });

  // Invites that were never accepted.
  await prisma.invite.deleteMany({
    where: { expiresAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, acceptedAt: null },
  });
}

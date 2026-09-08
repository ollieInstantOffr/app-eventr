import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { announceSignIn, verifyMagicLink } from "@/server/auth/magic-link";
import { createSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * Opening the emailed link. This is a route handler rather than a page
 * because it sets the session cookie, and rendering cannot write cookies.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyMagicLink(token);

  if (!result.ok) {
    redirect(`/link-expired?reason=${result.reason}`);
  }

  // The user row may not exist yet if the link was requested from /login for
  // an address that never registered — treat that as a first sign-in.
  const user =
    (result.userId ? await prisma.user.findUnique({ where: { id: result.userId } }) : null) ??
    (await prisma.user.upsert({
      where: { email: result.email },
      create: { email: result.email },
      update: {},
    }));

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  // With 2FA enrolled the session is created unsatisfied and requireSession
  // sends them to the challenge.
  await createSession({
    userId: user.id,
    organisationId: membership?.organisationId ?? null,
    mfaSatisfied: user.totpEnabledAt === null,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

  const destination = user.totpEnabledAt
    ? "/login/verify"
    : (result.redirectTo ?? (membership ? "/events" : "/register/workspace"));

  // Releases any tab still sitting on "check your inbox".
  announceSignIn(result.channelId, destination);

  redirect(destination);
}

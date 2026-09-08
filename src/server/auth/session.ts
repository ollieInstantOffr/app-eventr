import "server-only";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Membership, Organisation, Role, User } from "@/generated/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { SESSION_TTL_MS, expiresIn, generateToken, hashToken } from "@/server/auth/tokens";

export const SESSION_COOKIE = "eventr_session";

export type OrganisationMembership = Membership & { organisation: Organisation };

/**
 * A signed-in user. `membership` is null between verifying the magic link and
 * finishing registration step 2, which is the only moment someone is signed in
 * without an organisation.
 */
export type SessionContext = {
  sessionId: string;
  user: User;
  membership: OrganisationMembership | null;
  role: Role | null;
  mfaSatisfied: boolean;
};

/** What every organiser screen gets: a session that has an organisation. */
export type AuthenticatedSession = SessionContext & {
  membership: OrganisationMembership;
  role: Role;
};

/** IPs are stored only as a salted hash — enough to spot a session moving. */
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${env.SESSION_SECRET}:${ip}`).digest("hex").slice(0, 32);
}

/** "MacBook Pro", "iPad" — what the Active sessions list shows. */
function labelForUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows PC";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Browser";
}

export async function createSession(options: {
  userId: string;
  organisationId?: string | null;
  mfaSatisfied: boolean;
}): Promise<string> {
  const headerList = await headers();
  const userAgent = headerList.get("user-agent");
  const token = generateToken();

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: options.userId,
      organisationId: options.organisationId ?? null,
      userAgent,
      ipHash: hashIp(headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null),
      label: labelForUserAgent(userAgent),
      expiresAt: expiresIn(SESSION_TTL_MS),
      mfaSatisfiedAt: options.mfaSatisfied ? new Date() : null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return token;
}

/** Returns the signed-in context, or null. Never throws for a signed-out visitor. */
export async function getSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

  // The membership carries the role, so it is loaded with the session rather
  // than fetched again by every caller.
  const membership = session.organisationId
    ? await prisma.membership.findFirst({
        where: { userId: session.userId, organisationId: session.organisationId },
        include: { organisation: true },
      })
    : await prisma.membership.findFirst({
        where: { userId: session.userId },
        include: { organisation: true },
        orderBy: { createdAt: "asc" },
      });

  // Touch at most once a minute; this runs on every request.
  if (Date.now() - session.lastActiveAt.getTime() > 60_000) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });
  }

  return {
    sessionId: session.id,
    user: session.user,
    membership,
    role: membership?.role ?? null,
    mfaSatisfied: session.mfaSatisfiedAt !== null,
  };
}

/**
 * For organiser pages and actions. Redirects a signed-out visitor to /login,
 * an un-challenged 2FA session to the challenge, and someone who has not yet
 * created a workspace to registration step 2.
 */
export async function requireSession(returnTo?: string): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (!session) {
    const target = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }

  // 2FA is enrolled but this session hasn't passed the challenge yet.
  if (session.user.totpEnabledAt && !session.mfaSatisfied) {
    redirect("/login/verify");
  }

  if (!session.membership) {
    redirect("/register/workspace");
  }

  return session as AuthenticatedSession;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeOtherSessions(userId: string, keepSessionId: string): Promise<number> {
  const { count } = await prisma.session.updateMany({
    where: { userId, id: { not: keepSessionId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}

export async function signOut(): Promise<void> {
  const session = await getSession();
  if (session) await revokeSession(session.sessionId);
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Points a session at a different organisation the user belongs to. */
export async function switchOrganisation(sessionId: string, organisationId: string): Promise<void> {
  await prisma.session.update({ where: { id: sessionId }, data: { organisationId } });
}

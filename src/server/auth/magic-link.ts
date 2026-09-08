import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { publish } from "@/server/events";
import { sendEmail } from "@/server/email/send";
import { magicLinkEmail } from "@/server/email/templates/magic-link";
import { rateLimit } from "@/server/auth/rate-limit";
import {
  MAGIC_LINK_TTL_MS,
  RESEND_COOLDOWN_MS,
  expiresIn,
  generateToken,
  hashToken,
} from "@/server/auth/tokens";

export const WAITING_CHANNEL_COOKIE = "eventr_waiting";

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function authChannel(channelId: string): string {
  return `auth:${channelId}`;
}

export type RequestLinkOutcome =
  | { ok: true; channelId: string; previewPath?: string }
  | { ok: false; reason: "rate-limited"; retryAfterMs: number };

/**
 * Issues a magic link. The response is deliberately identical whether or not
 * the address has an account — a stranger must not be able to use this to
 * discover who is registered.
 */
export async function requestMagicLink(options: {
  email: string;
  ip: string;
  redirectTo?: string;
}): Promise<RequestLinkOutcome> {
  const email = normaliseEmail(options.email);

  // Two limits: one stops a single address being flooded, the other stops one
  // source enumerating many addresses.
  const perEmail = rateLimit(`magic-link:email:${email}`, 5, 15 * 60 * 1000);
  if (!perEmail.allowed) {
    return { ok: false, reason: "rate-limited", retryAfterMs: perEmail.retryAfterMs };
  }
  const perIp = rateLimit(`magic-link:ip:${options.ip}`, 20, 15 * 60 * 1000);
  if (!perIp.allowed) {
    return { ok: false, reason: "rate-limited", retryAfterMs: perIp.retryAfterMs };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const token = generateToken();
  const link = await prisma.magicLink.create({
    data: {
      tokenHash: hashToken(token),
      email,
      userId: user?.id ?? null,
      redirectTo: options.redirectTo ?? null,
      expiresAt: expiresIn(MAGIC_LINK_TTL_MS),
      requestIp: options.ip,
    },
  });

  // The waiting tab listens on this channel so it can sign itself in when the
  // link is opened elsewhere.
  const cookieStore = await cookies();
  cookieStore.set(WAITING_CHANNEL_COOKIE, link.channelId, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(MAGIC_LINK_TTL_MS / 1000),
  });

  const url = `${env.APP_URL}/auth/${token}`;
  const message = magicLinkEmail({ firstName: user?.firstName ?? null, url });

  const result = await sendEmail({
    to: email,
    template: "magic-link",
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  return { ok: true, channelId: link.channelId, previewPath: result.previewPath };
}

export function resendCooldownRemaining(lastRequestedAt: Date): number {
  return Math.max(0, RESEND_COOLDOWN_MS - (Date.now() - lastRequestedAt.getTime()));
}

export type VerifyOutcome =
  | { ok: true; email: string; userId: string | null; redirectTo: string | null; channelId: string }
  | { ok: false; reason: "expired" | "used" | "unknown" };

/**
 * Consumes a link. Single-use is enforced with a conditional update, so two
 * near-simultaneous opens cannot both succeed.
 */
export async function verifyMagicLink(token: string): Promise<VerifyOutcome> {
  const link = await prisma.magicLink.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!link) return { ok: false, reason: "unknown" };
  if (link.consumedAt) return { ok: false, reason: "used" };
  if (link.expiresAt <= new Date()) return { ok: false, reason: "expired" };

  const { count } = await prisma.magicLink.updateMany({
    where: { id: link.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (count === 0) return { ok: false, reason: "used" };

  return {
    ok: true,
    email: link.email,
    userId: link.userId,
    redirectTo: link.redirectTo,
    channelId: link.channelId,
  };
}

/** Releases the waiting tab once the link has been opened somewhere. */
export function announceSignIn(channelId: string, redirectTo: string): void {
  publish(authChannel(channelId), { type: "signed-in", redirectTo });
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import {
  generateRecoveryCodes,
  generateTotpSecret,
  provisioningUri,
  verifyTotp,
} from "@/server/auth/totp";

export type EnrolmentStart = { secret: string; uri: string };

/**
 * Starts enrolment. The secret is stored immediately but totpEnabledAt stays
 * null until a code proves the app is set up — so a half-finished enrolment
 * can never lock someone out.
 */
export async function beginTwoFactorEnrolment(): Promise<EnrolmentStart> {
  const session = await requireSession();
  const secret = generateTotpSecret();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret, totpEnabledAt: null },
  });

  return { secret, uri: provisioningUri(secret, session.user.email) };
}

export async function confirmTwoFactor(
  code: string,
): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; error: string }> {
  const session = await requireSession();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { totpSecret: true },
  });

  if (!user.totpSecret) return { ok: false, error: "Start the setup again" };
  if (!verifyTotp(user.totpSecret, code)) {
    return { ok: false, error: "That code isn't right — check your app and try the next one" };
  }

  const recoveryCodes = generateRecoveryCodes();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabledAt: new Date(), totpRecoveryCodes: recoveryCodes },
  });

  // The session that turned 2FA on has already proved it, so it stays valid.
  await prisma.session.update({
    where: { id: session.sessionId },
    data: { mfaSatisfiedAt: new Date() },
  });

  revalidatePath("/settings/profile");
  return { ok: true, recoveryCodes };
}

export async function disableTwoFactor(code: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { totpSecret: true, totpRecoveryCodes: true },
  });

  // Turning it off needs the same proof as turning it on.
  const valid =
    (user.totpSecret && verifyTotp(user.totpSecret, code)) ||
    user.totpRecoveryCodes.includes(code.trim());

  if (!valid) return { ok: false, error: "Enter a current code, or one of your recovery codes" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: null, totpEnabledAt: null, totpRecoveryCodes: [] },
  });

  revalidatePath("/settings/profile");
  return { ok: true };
}

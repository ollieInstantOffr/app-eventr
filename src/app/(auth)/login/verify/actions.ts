"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { verifyTotp } from "@/server/auth/totp";
import { rateLimit } from "@/server/auth/rate-limit";

export type VerifyState = { error?: string };

export async function submitTwoFactorCode(
  _state: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const session = await getSession();
  if (!session) redirect("/login");

  // Six digits guessed at speed would be trivial otherwise.
  const limit = rateLimit(`totp:${session.user.id}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  const code = String(formData.get("code") ?? "").trim();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { totpSecret: true, totpRecoveryCodes: true },
  });

  const totpValid = user.totpSecret ? verifyTotp(user.totpSecret, code) : false;
  const recoveryValid = user.totpRecoveryCodes.includes(code);

  if (!totpValid && !recoveryValid) {
    return { error: "That code isn't right. Check your app and try the next one." };
  }

  // A recovery code works once.
  if (recoveryValid) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpRecoveryCodes: user.totpRecoveryCodes.filter((item) => item !== code) },
    });
  }

  await prisma.session.update({
    where: { id: session.sessionId },
    data: { mfaSatisfiedAt: new Date() },
  });

  redirect("/events");
}

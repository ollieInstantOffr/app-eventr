"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requestMagicLink } from "@/server/auth/magic-link";
import { requireSession, signOut as endSession } from "@/server/auth/session";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export type AuthFormState = { error?: string; ok?: boolean };

async function requestIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Screen 3a — "Send me a link". */
export async function requestSignInLink(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address" };
  }

  const next = formData.get("next");
  const result = await requestMagicLink({
    email: parsed.data,
    ip: await requestIp(),
    redirectTo: typeof next === "string" && next.startsWith("/") ? next : undefined,
  });

  if (!result.ok) {
    const minutes = Math.ceil(result.retryAfterMs / 60_000);
    return { error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  redirect(`/check-inbox?email=${encodeURIComponent(parsed.data)}`);
}

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Tell us your first name").max(80),
  lastName: z.string().trim().max(80).optional(),
  email: emailSchema,
  acceptTerms: z.literal("on", { message: "You need to accept the Terms and the DPA to continue" }),
});

/**
 * Screen 3b. Creating the account is what accepts the Terms and the DPA — the
 * design has the DPA accepted at sign-up rather than negotiated per customer.
 */
export async function registerAccount(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") ?? undefined,
    email: formData.get("email"),
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  const { firstName, lastName, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({ data: { email, firstName, lastName: lastName || null } });
  }

  // An address that already has an account simply gets a sign-in link, which
  // is also why this reveals nothing either way.
  const result = await requestMagicLink({
    email,
    ip: await requestIp(),
    redirectTo: "/register/workspace",
  });

  if (!result.ok) {
    const minutes = Math.ceil(result.retryAfterMs / 60_000);
    return { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  redirect(`/check-inbox?email=${encodeURIComponent(email)}&new=1`);
}

export async function signOut(): Promise<void> {
  await requireSession();
  await endSession();
  redirect("/login");
}

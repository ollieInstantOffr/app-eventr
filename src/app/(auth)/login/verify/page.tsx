import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "Two-factor code" };

/** Where requireSession sends a session that hasn't passed the 2FA challenge. */
export default async function VerifyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.totpEnabledAt || session.mfaSatisfied) redirect("/events");

  return (
    <>
      <h1 className="text-[24px] font-extrabold">One more step</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
        Enter the six-digit code from your authenticator app, or one of your recovery codes.
      </p>
      <VerifyForm />
    </>
  );
}

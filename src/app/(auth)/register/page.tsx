import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create an account" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/events");

  return (
    <>
      <p className="text-[12px] font-bold tracking-wide text-ink-muted uppercase">Step 1 of 2</p>
      <h1 className="mt-1.5 text-[26px] font-extrabold">Create your account</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
        Free, and there&rsquo;s no password &mdash; we email you a link.
      </p>
      <RegisterForm />
      <p className="mt-6 text-[13px] text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-violet hover:text-violet-hover">
          Log in
        </Link>
      </p>
    </>
  );
}

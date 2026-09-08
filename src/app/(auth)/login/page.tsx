import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getSession()) redirect("/events");
  const { next } = await searchParams;

  return (
    <>
      <h1 className="text-[26px] font-extrabold">Log in</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
        We&rsquo;ll email you a link that signs you in. No password to remember.
      </p>
      <LoginForm next={next} />
      <p className="mt-6 text-[13px] text-ink-muted">
        New here?{" "}
        <Link href="/register" className="font-bold text-violet hover:text-violet-hover">
          Create an account
        </Link>
      </p>
    </>
  );
}

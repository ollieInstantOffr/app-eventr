import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata = { title: "Link expired" };

const COPY = {
  expired: {
    title: "This link has expired",
    body: "Sign-in links work once and for 15 minutes. Nothing happened to your account — just request a new one.",
  },
  used: {
    title: "This link has already been used",
    body: "Sign-in links work once and for 15 minutes. Nothing happened to your account — just request a new one.",
  },
  unknown: {
    title: "We don't recognise this link",
    body: "It may have been mistyped or truncated by an email client. Request a fresh one and it'll work.",
  },
} as const;

/** Screen 7a, second state. */
export default async function LinkExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const copy = COPY[(reason as keyof typeof COPY) in COPY ? (reason as keyof typeof COPY) : "expired"];

  return (
    <>
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-peach text-[24px] font-extrabold text-peach-ink">
        !
      </div>
      <h1 className="mt-4 text-[24px] font-extrabold">{copy.title}</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">{copy.body}</p>
      <LoginForm />
      <p className="mt-5 text-[12px] leading-relaxed text-ink-muted">
        Didn&rsquo;t request this? You can ignore it &mdash; no one can sign in without access to
        your inbox.
      </p>
    </>
  );
}

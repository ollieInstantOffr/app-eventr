import Link from "next/link";
import { WaitingForLink } from "./waiting-for-link";

export const metadata = { title: "Check your inbox" };

/** Screen 7a. */
export default async function CheckInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; new?: string }>;
}) {
  const { email, new: isNew } = await searchParams;
  const address = email ?? "your email address";

  return (
    <>
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-violet/12 text-[24px] font-extrabold text-violet">
        ✉
      </div>
      <h1 className="mt-4 text-[24px] font-extrabold">Check your inbox</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary">
        We sent a sign-in link to <strong className="text-ink">{address}</strong>. Open it on this
        device and you&rsquo;re in. It works for 15&nbsp;minutes.
      </p>

      <WaitingForLink fallbackRedirect={isNew ? "/register/workspace" : "/events"} />

      <p className="mt-5 text-[13px] text-ink-muted">
        Wrong address?{" "}
        <Link href="/login" className="font-bold text-violet hover:text-violet-hover">
          Change
        </Link>
      </p>
    </>
  );
}

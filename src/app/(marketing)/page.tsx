import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

export const metadata = {
  // Absolute, so the layout's "%s · Eventr" template doesn't repeat the name.
  title: { absolute: "Eventr — run a raffle at your event in ten minutes" },
  description:
    "Guests scan a QR code and enter on their phone. You collect every entry in one place and draw the winners live on the big screen — with your logo on everything. Free.",
};

const STEPS = [
  {
    n: 1,
    title: "Create the event",
    body: "Name it, add your prizes and upload your logo. Choose which details to ask guests for — name and email are enough.",
  },
  {
    n: 2,
    title: "Guests scan & enter",
    body: "Print the poster or show the QR on a booth screen. Guests fill in a 20-second form on their phone and get an entry number.",
  },
  {
    n: 3,
    title: "Draw live on the big screen",
    body: "Open the public screen on your laptop, press space, and the winner appears — reel, wheel, countdown or cards. Your logo, your colours.",
  },
];

const FEATURES = [
  {
    title: "Your brand on every surface",
    body: "Logo, accent colour and welcome text on the QR poster, the phone page and the live screen.",
  },
  {
    title: "Four live-draw looks",
    body: "Name reel, spinning wheel, countdown reveal or flipping cards. Suspense length and confetti are yours to set.",
  },
  {
    title: "Multiple prizes, one run",
    body: "Queue your prizes in order. Space draws the next one; R re-draws if the winner has left.",
  },
  {
    title: "Every entry, one list",
    body: "Search, filter, flag duplicates by email or phone, export to CSV. Winners marked automatically.",
  },
  {
    title: "Provably fair",
    body: "Cryptographically secure random draw from the eligible entries, with a log of every draw you can show anyone who asks.",
  },
  {
    title: "Works when Wi-Fi doesn't",
    body: "The live screen keeps the entry list locally, so a flaky venue connection won't stop the draw.",
  },
];

/** Screen 5a. */
export default function LandingPage() {
  return (
    <main className="relative">
      <section className="mx-auto max-w-[1160px] px-6 pt-10 pb-20">
        <p className="text-[13px] font-bold text-ink-muted">
          Made for trade shows, launches and company parties
        </p>
        <h1 className="mt-3 max-w-[16ch] text-[clamp(38px,6vw,66px)] font-extrabold leading-[1.03] tracking-[-0.035em]">
          Run a raffle at your event in ten minutes.
        </h1>
        <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-ink-secondary">
          Guests scan a QR code and enter on their phone. You collect every entry in one place and
          draw the winners live on the big screen &mdash; with your logo on everything.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <ButtonLink href="/register" size="lg">
            Create your first event
          </ButtonLink>
          <Link
            href="/#how"
            className="rounded-[14px] px-5 py-3 text-[15px] font-bold text-ink-secondary hover:text-ink"
          >
            See a live draw
          </Link>
        </div>
        <p className="mt-3 text-[12.5px] font-bold text-ink-muted">
          Free · No app for guests · Set up in minutes
        </p>

        {/* The two moments that sell it: the big screen, and the guest's phone. */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <GlassPanel className="relative aspect-video overflow-hidden p-6">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between">
                <span className="text-[13px] font-extrabold text-ink-muted">your logo</span>
                <span className="text-[12.5px] font-bold text-ink-muted">248 entries</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-[12.5px] font-bold text-ink-muted">Prize 1 of 3 · MacBook Air</p>
                <p className="mt-1 text-[11px] font-bold tracking-[0.14em] text-violet uppercase">
                  Winner
                </p>
                <p className="mt-1.5 font-serif text-[clamp(34px,5vw,62px)] leading-tight">Jonas E.</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <p className="text-[13px] font-extrabold text-ink-muted">your logo</p>
            <h2 className="mt-3 text-[19px] font-extrabold">Enter the raffle</h2>

            <div className="mt-4 flex flex-col gap-2.5" aria-hidden>
              <div className="rounded-field bg-white px-3.5 py-2.5 text-[13px]">Jonas Ek</div>
              <div className="rounded-field bg-white px-3.5 py-2.5 text-[13px] text-ink-faint">
                Email
              </div>
              <div className="rounded-field bg-white px-3.5 py-2.5 text-[13px] text-ink-faint">
                Phone
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-snug text-ink-muted">
              <span
                aria-hidden
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-violet text-[9px] text-white"
              >
                ✓
              </span>
              I agree that Northwind Events stores my details to run this raffle.
            </p>

            <div className="mt-4 rounded-field bg-violet px-4 py-3 text-center text-[14px] font-bold text-white">
              Enter raffle
            </div>
          </GlassPanel>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1160px] px-6 py-16">
        <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-[-0.03em]">
          Three steps. No app.
        </h2>
        <p className="mt-2 text-[16px] text-ink-secondary">
          Works on any phone browser, any laptop, any projector.
        </p>

        <ol className="mt-9 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n}>
              <GlassPanel className="h-full">
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-tile bg-violet text-[14px] font-extrabold text-white"
                >
                  {step.n}
                </span>
                <h3 className="mt-4 text-[17px] font-extrabold">{step.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">{step.body}</p>
              </GlassPanel>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="mx-auto max-w-[1160px] px-6 py-16">
        <h2 className="text-[clamp(28px,3.6vw,40px)] font-extrabold tracking-[-0.03em]">
          Everything the raffle needs. Nothing it doesn&rsquo;t.
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] text-ink-secondary">
          Built for the person standing at the booth with a laptop and a crowd waiting &mdash; not
          for a marketing department.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <GlassPanel key={feature.title} className="h-full p-5">
              <h3 className="text-[15px] font-extrabold">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{feature.body}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-6 py-16">
        <GlassPanel className="p-9 text-center">
          <h2 className="text-[clamp(26px,3.2vw,36px)] font-extrabold tracking-[-0.03em]">
            Free. No card, no tiers.
          </h2>
          <p className="mx-auto mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-secondary">
            Unlimited events, entries and prizes. Every draw animation, your logo everywhere, CSV
            export. Eventr is free to use &mdash; we don&rsquo;t charge organisers and we don&rsquo;t
            sell guest data.
          </p>

          <ul className="mx-auto mt-6 flex max-w-[720px] flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] font-bold text-ink-secondary">
            {[
              "Unlimited events and entries",
              "All four live-draw animations",
              "Your logo on poster, phone and screen",
              "Team seats and kiosk logins",
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span aria-hidden className="text-teal-darker">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <ButtonLink href="/register" size="lg" className="mt-7">
            Create your first event
          </ButtonLink>
        </GlassPanel>
      </section>

      <section className="mx-auto max-w-[1160px] px-6 pb-20">
        <GlassPanel className="p-8">
          <h2 className="text-[24px] font-extrabold tracking-[-0.03em]">GDPR by default</h2>
          <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-ink-secondary">
            You are the data controller for the guests who enter your raffle; instantoffr is the
            processor, under a Data Processing Agreement accepted when you sign up. New events
            collect name and email only. Entries delete themselves on a schedule you choose. Names
            on the big screen are shortened by default, and guests can ask for their data back or
            deleted from their own confirmation page.
          </p>
          <p className="mt-4 flex flex-wrap gap-4 text-[13px] font-bold">
            <Link href="/legal/dpa" className="text-violet hover:text-violet-hover">
              Read the DPA →
            </Link>
            <Link href="/legal/privacy" className="text-violet hover:text-violet-hover">
              Privacy policy →
            </Link>
          </p>
        </GlassPanel>
      </section>
    </main>
  );
}

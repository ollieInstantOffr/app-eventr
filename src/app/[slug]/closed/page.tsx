import { notFound } from "next/navigation";
import { GuestShell } from "@/components/guest/guest-shell";
import { prisma } from "@/server/db";
import { shortenName } from "@/server/auth/redaction";
import { resolveBranding } from "@/server/events/access";
import { formatTime } from "@/lib/format";
import { storage } from "@/server/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raffle", robots: { index: false } };

/**
 * Screen 7b. A guest who scans the poster late must never meet an error page,
 * and must never see another guest's details — winners are shortened.
 */
export default async function ClosedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: {
      organisation: true,
      prizes: {
        orderBy: { order: "asc" },
        include: {
          winners: {
            where: { supersededAt: null },
            include: { entry: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const branding = resolveBranding(event, event.organisation);
  const drawn = event.prizes.some((prize) => prize.winners.length > 0);

  return (
    <GuestShell
      logoUrl={branding.logoKey ? storage.url(branding.logoKey) : null}
      organisationName={event.organisation.name}
      backgroundColour={branding.backgroundColour}
    >
      {drawn ? (
        <>
          <h1 className="text-[22px] font-extrabold">The raffle is over</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
            Thanks for entering. Winners have been drawn and contacted directly &mdash; if that&rsquo;s
            you, check your email.
          </p>

          <ul className="mt-5 divide-y divide-black/6">
            {event.prizes.map((prize, index) => (
              <li key={prize.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold">
                    {index + 1} · {prize.name}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] font-bold text-ink-muted">
                  {prize.winners.length > 0
                    ? shortenName(prize.winners[0]?.entry.name)
                    : "Not drawn"}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h1 className="text-[22px] font-extrabold">Entries have closed</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
            {event.drawAt
              ? `The draw is at ${formatTime(event.drawAt)} — watch the screen at the stand to see who wins.`
              : "The draw happens shortly — watch the screen at the stand to see who wins."}
          </p>

          {event.prizes.length > 0 ? (
            <div className="mt-5 rounded-panel bg-white px-4 py-3">
              <p className="text-[11.5px] font-bold text-ink-muted">Still to be won</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {event.prizes.map((prize) => (
                  <li key={prize.id} className="text-[13px] font-bold">
                    {prize.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </GuestShell>
  );
}

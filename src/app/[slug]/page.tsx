import { notFound, redirect } from "next/navigation";
import { GuestShell } from "@/components/guest/guest-shell";
import { prisma } from "@/server/db";
import { resolveBranding } from "@/server/events/access";
import { entriesOpen } from "@/server/entries/submit";
import { renderConsentText, renderMarketingOptInText, DEFAULT_CONSENT_TEMPLATE } from "@/server/consent";
import { storage } from "@/server/storage";
import { EntryForm } from "./entry-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true, organisation: { select: { name: true } } },
  });
  return {
    title: event ? `Enter the raffle · ${event.organisation.name}` : "Raffle",
    robots: { index: false },
  };
}

/** Screen 1d — what a guest sees after scanning the QR. */
export default async function GuestEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: {
      fields: { orderBy: { order: "asc" } },
      organisation: true,
      prizes: { orderBy: { order: "asc" } },
    },
  });

  if (!event) notFound();
  if (!entriesOpen(event)) redirect(`/${slug}/closed`);

  const branding = resolveBranding(event, event.organisation);
  const consentVersion = await prisma.consentTextVersion.findFirst({
    where: { organisationId: event.organisationId },
    orderBy: { createdAt: "desc" },
  });

  const retention = event.retentionPeriod ?? event.organisation.retentionPeriod;
  const consentText = renderConsentText(
    consentVersion?.template ?? DEFAULT_CONSENT_TEMPLATE,
    event.organisation,
    retention,
  );

  return (
    <GuestShell
      logoUrl={branding.logoKey ? storage.url(branding.logoKey) : null}
      organisationName={event.organisation.name}
      backgroundColour={branding.backgroundColour}
      footer={<>One entry per person · Powered by Eventr by instantoffr</>}
    >
      <h1 className="text-[22px] font-extrabold">Enter the raffle</h1>
      {event.welcomeMessage ? (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-secondary">
          {event.welcomeMessage}
        </p>
      ) : null}

      <EntryForm
        slug={event.slug}
        accentColour={branding.accentColour}
        fields={event.fields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options,
        }))}
        consentText={consentText}
        marketingText={
          event.organisation.marketingOptInEnabled
            ? renderMarketingOptInText(event.organisation.name)
            : null
        }
      />
    </GuestShell>
  );
}

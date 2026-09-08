import Link from "next/link";
import { GuestRequestStatus } from "@/generated/prisma";
import { ButtonLink } from "@/components/ui/button";
import { GlassPanel, PanelSection } from "@/components/ui/glass-panel";
import { formatRelative } from "@/lib/format";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { DEFAULT_CONSENT_TEMPLATE } from "@/server/consent";
import { PrivacyControls } from "./privacy-controls";
import { ConsentTextEditor } from "./consent-text-editor";
import { GuestRequestQueue } from "./guest-request-queue";

export const metadata = { title: "Privacy & data" };

/** Screen 4d. */
export default async function PrivacySettingsPage() {
  const session = await requireSession("/settings/privacy");
  const organisation = session.membership.organisation;

  const [consentVersion, requests] = await Promise.all([
    prisma.consentTextVersion.findFirst({
      where: { organisationId: organisation.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guestRequest.findMany({
      where: {
        status: GuestRequestStatus.OPEN,
        event: { organisationId: organisation.id, deletedAt: null },
      },
      orderBy: { requestedAt: "asc" },
      include: { entry: { select: { number: true } }, event: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[64ch] text-[13px] leading-relaxed text-ink-secondary">
          <strong className="text-ink">You are the data controller</strong> for guest entries;
          instantoffr processes them on your behalf under the DPA. These settings help you meet that
          role &mdash; they don&rsquo;t replace your own legal advice.
        </p>
        <ButtonLink href="/legal/dpa" variant="secondary" size="sm">
          Read the DPA
        </ButtonLink>
      </GlassPanel>

      <PrivacyControls
        settings={{
          retentionPeriod: organisation.retentionPeriod,
          minimiseByDefault: organisation.minimiseByDefault,
          maskNamesOnScreen: organisation.maskNamesOnScreen,
          marketingOptInEnabled: organisation.marketingOptInEnabled,
          autoFulfilErasure: organisation.autoFulfilErasure,
        }}
      />

      <ConsentTextEditor
        template={consentVersion?.template ?? DEFAULT_CONSENT_TEMPLATE}
        version={consentVersion?.version ?? "1.0"}
        organisationName={organisation.name}
        retentionPeriod={organisation.retentionPeriod}
        marketingOptInEnabled={organisation.marketingOptInEnabled}
      />

      <GuestRequestQueue
        autoFulfil={organisation.autoFulfilErasure}
        requests={requests.map((request) => ({
          id: request.id,
          type: request.type,
          entryNumber: request.entry?.number ?? null,
          eventName: request.event.name,
          requestedAgo: formatRelative(request.requestedAt),
          dueIn: formatRelative(request.dueAt),
        }))}
      />

      <PanelSection title="Your data">
        <ul className="divide-y divide-black/6">
          <li className="flex items-center justify-between gap-3 py-3">
            <span>
              <span className="block text-[13.5px] font-bold">Export everything</span>
              <span className="block text-[12px] text-ink-muted">
                All events, entries and draw logs as CSV + JSON
              </span>
            </span>
            <ButtonLink href="/api/organisation/export" variant="secondary" size="sm" prefetch={false}>
              Export
            </ButtonLink>
          </li>

          <li className="flex items-center justify-between gap-3 py-3">
            <span>
              <span className="block text-[13.5px] font-bold">Processing record</span>
              <span className="block text-[12px] text-ink-muted">
                Auto-generated Art. 30 record of processing for your events
              </span>
            </span>
            <ButtonLink
              href="/api/organisation/export?format=art30"
              variant="secondary"
              size="sm"
              prefetch={false}
            >
              Download
            </ButtonLink>
          </li>
        </ul>
      </PanelSection>

      <PanelSection title="Delete organisation">
        <p className="text-[13px] leading-relaxed text-ink-secondary">
          Permanently erases all events, entries and team members within 30 days. Export anything you
          need first &mdash; we cannot recover it for you afterwards.
        </p>
        <p className="mt-3 text-[12.5px] text-ink-muted">
          Deleting a single event is on that event&rsquo;s page, under{" "}
          <Link href="/events" className="font-bold text-violet hover:text-violet-hover">
            Events
          </Link>
          .
        </p>
      </PanelSection>
    </div>
  );
}

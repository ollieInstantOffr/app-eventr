import { ButtonLink } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { LegalPage } from "@/components/marketing/legal-page";
import { CURRENT_DPA_VERSION, LEGAL_UPDATED_AT } from "@/lib/legal-versions";
import { getSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { DPA_CLAUSES } from "@/server/gdpr/dpa";

export const metadata = { title: "Data Processing Agreement" };
export const dynamic = "force-dynamic";

/**
 * Screen 6a. Controller details fill in from the signed-in organisation, and
 * the signed copy is downloadable — no back-and-forth with each customer.
 */
export default async function DpaPage() {
  const session = await getSession();

  const acceptedBy = session?.membership?.organisation.dpaAcceptedById
    ? await prisma.user.findUnique({
        where: { id: session.membership.organisation.dpaAcceptedById },
        select: { firstName: true, lastName: true, email: true },
      })
    : null;

  const organisation = session?.membership?.organisation ?? null;

  return (
    <LegalPage
      kicker={`Legal · Version ${CURRENT_DPA_VERSION} · Updated ${LEGAL_UPDATED_AT}`}
      title="Data Processing Agreement"
      intro={
        <>
          <p>
            This agreement forms part of the Terms of Service and governs how instantoffr (the
            &ldquo;Processor&rdquo;) processes personal data of event guests on behalf of the
            Organiser (the &ldquo;Controller&rdquo;) when the Controller uses Eventr. It is accepted
            automatically when an account is created and applies to every event in the account.
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-field bg-white px-4 py-3">
              <dt className="text-[11.5px] font-bold text-ink-muted">Controller</dt>
              <dd className="mt-0.5 text-[13.5px] font-bold text-ink">
                {organisation?.name ?? "Your organisation"}
              </dd>
              <dd className="text-[12px] text-ink-muted">
                {organisation?.replyToEmail ?? "filled from your organisation settings"}
              </dd>
            </div>
            <div className="rounded-field bg-white px-4 py-3">
              <dt className="text-[11.5px] font-bold text-ink-muted">Processor</dt>
              <dd className="mt-0.5 text-[13.5px] font-bold text-ink">
                instantoffr, provider of Eventr
              </dd>
              <dd className="text-[12px] text-ink-muted">privacy@instantoffr.com</dd>
            </div>
          </dl>
        </>
      }
      aside={
        organisation?.dpaAcceptedAt ? (
          <GlassPanel className="p-4">
            <p className="text-[11.5px] font-bold text-ink-muted">Signed copy</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-secondary">
              Accepted by{" "}
              {acceptedBy
                ? [acceptedBy.firstName, acceptedBy.lastName].filter(Boolean).join(" ") ||
                  acceptedBy.email
                : "an owner"}{" "}
              for {organisation.name} on{" "}
              {organisation.dpaAcceptedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              , v{organisation.dpaVersion ?? CURRENT_DPA_VERSION}.
            </p>
            <ButtonLink
              href="/api/legal/dpa"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              prefetch={false}
            >
              Download PDF
            </ButtonLink>
          </GlassPanel>
        ) : null
      }
      sections={DPA_CLAUSES.map((clause) => ({
        id: clause.id,
        title: clause.title,
        body: (
          <>
            {clause.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {clause.bullets ? (
              <ul>
                {clause.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </>
        ),
      }))}
    />
  );
}

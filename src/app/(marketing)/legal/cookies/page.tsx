import { LegalPage } from "@/components/marketing/legal-page";
import { CURRENT_COOKIE_VERSION, LEGAL_UPDATED_AT } from "@/lib/legal-versions";

export const metadata = { title: "Cookie Policy" };

export default function CookiePolicyPage() {
  return (
    <LegalPage
      kicker={`Legal · Version ${CURRENT_COOKIE_VERSION} · Updated ${LEGAL_UPDATED_AT}`}
      title="Cookie Policy"
      intro={
        <p>
          Eventr uses as few cookies as it can. Guests entering a raffle need none at all beyond the
          request itself; organisers need one to stay signed in.
        </p>
      }
      sections={[
        {
          id: "necessary",
          title: "Strictly necessary",
          body: (
            <>
              <p>
                These are set without asking, because the service cannot work without them and they
                are exempt from consent.
              </p>
              <ul>
                <li>
                  <strong className="text-ink">eventr_session</strong> &mdash; keeps you signed in.
                  httpOnly, SameSite=Lax, 30 days.
                </li>
                <li>
                  <strong className="text-ink">eventr_waiting</strong> &mdash; lets the
                  &ldquo;check your inbox&rdquo; page sign itself in when you open the emailed link.
                  15 minutes.
                </li>
                <li>
                  <strong className="text-ink">eventr_kiosk</strong> &mdash; identifies a paired
                  booth device. Set only on a device someone deliberately paired, and expires when
                  the event ends.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "analytics",
          title: "Product analytics",
          body: (
            <p>
              Off unless you turn them on. Aggregate counts of which organiser screens are used, to
              decide what to improve. Never guest data, never sold, never used to identify an
              individual.
            </p>
          ),
        },
        {
          id: "storage",
          title: "Local storage on the live screen",
          body: (
            <p>
              The public draw screen keeps a copy of the entry list in the browser&rsquo;s own
              storage, so a dropped venue connection cannot stop your draw. It holds only what the
              screen already displays &mdash; masked names &mdash; and it is cleared when the browser
              data is cleared. It is not a cookie and is not sent anywhere.
            </p>
          ),
        },
        {
          id: "changing",
          title: "Changing your mind",
          body: (
            <p>
              Clear this site&rsquo;s data in your browser and the banner will ask again. We also
              re-ask whenever the categories above change.
            </p>
          ),
        },
      ]}
    />
  );
}

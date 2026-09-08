import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { CURRENT_PRIVACY_VERSION, LEGAL_UPDATED_AT } from "@/lib/legal-versions";

export const metadata = { title: "Privacy Policy" };

/**
 * Screen 4c. Two audiences, addressed separately, because the answer to "who
 * is my controller?" is different for each.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      kicker={`Legal · Version ${CURRENT_PRIVACY_VERSION} · Updated ${LEGAL_UPDATED_AT}`}
      title="Privacy Policy"
      intro={
        <>
          <p>
            This policy has two audiences, and which one you are decides who holds your data.
          </p>
          <p>
            <strong className="text-ink">If you are an organiser</strong> with an Eventr account,
            instantoffr is the controller of your account data. <strong className="text-ink">If
            you entered a raffle</strong>, the organiser who ran it is the controller of your entry
            &mdash; instantoffr only processes it for them.
          </p>
        </>
      }
      sections={[
        {
          id: "guests",
          title: "If you entered a raffle",
          body: (
            <>
              <p>
                The organisation named on the page where you entered decides what is collected and
                why. They are your first point of contact for any question about your data, and the
                consent text you agreed to names them.
              </p>
              <p>
                What is held: the answers you gave on the entry form, the exact consent wording you
                agreed to with its version and timestamp, your entry number and the time you
                entered. If you win, a claim code and whether the prize has been handed over.
              </p>
              <p>
                How long: the organiser sets a retention period &mdash; typically 30 days after the
                event &mdash; after which entries are deleted automatically. If you won and the prize
                hasn&rsquo;t been handed over yet, your contact details are kept until it has.
              </p>
              <p>
                Your rights: access, correction, deletion, portability and objection. The fastest
                route is the &ldquo;Your data &amp; privacy&rdquo; link on your own confirmation
                page, which sends the request straight to the organiser with a 30-day clock. You can
                also contact them directly, or us at privacy@instantoffr.com &mdash; we will pass it
                on within 5 business days rather than answering on their behalf.
              </p>
              <p>
                What we never do: sell your data, use it for our own marketing, profile you, or
                combine it with data from another organiser.
              </p>
            </>
          ),
        },
        {
          id: "organisers",
          title: "If you have an Eventr account",
          body: (
            <>
              <p>
                We hold your name, email address, language and time zone, your organisation&rsquo;s
                name, logo and branding, your team&rsquo;s membership, and technical records of
                sign-ins and sessions.
              </p>
              <p>
                The basis is the contract between us: we need this to give you an account. Sign-in
                links and session records are also a legitimate interest in keeping accounts secure.
              </p>
              <p>
                We keep it while your account exists, and delete it within 30 days of closure. You
                can export everything at any time from Settings → Privacy &amp; data.
              </p>
            </>
          ),
        },
        {
          id: "how-we-use",
          title: "What we do with data",
          body: (
            <>
              <p>
                Guest entries are stored, shown to the organiser, displayed in masked form on the
                live screen, entered into the random draw, exported when the organiser asks, and
                deleted at the end of the retention period. That is the whole list.
              </p>
              <p>
                Draw logs record how each winner was selected. When an entry is erased its personal
                data is removed but the log keeps an anonymised record, so an organiser can still
                account for a draw that already happened.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who else sees it",
          body: (
            <>
              <p>
                Nobody. instantoffr uses no sub-processors: guest data is processed on systems we
                operate, including sending email.
              </p>
              <p>
                If that ever changes we will give organisers at least 30 days&rsquo; notice by email
                and impose the same obligations in writing on any sub-processor, remaining
                responsible for them.
              </p>
            </>
          ),
        },
        {
          id: "transfers",
          title: "International transfers",
          body: (
            <p>
              Guest data is not transferred outside the EU/EEA. Any future transfer would happen only
              under an appropriate safeguard, such as the EU Standard Contractual Clauses or an
              adequacy decision, after notice to the organiser.
            </p>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <>
              <p>
                Encryption in transit and at rest. Passwordless sign-in with links that work once
                and for fifteen minutes. Role-based access, so a Viewer never receives guest personal
                data and a kiosk device never receives any. Each organisation&rsquo;s data is
                logically separated, and access and draws are logged.
              </p>
              <p>
                If a breach affects guest data we notify the organiser without undue delay and within
                72 hours of becoming aware of it, with what they need for their own notification
                duties.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              We set a session cookie and a CSRF token, both strictly necessary. Anything else waits
              for your choice. See the <Link href="/legal/cookies">cookie policy</Link>.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact and complaints",
          body: (
            <p>
              privacy@instantoffr.com. If you entered a raffle, contact the organiser first &mdash;
              they hold your data. You can also complain to your local data protection authority at
              any time.
            </p>
          ),
        },
      ]}
    />
  );
}

import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { CURRENT_TERMS_VERSION, LEGAL_UPDATED_AT } from "@/lib/legal-versions";

export const metadata = { title: "Terms of Service" };

/**
 * Screen 4b. The position the design takes: the organiser is the raffle
 * operator and data controller; instantoffr is the tool.
 */
export default function TermsPage() {
  return (
    <LegalPage
      kicker={`Legal · Version ${CURRENT_TERMS_VERSION} · Updated ${LEGAL_UPDATED_AT}`}
      title="Terms of Service"
      intro={
        <>
          <p>
            These terms govern your use of Eventr, provided by instantoffr. By creating an account
            you accept them, and the{" "}
            <Link href="/legal/dpa">Data Processing Agreement</Link> that forms part of them.
          </p>
        </>
      }
      sections={[
        {
          id: "roles",
          title: "Who does what",
          body: (
            <>
              <p>
                You run the raffle. Eventr is the software you use to run it. That distinction
                decides most of what follows: you decide what the raffle is, who may enter, what the
                prizes are and what details you ask guests for, and you are the data controller for
                everything guests give you.
              </p>
              <p>
                instantoffr provides and operates the software, and processes guest data only on
                your instructions.
              </p>
            </>
          ),
        },
        {
          id: "your-responsibilities",
          title: "Your responsibilities as the raffle operator",
          body: (
            <>
              <p>You are responsible for:</p>
              <ul>
                <li>
                  the legality of your raffle where it is held, including any permit, licensing or
                  gambling rules that apply;
                </li>
                <li>the prizes: obtaining them, awarding them and delivering them;</li>
                <li>
                  having a lawful basis for collecting each field you enable, and for the consent
                  text guests see;
                </li>
                <li>the accuracy of what you tell guests about the draw;</li>
                <li>who you invite into your workspace and what they can see.</li>
              </ul>
              <p>
                You indemnify instantoffr against claims arising from your raffle, your prizes and
                your handling of guest data, except to the extent they arise from our own breach of
                these terms.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <>
              <p>
                Don&rsquo;t use Eventr to run anything that requires a gambling licence you
                don&rsquo;t hold, to collect data you have no basis to collect, to send unsolicited
                marketing, or to attempt to break the service or reach another organiser&rsquo;s
                data.
              </p>
              <p>
                We may suspend an account that does, and will tell you why unless we are legally
                prevented from doing so.
              </p>
            </>
          ),
        },
        {
          id: "the-draw",
          title: "The draw",
          body: (
            <>
              <p>
                Winners are selected using a cryptographically secure random number generator over
                the entries eligible at the moment of the draw. Every draw is logged with the
                algorithm, the number of eligible entries and a fingerprint of the entry set, so you
                can demonstrate how a winner was chosen.
              </p>
              <p>
                You control eligibility: whether flagged duplicates are included, and whether
                previous winners may win again. We do not intervene in a draw.
              </p>
            </>
          ),
        },
        {
          id: "price",
          title: "Price",
          body: (
            <p>
              Eventr is free to use. We do not charge organisers and we do not sell guest data. If
              that ever changes we will give you at least 30 days&rsquo; notice by email, and your
              existing data will remain exportable regardless.
            </p>
          ),
        },
        {
          id: "availability",
          title: "Availability",
          body: (
            <p>
              We aim to keep the service available, but we don&rsquo;t promise it will be
              uninterrupted. The live screen keeps a local copy of the entry list precisely so a
              connection problem at your venue cannot stop your draw.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Liability",
          body: (
            <>
              <p>
                Nothing here limits liability for death or personal injury caused by negligence, for
                fraud, or for anything else that cannot lawfully be limited.
              </p>
              <p>
                Subject to that, instantoffr&rsquo;s total liability to you is limited to the fees
                you have paid for the service in the twelve months before the claim. Eventr is free,
                so that figure may be zero.
              </p>
              <p>
                Honest caveat: no wording removes every responsibility. As a processor under GDPR we
                keep duties we cannot contract away &mdash; security, breach notification, and acting
                only on your instructions &mdash; and Art. 82 allocates liability between us
                regardless of what this section says.
              </p>
            </>
          ),
        },
        {
          id: "termination",
          title: "Ending the agreement",
          body: (
            <p>
              You may delete your organisation at any time from Settings → Privacy &amp; data. We
              delete all guest data within 30 days of account closure, except where the law requires
              us to keep something, and confirm deletion on request.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: (
            <p>
              We will give at least 30 days&rsquo; notice by email before a material change takes
              effect. Continuing to use Eventr after that date accepts the new version; if you
              don&rsquo;t accept it, you can export your data and close your account.
            </p>
          ),
        },
        {
          id: "law",
          title: "Governing law",
          body: (
            <p>
              These terms are governed by the law of the country where instantoffr is registered,
              and its courts have exclusive jurisdiction &mdash; without affecting any mandatory
              consumer protections that apply where you live.
            </p>
          ),
        },
      ]}
    />
  );
}

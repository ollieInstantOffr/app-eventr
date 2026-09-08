"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CURRENT_COOKIE_VERSION } from "@/lib/legal-versions";

const STORAGE_KEY = "eventr:cookie-consent";

type Consent = { version: string; analytics: boolean; decidedAt: string };

/**
 * Screen 4a. Reject and Accept carry equal weight and nothing is pre-ticked —
 * the design is explicit about not using a dark pattern here.
 *
 * Only strictly necessary cookies (the session and CSRF cookies) are set
 * before a choice is made, and those are exempt from consent.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
        return;
      }
      const consent = JSON.parse(stored) as Consent;
      // Re-ask when the categories change.
      if (consent.version !== CURRENT_COOKIE_VERSION) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function decide(withAnalytics: boolean) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: CURRENT_COOKIE_VERSION,
          analytics: withAnalytics,
          decidedAt: new Date().toISOString(),
        } satisfies Consent),
      );
    } catch {
      // Storage blocked — treat the choice as session-only.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-40 p-4 sm:p-6"
    >
      <div className="glass mx-auto max-w-[720px] p-5">
        <h2 className="text-[15px] font-extrabold">Cookies</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-secondary">
          We use cookies that are needed to sign you in and keep the site secure. Anything beyond
          that is up to you, and nothing is switched on until you say so.
        </p>

        {expanded ? (
          <ul className="mt-4 divide-y divide-black/6">
            <li className="flex items-start justify-between gap-4 py-2.5">
              <span>
                <span className="block text-[13px] font-bold">Strictly necessary</span>
                <span className="block text-[11.5px] leading-snug text-ink-muted">
                  Your session, and protection against cross-site request forgery. The site cannot
                  work without these.
                </span>
              </span>
              <span className="shrink-0 text-[11.5px] font-bold text-ink-muted">Always on</span>
            </li>
            <li className="flex items-start justify-between gap-4 py-2.5">
              <label className="flex flex-1 cursor-pointer items-start justify-between gap-4">
                <span>
                  <span className="block text-[13px] font-bold">Product analytics</span>
                  <span className="block text-[11.5px] leading-snug text-ink-muted">
                    Aggregate counts of which screens organisers use. Never guest data.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet"
                />
              </label>
            </li>
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Equal weight, deliberately: same size, same prominence. */}
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => decide(false)}>
            Reject
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => decide(expanded ? analytics : true)}>
            {expanded ? "Save choices" : "Accept"}
          </Button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="ml-auto text-[12.5px] font-bold text-ink-muted underline hover:text-ink"
          >
            {expanded ? "Hide details" : "Preferences"}
          </button>
        </div>

        <p className="mt-3 text-[11.5px] text-ink-faint">
          <Link href="/legal/cookies" className="underline">
            Cookie policy
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { requestGuestData } from "./actions";

/**
 * The guest's own GDPR controls. The DPA promises these are reachable
 * "directly from their confirmation page", so they live here rather than
 * behind an email address nobody writes to.
 */
export function GuestDataRequest({
  slug,
  token,
  organisationName,
}: {
  slug: string;
  token: string;
  organisationName: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(type: "EXPORT" | "ERASE") {
    start(async () => {
      const result = await requestGuestData(slug, token, type);
      setDone(result.message);
    });
  }

  if (done) {
    return <p className="mt-5 text-center text-[12px] leading-relaxed text-ink-muted">{done}</p>;
  }

  return (
    <div className="mt-5 text-center">
      {open ? (
        <div className="rounded-field bg-white/70 px-4 py-3">
          <p className="text-[12px] leading-relaxed text-ink-secondary">
            {organisationName} holds your entry and decides what happens to it. We&rsquo;ll pass your
            request straight to them.
          </p>
          <div className="mt-2.5 flex justify-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("EXPORT")}
              className="rounded-[10px] bg-white px-3 py-1.5 text-[12px] font-bold text-ink-secondary hover:text-ink"
            >
              Send me my data
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("ERASE")}
              className="rounded-[10px] bg-white px-3 py-1.5 text-[12px] font-bold text-danger"
            >
              Delete my data
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[12px] font-bold text-ink-muted underline hover:text-ink"
        >
          Your data &amp; privacy
        </button>
      )}
    </div>
  );
}

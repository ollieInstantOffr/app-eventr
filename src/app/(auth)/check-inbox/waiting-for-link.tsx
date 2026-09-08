"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RESEND_SECONDS = 60;

/**
 * Holds an SSE connection open so that opening the emailed link in another tab
 * signs this one in, and counts down the resend cooldown.
 */
export function WaitingForLink({ fallbackRedirect }: { fallbackRedirect: string }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/auth/waiting");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; redirectTo?: string };
        if (payload.type === "signed-in") {
          source.close();
          router.replace(payload.redirectTo || fallbackRedirect);
          router.refresh();
        }
      } catch {
        // A heartbeat or a malformed frame; nothing to do.
      }
    };

    return () => source.close();
  }, [router, fallbackRedirect]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div className="mt-5 flex flex-col gap-3">
      <p className="flex items-center gap-2 rounded-field bg-white px-3.5 py-3 text-[12.5px] text-ink-muted">
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-teal-deep" : "bg-ink-faint"}`}
        />
        {connected
          ? "Waiting for you to click the link… this page signs in automatically."
          : "Reconnecting… you can also just open the link in your inbox."}
      </p>
      <div className="flex justify-between text-[13px] font-bold">
        <span className="text-ink-muted">Didn&rsquo;t arrive?</span>
        {secondsLeft > 0 ? (
          <span className="text-ink-faint">
            Resend in 0:{String(secondsLeft).padStart(2, "0")}
          </span>
        ) : (
          <a href="/login" className="text-violet hover:text-violet-hover">
            Send a new link
          </a>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PanelSection } from "@/components/ui/glass-panel";
import { createKioskPairing } from "./actions";

/**
 * Screen 7g. The organiser generates a code and reads it out; the booth
 * device types it in at /kiosk. No login and no personal data on that device.
 */
export function KioskPairing({ eventId }: { eventId: string }) {
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!pairing) return;
    const target = new Date(pairing.expiresAt).getTime();

    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [pairing]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <PanelSection title="Pair the booth screen">
      {pairing && remaining > 0 ? (
        <>
          <div className="flex justify-center gap-1.5">
            {pairing.code.split("").map((digit, index) => (
              <span
                key={index}
                className="flex h-12 w-9 items-center justify-center rounded-field bg-white text-[22px] font-extrabold tabular-nums"
              >
                {digit}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            On the booth laptop or iPad open <strong className="text-ink">/kiosk</strong> and type
            this code. No login, no personal data on that device &mdash; it can only show the QR and
            the draw.
          </p>
          <p className="mt-2 text-[11.5px] text-ink-faint">
            Code expires in {minutes}:{String(seconds).padStart(2, "0")} · pairing lasts until the
            event ends
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            disabled={pending}
            onClick={() => start(async () => setPairing(await createKioskPairing(eventId)))}
          >
            Generate a new code
          </Button>
        </>
      ) : (
        <>
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Pair a booth iPad or laptop so it can show the QR screen and the draw &mdash; and nothing
            else.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={pending}
            onClick={() => start(async () => setPairing(await createKioskPairing(eventId)))}
          >
            {pending ? "Generating…" : "Show a pairing code"}
          </Button>
        </>
      )}
    </PanelSection>
  );
}

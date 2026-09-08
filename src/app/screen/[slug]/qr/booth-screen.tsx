"use client";

import { useEffect, useState } from "react";
import { QrCode } from "@/components/app/qr-code";

/** The booth display. Left running for hours, so it stays awake and reconnects. */
export function BoothScreen({
  slug,
  matrix,
  shortUrl,
  organisationName,
  eventName,
  logoUrl,
  accentColour,
  backgroundColour,
  initialCount,
  closesAt,
  drawAt,
  prizes,
}: {
  slug: string;
  matrix: boolean[][];
  shortUrl: string;
  organisationName: string;
  eventName: string;
  logoUrl: string | null;
  accentColour: string;
  backgroundColour: string;
  initialCount: number;
  closesAt: string | null;
  drawAt: string | null;
  prizes: string[];
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const source = new EventSource(`/api/live/${slug}/stream`);
    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type?: string; count?: number };
        if (message.type === "entry" && typeof message.count === "number") setCount(message.count);
      } catch {
        // Heartbeat.
      }
    };
    // EventSource reconnects by itself; nothing to do on error but wait.
    return () => source.close();
  }, [slug]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      navigator.wakeLock
        ?.request("screen")
        .then((sentinel) => {
          lock = sentinel;
        })
        .catch(() => undefined);
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => undefined);
    };
  }, []);

  const time = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : null;

  return (
    <div
      className="relative flex h-dvh w-screen cursor-none items-center overflow-hidden"
      style={{ background: backgroundColour }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob -top-40 -left-32 h-[560px] w-[560px] bg-violet-blob" />
        <div className="blob -bottom-48 -right-32 h-[480px] w-[480px] bg-teal-blob" />
      </div>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-12 py-8">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={organisationName} className="max-h-12" />
        ) : (
          <span className="text-[20px] font-extrabold">{organisationName}</span>
        )}
        <span className="text-[16px] font-bold text-ink-secondary tabular-nums">
          {new Intl.NumberFormat("en-GB").format(count)} entered
          {closesAt ? ` · closes ${time(closesAt)}` : ""}
        </span>
      </header>

      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-14 px-12 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-[17px] font-bold text-ink-muted">
            {organisationName} · {eventName}
          </p>
          <h1 className="mt-3 text-[62px] font-extrabold leading-[1.05] tracking-[-0.035em]">
            Scan to enter the raffle.
          </h1>

          {prizes.length > 0 ? (
            <>
              <p className="mt-5 max-w-[36ch] text-[21px] leading-snug text-ink-secondary">
                Win {prizes.slice(0, 3).join(", ")}.
                {drawAt ? (
                  <>
                    {" "}
                    Winners drawn live here at{" "}
                    <strong className="text-ink">{time(drawAt)}</strong>.
                  </>
                ) : null}
              </p>

              <ul className="mt-7 flex flex-wrap gap-2.5">
                {prizes.slice(0, 4).map((prize) => (
                  <li
                    key={prize}
                    className="rounded-chip bg-white px-4 py-2.5 text-[15px] font-bold"
                  >
                    {prize}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-[28px] bg-white p-6">
            <QrCode
              matrix={matrix}
              className="w-[320px]"
              label={`QR code linking to ${shortUrl}`}
            />
          </div>
          <p className="text-[18px] font-bold" style={{ color: accentColour }}>
            {shortUrl}
          </p>
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 px-12 py-7 text-center text-[13px] text-ink-faint">
        Kiosk mode · this screen shows only the QR
      </footer>
    </div>
  );
}

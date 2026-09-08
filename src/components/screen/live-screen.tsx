"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cards } from "@/components/screen/cards";
import { Confetti } from "@/components/screen/confetti";
import { CountdownReveal } from "@/components/screen/countdown-reveal";
import { NameReel } from "@/components/screen/name-reel";
import { Wheel } from "@/components/screen/wheel";
import type { ScreenConfig, ScreenPrize, ScreenWinner } from "@/components/screen/types";
import { addPendingDraw, loadPool, savePool } from "@/lib/entry-cache";

type Phase =
  | { kind: "waiting" }
  | { kind: "drawing"; winner: ScreenWinner }
  | { kind: "revealed"; winner: ScreenWinner };

/**
 * The public screen (screens 1g-1i and 7f).
 *
 * Two rules from the design govern everything here: the audience never sees
 * an error, and the draw must survive a dropped venue connection. So the
 * connection state is a small banner rather than a dialog, the entry pool is
 * cached locally, and problems that need a decision surface only to the
 * organiser.
 */
export function LiveScreen({
  config,
  prizes,
  initialWinners,
}: {
  config: ScreenConfig;
  prizes: ScreenPrize[];
  initialWinners: ScreenWinner[];
}) {
  const [phase, setPhase] = useState<Phase>(
    initialWinners.length > 0
      ? { kind: "revealed", winner: initialWinners[initialWinners.length - 1]! }
      : { kind: "waiting" },
  );
  const [entryCount, setEntryCount] = useState(config.entryCount);
  const [online, setOnline] = useState(true);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);
  const [drawnCount, setDrawnCount] = useState(initialWinners.length);
  const busy = useRef(false);

  // Keep a masked copy of the pool locally, so an offline draw is possible.
  useEffect(() => {
    void loadPool(config.eventId).then((pool) => {
      if (pool) setCachedAt(new Date(pool.savedAt));
    });
  }, [config.eventId]);

  useEffect(() => {
    const source = new EventSource(`/api/live/${config.slug}/stream`);

    source.onopen = () => setOnline(true);
    source.onerror = () => setOnline(false);

    source.onmessage = (event) => {
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(event.data) as Record<string, unknown>;
      } catch {
        return;
      }

      if (message.type === "entry" && typeof message.count === "number") {
        setEntryCount(message.count);
        return;
      }

      if (message.type === "draw") {
        const winner = message as unknown as ScreenWinner;
        busy.current = true;
        setPhase({ kind: "drawing", winner });
        void savePool({
          eventId: config.eventId,
          names: winner.pool,
          entryNumbers: [],
          savedAt: Date.now(),
        });
        setCachedAt(new Date());
        return;
      }

      if (message.type === "redraw") {
        setPhase({ kind: "waiting" });
      }
    };

    return () => source.close();
  }, [config.slug, config.eventId]);

  const onSettled = useCallback(() => {
    busy.current = false;
    setPhase((current) =>
      current.kind === "drawing" ? { kind: "revealed", winner: current.winner } : current,
    );
    setDrawnCount((count) => count + 1);
  }, []);

  // Space draws, R re-draws, Esc exits — and only for an organiser. A kiosk
  // device or a passer-by pressing space does nothing.
  useEffect(() => {
    if (!config.canControl) return;

    async function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        window.close();
        return;
      }
      if (busy.current) return;

      if (event.code === "Space") {
        event.preventDefault();
        await fetch(`/api/events/${config.eventId}/draw`, { method: "POST" }).catch(() =>
          drawOffline(),
        );
      }

      if (event.key.toLowerCase() === "r" && phase.kind === "revealed") {
        event.preventDefault();
        await fetch(`/api/events/${config.eventId}/draw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redraw: true, prizeId: phase.winner.prizeId }),
        }).catch(() => undefined);
      }
    }

    /**
     * Offline fallback: draw from the cached pool on this machine so the show
     * goes on, and queue the result to be reconciled when the link returns.
     */
    async function drawOffline() {
      const pool = await loadPool(config.eventId);
      const prize = prizes[drawnCount];
      if (!pool || !prize || pool.names.length === 0) return;

      const index = crypto.getRandomValues(new Uint32Array(1))[0]! % pool.names.length;
      const winner: ScreenWinner = {
        prizeId: prize.id,
        prizeName: prize.name,
        prizeIndex: drawnCount + 1,
        prizeTotal: prizes.length,
        winnerName: pool.names[index]!,
        winnerDetail: null,
        entryNumber: pool.entryNumbers[index] ?? 0,
        pool: pool.names,
        drawnAt: new Date().toISOString(),
      };

      addPendingDraw({
        prizeId: prize.id,
        entryNumber: winner.entryNumber,
        drawnAt: winner.drawnAt,
      });
      busy.current = true;
      setPhase({ kind: "drawing", winner });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config.canControl, config.eventId, phase, prizes, drawnCount]);

  // Keep the projector awake through a long event.
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

  const suspenseMs = config.suspenseSeconds * 1000;

  return (
    <div
      className="relative flex h-dvh w-screen cursor-none flex-col overflow-hidden"
      style={{ background: config.backgroundColour }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob -top-40 -left-32 h-[560px] w-[560px] bg-violet-blob" />
        <div className="blob -bottom-48 -right-32 h-[480px] w-[480px] bg-teal-blob" />
      </div>

      <header className="relative flex items-center justify-between px-10 py-8">
        {config.showLogo && config.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.logoUrl} alt={config.organisationName} className="max-h-12" />
        ) : (
          <span className="text-[20px] font-extrabold">{config.organisationName}</span>
        )}

        {config.showEntryCount ? (
          <span className="text-[17px] font-bold text-ink-secondary tabular-nums">
            {new Intl.NumberFormat("en-GB").format(entryCount)} entries
          </span>
        ) : null}
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-10">
        {phase.kind === "waiting" ? (
          <WaitingStage config={config} prizeCount={prizes.length} />
        ) : (
          <>
            <p className="mb-8 text-[19px] font-bold text-ink-muted">
              Prize {phase.winner.prizeIndex} of {phase.winner.prizeTotal} ·{" "}
              <span className="text-ink">{phase.winner.prizeName}</span>
            </p>

            {phase.kind === "drawing" ? (
              <Stage
                animation={config.animation}
                pool={phase.winner.pool}
                winnerName={phase.winner.winnerName}
                durationMs={suspenseMs}
                accentColour={config.accentColour}
                onSettled={onSettled}
              />
            ) : (
              <WinnerCard winner={phase.winner} accentColour={config.accentColour} />
            )}
          </>
        )}
      </main>

      <footer className="relative flex items-center justify-between px-10 py-8 text-[14px] text-ink-muted">
        <span>
          {online ? (
            phase.kind === "revealed" && config.canControl ? (
              <>
                Press <Key>space</Key> for the next prize, <Key>R</Key> to re-draw
              </>
            ) : config.canControl ? (
              <>
                Press <Key>space</Key> to draw
              </>
            ) : null
          ) : (
            <span className="font-bold text-peach-ink-soft">
              Connection lost
              {cachedAt
                ? ` · using the entry list saved at ${cachedAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </span>
          )}
        </span>
        <span>{config.eventName}</span>
      </footer>

      {phase.kind === "revealed" && config.confettiOnWin ? (
        <Confetti active colours={[config.accentColour, "#3fb8c8", "#ffd9c2", "#ffffff"]} />
      ) : null}
    </div>
  );
}

function Stage({
  animation,
  pool,
  winnerName,
  durationMs,
  accentColour,
  onSettled,
}: {
  animation: ScreenConfig["animation"];
  pool: string[];
  winnerName: string;
  durationMs: number;
  accentColour: string;
  onSettled: () => void;
}) {
  const shared = { durationMs, accentColour, onSettled };

  if (animation === "WHEEL") return <Wheel pool={pool} winnerName={winnerName} {...shared} />;
  if (animation === "COUNTDOWN") return <CountdownReveal {...shared} />;
  if (animation === "CARDS") return <Cards {...shared} />;
  return <NameReel pool={pool} winnerName={winnerName} {...shared} />;
}

function WinnerCard({ winner, accentColour }: { winner: ScreenWinner; accentColour: string }) {
  return (
    <div className="glass flex flex-col items-center px-16 py-12 text-center" aria-live="polite">
      <p className="text-[14px] font-bold tracking-[0.14em] uppercase" style={{ color: accentColour }}>
        Winner
      </p>
      <p className="mt-3 font-serif text-[76px] leading-[1.05] tracking-[-0.02em]">
        {winner.winnerName}
      </p>
      <p className="mt-3 text-[17px] text-ink-muted">
        Entry #{winner.entryNumber}
        {winner.winnerDetail ? ` · ${winner.winnerDetail}` : ""}
      </p>
    </div>
  );
}

/** Screen 7f's waiting view: a countdown, and an invitation to still enter. */
function WaitingStage({ config, prizeCount }: { config: ScreenConfig; prizeCount: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!config.drawAt) return;
    const target = new Date(config.drawAt).getTime();

    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [config.drawAt]);

  // The mockup shows minutes and seconds, which is right for the last hour
  // before a draw. Further out that would read as "20328 : 55", so the units
  // step up to hours and then to a plain date.
  const countdown = remaining === null ? null : splitCountdown(remaining);

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-[34px] font-extrabold">{config.organisationName} raffle</h1>

      {config.drawAt ? (
        <>
          <p className="mt-2 text-[19px] text-ink-secondary">
            The draw starts at{" "}
            {new Date(config.drawAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {countdown && countdown.kind === "clock" ? (
            <p className="mt-8 flex items-center gap-3 font-serif text-[110px] leading-none tabular-nums">
              <span>{countdown.left}</span>
              <span className="text-ink-faint">:</span>
              <span>{countdown.right}</span>
            </p>
          ) : countdown && countdown.kind === "far" ? (
            <p className="mt-8 font-serif text-[64px] leading-none">{countdown.label}</p>
          ) : (
            <p className="mt-8 font-serif text-[64px] leading-none">Any moment now</p>
          )}
        </>
      ) : (
        <p className="mt-8 font-serif text-[64px] leading-none">Any moment now</p>
      )}

      <p className="mt-8 text-[16px] text-ink-muted">
        Still time to enter — scan the QR at the stand · {prizeCount}{" "}
        {prizeCount === 1 ? "prize" : "prizes"}
      </p>
    </div>
  );
}

type Countdown =
  | { kind: "clock"; left: string; right: string }
  | { kind: "far"; label: string }
  | { kind: "now" };

function splitCountdown(remainingMs: number): Countdown {
  if (remainingMs <= 0) return { kind: "now" };

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return { kind: "far", label: `In ${days} day${days === 1 ? "" : "s"}` };
  }
  if (hours > 0) {
    return {
      kind: "clock",
      left: String(hours).padStart(2, "0"),
      right: String(minutes).padStart(2, "0"),
    };
  }
  return {
    kind: "clock",
    left: String(minutes).padStart(2, "0"),
    right: String(seconds).padStart(2, "0"),
  };
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-[7px] bg-white px-2 py-0.5 font-sans text-[12.5px] font-bold text-ink">
      {children}
    </kbd>
  );
}

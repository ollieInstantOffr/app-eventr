"use client";

import { useState, useTransition } from "react";
import { DrawAnimation } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { PanelSection } from "@/components/ui/glass-panel";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import { drawNextPrize, saveDrawSettings, type DrawSettings } from "./actions";
import { KioskPairing } from "./kiosk-pairing";
import { NoEligibleEntriesOverlay } from "./no-eligible-overlay";

type RunOrderPrize = {
  id: string;
  order: number;
  name: string;
  meta: string | null;
  winnerCount: number;
  winnerName: string | null;
  drawn: boolean;
};

const ANIMATIONS: Array<{ value: DrawAnimation; label: string; hint: string }> = [
  { value: DrawAnimation.NAME_REEL, label: "Name reel", hint: "Names blur past a centre line" },
  { value: DrawAnimation.WHEEL, label: "Wheel", hint: "Segments spin to a glass pointer" },
  { value: DrawAnimation.COUNTDOWN, label: "Countdown", hint: "Calm, minimal, a number counts down" },
  { value: DrawAnimation.CARDS, label: "Cards", hint: "Face-down cards flip to the winner" },
];

/** Screen 1f — settings on the left, a live preview and the run order on the right. */
export function LiveDrawSettings({
  eventId,
  slug,
  organisationName,
  logoUrl,
  accentColour,
  backgroundColour,
  settings: initial,
  prizes,
  eligibleCount,
}: {
  eventId: string;
  slug: string;
  organisationName: string;
  logoUrl: string | null;
  accentColour: string;
  backgroundColour: string;
  settings: DrawSettings;
  prizes: RunOrderPrize[];
  eligibleCount: number;
}) {
  const [settings, setSettings] = useState(initial);
  const [saving, startSave] = useTransition();
  const [drawing, startDraw] = useTransition();
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(changes: Partial<DrawSettings>) {
    const next = { ...settings, ...changes };
    setSettings(next);
    startSave(() => saveDrawSettings(eventId, next));
  }

  function draw(options?: { allowPreviousWinners?: boolean; includeDuplicates?: boolean }) {
    startDraw(async () => {
      const result = await drawNextPrize(eventId, options);
      if (result.ok) {
        setBlocked(false);
        setMessage(`${result.prizeName} → ${result.winnerName}`);
        return;
      }
      if (result.reason === "no-eligible-entries") {
        setBlocked(true);
        return;
      }
      setMessage(
        result.reason === "complete" ? "Every prize has been drawn." : "That prize is already drawn.",
      );
    });
  }

  const nextPrize = prizes.find((prize) => !prize.drawn) ?? null;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <PanelSection title="Draw animation" action={saving ? <Badge>Saving…</Badge> : null}>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update({ animation: option.value })}
                  aria-pressed={settings.animation === option.value}
                  className={cn(
                    "rounded-field p-3 text-left transition-colors",
                    settings.animation === option.value
                      ? "bg-violet text-white"
                      : "bg-white text-ink-secondary hover:text-ink",
                  )}
                >
                  <span className="block text-[13px] font-bold">{option.label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11px] leading-snug",
                      settings.animation === option.value ? "text-white/75" : "text-ink-muted",
                    )}
                  >
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-[12px] font-bold text-ink-muted">
                Suspense · {settings.suspenseSeconds} s
              </span>
              <input
                type="range"
                min={2}
                max={20}
                value={settings.suspenseSeconds}
                onChange={(event) => update({ suspenseSeconds: Number(event.target.value) })}
                className="mt-2 w-full accent-violet"
              />
            </label>
          </PanelSection>

          <PanelSection title="What the room sees">
            <div className="divide-y divide-black/6">
              <Toggle
                checked={settings.showLogo}
                onChange={(value) => update({ showLogo: value })}
                label="Show logo"
              />
              <Toggle
                checked={settings.showEntryCount}
                onChange={(value) => update({ showEntryCount: value })}
                label="Show entry count"
              />
              <Toggle
                checked={settings.maskPersonalData}
                onChange={(value) => update({ maskPersonalData: value })}
                label="Mask personal data"
                description="Jonas E. · jo···@ek.se"
              />
              <Toggle
                checked={settings.confettiOnWin}
                onChange={(value) => update({ confettiOnWin: value })}
                label="Confetti on win"
              />
              <Toggle
                checked={settings.redrawEnabled}
                onChange={(value) => update({ redrawEnabled: value })}
                label="Re-draw if no show"
                description="Press R on the public screen"
              />
            </div>
          </PanelSection>

          <KioskPairing eventId={eventId} />
        </div>

        <div className="flex flex-col gap-5">
          <PanelSection
            title="Preview · public screen"
            hint="16:9"
            action={
              <ButtonLink href={`/screen/${slug}`} target="_blank" size="sm">
                Open public screen ↗
              </ButtonLink>
            }
          >
            <div
              className="relative aspect-video w-full overflow-hidden rounded-panel"
              style={{ background: backgroundColour }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="blob -top-16 -left-10 h-56 w-56 bg-violet-blob" />
                <div className="blob -bottom-20 -right-10 h-48 w-48 bg-teal-blob" />
              </div>

              <div className="relative flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  {settings.showLogo && logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="max-h-6" />
                  ) : (
                    <span className="text-[11px] font-extrabold">{organisationName}</span>
                  )}
                  {settings.showEntryCount ? (
                    <span className="text-[10.5px] font-bold text-ink-muted">
                      {eligibleCount} entries
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <p className="text-[10.5px] font-bold text-ink-muted">
                    Prize {nextPrize?.order ?? 1} · {nextPrize?.name ?? "Your first prize"}
                  </p>
                  <p className="mt-1.5 font-serif text-[34px] leading-tight">
                    {settings.maskPersonalData ? "Jonas E." : "Jonas Ek"}
                  </p>
                  <p className="mt-1 text-[10px] text-ink-muted">
                    Entry #249{settings.maskPersonalData ? " · jo···@ek.se" : " · jonas@ek.se"}
                  </p>
                </div>

                <p className="text-center text-[9.5px] text-ink-faint">
                  Press space for the next prize
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => draw()} disabled={drawing || !nextPrize}>
                {drawing ? "Drawing…" : nextPrize ? `Draw ${nextPrize.name}` : "All prizes drawn"}
              </Button>
              {message ? <span className="text-[12.5px] font-bold text-teal-darker">{message}</span> : null}
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
              On the public screen: <Key>Space</Key> draws the next prize, <Key>R</Key> re-draws,{" "}
              <Key>Esc</Key> exits. This laptop stays the remote.
            </p>
          </PanelSection>

          <PanelSection title="Run order" hint={`${eligibleCount} eligible entries`}>
            {prizes.length === 0 ? (
              <p className="rounded-field bg-white px-3.5 py-4 text-[12.5px] text-ink-muted">
                No prizes yet — add them in the event builder.
              </p>
            ) : (
              <ol className="divide-y divide-black/6">
                {prizes.map((prize) => (
                  <li key={prize.id} className="flex items-center gap-3 py-3">
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold",
                        prize.drawn
                          ? "bg-teal/18 text-teal-darker"
                          : "bg-violet-tint text-violet-deep",
                      )}
                    >
                      {prize.drawn ? "✓" : prize.order}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold">{prize.name}</span>
                      <span className="block text-[12px] text-ink-muted">
                        {prize.winnerCount} winner{prize.winnerCount === 1 ? "" : "s"} · eligible{" "}
                        {eligibleCount}
                      </span>
                    </span>
                    {prize.drawn && prize.winnerName ? (
                      <Badge tone="live">{prize.winnerName}</Badge>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </PanelSection>
        </div>
      </div>

      {blocked && nextPrize ? (
        <NoEligibleEntriesOverlay
          prizeName={nextPrize.name}
          prizeOrder={nextPrize.order}
          onAllowPreviousWinners={() => draw({ allowPreviousWinners: true })}
          onIncludeDuplicates={() => draw({ includeDuplicates: true })}
          onDismiss={() => setBlocked(false)}
        />
      ) : null}
    </>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded-[6px] bg-white px-1.5 py-0.5 font-sans text-[11px] font-bold text-ink">
      {children}
    </kbd>
  );
}

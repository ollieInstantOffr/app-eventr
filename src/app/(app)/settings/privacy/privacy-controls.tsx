"use client";

import { useState, useTransition } from "react";
import { RetentionPeriod } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { PanelSection } from "@/components/ui/glass-panel";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import { savePrivacySettings, type PrivacySettings } from "../actions";

const PERIODS: Array<{ value: RetentionPeriod; label: string }> = [
  { value: RetentionPeriod.DAYS_7, label: "7 d" },
  { value: RetentionPeriod.DAYS_30, label: "30 d" },
  { value: RetentionPeriod.DAYS_90, label: "90 d" },
  { value: RetentionPeriod.MONTHS_12, label: "12 mo" },
];

/** Screen 4d's Retention card. */
export function PrivacyControls({ settings: initial }: { settings: PrivacySettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, start] = useTransition();

  function update(changes: Partial<PrivacySettings>) {
    const next = { ...settings, ...changes };
    setSettings(next);
    start(() => savePrivacySettings(next));
  }

  return (
    <PanelSection title="Retention" action={saving ? <Badge>Saving…</Badge> : null}>
      <div className="flex flex-wrap items-start justify-between gap-4 py-2">
        <span className="max-w-[46ch]">
          <span className="block text-[13.5px] font-bold">Delete guest entries automatically</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-ink-muted">
            Default for new events. Winners&rsquo; contact details are kept until you mark the prize
            as delivered.
          </span>
        </span>

        <div className="flex gap-1.5">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              aria-pressed={settings.retentionPeriod === period.value}
              onClick={() => update({ retentionPeriod: period.value })}
              className={cn(
                "rounded-field px-3 py-2 text-[12.5px] font-bold transition-colors",
                settings.retentionPeriod === period.value
                  ? "bg-violet text-white"
                  : "bg-white text-ink-secondary hover:text-ink",
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 divide-y divide-black/6 border-t border-black/6">
        <Toggle
          checked={settings.minimiseByDefault}
          onChange={(value) => update({ minimiseByDefault: value })}
          label="Minimise by default"
          description="New events start with name + email only; phone and company must be switched on and justified."
        />
        <Toggle
          checked={settings.maskNamesOnScreen}
          onChange={(value) => update({ maskNamesOnScreen: value })}
          label="Mask names on the live screen"
          description="“Jonas E.” instead of full names in public."
        />
      </div>
    </PanelSection>
  );
}

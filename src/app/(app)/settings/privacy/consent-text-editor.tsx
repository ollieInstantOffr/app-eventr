"use client";

import { useState, useTransition } from "react";
import { RetentionPeriod } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { PanelSection } from "@/components/ui/glass-panel";
import { Toggle } from "@/components/ui/toggle";
import { saveConsentText, savePrivacySettings } from "../actions";

const RETENTION_LABELS: Record<RetentionPeriod, string> = {
  DAYS_7: "7 days",
  DAYS_30: "30 days",
  DAYS_90: "90 days",
  MONTHS_12: "12 months",
};

/**
 * Screen 4d's consent editor. Saving creates a new version rather than
 * changing the old one, because every entry points at the version its guest
 * agreed to and that record has to stay true.
 */
export function ConsentTextEditor({
  template,
  version,
  organisationName,
  retentionPeriod,
  marketingOptInEnabled,
}: {
  template: string;
  version: string;
  organisationName: string;
  retentionPeriod: RetentionPeriod;
  marketingOptInEnabled: boolean;
}) {
  const [text, setText] = useState(template);
  const [marketing, setMarketing] = useState(marketingOptInEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const preview = text
    .replaceAll("{{organisation}}", organisationName)
    .replaceAll("{{retention}}", RETENTION_LABELS[retentionPeriod]);

  return (
    <PanelSection
      title="Guest consent text"
      hint="Shown above the “Enter raffle” button"
      action={<Badge tone="violet">Version {version}</Badge>}
    >
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        aria-label="Consent text"
        className="text-[13px]"
      />
      <p className="mt-1.5 text-[11.5px] text-ink-muted">
        <code className="rounded bg-white px-1 py-0.5">{"{{organisation}}"}</code> and{" "}
        <code className="rounded bg-white px-1 py-0.5">{"{{retention}}"}</code> are filled in per
        event.
      </p>

      <div className="mt-3 rounded-field bg-white p-3.5">
        <p className="text-[11.5px] font-bold text-ink-muted">What the guest sees</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">{preview}</p>
      </div>

      <div className="mt-3 border-t border-black/6 pt-1">
        <Toggle
          checked={marketing}
          onChange={(value) => {
            setMarketing(value);
            start(() =>
              savePrivacySettings({
                retentionPeriod,
                minimiseByDefault: true,
                maskNamesOnScreen: true,
                marketingOptInEnabled: value,
                autoFulfilErasure: false,
              }),
            );
          }}
          label="Separate marketing opt-in"
          description={`Adds an unticked second checkbox: “Send me news from ${organisationName}”. Keeps raffle consent and marketing consent apart, as GDPR requires.`}
        />
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
        Each entry stores the exact consent text, version and timestamp the guest agreed to.
      </p>

      {error ? <p className="mt-2 text-[12.5px] font-semibold text-danger">{error}</p> : null}
      {message ? (
        <p className="mt-2 text-[12.5px] font-semibold text-teal-darker">{message}</p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button
          disabled={pending || text === template}
          onClick={() =>
            start(async () => {
              const result = await saveConsentText(text);
              setError(result.error ?? null);
              setMessage(result.ok ?? null);
            })
          }
        >
          {pending ? "Saving…" : "Save as a new version"}
        </Button>
      </div>
    </PanelSection>
  );
}

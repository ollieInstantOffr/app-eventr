"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { EventStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Textarea } from "@/components/ui/field";
import { TimePicker } from "@/components/ui/time-picker";
import { PanelSection } from "@/components/ui/glass-panel";
import { publishEvent, saveEvent, type EventDraft } from "@/server/events/mutations";
import { DeleteEventDialog, type DeletionImpact } from "./delete-event-dialog";
import { LogoPicker } from "./logo-picker";
import { FieldList, type BuilderField } from "./field-list";
import { PrizeList, type BuilderPrize } from "./prize-list";

export type BuilderEvent = {
  id: string;
  name: string;
  status: EventStatus;
  slug: string;
  eventDate: string | null;
  entriesCloseAt: string | null;
  drawAt: string | null;
  welcomeMessage: string | null;
  venueLabel: string | null;
  accentColour: string | null;
  backgroundColour: string | null;
  logoKey: string | null;
  fields: BuilderField[];
  prizes: BuilderPrize[];
};

const AUTOSAVE_DELAY_MS = 1200;

/** Screen 1b — details, branding, entry form fields and prizes on one page. */
export function EventBuilder({
  event,
  organisation,
  logoUrl,
  deletionImpact,
  canDelete,
}: {
  event: BuilderEvent;
  organisation: {
    name: string;
    accentColour: string;
    logoUrl: string | null;
    minimiseByDefault: boolean;
  };
  logoUrl: string | null;
  deletionImpact: DeletionImpact;
  canDelete: boolean;
}) {
  const [draft, setDraft] = useState<BuilderEvent>(event);
  const [logo, setLogo] = useState<{ key: string | null; url: string | null }>({
    key: event.logoKey,
    url: logoUrl,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [publishing, startPublish] = useTransition();
  const [deleting, setDeleting] = useState(false);

  // What is already on the server. Autosave compares against this rather than
  // using a "first render" flag, which Strict Mode's double-invoked effects
  // would defeat.
  const lastSaved = useRef<string | null>(null);

  const toPayload = useCallback(
    (value: BuilderEvent, logoKey: string | null): EventDraft => ({
      name: value.name,
      eventDate: value.eventDate,
      entriesCloseAt: value.entriesCloseAt,
      drawAt: value.drawAt,
      welcomeMessage: value.welcomeMessage,
      venueLabel: value.venueLabel,
      accentColour: value.accentColour,
      backgroundColour: value.backgroundColour,
      logoKey,
      fields: value.fields.map((field) => ({
        id: field.id,
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options,
        justification: field.justification,
      })),
      prizes: value.prizes.map((prize) => ({
        id: prize.id,
        name: prize.name,
        meta: prize.meta,
        winnerCount: prize.winnerCount,
      })),
    }),
    [],
  );

  // Autosave: the builder saves as a draft on its own, so nothing is lost if
  // the organiser wanders off mid-setup.
  useEffect(() => {
    const payload = toPayload(draft, logo.key);
    const serialised = JSON.stringify(payload);

    if (lastSaved.current === null) {
      lastSaved.current = serialised;
      return;
    }
    if (lastSaved.current === serialised) return;
    if (!draft.name.trim()) return;

    setStatus("saving");
    const timer = setTimeout(async () => {
      const result = await saveEvent(draft.id, payload);
      if (result.error) {
        setStatus("error");
        setError(result.error);
      } else {
        lastSaved.current = serialised;
        setStatus("saved");
        setError(null);
      }
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [draft, logo.key, toPayload]);

  function update<K extends keyof BuilderEvent>(key: K, value: BuilderEvent[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function onPublish() {
    setError(null);
    startPublish(async () => {
      const result = await publishEvent(draft.id, toPayload(draft, logo.key));
      if (result?.error) setError(result.error);
    });
  }

  const isPublished = draft.status !== "DRAFT";

  return (
    <div className="flex flex-col gap-5">
      <header className="sticky top-5 z-20 -mx-1 flex flex-wrap items-end justify-between gap-4 bg-screen/70 px-1 py-3 backdrop-blur-md sm:top-6">
        <div>
          <p className="text-[12.5px] font-bold text-ink-muted">
            <Link href="/events" className="hover:text-violet">
              Events
            </Link>{" "}
            / {isPublished ? draft.name || "Untitled" : "New"}
          </p>
          <h1 className="mt-0.5 text-[28px] font-extrabold">
            {isPublished ? "Edit event" : "Create event"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus status={status} />
          {isPublished ? (
            <Button variant="secondary" onClick={() => (window.location.href = `/events/${draft.id}/share`)}>
              Share the raffle
            </Button>
          ) : null}
          <Button onClick={onPublish} disabled={publishing}>
            {publishing ? "Publishing…" : isPublished ? "Save changes" : "Publish & get QR"}
          </Button>
        </div>
      </header>

      {error ? (
        <p className="rounded-field bg-danger/10 px-4 py-3 text-[13px] font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <PanelSection title="Details">
            <div className="flex flex-col gap-4">
              <Field label="Event name" htmlFor="name">
                <Input
                  id="name"
                  value={draft.name}
                  autoFocus={!draft.name}
                  placeholder="Nordic Tech Expo 2026"
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date" htmlFor="date">
                  <DatePicker
                    id="date"
                    value={draft.eventDate}
                    onChange={(value) => update("eventDate", value)}
                  />
                </Field>
                <Field label="Entries close" htmlFor="close">
                  <TimePicker
                    id="close"
                    value={draft.entriesCloseAt}
                    onChange={(value) => update("entriesCloseAt", value)}
                  />
                </Field>
                <Field label="Draw at" htmlFor="draw">
                  <TimePicker
                    id="draw"
                    value={draft.drawAt}
                    onChange={(value) => update("drawAt", value)}
                  />
                </Field>
              </div>

              <Field
                label="Welcome message"
                htmlFor="welcome"
                hint="Shown on guests' phones above the form."
              >
                <Textarea
                  id="welcome"
                  value={draft.welcomeMessage ?? ""}
                  placeholder="Drop your details for a chance to win. Winners are drawn live at the main stage at 16:30."
                  onChange={(e) => update("welcomeMessage", e.target.value || null)}
                />
              </Field>

              <Field
                label="Where to collect"
                htmlFor="venue"
                hint="Used in the winner email and on the winner's page."
              >
                <Input
                  id="venue"
                  value={draft.venueLabel ?? ""}
                  placeholder="Stand B12"
                  onChange={(e) => update("venueLabel", e.target.value || null)}
                />
              </Field>
            </div>
          </PanelSection>

          <PanelSection title="Entry form fields" hint="Drag to reorder">
            <FieldList
              fields={draft.fields}
              minimiseByDefault={organisation.minimiseByDefault}
              onChange={(fields) => update("fields", fields)}
            />
          </PanelSection>
        </div>

        <div className="flex flex-col gap-5">
          <PanelSection title="Logo" hint="Shown on the phone page and live screen">
            <LogoPicker
              logoUrl={logo.url}
              fallbackUrl={organisation.logoUrl}
              organisationName={organisation.name}
              onChange={(next) => setLogo(next)}
            />

            <div className="mt-5 grid grid-cols-2 gap-4">
              <Field label="Accent" htmlFor="accent">
                <ColourInput
                  id="accent"
                  value={draft.accentColour ?? organisation.accentColour}
                  onChange={(value) => update("accentColour", value)}
                />
              </Field>
              <Field label="Background" htmlFor="background">
                <ColourInput
                  id="background"
                  value={draft.backgroundColour ?? "#F2F0EB"}
                  onChange={(value) => update("backgroundColour", value)}
                />
              </Field>
            </div>
          </PanelSection>

          <PanelSection title="Prizes" hint="Drawn in this order">
            <PrizeList prizes={draft.prizes} onChange={(prizes) => update("prizes", prizes)} />
          </PanelSection>

          {canDelete ? (
            <PanelSection title="Delete event">
              <p className="text-[12.5px] leading-relaxed text-ink-secondary">
                Erases the event and every entry in it. Anonymised draw logs are kept so you can
                still account for any draw that already happened.
              </p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => setDeleting(true)}>
                Delete this event…
              </Button>
            </PanelSection>
          ) : null}
        </div>
      </div>

      {deleting ? (
        <DeleteEventDialog
          eventId={draft.id}
          eventName={draft.name || "this event"}
          impact={deletionImpact}
          onClose={() => setDeleting(false)}
        />
      ) : null}
    </div>
  );
}

function SaveStatus({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  const copy = { saving: "Saving…", saved: "Draft saved", error: "Not saved" } as const;
  const tone = status === "error" ? "danger" : status === "saved" ? "live" : "neutral";
  return <Badge tone={tone}>{copy[status]}</Badge>;
}

function ColourInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-field border border-black/8 bg-white px-2.5 py-2">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="font-mono text-[12.5px] text-ink-secondary">{value.toUpperCase()}</span>
    </div>
  );
}

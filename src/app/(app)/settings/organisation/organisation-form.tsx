"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveOrganisation, type SettingsState } from "../actions";

export function OrganisationForm({
  name,
  accentColour,
  replyToEmail,
  logoUrl,
  canEdit,
}: {
  name: string;
  accentColour: string;
  replyToEmail: string;
  logoUrl: string | null;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveOrganisation, {});
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [removed, setRemoved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4 rounded-panel bg-white/60 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-chip bg-violet-tint text-[10px] font-bold text-violet-deep">
          {preview && !removed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-contain" />
          ) : (
            "logo"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">
            {preview && !removed ? "Organisation logo" : "No logo yet"}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">
            Used on phone pages and live screens unless an event overrides it.
          </p>
        </div>

        {canEdit ? (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInput.current?.click()}
            >
              {preview && !removed ? "Replace" : "Upload"}
            </Button>
            {preview && !removed ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemoved(true)}>
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <input
        ref={fileInput}
        type="file"
        name="logo"
        accept="image/svg+xml,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setRemoved(false);
          setPreview(URL.createObjectURL(file));
        }}
      />
      {removed ? <input type="hidden" name="removeLogo" value="on" /> : null}

      <Field label="Organisation name" htmlFor="org-name">
        <Input id="org-name" name="name" defaultValue={name} required disabled={!canEdit} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Accent colour" htmlFor="accent">
          <div className="flex items-center gap-2 rounded-field border border-black/8 bg-white px-2.5 py-2">
            <input
              id="accent"
              name="accentColour"
              type="color"
              defaultValue={accentColour}
              disabled={!canEdit}
              className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="font-mono text-[12.5px] text-ink-secondary">{accentColour}</span>
          </div>
        </Field>

        <Field
          label="Reply-to email"
          htmlFor="reply-to"
          hint="Where a winner's reply goes."
        >
          <Input
            id="reply-to"
            name="replyToEmail"
            type="email"
            defaultValue={replyToEmail}
            disabled={!canEdit}
          />
        </Field>
      </div>

      {state.error ? <p className="text-[12.5px] font-semibold text-danger">{state.error}</p> : null}
      {state.ok ? <p className="text-[12.5px] font-semibold text-teal-darker">{state.ok}</p> : null}

      {canEdit ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      ) : (
        <p className="text-[12.5px] text-ink-muted">Only an owner can change these.</p>
      )}
    </form>
  );
}

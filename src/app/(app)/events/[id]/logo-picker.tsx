"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadEventLogo } from "@/server/events/mutations";

/** The drag-and-drop logo panel from screen 1b, with its two states. */
export function LogoPicker({
  logoUrl,
  fallbackUrl,
  organisationName,
  onChange,
}: {
  logoUrl: string | null;
  fallbackUrl: string | null;
  organisationName: string;
  onChange: (next: { key: string | null; url: string | null }) => void;
}) {
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startUpload] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    startUpload(async () => {
      const data = new FormData();
      data.set("logo", file);
      const result = await uploadEventLogo({}, data);
      if (result.error) {
        setError(result.error);
        setPreview(logoUrl);
        return;
      }
      if (result.key) onChange({ key: result.key, url: `/api/files/${result.key}` });
    });
  }

  const shown = preview ?? fallbackUrl;

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          upload(event.dataTransfer.files[0]);
        }}
        className="flex items-center gap-4 rounded-panel border border-dashed border-black/15 bg-white/60 p-4"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-chip bg-violet-tint text-[10px] font-bold text-violet-deep">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-contain" />
          ) : (
            "logo"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">
            {preview ? "Event logo" : fallbackUrl ? `${organisationName} logo` : "Drop your logo here"}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">
            {preview
              ? "Overrides your organisation logo for this event."
              : fallbackUrl
                ? "Inherited from your organisation. Upload one to override it."
                : "SVG or PNG, transparent background works best"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {pending ? "Uploading…" : preview ? "Replace" : "Browse files"}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreview(null);
                onChange({ key: null, url: null });
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => upload(event.target.files?.[0])}
      />

      {error ? <p className="text-[12px] font-semibold text-danger">{error}</p> : null}
    </div>
  );
}

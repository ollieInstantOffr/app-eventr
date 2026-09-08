"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createWorkspace, type WorkspaceFormState } from "./actions";

export function WorkspaceForm() {
  const [state, action, pending] = useActionState<WorkspaceFormState, FormData>(createWorkspace, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function onPick(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      <Field label="Workspace name" htmlFor="name" hint="Usually your company or team name.">
        <Input id="name" name="name" required autoFocus placeholder="Northwind Events" />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-bold text-ink-muted">Logo</span>
        <div
          className="flex items-center gap-4 rounded-panel border border-dashed border-black/15 bg-white/60 p-4"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file && fileInput.current) {
              const transfer = new DataTransfer();
              transfer.items.add(file);
              fileInput.current.files = transfer.files;
              onPick(file);
            }
          }}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-chip bg-violet-tint text-[11px] font-bold text-violet-deep">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-contain" />
            ) : (
              "logo"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">
              {fileName ?? "Drop your logo here"}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              SVG or PNG, transparent background works best
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            Browse files
          </Button>
        </div>
        <input
          ref={fileInput}
          id="logo"
          name="logo"
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => onPick(event.target.files?.[0])}
        />
      </div>

      {state.error ? <p className="text-[12.5px] font-semibold text-danger">{state.error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending} className="flex-1">
          {pending ? "Creating…" : "Create my first event"}
        </Button>
      </div>
      <p className="text-center text-[12px] text-ink-muted">
        No logo to hand? Leave it &mdash; you can add one under Organisation later.
      </p>
    </form>
  );
}

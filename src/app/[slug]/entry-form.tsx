"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FieldType } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { enterRaffle, type EntryFormState } from "./actions";

export type GuestField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
};

const AUTOCOMPLETE: Partial<Record<string, string>> = {
  name: "name",
  email: "email",
  phone: "tel",
  company: "organization",
};

/** The form itself. Renders exactly the fields the organiser enabled, in order. */
export function EntryForm({
  slug,
  fields,
  consentText,
  marketingText,
  accentColour,
}: {
  slug: string;
  fields: GuestField[];
  consentText: string;
  marketingText: string | null;
  accentColour: string;
}) {
  const [state, action, pending] = useActionState<EntryFormState, FormData>(
    enterRaffle.bind(null, slug),
    {},
  );

  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      {/* Honeypot: hidden from people, irresistible to naive bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
      />

      {fields.map((field) => {
        const id = `f_${field.key}`;
        const error = state.errors?.[field.key];

        if (field.type === FieldType.CHOICE) {
          return (
            <fieldset key={field.key} className="flex flex-col gap-2">
              <legend className="mb-1 text-[12px] font-bold text-ink-muted">{field.label}</legend>
              <div className="flex flex-wrap gap-2">
                {field.options.map((option) => (
                  <label
                    key={option}
                    className="cursor-pointer rounded-chip bg-white px-3.5 py-2 text-[13px] font-bold text-ink-secondary transition-colors has-checked:text-white"
                    style={{ ["--chip" as string]: accentColour }}
                  >
                    <input
                      type="radio"
                      name={id}
                      value={option}
                      required={field.required}
                      className="peer sr-only"
                    />
                    <span className="peer-checked:text-white">{option}</span>
                  </label>
                ))}
              </div>
              {error ? <p className="text-[12px] font-semibold text-danger">{error}</p> : null}
            </fieldset>
          );
        }

        if (field.type === FieldType.CHECKBOX) {
          return (
            <label key={field.key} className="flex items-start gap-2.5 text-[13px] text-ink-secondary">
              <input
                type="checkbox"
                name={id}
                required={field.required}
                className="mt-0.5 h-4 w-4"
                style={{ accentColor: accentColour }}
              />
              <span>{field.label}</span>
            </label>
          );
        }

        return (
          <Field key={field.key} label={field.label} htmlFor={id} error={error}>
            <Input
              id={id}
              name={id}
              required={field.required}
              type={
                field.type === FieldType.EMAIL ? "email" : field.type === FieldType.PHONE ? "tel" : "text"
              }
              inputMode={field.type === FieldType.PHONE ? "tel" : undefined}
              autoComplete={AUTOCOMPLETE[field.key]}
              placeholder={placeholderFor(field)}
            />
          </Field>
        );
      })}

      <label className="mt-1 flex items-start gap-2.5 text-[12.5px] leading-snug text-ink-secondary">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ accentColor: accentColour }}
        />
        <span>
          {consentText}{" "}
          <Link href="/legal/privacy" className="font-bold underline" style={{ color: accentColour }}>
            Privacy notice
          </Link>
        </span>
      </label>

      {marketingText ? (
        <label className="flex items-start gap-2.5 text-[12.5px] leading-snug text-ink-secondary">
          <input
            type="checkbox"
            name="marketing"
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ accentColor: accentColour }}
          />
          <span>{marketingText}</span>
        </label>
      ) : null}

      {state.errors?.consent ? (
        <p className="text-[12px] font-semibold text-danger">{state.errors.consent}</p>
      ) : null}
      {state.message ? (
        <p className="text-[12.5px] font-semibold text-danger">{state.message}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className={cn("mt-1")}
        style={{ background: accentColour }}
      >
        {pending ? "Entering…" : "Enter raffle"}
      </Button>
    </form>
  );
}

function placeholderFor(field: GuestField): string | undefined {
  if (field.key === "email") return "name@company.com";
  if (field.key === "phone") return "+46";
  if (field.key === "company") return "Where do you work?";
  return undefined;
}

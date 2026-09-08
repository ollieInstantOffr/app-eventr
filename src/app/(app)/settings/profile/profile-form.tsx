"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { saveProfile, type SettingsState } from "../actions";

const TIME_ZONES = [
  "Europe/Berlin",
  "Europe/London",
  "Europe/Stockholm",
  "Europe/Madrid",
  "Europe/Helsinki",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function ProfileForm({
  firstName,
  lastName,
  email,
  locale,
  timeZone,
}: {
  firstName: string;
  lastName: string;
  email: string;
  locale: string;
  timeZone: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveProfile, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName">
          <Input id="firstName" name="firstName" defaultValue={firstName} autoComplete="given-name" />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <Input id="lastName" name="lastName" defaultValue={lastName} autoComplete="family-name" />
        </Field>
      </div>

      <Field
        label="Email"
        htmlFor="email"
        hint="This is where your sign-in links go. Contact support to change it."
      >
        <Input id="email" defaultValue={email} disabled />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Language" htmlFor="locale">
          <Select id="locale" name="locale" defaultValue={locale}>
            <option value="en">English</option>
            <option value="sv">Svenska</option>
            <option value="de">Deutsch</option>
          </Select>
        </Field>
        <Field label="Time zone" htmlFor="timeZone">
          <Select id="timeZone" name="timeZone" defaultValue={timeZone}>
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {state.error ? <p className="text-[12.5px] font-semibold text-danger">{state.error}</p> : null}
      {state.ok ? <p className="text-[12.5px] font-semibold text-teal-darker">{state.ok}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="reset" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

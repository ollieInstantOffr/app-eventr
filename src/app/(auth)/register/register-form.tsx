"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerAccount, type AuthFormState } from "@/server/auth/actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAccount, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="firstName">
          <Input id="firstName" name="firstName" autoComplete="given-name" required autoFocus />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <Input id="lastName" name="lastName" autoComplete="family-name" />
        </Field>
      </div>
      <Field label="Work email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
        />
      </Field>

      <label className="flex items-start gap-2.5 text-[12.5px] leading-snug text-ink-secondary">
        <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 accent-violet" required />
        <span>
          I accept the{" "}
          <Link href="/legal/terms" className="font-bold text-violet hover:text-violet-hover">
            Terms of Service
          </Link>{" "}
          and the{" "}
          <Link href="/legal/dpa" className="font-bold text-violet hover:text-violet-hover">
            Data Processing Agreement
          </Link>
          , and confirm I&rsquo;m the data controller for the guests who enter my raffles.
        </span>
      </label>

      {state.error ? <p className="text-[12.5px] font-semibold text-danger">{state.error}</p> : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Continue"}
      </Button>
    </form>
  );
}

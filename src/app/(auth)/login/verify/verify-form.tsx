"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { submitTwoFactorCode, type VerifyState } from "./actions";

export function VerifyForm() {
  const [state, action, pending] = useActionState<VerifyState, FormData>(submitTwoFactorCode, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <Field label="Authentication code" htmlFor="code" error={state.error}>
        <Input
          id="code"
          name="code"
          autoFocus
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          className="font-mono tracking-[0.3em]"
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}

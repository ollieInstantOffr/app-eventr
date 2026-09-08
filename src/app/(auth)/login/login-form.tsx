"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { requestSignInLink, type AuthFormState } from "@/server/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(requestSignInLink, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email" htmlFor="email" error={state.error}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="you@company.com"
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send me a link"}
      </Button>
    </form>
  );
}

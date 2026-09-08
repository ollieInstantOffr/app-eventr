"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { beginTwoFactorEnrolment, confirmTwoFactor, disableTwoFactor } from "./actions";

export function TwoFactorSetup({
  enabled,
  remainingRecoveryCodes,
  email,
}: {
  enabled: boolean;
  remainingRecoveryCodes: number;
  email: string;
}) {
  const [enrolment, setEnrolment] = useState<{ secret: string; uri: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (recoveryCodes) {
    return (
      <div>
        <Badge tone="live">Two-factor authentication is on</Badge>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-secondary">
          Save these recovery codes somewhere safe. Each works once, and they are the only way back
          in if you lose your phone.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-1.5 rounded-field bg-white p-4 font-mono text-[13px]">
          {recoveryCodes.map((recovery) => (
            <li key={recovery}>{recovery}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (enabled) {
    return (
      <div>
        <Badge tone="live">On</Badge>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-secondary">
          After opening a sign-in link you&rsquo;ll be asked for a code from your authenticator app.
          You have {remainingRecoveryCodes} recovery code
          {remainingRecoveryCodes === 1 ? "" : "s"} left.
        </p>

        <div className="mt-4 flex max-w-[320px] flex-col gap-3">
          <Field label="Current code or recovery code" htmlFor="disable-code" error={error ?? undefined}>
            <Input
              id="disable-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
            />
          </Field>
          <Button
            variant="danger"
            disabled={pending || code.length < 6}
            onClick={() =>
              start(async () => {
                const result = await disableTwoFactor(code);
                if (!result.ok) setError(result.error ?? "That didn't work");
                else window.location.reload();
              })
            }
          >
            Turn off two-factor authentication
          </Button>
        </div>
      </div>
    );
  }

  if (enrolment) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[13.5px] leading-relaxed text-ink-secondary">
          Add this account to your authenticator app, then enter the code it shows.
        </p>

        <div className="rounded-field bg-white p-4">
          <p className="text-[11.5px] font-bold text-ink-muted">Setup key for {email}</p>
          <p className="mt-1 font-mono text-[15px] font-bold tracking-wider break-all">
            {enrolment.secret}
          </p>
          <a
            href={enrolment.uri}
            className="mt-2 inline-block text-[12.5px] font-bold text-violet hover:text-violet-hover"
          >
            Open in your authenticator app
          </a>
        </div>

        <Field label="Code from the app" htmlFor="totp" error={error ?? undefined}>
          <Input
            id="totp"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="max-w-[160px] font-mono tracking-[0.3em]"
          />
        </Field>

        <Button
          className="self-start"
          disabled={pending || code.length !== 6}
          onClick={() =>
            start(async () => {
              const result = await confirmTwoFactor(code);
              if (result.ok) setRecoveryCodes(result.recoveryCodes);
              else setError(result.error);
            })
          }
        >
          {pending ? "Checking…" : "Turn it on"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[13.5px] leading-relaxed text-ink-secondary">
        Magic links already mean nobody can sign in without your inbox. Two-factor adds a second
        step on top, which is worth it if your account can run draws at large events.
      </p>
      <Button
        className="mt-4"
        disabled={pending}
        onClick={() => start(async () => setEnrolment(await beginTwoFactorEnrolment()))}
      >
        {pending ? "Preparing…" : "Set up two-factor authentication"}
      </Button>
    </div>
  );
}

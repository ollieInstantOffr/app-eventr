"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { PanelSection } from "@/components/ui/glass-panel";
import { Toggle } from "@/components/ui/toggle";
import { setRemindersEnabled, signOutOtherSessions } from "../actions";

/** Screen 3d's Security card. */
export function SecurityPanel({
  email,
  twoFactorEnabled,
  remindersEnabled,
  currentSessionId,
  sessions,
}: {
  email: string;
  twoFactorEnabled: boolean;
  remindersEnabled: boolean;
  currentSessionId: string;
  sessions: Array<{ id: string; label: string; lastActive: string }>;
}) {
  const [reminders, setReminders] = useState(remindersEnabled);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const others = sessions.filter((item) => item.id !== currentSessionId);

  return (
    <div className="flex flex-col gap-5">
      <PanelSection title="Security">
        <ul className="divide-y divide-black/6">
          <li className="flex items-start justify-between gap-3 py-3">
            <span>
              <span className="block text-[13.5px] font-bold">Sign-in method</span>
              <span className="block text-[12px] text-ink-muted">Magic link to {email}</span>
            </span>
            <Badge tone="violet">Passwordless</Badge>
          </li>

          <li className="flex items-start justify-between gap-3 py-3">
            <span>
              <span className="block text-[13.5px] font-bold">Two-factor authentication</span>
              <span className="block text-[12px] text-ink-muted">
                {twoFactorEnabled
                  ? "Authenticator app — required after every magic link"
                  : "Add an authenticator app for a second step at sign-in"}
              </span>
            </span>
            <ButtonLink
              href={twoFactorEnabled ? "/settings/security/two-factor" : "/settings/security/two-factor"}
              variant="secondary"
              size="sm"
            >
              {twoFactorEnabled ? "Manage" : "Set up"}
            </ButtonLink>
          </li>

          <li className="py-3">
            <div className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[13.5px] font-bold">Active sessions</span>
                <span className="block text-[12px] text-ink-muted">
                  {sessions[0]?.label ?? "This device"} · this device
                  {others.length > 0 ? `, +${others.length}` : ""}
                </span>
              </span>
              <Button variant="secondary" size="sm" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "Hide" : "Manage"}
              </Button>
            </div>

            {expanded ? (
              <div className="mt-3 rounded-field bg-white p-3">
                <ul className="flex flex-col gap-2">
                  {sessions.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-[12.5px]">
                      <span className="font-bold">
                        {item.label}
                        {item.id === currentSessionId ? (
                          <span className="ml-1.5 font-normal text-ink-muted">this device</span>
                        ) : null}
                      </span>
                      <span className="text-ink-muted">{item.lastActive}</span>
                    </li>
                  ))}
                </ul>

                {others.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-danger"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const { revoked } = await signOutOtherSessions();
                        setMessage(
                          `Signed out ${revoked} other device${revoked === 1 ? "" : "s"}`,
                        );
                      })
                    }
                  >
                    Sign out all other devices
                  </Button>
                ) : null}

                {message ? (
                  <p className="mt-1.5 text-[12px] font-bold text-teal-darker">{message}</p>
                ) : null}
              </div>
            ) : null}
          </li>
        </ul>
      </PanelSection>

      <PanelSection title="Notifications">
        <Toggle
          checked={reminders}
          onChange={(value) => {
            setReminders(value);
            start(() => setRemindersEnabled(value));
          }}
          label="Entries-closing reminders"
          description="An email an hour before entries close, with the numbers so far."
        />
      </PanelSection>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Role } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { inviteTeamMembers } from "../actions";

const ROLES: Array<{ value: Role; label: string; hint: string }> = [
  { value: Role.EDITOR, label: "Editor", hint: "Create and run events, see all entries" },
  { value: Role.VIEWER, label: "Viewer", hint: "See events and entry counts, no personal data" },
  {
    value: Role.KIOSK,
    label: "Kiosk",
    hint: "Only the QR screen and the live draw — for a booth iPad or laptop",
  },
];

/** Screen 7g's invite modal. */
export function InviteModal({
  organisationName,
  events,
  onClose,
}: {
  organisationName: string;
  events: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<Role>(Role.EDITOR);
  const [scoped, setScoped] = useState(false);
  const [scopedEventId, setScopedEventId] = useState(events[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function commitDraft() {
    const value = draft.trim().replace(/,$/, "");
    if (!value) return;
    if (!emails.includes(value)) setEmails([...emails, value]);
    setDraft("");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-6 backdrop-blur-sm"
    >
      <div className="glass w-full max-w-[460px] p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="invite-title" className="text-[20px] font-extrabold">
              Invite to {organisationName}
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
              They get a magic link by email &mdash; no password to set.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[18px] leading-none text-ink-faint hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="mt-5">
          <span className="text-[12px] font-bold text-ink-muted">Email addresses</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-field border border-black/8 bg-white p-2">
            {emails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1.5 rounded-[9px] bg-violet-tint px-2 py-1 text-[12px] font-bold text-violet-deep"
              >
                {email}
                <button
                  type="button"
                  aria-label={`Remove ${email}`}
                  onClick={() => setEmails(emails.filter((item) => item !== email))}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "," || event.key === " ") {
                  event.preventDefault();
                  commitDraft();
                }
              }}
              onBlur={commitDraft}
              type="email"
              placeholder={emails.length === 0 ? "erik@northwindevents.se" : "anna@…"}
              aria-label="Email address"
              className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-[13px] outline-none placeholder:text-ink-faint"
            />
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-[12px] font-bold text-ink-muted">Role</legend>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {ROLES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={cn(
                  "rounded-field p-3 text-left transition-colors",
                  role === option.value ? "bg-violet text-white" : "bg-white hover:bg-paper",
                )}
              >
                <span className="block text-[13px] font-bold">{option.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11.5px] leading-snug",
                    role === option.value ? "text-white/75" : "text-ink-muted",
                  )}
                >
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {events.length > 0 ? (
          <label className="mt-4 flex items-start gap-2.5 text-[12.5px] text-ink-secondary">
            <input
              type="checkbox"
              checked={scoped}
              onChange={(event) => setScoped(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-violet"
            />
            <span className="flex-1">
              <span className="block font-bold">Limit to one event</span>
              {scoped ? (
                <Select
                  value={scopedEventId}
                  onChange={(event) => setScopedEventId(event.target.value)}
                  className="mt-1.5 h-9 text-[12.5px]"
                  aria-label="Event"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name || "Untitled event"}
                    </option>
                  ))}
                </Select>
              ) : null}
            </span>
          </label>
        ) : null}

        {error ? <p className="mt-3 text-[12.5px] font-semibold text-danger">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              commitDraft();
              const list = draft.trim() && !emails.includes(draft.trim()) ? [...emails, draft.trim()] : emails;
              if (list.length === 0) {
                setError("Add at least one email address");
                return;
              }
              start(async () => {
                const result = await inviteTeamMembers({
                  emails: list,
                  role,
                  scopedEventId: scoped ? scopedEventId : null,
                });
                if (result.error) setError(result.error);
                else onClose();
              });
            }}
          >
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </div>
    </div>
  );
}

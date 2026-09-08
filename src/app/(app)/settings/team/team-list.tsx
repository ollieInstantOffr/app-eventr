"use client";

import { useState, useTransition } from "react";
import { Role } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelSection } from "@/components/ui/glass-panel";
import { removeTeamMember, revokeInvite } from "../actions";
import { InviteModal } from "./invite-modal";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  scopedEventName: string | null;
};

type Invite = {
  id: string;
  email: string;
  role: Role;
  scopedEventName: string | null;
  expiresIn: string;
};

export function TeamList({
  canManage,
  currentUserId,
  organisationName,
  events,
  members,
  invites,
}: {
  canManage: boolean;
  currentUserId: string;
  organisationName: string;
  events: Array<{ id: string; name: string }>;
  members: Member[];
  invites: Invite[];
}) {
  const [inviting, setInviting] = useState(false);
  const [, start] = useTransition();

  return (
    <>
      <PanelSection
        title="Team"
        action={
          canManage ? (
            <Button size="sm" onClick={() => setInviting(true)}>
              + Invite
            </Button>
          ) : null
        }
      >
        <ul className="divide-y divide-black/6">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-violet-tint text-[12px] font-extrabold text-violet-deep"
              >
                {member.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold">{member.name}</span>
                <span className="block truncate text-[12px] text-ink-muted">
                  {member.email}
                  {member.scopedEventName ? ` · ${member.scopedEventName} only` : ""}
                </span>
              </span>

              <Badge tone={member.role === Role.OWNER ? "violet" : "neutral"}>
                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
              </Badge>

              {canManage && member.userId !== currentUserId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => start(() => removeTeamMember(member.id))}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>

        {invites.length > 0 ? (
          <>
            <h3 className="mt-5 mb-2 text-[12px] font-bold text-ink-muted">Pending invitations</h3>
            <ul className="divide-y divide-black/6">
              {invites.map((invite) => (
                <li key={invite.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{invite.email}</span>
                    <span className="block text-[11.5px] text-ink-muted">
                      Expires {invite.expiresIn}
                      {invite.scopedEventName ? ` · ${invite.scopedEventName} only` : ""}
                    </span>
                  </span>
                  <Badge>{invite.role.charAt(0) + invite.role.slice(1).toLowerCase()}</Badge>
                  {canManage ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => start(() => revokeInvite(invite.id))}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </PanelSection>

      {inviting ? (
        <InviteModal
          organisationName={organisationName}
          events={events}
          onClose={() => setInviting(false)}
        />
      ) : null}
    </>
  );
}

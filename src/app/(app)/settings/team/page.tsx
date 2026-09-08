import { Badge } from "@/components/ui/badge";
import { PanelSection } from "@/components/ui/glass-panel";
import { formatRelative } from "@/lib/format";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { can } from "@/server/auth/rbac";
import { TeamList } from "./team-list";

export const metadata = { title: "Team" };

const ROLE_HINT = {
  OWNER: "Everything, including billing and deleting the organisation",
  EDITOR: "Create and run events, see all entries",
  VIEWER: "See events and entry counts, no personal data",
  KIOSK: "Only the QR screen and the live draw",
} as const;

/** Screen 3d's Team card, with the invite modal from screen 7g. */
export default async function TeamSettingsPage() {
  const session = await requireSession("/settings/team");
  const organisationId = session.membership.organisationId;

  const [memberships, invites, events] = await Promise.all([
    prisma.membership.findMany({
      where: { organisationId },
      include: { user: true, scopedEvent: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { organisationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: { organisationId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const manageable = can(session.role, "team:manage");

  // Invite rows carry an event id but no relation, so names are resolved here.
  const eventNames = new Map(events.map((event) => [event.id, event.name]));

  return (
    <div className="flex flex-col gap-5">
      <TeamList
        canManage={manageable}
        currentUserId={session.user.id}
        organisationName={session.membership.organisation.name}
        events={events}
        members={memberships.map((membership) => ({
          id: membership.id,
          userId: membership.userId,
          name:
            [membership.user.firstName, membership.user.lastName].filter(Boolean).join(" ") ||
            membership.user.email,
          email: membership.user.email,
          role: membership.role,
          scopedEventName: membership.scopedEvent?.name ?? null,
        }))}
        invites={invites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          scopedEventName: invite.scopedEventId
            ? (eventNames.get(invite.scopedEventId) ?? null)
            : null,
          expiresIn: formatRelative(invite.expiresAt),
        }))}
      />

      <PanelSection title="What each role can do">
        <ul className="divide-y divide-black/6">
          {(Object.keys(ROLE_HINT) as Array<keyof typeof ROLE_HINT>).map((role) => (
            <li key={role} className="flex items-center gap-3 py-2.5">
              <Badge tone={role === "OWNER" ? "violet" : "neutral"} className="w-[68px] justify-center">
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </Badge>
              <span className="text-[12.5px] text-ink-secondary">{ROLE_HINT[role]}</span>
            </li>
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}

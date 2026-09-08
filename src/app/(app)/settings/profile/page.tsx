import { PanelSection } from "@/components/ui/glass-panel";
import { formatRelative } from "@/lib/format";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { ProfileForm } from "./profile-form";
import { SecurityPanel } from "./security-panel";

export const metadata = { title: "Profile" };

/** Screen 3d, Profile tab. */
export default async function ProfileSettingsPage() {
  const session = await requireSession("/settings/profile");

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
    select: { id: true, label: true, lastActiveAt: true },
  });

  const fullName =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.email;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <PanelSection title="You">
        <div className="mb-5 flex items-center gap-3.5">
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-chip bg-violet-tint text-[15px] font-extrabold text-violet-deep"
          >
            {fullName
              .split(/\s+/)
              .map((part) => part[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <span>
            <span className="block text-[16px] font-extrabold">{fullName}</span>
            <span className="block text-[12px] text-ink-muted">
              {session.role.charAt(0) + session.role.slice(1).toLowerCase()} ·{" "}
              {session.membership.organisation.name} · joined{" "}
              {session.membership.createdAt.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </span>
        </div>

        <ProfileForm
          firstName={session.user.firstName ?? ""}
          lastName={session.user.lastName ?? ""}
          email={session.user.email}
          locale={session.user.locale}
          timeZone={session.user.timeZone}
        />
      </PanelSection>

      <SecurityPanel
        email={session.user.email}
        twoFactorEnabled={session.user.totpEnabledAt !== null}
        remindersEnabled={session.user.remindersEnabled}
        currentSessionId={session.sessionId}
        sessions={sessions.map((row) => ({
          id: row.id,
          label: row.label ?? "Browser",
          lastActive: formatRelative(row.lastActiveAt),
        }))}
      />
    </div>
  );
}

import Link from "next/link";
import { PanelSection } from "@/components/ui/glass-panel";
import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { TwoFactorSetup } from "./two-factor-setup";

export const metadata = { title: "Two-factor authentication" };

/** The Security card's "Set up" destination (screen 3d). */
export default async function TwoFactorPage() {
  const session = await requireSession("/settings/security/two-factor");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { totpEnabledAt: true, totpRecoveryCodes: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <p className="px-1 text-[12.5px] font-bold text-ink-muted">
        <Link href="/settings/profile" className="hover:text-violet">
          Settings
        </Link>{" "}
        / Two-factor authentication
      </p>

      <PanelSection
        title="Two-factor authentication"
        hint="A second step after your magic link, from an authenticator app"
      >
        <TwoFactorSetup
          enabled={user.totpEnabledAt !== null}
          remainingRecoveryCodes={user.totpRecoveryCodes.length}
          email={session.user.email}
        />
      </PanelSection>
    </div>
  );
}

import { PanelSection } from "@/components/ui/glass-panel";
import { requireSession } from "@/server/auth/session";
import { storage } from "@/server/storage";
import { OrganisationForm } from "./organisation-form";

export const metadata = { title: "Organisation" };

/** Screen 3d, Organisation tab — the default branding new events inherit. */
export default async function OrganisationSettingsPage() {
  const session = await requireSession("/settings/organisation");
  const organisation = session.membership.organisation;

  return (
    <PanelSection title="Organisation" hint="Default branding for new events">
      <OrganisationForm
        name={organisation.name}
        accentColour={organisation.accentColour}
        replyToEmail={organisation.replyToEmail ?? ""}
        logoUrl={organisation.logoKey ? storage.url(organisation.logoKey) : null}
        canEdit={session.role === "OWNER"}
      />
    </PanelSection>
  );
}

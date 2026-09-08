"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { getSession, switchOrganisation } from "@/server/auth/session";
import { storeUpload, UploadError } from "@/server/storage";
import { DEFAULT_CONSENT_TEMPLATE, DEFAULT_CONSENT_VERSION } from "@/server/consent";
import { CURRENT_DPA_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";

const schema = z.object({
  name: z.string().trim().min(1, "Give your workspace a name").max(120),
});

export type WorkspaceFormState = { error?: string };

/**
 * Screen 3c. Creates the organisation, makes the signed-in user its owner,
 * records which Terms and DPA version they accepted at sign-up, and seeds the
 * first version of the guest consent text.
 */
export async function createWorkspace(
  _state: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Give your workspace a name" };
  }

  let logoKey: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoKey = (await storeUpload(logo)).key;
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message };
      throw error;
    }
  }

  const organisation = await prisma.$transaction(async (tx) => {
    const created = await tx.organisation.create({
      data: {
        name: parsed.data.name,
        logoKey,
        replyToEmail: session.user.email,
        dpaVersion: CURRENT_DPA_VERSION,
        dpaAcceptedAt: new Date(),
        dpaAcceptedById: session.user.id,
        termsVersion: CURRENT_TERMS_VERSION,
        termsAcceptedAt: new Date(),
      },
    });

    await tx.membership.create({
      data: { userId: session.user.id, organisationId: created.id, role: Role.OWNER },
    });

    await tx.consentTextVersion.create({
      data: {
        organisationId: created.id,
        version: DEFAULT_CONSENT_VERSION,
        template: DEFAULT_CONSENT_TEMPLATE,
      },
    });

    return created;
  });

  await switchOrganisation(session.sessionId, organisation.id);
  redirect("/events?welcome=1");
}

/** "Skip for now" — the logo can be added later under Organisation. */
export async function skipWorkspaceLogo(formData: FormData): Promise<void> {
  await createWorkspace({}, formData);
}

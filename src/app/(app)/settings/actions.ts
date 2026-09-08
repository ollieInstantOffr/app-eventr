"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RetentionPeriod, Role } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession, revokeOtherSessions } from "@/server/auth/session";
import { assertCan } from "@/server/auth/rbac";
import { storeUpload, UploadError } from "@/server/storage";
import { DEFAULT_CONSENT_TEMPLATE } from "@/server/consent";
import { sendEmail } from "@/server/email/send";
import { inviteEmail } from "@/server/email/templates/invite";
import { INVITE_TTL_MS, expiresIn, generateToken, hashToken } from "@/server/auth/tokens";
import { env } from "@/lib/env";

export type SettingsState = { error?: string; ok?: string };

// --------------------------------------------------------------- profile (3d)

const profileSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  locale: z.string().trim().max(16),
  timeZone: z.string().trim().max(64),
});

export async function saveProfile(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    locale: formData.get("locale"),
    timeZone: formData.get("timeZone"),
  });
  if (!parsed.success) return { error: "Check the form and try again" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: parsed.data.firstName || null,
      lastName: parsed.data.lastName || null,
      locale: parsed.data.locale,
      timeZone: parsed.data.timeZone,
    },
  });

  revalidatePath("/settings/profile");
  return { ok: "Saved" };
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  const session = await requireSession();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { remindersEnabled: enabled },
  });
  revalidatePath("/settings/profile");
}

/** "Manage" beside Active sessions — signs every other device out. */
export async function signOutOtherSessions(): Promise<{ revoked: number }> {
  const session = await requireSession();
  const revoked = await revokeOtherSessions(session.user.id, session.sessionId);
  revalidatePath("/settings/profile");
  return { revoked };
}

// ---------------------------------------------------------- organisation (3d)

const organisationSchema = z.object({
  name: z.string().trim().min(1, "Your organisation needs a name").max(120),
  accentColour: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  replyToEmail: z.string().trim().email("That email address doesn't look right").or(z.literal("")),
});

export async function saveOrganisation(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();
  assertCan(session, "org:manage");

  const parsed = organisationSchema.safeParse({
    name: formData.get("name"),
    accentColour: formData.get("accentColour"),
    replyToEmail: formData.get("replyToEmail") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  let logoKey: string | null | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoKey = (await storeUpload(logo)).key;
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message };
      throw error;
    }
  }
  if (formData.get("removeLogo") === "on") logoKey = null;

  await prisma.organisation.update({
    where: { id: session.membership.organisationId },
    data: {
      name: parsed.data.name,
      accentColour: parsed.data.accentColour.toUpperCase(),
      replyToEmail: parsed.data.replyToEmail || null,
      ...(logoKey !== undefined ? { logoKey } : {}),
    },
  });

  revalidatePath("/settings/organisation");
  revalidatePath("/events");
  return { ok: "Saved" };
}

// ------------------------------------------------------------- privacy (4d)

const privacySchema = z.object({
  retentionPeriod: z.nativeEnum(RetentionPeriod),
  minimiseByDefault: z.boolean(),
  maskNamesOnScreen: z.boolean(),
  marketingOptInEnabled: z.boolean(),
  autoFulfilErasure: z.boolean(),
});

export type PrivacySettings = z.infer<typeof privacySchema>;

export async function savePrivacySettings(settings: PrivacySettings): Promise<void> {
  const session = await requireSession();
  assertCan(session, "privacy:manage");

  await prisma.organisation.update({
    where: { id: session.membership.organisationId },
    data: privacySchema.parse(settings),
  });

  revalidatePath("/settings/privacy");
}

/**
 * Editing the consent text creates a new version rather than mutating the old
 * one: entries reference the version they agreed to, and that record has to
 * stay truthful.
 */
export async function saveConsentText(template: string): Promise<SettingsState> {
  const session = await requireSession();
  assertCan(session, "privacy:manage");

  const text = template.trim();
  if (!text) return { error: "The consent text can't be empty" };
  if (!text.includes("{{organisation}}")) {
    return { error: "Keep {{organisation}} in the text so guests know who holds their data" };
  }

  const latest = await prisma.consentTextVersion.findFirst({
    where: { organisationId: session.membership.organisationId },
    orderBy: { createdAt: "desc" },
  });

  if (latest?.template === text) return { ok: "No changes" };

  const nextVersion = latest ? bumpVersion(latest.version) : "1.0";

  await prisma.consentTextVersion.create({
    data: {
      organisationId: session.membership.organisationId,
      version: nextVersion,
      template: text || DEFAULT_CONSENT_TEMPLATE,
    },
  });

  revalidatePath("/settings/privacy");
  return { ok: `Saved as version ${nextVersion}` };
}

function bumpVersion(version: string): string {
  const [major, minor] = version.split(".");
  return `${major ?? "1"}.${Number(minor ?? "0") + 1}`;
}

// ------------------------------------------------------------------ team (7g)

const inviteSchema = z.object({
  emails: z.array(z.string().trim().toLowerCase().email()).min(1, "Add at least one email address"),
  role: z.nativeEnum(Role),
  scopedEventId: z.string().nullable(),
});

export async function inviteTeamMembers(input: {
  emails: string[];
  role: Role;
  scopedEventId: string | null;
}): Promise<SettingsState> {
  const session = await requireSession();
  assertCan(session, "team:manage");

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the addresses and try again" };
  }

  const inviterName =
    [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.email;

  for (const email of parsed.data.emails) {
    const token = generateToken();

    await prisma.invite.create({
      data: {
        tokenHash: hashToken(token),
        organisationId: session.membership.organisationId,
        email,
        role: parsed.data.role,
        scopedEventId: parsed.data.scopedEventId,
        invitedById: session.user.id,
        expiresAt: expiresIn(INVITE_TTL_MS),
      },
    });

    const message = inviteEmail({
      inviterName,
      inviterEmail: session.user.email,
      organisationName: session.membership.organisation.name,
      role: parsed.data.role,
      url: `${env.APP_URL}/invite/${token}`,
    });

    await sendEmail({
      to: email,
      template: "invite",
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }

  revalidatePath("/settings/team");
  return { ok: `Invited ${parsed.data.emails.length} ${parsed.data.emails.length === 1 ? "person" : "people"}` };
}

export async function removeTeamMember(membershipId: string): Promise<void> {
  const session = await requireSession();
  assertCan(session, "team:manage");

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organisationId: session.membership.organisationId },
  });
  if (!membership) return;

  // An organisation must keep at least one owner, or nobody can administer it.
  if (membership.role === Role.OWNER) {
    const owners = await prisma.membership.count({
      where: { organisationId: session.membership.organisationId, role: Role.OWNER },
    });
    if (owners <= 1) return;
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidatePath("/settings/team");
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const session = await requireSession();
  assertCan(session, "team:manage");

  await prisma.invite.updateMany({
    where: { id: inviteId, organisationId: session.membership.organisationId, acceptedAt: null },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/settings/team");
}

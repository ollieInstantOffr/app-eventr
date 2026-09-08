"use server";

import { revalidatePath } from "next/cache";
import { GuestRequestStatus, Prisma } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan } from "@/server/auth/rbac";

export type RequestActionResult = { ok: boolean; message: string };

async function loadRequest(requestId: string, organisationId: string) {
  return prisma.guestRequest.findFirst({
    where: {
      id: requestId,
      status: GuestRequestStatus.OPEN,
      event: { organisationId, deletedAt: null },
    },
    include: { entry: { include: { winner: true } } },
  });
}

/** "Erase now" from screen 4d's guest request queue. */
export async function fulfilErasure(requestId: string): Promise<RequestActionResult> {
  const session = await requireSession();
  assertCan(session, "privacy:manage");

  const request = await loadRequest(requestId, session.membership.organisationId);
  if (!request) return { ok: false, message: "That request is no longer open" };

  // Erasing a winner with an undelivered prize destroys the only way to reach
  // them, so it needs a deliberate choice — mark the prize delivered first.
  if (request.entry?.winner && !request.entry.winner.deliveredAt) {
    return {
      ok: false,
      message: "This guest won a prize that isn't marked delivered. Deliver it first, or re-draw.",
    };
  }

  await prisma.$transaction([
    ...(request.entry
      ? [
          prisma.entry.update({
            where: { id: request.entry.id },
            data: {
              data: {} as Prisma.InputJsonValue,
              name: null,
              email: null,
              phone: null,
              erasedAt: new Date(),
            },
          }),
        ]
      : []),
    prisma.guestRequest.update({
      where: { id: request.id },
      data: { status: GuestRequestStatus.FULFILLED, fulfilledAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        organisationId: session.membership.organisationId,
        userId: session.user.id,
        action: "guest_request.erased",
        targetType: "entry",
        targetId: request.entryId,
        detail: {} as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath("/settings/privacy");
  return { ok: true, message: "Erased" };
}

/**
 * "Send export". The entry's own data is emailed to the address it was
 * entered with — nowhere else, so a request can't be used to redirect
 * someone's data somewhere new.
 */
export async function fulfilExport(requestId: string): Promise<RequestActionResult> {
  const session = await requireSession();
  assertCan(session, "privacy:manage");

  const request = await loadRequest(requestId, session.membership.organisationId);
  if (!request?.entry) return { ok: false, message: "That request is no longer open" };
  if (!request.entry.email) {
    return { ok: false, message: "That entry has no email address to send an export to" };
  }

  const { sendEmail } = await import("@/server/email/send");
  const payload = JSON.stringify(
    {
      entryNumber: request.entry.number,
      submittedAt: request.entry.createdAt,
      consent: {
        text: request.entry.consentText,
        version: request.entry.consentVersion,
        agreedAt: request.entry.consentedAt,
      },
      marketingOptIn: request.entry.marketingOptIn,
      answers: request.entry.data,
    },
    null,
    2,
  );

  await sendEmail({
    to: request.entry.email,
    template: "guest-export",
    subject: "Your raffle entry data",
    html: `<p>Here is everything held about your raffle entry.</p><pre style="font:12px/1.5 monospace;white-space:pre-wrap;">${payload
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre>`,
    text: `Here is everything held about your raffle entry.\n\n${payload}`,
    dedupeKey: `guest-export:${request.id}`,
  });

  await prisma.guestRequest.update({
    where: { id: request.id },
    data: { status: GuestRequestStatus.FULFILLED, fulfilledAt: new Date() },
  });

  revalidatePath("/settings/privacy");
  return { ok: true, message: "Export sent to the guest" };
}

export async function setAutoFulfilErasure(enabled: boolean): Promise<void> {
  const session = await requireSession();
  assertCan(session, "privacy:manage");

  await prisma.organisation.update({
    where: { id: session.membership.organisationId },
    data: { autoFulfilErasure: enabled },
  });

  revalidatePath("/settings/privacy");
}

"use server";

import { GuestRequestType } from "@/generated/prisma";
import { prisma } from "@/server/db";

/**
 * A guest asking for their data back, or asking for it to be deleted. The
 * request is queued for the organiser in Settings → Privacy & data; it is not
 * fulfilled here, because they are the controller and it is their call
 * (unless they have turned auto-fulfil on, which the scheduler handles).
 */
export async function requestGuestData(
  slug: string,
  token: string,
  type: "EXPORT" | "ERASE",
): Promise<{ message: string }> {
  const entry = await prisma.entry.findFirst({
    where: { accessToken: token, erasedAt: null, event: { slug, deletedAt: null } },
    select: { id: true, eventId: true },
  });

  if (!entry) {
    return { message: "We couldn't find that entry — it may already have been deleted." };
  }

  const existing = await prisma.guestRequest.findFirst({
    where: { entryId: entry.id, type: GuestRequestType[type], status: "OPEN" },
  });

  if (!existing) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 30);

    await prisma.guestRequest.create({
      data: { eventId: entry.eventId, entryId: entry.id, type: GuestRequestType[type], dueAt },
    });
  }

  return {
    message:
      type === "ERASE"
        ? "Your deletion request has been sent to the organiser. They have 30 days to act on it."
        : "Your export request has been sent to the organiser. They have 30 days to act on it.",
  };
}

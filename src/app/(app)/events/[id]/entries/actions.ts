"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { requireSession } from "@/server/auth/session";
import { assertCan, assertEventInScope } from "@/server/auth/rbac";

/** Overrides the automatic duplicate flag, either way. */
export async function setDuplicateFlag(entryId: string, isDuplicate: boolean): Promise<void> {
  const session = await requireSession();
  assertCan(session, "entry:read-personal");

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, event: { organisationId: session.membership.organisationId } },
    select: { id: true, eventId: true },
  });
  if (!entry) return;

  assertEventInScope(session, entry.eventId);

  await prisma.entry.update({
    where: { id: entry.id },
    data: { isDuplicate, duplicateManual: true },
  });

  revalidatePath(`/events/${entry.eventId}/entries`);
}

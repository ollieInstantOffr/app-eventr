import "server-only";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { sendEmail } from "@/server/email/send";
import { winnerEmail, winnerSms } from "@/server/email/templates/winner";
import { sendSms, smsEnabled } from "@/server/sms/send";
import { storage } from "@/server/storage";
import { formatTime } from "@/lib/format";

export type NotifyResult = { email: boolean; sms: boolean; skipped?: string };

/**
 * Notifies one winner. Idempotent through the email log's dedupe key, so
 * "Notify all winners" pressed twice does not send twice.
 */
export async function notifyWinner(winnerId: string): Promise<NotifyResult> {
  const winner = await prisma.winner.findUnique({
    where: { id: winnerId },
    include: {
      entry: true,
      prize: true,
      event: { include: { organisation: true } },
    },
  });

  if (!winner || winner.supersededAt) return { email: false, sms: false, skipped: "superseded" };
  if (!winner.entry.email && !winner.entry.phone) {
    return { email: false, sms: false, skipped: "no contact details" };
  }

  const { event, entry, prize } = winner;
  const organisation = event.organisation;
  const logoKey = event.logoKey ?? organisation.logoKey;

  const message = winnerEmail({
    firstName: entry.name?.split(/\s+/)[0] ?? null,
    prizeName: prize.name,
    organisationName: organisation.name,
    organisationEmail: organisation.replyToEmail,
    // storage.url() already returns a full S3 URL — no app-origin prefix.
    logoUrl: logoKey ? storage.url(logoKey) : null,
    entryNumber: entry.number,
    drawnAt: formatTime(winner.drawnAt),
    venueLabel: event.venueLabel,
    claimCode: winner.claimCode,
    claimDeadline: winner.claimDeadline ? formatTime(winner.claimDeadline) : null,
    winnerPageUrl: `${env.APP_URL}/winner/${winner.accessToken}`,
    deleteDataUrl: `${env.APP_URL}/${event.slug}/entry?t=${entry.accessToken}`,
  });

  let emailSent = false;
  if (entry.email) {
    await sendEmail({
      to: entry.email,
      template: "winner",
      subject: message.subject,
      html: message.html,
      text: message.text,
      // Sent as Eventr but replying reaches the organiser: they own the prize.
      replyTo: organisation.replyToEmail ?? undefined,
      dedupeKey: `winner:${winner.id}`,
    });
    emailSent = true;
  }

  let smsSent = false;
  if (entry.phone && smsEnabled && !winner.notifiedSmsAt) {
    const body = winnerSms({
      firstName: entry.name?.split(/\s+/)[0] ?? null,
      prizeName: prize.name,
      organisationName: organisation.name,
      venueLabel: event.venueLabel,
      claimCode: winner.claimCode,
      winnerPageUrl: `${env.APP_URL}/winner/${winner.accessToken}`,
    });
    const result = await sendSms(entry.phone, body);
    smsSent = result.delivered;
  }

  await prisma.winner.update({
    where: { id: winner.id },
    data: {
      ...(emailSent && !winner.notifiedEmailAt ? { notifiedEmailAt: new Date() } : {}),
      ...(smsSent && !winner.notifiedSmsAt ? { notifiedSmsAt: new Date() } : {}),
    },
  });

  return { email: emailSent, sms: smsSent };
}

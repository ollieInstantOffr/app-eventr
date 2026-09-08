import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { emailDeliveryEnabled, env } from "@/lib/env";
import { prisma } from "@/server/db";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Winner mail goes out on the organiser's behalf, so they own the reply. */
  replyTo?: string;
  from?: string;
  template: string;
  /** Makes a send idempotent — "Notify all winners" pressed twice sends once. */
  dedupeKey?: string;
};

export type SendResult = { delivered: boolean; providerId?: string; previewPath?: string };

const resend = emailDeliveryEnabled ? new Resend(env.RESEND_API_KEY) : null;

/**
 * With no RESEND_API_KEY the rendered message is written to disk and logged,
 * so the whole app is usable in local Docker before credentials exist.
 */
async function writePreview(email: OutgoingEmail): Promise<string> {
  const dir = path.resolve(env.UPLOADS_DIR, "email-previews");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${stamp}-${email.template}.html`);
  await writeFile(file, email.html, "utf8");
  console.info(`[email] preview written (no RESEND_API_KEY set): ${file}`);
  return file;
}

const MAX_ATTEMPTS = 3;

export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  if (email.dedupeKey) {
    const existing = await prisma.emailLog.findUnique({ where: { dedupeKey: email.dedupeKey } });
    if (existing && existing.status === "sent") {
      return { delivered: true, providerId: existing.providerId ?? undefined };
    }
  }

  const log = await prisma.emailLog.upsert({
    where: { dedupeKey: email.dedupeKey ?? `__none__:${crypto.randomUUID()}` },
    create: {
      template: email.template,
      toEmail: email.to,
      subject: email.subject,
      dedupeKey: email.dedupeKey ?? null,
      status: "queued",
    },
    update: { status: "queued", error: null },
  });

  if (!resend) {
    const previewPath = await writePreview(email);
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "previewed", sentAt: new Date() },
    });
    return { delivered: false, previewPath };
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data, error } = await resend.emails.send({
        from: email.from ?? env.EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: email.replyTo,
      });
      if (error) throw new Error(error.message);

      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "sent", providerId: data?.id ?? null, sentAt: new Date() },
      });
      return { delivered: true, providerId: data?.id };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 250));
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  await prisma.emailLog.update({ where: { id: log.id }, data: { status: "failed", error: message } });
  throw new Error(`Failed to send ${email.template} email: ${message}`);
}

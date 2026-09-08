import { button, emailLayout, escapeHtml, organiserMark, styles } from "./layout";

/**
 * Screen 7i, second message. Sent on the organiser's behalf, with their logo
 * and reply-to address, because they run the raffle and hold the data — the
 * footer says so plainly, and offers the guest a way to have it deleted.
 */
export function winnerEmail(options: {
  firstName: string | null;
  prizeName: string;
  organisationName: string;
  organisationEmail: string | null;
  logoUrl: string | null;
  entryNumber: number;
  drawnAt: string;
  venueLabel: string | null;
  claimCode: string;
  claimDeadline: string | null;
  winnerPageUrl: string;
  deleteDataUrl: string;
}) {
  const greeting = options.firstName ? `Congratulations, ${escapeHtml(options.firstName)}!` : "Congratulations!";
  const where = options.venueLabel
    ? `Collect your prize at <strong>${escapeHtml(options.venueLabel)}</strong>`
    : "Collect your prize from the organiser";
  const when = options.claimDeadline ? ` before <strong>${escapeHtml(options.claimDeadline)}</strong>` : "";

  const html = emailLayout({
    preheader: `${options.organisationName} raffle — you won ${options.prizeName}.`,
    header: organiserMark(options.logoUrl, options.organisationName),
    body: `
      <p style="font:700 13px/1 Manrope,Helvetica,Arial,sans-serif;color:#6f5cf0;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px;">You won</p>
      <h1 style="${styles.heading}">${escapeHtml(options.prizeName)}</h1>
      <p style="${styles.paragraph}">
        ${greeting} Entry <strong>#${options.entryNumber}</strong> was drawn at
        ${escapeHtml(options.drawnAt)} in the ${escapeHtml(options.organisationName)} raffle.
        ${where}${when}, or reply to this email to arrange delivery.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;background:#ece9fb;border-radius:14px;">
        <tr>
          <td style="padding:14px 18px;">
            <div style="font:700 11px/1.4 Manrope,Helvetica,Arial,sans-serif;color:#6e6a85;">Claim code</div>
            <div style="font:800 30px/1.1 Manrope,Helvetica,Arial,sans-serif;color:#1c1a27;letter-spacing:.06em;">${escapeHtml(options.claimCode)}</div>
            <div style="font:400 11.5px/1.4 Manrope,Helvetica,Arial,sans-serif;color:#6e6a85;">Show this to ${escapeHtml(options.organisationName)} staff</div>
          </td>
        </tr>
      </table>

      ${button(options.winnerPageUrl, "Open your winner page")}`,
    footer: `
      Sent on behalf of ${escapeHtml(options.organisationName)}, who run this raffle and hold your data.
      ${options.organisationEmail ? `Questions or prize issues: <a href="mailto:${escapeHtml(options.organisationEmail)}" style="${styles.link}">${escapeHtml(options.organisationEmail)}</a>.` : ""}
      <a href="${escapeHtml(options.deleteDataUrl)}" style="${styles.link}">Delete my data</a> · Powered by Eventr`,
  });

  const text = [
    `You won ${options.prizeName}`,
    "",
    `${greeting} Entry #${options.entryNumber} was drawn at ${options.drawnAt} in the ${options.organisationName} raffle.`,
    options.venueLabel ? `Collect your prize at ${options.venueLabel}${options.claimDeadline ? ` before ${options.claimDeadline}` : ""}.` : "",
    "",
    `Claim code: ${options.claimCode}`,
    options.winnerPageUrl,
    "",
    `Sent on behalf of ${options.organisationName}, who run this raffle and hold your data.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: `You won a ${options.prizeName} 🎉`, html, text };
}

/** The SMS version — the same message, in one message's worth of characters. */
export function winnerSms(options: {
  firstName: string | null;
  prizeName: string;
  organisationName: string;
  venueLabel: string | null;
  claimCode: string;
  winnerPageUrl: string;
}): string {
  const name = options.firstName ? `${options.firstName}, you` : "You";
  const where = options.venueLabel ? ` Collect at ${options.venueLabel}.` : "";
  return `${name} won ${options.prizeName} in the ${options.organisationName} raffle!${where} Claim code ${options.claimCode}. ${options.winnerPageUrl}`;
}

import { button, emailLayout, escapeHtml, eventrMark, styles } from "./layout";

/** Screen 7i, third message — to the organiser, not a guest. */
export function entriesClosingEmail(options: {
  firstName: string | null;
  eventName: string;
  closesAt: string;
  drawAt: string | null;
  entryCount: number;
  duplicateCount: number;
  prizeCount: number;
  liveScreenUrl: string;
  entriesUrl: string;
  settingsUrl: string;
}) {
  const stat = (value: number | string, label: string) => `
    <td style="padding:0 18px 0 0;">
      <div style="font:800 28px/1.1 Manrope,Helvetica,Arial,sans-serif;color:#1c1a27;">${value}</div>
      <div style="font:400 12px/1.4 Manrope,Helvetica,Arial,sans-serif;color:#6e6a85;">${label}</div>
    </td>`;

  const html = emailLayout({
    preheader: `${options.entryCount} entries so far${options.drawAt ? ` · draw at ${options.drawAt}` : ""} · open the live screen.`,
    header: eventrMark(),
    body: `
      <h1 style="${styles.heading}">Entries close at ${escapeHtml(options.closesAt)}</h1>
      <p style="${styles.paragraph}">
        ${options.firstName ? `Hi ${escapeHtml(options.firstName)}, your` : "Your"} raffle at
        <strong>${escapeHtml(options.eventName)}</strong> closes for entries in one hour. Here's where
        things stand:
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
        <tr>
          ${stat(options.entryCount, "entries")}
          ${stat(options.duplicateCount, "duplicates flagged")}
          ${stat(options.prizeCount, "prizes to draw")}
        </tr>
      </table>

      ${
        options.drawAt
          ? `<p style="${styles.paragraph}">The draw is scheduled for <strong>${escapeHtml(options.drawAt)}</strong>. Open the live screen on the laptop connected to the stage display a few minutes early — the waiting screen shows a countdown.</p>`
          : ""
      }

      ${button(options.liveScreenUrl, "Open live screen")}
      <p style="${styles.small}">
        <a href="${escapeHtml(options.entriesUrl)}" style="${styles.link}">See entries</a>
      </p>`,
    footer: `You get this because you own ${escapeHtml(options.eventName)} on Eventr.
      <a href="${escapeHtml(options.settingsUrl)}" style="${styles.link}">Turn off reminders</a>`,
  });

  const text = [
    `Entries close at ${options.closesAt}`,
    "",
    `Your raffle at ${options.eventName} closes for entries in one hour.`,
    `${options.entryCount} entries · ${options.duplicateCount} duplicates flagged · ${options.prizeCount} prizes to draw`,
    options.drawAt ? `The draw is scheduled for ${options.drawAt}.` : "",
    "",
    `Open the live screen: ${options.liveScreenUrl}`,
    `See entries: ${options.entriesUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: `${options.eventName}: entries close in 1 hour`, html, text };
}

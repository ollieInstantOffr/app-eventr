import type { Role } from "@/generated/prisma";
import { button, emailLayout, escapeHtml, eventrMark, styles } from "./layout";

const ROLE_COPY: Record<Role, string> = {
  OWNER: "you can do everything, including managing the team and billing",
  EDITOR: "you can create and run events and see all entries",
  VIEWER: "you can see events and entry counts, but not personal data",
  KIOSK: "this device can show the QR screen and the live draw, nothing else",
};

/** Screen 7i, fourth message. */
export function inviteEmail(options: {
  inviterName: string;
  inviterEmail: string;
  organisationName: string;
  role: Role;
  url: string;
}) {
  const roleLabel = options.role.charAt(0) + options.role.slice(1).toLowerCase();
  const initials = options.inviterName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const html = emailLayout({
    preheader: `Join as ${roleLabel} — one tap, no password.`,
    header: eventrMark(),
    body: `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          <td width="40" height="40" align="center" valign="middle"
              style="background:#ece9fb;border-radius:12px;font:800 14px/1 Manrope,Helvetica,Arial,sans-serif;color:#4f43b8;">${escapeHtml(initials)}</td>
          <td width="12"></td>
          <td style="font:700 14px/1.3 Manrope,Helvetica,Arial,sans-serif;color:#1c1a27;">
            ${escapeHtml(options.inviterName)}<br />
            <span style="font:400 12px/1.4 Manrope,Helvetica,Arial,sans-serif;color:#6e6a85;">${escapeHtml(options.inviterEmail)}</span>
          </td>
        </tr>
      </table>
      <h1 style="${styles.heading}">You're invited to ${escapeHtml(options.organisationName)}</h1>
      <p style="${styles.paragraph}">
        ${escapeHtml(options.inviterName)} added you as an <strong>${escapeHtml(roleLabel)}</strong> —
        ${ROLE_COPY[options.role]}. Eventr uses magic links, so there's no password to set: accept and you're signed in.
      </p>
      ${button(options.url, "Accept invitation")}
      <p style="${styles.small}">
        The invitation expires in 7 days. If you don't know ${escapeHtml(options.inviterName)}, ignore this email.
      </p>`,
    footer: `Eventr by instantoffr · <a href="/legal/privacy" style="${styles.link}">Privacy Policy</a>`,
  });

  const text = [
    `${options.inviterName} invited you to ${options.organisationName} on Eventr`,
    "",
    `You've been added as ${roleLabel} — ${ROLE_COPY[options.role]}.`,
    "",
    options.url,
    "",
    "The invitation expires in 7 days.",
  ].join("\n");

  return {
    subject: `${options.inviterName} invited you to ${options.organisationName} on Eventr`,
    html,
    text,
  };
}

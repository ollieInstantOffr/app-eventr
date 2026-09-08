/**
 * Shared chrome for every message. 600px, single column, tables only, inline
 * styles — the layout rules the design sets out in screen 7i, and what Outlook
 * still needs. Images can be blocked without the message losing its meaning.
 */

const INK = "#1c1a27";
const MUTED = "#6e6a85";
const VIOLET = "#6f5cf0";
const CANVAS = "#f2f0eb";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The Eventr mark, drawn in table cells so it survives blocked images. */
export function eventrMark(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="34" height="34" align="center" valign="middle"
            style="background:${VIOLET};border-radius:9px;color:#ffffff;font:800 22px/1 Manrope,Helvetica,Arial,sans-serif;">e</td>
        <td width="10"></td>
        <td style="font:800 17px/1.1 Manrope,Helvetica,Arial,sans-serif;color:${INK};letter-spacing:-0.02em;">
          Eventr<br />
          <span style="font:700 10px/1.4 Manrope,Helvetica,Arial,sans-serif;color:${MUTED};">by instantoffr</span>
        </td>
      </tr>
    </table>`;
}

/** An organiser's own logo, for mail sent on their behalf. */
export function organiserMark(logoUrl: string | null, organisationName: string): string {
  if (logoUrl) {
    return `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(organisationName)}" height="36"
            style="display:block;max-height:36px;border:0;outline:none;" />`;
  }
  return `<div style="font:800 18px/1.2 Manrope,Helvetica,Arial,sans-serif;color:${INK};">${escapeHtml(
    organisationName,
  )}</div>`;
}

export function button(href: string, label: string, colour = VIOLET): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" bgcolor="${colour}" style="border-radius:12px;">
          <a href="${escapeHtml(href)}"
             style="display:inline-block;padding:14px 26px;font:700 15px/1 Manrope,Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:12px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function emailLayout(options: {
  preheader: string;
  header: string;
  body: string;
  footer: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${escapeHtml(options.preheader)}</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <!-- Preheader: the line the inbox shows next to the subject. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CANVAS};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:600px;max-width:100%;background:#ffffff;border-radius:20px;">
          <tr><td style="padding:28px 32px 0;">${options.header}</td></tr>
          <tr><td style="padding:24px 32px 32px;">${options.body}</td></tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
          <tr>
            <td style="padding:18px 32px;font:400 12px/1.6 Manrope,Helvetica,Arial,sans-serif;color:${MUTED};">
              ${options.footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const styles = {
  heading: `font:800 24px/1.25 Manrope,Helvetica,Arial,sans-serif;color:${INK};letter-spacing:-0.03em;margin:0 0 12px;`,
  paragraph: `font:400 15px/1.6 Manrope,Helvetica,Arial,sans-serif;color:#3f3c52;margin:0 0 16px;`,
  small: `font:400 12px/1.6 Manrope,Helvetica,Arial,sans-serif;color:${MUTED};margin:16px 0 0;`,
  link: `color:${VIOLET};`,
};

import { button, emailLayout, escapeHtml, eventrMark, styles } from "./layout";

/** Screen 7i, first message. Eventr-branded — this one is from us, not the organiser. */
export function magicLinkEmail(options: { firstName?: string | null; url: string }) {
  const greeting = options.firstName ? `Hi ${escapeHtml(options.firstName)}, here's` : "Here's";

  const html = emailLayout({
    preheader: "Tap to sign in — works for 15 minutes.",
    header: eventrMark(),
    body: `
      <h1 style="${styles.heading}">Sign in to Eventr</h1>
      <p style="${styles.paragraph}">
        ${greeting} your one-time link. It signs you in on the device you open it on and expires in
        <strong>15 minutes</strong>.
      </p>
      ${button(options.url, "Sign in to Eventr")}
      <p style="${styles.small}">Or paste this into your browser:<br />
        <a href="${escapeHtml(options.url)}" style="${styles.link}">${escapeHtml(options.url)}</a>
      </p>
      <p style="${styles.small}">
        Didn't request this? Ignore it — nobody can sign in without this email.
      </p>`,
    footer: `Eventr by instantoffr · <a href="/legal/privacy" style="${styles.link}">Privacy Policy</a>`,
  });

  const text = [
    "Sign in to Eventr",
    "",
    "Here's your one-time link. It signs you in on the device you open it on and expires in 15 minutes.",
    "",
    options.url,
    "",
    "Didn't request this? Ignore it — nobody can sign in without this email.",
  ].join("\n");

  return { subject: "Your sign-in link for Eventr", html, text };
}

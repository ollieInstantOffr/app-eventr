/**
 * Event slugs end up on printed posters, so they are short, readable and
 * never regenerated after publishing.
 */
const RESERVED = new Set([
  "api", "auth", "events", "entries", "live", "kiosk", "settings", "branding",
  "login", "register", "legal", "screen", "winner", "check-inbox", "link-expired",
  "dev", "public", "favicon.svg", "robots.txt",
]);

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * "Nordic Tech Expo 2026" → "nordic26": the first words plus a two-digit
 * year, which is what the mockups show on the poster.
 */
export function suggestSlug(name: string, date?: Date | null): string {
  const words = slugify(name).split("-").filter(Boolean);
  const stem = words.slice(0, 2).join("") || "event";
  const year = date ? String(date.getFullYear()).slice(2) : "";
  const candidate = `${stem}${year}`.slice(0, 24);
  return candidate.length >= 3 ? candidate : `${candidate}raffle`;
}

export function isReserved(slug: string): boolean {
  return RESERVED.has(slug);
}

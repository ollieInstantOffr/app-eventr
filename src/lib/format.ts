/** Formatting shared by the organiser screens. Locale is fixed to en-GB so
 *  dates read the way the mockups show them ("24 Sept 2026", "16:00"). */

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const DATE_SHORT = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short" });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatDate(date: Date | null | undefined): string {
  return date ? DATE.format(date) : "No date yet";
}

export function formatToday(date: Date = new Date()): string {
  return DATE_SHORT.format(date);
}

export function formatTime(date: Date | null | undefined): string {
  return date ? TIME.format(date) : "—";
}

export function formatDateTime(date: Date | null | undefined): string {
  return date ? `${DATE.format(date)} at ${TIME.format(date)}` : "—";
}

/** "in 42 minutes", "2 days ago" — used by the guest request queue. */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const formatter = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, "second");
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

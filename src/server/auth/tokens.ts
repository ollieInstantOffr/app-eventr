import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Secrets are stored hashed, never in plain text: a leaked database must not
 * hand anyone a working sign-in link, invite or kiosk token.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Compares two hex digests without leaking their difference through timing. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** The 6-digit code an organiser reads out to pair a booth screen. */
export function generatePairingCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * The short claim code a winner shows at the stand. Digits and consonants
 * only — no 0/O or 1/I to misread across a noisy hall.
 */
const CLAIM_ALPHABET = "23456789ACDEFGHJKLMNPQRTUVWXYZ";

export function generateClaimCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CLAIM_ALPHABET[randomInt(0, CLAIM_ALPHABET.length)];
  }
  return code;
}

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const KIOSK_PAIRING_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;

export function expiresIn(ms: number): Date {
  return new Date(Date.now() + ms);
}

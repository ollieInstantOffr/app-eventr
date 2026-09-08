import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * TOTP (RFC 6238) with the defaults every authenticator app assumes: SHA-1,
 * six digits, a thirty-second step. Implemented here rather than pulled in as
 * a dependency because it is thirty lines and the alternative is trusting a
 * package with the second factor.
 */
const DIGITS = 6;
const PERIOD = 30;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");

  let secret = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    secret += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return secret;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = "";
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function totpCode(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/**
 * Accepts the current step and one either side, so a phone whose clock has
 * drifted a few seconds still works.
 */
export function verifyTotp(secret: string, code: string, at: Date = new Date()): boolean {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== DIGITS) return false;

  const counter = Math.floor(at.getTime() / 1000 / PERIOD);
  for (const drift of [-1, 0, 1]) {
    const expected = totpCode(secret, counter + drift);
    if (
      expected.length === clean.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(clean))
    ) {
      return true;
    }
  }
  return false;
}

/** The otpauth:// URI an authenticator app scans. */
export function provisioningUri(secret: string, email: string): string {
  const label = encodeURIComponent(`Eventr:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer: "Eventr",
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Single-use codes for when the phone is lost. */
export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const part = () => String(randomInt(0, 100_000)).padStart(5, "0");
    return `${part()}-${part()}`;
  });
}

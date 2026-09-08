import { createHash } from "node:crypto";

/**
 * A stable fingerprint of the entries a draw could have picked from. It lets
 * an organiser demonstrate afterwards which entries were in the pool without
 * keeping a copy of anyone's personal data: the ids alone verify the claim
 * and mean nothing on their own.
 */
export function hashPool(entries: ReadonlyArray<{ id: string }>): string {
  const hash = createHash("sha256");
  for (const entry of entries) hash.update(entry.id);
  return hash.digest("hex");
}

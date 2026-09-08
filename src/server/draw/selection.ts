import { randomInt } from "node:crypto";

/**
 * The selection itself, pulled out of the database work so it can be tested
 * directly. `crypto.randomInt` is uniform over [0, max) — it rejects samples
 * that would bias the result, which `Math.floor(Math.random() * n)` does not.
 */
export function selectUniform<T>(pool: readonly T[]): T | null {
  if (pool.length === 0) return null;
  return pool[randomInt(0, pool.length)]!;
}

/** Fisher-Yates with a CSPRNG, used for the reel's sample of names. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

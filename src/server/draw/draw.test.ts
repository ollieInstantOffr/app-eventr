import { describe, expect, it } from "vitest";
import { selectUniform, shuffle } from "./selection";
import { hashPool } from "./pool";

describe("selectUniform", () => {
  it("returns null for an empty pool", () => {
    expect(selectUniform([])).toBeNull();
  });

  it("only ever returns a member of the pool", () => {
    const pool = ["a", "b", "c", "d"];
    for (let i = 0; i < 500; i += 1) {
      expect(pool).toContain(selectUniform(pool));
    }
  });

  it("is close to uniform over many draws", () => {
    const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const counts = new Array(pool.length).fill(0);
    const draws = 60_000;

    for (let i = 0; i < draws; i += 1) {
      counts[selectUniform(pool)!] += 1;
    }

    const expected = draws / pool.length;
    for (const count of counts) {
      // Comfortably inside sampling noise, tight enough to catch real bias.
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.08);
    }
  });
});

describe("shuffle", () => {
  it("keeps every element exactly once", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = shuffle(items);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it("does not mutate its input", () => {
    const items = [1, 2, 3, 4, 5];
    shuffle(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("hashPool", () => {
  it("is stable for the same pool", () => {
    const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(hashPool(pool)).toBe(hashPool([...pool]));
  });

  it("changes when the pool changes", () => {
    expect(hashPool([{ id: "a" }, { id: "b" }])).not.toBe(hashPool([{ id: "a" }, { id: "c" }]));
  });

  it("distinguishes a different order, so the log pins the exact list", () => {
    expect(hashPool([{ id: "a" }, { id: "b" }])).not.toBe(hashPool([{ id: "b" }, { id: "a" }]));
  });
});

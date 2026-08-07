import { describe, expect, it } from "vitest";
import { createBag } from "./random";
import { PIECE_TYPES } from "./types";

describe("7-bag randomizer", () => {
  it("returns every piece exactly once per bag", () => {
    const result = createBag(12345);
    expect([...result.bag].sort()).toEqual([...PIECE_TYPES].sort());
  });

  it("repeats the same sequence for the same seed", () => {
    const first = createBag(9876);
    const second = createBag(9876);
    const nextFirst = createBag(first.rngState);
    const nextSecond = createBag(second.rngState);

    expect(first).toEqual(second);
    expect(nextFirst).toEqual(nextSecond);
  });
});

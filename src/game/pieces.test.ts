import { describe, expect, it } from "vitest";
import { createSpawnPiece, getKickTests, PIECE_ROTATIONS } from "./pieces";
import { PIECE_TYPES } from "./types";

describe("tetromino definitions", () => {
  it.each(PIECE_TYPES)("defines four valid rotations for %s", (type) => {
    expect(PIECE_ROTATIONS[type]).toHaveLength(4);
    for (const rotation of PIECE_ROTATIONS[type]) {
      expect(rotation).toHaveLength(4);
      expect(new Set(rotation.map(({ x, y }) => `${x},${y}`)).size).toBe(4);
      expect(rotation.every(({ x, y }) => x >= 0 && x < 4 && y >= 0 && y < 4)).toBe(true);
    }
  });

  it("spawns pieces in the centered hidden area", () => {
    expect(createSpawnPiece("T")).toEqual({ type: "T", rotation: 0, x: 3, y: 1 });
  });

  it("uses distinct SRS kick tables for I and other pieces", () => {
    expect(getKickTests("I", 0, 1)).toContainEqual({ x: -2, y: 0 });
    expect(getKickTests("T", 0, 1)).toContainEqual({ x: -1, y: 0 });
    expect(getKickTests("O", 0, 1)).toEqual([{ x: 0, y: 0 }]);
  });
});

import { describe, expect, it } from "vitest";
import { createGame } from "../game/engine";
import { HIDDEN_ROWS } from "../game/types";
import { createDevFixture } from "./devFixtures";

describe("development visual fixtures", () => {
  it("creates stable named states without mutating the source game", () => {
    const initial = createGame({ seed: 73 });
    const highStack = createDevFixture("high-stack", initial);
    expect(highStack.status).toBe("running");
    expect(highStack.lines).toBe(27);
    expect(highStack.board).not.toBe(initial.board);
    expect(initial.board.flat().every((cell) => cell === null)).toBe(true);
    expect(highStack.board.slice(HIDDEN_ROWS + 9).flat().some((cell) => cell !== null)).toBe(true);
  });

  it("falls back to the supplied ready game for unknown fixture names", () => {
    const initial = createGame({ seed: 73 });
    expect(createDevFixture("unknown", initial)).toBe(initial);
  });
});

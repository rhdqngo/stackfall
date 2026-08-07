import { describe, expect, it } from "vitest";
import { createGame, applyCommand } from "../game/engine";
import type { GameState } from "../game/types";
import { deriveFeedback } from "./feedback";

function runningGame(): GameState {
  return applyCommand(createGame({ seed: 7 }), { type: "start" });
}

describe("game feedback derivation", () => {
  it("reports successful and denied hold actions without changing engine behavior", () => {
    const initial = runningGame();
    const held = applyCommand(initial, { type: "hold" });
    expect(deriveFeedback(initial, held, { type: "hold" })).toContainEqual({ type: "hold" });

    const denied = applyCommand(held, { type: "hold" });
    expect(denied).toBe(held);
    expect(deriveFeedback(held, denied, { type: "hold" })).toContainEqual({ type: "holdDenied" });
  });

  it("reports hard drops and rotation outcomes from command results", () => {
    const initial = runningGame();
    const rotated = applyCommand(initial, { type: "rotate", direction: 1 });
    expect(deriveFeedback(initial, rotated, { type: "rotate", direction: 1 })[0]?.type).toBe("rotate");

    const dropped = applyCommand(initial, { type: "hardDrop" });
    expect(deriveFeedback(initial, dropped, { type: "hardDrop" })).toContainEqual({ type: "hardDrop" });
  });

  it("reports line clears, level changes, and game over from state differences", () => {
    const previous = { ...runningGame(), lines: 8 };
    const next: GameState = { ...previous, lines: 12, level: 2, status: "gameOver" };
    expect(deriveFeedback(previous, next)).toEqual([
      { type: "lineClear", count: 4 },
      { type: "levelUp", level: 2 },
      { type: "gameOver" },
    ]);
  });
});

import { applyCommand } from "../game/engine";
import { HIDDEN_ROWS, PIECE_TYPES, type Board, type GameState } from "../game/types";

export type DevFixtureName = "ready" | "running" | "high-stack" | "hold-used" | "paused" | "game-over";

function withHighStack(state: GameState): GameState {
  const board: Board = state.board.map((row) => [...row]);
  for (let y = HIDDEN_ROWS + 9; y < board.length; y += 1) {
    for (let x = 0; x < board[y]!.length; x += 1) {
      if (x === 4 || (x + y) % 6 === 0) continue;
      board[y]![x] = PIECE_TYPES[(x * 3 + y) % PIECE_TYPES.length]!;
    }
  }
  return { ...state, board, score: 8_640, lines: 27, level: 3 };
}

export function createDevFixture(name: string | null, initial: GameState): GameState {
  switch (name as DevFixtureName | null) {
    case "running":
      return applyCommand(initial, { type: "start" });
    case "high-stack":
      return withHighStack(applyCommand(initial, { type: "start" }));
    case "hold-used":
      return applyCommand(applyCommand(initial, { type: "start" }), { type: "hold" });
    case "paused":
      return applyCommand(applyCommand(initial, { type: "start" }), { type: "pause" });
    case "game-over": {
      const stacked = withHighStack(applyCommand(initial, { type: "start" }));
      return { ...stacked, active: null, status: "gameOver", score: 12_480, lines: 37, level: 4 };
    }
    case "ready":
    default:
      return initial;
  }
}

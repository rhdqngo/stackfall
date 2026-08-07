import { describe, expect, it } from "vitest";
import { clearCompletedLines, collides, createEmptyBoard, getGhostY } from "./board";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./types";

describe("board rules", () => {
  it("creates a 10 by 22 empty board", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    expect(board.every((row) => row.length === BOARD_WIDTH && row.every((cell) => cell === null))).toBe(true);
  });

  it("rejects walls, floor, and occupied cells", () => {
    const board = createEmptyBoard();
    board[10]![4] = "T";

    expect(collides(board, { type: "O", rotation: 0, x: -2, y: 3 })).toBe(true);
    expect(collides(board, { type: "O", rotation: 0, x: 3, y: 9 })).toBe(true);
    expect(collides(board, { type: "I", rotation: 0, x: 3, y: BOARD_HEIGHT - 1 })).toBe(true);
    expect(collides(board, { type: "T", rotation: 0, x: 3, y: 0 })).toBe(false);
  });

  it("clears multiple rows and compacts the remainder", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1]!.fill("I");
    board[BOARD_HEIGHT - 2]!.fill("O");
    board[BOARD_HEIGHT - 3]![0] = "T";

    const result = clearCompletedLines(board);

    expect(result.linesCleared).toBe(2);
    expect(result.board[BOARD_HEIGHT - 1]![0]).toBe("T");
    expect(result.board[0]!.every((cell) => cell === null)).toBe(true);
    expect(result.board[1]!.every((cell) => cell === null)).toBe(true);
  });

  it("calculates the exact hard-drop landing row", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1]![4] = "J";
    const piece = { type: "O" as const, rotation: 0 as const, x: 3, y: 0 };

    expect(getGhostY(board, piece)).toBe(BOARD_HEIGHT - 3);
  });
});

import { getPieceCells } from "./pieces";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type ActivePiece,
  type Board,
  type Cell,
} from "./types";

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function collides(board: Board, piece: ActivePiece): boolean {
  return getPieceCells(piece).some(({ x, y }) => {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    return y >= 0 && board[y]?.[x] !== null;
  });
}

export function isGrounded(board: Board, piece: ActivePiece): boolean {
  return collides(board, { ...piece, y: piece.y + 1 });
}

export function getGhostY(board: Board, piece: ActivePiece): number {
  let y = piece.y;
  while (!collides(board, { ...piece, y: y + 1 })) y += 1;
  return y;
}

export function placePiece(board: Board, piece: ActivePiece): { board: Board; toppedOut: boolean } {
  const nextBoard = board.map((row) => [...row]);
  let toppedOut = false;

  for (const { x, y } of getPieceCells(piece)) {
    if (y < 0) {
      toppedOut = true;
    } else if (nextBoard[y]) {
      nextBoard[y][x] = piece.type;
    }
  }

  return { board: nextBoard, toppedOut };
}

export function clearCompletedLines(board: Board): { board: Board; linesCleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const linesCleared = BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: linesCleared }, () => Array<Cell>(BOARD_WIDTH).fill(null));
  return { board: [...emptyRows, ...remaining.map((row) => [...row])], linesCleared };
}

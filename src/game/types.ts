export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = 2;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;

export const PIECE_TYPES = ["I", "J", "L", "O", "S", "T", "Z"] as const;

export type PieceType = (typeof PIECE_TYPES)[number];
export type Rotation = 0 | 1 | 2 | 3;
export type Cell = PieceType | null;
export type Board = Cell[][];
export type GameStatus = "ready" | "running" | "paused" | "gameOver";

export interface Point {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  gravityAccumulator: number;
  lockAccumulator: number;
  lockResets: number;
  rngState: number;
}

export type InputCommand =
  | { type: "start" }
  | { type: "pause" }
  | { type: "restart"; seed: number }
  | { type: "move"; dx: -1 | 1 }
  | { type: "softDrop" }
  | { type: "hardDrop" }
  | { type: "rotate"; direction: -1 | 1 }
  | { type: "hold" };

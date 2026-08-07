import { getGhostY } from "../game/board";
import { getPieceCells, PIECE_ROTATIONS } from "../game/pieces";
import {
  BOARD_WIDTH,
  HIDDEN_ROWS,
  VISIBLE_HEIGHT,
  type GameState,
  type PieceType,
} from "../game/types";

const COLORS: Record<PieceType, string> = {
  I: "#48c7e8",
  J: "#5278d7",
  L: "#e98a3a",
  O: "#f2c94c",
  S: "#5abf78",
  T: "#a86ad8",
  Z: "#df5d62",
};

function getCanvasContext(canvas: HTMLCanvasElement): {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
} | null {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const pixelWidth = Math.round(bounds.width * ratio);
  const pixelHeight = Math.round(bounds.height * ratio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) return null;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width: bounds.width, height: bounds.height };
}

function drawBlock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
): void {
  const gap = Math.max(1, size * 0.055);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  context.fillRect(x + gap, y + gap, size - gap * 2, Math.max(1, size * 0.07));
  context.restore();
}

export function renderBoard(canvas: HTMLCanvasElement, state: GameState): void {
  const canvasData = getCanvasContext(canvas);
  if (!canvasData) return;
  const { context, width, height } = canvasData;
  const cellSize = Math.min(width / BOARD_WIDTH, height / VISIBLE_HEIGHT);
  const boardWidth = cellSize * BOARD_WIDTH;
  const boardHeight = cellSize * VISIBLE_HEIGHT;
  const offsetX = (width - boardWidth) / 2;
  const offsetY = (height - boardHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#07111c";
  context.fillRect(offsetX, offsetY, boardWidth, boardHeight);

  context.strokeStyle = "rgba(201, 217, 225, 0.08)";
  context.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    context.beginPath();
    context.moveTo(offsetX + x * cellSize, offsetY);
    context.lineTo(offsetX + x * cellSize, offsetY + boardHeight);
    context.stroke();
  }
  for (let y = 0; y <= VISIBLE_HEIGHT; y += 1) {
    context.beginPath();
    context.moveTo(offsetX, offsetY + y * cellSize);
    context.lineTo(offsetX + boardWidth, offsetY + y * cellSize);
    context.stroke();
  }

  for (let y = HIDDEN_ROWS; y < state.board.length; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const cell = state.board[y]?.[x];
      if (cell) drawBlock(context, offsetX + x * cellSize, offsetY + (y - HIDDEN_ROWS) * cellSize, cellSize, COLORS[cell]);
    }
  }

  if (!state.active) return;
  const ghostY = getGhostY(state.board, state.active);
  for (const cell of getPieceCells({ ...state.active, y: ghostY })) {
    if (cell.y >= HIDDEN_ROWS) {
      drawBlock(
        context,
        offsetX + cell.x * cellSize,
        offsetY + (cell.y - HIDDEN_ROWS) * cellSize,
        cellSize,
        COLORS[state.active.type],
        0.22,
      );
    }
  }

  for (const cell of getPieceCells(state.active)) {
    if (cell.y >= HIDDEN_ROWS) {
      drawBlock(
        context,
        offsetX + cell.x * cellSize,
        offsetY + (cell.y - HIDDEN_ROWS) * cellSize,
        cellSize,
        COLORS[state.active.type],
      );
    }
  }
}

export function renderPreview(canvas: HTMLCanvasElement, type: PieceType | null): void {
  const canvasData = getCanvasContext(canvas);
  if (!canvasData) return;
  const { context, width, height } = canvasData;
  context.clearRect(0, 0, width, height);
  if (!type) return;

  const cells = PIECE_ROTATIONS[type][0];
  const minX = Math.min(...cells.map((cell) => cell.x));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  const pieceWidth = maxX - minX + 1;
  const pieceHeight = maxY - minY + 1;
  const size = Math.min(width / 5, height / 3.5);
  const offsetX = (width - pieceWidth * size) / 2 - minX * size;
  const offsetY = (height - pieceHeight * size) / 2 - minY * size;

  for (const cell of cells) {
    drawBlock(context, offsetX + cell.x * size, offsetY + cell.y * size, size, COLORS[type]);
  }
}

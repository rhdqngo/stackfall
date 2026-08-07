import { describe, expect, it } from "vitest";
import { createEmptyBoard, getGhostY } from "./board";
import {
  advanceGame,
  applyCommand,
  createGame,
  getGravityInterval,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
} from "./engine";
import { getPieceCells } from "./pieces";
import { BOARD_HEIGHT, type ActivePiece, type GameState, type PieceType } from "./types";

function runningGame(seed = 42): GameState {
  return applyCommand(createGame({ seed }), { type: "start" });
}

function withPiece(state: GameState, active: ActivePiece): GameState {
  return {
    ...state,
    board: createEmptyBoard(),
    active,
    status: "running",
    gravityAccumulator: 0,
    lockAccumulator: 0,
    lockResets: 0,
  };
}

describe("game engine", () => {
  it("starts ready, transitions to running, and keeps a populated next queue", () => {
    const ready = createGame({ seed: 12 });
    expect(ready.status).toBe("ready");
    expect(ready.active).not.toBeNull();
    expect(ready.queue.length).toBeGreaterThanOrEqual(7);
    expect(applyCommand(ready, { type: "start" }).status).toBe("running");
  });

  it("moves by gravity and freezes while paused", () => {
    const running = runningGame();
    const startY = running.active!.y;
    const fallen = advanceGame(running, getGravityInterval(1));
    expect(fallen.active!.y).toBe(startY + 1);

    const paused = applyCommand(fallen, { type: "pause" });
    expect(advanceGame(paused, 5000)).toEqual(paused);
  });

  it("applies JLSTZ and I wall kicks", () => {
    const base = runningGame();
    const tAtWall = withPiece(base, { type: "T", rotation: 1, x: -1, y: 5 });
    const rotatedT = applyCommand(tAtWall, { type: "rotate", direction: 1 });
    expect(rotatedT.active).toMatchObject({ rotation: 2, x: 0 });

    const iAtWall = withPiece(base, { type: "I", rotation: 1, x: -2, y: 5 });
    const rotatedI = applyCommand(iAtWall, { type: "rotate", direction: -1 });
    expect(rotatedI.active).toMatchObject({ rotation: 0, x: 0 });
  });

  it("cancels rotation when every kick is obstructed", () => {
    const base = runningGame();
    const board = createEmptyBoard();
    for (let y = 3; y < 10; y += 1) board[y]!.fill("J");
    const blocked: GameState = {
      ...withPiece(base, { type: "T", rotation: 0, x: 3, y: 5 }),
      board,
    };

    expect(applyCommand(blocked, { type: "rotate", direction: 1 }).active).toEqual(blocked.active);
  });

  it("locks after 500ms and caps grounded lock-delay resets", () => {
    const grounded = withPiece(runningGame(), { type: "O", rotation: 0, x: 3, y: 20 });
    const almostLocked = advanceGame(grounded, LOCK_DELAY_MS - 1);
    expect(almostLocked.active?.type).toBe("O");
    expect(almostLocked.lockAccumulator).toBe(LOCK_DELAY_MS - 1);
    expect(advanceGame(almostLocked, 1).board[BOARD_HEIGHT - 1]!.filter(Boolean)).toHaveLength(2);

    const resettable = { ...grounded, lockAccumulator: 400, lockResets: MAX_LOCK_RESETS - 1 };
    const lastReset = applyCommand(resettable, { type: "move", dx: -1 });
    expect(lastReset.lockAccumulator).toBe(0);
    expect(lastReset.lockResets).toBe(MAX_LOCK_RESETS);

    const capped = { ...lastReset, lockAccumulator: 400 };
    expect(applyCommand(capped, { type: "move", dx: 1 }).lockAccumulator).toBe(400);
  });

  it("awards soft-drop and line-clear points, then raises the level every ten lines", () => {
    const base = runningGame();
    const softDropped = applyCommand(withPiece(base, { type: "O", rotation: 0, x: 3, y: 0 }), { type: "softDrop" });
    expect(softDropped.score).toBe(1);

    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1]!.fill("J");
    for (let x = 3; x <= 6; x += 1) board[BOARD_HEIGHT - 1]![x] = null;
    const state: GameState = {
      ...withPiece(base, { type: "I", rotation: 0, x: 3, y: 20 }),
      board,
      lines: 9,
    };

    const cleared = applyCommand(state, { type: "hardDrop" });
    expect(cleared.lines).toBe(10);
    expect(cleared.level).toBe(2);
    expect(cleared.score).toBe(100);

    const dropped = applyCommand(withPiece(base, { type: "O", rotation: 0, x: 3, y: 0 }), { type: "hardDrop" });
    expect(dropped.score).toBe(40);
  });

  it.each([
    [1, 100],
    [2, 300],
    [3, 500],
    [4, 800],
  ])("scores a %i-line clear", (lineCount, expectedScore) => {
    const base = runningGame();
    const board = createEmptyBoard();
    for (let y = BOARD_HEIGHT - lineCount; y < BOARD_HEIGHT; y += 1) {
      board[y]!.fill("S");
      board[y]![5] = null;
    }
    const state: GameState = {
      ...withPiece(base, { type: "I", rotation: 1, x: 3, y: BOARD_HEIGHT - 4 }),
      board,
    };

    const cleared = applyCommand(state, { type: "hardDrop" });
    expect(cleared.lines).toBe(lineCount);
    expect(cleared.score).toBe(expectedScore);
  });

  it("allows hold once per piece and restores it after locking", () => {
    const state = runningGame(17);
    const firstType = state.active!.type;
    const held = applyCommand(state, { type: "hold" });
    expect(held.hold).toBe(firstType);
    expect(held.canHold).toBe(false);
    expect(applyCommand(held, { type: "hold" })).toEqual(held);

    const locked = applyCommand(held, { type: "hardDrop" });
    expect(locked.canHold).toBe(true);
  });

  it("ends the game when the next piece cannot spawn", () => {
    const state = withPiece(runningGame(), { type: "I", rotation: 0, x: 3, y: 20 });
    const nextType: PieceType = "O";
    const board = state.board.map((row) => [...row]);
    board[0]![4] = "Z";
    board[0]![5] = "Z";
    board[1]![4] = "Z";
    board[1]![5] = "Z";

    const gameOver = applyCommand({ ...state, board, queue: [nextType, ...state.queue] }, { type: "hardDrop" });
    expect(gameOver.status).toBe("gameOver");
  });

  it("places a hard-dropped piece exactly at its ghost position", () => {
    const state = withPiece(runningGame(), { type: "L", rotation: 0, x: 3, y: 0 });
    const ghostY = getGhostY(state.board, state.active!);
    const expectedCells = getPieceCells({ ...state.active!, y: ghostY });
    const dropped = applyCommand(state, { type: "hardDrop" });

    expect(expectedCells.every(({ x, y }) => dropped.board[y]?.[x] === "L")).toBe(true);
  });

  it("restarts with clean state and the requested seed", () => {
    const dirty = { ...runningGame(), score: 999, lines: 8 };
    const restarted = applyCommand(dirty, { type: "restart", seed: 77 });
    expect(restarted.status).toBe("ready");
    expect(restarted.score).toBe(0);
    expect(restarted.lines).toBe(0);
    expect(restarted).toEqual(createGame({ seed: 77 }));
  });
});

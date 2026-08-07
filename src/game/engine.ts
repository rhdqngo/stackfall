import { clearCompletedLines, collides, createEmptyBoard, getGhostY, isGrounded, placePiece } from "./board";
import { createSpawnPiece, getKickTests } from "./pieces";
import { createBag } from "./random";
import type { ActivePiece, GameState, InputCommand, PieceType, Rotation } from "./types";

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

const LINE_CLEAR_SCORES = [0, 100, 300, 500, 800] as const;

export function getGravityInterval(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 75);
}

function refillQueue(queue: PieceType[], rngState: number): { queue: PieceType[]; rngState: number } {
  const nextQueue = [...queue];
  let nextRngState = rngState;

  while (nextQueue.length < 7) {
    const result = createBag(nextRngState);
    nextQueue.push(...result.bag);
    nextRngState = result.rngState;
  }

  return { queue: nextQueue, rngState: nextRngState };
}

function spawnNext(state: GameState, requestedType?: PieceType): GameState {
  let queue = [...state.queue];
  let rngState = state.rngState;
  let type = requestedType;

  if (!type) {
    const prepared = refillQueue(queue, rngState);
    queue = prepared.queue;
    rngState = prepared.rngState;
    type = queue.shift();
  }

  const replenished = refillQueue(queue, rngState);
  const active = createSpawnPiece(type!);
  const blocked = collides(state.board, active);

  return {
    ...state,
    active,
    queue: replenished.queue,
    rngState: replenished.rngState,
    gravityAccumulator: 0,
    lockAccumulator: 0,
    lockResets: 0,
    status: blocked ? "gameOver" : state.status,
  };
}

export function createGame(options: { seed: number }): GameState {
  const initial: GameState = {
    board: createEmptyBoard(),
    active: null,
    queue: [],
    hold: null,
    canHold: true,
    status: "ready",
    score: 0,
    lines: 0,
    level: 1,
    gravityAccumulator: 0,
    lockAccumulator: 0,
    lockResets: 0,
    rngState: options.seed >>> 0,
  };

  return spawnNext(initial);
}

function withGroundedReset(state: GameState, active: ActivePiece, wasGrounded: boolean): GameState {
  if (!wasGrounded || state.lockResets >= MAX_LOCK_RESETS) return { ...state, active };
  return {
    ...state,
    active,
    lockAccumulator: 0,
    lockResets: state.lockResets + 1,
  };
}

function tryMove(state: GameState, dx: number, dy: number): GameState {
  if (!state.active) return state;
  const candidate = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (collides(state.board, candidate)) return state;

  if (dy > 0) {
    return { ...state, active: candidate, lockAccumulator: 0 };
  }

  return withGroundedReset(state, candidate, isGrounded(state.board, state.active));
}

function rotate(state: GameState, direction: -1 | 1): GameState {
  if (!state.active) return state;
  const from = state.active.rotation;
  const to = ((from + direction + 4) % 4) as Rotation;
  const wasGrounded = isGrounded(state.board, state.active);

  for (const kick of getKickTests(state.active.type, from, to)) {
    const candidate = {
      ...state.active,
      rotation: to,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y,
    };
    if (!collides(state.board, candidate)) return withGroundedReset(state, candidate, wasGrounded);
  }

  return state;
}

function lockPiece(state: GameState): GameState {
  if (!state.active) return state;
  const placed = placePiece(state.board, state.active);
  if (placed.toppedOut) return { ...state, board: placed.board, active: null, status: "gameOver" };

  const cleared = clearCompletedLines(placed.board);
  const lines = state.lines + cleared.linesCleared;
  const score = state.score + (LINE_CLEAR_SCORES[cleared.linesCleared] ?? 0) * state.level;
  const nextState: GameState = {
    ...state,
    board: cleared.board,
    active: null,
    score,
    lines,
    level: Math.floor(lines / 10) + 1,
    canHold: true,
    gravityAccumulator: 0,
    lockAccumulator: 0,
    lockResets: 0,
  };

  return spawnNext(nextState);
}

function holdPiece(state: GameState): GameState {
  if (!state.active || !state.canHold) return state;
  const activeType = state.active.type;
  const nextState = { ...state, active: null, hold: activeType, canHold: false };
  const spawned = state.hold ? spawnNext(nextState, state.hold) : spawnNext(nextState);
  return { ...spawned, canHold: false };
}

export function applyCommand(state: GameState, command: InputCommand): GameState {
  if (command.type === "restart") return createGame({ seed: command.seed });
  if (command.type === "start") {
    if (state.status === "ready" || state.status === "paused") return { ...state, status: "running" };
    return state;
  }
  if (command.type === "pause") {
    if (state.status === "running") return { ...state, status: "paused" };
    if (state.status === "paused") return { ...state, status: "running" };
    return state;
  }
  if (state.status !== "running" || !state.active) return state;

  switch (command.type) {
    case "move":
      return tryMove(state, command.dx, 0);
    case "softDrop": {
      const moved = tryMove(state, 0, 1);
      return moved === state ? state : { ...moved, score: moved.score + 1 };
    }
    case "hardDrop": {
      const y = getGhostY(state.board, state.active);
      const distance = y - state.active.y;
      return lockPiece({ ...state, active: { ...state.active, y }, score: state.score + distance * 2 });
    }
    case "rotate":
      return rotate(state, command.direction);
    case "hold":
      return holdPiece(state);
  }
}

export function advanceGame(state: GameState, deltaMs: number): GameState {
  if (state.status !== "running" || !state.active || deltaMs <= 0) return state;

  const interval = getGravityInterval(state.level);
  let next = { ...state, gravityAccumulator: state.gravityAccumulator + deltaMs };

  while (next.active && next.gravityAccumulator >= interval) {
    const previousY = next.active.y;
    const remainingGravity = next.gravityAccumulator - interval;
    const moved = tryMove(next, 0, 1);
    next = { ...moved, gravityAccumulator: remainingGravity };
    if (moved.active?.y === previousY) break;
  }

  if (!next.active) return next;
  if (isGrounded(next.board, next.active)) {
    next = { ...next, lockAccumulator: next.lockAccumulator + deltaMs };
    if (next.lockAccumulator >= LOCK_DELAY_MS) return lockPiece(next);
  } else if (next.lockAccumulator !== 0) {
    next = { ...next, lockAccumulator: 0 };
  }

  return next;
}

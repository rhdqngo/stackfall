import { PIECE_TYPES, type PieceType } from "./types";

export interface RandomResult {
  state: number;
  value: number;
}

export function nextRandom(state: number): RandomResult {
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return {
    state: nextState,
    value: ((value ^ (value >>> 14)) >>> 0) / 4294967296,
  };
}

export function createBag(rngState: number): { bag: PieceType[]; rngState: number } {
  const bag = [...PIECE_TYPES];
  let state = rngState >>> 0;

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const random = nextRandom(state);
    state = random.state;
    const swapIndex = Math.floor(random.value * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex]!, bag[index]!];
  }

  return { bag, rngState: state };
}

import type { PieceType } from "../game/types";

export interface CanvasTheme {
  well: string;
  grid: string;
  dangerWash: string;
  dangerLine: string;
  blockEdge: string;
  blockShade: string;
  activeStroke: string;
  ghostStroke: string;
  ghostFillAlpha: number;
  pieces: Record<PieceType, string>;
}

function requiredProperty(styles: CSSStyleDeclaration, name: string): string {
  const value = styles.getPropertyValue(name).trim();
  if (!value) throw new Error(`Canvas 테마 토큰이 없습니다: ${name}`);
  return value;
}

export function readCanvasTheme(element: Element = document.documentElement): CanvasTheme {
  const styles = getComputedStyle(element);
  const pieces = {
    I: requiredProperty(styles, "--piece-i"),
    J: requiredProperty(styles, "--piece-j"),
    L: requiredProperty(styles, "--piece-l"),
    O: requiredProperty(styles, "--piece-o"),
    S: requiredProperty(styles, "--piece-s"),
    T: requiredProperty(styles, "--piece-t"),
    Z: requiredProperty(styles, "--piece-z"),
  } satisfies Record<PieceType, string>;
  const ghostFillAlpha = Number(requiredProperty(styles, "--ghost-fill-alpha"));
  if (!Number.isFinite(ghostFillAlpha)) throw new Error("Ghost 투명도 토큰이 올바르지 않습니다.");

  return {
    well: requiredProperty(styles, "--color-well"),
    grid: requiredProperty(styles, "--board-grid"),
    dangerWash: requiredProperty(styles, "--danger-wash"),
    dangerLine: requiredProperty(styles, "--danger-line"),
    blockEdge: requiredProperty(styles, "--block-edge"),
    blockShade: requiredProperty(styles, "--block-shade"),
    activeStroke: requiredProperty(styles, "--active-stroke"),
    ghostStroke: requiredProperty(styles, "--ghost-stroke"),
    ghostFillAlpha,
    pieces,
  };
}

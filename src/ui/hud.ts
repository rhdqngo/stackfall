import type { GameState } from "../game/types";
import type { CanvasTheme } from "../render/canvasTheme";
import { renderPreview } from "../render/canvasRenderer";
import { STATUS_LABELS } from "./copy";
import type { GameShellRefs } from "./gameShell";

const numberFormat = new Intl.NumberFormat("ko-KR");

export class GameHud {
  private renderedState: GameState | null = null;
  private renderedHighScore = -1;

  constructor(private readonly refs: GameShellRefs) {}

  render(state: GameState, highScore: number, theme: CanvasTheme, force = false): void {
    const previous = this.renderedState;
    if (force || previous?.score !== state.score) this.refs.scoreValue.textContent = numberFormat.format(state.score);
    if (force || this.renderedHighScore !== highScore) this.refs.bestValue.textContent = numberFormat.format(highScore);
    if (force || previous?.lines !== state.lines) this.refs.linesValue.textContent = String(state.lines);
    if (force || previous?.level !== state.level) this.refs.levelValue.textContent = String(state.level);
    if (force || previous?.status !== state.status) {
      this.refs.statusValue.textContent = STATUS_LABELS[state.status];
      this.refs.statusValue.dataset.status = state.status;
    }

    if (force || previous?.hold !== state.hold || previous?.canHold !== state.canHold) {
      renderPreview(this.refs.holdCanvas, state.hold, theme, !state.canHold);
      this.refs.holdEmpty.hidden = state.hold !== null;
      this.refs.holdPanel.dataset.available = String(state.canHold);
      this.refs.holdState.textContent = state.canHold ? "사용 가능" : "잠김";
    }

    this.refs.nextCanvases.forEach((canvas, index) => {
      if (force || previous?.queue[index] !== state.queue[index]) {
        renderPreview(canvas, state.queue[index] ?? null, theme);
      }
    });

    this.renderedState = state;
    this.renderedHighScore = highScore;
  }
}

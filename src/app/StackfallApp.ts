import { advanceGame, applyCommand, createGame } from "../game/engine";
import type { GameState, InputCommand } from "../game/types";
import { InputController } from "../platform/input";
import { renderBoard } from "../render/canvasRenderer";
import { readCanvasTheme, type CanvasTheme } from "../render/canvasTheme";
import { getOverlayCopy } from "../ui/copy";
import type { GameShellRefs } from "../ui/gameShell";
import { GameHud } from "../ui/hud";

const FIXED_STEP_MS = 1000 / 60;
const MAX_FRAME_DELTA_MS = 100;

function createSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

export class StackfallApp {
  private state: GameState = createGame({ seed: createSeed() });
  private readonly input = new InputController((command) => this.dispatch(command));
  private readonly hud: GameHud;
  private theme: CanvasTheme;
  private renderedBoard: Pick<GameState, "board" | "active"> | null = null;
  private lastFrame = performance.now();
  private accumulator = 0;
  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly refs: GameShellRefs) {
    const canvases = [refs.boardCanvas, refs.holdCanvas, ...refs.nextCanvases];
    if (canvases.some((canvas) => canvas.getContext("2d") === null)) {
      throw new Error("이 브라우저에서 Canvas 2D를 초기화할 수 없습니다.");
    }
    this.theme = readCanvasTheme();
    this.hud = new GameHud(refs);
    this.resizeObserver = new ResizeObserver(() => this.render(true));
    canvases.forEach((canvas) => this.resizeObserver.observe(canvas));
  }

  start(): void {
    this.input.attach();
    this.refs.primaryButton.addEventListener("click", () => this.handlePrimaryAction());
    this.refs.pauseButton.addEventListener("click", () => this.dispatch({ type: "pause" }));
    this.refs.restartButton.addEventListener("click", () => this.restart());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseFromInterruption();
    });
    window.addEventListener("blur", () => this.pauseFromInterruption());
    this.render(true);
    requestAnimationFrame(this.frame);
  }

  private frame = (timestamp: number): void => {
    const delta = Math.min(MAX_FRAME_DELTA_MS, Math.max(0, timestamp - this.lastFrame));
    this.lastFrame = timestamp;
    this.input.update(timestamp);
    this.accumulator += delta;

    while (this.accumulator >= FIXED_STEP_MS) {
      this.state = advanceGame(this.state, FIXED_STEP_MS);
      this.accumulator -= FIXED_STEP_MS;
    }

    this.render();
    requestAnimationFrame(this.frame);
  };

  private dispatch(command: InputCommand): void {
    if (command.type === "restart") {
      this.restart();
      return;
    }
    if (command.type === "start" && this.state.status === "gameOver") {
      this.restart();
      return;
    }
    this.state = applyCommand(this.state, command);
    if (command.type === "start") this.refs.boardCanvas.focus();
    this.render();
  }

  private handlePrimaryAction(): void {
    if (this.state.status === "gameOver") {
      this.restart();
      return;
    }
    this.dispatch({ type: "start" });
  }

  private restart(): void {
    this.state = applyCommand(this.state, { type: "restart", seed: createSeed() });
    this.state = applyCommand(this.state, { type: "start" });
    this.input.clear();
    this.accumulator = 0;
    this.refs.boardCanvas.focus();
    this.render(true);
  }

  private pauseFromInterruption(): void {
    this.input.clear();
    if (this.state.status === "running") {
      this.state = applyCommand(this.state, { type: "pause" });
      this.render();
    }
  }

  private render(force = false): void {
    const boardChanged =
      force ||
      this.renderedBoard?.board !== this.state.board ||
      this.renderedBoard.active !== this.state.active;
    if (boardChanged) {
      renderBoard(this.refs.boardCanvas, this.state, this.theme);
      this.renderedBoard = { board: this.state.board, active: this.state.active };
    }

    this.hud.render(this.state, 0, this.theme, force);
    const copy = getOverlayCopy(this.state.status, this.state.score);
    const isRunning = copy === null;
    this.refs.overlay.hidden = isRunning;
    this.refs.pauseButton.disabled = this.state.status === "ready" || this.state.status === "gameOver";
    this.refs.pauseButton.classList.toggle("is-active", this.state.status === "paused");
    this.refs.pauseButton.querySelector("span")!.textContent = this.state.status === "paused" ? "계속하기" : "일시정지";

    if (copy) {
      this.refs.overlayEyebrow.textContent = copy.eyebrow;
      this.refs.overlayTitle.textContent = copy.title;
      this.refs.overlayDescription.textContent = copy.description;
      this.refs.primaryButton.textContent = copy.action;
    }
  }
}

import "./style.css";
import { advanceGame, applyCommand, createGame } from "./game/engine";
import type { GameState, GameStatus, InputCommand } from "./game/types";
import { InputController } from "./platform/input";
import { renderBoard, renderPreview } from "./render/canvasRenderer";

const FIXED_STEP_MS = 1000 / 60;
const MAX_FRAME_DELTA_MS = 100;

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`필수 UI 요소를 찾을 수 없습니다: ${selector}`);
  return element;
}

function createSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

const STATUS_LABELS: Record<GameStatus, string> = {
  ready: "준비",
  running: "진행 중",
  paused: "일시정지",
  gameOver: "게임 오버",
};

class StackfallApp {
  private state: GameState = createGame({ seed: createSeed() });
  private readonly input = new InputController((command) => this.dispatch(command));
  private readonly boardCanvas = requireElement<HTMLCanvasElement>("#game-board");
  private readonly holdCanvas = requireElement<HTMLCanvasElement>("#hold-preview");
  private readonly nextCanvases = Array.from(document.querySelectorAll<HTMLCanvasElement>(".next-preview"));
  private readonly scoreValue = requireElement<HTMLElement>("#score-value");
  private readonly linesValue = requireElement<HTMLElement>("#lines-value");
  private readonly levelValue = requireElement<HTMLElement>("#level-value");
  private readonly statusValue = requireElement<HTMLElement>("#game-status");
  private readonly overlay = requireElement<HTMLElement>("#game-overlay");
  private readonly overlayTitle = requireElement<HTMLElement>("#overlay-title");
  private readonly overlayHint = requireElement<HTMLElement>("#overlay-hint");
  private readonly primaryButton = requireElement<HTMLButtonElement>("#primary-action");
  private readonly pauseButton = requireElement<HTMLButtonElement>("#pause-action");
  private readonly restartButton = requireElement<HTMLButtonElement>("#restart-action");
  private readonly holdEmpty = requireElement<HTMLElement>("#hold-empty");
  private lastFrame = performance.now();
  private accumulator = 0;

  start(): void {
    this.input.attach();
    this.primaryButton.addEventListener("click", () => this.handlePrimaryAction());
    this.pauseButton.addEventListener("click", () => this.dispatch({ type: "pause" }));
    this.restartButton.addEventListener("click", () => this.restart());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseFromInterruption();
    });
    window.addEventListener("blur", () => this.pauseFromInterruption());
    this.render();
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
    if (command.type === "start") this.boardCanvas.focus();
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
    this.boardCanvas.focus();
    this.render();
  }

  private pauseFromInterruption(): void {
    this.input.clear();
    if (this.state.status === "running") {
      this.state = applyCommand(this.state, { type: "pause" });
      this.render();
    }
  }

  private render(): void {
    renderBoard(this.boardCanvas, this.state);
    renderPreview(this.holdCanvas, this.state.hold);
    this.nextCanvases.forEach((canvas, index) => renderPreview(canvas, this.state.queue[index] ?? null));

    this.scoreValue.textContent = new Intl.NumberFormat("ko-KR").format(this.state.score);
    this.linesValue.textContent = String(this.state.lines);
    this.levelValue.textContent = String(this.state.level);
    this.statusValue.textContent = STATUS_LABELS[this.state.status];
    this.statusValue.dataset.status = this.state.status;
    this.holdEmpty.hidden = this.state.hold !== null;

    const isRunning = this.state.status === "running";
    this.overlay.hidden = isRunning;
    this.primaryButton.hidden = isRunning;
    this.pauseButton.disabled = this.state.status === "ready" || this.state.status === "gameOver";
    this.pauseButton.textContent = this.state.status === "paused" ? "계속하기" : "일시정지";

    if (this.state.status === "ready") {
      this.overlayTitle.textContent = "낙하 준비";
      this.overlayHint.textContent = "Enter 또는 게임 시작을 누르세요";
      this.primaryButton.textContent = "게임 시작";
    } else if (this.state.status === "paused") {
      this.overlayTitle.textContent = "일시정지";
      this.overlayHint.textContent = "Enter 또는 계속하기를 누르세요";
      this.primaryButton.textContent = "계속하기";
    } else if (this.state.status === "gameOver") {
      this.overlayTitle.textContent = "게임 오버";
      this.overlayHint.textContent = `최종 점수 ${new Intl.NumberFormat("ko-KR").format(this.state.score)}점`;
      this.primaryButton.textContent = "다시 시작";
    }
  }
}

requireElement<HTMLElement>("#app").innerHTML = `
  <div class="app-shell">
    <header class="masthead">
      <div>
        <p class="eyebrow">FALLING BLOCK / SOLO</p>
        <h1>STACKFALL</h1>
      </div>
      <p class="masthead-note">빈틈을 읽고, 흐름을 지키세요.</p>
    </header>

    <main class="game-layout" aria-label="Stackfall 게임">
      <aside class="side-column side-column--left" aria-label="보관 및 게임 동작">
        <section class="panel preview-panel">
          <h2>홀드</h2>
          <div class="preview-frame">
            <canvas id="hold-preview" aria-label="홀드 블록 미리보기"></canvas>
            <p id="hold-empty" class="empty-preview">비어 있음</p>
          </div>
          <p class="panel-hint"><kbd>C</kbd> / <kbd>Shift</kbd></p>
        </section>

        <section class="panel action-panel" aria-label="게임 동작">
          <button id="primary-action" class="button button--primary" type="button">게임 시작</button>
          <button id="pause-action" class="button" type="button" disabled>일시정지</button>
          <button id="restart-action" class="button" type="button">다시 시작</button>
        </section>
      </aside>

      <section class="board-section" aria-label="게임 보드">
        <div class="board-frame">
          <canvas
            id="game-board"
            tabindex="0"
            aria-label="10열 20행 Stackfall 게임 보드"
            aria-describedby="controls-help"
          ></canvas>
          <div id="game-overlay" class="game-overlay">
            <strong id="overlay-title">낙하 준비</strong>
            <span id="overlay-hint">Enter 또는 게임 시작을 누르세요</span>
          </div>
        </div>
        <div class="status-rail" aria-live="polite">
          <span>상태</span>
          <strong id="game-status" data-status="ready">준비</strong>
        </div>
      </section>

      <aside class="side-column side-column--right" aria-label="게임 정보">
        <section class="panel stats-panel">
          <h2>기록</h2>
          <dl class="stats-list">
            <div><dt>점수</dt><dd id="score-value">0</dd></div>
            <div><dt>라인</dt><dd id="lines-value">0</dd></div>
            <div><dt>레벨</dt><dd id="level-value">1</dd></div>
          </dl>
        </section>

        <section class="panel next-panel">
          <h2>다음</h2>
          <ol class="next-list">
            <li><canvas class="next-preview" aria-label="다음 블록 1"></canvas></li>
            <li><canvas class="next-preview" aria-label="다음 블록 2"></canvas></li>
            <li><canvas class="next-preview" aria-label="다음 블록 3"></canvas></li>
          </ol>
        </section>
      </aside>
    </main>

    <footer id="controls-help" class="controls-panel">
      <h2>조작</h2>
      <ul>
        <li><kbd>←</kbd><kbd>→</kbd><span>이동</span></li>
        <li><kbd>↓</kbd><span>소프트 드롭</span></li>
        <li><kbd>Space</kbd><span>하드 드롭</span></li>
        <li><kbd>Z</kbd><kbd>X</kbd><span>회전</span></li>
        <li><kbd>P</kbd><span>일시정지</span></li>
        <li><kbd>R</kbd><span>재시작</span></li>
      </ul>
    </footer>
  </div>
`;

new StackfallApp().start();

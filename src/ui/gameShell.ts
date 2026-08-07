function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`필수 UI 요소를 찾을 수 없습니다: ${selector}`);
  return element;
}

function icon(name: "pause" | "restart"): string {
  if (name === "pause") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z" /></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.4 7.1A8 8 0 1 0 20 12h-2.4a5.6 5.6 0 1 1-1.1-3.3L13 12h8V4z" /></svg>`;
}

export interface GameShellRefs {
  root: HTMLElement;
  boardCanvas: HTMLCanvasElement;
  holdCanvas: HTMLCanvasElement;
  nextCanvases: HTMLCanvasElement[];
  scoreValue: HTMLElement;
  bestValue: HTMLElement;
  linesValue: HTMLElement;
  levelValue: HTMLElement;
  statusValue: HTMLElement;
  holdPanel: HTMLElement;
  holdState: HTMLElement;
  holdEmpty: HTMLElement;
  overlay: HTMLElement;
  overlayEyebrow: HTMLElement;
  overlayTitle: HTMLElement;
  overlayDescription: HTMLElement;
  primaryButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  announcer: HTMLElement;
}

export function createGameShell(root: HTMLElement): GameShellRefs {
  root.innerHTML = `
    <div class="app-shell">
      <header class="masthead">
        <div class="brand-block">
          <p class="eyebrow">FALLING BLOCK / SOLO</p>
          <h1>STACKFALL</h1>
        </div>
        <p class="masthead-note">빈틈을 읽고, 흐름을 지키세요.</p>
        <div class="game-toolbar" aria-label="게임 메뉴">
          <button id="pause-action" class="icon-button" type="button" disabled>
            ${icon("pause")}<span>일시정지</span>
          </button>
          <button id="restart-action" class="icon-button" type="button">
            ${icon("restart")}<span>다시 시작</span>
          </button>
        </div>
      </header>

      <main class="game-layout" aria-label="Stackfall 게임">
        <section id="hold-panel" class="hud-card preview-panel hold-panel" aria-labelledby="hold-title">
          <div class="panel-heading">
            <h2 id="hold-title">홀드</h2>
            <span id="hold-state" class="panel-state">사용 가능</span>
          </div>
          <div class="preview-frame">
            <canvas id="hold-preview" aria-label="홀드 블록 미리보기"></canvas>
            <p id="hold-empty" class="empty-preview">비어 있음</p>
          </div>
          <p class="panel-hint"><kbd>C</kbd><span>또는</span><kbd>Shift</kbd></p>
        </section>

        <section class="hud-card stats-panel" aria-labelledby="record-title">
          <div class="panel-heading"><h2 id="record-title">기록</h2></div>
          <dl class="stats-list">
            <div class="stat stat--score"><dt>점수</dt><dd id="score-value">0</dd></div>
            <div class="stat"><dt>최고</dt><dd id="best-value">0</dd></div>
            <div class="stat"><dt>라인</dt><dd id="lines-value">0</dd></div>
            <div class="stat"><dt>레벨</dt><dd id="level-value">1</dd></div>
          </dl>
        </section>

        <section class="board-section" aria-label="게임 보드">
          <div class="fallline" aria-hidden="true"><span>DROP AXIS</span></div>
          <div class="board-frame">
            <canvas
              id="game-board"
              tabindex="0"
              aria-label="10열 20행 Stackfall 게임 보드"
              aria-describedby="controls-help"
            ></canvas>
            <div id="game-overlay" class="game-overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title" aria-describedby="overlay-description">
              <div class="overlay-copy">
                <span id="overlay-eyebrow" class="overlay-eyebrow">READY / 01</span>
                <strong id="overlay-title">낙하 준비</strong>
                <span id="overlay-description">빈틈을 읽고 첫 블록을 놓으세요.</span>
              </div>
              <button id="primary-action" class="button button--primary" type="button">게임 시작</button>
              <p class="overlay-shortcut"><kbd>Enter</kbd> 키로도 실행</p>
            </div>
          </div>
          <div class="status-rail">
            <span class="status-label">현재 상태</span>
            <strong id="game-status" data-status="ready">준비</strong>
          </div>
        </section>

        <section class="hud-card next-panel" aria-labelledby="next-title">
          <div class="panel-heading"><h2 id="next-title">다음</h2><span class="panel-state">3개</span></div>
          <ol class="next-list">
            <li class="next-item next-item--primary"><span class="queue-index">01</span><canvas class="next-preview" aria-label="다음 블록 1"></canvas></li>
            <li class="next-item"><span class="queue-index">02</span><canvas class="next-preview" aria-label="다음 블록 2"></canvas></li>
            <li class="next-item"><span class="queue-index">03</span><canvas class="next-preview" aria-label="다음 블록 3"></canvas></li>
          </ol>
        </section>
      </main>

      <footer id="controls-help" class="controls-panel">
        <h2>조작</h2>
        <ul>
          <li><span class="key-pair"><kbd>←</kbd><kbd>→</kbd></span><span>이동</span></li>
          <li><kbd>↓</kbd><span>소프트 드롭</span></li>
          <li><kbd>Space</kbd><span>하드 드롭</span></li>
          <li><span class="key-pair"><kbd>Z</kbd><kbd>X</kbd></span><span>회전</span></li>
          <li><kbd>C</kbd><span>홀드</span></li>
          <li><kbd>P</kbd><span>일시정지</span></li>
        </ul>
      </footer>
      <div id="status-announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
    </div>
  `;

  return {
    root,
    boardCanvas: requireElement(root, "#game-board"),
    holdCanvas: requireElement(root, "#hold-preview"),
    nextCanvases: Array.from(root.querySelectorAll<HTMLCanvasElement>(".next-preview")),
    scoreValue: requireElement(root, "#score-value"),
    bestValue: requireElement(root, "#best-value"),
    linesValue: requireElement(root, "#lines-value"),
    levelValue: requireElement(root, "#level-value"),
    statusValue: requireElement(root, "#game-status"),
    holdPanel: requireElement(root, "#hold-panel"),
    holdState: requireElement(root, "#hold-state"),
    holdEmpty: requireElement(root, "#hold-empty"),
    overlay: requireElement(root, "#game-overlay"),
    overlayEyebrow: requireElement(root, "#overlay-eyebrow"),
    overlayTitle: requireElement(root, "#overlay-title"),
    overlayDescription: requireElement(root, "#overlay-description"),
    primaryButton: requireElement(root, "#primary-action"),
    pauseButton: requireElement(root, "#pause-action"),
    restartButton: requireElement(root, "#restart-action"),
    announcer: requireElement(root, "#status-announcer"),
  };
}

export function showFatalError(root: HTMLElement, error: unknown): void {
  const detail = error instanceof Error ? error.message : "알 수 없는 초기화 오류";
  root.innerHTML = `
    <main class="fatal-error" role="alert">
      <p class="eyebrow">INITIALIZATION ERROR</p>
      <h1>게임 화면을 열 수 없습니다</h1>
      <p>그래픽 환경을 다시 준비하려면 페이지를 새로고침하세요.</p>
      <code>${detail.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</code>
      <button id="reload-application" class="button button--primary" type="button">새로고침</button>
    </main>
  `;
  requireElement<HTMLButtonElement>(root, "#reload-application").addEventListener("click", () => location.reload());
}

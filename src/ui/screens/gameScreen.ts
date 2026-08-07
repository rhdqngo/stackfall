import { icon } from "../icons";

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`필수 Game UI 요소를 찾을 수 없습니다: ${selector}`);
  return element;
}

export interface GameScreenRefs {
  root: HTMLElement;
  playSurface: HTMLElement;
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
  boardFrame: HTMLElement;
  feedbackChip: HTMLElement;
  pauseButton: HTMLButtonElement;
  pauseOverlay: HTMLElement;
  pauseEyebrow: HTMLElement;
  pauseTitle: HTMLElement;
  pauseDescription: HTMLElement;
  pauseContinue: HTMLButtonElement;
  pauseRestart: HTMLButtonElement;
  pauseHome: HTMLButtonElement;
  pauseSettings: HTMLButtonElement;
  pauseControls: HTMLButtonElement;
  touchControls: HTMLElement;
}

export function createGameScreen(): GameScreenRefs {
  const root = document.createElement("section");
  root.id = "game-screen";
  root.className = "app-screen game-screen";
  root.dataset.screen = "game";
  root.setAttribute("aria-labelledby", "game-screen-title");
  root.hidden = true;
  root.inert = true;
  root.innerHTML = `
    <div id="game-play-surface" class="game-play-surface">
      <header class="game-header">
        <div class="game-wordmark">
          <h1 id="game-screen-title">STACKFALL</h1>
        </div>
        <section class="cabinet-scoreboard" aria-label="현재 기록">
          <dl class="stats-list">
            <div class="stat stat--score"><dt>점수</dt><dd id="score-value">0</dd></div>
            <div class="stat stat--best"><dt>최고</dt><dd id="best-value">0</dd></div>
            <div class="stat"><dt>라인</dt><dd id="lines-value">0</dd></div>
            <div class="stat"><dt>레벨</dt><dd id="level-value">1</dd></div>
          </dl>
        </section>
        <button id="pause-action" class="icon-button game-pause-action" type="button">
          ${icon("pause")}<span>일시정지</span>
        </button>
      </header>

      <main class="game-layout" aria-label="Stackfall 게임">
        <section id="hold-panel" class="hud-card preview-panel hold-panel" aria-labelledby="hold-title">
          <div class="panel-heading"><h2 id="hold-title">홀드</h2><span id="hold-state" class="panel-state">사용 가능</span></div>
          <div class="preview-frame">
            <canvas id="hold-preview" aria-label="홀드 블록 미리보기"></canvas>
            <p id="hold-empty" class="empty-preview">비어 있음</p>
          </div>
          <p class="panel-hint"><kbd>C</kbd><span>또는</span><kbd>Shift</kbd></p>
        </section>

        <section class="board-section" aria-label="게임 보드">
          <div class="feed-gate feed-gate--board" aria-hidden="true"><span></span></div>
          <div id="board-frame" class="board-frame">
            <canvas id="game-board" tabindex="0" aria-label="10열 20행 Stackfall 게임 보드" aria-describedby="game-instructions"></canvas>
          </div>
          <div class="status-rail">
            <span class="status-label">현재 상태</span>
            <strong id="game-status" data-status="running">진행 중</strong>
            <span id="feedback-chip" class="feedback-chip" aria-hidden="true" hidden></span>
          </div>
        </section>

        <section class="hud-card next-panel" aria-labelledby="next-title">
          <div class="panel-heading"><h2 id="next-title">다음</h2><span class="panel-state">3개</span></div>
          <ol class="next-list">
            <li class="next-item next-item--primary"><span class="queue-index">1</span><canvas class="next-preview" aria-label="다음 블록 1"></canvas></li>
            <li class="next-item"><span class="queue-index">2</span><canvas class="next-preview" aria-label="다음 블록 2"></canvas></li>
            <li class="next-item"><span class="queue-index">3</span><canvas class="next-preview" aria-label="다음 블록 3"></canvas></li>
          </ol>
        </section>
      </main>

      <section id="touch-controls" class="touch-controls" aria-label="터치 게임 조작">
        <div class="touch-cluster" aria-label="이동과 홀드">
          <button type="button" data-touch-action="left" aria-label="왼쪽으로 이동"><span aria-hidden="true">←</span></button>
          <button type="button" data-touch-action="right" aria-label="오른쪽으로 이동"><span aria-hidden="true">→</span></button>
          <button type="button" data-touch-action="down" aria-label="소프트 드롭"><span aria-hidden="true">↓</span></button>
          <button type="button" data-touch-action="hold">홀드</button>
        </div>
        <div class="touch-cluster touch-cluster--actions" aria-label="회전과 하드 드롭">
          <button type="button" data-touch-action="rotateLeft" aria-label="왼쪽으로 회전"><span aria-hidden="true">↺</span></button>
          <button type="button" data-touch-action="rotateRight" aria-label="오른쪽으로 회전"><span aria-hidden="true">↻</span></button>
          <button class="touch-hard-drop" type="button" data-touch-action="hardDrop">하드 드롭</button>
        </div>
      </section>
      <p id="game-instructions" class="sr-only">방향키로 이동하고 Z와 X로 회전합니다. Space로 하드 드롭하고 C로 홀드합니다. P 또는 Escape로 일시정지합니다.</p>
    </div>

    <div id="pause-overlay" class="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" aria-describedby="pause-description" hidden>
      <div class="pause-panel">
        <span id="pause-eyebrow" class="overlay-eyebrow">사용자 일시정지</span>
        <h2 id="pause-title">일시정지</h2>
        <p id="pause-description">준비되면 같은 흐름으로 돌아갑니다.</p>
        <button id="pause-continue-action" class="button button--primary" type="button">계속하기</button>
        <div class="pause-secondary-actions">
          <button id="pause-restart-action" class="button" type="button">${icon("restart")}<span>다시 시작</span></button>
          <button id="pause-home-action" class="button" type="button">${icon("home")}<span>홈으로</span></button>
        </div>
        <div class="pause-utility-actions">
          <button id="pause-controls-action" type="button">조작 도움말</button>
          <button id="pause-settings-action" type="button">설정</button>
        </div>
      </div>
    </div>
  `;

  return {
    root,
    playSurface: requireElement(root, "#game-play-surface"),
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
    boardFrame: requireElement(root, "#board-frame"),
    feedbackChip: requireElement(root, "#feedback-chip"),
    pauseButton: requireElement(root, "#pause-action"),
    pauseOverlay: requireElement(root, "#pause-overlay"),
    pauseEyebrow: requireElement(root, "#pause-eyebrow"),
    pauseTitle: requireElement(root, "#pause-title"),
    pauseDescription: requireElement(root, "#pause-description"),
    pauseContinue: requireElement(root, "#pause-continue-action"),
    pauseRestart: requireElement(root, "#pause-restart-action"),
    pauseHome: requireElement(root, "#pause-home-action"),
    pauseSettings: requireElement(root, "#pause-settings-action"),
    pauseControls: requireElement(root, "#pause-controls-action"),
    touchControls: requireElement(root, "#touch-controls"),
  };
}

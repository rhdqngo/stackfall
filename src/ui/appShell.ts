import type { AppScreen } from "../app/uiState";
import { createGameScreen, type GameScreenRefs } from "./screens/gameScreen";
import { createHomeScreen, type HomeScreenRefs } from "./screens/homeScreen";
import { createResultScreen, type ResultScreenRefs } from "./screens/resultScreen";

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`필수 앱 UI 요소를 찾을 수 없습니다: ${selector}`);
  return element;
}

export interface DialogRefs {
  settingsDialog: HTMLDialogElement;
  controlsDialog: HTMLDialogElement;
  restartDialog: HTMLDialogElement;
  leaveRunDialog: HTMLDialogElement;
  settingsClose: HTMLButtonElement;
  controlsClose: HTMLButtonElement;
  restartCancel: HTMLButtonElement;
  restartConfirm: HTMLButtonElement;
  leaveRunCancel: HTMLButtonElement;
  leaveRunConfirm: HTMLButtonElement;
}

export interface AppShellRefs {
  root: HTMLElement;
  shell: HTMLElement;
  screenHost: HTMLElement;
  home: HomeScreenRefs;
  game: GameScreenRefs;
  result: ResultScreenRefs;
  dialogs: DialogRefs;
  toast: HTMLElement;
  viewportNotice: HTMLElement;
  viewportMessage: HTMLElement;
  viewportHome: HTMLButtonElement;
  announcer: HTMLElement;
}

function globalLayers(): string {
  return `
    <dialog id="controls-dialog" class="modal-dialog" aria-labelledby="controls-dialog-title">
      <div class="dialog-heading">
        <div><span class="dialog-kicker">CONTROL MAP</span><h2 id="controls-dialog-title">조작 도움말</h2></div>
        <button id="controls-close" class="dialog-close" type="button" aria-label="조작 도움말 닫기">×</button>
      </div>
      <div class="control-guide-grid">
        <div><kbd>←</kbd><kbd>→</kbd><span>좌우 이동</span></div>
        <div><kbd>↓</kbd><span>소프트 드롭</span></div>
        <div><kbd>Space</kbd><span>하드 드롭</span></div>
        <div><kbd>Z</kbd><kbd>X</kbd><span>회전</span></div>
        <div><kbd>C</kbd><kbd>Shift</kbd><span>홀드</span></div>
        <div><kbd>P</kbd><kbd>Esc</kbd><span>일시정지</span></div>
      </div>
    </dialog>

    <dialog id="settings-dialog" class="modal-dialog" aria-labelledby="settings-dialog-title">
      <div class="dialog-heading">
        <div><span class="dialog-kicker">DISPLAY SYSTEM</span><h2 id="settings-dialog-title">화면 설정</h2></div>
        <button id="settings-close" class="dialog-close" type="button" aria-label="설정 닫기">×</button>
      </div>
      <form class="settings-form">
        <fieldset><legend>모션</legend>
          <label><input type="radio" name="motion" value="system" /> 시스템 설정</label>
          <label><input type="radio" name="motion" value="reduced" /> 모션 줄이기</label>
        </fieldset>
        <fieldset><legend>보드 대비</legend>
          <label><input type="radio" name="boardContrast" value="standard" /> 기본</label>
          <label><input type="radio" name="boardContrast" value="high" /> 높게</label>
        </fieldset>
        <fieldset><legend>터치 컨트롤</legend>
          <label><input type="radio" name="touchControls" value="auto" /> 기기에 맞춤</label>
          <label><input type="radio" name="touchControls" value="on" /> 항상 표시</label>
          <label><input type="radio" name="touchControls" value="off" /> 숨기기</label>
        </fieldset>
      </form>
    </dialog>

    <dialog id="restart-dialog" class="modal-dialog modal-dialog--compact" aria-labelledby="restart-dialog-title">
      <span class="dialog-kicker">RESET CURRENT RUN</span>
      <h2 id="restart-dialog-title">현재 게임을 다시 시작할까요?</h2>
      <p>점수와 쌓인 블록이 초기화됩니다.</p>
      <div class="dialog-actions">
        <button id="restart-cancel" class="button" type="button">취소</button>
        <button id="restart-confirm" class="button button--danger" type="button">다시 시작</button>
      </div>
    </dialog>

    <dialog id="leave-run-dialog" class="modal-dialog modal-dialog--compact" aria-labelledby="leave-run-dialog-title">
      <span class="dialog-kicker">LEAVE CURRENT RUN</span>
      <h2 id="leave-run-dialog-title">현재 게임을 끝내고 홈으로 이동할까요?</h2>
      <p>점수와 쌓인 블록은 저장되지 않습니다.</p>
      <div class="dialog-actions">
        <button id="leave-run-cancel" class="button button--primary" type="button">게임 계속</button>
        <button id="leave-run-confirm" class="button button--danger" type="button">홈으로 이동</button>
      </div>
    </dialog>

    <div id="viewport-notice" class="viewport-notice" role="alertdialog" aria-modal="true" aria-labelledby="viewport-notice-title" tabindex="-1" hidden>
      <span class="dialog-kicker">VIEWPORT LIMITED</span>
      <strong id="viewport-notice-title">화면 공간이 부족합니다</strong>
      <p id="viewport-notice-message">기기를 세로로 돌리거나 브라우저 높이를 늘린 뒤 계속하세요.</p>
      <button id="viewport-home-action" class="button" type="button">홈으로</button>
    </div>
    <div id="status-toast" class="status-toast" role="status" aria-live="polite" hidden></div>
    <div id="status-announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  `;
}

export function createAppShell(root: HTMLElement): AppShellRefs {
  root.innerHTML = `<div class="app-shell"><div id="screen-host" class="screen-host"></div>${globalLayers()}</div>`;
  const shell = requireElement<HTMLElement>(root, ".app-shell");
  const screenHost = requireElement<HTMLElement>(root, "#screen-host");
  const home = createHomeScreen();
  const game = createGameScreen();
  const result = createResultScreen();
  screenHost.append(home.root, game.root, result.root);

  return {
    root,
    shell,
    screenHost,
    home,
    game,
    result,
    dialogs: {
      settingsDialog: requireElement(root, "#settings-dialog"),
      controlsDialog: requireElement(root, "#controls-dialog"),
      restartDialog: requireElement(root, "#restart-dialog"),
      leaveRunDialog: requireElement(root, "#leave-run-dialog"),
      settingsClose: requireElement(root, "#settings-close"),
      controlsClose: requireElement(root, "#controls-close"),
      restartCancel: requireElement(root, "#restart-cancel"),
      restartConfirm: requireElement(root, "#restart-confirm"),
      leaveRunCancel: requireElement(root, "#leave-run-cancel"),
      leaveRunConfirm: requireElement(root, "#leave-run-confirm"),
    },
    toast: requireElement(root, "#status-toast"),
    viewportNotice: requireElement(root, "#viewport-notice"),
    viewportMessage: requireElement(root, "#viewport-notice-message"),
    viewportHome: requireElement(root, "#viewport-home-action"),
    announcer: requireElement(root, "#status-announcer"),
  };
}

export function showScreen(refs: AppShellRefs, screen: AppScreen): void {
  for (const candidate of [refs.home.root, refs.game.root, refs.result.root]) {
    const active = candidate.dataset.screen === screen;
    candidate.hidden = !active;
    candidate.inert = !active;
  }
  refs.shell.dataset.activeScreen = screen;
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

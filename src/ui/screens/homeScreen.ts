import { icon } from "../icons";

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`필수 Home UI 요소를 찾을 수 없습니다: ${selector}`);
  return element;
}

export interface HomeScreenRefs {
  root: HTMLElement;
  startButton: HTMLButtonElement;
  settingsButton: HTMLButtonElement;
  controlsButton: HTMLButtonElement;
  bestValue: HTMLElement;
  inputHint: HTMLElement;
}

export function createHomeScreen(): HomeScreenRefs {
  const root = document.createElement("section");
  root.id = "home-screen";
  root.className = "app-screen home-screen";
  root.dataset.screen = "home";
  root.setAttribute("aria-labelledby", "home-title");
  root.innerHTML = `
    <header class="home-header">
      <div class="brand-block brand-block--hero">
        <h1 id="home-title">STACKFALL</h1>
      </div>
      <nav class="screen-utilities" aria-label="홈 메뉴">
        <button id="home-controls-action" class="icon-button" type="button">${icon("help")}<span>조작 도움말</span></button>
        <button id="home-settings-action" class="icon-button" type="button">${icon("settings")}<span>설정</span></button>
      </nav>
    </header>
    <main class="home-stage">
      <div class="attract-preview" aria-hidden="true">
        <div class="attract-well">
          <div class="attract-piece attract-piece--falling">
            <i></i><i></i><i></i><i></i>
          </div>
          <div class="attract-stack">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
      </div>
      <div class="home-intro">
        <p>블록을 쌓아 가로줄을 완성하세요.</p>
        <button id="home-start-action" class="button button--primary home-start" type="button">게임 시작</button>
        <div class="home-meta">
          <aside class="home-best" aria-label="최고 점수">
            <span>최고 점수</span>
            <strong id="home-best-value">0</strong>
          </aside>
          <p id="home-input-hint" class="home-input-hint"><kbd>Enter</kbd> 키로 시작</p>
        </div>
      </div>
    </main>
  `;

  return {
    root,
    startButton: requireElement(root, "#home-start-action"),
    settingsButton: requireElement(root, "#home-settings-action"),
    controlsButton: requireElement(root, "#home-controls-action"),
    bestValue: requireElement(root, "#home-best-value"),
    inputHint: requireElement(root, "#home-input-hint"),
  };
}

export class HomeScreenView {
  private readonly numberFormat = new Intl.NumberFormat("ko-KR");

  constructor(private readonly refs: HomeScreenRefs) {}

  render(highScore: number): void {
    this.refs.bestValue.textContent = this.numberFormat.format(highScore);
  }

  focusPrimary(): void {
    this.refs.startButton.focus();
  }
}

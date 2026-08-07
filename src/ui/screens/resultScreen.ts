import type { RunResult } from "../../app/uiState";

function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`필수 Result UI 요소를 찾을 수 없습니다: ${selector}`);
  return element;
}

export interface ResultScreenRefs {
  root: HTMLElement;
  eyebrow: HTMLElement;
  scoreValue: HTMLElement;
  linesValue: HTMLElement;
  levelValue: HTMLElement;
  bestValue: HTMLElement;
  retryButton: HTMLButtonElement;
  homeButton: HTMLButtonElement;
}

export function createResultScreen(): ResultScreenRefs {
  const root = document.createElement("section");
  root.id = "result-screen";
  root.className = "app-screen result-screen";
  root.dataset.screen = "result";
  root.setAttribute("aria-labelledby", "result-title");
  root.hidden = true;
  root.inert = true;
  root.innerHTML = `
    <header class="result-header">
      <span class="result-brand">STACKFALL</span>
    </header>
    <main class="result-stage">
      <div class="result-summary">
        <p id="result-eyebrow" class="result-outcome">플레이 종료</p>
        <h1 id="result-title">게임 결과</h1>
        <div class="result-score">
          <span>최종 점수</span>
          <strong id="result-score-value">0</strong>
        </div>
        <dl class="result-stats">
          <div><dt>라인</dt><dd id="result-lines-value">0</dd></div>
          <div><dt>레벨</dt><dd id="result-level-value">1</dd></div>
          <div><dt>최고 점수</dt><dd id="result-best-value">0</dd></div>
        </dl>
        <div class="result-actions">
          <button id="result-retry-action" class="button button--primary" type="button">다시 도전</button>
          <button id="result-home-action" class="button" type="button">홈으로</button>
        </div>
      </div>
    </main>
  `;

  return {
    root,
    eyebrow: requireElement(root, "#result-eyebrow"),
    scoreValue: requireElement(root, "#result-score-value"),
    linesValue: requireElement(root, "#result-lines-value"),
    levelValue: requireElement(root, "#result-level-value"),
    bestValue: requireElement(root, "#result-best-value"),
    retryButton: requireElement(root, "#result-retry-action"),
    homeButton: requireElement(root, "#result-home-action"),
  };
}

export class ResultScreenView {
  private readonly numberFormat = new Intl.NumberFormat("ko-KR");

  constructor(private readonly refs: ResultScreenRefs) {}

  render(result: RunResult): void {
    this.refs.eyebrow.textContent = result.isNewBest ? "최고 기록 갱신" : "플레이 종료";
    this.refs.scoreValue.textContent = this.numberFormat.format(result.score);
    this.refs.linesValue.textContent = String(result.lines);
    this.refs.levelValue.textContent = String(result.level);
    this.refs.bestValue.textContent = this.numberFormat.format(result.bestScore);
    this.refs.root.dataset.newBest = String(result.isNewBest);
  }

  focusPrimary(): void {
    this.refs.retryButton.focus();
  }
}

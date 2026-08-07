import { advanceGame, applyCommand, createGame } from "../game/engine";
import type { GameState, InputCommand } from "../game/types";
import { InputController } from "../platform/input";
import { createProfile, loadProfile, saveProfile, type StorageLike } from "../platform/storage";
import { renderBoard } from "../render/canvasRenderer";
import { readCanvasTheme, type CanvasTheme } from "../render/canvasTheme";
import { StatusAnnouncer } from "../ui/announcer";
import { getOverlayCopy } from "../ui/copy";
import { DialogController } from "../ui/dialogs";
import { deriveFeedback, FeedbackController } from "../ui/feedback";
import type { GameShellRefs } from "../ui/gameShell";
import { GameHud } from "../ui/hud";
import { TouchControls } from "../ui/touchControls";
import type { PauseReason, UiPreferences, UiState } from "./uiState";

const FIXED_STEP_MS = 1000 / 60;
const MAX_FRAME_DELTA_MS = 100;

function createSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

function getBrowserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class StackfallApp {
  private state: GameState = createGame({ seed: createSeed() });
  private readonly input = new InputController((command) => this.dispatch(command));
  private readonly hud: GameHud;
  private readonly announcer: StatusAnnouncer;
  private readonly dialogs: DialogController;
  private readonly feedback: FeedbackController;
  private readonly storage = getBrowserStorage();
  private readonly uiState: UiState;
  private theme: CanvasTheme;
  private renderedBoard: Pick<GameState, "board" | "active"> | null = null;
  private renderedStatus: GameState["status"] | null = null;
  private renderedOverlayKey = "";
  private lastFrame = performance.now();
  private accumulator = 0;
  private toastTimeout: number | null = null;
  private newBest = false;
  private viewportBlocked = false;
  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly refs: GameShellRefs) {
    const canvases = [refs.boardCanvas, refs.holdCanvas, ...refs.nextCanvases];
    if (canvases.some((canvas) => canvas.getContext("2d") === null)) {
      throw new Error("이 브라우저에서 Canvas 2D를 초기화할 수 없습니다.");
    }

    const loaded = loadProfile(this.storage);
    this.uiState = {
      modal: "none",
      pauseReason: null,
      highScore: loaded.profile.highScore,
      preferences: loaded.profile.preferences,
      storageRecovered: loaded.recovered,
    };
    this.applyPreferences();
    this.theme = readCanvasTheme();
    this.hud = new GameHud(refs);
    this.announcer = new StatusAnnouncer(refs.announcer);
    this.feedback = new FeedbackController(refs.boardFrame, refs.holdPanel, refs.feedbackChip);
    this.dialogs = new DialogController(refs, {
      onRestartConfirm: () => this.confirmRestart(),
      onRestartCancel: () => this.finishDialog(),
      onPreferencesChange: (preferences) => this.updatePreferences(preferences),
      onDialogClose: () => this.finishDialog(),
    });
    new TouchControls(refs.touchControls, this.input);
    this.resizeObserver = new ResizeObserver(() => {
      this.checkViewport();
      this.render(true);
    });
    canvases.forEach((canvas) => this.resizeObserver.observe(canvas));
  }

  start(): void {
    this.input.attach();
    this.refs.primaryButton.addEventListener("click", () => this.handlePrimaryAction());
    this.refs.pauseButton.addEventListener("click", () => this.togglePause());
    this.refs.restartButton.addEventListener("click", () => this.requestRestart());
    this.refs.settingsButton.addEventListener("click", () => this.openSettings());
    this.refs.controlsButton.addEventListener("click", () => this.openControls());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseFromInterruption();
    });
    window.addEventListener("blur", () => this.pauseFromInterruption());
    window.addEventListener("pagehide", () => this.persistProfile());
    this.render(true);
    this.checkViewport();
    if (this.uiState.storageRecovered) {
      this.showToast("저장된 설정을 읽지 못해 기본값으로 복구했습니다.");
    }
    requestAnimationFrame(this.frame);
  }

  private frame = (timestamp: number): void => {
    const delta = Math.min(MAX_FRAME_DELTA_MS, Math.max(0, timestamp - this.lastFrame));
    this.lastFrame = timestamp;
    this.input.update(timestamp);
    this.accumulator += delta;

    while (this.accumulator >= FIXED_STEP_MS) {
      this.setState(advanceGame(this.state, FIXED_STEP_MS));
      this.accumulator -= FIXED_STEP_MS;
    }

    this.render();
    requestAnimationFrame(this.frame);
  };

  private dispatch(command: InputCommand): void {
    if (command.type === "restart") {
      this.requestRestart();
      return;
    }
    if (command.type === "pause") {
      this.togglePause();
      return;
    }
    if (command.type === "start" && this.state.status === "gameOver") {
      this.restart();
      return;
    }

    this.setState(applyCommand(this.state, command), command);
    if (command.type === "start") {
      this.uiState.pauseReason = null;
      this.refs.boardCanvas.focus();
    }
    this.render();
  }

  private setState(next: GameState, command?: InputCommand): void {
    const previous = this.state;
    this.feedback.play(deriveFeedback(previous, next, command));
    if (next === previous) return;
    const previousHighScore = this.uiState.highScore;
    this.state = next;

    if (next.score > this.uiState.highScore) this.uiState.highScore = next.score;
    const announcements: string[] = [];
    if (next.lines > previous.lines) {
      const cleared = next.lines - previous.lines;
      announcements.push(`${cleared}줄 제거, 점수 ${next.score}점`);
    }
    if (next.level > previous.level) announcements.push(`레벨 ${next.level}`);
    if (previous.status === "paused" && next.status === "running") announcements.push("게임 재개");
    if (previous.status === "running" && next.status === "paused") announcements.push("게임 일시정지");
    if (previous.status !== "gameOver" && next.status === "gameOver") {
      this.newBest = next.score > previousHighScore;
      announcements.push(`게임 오버, 최종 점수 ${next.score}점`);
      this.persistProfile();
    }
    if (announcements.length > 0) this.announcer.announce(announcements.join(". "));
  }

  private handlePrimaryAction(): void {
    if (this.state.status === "gameOver") {
      this.restart();
      return;
    }
    this.dispatch({ type: "start" });
  }

  private togglePause(): void {
    const wasPaused = this.state.status === "paused";
    const next = applyCommand(this.state, { type: "pause" });
    this.setState(next);
    if (next.status === "paused") this.uiState.pauseReason = "user";
    if (wasPaused && next.status === "running") {
      this.uiState.pauseReason = null;
      this.refs.boardCanvas.focus();
    }
    this.render();
  }

  private requestRestart(): void {
    if (this.state.status === "ready" || this.state.status === "gameOver") {
      this.restart();
      return;
    }
    this.pauseForModal("restart");
    this.uiState.modal = "restartConfirm";
    this.input.setContext("modal");
    this.dialogs.openRestartConfirm();
  }

  private confirmRestart(): void {
    this.uiState.modal = "none";
    this.input.setContext("gameplay");
    this.restart();
  }

  private restart(): void {
    this.newBest = false;
    this.setState(applyCommand(this.state, { type: "restart", seed: createSeed() }));
    this.setState(applyCommand(this.state, { type: "start" }));
    this.uiState.pauseReason = null;
    this.input.clear();
    this.accumulator = 0;
    this.refs.boardCanvas.focus();
    this.render(true);
  }

  private openSettings(): void {
    this.pauseForModal("settings");
    this.uiState.modal = "settings";
    this.input.setContext("modal");
    this.dialogs.openSettings(this.uiState.preferences);
  }

  private openControls(): void {
    this.pauseForModal("settings");
    this.uiState.modal = "controls";
    this.input.setContext("modal");
    this.dialogs.openControls();
  }

  private pauseForModal(reason: PauseReason): void {
    this.input.clear();
    if (this.state.status === "running") this.setState(applyCommand(this.state, { type: "pause" }));
    if (this.state.status === "paused") this.uiState.pauseReason = reason;
    this.render();
  }

  private finishDialog(): void {
    this.uiState.modal = "none";
    this.input.setContext("gameplay");
    if (this.state.status === "paused") this.uiState.pauseReason ??= "user";
    this.render();
    requestAnimationFrame(() => {
      if (this.state.status === "running") this.refs.boardCanvas.focus();
      else this.refs.primaryButton.focus();
    });
  }

  private pauseFromInterruption(): void {
    this.input.clear();
    if (this.state.status === "running") {
      this.setState(applyCommand(this.state, { type: "pause" }));
      this.uiState.pauseReason = "interruption";
      this.render();
    }
  }

  private updatePreferences(preferences: UiPreferences): void {
    const contrastChanged = preferences.boardContrast !== this.uiState.preferences.boardContrast;
    this.uiState.preferences = preferences;
    this.applyPreferences();
    this.persistProfile();
    if (contrastChanged) {
      this.theme = readCanvasTheme();
      this.renderedBoard = null;
      this.render(true);
    }
  }

  private applyPreferences(): void {
    document.documentElement.dataset.contrast = this.uiState.preferences.boardContrast;
    document.documentElement.dataset.motion = this.uiState.preferences.motion;
    document.documentElement.dataset.touchControls = this.uiState.preferences.touchControls;
    this.input.clear();
    requestAnimationFrame(() => this.checkViewport());
  }

  private checkViewport(): void {
    const mobileLayout = window.innerWidth < 740;
    const touchVisible = getComputedStyle(this.refs.touchControls).display !== "none";
    const horizontalReserve = mobileLayout ? 148 : 440;
    const verticalReserve = touchVisible ? 260 : 180;
    const rawCell = Math.min(
      (window.innerWidth - horizontalReserve) / 10,
      (window.innerHeight - verticalReserve) / 20,
    );
    const blocked = rawCell < 18;
    if (blocked === this.viewportBlocked) return;
    this.viewportBlocked = blocked;
    this.refs.viewportNotice.hidden = !blocked;
    if (blocked) {
      this.pauseFromInterruption();
      this.input.setContext("modal");
    } else if (this.uiState.modal === "none") {
      this.input.setContext("gameplay");
      if (this.state.status !== "running") this.refs.primaryButton.focus();
    }
  }

  private persistProfile(): void {
    saveProfile(this.storage, createProfile(this.uiState.highScore, this.uiState.preferences));
  }

  private showToast(message: string): void {
    if (this.toastTimeout !== null) window.clearTimeout(this.toastTimeout);
    this.refs.toast.textContent = message;
    this.refs.toast.hidden = false;
    this.toastTimeout = window.setTimeout(() => {
      this.refs.toast.hidden = true;
      this.toastTimeout = null;
    }, 4000);
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

    this.hud.render(this.state, Math.max(this.uiState.highScore, this.state.score), this.theme, force);
    const copy = getOverlayCopy(this.state.status, this.state.score, this.uiState.pauseReason);
    const isRunning = copy === null;
    const overlayKey = `${this.state.status}:${this.uiState.pauseReason}:${this.newBest}`;
    if (force || overlayKey !== this.renderedOverlayKey) {
      this.refs.overlay.hidden = isRunning;
      this.refs.pauseButton.disabled = this.state.status === "ready" || this.state.status === "gameOver";
      this.refs.pauseButton.classList.toggle("is-active", this.state.status === "paused");
      this.refs.pauseButton.querySelector("span")!.textContent = this.state.status === "paused" ? "계속하기" : "일시정지";

      if (copy) {
        this.refs.overlayEyebrow.textContent = this.newBest && this.state.status === "gameOver" ? "NEW BEST" : copy.eyebrow;
        this.refs.overlayTitle.textContent = copy.title;
        this.refs.overlayDescription.textContent = this.newBest && this.state.status === "gameOver"
          ? `${copy.description} · 새로운 최고 기록`
          : copy.description;
        this.refs.primaryButton.textContent = copy.action;
      }
      this.renderedOverlayKey = overlayKey;
    }

    if (this.renderedStatus !== this.state.status && !isRunning && this.uiState.modal === "none") {
      requestAnimationFrame(() => this.refs.primaryButton.focus());
    }
    this.renderedStatus = this.state.status;
  }
}

import { advanceGame, applyCommand, createGame } from "../game/engine";
import type { GameState, InputCommand } from "../game/types";
import { InputController } from "../platform/input";
import { createProfile, loadProfile, saveProfile, type StorageLike } from "../platform/storage";
import { renderBoard } from "../render/canvasRenderer";
import { readCanvasTheme, type CanvasTheme } from "../render/canvasTheme";
import { StatusAnnouncer } from "../ui/announcer";
import { type AppShellRefs, showScreen } from "../ui/appShell";
import { getPauseCopy } from "../ui/copy";
import { DialogController } from "../ui/dialogs";
import { deriveFeedback, FeedbackController } from "../ui/feedback";
import { GameHud } from "../ui/hud";
import { HomeScreenView } from "../ui/screens/homeScreen";
import { ResultScreenView } from "../ui/screens/resultScreen";
import { TouchControls } from "../ui/touchControls";
import { createDevFixture } from "./devFixtures";
import { NavigationController, screenFromHash, type StackfallHistoryEntry } from "./navigation";
import type {
  AppScreen,
  RunPresentationState,
  RunResult,
  UiModal,
  UiPreferences,
  UiState,
} from "./uiState";

const FIXED_STEP_MS = 1000 / 60;
const MAX_FRAME_DELTA_MS = 100;

function createSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

interface InitialScenario {
  state: GameState;
  screen: AppScreen;
  runResult: RunResult | null;
  invalidDirectRoute: boolean;
}

function createInitialScenario(savedHighScore: number): InitialScenario {
  const params = new URLSearchParams(location.search);
  const fixture = import.meta.env.DEV ? params.get("fixture") : null;
  const initial = createGame({ seed: fixture ? 73 : createSeed() });
  const state = fixture ? createDevFixture(fixture, initial) : initial;

  if (fixture === "game-over") {
    const bestScore = Math.max(savedHighScore, state.score);
    return {
      state,
      screen: "result",
      runResult: {
        score: state.score,
        lines: state.lines,
        level: state.level,
        bestScore,
        isNewBest: state.score > savedHighScore,
      },
      invalidDirectRoute: false,
    };
  }
  if (fixture && fixture !== "ready") {
    return { state, screen: "game", runResult: null, invalidDirectRoute: false };
  }

  const requestedScreen = screenFromHash(location.hash);
  return {
    state,
    screen: "home",
    runResult: null,
    invalidDirectRoute: requestedScreen !== "home",
  };
}

function getBrowserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isActiveRun(state: GameState): boolean {
  return state.status === "running" || state.status === "paused";
}

export class StackfallApp {
  private state: GameState;
  private readonly input = new InputController((command) => this.dispatch(command));
  private readonly hud: GameHud;
  private readonly home: HomeScreenView;
  private readonly result: ResultScreenView;
  private readonly announcer: StatusAnnouncer;
  private readonly dialogs: DialogController;
  private readonly feedback: FeedbackController;
  private readonly touchControls: TouchControls;
  private readonly navigation: NavigationController;
  private readonly storage = getBrowserStorage();
  private readonly uiState: UiState;
  private readonly runState: RunPresentationState;
  private theme: CanvasTheme;
  private renderedBoard: Pick<GameState, "board" | "active"> | null = null;
  private renderedStatus: GameState["status"] | null = null;
  private renderedPauseKey = "";
  private lastFrame = performance.now();
  private accumulator = 0;
  private toastTimeout: number | null = null;
  private runSequence = 0;
  private viewportBlocked = false;
  private viewportBlockOrigin: AppScreen | null = null;
  private gameObserved = false;
  private dialogRestoreTarget: HTMLElement | null = null;
  private pendingDialogAction: (() => void) | null = null;
  private readonly devFreeze = import.meta.env.DEV && new URLSearchParams(location.search).has("freeze");
  private readonly resizeObserver: ResizeObserver;
  private readonly canvases: HTMLCanvasElement[];

  constructor(private readonly refs: AppShellRefs) {
    this.canvases = [refs.game.boardCanvas, refs.game.holdCanvas, ...refs.game.nextCanvases];
    if (this.canvases.some((canvas) => canvas.getContext("2d") === null)) {
      throw new Error("이 브라우저에서 Canvas 2D를 초기화할 수 없습니다.");
    }

    const loaded = loadProfile(this.storage);
    const scenario = createInitialScenario(loaded.profile.highScore);
    this.state = scenario.state;
    const highScore = Math.max(loaded.profile.highScore, scenario.runResult?.bestScore ?? 0);
    this.uiState = {
      screen: scenario.screen,
      modal: "none",
      pauseReason: scenario.screen === "game" && scenario.state.status === "paused" ? "user" : null,
      highScore,
      preferences: loaded.profile.preferences,
      storageRecovered: loaded.recovered,
    };
    this.runState = {
      token: scenario.screen === "home" ? null : ++this.runSequence,
      result: scenario.runResult,
    };

    this.applyPreferences();
    this.theme = readCanvasTheme();
    this.hud = new GameHud(refs.game);
    this.home = new HomeScreenView(refs.home);
    this.result = new ResultScreenView(refs.result);
    this.announcer = new StatusAnnouncer(refs.announcer);
    this.feedback = new FeedbackController(refs.game.boardFrame, refs.game.holdPanel, refs.game.feedbackChip);
    this.touchControls = new TouchControls(refs.game.touchControls, this.input);
    this.navigation = new NavigationController((entry) => this.handleNavigation(entry));
    this.dialogs = new DialogController(refs.dialogs, {
      onClose: (kind) => this.requestDialogClose(kind),
      onRestartConfirm: () => this.requestDialogClose("restartConfirm", () => this.startNewRun("replace")),
      onRestartCancel: () => this.requestDialogClose("restartConfirm"),
      onLeaveRunConfirm: () => this.confirmLeaveRun(),
      onLeaveRunCancel: () => this.cancelLeaveRun(),
      onPreferencesChange: (preferences) => this.updatePreferences(preferences),
    });
    this.resizeObserver = new ResizeObserver(() => {
      if (this.uiState.screen !== "game") return;
      this.checkViewport();
      this.renderGame(true);
    });

    this.navigation.initialize(this.uiState.screen, this.runState.token);
    if (scenario.invalidDirectRoute) {
      requestAnimationFrame(() => this.showToast("진행 중인 게임은 저장되지 않아 홈으로 이동했습니다."));
    }
  }

  start(): void {
    this.input.attach();
    this.bindScreenActions();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseFromInterruption();
    });
    window.addEventListener("blur", () => this.pauseFromInterruption());
    window.addEventListener("pagehide", () => this.persistProfile());
    window.addEventListener("beforeunload", (event) => {
      if (this.uiState.screen === "game" && isActiveRun(this.state)) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    window.addEventListener("resize", () => {
      if (this.viewportBlocked || this.uiState.screen === "game") this.checkViewport();
    });

    this.activateScreen(this.uiState.screen, false);
    if (this.uiState.storageRecovered) {
      this.showToast("저장된 설정을 읽지 못해 기본값으로 복구했습니다.");
    }
    this.focusScreenPrimary();
    requestAnimationFrame(this.frame);
  }

  private bindScreenActions(): void {
    this.refs.home.startButton.addEventListener("click", () => this.requestStartFromHome());
    this.refs.home.settingsButton.addEventListener("click", () => this.openSettings(this.refs.home.settingsButton));
    this.refs.home.controlsButton.addEventListener("click", () => this.openControls(this.refs.home.controlsButton));

    this.refs.game.pauseButton.addEventListener("click", () => this.togglePause());
    this.refs.game.pauseContinue.addEventListener("click", () => this.togglePause());
    this.refs.game.pauseRestart.addEventListener("click", () => this.requestRestart(this.refs.game.pauseRestart));
    this.refs.game.pauseHome.addEventListener("click", () => this.requestLeaveThroughHistory());
    this.refs.game.pauseSettings.addEventListener("click", () => this.openSettings(this.refs.game.pauseSettings));
    this.refs.game.pauseControls.addEventListener("click", () => this.openControls(this.refs.game.pauseControls));
    this.refs.game.pauseOverlay.addEventListener("keydown", (event) => {
      if ((event.code === "Escape" || event.code === "KeyP") && this.uiState.modal === "none") {
        event.preventDefault();
        this.togglePause();
      }
    });

    this.refs.result.retryButton.addEventListener("click", () => this.startNewRun("replace"));
    this.refs.result.homeButton.addEventListener("click", () => this.goHomeFromResult());
    this.refs.viewportHome.addEventListener("click", () => this.leaveViewportNotice());
  }

  private frame = (timestamp: number): void => {
    const delta = Math.min(MAX_FRAME_DELTA_MS, Math.max(0, timestamp - this.lastFrame));
    this.lastFrame = timestamp;
    const gameInteractive = this.uiState.screen === "game" && this.uiState.modal === "none" && !this.viewportBlocked;

    if (gameInteractive) this.input.update(timestamp);
    if (this.uiState.screen === "game") {
      this.accumulator += delta;
      if (this.devFreeze) {
        this.accumulator = 0;
      } else {
        while (this.accumulator >= FIXED_STEP_MS) {
          this.setState(advanceGame(this.state, FIXED_STEP_MS));
          this.accumulator -= FIXED_STEP_MS;
          if (this.uiState.screen !== "game") break;
        }
      }
      if (this.uiState.screen === "game") this.renderGame();
    } else {
      this.accumulator = 0;
    }
    requestAnimationFrame(this.frame);
  };

  private dispatch(command: InputCommand): void {
    if (this.uiState.screen !== "game" || this.uiState.modal !== "none" || this.viewportBlocked) return;
    if (command.type === "restart") {
      this.requestRestart(this.refs.game.pauseRestart);
      return;
    }
    if (command.type === "pause") {
      this.togglePause();
      return;
    }
    if (command.type === "start" && this.state.status === "paused") {
      this.togglePause();
      return;
    }

    this.setState(applyCommand(this.state, command), command);
    if (this.uiState.screen === "game") this.renderGame();
  }

  private setState(next: GameState, command?: InputCommand): void {
    const previous = this.state;
    if (this.uiState.screen === "game") this.feedback.play(deriveFeedback(previous, next, command));
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
      announcements.push(`게임 오버, 최종 점수 ${next.score}점`);
      this.finalizeRun(previousHighScore);
    }
    if (announcements.length > 0) this.announcer.announce(announcements.join(". "));
  }

  private requestStartFromHome(): void {
    if (!this.viewportCanFitGame()) {
      this.showViewportNotice("home");
      return;
    }
    this.startNewRun("push");
  }

  private startNewRun(historyMode: "push" | "replace"): void {
    const fresh = applyCommand(this.state, { type: "restart", seed: createSeed() });
    this.state = applyCommand(fresh, { type: "start" });
    this.runState.token = ++this.runSequence;
    this.runState.result = null;
    this.uiState.pauseReason = null;
    this.renderedBoard = null;
    this.renderedStatus = null;
    this.renderedPauseKey = "";
    this.touchControls.reset();
    this.accumulator = 0;
    this.lastFrame = performance.now();
    if (historyMode === "push") this.navigation.push("game", this.runState.token);
    else this.navigation.replace("game", this.runState.token);
    this.activateScreen("game");
  }

  private finalizeRun(previousHighScore: number): void {
    const result: RunResult = {
      score: this.state.score,
      lines: this.state.lines,
      level: this.state.level,
      bestScore: this.uiState.highScore,
      isNewBest: this.state.score > previousHighScore,
    };
    this.runState.result = result;
    this.persistProfile();
    this.touchControls.reset();
    this.navigation.replace("result", this.runState.token);
    this.activateScreen("result");
  }

  private togglePause(): void {
    if (this.uiState.screen !== "game" || this.uiState.modal !== "none" || this.viewportBlocked) return;
    const wasPaused = this.state.status === "paused";
    const next = applyCommand(this.state, { type: "pause" });
    this.setState(next);
    if (next.status === "paused") {
      this.uiState.pauseReason = "user";
      this.touchControls.reset();
    }
    if (wasPaused && next.status === "running") {
      this.uiState.pauseReason = null;
      this.accumulator = 0;
      this.lastFrame = performance.now();
    }
    this.renderGame(true);
    if (next.status === "paused") this.refs.game.pauseContinue.focus();
    else this.refs.game.boardCanvas.focus();
  }

  private requestRestart(opener: HTMLElement): void {
    if (this.uiState.screen !== "game") return;
    if (this.state.status === "running") {
      this.setState(applyCommand(this.state, { type: "pause" }));
      this.uiState.pauseReason = "restart";
      this.renderGame(true);
    }
    this.openDialog("restartConfirm", opener, () => this.dialogs.openRestartConfirm());
  }

  private openSettings(opener: HTMLElement): void {
    this.pauseForContext("settings");
    this.openDialog("settings", opener, () => this.dialogs.openSettings(this.uiState.preferences));
  }

  private openControls(opener: HTMLElement): void {
    this.pauseForContext("controls");
    this.openDialog("controls", opener, () => this.dialogs.openControls());
  }

  private pauseForContext(reason: "settings" | "controls"): void {
    if (this.uiState.screen !== "game") return;
    this.touchControls.reset();
    if (this.state.status === "running") {
      this.setState(applyCommand(this.state, { type: "pause" }));
      this.uiState.pauseReason = reason;
    }
    this.renderGame(true);
  }

  private openDialog(
    kind: Exclude<UiModal, "none" | "leaveRunConfirm">,
    opener: HTMLElement,
    open: () => void,
  ): void {
    if (this.uiState.modal !== "none") return;
    this.dialogRestoreTarget = opener;
    this.uiState.modal = kind;
    this.input.setContext("modal");
    this.navigation.pushModal(this.uiState.screen, kind, this.runState.token);
    open();
  }

  private requestDialogClose(
    kind: Exclude<UiModal, "none" | "leaveRunConfirm">,
    afterClose?: () => void,
  ): void {
    if (this.uiState.modal !== kind) return;
    this.pendingDialogAction = afterClose ?? null;
    const entry = this.navigation.current();
    if (entry?.layer === "modal") this.navigation.back();
    else this.completeDialogClose(kind);
  }

  private completeDialogClose(kind: Exclude<UiModal, "none" | "leaveRunConfirm">): void {
    this.dialogs.close(kind);
    this.uiState.modal = "none";
    this.syncInputContext();
    if (this.uiState.screen === "game" && this.state.status === "paused") this.renderGame(true);
    const action = this.pendingDialogAction;
    this.pendingDialogAction = null;
    if (action) {
      action();
      return;
    }
    const restoreTarget = this.dialogRestoreTarget;
    this.dialogRestoreTarget = null;
    requestAnimationFrame(() => {
      if (restoreTarget?.isConnected && !restoreTarget.closest("[hidden]")) restoreTarget.focus();
      else this.focusScreenPrimary();
    });
  }

  private requestLeaveThroughHistory(): void {
    if (this.uiState.screen !== "game") return;
    this.navigation.back();
  }

  private openLeaveRunConfirm(): void {
    if (this.state.status === "running") this.setState(applyCommand(this.state, { type: "pause" }));
    this.uiState.pauseReason = "navigation";
    this.uiState.modal = "leaveRunConfirm";
    this.touchControls.reset();
    this.input.setContext("modal");
    this.renderGame(true);
    this.dialogs.openLeaveRunConfirm();
  }

  private confirmLeaveRun(): void {
    if (this.uiState.modal !== "leaveRunConfirm") return;
    this.dialogs.close("leaveRunConfirm");
    this.uiState.modal = "none";
    this.runState.token = null;
    this.runState.result = null;
    this.uiState.pauseReason = null;
    this.state = createGame({ seed: createSeed() });
    this.navigation.replace("home", null);
    this.activateScreen("home");
  }

  private cancelLeaveRun(): void {
    if (this.uiState.modal !== "leaveRunConfirm") return;
    this.dialogs.close("leaveRunConfirm");
    this.uiState.modal = "none";
    this.uiState.pauseReason = "navigation";
    this.syncInputContext();
    this.renderGame(true);
    this.navigation.forward();
    requestAnimationFrame(() => this.refs.game.pauseContinue.focus());
  }

  private goHomeFromResult(): void {
    this.navigation.replace("home", this.runState.token);
    this.activateScreen("home");
  }

  private handleNavigation(entry: StackfallHistoryEntry | null): void {
    if (this.uiState.modal !== "none" && this.uiState.modal !== "leaveRunConfirm") {
      const kind = this.uiState.modal;
      if (kind === "settings" || kind === "controls" || kind === "restartConfirm") {
        this.completeDialogClose(kind);
      }
      return;
    }
    if (this.uiState.modal === "leaveRunConfirm") return;
    if (!entry) {
      if (this.uiState.screen === "game" && isActiveRun(this.state)) this.openLeaveRunConfirm();
      return;
    }
    if (entry.layer === "modal") {
      this.navigation.replace(this.uiState.screen, this.runState.token);
      return;
    }
    if (entry.screen === "home") {
      if (this.uiState.screen === "game" && isActiveRun(this.state)) {
        this.openLeaveRunConfirm();
      } else {
        this.activateScreen("home");
      }
      return;
    }
    const tokenValid = entry.runToken !== null && entry.runToken === this.runState.token;
    if (entry.screen === "game" && tokenValid && isActiveRun(this.state)) {
      this.activateScreen("game");
      return;
    }
    if (entry.screen === "result" && tokenValid && this.runState.result && this.state.status === "gameOver") {
      this.activateScreen("result");
      return;
    }
    this.navigation.replace("home", null);
    this.activateScreen("home");
    this.showToast("이전 게임 상태를 복원할 수 없어 홈으로 이동했습니다.");
  }

  private pauseFromInterruption(): void {
    this.touchControls.reset();
    if (this.uiState.screen === "game" && this.state.status === "running") {
      this.setState(applyCommand(this.state, { type: "pause" }));
      this.uiState.pauseReason = "interruption";
      this.renderGame(true);
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
      if (this.uiState.screen === "game") this.renderGame(true);
    }
  }

  private applyPreferences(): void {
    document.documentElement.dataset.contrast = this.uiState?.preferences.boardContrast ?? "standard";
    document.documentElement.dataset.motion = this.uiState?.preferences.motion ?? "system";
    document.documentElement.dataset.touchControls = this.uiState?.preferences.touchControls ?? "auto";
    this.input.clear();
    requestAnimationFrame(() => {
      if (this.uiState) this.checkViewport();
    });
  }

  private activateScreen(screen: AppScreen, focus = true): void {
    if (screen !== "game") {
      this.detachGameObservers();
      this.touchControls.reset();
    }
    this.uiState.screen = screen;
    showScreen(this.refs, screen);
    this.syncInputContext();

    if (screen === "home") {
      this.home.render(this.uiState.highScore);
    } else if (screen === "result" && this.runState.result) {
      this.result.render(this.runState.result);
    } else if (screen === "game") {
      this.attachGameObservers();
      this.lastFrame = performance.now();
      this.accumulator = 0;
      requestAnimationFrame(() => {
        this.checkViewport();
        this.renderGame(true);
      });
    }
    if (focus) requestAnimationFrame(() => this.focusScreenPrimary());
  }

  private syncInputContext(): void {
    if (this.uiState.modal !== "none" || this.viewportBlocked) {
      this.input.setContext("modal");
    } else if (this.uiState.screen === "game") {
      this.input.setContext("gameplay");
    } else {
      this.input.setContext("inactive");
    }
  }

  private focusScreenPrimary(): void {
    if (this.uiState.modal !== "none" || this.viewportBlocked) return;
    if (this.uiState.screen === "home") this.home.focusPrimary();
    else if (this.uiState.screen === "result") this.result.focusPrimary();
    else if (this.state.status === "paused") this.refs.game.pauseContinue.focus();
    else this.refs.game.boardCanvas.focus();
  }

  private attachGameObservers(): void {
    if (this.gameObserved) return;
    this.canvases.forEach((canvas) => this.resizeObserver.observe(canvas));
    this.gameObserved = true;
  }

  private detachGameObservers(): void {
    if (!this.gameObserved) return;
    this.canvases.forEach((canvas) => this.resizeObserver.unobserve(canvas));
    this.gameObserved = false;
  }

  private viewportCanFitGame(): boolean {
    const mobileLayout = window.innerWidth < 740;
    const touchMode = this.uiState.preferences.touchControls === "on" ||
      (this.uiState.preferences.touchControls === "auto" && matchMedia("(any-pointer: coarse)").matches);
    const horizontalReserve = mobileLayout ? 148 : 440;
    const verticalReserve = touchMode ? 260 : 180;
    return Math.min(
      (window.innerWidth - horizontalReserve) / 10,
      (window.innerHeight - verticalReserve) / 20,
    ) >= 18;
  }

  private checkViewport(): void {
    if (!this.viewportCanFitGame()) {
      if (this.uiState.screen === "game") this.showViewportNotice("game");
      return;
    }
    if (!this.viewportBlocked) return;
    this.viewportBlocked = false;
    this.refs.viewportNotice.hidden = true;
    for (const child of this.refs.shell.children) {
      if (child instanceof HTMLElement && child !== this.refs.viewportNotice) child.inert = false;
    }
    if (this.viewportBlockOrigin === "game") {
      this.uiState.pauseReason = "viewport";
      this.renderGame(true);
    }
    this.viewportBlockOrigin = null;
    this.syncInputContext();
    this.focusScreenPrimary();
  }

  private showViewportNotice(origin: AppScreen): void {
    if (this.viewportBlocked) return;
    this.viewportBlocked = true;
    this.viewportBlockOrigin = origin;
    if (origin === "game" && this.state.status === "running") {
      this.setState(applyCommand(this.state, { type: "pause" }));
      this.uiState.pauseReason = "viewport";
      this.renderGame(true);
    }
    this.touchControls.reset();
    this.input.setContext("modal");
    this.refs.viewportMessage.textContent = origin === "home"
      ? "기기를 세로로 돌리거나 브라우저 높이를 늘린 뒤 게임을 시작하세요."
      : "현재 게임은 안전하게 멈췄습니다. 화면 크기를 늘리면 계속할 수 있습니다.";
    this.refs.viewportHome.textContent = origin === "home" ? "확인" : "홈으로";
    this.refs.viewportNotice.hidden = false;
    for (const child of this.refs.shell.children) {
      if (child instanceof HTMLElement && child !== this.refs.viewportNotice) child.inert = true;
    }
    this.refs.viewportNotice.focus();
  }

  private leaveViewportNotice(): void {
    const origin = this.viewportBlockOrigin;
    this.viewportBlocked = false;
    this.viewportBlockOrigin = null;
    this.refs.viewportNotice.hidden = true;
    for (const child of this.refs.shell.children) {
      if (child instanceof HTMLElement && child !== this.refs.viewportNotice) child.inert = false;
    }
    this.syncInputContext();
    if (origin === "game") this.requestLeaveThroughHistory();
    else this.focusScreenPrimary();
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

  private renderGame(force = false): void {
    if (this.uiState.screen !== "game") return;
    const boardChanged = force ||
      this.renderedBoard?.board !== this.state.board ||
      this.renderedBoard.active !== this.state.active;
    if (boardChanged) {
      renderBoard(this.refs.game.boardCanvas, this.state, this.theme);
      this.renderedBoard = { board: this.state.board, active: this.state.active };
    }

    this.hud.render(this.state, Math.max(this.uiState.highScore, this.state.score), this.theme, force);
    const paused = this.state.status === "paused";
    const pauseKey = `${paused}:${this.uiState.pauseReason}`;
    if (force || pauseKey !== this.renderedPauseKey) {
      this.refs.game.pauseOverlay.hidden = !paused;
      this.refs.game.playSurface.inert = paused;
      if (paused) {
        const copy = getPauseCopy(this.uiState.pauseReason);
        this.refs.game.pauseEyebrow.textContent = copy.eyebrow;
        this.refs.game.pauseTitle.textContent = copy.title;
        this.refs.game.pauseDescription.textContent = copy.description;
      }
      this.renderedPauseKey = pauseKey;
    }
    if (this.renderedStatus !== this.state.status && paused && this.uiState.modal === "none" && !this.viewportBlocked) {
      requestAnimationFrame(() => this.refs.game.pauseContinue.focus());
    }
    this.renderedStatus = this.state.status;
  }
}

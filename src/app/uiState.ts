export type AppScreen = "home" | "game" | "result";

export type UiModal =
  | "none"
  | "settings"
  | "controls"
  | "restartConfirm"
  | "leaveRunConfirm";

export type PauseReason =
  | "user"
  | "interruption"
  | "settings"
  | "controls"
  | "restart"
  | "navigation"
  | "viewport"
  | null;

export interface UiPreferences {
  motion: "system" | "reduced";
  boardContrast: "standard" | "high";
  touchControls: "auto" | "on" | "off";
}

export interface UiState {
  screen: AppScreen;
  modal: UiModal;
  pauseReason: PauseReason;
  highScore: number;
  preferences: UiPreferences;
  storageRecovered: boolean;
}

export interface RunResult {
  score: number;
  lines: number;
  level: number;
  bestScore: number;
  isNewBest: boolean;
}

export interface RunPresentationState {
  token: number | null;
  result: RunResult | null;
}

export const DEFAULT_PREFERENCES: UiPreferences = {
  motion: "system",
  boardContrast: "standard",
  touchControls: "auto",
};

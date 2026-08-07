export type UiModal = "none" | "settings" | "controls" | "restartConfirm";
export type PauseReason = "user" | "interruption" | "settings" | "restart" | null;

export interface UiPreferences {
  motion: "system" | "reduced";
  boardContrast: "standard" | "high";
  touchControls: "auto" | "on" | "off";
}

export interface UiState {
  modal: UiModal;
  pauseReason: PauseReason;
  highScore: number;
  preferences: UiPreferences;
  storageRecovered: boolean;
}

export const DEFAULT_PREFERENCES: UiPreferences = {
  motion: "system",
  boardContrast: "standard",
  touchControls: "auto",
};

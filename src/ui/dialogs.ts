import type { UiPreferences } from "../app/uiState";
import type { GameShellRefs } from "./gameShell";

interface DialogCallbacks {
  onRestartConfirm: () => void;
  onRestartCancel: () => void;
  onPreferencesChange: (preferences: UiPreferences) => void;
  onDialogClose: () => void;
}

function setRadioValue(dialog: HTMLDialogElement, name: string, value: string): void {
  const input = dialog.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
  if (input) input.checked = true;
}

export class DialogController {
  private readonly settingsForm: HTMLFormElement;

  constructor(
    private readonly refs: GameShellRefs,
    private readonly callbacks: DialogCallbacks,
  ) {
    this.settingsForm = refs.settingsDialog.querySelector<HTMLFormElement>("form")!;
    refs.settingsClose.addEventListener("click", () => this.closeSettings());
    refs.controlsClose.addEventListener("click", () => this.closeControls());
    refs.restartCancel.addEventListener("click", () => {
      refs.restartDialog.close();
      callbacks.onRestartCancel();
    });
    refs.restartConfirm.addEventListener("click", () => {
      refs.restartDialog.close();
      callbacks.onRestartConfirm();
    });
    this.settingsForm.addEventListener("change", () => callbacks.onPreferencesChange(this.readPreferences()));
    for (const dialog of [refs.settingsDialog, refs.controlsDialog, refs.restartDialog]) {
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        dialog.close();
        if (dialog === refs.restartDialog) callbacks.onRestartCancel();
        else callbacks.onDialogClose();
      });
    }
  }

  openSettings(preferences: UiPreferences): void {
    setRadioValue(this.refs.settingsDialog, "motion", preferences.motion);
    setRadioValue(this.refs.settingsDialog, "boardContrast", preferences.boardContrast);
    setRadioValue(this.refs.settingsDialog, "touchControls", preferences.touchControls);
    if (!this.refs.settingsDialog.open) this.refs.settingsDialog.showModal();
  }

  openControls(): void {
    if (!this.refs.controlsDialog.open) this.refs.controlsDialog.showModal();
  }

  openRestartConfirm(): void {
    if (!this.refs.restartDialog.open) this.refs.restartDialog.showModal();
  }

  private closeSettings(): void {
    this.refs.settingsDialog.close();
    this.callbacks.onDialogClose();
  }

  private closeControls(): void {
    this.refs.controlsDialog.close();
    this.callbacks.onDialogClose();
  }

  private readPreferences(): UiPreferences {
    const data = new FormData(this.settingsForm);
    return {
      motion: data.get("motion") === "reduced" ? "reduced" : "system",
      boardContrast: data.get("boardContrast") === "high" ? "high" : "standard",
      touchControls: data.get("touchControls") === "on" ? "on" : data.get("touchControls") === "off" ? "off" : "auto",
    };
  }
}

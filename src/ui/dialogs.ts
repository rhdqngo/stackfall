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

function getFocusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
    ),
  ).filter((element) => {
    if (element.hidden) return false;
    if (element instanceof HTMLInputElement && element.type === "radio" && !element.checked) {
      return !Array.from(dialog.querySelectorAll<HTMLInputElement>("input[type='radio']"))
        .some((input) => input.name === element.name && input.checked);
    }
    return true;
  });
}

function trapFocus(dialog: HTMLDialogElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") return;
  const focusable = getFocusableElements(dialog);
  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusable[0]!;
  const last = focusable.at(-1)!;
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
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
      dialog.addEventListener("keydown", (event) => trapFocus(dialog, event));
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
    this.refs.settingsClose.focus();
  }

  openControls(): void {
    if (!this.refs.controlsDialog.open) this.refs.controlsDialog.showModal();
    this.refs.controlsClose.focus();
  }

  openRestartConfirm(): void {
    if (!this.refs.restartDialog.open) this.refs.restartDialog.showModal();
    this.refs.restartCancel.focus();
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

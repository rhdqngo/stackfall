import type { InputCommand } from "../game/types";
import { RepeatController, type RepeatProfile } from "./repeatController";

export const DAS_MS = 150;
export const ARR_MS = 50;

export type InputContext = "gameplay" | "modal" | "inactive";

interface CommandBinding {
  command: InputCommand;
  repeat?: RepeatProfile;
}

export class InputController {
  private readonly repeats = new RepeatController<InputCommand>();
  private context: InputContext = "gameplay";

  constructor(private readonly dispatch: (command: InputCommand) => void) {}

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
  }

  update(timestamp: number): void {
    if (this.context !== "gameplay") return;
    this.repeats.update(timestamp, this.dispatch);
  }

  trigger(command: InputCommand): void {
    if (this.context === "gameplay") this.dispatch(command);
  }

  press(id: string, command: InputCommand, profile: RepeatProfile): void {
    if (this.context !== "gameplay") return;
    if (this.repeats.press(id, command, performance.now(), profile)) this.dispatch(command);
  }

  release(id: string): void {
    this.repeats.release(id);
  }

  clear = (): void => {
    this.repeats.clear();
  };

  setContext(context: InputContext): void {
    this.context = context;
    this.clear();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.context !== "gameplay") return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("button, input, select, textarea, dialog, [contenteditable='true']")) return;

    const binding = this.getCommandBinding(event.code);
    if (!binding) return;
    event.preventDefault();

    if (binding.repeat) {
      this.press(`keyboard:${event.code}`, binding.command, binding.repeat);
      return;
    }
    if (!event.repeat) this.trigger(binding.command);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.release(`keyboard:${event.code}`);
  };

  private getCommandBinding(code: string): CommandBinding | null {
    if (code === "ArrowLeft") {
      return { command: { type: "move", dx: -1 }, repeat: { delay: DAS_MS, interval: ARR_MS } };
    }
    if (code === "ArrowRight") {
      return { command: { type: "move", dx: 1 }, repeat: { delay: DAS_MS, interval: ARR_MS } };
    }
    if (code === "ArrowDown") {
      return { command: { type: "softDrop" }, repeat: { delay: ARR_MS, interval: ARR_MS } };
    }

    switch (code) {
      case "ArrowUp":
      case "KeyX":
        return { command: { type: "rotate", direction: 1 } };
      case "KeyZ":
        return { command: { type: "rotate", direction: -1 } };
      case "Space":
        return { command: { type: "hardDrop" } };
      case "KeyC":
      case "ShiftLeft":
      case "ShiftRight":
        return { command: { type: "hold" } };
      case "KeyP":
      case "Escape":
        return { command: { type: "pause" } };
      case "KeyR":
        return { command: { type: "restart", seed: 0 } };
      case "Enter":
        return { command: { type: "start" } };
      default:
        return null;
    }
  }
}

import type { InputCommand } from "../game/types";

const DAS_MS = 150;
const ARR_MS = 50;

interface HeldInput {
  command: InputCommand;
  nextAt: number;
  interval: number;
}

export class InputController {
  private readonly held = new Map<string, HeldInput>();

  constructor(private readonly dispatch: (command: InputCommand) => void) {}

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
  }

  update(timestamp: number): void {
    for (const input of this.held.values()) {
      let repeats = 0;
      while (timestamp >= input.nextAt && repeats < 4) {
        this.dispatch(input.command);
        input.nextAt += input.interval;
        repeats += 1;
      }
      if (repeats === 4 && timestamp >= input.nextAt) input.nextAt = timestamp + input.interval;
    }
  }

  clear = (): void => {
    this.held.clear();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.target instanceof HTMLButtonElement &&
      (event.code === "Enter" || event.code === "Space")
    ) {
      return;
    }

    const heldCommand = this.getHeldCommand(event.code);
    if (heldCommand) {
      event.preventDefault();
      if (!this.held.has(event.code)) {
        this.dispatch(heldCommand.command);
        this.held.set(event.code, {
          command: heldCommand.command,
          nextAt: performance.now() + heldCommand.delay,
          interval: heldCommand.interval,
        });
      }
      return;
    }

    const command = this.getDiscreteCommand(event.code);
    if (!command) return;
    event.preventDefault();
    if (!event.repeat) this.dispatch(command);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code);
  };

  private getHeldCommand(code: string): { command: InputCommand; delay: number; interval: number } | null {
    if (code === "ArrowLeft") return { command: { type: "move", dx: -1 }, delay: DAS_MS, interval: ARR_MS };
    if (code === "ArrowRight") return { command: { type: "move", dx: 1 }, delay: DAS_MS, interval: ARR_MS };
    if (code === "ArrowDown") return { command: { type: "softDrop" }, delay: ARR_MS, interval: ARR_MS };
    return null;
  }

  private getDiscreteCommand(code: string): InputCommand | null {
    switch (code) {
      case "ArrowUp":
      case "KeyX":
        return { type: "rotate", direction: 1 };
      case "KeyZ":
        return { type: "rotate", direction: -1 };
      case "Space":
        return { type: "hardDrop" };
      case "KeyC":
      case "ShiftLeft":
      case "ShiftRight":
        return { type: "hold" };
      case "KeyP":
      case "Escape":
        return { type: "pause" };
      case "KeyR":
        return { type: "restart", seed: 0 };
      case "Enter":
        return { type: "start" };
      default:
        return null;
    }
  }
}

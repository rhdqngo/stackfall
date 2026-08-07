import type { InputCommand } from "../game/types";
import { ARR_MS, DAS_MS, type InputController } from "../platform/input";

interface TouchBinding {
  command: InputCommand;
  repeat: "horizontal" | "vertical" | null;
}

const BINDINGS: Record<string, TouchBinding> = {
  left: { command: { type: "move", dx: -1 }, repeat: "horizontal" },
  right: { command: { type: "move", dx: 1 }, repeat: "horizontal" },
  down: { command: { type: "softDrop" }, repeat: "vertical" },
  hold: { command: { type: "hold" }, repeat: null },
  rotateLeft: { command: { type: "rotate", direction: -1 }, repeat: null },
  rotateRight: { command: { type: "rotate", direction: 1 }, repeat: null },
};

export class TouchControls {
  private readonly hardDropPointers = new Set<number>();
  private readonly buttons: HTMLButtonElement[];

  constructor(element: HTMLElement, private readonly input: InputController) {
    this.buttons = Array.from(element.querySelectorAll<HTMLButtonElement>("[data-touch-action]"));
    for (const button of this.buttons) {
      const action = button.dataset.touchAction;
      if (action === "hardDrop") this.bindHardDrop(button);
      else if (action && BINDINGS[action]) this.bindCommand(button, BINDINGS[action]);
    }
  }

  reset(): void {
    this.hardDropPointers.clear();
    this.buttons.forEach((button) => button.classList.remove("is-pressed"));
    this.input.clear();
  }

  private bindCommand(button: HTMLButtonElement, binding: TouchBinding): void {
    const release = (event: PointerEvent): void => {
      this.input.release(this.pointerId(event.pointerId));
      button.classList.remove("is-pressed");
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.classList.add("is-pressed");
      if (binding.repeat === "horizontal") {
        this.input.press(this.pointerId(event.pointerId), binding.command, { delay: DAS_MS, interval: ARR_MS });
      } else if (binding.repeat === "vertical") {
        this.input.press(this.pointerId(event.pointerId), binding.command, { delay: ARR_MS, interval: ARR_MS });
      } else {
        this.input.trigger(binding.command);
      }
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("pointerleave", release);
  }

  private bindHardDrop(button: HTMLButtonElement): void {
    const clear = (event: PointerEvent): void => {
      this.hardDropPointers.delete(event.pointerId);
      button.classList.remove("is-pressed");
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      this.hardDropPointers.add(event.pointerId);
      button.classList.add("is-pressed");
    });
    button.addEventListener("pointerup", (event) => {
      const rect = button.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (inside && this.hardDropPointers.has(event.pointerId)) this.input.trigger({ type: "hardDrop" });
      clear(event);
    });
    button.addEventListener("pointercancel", clear);
    button.addEventListener("lostpointercapture", clear);
    button.addEventListener("pointerleave", clear);
  }

  private pointerId(pointerId: number): string {
    return `pointer:${pointerId}`;
  }
}

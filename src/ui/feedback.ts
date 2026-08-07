import type { GameState, InputCommand } from "../game/types";

export type FeedbackEvent =
  | { type: "rotate" }
  | { type: "rotateDenied" }
  | { type: "hardDrop" }
  | { type: "hold" }
  | { type: "holdDenied" }
  | { type: "lineClear"; count: number }
  | { type: "levelUp"; level: number }
  | { type: "gameOver" };

export function deriveFeedback(
  previous: GameState,
  next: GameState,
  command?: InputCommand,
): FeedbackEvent[] {
  const events: FeedbackEvent[] = [];

  if (command?.type === "rotate") {
    events.push({ type: next === previous ? "rotateDenied" : "rotate" });
  }
  if (command?.type === "hardDrop" && next !== previous) events.push({ type: "hardDrop" });
  if (command?.type === "hold") events.push({ type: next === previous ? "holdDenied" : "hold" });

  const cleared = next.lines - previous.lines;
  if (cleared > 0) events.push({ type: "lineClear", count: cleared });
  if (next.level > previous.level) events.push({ type: "levelUp", level: next.level });
  if (previous.status !== "gameOver" && next.status === "gameOver") events.push({ type: "gameOver" });

  return events;
}

const FEEDBACK_CLASS_DURATION = 220;

export class FeedbackController {
  private readonly timers = new Map<string, number>();
  private chipTimer: number | null = null;

  constructor(
    private readonly boardFrame: HTMLElement,
    private readonly holdPanel: HTMLElement,
    private readonly chip: HTMLElement,
  ) {}

  play(events: FeedbackEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case "rotate":
          this.pulse(this.boardFrame, "is-feedback-rotate", 70);
          break;
        case "rotateDenied":
          this.pulse(this.boardFrame, "is-feedback-error", 80);
          break;
        case "hardDrop":
          this.pulse(this.boardFrame, "is-feedback-lock", 90);
          break;
        case "hold":
          this.pulse(this.holdPanel, "is-feedback-success", 120);
          break;
        case "holdDenied":
          this.pulse(this.holdPanel, "is-feedback-error", 120);
          break;
        case "lineClear":
          this.pulse(this.boardFrame, "is-feedback-line", Math.min(220, 120 + event.count * 25));
          this.showChip(event.count === 4 ? "4 LINES" : `+${event.count} LINE`);
          break;
        case "levelUp":
          this.showChip(`LEVEL ${event.level}`);
          break;
        case "gameOver":
          break;
      }
    }
  }

  private pulse(element: HTMLElement, className: string, duration: number): void {
    const key = `${element.id}:${className}`;
    const existing = this.timers.get(key);
    if (existing !== undefined) window.clearTimeout(existing);
    element.classList.remove(className);
    requestAnimationFrame(() => element.classList.add(className));
    const timer = window.setTimeout(() => {
      element.classList.remove(className);
      this.timers.delete(key);
    }, Math.min(duration, FEEDBACK_CLASS_DURATION));
    this.timers.set(key, timer);
  }

  private showChip(message: string): void {
    if (this.chipTimer !== null) window.clearTimeout(this.chipTimer);
    this.chip.textContent = message;
    this.chip.hidden = false;
    this.chip.classList.remove("is-visible");
    requestAnimationFrame(() => this.chip.classList.add("is-visible"));
    this.chipTimer = window.setTimeout(() => {
      this.chip.classList.remove("is-visible");
      this.chip.hidden = true;
      this.chipTimer = null;
    }, FEEDBACK_CLASS_DURATION);
  }
}

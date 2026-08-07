import { describe, expect, it, vi } from "vitest";
import { RepeatController } from "./repeatController";

describe("repeat input controller", () => {
  it("starts repeating only after the configured delay", () => {
    const controller = new RepeatController<string>();
    const emit = vi.fn();
    expect(controller.press("left", "move", 100, { delay: 150, interval: 50 })).toBe(true);
    controller.update(249, emit);
    expect(emit).not.toHaveBeenCalled();
    controller.update(250, emit);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("keeps the existing DAS and ARR cadence", () => {
    const controller = new RepeatController<string>();
    const values: string[] = [];
    controller.press("right", "move", 0, { delay: 150, interval: 50 });
    controller.update(300, (value) => values.push(value));
    expect(values).toEqual(["move", "move", "move", "move"]);
  });

  it("stops immediately when the pointer or key is released", () => {
    const controller = new RepeatController<string>();
    const emit = vi.fn();
    controller.press("down", "drop", 0, { delay: 50, interval: 50 });
    controller.release("down");
    controller.update(1000, emit);
    expect(emit).not.toHaveBeenCalled();
  });
});

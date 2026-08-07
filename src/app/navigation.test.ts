import { describe, expect, it } from "vitest";
import { isStackfallHistoryEntry, screenFromHash } from "./navigation";

describe("screenFromHash", () => {
  it.each([
    ["", "home"],
    ["#", "home"],
    ["#/", "home"],
    ["#/game", "game"],
    ["#/result", "result"],
  ] as const)("maps %s to %s", (hash, screen) => {
    expect(screenFromHash(hash)).toBe(screen);
  });

  it("rejects unknown routes", () => {
    expect(screenFromHash("#/settings")).toBeNull();
  });
});

describe("isStackfallHistoryEntry", () => {
  it("accepts app-owned screen and modal entries", () => {
    expect(isStackfallHistoryEntry({ stackfall: true, screen: "home", layer: "screen", runToken: null })).toBe(true);
    expect(isStackfallHistoryEntry({ stackfall: true, screen: "game", layer: "modal", runToken: 4 })).toBe(true);
  });

  it("rejects stale shapes", () => {
    expect(isStackfallHistoryEntry({ stackfall: true, screen: "settings", layer: "screen", runToken: null })).toBe(false);
    expect(isStackfallHistoryEntry(null)).toBe(false);
  });
});

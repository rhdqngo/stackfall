import { describe, expect, it } from "vitest";
import { createProfile, loadProfile, saveProfile, type StorageLike } from "./storage";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("Stackfall profile storage", () => {
  it("uses defaults when no profile has been saved", () => {
    const result = loadProfile(new MemoryStorage());
    expect(result.recovered).toBe(false);
    expect(result.profile).toEqual(createProfile(0, {
      motion: "system",
      boardContrast: "standard",
      touchControls: "auto",
    }));
  });

  it("round-trips a valid versioned profile", () => {
    const storage = new MemoryStorage();
    const profile = createProfile(4700, {
      motion: "reduced",
      boardContrast: "high",
      touchControls: "on",
    });
    expect(saveProfile(storage, profile)).toBe(true);
    expect(loadProfile(storage)).toEqual({ profile, recovered: false });
  });

  it.each([
    "not json",
    JSON.stringify({ version: 2, highScore: 10, preferences: {} }),
    JSON.stringify({ version: 1, highScore: -1, preferences: {} }),
  ])("recovers an invalid profile: %s", (value) => {
    const storage = new MemoryStorage();
    storage.values.set("stackfall:profile:v1", value);
    const result = loadProfile(storage);
    expect(result.recovered).toBe(true);
    expect(result.profile.highScore).toBe(0);
  });

  it("continues with defaults when storage access throws", () => {
    const storage: StorageLike = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(loadProfile(storage).recovered).toBe(true);
    expect(saveProfile(storage, createProfile(10, {
      motion: "system",
      boardContrast: "standard",
      touchControls: "auto",
    }))).toBe(false);
  });
});

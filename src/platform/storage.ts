import { DEFAULT_PREFERENCES, type UiPreferences } from "../app/uiState";

const STORAGE_KEY = "stackfall:profile:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PersistedProfileV1 {
  version: 1;
  highScore: number;
  preferences: UiPreferences;
}

export interface ProfileLoadResult {
  profile: PersistedProfileV1;
  recovered: boolean;
}

function defaultProfile(): PersistedProfileV1 {
  return {
    version: 1,
    highScore: 0,
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

function isPreferences(value: unknown): value is UiPreferences {
  if (!value || typeof value !== "object") return false;
  const preferences = value as Partial<UiPreferences>;
  return (
    (preferences.motion === "system" || preferences.motion === "reduced") &&
    (preferences.boardContrast === "standard" || preferences.boardContrast === "high") &&
    (preferences.touchControls === "auto" || preferences.touchControls === "on" || preferences.touchControls === "off")
  );
}

function isProfile(value: unknown): value is PersistedProfileV1 {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<PersistedProfileV1>;
  return (
    profile.version === 1 &&
    Number.isSafeInteger(profile.highScore) &&
    (profile.highScore ?? -1) >= 0 &&
    isPreferences(profile.preferences)
  );
}

export function loadProfile(storage: StorageLike | null): ProfileLoadResult {
  if (!storage) return { profile: defaultProfile(), recovered: true };
  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) return { profile: defaultProfile(), recovered: false };
    const parsed: unknown = JSON.parse(saved);
    if (isProfile(parsed)) {
      return {
        profile: {
          ...parsed,
          preferences: { ...parsed.preferences },
        },
        recovered: false,
      };
    }
  } catch {
    return { profile: defaultProfile(), recovered: true };
  }
  return { profile: defaultProfile(), recovered: true };
}

export function saveProfile(storage: StorageLike | null, profile: PersistedProfileV1): boolean {
  if (!storage || !isProfile(profile)) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function createProfile(highScore: number, preferences: UiPreferences): PersistedProfileV1 {
  return {
    version: 1,
    highScore: Math.max(0, Math.trunc(highScore)),
    preferences: { ...preferences },
  };
}

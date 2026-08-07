import type { AppScreen, UiModal } from "./uiState";

export interface StackfallHistoryEntry {
  stackfall: true;
  screen: AppScreen;
  layer: "screen" | "modal";
  modal?: Exclude<UiModal, "none" | "leaveRunConfirm">;
  runToken: number | null;
}

type NavigationListener = (entry: StackfallHistoryEntry | null) => void;

const ROUTES: Record<AppScreen, string> = {
  home: "#/",
  game: "#/game",
  result: "#/result",
};

export function screenFromHash(hash: string): AppScreen | null {
  if (hash === "" || hash === "#" || hash === "#/") return "home";
  if (hash === "#/game") return "game";
  if (hash === "#/result") return "result";
  return null;
}

export function isStackfallHistoryEntry(value: unknown): value is StackfallHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<StackfallHistoryEntry>;
  return (
    entry.stackfall === true &&
    (entry.screen === "home" || entry.screen === "game" || entry.screen === "result") &&
    (entry.layer === "screen" || entry.layer === "modal") &&
    (entry.runToken === null || Number.isSafeInteger(entry.runToken))
  );
}

export class NavigationController {
  constructor(private readonly listener: NavigationListener) {
    window.addEventListener("popstate", (event) => {
      this.listener(isStackfallHistoryEntry(event.state) ? event.state : null);
    });
  }

  initialize(screen: AppScreen, runToken: number | null): void {
    this.replace(screen, runToken);
  }

  push(screen: AppScreen, runToken: number | null): void {
    history.pushState(this.entry(screen, "screen", runToken), "", ROUTES[screen]);
  }

  replace(screen: AppScreen, runToken: number | null): void {
    history.replaceState(this.entry(screen, "screen", runToken), "", ROUTES[screen]);
  }

  pushModal(
    screen: AppScreen,
    modal: Exclude<UiModal, "none" | "leaveRunConfirm">,
    runToken: number | null,
  ): void {
    const entry = this.entry(screen, "modal", runToken);
    entry.modal = modal;
    history.pushState(entry, "", ROUTES[screen]);
  }

  current(): StackfallHistoryEntry | null {
    return isStackfallHistoryEntry(history.state) ? history.state : null;
  }

  back(): void {
    history.back();
  }

  forward(): void {
    history.forward();
  }

  private entry(
    screen: AppScreen,
    layer: StackfallHistoryEntry["layer"],
    runToken: number | null,
  ): StackfallHistoryEntry {
    return { stackfall: true, screen, layer, runToken };
  }
}

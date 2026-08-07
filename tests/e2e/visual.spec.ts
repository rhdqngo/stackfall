import { expect, test, type Page } from "@playwright/test";

interface VisualCase {
  name: string;
  fixture: "ready" | "running" | "high-stack" | "hold-used" | "paused" | "game-over";
  viewport: { width: number; height: number };
  touch?: boolean;
}

const cases: VisualCase[] = [
  { name: "home-desktop", fixture: "ready", viewport: { width: 1440, height: 900 } },
  { name: "running-desktop", fixture: "running", viewport: { width: 1440, height: 900 } },
  { name: "high-stack-desktop", fixture: "high-stack", viewport: { width: 1440, height: 900 } },
  { name: "hold-used-desktop", fixture: "hold-used", viewport: { width: 1440, height: 900 } },
  { name: "paused-small-desktop", fixture: "paused", viewport: { width: 1024, height: 768 } },
  { name: "high-stack-tablet", fixture: "high-stack", viewport: { width: 768, height: 1024 } },
  { name: "result-desktop", fixture: "game-over", viewport: { width: 1440, height: 900 } },
  { name: "home-small-mobile", fixture: "ready", viewport: { width: 360, height: 640 }, touch: true },
  { name: "running-mobile", fixture: "running", viewport: { width: 390, height: 844 }, touch: true },
  { name: "result-mobile", fixture: "game-over", viewport: { width: 390, height: 844 }, touch: true },
];

async function configureTouch(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("stackfall:profile:v1", JSON.stringify({
      version: 1,
      highScore: 0,
      preferences: { motion: "reduced", boardContrast: "standard", touchControls: "on" },
    }));
  });
}

for (const visualCase of cases) {
  test(`matches the ${visualCase.name} visual baseline`, async ({ page }) => {
    await page.setViewportSize(visualCase.viewport);
    if (visualCase.touch) await configureTouch(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/?fixture=${visualCase.fixture}&freeze=1`);
    await expect(page.locator(`[data-screen="${visualCase.fixture === "ready" ? "home" : visualCase.fixture === "game-over" ? "result" : "game"}"]`)).toBeVisible();
    await expect(page).toHaveScreenshot(`${visualCase.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.002,
    });
  });
}

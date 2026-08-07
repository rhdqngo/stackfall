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

async function expectVisual(page: Page, name: string): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    maxDiffPixelRatio: 0.002,
  });
}

for (const visualCase of cases) {
  test(`matches the ${visualCase.name} visual baseline`, async ({ page }) => {
    await page.setViewportSize(visualCase.viewport);
    if (visualCase.touch) await configureTouch(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/?fixture=${visualCase.fixture}&freeze=1`);
    await expect(page.locator(`[data-screen="${visualCase.fixture === "ready" ? "home" : visualCase.fixture === "game-over" ? "result" : "game"}"]`)).toBeVisible();
    await expectVisual(page, visualCase.name);
  });
}

test("matches the settings-desktop visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?fixture=ready&freeze=1");
  await page.locator("#home-settings-action").click();
  await expect(page.locator("#settings-dialog")).toBeVisible();
  await expectVisual(page, "settings-desktop");
});

test("matches the controls-mobile visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await configureTouch(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?fixture=ready&freeze=1");
  await page.locator("#home-controls-action").click();
  await expect(page.locator("#controls-dialog")).toBeVisible();
  await expectVisual(page, "controls-mobile");
});

test("matches the restart-confirm-desktop visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?fixture=running&freeze=1");
  await page.keyboard.press("r");
  await expect(page.locator("#restart-dialog")).toBeVisible();
  await expectVisual(page, "restart-confirm-desktop");
});

test("matches the leave-confirm-mobile visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await configureTouch(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?fixture=ready&freeze=1");
  await page.locator("#home-start-action").click();
  await page.locator("#pause-action").click();
  await page.locator("#pause-home-action").click();
  await expect(page.locator("#leave-run-dialog")).toBeVisible();
  await expectVisual(page, "leave-confirm-mobile");
});

test("matches the recovery-toast-home visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem("stackfall:profile:v1", "{broken"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?fixture=ready&freeze=1");
  await expect(page.locator("#status-toast")).toBeVisible();
  await expectVisual(page, "recovery-toast-home");
});

test("matches the viewport-notice visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await configureTouch(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?fixture=ready&freeze=1");
  await page.locator("#home-start-action").click();
  await expect(page.locator("#viewport-notice")).toBeVisible();
  await expectVisual(page, "viewport-notice-320x480");
});

test("matches the fatal-error-desktop visual baseline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".fatal-error")).toBeVisible();
  await expectVisual(page, "fatal-error-desktop");
});

import { expect, test, type Page } from "@playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function enableTouchControls(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("stackfall:profile:v1", JSON.stringify({
      version: 1,
      highScore: 0,
      preferences: { motion: "reduced", boardContrast: "standard", touchControls: "on" },
    }));
  });
}

test("opens on a focused Home screen without mounting gameplay into the active view", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");

  await expect(page.locator("#home-screen")).toBeVisible();
  await expect(page.locator("#game-screen")).toBeHidden();
  await expect(page.locator("#result-screen")).toBeHidden();
  await expect(page.getByRole("heading", { name: "STACKFALL" })).toBeVisible();
  await expect(page.getByRole("button", { name: "게임 시작" })).toBeFocused();
  await expect(page.getByLabel("10열 20행 Stackfall 게임 보드")).toBeHidden();
  await expect(page.locator("#touch-controls")).toBeHidden();
  expect(new URL(page.url()).hash).toBe("#/");
  expect(errors).toEqual([]);
});

test("supports keyboard start, play, pause, resume, and confirmed restart", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.keyboard.press("Enter");
  await expect(page.locator("#game-screen")).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("진행 중");
  await expect(page.locator("#game-board")).toBeFocused();
  expect(new URL(page.url()).hash).toBe("#/game");

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("x");
  await page.keyboard.press("Space");
  await expect.poll(async () => Number(await page.locator("#score-value").textContent())).toBeGreaterThan(0);

  await page.keyboard.press("p");
  await expect(page.locator("#pause-overlay")).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  await expect(page.locator("#game-play-surface")).toHaveAttribute("inert", "");
  const pausedScore = await page.locator("#score-value").textContent();
  await page.waitForTimeout(250);
  await expect(page.locator("#score-value")).toHaveText(pausedScore ?? "0");

  await page.keyboard.press("Enter");
  await expect(page.locator("#pause-overlay")).toBeHidden();
  await expect(page.locator("#game-status")).toHaveText("진행 중");
  await page.keyboard.press("r");
  await expect(page.getByRole("dialog", { name: "현재 게임을 다시 시작할까요?" })).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  await page.locator("#restart-confirm").click();
  await expect(page.locator("#game-status")).toHaveText("진행 중");
  await expect(page.locator("#score-value")).toHaveText("0");
  await expect(page.locator("#lines-value")).toHaveText("0");
  expect(errors).toEqual([]);
});

test("auto-pauses on interruption and never resumes without an explicit action", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  await expect(page.locator("#pause-description")).toContainText("자동으로 멈췄습니다");
  await page.waitForTimeout(250);
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  expect(errors).toEqual([]);
});

test("recovers corrupted profile data on Home without blocking a new run", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.addInitScript(() => localStorage.setItem("stackfall:profile:v1", "not-json"));
  await page.goto("/");
  await expect(page.locator("#status-toast")).toContainText("기본값으로 복구");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page.locator("#game-status")).toHaveText("진행 중");
  expect(errors).toEqual([]);
});

test("renders game over as a Result screen with retry and Home actions", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/?fixture=game-over&freeze=1");
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-score-value")).toHaveText("12,480");
  await expect(page.locator("#result-eyebrow")).toContainText("NEW BEST");
  await expect(page.locator("#game-board")).toBeHidden();
  await expect(page.locator("#touch-controls")).toBeHidden();
  await expect(page.getByRole("button", { name: "다시 도전" })).toBeFocused();
  expect(new URL(page.url()).hash).toBe("#/result");

  await page.keyboard.press("Enter");
  await expect(page.locator("#game-screen")).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("진행 중");
  await expect(page.locator("#score-value")).toHaveText("0");
  expect(errors).toEqual([]);
});

test("keeps Home usable on a tiny viewport and blocks only the attempted run", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/");
  await expect(page.locator("#home-screen")).toBeVisible();
  await expect(page.locator("#viewport-notice")).toBeHidden();
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page.getByRole("alertdialog", { name: "화면 공간이 부족합니다" })).toBeVisible();
  await expect(page.locator("#game-screen")).toBeHidden();
  await page.getByRole("button", { name: "확인" }).click();
  await expect(page.locator("#home-screen")).toBeVisible();
  expect(errors).toEqual([]);
});

test("supports touch play only after entering Game", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await enableTouchControls(page);
  await page.goto("/");
  await expect(page.locator("#touch-controls")).toBeHidden();
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page.locator("#touch-controls")).toBeVisible();

  await page.getByRole("button", { name: "오른쪽으로 이동" }).click();
  await page.getByRole("button", { name: "오른쪽으로 회전" }).click();
  await page.getByRole("button", { name: "하드 드롭" }).click();
  await expect.poll(async () => Number(await page.locator("#score-value").textContent())).toBeGreaterThan(0);

  const hardDrop = page.getByRole("button", { name: "하드 드롭" });
  const hardDropBox = await hardDrop.boundingBox();
  const scoreBeforeCancelledDrop = await page.locator("#score-value").textContent();
  expect(hardDropBox).not.toBeNull();
  await page.mouse.move(hardDropBox!.x + hardDropBox!.width / 2, hardDropBox!.y + hardDropBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hardDropBox!.x - 16, hardDropBox!.y - 16);
  await page.mouse.up();
  await expect(page.locator("#score-value")).toHaveText(scoreBeforeCancelledDrop ?? "0");
  await expect(hardDrop).not.toHaveClass(/is-pressed/);

  await page.getByRole("button", { name: "홀드" }).click();
  await expect(page.locator(".hold-panel")).toHaveAttribute("data-available", "false");
  expect(errors).toEqual([]);
});

test("guards browser Back during an active run and preserves the paused run on cancel", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.keyboard.press("Space");
  const score = await page.locator("#score-value").textContent();

  await page.goBack();
  const leaveDialog = page.getByRole("dialog", { name: "현재 게임을 끝내고 홈으로 이동할까요?" });
  await expect(leaveDialog).toBeVisible();
  await page.getByRole("button", { name: "게임 계속" }).click();
  await expect(leaveDialog).toBeHidden();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  await expect(page.locator("#score-value")).toHaveText(score ?? "0");

  await page.goBack();
  await expect(leaveDialog).toBeVisible();
  await page.getByRole("button", { name: "홈으로 이동" }).click();
  await expect(page.locator("#home-screen")).toBeVisible();
  await expect(page.locator("#game-screen")).toBeHidden();
  expect(errors).toEqual([]);
});

test("normalizes direct Game and Result URLs without an in-memory run", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/#/game");
  await expect(page.locator("#home-screen")).toBeVisible();
  expect(new URL(page.url()).hash).toBe("#/");
  await expect(page.locator("#status-toast")).toContainText("저장되지 않아 홈으로 이동");
  expect(errors).toEqual([]);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900, touch: false },
  { name: "small desktop", width: 1024, height: 768, touch: false },
  { name: "portrait tablet", width: 768, height: 1024, touch: false },
  { name: "mobile", width: 390, height: 844, touch: true },
  { name: "small mobile", width: 360, height: 640, touch: true },
]) {
  test(`keeps the active Game UI inside the ${viewport.name} viewport`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    if (viewport.touch) await enableTouchControls(page);
    await page.goto("/?fixture=running&freeze=1");
    await expect(page.locator("#game-screen")).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const selectors = [".game-header", ".board-frame", ".stats-panel", ".preview-panel"];
    if (viewport.touch) selectors.push(".touch-controls");
    for (const selector of selectors) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} should be rendered`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    expect(errors).toEqual([]);
  });
}

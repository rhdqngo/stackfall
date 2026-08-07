import { expect, test, type Page } from "@playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("loads the board, HUD, controls, and three-piece queue", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "STACKFALL" })).toBeVisible();
  await expect(page.getByRole("button", { name: "게임 시작" })).toBeVisible();
  await expect(page.getByLabel("10열 20행 Stackfall 게임 보드")).toBeVisible();
  await expect(page.getByText("점수", { exact: true })).toBeVisible();
  await expect(page.getByText("조작", { exact: true })).toBeVisible();
  await expect(page.locator(".next-preview")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("supports keyboard play, pause, resume, and restart", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page.locator("#game-status")).toHaveText("진행 중");

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("x");
  await page.keyboard.press("Space");
  await expect.poll(async () => Number(await page.locator("#score-value").textContent())).toBeGreaterThan(0);

  await page.keyboard.press("p");
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  const pausedScore = await page.locator("#score-value").textContent();
  await page.waitForTimeout(250);
  await expect(page.locator("#score-value")).toHaveText(pausedScore ?? "0");

  await page.keyboard.press("Enter");
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

test("supports touch play through the shared input path", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "설정" }).click();
  await page.getByRole("radio", { name: "항상 표시" }).click();
  await page.getByRole("button", { name: "설정 닫기" }).click();
  await expect(page.locator("#touch-controls")).toBeVisible();

  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.getByRole("button", { name: "오른쪽으로 이동" }).click();
  await page.getByRole("button", { name: "오른쪽으로 회전" }).click();
  await page.getByRole("button", { name: "하드 드롭" }).click();
  await expect.poll(async () => Number(await page.locator("#score-value").textContent())).toBeGreaterThan(0);

  await page.getByRole("button", { name: "홀드" }).click();
  await expect(page.locator(".hold-panel")).toHaveAttribute("data-available", "false");
  await expect(page.locator("#hold-state")).toHaveText("잠김");
  expect(errors).toEqual([]);
});

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "small desktop", width: 1024, height: 768 },
  { name: "portrait tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small mobile", width: 360, height: 640 },
]) {
  test(`keeps primary UI inside the ${viewport.name} viewport width`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    for (const selector of [".masthead", ".board-frame", ".stats-panel", ".preview-panel"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} should be rendered`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }
    const boardBox = await page.locator(".board-frame").boundingBox();
    expect(boardBox!.y + boardBox!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(errors).toEqual([]);
  });
}

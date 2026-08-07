import { expect, test, type Page } from "@playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("contains focus in Settings and restores the exact Pause action opener", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.keyboard.press("Space");
  const scoreBeforeDialog = await page.locator("#score-value").textContent();
  await page.keyboard.press("p");

  const opener = page.locator("#pause-settings-action");
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "화면 설정" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("KeyX");
  await expect(page.locator("#score-value")).toHaveText(scoreBeforeDialog ?? "0");

  for (let index = 0; index < 8; index += 1) await page.keyboard.press("Tab");
  const focusInside = await dialog.evaluate((element) => element.contains(document.activeElement));
  expect(focusInside).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator("#pause-overlay")).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  expect(errors).toEqual([]);
});

test("exposes only the active Screen and gives every action an accessible name", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await expect(page.locator("#home-screen")).not.toHaveAttribute("inert", "");
  await expect(page.locator("#game-screen")).toHaveAttribute("inert", "");
  for (const name of ["게임 시작", "조작 도움말", "설정"]) {
    await expect(page.getByRole("button", { name })).toHaveCount(1);
  }

  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page.locator("#home-screen")).toHaveAttribute("inert", "");
  await expect(page.locator("#game-screen")).not.toHaveAttribute("inert", "");
  await expect(page.getByRole("button", { name: "일시정지" })).toHaveCount(1);
  await page.keyboard.press("p");
  for (const name of ["계속하기", "다시 시작", "홈으로", "조작 도움말", "설정"]) {
    await expect(page.getByRole("button", { name })).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("preserves reduced motion after configuring it from Home", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "설정" }).click();
  await page.getByRole("radio", { name: "모션 줄이기" }).click();
  await page.getByRole("button", { name: "설정 닫기" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  const durations = await page.locator("#home-start-action").evaluate((element) => {
    const styles = getComputedStyle(element);
    return { animation: styles.animationDuration, transition: styles.transitionDuration };
  });
  expect(durations.animation).toBe("1e-05s");
  expect(durations.transition.split(", ").every((value) => value === "1e-05s")).toBe(true);
  expect(errors).toEqual([]);
});

test("keeps Home and Game controls readable in forced-colors mode", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/");
  const helpButton = page.getByRole("button", { name: "조작 도움말" });
  await helpButton.focus();
  await expect(helpButton).toBeFocused();
  const focusStyle = await helpButton.evaluate((element) => {
    const styles = getComputedStyle(element);
    return { style: styles.outlineStyle, width: styles.outlineWidth };
  });
  expect(focusStyle.style).not.toBe("none");
  expect(Number.parseFloat(focusStyle.width)).toBeGreaterThanOrEqual(2);

  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page.locator("#game-board")).toBeVisible();
  await expect(page.getByRole("button", { name: "일시정지" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("closes a Home dialog with browser Back and restores its opener", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  const opener = page.getByRole("button", { name: "조작 도움말" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "조작 도움말" });
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator("#home-screen")).toBeVisible();
  expect(errors).toEqual([]);
});

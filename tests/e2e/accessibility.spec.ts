import { expect, test, type Page } from "@playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("keeps gameplay paused and focus contained while a modal is open", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.keyboard.press("Space");
  const scoreBeforeDialog = await page.locator("#score-value").textContent();

  await page.getByRole("button", { name: "설정" }).click();
  const dialog = page.getByRole("dialog", { name: "화면 설정" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("KeyX");
  await expect(page.locator("#score-value")).toHaveText(scoreBeforeDialog ?? "0");

  for (let index = 0; index < 8; index += 1) await page.keyboard.press("Tab");
  const focusState = await page.evaluate(() => {
    const settings = document.querySelector("#settings-dialog");
    return {
      inside: settings?.contains(document.activeElement) ?? false,
      target: document.activeElement?.id || document.activeElement?.tagName || "unknown",
    };
  });
  expect(focusState.inside, `focus escaped to ${focusState.target}`).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("#primary-action")).toBeFocused();
  await expect(page.locator("#game-status")).toHaveText("일시정지");
  expect(errors).toEqual([]);
});

test("provides accessible names and reduced-motion behavior", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto("/");

  for (const name of ["조작 도움말", "설정", "일시정지", "다시 시작"]) {
    await expect(page.getByRole("button", { name })).toHaveCount(1);
  }

  await page.getByRole("button", { name: "설정" }).click();
  await page.getByRole("radio", { name: "모션 줄이기" }).click();
  await page.getByRole("button", { name: "설정 닫기" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  const durations = await page.locator("#primary-action").evaluate((element) => {
    const styles = getComputedStyle(element);
    return { animation: styles.animationDuration, transition: styles.transitionDuration };
  });
  expect(durations.animation).toBe("1e-05s");
  expect(durations.transition.split(", ").every((value) => value === "1e-05s")).toBe(true);
  expect(errors).toEqual([]);
});

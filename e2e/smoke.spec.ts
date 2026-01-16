import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_URL || "https://jonwhitefang.github.io/wow-achievement-helper/";

test.describe("WoW Achievement Helper", () => {
  test("loads manifest and displays achievements", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load (look for the count pattern)
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });
  });

  test("opens achievement drawer", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Click on an achievement row (they have cursor pointer style)
    const achievementRow = page.locator("div").filter({ hasText: /^\d+\s*pts?$/ }).first();
    if (await achievementRow.isVisible()) {
      await achievementRow.click();
      // Drawer should open - look for close button or description
      await expect(page.locator("text=Description").or(page.locator("button:has-text('×')"))).toBeVisible({ timeout: 5000 });
    }
  });

  test("search filters achievements", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const countText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(countText?.match(/(\d+)/)?.[1] || "0", 10);

    // Type in search
    await page.getByPlaceholder("Search achievements...").fill("Loremaster");
    await page.waitForTimeout(500); // Wait for search debounce

    // Results should be filtered (fewer results)
    const newCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const newCount = parseInt(newCountText?.match(/(\d+)/)?.[1] || "0", 10);
    
    expect(newCount).toBeLessThan(initialCount);
  });

  test("category tree is visible", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Category tree should have expand buttons
    await expect(page.locator("button:has-text('▶')").first()).toBeVisible();
  });
});

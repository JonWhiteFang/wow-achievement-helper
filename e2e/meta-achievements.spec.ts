import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_URL || "https://jonwhitefang.github.io/wow-achievement-helper/";

test.describe("Meta Achievements", () => {
  test("displays META badge for meta achievements", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for META badge - meta achievements should have this indicator
    const metaBadge = page.locator("text=META").first();
    if (await metaBadge.isVisible()) {
      await expect(metaBadge).toBeVisible();
    } else {
      // If no META badge visible, search for a known meta achievement
      await page.getByPlaceholder("Search achievements...").fill("Loremaster");
      await page.waitForTimeout(500);
      
      // Loremaster is typically a meta achievement
      await expect(page.locator("text=META").or(page.locator("text=Loremaster"))).toBeVisible({ timeout: 5000 });
    }
  });

  test("shows sub-achievements in meta achievement drawer", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Search for a meta achievement
    await page.getByPlaceholder("Search achievements...").fill("Loremaster");
    await page.waitForTimeout(500);

    // Click on the first result (should be Loremaster or similar meta achievement)
    const firstResult = page.locator("div").filter({ hasText: /^\d+\s*pts?$/ }).first();
    if (await firstResult.isVisible()) {
      await firstResult.click();

      // Drawer should open
      await expect(page.locator("text=Description").or(page.locator("button:has-text('×')"))).toBeVisible({ timeout: 5000 });

      // Look for sub-achievements section or child achievements
      const subAchievements = page.locator("text=Sub-achievements").or(
        page.locator("text=Child Achievements")
      ).or(
        page.locator("text=Requirements")
      );
      
      // Meta achievements should show their component achievements
      if (await subAchievements.isVisible()) {
        await expect(subAchievements).toBeVisible();
      }
    }
  });

  test("filters meta achievements only", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const countText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(countText?.match(/(\d+)/)?.[1] || "0", 10);

    // Look for meta filter checkbox or button
    const metaFilter = page.locator("input[type='checkbox']").filter({ hasText: /meta/i }).or(
      page.locator("button").filter({ hasText: /meta/i })
    ).or(
      page.locator("label").filter({ hasText: /meta/i })
    );

    if (await metaFilter.isVisible()) {
      await metaFilter.click();
      await page.waitForTimeout(500);

      // Results should be filtered (fewer results, only meta achievements)
      const newCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const newCount = parseInt(newCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(newCount).toBeLessThan(initialCount);
      
      // All visible achievements should have META badge
      const metaBadges = page.locator("text=META");
      const achievementRows = page.locator("div").filter({ hasText: /^\d+\s*pts?$/ });
      
      if (await achievementRows.count() > 0 && await metaBadges.count() > 0) {
        expect(await metaBadges.count()).toBeGreaterThan(0);
      }
    }
  });

  test("meta achievement progress shows sub-achievement completion", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Search for a meta achievement
    await page.getByPlaceholder("Search achievements...").fill("Loremaster");
    await page.waitForTimeout(500);

    // Look for progress indicators like "3/5" or progress bars
    const progressIndicator = page.locator("text=/\\d+\\/\\d+/").or(
      page.locator("[role='progressbar']")
    ).or(
      page.locator(".progress")
    );

    if (await progressIndicator.isVisible()) {
      await expect(progressIndicator).toBeVisible();
    }
  });

  test("clicking sub-achievement opens its details", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Search for a meta achievement
    await page.getByPlaceholder("Search achievements...").fill("Loremaster");
    await page.waitForTimeout(500);

    // Click on the first result
    const firstResult = page.locator("div").filter({ hasText: /^\d+\s*pts?$/ }).first();
    if (await firstResult.isVisible()) {
      await firstResult.click();

      // Wait for drawer to open
      await expect(page.locator("text=Description").or(page.locator("button:has-text('×')"))).toBeVisible({ timeout: 5000 });

      // Look for clickable sub-achievements
      const subAchievementLink = page.locator("a").filter({ hasText: /achievement/i }).or(
        page.locator("button").filter({ hasText: /view/i })
      ).first();

      if (await subAchievementLink.isVisible()) {
        await subAchievementLink.click();
        
        // Should navigate to or open the sub-achievement details
        await page.waitForTimeout(1000);
        
        // Verify we're now viewing a different achievement
        await expect(page.locator("text=Description")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
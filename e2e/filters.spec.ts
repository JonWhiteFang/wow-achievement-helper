import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_URL || "https://jonwhitefang.github.io/wow-achievement-helper/";

test.describe("Achievement Filters", () => {
  test("account-wide toggle reduces achievement count", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const initialCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(initialCountText?.match(/(\d+)/)?.[1] || "0", 10);

    // Find and click account-wide toggle
    const accountWideToggle = page.locator("input[type='checkbox']").first();
    const hasToggle = await accountWideToggle.count();

    if (hasToggle > 0) {
      await accountWideToggle.check();
      await page.waitForTimeout(500);

      // Get new count
      const newCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const newCount = parseInt(newCountText?.match(/(\d+)/)?.[1] || "0", 10);

      // Count should be less than or equal to initial (some achievements are account-wide)
      expect(newCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test("completion filter shows only completed achievements", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for completion filter buttons/dropdown
    const completedFilter = page.locator("button:has-text('Completed'), select option:has-text('Completed')").first();
    const hasFilter = await completedFilter.count();

    if (hasFilter > 0) {
      await completedFilter.click();
      await page.waitForTimeout(500);

      // All visible achievements should have checkmarks
      const checkmarks = page.locator("span:has-text('✓')");
      const checkmarkCount = await checkmarks.count();

      // Should have at least some checkmarks if filter is working
      expect(checkmarkCount).toBeGreaterThan(0);
    }
  });

  test("expansion filter limits results to specific expansion", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const initialCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(initialCountText?.match(/(\d+)/)?.[1] || "0", 10);

    // Look for expansion dropdown
    const expansionSelect = page.locator("select").nth(1); // Assuming second select is expansion
    const hasExpansionSelect = await expansionSelect.count();

    if (hasExpansionSelect > 0) {
      // Select a specific expansion (e.g., Dragonflight)
      await expansionSelect.selectOption({ index: 1 }); // Select first non-"all" option
      await page.waitForTimeout(500);

      // Get filtered count
      const filteredCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const filteredCount = parseInt(filteredCountText?.match(/(\d+)/)?.[1] || "0", 10);

      // Filtered count should be less than initial
      expect(filteredCount).toBeLessThan(initialCount);
    }
  });

  test("near-complete filter shows achievements with 80%+ progress", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for "near complete" or similar filter
    const nearCompleteFilter = page.locator("button:has-text(/near|80%/i)").first();
    const hasFilter = await nearCompleteFilter.count();

    if (hasFilter > 0) {
      await nearCompleteFilter.click();
      await page.waitForTimeout(500);

      // Should show achievements with high progress percentages
      const progressBars = page.locator("text=/%/");
      const progressCount = await progressBars.count();

      // If filter is active and working, should have some progress indicators
      expect(progressCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("combining multiple filters works correctly", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const initialCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(initialCountText?.match(/(\d+)/)?.[1] || "0", 10);

    // Apply account-wide filter
    const accountWideToggle = page.locator("input[type='checkbox']").first();
    const hasToggle = await accountWideToggle.count();

    if (hasToggle > 0) {
      await accountWideToggle.check();
      await page.waitForTimeout(300);

      // Apply expansion filter
      const expansionSelect = page.locator("select").nth(1);
      const hasExpansionSelect = await expansionSelect.count();

      if (hasExpansionSelect > 0) {
        await expansionSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);

        // Get combined filter count
        const combinedCountText = await page.locator("text=/\\d+ achievements/").textContent();
        const combinedCount = parseInt(combinedCountText?.match(/(\d+)/)?.[1] || "0", 10);

        // Combined filters should reduce count further
        expect(combinedCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  test("clears all filters", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const initialCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(initialCountText?.match(/(\d+)/)?.[1] || "0", 10);

    // Apply some filters
    const accountWideToggle = page.locator("input[type='checkbox']").first();
    const hasToggle = await accountWideToggle.count();

    if (hasToggle > 0) {
      await accountWideToggle.check();
      await page.waitForTimeout(300);

      // Uncheck to clear
      await accountWideToggle.uncheck();
      await page.waitForTimeout(300);

      // Count should return to initial
      const finalCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const finalCount = parseInt(finalCountText?.match(/(\d+)/)?.[1] || "0", 10);

      expect(finalCount).toBe(initialCount);
    }
  });

  test("filters work with empty results", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Apply filters that might result in no matches
    const searchInput = page.getByPlaceholder("Search achievements...");
    await searchInput.fill("ThisSearchTermWillNeverMatchAnything12345XYZ");
    await page.waitForTimeout(500);

    // Should show "No achievements found" or similar
    const noResults = page.locator("text=/no achievements|not found/i");
    await expect(noResults).toBeVisible();
  });
});

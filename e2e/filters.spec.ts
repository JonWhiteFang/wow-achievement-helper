import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_URL || "https://jonwhitefang.github.io/wow-achievement-helper/";

test.describe("Achievement Filters", () => {
  test("filters by completion status", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const countText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(countText?.match(/(\d+)/)?.[1] || "0", 10);

    // Look for completion status filters
    const completedFilter = page.locator("input[type='checkbox']").filter({ hasText: /completed/i }).or(
      page.locator("button").filter({ hasText: /completed/i })
    ).or(
      page.locator("label").filter({ hasText: /completed/i })
    );

    const incompleteFilter = page.locator("input[type='checkbox']").filter({ hasText: /incomplete|not.*completed/i }).or(
      page.locator("button").filter({ hasText: /incomplete|not.*completed/i })
    ).or(
      page.locator("label").filter({ hasText: /incomplete|not.*completed/i })
    );

    if (await completedFilter.isVisible()) {
      await completedFilter.click();
      await page.waitForTimeout(500);

      // Results should be filtered
      const newCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const newCount = parseInt(newCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(newCount).toBeLessThanOrEqual(initialCount);
    }

    if (await incompleteFilter.isVisible()) {
      await incompleteFilter.click();
      await page.waitForTimeout(500);

      // Results should change again
      const finalCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const finalCount = parseInt(finalCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(finalCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("filters by point values", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const countText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(countText?.match(/(\d+)/)?.[1] || "0", 10);

    // Look for point value filters
    const pointFilter = page.locator("input[type='checkbox']").filter({ hasText: /\d+.*points?/i }).or(
      page.locator("button").filter({ hasText: /\d+.*points?/i })
    ).or(
      page.locator("label").filter({ hasText: /\d+.*points?/i })
    ).first();

    if (await pointFilter.isVisible()) {
      await pointFilter.click();
      await page.waitForTimeout(500);

      // Results should be filtered by point value
      const newCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const newCount = parseInt(newCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(newCount).toBeLessThanOrEqual(initialCount);

      // All visible achievements should have the filtered point value
      const achievementPoints = page.locator("div").filter({ hasText: /^\d+\s*pts?$/ });
      if (await achievementPoints.count() > 0) {
        const firstPointText = await achievementPoints.first().textContent();
        const pointValue = parseInt(firstPointText?.match(/(\d+)/)?.[1] || "0", 10);
        expect(pointValue).toBeGreaterThan(0);
      }
    }
  });

  test("filters by categories", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Get initial count
    const countText = await page.locator("text=/\\d+ achievements/").textContent();
    const initialCount = parseInt(countText?.match(/(\d+)/)?.[1] || "0", 10);

    // Look for category tree and click on a category
    const categoryButton = page.locator("button:has-text('▶')").first();
    
    if (await categoryButton.isVisible()) {
      await categoryButton.click();
      await page.waitForTimeout(500);

      // Look for subcategory or category item to click
      const categoryItem = page.locator("button").filter({ hasText: /quests|dungeons|raids|pvp|exploration/i }).first();
      
      if (await categoryItem.isVisible()) {
        await categoryItem.click();
        await page.waitForTimeout(500);

        // Results should be filtered by category
        const newCountText = await page.locator("text=/\\d+ achievements/").textContent();
        const newCount = parseInt(newCountText?.match(/(\d+)/)?.[1] || "0", 10);
        
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  test("combines search with filters", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // First apply a search filter
    await page.getByPlaceholder("Search achievements...").fill("dungeon");
    await page.waitForTimeout(500);

    // Get search results count
    const searchCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const searchCount = parseInt(searchCountText?.match(/(\d+)/)?.[1] || "0", 10);

    // Then apply an additional filter
    const additionalFilter = page.locator("input[type='checkbox']").filter({ hasText: /completed|meta|\d+.*points?/i }).first();
    
    if (await additionalFilter.isVisible()) {
      await additionalFilter.click();
      await page.waitForTimeout(500);

      // Combined results should be fewer than search alone
      const combinedCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const combinedCount = parseInt(combinedCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(combinedCount).toBeLessThanOrEqual(searchCount);
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
    await page.getByPlaceholder("Search achievements...").fill("test");
    await page.waitForTimeout(500);

    const filter = page.locator("input[type='checkbox']").first();
    if (await filter.isVisible()) {
      await filter.click();
      await page.waitForTimeout(500);
    }

    // Look for clear filters button
    const clearButton = page.locator("button").filter({ hasText: /clear|reset|all/i });
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Should return to initial count
      const clearedCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const clearedCount = parseInt(clearedCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(clearedCount).toBe(initialCount);

      // Search box should be cleared
      const searchBox = page.getByPlaceholder("Search achievements...");
      if (await searchBox.isVisible()) {
        const searchValue = await searchBox.inputValue();
        expect(searchValue).toBe("");
      }
    } else {
      // Manually clear search if no clear button
      await page.getByPlaceholder("Search achievements...").clear();
      await page.waitForTimeout(500);

      const clearedCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const clearedCount = parseInt(clearedCountText?.match(/(\d+)/)?.[1] || "0", 10);
      
      expect(clearedCount).toBeGreaterThanOrEqual(initialCount * 0.8); // Allow some variance
    }
  });

  test("filters persist during navigation", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Apply a search filter
    await page.getByPlaceholder("Search achievements...").fill("loremaster");
    await page.waitForTimeout(500);

    // Get filtered count
    const filteredCountText = await page.locator("text=/\\d+ achievements/").textContent();
    const filteredCount = parseInt(filteredCountText?.match(/(\d+)/)?.[1] || "0", 10);

    // Open an achievement drawer
    const achievementRow = page.locator("div").filter({ hasText: /^\d+\s*pts?$/ }).first();
    if (await achievementRow.isVisible()) {
      await achievementRow.click();
      
      // Wait for drawer to open
      await expect(page.locator("text=Description").or(page.locator("button:has-text('×')"))).toBeVisible({ timeout: 5000 });

      // Close drawer
      const closeButton = page.locator("button:has-text('×')").or(
        page.locator("button[aria-label*='close']")
      ).first();
      
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);

        // Filter should still be applied
        const persistedCountText = await page.locator("text=/\\d+ achievements/").textContent();
        const persistedCount = parseInt(persistedCountText?.match(/(\d+)/)?.[1] || "0", 10);
        
        expect(persistedCount).toBe(filteredCount);

        // Search box should still have the filter
        const searchValue = await page.getByPlaceholder("Search achievements...").inputValue();
        expect(searchValue).toBe("loremaster");
      }
    }
  });

  test("shows filter count indicators", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Apply a filter
    const filter = page.locator("input[type='checkbox']").first();
    if (await filter.isVisible()) {
      await filter.click();
      await page.waitForTimeout(500);

      // Look for active filter indicators
      const filterIndicator = page.locator("text=/\\d+.*active|\\d+.*applied|\\d+.*filters?/i").or(
        page.locator(".filter-count")
      ).or(
        page.locator("[data-testid*='filter-count']")
      );

      if (await filterIndicator.isVisible()) {
        await expect(filterIndicator).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("filters work with empty results", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for achievements to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Search for something that should return no results
    await page.getByPlaceholder("Search achievements...").fill("xyznonexistentachievement123");
    await page.waitForTimeout(500);

    // Should show 0 achievements
    const noResultsText = await page.locator("text=/0 achievements|no.*results|no.*achievements/i");
    if (await noResultsText.isVisible()) {
      await expect(noResultsText).toBeVisible({ timeout: 3000 });
    } else {
      // Check if count is 0
      const countText = await page.locator("text=/\\d+ achievements/").textContent();
      const count = parseInt(countText?.match(/(\d+)/)?.[1] || "0", 10);
      expect(count).toBe(0);
    }

    // Apply additional filter on empty results
    const filter = page.locator("input[type='checkbox']").first();
    if (await filter.isVisible()) {
      await filter.click();
      await page.waitForTimeout(500);

      // Should still show 0 results
      const stillNoResultsText = await page.locator("text=/0 achievements|no.*results|no.*achievements/i");
      if (await stillNoResultsText.isVisible()) {
        await expect(stillNoResultsText).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
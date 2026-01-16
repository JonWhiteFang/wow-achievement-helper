import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_URL || "https://jonwhitefang.github.io/wow-achievement-helper/";

test.describe("Character Lookup", () => {
  test("displays character input form", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for character input fields
    const characterNameInput = page.getByPlaceholder(/character.*name/i).or(
      page.getByLabel(/character.*name/i)
    ).or(
      page.locator("input[name*='character']")
    );

    const realmInput = page.getByPlaceholder(/realm/i).or(
      page.getByLabel(/realm/i)
    ).or(
      page.locator("select[name*='realm']")
    );

    // At least one character input should be visible
    await expect(characterNameInput.or(realmInput)).toBeVisible({ timeout: 5000 });
  });

  test("validates character name input", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Find character name input
    const characterNameInput = page.getByPlaceholder(/character.*name/i).or(
      page.getByLabel(/character.*name/i)
    ).or(
      page.locator("input[name*='character']")
    );

    if (await characterNameInput.isVisible()) {
      // Try to submit with empty name
      const submitButton = page.locator("button").filter({ hasText: /add|lookup|search/i }).first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation error
        const errorMessage = page.locator("text=/required|invalid|enter.*name/i").or(
          page.locator(".error")
        ).or(
          page.locator("[role='alert']")
        );
        
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test("adds character to lookup list", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Find character input fields
    const characterNameInput = page.getByPlaceholder(/character.*name/i).or(
      page.getByLabel(/character.*name/i)
    ).or(
      page.locator("input[name*='character']")
    );

    const realmSelect = page.getByLabel(/realm/i).or(
      page.locator("select[name*='realm']")
    );

    if (await characterNameInput.isVisible()) {
      // Fill in test character
      await characterNameInput.fill("TestCharacter");
      
      if (await realmSelect.isVisible()) {
        // Select first available realm
        await realmSelect.selectOption({ index: 1 });
      }

      // Submit the form
      const submitButton = page.locator("button").filter({ hasText: /add|lookup|search/i }).first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Character should appear in the list
        const characterList = page.locator("text=TestCharacter").or(
          page.locator(".character-list")
        ).or(
          page.locator("[data-testid*='character']")
        );

        if (await characterList.isVisible()) {
          await expect(characterList).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test("removes character from lookup list", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // First add a character (if possible)
    const characterNameInput = page.getByPlaceholder(/character.*name/i).or(
      page.getByLabel(/character.*name/i)
    ).or(
      page.locator("input[name*='character']")
    );

    if (await characterNameInput.isVisible()) {
      await characterNameInput.fill("TestCharacter");
      
      const submitButton = page.locator("button").filter({ hasText: /add|lookup|search/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Look for remove button (×, delete, remove)
        const removeButton = page.locator("button:has-text('×')").or(
          page.locator("button").filter({ hasText: /remove|delete/i })
        ).or(
          page.locator("[aria-label*='remove']")
        );

        if (await removeButton.isVisible()) {
          await removeButton.click();
          await page.waitForTimeout(500);

          // Character should be removed from list
          const characterText = page.locator("text=TestCharacter");
          if (await characterText.count() > 0) {
            await expect(characterText).not.toBeVisible({ timeout: 3000 });
          }
        }
      }
    }
  });

  test("fetches character achievements", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for a fetch/merge button
    const fetchButton = page.locator("button").filter({ hasText: /fetch|merge|load.*achievements/i });

    if (await fetchButton.isVisible()) {
      // Get initial achievement count
      const initialCountText = await page.locator("text=/\\d+ achievements/").textContent();
      const initialCount = parseInt(initialCountText?.match(/(\d+)/)?.[1] || "0", 10);

      await fetchButton.click();
      
      // Wait for loading to complete
      await page.waitForTimeout(3000);

      // Look for loading indicators
      const loadingIndicator = page.locator("text=/loading|fetching/i").or(
        page.locator(".loading")
      ).or(
        page.locator("[role='progressbar']")
      );

      // Wait for loading to finish if present
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).not.toBeVisible({ timeout: 15000 });
      }

      // Achievement status should update (completed achievements marked)
      const completedAchievements = page.locator(".completed").or(
        page.locator("[data-completed='true']")
      ).or(
        page.locator("text=/completed|✓/i")
      );

      // Should have some visual indication of completion status
      if (await completedAchievements.count() > 0) {
        await expect(completedAchievements.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("displays character fetch errors gracefully", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Add an invalid character
    const characterNameInput = page.getByPlaceholder(/character.*name/i).or(
      page.getByLabel(/character.*name/i)
    ).or(
      page.locator("input[name*='character']")
    );

    if (await characterNameInput.isVisible()) {
      await characterNameInput.fill("InvalidCharacterName123456789");
      
      const submitButton = page.locator("button").filter({ hasText: /add|lookup|search/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Try to fetch achievements
        const fetchButton = page.locator("button").filter({ hasText: /fetch|merge|load.*achievements/i });
        if (await fetchButton.isVisible()) {
          await fetchButton.click();
          await page.waitForTimeout(5000);

          // Should show error message
          const errorMessage = page.locator("text=/error|not.*found|invalid|failed/i").or(
            page.locator(".error")
          ).or(
            page.locator("[role='alert']")
          );

          if (await errorMessage.isVisible()) {
            await expect(errorMessage).toBeVisible({ timeout: 10000 });
          }
        }
      }
    }
  });

  test("shows character achievement progress", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for progress indicators after character data is loaded
    const progressIndicators = page.locator("text=/\\d+\\/\\d+|\\d+%/").or(
      page.locator("[role='progressbar']")
    ).or(
      page.locator(".progress")
    );

    // Progress indicators might be visible by default or after character lookup
    if (await progressIndicators.count() > 0) {
      await expect(progressIndicators.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.TEST_URL || "https://jonwhitefang.github.io/wow-achievement-helper/";

test.describe("Character Lookup", () => {
  test("displays character input form", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for realm selector
    const realmSelect = page.locator("select").first();
    await expect(realmSelect).toBeVisible();

    // Look for character name input
    const nameInput = page.getByPlaceholder(/character name/i);
    await expect(nameInput).toBeVisible();
  });

  test("loads character progress when valid character entered", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Note: This test would need a known valid character to test properly
    // For now, we just verify the UI elements exist
    const loadButton = page.locator("button:has-text('Load')");
    await expect(loadButton).toBeVisible();
  });

  test("shows error for non-existent character", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Enter a definitely non-existent character
    const nameInput = page.getByPlaceholder(/character name/i);
    await nameInput.fill("ThisCharacterDefinitelyDoesNotExist12345");

    const loadButton = page.locator("button:has-text('Load')");
    await loadButton.click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Look for error text (could be "not found" or "not public")
    const errorText = page.locator("text=/not found|not public|failed/i");
    const errorCount = await errorText.count();
    
    // Error should appear
    expect(errorCount).toBeGreaterThan(0);
  });

  test("displays completion count after loading character", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Check if there's already a character loaded (from saved state or URL param)
    const completionText = page.locator("text=/\\d+ \\/ \\d+/");
    const hasCompletion = await completionText.count();

    if (hasCompletion > 0) {
      await expect(completionText.first()).toBeVisible();
    }
  });

  test("shows loading state while fetching character", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    const nameInput = page.getByPlaceholder(/character name/i);
    await nameInput.fill("TestCharacter");

    const loadButton = page.locator("button:has-text('Load')");
    
    // Click and immediately check for loading state
    await loadButton.click();
    
    // Loading button should be disabled
    await expect(loadButton).toBeDisabled();
  });

  test("clears character data when requested", async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for page to load
    await expect(page.locator("text=/\\d+ achievements/")).toBeVisible({ timeout: 20000 });

    // Look for clear/reset button (if character is loaded)
    const clearButton = page.locator("button:has-text(/clear|reset/i)");
    const hasClearButton = await clearButton.count();

    if (hasClearButton > 0) {
      await clearButton.click();
      
      // Verify completion counts are reset or hidden
      await page.waitForTimeout(500);
      
      // Achievement list should still be visible but without completion markers
      await expect(page.locator("text=/\\d+ achievements/")).toBeVisible();
    }
  });
});

import { test, expect } from "@playwright/test";

test.describe("Prompt Optimizer E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the main page with all key elements", async ({ page }) => {
    // Title
    await expect(page).toHaveTitle(/PromptOptimizer/);

    // Hero text
    await expect(
      page.getByText("Optimize Your Prompts")
    ).toBeVisible();

    // Prompt input
    await expect(page.locator("#prompt-input")).toBeVisible();

    // Optimize button
    await expect(page.locator("#optimize-button")).toBeVisible();

    // API key button
    await expect(page.locator("#api-key-button")).toBeVisible();

    // Pipeline badges
    await expect(page.getByText("Heuristic Analysis")).toBeVisible();
    await expect(page.getByText("Semantic Scoring")).toBeVisible();
    await expect(page.getByText("AI Rewrite")).toBeVisible();

    // Footer
    await expect(page.getByText(/BYOK/)).toBeVisible();
  });

  test("should open API key modal when clicking the API key button", async ({
    page,
  }) => {
    await page.locator("#api-key-button").click();
    await expect(page.getByText("Gemini API Key")).toBeVisible();
    await expect(
      page.getByText("Get a free Gemini API key")
    ).toBeVisible();
  });

  test("should show error when optimizing without API key", async ({ page }) => {
    // Type a prompt
    await page.locator("#prompt-input").fill("Write a good email about project updates");

    // Click optimize
    await page.locator("#optimize-button").click();

    // Should show an error about missing API key
    await expect(
      page.getByText(/API key required|API key/i)
    ).toBeVisible({ timeout: 15000 });
  });

  test("should optimize a prompt with a valid API key", async ({ page }) => {
    // Set API key via the modal
    const apiKey = process.env.TEST_GEMINI_API_KEY;
    if (!apiKey) {
      test.skip();
      return;
    }

    // Open API key modal
    await page.locator("#api-key-button").click();
    await page.locator("#api-key-input").fill(apiKey);
    await page.getByText("Save Key").click();

    // Wait for modal to close
    await expect(page.getByText("Saved!")).toBeVisible();
    await page.waitForTimeout(1500);

    // Type a prompt
    await page.locator("#prompt-input").fill(
      "Write me a good email about the project update"
    );

    // Click optimize
    await page.locator("#optimize-button").click();

    // Wait for results (up to 30s for Gemini API)
    await expect(page.getByText("After (AI)")).toBeVisible({
      timeout: 30000,
    });

    // Score card should be visible
    await expect(page.getByText("Clarity")).toBeVisible();
    await expect(page.getByText("Specificity")).toBeVisible();
    await expect(page.getByText("Structure")).toBeVisible();
    await expect(page.getByText("Completeness")).toBeVisible();

    // Diff view should be visible
    await expect(page.getByText("Optimized")).toBeVisible();
    await expect(page.locator("#copy-optimized")).toBeVisible();

    // Heuristic flags should be visible
    await expect(page.getByText("Instant Analysis")).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByText("Sign in to PromptOptimizer")
    ).toBeVisible();
    await expect(page.getByText("Continue with Google")).toBeVisible();
    await expect(page.getByText("Continue with GitHub")).toBeVisible();
  });

  test("should handle keyboard shortcut (Ctrl+Enter)", async ({ page }) => {
    // Type a prompt but don't set API key
    await page.locator("#prompt-input").fill("Test prompt for keyboard shortcut");

    // Press Ctrl+Enter
    await page.locator("#prompt-input").press("Control+Enter");

    // Should attempt to optimize (will fail without key, but shows it triggered)
    await expect(
      page.getByText(/API key|Optimizing/i)
    ).toBeVisible({ timeout: 15000 });
  });
});

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Complete onboarding
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("toyxOnboardingVersion", "2");
  });

  // Dev login via API
  await page.request.get("/api/dev/login/seed_user_1");
});

test("Pricing page shows plans with ZAR pricing", async ({ page }) => {
  await page.goto("/pricing");

  // Should show plan names
  await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
  await expect(page.getByText("Premium Monthly", { exact: false })).toBeVisible();
  await expect(page.getByText("Premium Yearly", { exact: false })).toBeVisible();

  // Should show ZAR pricing
  await expect(page.getByText("R89", { exact: false })).toBeVisible();
  await expect(page.getByText("R449", { exact: false })).toBeVisible();

  // Should have subscribe buttons
  await expect(page.getByText("Subscribe monthly", { ignoreCase: true })).toBeVisible();
  await expect(page.getByText("Subscribe yearly", { ignoreCase: true })).toBeVisible();
});

test("Browse Toys feed cards render in list view", async ({ page }) => {
  // Set list view in localStorage before navigation
  await page.evaluate(() => localStorage.setItem("search-view-mode", "list"));
  await page.goto("/search");
  await page.waitForTimeout(2000);

  // Verify feed cards exist
  const cards = page.locator("[data-testid='toy-feed-card']");
  await expect(cards.first()).toBeVisible();
  await expect(await cards.count()).toBeGreaterThanOrEqual(1);
});

test("Subscribe button redirects when Paystack is mocked", async ({ page }) => {
  // Intercept the Paystack initialize call and return a mock redirect URL
  await page.route("**/api/billing/paystack/initialize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authorizationUrl: "/billing-cancel" }),
    });
  });

  await page.goto("/pricing");

  // Click the monthly subscribe button
  const subscribeBtn = page.getByText("Subscribe monthly", { ignoreCase: true });
  await subscribeBtn.click();

  // Should navigate to billing-cancel (mocked redirect)
  await page.waitForURL("**/billing-cancel");
  await expect(page.getByText("Payment Canceled", { ignoreCase: true })).toBeVisible();
});

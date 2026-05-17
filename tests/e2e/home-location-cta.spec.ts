import { test, expect } from "@playwright/test";

test("Home shows Enable Location CTA when location is disabled", async ({ page }) => {
  await page.goto("/");
  await page.request.get("/api/dev/login/seed_user_1");
  await page.request.patch("/api/users/profile", { data: { onboardingVersion: 2 } });
  await page.request.post("/api/users/location", { data: { enabled: false } });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Enable location").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Enable now")).toBeVisible({ timeout: 5000 });
});

import { test, expect, Page } from "@playwright/test";

const PAGES = ["/", "/profile", "/search", "/pricing"];

const IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23ddd'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='24'>ToyX</text></svg>";

const SCREENSHOT_OPTS = {
  fullPage: true,
  animations: "disabled",
} as const;

const MOCK_TOYS = [
  {
    id: 1,
    name: "Lego Classic Set",
    category: "Building",
    condition: "Like New",
    ageGroup: "3-5",
    location: "Cape Town, SA",
    description: "A classic Lego building set with 500 pieces.",
    imageUrls: [IMG],
    isAvailable: true,
    ownerId: "seed_user_2",
    owner: { firstName: "Jane", email: "parent2@test.com" },
    ownerRating: 4.5,
    distance: "0.5",
    createdAt: new Date().toISOString(),
    isFavorited: false,
  },
  {
    id: 2,
    name: "Teddy Bear Giant",
    category: "Dolls",
    condition: "Excellent",
    ageGroup: "0-3",
    location: "Johannesburg, SA",
    description: "Large soft teddy bear, great condition.",
    imageUrls: [IMG],
    isAvailable: true,
    ownerId: "seed_user_3",
    owner: { firstName: "Bob", email: "parent3@test.com" },
    ownerRating: 4.8,
    distance: "2.1",
    createdAt: new Date().toISOString(),
    isFavorited: false,
  },
  {
    id: 3,
    name: "Remote Control Car",
    category: "Outdoor",
    condition: "Good",
    ageGroup: "5-8",
    location: "Durban, SA",
    description: "Fast RC car with rechargeable battery.",
    imageUrls: [IMG],
    isAvailable: true,
    ownerId: "seed_user_2",
    owner: { firstName: "Jane", email: "parent2@test.com" },
    ownerRating: 4.2,
    distance: "5.0",
    createdAt: new Date().toISOString(),
    isFavorited: false,
  },
  {
    id: 4,
    name: "Board Game Collection",
    category: "Board Games",
    condition: "Excellent",
    ageGroup: "8+",
    location: "Pretoria, SA",
    description: "Collection of 5 family board games.",
    imageUrls: [IMG],
    isAvailable: true,
    ownerId: "seed_user_3",
    owner: { firstName: "Bob", email: "parent3@test.com" },
    ownerRating: 4.0,
    distance: "3.2",
    createdAt: new Date().toISOString(),
    isFavorited: false,
  },
];

async function mockApi(page: Page) {
  await page.route("**/api/toys*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_TOYS) });
  });
  await page.route("**/api/auth/user", async (route) => {
    await route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify({
        id: "seed_user_1",
        email: "parent@test.com",
        firstName: "Test",
        lastName: "User",
        location: "Cape Town, SA",
        profileImageUrl: null,
        bio: "Test user bio",
        phone: null,
        plan: "free",
        subscriptionStatus: "inactive",
        createdAt: new Date().toISOString(),
      }),
    });
  });
  await page.route("**/api/favorites*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    } else {
      await route.continue();
    }
  });
  await page.route("**/api/users/*/toys", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_TOYS) });
  });
  await page.route("**/api/users/*/rating", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ rating: 4.5 }) });
  });
  await page.route("**/api/users/*/reviews", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/api/exchanges", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
  await page.route("**/api/recommendations/home", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      forYou: MOCK_TOYS.slice(0, 2),
      nearYou: MOCK_TOYS.slice(0, 3),
      recentlyAdded: MOCK_TOYS,
      meta: { usedLocation: false, radiusKm: 20, topAges: ["3-5", "5-8", "8+"], topCategories: ["Building", "Dolls"] },
    }) });
  });
}

test.describe("Visual regression — light mode", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("toyxOnboardingVersion", "2"));
    await page.request.get("/api/dev/login/seed_user_1");
    await page.emulateMedia({ colorScheme: "light" });
  });

  for (const route of PAGES) {
    test(`${route} — light`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, "_")}_light.png`, SCREENSHOT_OPTS);
    });
  }
});

test.describe("Visual regression — dark mode", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("toyxOnboardingVersion", "2"));
    await page.request.get("/api/dev/login/seed_user_1");
    await page.emulateMedia({ colorScheme: "dark" });
  });

  for (const route of PAGES) {
    test(`${route} — dark`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot(`${route.replace(/\//g, "_")}_dark.png`, SCREENSHOT_OPTS);
    });
  }
});

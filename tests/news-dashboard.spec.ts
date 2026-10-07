import { test, expect } from "@playwright/test";

const articles = Array.from({ length: 8 }, (_, index) => ({
  id: `https://example.org/news-${index + 1}`,
  title: `Test headline ${index + 1}`,
  url: `https://example.org/news-${index + 1}`,
  source: "Example publisher",
  author: null,
  publishedAt: "2026-10-06T09:00:00.000Z",
  categories: index === 0 ? ["Faith"] : index === 1 ? ["Exploration"] : ["Africa"],
}));

test.beforeEach(async ({ page }) => {
  await page.route("**/api/news", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        articles,
        scripture: {
          reference: "John 14:6",
          text: "Test scripture.",
          translation: "World English Bible (WEB)",
          dateLabel: "Tuesday, 6 October 2026",
          licenseUrl: "https://ebible.org/Scriptures/details.php?id=engwebp",
        },
        errors: [],
      }),
    }),
  );
});

test("News is in the main menu, not the homepage, and displays five headlines per page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "News & Daily Scripture" })).toHaveCount(0);

  const newsLink = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "News" });
  await expect(newsLink).toHaveAttribute("href", "/news");
  await page.goto("/news");
  await expect(page).toHaveURL(/\/news$/);

  const cards = page.getByTestId("news-article");
  await expect(cards).toHaveCount(5);
  await expect(page.getByText("Showing 1–5 of 8 headlines · Page 1 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(cards).toHaveCount(3);
  await expect(page.getByText("Showing 6–8 of 8 headlines · Page 2 of 2")).toBeVisible();

  await page.getByRole("button", { name: "Previous" }).click();
  await expect(cards).toHaveCount(5);
});

test("the mobile menu navigates to the News page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "News" }).click();
  await expect(page).toHaveURL(/\/news$/);
  await expect(page.getByRole("heading", { name: "News & Daily Scripture" })).toBeVisible();
  await expect(page.getByTestId("news-article")).toHaveCount(5);
});

test("the History & Exploration filter shows only exploration headlines", async ({ page }) => {
  await page.goto("/news");
  await page.getByRole("button", { name: "🏛️ History & Exploration" }).click();

  const cards = page.getByTestId("news-article");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Test headline 2");
  await expect(page.getByRole("button", { name: "🏛️ History & Exploration" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

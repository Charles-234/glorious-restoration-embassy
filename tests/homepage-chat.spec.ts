import { expect, test } from "@playwright/test";

test("homepage exposes the website assistant without a placeholder Telegram link", async ({ page }) => {
  await page.goto("/");

  const assistant = page.getByRole("region", { name: "Website AI assistant" });
  await expect(assistant).toBeVisible();
  await expect(assistant.getByRole("heading", { name: "Spiritual Guidance Chat" })).toBeVisible();
  await expect(assistant.getByRole("note")).toContainText(/AI responses can be inaccurate or incomplete/i);
  await expect(assistant.getByPlaceholder(/Type a question/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask AI Assistant" })).toHaveAttribute(
    "href",
    "#website-assistant",
  );
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("main")).not.toContainText(/24\/7|counseling queue|location routing/i);
  await expect(page.locator('a[href^="https://t.me/"]')).toHaveCount(0);
});

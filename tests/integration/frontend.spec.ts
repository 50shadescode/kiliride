import { test, expect } from "@playwright/test";

test("catalogue, vehicle IDs and WhatsApp quote remain intact", async ({ page }) => {
  await page.goto("/services");
  await page.getByRole("link", { name: /Premium Car Hire/ }).click();
  await expect(page).toHaveURL(/\/services\/vehicles$/);
  await expect(page.getByText("Toyota Vitz", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "View Details" }).first().click();
  await expect(page).toHaveURL(/\/vehicles\/vitz-142s$/);
  await page.getByPlaceholder("Enter your full name").fill("Synthetic renter");
  await page.getByPlaceholder("07XXXXXXXX").fill("0700000000");
  await page.locator('input[type="date"]').nth(0).fill("2026-10-29");
  await page.locator('input[type="date"]').nth(1).fill("2026-11-01");
  const href = await page.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href");
  const url = new URL(href!);
  expect(url.hostname).toBe("wa.me"); expect(url.pathname).toBe("/254726063889");
  const message = url.searchParams.get("text")!;
  expect(message).toContain("3 day(s)"); expect(message).toContain("11,000"); expect(message).toContain("manager confirmation");
  expect((await page.request.get("/vehicles/not-a-vehicle")).status()).toBe(404);
  expect((await page.request.get("/services/sgr")).status()).toBe(404);
});

test("identity forms expose labels, keyboard controls and mobile layout", async ({ page }) => {
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/signup");
    await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("minlength", "12");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto("/login");
  await page.getByLabel("Email address").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await page.goto("/reset-password");
  await page.getByLabel("Password", { exact: true }).fill("Synthetic-only-password-123");
  await page.getByRole("button", { name: "Set a new password" }).click();
  await expect(page.getByRole("status")).toContainText("missing or invalid");
});

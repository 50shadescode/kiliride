import { test, expect } from "@playwright/test";
test("default legacy mode preserves compatibility and cannot be overridden from the browser", async ({ page, request }) => {
  const result = await (await request.get("/api/public/vehicles", { headers: { "x-kiliride-db-catalogue": "true", cookie: "KILIRIDE_DB_CATALOGUE=true" } })).json();
  expect(result.vehicles.map((v: { id: string }) => v.id)).toEqual(["vitz-142s", "note-131c"]);
  for (const v of result.vehicles) { expect(v.reviewStatus).toBe("legacy"); expect(v.baseHalfDay).toBe(2500); expect(v.baseFullDay).toBe(3500); expect(v.reservationFee).toBe(500); expect(v.plate).toBeUndefined(); expect(v.isVerified).toBeUndefined(); }
  expect((await request.get("/api/public/vehicles?KILIRIDE_DB_CATALOGUE=true")).status()).toBe(400);
  await page.setViewportSize({ width: 375, height: 900 }); await page.goto("/services/vehicles");
  await expect(page.getByText("Legacy listing · review pending")).toHaveCount(2);
  for (const claim of ["Verified", "Available Today", "Reserved until 4:00 PM"]) await expect(page.getByText(claim, { exact: true })).toHaveCount(0);
  await expect(page.getByText("Photograph unavailable")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/vehicles/note-131c"); await expect(page.getByRole("heading", { name: "Nissan Note e-Power", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Enquire about this vehicle" })).toBeVisible();
  expect((await request.get("/api/public/vehicles/absent")).status()).toBe(404);
});

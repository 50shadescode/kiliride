import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { catalogueFixtures } from "../helpers/catalogue-fixtures";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
const pool = new Pool({ connectionString: assertLocalDatabase(process.env.TEST_DATABASE_URL, true) });
let f: Awaited<ReturnType<typeof catalogueFixtures>>;
test.beforeAll(() => {
  expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL); expect(process.env.KILIRIDE_DB_CATALOGUE).toBe("true");
  f = JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "tests/helpers/catalogue-fixtures.ts", "--emit"], { env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
});
test.afterAll(async () => { await pool.end(); });
test("database public API and pages expose only eligible public fields, bounded filters and authorized photographs", async ({ request }) => {
  const response = await request.get(`/api/public/vehicles?q=${f.query}`); expect(response.status()).toBe(200); expect(response.headers()["cache-control"]).toContain("no-store");
  const result = await response.json(); expect(result.total).toBe(2); expect(result.vehicles.map((v: { id: string }) => v.id)).toEqual(f.records.slice(0,2).map(v => v.publicId));
  const text = JSON.stringify(result);
  for (const key of ["registration", "plate", "ownerId", "storageKey", "objectKey", "sha256", "evidenceReference", "reviewerId", "PRIVATE-"]) expect(text).not.toContain(key);
  for (const v of f.records.slice(2)) {
    expect((await request.get(`/api/public/vehicles/${v.publicId}`)).status()).toBe(404);
    expect((await request.get(`/vehicles/${v.publicId}`)).status()).toBe(404);
    expect((await request.get(`/api/public/vehicles/${v.publicId}/photos/${v.photoId}`)).status()).toBe(404);
  }
  for (const id of ["vitz-142s", "note-131c", f.records[0].id, "unknown-vehicle"]) expect((await request.get(`/vehicles/${id}`)).status()).toBe(404);
  const photo = result.vehicles[0].photos[0].url;
  const bytes = await request.get(photo); expect(bytes.status()).toBe(200); expect(bytes.headers()["cache-control"]).toContain("no-store"); expect(bytes.headers()["content-type"]).toBe("image/webp");
  expect((await request.get(`/_next/image?url=${encodeURIComponent(photo)}&w=640&q=75`)).status()).toBe(400);
  expect((await request.get(`/api/public/vehicles/${f.records[0].publicId}/photos/${f.records[1].photoId}`)).status()).toBe(404);
  for (const query of ["pageSize=25", "pageSize=100000", "status=APPROVED", "mode=legacy", "q=a&q=b"]) expect((await request.get(`/api/public/vehicles?${query}`)).status()).toBe(400);
  const sorted = await (await request.get(`/api/public/vehicles?q=${f.query}&sort=price-desc&pageSize=1&page=2`)).json(); expect(sorted.vehicles[0].id).toBe(f.records[0].publicId);
  expect((await (await request.get(`/api/public/vehicles?q=${randomUUID()}`)).json()).vehicles).toEqual([]);
});
test("mobile and desktop catalogue, filters, photos and WhatsApp enquiry use public DTOs", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 }); await page.goto(`/services/vehicles?q=${f.query}&pageSize=1`);
  await expect(page.getByRole("heading", { name: "Premium Car Hire", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Details", exact: true })).toHaveCount(1);
  await expect(page.getByRole("img")).toHaveCount(1);
  await page.getByLabel("Make or model").focus(); await page.keyboard.press("Tab"); await expect(page.getByLabel("Category", { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Next page" }).click(); await expect(page).toHaveURL(/page=2/);
  await page.getByRole("link", { name: "View Details", exact: true }).click(); await expect(page).toHaveURL(new RegExp(f.records[1].publicId));
  await expect(page.getByRole("heading", { name: `${f.query} Synthetic 1`, exact: true })).toBeVisible();
  expect(await page.locator("main").textContent()).not.toContain("PRIVATE-");
  await page.getByLabel("Full Name", { exact: true }).fill("Synthetic renter");
  await page.getByLabel("Pickup Date").fill("2026-11-01"); await page.getByLabel("Return Date").fill("2026-11-04");
  const message = new URL((await page.getByRole("link", { name: "Continue on WhatsApp" }).getAttribute("href"))!).searchParams.get("text")!;
  expect(message).toContain(f.records[1].publicId); expect(message).toContain("3 day(s)"); expect(message).toContain("10,503"); expect(message).toContain("enquiry only"); expect(message).not.toContain("Plate:");
  await page.setViewportSize({ width: 1280, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto(`/services/vehicles?q=${f.query}`); await page.getByLabel("Minimum seats").fill("6"); await page.getByRole("button", { name: "Search vehicles" }).click(); await expect(page.getByRole("link", { name: "View Details", exact: true })).toHaveCount(1);
  await page.getByLabel("Make or model").fill(randomUUID()); await page.getByRole("button", { name: "Search vehicles" }).click(); await expect(page.getByRole("heading", { name: "No vehicles match your search" })).toBeVisible();
});
test("committed suspension and deactivated policy withdraw warm detail/photo/list URLs without fallback", async ({ request }) => {
  const v = f.records[0], detail = `/vehicles/${v.publicId}`, photo = `/api/public/vehicles/${v.publicId}/photos/${v.photoId}`;
  const first = await request.get(detail); expect(first.status()).toBe(200); expect(first.headers()["cache-control"]).toContain("no-store"); expect((await request.get(photo)).status()).toBe(200);
  const suspension = await request.post(`/api/admin/vehicles/${v.id}/decision`, { headers: { cookie: f.admin.cookie, origin: "http://localhost:3101" }, data: { expectedRevision: 2, toStatus: "SUSPENDED", reason: "Synthetic publication withdrawal test" } }); expect(suspension.status()).toBe(200);
  expect((await request.get(detail)).status()).toBe(404); expect((await request.get(photo, { headers: { "if-none-match": "previous-image" } })).status()).toBe(404);
  expect((await (await request.get(`/api/public/vehicles?q=${f.query}`)).json()).total).toBe(1);
  await pool.query('UPDATE "VehicleVerificationPolicy" SET enabled=false WHERE version=$1 AND "testOnly"=true', [f.policyVersion]);
  expect((await request.get(`/vehicles/${f.records[1].publicId}`)).status()).toBe(404);
  const empty = await (await request.get(`/api/public/vehicles?q=${f.query}`)).json(); expect(empty.total).toBe(0); expect(empty.vehicles).toEqual([]);
  expect((await request.get("/vehicles/vitz-142s")).status()).toBe(404);
});

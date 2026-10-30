import { test, expect, request as requests, type APIRequestContext } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";

const base = "http://localhost:3100";
const pool = new Pool({ connectionString: assertLocalDatabase(process.env.TEST_DATABASE_URL, true), max: 2 });
type Actor = { id: string; client: APIRequestContext };
let host: Actor, other: Actor, customer: Actor, anonymous: APIRequestContext;
const values = () => ({ make: "Synthetic", model: "Browser fixture", category: "Test", location: "Test location", description: "Synthetic test vehicle only.", registrationNumber: `S-${randomUUID()}`, seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500 });

async function actor(isHost: boolean): Promise<Actor> {
  const client = await requests.newContext({ baseURL: base, extraHTTPHeaders: { origin: base } });
  const email = `host-browser-${randomUUID()}@kiliride.test`, password = randomBytes(24).toString("hex");
  async function auth(path: string, data: object) {
    let response = await client.post(`/api/auth/${path}`, { data });
    if (response.status() === 429) {
      await new Promise(resolve => setTimeout(resolve, Math.min(61, Math.max(11, Number(response.headers()["retry-after"]) || 11)) * 1000));
      response = await client.post(`/api/auth/${path}`, { data });
    }
    expect(response.status()).toBe(200);
  }
  await auth("sign-up/email", { email, password, name: "Synthetic host browser actor" });
  // Synthetic authorization fixture only. Real email verification, controlled role
  // activation and MFA are exercised in identity.spec.ts, never bypassed in app code.
  const { rows } = await pool.query<{ id: string }>('UPDATE "User" SET "emailVerified" = true WHERE email = $1 RETURNING id', [email]);
  const id = rows[0].id;
  if (isHost) await pool.query('INSERT INTO "RoleAssignment" ("userId",role,"createdAt") VALUES ($1,\'HOST\',$2)', [id, new Date(0)]);
  await auth("sign-in/email", { email, password });
  return { id, client };
}
test.beforeAll(async () => {
  test.setTimeout(180_000);
  expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
  expect((await pool.query('SELECT current_database() AS name')).rows[0].name).toBe("kiliride_test");
  host = await actor(true); other = await actor(true); customer = await actor(false);
  anonymous = await requests.newContext({ baseURL: base, extraHTTPHeaders: { origin: base } });
});
test.afterAll(async () => {
  for (const client of [host?.client, other?.client, customer?.client, anonymous]) await client?.dispose();
  await pool.end();
});

test("host dashboard creates drafts, validates submission, displays feedback and resubmits on mobile and desktop", async ({ page }) => {
  await page.context().addCookies((await host.client.storageState()).cookies);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/host");
  await expect(page.getByRole("heading", { name: "No vehicles yet" })).toBeVisible();
  await page.getByRole("link", { name: "Add a vehicle" }).click();
  await expect(page.getByRole("button", { name: "Save draft", exact: true })).toBeEnabled();
  await page.getByLabel("Make", { exact: true }).fill("Synthetic");
  await page.getByLabel("Model", { exact: true }).fill("Browser fixture");
  await page.getByLabel("Category", { exact: true }).fill("Test");
  await page.getByLabel("Location", { exact: true }).fill("Test location");
  await page.getByLabel("Seats", { exact: true }).fill("5");
  await page.getByLabel("Half-day base price (KES)", { exact: true }).fill("2500");
  await page.getByLabel("Full-day base price (KES)", { exact: true }).fill("3500");
  await page.getByLabel("Fuel type", { exact: true }).selectOption("Petrol");
  await page.getByLabel("Transmission", { exact: true }).selectOption("Automatic");
  await page.getByLabel("Make", { exact: true }).focus(); await page.keyboard.press("Tab");
  await expect(page.getByLabel("Model", { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/host\/vehicles\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByRole("button", { name: "Submit for review", exact: true }).click();
  await expect(page.getByText("Add a description before submitting for review.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Registration number", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Description", { exact: true }).fill("Synthetic browser vehicle. Not real inventory.");
  await page.getByLabel("Registration number", { exact: true }).fill(`S-${randomUUID()}`);
  await expect(page.getByRole("button", { name: "Submit for review", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved.");
  await page.getByRole("button", { name: "Submit for review", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Submitted for review");
  await expect(page.getByLabel("Make", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Submit for review", exact: true })).toHaveCount(0);
  expect((await page.request.get(`/vehicles/${(await (await host.client.get(`/api/host/vehicles/${id}`)).json()).publicId}`)).status()).toBe(404);

  // Seed a clearly synthetic independent rejection to exercise feedback UI.
  // No admin approval API/UI is introduced by this milestone.
  await pool.query('INSERT INTO "RoleAssignment" ("userId",role,"createdAt") VALUES ($1,\'ADMIN\',$2)', [other.id, new Date(0)]);
  await pool.query('UPDATE "User" SET "twoFactorEnabled" = true WHERE id = $1', [other.id]);
  const connection = await pool.connect();
  const feedback = "Synthetic feedback: clarify the description. <script>test-only</script>";
  try {
    await connection.query("BEGIN");
    const { rows } = await connection.query('SELECT revision FROM "Vehicle" WHERE id = $1 FOR UPDATE', [id]);
    await connection.query('INSERT INTO "VehicleReview" ("vehicleId","reviewerId",decision,"vehicleRevision",reason,"evidenceReference") VALUES ($1,$2,\'REJECTED\',$3,$4,$5)', [id, other.id, rows[0].revision, feedback, "PRIVATE-SYNTHETIC-EVIDENCE"]);
    await connection.query('UPDATE "Vehicle" SET status = \'REJECTED\', revision = revision + 1 WHERE id = $1', [id]);
    await connection.query('INSERT INTO "VehicleListingEvent" ("vehicleId","actorId","fromStatus","toStatus",reason) VALUES ($1,$2,\'PENDING_REVIEW\',\'REJECTED\',$3)', [id, other.id, feedback]);
    await connection.query('INSERT INTO "AuditLog" ("actorId","subjectId",action,reason) VALUES ($1,$2,\'SYNTHETIC_BROWSER_REJECTION\',$3)', [other.id, id, feedback]);
    await connection.query("COMMIT");
  } catch (error) { await connection.query("ROLLBACK"); throw error; }
  finally { connection.release(); }
  await page.reload();
  await expect(page.getByText(feedback, { exact: true })).toBeVisible();
  expect(await page.locator("main").textContent()).not.toContain("PRIVATE-SYNTHETIC-EVIDENCE");
  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel("Description", { exact: true }).fill("Revised synthetic browser description.");
  await page.getByRole("button", { name: "Save revised draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved.");
  await page.getByRole("button", { name: "Submit for review", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Submitted for review");
  await page.getByRole("link", { name: "Back to your vehicles" }).click();
  await expect(page.getByText("Pending review", { exact: true })).toBeVisible();
});

test("host HTTP routes enforce roles, record ownership, validation, concurrency and CSRF", async () => {
  const input = values();
  const created = await host.client.post("/api/host/vehicles", { data: input });
  expect(created.status()).toBe(201);
  expect(created.headers()["cache-control"]).toContain("no-store");
  const vehicle = await created.json();
  const path = `/api/host/vehicles/${vehicle.id}`;
  for (const [client, status] of [[anonymous, 401], [customer.client, 403]] as const) {
    expect((await client.get("/api/host/vehicles")).status()).toBe(status);
    expect((await client.post("/api/host/vehicles", { data: values() })).status()).toBe(status);
    expect((await client.get(path)).status()).toBe(status);
    expect((await client.patch(path, { data: { ...input, expectedRevision: 0 } })).status()).toBe(status);
    expect((await client.post(`${path}/submit`, { data: { expectedRevision: 0 } })).status()).toBe(status);
  }
  expect((await anonymous.get("/host", { maxRedirects: 0 })).status()).toBe(307);
  expect((await customer.client.get("/host/vehicles/new")).status()).toBe(404);
  expect((await other.client.get(path)).status()).toBe(404);
  expect((await other.client.get(`/host/vehicles/${vehicle.id}`)).status()).toBe(404);
  expect((await other.client.patch(path, { data: { ...input, expectedRevision: 0 } })).status()).toBe(404);
  expect((await other.client.post(`${path}/submit`, { data: { expectedRevision: 0 } })).status()).toBe(404);
  const otherList = await (await other.client.get("/api/host/vehicles")).json() as { vehicles: { id: string }[] };
  expect(otherList.vehicles.some(v => v.id === vehicle.id)).toBe(false);
  const legacy = await pool.query('SELECT "vehicleId" FROM "LegacyVehicleImport"');
  expect(legacy.rows.length).toBe(2);
  for (const row of legacy.rows) {
    expect((await host.client.get(`/api/host/vehicles/${row.vehicleId}`)).status()).toBe(404);
    expect((await host.client.patch(`/api/host/vehicles/${row.vehicleId}`, { data: { ...input, expectedRevision: 0 } })).status()).toBe(404);
  }
  for (const origin of ["https://attacker.invalid", "null", ""]) {
    expect((await host.client.post("/api/host/vehicles", { headers: { origin }, data: values() })).status()).toBe(403);
    expect((await host.client.patch(path, { headers: { origin }, data: { ...input, expectedRevision: 0 } })).status()).toBe(403);
    expect((await host.client.post(`${path}/submit`, { headers: { origin }, data: { expectedRevision: 0 } })).status()).toBe(403);
  }
  const noOrigin = await requests.newContext({ baseURL: base, storageState: await host.client.storageState() });
  try { expect((await noOrigin.post(`${path}/submit`, { data: { expectedRevision: 0 } })).status()).toBe(403); }
  finally { await noOrigin.dispose(); }
  for (const forged of [{ ownerId: other.id }, { status: "APPROVED" }, { publicId: "vitz-142s" }]) {
    expect((await host.client.post("/api/host/vehicles", { data: { ...values(), ...forged } })).status()).toBe(400);
    expect((await host.client.patch(path, { data: { ...input, expectedRevision: 0, ...forged } })).status()).toBe(400);
  }
  expect((await host.client.post(`${path}/submit`, { data: { expectedRevision: 0, status: "APPROVED" } })).status()).toBe(400);
  expect((await host.client.patch(path, { data: { ...input, baseFullDay: -1, expectedRevision: 0 } })).status()).toBe(400);
  expect((await host.client.post("/api/host/vehicles", { headers: { "content-type": "application/json" }, data: "{" })).status()).toBe(400);
  expect((await host.client.post("/api/host/vehicles", { headers: { "content-type": "text/plain" }, data: "{}" })).status()).toBe(415);
  expect((await host.client.post("/api/host/vehicles", { data: { ...values(), description: "x".repeat(17000) } })).status()).toBe(413);
  const edit = await host.client.patch(path, { data: { ...input, expectedRevision: 0 } });
  expect(edit.status()).toBe(200);
  expect((await host.client.patch(path, { data: { ...input, expectedRevision: 0 } })).status()).toBe(409);
  expect((await host.client.post(`${path}/submit`, { data: { expectedRevision: 1 } })).status()).toBe(200);
  expect((await host.client.post(`${path}/submit`, { data: { expectedRevision: 1 } })).status()).toBe(409);
  expect((await host.client.patch(path, { data: { ...input, expectedRevision: 2 } })).status()).toBe(409);
  await pool.query('DELETE FROM "RoleAssignment" WHERE "userId" = $1 AND role = \'HOST\'', [host.id]);
  expect((await host.client.get(path)).status()).toBe(403);
  expect((await host.client.patch(path, { data: { ...input, expectedRevision: 2 } })).status()).toBe(403);
});

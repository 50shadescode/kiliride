import { test, expect, request as requests, type APIRequestContext } from "@playwright/test";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { Pool } from "pg";
import sharp from "sharp";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { verificationChecks } from "../../src/lib/validation/vehicle-review";
import { syntheticMatrix, syntheticAssessment } from "../helpers/compliance-fixture";
const base = "http://localhost:3100";
const pool = new Pool({ connectionString: assertLocalDatabase(process.env.TEST_DATABASE_URL, true), max: 2 });
type Actor = { id: string; email: string; password: string; client: APIRequestContext };
let admin: Actor, host: Actor, customer: Actor, noMfa: Actor, anonymous: APIRequestContext;
const policyVersion = `SYNTHETIC-BROWSER-${randomUUID()}`;
const reason = "Synthetic browser decision; no real verification performed";
const checklist = Object.fromEntries(verificationChecks.map(check => [check.key, { confirmed: true, evidenceReference: `SYNTHETIC PROTOCOL ONLY ${check.key}` }]));
async function post(client: APIRequestContext, path: string, data: object) {
  let response = await client.post(`/api/auth/${path}`, { data });
  if (response.status() === 429) { await new Promise(resolve => setTimeout(resolve, Math.min(61, Math.max(11, Number(response.headers()["retry-after"]) || 11)) * 1000)); response = await client.post(`/api/auth/${path}`, { data }); }
  return response;
}
async function actor(role?: "HOST" | "ADMIN"): Promise<Actor> {
  const client = await requests.newContext({ baseURL: base, extraHTTPHeaders: { origin: base } });
  const email = `admin-browser-${randomUUID()}@kiliride.test`, password = randomBytes(24).toString("hex");
  expect((await post(client, "sign-up/email", { email, password, name: "Synthetic review browser actor" })).status()).toBe(200);
  const { rows } = await pool.query('UPDATE "User" SET "emailVerified" = true WHERE email = $1 RETURNING id', [email]); const id: string = rows[0].id;
  if (role) await pool.query('INSERT INTO "RoleAssignment" ("userId",role,"createdAt") VALUES ($1,$2,$3)', [id, role, new Date(0)]);
  expect((await post(client, "sign-in/email", { email, password })).status()).toBe(200);
  return { client, id, email, password };
}
function totp(uri: string) {
  const bits = [...new URL(uri).searchParams.get("secret")!.toUpperCase().replace(/=+$/, "")].map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map(b => parseInt(b, 2))); const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", key).update(counter).digest(); const offset = hash[hash.length - 1] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}
async function pending() {
  const response = await host.client.post("/api/host/vehicles", { data: { make: "Synthetic", model: `Admin browser ${randomUUID()}`, category: "Test", location: "Test location", description: "Synthetic browser fixture only.", registrationNumber: `S-${randomUUID()}`, seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500 } });
  expect(response.status()).toBe(201); const vehicle = await response.json() as { id: string; publicId: string };
  const buffer = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#059669" } }).png().toBuffer();
  const upload = await host.client.post(`/api/host/vehicles/${vehicle.id}/photos?${new URLSearchParams({ expectedRevision: "0", altText: "Synthetic browser pixels" })}`, { headers: { "content-type": "image/png" }, data: buffer });
  expect(upload.status()).toBe(201); const { photoId } = await upload.json() as { photoId: string };
  expect((await host.client.post(`/api/host/vehicles/${vehicle.id}/submit`, { data: { expectedRevision: 1 } })).status()).toBe(200);
  return { ...vehicle, photoId };
}
test.beforeAll(async () => {
  test.setTimeout(240_000);
  expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
  expect((await pool.query('SELECT current_database() AS name')).rows[0].name).toBe("kiliride_test");
  admin = await actor("ADMIN"); host = await actor("HOST"); customer = await actor(); noMfa = await actor("ADMIN");
  anonymous = await requests.newContext({ baseURL: base, extraHTTPHeaders: { origin: base } });
  const enroll = await post(admin.client, "two-factor/enable", { password: admin.password }); expect(enroll.status()).toBe(200);
  const { totpURI } = await enroll.json() as { totpURI: string };
  expect((await post(admin.client, "two-factor/verify-totp", { code: totp(totpURI) })).status()).toBe(200);
  await post(admin.client, "sign-out", {});
  const login = await post(admin.client, "sign-in/email", { email: admin.email, password: admin.password });
  expect((await login.json()).twoFactorRedirect).toBe(true);
  expect((await admin.client.get("/api/admin/vehicles")).status()).toBe(401);
  expect((await post(admin.client, "two-factor/verify-totp", { code: totp(totpURI) })).status()).toBe(200);
  // Explicitly test-only protocol record, never a real business policy or evidence.
  await pool.query('INSERT INTO "VehicleVerificationPolicy" (version,reference,"approvedById","approvedAt",enabled,"testOnly",requirements) VALUES ($1,$2,$3,$4,true,true,$5)', [policyVersion, "SYNTHETIC BROWSER PROTOCOL; not a KiliRide policy", admin.id, new Date(Date.now() - 1000), syntheticMatrix]);
});
test.afterAll(async () => { for (const client of [admin?.client, host?.client, customer?.client, noMfa?.client, anonymous]) await client?.dispose(); await pool.end(); });

test("administrator API requires full MFA, roles, same-origin JSON, exact records and private response headers", async () => {
  const v = await pending(); const path = `/api/admin/vehicles/${v.id}`;
  const payload = { expectedRevision: 2, toStatus: "APPROVED", reason, approval: { policyVersion, checklist, compliance: syntheticAssessment } };
  for (const [client, code] of [[anonymous, 401], [host.client, 403], [customer.client, 403], [noMfa.client, 403]] as const) {
    for (const url of ["/api/admin/vehicles", path, `${path}/photos/${v.photoId}/image`]) expect((await client.get(url)).status()).toBe(code);
    expect((await client.post(`${path}/decision`, { data: payload })).status()).toBe(code);
    expect((await client.get(`/admin/vehicles/${v.id}`, { maxRedirects: 0 })).status()).toBe(code === 401 ? 307 : 404);
  }
  expect((await admin.client.post(`${path}/decision`, { data: payload, headers: { origin: "https://untrusted.invalid" } })).status()).toBe(403);
  const noOrigin = await requests.newContext({ baseURL: base, storageState: await admin.client.storageState() });
  try { expect((await noOrigin.post(`${path}/decision`, { data: payload })).status()).toBe(403); } finally { await noOrigin.dispose(); }
  expect((await admin.client.post(`${path}/decision`, { data: payload, headers: { "content-type": "text/plain" } })).status()).toBe(415);
  expect((await admin.client.post(`${path}/decision`, { data: { ...payload, reviewerId: host.id } })).status()).toBe(400);
  expect((await admin.client.post(`${path}/decision`, { data: { ...payload, approval: undefined } })).status()).toBe(422);
  expect((await admin.client.post(`${path}/decision`, { data: { ...payload, reason: "x".repeat(17000) } })).status()).toBe(413);
  const detail = await admin.client.get(path); expect(detail.headers()["cache-control"]).toContain("no-store");
  const data = await detail.json(); expect(data.ownership.owner.email).toBeUndefined(); expect(data.photos[0].storageKey).toBeUndefined();
  const image = await admin.client.get(`${path}/photos/${v.photoId}/image`); expect(image.status()).toBe(200); expect(image.headers()["cache-control"]).toContain("no-store"); expect(image.headers()["x-content-type-options"]).toBe("nosniff");
  expect((await admin.client.get(`/api/admin/vehicles/${randomUUID()}/photos/${v.photoId}/image`)).status()).toBe(404);
  expect((await host.client.get(`/api/host/vehicles/${v.id}/photos/${v.photoId}/image`)).status()).toBe(200);
  expect((await customer.client.get(`/api/host/vehicles/${v.id}`)).status()).toBe(403);
  expect((await admin.client.get(`/vehicles/${v.publicId}`)).status()).toBe(404);
});

test("MFA administrator reviews synthetic submission on mobile, records checks, suspends and reopens; host sees only feedback", async ({ page }) => {
  const v = await pending(); await page.context().addCookies((await admin.client.storageState()).cookies);
  await page.setViewportSize({ width: 375, height: 900 }); await page.goto(`/admin?query=${v.publicId}`);
  await expect(page.getByRole("heading", { name: "Vehicle verification", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Synthetic Admin browser/ }).click();
  await expect(page.getByTestId("listing-status")).toHaveText("Pending review");
  await expect(page.getByRole("img", { name: "Synthetic browser pixels" })).toBeVisible();
  await page.getByLabel("Decision", { exact: true }).selectOption("APPROVED");
  await page.getByLabel("Approved policy", { exact: true }).selectOption(policyVersion);
  await page.getByLabel("Decision", { exact: true }).focus(); await page.keyboard.press("Tab");
  await expect(page.getByLabel("Approved policy", { exact: true })).toBeFocused();
  await page.getByLabel("Reason shared with the owner").fill(reason);
  await page.getByRole("button", { name: "Record decision", exact: true }).click();
  await expect(page.getByTestId("listing-status")).toHaveText("Pending review");
  for (const check of verificationChecks) { await page.getByRole("checkbox", { name: check.label, exact: true }).check(); await page.getByLabel(`${check.label} evidence reference`, { exact: true }).fill(`PRIVATE SYNTHETIC ${check.key}`); }
  await page.getByRole("checkbox", { name: "This compliance profile matches the actual rental arrangement" }).check();
  await page.getByRole("checkbox", { name: "Synthetic mandatory protocol record", exact: true }).check();
  await page.getByLabel("Synthetic mandatory protocol record evidence reference", { exact: true }).fill("PRIVATE SYNTHETIC compliance evidence");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Record decision", exact: true }).click(); await expect(page.getByTestId("listing-status")).toHaveText("Approved");
  await expect(page.getByRole("heading", { name: "Immutable review history" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByLabel("Reason shared with the owner").fill("Synthetic suspension: correct listing details.");
  await page.getByRole("button", { name: "Record decision", exact: true }).click(); await expect(page.getByTestId("listing-status")).toHaveText("Suspended");
  const owner = await (await host.client.get(`/api/host/vehicles/${v.id}`)).json(); expect(owner.decisions[0].reason).toContain("Synthetic suspension"); expect(JSON.stringify(owner)).not.toContain("PRIVATE SYNTHETIC");
  await page.getByLabel("Reason shared with the owner").fill("Synthetic correction authorized; submit again.");
  await page.getByRole("button", { name: "Record decision", exact: true }).click(); await expect(page.getByTestId("listing-status")).toHaveText("Draft");
  expect((await host.client.post(`/api/host/vehicles/${v.id}/submit`, { data: { expectedRevision: 5 } })).status()).toBe(200);
  const rejected = await admin.client.post(`/api/admin/vehicles/${v.id}/decision`, { data: { expectedRevision: 6, toStatus: "REJECTED", reason: "Synthetic feedback: revise the description.", evidenceReference: "PRIVATE SYNTHETIC REJECTION" } }); expect(rejected.status()).toBe(200);
  await page.context().clearCookies(); await page.context().addCookies((await host.client.storageState()).cookies); await page.goto(`/host/vehicles/${v.id}`);
  await expect(page.getByText("Synthetic feedback: revise the description.", { exact: true })).toBeVisible(); expect(await page.locator("main").textContent()).not.toContain("PRIVATE SYNTHETIC");
  expect((await host.client.get(`/api/admin/vehicles/${v.id}`)).status()).toBe(403);
});

test("administrator queue supports empty filters and invalid queries; legacy inventory stays unassigned draft", async ({ page }) => {
  await page.context().addCookies((await admin.client.storageState()).cookies); await page.goto(`/admin?query=${randomUUID()}`);
  await expect(page.getByText("No vehicles match these filters.")).toBeVisible();
  await page.goto("/admin?page=0"); await expect(page.getByRole("alert")).toContainText("Invalid filters");
  for (const publicId of ["vitz-142s", "note-131c"]) {
    const { rows } = await pool.query('SELECT v.id,v.status,o."ownerId" FROM "Vehicle" v JOIN "VehicleOwnership" o ON o."vehicleId"=v.id WHERE v."publicId"=$1', [publicId]);
    expect(rows).toHaveLength(1); expect(rows[0].status).toBe("DRAFT"); expect(rows[0].ownerId).toBeNull();
    await page.goto(`/admin/vehicles/${rows[0].id}`); await expect(page.getByText("Unassigned", { exact: true })).toBeVisible(); await expect(page.getByRole("button", { name: "Record decision" })).toHaveCount(0);
  }
});

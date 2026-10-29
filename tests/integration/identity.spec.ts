import { test, expect, request as requests, type APIRequestContext } from "@playwright/test";
import { randomBytes, randomUUID, createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { Pool } from "pg";
import { assertLocalDatabase, assertLocalHttp } from "../../scripts/local-safety.mjs";

const base = "http://localhost:3100";
const pool = new Pool({ connectionString: assertLocalDatabase(process.env.TEST_DATABASE_URL, true), max: 2 });
const mailpit = assertLocalHttp(process.env.MAILPIT_URL);
test.afterAll(async () => { await pool.end(); });

async function client() { return requests.newContext({ baseURL: base, extraHTTPHeaders: { origin: base } }); }
async function post(c: APIRequestContext, path: string, data: object) {
  let response = await c.post(`/api/auth/${path}`, { data });
  // Exercise real throttling without disabling it for tests sharing a loopback IP.
  if (response.status() === 429) {
    const seconds = Math.min(61, Math.max(11, Number(response.headers()["retry-after"]) || 11));
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    response = await c.post(`/api/auth/${path}`, { data });
  }
  return response;
}
async function emailLink(email: string, subject: string) {
  let link = "";
  await expect.poll(async () => {
    const response = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email} subject:${subject}`)}`);
    const data = await response.json() as { messages?: { ID: string }[] };
    for (const item of data.messages ?? []) {
      const message = await (await fetch(`${mailpit}/api/v1/message/${item.ID}`)).json() as { Text: string };
      const candidate = message.Text.match(/http:\/\/localhost:3100\/\S+/)?.[0];
      if (candidate) { link = candidate; return true; }
    }
    return false;
  }, { timeout: 20_000, message: "Expected local identity email" }).toBe(true);
  return link;
}
async function signup(c: APIRequestContext) {
  const email = `phase1-${randomUUID()}@kiliride.test`;
  const password = randomBytes(24).toString("hex");
  const response = await post(c, "sign-up/email", { email, password, name: "Synthetic audit user", role: "ADMIN", roles: ["ADMIN"], twoFactorEnabled: true, callbackURL: "/login" });
  expect(response.status()).toBe(200);
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM "User" WHERE email = $1', [email]);
  return { email, password, id: rows[0].id };
}
async function verify(c: APIRequestContext, email: string) {
  const url = await emailLink(email, "Verify");
  expect((await c.get(url)).ok()).toBeTruthy();
}
function totp(uri: string) {
  const secret = new URL(uri).searchParams.get("secret")!;
  const bits = [...secret.toUpperCase().replace(/=+$/, "")].map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map(b => parseInt(b, 2)));
  const time = Buffer.alloc(8); time.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", key).update(time).digest();
  const offset = hash[hash.length - 1] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}

test("verified signup, recovery, expiration and logout use real isolated persistence", async () => {
  const c = await client();
  try {
    const user = await signup(c);
    expect((await post(c, "sign-in/email", user)).status()).toBe(403);
    await verify(c, user.email);
    const signedIn = await post(c, "sign-in/email", { email: user.email, password: user.password });
    expect(signedIn.status()).toBe(200);
    expect(Object.hasOwn(await signedIn.json(), "token")).toBe(false);
    const sessionResponse = await c.get("/api/auth/get-session");
    expect(Object.hasOwn((await sessionResponse.json()).session, "token")).toBe(false);
    const own = await c.get(`/api/account/${user.id}`);
    expect(own.status()).toBe(200);
    expect((await own.json()).roles).toEqual(["CUSTOMER"]);
    expect((await c.storageState()).cookies.some(cookie => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
    expect((await c.get("/host")).status()).toBe(404);
    expect((await c.get("/admin")).status()).toBe(404);
    expect((await c.get(`/api/account/${randomUUID()}`)).status()).toBe(403);
    expect((await c.post("/api/admin/host-activation", { data: { userId: user.id, reason: "Unauthorized role request" } })).status()).toBe(403);
    await post(c, "update-user", { role: "ADMIN", twoFactorEnabled: true });
    expect((await (await c.get(`/api/account/${user.id}`)).json()).roles).toEqual(["CUSTOMER"]);
    expect((await c.get("/admin")).status()).toBe(404);

    expect((await post(c, "request-password-reset", { email: user.email, redirectTo: "/reset-password" })).status()).toBe(200);
    const resetLink = await emailLink(user.email, "Reset");
    const redirect = await c.get(resetLink, { maxRedirects: 0 });
    const token = new URL(redirect.headers().location, base).searchParams.get("token");
    expect(Boolean(token)).toBe(true);
    const password = randomBytes(24).toString("hex");
    expect((await post(c, "reset-password", { token, newPassword: password })).status()).toBe(200);
    expect((await c.get(`/api/account/${user.id}`)).status()).toBe(401);
    expect((await post(c, "reset-password", { token, newPassword: password })).ok()).toBe(false);
    expect((await post(c, "sign-in/email", { email: user.email, password: user.password })).status()).toBe(401);
    expect((await post(c, "sign-in/email", { email: user.email, password })).status()).toBe(200);
    await pool.query('UPDATE "Session" SET "expiresAt" = $1 WHERE "userId" = $2', [new Date(0), user.id]);
    expect((await c.get(`/api/account/${user.id}`)).status()).toBe(401);
    expect((await post(c, "sign-in/email", { email: user.email, password })).status()).toBe(200);
    expect((await post(c, "sign-out", {})).status()).toBe(200);
    expect((await c.get(`/api/account/${user.id}`)).status()).toBe(401);
    expect((await c.get("/account")).url()).toContain("/login");
  } finally { await c.dispose(); }
});

test("MFA admin provisioning, controlled host activation, CSRF and audit integrity", async () => {
  const admin = await client(); const host = await client();
  try {
    const a = await signup(admin); await verify(admin, a.email);
    expect((await post(admin, "sign-in/email", { email: a.email, password: a.password })).status()).toBe(200);
    const enroll = await post(admin, "two-factor/enable", { password: a.password });
    expect(enroll.status()).toBe(200);
    const { totpURI } = await enroll.json() as { totpURI: string };
    expect((await post(admin, "two-factor/verify-totp", { code: totp(totpURI) })).status()).toBe(200);
    execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/provision-admin.ts", a.email, "Local test operator", "Synthetic administrator acceptance test"], { env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }, stdio: "pipe" });
    expect((await admin.get(`/api/account/${a.id}`)).status()).toBe(401);
    const login = await post(admin, "sign-in/email", { email: a.email, password: a.password });
    expect((await login.json()).twoFactorRedirect).toBe(true);
    expect((await admin.get(`/api/account/${a.id}`)).status()).toBe(401);
    expect((await post(admin, "two-factor/verify-totp", { code: totp(totpURI) })).status()).toBe(200);
    expect((await admin.get("/admin")).status()).toBe(200);
    const h = await signup(host); await verify(host, h.email);
    await post(host, "sign-in/email", { email: h.email, password: h.password });
    const payload = { userId: h.id, reason: "Verified synthetic host for local access test" };
    expect((await admin.post("/api/admin/host-activation", { data: payload, headers: { origin: "https://untrusted.example" } })).status()).toBe(403);
    expect((await admin.post("/api/admin/host-activation", { data: { ...payload, role: "ADMIN" } })).status()).toBe(400);
    expect((await admin.post("/api/admin/host-activation", { data: payload })).status()).toBe(200);
    expect((await host.get("/host")).status()).toBe(200);
    expect((await host.get("/admin")).status()).toBe(404);
    expect((await host.get(`/api/account/${a.id}`)).status()).toBe(403);
    const events = await pool.query('SELECT id FROM "AuditLog" WHERE "subjectId" = $1 AND action = $2', [h.id, "HOST_ACTIVATED"]);
    expect(events.rowCount).toBe(1);
    await expect(pool.query('UPDATE "AuditLog" SET reason = $1 WHERE id = $2', ["tampered", events.rows[0].id])).rejects.toThrow("append-only");
  } finally { await admin.dispose(); await host.dispose(); }
});

test("anonymous and invalid-origin requests fail closed", async ({ request }) => {
  const invalidVerification = await request.get("/api/auth/verify-email?token=invalid", { maxRedirects: 0 });
  expect(invalidVerification.status()).toBe(401);
  expect((await request.get(`/api/account/${randomUUID()}`)).status()).toBe(401);
  expect((await request.post("/api/admin/host-activation", { data: {} })).status()).toBe(403);
  expect((await request.post("/api/auth/sign-up/email", { headers: { origin: "https://untrusted.example" }, data: { name: "Test", email: "invalid", password: "short" } })).ok()).toBe(false);
  expect((await request.post("/api/auth/sign-up/email", { headers: { origin: base }, data: { name: "", email: "invalid", password: "short" } })).ok()).toBe(false);
  expect((await request.post("/api/auth/sign-up/email", { headers: { origin: base }, data: { name: "x".repeat(20000) } })).status()).toBe(413);
});

test("customer completes signup, verification, login and logout in the browser", async ({ page }) => {
  test.setTimeout(180_000);
  async function submit(name: string, endpoint: string) {
    const send = async () => {
      const pending = page.waitForResponse(response => response.url().endsWith(endpoint) && response.request().method() === "POST");
      await page.getByRole("button", { name, exact: true }).click();
      return pending;
    };
    let response = await send();
    if (response.status() === 429) {
      await expect(page.getByRole("status")).toContainText("Too many attempts");
      await page.waitForTimeout((Math.min(61, Math.max(11, Number(response.headers()["retry-after"]) || 61)) + 1) * 1000);
      response = await send();
    }
    expect(response.status()).toBe(200);
  }
  const email = `phase1-ui-${randomUUID()}@kiliride.test`;
  const password = randomBytes(24).toString("hex");
  await page.goto("/signup");
  await page.getByLabel("Full name", { exact: true }).fill("Synthetic browser customer");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submit("Create your account", "/sign-up/email");
  await expect(page.getByRole("status")).toContainText("Check your email");
  const link = await emailLink(email, "Verify");
  // Follow a real Mailpit-delivered link; never write token-bearing URLs to artifacts.
  await page.goto(link);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submit("Log in", "/sign-in/email");
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
  await expect(page.getByText("Access: CUSTOMER", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login$/);
});

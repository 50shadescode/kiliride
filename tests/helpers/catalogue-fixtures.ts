import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { getDb } from "../../src/server/db";
import { getAuth } from "../../src/server/auth";
import { createHostVehicle, submitHostVehicle } from "../../src/server/fleet/host";
import { transitionVehicleListing } from "../../src/server/fleet/service";
import { syntheticPolicy, syntheticPhoto } from "./verification";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
export async function catalogueFixtures() {
  assertLocalDatabase(process.env.DATABASE_URL, true);
  const db = getDb(); assert.equal((await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`)[0].name, "kiliride_test");
  async function actor(role: "HOST" | "ADMIN") {
    const email = `catalogue-${randomUUID()}@kiliride.test`, password = randomBytes(24).toString("hex");
    const auth = getAuth(); const { user } = await auth.api.signUpEmail({ body: { email, password, name: "Synthetic catalogue fixture" } });
    await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    await db.roleAssignment.create({ data: { userId: user.id, role, createdAt: new Date(0) } });
    const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true }); assert.equal(response.status, 200);
    // Synthetic MFA posture, not a real verification claim. Actual challenge
    // remains covered by the unchanged identity/admin browser suites.
    if (role === "ADMIN") await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    return { id: user.id, cookie: response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ") };
  }
  const host = await actor("HOST"), admin = await actor("ADMIN");
  const approval = await syntheticPolicy(admin.id); const query = `Fixture-${randomUUID()}`;
  const records = [];
  for (const [i, status] of ["APPROVED", "APPROVED", "DRAFT", "PENDING_REVIEW", "REJECTED", "SUSPENDED"].entries()) {
    const v = await createHostVehicle(new Headers({ cookie: host.cookie }), { make: query, model: `Synthetic ${i}`, category: "Synthetic catalogue class", description: "Synthetic protocol fixture only, never actual inventory.", registrationNumber: `PRIVATE-${randomUUID().replaceAll("-", "")}`, location: "Synthetic test location", seats: 5 + i, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500 + i, baseFullDay: 3500 + i });
    const photo = await syntheticPhoto(v.id, host.id);
    if (status !== "DRAFT") await submitHostVehicle(new Headers({ cookie: host.cookie }), v.id, { expectedRevision: 0 });
    if (["APPROVED", "SUSPENDED"].includes(status)) await transitionVehicleListing(new Headers({ cookie: admin.cookie }), { vehicleId: v.id, expectedRevision: 1, toStatus: "APPROVED", reason: "Synthetic publication test only", approval });
    if (status === "REJECTED") await transitionVehicleListing(new Headers({ cookie: admin.cookie }), { vehicleId: v.id, expectedRevision: 1, toStatus: "REJECTED", reason: "Synthetic publication rejection" });
    if (status === "SUSPENDED") await transitionVehicleListing(new Headers({ cookie: admin.cookie }), { vehicleId: v.id, expectedRevision: 2, toStatus: "SUSPENDED", reason: "Synthetic publication suspension" });
    records.push({ ...v, photoId: photo.id, status });
  }
  return { query, records, policyVersion: approval.policyVersion, admin, host };
}
if (process.argv.includes("--emit")) {
  // Piped directly to Playwright's memory; never print this private test session
  // to user-facing logs, screenshots, traces or reports.
  void catalogueFixtures().then(async fixtures => { process.stdout.write(JSON.stringify(fixtures)); await getDb().$disconnect(); }).catch(async () => { await getDb().$disconnect(); process.stderr.write("Synthetic fixture creation failed"); process.exitCode = 1; });
}

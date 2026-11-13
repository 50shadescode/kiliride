import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { getDb } from "../../src/server/db";
import { publicCatalogue, publicVehicle, publicVehiclePhoto } from "../../src/server/fleet/public";
import { databaseCatalogueEnabled } from "../../src/server/fleet/catalogue-config";
import { activeVerificationPolicy } from "../../src/server/fleet/policy";
import { transitionVehicleListing } from "../../src/server/fleet/service";
import { catalogueFixtures } from "../helpers/catalogue-fixtures";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { syntheticApproval } from "../helpers/verification";
import { syntheticMatrix } from "../helpers/compliance-fixture";
assertLocalDatabase(process.env.DATABASE_URL, true);
const db = getDb(); let f: Awaited<ReturnType<typeof catalogueFixtures>>;
const flag = process.env.KILIRIDE_DB_CATALOGUE;
before(async () => { f = await catalogueFixtures(); });
after(async () => { if (flag === undefined) delete process.env.KILIRIDE_DB_CATALOGUE; else process.env.KILIRIDE_DB_CATALOGUE = flag; await db.$disconnect(); });
test("default-off catalogue preserves legacy IDs/prices without publishing private or unsupported claims", async () => {
  delete process.env.KILIRIDE_DB_CATALOGUE; assert.equal(databaseCatalogueEnabled(), false);
  const result = await publicCatalogue(); assert.deepEqual(result.vehicles.map(v => v.id), ["vitz-142s", "note-131c"]);
  for (const v of result.vehicles) { assert.equal(v.reviewStatus, "legacy"); assert.equal(v.baseFullDay, 3500); assert.equal(v.baseHalfDay, 2500); assert.equal(v.reservationFee, 500); assert.equal(Object.hasOwn(v, "plate"), false); assert.equal(Object.hasOwn(v, "isVerified"), false); assert.equal(Object.hasOwn(v, "status"), false); }
  assert.equal(await publicVehicle(f.records[0].publicId), null);
  await assert.rejects(publicVehiclePhoto(f.records[0].publicId, f.records[0].photoId));
  for (const input of [{ approved: true }, { mode: "database" }, { pageSize: 1000 }, { page: -1 }]) await assert.rejects(publicCatalogue(input), ZodError);
  process.env.KILIRIDE_DB_CATALOGUE = "yes"; assert.throws(databaseCatalogueEnabled);
});
test("database catalogue requires current approval, policy, ownership, proof and explicit public projection", async () => {
  process.env.KILIRIDE_DB_CATALOGUE = "true";
  const result = await publicCatalogue({ q: f.query }); assert.equal(result.total, 2);
  assert.deepEqual(result.vehicles.map(v => v.id), f.records.slice(0, 2).map(v => v.publicId));
  for (const v of result.vehicles) {
    assert.equal(v.reviewStatus, "approved"); assert.equal(v.reservationFee, null);
    assert.deepEqual(Object.keys(v).sort(), ["id", "make", "model", "name", "type", "description", "location", "transmission", "fuelType", "seats", "baseHalfDay", "baseFullDay", "reservationFee", "managerPhone", "reviewStatus", "photos"].sort());
    assert.equal(JSON.stringify(v).includes("PRIVATE-"), false); assert.equal(JSON.stringify(v).includes("SYNTHETIC PROTOCOL"), false);
  }
  for (const v of f.records.slice(2)) { assert.equal(await publicVehicle(v.publicId), null); await assert.rejects(publicVehiclePhoto(v.publicId, v.photoId)); }
  for (const id of ["vitz-142s", "note-131c", f.records[0].id, "../../private", "absent-vehicle"]) assert.equal(await publicVehicle(id), null);
  assert.ok((await publicVehiclePhoto(f.records[0].publicId, f.records[0].photoId)).length);
  await assert.rejects(publicVehiclePhoto(f.records[0].publicId, f.records[1].photoId));
  await db.user.update({ where: { id: f.host.id }, data: { emailVerified: false } });
  try { assert.equal((await publicCatalogue({ q: f.query })).total, 0); } finally { await db.user.update({ where: { id: f.host.id }, data: { emailVerified: true } }); }
});
test("search, filters, deterministic ordering and bounded pagination retain the same eligibility", async () => {
  const result = await publicCatalogue({ q: f.query, category: "Synthetic catalogue class", location: "test location", seats: 6 }); assert.equal(result.total, 1);
  const a = await publicCatalogue({ q: f.query, sort: "price-desc", pageSize: 1 }); const b = await publicCatalogue({ q: f.query, sort: "price-desc", pageSize: 1, page: 2 });
  assert.equal(a.vehicles[0].id, f.records[1].publicId); assert.equal(b.vehicles[0].id, f.records[0].publicId); assert.equal(a.total, 2);
  assert.equal((await publicCatalogue({ q: randomUUID() })).total, 0);
  assert.equal((await publicCatalogue({ q: f.query, page: 1000 })).vehicles.length, 0);
});
test("an APPROVED row with a valid checklist but missing transactional audit is not published", async () => {
  const v = f.records[3], approval = syntheticApproval(f.policyVersion), reason = "Synthetic missing-audit adversarial fixture";
  await db.$transaction(async tx => {
    const review = await tx.vehicleReview.create({ data: { vehicleId: v.id, reviewerId: f.admin.id, decision: "APPROVED", vehicleRevision: 1, reason, criteriaVersion: f.policyVersion, evidenceReference: "SYNTHETIC ONLY" } });
    await tx.vehicleDecisionRecord.create({ data: { vehicleId: v.id, reviewerId: f.admin.id, reviewId: review.id, fromStatus: "PENDING_REVIEW", toStatus: "APPROVED", vehicleRevision: 1, reason, policyVersion: f.policyVersion, checklist: { ...approval.checklist, compliance: { ...approval.compliance, requirementsSnapshot: syntheticMatrix.profiles[0] } } } });
    await tx.vehicle.update({ where: { id: v.id }, data: { status: "APPROVED", approvedReviewId: review.id, revision: 2 } });
    await tx.vehicleListingEvent.create({ data: { vehicleId: v.id, actorId: f.admin.id, fromStatus: "PENDING_REVIEW", toStatus: "APPROVED", reason } });
    // Intentionally omit AuditLog: privileged fixture SQL is not the app engine.
  });
  assert.equal(await publicVehicle(v.publicId), null); await assert.rejects(publicVehiclePhoto(v.publicId, v.photoId));
});
test("suspension and policy deactivation withdraw identical URLs immediately without static fallback", async () => {
  const v = f.records[0];
  await transitionVehicleListing(new Headers({ cookie: f.admin.cookie }), { vehicleId: v.id, expectedRevision: 2, toStatus: "SUSPENDED", reason: "Synthetic uncached suspension test" });
  assert.equal(await publicVehicle(v.publicId), null); await assert.rejects(publicVehiclePhoto(v.publicId, v.photoId));
  await db.vehicleVerificationPolicy.update({ where: { version: f.policyVersion }, data: { enabled: false } });
  assert.equal((await publicCatalogue({ q: f.query })).total, 0); assert.equal(await publicVehicle(f.records[1].publicId), null);
  assert.equal(activeVerificationPolicy({ version: "0.1-DRAFT", enabled: true, approvedAt: new Date(0), testOnly: true }), false);
  assert.equal(activeVerificationPolicy({ version: "unapproved-real-version", enabled: true, approvedAt: new Date(0), testOnly: false }), false);
  const original = process.env.DATABASE_URL;
  try { process.env.DATABASE_URL = "postgresql://local:local@127.0.0.1:55432/kiliride_dev"; assert.equal(activeVerificationPolicy({ version: "synthetic", enabled: true, approvedAt: new Date(0), testOnly: true }), false); }
  finally { process.env.DATABASE_URL = original; }
  const originalMode = process.env.NODE_ENV;
  try { Object.assign(process.env, { NODE_ENV: "production" }); assert.throws(databaseCatalogueEnabled); }
  finally { if (originalMode === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Object.assign(process.env, { NODE_ENV: originalMode }); }
});

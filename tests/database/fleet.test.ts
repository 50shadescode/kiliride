import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { getDb } from "../../src/server/db";
import { getAuth } from "../../src/server/auth";
import { AccessError } from "../../src/server/authorization";
import { KILIFI_FLEET } from "../../src/lib/fleet";
import { importLegacyFleet } from "../../src/server/fleet/import";
import { FleetError } from "../../src/server/fleet/lifecycle";
import { assignVehicleOwner, readFleetVehicle, readVehicleRegistration, transitionVehicleListing } from "../../src/server/fleet/service";
import { createHostVehicle, editHostVehicle, getHostVehicle, listHostVehicles, submitHostVehicle } from "../../src/server/fleet/host";
import { ZodError } from "zod";
import { syntheticPolicy, syntheticPhoto } from "../helpers/verification";

assertLocalDatabase(process.env.TEST_DATABASE_URL, true);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const db = getDb();
type Actor = { id: string; headers: Headers };
let customer: Actor, host: Actor, otherHost: Actor, admin: Actor, noMfaAdmin: Actor;
let approval: Awaited<ReturnType<typeof syntheticPolicy>>;
const reason = "Synthetic Phase 2 foundation test only";

// Synthetic role/MFA posture fixtures, not operator provisioning or real owners.
// Password/session creation uses Better Auth; its actual MFA challenge is covered
// by the Phase 1 API/browser suite, not bypassed in application code.
async function actor(role?: "HOST" | "ADMIN", mfa = false): Promise<Actor> {
  const email = `phase2-${randomUUID()}@kiliride.test`;
  const password = randomBytes(24).toString("hex");
  const auth = getAuth();
  const created = await auth.api.signUpEmail({ body: { name: "Synthetic fleet test actor", email, password } });
  const id = created.user.id;
  await db.user.update({ where: { id }, data: { emailVerified: true } });
  if (role) await db.roleAssignment.create({ data: { userId: id, role, createdAt: new Date(0) } });
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.ok(cookie.length > 0);
  if (mfa) await db.user.update({ where: { id }, data: { twoFactorEnabled: true } });
  return { id, headers: new Headers({ cookie }) };
}
async function draft() {
  return db.vehicle.create({ data: {
    publicId: `synthetic-${randomUUID()}`, make: "Synthetic", model: "Test fixture", category: "Test", description: "Synthetic listing for testing only.",
    seats: 5, fuelType: "Petrol", transmission: "Automatic", location: "Synthetic test location",
    baseHalfDay: 2500, baseFullDay: 3500, ownership: { create: {} },
    registration: { create: { registrationNumber: `S-${randomUUID().toUpperCase()}` } },
  } });
}
const denied = (status: number) => (error: unknown) => error instanceof AccessError && error.status === status;
before(async () => {
  const rows = await db.$queryRaw<{ database: string }[]>`SELECT current_database() AS database`;
  assert.equal(rows[0].database, "kiliride_test");
  customer = await actor(); host = await actor("HOST"); otherHost = await actor("HOST");
  admin = await actor("ADMIN", true); noMfaAdmin = await actor("ADMIN");
  approval = await syntheticPolicy(admin.id);
});
after(async () => { await db.$disconnect(); });

const hostDraft = (complete = true) => ({ make: "Synthetic", model: "Host fixture", category: "Test", location: "Test location", seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500, description: complete ? "Synthetic host listing for testing only." : "", registrationNumber: complete ? `S-${randomUUID()}` : "" });

test("host creation derives ownership from session, rejects forged authority and requires a verified HOST", async () => {
  const values = hostDraft();
  for (const [headers, status] of [[new Headers(), 401], [customer.headers, 403], [admin.headers, 403]] as const) {
    await assert.rejects(createHostVehicle(headers, values), denied(status));
    await assert.rejects(listHostVehicles(headers), denied(status));
  }
  await db.user.update({ where: { id: otherHost.id }, data: { emailVerified: false } });
  try { await assert.rejects(createHostVehicle(otherHost.headers, values), denied(403)); }
  finally { await db.user.update({ where: { id: otherHost.id }, data: { emailVerified: true } }); }
  const count = await db.vehicle.count();
  for (const forged of [{ ownerId: otherHost.id }, { status: "APPROVED" }, { publicId: "vitz-142s" }, { approvedReviewId: randomUUID() }]) await assert.rejects(createHostVehicle(host.headers, { ...values, ...forged }), ZodError);
  assert.equal(await db.vehicle.count(), count);
  const vehicle = await createHostVehicle(host.headers, values);
  const stored = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id }, include: { ownership: true, reviews: true } });
  assert.equal(vehicle.status, "DRAFT"); assert.equal(vehicle.revision, 0);
  assert.equal(stored.ownership?.ownerId, host.id); assert.equal(stored.ownership?.origin, "HOST_DECLARED");
  assert.ok(stored.ownership?.declaredAt); assert.equal(stored.ownership?.assignedById, null); assert.equal(stored.ownership?.evidenceReference, null);
  assert.equal(stored.approvedReviewId, null); assert.equal(stored.reviews.length, 0);
  assert.equal(await db.vehicleListingEvent.count({ where: { vehicleId: vehicle.id, actorId: host.id, toStatus: "DRAFT" } }), 1);
  assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "HOST_VEHICLE_CREATED", actorId: host.id } }), 1);
  const listed = await listHostVehicles(host.headers);
  assert.ok(listed.some(v => v.id === vehicle.id));
  assert.equal((await listHostVehicles(otherHost.headers)).some(v => v.id === vehicle.id), false);
  for (const key of ["ownership", "registration", "legacyImport", "approvedReviewId"]) assert.equal(Object.hasOwn(listed[0], key), false);
});

test("host record scoping denies cross-account access and legacy claims without modifying legacy records", async () => {
  await importLegacyFleet("Synthetic test operator", true);
  const values = hostDraft();
  const vehicle = await createHostVehicle(host.headers, values);
  const legacy = await db.vehicle.findMany({ where: { legacyImport: { isNot: null } }, include: { ownership: true, registration: true, reviews: true, legacyImport: true } });
  for (const item of [vehicle, ...legacy]) {
    await assert.rejects(getHostVehicle(otherHost.headers, item.id), denied(404));
    await assert.rejects(editHostVehicle(otherHost.headers, item.id, { ...values, expectedRevision: item.revision }), denied(404));
    await assert.rejects(submitHostVehicle(otherHost.headers, item.id, { expectedRevision: item.revision }), denied(404));
  }
  for (const item of legacy) {
    assert.equal(item.ownership?.origin, "UNASSIGNED");
    await assert.rejects(getHostVehicle(host.headers, item.id), denied(404));
    await assert.rejects(db.vehicleOwnership.update({ where: { vehicleId: item.id }, data: { ownerId: host.id, origin: "HOST_DECLARED", declaredAt: new Date() } }));
  }
  assert.deepEqual(await db.vehicle.findMany({ where: { legacyImport: { isNot: null } }, include: { ownership: true, registration: true, reviews: true, legacyImport: true } }), legacy);
  await db.roleAssignment.create({ data: { userId: otherHost.id, role: "ADMIN", createdAt: new Date(0) } });
  try { await assert.rejects(getHostVehicle(otherHost.headers, vehicle.id), denied(404)); }
  finally { await db.roleAssignment.delete({ where: { userId_role: { userId: otherHost.id, role: "ADMIN" } } }); }
});

test("host validation, concurrent edits and duplicate registration failures are atomic", async () => {
  const values = hostDraft(false);
  const vehicle = await createHostVehicle(host.headers, values);
  await assert.rejects(submitHostVehicle(host.headers, vehicle.id, { expectedRevision: 0 }), ZodError);
  await assert.rejects(db.vehicle.update({ where: { id: vehicle.id }, data: { status: "PENDING_REVIEW", revision: 1 } }));
  assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "HOST_VEHICLE_SUBMITTED" } }), 0);
  const complete = hostDraft();
  const results = await Promise.allSettled([editHostVehicle(host.headers, vehicle.id, { ...complete, expectedRevision: 0 }), editHostVehicle(host.headers, vehicle.id, { ...complete, expectedRevision: 0 })]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.ok(results.some(r => r.status === "rejected" && r.reason instanceof FleetError && r.reason.code === "CONFLICT"));
  assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "HOST_VEHICLE_EDITED" } }), 1);
  const duplicate = await createHostVehicle(host.headers, hostDraft());
  await assert.rejects(editHostVehicle(host.headers, duplicate.id, { ...complete, model: "Must roll back", expectedRevision: 0 }));
  assert.equal((await getHostVehicle(host.headers, duplicate.id)).model, "Host fixture");
  assert.equal((await getHostVehicle(host.headers, duplicate.id)).revision, 0);
  assert.equal(await db.auditLog.count({ where: { subjectId: duplicate.id, action: "HOST_VEHICLE_EDITED" } }), 0);
  const submissions = await Promise.allSettled([submitHostVehicle(host.headers, vehicle.id, { expectedRevision: 1 }), submitHostVehicle(host.headers, vehicle.id, { expectedRevision: 1 })]);
  assert.equal(submissions.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "HOST_VEHICLE_SUBMITTED" } }), 1);
  await assert.rejects(editHostVehicle(host.headers, vehicle.id, { ...complete, expectedRevision: 2 }), FleetError);
});

test("rejected listings can be revised and resubmitted while reviews stay immutable and approved/suspended listings stay read-only", async () => {
  const values = hostDraft();
  const vehicle = await createHostVehicle(host.headers, values);
  await syntheticPhoto(vehicle.id, host.id);
  await submitHostVehicle(host.headers, vehicle.id, { expectedRevision: 0 });
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 1, toStatus: "REJECTED", reason: "Synthetic feedback: correct the description.", evidenceReference: "PRIVATE-SYNTHETIC-EVIDENCE" });
  const detail = await getHostVehicle(host.headers, vehicle.id);
  assert.equal(detail.status, "REJECTED"); assert.equal(detail.reviews[0].reason, "Synthetic feedback: correct the description.");
  for (const key of ["evidenceReference", "criteriaVersion", "reviewerId"]) assert.equal(Object.hasOwn(detail.reviews[0], key), false);
  await assert.rejects(submitHostVehicle(host.headers, vehicle.id, { expectedRevision: 2 }), FleetError);
  await editHostVehicle(host.headers, vehicle.id, { ...values, description: "Revised synthetic description.", expectedRevision: 2 });
  assert.equal((await getHostVehicle(host.headers, vehicle.id)).status, "DRAFT");
  await submitHostVehicle(host.headers, vehicle.id, { expectedRevision: 3 });
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 4, toStatus: "APPROVED", reason, approval });
  await assert.rejects(editHostVehicle(host.headers, vehicle.id, { ...values, expectedRevision: 5 }), FleetError);
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 5, toStatus: "SUSPENDED", reason });
  await assert.rejects(editHostVehicle(host.headers, vehicle.id, { ...values, expectedRevision: 6 }), FleetError);
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: vehicle.id } }), 2);
  assert.equal(await db.vehicleListingEvent.count({ where: { vehicleId: vehicle.id } }), 7);
});

test("legacy dry-run, concurrent import and replay preserve unassigned drafts without fabricated trust", async () => {
  const count = await db.vehicle.count();
  await importLegacyFleet("Synthetic test operator");
  assert.equal(await db.vehicle.count(), count);
  await Promise.all([importLegacyFleet("Synthetic test operator", true), importLegacyFleet("Synthetic test operator", true)]);
  const before = await db.vehicle.findMany({ where: { publicId: { in: KILIFI_FLEET.map(v => v.id) } }, orderBy: { publicId: "asc" }, include: { ownership: true, photos: true, reviews: true, legacyImport: true } });
  assert.equal(before.length, 2);
  assert.equal(await db.legacyVehicleImport.count(), 2);
  for (const vehicle of before) {
    assert.equal(vehicle.status, "DRAFT"); assert.equal(vehicle.ownership?.ownerId, null);
    assert.equal(vehicle.approvedReviewId, null); assert.equal(vehicle.photos.length, 0); assert.equal(vehicle.reviews.length, 0);
    assert.equal(vehicle.baseHalfDay, 2500); assert.equal(vehicle.baseFullDay, 3500);
    assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "LEGACY_VEHICLE_IMPORTED" } }), 1);
  }
  assert.ok((await importLegacyFleet("Synthetic test operator", true)).records.every(row => row.action === "UNCHANGED"));
  assert.deepEqual(await db.vehicle.findMany({ where: { publicId: { in: KILIFI_FLEET.map(v => v.id) } }, orderBy: { publicId: "asc" }, include: { ownership: true, photos: true, reviews: true, legacyImport: true } }), before);
  const source = KILIFI_FLEET[1]; const original = source.baseFullDay;
  try {
    source.baseFullDay++;
    await assert.rejects(importLegacyFleet("Synthetic test operator", true), error => error instanceof FleetError && error.code === "CONFLICT");
  } finally { source.baseFullDay = original; }
  // Existing database edits are not silently overwritten by the source snapshot.
  const item = before[0];
  try {
    await db.vehicle.update({ where: { id: item.id }, data: { description: reason, revision: { increment: 1 } } });
    await importLegacyFleet("Synthetic test operator", true);
    assert.equal((await db.vehicle.findUniqueOrThrow({ where: { id: item.id } })).description, reason);
  } finally { await db.vehicle.update({ where: { id: item.id }, data: { description: item.description, revision: { increment: 1 } } }); }
});

test("ownership and private registration require the current owner or MFA admin", async () => {
  const vehicle = await draft();
  for (const headers of [customer.headers, host.headers, otherHost.headers, noMfaAdmin.headers]) {
    await assert.rejects(assignVehicleOwner(headers, { vehicleId: vehicle.id, ownerId: host.id, expectedRevision: 0, reason, evidenceReference: "SYNTHETIC-ONLY" }), denied(403));
  }
  await assert.rejects(readFleetVehicle(new Headers(), vehicle.id), denied(401));
  await assert.rejects(assignVehicleOwner(admin.headers, { vehicleId: vehicle.id, ownerId: customer.id, expectedRevision: 0, reason, evidenceReference: "SYNTHETIC-ONLY" }), denied(403));
  await assert.rejects(transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 0, toStatus: "PENDING_REVIEW", reason }), FleetError);
  await assignVehicleOwner(admin.headers, { vehicleId: vehicle.id, ownerId: host.id, expectedRevision: 0, reason, evidenceReference: "SYNTHETIC-ONLY" });
  assert.equal((await readFleetVehicle(host.headers, vehicle.id)).ownership?.ownerId, host.id);
  assert.equal(Object.hasOwn(await readFleetVehicle(host.headers, vehicle.id), "registration"), false);
  assert.ok(await readVehicleRegistration(host.headers, vehicle.id));
  assert.ok(await readVehicleRegistration(admin.headers, vehicle.id));
  for (const headers of [customer.headers, otherHost.headers, noMfaAdmin.headers]) {
    await assert.rejects(readVehicleRegistration(headers, vehicle.id), denied(403));
    await assert.rejects(transitionVehicleListing(headers, { vehicleId: vehicle.id, expectedRevision: 1, toStatus: "PENDING_REVIEW", reason }), denied(403));
  }
  await assert.rejects(assignVehicleOwner(admin.headers, { vehicleId: vehicle.id, ownerId: otherHost.id, expectedRevision: 1, reason, evidenceReference: "SYNTHETIC-ONLY" }), FleetError);
  assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "VEHICLE_OWNER_ASSIGNED" } }), 1);
});

test("controlled lifecycle, evidence requirements, concurrent decisions and immutable history", async () => {
  const vehicle = await draft();
  await syntheticPhoto(vehicle.id, host.id);
  await assignVehicleOwner(admin.headers, { vehicleId: vehicle.id, ownerId: host.id, expectedRevision: 0, reason, evidenceReference: "SYNTHETIC-ONLY" });
  await assert.rejects(transitionVehicleListing(host.headers, { vehicleId: vehicle.id, expectedRevision: 1, toStatus: "APPROVED", reason }), FleetError);
  await transitionVehicleListing(host.headers, { vehicleId: vehicle.id, expectedRevision: 1, toStatus: "PENDING_REVIEW", reason });
  await assert.rejects(transitionVehicleListing(host.headers, { vehicleId: vehicle.id, expectedRevision: 2, toStatus: "APPROVED", reason }), FleetError);
  await assert.rejects(transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 2, toStatus: "APPROVED", reason }), FleetError);
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: vehicle.id } }), 0);
  const input = { vehicleId: vehicle.id, expectedRevision: 2, toStatus: "APPROVED", reason, approval };
  const results = await Promise.allSettled([transitionVehicleListing(admin.headers, input), transitionVehicleListing(admin.headers, input)]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: vehicle.id } }), 1);
  const review = await db.vehicleReview.findFirstOrThrow({ where: { vehicleId: vehicle.id } });
  await assert.rejects(db.vehicleReview.update({ where: { id: review.id }, data: { reason: "Tampered synthetic review" } }));
  await assert.rejects(db.vehicleListingEvent.deleteMany({ where: { vehicleId: vehicle.id } }));
  await assert.rejects(db.vehicle.update({ where: { id: vehicle.id }, data: { baseFullDay: 1, revision: { increment: 1 } } }));
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 3, toStatus: "SUSPENDED", reason });
  await assert.rejects(transitionVehicleListing(host.headers, { vehicleId: vehicle.id, expectedRevision: 4, toStatus: "DRAFT", reason }), FleetError);
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 4, toStatus: "DRAFT", reason });
  await transitionVehicleListing(host.headers, { vehicleId: vehicle.id, expectedRevision: 5, toStatus: "PENDING_REVIEW", reason });
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 6, toStatus: "REJECTED", reason });
  await transitionVehicleListing(host.headers, { vehicleId: vehicle.id, expectedRevision: 7, toStatus: "DRAFT", reason });
  assert.equal(await db.vehicleListingEvent.count({ where: { vehicleId: vehicle.id } }), 7);
  assert.equal((await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).approvedReviewId, null);
});

test("schema rejects identifier changes, invalid money, forged approvals and duplicate photo covers", async () => {
  const vehicle = await draft();
  await assert.rejects(db.vehicle.update({ where: { id: vehicle.id }, data: { publicId: `changed-${randomUUID()}`, revision: 1 } }));
  await assert.rejects(db.vehicle.update({ where: { id: vehicle.id }, data: { baseHalfDay: -1, revision: 1 } }));
  await assert.rejects(db.vehicle.update({ where: { id: vehicle.id }, data: { status: "APPROVED", revision: 1 } }));
  await assert.rejects(db.vehicleReview.create({ data: { vehicleId: vehicle.id, reviewerId: host.id, decision: "APPROVED", vehicleRevision: 0, reason, criteriaVersion: "SYNTHETIC", evidenceReference: "SYNTHETIC" } }));
  const photo = { vehicleId: vehicle.id, uploadedById: host.id, contentType: "image/jpeg", byteSize: 1, altText: "Synthetic metadata only, no image", isCover: true };
  await db.vehiclePhoto.create({ data: { ...photo, position: 0, storageKey: `synthetic-only/${randomUUID()}` } });
  await assert.rejects(db.vehiclePhoto.create({ data: { ...photo, position: 1, storageKey: `synthetic-only/${randomUUID()}` } }));
  await assert.rejects(db.legacyVehicleImport.update({ where: { sourceId: "vitz-142s" }, data: { operator: "tampered" } }));
  await assert.rejects(db.vehicleOwnership.create({ data: { vehicleId: randomUUID() } }));
});

test("an administrator who also owns a vehicle cannot approve their own submission", async () => {
  await db.roleAssignment.create({ data: { userId: admin.id, role: "HOST" } });
  const vehicle = await draft();
  await assignVehicleOwner(admin.headers, { vehicleId: vehicle.id, ownerId: admin.id, expectedRevision: 0, reason, evidenceReference: "SYNTHETIC-ONLY" });
  await transitionVehicleListing(admin.headers, { vehicleId: vehicle.id, expectedRevision: 1, toStatus: "PENDING_REVIEW", reason });
  await assert.rejects(transitionVehicleListing(admin.headers, {
    vehicleId: vehicle.id, expectedRevision: 2, toStatus: "APPROVED", reason,
    criteriaVersion: "SYNTHETIC-ONLY", evidenceReference: "SYNTHETIC-ONLY",
  }), denied(403));
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: vehicle.id } }), 0);
  assert.equal(await db.auditLog.count({ where: { subjectId: vehicle.id, action: "VEHICLE_APPROVED" } }), 0);
  assert.equal((await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } })).status, "PENDING_REVIEW");
});

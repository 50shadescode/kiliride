import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { ZodError } from "zod";
import { getDb } from "../../src/server/db";
import { getAuth } from "../../src/server/auth";
import { AccessError } from "../../src/server/authorization";
import { listAdminVehicles, getAdminVehicle, decideAdminVehicle, readAdminVehiclePhoto } from "../../src/server/fleet/admin";
import { createHostVehicle, getHostVehicle, editHostVehicle, submitHostVehicle } from "../../src/server/fleet/host";
import { FleetError } from "../../src/server/fleet/lifecycle";
import { ImageError } from "../../src/lib/validation/vehicle-image";
import { syntheticPolicy, syntheticPhoto } from "../helpers/verification";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { imageStorage } from "../../src/server/images/storage";
import { syntheticMatrix } from "../helpers/compliance-fixture";

assertLocalDatabase(process.env.DATABASE_URL, true);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const db = getDb();
type Actor = { id: string; headers: Headers };
let host: Actor, other: Actor, customer: Actor, admin: Actor, noMfa: Actor;
let approval: Awaited<ReturnType<typeof syntheticPolicy>>;
const reason = "Synthetic protocol decision only; no real verification";
const denied = (status: number) => (error: unknown) => error instanceof AccessError && error.status === status;
const conflict = (error: unknown) => error instanceof FleetError && error.code === "CONFLICT";
const values = () => ({ make: "Synthetic", model: `Review ${randomUUID()}`, category: "Test", location: "Test location", description: "Synthetic protocol fixture, not real inventory.", registrationNumber: `S-${randomUUID()}`, seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500 });
async function actor(role?: "HOST" | "ADMIN", mfa = false): Promise<Actor> {
  const email = `review-${randomUUID()}@kiliride.test`, password = randomBytes(24).toString("hex");
  const auth = getAuth(); const { user } = await auth.api.signUpEmail({ body: { email, password, name: "Synthetic review test actor" } });
  await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  if (role) await db.roleAssignment.create({ data: { userId: user.id, role, createdAt: new Date(0) } });
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true }); assert.equal(response.status, 200);
  // Posture fixture only. Browser tests perform a real MFA challenge.
  if (mfa) await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  return { id: user.id, headers: new Headers({ cookie: response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ") }) };
}
async function pending(photo = true, owner = host) {
  const vehicle = await createHostVehicle(owner.headers, values());
  const image = photo ? await syntheticPhoto(vehicle.id, owner.id) : null;
  await submitHostVehicle(owner.headers, vehicle.id, { expectedRevision: 0 });
  return { ...vehicle, revision: 1, image };
}
const approve = (revision = 1) => ({ expectedRevision: revision, toStatus: "APPROVED", reason, approval });
before(async () => {
  assert.equal((await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`)[0].name, "kiliride_test");
  host = await actor("HOST"); other = await actor("HOST"); customer = await actor(); admin = await actor("ADMIN", true); noMfa = await actor("ADMIN");
  approval = await syntheticPolicy(admin.id);
});
after(async () => { await db.$disconnect(); });

test("admin reads, decisions and private photos deny anonymous, other roles, non-MFA and pre-grant sessions", async () => {
  const v = await pending();
  for (const [headers, status] of [[new Headers(), 401], [customer.headers, 403], [host.headers, 403], [other.headers, 403], [noMfa.headers, 403]] as const) {
    await assert.rejects(listAdminVehicles(headers, {}), denied(status));
    await assert.rejects(getAdminVehicle(headers, v.id), denied(status));
    await assert.rejects(decideAdminVehicle(headers, v.id, approve()), denied(status));
    await assert.rejects(readAdminVehiclePhoto(headers, v.id, v.image!.id), denied(status));
  }
  await db.roleAssignment.update({ where: { userId_role: { userId: admin.id, role: "ADMIN" } }, data: { createdAt: new Date(Date.now() + 1000) } });
  try { await assert.rejects(listAdminVehicles(admin.headers, {}), denied(403)); await assert.rejects(decideAdminVehicle(admin.headers, v.id, approve()), denied(403)); }
  finally { await db.roleAssignment.update({ where: { userId_role: { userId: admin.id, role: "ADMIN" } }, data: { createdAt: new Date(0) } }); }
  const detail = await getAdminVehicle(admin.headers, v.id);
  for (const key of ["email", "accounts", "sessions", "twoFactorEnabled"]) assert.equal(Object.hasOwn(detail.ownership!.owner!, key), false);
  for (const key of ["storageKey", "objectKey", "sha256", "object"]) assert.equal(Object.hasOwn(detail.photos[0], key), false);
  assert.ok((await readAdminVehiclePhoto(admin.headers, v.id, v.image!.id)).length > 0);
  await assert.rejects(readAdminVehiclePhoto(admin.headers, randomUUID(), v.image!.id), denied(404));
  const queue = await listAdminVehicles(admin.headers, { query: v.publicId }); assert.equal(queue.total, 1); assert.equal(queue.vehicles[0].id, v.id);
  assert.equal((await listAdminVehicles(admin.headers, { query: randomUUID() })).total, 0);
  await assert.rejects(getHostVehicle(other.headers, v.id), denied(404));
});

test("approval fails closed for absent/disabled policy, incomplete evidence and missing or corrupt photographs", async () => {
  const v = await pending();
  await assert.rejects(decideAdminVehicle(admin.headers, v.id, { ...approve(), approval: undefined }), error => error instanceof FleetError && error.code === "EVIDENCE_REQUIRED");
  await assert.rejects(decideAdminVehicle(admin.headers, v.id, { ...approve(), approval: { ...approval, policyVersion: `absent-${randomUUID()}` } }), error => error instanceof FleetError && error.code === "POLICY_REQUIRED");
  await db.vehicleVerificationPolicy.update({ where: { version: approval.policyVersion }, data: { enabled: false } });
  try { await assert.rejects(decideAdminVehicle(admin.headers, v.id, approve()), error => error instanceof FleetError && error.code === "POLICY_REQUIRED"); }
  finally { await db.vehicleVerificationPolicy.update({ where: { version: approval.policyVersion }, data: { enabled: true } }); }
  for (const value of [false, undefined]) await assert.rejects(decideAdminVehicle(admin.headers, v.id, { ...approve(), approval: { ...approval, checklist: { ...approval.checklist, ownershipAuthority: { confirmed: value, evidenceReference: "Synthetic" } } } }), ZodError);
  const noPhoto = await pending(false); await assert.rejects(decideAdminVehicle(admin.headers, noPhoto.id, approve()), error => error instanceof FleetError && error.code === "EVIDENCE_REQUIRED");
  const store = imageStorage(); const bytes = await store.get(v.image!.objectKey!);
  await store.remove(v.image!.objectKey!); await store.put(v.image!.objectKey!, Buffer.from("corrupt test object"));
  try { await assert.rejects(decideAdminVehicle(admin.headers, v.id, approve()), error => error instanceof ImageError && error.status === 404); }
  finally { await store.remove(v.image!.objectKey!); await store.put(v.image!.objectKey!, bytes); }
  assert.equal(await db.vehicleDecisionRecord.count({ where: { vehicleId: v.id } }), 0);
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: v.id } }), 0);
  assert.equal((await getAdminVehicle(admin.headers, v.id)).revision, 1);
});

test("synthetic protocol approval atomically records immutable evidence, actor, status, revision and audit; replay fails", async () => {
  const v = await pending(); const input = approve();
  const results = await Promise.allSettled([decideAdminVehicle(admin.headers, v.id, input), decideAdminVehicle(admin.headers, v.id, input)]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.ok(results.some(r => r.status === "rejected" && conflict(r.reason)));
  const detail = await getAdminVehicle(admin.headers, v.id); const decision = detail.decisions[0];
  assert.equal(detail.status, "APPROVED"); assert.equal(detail.revision, 2); assert.equal(detail.decisions.length, 1); assert.equal(detail.reviews.length, 1);
  assert.equal(decision.reviewerId, admin.id); assert.equal(decision.fromStatus, "PENDING_REVIEW"); assert.equal(decision.toStatus, "APPROVED"); assert.equal(decision.vehicleRevision, 1);
  assert.equal(decision.policyVersion, approval.policyVersion); assert.deepEqual(decision.checklist, { ...approval.checklist, compliance: { ...approval.compliance, requirementsSnapshot: syntheticMatrix.profiles[0] } }); assert.ok(decision.createdAt);
  assert.equal(await db.auditLog.count({ where: { actorId: admin.id, subjectId: v.id, action: "VEHICLE_APPROVED" } }), 1);
  await assert.rejects(decideAdminVehicle(admin.headers, v.id, input), conflict);
  await assert.rejects(db.vehicleDecisionRecord.update({ where: { id: decision.id }, data: { reason: "Tampered history" } }));
  await assert.rejects(db.vehicleDecisionRecord.delete({ where: { id: decision.id } }));
  await assert.rejects(db.vehicleVerificationPolicy.update({ where: { version: approval.policyVersion }, data: { reference: "Tampered policy reference" } }));
  await assert.rejects(db.vehicleVerificationPolicy.delete({ where: { version: approval.policyVersion } }));
  const owner = await getHostVehicle(host.headers, v.id);
  for (const key of ["checklist", "reviewerId", "criteriaVersion", "evidenceReference"]) assert.equal(Object.hasOwn(owner.reviews[0], key), false);
});

test("unresolved applicability, missing mandatory evidence and SQL checklist bypasses cannot approve", async () => {
  const v = await pending();
  const matrix = structuredClone(syntheticMatrix); matrix.profiles[0].requirements[0].applicability = "PENDING_POLICY_REVIEW";
  const unresolved = await syntheticPolicy(admin.id, matrix);
  await assert.rejects(decideAdminVehicle(admin.headers, v.id, { ...approve(), approval: unresolved }), error => error instanceof FleetError && error.code === "EVIDENCE_REQUIRED");
  await assert.rejects(decideAdminVehicle(admin.headers, v.id, { ...approve(), approval: { ...approval, compliance: { ...approval.compliance, checks: {} } } }), error => error instanceof FleetError && error.code === "EVIDENCE_REQUIRED");
  await assert.rejects(db.vehicleVerificationPolicy.update({ where: { version: unresolved.policyVersion }, data: { requirements: syntheticMatrix } }));
  await assert.rejects(db.$transaction(async tx => {
    const review = await tx.vehicleReview.create({ data: { vehicleId: v.id, reviewerId: admin.id, decision: "APPROVED", vehicleRevision: 1, reason, criteriaVersion: approval.policyVersion, evidenceReference: "Synthetic SQL bypass probe" } });
    await tx.vehicleDecisionRecord.create({ data: { vehicleId: v.id, reviewerId: admin.id, reviewId: review.id, fromStatus: "PENDING_REVIEW", toStatus: "APPROVED", vehicleRevision: 1, reason, policyVersion: approval.policyVersion, checklist: approval.checklist } });
  }));
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: v.id } }), 0);
  assert.equal((await getAdminVehicle(admin.headers, v.id)).status, "PENDING_REVIEW");
});

test("competing approval/rejection yields one decision; suspension, correction and resubmission require fresh review", async () => {
  const race = await pending();
  const results = await Promise.allSettled([decideAdminVehicle(admin.headers, race.id, approve()), decideAdminVehicle(admin.headers, race.id, { expectedRevision: 1, toStatus: "REJECTED", reason })]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1); assert.equal(await db.vehicleDecisionRecord.count({ where: { vehicleId: race.id } }), 1);
  const v = await pending(); await decideAdminVehicle(admin.headers, v.id, approve());
  await decideAdminVehicle(admin.headers, v.id, { expectedRevision: 2, toStatus: "SUSPENDED", reason, evidenceReference: "PRIVATE SYNTHETIC REFERENCE" });
  const owner = await getHostVehicle(host.headers, v.id); assert.equal(owner.decisions[0].reason, reason); assert.equal(Object.hasOwn(owner.decisions[0], "evidenceReference"), false);
  await assert.rejects(editHostVehicle(host.headers, v.id, { ...values(), expectedRevision: 3 }), FleetError);
  await decideAdminVehicle(admin.headers, v.id, { expectedRevision: 3, toStatus: "DRAFT", reason });
  await submitHostVehicle(host.headers, v.id, { expectedRevision: 4 });
  await assert.rejects(decideAdminVehicle(admin.headers, v.id, { expectedRevision: 5, toStatus: "APPROVED", reason }), FleetError);
  await decideAdminVehicle(admin.headers, v.id, { expectedRevision: 5, toStatus: "REJECTED", reason });
  await editHostVehicle(host.headers, v.id, { ...values(), expectedRevision: 6 });
  await submitHostVehicle(host.headers, v.id, { expectedRevision: 7 });
  assert.equal((await getAdminVehicle(admin.headers, v.id)).status, "PENDING_REVIEW");
  assert.equal(await db.vehicleDecisionRecord.count({ where: { vehicleId: v.id } }), 4);
});

test("legacy unassigned drafts and administrator-owned vehicles cannot be approved, rejected or silently assigned", async () => {
  const legacy = await db.vehicle.findMany({ where: { publicId: { in: ["vitz-142s", "note-131c"] } }, include: { ownership: true, reviews: true, decisions: true } });
  for (const v of legacy) {
    assert.equal(v.status, "DRAFT"); assert.equal(v.ownership?.ownerId, null);
    for (const toStatus of ["APPROVED", "REJECTED", "SUSPENDED"]) await assert.rejects(decideAdminVehicle(admin.headers, v.id, { expectedRevision: v.revision, reason, toStatus, ...(toStatus === "APPROVED" ? { approval } : {}) }), FleetError);
  }
  assert.deepEqual(await db.vehicle.findMany({ where: { publicId: { in: ["vitz-142s", "note-131c"] } }, include: { ownership: true, reviews: true, decisions: true } }), legacy);
  await db.roleAssignment.create({ data: { userId: admin.id, role: "HOST", createdAt: new Date(0) } });
  const own = await pending(true, admin);
  for (const toStatus of ["APPROVED", "REJECTED"]) await assert.rejects(decideAdminVehicle(admin.headers, own.id, { ...approve(), toStatus, ...(toStatus === "REJECTED" ? { approval: undefined } : {}) }), denied(403));
  assert.equal(await db.vehicleDecisionRecord.count({ where: { vehicleId: own.id } }), 0);
});

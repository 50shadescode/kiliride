import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { AccessError, requireIdentity, requireRole } from "../authorization";
import { getDb } from "../db";
import { assertListingTransition, FleetError } from "./lifecycle";
import { completeVehicleDraft, draftValues } from "@/lib/validation/host-vehicle";

const idSchema = z.string().uuid();
const reasonSchema = z.string().trim().min(10).max(1000);
const referenceSchema = z.string().trim().min(3).max(500);
const transitionSchema = z.object({
  vehicleId: idSchema, expectedRevision: z.number().int().nonnegative(),
  toStatus: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"]),
  reason: reasonSchema, criteriaVersion: referenceSchema.optional(), evidenceReference: referenceSchema.optional(),
}).strict();

async function fleetActor(headers: Headers) {
  const identity = await requireIdentity(headers);
  const administrator = identity.user.roles.some(role => role.role === "ADMIN");
  // ADMIN is not a shortcut around its MFA and post-grant session checks.
  await requireRole(headers, administrator ? "ADMIN" : "HOST");
  return { id: identity.user.id, administrator };
}

async function lockedVehicle(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${id} FOR UPDATE`;
  const vehicle = await tx.vehicle.findUnique({ where: { id }, include: { ownership: true } });
  if (!vehicle) throw new AccessError(404);
  return vehicle;
}

export async function readFleetVehicle(headers: Headers, id: string) {
  const actor = await fleetActor(headers);
  const vehicle = await getDb().vehicle.findUnique({ where: { id: idSchema.parse(id) }, include: { ownership: { select: { ownerId: true, assignedAt: true } } } });
  if (!vehicle) throw new AccessError(404);
  if (!actor.administrator && vehicle.ownership?.ownerId !== actor.id) throw new AccessError(403);
  // No registration, private evidence, source snapshot, or user profile joins.
  return vehicle;
}

export async function readVehicleRegistration(headers: Headers, id: string) {
  await readFleetVehicle(headers, id);
  return getDb().vehicleRegistration.findUnique({ where: { vehicleId: id } });
}

export async function assignVehicleOwner(headers: Headers, input: unknown) {
  const { user: actor } = await requireRole(headers, "ADMIN");
  const data = z.object({ vehicleId: idSchema, ownerId: idSchema,
    expectedRevision: z.number().int().nonnegative(), reason: reasonSchema, evidenceReference: referenceSchema,
  }).strict().parse(input);
  return getDb().$transaction(async tx => {
    const vehicle = await lockedVehicle(tx, data.vehicleId);
    if (vehicle.revision !== data.expectedRevision) throw new FleetError("CONFLICT");
    if (vehicle.status !== "DRAFT" || vehicle.ownership?.ownerId) throw new FleetError("CONFLICT");
    const owner = await tx.user.findUnique({ where: { id: data.ownerId }, select: { emailVerified: true, roles: { select: { role: true } } } });
    if (!owner?.emailVerified || !owner.roles.some(role => role.role === "HOST")) throw new AccessError(403);
    const assignment = { ownerId: data.ownerId, origin: "ADMIN_ASSIGNED" as const, assignedById: actor.id, assignedAt: new Date(), reason: data.reason, evidenceReference: data.evidenceReference };
    await tx.vehicleOwnership.upsert({ where: { vehicleId: vehicle.id }, create: { vehicleId: vehicle.id, ...assignment }, update: assignment });
    await tx.vehicle.update({ where: { id: vehicle.id }, data: { revision: { increment: 1 } } });
    await tx.auditLog.create({ data: { actorId: actor.id, subjectId: vehicle.id, action: "VEHICLE_OWNER_ASSIGNED", reason: data.reason } });
    return { assigned: true };
  });
}

// Foundation only: no route handler, server action or dashboard exposes this yet.
// Actual review criteria/evidence must be supplied by authorized operations later.
export async function transitionVehicleListing(headers: Headers, input: unknown) {
  const actor = await fleetActor(headers);
  const data = transitionSchema.parse(input);
  return getDb().$transaction(async tx => {
    const vehicle = await lockedVehicle(tx, data.vehicleId);
    if (!actor.administrator && vehicle.ownership?.ownerId !== actor.id) throw new AccessError(403);
    if (vehicle.revision !== data.expectedRevision) throw new FleetError("CONFLICT");
    assertListingTransition(vehicle.status, data.toStatus, actor.administrator);
    if (data.toStatus === "PENDING_REVIEW" && !vehicle.ownership?.ownerId) throw new FleetError("EVIDENCE_REQUIRED");
    if (data.toStatus === "PENDING_REVIEW") {
      const registration = await tx.vehicleRegistration.findUnique({ where: { vehicleId: vehicle.id } });
      completeVehicleDraft(draftValues(vehicle, registration?.registrationNumber));
    }
    let approvedReviewId: string | null = null;
    if (data.toStatus === "APPROVED" || data.toStatus === "REJECTED") {
      if (!actor.administrator || vehicle.ownership?.ownerId === actor.id) throw new AccessError(403);
      if (data.toStatus === "APPROVED" && (!data.criteriaVersion || !data.evidenceReference)) throw new FleetError("EVIDENCE_REQUIRED");
      const review = await tx.vehicleReview.create({ data: {
        vehicleId: vehicle.id, reviewerId: actor.id, decision: data.toStatus, vehicleRevision: vehicle.revision,
        reason: data.reason, criteriaVersion: data.criteriaVersion, evidenceReference: data.evidenceReference,
      } });
      if (data.toStatus === "APPROVED") approvedReviewId = review.id;
    }
    const updated = await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: data.toStatus, approvedReviewId, revision: { increment: 1 } } });
    await tx.vehicleListingEvent.create({ data: { vehicleId: vehicle.id, actorId: actor.id, fromStatus: vehicle.status, toStatus: data.toStatus, reason: data.reason } });
    await tx.auditLog.create({ data: { actorId: actor.id, subjectId: vehicle.id, action: `VEHICLE_${data.toStatus}`, reason: data.reason } });
    return { id: updated.id, status: updated.status, revision: updated.revision };
  });
}

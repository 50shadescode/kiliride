import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireRole, AccessError } from "../authorization";
import { getDb } from "../db";
import { FleetError } from "./lifecycle";
import { completeVehicleDraft, draftValues, vehicleDraftSchema, vehicleEditSchema, vehicleRevisionSchema } from "@/lib/validation/host-vehicle";

const idSchema = z.string().uuid();
const hostSelect = {
  id: true, publicId: true, make: true, model: true, category: true, location: true, description: true,
  seats: true, fuelType: true, transmission: true, baseHalfDay: true, baseFullDay: true, status: true, revision: true,
} satisfies Prisma.VehicleSelect;

export async function listHostVehicles(headers: Headers) {
  const { user } = await requireRole(headers, "HOST");
  return getDb().vehicle.findMany({ where: { ownership: { ownerId: user.id } }, select: hostSelect, orderBy: [{ createdAt: "desc" }, { id: "asc" }] });
}

export async function getHostVehicle(headers: Headers, id: string) {
  const { user } = await requireRole(headers, "HOST");
  const vehicle = await getDb().vehicle.findFirst({ where: { id: idSchema.parse(id), ownership: { ownerId: user.id } }, select: {
    ...hostSelect, registration: { select: { registrationNumber: true } },
    reviews: { select: { id: true, decision: true, reason: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 10 },
    decisions: { where: { toStatus: { in: ["SUSPENDED", "DRAFT"] } }, select: { id: true, toStatus: true, reason: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
  } });
  if (!vehicle) throw new AccessError(404);
  return vehicle;
}

export async function createHostVehicle(headers: Headers, input: unknown) {
  const { user } = await requireRole(headers, "HOST");
  const { registrationNumber, ...values } = vehicleDraftSchema.parse(input);
  return getDb().$transaction(async tx => {
    const vehicle = await tx.vehicle.create({ data: {
      ...values, description: values.description || null, publicId: `vehicle-${randomUUID()}`,
      ownership: { create: { ownerId: user.id, origin: "HOST_DECLARED", declaredAt: new Date() } },
      ...(registrationNumber ? { registration: { create: { registrationNumber } } } : {}),
      events: { create: { actorId: user.id, toStatus: "DRAFT", reason: "Host created an unverified draft listing." } },
    }, select: hostSelect });
    await tx.auditLog.create({ data: { actorId: user.id, subjectId: vehicle.id, action: "HOST_VEHICLE_CREATED", reason: "Host declared a new vehicle; no ownership verification or approval implied." } });
    return vehicle;
  });
}

async function lockOwned(tx: Prisma.TransactionClient, id: string, userId: string) {
  // Scope both the lock and read, including for users who also hold ADMIN.
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT v.id FROM "Vehicle" v JOIN "VehicleOwnership" o ON o."vehicleId" = v.id WHERE v.id = ${id} AND o."ownerId" = ${userId} FOR UPDATE OF v`;
  if (!rows.length) throw new AccessError(404);
  return tx.vehicle.findUniqueOrThrow({ where: { id }, include: { registration: true } });
}

export async function editHostVehicle(headers: Headers, id: string, input: unknown) {
  const { user } = await requireRole(headers, "HOST");
  idSchema.parse(id);
  const { expectedRevision, registrationNumber, ...values } = vehicleEditSchema.parse(input);
  return getDb().$transaction(async tx => {
    const current = await lockOwned(tx, id, user.id);
    if (current.revision !== expectedRevision) throw new FleetError("CONFLICT");
    if (!["DRAFT", "REJECTED"].includes(current.status)) throw new FleetError("INVALID_TRANSITION");
    const vehicle = await tx.vehicle.update({ where: { id }, data: { ...values, description: values.description || null, status: "DRAFT", revision: { increment: 1 } }, select: hostSelect });
    if (registrationNumber) await tx.vehicleRegistration.upsert({ where: { vehicleId: id }, create: { vehicleId: id, registrationNumber }, update: { registrationNumber } });
    else await tx.vehicleRegistration.deleteMany({ where: { vehicleId: id } });
    if (current.status === "REJECTED") await tx.vehicleListingEvent.create({ data: { vehicleId: id, actorId: user.id, fromStatus: "REJECTED", toStatus: "DRAFT", reason: "Host revised a rejected listing for a new review." } });
    await tx.auditLog.create({ data: { actorId: user.id, subjectId: id, action: "HOST_VEHICLE_EDITED", reason: "Host saved draft details; previous review history retained." } });
    return vehicle;
  });
}

export async function submitHostVehicle(headers: Headers, id: string, input: unknown) {
  const { user } = await requireRole(headers, "HOST");
  idSchema.parse(id);
  const { expectedRevision } = vehicleRevisionSchema.parse(input);
  return getDb().$transaction(async tx => {
    const current = await lockOwned(tx, id, user.id);
    if (current.revision !== expectedRevision) throw new FleetError("CONFLICT");
    if (current.status !== "DRAFT") throw new FleetError("INVALID_TRANSITION");
    completeVehicleDraft(draftValues(current, current.registration?.registrationNumber));
    const vehicle = await tx.vehicle.update({ where: { id }, data: { status: "PENDING_REVIEW", revision: { increment: 1 } }, select: hostSelect });
    const reason = "Host submitted complete listing details for administrator review.";
    await tx.vehicleListingEvent.create({ data: { vehicleId: id, actorId: user.id, fromStatus: "DRAFT", toStatus: "PENDING_REVIEW", reason } });
    await tx.auditLog.create({ data: { actorId: user.id, subjectId: id, action: "HOST_VEHICLE_SUBMITTED", reason } });
    return vehicle;
  });
}

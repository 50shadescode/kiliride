import "server-only";
import { z } from "zod";
import { requireRole, AccessError } from "../authorization";
import { getDb } from "../db";
import { adminDecisionSchema, adminQueueSchema } from "@/lib/validation/vehicle-review";
import { transitionVehicleListing } from "./service";
import { readVerifiedImage } from "../images/read";
import { imageStorage } from "../images/storage";
import { complianceMatrixSchema } from "@/lib/validation/vehicle-compliance";

const uuid = z.string().uuid();
const ownership = { select: { ownerId: true, origin: true, assignedAt: true, declaredAt: true, owner: { select: { id: true, name: true, emailVerified: true } } } } as const;
export async function listAdminVehicles(headers: Headers, input: unknown) {
  await requireRole(headers, "ADMIN");
  const filters = adminQueueSchema.parse(input);
  const where = { ...(filters.status === "ALL" ? {} : { status: filters.status }), ...(filters.query ? { OR: ["make", "model", "publicId"].map(field => ({ [field]: { contains: filters.query, mode: "insensitive" as const } })) } : {}) };
  const db = getDb();
  const [total, vehicles] = await db.$transaction([
    db.vehicle.count({ where }),
    db.vehicle.findMany({ where, select: { id: true, publicId: true, make: true, model: true, status: true, location: true, baseHalfDay: true, baseFullDay: true, ownership,
      events: { where: { toStatus: "PENDING_REVIEW" }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    }, orderBy: [{ updatedAt: "asc" }, { id: "asc" }], skip: (filters.page - 1) * 25, take: 25 }),
  ]);
  return { ...filters, total, vehicles };
}
export async function getAdminVehicle(headers: Headers, vehicleId: string) {
  const { user } = await requireRole(headers, "ADMIN");
  const db = getDb();
  const vehicle = await db.vehicle.findUnique({ where: { id: uuid.parse(vehicleId) }, select: {
    id: true, publicId: true, make: true, model: true, category: true, description: true, seats: true, fuelType: true, transmission: true, location: true,
    baseHalfDay: true, baseFullDay: true, status: true, revision: true, ownership,
    registration: { select: { registrationNumber: true } },
    photos: { select: { id: true, altText: true, isCover: true, position: true, object: { select: { state: true } } }, orderBy: { position: "asc" } },
    reviews: { select: { id: true, reviewerId: true, decision: true, vehicleRevision: true, reason: true, criteriaVersion: true, evidenceReference: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    decisions: { select: { id: true, reviewerId: true, reviewId: true, fromStatus: true, toStatus: true, vehicleRevision: true, reason: true, evidenceReference: true, policyVersion: true, checklist: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    events: { select: { id: true, fromStatus: true, toStatus: true, createdAt: true }, orderBy: { createdAt: "desc" } },
  } });
  if (!vehicle) throw new AccessError(404);
  const policies = await db.vehicleVerificationPolicy.findMany({ where: { enabled: true, approvedAt: { lte: new Date() } }, select: { version: true, reference: true, testOnly: true, requirements: true }, orderBy: { approvedAt: "desc" } });
  return { ...vehicle, photos: vehicle.photos.map(({ object, ...photo }) => ({ ...photo, available: object?.state === "ACTIVE", url: `/api/admin/vehicles/${vehicleId}/photos/${photo.id}/image` })), policies: policies.map(policy => ({ ...policy, requirements: complianceMatrixSchema.safeParse(policy.requirements).data ?? null })), selfReview: vehicle.ownership?.ownerId === user.id };
}
export async function decideAdminVehicle(headers: Headers, vehicleId: string, input: unknown) {
  await requireRole(headers, "ADMIN");
  const data = adminDecisionSchema.parse(input);
  if (data.toStatus !== "APPROVED" && data.approval) throw new z.ZodError([{ code: "custom", path: ["approval"], message: "Only approval accepts a verification checklist." }]);
  return transitionVehicleListing(headers, { ...data, vehicleId: uuid.parse(vehicleId) });
}
export async function readAdminVehiclePhoto(headers: Headers, vehicleId: string, photoId: string) {
  await requireRole(headers, "ADMIN");
  const photo = await getDb().vehiclePhoto.findFirst({ where: { id: uuid.parse(photoId), vehicleId: uuid.parse(vehicleId), object: { state: "ACTIVE" } }, include: { object: true } });
  if (!photo?.object) throw new AccessError(404);
  return readVerifiedImage(imageStorage(), photo.object);
}

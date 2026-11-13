import "server-only";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { getDb } from "../db";
import { AccessError } from "../authorization";
import { databaseCatalogueEnabled } from "./catalogue-config";
import { activeVerificationPolicy } from "./policy";
import { catalogueQuerySchema, publicIdSchema, publicMetadataSchema } from "@/lib/validation/public-catalogue";
import { verificationChecklistSchema } from "@/lib/validation/vehicle-review";
import { assessedCompliance, complianceAssessmentSchema } from "@/lib/validation/vehicle-compliance";
import { KILIFI_FLEET } from "@/lib/fleet";
import type { PublicVehicle } from "@/lib/types/public-vehicle";
import { imageStorage } from "../images/storage";
import { readVerifiedImage } from "../images/read";

const managerPhone = "254726063889"; // Existing public KiliRide enquiry contact, never an owner's private phone.
const MAX_CANDIDATES = 500;
const proofSchema = verificationChecklistSchema.extend({ compliance: complianceAssessmentSchema.extend({ requirementsSnapshot: z.unknown() }).strict() }).strict();

function legacyVehicles(): PublicVehicle[] {
  return KILIFI_FLEET.map(v => ({ id: v.id, make: v.name.split(" ")[0], model: v.name.split(" ").slice(1).join(" "), name: v.name, type: v.type, description: "Contact KiliRide to confirm this vehicle's details and rental arrangements.", location: v.location, transmission: v.transmission, fuelType: v.fuelType, seats: v.seats, baseHalfDay: v.baseHalfDay, baseFullDay: v.baseFullDay, reservationFee: v.reservationFee, managerPhone: v.managerPhone, reviewStatus: "legacy", photos: [{ url: v.image, alt: v.name }] }));
}

// Bounded local preview query. All policy/evidence processing stays server-only.
// A capacity overflow fails closed, never truncates eligible pagination silently.
async function databaseVehicles(publicId?: string) {
  const db = getDb();
  const policies = await db.vehicleVerificationPolicy.findMany({ where: { enabled: true }, take: 101 });
  if (policies.length > 100) throw new Error("Catalogue policy capacity exceeded");
  const versions = policies.filter(activeVerificationPolicy).map(p => p.version);
  if (!versions.length) return [];
  const candidates = await db.vehicle.findMany({ where: {
    ...(publicId ? { publicId } : {}), status: "APPROVED", ownership: { ownerId: { not: null }, origin: { not: "UNASSIGNED" }, owner: { emailVerified: true, roles: { some: { role: "HOST" } } } },
    approvedReview: { decision: "APPROVED", decisionRecord: { toStatus: "APPROVED", policyVersion: { in: versions } } },
    photos: { some: { isCover: true, object: { state: "ACTIVE" } }, every: { object: { state: "ACTIVE" } } },
  }, select: {
    id: true, publicId: true, make: true, model: true, category: true, description: true, location: true, seats: true, fuelType: true, transmission: true, currency: true, baseHalfDay: true, baseFullDay: true, revision: true,
    ownership: { select: { ownerId: true } },
    approvedReview: { include: { decisionRecord: true } },
    photos: { select: { id: true, position: true, isCover: true }, orderBy: [{ position: "asc" }, { id: "asc" }], take: 13 },
    events: { where: { toStatus: "APPROVED", fromStatus: "PENDING_REVIEW" }, orderBy: { createdAt: "desc" }, take: 1, select: { actorId: true, reason: true, createdAt: true } },
  }, orderBy: [{ createdAt: "asc" }, { publicId: "asc" }], take: MAX_CANDIDATES + 1 });
  if (candidates.length > MAX_CANDIDATES) throw new Error("Catalogue capacity exceeded");
  const proven = candidates.filter(v => {
    const review = v.approvedReview, d = review?.decisionRecord;
    const policy = policies.find(p => p.version === d?.policyVersion);
    if (!review || !d || !policy || !activeVerificationPolicy(policy) || review.vehicleId !== v.id || d.vehicleId !== v.id || d.fromStatus !== "PENDING_REVIEW" || review.vehicleRevision !== v.revision - 1 || d.vehicleRevision !== review.vehicleRevision || d.reviewerId !== review.reviewerId || d.reviewerId === v.ownership?.ownerId || review.criteriaVersion !== policy.version || d.reason !== review.reason || !review.evidenceReference || v.photos.length > 12 || !publicMetadataSchema.safeParse(v).success) return false;
    const proof = proofSchema.safeParse(d.checklist);
    if (!proof.success) return false;
    const assessed = assessedCompliance(policy.requirements, proof.data.compliance);
    if (!assessed || !isDeepStrictEqual(assessed.requirementsSnapshot, proof.data.compliance.requirementsSnapshot)) return false;
    const event = v.events[0];
    // Prisma supplies timestamps per insert, even inside one transaction. The
    // event/audit must follow this revision's decision, not an older approval.
    return event?.actorId === d.reviewerId && event.reason === d.reason && event.createdAt >= d.createdAt && d.createdAt >= review.createdAt;
  });
  if (!proven.length) return [];
  const audits = await db.auditLog.findMany({ where: { action: "VEHICLE_APPROVED", OR: proven.map(v => { const d = v.approvedReview!.decisionRecord!; return { subjectId: v.id, actorId: d.reviewerId, reason: d.reason, createdAt: { gte: v.events[0].createdAt } }; }) }, select: { subjectId: true }, take: MAX_CANDIDATES + 1 });
  if (audits.length > MAX_CANDIDATES) throw new Error("Catalogue audit capacity exceeded");
  const audited = new Set(audits.map(a => a.subjectId));
  return proven.filter(v => audited.has(v.id)).map((v): PublicVehicle => ({ id: v.publicId, make: v.make, model: v.model, name: `${v.make} ${v.model}`, type: v.category, description: v.description!, location: v.location, transmission: v.transmission, fuelType: v.fuelType, seats: v.seats, baseHalfDay: v.baseHalfDay, baseFullDay: v.baseFullDay, reservationFee: null, managerPhone, reviewStatus: "approved", photos: [...v.photos].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position).map(p => ({ url: `/api/public/vehicles/${v.publicId}/photos/${p.id}`, alt: `${v.make} ${v.model} photograph ${p.position + 1}` })) }));
}

export async function publicCatalogue(input: unknown = {}) {
  const filters = catalogueQuerySchema.parse(input);
  const vehicles = databaseCatalogueEnabled() ? await databaseVehicles() : legacyVehicles();
  const categories = [...new Set(vehicles.map(v => v.type))].sort();
  const matches = vehicles.filter(v => `${v.make} ${v.model}`.toLowerCase().includes(filters.q.toLowerCase()) && (!filters.category || v.type === filters.category) && v.location.toLowerCase().includes(filters.location.toLowerCase()) && (!filters.seats || v.seats >= filters.seats));
  if (filters.sort !== "default") matches.sort((a, b) => (filters.sort === "name" ? a.name.localeCompare(b.name, "en") : filters.sort === "price-asc" ? a.baseFullDay - b.baseFullDay : b.baseFullDay - a.baseFullDay) || a.id.localeCompare(b.id, "en"));
  return { filters, categories, total: matches.length, vehicles: matches.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize) };
}
export async function publicVehicle(id: string) {
  if (!publicIdSchema.safeParse(id).success) return null;
  return databaseCatalogueEnabled() ? (await databaseVehicles(id))[0] ?? null : legacyVehicles().find(v => v.id === id) ?? null;
}
export async function publicVehiclePhoto(id: string, photoId: string) {
  if (!databaseCatalogueEnabled() || !z.string().uuid().safeParse(photoId).success) throw new AccessError(404);
  const vehicle = await publicVehicle(id);
  const url = `/api/public/vehicles/${id}/photos/${photoId}`;
  if (!vehicle?.photos.some(p => p.url === url)) throw new AccessError(404);
  const photo = await getDb().vehiclePhoto.findFirst({ where: { id: photoId, vehicle: { publicId: id, status: "APPROVED" }, object: { state: "ACTIVE" } }, select: { object: true } });
  if (!photo?.object) throw new AccessError(404);
  const bytes = await readVerifiedImage(imageStorage(), photo.object);
  // Recheck after storage I/O, so a committed suspension/policy change withdraws
  // the same URL. Already delivered bytes cannot be recalled from a recipient.
  if (!await publicVehicle(id)) throw new AccessError(404);
  return bytes;
}

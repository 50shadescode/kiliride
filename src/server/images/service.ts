import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireRole, AccessError } from "../authorization";
import { getDb } from "../db";
import { FleetError } from "../fleet/lifecycle";
import { vehicleRevisionSchema } from "@/lib/validation/host-vehicle";
import { ImageError, MAX_VEHICLE_PHOTOS, photoOrderSchema, photoUploadSchema } from "@/lib/validation/vehicle-image";
import { normalizeImage } from "./normalize";
import { imageStorage, type ImageStorage } from "./storage";

const id = z.string().uuid();
async function owned(headers: Headers, vehicleId: string) {
  const { user } = await requireRole(headers, "HOST");
  id.parse(vehicleId);
  const vehicle = await getDb().vehicle.findFirst({ where: { id: vehicleId, ownership: { ownerId: user.id } } });
  if (!vehicle) throw new AccessError(404);
  return { user, vehicle };
}
export async function assertPhotoOwner(headers: Headers, vehicleId: string) { await owned(headers, vehicleId); }
async function lock(tx: Prisma.TransactionClient, vehicleId: string, userId: string, revision: number) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT v.id FROM "Vehicle" v JOIN "VehicleOwnership" o ON o."vehicleId" = v.id WHERE v.id = ${vehicleId} AND o."ownerId" = ${userId} FOR UPDATE OF v`;
  if (!rows.length) throw new AccessError(404);
  const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } });
  if (vehicle.revision !== revision) throw new FleetError("CONFLICT");
  if (!["DRAFT", "REJECTED"].includes(vehicle.status)) throw new FleetError("INVALID_TRANSITION");
  return vehicle;
}
async function changed(tx: Prisma.TransactionClient, vehicle: { id: string; status: string }, userId: string, action: string) {
  const next = await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "DRAFT", revision: { increment: 1 } } });
  if (vehicle.status === "REJECTED") await tx.vehicleListingEvent.create({ data: { vehicleId: vehicle.id, actorId: userId, fromStatus: "REJECTED", toStatus: "DRAFT", reason: "Host revised photographs for a new listing review." } });
  await tx.auditLog.create({ data: { actorId: userId, subjectId: vehicle.id, action, reason: "Host changed private listing photographs; no verification or publication implied." } });
  return { revision: next.revision, status: next.status };
}
async function ordered(tx: Prisma.TransactionClient, vehicleId: string, photoIds: string[], coverId: string | undefined) {
  const current = await tx.vehiclePhoto.findMany({ where: { vehicleId } });
  // Move to unused positive positions before assigning the final contiguous order.
  const offset = Math.max(0, ...current.map(photo => photo.position)) + current.length + 1;
  for (let i = 0; i < current.length; i++) await tx.vehiclePhoto.update({ where: { id: current[i].id }, data: { position: offset + i, isCover: false } });
  for (let i = 0; i < photoIds.length; i++) await tx.vehiclePhoto.update({ where: { id: photoIds[i] }, data: { position: i, isCover: photoIds[i] === coverId } });
}

export function createPhotoService(storage: ImageStorage) {
  const db = getDb();
  async function cleanup(key: string, pendingBefore = new Date()) {
    return db.$transaction(async tx => {
      await tx.$queryRaw`SELECT key FROM "VehicleImageObject" WHERE key = ${key} FOR UPDATE`;
      const object = await tx.vehicleImageObject.findUnique({ where: { key }, include: { photo: true } });
      if (!object || object.photo || object.state === "ACTIVE" || (object.state === "PENDING" && object.createdAt > pendingBefore)) return false;
      // Upload activation holds this same journal lock while writing. Cleanup can
      // never race an active writer or remove an object referenced by a photo.
      await storage.remove(key);
      await tx.vehicleImageObject.delete({ where: { key } });
      return true;
    }, { timeout: 15000 });
  }
  async function bestEffortCleanup(key: string | null) {
    if (!key) return;
    try { await cleanup(key); } catch { /* Durable PENDING/DELETE_PENDING row remains for retry. */ }
  }
  return {
    async list(headers: Headers, vehicleId: string) {
      const { vehicle } = await owned(headers, vehicleId);
      const photos = await db.vehiclePhoto.findMany({ where: { vehicleId }, select: { id: true, altText: true, position: true, isCover: true }, orderBy: { position: "asc" } });
      return { revision: vehicle.revision, status: vehicle.status, photos: photos.map(photo => ({ ...photo, url: `/api/host/vehicles/${vehicleId}/photos/${photo.id}/image` })) };
    },
    async upload(headers: Headers, vehicleId: string, input: unknown, bytes: Buffer, contentType: string) {
      const { user, vehicle } = await owned(headers, vehicleId);
      const data = photoUploadSchema.parse(input);
      if (vehicle.revision !== data.expectedRevision) throw new FleetError("CONFLICT");
      if (!["DRAFT", "REJECTED"].includes(vehicle.status)) throw new FleetError("INVALID_TRANSITION");
      if (data.replacePhotoId && !await db.vehiclePhoto.findFirst({ where: { id: data.replacePhotoId, vehicleId } })) throw new AccessError(404);
      if (!data.replacePhotoId && await db.vehiclePhoto.count({ where: { vehicleId } }) >= MAX_VEHICLE_PHOTOS) throw new ImageError(400, "A vehicle can have up to 12 photographs.");
      const now = BigInt(Date.now()), cutoff = now - BigInt(60000), throttleKey = `vehicle-image:${user.id}`;
      const throttle = await db.$queryRaw<{ count: number }[]>`INSERT INTO "RateLimit" (key, count, "lastRequest") VALUES (${throttleKey}, 1, ${now}) ON CONFLICT (key) DO UPDATE SET count = CASE WHEN "RateLimit"."lastRequest" < ${cutoff} THEN 1 ELSE "RateLimit".count + 1 END, "lastRequest" = CASE WHEN "RateLimit"."lastRequest" < ${cutoff} THEN ${now} ELSE "RateLimit"."lastRequest" END RETURNING count`;
      if (throttle[0].count > 60) throw new ImageError(429, "Too many uploads. Wait a minute before trying again.");
      const image = await normalizeImage(bytes, contentType);
      const key = `${randomUUID()}.webp`;
      await db.vehicleImageObject.create({ data: { key, sha256: image.sha256, width: image.width, height: image.height, byteSize: image.byteSize } });
      let oldKey: string | null = null;
      let write: Promise<void> | undefined;
      try {
        const result = await db.$transaction(async tx => {
          const current = await lock(tx, vehicleId, user.id, data.expectedRevision);
          await tx.$queryRaw`SELECT key FROM "VehicleImageObject" WHERE key = ${key} FOR UPDATE`;
          const journal = await tx.vehicleImageObject.findUnique({ where: { key } });
          if (journal?.state !== "PENDING") throw new FleetError("CONFLICT");
          const photos = await tx.vehiclePhoto.findMany({ where: { vehicleId }, orderBy: { position: "asc" } });
          const replaced = data.replacePhotoId ? photos.find(photo => photo.id === data.replacePhotoId) : undefined;
          if (data.replacePhotoId && !replaced) throw new AccessError(404);
          if (!replaced && photos.length >= MAX_VEHICLE_PHOTOS) throw new ImageError(400, "A vehicle can have up to 12 photographs.");
          write = storage.put(key, image.bytes);
          await write;
          await tx.vehicleImageObject.update({ where: { key }, data: { state: "ACTIVE" } });
          const metadata = { storageKey: key, objectKey: key, contentType: "image/webp", byteSize: image.byteSize, altText: data.altText, uploadedById: user.id };
          const photo = replaced
            ? await tx.vehiclePhoto.update({ where: { id: replaced.id }, data: metadata })
            : await tx.vehiclePhoto.create({ data: { ...metadata, vehicleId, position: photos.length ? Math.max(...photos.map(p => p.position)) + 1 : 0, isCover: !photos.some(p => p.isCover) } });
          oldKey = replaced?.objectKey ?? null;
          if (oldKey) await tx.vehicleImageObject.update({ where: { key: oldKey }, data: { state: "DELETE_PENDING" } });
          return { ...await changed(tx, current, user.id, replaced ? "VEHICLE_PHOTO_REPLACED" : "VEHICLE_PHOTO_ADDED"), photoId: photo.id };
        }, { timeout: 15000 });
        await bestEffortCleanup(oldKey);
        return result;
      } catch (error) {
        // A timed-out DB transaction must not clean a file while its write is
        // still completing. The durable journal also survives process crashes.
        await write?.catch(() => {});
        await bestEffortCleanup(key); throw error;
      }
    },
    async arrange(headers: Headers, vehicleId: string, input: unknown) {
      const { user } = await owned(headers, vehicleId);
      const data = photoOrderSchema.parse(input);
      return db.$transaction(async tx => {
        const vehicle = await lock(tx, vehicleId, user.id, data.expectedRevision);
        const photos = await tx.vehiclePhoto.findMany({ where: { vehicleId } });
        if (new Set(data.photoIds).size !== photos.length || data.photoIds.length !== photos.length || !photos.every(photo => data.photoIds.includes(photo.id)) || !data.photoIds.includes(data.coverPhotoId)) throw new ImageError(400, "Provide each owned photograph once and select its cover.");
        await ordered(tx, vehicleId, data.photoIds, data.coverPhotoId);
        return changed(tx, vehicle, user.id, "VEHICLE_PHOTOS_ARRANGED");
      });
    },
    async remove(headers: Headers, vehicleId: string, photoId: string, input: unknown) {
      const { user } = await owned(headers, vehicleId); id.parse(photoId);
      const { expectedRevision } = vehicleRevisionSchema.parse(input);
      const result = await db.$transaction(async tx => {
        const vehicle = await lock(tx, vehicleId, user.id, expectedRevision);
        const photos = await tx.vehiclePhoto.findMany({ where: { vehicleId }, orderBy: { position: "asc" } });
        const photo = photos.find(p => p.id === photoId);
        if (!photo) throw new AccessError(404);
        await tx.vehiclePhoto.delete({ where: { id: photo.id } });
        if (photo.objectKey) await tx.vehicleImageObject.update({ where: { key: photo.objectKey }, data: { state: "DELETE_PENDING" } });
        const remaining = photos.filter(p => p.id !== photoId);
        await ordered(tx, vehicleId, remaining.map(p => p.id), remaining.find(p => p.isCover)?.id ?? remaining[0]?.id);
        return { ...await changed(tx, vehicle, user.id, "VEHICLE_PHOTO_REMOVED"), key: photo.objectKey };
      });
      await bestEffortCleanup(result.key);
      return { revision: result.revision, status: result.status };
    },
    async read(headers: Headers, vehicleId: string, photoId: string) {
      await owned(headers, vehicleId); id.parse(photoId);
      const photo = await db.vehiclePhoto.findFirst({ where: { id: photoId, vehicleId, object: { state: "ACTIVE" } }, include: { object: true } });
      if (!photo?.object) throw new AccessError(404);
      try {
        const bytes = await storage.get(photo.object.key);
        if (bytes.length !== photo.object.byteSize || createHash("sha256").update(bytes).digest("hex") !== photo.object.sha256) throw new Error("Image integrity check failed");
        return bytes;
      } catch { throw new ImageError(404, "Photograph unavailable."); }
    },
    async reconcile() {
      const cutoff = new Date(Date.now() - 3600_000);
      const objects = await db.vehicleImageObject.findMany({ where: { OR: [{ state: "DELETE_PENDING" }, { state: "PENDING", createdAt: { lt: cutoff } }] }, select: { key: true }, take: 100, orderBy: { createdAt: "asc" } });
      let removed = 0, failed = 0;
      for (const object of objects) { try { if (await cleanup(object.key, cutoff)) removed++; } catch { failed++; } }
      return { examined: objects.length, removed, failed };
    },
  };
}
export function photos() { return createPhotoService(imageStorage()); }

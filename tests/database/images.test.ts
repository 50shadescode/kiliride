import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import sharp from "sharp";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { getDb } from "../../src/server/db";
import { getAuth } from "../../src/server/auth";
import { AccessError } from "../../src/server/authorization";
import { createHostVehicle, submitHostVehicle } from "../../src/server/fleet/host";
import { transitionVehicleListing } from "../../src/server/fleet/service";
import { createPhotoService } from "../../src/server/images/service";
import { imageStorage, imageStorageNamespace } from "../../src/server/images/storage";
import { normalizeImage } from "../../src/server/images/normalize";
import { FleetError } from "../../src/server/fleet/lifecycle";
import { ImageError, MAX_IMAGE_BYTES } from "../../src/lib/validation/vehicle-image";
import { syntheticPolicy } from "../helpers/verification";

assertLocalDatabase(process.env.TEST_DATABASE_URL, true);
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
const db = getDb(), store = imageStorage(), service = createPhotoService(store);
type Actor = { id: string; headers: Headers };
let host: Actor, other: Actor, customer: Actor, admin: Actor;
let png: Buffer;
let approval: Awaited<ReturnType<typeof syntheticPolicy>>;
const denied = (status: number) => (error: unknown) => error instanceof AccessError && error.status === status;
const imageError = (status: number) => (error: unknown) => error instanceof ImageError && error.status === status;
async function actor(role?: "HOST" | "ADMIN"): Promise<Actor> {
  const email = `image-test-${randomUUID()}@kiliride.test`, password = randomBytes(24).toString("hex");
  const auth = getAuth();
  const { user } = await auth.api.signUpEmail({ body: { email, password, name: "Synthetic image test actor" } });
  await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  if (role) await db.roleAssignment.create({ data: { userId: user.id, role, createdAt: new Date(0) } });
  const response = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  assert.equal(response.status, 200);
  if (role === "ADMIN") await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  return { id: user.id, headers: new Headers({ cookie: response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ") }) };
}
async function vehicle() {
  return createHostVehicle(host.headers, { make: "Synthetic", model: "Image fixture", category: "Test", location: "Test location", description: "Synthetic image tests, not real inventory.", registrationNumber: `S-${randomUUID()}`, seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500 });
}
async function upload(vehicleId: string, revision: number, replacePhotoId?: string) {
  return service.upload(host.headers, vehicleId, { expectedRevision: revision, altText: "Synthetic test pixels", ...(replacePhotoId ? { replacePhotoId } : {}) }, png, "image/png");
}
before(async () => {
  assert.equal((await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`)[0].name, "kiliride_test");
  host = await actor("HOST"); other = await actor("HOST"); customer = await actor(); admin = await actor("ADMIN");
  approval = await syntheticPolicy(admin.id);
  png = await sharp({ create: { width: 64, height: 48, channels: 3, background: "#059669" } }).png().toBuffer();
});
after(async () => { await db.$disconnect(); });

test("image normalization decodes allowed formats, rotates/resizes and strips metadata", async () => {
  for (const format of ["png", "jpeg", "webp"] as const) {
    const input = await sharp(png).toFormat(format).toBuffer();
    const result = await normalizeImage(input, `image/${format}`);
    const meta = await sharp(result.bytes).metadata();
    assert.equal(meta.format, "webp"); assert.equal(meta.width, 64); assert.equal(meta.height, 48);
    assert.equal(result.byteSize, result.bytes.length);
    assert.equal(result.sha256, createHash("sha256").update(result.bytes).digest("hex"));
  }
  const tagged = await sharp(png).withMetadata({ orientation: 6, exif: { IFD0: { Artist: "SYNTHETIC PRIVATE METADATA" } } }).jpeg().toBuffer();
  const normalized = await normalizeImage(tagged, "image/jpeg");
  const meta = await sharp(normalized.bytes).metadata();
  assert.equal(meta.width, 48); assert.equal(meta.height, 64); assert.equal(meta.exif, undefined); assert.equal(meta.xmp, undefined); assert.equal(meta.icc, undefined);
  assert.equal(normalized.bytes.includes(Buffer.from("SYNTHETIC PRIVATE METADATA")), false);
  const large = await sharp({ create: { width: 3000, height: 100, channels: 3, background: "white" } }).png().toBuffer();
  assert.equal((await normalizeImage(large, "image/png")).width, 2400);
});

test("image validation rejects spoofed, malformed, animated, oversized and decompression-bomb inputs", async () => {
  for (const [bytes, type, status] of [
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "image/png", 415],
    [Buffer.from("<html>malicious</html>"), "image/jpeg", 415], [png, "image/jpeg", 415],
    [png.subarray(0, 30), "image/png", 400], [Buffer.alloc(0), "image/png", 413],
    [Buffer.alloc(MAX_IMAGE_BYTES + 1), "image/png", 413],
  ] as const) await assert.rejects(normalizeImage(bytes, type), imageError(status));
  const bomb = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normalizeImage(bomb, "image/png"), imageError(400));
  const frames = Buffer.concat([Buffer.alloc(12, 0), Buffer.alloc(12, 255)]);
  const animated = await sharp(frames, { raw: { width: 2, height: 4, channels: 3, pageHeight: 2 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(animated).metadata()).pages, 2);
  await assert.rejects(normalizeImage(animated, "image/webp"), imageError(400));
});

test("private storage isolates environments, rejects paths, and never overwrites an existing object", async () => {
  assert.equal(imageStorageNamespace(process.env.TEST_DATABASE_URL), "test");
  assert.equal(imageStorageNamespace("postgresql://local:local@127.0.0.1:55432/kiliride_dev"), "development");
  for (const url of ["postgresql://local:local@remote:55433/kiliride_test", "postgresql://local:local@127.0.0.1:55432/kiliride_test", "postgresql://local:local@127.0.0.1:55433/kiliride_dev"]) assert.throws(() => imageStorageNamespace(url));
  for (const key of ["../public/x.webp", "C:\\secret.webp", "/secret.webp", `${randomUUID()}.webp/../x`, "https://attacker.invalid/a.webp"]) {
    await assert.rejects(store.put(key, png)); await assert.rejects(store.get(key)); await assert.rejects(store.remove(key));
  }
  const key = `${randomUUID()}.webp`;
  await store.put(key, png); await assert.rejects(store.put(key, png)); assert.deepEqual(await store.get(key), png);
  await store.remove(key); await store.remove(key); await assert.rejects(store.get(key));
});

test("photo operations enforce current HOST ownership, private DTOs, legacy isolation and throttling", async () => {
  const v = await vehicle(); const photo = await upload(v.id, 0);
  for (const [headers, status] of [[new Headers(), 401], [customer.headers, 403], [other.headers, 404], [admin.headers, 403]] as const) {
    await assert.rejects(service.list(headers, v.id), denied(status));
    await assert.rejects(service.read(headers, v.id, photo.photoId), denied(status));
    await assert.rejects(service.upload(headers, v.id, { expectedRevision: 1, altText: "Test" }, png, "image/png"), denied(status));
    await assert.rejects(service.remove(headers, v.id, photo.photoId, { expectedRevision: 1 }), denied(status));
    await assert.rejects(service.arrange(headers, v.id, { expectedRevision: 1, photoIds: [photo.photoId], coverPhotoId: photo.photoId }), denied(status));
  }
  await db.roleAssignment.create({ data: { userId: other.id, role: "ADMIN", createdAt: new Date(0) } });
  await assert.rejects(service.read(other.headers, v.id, photo.photoId), denied(404));
  const gallery = await service.list(host.headers, v.id);
  assert.deepEqual(Object.keys(gallery.photos[0]).sort(), ["altText", "id", "isCover", "position", "url"].sort());
  assert.equal((await sharp(await service.read(host.headers, v.id, photo.photoId)).metadata()).format, "webp");
  for (const legacy of await db.legacyVehicleImport.findMany()) await assert.rejects(service.upload(host.headers, legacy.vehicleId, { expectedRevision: 0, altText: "Test" }, png, "image/png"), denied(404));
  await db.user.update({ where: { id: host.id }, data: { emailVerified: false } });
  try { await assert.rejects(service.read(host.headers, v.id, photo.photoId), denied(403)); }
  finally { await db.user.update({ where: { id: host.id }, data: { emailVerified: true } }); }
  await db.rateLimit.upsert({ where: { key: `vehicle-image:${host.id}` }, create: { key: `vehicle-image:${host.id}`, count: 60, lastRequest: BigInt(Date.now()) }, update: { count: 60, lastRequest: BigInt(Date.now()) } });
  try { await assert.rejects(upload(v.id, 1), imageError(429)); }
  finally { await db.rateLimit.delete({ where: { key: `vehicle-image:${host.id}` } }); }
});

test("multiple images, cover/order, replacement and deletion preserve transactional invariants", async () => {
  const v = await vehicle(); const a = await upload(v.id, 0); const b = await upload(v.id, 1); const c = await upload(v.id, 2);
  await service.arrange(host.headers, v.id, { expectedRevision: 3, photoIds: [c.photoId, a.photoId, b.photoId], coverPhotoId: b.photoId });
  const gallery = await service.list(host.headers, v.id);
  assert.deepEqual(gallery.photos.map(p => p.id), [c.photoId, a.photoId, b.photoId]); assert.deepEqual(gallery.photos.map(p => p.position), [0, 1, 2]); assert.equal(gallery.photos.filter(p => p.isCover).length, 1);
  for (const input of [{ photoIds: [a.photoId, a.photoId, b.photoId], coverPhotoId: a.photoId }, { photoIds: [a.photoId], coverPhotoId: a.photoId }, { photoIds: [c.photoId, a.photoId, b.photoId], coverPhotoId: randomUUID() }]) await assert.rejects(service.arrange(host.headers, v.id, { expectedRevision: 4, ...input }), imageError(400));
  const old = await db.vehiclePhoto.findUniqueOrThrow({ where: { id: b.photoId } });
  await upload(v.id, 4, b.photoId);
  const replacement = await db.vehiclePhoto.findUniqueOrThrow({ where: { id: b.photoId } });
  assert.notEqual(replacement.objectKey, old.objectKey); assert.equal(replacement.isCover, true); assert.equal(replacement.position, 2);
  await assert.rejects(store.get(old.objectKey!)); assert.equal(await db.vehicleImageObject.count({ where: { key: old.objectKey! } }), 0);
  await service.remove(host.headers, v.id, b.photoId, { expectedRevision: 5 });
  await assert.rejects(service.read(host.headers, v.id, b.photoId), denied(404));
  const remaining = await service.list(host.headers, v.id);
  assert.equal(remaining.photos[0].isCover, true); assert.deepEqual(remaining.photos.map(p => p.position), [0, 1]);
  assert.equal(await db.auditLog.count({ where: { subjectId: v.id, action: { in: ["VEHICLE_PHOTO_ADDED", "VEHICLE_PHOTOS_ARRANGED", "VEHICLE_PHOTO_REPLACED", "VEHICLE_PHOTO_REMOVED"] } } }), 6);
});

test("upload count, cross-vehicle replacement, concurrent writes and submission use one revision lock", async () => {
  const v = await vehicle(); const unrelated = await vehicle(); const foreign = await upload(unrelated.id, 0);
  await assert.rejects(upload(v.id, 0, foreign.photoId), denied(404));
  const concurrent = await Promise.allSettled([upload(v.id, 0), upload(v.id, 0)]);
  assert.equal(concurrent.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(await db.vehiclePhoto.count({ where: { vehicleId: v.id } }), 1);
  for (let revision = 1; revision < 12; revision++) await upload(v.id, revision);
  await assert.rejects(upload(v.id, 12), imageError(400));
  const raceVehicle = await vehicle();
  const races = await Promise.allSettled([upload(raceVehicle.id, 0), submitHostVehicle(host.headers, raceVehicle.id, { expectedRevision: 0 })]);
  assert.equal(races.filter(r => r.status === "fulfilled").length, 1);
  assert.equal((await db.vehicle.findUniqueOrThrow({ where: { id: raceVehicle.id } })).revision, 1);
});

test("pending/approved/suspended image writes fail; rejected edits invalidate review status", async () => {
  const v = await vehicle(); const photo = await upload(v.id, 0);
  await submitHostVehicle(host.headers, v.id, { expectedRevision: 1 });
  const reason = "Synthetic image lifecycle test only";
  for (const [status, revision] of [["PENDING_REVIEW", 2], ["APPROVED", 3], ["SUSPENDED", 4]] as const) {
    if (status !== "PENDING_REVIEW") await transitionVehicleListing(admin.headers, { vehicleId: v.id, expectedRevision: revision - 1, toStatus: status, reason, ...(status === "APPROVED" ? { approval } : {}) });
    await assert.rejects(upload(v.id, revision), FleetError);
    await assert.rejects(service.remove(host.headers, v.id, photo.photoId, { expectedRevision: revision }), FleetError);
    await assert.rejects(service.arrange(host.headers, v.id, { expectedRevision: revision, photoIds: [photo.photoId], coverPhotoId: photo.photoId }), FleetError);
    await assert.rejects(db.vehiclePhoto.update({ where: { id: photo.photoId }, data: { altText: "Bypass attempt" } }));
    await assert.rejects(service.read(other.headers, v.id, photo.photoId), denied(404));
  }
  const rejected = await vehicle(); await submitHostVehicle(host.headers, rejected.id, { expectedRevision: 0 });
  await transitionVehicleListing(admin.headers, { vehicleId: rejected.id, expectedRevision: 1, toStatus: "REJECTED", reason });
  assert.equal((await upload(rejected.id, 2)).status, "DRAFT");
  assert.equal(await db.vehicleReview.count({ where: { vehicleId: rejected.id } }), 1);
});

test("write failures compensate, failed deletes remain journaled, and interrupted operations reconcile safely", async () => {
  const v = await vehicle(); const a = await upload(v.id, 0);
  const before = await db.vehiclePhoto.findUniqueOrThrow({ where: { id: a.photoId } });
  const failing = createPhotoService({ ...store, async put(key, bytes) { await store.put(key, bytes); throw new Error("Synthetic partial-write failure"); } });
  await assert.rejects(failing.upload(host.headers, v.id, { expectedRevision: 1, altText: "Failed replacement", replacePhotoId: a.photoId }, png, "image/png"));
  assert.deepEqual(await db.vehiclePhoto.findUniqueOrThrow({ where: { id: a.photoId } }), before);
  assert.equal((await db.vehicle.findUniqueOrThrow({ where: { id: v.id } })).revision, 1);
  const failedDelete = createPhotoService({ ...store, async remove() { throw new Error("Synthetic storage unavailable"); } });
  await failedDelete.remove(host.headers, v.id, a.photoId, { expectedRevision: 1 });
  assert.equal((await db.vehicleImageObject.findUniqueOrThrow({ where: { key: before.objectKey! } })).state, "DELETE_PENDING");
  await assert.rejects(service.read(host.headers, v.id, a.photoId), denied(404));
  const normalized = await normalizeImage(png, "image/png"); const key = `${randomUUID()}.webp`;
  await db.vehicleImageObject.create({ data: { key, sha256: normalized.sha256, byteSize: normalized.byteSize, width: normalized.width, height: normalized.height, createdAt: new Date(0) } });
  await store.put(key, normalized.bytes); // Simulated crash after write, before DB activation.
  const recentKey = `${randomUUID()}.webp`;
  await db.vehicleImageObject.create({ data: { key: recentKey, sha256: normalized.sha256, byteSize: normalized.byteSize, width: normalized.width, height: normalized.height } });
  const result = await service.reconcile(); assert.ok(result.removed >= 2); assert.equal(result.failed, 0);
  await assert.rejects(store.get(key)); await assert.rejects(store.get(before.objectKey!));
  assert.ok(await db.vehicleImageObject.findUnique({ where: { key: recentKey } }));
  await db.vehicleImageObject.update({ where: { key: recentKey }, data: { createdAt: new Date(0) } });
  await service.reconcile(); assert.equal(await db.vehicleImageObject.count({ where: { key: recentKey } }), 0);
});

test("missing or corrupted objects fail closed without exposing filesystem details", async () => {
  const v = await vehicle(); const photo = await upload(v.id, 0);
  const stored = await db.vehiclePhoto.findUniqueOrThrow({ where: { id: photo.photoId } });
  await store.remove(stored.objectKey!);
  await assert.rejects(service.read(host.headers, v.id, photo.photoId), imageError(404));
  await store.put(stored.objectKey!, Buffer.from("not the normalized image"));
  await assert.rejects(service.read(host.headers, v.id, photo.photoId), imageError(404));
  await service.remove(host.headers, v.id, photo.photoId, { expectedRevision: 1 });
});

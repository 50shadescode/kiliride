import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import sharp from "sharp";
import { getDb } from "../../src/server/db";
import { getAuth } from "../../src/server/auth";
import { imageStorage } from "../../src/server/images/storage";
import { storageConfig } from "../../src/server/images/config";
import { createS3Storage } from "../../src/server/images/s3";
import { createPhotoService } from "../../src/server/images/service";
import { createHostVehicle } from "../../src/server/fleet/host";
import { readVerifiedImage } from "../../src/server/images/read";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { syntheticS3, syntheticStorageEnv } from "../helpers/s3";
assertLocalDatabase(process.env.DATABASE_URL, true);
const db = getDb(), local = imageStorage(), fixture = syntheticS3(local), config = storageConfig(syntheticStorageEnv, "staging")!;
const store = createS3Storage(config, fixture.client);
after(async () => { fixture.client.destroy(); await db.$disconnect(); });
test("signed S3 protocol preserves immutable private bytes across client restarts; fails closed on unsafe bucket, missing/corrupt/oversized objects", async () => {
  const key = `${randomUUID()}.webp`, bytes = Buffer.from("synthetic normalized fixture");
  await store.put(key, bytes); await assert.rejects(store.put(key, bytes));
  assert.deepEqual(await createS3Storage(config, fixture.client).get(key), bytes);
  assert.ok((await store.inventory()).includes(key));
  for (const bad of ["../private.webp", "https://outside.example/image", "key.webp"]) { await assert.rejects(store.get(bad)); await assert.rejects(store.remove(bad)); }
  fixture.state.public = true; await assert.rejects(store.get(key)); fixture.state.public = false;
  fixture.state.versioned = false; await assert.rejects(store.put(`${randomUUID()}.webp`, bytes)); fixture.state.versioned = true;
  fixture.state.oversize = true; await assert.rejects(store.get(key)); fixture.state.oversize = false;
  fixture.state.truncated = true; await assert.rejects(store.get(key)); fixture.state.truncated = false;
  fixture.state.hangGet = true; const started = Date.now();
  await assert.rejects(store.get(key)); assert.ok(Date.now() - started < 9000); fixture.state.hangGet = false;
  await assert.rejects(readVerifiedImage(store, { key, byteSize: bytes.length, sha256: "0".repeat(64) }), /Photograph unavailable/);
  await store.remove(key); await store.remove(key); await assert.rejects(store.get(key));
});
test("remote ambiguity, failed replacement/delete, duplicates and late PUTs retain retryable tombstones without deleting active/unknown objects", async () => {
  const password = randomBytes(24).toString("hex"), email = `s3-${randomUUID()}@kiliride.test`;
  const auth = getAuth(); const { user } = await auth.api.signUpEmail({ body: { email, password, name: "Synthetic S3 actor" } });
  await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  await db.roleAssignment.create({ data: { userId: user.id, role: "HOST", createdAt: new Date(0) } });
  const login = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
  const headers = new Headers({ cookie: login.headers.getSetCookie().map(c => c.split(";")[0]).join("; ") });
  const v = await createHostVehicle(headers, { make: "Synthetic", model: "S3", category: "Test", location: "Test", description: "Synthetic private storage only", registrationNumber: randomUUID(), seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500 });
  const png = await sharp({ create: { width: 16, height: 16, channels: 3, background: "green" } }).png().toBuffer();
  const service = createPhotoService(store);
  const first = await service.upload(headers, v.id, { expectedRevision: 0, altText: "Synthetic" }, png, "image/png");
  await assert.rejects(service.upload(headers, v.id, { expectedRevision: 0, altText: "Duplicate" }, png, "image/png"));
  const original = await db.vehiclePhoto.findUniqueOrThrow({ where: { id: first.photoId } });
  const timedOut = createPhotoService({ ...store, async put(key, bytes) {
    await store.put(key, bytes);
    await new Promise(resolve => setTimeout(resolve, 16000)); // Real DB transaction deadline, after a successful PUT.
  } });
  await assert.rejects(timedOut.upload(headers, v.id, { expectedRevision: 1, replacePhotoId: first.photoId, altText: "Database timeout" }, png, "image/png"));
  assert.deepEqual(await db.vehiclePhoto.findUniqueOrThrow({ where: { id: first.photoId } }), original);
  fixture.state.lostPutResponse = true;
  await assert.rejects(service.upload(headers, v.id, { expectedRevision: 1, replacePhotoId: first.photoId, altText: "Ambiguous" }, png, "image/png"), /^Error: Private photograph storage unavailable\.$/);
  fixture.state.lostPutResponse = false;
  assert.deepEqual(await db.vehiclePhoto.findUniqueOrThrow({ where: { id: first.photoId } }), original);
  const pending = await db.vehicleImageObject.findFirstOrThrow({ where: { state: "PENDING", key: { in: [...fixture.keys] } } });
  const journalKeys = [...fixture.keys];
  await service.reconcile(); assert.equal((await db.vehicleImageObject.findUniqueOrThrow({ where: { key: pending.key } })).state, "PENDING");
  await db.vehicleImageObject.updateMany({ where: { state: "PENDING", key: { in: [...fixture.keys] } }, data: { createdAt: new Date(0) } });
  const unknown = `${randomUUID()}.webp`; await store.put(unknown, Buffer.from("synthetic unknown"));
  await service.reconcile(); assert.equal((await db.vehicleImageObject.findUniqueOrThrow({ where: { key: pending.key } })).state, "DELETE_PENDING");
  await local.put(pending.key, Buffer.from("simulated late provider completion"));
  await service.reconcile(); await assert.rejects(local.get(pending.key)); assert.ok(await store.get(unknown));
  fixture.state.failDelete = true;
  await service.remove(headers, v.id, first.photoId, { expectedRevision: 1 });
  assert.equal((await db.vehicleImageObject.findUniqueOrThrow({ where: { key: original.objectKey! } })).state, "DELETE_PENDING");
  await assert.rejects(service.read(headers, v.id, first.photoId));
  assert.ok((await service.reconcile()).failed > 0);
  fixture.state.failDelete = false; await service.reconcile(); await service.reconcile();
  await assert.rejects(local.get(original.objectKey!));
  await store.remove(unknown); // Explicit cleanup of this known synthetic fixture only.
  // Retire only this run's synthetic tombstones after assertions; production
  // reconciliation never purges tombstones. No existing records are selected.
  await db.vehicleImageObject.deleteMany({ where: { key: { in: journalKeys }, state: "DELETE_PENDING" } });
});

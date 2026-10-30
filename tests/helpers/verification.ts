// Synthetic protocol fixtures ONLY. No approved business policy, real vehicle,
// inspection or legal evidence is represented by these records.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getDb } from "../../src/server/db";
import { imageStorage } from "../../src/server/images/storage";
import { normalizeImage } from "../../src/server/images/normalize";
import { approvalSchema } from "../../src/lib/validation/vehicle-review";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { syntheticMatrix, syntheticAssessment } from "./compliance-fixture";
export function syntheticApproval(policyVersion: string) {
  return approvalSchema.parse({ policyVersion, compliance: syntheticAssessment, checklist: Object.fromEntries(["vehicleIdentity", "ownershipAuthority", "registrationEvidence", "listingAccuracy", "rentalDocumentation"].map(key => [key, { confirmed: true, evidenceReference: `SYNTHETIC PROTOCOL FIXTURE ONLY: ${key}` }])) });
}
export async function syntheticPolicy(adminId: string, requirements = syntheticMatrix) {
  assertLocalDatabase(process.env.DATABASE_URL, true);
  const db = getDb();
  assert.equal((await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`)[0].name, "kiliride_test");
  const policy = await db.vehicleVerificationPolicy.create({ data: { version: `SYNTHETIC-${randomUUID()}`, reference: "TEST ONLY protocol fixture; not an approved KiliRide business policy", approvedById: adminId, approvedAt: new Date(Date.now() - 1000), enabled: true, testOnly: true, requirements } });
  return syntheticApproval(policy.version);
}
// Fixture setup before submission, not an application operation; avoids changing
// revision expectations in existing lifecycle tests. Real uploads are tested separately.
export async function syntheticPhoto(vehicleId: string, uploadedById: string) {
  assertLocalDatabase(process.env.DATABASE_URL, true);
  const bytes = await sharp({ create: { width: 32, height: 24, channels: 3, background: "#059669" } }).png().toBuffer();
  const image = await normalizeImage(bytes, "image/png"); const key = `${randomUUID()}.webp`;
  const db = getDb();
  await db.vehicleImageObject.create({ data: { key, state: "PENDING", byteSize: image.byteSize, sha256: image.sha256, width: image.width, height: image.height } });
  await imageStorage().put(key, image.bytes);
  await db.vehicleImageObject.update({ where: { key }, data: { state: "ACTIVE" } });
  return db.vehiclePhoto.create({ data: { vehicleId, uploadedById, storageKey: key, objectKey: key, contentType: "image/webp", byteSize: image.byteSize, altText: "Synthetic test pixels; not an inventory photograph", isCover: true, position: 0 } });
}

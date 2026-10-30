import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { photoUploadSchema, photoOrderSchema } from "../../src/lib/validation/vehicle-image";
test("image mutations reject forged fields and invalid metadata before persistence", () => {
  const input = { expectedRevision: 0, altText: " Front view " };
  assert.equal(photoUploadSchema.parse(input).altText, "Front view");
  for (const extra of [{ ownerId: randomUUID() }, { storageKey: "../public/a.webp" }, { status: "APPROVED" }, { contentType: "text/html" }, { replacePhotoId: "../x" }, { expectedRevision: -1 }, { altText: " " }, { altText: "x".repeat(201) }]) assert.equal(photoUploadSchema.safeParse({ ...input, ...extra }).success, false);
  assert.equal(photoOrderSchema.safeParse({ expectedRevision: 0, photoIds: [], coverPhotoId: randomUUID() }).success, false);
  assert.equal(photoOrderSchema.safeParse({ expectedRevision: 0, photoIds: Array.from({ length: 13 }, () => randomUUID()), coverPhotoId: randomUUID() }).success, false);
});

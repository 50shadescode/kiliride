import { test } from "node:test";
import assert from "node:assert/strict";
import { completeVehicleDraft, vehicleDraftSchema, vehicleEditSchema, vehicleRevisionSchema } from "../../src/lib/validation/host-vehicle";

const draft = { make: "Synthetic", model: "Fixture", category: "Test", location: "Test location", seats: 5, fuelType: "Petrol", transmission: "Automatic", baseHalfDay: 2500, baseFullDay: 3500, description: "", registrationNumber: "" };

test("drafts may omit review details; submission requires saved description and registration", () => {
  assert.ok(vehicleDraftSchema.safeParse(draft).success);
  assert.throws(() => completeVehicleDraft(draft));
  assert.throws(() => completeVehicleDraft({ ...draft, description: "  ", registrationNumber: "  " }));
  const result = completeVehicleDraft({ ...draft, description: " Accurate description ", registrationNumber: " syn   123 " });
  assert.equal(result.registrationNumber, "SYN 123");
  assert.equal(result.description, "Accurate description");
});

test("host input rejects authority fields, invalid prices/specifications and unsafe revisions", () => {
  for (const field of ["id", "publicId", "ownerId", "ownership", "status", "approvedReviewId", "reviews", "photos", "evidenceReference", "revision"]) {
    assert.equal(vehicleDraftSchema.safeParse({ ...draft, [field]: "forged" }).success, false, field);
    assert.equal(vehicleEditSchema.safeParse({ ...draft, expectedRevision: 0, [field]: "forged" }).success, false, field);
  }
  for (const values of [{ baseHalfDay: 0 }, { baseFullDay: 2.5 }, { seats: -1 }, { seats: 2147483648 }, { make: " " }, { description: "x".repeat(2001) }, { fuelType: "Unknown" }, { transmission: "Unknown" }]) {
    assert.equal(vehicleDraftSchema.safeParse({ ...draft, ...values }).success, false);
  }
  for (const input of [{}, { expectedRevision: -1 }, { expectedRevision: 1.5 }, { expectedRevision: "0" }, { expectedRevision: 0, status: "APPROVED" }]) assert.equal(vehicleRevisionSchema.safeParse(input).success, false);
});

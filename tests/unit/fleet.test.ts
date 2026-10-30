import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyFleetPlan } from "../../src/server/fleet/legacy";
import { assertListingTransition } from "../../src/server/fleet/lifecycle";

test("legacy mapping preserves identifiers, specifications and exact KES prices without trust claims", () => {
  const plan = legacyFleetPlan();
  assert.deepEqual(plan.map(item => [item.vehicle.publicId, item.vehicle.make, item.vehicle.model, item.vehicle.baseHalfDay, item.vehicle.baseFullDay]), [
    ["vitz-142s", "Toyota", "Vitz", 2500, 3500], ["note-131c", "Nissan", "Note e-Power", 2500, 3500],
  ]);
  for (const item of plan) {
    for (const field of ["ownerId", "isVerified", "status", "availableFrom", "image", "plate", "managerPhone"]) assert.equal(Object.hasOwn(item.vehicle, field), false);
    assert.equal(item.sourceSnapshot.reservationFee, 500);
  }
  assert.deepEqual(legacyFleetPlan(), plan);
});

test("listing lifecycle permits review flow and rejects bypasses and host approval", () => {
  assertListingTransition("DRAFT", "PENDING_REVIEW", false);
  assertListingTransition("REJECTED", "DRAFT", false);
  assertListingTransition("PENDING_REVIEW", "APPROVED", true);
  assertListingTransition("APPROVED", "SUSPENDED", true);
  for (const administrator of [false, true]) {
    assert.throws(() => assertListingTransition("DRAFT", "APPROVED", administrator));
    assert.throws(() => assertListingTransition("SUSPENDED", "APPROVED", administrator));
    assert.throws(() => assertListingTransition("APPROVED", "DRAFT", administrator));
  }
  assert.throws(() => assertListingTransition("PENDING_REVIEW", "APPROVED", false));
  assert.throws(() => assertListingTransition("PENDING_REVIEW", "REJECTED", false));
  assert.throws(() => assertListingTransition("APPROVED", "SUSPENDED", false));
});

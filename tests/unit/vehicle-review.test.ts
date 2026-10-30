import { test } from "node:test";
import assert from "node:assert/strict";
import { adminDecisionSchema, adminQueueSchema, approvalSchema, verificationChecks } from "../../src/lib/validation/vehicle-review";
import { syntheticAssessment, syntheticMatrix } from "../helpers/compliance-fixture";
import { assessedCompliance } from "../../src/lib/validation/vehicle-compliance";
import { draftVehicleVerificationPolicy } from "../../src/lib/config/vehicle-verification-draft";
test("review input requires five explicit confirmations and bounded evidence; rejects forged authority", () => {
  const checklist = Object.fromEntries(verificationChecks.map(check => [check.key, { confirmed: true, evidenceReference: "SYNTHETIC schema fixture" }]));
  const approval = { policyVersion: "SYNTHETIC schema fixture", checklist, compliance: syntheticAssessment };
  assert.equal(approvalSchema.safeParse(approval).success, true);
  for (const check of verificationChecks) {
    for (const value of [undefined, { confirmed: false, evidenceReference: "SYNTHETIC" }, { confirmed: true, evidenceReference: " " }, { confirmed: "true", evidenceReference: "SYNTHETIC" }]) assert.equal(approvalSchema.safeParse({ ...approval, checklist: { ...checklist, [check.key]: value } }).success, false);
  }
  const data = { expectedRevision: 1, toStatus: "APPROVED", reason: "Synthetic schema fixture", approval };
  assert.equal(adminDecisionSchema.safeParse(data).success, true);
  for (const field of ["reviewerId", "ownerId", "createdAt", "reviewId", "criteriaVersion"]) assert.equal(adminDecisionSchema.safeParse({ ...data, [field]: "forged" }).success, false);
  assert.equal(adminDecisionSchema.safeParse({ ...data, reason: "short" }).success, false);
  assert.equal(adminDecisionSchema.safeParse({ ...data, expectedRevision: -1 }).success, false);
  assert.equal(adminQueueSchema.safeParse({ page: "0" }).success, false);
  assert.equal(adminQueueSchema.safeParse({ status: "PUBLISHED" }).success, false);
});
test("compliance framework blocks unresolved policy, absent authority and missing mandatory evidence", () => {
  assert.ok(assessedCompliance(syntheticMatrix, syntheticAssessment));
  assert.equal(assessedCompliance(null, syntheticAssessment), null);
  assert.equal(assessedCompliance(syntheticMatrix, { ...syntheticAssessment, checks: {} }), null);
  assert.equal(assessedCompliance(draftVehicleVerificationPolicy.matrix, { ...syntheticAssessment, profileId: "kilifi-unresolved" }), null);
  for (const override of [{ applicability: "PENDING_POLICY_REVIEW" }, { reviewStatus: "PENDING_POLICY_REVIEW" }, { supportingAuthority: "" }, { applicabilityBasis: "" }, { evidenceType: "" }]) {
    const matrix = structuredClone(syntheticMatrix); Object.assign(matrix.profiles[0].requirements[0], override);
    assert.equal(assessedCompliance(matrix, syntheticAssessment), null);
  }
  assert.equal(draftVehicleVerificationPolicy.status, "DRAFT_NOT_APPROVED"); assert.equal(draftVehicleVerificationPolicy.approvedBy, null); assert.equal(draftVehicleVerificationPolicy.effectiveDate, null);
});

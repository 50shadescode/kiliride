import type { ComplianceMatrix } from "../validation/vehicle-compliance";
// Product-provided direction, NOT an authorized or activated policy. Never seeded
// into VehicleVerificationPolicy or used to authorize real vehicle approvals.
export const draftVehicleVerificationPolicy = {
  reference: "KILIRIDE-FLEET-VERIFY-001", version: "0.1-DRAFT", status: "DRAFT_NOT_APPROVED",
  approvedBy: null, effectiveDate: null,
  matrix: { profiles: [{
    id: "kilifi-unresolved", label: "Kilifi requirements awaiting formal determination",
    context: { jurisdiction: "Kilifi County, Kenya", vehicleClassification: "Pending classification determination", intendedUse: "Vehicle rental; exact use pending", rentalArrangement: "PENDING_POLICY_REVIEW", ownershipArrangement: "Pending ownership or authorization review", operatingArrangement: "Pending operating arrangement review" },
    requirements: [
      { id: "insurance", label: "Insurance coverage applicable to the rental arrangement", evidenceType: "Coverage documentation and insurer confirmation as formally determined" },
      { id: "inspection", label: "Applicable inspection obligations", evidenceType: "Inspection evidence if determined mandatory" },
      { id: "licensing-permits", label: "Applicable permits, licensing and rental-operation authorization", evidenceType: "Permit, licence or authorization evidence if determined mandatory" },
    ].map(item => ({ ...item, applicability: "PENDING_POLICY_REVIEW" as const, supportingAuthority: "Pending current regulatory, legal and insurance guidance", applicabilityBasis: "Unresolved; missing guidance is not an exemption", reviewStatus: "PENDING_POLICY_REVIEW" as const })),
  }] } satisfies ComplianceMatrix,
} as const;

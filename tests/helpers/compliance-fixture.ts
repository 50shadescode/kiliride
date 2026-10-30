import { complianceMatrixSchema } from "../../src/lib/validation/vehicle-compliance";
// Protocol data only. These are NOT Kenyan requirements or genuine evidence.
export const syntheticMatrix = complianceMatrixSchema.parse({ profiles: [{
  id: "synthetic-profile", label: "Synthetic protocol profile only",
  context: { jurisdiction: "Synthetic jurisdiction", vehicleClassification: "Synthetic classification", intendedUse: "Synthetic use", rentalArrangement: "SELF_DRIVE", ownershipArrangement: "Synthetic ownership arrangement", operatingArrangement: "Synthetic operating arrangement" },
  requirements: [{ id: "synthetic-evidence", label: "Synthetic mandatory protocol record", applicability: "MANDATORY", supportingAuthority: "SYNTHETIC authority; not a regulation", evidenceType: "SYNTHETIC protocol fixture", applicabilityBasis: "Synthetic test scenario only", reviewStatus: "CONFIRMED" }],
}] });
export const syntheticAssessment = { profileId: "synthetic-profile", contextConfirmed: true as const, checks: { "synthetic-evidence": { confirmed: true as const, evidenceReference: "SYNTHETIC protocol evidence only" } } };

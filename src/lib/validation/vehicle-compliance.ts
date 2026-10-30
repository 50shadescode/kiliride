import { z } from "zod";
const text = z.string().trim().min(3).max(500);
const requirement = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{2,63}$/), label: text,
  applicability: z.enum(["MANDATORY", "NOT_APPLICABLE", "PENDING_POLICY_REVIEW"]),
  supportingAuthority: text, evidenceType: text, applicabilityBasis: text,
  reviewStatus: z.enum(["CONFIRMED", "PENDING_POLICY_REVIEW"]),
}).strict();
export const complianceMatrixSchema = z.object({ profiles: z.array(z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{2,63}$/), label: text,
  context: z.object({ jurisdiction: text, vehicleClassification: text, intendedUse: text, rentalArrangement: z.enum(["SELF_DRIVE", "CHAUFFEUR_DRIVEN", "PENDING_POLICY_REVIEW"]), ownershipArrangement: text, operatingArrangement: text }).strict(),
  requirements: z.array(requirement).min(1).max(30).refine(items => new Set(items.map(item => item.id)).size === items.length, "Duplicate requirement identifiers"),
}).strict()).min(1).max(30).refine(items => new Set(items.map(item => item.id)).size === items.length, "Duplicate profile identifiers") }).strict();
export type ComplianceMatrix = z.infer<typeof complianceMatrixSchema>;
export const complianceAssessmentSchema = z.object({
  profileId: z.string().regex(/^[a-z][a-z0-9-]{2,63}$/), contextConfirmed: z.literal(true),
  checks: z.record(z.string().regex(/^[a-z][a-z0-9-]{2,63}$/), z.object({ confirmed: z.literal(true), evidenceReference: text }).strict()),
}).strict();
export function resolvedProfile(profile: ComplianceMatrix["profiles"][number]) {
  return profile.context.rentalArrangement !== "PENDING_POLICY_REVIEW" && profile.requirements.every(r => r.applicability !== "PENDING_POLICY_REVIEW" && r.reviewStatus === "CONFIRMED");
}
export function assessedCompliance(matrix: unknown, assessment: z.infer<typeof complianceAssessmentSchema>) {
  const parsed = complianceMatrixSchema.safeParse(matrix);
  if (!parsed.success) return null;
  const profile = parsed.data.profiles.find(item => item.id === assessment.profileId);
  if (!profile || !resolvedProfile(profile)) return null;
  const required = profile.requirements.filter(item => item.applicability === "MANDATORY").map(item => item.id);
  if (required.some(id => !assessment.checks[id]?.confirmed) || Object.keys(assessment.checks).some(id => !required.includes(id))) return null;
  return { ...assessment, requirementsSnapshot: profile };
}

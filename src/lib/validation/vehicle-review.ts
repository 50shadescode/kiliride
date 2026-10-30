import { z } from "zod";
import { complianceAssessmentSchema } from "./vehicle-compliance";
export const verificationChecks = [
  { key: "vehicleIdentity", label: "Vehicle identity", guidance: "Compare registration identifier/documentation, chassis or VIN where available, and genuine photographs. Resolve inconsistent vehicle identity." },
  { key: "ownershipAuthority", label: "Ownership or authorization", guidance: "Review registered ownership or documented owner authorization permitting this HOST to offer the vehicle for hire. A listing declaration is not ownership proof." },
  { key: "registrationEvidence", label: "Registration evidence", guidance: "Check documentation and authorized-source verification where available. Uploaded documents alone are not independent proof of authenticity; resolve applicable registration-status requirements." },
  { key: "listingAccuracy", label: "Listing accuracy and photographs", guidance: "Compare genuine photographs, make/model, seats, specifications, operating location and declared prices. Resolve material inconsistencies." },
  { key: "rentalDocumentation", label: "Applicable rental documentation", guidance: "Use the approved compliance profile for insurance and applicable rental, inspection, licensing or authorization documents. Unresolved applicability blocks approval; missing guidance is not an exemption." },
] as const;
const reference = z.string().trim().min(3).max(500);
const check = z.object({ confirmed: z.literal(true), evidenceReference: reference }).strict();
export const verificationChecklistSchema = z.object({ vehicleIdentity: check, ownershipAuthority: check, registrationEvidence: check, listingAccuracy: check, rentalDocumentation: check }).strict();
export const approvalSchema = z.object({ policyVersion: reference, checklist: verificationChecklistSchema, compliance: complianceAssessmentSchema }).strict();
export const adminDecisionSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  toStatus: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "DRAFT"]),
  reason: z.string().trim().min(10).max(1000),
  evidenceReference: reference.optional(),
  approval: approvalSchema.optional(),
}).strict();
export const adminQueueSchema = z.object({
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT", "ALL"]).default("PENDING_REVIEW"),
  query: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
}).strict();

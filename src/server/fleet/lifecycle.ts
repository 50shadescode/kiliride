import type { VehicleListingStatus } from "@/generated/prisma/client";

export class FleetError extends Error {
  constructor(public readonly code: "CONFLICT" | "INVALID_TRANSITION" | "EVIDENCE_REQUIRED") { super(code); }
}

// Role authorization and ownership are checked by the server service separately.
export function assertListingTransition(from: VehicleListingStatus, to: VehicleListingStatus, administrator: boolean) {
  const allowed: Record<VehicleListingStatus, readonly VehicleListingStatus[]> = {
    DRAFT: ["PENDING_REVIEW"],
    PENDING_REVIEW: administrator ? ["APPROVED", "REJECTED"] : [],
    APPROVED: administrator ? ["SUSPENDED"] : [],
    REJECTED: ["DRAFT"],
    SUSPENDED: administrator ? ["DRAFT"] : [],
  };
  if (!allowed[from].includes(to)) throw new FleetError("INVALID_TRANSITION");
}

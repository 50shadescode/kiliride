import "server-only";
import { z } from "zod";
import { getDb } from "../db";
import { legacyFleetPlan } from "./legacy";
import { FleetError } from "./lifecycle";

// Operator-only local import; no web endpoint. A changed source is a conflict,
// never an instruction to overwrite reviewed/edited database records.
export async function importLegacyFleet(operator: string, apply = false) {
  const actor = z.string().trim().min(3).max(100).parse(operator);
  const plan = legacyFleetPlan();
  return getDb().$transaction(async tx => {
    // Serializes concurrent runs across processes; transaction-scoped, no hold expiry.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(203002, 2)`;
    const result: { publicId: string; action: "CREATE_DRAFT" | "UNCHANGED" }[] = [];
    for (const item of plan) {
      const previous = await tx.legacyVehicleImport.findUnique({ where: { sourceId: item.sourceId }, include: { vehicle: { select: { publicId: true } } } });
      if (previous) {
        if (previous.sourceHash !== item.sourceHash || previous.vehicle.publicId !== item.vehicle.publicId) throw new FleetError("CONFLICT");
        result.push({ publicId: item.vehicle.publicId, action: "UNCHANGED" });
        continue;
      }
      if (await tx.vehicle.findUnique({ where: { publicId: item.vehicle.publicId } }) ||
          await tx.vehicleRegistration.findUnique({ where: { registrationNumber: item.registrationNumber } })) throw new FleetError("CONFLICT");
      if (apply) {
        const vehicle = await tx.vehicle.create({ data: { ...item.vehicle,
          ownership: { create: {} }, registration: { create: { registrationNumber: item.registrationNumber } },
          legacyImport: { create: { sourceId: item.sourceId, sourceHash: item.sourceHash, sourceSnapshot: item.sourceSnapshot, operator: actor } },
          events: { create: { toStatus: "DRAFT", reason: `Legacy import by ${actor}; ownership and verification unresolved.` } },
        } });
        await tx.auditLog.create({ data: { subjectId: vehicle.id, action: "LEGACY_VEHICLE_IMPORTED", reason: `Local operator ${actor}; imported as unassigned DRAFT.` } });
      }
      result.push({ publicId: item.vehicle.publicId, action: "CREATE_DRAFT" });
    }
    return { applied: apply, records: result };
  });
}

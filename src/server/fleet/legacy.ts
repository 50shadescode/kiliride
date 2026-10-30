import { createHash } from "node:crypto";
import { z } from "zod";
import { KILIFI_FLEET } from "../../lib/fleet";

// Explicit mapping of known source names; unknown legacy records require review.
const names: Record<string, { name: string; make: string; model: string }> = {
  "vitz-142s": { name: "Toyota Vitz", make: "Toyota", model: "Vitz" },
  "note-131c": { name: "Nissan Note e-Power", make: "Nissan", model: "Note e-Power" },
};
const sourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().min(1),
  plate: z.string().trim().min(1), type: z.string().min(1), location: z.string().min(1),
  transmission: z.enum(["Automatic", "Manual"]), fuelType: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]),
  seats: z.number().int().positive(), baseHalfDay: z.number().int().positive(), baseFullDay: z.number().int().positive(),
  reservationFee: z.number().int().nonnegative(), deliveryAvailable: z.boolean(),
  image: z.string(), isVerified: z.boolean(), status: z.enum(["available", "reserved", "booked", "maintenance"]),
  availableFrom: z.string(), managerPhone: z.string(),
}).strict();

export function legacyFleetPlan() {
  return KILIFI_FLEET.map(input => {
    const source = sourceSchema.parse(input);
    const known = names[source.id];
    if (!known || known.name !== source.name) throw new Error("Unknown legacy identity; review the import mapping.");
    return {
      sourceId: source.id,
      sourceHash: createHash("sha256").update(JSON.stringify(source)).digest("hex"),
      sourceSnapshot: source,
      vehicle: { publicId: source.id, make: known.make, model: known.model, category: source.type,
        seats: source.seats, fuelType: source.fuelType, transmission: source.transmission,
        location: source.location, baseHalfDay: source.baseHalfDay, baseFullDay: source.baseFullDay },
      registrationNumber: source.plate.toUpperCase(),
    };
  });
}

import { z } from "zod";

const text = (max: number) => z.string().trim().min(1, "This field is required.").max(max);
const positiveInteger = z.number().int("Use a whole number.").min(1, "Enter a positive amount.").max(2147483647);
export const vehicleDraftSchema = z.object({
  make: text(80), model: text(100), category: text(80), location: text(200),
  description: z.string().trim().max(2000),
  registrationNumber: z.string().trim().max(40).transform(value => value.toUpperCase().replace(/\s+/g, " ")),
  seats: positiveInteger,
  fuelType: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]),
  transmission: z.enum(["Automatic", "Manual"]),
  baseHalfDay: positiveInteger, baseFullDay: positiveInteger,
}).strict();
export type VehicleDraftValues = z.infer<typeof vehicleDraftSchema>;
export const vehicleRevisionSchema = z.object({ expectedRevision: z.number().int().nonnegative() }).strict();
export const vehicleEditSchema = vehicleDraftSchema.extend({ expectedRevision: z.number().int().nonnegative() }).strict();

export function completeVehicleDraft(input: unknown) {
  return vehicleDraftSchema.superRefine((value, context) => {
    if (!value.description) context.addIssue({ code: "custom", path: ["description"], message: "Add a description before submitting for review." });
    if (!value.registrationNumber) context.addIssue({ code: "custom", path: ["registrationNumber"], message: "Add the registration before submitting for review." });
  }).parse(input);
}

export function draftValues(vehicle: {
  make: string; model: string; category: string; location: string; description: string | null;
  seats: number; fuelType: string; transmission: string; baseHalfDay: number; baseFullDay: number;
}, registrationNumber = "") {
  return { make: vehicle.make, model: vehicle.model, category: vehicle.category, location: vehicle.location,
    description: vehicle.description ?? "", registrationNumber, seats: vehicle.seats, fuelType: vehicle.fuelType,
    transmission: vehicle.transmission, baseHalfDay: vehicle.baseHalfDay, baseFullDay: vehicle.baseFullDay };
}

export const listingStatusLabels = {
  DRAFT: "Draft", PENDING_REVIEW: "Pending review", APPROVED: "Approved", REJECTED: "Changes requested", SUSPENDED: "Suspended",
} as const;

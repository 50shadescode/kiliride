import type { Vehicle } from "@/lib/types/vehicle";

/**
 * Calculates number of rental days
 * Uses UTC boundaries so timezone and daylight-saving changes do not affect date-only inputs.
 */
export function calculateRentalDays(
  pickupDate: string,
  returnDate: string
): number {
  if (!pickupDate || !returnDate) {
    return 0;
  }

  const start = new Date(`${pickupDate}T00:00:00Z`);
  const end = new Date(`${returnDate}T00:00:00Z`);

  const difference = end.getTime() - start.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  return days > 0 ? days : 0;
}

/**
 * Calculates estimated rental fee using aligned schema parameters
 */
export function calculateEstimatedRentalFee(
  vehicle: Vehicle,
  rentalDays: number
) {
  if (rentalDays <= 0) {
    return 0;
  }

  return rentalDays * vehicle.baseFullDay;
}

/**
 * Calculates estimated booking total
 */
export function calculateEstimatedTotal(
  rentalFee: number,
  reservationFee: number
) {
  return rentalFee + reservationFee;
}

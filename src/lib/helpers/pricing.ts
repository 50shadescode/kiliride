import { Vehicle } from "@/lib/types/vehicle";

/**
 * Calculates number of rental days
 */
export function calculateRentalDays(
  pickupDate: string,
  returnDate: string
) {
  if (!pickupDate || !returnDate) {
    return 0;
  }

  const start = new Date(pickupDate);
  const end = new Date(returnDate);

  const difference =
    end.getTime() - start.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  return days > 0 ? days : 0;
}

/**
 * Calculates estimated rental fee
 */
export function calculateEstimatedRentalFee(
  vehicle: Vehicle,
  rentalDays: number
) {
  if (rentalDays <= 0) {
    return 0;
  }

  return (
    rentalDays * vehicle.fullDayRate
  );
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
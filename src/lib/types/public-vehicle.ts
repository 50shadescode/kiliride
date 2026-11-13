// Explicit public contract; never serialize a Prisma record or legacy source.
export interface PublicVehicle {
  id: string;
  make: string;
  model: string;
  name: string;
  type: string;
  description: string;
  location: string;
  transmission: string;
  fuelType: string;
  seats: number;
  baseHalfDay: number;
  baseFullDay: number;
  reservationFee: number | null;
  managerPhone: string;
  reviewStatus: "legacy" | "approved";
  photos: { url: string; alt: string }[];
}

export type VehicleStatus = "available" | "reserved" | "booked" | "maintenance";

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  location: string;
  transmission: "Automatic" | "Manual";
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  seats: number;

  baseHalfDay: number;
  baseFullDay: number;
  reservationFee: number;
  deliveryAvailable: boolean;

  image: string;
  isVerified: boolean;
  status: VehicleStatus;
  availableFrom: string;
  managerPhone: string;
}

export const KILIFI_FLEET: Vehicle[] = [
  {
    id: "vitz-142s",
    name: "Toyota Vitz",
    plate: "KDV 142S",
    type: "Hatchback",
    location: "Kilifi - Bofa Road",
    transmission: "Automatic",
    fuelType: "Petrol",
    seats: 5,
    baseHalfDay: 2500,
    baseFullDay: 3500,
    reservationFee: 500,
    deliveryAvailable: true,
    image: "/cars/vitz.jpg",
    isVerified: true,
    status: "available",
    availableFrom: "Available Today",
    managerPhone: "254726063889",
  },
  {
    id: "note-131c",
    name: "Nissan Note e-Power",
    plate: "KDU 131C",
    type: "Hybrid Hatchback",
    location: "Kilifi - Bofa Road",
    transmission: "Automatic",
    fuelType: "Hybrid",
    seats: 5,
    baseHalfDay: 2500,
    baseFullDay: 3500,
    reservationFee: 500,
    deliveryAvailable: true,
    image: "/cars/note.jpg",
    isVerified: true,
    status: "reserved",
    availableFrom: "Reserved until 4:00 PM",
    managerPhone: "254726063889",
  },
];
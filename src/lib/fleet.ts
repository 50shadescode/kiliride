export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  baseHalfDay: number; // KES 2,500
  baseFullDay: number; // KES 3,500
  image: string;
  isVerified: boolean;
}

export const KILIFI_FLEET: Vehicle[] = [
  {
    id: "vitz-142s",
    name: "Toyota Vitz",
    plate: "KDV 142S",
    type: "Hatchback",
    baseHalfDay: 2500,
    baseFullDay: 3500,
    image: "/cars/vitz.jpg",
    isVerified: true,
  },
  {
    id: "note-131c",
    name: "Nissan Note e-Power",
    plate: "KDU 131C",
    type: "Hybrid Hatchback",
    baseHalfDay: 2500,
    baseFullDay: 3500,
    image: "/cars/note.jpg",
    isVerified: true,
  }
];
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PublicVehicle } from "@/lib/types/public-vehicle";
import { MapPin, Fuel, Users, MessageCircle } from "lucide-react";
import { PublicPhoto } from "./PublicPhoto";
export function CarCard({ vehicle }: { vehicle: PublicVehicle }) {
  const message = `Hello KiliRide, I want to check availability for ${vehicle.name} (${vehicle.id}).`;
  return <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-xl">
    {vehicle.photos[0] && <PublicPhoto {...vehicle.photos[0]} />}
    <CardContent className="p-5"><Badge className="bg-slate-100 text-slate-700">{vehicle.reviewStatus === "approved" ? "Listing approved" : "Legacy listing · review pending"}</Badge>
      <h3 className="mt-3 break-words text-xl font-bold text-slate-900">{vehicle.name}</h3><p className="mt-1 break-words text-sm text-slate-500">{vehicle.type}</p>
      <div className="mt-4 grid gap-3 text-sm text-slate-600"><p className="flex items-center gap-2"><MapPin aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />{vehicle.location}</p><p className="flex items-center gap-2"><Fuel aria-hidden="true" className="size-4 text-emerald-600" />{vehicle.fuelType} · {vehicle.transmission}</p><p className="flex items-center gap-2"><Users aria-hidden="true" className="size-4 text-emerald-600" />{vehicle.seats} seats</p><p>Enquire about availability</p></div>
      <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4"><p className="flex justify-between gap-3"><span>Half Day</span><strong>KES {vehicle.baseHalfDay.toLocaleString("en-KE")}</strong></p><p className="flex justify-between gap-3"><span>Full Day</span><strong className="text-emerald-700">KES {vehicle.baseFullDay.toLocaleString("en-KE")}</strong></p>{vehicle.reservationFee !== null && <p className="flex justify-between gap-3 border-t border-slate-200 pt-2"><span>Reservation Fee</span><strong>KES {vehicle.reservationFee.toLocaleString("en-KE")}</strong></p>}</div>
    </CardContent><CardFooter className="grid gap-3 p-5 pt-0"><Link prefetch={false} href={`/vehicles/${vehicle.id}`} className="rounded-xl bg-slate-900 p-3 text-center font-semibold text-white hover:bg-emerald-700">View Details</Link><a href={`https://wa.me/${vehicle.managerPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 p-3 font-semibold text-emerald-700"><MessageCircle aria-hidden="true" className="size-4" />WhatsApp Manager</a></CardFooter>
  </Card>;
}

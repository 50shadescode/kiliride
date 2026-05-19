import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/lib/fleet";
import {
  Car,
  ShieldCheck,
  MapPin,
  Fuel,
  Users,
  MessageCircle,
  Clock,
} from "lucide-react";

function getStatusBadge(status: Vehicle["status"]) {
  if (status === "available") {
    return "bg-emerald-600 hover:bg-emerald-700 text-white";
  }

  if (status === "reserved") {
    return "bg-amber-500 hover:bg-amber-600 text-white";
  }

  if (status === "booked") {
    return "bg-slate-900 hover:bg-slate-900 text-white";
  }

  return "bg-red-500 hover:bg-red-600 text-white";
}

function getWhatsappUrl(vehicle: Vehicle) {
  const message = `Hello KiliRide, I want to check availability for ${vehicle.name} ${vehicle.plate}.`;
  return `https://wa.me/${vehicle.managerPhone}?text=${encodeURIComponent(message)}`;
}

export function CarCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
      <div className="aspect-[16/9] bg-slate-100 relative flex items-center justify-center">
        <Car className="w-12 h-12 text-slate-300" />

        <div className="absolute top-3 left-3">
          <Badge className={getStatusBadge(vehicle.status)}>
            {vehicle.status}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          {vehicle.isVerified && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 flex gap-1 items-center border-none">
              <ShieldCheck className="w-3 h-3" /> Verified
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {vehicle.name}
            </h3>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              {vehicle.plate}
            </p>
          </div>

          <Badge variant="outline" className="text-slate-500 border-slate-200">
            {vehicle.type}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{vehicle.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-emerald-600" />
            <span>{vehicle.fuelType}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{vehicle.seats} seats</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{vehicle.availableFrom}</span>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Half Day</span>
            <span className="font-bold text-slate-900">
              KES {vehicle.baseHalfDay.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Full Day</span>
            <span className="font-bold text-emerald-600">
              KES {vehicle.baseFullDay.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <span className="text-sm text-slate-500">Reservation Fee</span>
            <span className="font-bold text-slate-900">
              KES {vehicle.reservationFee.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 grid gap-3">
        <Link href={`/vehicles/${vehicle.id}`}>
          <Button className="w-full bg-slate-900 hover:bg-emerald-700 text-white rounded-xl py-6 transition-colors font-semibold">
            View Details
          </Button>
        </Link>

        <a href={getWhatsappUrl(vehicle)} target="_blank" rel="noreferrer">
          <Button
            variant="outline"
            className="w-full rounded-xl py-6 font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp Manager
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
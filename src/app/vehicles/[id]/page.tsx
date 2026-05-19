import { notFound } from "next/navigation";
import { KILIFI_FLEET } from "@/lib/fleet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  ShieldCheck,
  MapPin,
  Fuel,
  Users,
  Clock,
  MessageCircle,
  CalendarDays,
} from "lucide-react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getWhatsappUrl(vehicle: (typeof KILIFI_FLEET)[number]) {
  const message = `Hello KiliRide, I want to reserve ${vehicle.name} ${vehicle.plate}.`;
  return `https://wa.me/${vehicle.managerPhone}?text=${encodeURIComponent(message)}`;
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;

  const vehicle = KILIFI_FLEET.find((item) => item.id === id);

  if (!vehicle) {
    notFound();
  }

  const isAvailable = vehicle.status === "available";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="aspect-[16/10] rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center relative overflow-hidden">
            <Car className="w-24 h-24 text-slate-300" />

            {vehicle.isVerified && (
              <Badge className="absolute top-5 right-5 bg-emerald-600">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="aspect-[4/3] rounded-2xl bg-white border border-slate-100 flex items-center justify-center"
              >
                <Car className="w-8 h-8 text-slate-300" />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 h-fit">
          <div className="flex items-start justify-between gap-6">
            <div>
              <Badge className="mb-4 bg-emerald-600">
                {vehicle.status}
              </Badge>

              <h1 className="text-4xl font-black text-slate-900">
                {vehicle.name}
              </h1>

              <p className="mt-2 text-slate-500 font-medium uppercase tracking-wider">
                {vehicle.plate}
              </p>
            </div>

            <Badge variant="outline" className="text-slate-600">
              {vehicle.type}
            </Badge>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4 flex gap-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="font-bold text-slate-900">{vehicle.location}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 flex gap-3">
              <Fuel className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Fuel</p>
                <p className="font-bold text-slate-900">{vehicle.fuelType}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 flex gap-3">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Seats</p>
                <p className="font-bold text-slate-900">{vehicle.seats} seats</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 flex gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Availability</p>
                <p className="font-bold text-slate-900">{vehicle.availableFrom}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-slate-50 p-6 space-y-4">
            <h2 className="text-xl font-black text-slate-900">
              Rental Pricing
            </h2>

            <div className="flex justify-between">
              <span className="text-slate-500">Half Day</span>
              <span className="font-black text-slate-900">
                KES {vehicle.baseHalfDay.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Full Day</span>
              <span className="font-black text-emerald-600">
                KES {vehicle.baseFullDay.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-4">
              <span className="text-slate-500">Reservation Fee</span>
              <span className="font-black text-slate-900">
                KES {vehicle.reservationFee.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            <Button
              disabled={!isAvailable}
              className="rounded-2xl py-7 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-base"
            >
              <CalendarDays className="w-5 h-5 mr-2" />
              {isAvailable ? "Start Reservation" : "Currently Unavailable"}
            </Button>

            <a href={getWhatsappUrl(vehicle)} target="_blank" rel="noreferrer">
              <Button
                variant="outline"
                className="w-full rounded-2xl py-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-base"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp Manager
              </Button>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
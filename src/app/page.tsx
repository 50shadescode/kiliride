import { KILIFI_FLEET } from "@/lib/fleet";
import { CarCard } from "@/components/cars/CarCard";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Car } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="py-24 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-left">
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Your Journey, <br />
              <span className="text-emerald-600">Our Wheels</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
              Explore Kilifi with confidence. Premium car rental for your
              coastal adventure and beyond.
            </p>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-10 py-8 text-xl font-bold shadow-lg shadow-emerald-200/50 transition-all hover:scale-105"
            >
              Browse Vehicles
            </Button>
          </div>

          {/* 2. SEARCH WIDGET */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Book a Ride
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="text-emerald-600 w-6 h-6" />
                <span className="font-bold text-slate-900 text-lg">
                  Kilifi - Bofa Road
                </span>
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <Calendar className="text-emerald-600 w-6 h-6" />
                <span className="font-bold text-slate-900 text-lg">
                  Flexible Dates
                </span>
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <Car className="text-emerald-600 w-6 h-6" />
                <span className="font-bold text-slate-900 text-lg">
                  All Vehicle Types
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAR GRID SECTION */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-black text-slate-900">
                Available in Kilifi
              </h2>
              <p className="text-slate-500 text-lg mt-2 font-medium">
                Verified vehicles, ready for pickup.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {KILIFI_FLEET.map((vehicle) => (
              <CarCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
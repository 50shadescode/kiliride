import { CarCard } from "@/components/cars/CarCard";
import { KILIFI_FLEET } from "@/lib/fleet";

export default function VehiclesPage() {
  return (
    <section className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900">Premium Car Hire</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Browse our verified fleet in Kilifi. View vehicle details and contact
            our manager on WhatsApp to confirm availability and your rental.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {KILIFI_FLEET.map((vehicle) => (
            <CarCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}

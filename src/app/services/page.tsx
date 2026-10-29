import Link from "next/link";
import { CarFront } from "lucide-react";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900">Premium Car Hire</h1>
          <p className="text-slate-500 mt-2">Verified car rentals for Kilifi Town and environs.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-xl mx-auto">
          <Link
            href="/services/vehicles"
            className="block bg-white rounded-2xl p-8 shadow-sm border border-slate-100 transition-colors hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <CarFront className="h-8 w-8 text-emerald-600 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Premium Car Hire</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Browse our verified fleet for self-drive car hire. Select your rental dates,
              view your estimated quote, and contact our manager on WhatsApp to confirm your booking.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

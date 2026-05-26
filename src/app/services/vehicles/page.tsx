import React from 'react';
import Link from 'next/link';

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* Header Block Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">Platform Provisions</h1>
          <p className="text-gray-500 mt-2">Tailored logistics ecosystems for Kilifi Town and environs.</p>
        </div>

        {/* Fully Interactive Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Premium Car Hire */}
          <Link 
            href="/"
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:border-gray-300 transition-all cursor-pointer block group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                Premium Car Hire
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Access our verified fleet grid for self-drive coastal adventures. Benefit from our client-first flexible model featuring 100% payments settled securely at vehicle pickup—no reservation credit holds required.
              </p>
              <div className="pt-4 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Open Rental Hub &rarr;
              </div>
            </div>
          </Link>

          {/* Card 2: SGR Commuter Hub */}
          <Link 
            href="/services/sgr"
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:border-gray-300 transition-all cursor-pointer block group focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                SGR Commuter Hub
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Skip the terminal transport negotiation friction. Secure a pre-allocated seat in a shared transit shuttle or private van directly to the Mombasa (Miritini) SGR Terminus for a predictable, flat fare of KES 1,000 with an affordable 10% booking commission.
              </p>
              <div className="pt-4 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Open Aggregator Hub &rarr;
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}

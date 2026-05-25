import React from 'react';

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">Platform Provisions</h1>
          <p className="text-gray-500 mt-2">Tailored logistics ecosystems for Kilifi Town and environs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🚗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Car Hire</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Access our verified fleet grid for self-drive coastal adventures. Benefit from our client-first flexible model featuring 100% payments settled securely at vehicle pickup—no reservation credit holds required.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🚄</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">SGR Commuter Hub</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Skip the terminal transport negotiation friction. Secure a pre-allocated seat in a shared transit shuttle or private van directly to the Mombasa (Miritini) SGR Terminus for a predictable, flat fare of KES 1,000 with an affordable 10% booking commission.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
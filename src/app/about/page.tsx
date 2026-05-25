import React from 'react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-emerald-600 font-bold text-sm tracking-wider uppercase">Our Story</span>
        <h1 className="text-4xl font-extrabold text-gray-900 mt-2 mb-6">Revolutionizing Coastal Mobility</h1>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-left space-y-6 text-gray-600 leading-relaxed">
          <p>
            Developed in Mombasa and operating across Kilifi County, <strong>KiliRide</strong> is a premier transit aggregator designed by <strong>Suby Tech</strong> to bridge the gap between premium car rentals and accessible regional commuting.
          </p>
          <p>
            We observed a massive bottleneck affecting both vacationers exploring Bofa Road and daily commuters heading toward regional transport stations: fragmented networks, unpredictable pricing matrices, and a distinct lack of digital reliability.
          </p>
          <p>
            By designing a unified marketplace architecture, we empower local vehicle hosts to unlock maximum utility from their assets while providing travelers with a safe, streamlined path to secure point-to-point transit.
          </p>
        </div>
      </div>
    </main>
  );
}
import React from 'react';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">Host Subscription Tiers</h1>
          <p className="text-gray-500 mt-2">Maximize your fleet utilization with our B2B specialized bundled offers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-gray-900">Single Operator</h4>
              <p className="text-3xl font-black text-emerald-600 my-4">KES 2,000<span className="text-xs text-gray-400 font-normal">/mo</span></p>
              <p className="text-xs text-gray-500 leading-relaxed">Perfect for individual vehicle owners looking to capture weekend leisure car hire rushes.</p>
            </div>
          </div>

          {/* Tier 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-emerald-500 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Popular B2B</div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Dual Fleet Bundle</h4>
              <p className="text-3xl font-black text-emerald-600 my-4">KES 3,000<span className="text-xs text-gray-400 font-normal">/mo</span></p>
              <p className="text-xs text-gray-500 leading-relaxed">Register up to 2 active vehicles under a unified host tracking ledger (Only KES 1,500 per car).</p>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-bold text-gray-900">Triple Fleet Scale</h4>
              <p className="text-3xl font-black text-emerald-600 my-4">KES 4,000<span className="text-xs text-gray-400 font-normal">/mo</span></p>
              <p className="text-xs text-gray-500 leading-relaxed">Our absolute bare-minimum price entry for agencies looking to deploy 3 operational cars simultaneously.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import React from 'react';
import { SgrAggregator } from '@/components/bookings/SgrAggregator';

export default function SgrBookingPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Core SGR Aggregator Booking UI Module */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <SgrAggregator />
        </div>

      </div>
    </div>
  );
}

import React from 'react';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect with KiliRide</h1>
        <p className="text-sm text-gray-500 mb-6">Suby Tech Hub Terminal support line.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
            <input type="text" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Message Detail</label>
            <textarea rows={4} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"></textarea>
          </div>
          <button type="button" className="w-full bg-gray-900 hover:bg-black text-white text-sm font-semibold py-3 rounded-xl transition-colors">
            Dispatch Inquiry
          </button>
        </form>
      </div>
    </main>
  );
}
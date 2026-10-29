import React from 'react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-emerald-600 font-bold text-sm tracking-wider uppercase">Our Story</span>
        <h1 className="text-4xl font-extrabold text-gray-900 mt-2 mb-6">Revolutionizing Coastal Mobility</h1>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-left space-y-6 text-gray-600 leading-relaxed">
          <p>
            Developed in Mombasa and operating across Kilifi County, <strong>KiliRide</strong> is a premium car hire marketplace designed by <strong>Suby Tech</strong> to connect local car owners with customers.
          </p>
          <p>
            Customers exploring Bofa Road and the wider coast need reliable vehicles and clear rental pricing. Our verified fleet makes it easier to compare cars and plan a rental.
          </p>
          <p>
            We help car owners reach customers through a managed marketplace. Customers browse vehicles and contact Patrick, our admin, on WhatsApp to confirm availability and finalize their booking.
          </p>
        </div>
      </div>
    </main>
  );
}

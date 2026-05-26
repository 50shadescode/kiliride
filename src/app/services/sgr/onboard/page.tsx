'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function SgrOperatorOnboard() {
  // State management for structured form inputs
  const [operatorName, setOperatorName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  
  // Enforcing link to the three official SGR departures
  const [trainTarget, setTrainTarget] = useState('morning'); 
  const [routeNode, setRouteNode] = useState('kilifi-miritini');
  
  // Persistent client-side standby fleet tracker
  const [standbyFleet, setStandbyFleet] = useState<any[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Hydrate registry array from local storage on frame boot
  useEffect(() => {
    const localData = localStorage.getItem('kiliride_standby_fleet');
    if (localData) {
      setStandbyFleet(JSON.parse(localData));
    }
  }, []);

  const handleVehicleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedPlate = plateNumber.toUpperCase().trim();
    
    // Hardcoded Commercial Standard: Always compile a 14-seat data map layout
    const totalCapacity = 14;
    const modelLabel = '14-Seater Toyota HiAce Standard';
    
    // Set dynamic timing constraints mapping exactly to your business logic
    let departureTime = '06:00 AM';
    let linkedTrain = '08:00 AM Morning Inter-County Train';
    let cutoffHour = 2; // 02:00 AM Same-day cutoff (6 hours prior)

    if (trainTarget === 'afternoon') {
      departureTime = '01:00 PM';
      linkedTrain = '03:00 PM Afternoon Express Train';
      cutoffHour = 9; // 09:00 AM Same-day cutoff (6 hours prior)
    } else if (trainTarget === 'night') {
      departureTime = '08:00 PM';
      linkedTrain = '10:00 PM Night Express Train';
      cutoffHour = 16; // 04:00 PM Same-day cutoff (6 hours prior)
    }

    // Systematically map the 14-seat manifest nodes with random pre-booking for realism
    const seatManifest = Array.from({ length: totalCapacity }, (_, i) => ({
      id: i + 1,
      label: `Seat ${i + 1}`,
      isBooked: Math.random() > 0.75 // 25% random occupation simulation layout
    }));

    const newVehicle = {
      id: `vh-${Math.random().toString(36).substr(2, 9)}`,
      operatorName: operatorName,
      plateNumber: formattedPlate,
      vehicleType: modelLabel,
      trainWindow: trainTarget,
      departureTime: departureTime,
      cutoffHour: cutoffHour,
      linkedTrain: linkedTrain,
      pickupLocation: routeNode === 'kilifi-miritini' ? 'Kilifi Complex Stage' : 'Malindi Town Stage',
      fare: 1000,
      totalSeats: totalCapacity,
      seatManifest: seatManifest,
      status: 'Standby / Active'
    };

    // Update state and commit changes directly to browser memory disk vault
    const updatedFleet = [...standbyFleet, newVehicle];
    setStandbyFleet(updatedFleet);
    localStorage.setItem('kiliride_standby_fleet', JSON.stringify(updatedFleet));
    
    // Clear the entry fields and fire execution notification banners
    setPlateNumber('');
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <main className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Portal Header */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Operator Hub</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register 14-seater assets into the KiliRide matrix synced with official 6-hour prior booking rules.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Registration Form Frame */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Fleet Registration Form
            </h2>

            <form onSubmit={handleVehicleRegistration} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Operator / Company Name
                </label>
                <input 
                  type="text" required placeholder="e.g. Coast Express Shuttles"
                  value={operatorName} onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Vehicle Number Plate
                  </label>
                  <input 
                    type="text" required placeholder="e.g. KCE 104X"
                    value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Enforced Vehicle Capacity
                  </label>
                  <div className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center h-[42px] select-none">
                    14-Seater Toyota HiAce Standard
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Target SGR Connecting Train
                  </label>
                  <select
                    value={trainTarget} onChange={(e) => setTrainTarget(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors h-[42px]"
                  >
                    <option value="morning">08:00 AM Inter-County Train (Leaves Kilifi 06:00 AM)</option>
                    <option value="afternoon">03:00 PM Afternoon Express (Leaves Kilifi 01:00 PM)</option>
                    <option value="night">10:00 PM Night Express (Leaves Kilifi 08:00 PM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Reporting Node Station
                  </label>
                  <select
                    value={routeNode} onChange={(e) => setRouteNode(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors h-[42px]"
                  >
                    <option value="kilifi-miritini">Kilifi Complex Stage ➔ Miritini</option>
                    <option value="malindi-miritini">Malindi Town Stage ➔ Miritini</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Server className="w-4 h-4" />
                Commit 14-Seater to Active Standby
              </button>

              {isSubmitted && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Asset initialized. 14-seat manifest compiled under strict 6-hour prior booking gates.
                </div>
              )}
            </form>
          </div>

          {/* Right Column Monitor Panel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">Standby Pipeline Monitor</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time validation of loaded vehicles</p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {standbyFleet.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
                  No 14-seater assets registered yet. Commit data via control panel to load vectors.
                </div>
              ) : (
                standbyFleet.map((vehicle) => (
                  <div key={vehicle.id} className="border border-gray-100 bg-gray-50/50 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-900">
                        {vehicle.plateNumber}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {vehicle.status}
                      </span>
                    </div>
                    <div className="font-bold text-gray-800">{vehicle.operatorName}</div>
                    <div className="text-gray-500 font-medium font-mono text-[11px]">{vehicle.linkedTrain}</div>
                    <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-100 flex justify-between">
                      <span>Leaves: {vehicle.departureTime}</span>
                      <span>Cap: {vehicle.totalSeats} seats</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
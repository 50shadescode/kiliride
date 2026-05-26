'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Users, ShieldCheck, Ticket, Armchair, Calendar } from 'lucide-react';

export function SgrAggregator() {
  const [shuttles, setShuttles] = useState<any[]>([]);
  const [selectedShuttle, setSelectedShuttle] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [bookingDate, setBookingDate] = useState('');
  const [currentHour, setCurrentHour] = useState(0);
  const [isToday, setIsToday] = useState(false);
  const [minDateString, setMinDateString] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentHour(now.getHours());
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    setMinDateString(todayString);
    setBookingDate(todayString);
    setIsToday(true);

    try {
      const localData = localStorage.getItem('kiliride_standby_fleet');
      if (localData && JSON.parse(localData).length > 0) {
        setShuttles(JSON.parse(localData));
      } else {
        // Fallback default array utilizing exactly 13 passenger seats (IDs 2 through 14)
        const officialSchedule = [
          {
            id: 'sch-morning',
            operatorName: "Coast Express Shuttles",
            vehicleType: "14-Seater Toyota HiAce Standard",
            plateNumber: "KCE 104X",
            departureTime: "06:00 AM",
            cutoffHour: 2, 
            linkedTrain: "08:00 AM Morning Inter-County Train",
            fare: 1000,
            totalSeats: 13, // 13 passenger seats open for booking
            seatManifest: Array.from({ length: 13 }, (_, i) => ({ id: i + 2, isBooked: i === 1 || i === 4 }))
          },
          {
            id: 'sch-afternoon',
            operatorName: "Zuri Transit Fleet",
            vehicleType: "14-Seater Toyota HiAce Standard",
            plateNumber: "KDC 789Y",
            departureTime: "01:00 PM",
            cutoffHour: 9, 
            linkedTrain: "03:00 PM Afternoon Express Train",
            fare: 1000,
            totalSeats: 13,
            seatManifest: Array.from({ length: 13 }, (_, i) => ({ id: i + 2, isBooked: i === 3 || i === 9 }))
          }
        ];
        setShuttles(officialSchedule);
        localStorage.setItem('kiliride_standby_fleet', JSON.stringify(officialSchedule));
      }
    } catch (error) {
      console.error("Error setting timetable matrix:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    setBookingDate(selected);
    setSelectedShuttle(null);
    setSelectedSeat(null);
    setIsToday(selected === minDateString);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent, plate: string) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit Safaricom mobile number.");
      return;
    }
    alert(`Manifest Locked!\n\nDate: ${bookingDate}\nVehicle: ${plate}\nPassenger Seat: ${selectedSeat}\nM-Pesa Target: ${phoneNumber}`);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm font-semibold text-slate-400">Verifying timeline gates...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Date Picker Bar */}
      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Select Operational Travel Date
          </h3>
          <p className="text-xs text-slate-500">
            Same-day bookings strictly shut down exactly <strong className="text-slate-700">6 hours prior</strong> to train departures.
          </p>
        </div>
        <input 
          type="date" min={minDateString} value={bookingDate} onChange={handleDateChange}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm h-[44px]"
        />
      </div>

      <div className="grid gap-4">
        {shuttles.map((shuttle) => {
          const isExpired = isToday && currentHour >= shuttle.cutoffHour;
          const activeManifest = shuttle.seatManifest || [];
          const openSeatsCount = activeManifest.filter((s: any) => !s.isBooked).length;

          return (
            <div 
              key={shuttle.id} 
              className={`bg-white border rounded-2xl p-5 transition-all duration-200 shadow-sm relative overflow-hidden ${
                isExpired ? 'bg-slate-50/50 opacity-60 border-slate-200 pointer-events-none' : selectedShuttle === shuttle.id ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {isExpired && (
                <div className="absolute top-3 right-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider select-none z-10">
                  Booking Closed (6Hr Rule)
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-xs font-mono font-black px-2.5 py-1 rounded-md">
                      SHUTTLE LEAVES: {shuttle.departureTime}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-bold">{shuttle.plateNumber}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{shuttle.operatorName}</h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Connects directly to: <span className="text-emerald-600 font-bold">{shuttle.linkedTrain}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6 md:justify-center">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Standby Seats</span>
                    <div className="flex items-center gap-1 mt-1 text-slate-700 font-semibold text-sm">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>{isExpired ? '0' : openSeatsCount} / 13 open</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Flat Fare</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">KES {shuttle.fare.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button 
                    disabled={isExpired}
                    onClick={() => {
                      if (selectedShuttle === shuttle.id) {
                        setSelectedShuttle(null);
                        setSelectedSeat(null);
                        setPhoneNumber('');
                      } else {
                        setSelectedShuttle(shuttle.id);
                        setSelectedSeat(null);
                      }
                    }}
                    className={`w-full md:w-auto font-bold px-5 py-2.5 rounded-xl text-sm transition-colors ${
                      selectedShuttle === shuttle.id ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 hover:bg-black text-white'
                    }`}
                  >
                    {selectedShuttle === shuttle.id ? 'Cancel' : 'Select Seat'}
                  </button>
                </div>
              </div>

              {/* DYNAMIC 13 PASSENGER SEAT SELECTION DRAWER */}
              {!isExpired && selectedShuttle === shuttle.id && (
                <div className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <div className="max-w-md mx-auto space-y-4 mb-6">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">13-Passenger Cabin Layout Map</span>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1 mb-4 flex items-center justify-center text-[9px] font-bold text-slate-400 tracking-widest uppercase">Front Dashboard / Windshield</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-inner max-w-xs mx-auto space-y-3">
                      
                      {/* Row 1: Seat 1 is explicitly locked as Driver, rendering passenger seats 2 and 3 next to him */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none cursor-not-allowed">
                          Driver (1)
                        </div>
                        {activeManifest.slice(0, 2).map((seat: any) => {
                          const isChosen = selectedSeat === seat.id;
                          return (
                            <button
                              key={seat.id} disabled={seat.isBooked} onClick={() => setSelectedSeat(seat.id)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                seat.isBooked ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : isChosen ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                              }`}
                            >
                              <Armchair className={`w-4 h-4 mb-0.5 ${isChosen ? 'text-emerald-600' : seat.isBooked ? 'text-slate-300' : 'text-slate-400'}`} />
                              <span>{seat.id}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Remaining Core Passenger Matrix (Seats 4 through 14) */}
                      <div className="grid grid-cols-3 gap-3">
                        {activeManifest.slice(2).map((seat: any) => {
                          const isChosen = selectedSeat === seat.id;
                          return (
                            <button
                              key={seat.id} disabled={seat.isBooked} onClick={() => setSelectedSeat(seat.id)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                seat.isBooked ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : isChosen ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                              }`}
                            >
                              <Armchair className={`w-4 h-4 mb-0.5 ${isChosen ? 'text-emerald-600' : seat.isBooked ? 'text-slate-300' : 'text-slate-400'}`} />
                              <span>{seat.id}</span>
                            </button>
                          );
                        })}
                      </div>

                    </div>

                    <div className="flex justify-center gap-4 text-[11px] font-semibold text-slate-500 pt-2">
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white border border-slate-200 block"></span> Available</div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-500 block"></span> Selected</div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200 block"></span> Booked</div>
                    </div>
                  </div>

                  {/* CHECKOUT BLOCK */}
                  {selectedSeat !== null && (
                    <div className="border-t border-slate-200/60 pt-4 max-w-xl mx-auto space-y-3">
                      <form onSubmit={(e) => handleBookingSubmit(e, shuttle.plateNumber)} className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex-grow space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                            M-Pesa Mobile Number (Seat {selectedSeat} Selected)
                          </label>
                          <input 
                            type="tel" required placeholder="e.g. 0712345678"
                            value={phoneNumber} onChange={handlePhoneChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap h-[42px]">
                          <Ticket className="w-4 h-4" />
                          Book & Pay KES 1,000
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

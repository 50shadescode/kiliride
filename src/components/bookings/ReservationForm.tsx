"use client";

/**
 * ReservationForm.tsx
 *
 * Simple KiliRide reservation workflow.
 * Generates a structured WhatsApp reservation request.
 */

import { useState } from "react";

import type { PublicVehicle } from "@/lib/types/public-vehicle";

import {
  calculateRentalDays,
  calculateEstimatedRentalFee,
  calculateEstimatedTotal,
} from "@/lib/helpers/pricing";

import { Button } from "@/components/ui/button";

import { MessageCircle } from "lucide-react";

interface ReservationFormProps {
  vehicle: PublicVehicle;
}

export function ReservationForm({
  vehicle,
}: ReservationFormProps) {
  /**
   * Customer details
   */
  const [customerName, setCustomerName] =
    useState("");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  /**
   * Reservation dates
   */
  const [pickupDate, setPickupDate] =
    useState("");

  const [returnDate, setReturnDate] =
    useState("");

  /**
   * Vehicle pickup option
   */
  const [pickupMethod, setPickupMethod] =
    useState("pickup");

  /**
   * Extra booking notes
   */
  const [notes, setNotes] = useState("");

  /**
   * Booking calculations
   */
  const rentalDays =
    calculateRentalDays(
      pickupDate,
      returnDate
    );

  const estimatedRentalFee =
    calculateEstimatedRentalFee(
      vehicle,
      rentalDays
    );

  const estimatedTotal =
    calculateEstimatedTotal(
      estimatedRentalFee,
      (vehicle.reservationFee ?? 0)
    );

  /**
   * Generates structured WhatsApp booking request
   */
  function generateReservationWhatsappLink() {
    const message = `
KiliRide Vehicle Enquiry

Vehicle: ${vehicle.name}
Vehicle reference: ${vehicle.id}

Customer Name:
${customerName}

Phone Number:
${phoneNumber}

Pickup Date:
${pickupDate}

Return Date:
${returnDate}

Pickup Method:
${pickupMethod}

Rental Duration:
${rentalDays} day(s)

Estimated Rental Fee:
KES ${estimatedRentalFee.toLocaleString()}

${vehicle.reservationFee === null ? "Estimated base rental (other charges to confirm)" : "Estimated Total"}:
KES ${estimatedTotal.toLocaleString()}

Additional Notes:
${notes || "None"}

This is an enquiry only. Availability and rental terms require manager confirmation.
`;

    return `https://wa.me/${
      vehicle.managerPhone
    }?text=${encodeURIComponent(message)}`;
  }

  return (
    <section className="mt-16 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900">
          Enquire About This Vehicle
        </h2>

        <p className="mt-2 text-slate-500">
          Complete the details below to begin
          your vehicle enquiry.
        </p>
      </div>

      {/* Form */}
      <div className="grid gap-6">
        {/* Customer Name */}
        <div>
          <label htmlFor="enquiry-name" className="text-sm font-semibold text-slate-700">
            Full Name
          </label>

          <input
            type="text"
            id="enquiry-name" placeholder="Enter your full name"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition-colors focus:border-emerald-500"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="enquiry-phone" className="text-sm font-semibold text-slate-700">
            Phone Number
          </label>

          <input
            type="text"
            id="enquiry-phone" placeholder="07XXXXXXXX"
            value={phoneNumber}
            onChange={(e) =>
              setPhoneNumber(e.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition-colors focus:border-emerald-500"
          />
        </div>

        {/* Reservation Dates */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pickup Date */}
          <div>
            <label htmlFor="enquiry-pickup" className="text-sm font-semibold text-slate-700">
              Pickup Date
            </label>

            <input
              id="enquiry-pickup" type="date"
              value={pickupDate}
              onChange={(e) =>
                setPickupDate(e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition-colors focus:border-emerald-500"
            />
          </div>

          {/* Return Date */}
          <div>
            <label htmlFor="enquiry-return" className="text-sm font-semibold text-slate-700">
              Return Date
            </label>

            <input
              id="enquiry-return" type="date"
              value={returnDate}
              onChange={(e) =>
                setReturnDate(e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition-colors focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Pickup Method */}
        <div>
          <label htmlFor="enquiry-method" className="text-sm font-semibold text-slate-700">
            Pickup Method
          </label>

          <select
            id="enquiry-method"
            value={pickupMethod}
            onChange={(e) =>
              setPickupMethod(e.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition-colors focus:border-emerald-500"
          >
            <option value="pickup">
              Customer Pickup
            </option>

            <option value="delivery">
              Vehicle Delivery
            </option>
          </select>
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="enquiry-notes" className="text-sm font-semibold text-slate-700">
            Additional Notes
          </label>

          <textarea
            id="enquiry-notes"
            rows={5}
            placeholder="Special requests or booking notes..."
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none transition-colors focus:border-emerald-500"
          />
        </div>

        {/* Enquiry Estimate */}
        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="text-xl font-black text-slate-900">
            Enquiry Estimate
          </h3>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                Rental Duration
              </span>

              <span className="font-bold text-slate-900">
                {rentalDays} day(s)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                Estimated Rental Fee
              </span>

              <span className="font-bold text-slate-900">
                KES{" "}
                {estimatedRentalFee.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                Reservation Fee
              </span>

              <span className="font-bold text-slate-900">
                {vehicle.reservationFee === null ? "To confirm" : `KES ${vehicle.reservationFee.toLocaleString()}`}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900">
                {vehicle.reservationFee === null ? "Estimated base rental" : "Estimated Total"}
              </span>

              <span className="text-2xl font-black text-emerald-600">
                KES{" "}
                {estimatedTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            This enquiry is not a confirmed reservation; terms require
            manager confirmation.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Vehicle extensions are subject
            to availability.
          </p>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={generateReservationWhatsappLink()}
          target="_blank"
          rel="noreferrer"
        >
          <Button className="w-full rounded-2xl py-7 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-base transition-colors">
            <MessageCircle className="mr-2 h-5 w-5" />
            Continue on WhatsApp
          </Button>
        </a>
      </div>
    </section>
  );
}

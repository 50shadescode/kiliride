import Link from "next/link";
import { pageIdentity } from "@/server/page-access";
import { headers } from "next/headers";
import { CarFront, Plus } from "lucide-react";
import { listHostVehicles } from "@/server/fleet/host";
import { listingStatusLabels } from "@/lib/validation/host-vehicle";
export const dynamic = "force-dynamic";
export default async function HostPage() {
  await pageIdentity("HOST");
  const vehicles = await listHostVehicles(await headers());
  return <section className="mx-auto my-10 w-full max-w-5xl px-4 sm:px-6">
    <Link href="/account" className="text-sm text-emerald-700 underline">Back to account</Link>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold text-slate-900">Your vehicles</h1><p className="mt-2 text-slate-600">Manage your listings and track their review status.</p></div>
      <Link href="/host/vehicles/new" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"><Plus aria-hidden="true" size={18} />Add a vehicle</Link>
    </div>
    {vehicles.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><CarFront aria-hidden="true" className="mx-auto mb-4 text-emerald-600" size={36} /><h2 className="text-xl font-semibold">No vehicles yet</h2><p className="mt-2 text-slate-600">Add your first vehicle and save it as a draft.</p></div> :
      <ul className="grid gap-5 sm:grid-cols-2">{vehicles.map(vehicle => <li key={vehicle.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{listingStatusLabels[vehicle.status]}</span>
        <h2 className="mt-4 break-words text-xl font-bold text-slate-900">{vehicle.make} {vehicle.model}</h2>
        <p className="mt-1 break-words text-slate-600">{vehicle.location}</p>
        <p className="mt-4 text-sm text-slate-600">KES {vehicle.baseHalfDay.toLocaleString("en-KE")} / half-day · KES {vehicle.baseFullDay.toLocaleString("en-KE")} / full-day</p>
        <Link href={`/host/vehicles/${vehicle.id}`} className="mt-5 inline-block font-semibold text-emerald-700 underline">Manage {vehicle.make} {vehicle.model}</Link>
      </li>)}</ul>}
    <p className="mt-6 text-sm text-slate-600">Submitting a listing does not publish it or confirm rental availability.</p>
  </section>;
}

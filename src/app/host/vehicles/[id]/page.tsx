import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { pageIdentity } from "@/server/page-access";
import { AccessError } from "@/server/authorization";
import { getHostVehicle } from "@/server/fleet/host";
import { VehicleForm } from "@/components/host/VehicleForm";
import { draftValues, listingStatusLabels } from "@/lib/validation/host-vehicle";
export const dynamic = "force-dynamic";
export default async function HostVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  await pageIdentity("HOST");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const vehicle = await getHostVehicle(await headers(), id).catch(error => { if (error instanceof AccessError && error.status === 404) notFound(); throw error; });
  return <section className="mx-auto my-10 w-full max-w-3xl px-4 sm:px-6">
    <Link href="/host" className="text-sm text-emerald-700 underline">Back to your vehicles</Link>
    <div className="my-6"><h1 className="break-words text-3xl font-bold">{vehicle.make} {vehicle.model}</h1><span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{listingStatusLabels[vehicle.status]}</span></div>
    <Link href={`/host/vehicles/${id}/photos`} className="mb-6 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700">Manage photographs</Link>
    <VehicleForm key={vehicle.id} initial={{ ...draftValues(vehicle, vehicle.registration?.registrationNumber), id: vehicle.id, status: vehicle.status, revision: vehicle.revision }} />
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Review feedback</h2>
      {vehicle.reviews.length ? <ul className="mt-4 space-y-4">{vehicle.reviews.map(review => <li key={review.id} className="break-words border-t border-slate-100 pt-3"><p className="font-semibold">{listingStatusLabels[review.decision]}</p><time className="text-sm text-slate-500" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (Nairobi)</time><p className="mt-2 whitespace-pre-wrap text-slate-700">{review.reason}</p></li>)}</ul> : <p className="mt-3 text-slate-600">No review feedback yet.</p>}
    </section>
    {vehicle.decisions.length > 0 && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Status updates</h2><ul className="mt-4 space-y-4">{vehicle.decisions.map(decision => <li key={decision.id}><p className="font-semibold">{listingStatusLabels[decision.toStatus]}</p><time dateTime={decision.createdAt.toISOString()} className="text-sm text-slate-500">{decision.createdAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (Nairobi)</time><p className="mt-2 whitespace-pre-wrap break-words">{decision.reason}</p></li>)}</ul></section>}
  </section>;
}

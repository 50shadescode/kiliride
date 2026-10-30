import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { pageIdentity } from "@/server/page-access";
import { listAdminVehicles } from "@/server/fleet/admin";
import { adminQueueSchema } from "@/lib/validation/vehicle-review";
import { listingStatusLabels } from "@/lib/validation/host-vehicle";
import { VehicleFilters } from "@/components/admin/VehicleFilters";
export const dynamic = "force-dynamic";
async function Queue({ filters }: { filters: { status: "ALL" | keyof typeof listingStatusLabels; query: string; page: number } }) {
  const result = await listAdminVehicles(await headers(), filters);
  const link = (page: number) => `/admin?${new URLSearchParams({ ...filters, page: String(page) })}`;
  return <><p className="mb-4 text-sm text-slate-600">{result.total} vehicle(s) · Page {result.page}</p>
    {!result.vehicles.length ? <p className="rounded-2xl bg-white p-6">No vehicles match these filters.</p> : <ul className="grid gap-4 md:grid-cols-2">{result.vehicles.map(vehicle => <li key={vehicle.id} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-bold"><Link href={`/admin/vehicles/${vehicle.id}`} className="text-emerald-700 underline">{vehicle.make} {vehicle.model}</Link></h2><p className="mt-2 font-semibold">{listingStatusLabels[vehicle.status]}</p><p className="break-words text-sm">{vehicle.publicId}</p><p className="mt-2">Owner: {vehicle.ownership?.owner?.name ?? "Unassigned"} · {vehicle.ownership?.origin ?? "No relationship"}</p>
      <p>{vehicle.location} · KES {vehicle.baseHalfDay.toLocaleString("en-KE")} / half day · KES {vehicle.baseFullDay.toLocaleString("en-KE")} / full day</p><p className="mt-2 text-sm text-slate-600">Submitted: {vehicle.events[0]?.createdAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" }) ?? "Not submitted"}{vehicle.events.length ? " (Nairobi)" : ""}</p>
    </li>)}</ul>}<nav aria-label="Vehicle pages" className="mt-6 flex gap-6">{result.page > 1 && <Link href={link(result.page - 1)} className="text-emerald-700 underline">Previous</Link>}{result.page * 25 < result.total && <Link href={link(result.page + 1)} className="text-emerald-700 underline">Next</Link>}</nav></>;
}
export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await pageIdentity("ADMIN");
  const parsed = adminQueueSchema.safeParse(await searchParams); const filters = parsed.success ? parsed.data : adminQueueSchema.parse({});
  return <section className="mx-auto my-10 w-full max-w-6xl px-4 sm:px-6"><Link href="/account" className="text-emerald-700 underline">Back to account</Link><h1 className="mt-5 text-3xl font-bold text-slate-900">Vehicle verification</h1><p className="mt-3 text-slate-600">Review owner submissions and record evidence-backed decisions. The public catalogue remains unchanged.</p>{!parsed.success && <p role="alert" className="mt-4">Invalid filters. Showing pending submissions.</p>}<VehicleFilters status={filters.status} query={filters.query} /><Suspense key={JSON.stringify(filters)} fallback={<p role="status">Loading vehicles…</p>}><Queue filters={filters} /></Suspense></section>;
}

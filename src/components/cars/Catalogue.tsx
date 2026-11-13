import Link from "next/link";
import { publicCatalogue } from "@/server/fleet/public";
import { CarCard } from "./CarCard";
import { CatalogueFilters } from "./CatalogueFilters";
import { ZodError } from "zod";
export async function Catalogue({ query = {} }: { query?: unknown }) {
  let result;
  try { result = await publicCatalogue(query); }
  catch (error) { return <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-6"><p>{error instanceof ZodError ? "Check the search filters." : "The vehicle catalogue is temporarily unavailable. Please try again."}</p><Link href="/services/vehicles" prefetch={false} className="mt-3 inline-block text-emerald-700 underline">Reload catalogue</Link></div>; }
  const { filters, total, vehicles, categories } = result;
  const link = (page: number) => `/services/vehicles?${new URLSearchParams(Object.entries({ ...filters, page }).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]))}`;
  return <><CatalogueFilters filters={filters} categories={categories} /><p className="mb-5 text-sm text-slate-600">{total} vehicle(s) · Page {filters.page}</p>
    {vehicles.length ? <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">{vehicles.map(vehicle => <CarCard key={vehicle.id} vehicle={vehicle} />)}</div> : <div className="rounded-2xl bg-white p-8"><h2 className="text-xl font-bold">No vehicles match your search</h2><p className="mt-2 text-slate-600">Try different filters or contact KiliRide about your enquiry.</p></div>}
    <nav aria-label="Catalogue pages" className="mt-8 flex gap-6">{filters.page > 1 && <Link prefetch={false} href={link(filters.page - 1)} className="text-emerald-700 underline">Previous page</Link>}{filters.page * filters.pageSize < total && <Link prefetch={false} href={link(filters.page + 1)} className="text-emerald-700 underline">Next page</Link>}</nav></>;
}

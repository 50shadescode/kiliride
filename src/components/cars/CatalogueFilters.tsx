"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export function CatalogueFilters({ filters, categories }: { filters: { q: string; category: string; location: string; seats?: number; sort: string }; categories: string[] }) {
  const [pending, startTransition] = useTransition(); const router = useRouter();
  const field = "mt-1 block w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3";
  return <form action="/services/vehicles" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const params = new URLSearchParams(); for (const [key, value] of data) if (String(value).trim()) params.set(key, String(value)); startTransition(() => router.push(`/services/vehicles?${params}`)); }}>
    <label>Make or model<input className={field} name="q" defaultValue={filters.q} maxLength={100} /></label>
    <label><span id="catalogue-category">Category</span><select aria-labelledby="catalogue-category" className={field} name="category" defaultValue={filters.category}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Location<input className={field} name="location" defaultValue={filters.location} maxLength={120} /></label>
    <label>Minimum seats<input className={field} name="seats" type="number" min={1} max={100} defaultValue={filters.seats ?? ""} /></label>
    <label><span id="catalogue-sort">Sort by</span><select aria-labelledby="catalogue-sort" className={field} name="sort" defaultValue={filters.sort}><option value="default">Catalogue order</option><option value="name">Vehicle name</option><option value="price-asc">Full-day price: low to high</option><option value="price-desc">Full-day price: high to low</option></select></label>
    <button disabled={pending} className="self-end rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Searching…" : "Search vehicles"}</button><p role="status" className="sr-only">{pending ? "Loading vehicles" : ""}</p>
  </form>;
}

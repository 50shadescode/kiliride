"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { listingStatusLabels } from "@/lib/validation/host-vehicle";
export function VehicleFilters({ status, query }: { status: string; query: string }) {
  const [pending, startTransition] = useTransition(); const router = useRouter();
  return <form className="my-6 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => router.push(`/admin?${new URLSearchParams({ status: String(data.get("status")), query: String(data.get("query")) })}`)); }}>
    <label className="flex-1">Make, model or public identifier<input name="query" defaultValue={query} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label><label>Status<select name="status" defaultValue={status} className="mt-1 block w-full rounded-lg border border-slate-300 p-3"><option value="ALL">All statuses</option>{Object.entries(listingStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <button disabled={pending} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Loading…" : "Filter vehicles"}</button><span role="status" className="sr-only">{pending ? "Loading vehicles" : ""}</span>
  </form>;
}

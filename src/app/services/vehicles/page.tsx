import { Suspense } from "react";
import { Catalogue } from "@/components/cars/Catalogue";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function VehiclesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <section className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><header className="mb-8"><h1 className="text-4xl font-extrabold text-slate-900">Premium Car Hire</h1><p className="mt-3 max-w-2xl text-slate-600">Browse vehicle details and prices. Contact KiliRide to confirm availability and rental terms. An enquiry is not a confirmed reservation.</p></header><Suspense key={JSON.stringify(query)} fallback={<p role="status">Loading vehicles…</p>}><Catalogue query={query} /></Suspense></div></section>;
}

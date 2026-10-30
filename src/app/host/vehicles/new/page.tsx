import Link from "next/link";
import { pageIdentity } from "@/server/page-access";
import { VehicleForm } from "@/components/host/VehicleForm";
export const dynamic = "force-dynamic";
export default async function NewVehiclePage() {
  await pageIdentity("HOST");
  return <section className="mx-auto my-10 w-full max-w-3xl px-4 sm:px-6"><Link href="/host" className="text-sm text-emerald-700 underline">Back to your vehicles</Link><h1 className="my-6 text-3xl font-bold">Add a vehicle</h1><p className="mb-6 text-slate-600">Save your vehicle details as a draft. Creating a listing does not verify ownership or publish it.</p><VehicleForm /></section>;
}

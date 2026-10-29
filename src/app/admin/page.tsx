import Link from "next/link";
import { pageIdentity } from "@/server/page-access";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await pageIdentity("ADMIN");
  return <section className="mx-auto my-12 max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
    <h1 className="text-3xl font-bold text-slate-900">Administrator access</h1>
    <p className="my-4">Your administrator identity and two-step verification are confirmed. Operational dashboards are not yet available.</p>
    <Link href="/account" className="text-emerald-700">Back to account</Link>
  </section>;
}

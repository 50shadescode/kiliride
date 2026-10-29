import Link from "next/link";
import { pageIdentity } from "@/server/page-access";
import { AccountControls } from "@/components/auth/AccountControls";

export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const { user } = await pageIdentity();
  return <section className="mx-auto my-12 max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
    <h1 className="text-3xl font-bold text-slate-900">Your account</h1>
    <p className="mt-4">{user.name}</p><p>{user.email}</p>
    <p className="mt-4">Access: {user.roles.map(item => item.role).join(", ")}</p>
    <nav className="mt-4 flex flex-wrap gap-4 text-emerald-700" aria-label="Account destinations">
      <Link href="/services/vehicles">Browse vehicles</Link>
      {user.roles.some(item => item.role === "HOST") && <Link href="/host">Host access</Link>}
      {user.roles.some(item => item.role === "ADMIN") && <Link href="/admin">Administrator access</Link>}
    </nav>
    <AccountControls enabled={user.twoFactorEnabled} />
  </section>;
}

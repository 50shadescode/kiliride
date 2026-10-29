import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
export default function Page() {
  return <Suspense fallback={<p className="p-8">Loading account form...</p>}><AuthForm mode="signup" /></Suspense>;
}

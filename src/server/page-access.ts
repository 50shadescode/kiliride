import "server-only";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { AccessError, requireIdentity, requireRole } from "./authorization";

export async function pageIdentity(role?: "HOST" | "ADMIN") {
  try { return role ? await requireRole(await headers(), role) : await requireIdentity(await headers()); }
  catch (error) {
    if (error instanceof AccessError) {
      if (error.status === 401) redirect("/login");
      notFound();
    }
    throw error;
  }
}

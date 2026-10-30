import { listAdminVehicles } from "@/server/fleet/admin";
import { adminReviewError } from "@/server/fleet/admin-http";
import { privateJson } from "@/server/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return privateJson(await listAdminVehicles(request.headers, Object.fromEntries(new URL(request.url).searchParams))); }
  catch (error) { return adminReviewError(error); }
}

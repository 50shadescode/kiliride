import { getAdminVehicle } from "@/server/fleet/admin";
import { adminReviewError } from "@/server/fleet/admin-http";
import { privateJson } from "@/server/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return privateJson(await getAdminVehicle(request.headers, (await context.params).id)); }
  catch (error) { return adminReviewError(error); }
}

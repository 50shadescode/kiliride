import { decideAdminVehicle } from "@/server/fleet/admin";
import { adminReviewBody, adminReviewError } from "@/server/fleet/admin-http";
import { privateJson } from "@/server/http";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return privateJson(await decideAdminVehicle(request.headers, (await context.params).id, await adminReviewBody(request))); }
  catch (error) { return adminReviewError(error); }
}

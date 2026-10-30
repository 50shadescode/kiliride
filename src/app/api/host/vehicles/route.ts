import { createHostVehicle, listHostVehicles } from "@/server/fleet/host";
import { hostError, hostRequestBody } from "@/server/fleet/host-http";
import { privateJson } from "@/server/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return privateJson({ vehicles: await listHostVehicles(request.headers) }); }
  catch (error) { return hostError(error); }
}
export async function POST(request: Request) {
  try { return privateJson(await createHostVehicle(request.headers, await hostRequestBody(request)), 201); }
  catch (error) { return hostError(error); }
}

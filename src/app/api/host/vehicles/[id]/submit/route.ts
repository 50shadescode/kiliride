import { submitHostVehicle } from "@/server/fleet/host";
import { hostError, hostRequestBody } from "@/server/fleet/host-http";
import { privateJson } from "@/server/http";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return privateJson(await submitHostVehicle(request.headers, (await context.params).id, await hostRequestBody(request))); }
  catch (error) { return hostError(error); }
}

import { editHostVehicle, getHostVehicle } from "@/server/fleet/host";
import { hostError, hostRequestBody } from "@/server/fleet/host-http";
import { privateJson } from "@/server/http";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { return privateJson(await getHostVehicle(request.headers, (await context.params).id)); }
  catch (error) { return hostError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { return privateJson(await editHostVehicle(request.headers, (await context.params).id, await hostRequestBody(request))); }
  catch (error) { return hostError(error); }
}

import { publicVehicle } from "@/server/fleet/public";
import { catalogueError, catalogueJson } from "@/server/fleet/public-http";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { const vehicle = await publicVehicle((await context.params).id); return catalogueJson(vehicle ?? { message: "Vehicle not found." }, vehicle ? 200 : 404); } catch (error) { return catalogueError(error); } }

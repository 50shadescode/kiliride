import { publicVehiclePhoto } from "@/server/fleet/public";
import { catalogueError, publicNoStore } from "@/server/fleet/public-http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try { const { id, photoId } = await context.params; const bytes = await publicVehiclePhoto(id, photoId); return new Response(new Uint8Array(bytes), { headers: { ...publicNoStore, "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox", "Cross-Origin-Resource-Policy": "same-origin", "Content-Disposition": 'inline; filename="vehicle-photo.webp"' } }); }
  catch (error) { return catalogueError(error); }
}

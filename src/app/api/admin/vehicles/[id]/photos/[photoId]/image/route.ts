import { readAdminVehiclePhoto } from "@/server/fleet/admin";
import { adminReviewError } from "@/server/fleet/admin-http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await context.params;
    const bytes = await readAdminVehiclePhoto(request.headers, id, photoId);
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/webp", "Content-Length": String(bytes.length), "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff", "Content-Disposition": 'inline; filename="vehicle-photo.webp"', "Content-Security-Policy": "default-src 'none'; sandbox", "Cross-Origin-Resource-Policy": "same-origin" } });
  } catch (error) { return adminReviewError(error); }
}

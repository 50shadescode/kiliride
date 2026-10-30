import { photos } from "@/server/images/service";
import { hostError } from "@/server/fleet/host-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await context.params;
    const bytes = await photos().read(request.headers, id, photoId);
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": "image/webp", "Content-Length": String(bytes.length), "Cache-Control": "private, no-store", Vary: "Cookie",
      "X-Content-Type-Options": "nosniff", "Content-Disposition": 'inline; filename="vehicle-photo.webp"',
      "Content-Security-Policy": "default-src 'none'; sandbox", "Cross-Origin-Resource-Policy": "same-origin",
    } });
  } catch (error) { return hostError(error); }
}

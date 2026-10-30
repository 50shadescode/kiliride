import { photos } from "@/server/images/service";
import { imageUploadBody } from "@/server/images/http";
import { hostError, hostRequestBody } from "@/server/fleet/host-http";
import { privateJson } from "@/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try { return privateJson(await photos().list(request.headers, (await context.params).id)); } catch (error) { return hostError(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { input, bytes, contentType } = await imageUploadBody(request, id);
    return privateJson(await photos().upload(request.headers, id, input, bytes, contentType), 201);
  } catch (error) { return hostError(error); }
}
export async function PATCH(request: Request, context: Context) {
  try { return privateJson(await photos().arrange(request.headers, (await context.params).id, await hostRequestBody(request))); } catch (error) { return hostError(error); }
}

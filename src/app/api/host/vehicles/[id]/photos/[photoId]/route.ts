import { photos } from "@/server/images/service";
import { hostError, hostRequestBody } from "@/server/fleet/host-http";
import { privateJson } from "@/server/http";
export async function DELETE(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await context.params;
    return privateJson(await photos().remove(request.headers, id, photoId, await hostRequestBody(request)));
  } catch (error) { return hostError(error); }
}

import "server-only";
import { AccessError, requireRole } from "../authorization";
import { getEnv } from "../env";
import { ImageError, MAX_IMAGE_BYTES, photoUploadSchema } from "@/lib/validation/vehicle-image";
import { assertPhotoOwner } from "./service";

export async function imageUploadBody(request: Request, vehicleId: string) {
  if (request.headers.get("origin") !== new URL(getEnv().BETTER_AUTH_URL).origin) throw new AccessError(403);
  await requireRole(request.headers, "HOST");
  await assertPhotoOwner(request.headers, vehicleId);
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some(key => !["expectedRevision", "altText", "replacePhotoId"].includes(key)) || [...url.searchParams.keys()].some(key => url.searchParams.getAll(key).length !== 1)) throw new ImageError(400, "Invalid upload details.");
  const revision = url.searchParams.get("expectedRevision");
  const input = photoUploadSchema.parse({ expectedRevision: revision === null || !/^\d+$/.test(revision) ? NaN : Number(revision), altText: url.searchParams.get("altText"), ...(url.searchParams.has("replacePhotoId") ? { replacePhotoId: url.searchParams.get("replacePhotoId") } : {}) });
  const contentType = request.headers.get("content-type") ?? "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) throw new ImageError(415, "Choose a JPEG, PNG or WebP image.");
  const reader = request.body?.getReader();
  if (!reader) throw new ImageError(400, "Choose a photograph.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const chunk = await reader.read(); if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > MAX_IMAGE_BYTES) { await reader.cancel(); throw new ImageError(413, "Choose an image up to 5 MiB."); }
    chunks.push(chunk.value);
  }
  return { input, bytes: Buffer.concat(chunks), contentType };
}

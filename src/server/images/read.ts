import "server-only";
import { createHash } from "node:crypto";
import { ImageError } from "@/lib/validation/vehicle-image";
import type { ImageStorage } from "./storage";
// Internal byte primitive. Callers must authorize before providing DB metadata.
export async function readVerifiedImage(storage: ImageStorage, object: { key: string; byteSize: number; sha256: string }) {
  try {
    const bytes = await storage.get(object.key);
    if (bytes.length !== object.byteSize || createHash("sha256").update(bytes).digest("hex") !== object.sha256) throw new Error("Image integrity check failed");
    return bytes;
  } catch { throw new ImageError(404, "Photograph unavailable."); }
}

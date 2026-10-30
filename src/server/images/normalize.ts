import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { ImageError, MAX_IMAGE_BYTES } from "@/lib/validation/vehicle-image";

export async function normalizeImage(bytes: Buffer, contentType: string) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ImageError(413, "Choose an image up to 5 MiB.");
  // Check signatures before invoking decoders. Never permit SVG/PDF/URL input.
  const format = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "jpeg"
    : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png"
    : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
  if (!format || contentType !== `image/${format}`) throw new ImageError(415, "Choose a JPEG, PNG or WebP image with a matching file type.");
  try {
    // PNG decoders may expose only the default APNG image. Reject animation
    // container chunks as well as multi-page decoder metadata.
    if (format === "png" || format === "webp") {
      let offset = format === "png" ? 8 : 12;
      while (offset + 12 <= bytes.length) {
        const chunkType = bytes.toString("ascii", offset + (format === "png" ? 4 : 0), offset + (format === "png" ? 8 : 4));
        if (chunkType === "acTL" || chunkType === "ANIM") throw new Error("Animated image");
        const length = format === "png" ? bytes.readUInt32BE(offset) : bytes.readUInt32LE(offset + 4);
        offset += format === "png" ? length + 12 : length + 8 + (length % 2);
      }
    }
    const image = sharp(bytes, { failOn: "warning", limitInputPixels: 24_000_000, animated: false });
    const metadata = await image.metadata();
    if (metadata.format !== format || (metadata.pages ?? 1) !== 1) throw new Error("Unsupported image");
    // Full decoding/re-encoding, not metadata inspection alone. No keepMetadata.
    const { data, info } = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).timeout({ seconds: 10 }).toBuffer({ resolveWithObject: true });
    if (data.length > MAX_IMAGE_BYTES) throw new Error("Output too large");
    return { bytes: data, width: info.width, height: info.height, byteSize: data.length, sha256: createHash("sha256").update(data).digest("hex") };
  } catch { throw new ImageError(400, "This image cannot be processed. Use a complete, non-animated image of at most 24 megapixels."); }
}

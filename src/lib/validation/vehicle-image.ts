import { z } from "zod";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VEHICLE_PHOTOS = 12;
export const photoUploadSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  altText: z.string().trim().min(1).max(200),
  replacePhotoId: z.string().uuid().optional(),
}).strict();
export const photoOrderSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  photoIds: z.array(z.string().uuid()).min(1).max(MAX_VEHICLE_PHOTOS),
  coverPhotoId: z.string().uuid(),
}).strict();
export class ImageError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export type HostPhoto = { id: string; altText: string; position: number; isCover: boolean; url: string };

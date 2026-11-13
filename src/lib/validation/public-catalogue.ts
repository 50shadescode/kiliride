import { z } from "zod";
export const publicIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export const catalogueQuerySchema = z.object({
  q: z.string().trim().max(100).default(""), category: z.string().trim().max(80).default(""), location: z.string().trim().max(120).default(""),
  seats: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(["default", "price-asc", "price-desc", "name"]).default("default"),
  page: z.coerce.number().int().min(1).max(1000).default(1), pageSize: z.coerce.number().int().min(1).max(24).default(12),
}).strict();
export const publicMetadataSchema = z.object({
  publicId: publicIdSchema, make: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(10).max(3000), location: z.string().trim().min(1).max(120), seats: z.number().int().min(1).max(100),
  fuelType: z.enum(["Petrol", "Diesel", "Hybrid", "Electric"]), transmission: z.enum(["Automatic", "Manual"]), currency: z.literal("KES"),
  baseHalfDay: z.number().int().positive(), baseFullDay: z.number().int().positive(),
});

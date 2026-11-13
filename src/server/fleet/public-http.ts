import "server-only";
import { ZodError } from "zod";
import { AccessError } from "../authorization";
import { ImageError } from "@/lib/validation/vehicle-image";
export const publicNoStore = { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" };
export function catalogueJson(value: unknown, status = 200) { return Response.json(value, { status, headers: publicNoStore }); }
export function catalogueError(error: unknown) {
  if (error instanceof ZodError) return catalogueJson({ message: "Check the search filters." }, 400);
  if (error instanceof AccessError || error instanceof ImageError) return catalogueJson({ message: "Vehicle or photograph not found." }, 404);
  return catalogueJson({ message: "Vehicle catalogue is temporarily unavailable. Please try again." }, 503);
}
export function catalogueQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some(key => params.getAll(key).length > 1)) throw new ZodError([]);
  return Object.fromEntries(params);
}

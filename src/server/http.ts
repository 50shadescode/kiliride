import "server-only";
import { ZodError } from "zod";
import { AccessError } from "./authorization";

export function privateJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "Vary": "Cookie" } });
}
export function privateError(error: unknown) {
  if (error instanceof AccessError) return privateJson({ message: "Access denied." }, error.status);
  if (error instanceof ZodError || error instanceof SyntaxError) return privateJson({ message: "Invalid request." }, 400);
  return privateJson({ message: "Service temporarily unavailable." }, 503);
}

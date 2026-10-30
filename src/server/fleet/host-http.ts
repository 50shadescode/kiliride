import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AccessError, requireRole } from "../authorization";
import { getEnv } from "../env";
import { privateJson } from "../http";
import { readLimitedBody } from "../request-body";
import { FleetError } from "./lifecycle";

class RequestError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function hostRequestBody(request: Request) {
  if (request.headers.get("origin") !== new URL(getEnv().BETTER_AUTH_URL).origin) throw new AccessError(403);
  await requireRole(request.headers, "HOST");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new RequestError(415, "Send JSON listing details.");
  const body = await readLimitedBody(request, 16384);
  if (body === null) throw new RequestError(413, "Listing details are too large.");
  return JSON.parse(body) as unknown;
}

export function hostError(error: unknown) {
  if (error instanceof AccessError) return privateJson({ message: error.status === 404 ? "Listing not found." : "Access denied." }, error.status);
  if (error instanceof ZodError) return privateJson({ message: "Check the highlighted listing details.", fields: error.flatten().fieldErrors }, 400);
  if (error instanceof SyntaxError) return privateJson({ message: "Invalid request." }, 400);
  if (error instanceof RequestError) return privateJson({ message: error.message }, error.status);
  if (error instanceof FleetError) return privateJson({ message: error.code === "CONFLICT" ? "This listing changed. Reload the page before trying again." : "This listing cannot be changed in its current status." }, 409);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return privateJson({ message: "This registration cannot be used. Check it or contact support.", fields: { registrationNumber: ["Check this registration or contact support."] } }, 409);
  return privateJson({ message: "Vehicle management is temporarily unavailable. Please try again." }, 503);
}

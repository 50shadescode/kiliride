import "server-only";
import { ZodError } from "zod";
import { AccessError, requireRole } from "../authorization";
import { privateJson } from "../http";
import { getEnv } from "../env";
import { readLimitedBody } from "../request-body";
import { FleetError } from "./lifecycle";
import { ImageError } from "@/lib/validation/vehicle-image";
export async function adminReviewBody(request: Request) {
  if (request.headers.get("origin") !== new URL(getEnv().BETTER_AUTH_URL).origin) throw new AccessError(403);
  await requireRole(request.headers, "ADMIN");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new ImageError(415, "Send JSON review details.");
  const body = await readLimitedBody(request, 16384);
  if (body === null) throw new ImageError(413, "Review details are too large.");
  return JSON.parse(body) as unknown;
}
export function adminReviewError(error: unknown) {
  if (error instanceof AccessError) return privateJson({ message: error.status === 404 ? "Vehicle not found." : "Access denied." }, error.status);
  if (error instanceof ZodError || error instanceof SyntaxError) return privateJson({ message: "Check the review fields and evidence references." }, 400);
  if (error instanceof ImageError) return privateJson({ message: error.message }, error.status);
  if (error instanceof FleetError) {
    const messages = { CONFLICT: "This vehicle changed. Reload before deciding.", INVALID_TRANSITION: "This decision is not allowed in the current status.", EVIDENCE_REQUIRED: "Approval requires complete verification checks, evidence references and available vehicle photographs.", POLICY_REQUIRED: "Approval is blocked until an enabled, approved verification policy is recorded." };
    return privateJson({ message: messages[error.code] }, error.code === "EVIDENCE_REQUIRED" || error.code === "POLICY_REQUIRED" ? 422 : 409);
  }
  return privateJson({ message: "Vehicle review is temporarily unavailable. Reload before retrying." }, 503);
}

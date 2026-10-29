import { activateHost } from "@/server/host-activation";
import { getEnv } from "@/server/env";
import { privateError, privateJson } from "@/server/http";
import { requireRole } from "@/server/authorization";
import { readLimitedBody } from "@/server/request-body";

export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(getEnv().BETTER_AUTH_URL).origin) return privateJson({ message: "Access denied." }, 403);
    await requireRole(request.headers, "ADMIN");
    const body = await readLimitedBody(request, 2048);
    if (body === null) return privateJson({ message: "Request too large." }, 413);
    return privateJson(await activateHost(request.headers, JSON.parse(body)));
  } catch (error) { return privateError(error); }
}

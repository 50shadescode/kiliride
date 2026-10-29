import { getAuth } from "@/server/auth";
import { readLimitedBody } from "@/server/request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Expose only the identity operations implemented by the Phase 1 interface.
const endpoints = new Set([
  "sign-up/email", "sign-in/email", "sign-out", "get-session",
  "send-verification-email", "verify-email", "request-password-reset", "reset-password",
  "two-factor/enable", "two-factor/verify-totp", "two-factor/verify-backup-code",
]);

function publicAuthResult(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(publicAuthResult);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !["token", "password", "secret"].includes(key)).map(([key, item]) => [key, publicAuthResult(item)]));
  }
  return value;
}

async function handle(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace(/^\/api\/auth\//, "");
    if (!endpoints.has(path) && !/^reset-password\/[A-Za-z0-9_-]+$/.test(path)) return Response.json({ message: "Not found." }, { status: 404 });
    if (request.method === "POST") {
      const body = await readLimitedBody(request, 16384);
      if (body === null) return Response.json({ message: "Request too large." }, { status: 413 });
      request = new Request(request.url, { method: "POST", headers: request.headers, body });
    }
    const response = await getAuth().handler(request);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("Referrer-Policy", "no-referrer");
    if (response.status >= 300 && response.status < 400) {
      return new Response(null, { status: response.status, headers });
    }
    if (headers.get("content-type")?.includes("application/json")) {
      headers.delete("content-length");
      // Session authentication remains in HttpOnly cookies, never JSON or browser storage.
      const body = await response.text();
      return new Response(body ? JSON.stringify(publicAuthResult(JSON.parse(body))) : null, { status: response.status, headers });
    }
    return new Response(response.body, { status: response.status, headers });
  } catch {
    // Never log token-bearing requests, passwords or provider errors.
    return Response.json({ message: "Authentication is temporarily unavailable. Please try again." }, { status: 503 });
  }
}

export { handle as GET, handle as POST };

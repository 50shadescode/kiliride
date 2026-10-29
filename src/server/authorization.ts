import "server-only";
import { getAuth } from "./auth";
import { getDb } from "./db";
import type { Role } from "@/generated/prisma/client";

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403 | 404) { super("Access denied"); }
}

export async function requireIdentity(headers: Headers) {
  const session = await getAuth().api.getSession({ headers });
  if (!session) throw new AccessError(401);
  const user = await getDb().user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true, twoFactorEnabled: true, roles: { select: { role: true, createdAt: true } } },
  });
  if (!user?.emailVerified) throw new AccessError(403);
  return { user, sessionCreatedAt: new Date(session.session.createdAt) };
}

export async function requireRole(headers: Headers, role: Role) {
  const identity = await requireIdentity(headers);
  const assignment = identity.user.roles.find(item => item.role === role);
  if (role === "DRIVER" || !assignment) throw new AccessError(403);
  if (role === "ADMIN" && (!identity.user.twoFactorEnabled || identity.sessionCreatedAt < assignment.createdAt)) throw new AccessError(403);
  return identity;
}

export async function readOwnAccount(headers: Headers, id: string) {
  const { user } = await requireIdentity(headers);
  if (user.id !== id) throw new AccessError(403);
  return { id: user.id, name: user.name, email: user.email, roles: user.roles.map(item => item.role) };
}

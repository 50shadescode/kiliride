import "server-only";
import { z } from "zod";
import { getDb } from "./db";
import { AccessError, requireRole } from "./authorization";

const activation = z.object({ userId: z.string().uuid(), reason: z.string().trim().min(10).max(500) }).strict();

export async function activateHost(headers: Headers, input: unknown) {
  const { user: actor } = await requireRole(headers, "ADMIN");
  const data = activation.parse(input);
  return getDb().$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { id: data.userId }, select: { emailVerified: true } });
    if (!user?.emailVerified) throw new AccessError(404);
    await tx.roleAssignment.upsert({
      where: { userId_role: { userId: data.userId, role: "HOST" } },
      create: { userId: data.userId, role: "HOST" }, update: {},
    });
    await tx.auditLog.create({ data: { actorId: actor.id, subjectId: data.userId, action: "HOST_ACTIVATED", reason: data.reason } });
    return { activated: true };
  });
}

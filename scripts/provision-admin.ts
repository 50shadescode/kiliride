import "dotenv/config";
import { z } from "zod";
import { getDb } from "../src/server/db";

// Local operator-only command. No password, privilege flag or user is hard-coded.
async function main() {
const [email, operator, reason] = process.argv.slice(2);
const input = z.object({ email: z.email(), operator: z.string().min(3), reason: z.string().min(10) }).parse({ email, operator, reason });
const db = getDb();
try {
  await db.$transaction(async tx => {
    const user = await tx.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user?.emailVerified || !user.twoFactorEnabled) throw new Error("Existing verified account with enrolled MFA required.");
    const existing = await tx.roleAssignment.findUnique({ where: { userId_role: { userId: user.id, role: "ADMIN" } } });
    if (existing) throw new Error("Administrator already provisioned; no change made.");
    await tx.roleAssignment.create({ data: { userId: user.id, role: "ADMIN" } });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.auditLog.create({ data: { subjectId: user.id, action: "ADMIN_PROVISIONED_LOCALLY", reason: `${input.operator}: ${input.reason}` } });
  });
  console.log("Administrator provisioned and existing sessions revoked. Log in again with MFA.");
} finally { await db.$disconnect(); }
}

main().catch(() => {
  console.error("Provisioning refused. Check local configuration, verified email, MFA enrollment and whether the account already has ADMIN access.");
  process.exitCode = 1;
});

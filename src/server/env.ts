import "server-only";
import { z } from "zod";
import { assertLocalDatabase, assertLocalHttp } from "../../scripts/local-safety.mjs";

export function getEnv() {
  const result = z.object({
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    SMTP_HOST: z.enum(["localhost", "127.0.0.1"]),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535),
    MAIL_FROM: z.string().min(1),
  }).safeParse(process.env);
  if (!result.success) throw new Error("Local authentication configuration is incomplete. Follow docs/KILIRIDE_LOCAL_SETUP.md.");
  assertLocalDatabase(result.data.DATABASE_URL);
  assertLocalHttp(result.data.BETTER_AUTH_URL);
  if (result.data.BETTER_AUTH_SECRET.startsWith("REPLACE")) throw new Error("Generate a local authentication secret.");
  return result.data;
}

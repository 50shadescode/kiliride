import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "./env";

const globalDb = globalThis as unknown as { kilirideDb?: PrismaClient };

export function getDb() {
  if (!globalDb.kilirideDb) {
    const adapter = new PrismaPg(getEnv().database);
    globalDb.kilirideDb = new PrismaClient({ adapter });
  }
  return globalDb.kilirideDb;
}

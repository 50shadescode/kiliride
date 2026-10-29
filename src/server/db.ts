import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "./env";

const globalDb = globalThis as unknown as { kilirideDb?: PrismaClient };

export function getDb() {
  if (!globalDb.kilirideDb) {
    const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL, max: 5 });
    globalDb.kilirideDb = new PrismaClient({ adapter });
  }
  return globalDb.kilirideDb;
}

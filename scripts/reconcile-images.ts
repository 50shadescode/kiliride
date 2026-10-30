import "dotenv/config";
import { assertLocalDatabase } from "./local-safety.mjs";
import { getDb } from "../src/server/db";
import { photos } from "../src/server/images/service";
async function main() {
  const target = process.argv[2];
  if (target !== "dev" && target !== "test") throw new Error("Specify dev or test.");
  process.env.DATABASE_URL = assertLocalDatabase(target === "test" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL, target === "test");
  if (target === "dev" && new URL(process.env.DATABASE_URL!).pathname !== "/kiliride_dev") throw new Error("Development target mismatch");
  try {
    const result = await photos().reconcile();
    console.log(result);
    if (result.failed) process.exitCode = 1;
  } finally { await getDb().$disconnect(); }
}
main().catch(() => { console.error("Image reconciliation failed. Check local database/storage configuration and retry."); process.exitCode = 1; });

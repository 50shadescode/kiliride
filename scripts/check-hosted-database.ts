// Explicit operator tool; never loads local .env or runs automatically.
import { Pool } from "pg";
import { parseRuntimeEnv } from "../src/server/runtime-config";
import { assertRuntimeDatabaseIdentity, runtimeIdentityQuery, type RuntimeDatabaseIdentity } from "../src/server/database-role";
async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== "--authorized-read-only") throw new Error("Explicit hosted read-only verification authorization is required.");
  const env = parseRuntimeEnv(process.env);
  if (!env.hosted) throw new Error("Hosted configuration is required.");
  const pool = new Pool(env.database);
  try {
    const result = await pool.query<RuntimeDatabaseIdentity>(runtimeIdentityQuery);
    assertRuntimeDatabaseIdentity(result.rows[0], env.database.database!, env.database.user!);
    console.log("PASS: hosted runtime database identity and inspected privilege boundaries.");
  } finally { await pool.end(); }
}
main().catch(() => { console.error("Hosted database verification failed; configuration, connectivity or privileges require operator review. Details redacted."); process.exitCode = 1; });

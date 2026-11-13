import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { assertLocalDatabase } from "../../scripts/local-safety.mjs";
import { assertRuntimeDatabaseIdentity, runtimeIdentityQuery, type RuntimeDatabaseIdentity } from "../../src/server/database-role";

test("read-only runtime privilege inspection rejects the isolated bootstrap database role", async () => {
  const pool = new Pool({ connectionString: assertLocalDatabase(process.env.DATABASE_URL, true) });
  try {
    const { rows } = await pool.query<RuntimeDatabaseIdentity>(runtimeIdentityQuery);
    assert.equal(rows[0].database, "kiliride_test");
    // Docker's bootstrap role is deliberately privileged, not a hosted app role.
    assert.equal(rows[0].unsafe_role, true);
    assert.throws(() => assertRuntimeDatabaseIdentity(rows[0], "kiliride_test", rows[0].username), /privilege check failed/);
  } finally { await pool.end(); }
});

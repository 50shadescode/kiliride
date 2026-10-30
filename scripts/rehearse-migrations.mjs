import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';
import { assertLocalDatabase } from './local-safety.mjs';

const url = new URL(assertLocalDatabase(process.env.TEST_DATABASE_URL, true));
const control = new Pool({ connectionString: url.href, max: 1 });
const name = `kiliride_rehearsal_${randomUUID().replaceAll('-', '')}`;
let target;
try {
  // CREATE DATABASE deliberately fails on collision; no reset, drop or reuse.
  assert.match(name, /^kiliride_rehearsal_[a-f0-9]{32}$/);
  await control.query(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  target = new Pool({ connectionString: url.href, max: 1 });
  const initial = await target.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(initial.rowCount, 0);
  console.log(`Fresh disposable target: 127.0.0.1:55433/${name}; public tables: 0`);
  const migrate = command => {
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', command, '--config', 'scripts/rehearsal.prisma.config.ts'], {
      env: { ...process.env, REHEARSAL_DATABASE_URL: url.href }, stdio: 'inherit',
    });
    assert.equal(result.status, 0, `Prisma migrate ${command} failed`);
  };
  migrate('deploy');
  const history = await target.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name');
  migrate('deploy');
  migrate('status');
  const repeated = await target.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name');
  assert.deepEqual(repeated.rows, history.rows);
  const expected = readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  assert.deepEqual(history.rows.map(row => row.migration_name), expected);
  for (const migration of history.rows) {
    assert.ok(migration.finished_at);
    assert.equal(migration.rolled_back_at, null);
    assert.equal(migration.checksum, createHash('sha256').update(readFileSync(`prisma/migrations/${migration.migration_name}/migration.sql`)).digest('hex'));
  }
  const tables = await target.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(tables.rowCount, 16);
  const triggers = await target.query("SELECT tgname FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname");
  assert.deepEqual(triggers.rows.map(row => row.tgname), ['audit_immutable', 'legacy_import_immutable', 'user_customer_role', 'vehicle_event_immutable', 'vehicle_listing_guard', 'vehicle_ownership_guard', 'vehicle_ownership_no_delete', 'vehicle_review_guard', 'vehicle_review_immutable']);
  // Exercise the migrated role trigger without retaining fixture data.
  const connection = await target.connect();
  try {
    await connection.query('BEGIN');
    const user = await connection.query('INSERT INTO "User" (name,email,"updatedAt") VALUES ($1,$2,now()) RETURNING id', ['Migration probe', `${randomUUID()}@kiliride.test`]);
    const roles = await connection.query('SELECT role FROM "RoleAssignment" WHERE "userId" = $1', [user.rows[0].id]);
    assert.deepEqual(roles.rows.map(row => row.role), ['CUSTOMER']);
  } finally { await connection.query('ROLLBACK'); connection.release(); }
  console.log('PASS: clean migrations, repeat no-op, status, SQL checksums, 16 tables, nine triggers and CUSTOMER probe.');
  console.log(`Disposable database retained for inspection: ${name}. Existing databases were not migrated or reset.`);
} finally {
  await target?.end();
  await control.end();
}

// Synthetic-only coordinated recovery. Creates new databases/directories; never
// accepts an existing destination or uses a remote storage endpoint.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import sharp from "sharp";
import { assertLocalDatabase } from "./local-safety.mjs";
import { createS3Storage, assertImageKey } from "../src/server/images/s3";
import { storageConfig } from "../src/server/images/config";
import { verifyImageManifest, type ImageManifest } from "../src/server/images/recovery";
import { syntheticS3, syntheticStorageEnv } from "../tests/helpers/s3";
import { createRecoveryDirectory, recoveryDiagnostic, requireRecoverySubprocess } from "./recovery-diagnostics";

let stage = "validate-local-configuration";
let artifactDirectory: string | undefined;

async function main() {
  const started = Date.now();
  const url = new URL(assertLocalDatabase(process.env.TEST_DATABASE_URL, true));
  const control = new Pool({ connectionString: url.href, max: 1 });
  const sourceName = `kiliride_rehearsal_${randomUUID().replaceAll("-", "")}`, targetName = `kiliride_rehearsal_${randomUUID().replaceAll("-", "")}`;
  const root = path.resolve("backups", `release003-recovery-${randomUUID()}`);
  stage = "create-artifact-directory";
  await createRecoveryDirectory(root);
  artifactDirectory = root;
  stage = "initialize-synthetic-object-storage";
  async function newDisk(label: string) {
    const dir = path.join(root, label); await mkdir(dir, { mode: 0o700 });
    return { async put(key: string, bytes: Buffer) { assertImageKey(key); await writeFile(path.join(dir, key), bytes, { flag: "wx", mode: 0o600 }); },
      async get(key: string) { assertImageKey(key); return readFile(path.join(dir, key)); },
      async remove() { throw new Error("Recovery drill never deletes source objects."); }, async inventory() { return readdir(dir); } };
  }
  const sourceDisk = await newDisk("source-objects"), backupDisk = await newDisk("backup-objects"), restoredDisk = await newDisk("restored-objects");
  const fixture = syntheticS3(sourceDisk), config = storageConfig(syntheticStorageEnv, "staging")!, sourceStorage = createS3Storage(config, fixture.client);
  let source: Pool | undefined, restored: Pool | undefined;
  function docker(args: string[], input?: Buffer) {
    const result = spawnSync("docker", ["compose", "exec", "-T", "postgres-test", ...args], { input, maxBuffer: 32 * 1024 * 1024, timeout: 120000 });
    requireRecoverySubprocess(args[0], result);
    return result.stdout;
  }
  try {
    stage = "create-fresh-databases";
    for (const name of [sourceName, targetName]) { assert.match(name, /^kiliride_rehearsal_[a-f0-9]{32}$/); await control.query(`CREATE DATABASE "${name}"`); }
    url.pathname = `/${sourceName}`; source = new Pool({ connectionString: url.href });
    stage = "migrate-fresh-source";
    const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", "scripts/rehearsal.prisma.config.ts"], { env: { ...process.env, REHEARSAL_DATABASE_URL: url.href }, encoding: "utf8", timeout: 120000 });
    requireRecoverySubprocess("prisma-migrate-deploy", migration);
    stage = "verify-empty-target";
    url.pathname = `/${targetName}`; restored = new Pool({ connectionString: url.href });
    assert.equal((await restored.query("SELECT * FROM pg_tables WHERE schemaname='public'")).rowCount, 0);
    stage = "seed-synthetic-records-and-images";
    const user = (await source.query('INSERT INTO "User" (name,email,"updatedAt") VALUES ($1,$2,now()) RETURNING id', ["Synthetic recovery actor", `recovery-${randomUUID()}@kiliride.test`])).rows[0];
    const vehicle = (await source.query('INSERT INTO "Vehicle" ("publicId",make,model,category,seats,"fuelType",transmission,location,"baseHalfDay","baseFullDay","updatedAt") VALUES ($1,\'Synthetic\',\'Recovery\',\'Test\',5,\'Petrol\',\'Automatic\',\'Test\',2500,3500,now()) RETURNING id', [`vehicle-${randomUUID()}`])).rows[0];
    for (let i = 0; i < 2; i++) {
      const key = `${randomUUID()}.webp`, bytes = await sharp({ create: { width: 20, height: 20, channels: 3, background: i ? "green" : "blue" } }).webp().toBuffer();
      await sourceStorage.put(key, bytes);
      await source.query('INSERT INTO "VehicleImageObject" (key,state,sha256,"byteSize",width,height) VALUES ($1,\'ACTIVE\',$2,$3,20,20)', [key, createHash("sha256").update(bytes).digest("hex"), bytes.length]);
      await source.query('INSERT INTO "VehiclePhoto" ("vehicleId","uploadedById","storageKey","objectKey","contentType","byteSize","altText",position,"isCover") VALUES ($1,$2,$3,$3,\'image/webp\',$4,\'Synthetic recovery pixels\',$5,$6)', [vehicle.id, user.id, key, bytes.length, i, i === 0]);
    }
    // No writers or cleanup run during this coordinated checkpoint.
    stage = "capture-image-checkpoint";
    const manifest = (await source.query('SELECT * FROM "VehicleImageObject" ORDER BY key')).rows as ImageManifest;
    for (const row of manifest) await backupDisk.put(row.key, await sourceStorage.get(row.key));
    stage = "pg-dump";
    const dump = docker(["pg_dump", "-U", "kiliride", "-Fc", sourceName]);
    stage = "persist-checkpoint";
    await writeFile(path.join(root, "database.dump"), dump, { flag: "wx", mode: 0o600 });
    const checkpoint = { sourceName, targetName, timestamp: new Date().toISOString(), dumpSha256: createHash("sha256").update(dump).digest("hex"), manifest };
    await writeFile(path.join(root, "manifest.json"), JSON.stringify(checkpoint, null, 2), { flag: "wx", mode: 0o600 });
    stage = "pg-restore";
    docker(["pg_restore", "-U", "kiliride", "--exit-on-error", "--single-transaction", "-d", targetName], dump);
    stage = "verify-restored-manifest";
    const recoveredManifest = (await restored.query('SELECT * FROM "VehicleImageObject" ORDER BY key')).rows as ImageManifest;
    assert.deepEqual(recoveredManifest, manifest);
    // Missing/corrupt/unknown are reported, not repaired or deleted implicitly.
    stage = "verify-negative-integrity-probes";
    assert.equal((await verifyImageManifest(recoveredManifest, [], restoredDisk)).missingOrCorrupt.length, 2);
    const badStore = { ...restoredDisk, async get() { return Buffer.from("corrupted synthetic bytes"); } };
    assert.equal((await verifyImageManifest(recoveredManifest, ["unknown-object"], badStore)).missingOrCorrupt.length, 2);
    assert.deepEqual((await verifyImageManifest([], ["unknown-object"], badStore)).unknown, ["unknown-object"]);
    stage = "restore-image-copies";
    for (const row of recoveredManifest) await restoredDisk.put(row.key, await backupDisk.get(row.key));
    // A new SDK client over the independent recovered object directory proves
    // no process cache/source storage is necessary to read recovered bytes.
    const recoveredFixture = syntheticS3(restoredDisk), recoveredStorage = createS3Storage(config, recoveredFixture.client);
    stage = "verify-restarted-image-reads";
    const verified = await verifyImageManifest(recoveredManifest, await restoredDisk.inventory(), recoveredStorage);
    assert.deepEqual(verified, { verified: 2, missingOrCorrupt: [], unknown: [], pending: 0 });
    const tables = (await source.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
    for (const { tablename } of tables) {
      assert.match(tablename, /^[A-Za-z_]+$/);
      stage = `compare-table-${tablename}`;
      const query = `SELECT to_jsonb(t) AS row FROM "${tablename}" t ORDER BY to_jsonb(t)::text`;
      assert.deepEqual((await restored.query(query)).rows, (await source.query(query)).rows);
    }
    stage = "verify-cover-order-and-triggers";
    const photos = (await restored.query('SELECT position,"isCover" FROM "VehiclePhoto" ORDER BY position')).rows;
    assert.deepEqual(photos, [{ position: 0, isCover: true }, { position: 1, isCover: false }]);
    const triggers = (await restored.query("SELECT tgname FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname")).rows;
    assert.equal(triggers.length, 18);
    recoveredFixture.client.destroy();
    console.log(JSON.stringify({ result: "PASS", tables: tables.length, triggers: triggers.length, images: verified.verified, elapsedMs: Date.now() - started, sourceName, targetName, artifactDirectory: path.relative(process.cwd(), root), hostedRecovery: "PENDING" }));
  } finally { fixture.client.destroy(); await source?.end(); await restored?.end(); await control.end(); }
}
main().catch(async error => {
  const diagnostic = recoveryDiagnostic(stage, error);
  console.error(JSON.stringify(diagnostic));
  if (artifactDirectory) {
    try { await writeFile(path.join(artifactDirectory, "failure.json"), JSON.stringify(diagnostic, null, 2), { flag: "wx", mode: 0o600 }); }
    catch { console.error("Sanitized failure artifact could not be written; original failure remains fatal."); }
  }
  process.exitCode = 1;
});

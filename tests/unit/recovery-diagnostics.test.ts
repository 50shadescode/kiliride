import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createRecoveryDirectory, sanitizeRecoveryText, recoveryDiagnostic, requireRecoverySubprocess } from "../../scripts/recovery-diagnostics";

test("recovery creates missing backup parent but never reuses a run or overwrites artifacts", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "kiliride-recovery-test-"));
  const root = path.join(workspace, "backups", "run-one");
  await createRecoveryDirectory(root);
  await writeFile(path.join(root, "retained.txt"), "original diagnostic", { flag: "wx" });
  await assert.rejects(createRecoveryDirectory(root), { code: "EEXIST" });
  await createRecoveryDirectory(path.join(workspace, "backups", "run-two"));
  assert.equal(await readFile(path.join(root, "retained.txt"), "utf8"), "original diagnostic");
});
test("diagnostics preserve stage, OS error and subprocess failure while redacting sensitive data", () => {
  const env = { DATABASE_URL: "postgresql://user:p%40ssword@localhost/db", STORAGE_SECRET_ACCESS_KEY: "synthetic-private-value" };
  const text = sanitizeRecoveryText(`failed ${env.DATABASE_URL} p@ssword p%40ssword synthetic-private-value https://host/reset?token=unknown\nAuthorization: Bearer unknown\npassword=unknown`, env);
  for (const value of ["p@ssword", "p%40ssword", "synthetic-private-value", "unknown", "postgresql://"]) assert.equal(text.includes(value), false);
  const osError = Object.assign(new Error("missing directory"), { code: "ENOENT", syscall: "mkdir" });
  assert.equal(recoveryDiagnostic("create-artifact-directory", osError).error.code, "ENOENT");
  for (const result of [
    { status: 7, signal: null, stderr: "pg_restore: checksum failed https://host/secret" },
    { status: null, signal: "SIGTERM", stderr: "", error: Object.assign(new Error("spawn timed out"), { code: "ETIMEDOUT" }) },
    { status: null, signal: null, stderr: "", error: Object.assign(new Error("missing docker"), { code: "ENOENT" }) },
  ]) {
    assert.throws(() => requireRecoverySubprocess("pg_restore", result), error => {
      const diagnostic = recoveryDiagnostic("pg-restore", error);
      assert.equal(diagnostic.result, "FAIL"); assert.equal(diagnostic.stage, "pg-restore");
      assert.equal(diagnostic.subprocess?.exitCode, result.status);
      assert.equal(diagnostic.subprocess?.signal, result.signal);
      assert.equal(JSON.stringify(diagnostic).includes("https://host/secret"), false);
      return true;
    });
  }
  requireRecoverySubprocess("pg_dump", { status: 0, signal: null, stderr: "" });
  try { assert.deepEqual({ token: "private-actual" }, { token: "private-expected" }); }
  catch (error) { assert.equal(JSON.stringify(recoveryDiagnostic("compare-table-Session", error)).includes("private-"), false); }
});
test("actual rehearsal filesystem failure reports its stage, preserves artifacts and exits nonzero", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "kiliride-recovery-failure-"));
  await writeFile(path.join(workspace, "backups"), "retained conflicting artifact", { flag: "wx" });
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", pathToFileURL(path.resolve("node_modules/tsx/dist/loader.mjs")).href, path.resolve("scripts/rehearse-image-recovery.ts")], {
    cwd: workspace, env: { ...process.env, TEST_DATABASE_URL: "postgresql://synthetic:synthetic@127.0.0.1:55433/kiliride_test" }, encoding: "utf8", timeout: 15000,
  });
  assert.equal(result.status, 1);
  const line = result.stderr.split("\n").find(line => line.startsWith('{"result":"FAIL"'));
  assert.ok(line); const diagnostic = JSON.parse(line);
  assert.equal(diagnostic.stage, "create-artifact-directory");
  assert.ok(["EEXIST", "ENOTDIR"].includes(diagnostic.error.code));
  assert.equal(result.stdout.includes('"result":"PASS"'), false);
  assert.equal(await readFile(path.join(workspace, "backups"), "utf8"), "retained conflicting artifact");
});

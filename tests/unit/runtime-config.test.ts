import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { getCookies } from "better-auth/cookies";
import { assertRuntimeDatabaseIdentity } from "../../src/server/database-role";
import { syntheticStorageEnv } from "../helpers/s3";
import { parseRuntimeEnv, authSecurityOptions, authRequestAllowed, hostedMigrationUrl, identityDeliveryAllowed } from "../../src/server/runtime-config";

const local = {
  NODE_ENV: "development", KILIRIDE_ENV: "development", DATABASE_URL: "postgresql://local:synthetic@127.0.0.1:55432/kiliride_dev",
  BETTER_AUTH_SECRET: "synthetic-local-secret-for-config-tests-only", BETTER_AUTH_URL: "http://localhost:3000",
  SMTP_HOST: "127.0.0.1", SMTP_PORT: "11025", MAIL_FROM: "KiliRide <noreply@kiliride.test>",
};
const hosted = {
  ...syntheticStorageEnv,
  ...local, NODE_ENV: "production" as const, KILIRIDE_ENV: "staging", DB_ENVIRONMENT: "staging",
  DATABASE_URL: "postgresql://app_runtime:synthetic-db-password@db.provider.example:5432/pilot_staging",
  DB_EXPECTED_HOST: "db.provider.example", DB_EXPECTED_NAME: "pilot_staging", DB_EXPECTED_USER: "app_runtime",
  BETTER_AUTH_URL: "https://staging.kiliride.example", SMTP_HOST: "smtp.provider.example", SMTP_PORT: "587",
  SMTP_TLS: "starttls", SMTP_USER: "synthetic-user", SMTP_PASSWORD: "synthetic-password", SMTP_DELIVERY_ENABLED: "false", KILIRIDE_DB_CATALOGUE: "false",
};
test("runtime modes keep local/test database isolation and forbid implicit production fallback", () => {
  assert.equal(parseRuntimeEnv(local).hosted, false);
  assert.equal(parseRuntimeEnv({ ...local, KILIRIDE_ENV: "test", DATABASE_URL: "postgresql://local:synthetic@127.0.0.1:55433/kiliride_test" }).mode, "test");
  for (const override of [
    { KILIRIDE_ENV: "test" }, { DATABASE_URL: "postgresql://local:synthetic@127.0.0.1:55433/kiliride_test" },
    { DATABASE_URL: hosted.DATABASE_URL }, { NODE_ENV: "production" }, { NODE_ENV: "production", KILIRIDE_ENV: undefined },
    { SMTP_HOST: "smtp.provider.example" }, { BETTER_AUTH_URL: "https://remote.example" }, { SMTP_USER: "unexpected" },
  ]) assert.throws(() => parseRuntimeEnv({ ...local, ...override }), /Invalid KiliRide/);
});
test("hosted configuration rejects missing secrets, unsafe origins, environment swaps and overrides without leaking values", () => {
  assert.equal(parseRuntimeEnv(hosted).mode, "staging");
  assert.equal(parseRuntimeEnv({ ...hosted, KILIRIDE_ENV: "production", DB_ENVIRONMENT: "production", STORAGE_ENVIRONMENT: "production", STORAGE_BUCKET: "synthetic-kiliride-production", STORAGE_EXPECTED_BUCKET: "synthetic-kiliride-production", STORAGE_PREFIX: "production/vehicle-images/" }).mode, "production");
  for (const key of ["BETTER_AUTH_SECRET", "DATABASE_URL", "DB_EXPECTED_HOST", "DB_EXPECTED_NAME", "DB_EXPECTED_USER", "DB_ENVIRONMENT", "SMTP_PASSWORD", "SMTP_TLS", "SMTP_DELIVERY_ENABLED", "KILIRIDE_DB_CATALOGUE"]) {
    assert.throws(() => parseRuntimeEnv({ ...hosted, [key]: undefined }), /^Error: Invalid KiliRide runtime configuration/);
  }
  for (const override of [
    { BETTER_AUTH_URL: "http://staging.kiliride.example" }, { BETTER_AUTH_URL: "https://localhost" },
    { BETTER_AUTH_URL: "https://staging.kiliride.example/other" }, { BETTER_AUTH_URL: "https://staging.kiliride.example?query=token" },
    { DATABASE_URL: hosted.DATABASE_URL + "?sslmode=disable" }, { DB_ENVIRONMENT: "production" }, { DB_EXPECTED_NAME: "other_db" },
    { DB_EXPECTED_USER: "migration_owner" }, { DATABASE_URL: local.DATABASE_URL }, { TEST_DATABASE_URL: local.DATABASE_URL },
    { MAILPIT_URL: "http://localhost:18025" }, { MIGRATION_DATABASE_URL: hosted.DATABASE_URL }, { KILIRIDE_DB_CATALOGUE: "true" },
    { NODE_TLS_REJECT_UNAUTHORIZED: "0" }, { DB_POOL_MAX: "100" }, { SMTP_PASSWORD: "REPLACE" },
  ]) assert.throws(() => parseRuntimeEnv({ ...hosted, ...override }), error => error instanceof Error && error.message === "Invalid KiliRide runtime configuration. Check the server environment contract.");
});
test("hosted PostgreSQL verifies TLS, bounds pooling and separates runtime/migration identities", () => {
  const env = parseRuntimeEnv(hosted);
  assert.deepEqual(env.database.ssl, { rejectUnauthorized: true, minVersion: "TLSv1.2" });
  assert.equal(env.database.connectionString, undefined); assert.equal(env.database.max, 5);
  assert.equal(env.database.connectionTimeoutMillis, 5000); assert.equal(env.database.statement_timeout, 15000);
  const migration = { KILIRIDE_ENV: "staging", DB_ENVIRONMENT: "staging", DB_EXPECTED_HOST: hosted.DB_EXPECTED_HOST,
    DB_EXPECTED_NAME: hosted.DB_EXPECTED_NAME, DB_EXPECTED_USER: "app_runtime", DB_MIGRATION_USER: "migration_owner",
    MIGRATION_DATABASE_URL: hosted.DATABASE_URL.replace("app_runtime", "migration_owner") };
  assert.equal(new URL(hostedMigrationUrl(migration)).searchParams.get("sslmode"), "verify-full");
  for (const override of [{ DATABASE_URL: hosted.DATABASE_URL }, { DB_MIGRATION_USER: "app_runtime" }, { DB_ENVIRONMENT: "production" },
    { MIGRATION_DATABASE_URL: migration.MIGRATION_DATABASE_URL + "?sslmode=disable" }]) assert.throws(() => hostedMigrationUrl({ ...migration, ...override }));
});
test("runtime database identity gate rejects elevated roles, ownership, schema creation and swapped databases", () => {
  const identity = { database: "pilot_staging", username: "app_runtime", unsafe_role: false, owns_objects: false, can_create: false };
  assertRuntimeDatabaseIdentity(identity, "pilot_staging", "app_runtime");
  for (const change of [{ database: "pilot_production" }, { username: "migration_owner" }, { unsafe_role: true }, { owns_objects: true }, { can_create: true }]) {
    assert.throws(() => assertRuntimeDatabaseIdentity({ ...identity, ...change }, "pilot_staging", "app_runtime"));
  }
});
test("hosted cookie generation and request origin checks do not trust proxy authority", () => {
  const env = parseRuntimeEnv(hosted), advanced = authSecurityOptions(env);
  const cookie = getCookies({ baseURL: env.BETTER_AUTH_URL, advanced }).sessionToken;
  assert.equal(cookie.attributes.secure, true); assert.equal(cookie.attributes.httpOnly, true);
  assert.equal(cookie.attributes.sameSite, "lax"); assert.equal(cookie.attributes.domain, undefined);
  assert.match(cookie.name, /^__Secure-/); assert.equal(advanced.trustedProxyHeaders, false);
  assert.deepEqual(advanced.ipAddress?.ipAddressHeaders, []);
  const url = env.BETTER_AUTH_URL + "/api/auth/sign-in/email";
  assert.equal(authRequestAllowed(new Request(url, { method: "POST", headers: { origin: env.BETTER_AUTH_URL } }), env), true);
  const rejectedHeaders: Record<string, string>[] = [{}, { origin: "https://attacker.example" }, { origin: env.BETTER_AUTH_URL, "x-forwarded-host": "attacker.example" },
    { origin: env.BETTER_AUTH_URL, host: "attacker.example" }, { origin: env.BETTER_AUTH_URL, "x-forwarded-proto": "http" }];
  for (const headers of rejectedHeaders) {
    assert.equal(authRequestAllowed(new Request(url, { method: "POST", headers }), env), false);
  }
  assert.equal(authRequestAllowed(new Request(url.replace("https:", "http:")), env), false);
  assert.equal(authRequestAllowed(new Request(env.BETTER_AUTH_URL + "/api/auth/verify-email?token=synthetic"), env), true);
});
test("hosted SMTP requires authentication and TLS; staging delivery is explicitly authorized and allowlisted", () => {
  const env = parseRuntimeEnv(hosted);
  assert.equal(env.smtp.secure, false); assert.equal(env.smtp.requireTLS, true); assert.equal(env.smtp.ignoreTLS, false);
  assert.deepEqual(env.smtp.auth, { user: "synthetic-user", pass: "synthetic-password" });
  assert.equal(env.smtp.tls?.rejectUnauthorized, true); assert.equal(env.smtp.logger, false); assert.equal(env.smtp.debug, false);
  assert.equal(parseRuntimeEnv({ ...hosted, SMTP_TLS: "implicit", SMTP_PORT: "465" }).smtp.secure, true);
  for (const override of [{ SMTP_PORT: "25" }, { SMTP_TLS: "none" }, { SMTP_USER: "" }, { SMTP_HOST: "localhost" }, { SMTP_DELIVERY_ENABLED: "true" }]) assert.throws(() => parseRuntimeEnv({ ...hosted, ...override }));
  const allowed = parseRuntimeEnv({ ...hosted, SMTP_DELIVERY_ENABLED: "true", SMTP_ALLOWED_RECIPIENTS: "authorized@example.org" });
  const link = env.BETTER_AUTH_URL + "/api/auth/verify-email?token=synthetic";
  assert.equal(identityDeliveryAllowed(env, "authorized@example.org", link), false);
  assert.equal(identityDeliveryAllowed(allowed, "authorized@example.org", link), true);
  assert.equal(identityDeliveryAllowed(allowed, "other@example.org", link), false);
  assert.equal(identityDeliveryAllowed(allowed, "authorized@example.org", "https://attacker.example/reset"), false);
  assert.equal(parseRuntimeEnv(local).smtp.ignoreTLS, true);
});
test("startup hook rejects missing hosted secret before opening database or sending mail", () => {
  const output = execFileSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", `
    import('./src/instrumentation.ts').then(async module => {
      const register = module.register ?? module.default.register;
      try { await register(); process.exitCode=1; }
      catch (error) { if (!error.message.startsWith('Invalid KiliRide runtime configuration.')) throw error; console.log('rejected'); }
    });
  `], { env: { ...process.env, ...hosted, NEXT_RUNTIME: "nodejs", NEXT_PHASE: "", BETTER_AUTH_SECRET: "" }, encoding: "utf8", timeout: 15000 });
  assert.match(output, /rejected/); assert.doesNotMatch(output, /synthetic-password|synthetic-db-password/);
});

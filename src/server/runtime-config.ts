// Pure validation/options for startup and offline tests; never import into clients.
import { z } from "zod";
import { isIP } from "node:net";
import type { PoolConfig } from "pg";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { assertLocalDatabase, assertLocalHttp } from "../../scripts/local-safety.mjs";
import { storageConfig } from "./images/config";
type Environment = Record<string, string | undefined>;
const error = () => new Error("Invalid KiliRide runtime configuration. Check the server environment contract.");
const required = z.string().trim().min(1);
const common = z.object({
  DATABASE_URL: required, BETTER_AUTH_SECRET: z.string().min(32), BETTER_AUTH_URL: z.url(),
  SMTP_HOST: required, SMTP_PORT: z.coerce.number().int().min(1).max(65535), MAIL_FROM: required,
});
function remoteHost(host: string) {
  return !isIP(host.replace(/^\[|\]$/g, "")) && host.includes(".") && /^[a-z0-9.-]+$/i.test(host) && !/(^|\.)(localhost|local|test|invalid)$/i.test(host);
}
export function hostedDatabaseUrl(raw: string, expectedHost: string, expectedName: string, expectedUser: string) {
  const url = new URL(raw);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !remoteHost(url.hostname) || url.search || url.hash ||
      url.hostname !== expectedHost || decodeURIComponent(url.pathname.slice(1)) !== expectedName || decodeURIComponent(url.username) !== expectedUser || !url.password ||
      !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(expectedName) || ["kiliride_dev", "kiliride_test", "postgres", "template0", "template1"].includes(expectedName) ||
      !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(expectedUser) || ["postgres", "kiliride"].includes(expectedUser)) throw error();
  return url;
}
export function parseRuntimeEnv(source: Environment) {
  try {
    const mode = z.enum(["development", "test", "staging", "production"]).parse(source.KILIRIDE_ENV ?? (source.NODE_ENV === "production" ? undefined : "development"));
    const hosted = mode === "staging" || mode === "production";
    if (source.NODE_ENV === "production" && !hosted) throw error();
    const base = common.parse(source);
    if (/^(REPLACE|CHANGE|EXAMPLE)/i.test(base.BETTER_AUTH_SECRET) || /[\r\n]/.test(base.MAIL_FROM)) throw error();
    const origin = new URL(base.BETTER_AUTH_URL);
    if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw error();
    let database: PoolConfig;
    let smtp: SMTPTransport.Options;
    let deliveryEnabled = true;
    let recipients: string[] = [];
    if (!hosted) {
      const db = new URL(assertLocalDatabase(base.DATABASE_URL, mode === "test"));
      if (mode === "development" && (db.pathname !== "/kiliride_dev" || db.port !== "55432")) throw error();
      assertLocalHttp(base.BETTER_AUTH_URL);
      if (!["localhost", "127.0.0.1"].includes(base.SMTP_HOST) || source.SMTP_USER || source.SMTP_PASSWORD || source.MIGRATION_DATABASE_URL) throw error();
      database = { connectionString: base.DATABASE_URL, max: 5 };
      smtp = { host: base.SMTP_HOST, port: base.SMTP_PORT, secure: false, ignoreTLS: true };
    } else {
      if (origin.protocol !== "https:" || !remoteHost(origin.hostname) || origin.port || source.KILIRIDE_DB_CATALOGUE !== "false" ||
          source.TEST_DATABASE_URL || source.MAILPIT_URL || source.MIGRATION_DATABASE_URL || source.NODE_TLS_REJECT_UNAUTHORIZED === "0") throw error();
      if (source.DB_ENVIRONMENT !== mode) throw error();
      const db = hostedDatabaseUrl(base.DATABASE_URL, required.parse(source.DB_EXPECTED_HOST), required.parse(source.DB_EXPECTED_NAME), required.parse(source.DB_EXPECTED_USER));
      if (/^(REPLACE|CHANGE|EXAMPLE)/i.test(decodeURIComponent(db.password))) throw error();
      const ca = source.DB_TLS_CA_PEM;
      if (ca && !ca.includes("-----BEGIN CERTIFICATE-----")) throw error();
      database = {
        host: db.hostname, port: Number(db.port || 5432), database: decodeURIComponent(db.pathname.slice(1)), user: decodeURIComponent(db.username), password: decodeURIComponent(db.password),
        ssl: { rejectUnauthorized: true, minVersion: "TLSv1.2", ...(ca ? { ca } : {}) },
        max: z.coerce.number().int().min(1).max(20).parse(source.DB_POOL_MAX ?? "5"),
        connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 15000, application_name: `kiliride-${mode}`,
      };
      const tls = z.enum(["implicit", "starttls"]).parse(source.SMTP_TLS);
      if (!remoteHost(base.SMTP_HOST) || base.SMTP_PORT !== (tls === "implicit" ? 465 : 587)) throw error();
      if (!/^(?:[^<>\r\n]+ <)?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/.test(base.MAIL_FROM)) throw error();
      smtp = { host: base.SMTP_HOST, port: base.SMTP_PORT, secure: tls === "implicit", requireTLS: true, ignoreTLS: false,
        auth: { user: required.parse(source.SMTP_USER), pass: required.parse(source.SMTP_PASSWORD) },
        tls: { rejectUnauthorized: true, minVersion: "TLSv1.2", servername: base.SMTP_HOST } };
      if (/^(REPLACE|CHANGE|EXAMPLE)/i.test(source.SMTP_PASSWORD!)) throw error();
      deliveryEnabled = z.enum(["true", "false"]).parse(source.SMTP_DELIVERY_ENABLED) === "true";
      recipients = source.SMTP_ALLOWED_RECIPIENTS?.split(",").map(v => z.email().parse(v.trim()).toLowerCase()) ?? [];
      if (mode === "staging" && deliveryEnabled && !recipients.length) throw error();
    }
    return { ...base, BETTER_AUTH_URL: origin.origin, mode, hosted, database, storage: storageConfig(source, mode),
      smtp: { ...smtp, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true } satisfies SMTPTransport.Options,
      deliveryEnabled, recipients };
  } catch { throw error(); }
}
export type RuntimeConfig = ReturnType<typeof parseRuntimeEnv>;
export function identityDeliveryAllowed(env: RuntimeConfig, to: string, link: string) {
  try { return env.deliveryEnabled && (!env.recipients.length || env.recipients.includes(to.toLowerCase())) && new URL(link).origin === env.BETTER_AUTH_URL; }
  catch { return false; }
}
export function hostedMigrationUrl(source: Environment) {
  try {
    if (!["staging", "production"].includes(source.KILIRIDE_ENV ?? "") || source.DB_ENVIRONMENT !== source.KILIRIDE_ENV ||
        source.DATABASE_URL || source.TEST_DATABASE_URL || source.NODE_TLS_REJECT_UNAUTHORIZED === "0" ||
        !source.DB_EXPECTED_USER || source.DB_MIGRATION_USER === source.DB_EXPECTED_USER) throw error();
    const url = hostedDatabaseUrl(required.parse(source.MIGRATION_DATABASE_URL), required.parse(source.DB_EXPECTED_HOST), required.parse(source.DB_EXPECTED_NAME), required.parse(source.DB_MIGRATION_USER));
    url.searchParams.set("sslmode", "verify-full");
    if (source.DB_MIGRATION_TLS_CA_FILE) url.searchParams.set("sslrootcert", source.DB_MIGRATION_TLS_CA_FILE);
    return url.href;
  } catch { throw error(); }
}
export function authSecurityOptions(env: RuntimeConfig) {
  return { useSecureCookies: env.hosted, trustedProxyHeaders: false,
    defaultCookieAttributes: { secure: env.hosted, httpOnly: true, sameSite: "lax" as const, path: "/" },
    crossSubDomainCookies: { enabled: false }, ...(env.hosted ? { ipAddress: { ipAddressHeaders: [] as string[] } } : {}) };
}
export function authRequestAllowed(request: Request, env: RuntimeConfig) {
  if (!env.hosted) return true;
  const canonical = new URL(env.BETTER_AUTH_URL);
  if (new URL(request.url).origin !== canonical.origin) return false;
  for (const name of ["host", "x-forwarded-host"]) if (request.headers.has(name) && request.headers.get(name) !== canonical.host) return false;
  if (request.headers.has("x-forwarded-proto") && request.headers.get("x-forwarded-proto") !== "https") return false;
  const origin = request.headers.get("origin");
  return request.method === "POST" ? origin === canonical.origin : !origin || origin === canonical.origin;
}

# Hosted runtime contract (B03)

Configuration support only; no provider provisioned, credentials supplied, hosted connection/delivery verified, or deployment authorized. Keep B05/B06/B07 blocked. Existing local image adapter rejects remote DB targets; hosted photo operations are unavailable until B05. Real policies remain unauthorized and catalogue flag must be `false` in hosted modes.

## Separate environment manifests

Local `npm run dev` defaults to development for compatibility with existing generated `.env`. New local templates explicitly set `KILIRIDE_ENV=development`. The isolated runner sets `KILIRIDE_ENV=test` and exact 55433/kiliride_test. Development requires 55432/kiliride_dev; local HTTP and Mailpit are unchanged. NODE_ENV=production cannot use either local mode. Build may compile without hosted secrets; production configuration rejects invalid production configuration during server initialization, with instrumentation as defense in depth. Do not expose preview servers as hosted production.

Supply server-only secrets through the approved hosting secret store. Never prefix them NEXT_PUBLIC_, put them in next.config.env, commit values, or log config objects. Hosted runtime must not contain TEST_DATABASE_URL, MAILPIT_URL or MIGRATION_DATABASE_URL. Do not reuse development secrets, databases or SMTP credentials. The following is a **nonfunctional example**, not deployment configuration:

```dotenv
KILIRIDE_ENV=staging
DB_ENVIRONMENT=staging
DATABASE_URL=postgresql://app_runtime:REPLACE@db.provider.example:5432/approved_staging_db
DB_EXPECTED_HOST=db.provider.example
DB_EXPECTED_NAME=approved_staging_db
DB_EXPECTED_USER=app_runtime
DB_POOL_MAX=5
# Optional PEM CA certificate; inject actual newlines via secret management.
# DB_TLS_CA_PEM=...
BETTER_AUTH_URL=https://staging.kiliride.example
BETTER_AUTH_SECRET=REPLACE_WITH_DISTINCT_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
SMTP_HOST=smtp.provider.example
SMTP_PORT=587
SMTP_TLS=starttls
SMTP_USER=approved_smtp_identity
SMTP_PASSWORD=REPLACE
MAIL_FROM=KiliRide <noreply@kiliride.example>
SMTP_DELIVERY_ENABLED=false
# Required allowlist when enabling staging delivery; only explicitly authorized testers.
# SMTP_ALLOWED_RECIPIENTS=tester@approved.example
KILIRIDE_DB_CATALOGUE=false
```

Production uses `KILIRIDE_ENV=production`, `DB_ENVIRONMENT=production`, and its own approved origin/DB identity/credentials. Explicit host/name/user expectations detect swapped connection strings; they are not proof of provider ownership or isolation. Operator-reviewed manifests, separate databases/accounts and access controls remain required. Provider-independent DNS endpoints are accepted; IP/loopback/local/test endpoints, URL query overrides and default privileged usernames are rejected. DNS resolution/private-network isolation must be reviewed with the provider; configuration validation does not establish network reachability or ACLs.

## Authentication and proxy contract

Canonical origin must be HTTPS, without credentials, path/query/fragment or custom port. Better Auth uses a fixed baseURL and one trusted origin. Hosted cookies explicitly use Secure/HttpOnly/SameSite=Lax, path `/`, no cross-subdomain sharing. Existing verification, reset, MFA, roles and CSRF stay enabled. Auth HTTP requests must present canonical URL/Host; conflicting forwarded host/proto and foreign/missing POST Origin fail before processing. GET email callbacks remain possible; Better Auth validates callback destinations.

The hosting edge must enforce TLS and the canonical host, overwrite forwarded headers, prevent direct untrusted access to the origin, and supply the canonical HTTPS Request URL to Next. Better Auth never derives its origin from forwarded headers. Until a provider-specific verified client-IP boundary is approved, hosted auth uses no forwarded IP header: database-backed rate limits use a conservative shared bucket, not spoofable X-Forwarded-For identity. This can throttle legitimate users; approve edge rate limiting and client-IP integration before pilot traffic. Validate cookie attributes and reset/verification redirects through the actual proxy before claiming hosted readiness. HSTS/edge certificate/hostname settings remain operator prerequisites, not completed infrastructure.

## PostgreSQL and migrations

Runtime constructs pg options explicitly instead of allowing connection-string SSL options to replace validation. TLS verifies certificate/hostname with system roots or the supplied CA, minimum TLS 1.2. Pool defaults to 5, bounded 1–20; connect timeout 5s, idle timeout 30s, statement timeout 15s. One lazy process singleton is reused. Budget total replicas × pool size and provider connection limits; serverless/pooler behavior needs actual staging verification. No pool is constructed until a server service needs it. CLI scripts disconnect their own pools; do not disconnect the singleton per request.

Provision runtime login with CONNECT, schema USAGE and only required table DML/sequence privileges; no SUPERUSER, CREATEDB, CREATEROLE, REPLICATION, BYPASSRLS, schema CREATE, table ownership or privileged inherited membership. Application AuditLog insert permissions do not authorize UPDATE/DELETE; immutable SQL triggers stay intact. Migration owner owns schema/tables and alone performs DDL. Review default/public schema privileges and future default grants. Hosted identity is compared to explicit runtime user, but PostgreSQL role privileges cannot be inferred from a username: run and retain read-only role/grant/ownership inspection and attempted forbidden DDL/audit mutation in authorized staging before sign-off. Never grant migration membership to the runtime user.

`prisma.config.ts`, local migration runner, imports, reconciliation and rehearsals retain loopback guards. Separate `scripts/hosted.prisma.config.ts` reads **only explicitly supplied process variables**, never local .env. Its environment requires KILIRIDE_ENV, DB_ENVIRONMENT, DB_EXPECTED_HOST/NAME/USER, DB_MIGRATION_USER and MIGRATION_DATABASE_URL; runtime/test DATABASE_URL variables must be absent. Migration user must differ from runtime user; URLs cannot supply arbitrary query overrides. It adds sslmode=verify-full and optional DB_MIGRATION_TLS_CA_FILE as sslrootcert. Use a separately authorized operator job, reviewed backup and migration SQL. After authorization, status/deploy/status with `--config scripts/hosted.prisma.config.ts`, then repeat deploy must be no-op. No hosted CLI was executed in B03. Never reset or change applied migration files.

After separate authorization and injection of a real runtime manifest, `node --import tsx scripts/check-hosted-database.ts --authorized-read-only` checks current database/user, elevated memberships, public object ownership and schema/database CREATE privileges using catalog reads only. Errors are redacted. It does not provision roles, validate every table-level grant, or replace forbidden-mutation tests in staging. It was not run against hosted services in this task.

## Email

Uses existing Nodemailer, no new dependency/provider. Hosted SMTP requires credentials and verified TLS: `implicit` on 465 or mandatory `starttls` on 587. TLS validation cannot be disabled; debug/logging and file/URL content access are disabled. `SMTP_DELIVERY_ENABLED=false` prevents delivery and makes verification/recovery delivery unavailable rather than falsely successful. Enabling staging delivery additionally requires an exact email allowlist. No fallback to Mailpit. Real delivery is permitted only after operator authorizes the target settings/test recipients; this task sends only to local Mailpit. Errors are generic, never provider messages/tokens. Identity links must match the configured origin. Confirm sender/domain authorization, SPF/DKIM/DMARC, delivery/bounce handling, credential rotation and real recovery delivery externally before pilot use.

## Deployment preflight still pending

- Approved provider/region, canonical domain/TLS/proxy settings, secret ownership and rotation.
- Separate DB identities/roles and TLS trust, migrations/status/restore safety and pool capacity.
- Authorized SMTP account/sender, recipient allowlist and real verification/reset delivery.
- Actual secure-cookie/Origin/MFA tests through the host, client bundle/log secret scan, rate-limit review.
- Keep catalogue false, policy register empty and B05 storage unimplemented. No real inventory/evidence onboarding under this configuration task.

References used: [pg TLS configuration](https://node-postgres.com/features/ssl), [Nodemailer SMTP](https://nodemailer.com/smtp), [Next instrumentation startup hook](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation). Better Auth options/cookie behavior were checked against installed 1.7.14 source/types.

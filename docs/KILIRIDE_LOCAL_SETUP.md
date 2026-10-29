# Local Phase 1 setup and recovery

Local only. Do not use production connection strings. Runtime and migration guards accept only loopback hosts and databases named kiliride_dev or kiliride_test. Tests require kiliride_test. No fleet rows are migrated.

1. Use Node 24.14 or compatible supported Node 24, npm and Docker Desktop with Linux containers.
2. Install the lockfile with `npm ci` (Windows PowerShell: `npm.cmd ci`).
3. Run `npm run local:env` once. It creates an ignored .env with cryptographically generated database and authentication secrets, refuses overwrites and prints no secrets. Review .env.example for configuration names only.
4. Run `docker compose up -d --wait`. PostgreSQL development and test run in separate containers/volumes on 127.0.0.1:55432 and :55433. Mailpit SMTP/UI bind to 127.0.0.1:11025 and :18025. Do not expose these ports or use real personal data in Mailpit.
5. Run `npm run db:generate`, `npm run db:migrate`, then `npm run db:migrate:test`. These use migration deploy, not reset or force push. Repeating deploy must be a no-op.
6. Run `npm run dev`. Visit localhost:3000; open Mailpit at http://127.0.0.1:18025 for local verification/reset messages. No external email provider is contacted.

If Docker is stopped, start Docker Desktop first. If a port is occupied, stop and resolve the local conflict; do not point configuration at a remote database. Missing configuration should fail closed for auth while static public pages remain independent.

## Migration and backup discipline

Review versioned SQL before `db:migrate`. Do not use migrate reset, db push --force-reset, DROP DATABASE, or docker compose down -v. There are no production users to seed and no default privileged account. Default CUSTOMER assignment is a database trigger and is atomic with user creation.

Before changing existing local schema/data, make a backup inside the container without passing credentials on the command line:

```sh
docker compose exec -T postgres pg_dump -U kiliride -d kiliride_dev -Fc -f /tmp/kiliride-dev.dump
docker compose cp postgres:/tmp/kiliride-dev.dump backups/kiliride-dev.dump
```

Create the ignored backups directory first. Protect backups: they include password hashes, sessions and local verification records. Never commit them. For restore rehearsal, create a new empty local recovery database on the development container, copy the dump into it with pg_restore targeting that recovery database, verify row counts and constraints, and keep the original database untouched. Do not restore over kiliride_dev/test or reconnect the app to recovery data without review. Recovery database names are intentionally refused by the application guard.

For failed additive migrations, inspect migration status and SQL; fix forward after backup. A code rollback is safe only if the old code supports the retained schema. Never mark a failed migration resolved without inspecting its applied statements. `docker compose stop` retains data; `up -d --wait` resumes it. Credential rotation requires a controlled DB password change plus config update, not just regenerating .env against an existing volume.

Mailpit contains local credentials/tokens in messages by design; restrict access, clear synthetic messages through its local UI when no longer needed, and never print token-bearing message bodies in test logs. A real mail provider, TLS hosting, deployment credentials and production recovery procedures are outside Phase 1 authorization.

## Administrator and host activation

Create an account through /signup, follow the local verification email, log in, and enroll an authenticator from /account. Save recovery codes privately. MFA is not enabled until a valid authenticator code is entered.

An authorized local operator may then run:

```sh
npm run admin:provision -- "verified-account@example.test" "Operator name" "Reason for local administrator access"
```

Use the real locally created account email, not the example. The command refuses missing/unverified/non-MFA accounts and existing ADMIN assignments; it never creates an account or password. Provisioning appends an audit event and revokes that user's existing sessions. Log in again and complete MFA before opening /admin. No public endpoint grants ADMIN. The command checks the same local database guard as runtime.

Host activation is the protected POST /api/admin/host-activation endpoint. From an authenticated MFA-admin same-origin session, submit JSON with userId (the verified customer's UUID) and a reason of 10–500 characters. Extra fields, including role, are rejected. The endpoint only grants HOST and records the actor and reason transactionally. /host remains a minimal access page; no fleet onboarding or dashboard is implied. /api/account/{id} exposes only the current user's safe profile; even admins cannot use it to read another account.

DRIVER is reserved in the schema but no endpoint grants or authorizes it. Role revocation and organization delegation UI are future operational work; local operators must review any direct DB changes, preserve audit history and revoke affected sessions. Do not use raw SQL as a public administration interface.

## Checks

```sh
npm run lint -- --max-warnings 0
npm run typecheck
npm run test:unit
npx --no-install playwright install chromium
npm run test:integration
npm run build
npm audit --omit=dev --audit-level=high
```

The integration runner sets DATABASE_URL to TEST_DATABASE_URL and uses localhost:3100; it never resets/truncates the database. Tests create uniquely named synthetic accounts and retain audit history. Database state persists between runs; fixtures are not business accounts. Rate limits stay enabled, so tests honor retry windows. Playwright traces/video/screenshots are disabled to avoid retaining authentication secrets. Never reuse an unrelated process on port 3100; stop it before testing. CI starts its own app and services. Generated Prisma client files are ignored and must be regenerated after schema changes.

Phase 1 backup rehearsal on 2026-10-29 restored the development dump into kiliride_recovery_20261029 with nine public tables (including Prisma migration history). The dump is /tmp/kiliride-phase1-backup.dump in the local development container. The recovery database is intentionally not an application target. Development/test databases and their volumes were retained.

# Local Phase 1 setup and recovery

## Phase 2D private image storage and recovery

Run commands from the repository root. `/host` now supports 2C listing management; the vehicle detail page links to `/host/vehicles/{id}/photos` for 2D. No real development HOST was fabricated. Use existing controlled host activation with an actual local account, or run the isolated synthetic test suites.

No new provider credentials are needed for local storage. `.data/vehicle-images/development` is bound to loopback:55432/kiliride_dev; `.data/vehicle-images/test` to loopback:55433/kiliride_test. The test runner replaces DATABASE_URL with the guarded test URL. Storage rejects wrong ports, unsafe keys and symlink/junction directories. New files use exclusive creation, file flush and restrictive POSIX modes; Windows uses inherited workspace/service-account ACLs, which must be reviewed before real-data hosting. Never place this directory beneath public/, configure a static server for it, commit it or publish backups. No hosted adapter or bucket has been provisioned.

All image bytes require the current HOST owner's session, including approved listings. Original files/filenames/metadata are not retained. JPEG/PNG/WebP are decoded and re-encoded to private WebP; up to 5 MiB, 24 megapixels, 2400px output edge and 12 images/vehicle. These limits are technical safeguards. Draft/rejected listings can change photos; review-stage listings are read-only. Public routes continue using unchanged legacy data.

Storage/DB recovery commands:

```sh
node --conditions=react-server --import tsx scripts/reconcile-images.ts test
node --conditions=react-server --import tsx scripts/reconcile-images.ts dev
```

Each command is explicitly target-guarded and processes up to 100 journal candidates. It removes unreferenced DELETE_PENDING objects immediately and PENDING uploads older than one hour, locking/rechecking each journal row. It never removes ACTIVE/referenced objects. Deletion is idempotent; missing files are harmless. Output is counts only; failed operations remain journaled and exit nonzero. Inspect storage permissions/disk health on failure, correct the cause and rerun until the backlog is empty. The commands perform actual intended image deletion, not a dry run. There is no scheduled/background cleanup service in this local milestone; operate this retry command after an interruption and before evaluating storage health. A future hosted adapter must complete/abort writes in bounded time and must not perform untracked background writes after returning.

Failed upload/replacement keeps the old photo and revision unchanged and compensates the new object. On process interruption the durable PENDING journal remains for recovery. Photo deletion first removes API visibility and commits a DELETE_PENDING entry, then attempts physical removal. A failed deletion therefore cannot expose the removed image but can retain inaccessible bytes until retry. Reconciliation cannot recover lost/corrupt ACTIVE bytes: the byte endpoint fails closed and UI shows an unavailable fallback; investigate and restore from a coordinated backup or use an authorized draft replacement.

For a consistent backup, pause photo mutations/cleanup, create a PostgreSQL custom-format dump and copy the matching private storage namespace with restricted access; record file hashes and resume only after both complete. Back up DB and objects together. Restore into separate recovery DB/storage targets, verify every ACTIVE reference against size/SHA-256 and inspect pending journal entries before approving recovery. Do not overwrite live databases/files or delete directories to reset them. Roll back UI/routes while retaining additive schema and stored files; disable photo writers/cleanup during investigation. No combined image restore drill or production deployment was performed in 2D.

`npm run test:fleet` now includes real isolated image service/storage tests. `npm run test:integration` includes mobile photo controls and HTTP security checks. Test images are generated colored pixels explicitly labeled synthetic; they are not real vehicle evidence. Test objects/history remain isolated and may accumulate across runs.

Local only. Do not use production connection strings. Runtime and migration guards accept only loopback hosts and databases named kiliride_dev or kiliride_test. Tests require kiliride_test on port 55433. Phase 2A/2B now adds fleet tables and an explicit operator import, documented below; ordinary schema migrations do not import fleet data.

## Phase 2A/2B local import and tests

After reviewing/backing up and deploying migrations, run `npm run fleet:import -- dev --dry-run "Operator name"`. This validates and reports actions without writing records. Use `--apply` intentionally, then repeat to confirm UNCHANGED. The target argument must be `dev` (loopback:55432/kiliride_dev) or `test` (loopback:55433/kiliride_test). The CLI rejects missing/unknown flags and never silently defaults to an apply operation.

Imports preserve existing public slugs/specifications/base prices as unassigned DRAFTs. Unknown ownership/verification is not resolved by the script. Source changes or collisions fail for manual reconciliation; replay never overwrites database edits. Public catalogue reads remain static. No fleet management endpoint/UI is exposed yet.

Run `npm run test:unit`, `npm run test:fleet` and `npm run test:integration` sequentially. Fleet tests use only the isolated test database and retain clearly synthetic fixtures/history. The migration rehearsal now checks all migration checksums, 16 tables and nine triggers. Development/test backup locations, migration results and retained disposable target are recorded in [KILIRIDE_PHASE2_REPORT.md](KILIRIDE_PHASE2_REPORT.md). Stop before 2C unless separately authorized.

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

Host activation is the protected POST /api/admin/host-activation endpoint. From an authenticated MFA-admin same-origin session, submit JSON with userId (the verified customer's UUID) and a reason of 10–500 characters. Extra fields, including role, are rejected. The endpoint only grants HOST and records the actor and reason transactionally. /host now provides the authorized listing dashboard and private photograph management. /api/account/{id} exposes only the current user's safe profile; even admins cannot use it to read another account.

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

The integration runner sets DATABASE_URL to TEST_DATABASE_URL and uses localhost:3100; it never resets/truncates the database. The test URL must explicitly use loopback port 55433 and database kiliride_test; other ports, database names and connection query overrides are rejected. Playwright always launches its own server and fails if localhost:3100 is already in use, including outside CI. Resolve a port conflict before running tests. The unit suite includes an occupied-server rejection probe; run it separately from the integration suite.

Tests create uniquely named synthetic accounts and retain audit history. Database state persists between runs; fixtures are not business accounts. Rate limits stay enabled, so tests honor retry windows. Playwright traces/video/screenshots are disabled to avoid retaining authentication secrets. Generated Prisma client files are ignored and must be regenerated after schema changes.

Check test migration state with `node scripts/run.mjs status-test`. Rehearse clean application and repeat deployment with `node scripts/rehearse-migrations.mjs`. This creates a uniquely named `kiliride_rehearsal_<uuid>` database on the test instance at port 55433, applies the existing SQL, verifies the migration checksum/tables/triggers and rolls back a synthetic trigger probe. A separate restricted Prisma config permits only these disposable names. The script never resets, drops or migrates the existing development/test databases; it retains its disposable database for inspection and prints its name. Do not point the application or integration suite at a rehearsal database. CI runs this rehearsal as well.

Phase 1 backup rehearsal on 2026-10-29 restored the development dump into kiliride_recovery_20261029 with nine public tables (including Prisma migration history). The dump is /tmp/kiliride-phase1-backup.dump in the local development container. The recovery database is intentionally not an application target. Development/test databases and their volumes were retained.

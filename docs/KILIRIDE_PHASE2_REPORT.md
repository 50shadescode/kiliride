# Phase 2 report: Milestones 2A and 2B only

Date: 2026-10-30, Africa/Nairobi. Branch verified: `feature/phase2-fleet-management`. Authority: user authorization for 2A/2B and `docs/prompts/CODEX_PROMPT_003.md`. The existing untracked prompt was preserved. No commit, push or deployment.

## Outcome

**PASS for the authorized local Milestones 2A/2B.** Database, authorization/import tests, public regressions, TypeScript, strict ESLint and production build passed. Public catalogue reads remain on the unchanged `KILIFI_FLEET`. Nothing in this slice publishes database listings or treats imported legacy flags as verification/availability evidence.

| Capability | Status | Evidence |
|---|---|---|
| Fleet/ownership schema | IMPLEMENTED | `prisma/schema.prisma`; additive `202610300001_fleet_foundation/migration.sql`. |
| Controlled listing lifecycle | IMPLEMENTED, server-only foundation | `src/server/fleet/service.ts`, `lifecycle.ts`; row locking, revision checks, server roles, SQL guards and atomic history/audit. No route/action/UI exposes these functions. |
| Verification/audit foundation | IMPLEMENTED | Immutable `VehicleReview` and `VehicleListingEvent`; approval references a current independent review, criteria identifier and evidence reference. This records supplied evidence; it does not establish approved business criteria or authenticate external documents. |
| Private registration boundary | IMPLEMENTED | Separate `VehicleRegistration`; explicit owner/MFA-admin read helper; no registration or source-provenance join in the general vehicle projection. Existing static UI still displays its historical plate data. |
| Legacy import | IMPLEMENTED | `src/server/fleet/import.ts`, `legacy.ts`, operator CLI; dry-run/apply/replay executed. Both development records are unassigned DRAFTs. |
| Photographs | PARTIAL, metadata only | `VehiclePhoto`, position uniqueness and single-cover index. No uploaded files, storage integration, gallery or imported legacy image rows. |
| Host/admin UI, upload workflows, public DB cutover | MISSING, explicitly deferred | Milestones 2C onward were not implemented. |

## Models and invariants

Seven new models:

- `Vehicle`: PostgreSQL UUID internal ID; immutable unique `publicId`; make/model/category/nullable description, seats, fuel, transmission, location, integer KES half/full-day base prices, listing status, revision, approval reference and timezone-aware timestamps.
- `VehicleOwnership`: one-to-one record; null owner explicitly means UNASSIGNED. An assignment references an existing verified HOST plus an assigning ADMIN, timestamp, reason and evidence reference. No synthetic owners or ownership transfers. Recorded assignments cannot be replaced/deleted through ordinary application SQL.
- `VehicleRegistration`: private, normalized unique registration number with vehicle FK.
- `VehiclePhoto`: storage-key metadata, uploader FK, alt text, position and cover selection. No actual storage or upload operation.
- `VehicleReview`: reviewer FK, current vehicle revision, decision/reason, criteria/evidence references and timestamp. Immutable; self-review and non-admin review are rejected.
- `VehicleListingEvent`: append-only old/new status, actor, reason and timestamp. Only initial import-to-DRAFT events may omit a user actor; the operator is recorded in import/audit provenance.
- `LegacyVehicleImport`: immutable unique source-to-vehicle mapping, source SHA-256, private untrusted snapshot, named local operator and import timestamp.

All relationships have foreign keys. Constraints reject invalid money/seats/currency, identifier changes, unassigned review submission, approval without a matching current review, duplicate photo positions/covers and unsupported lifecycle changes. Existing identity models and the previously applied Phase 1 SQL were not modified. There are now 15 application tables plus Prisma migration history.

Lifecycle: DRAFT -> PENDING_REVIEW requires an assigned verified HOST. PENDING_REVIEW -> APPROVED/REJECTED requires MFA ADMIN and independent review. APPROVED -> SUSPENDED is admin-only. REJECTED -> DRAFT allows the owner or admin; SUSPENDED -> DRAFT is admin-only. Direct DRAFT/SUSPENDED -> APPROVED is rejected. Mutations lock the vehicle row, check expected revision, and write event/audit rows in one transaction. Reviewed vehicle details cannot be changed in place. Listing approval is not booking availability.

Real review criteria, ownership-document authenticity, insurance checks, expiry and permission to publish photographs/plates remain pending decisions B09/B12/B13/B14. No real vehicle was assigned or approved in this task. Synthetic approval/photo metadata exists only on explicitly synthetic test vehicles in the isolated test database.

## Import and compatibility

The explicit mapping preserves `vitz-142s` (Toyota Vitz) and `note-131c` (Nissan Note e-Power), category, location, seats, fuel/transmission and KES 2,500 half-day / 3,500 full-day base prices. Description stays null because no source description exists. Registration is stored separately. The KES 500 historical reservation fee and other source values remain in the private source snapshot and unchanged static catalogue; no fee policy was approved.

`isVerified`, image paths, availability strings and manager phone are retained only as untrusted source provenance, never converted into owners, photo rows, reviews, bookings or availability records. Existing image paths were not treated as actual photographs. Each newly imported vehicle receives an explicit null-owner ownership record and DRAFT status.

The import validates the entire known mapping, uses a transaction-scoped PostgreSQL advisory lock, unique source/public IDs and one atomic transaction. Replays leave database rows, edited fields, ownership and history untouched. Changed source hashes, mismatched mapping or identifier/registration collisions fail closed for manual reconciliation. No upsert overwrites an existing reviewed listing. Dry-run performs validation/conflict checks but creates no records.

Executed development dry-run returned two CREATE_DRAFT actions; apply created both; replay returned two UNCHANGED actions. A read-only query verified two DRAFT records, null owners/approval references, zero photos/reviews and unchanged base prices. Public components, routes, stable IDs, pricing helpers and WhatsApp enquiry code are byte-unchanged according to Git diff. There is no DB/static fallback mechanism: the existing static catalogue remains the deliberate sole public source until a later approved cutover.

## Migration safety and isolation

Docker PostgreSQL development/test and Mailpit were healthy. Sanitized URL and live `current_database()` checks verified development at `127.0.0.1:55432/kiliride_dev` and tests at `127.0.0.1:55433/kiliride_test`, with separate containers/volumes. All automated fleet mutations use the test runner's guarded test URL. The import CLI requires an explicit dev/test target and the corresponding exact database name/port.

Before applying the migration, `pg_dump -Fc` backed up both databases. Copies are retained in ignored `backups/kiliride-pre-phase2-20261030.dump` and `backups/kiliride-test-pre-phase2-20261030.dump`, with originals at matching `/tmp/` paths in their respective containers. `backups/phase2-identity-before.json` contains only row counts/fingerprints. Do not commit or publicly share backups.

The generated SQL was reviewed before application. Redundant generated ALTER DEFAULT statements against identity tables were removed before the migration was ever applied. The final migration is transactional and adds only fleet enums, tables, indexes, FKs, checks and triggers; it performs no destructive operations or data import.

Fresh disposable rehearsal target: `kiliride_rehearsal_9b512799a9b440b29ada6bc8531a61a4` on the isolated test instance. Both migrations applied successfully; repeated deploy was a no-op; migration history/checksums, 16 tables, nine triggers and a rolled-back CUSTOMER trigger probe passed. The disposable database is retained for inspection.

Then `node scripts/run.mjs migrate` and `node scripts/run.mjs migrate-test` successfully applied the fleet migration to their backed-up local targets. Before running tests/imports, all eight existing identity-table row counts and content fingerprints matched the pre-migration snapshots in both databases. Test migration status reports two migrations and schema up to date.

Rollback: revert application/tooling code while retaining the additive schema; old public/identity code does not depend on the new tables. Do not edit applied SQL, drop tables, reset databases or restore over live data. For a data-recovery investigation, restore the retained dump into a separate recovery database, inspect/reconcile later writes, and approve a recovery plan first. No new restore drill was executed here.

## Executed checks

| Command/check | Result |
|---|---|
| `docker compose ps`; guarded URL/current_database checks | PASS: healthy isolated local targets. |
| `node node_modules/prisma/build/index.js validate` | PASS. |
| `node node_modules/prisma/build/index.js generate` | PASS, existing Prisma 7.10.1; generated client remains ignored. |
| `node scripts/rehearse-migrations.mjs` | PASS: both migrations, repeat no-op, checksums/schema/triggers. |
| Container `pg_dump -Fc`, copies and identity fingerprints | PASS: both backups created/copied; identity data unchanged immediately after migration. |
| `node scripts/run.mjs migrate`; `node scripts/run.mjs migrate-test` | PASS: additive application to development and isolated test. |
| `node scripts/run.mjs status-test` | PASS: two migrations, current schema. |
| `node --conditions=react-server --import tsx scripts/import-legacy-fleet.ts dev --dry-run "Codex Phase 2"` | PASS: two planned drafts, no data writes. |
| Same import with `--apply`, executed twice | PASS: two drafts created, then both UNCHANGED. |
| `node scripts/run.mjs test-fleet` | PASS: initial 4/4; final 5/5 including explicit admin self-approval denial, 15.4 seconds. |
| `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts` | PASS: 8/8, including import mapping/lifecycle, pricing/timezones and occupied-server rejection. |
| `node scripts/run.mjs test` | PASS: 8/8 existing real auth/Mailpit/Chromium tests, 1.8 minutes; catalogue/WhatsApp/404, responsive labels/keyboard, recovery/MFA/authorization/CSRF. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS, including after the final security test addition. |
| `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, zero warnings, including after the final security test addition. |
| `npm.cmd run build` | PASS: Next.js 16.4.3; 15 static pages and existing dynamic routes; no new fleet routes. |
| `npm.cmd audit --omit=dev --audit-level=high` | PASS: zero runtime advisories. No dependencies changed. |
| Public source / Phase 1 SQL / lockfile preservation | PASS: no diffs in existing app/components, static fleet/types/pricing, Phase 1 migration, package-lock or AGENTS.md. |

Fleet database tests cover dry-run/concurrent/repeated import, stable source mappings and prices, source-change conflicts, preservation of database edits, no manufactured legacy ownership/photos/reviews, anonymous/customer/cross-host/non-MFA-admin denial, valid owner/admin private reads, controlled owner assignment, unassigned submission rejection, missing approval evidence, host approval denial, concurrent decision conflict, lifecycle history and SQL constraints/immutability. A final explicit dual-role ADMIN/HOST test confirms self-approval is denied without a review or approval audit event. Session creation uses Better Auth; synthetic role/MFA posture is seeded for service tests. The separate Phase 1 suite verifies actual MFA enrollment/challenges and recovery-code replay. `npm test` now includes unit, fleet database and existing integration suites; the final review changed only this script wiring and test coverage, not application code or migration SQL.

Initial Docker/Prisma-diff/CLI subprocess attempts encountered sandbox access/EPERM restrictions. Authorized retries succeeded. No functional test failure was hidden or counted as passing. Existing NO_COLOR/FORCE_COLOR and smooth-scroll notices were non-fatal; the earlier Phase 1 signup timeout did not recur in this run.

## Files changed

- Schema/migration: `prisma/schema.prisma`, `prisma/migrations/202610300001_fleet_foundation/migration.sql`.
- Server foundation: `src/server/fleet/{legacy,import,lifecycle,service}.ts`.
- Tooling: `scripts/import-legacy-fleet.ts`, `scripts/run.mjs`, `scripts/rehearse-migrations.mjs`, `package.json`, `.github/workflows/ci.yml` (fleet database tests).
- Tests: `tests/unit/fleet.test.ts`, `tests/database/fleet.test.ts`.
- Documentation: this report, `KILIRIDE_ARCHITECTURE.md`, `KILIRIDE_DATA_MODEL.md`, `KILIRIDE_DECISIONS.md`, `KILIRIDE_ROADMAP.md`, `KILIRIDE_TEST_REPORT.md`, `KILIRIDE_LOCAL_SETUP.md`.

## Reproduction and remaining scope

1. With the existing isolated local services running, use `npm run db:generate`, review the new migration, back up existing data, and run `npm run db:migrate` / `npm run db:migrate:test`. Never reset.
2. Preview with `npm run fleet:import -- dev --dry-run "Operator name"`. Apply intentionally using `--apply`; repeat to confirm UNCHANGED. Use `test` instead of `dev` only for the isolated test target.
3. Run `npm run test:unit`, `npm run test:fleet`, then `npm run test:integration` sequentially (the occupied-server unit probe owns port 3100 briefly), plus typecheck/lint/build.
4. Browse `/services/vehicles`, `/vehicles/vitz-142s`, `/vehicles/note-131c` and inspect WhatsApp enquiry URLs without sending messages. A draft import must not change public catalogue output.

No new fleet HTTP routes, host dashboards, edit/create forms, image uploads, admin UI, object-storage provider, availability engine, payments or subscriptions. No hosted CI run, deployment, production connection, full manual accessibility/device audit or real document verification. Phase 2C and later work require separate approval. Real ownership resolution, approved verification/insurance/retention policy and genuine images block future public database cutover; they do not require fabricating data to complete 2A/2B.

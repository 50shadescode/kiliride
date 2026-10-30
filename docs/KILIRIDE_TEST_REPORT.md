# KiliRide test report

## Phase 2E administrator verification (2026-10-31)

**Engineering acceptance: PASS locally. Business-policy readiness: BLOCKED; overall real-operation readiness: PARTIAL.** Formal policy approval and Kenyan regulatory/legal/insurance determinations remain outstanding by explicit product-owner direction. The recorded policy is KILIRIDE-FLEET-VERIFY-001 / 0.1-DRAFT, unapproved with no approver/effective date. No real approved policy or vehicle approval was created. Full commands, file evidence, backups and manual acceptance are in [Phase 2 report](KILIRIDE_PHASE2_REPORT.md); policy in [draft specification](policies/KILIRIDE_VEHICLE_VERIFICATION_V0_1_DRAFT.md).

| Executed command/check | Final outcome |
|---|---|
| `npm.cmd run test:unit` | PASS 13/13, 2.11s. |
| `node scripts/run.mjs test-fleet` | PASS 24/24, 20.59s. Files serialized to avoid shared-record interference; explicit transaction races still run concurrently. |
| `node scripts/run.mjs test` | PASS 15/15, 3.3m, complete Chromium/API suite. |
| `node scripts/run.mjs test tests/integration/admin.spec.ts` | PASS 3/3, 58.0s after accessibility correction; followed by full suite above. |
| TypeScript `--noEmit --incremental false` / ESLint `. --max-warnings 0` | PASS, zero warnings. |
| Production build / `scripts/check-private-traces.mjs` | PASS, 15 static pages, admin dynamic routes, 37 traces excluding private runtime files. |
| Prisma validate/generate, migrations, test status | PASS, unchanged Prisma 7.10.1; six migrations, test schema up to date. |
| Fresh disposable migration rehearsal | PASS, six migrations / 19 tables / 18 triggers; repeat no-op/checksums/status, role and test-policy isolation probes. |
| Data preservation | PASS, backups before both additive stages; original fields of 16 then 18 tables unchanged by migration on each isolated local target; final development baseline unchanged. |
| Final storage consistency | PASS, 143 ACTIVE test objects match DB photo references, file inventory, byte sizes and hashes; no orphan files or pending cleanup. |
| Read-only schema diff | Raw diff nonzero only for equivalent UUID-default parentheses. Canonical-expression temporary copy: no difference, exit 0; no DB mutation. |
| Online runtime dependency audit | PASS, zero vulnerabilities. |
| Online full dependency audit | NON-CLEAN, exit 1: five pre-existing dev findings (3 high, 1 moderate, 1 low). No package/lockfile changes or forced fixes. |

New coverage: anonymous/CUSTOMER/HOST/non-MFA denial on queue/detail/decisions/photos, real MFA login before ADMIN access, pre-grant-session denial, same-Origin/JSON/body limits, strict authority fields, missing/disabled policy, five explicit evidence confirmations, unresolved matrix applicability, absent mandatory evidence, SQL checklist bypass, policy/history immutability, complete readable photographs and corruption failure, cross-owner confidentiality, self-review denial, competing approval/rejection, duplicate replay, suspension/reopening, fresh review after corrections, owner feedback isolation, legacy protection, queue filters/empty/error input and mobile/desktop keyboard controls. Synthetic test policy/evidence is expressly test-only; no Kenyan obligation is invented. Existing authentication, email/recovery, recovery-code replay, image operations, catalogue, pricing and WhatsApp regressions all passed.

Initial failures were corrected without weakening assertions: database 21/23 (fixture shape and parallel shared-state counts), browser 13/15 (fixture wrongly used multipart against existing raw upload contract), then 14/15 (select labels included option text). Accessible labels fixed; final focused and full browser runs passed. An early concurrent unit/browser launch conflicted on the deliberate occupied-port test; final suites ran sequentially. Authorized retries resolved sandbox subprocess EPERM. Expected optimizer denial and existing navigation-stream/color/smooth-scroll logs were observed; no final failed assertion.

No hosted CI for these uncommitted changes, deployment, real-policy activation, legal/insurance determination, complete physical-device/screen-reader audit or new coordinated DB/image restore drill. The development policy table is empty. Vitz/Note remain unassigned DRAFTs with original prices and no photos/reviews/decisions on both targets. Stop after 2E; earlier sections below are historical.

## Phase 2D photograph verification (2026-10-30)

**PASS for local 2D features; full dependency audit remains non-clean with five existing dev-tool advisories.** Complete evidence and limits: [Phase 2 report](KILIRIDE_PHASE2_REPORT.md).

- 11/11 unit, 18/18 real fleet/image database tests and 12/12 browser/API tests passed. Final focused HOST suite 4/4 passed after revision/cache refresh checks; final database suite 18/18 passed after storage tracing correction. Authentication, MFA/recovery replay, catalogue, pricing and WhatsApp regressions remain intact.
- New tests cover owner isolation, CSRF, safe private bytes/DTOs, image decoding/metadata/size/pixel/animation/type rules, traversal/overwrite, cover/order, replacement/removal, count/rate limits, concurrent writes/submission, reviewed-state SQL guards, compensation/reconciliation, missing/corrupt data and optimizer/direct-path denial. Mobile 375px/desktop 1280px controls, focus and fallback passed.
- Schema/client, backed-up additive migration, disposable rehearsal (four migrations, 17 tables, eleven triggers), status, TypeScript, strict ESLint and production build passed. Existing data fingerprints remained unchanged by migration; development stayed unchanged after tests. Final private storage inventory matched 56 ACTIVE objects, references, lengths and SHA-256, with no orphan files or pending journal.
- Thirty-two build traces exclude .data/backups/.env files; CI now checks this after build. Runtime online dependency audit: zero. Full online audit: five existing dev findings, exit 1 (3 high, 1 moderate, 1 low); sandbox's empty audit result was superseded by the online check.
- Initial 17/18 database result traced to an animation fixture with identical frames; corrected fixture passed. TypeScript BigInt target mismatch and build's broad filesystem-tracing warning were corrected. Focused browser run emitted two destination-stream errors during navigation without failed assertions; optimizer-denial logs were expected.

No hosted CI/deployment, real vehicle evidence, full manual screen-reader/device audit, production storage provider or combined object/database restore drill. Stop before 2E. Earlier sections are dated history.

## Phase 2C host management verification (2026-10-30)

**PASS for local Milestone 2C.** Exact commands, migration backups, isolation and limitations are in [KILIRIDE_PHASE2_REPORT.md](KILIRIDE_PHASE2_REPORT.md).

- Unit tests: 10/10; fleet database/service tests: 9/9; browser/API suite: 10/10 (1.6m), including all existing identity/MFA/recovery-code replay, catalogue and WhatsApp regressions.
- New coverage: host create/edit/submit, incomplete drafts, rejected-listing feedback/resubmission, escaped feedback, role/record isolation, forged authority input, legacy claim denial, concurrent edits/submissions, transactional rollback, private DTOs, immediate role revocation and CSRF/body/input limits. Browser form layout/keyboard checks passed at 375px and 1280px.
- Schema validation/generation, strict TypeScript/ESLint, production build and runtime audit (zero vulnerabilities) passed. No package/auth/public catalogue changes.
- Rehearsal on a fresh port-55433 database applied all three migrations, verified repeat no-op/checksums/history/16 tables/ten triggers. Both local databases were backed up and safely migrated; status is current. Eleven table fingerprints matched immediately after migration on both targets; development fingerprints still matched after tests. Legacy development records remain unassigned DRAFTs.
- Corrections during verification: two oversized synthetic registration fixtures (initial fleet 7/9) and a new streaming loading boundary that changed authorization HTTP responses to 200 (initial browser 8/10). Fixtures corrected and boundary removed; final full suites passed without weakening assertions. Sandbox subprocess EPERM retries succeeded with authorization.

No uploads/admin approval UI/payments/reservations, hosted CI run, new restore drill or full manual screen-reader/device audit. Synthetic role/rejection fixtures stayed in the isolated test database; real authentication/MFA paths were tested separately. Stop after 2C. Earlier results below are dated history.

## Phase 2A/2B verification (2026-10-30)

**PASS for the authorized local 2A/2B slice.** Complete commands, migration/import results and limitations: [KILIRIDE_PHASE2_REPORT.md](KILIRIDE_PHASE2_REPORT.md).

- Schema validation/client generation passed on unchanged Prisma 7.10.1. Fresh disposable rehearsal applied both migrations, repeated with no pending work, and verified checksums/history, 16 tables, nine triggers and the CUSTOMER probe.
- Both local databases were backed up before additive deployment. Row counts/content fingerprints for all eight existing identity tables matched before/after migration. Test migration status is current. No resets or destructive SQL.
- Development CLI dry-run/apply/replay passed: two new unassigned DRAFTs, then UNCHANGED. Read-only checks confirmed stable IDs, KES 2,500/3,500 base prices, no owners, no approval references and zero photos/reviews.
- `node scripts/run.mjs test-fleet`: initial 4/4 passed; final 5/5 passed (15.4s), including an explicit admin self-approval denial test added during review. Coverage includes concurrent/repeated import, source conflicts, edit preservation, ownership/private data, role/MFA denials, controlled transitions, evidence requirements, concurrent decisions, schema constraints and immutable history. `npm test` includes this suite. TypeScript and strict lint also passed after the final test addition.
- `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts`: 8/8 passed. `node scripts/run.mjs test`: 8/8 existing auth/Mailpit/Chromium tests passed (1.8m), including catalogue/WhatsApp, mobile/keyboard and MFA/recovery/CSRF regressions.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`, strict ESLint (`. --max-warnings 0`) and `npm.cmd run build`: passed. Runtime dependency audit reported zero vulnerabilities. Existing public code/Phase 1 migration/lockfile remain unchanged.

Fleet service tests use synthetic role/MFA posture fixtures and real Better Auth sessions; actual MFA challenge coverage comes from the existing API/browser suite. No new fleet UI/upload workflow, external provider, hosted CI, production, live payment, manual full-device/screen-reader session or fresh restore drill was tested. Initial sandbox access/subprocess failures were resolved by authorized retries; no functional test failures occurred. Historical Phase 1 reports below remain dated evidence.

## Staged CI review follow-up (2026-10-30)

The two consecutive `npm run db:migrate:test` steps originally checked repeat-deploy idempotency. The second is now redundant: `scripts/rehearse-migrations.mjs` deploys twice to a fresh disposable database and asserts unchanged migration history. Removed only the duplicate workflow step and named the remaining test migration/status/rehearsal steps; no runtime, schema or helper changes.

Isolation review: CI generates local credentials/URLs with `scripts/local-env.mjs`, uses separate Docker development/test instances and has no workflow/job/step environment overrides or production-secret references. `status-test` replaces DATABASE_URL with the guarded loopback:55433/kiliride_test URL. Rehearsal starts from that same guarded test URL and only creates a random kiliride_rehearsal database on port 55433; its dedicated Prisma config rejects other hosts, ports and database-name patterns. The separate CI development-schema setup remains on its own loopback database at port 55432.

Executed: workflow parsed with installed `js-yaml`; assertions passed for one test deploy, one status check, one rehearsal, expected ordering and absent environment overrides. `node node_modules/tsx/dist/cli.mjs --test tests/unit/foundation.test.ts` passed 5/5. `node scripts/run.mjs status-test` passed, showing kiliride_test at 127.0.0.1:55433 is up to date. Staged and working-tree whitespace checks passed. Initial subprocess EPERM failures required authorized retries; an unavailable `yaml` module was replaced by the already-installed `js-yaml` parser without installing packages. Hosted GitHub Actions and the unchanged full application suite/rehearsal were not rerun for this workflow-only correction; their earlier local evidence remains below. No commit, push, deployment or Phase 2 work.

## Phase 1 final acceptance verification (2026-10-30)

**Final local result: PASS.** This section supersedes earlier Phase 1 check totals. Full evidence and retained disposable database names are in [KILIRIDE_PHASE1_ACCEPTANCE.md](KILIRIDE_PHASE1_ACCEPTANCE.md).

| Command / check | Actual result |
|---|---|
| `docker compose ps` | PASS: both PostgreSQL instances and Mailpit healthy; test port 55433. |
| `node node_modules/prisma/build/index.js validate` | PASS. |
| `node node_modules/prisma/build/index.js migrate status` | PASS: development schema current. |
| `node scripts/run.mjs status-test` | PASS: kiliride_test on 55433 current. |
| `node scripts/rehearse-migrations.mjs` | PASS: fresh disposable database, migration deploy, repeat no-op, status, SQL checksum, nine tables, two triggers and rolled-back CUSTOMER probe. Existing databases untouched by migrations. |
| `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts` | PASS: 6/6, including port/name guard negatives and occupied-server rejection. |
| Initial `node scripts/run.mjs test` | FAIL: 7 passed, browser signup POST timeout; 4.2 minutes. |
| `node scripts/run.mjs test identity.spec.ts --grep "customer completes"` | PASS: focused browser journey, 10.1 seconds. |
| Final `node scripts/run.mjs test` | PASS: 8/8, 1.3 minutes, including new provisioning/recovery-code negatives. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS. |
| `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, zero warnings. |
| `npm.cmd run build` | PASS, Next.js 16.4.3. |
| `npm.cmd audit --json` | PASS: zero advisories across full tree. |
| `npm.cmd audit --omit=dev --audit-level=high` | PASS: zero vulnerabilities. |
| Client-secret scan | PASS: 16 JS/map files in .next/static; no configured auth/database secret matches. Values never printed. |
| `git diff --check` | PASS; LF/CRLF notices only. |

Isolation is verified at configuration, runner, connection and process boundaries: tests require loopback:55433/kiliride_test; server reuse is disabled in local runs and CI; a dummy occupied server receives only readiness probes before Playwright refuses it; database identity and API-created test rows are checked. A read-only corroborating query found zero test-prefix users in development.

New security assertions cover rejected provisioning for unverified/non-MFA/incompletely enrolled users without role/audit side effects; HOST denial of administrator mutations; ADMIN cross-account denial; missing-Origin rejection with an authenticated admin; audit deletion denial; invalid recovery codes; consumed-code replay after logout/new challenge; and successful use of a second unused code. Existing authentication, verification, reset, expiry, logout, role injection, CSRF, catalogue/WhatsApp and viewport/keyboard checks remain passing.

Failure chronology: sandbox access/subprocess restrictions required authorized retries. The initial browser signup timeout was accompanied by a React update-before-mount warning. Bounded, jointly awaited click/response diagnostics were added without logging credentials. Focused and full reruns passed, but the underlying intermittent cause is not established (P2 observation). Smooth-scroll and environment-color warnings are non-fatal. No application fix for that warning is claimed.

Not executed: hosted CI, production/TLS/email checks, live payments, full manual device/screen-reader QA or a fresh backup/restore drill. Existing 2026-10-29 restore evidence remains historical. No database reset, Prisma upgrade, deployment or Phase 2 work. Six unit and eight integration/browser cases are the final totals, not the earlier five/six totals below.

## Phase 1 final acceptance addendum (2026-10-29)

The Phase 0 record below remains historical. Phase 1 final local results:

| Check | Command / evidence | Result |
|---|---|---|
| Local infrastructure | `docker compose up -d --wait` | PASS: separate PostgreSQL development/test containers and Mailpit healthy. |
| Migrations | `node scripts/run.mjs migrate`; `node scripts/run.mjs migrate-test` twice | PASS: clean application to both databases; repeat no-op; no reset/data deletion. |
| Recovery | Container pg_dump, createdb separate recovery database, pg_restore --exit-on-error, public table count | PASS: nine tables restored into kiliride_recovery_20261029; original DBs unchanged. |
| Unit tests | `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts` | PASS: 5 tests, including existing prices/IDs, timezone cases and remote/test-target rejection. |
| Integration/browser | `node scripts/run.mjs test` | PASS: all 6 tests, final corrected run 1.8 minutes, real PostgreSQL and Mailpit, Chromium; no mocks for auth/DB. |
| Types | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS, exit 0. |
| Lint | `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, exit 0. |
| Build | `npm.cmd run build` | PASS, Next.js 16.4.3 production build; no deploy. |
| Runtime dependencies | `npm.cmd audit --omit=dev --audit-level=high` | PASS, zero reported runtime advisories. |
| Full dependency tree | `npm.cmd audit --json` | NOT CLEAN: 5 dev-tool advisories, 1 low/1 moderate/3 high; details in Phase 1 report. |
| Client secret boundary | Compare configured secret values against all .next/static JS/maps without printing values | PASS: 16 files, no matches. Auth JSON response tests also assert session tokens absent. |
| Frontend/instruction preservation | SHA-256 baseline comparison excluding intended package/config/Navbar changes | PASS: no unexpected changes; AGENTS.md restored exactly after disabling Next agentRules. |

The six integration cases cover: catalogue/WhatsApp/404 regression; labeled keyboard/mobile/desktop forms; verified auth/recovery/session lifetime and role injection rejection; MFA/admin bootstrap/host activation/CSRF/cross-account/audit immutability; anonymous/invalid/oversized request rejection; and complete browser signup/verification/login/logout. Mobile layout checks use 375px and desktop 1280px; no full screen-reader or multi-device certification is claimed. WhatsApp URLs were inspected without sending messages.

Earlier failures exposed genuine issues and were fixed: CJS script top-level await, rate-limit-aware tests/UI, security-header syntax, and JSON filtering of empty redirects. See KILIRIDE_PHASE1_REPORT.md for chronology and configuration. All final functional checks listed above were executed after relevant fixes. Five unit tests plus six integration/browser tests pass; full dependency audit remains a documented review item.

GitHub Actions workflow was created for the confirmed GitHub origin but not run remotely. No production connection, deployment, hosted email, live payment or Phase 2 workflow was tested or attempted. Backup/test fixtures stay local. Local tokens were not retained in Playwright traces/screenshots/video; those capture modes are disabled. Real rate limiting stays enabled; test retries honor its windows.

Date: 2026-10-29, Africa/Nairobi. Checks are audit evidence, not commercial certification.

## Available tools

`package.json` has dev/build/start/lint; no unit/integration/E2E runner or test script. TypeScript and ESLint are installed. No test/spec files, CI workflows or database test setup found. Local installed versions: Next.js 16.1.6, React 19.2.3, TypeScript 5.9.3, Zod 4.3.6; Node v24.14.1 observed. Supported production runtime is not declared.

## Executed in this Phase 0

| Check | Exact command / method | Result |
|---|---|---|
| Working-tree baseline | `git status --short`; `git log -1 --format="%h %s"` | Captured dirty baseline at HEAD 73d2e64; preserved existing work. |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS, exit 0; no emitted source/build-info writes requested. |
| Strict lint | `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, exit 0; no fix/cache flags. |
| Diff whitespace | `git diff --check` | PASS; Git warns LF may become CRLF for two pre-existing changed services files. |
| Pricing behavior | In-memory Node stdin script using installed TypeScript `transpileModule`, `vm.runInNewContext`, `assert/strict`; no test files created | PASS: 24 date assertions and 3 fee assertions. |
| Defect probes | Same stdin script; observations, not policy acceptance tests | Empty interval total is 500 for current fee; 2026-02-30 to 2026-03-03 normalizes to one day; NaN rentalDays produces NaN fee. |
| SGR absence | Recursive source scan for sgr/SgrAggregator/SgrOperatorOnboard/kiliride_standby_fleet | No matches. |
| Fleet image existence | `fs.existsSync` for public/cars/vitz.jpg and public/cars/note.jpg | Both missing. Current pages use icons, so this is absent imagery rather than a rendered broken-image claim. |
| Icon/copy screening | Unicode Extended_Pictographic scan of TS/TSX/CSS, then inspect match | Only Footer copyright symbol matched; copyright text is not an emoji violation. |
| Tooling/env inventory | `rg --files --hidden` excluding node_modules/.git/.next/docs; `git ls-files` test/spec/env/workflow patterns; root names; source env/storage/network search | No test infrastructure, root env files or application env references found. Search exit 1 denotes no matches, not a compiler failure. No secret values printed. |
| Integrity | SHA-256 of tracked/untracked non-doc repository files with deleted files marked MISSING; compare before/after; index diff baseline | PASS: non-doc file hash listings identical; existing deletions preserved; index diff remains empty. No application, dependency, instruction or configuration file changed. |

Pricing assertions: three timezones (Africa/Nairobi, America/New_York, Europe/London), each testing ordinary three-day range, autumn and spring DST boundaries, leap-year boundary, same date, reversed dates, empty and invalid inputs. Fee assertions: 3500 x 3 = 10500; zero-day rental fee = 0; 10500 + 500 = 11000. These verify current arithmetic only; they do not establish half-day, fee, cancellation or tax policy. Tests are ephemeral audit probes, not a committed regression suite.

An initial attempt to invoke Git as a Node subprocess for hashing failed with EPERM. The read-only baseline was subsequently captured with direct Git and PowerShell Get-FileHash; no application changes resulted.

## Not executed / limitations

- No fresh production build in this audit: it writes generated artifacts and the existing Google font download introduces external network dependency. The preceding implementation turn reported a passing build after clearing stale generated SGR types; that is historical evidence, not a fresh Phase 0 build result.
- No browser/device/screen-reader or automated accessibility run. Dead CTAs, invalid nesting and missing label associations are source findings; responsive layout quality remains unverified.
- No WhatsApp message sent; URL generation inspected, external delivery not tested.
- No dependency advisory scan, penetration test, full Git-history secret scan or deployed-header/TLS inspection. Do not infer absence of vulnerabilities.
- No database, provider, payment, role-isolation, concurrency or upload tests can be run against nonexistent services. No dependencies installed, migrations executed, providers connected or deployments performed.

## Required Phase 1 acceptance tests

Login/logout/revocation and recovery; anonymous rejection; customer/host denial of admin actions; cross-account read/write denial including forged owner IDs; admin bootstrap unavailable to public; MFA/recovery validation; server-side invalid-input rejection; secret-free client bundles; clean-database migration and rollback/restore rehearsal in isolated environment; safe non-production seeds; CI lint/typecheck/build/test; public route and WhatsApp regression checks at mobile/desktop sizes. Provider selection must prove compatibility with the pinned Next.js/React runtime first.

Later gates: real PostgreSQL overlap races including maintenance/holds; timezone and pricing policy boundaries; booking state-machine transitions; duplicate/reordered/late callbacks and reconciliation; private file access; subscription downgrade/expiry semantics; cancellation and recovery paths. None are claimed complete.

# Phase 0 test report

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

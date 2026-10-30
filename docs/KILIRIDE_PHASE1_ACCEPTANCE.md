# KiliRide Phase 1 final acceptance

Date: 2026-10-30, Africa/Nairobi. Scope: `docs/prompts/CODEX_PROMPT_002.md`, milestones 1A-1D, local development/test only. Branch: `verify/phase1-final-acceptance`.

**Verdict: PASS for local Phase 1 acceptance.** All required final local checks passed, including six unit tests and eight integration/browser tests. The initial browser timeout and its successful focused/full reruns are recorded below; its cause was not established. This is not production release approval.

| Acceptance criterion | Result / evidence |
|---|---|
| PostgreSQL development setup works | PASS: healthy isolated containers; development and test migration status current. |
| Reproducible Prisma migrations | PASS: fresh disposable database, repeat no-op, history/checksum and schema-object assertions. |
| Signup/login, secure sessions/logout | PASS: real API and browser journeys; HttpOnly/SameSite cookie assertion, expiration and revocation checks. |
| Verification and recovery | PASS: local Mailpit links; required verification; reset, old-password rejection and replay denial. |
| Server roles, private data and no public ADMIN assignment | PASS: role/ownership checks, forged signup fields, negative provisioning, protected mutations and MFA tests. |
| Catalogue and WhatsApp preserved | PASS: browser URL/quote regression and pricing/ID unit coverage. |
| Relevant automated tests | PASS on final full run: 6 unit and 8 integration/browser tests. |
| TypeScript, ESLint and production build | PASS, exit 0 for each. |
| Failures/skips documented | PASS: chronology and limitations below. |

## Isolation and database evidence

- `docker compose ps`: PostgreSQL development/test and Mailpit are healthy. Development maps loopback port 55432; test maps loopback port 55433; separate containers and volumes remain intact.
- Sanitized configuration inspection confirms `DATABASE_URL` targets `127.0.0.1:55432/kiliride_dev` and `TEST_DATABASE_URL` targets `127.0.0.1:55433/kiliride_test`. Credentials were not printed.
- `scripts/local-safety.mjs` now rejects test targets unless the database is exactly `kiliride_test`, host is loopback, port is explicitly 55433, and query/fragment overrides are absent. Unit tests include remote, development, wrong-name, default-port, 5432, 55432 and query-override rejection.
- `scripts/run.mjs` overrides the application database URL with the validated test URL for tests, their server and test migration status. `playwright.config.ts` always uses `reuseExistingServer: false`, including outside CI.
- The occupied-server unit test binds a dummy server on localhost:3100 and confirms Playwright exits with its port-conflict error after readiness probes only. No browser flow or authentication request reaches that process.
- Integration setup checks `DATABASE_URL === TEST_DATABASE_URL` and queries `current_database()`. API-created fixture users are then retrieved from the test connection. Operator provisioning subprocesses explicitly inherit that same test URL.
- Read-only routing inspection during acceptance found zero `phase1-%@kiliride.test` users in development, and test fixtures in the test database. Both had one completed migration. This corroborates routing; it is not a full data-integrity comparison.
- `prisma validate` passed. Development `prisma migrate status` and `node scripts/run.mjs status-test` both report the schema is up to date.

## Migration rehearsal

`node scripts/rehearse-migrations.mjs` creates a random, previously nonexistent `kiliride_rehearsal_<uuid>` database on the isolated test PostgreSQL instance at port 55433. Its separate restricted Prisma config does not widen the application's database allowlist. No migration SQL or Prisma version changed.

Successful target: `kiliride_rehearsal_e827880878284af49ea4668b3fc61d17`.

Executed checks passed: zero initial public tables; applied `202610290001_identity`; second deploy reported no pending migrations; migration status current; history unchanged on repeat; SQL SHA-256 matches the stored migration checksum; nine public tables; both application triggers present; a rolled-back synthetic insert received only CUSTOMER. The existing development/test databases were not migrated or reset.

The successful disposable database is retained for inspection. An earlier sandbox-blocked attempt also retained the empty database `kiliride_rehearsal_b518cb7b0aa74c6badd60772588920d6`. No database was dropped, truncated or reset. The initial subprocess restriction was resolved through an authorized retry.

## Security and regression coverage

`tests/integration/identity.spec.ts` exercises real PostgreSQL, Better Auth and Mailpit:

- Signup with forged ADMIN/role/MFA fields still grants CUSTOMER only; unverified login is refused.
- Email verification, password recovery/reset, reset-token replay denial, old-password rejection, session revocation, expiration and logout.
- Own-account access; customer, host and administrator cross-account denial; protected host/admin pages.
- MFA enrollment and login challenge, local administrator provisioning and pre-grant session revocation.
- Rejected provisioning for unverified users, verified users without MFA and incomplete MFA enrollment; no ADMIN grant or audit event results.
- CUSTOMER and HOST denial of administrator host activation; permitted activation by MFA ADMIN; invalid and missing Origin rejection; forbidden extra role fields; unchanged audit count after rejected requests.
- Invalid recovery-code rejection, successful first use, logout/new login challenge, consumed-code replay rejection with no authenticated session, and successful use of a different unused recovery code.
- Anonymous, invalid-input and oversized-input rejection; audit UPDATE and DELETE protection.
- Browser signup, delivered verification link, login, account view, logout and protected-page redirect.

`tests/integration/frontend.spec.ts` checks the catalogue, stable vehicle URL, three-day KES 11,000 WhatsApp preview/destination, unknown vehicle and removed SGR 404s, labels, keyboard navigation and 375px/1280px layouts. No WhatsApp message is sent. Unit tests preserve legacy IDs, pricing and Nairobi/New York/London date-boundary behavior; these do not approve commercial fee policies.

## Execution results

| Check | Exact command / method | Actual result |
|---|---|---|
| Infrastructure | `docker compose ps` | PASS: development/test PostgreSQL and Mailpit healthy. |
| Schema | `node node_modules/prisma/build/index.js validate` | PASS. |
| Development status | `node node_modules/prisma/build/index.js migrate status` | PASS: one migration, schema up to date. |
| Test status | `node scripts/run.mjs status-test` | PASS: one migration, schema up to date on 55433. |
| Clean migration rehearsal | `node scripts/rehearse-migrations.mjs` | PASS: initial deploy, repeat no-op, status and assertions above. |
| Unit tests | `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts` | PASS: 6/6, including real occupied-server rejection. |
| Initial integration/browser run | `node scripts/run.mjs test` | FAIL: 7 passed, browser signup timed out awaiting its POST after 180 seconds; 4.2 minutes total. |
| Focused browser diagnosis | `node scripts/run.mjs test identity.spec.ts --grep "customer completes"` | PASS: 1/1, 10.1 seconds total. |
| Final integration/browser run | `node scripts/run.mjs test` | PASS: 8/8, 1.3 minutes total; no test retries configured. |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS, including after diagnostic/test changes. |
| ESLint | `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, zero warnings. |
| Production build | `npm.cmd run build` | PASS: Next.js 16.4.3; all 15 static pages generated and dynamic routes compiled. |
| Full dependency audit | `npm.cmd audit --json` | PASS: zero reported advisories, including development dependencies. No packages upgraded. |
| Runtime audit | `npm.cmd audit --omit=dev --audit-level=high` | PASS: zero reported vulnerabilities. |
| Client secret boundary | In-memory Node scan of `.next/static` JS/maps against configured auth secret, DB password and DB URLs | PASS: 16 artifacts, no matches; values not printed. |
| Whitespace | `git diff --check` | PASS; LF/CRLF notices only. |

Sandbox restrictions initially blocked Docker access, Git branch creation and Prisma/test subprocesses. Authorized escalated retries succeeded. No sandbox failure is reported as a passing run. An early sanitized configuration-inspection command also failed due to PowerShell quoting; its stdin-script retry succeeded without exposing credentials.

The initial browser failure occurred at signup submission and emitted a React update-before-mount warning. A bounded, jointly awaited click/response diagnostic now reports only path/query key names on failure, never credential values. The focused rerun and complete eight-test rerun passed. No application fix or established root cause is claimed; this remains an intermittent browser-test observation (P2) to investigate if it recurs. Existing smooth-scroll and NO_COLOR/FORCE_COLOR notices were non-fatal.

## Changes and boundaries

Changed: `playwright.config.ts`, `scripts/local-safety.mjs`, `scripts/run.mjs`, `tests/unit/foundation.test.ts`, `tests/integration/identity.spec.ts`, `.github/workflows/ci.yml`, `docs/KILIRIDE_LOCAL_SETUP.md`, `docs/KILIRIDE_PHASE1_REPORT.md`, `docs/KILIRIDE_TEST_REPORT.md`.

Added: `tests/unit/server-isolation.test.ts`, `scripts/rehearse-migrations.mjs`, `scripts/rehearsal.prisma.config.ts`, this acceptance report.

Schema/migration changes: none. Dependency/version changes: none. No production connection, deployment, database reset, live payment, fleet migration or Phase 2 work. Local synthetic fixtures and their audit history are retained.

## Limitations and stop boundary

Remote GitHub Actions execution is unverified; its workflow now includes test migration status and disposable migration rehearsal. Production hosting/TLS, real email, production DB privileges, full accessibility/device coverage and legal/privacy/retention work remain outside this local Phase 1 acceptance. The earlier backup/restore rehearsal remains historical evidence; this task rehearses migration application, not a new restore.

No failing local Phase 1 acceptance check remains in the final run. The earlier report's five dependency advisories are historical; this run reports zero. API recovery/MFA coverage is automated; the human-facing browser journey covers signup/verification/login/logout, not every recovery/MFA screen. No separate manual device or screen-reader session was performed.

Stop after this acceptance verification. Any Phase 2 work requires separate authorization and its pending product decisions.

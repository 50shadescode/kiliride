# MVP release 002: B03 secure hosted runtime

Date: 2026-11-13. ENGINEERING: PASS for provider-independent foundation and local gates. HOSTED CONFIGURATION: PENDING. STAGING DEPLOYMENT: BLOCKED pending external setup and verification. B03 remains PARTIAL, not a closed launch blocker.

## Scope and checkpoint

Branch `feature/phase2-fleet-management`; HEAD `00bcd074119d1bd9fe550244ceef2404082bcffa`, `feat: complete Phase 2F catalogue and security closeout`. Phase 2F is committed. Initially only `docs/prompts/CODEX_PROMPT_MVP_RELEASE_002.md` was untracked; preserved. The task file reports the prior GitHub workflow passed; this task did not independently query that run or execute hosted CI for the new uncommitted candidate. Earlier reports describing HEAD 4571bdc are historical.

No deployment, commit, push, paid provisioning, real SMTP delivery, real policy authorization or catalogue publication occurred. No schema, migration, package or lockfile change. B05 durable storage and all later launch tasks remain outside this change.

## Implementation and files

- `src/server/runtime-config.ts`, `src/server/env.ts`: explicit development/test/staging/production validation, sanitized failures, exact local database isolation and explicit hosted identity expectations; no production fallback to localhost. Hosted catalogue must remain false.
- `next.config.ts`, `src/instrumentation.ts`: early production configuration validation and instrumentation defense in depth. Build does not require hosted credentials. Production start does.
- `src/server/db.ts`, `src/server/database-role.ts`, `scripts/check-hosted-database.ts`, `scripts/hosted.prisma.config.ts`: verified TLS pg options, bounded pool/timeouts, separate operator migration credentials/configuration, read-only identity/role preflight. Existing local migration guards and all six migrations retained.
- `src/server/auth.ts`, `src/app/api/auth/[...all]/route.ts`: explicit Secure/HttpOnly/SameSite cookies for hosted mode, canonical HTTPS URL/Host/Origin checks, no forwarded origin/IP trust. Existing MFA, role checks, session and recovery behavior retained. Shared hosted rate-limit bucket is conservative; actual edge/client-IP integration is pending.
- `src/server/mail.ts`: authenticated TLS SMTP (465 implicit or 587 required STARTTLS), explicit delivery switch, staging recipient allowlist, canonical identity links and redacted failures. Local Mailpit retained. Disabled delivery does not claim successful verification/recovery mail.
- `.env.example`, `scripts/local-env.mjs`, `scripts/run.mjs`: explicit modes for generated local manifests and isolated tests; existing local secret file preserved.
- `tests/unit/runtime-config.test.ts`, `tests/database/runtime.test.ts`: configuration, cookies/origins, TLS, role boundaries and missing-secret startup-hook coverage. Existing fleet/browser tests remain intact.
- `scripts/check-client-secrets.mjs`, `.github/workflows/ci.yml`: scan configured secrets and server-module markers in client artifacts after build. Existing full/runtime zero-advisory CI policy retained.
- Documentation: this report, `KILIRIDE_HOSTED_RUNTIME.md`, `KILIRIDE_MVP_LAUNCH_GAP_REPORT.md`, `KILIRIDE_TEST_REPORT.md`, `KILIRIDE_ARCHITECTURE.md`, `KILIRIDE_RELEASE_CHECKLIST.md`.

See [runtime contract](KILIRIDE_HOSTED_RUNTIME.md) for sanitized examples and every required variable: KILIRIDE_ENV, DB_ENVIRONMENT, DATABASE_URL, DB_EXPECTED_HOST/NAME/USER, optional DB_POOL_MAX/DB_TLS_CA_PEM, BETTER_AUTH_URL/SECRET, SMTP_HOST/PORT/TLS/USER/PASSWORD, MAIL_FROM, SMTP_DELIVERY_ENABLED, SMTP_ALLOWED_RECIPIENTS, KILIRIDE_DB_CATALOGUE. Separate migration jobs use MIGRATION_DATABASE_URL, DB_MIGRATION_USER and optional DB_MIGRATION_TLS_CA_FILE; runtime/test URLs must be absent from that job.

## Verification evidence

Node v24.14.1; npm 11.11.0. All results are local unless explicitly described as registry access.

| Gate | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint -- --max-warnings 0` | PASS |
| `npm run test:unit` | PASS, 22/22 |
| `node scripts/run.mjs test-fleet` | PASS, 30/30, 31.60s |
| `npm run test:integration` OFF | PASS, 16/16, 2.7m |
| Same command ON catalogue suite | PASS, 3/3, 25.5s |
| Prisma validate | PASS, Prisma 7.10.1; local and synthetic hosted configuration (offline only) |
| Local/test migration status | PASS, six migrations current on both |
| `node scripts/rehearse-migrations.mjs` | PASS: six migrations on fresh isolated DB, repeat deploy no-op, history/checksums, 19 tables/18 triggers and probes; rehearsal database retained |
| `npm run build` | PASS |
| `node scripts/check-private-traces.mjs` | PASS, 41 traces exclude private storage/backups/env files |
| `node scripts/check-client-secrets.mjs` | PASS, 25 client artifacts; limited to configured values/module markers, not proof about future host secrets |
| Online full audit, `--offline=false --audit-level=low` | PASS, zero low/moderate/high/critical |
| Online runtime audit, additionally `--omit=dev` | PASS, zero low/moderate/high/critical |
| CI YAML parse/scan-step assertion; `git diff --check` | PASS; hosted CI for this candidate not run |

Both audits also used `--fetch-retries=0 --fetch-timeout=20000`; JSON evidence is in ignored `backups/release002-audit-full.json` and `backups/release002-audit-runtime.json`. Dependencies unchanged: before/after full 0/0, runtime 0/0. No exception/waiver needed.

An initial OFF browser run passed 15/16; host flow failed with ECONNRESET, not an assertion mismatch. Cause was not established; no test was weakened. Full rerun passed all 19 OFF/ON tests. Nonfatal destination-stream, NO_COLOR and smooth-scroll warnings appeared. An actual production startup smoke test exposed Next logging Ready before instrumentation failure; production-phase configuration validation was added to correct this. Final actual `next start --hostname localhost --port 3103` with a missing hosted secret exits 1 with the sanitized configuration error. Next prints an optimistic Ready message before loading configuration even on this rejected startup; do not use that banner as a health check. Unlike instrumentation-only failure, the final process terminates (no timeout). TypeScript, strict lint, all 22 units, build and both artifact checks were rerun after this correction and passed. The final 30 database and 19 browser tests preceded this production-start-only correction.

Preservation checks: all 19 development tables unchanged; pre-existing persistent test rows retained except the existing legacy replay test's documented update/restore of `note-131c` description/revision (two increments per run). Ten prior test RateLimit rows changed/expired; no prior Session/Verification changes. All 341 prior image hashes unchanged; 419 current active objects match references, sizes and SHA-256 with no orphans/pending cleanup. Both legacy listings remain unassigned DRAFT with original prices and no photos/reviews/decisions; no real policy exists in either local database. Synthetic test policies/objects are retained. No reset or cleanup was performed.

## Remaining B03 acceptance before staging sign-off

1. Supply approved hosting/domain/region and distinct staging secret manifest. Verify invalid manifests prevent startup and secret values never enter hosted logs/client artifacts. Keep catalogue false.
2. Provision separately authorized PostgreSQL runtime and migration identities. Verify certificate/hostname rejection, expected DB/user, restricted role/grants and forbidden DDL/audit mutation; apply reviewed migrations in an authorized job, repeat no-op, check backup/restore prerequisites. The read-only preflight does not validate every table grant or enforce privileges automatically.
3. Configure HTTPS edge to enforce canonical host, replace forwarded headers and prevent direct origin access. Through that edge verify Secure/HttpOnly/Lax cookies, hostile/missing POST Origin rejection, session/login/logout, MFA, verification and reset callbacks. Review shared rate-limit bucket and approve client-IP/edge controls before pilot traffic.
4. Authorize SMTP account/sender and test recipients, verify SPF/DKIM/DMARC, certificate/TLS and actual verification/recovery delivery. Confirm delivery disable/allowlist restrictions and sanitized failure logs. No real SMTP connection or delivery has been tested.
5. Verify pool sizing/lifecycle under actual host concurrency. Existing private image adapter still rejects remote database operation; B05 storage is not implemented or bypassed. B03 does not authorize inventory onboarding/publication.

No provider credentials, remote TLS/auth/email success, backups/restores or infrastructure readiness are inferred from unit tests. Local engineering is reviewable; staging deployment and real-user launch remain blocked pending external evidence and separate authorization. Stop here; no subsequent milestone started.

Final Git status: 14 tracked files modified, 10 new task implementation/documentation files untracked, plus the preserved user prompt untracked. HEAD and branch unchanged; nothing staged or committed. Package manifests, lockfile, Prisma schema/migrations and fleet implementation have no diff.

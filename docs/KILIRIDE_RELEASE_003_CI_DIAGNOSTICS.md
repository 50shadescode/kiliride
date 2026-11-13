# Release 003 recovery CI failure: diagnosis and fix

## Demonstrated root cause

The original `scripts/rehearse-image-recovery.ts` called `mkdir(backups/release003-recovery-<uuid>, { recursive: false })` without creating its parent. `backups/` is ignored and has no tracked files. A fresh GitHub checkout therefore lacks that directory, and no preceding workflow step creates it. The successful Windows workspace already contained backups from earlier milestones. The first artifact-directory creation fails with **ENOENT / mkdir**, before database creation or any recovery subprocess.

Reproduced the exact original filesystem operation in a new temporary workspace inside a network-disabled Linux container (`n8nio/n8n:latest`, Node v24.18.0): `parentExists:false`, `code:ENOENT`, `syscall:mkdir`. This is a clean-workspace bug, not a Windows path-separator bug. The supplied GitHub output alone does not contain its hidden exception; the diagnosis is demonstrated by reproducing the deterministic failure under the workflow's missing-parent condition. A new hosted GitHub run is still pending separate commit/push authorization.

## Where evidence was hidden

- Final `main().catch(() => ...)` discarded the actual Error and printed only the reported generic sentence.
- The Docker wrapper replaced any failed `pg_dump`/`pg_restore` result with a generic error, losing exit code, signal, spawn error and stderr.
- The Prisma migration assertion checked status but omitted migration stderr/stdout and process-launch error.
- `verifyImageManifest` deliberately catches missing/corrupt object reads and returns discrepancy keys. Those catches are part of the negative integrity tests, not the root cause; that service is unchanged.

## Fix and safe diagnostics

`scripts/recovery-diagnostics.ts` creates only the backup parent idempotently, checks that it is a real directory rather than a symlink/junction, then creates the unique run directory exclusively. A repeated run-directory name still fails; no existing directory, database or artifact is reset, deleted or overwritten.

The rehearsal records stages for configuration, directory creation, database creation, migration, fixture creation, object checkpoint, pg_dump, checkpoint persistence, pg_restore, manifest comparison, negative probes, restored reads, each table comparison and cover/order/trigger verification. Fatal output is structured JSON with stage, error name/code/syscall and sanitized message. Subprocess failures include operation, exit code (including null on spawn failure), signal, sanitized launch error and stderr. Prisma's textual stdout is included on failure; binary database dumps are never logged. Known environment secrets, decoded database passwords, URLs and sensitive headers/assignments are redacted; text is bounded. Assertion actual/expected data and raw stacks are omitted to avoid leaking database rows.

When a run directory exists, sanitized diagnostics are also written exclusively to `failure.json`. Failure to write diagnostics remains fatal; the original error still appears on stderr. CI uploads only these sanitized JSON files for seven days on failure. It does not upload dumps, image bytes or environment files. Failures before a run directory exists remain in the CI log. The recovery step is still unconditional, has no continue-on-error, and has not been skipped or disabled.

## Environment comparison and subprocess audit

| Requirement | Local success / CI comparison |
| --- | --- |
| Backup parent | Existing locally; absent on a fresh checkout. This is the reproduced discrepancy and fixed assumption. |
| Paths / working directory | `path.resolve`/`path.join` are portable. Both invoke from repository root. No Windows-only drive path or shell syntax is used by the rehearsal. |
| Node / dependencies | Local Node24.14.1, npm11.11.0; CI setup-node24 and npm ci. Linux reproduction used available Node24.18.0. tsx, Sharp and SDK come from the lockfile. |
| PostgreSQL connection | Both use `scripts/local-env.mjs` generated TEST_DATABASE_URL and Compose postgres-test. Guard requires local port55433/kiliride_test. No developer password is hardcoded in the rehearsal. |
| PostgreSQL CLI user | `-U kiliride` matches compose.yaml POSTGRES_USER in both environments. pg_dump/pg_restore run inside postgres-test, using its local socket and PostgreSQL17 tools. |
| Docker / interaction | CLI invokes `docker compose exec -T postgres-test`, so no TTY/interactive prompt is required. Binary dump uses Buffer stdout; restore receives Buffer stdin. Timeouts120s and maxBuffer32MiB remain unchanged. |
| Prisma subprocess | Uses process.execPath, reviewed scripts/rehearsal.prisma.config.ts and explicit REHEARSAL_DATABASE_URL. It targets only newly named local rehearsal DBs. Migration failures remain fatal. |
| CI resources | Docker Compose services, DB generation/migrations and Node dependencies precede recovery. No object-storage provider, cloud credentials or external S3 service is required; signed synthetic protocol storage is used. |

Linux reproduced the original failure and tested the actual fixed helper with a read-only script mount and new temporary files, including EEXIST preservation and sanitized exit-code diagnostics. The complete PostgreSQL/object rehearsal was rerun locally against Linux PostgreSQL containers from the Windows host. A full Ubuntu GitHub runner was not recreated; no claim of hosted CI success is made. An initial helper-only Linux attempt encountered Node native type-stripping's unsupported constructor parameter-property syntax; the helper now uses ordinary property declarations, and the Linux retry passed. CI continues to use tsx as before.

## Executed results

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint -- --max-warnings 0`: PASS.
- `npm.cmd run test:unit`: **26/26 PASS**, 6.146s. Three diagnostics regressions cover missing parent/exclusive directories, redaction/exit codes/timeouts/spawn errors/assertion-value exclusion, and execution of the actual rehearsal with a conflicting artifact. That injected failure exits1, reports create-artifact-directory with EEXIST/ENOTDIR, emits no PASS and leaves the artifact unchanged.
- Exact requested recovery command: **PASS**, final run **5,255ms**, 19 tables, 18 triggers, two images, original manifest/hash/size/negative-probe/cover/order checks. An earlier corrected run also passed (5,977ms).
- Final new source: `kiliride_rehearsal_88f94b4d17ff4692b335d6942aa80711`; new target: `kiliride_rehearsal_a034be8780ce4a0a9a6189d539e984b8`. Artifacts retained in ignored `backups/release003-recovery-0edc94d1-63fe-472e-ae7f-c3ab4bd4353b`.
- CI YAML parsing and explicit assertion that recovery is unconditional/fatal and upload selection is only failure.json: PASS.
- `git diff --check`: PASS.
- Before/after preservation fingerprints: both existing databases' 19 tables unchanged, including zero Session/Verification/RateLimit changes; all **494 pre-existing image hashes unchanged**. Existing backup/failure artifacts were not deleted or overwritten. All new test/recovery destinations retained.

Recovery validation requirements are unchanged: empty target, all existing migrations, matching journal manifest, SHA-256/size verification, missing/corrupt/unknown detection, independent image copies/new client, row-by-row equality across every public table, photo order/single cover and 18-trigger assertion. The migration status assertion is replaced by an equivalent nonzero-fatal check that additionally catches spawn errors. No application storage, schema, migration, authorization, publication or recovery-service code changed. Full application browser/database mutation suites were not rerun for this tooling-only fix; the complete isolated recovery and relevant unit/type/lint checks were run without mutating existing data.

## Files and stop boundary

Modified: `scripts/rehearse-image-recovery.ts`, `.github/workflows/ci.yml`, `docs/KILIRIDE_MVP_RELEASE_003_REPORT.md`, `docs/KILIRIDE_TEST_REPORT.md`. Added: `scripts/recovery-diagnostics.ts`, `tests/unit/recovery-diagnostics.test.ts`, this report.

Branch `feature/phase2-fleet-management`; HEAD `321ac59` unchanged; initial working tree clean. No commit, push or deployment. Hosted storage/recovery remain pending and no publication policy was activated. Stop for review and separately authorized CI rerun.

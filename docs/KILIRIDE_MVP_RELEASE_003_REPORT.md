# MVP release 003: B05 durable private vehicle storage

Date: 2026-11-13, Africa/Nairobi.

- **ENGINEERING: PASS** for the implemented foundation and executed local gates.
- **HOSTED STORAGE: PENDING**. No cloud endpoint, credentials, real IAM/TLS or provider compatibility tested.
- **RECOVERY VALIDATION: VERIFIED for isolated synthetic local recovery only; hosted disaster recovery PENDING.**
- **B05 BLOCKER: PARTIAL**. Engineering complete for this slice; provider and operating acceptance remain launch blockers.

## Scope and checkpoint

Confirmed branch `feature/phase2-fleet-management`; HEAD `cd10bcf73007bc12803862f93bd8b20be008f144` (`feat: establish secure hosted runtime foundation`). Initially only `docs/prompts/CODEX_PROMPT_MVP_RELEASE_003.md` was untracked; preserved. User/task report Phase 2F and B03 CI passed; no independent hosted run was queried in this task, and no hosted CI result exists for these uncommitted B05 changes.

No deployment, paid provisioning, real cloud credential use, genuine image transfer, commit, push, real approval, publication, payment/booking/subscription work or subsequent milestone. All six existing migrations and the Prisma schema are unchanged. Development/test database isolation and existing filesystem locations are preserved. B03 external acceptance remains pending independently of B05.

## Implementation and changed files

| Paths | Change / evidence |
| --- | --- |
| `src/server/images/config.ts`, `src/server/runtime-config.ts` | Explicit hosted S3 settings, environment/host/bucket/prefix checks and sanitized startup rejection; hosted mode cannot fall back to filesystem. Local/test reject S3 settings. |
| `src/server/images/s3.ts`, `src/server/images/storage.ts` | Official signed S3 client; private/versioned bucket checks; validated TLS, bounded requests/streams, conditional immutable PUT, explicit checksum/encryption, no URLs returned; existing local adapter retained. |
| `src/server/images/service.ts` | Remote ambiguous-write grace, retained cleanup tombstones and cursor pagination; original ownership/revision/transaction/lifecycle/cover/order logic retained. |
| `src/server/images/recovery.ts`, `scripts/hosted-images.ts` | Read-only manifest/inventory size/hash checking and explicit authorized hosted inspect/reconcile entry points; unknown objects never deleted automatically. No hosted command executed. |
| `scripts/reconcile-images.ts` | Existing local command now sets the matching explicit runtime mode for dev/test. |
| `scripts/rehearse-image-recovery.ts` | New-destination-only synthetic PostgreSQL dump/restore plus image backup/recovery/integrity drill. |
| `tests/helpers/s3.ts`, `tests/database/s3.test.ts`, `tests/unit/storage-config.test.ts`, `tests/unit/runtime-config.test.ts` | SDK signed-request protocol double, stored synthetic bytes, fail-closed configuration, fault/timeout/restart and journal tests; existing B03 tests supplied valid new storage fields. |
| `scripts/run.mjs`, `.github/workflows/ci.yml` | S3 tests included in database gate; coordinated synthetic recovery added to CI. |
| `scripts/check-client-secrets.mjs` | Added storage credential values and server-module markers to client-artifact scan. |
| `package.json`, `package-lock.json` | Pinned `@aws-sdk/client-s3` 3.1168.0 and `@smithy/node-http-handler` 4.14.2; 25 new lock entries, zero existing package entry changes. |
| Documentation | This report; new `KILIRIDE_PRIVATE_STORAGE_RECOVERY.md`; updated hosted runtime, architecture, data model, test report, release checklist and launch gap report. |

The official SDK supplies signing/protocol behavior instead of handwritten authentication. Registry engine requirement Node >=20 is compatible with Node v24.14.1. The handler gives explicit TLS/socket/timeouts; no unrelated dependency upgrade, forced fix or lockfile deletion. Full/runtime online audits both report zero findings; no exception/waiver. Review of the lockfile confirmed no existing package entry changed.

## Storage and security contract

See [private storage/recovery runbook](KILIRIDE_PRIVATE_STORAGE_RECOVERY.md) for all sanitized configuration and operational steps. Required hosted variables: `STORAGE_DRIVER=s3`, `STORAGE_ENVIRONMENT`, `STORAGE_ENDPOINT`, `STORAGE_EXPECTED_HOST`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_EXPECTED_BUCKET`, `STORAGE_PREFIX`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`. B03 variables remain required. Staging/production have distinct bucket suffixes, prefixes and approved credentials; default credential discovery is not used. Config declarations do not prove actual provider ownership or isolation.

Every adapter operation requires all four public-access blocks, nonpublic policy status, owner-only ACL and enabled bucket versioning. Unsupported/private-inspection APIs fail closed; provider must implement this contract. PUT uses generated UUID key, If-None-Match, SHA-256, AES256 encryption and private/no-store cache metadata. HTTPS verifies certificates/hostnames with system roots/minimum TLS1.2. No automatic SDK retries; connection 2s/request 5s/operation 6s bounds. GET streams at most 5MiB and checks type/length; application reads still verify PostgreSQL SHA-256. Provider errors are redacted. No public bucket routes/presigned capabilities or storage metadata enter DTOs.

Existing normalization, actual-content checks, metadata stripping, dimensions, count/throttle limits, HOST ownership, MFA ADMIN reviewer permissions, unpublished access and suspension withdrawal remain in their existing services/tests. Public publication guards and policy register have no diff. Test S3 requests traverse actual SDK serialization/signing but use a local protocol double; no real network TLS or external SigV4 verification is claimed.

## Consistency and recovery behavior

PENDING is committed before PUT; ACTIVE/photo/audit/revision activate atomically. Successful PUT followed by database timeout leaves the old photograph and revision intact, with PENDING for cleanup. Remote unknown outcomes wait at least one hour before reconciliation. Remote DELETE_PENDING tombstones are retained indefinitely and retried so a late provider PUT is not forgotten. Cleanup locks/rechecks references and cannot remove ACTIVE/referenced objects. Cursor pages prevent retained tombstones starving later records. Known deletes are idempotent; unknown objects are report-only. Retention/cost of repeated versioned delete markers and tombstones require operational review before hosting.

Duplicate stale expectedRevision requests conflict, and simultaneous edits remain serialized. After a lost response the caller reloads the gallery; no claim of a new HTTP receipt/idempotency-key API is made. Replacement preserves photo ID/position/cover; missing/corrupt reads fail closed. Local cleanup behavior is preserved; tests retire only their known synthetic tombstones or use the existing isolated local reconciler semantics.

The recovery drill created source `kiliride_rehearsal_ca1e4eda2603481780d6edc721929f9b` and empty target `kiliride_rehearsal_8407343dfeb2434ba471e77f566be024` on local test PostgreSQL. Quiescent pg_dump/pg_restore matched all 19 tables and 18 triggers. Two synthetic images restored to a separate directory, verified SHA-256/size through a fresh SDK client; positions/covers matched. Missing/corrupt/unknown detection passed. Measured local drill: **5,226ms**, not a hosted RTO claim. Artifacts retained under ignored `backups/release003-recovery-be3f26b2-be96-45d6-9c80-942ed9103dc5` with dump checksum/manifest and independent source/backup/restored directories. Existing DBs/storage were not restored over. All locations are on one machine; separate cloud failure-domain recovery is still pending.

Runbook specifies coordinated writer/cleanup freeze, DB and exact-object checkpoint manifests, independent private backups, restore to new destinations, integrity/authorization validation and separately approved promotion. Proposed pilot RPO <=24h/RTO <=4h and 30 daily backups are explicitly **unapproved operational targets**. Recovery owners/retention approvers are unassigned; no legal or business approval is invented.

## Executed gates

Node **v24.14.1**, npm **11.11.0**. Final results:

| Command/check | Result |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run lint -- --max-warnings 0` | PASS, zero warnings |
| `npm.cmd run test:unit` | PASS 23/23, 3.733s |
| `npm.cmd run test:fleet` | PASS 32/32, 58.514s; includes 6s request abort and real 15s database transaction deadline after successful PUT |
| `npm.cmd run test:integration` | PASS OFF 16/16 and ON 3/3 (ON 39.2s); identity/recovery/MFA, HOST/ADMIN, image authorization, responsive 375px/1280px, catalogue/WhatsApp and suspension regression |
| `node node_modules/prisma/build/index.js validate` | PASS |
| `node node_modules/prisma/build/index.js migrate status`; `node scripts/run.mjs status-test` | PASS; both six migrations current |
| `node scripts/rehearse-migrations.mjs` | PASS; fresh `kiliride_rehearsal_14f676ac8258477593cd8eddf2425ffb`, six migrations/repeat no-op/checksums/19 tables/18 triggers/isolation probes; retained |
| `node --conditions=react-server --import tsx scripts/rehearse-image-recovery.ts` | PASS coordinated synthetic recovery, as above |
| `npm.cmd run build` | PASS, Next16.4.3, 13 prerendered pages and unchanged route set |
| `node scripts/check-private-traces.mjs` | PASS 41 traces exclude private files/backups/env |
| `node scripts/check-client-secrets.mjs` | PASS 25 client artifacts; configured secret/module-marker check, not proof about future hosted secrets |
| `npm.cmd audit --offline=false --audit-level=low --fetch-retries=0 --fetch-timeout=20000` | PASS 0 findings |
| Same audit with `--omit=dev` | PASS 0 findings |
| CI YAML parse, dependency lock comparison, `git diff --check` | PASS; hosted CI for this candidate not executed |

First typecheck found one implicit-any annotation in the synthetic SDK request handler; fixed without weakening a test. Initial dependency registry access and a read-only Git subprocess hit sandbox restrictions; authorized retries succeeded. Existing NO_COLOR and smooth-scroll notices were nonfatal. First 32-test DB run passed; final run extended timeout/fault coverage and also passed. Browser regression covered the application storage/journal implementation. Subsequent changes expanded test/recovery tooling; final review also set the SDK handler throwOnRequestTimeout=true explicitly (the tested six-second operation abort was already present). TypeScript, lint, build and artifact scans were repeated after that option change. No skipped local required gate is presented as passing. Full physical-device/accessibility and real-host checks remain external acceptance.

## Data preservation

Before work, ignored `backups/release003-preservation.mjs` fingerprinted all 19 tables in both existing DBs and all 419 existing images. Final verification: development all tables exactly unchanged; existing test persistent records unchanged except the pre-existing legacy replay test's update/restore of `note-131c` description/revision (two increments per full suite, two runs). Eleven prior RateLimit rows changed/expired; prior Session/Verification rows unchanged. All 419 prior image hashes unchanged. Final 494 ACTIVE objects match references, bytes and hashes; no orphans or pending cleanup. No real policy exists in either DB; both legacy vehicles remain unassigned DRAFT, original prices, no photos/reviews/decisions. Synthetic test additions remain isolated; 75 test-only policies, zero development policies.

## Remaining B05 launch blockers and acceptance

1. **LAUNCH BLOCKER: provider/private configuration.** Select/authorize provider, region, private versioned bucket and separate environment credentials. Demonstrate supported policy/ACL/version APIs, anonymous/cross-account denial, TLS rejection, conditional PUT, checksum/encryption, bounded outage behavior and client/log secrecy. Run the read-only operator inspect using only synthetic authorized staging records first.
2. **LAUNCH BLOCKER: hosted reconciliation operation.** Assign owner, provision separately authorized schedule/alerts, run failed PUT/DB commit/delete/late-completion scenarios against the provider; show retries preserve active photos, retained tombstones remove late writes and unknown objects are not deleted. Approve marker/tombstone retention/cost and capacity beyond the bounded inspection limit if needed.
3. **LAUNCH BLOCKER: independent coordinated recovery.** Approve retention/RPO/RTO and named recovery owners. Back up an authorized synthetic hosted DB/object checkpoint to a separate failure/account domain, recover into new destinations with source inaccessible, and retain manifest/checksum, all-reference integrity, role-access and measured recovery evidence. Do not infer this from the same-machine drill.
4. **Release evidence:** review uncommitted changes and obtain matching CI only after separately authorized commit/push. B03 hosted acceptance and B06/B07 real approval/publication gates remain independent and blocked; no scope expansion here.

Final working tree: 16 tracked paths modified, 10 new B05 implementation/test/documentation files and the preserved user prompt untracked; nothing staged. HEAD/branch unchanged, no staging/commit/push/deployment. Stop after B05 local implementation.

# B05 private storage and coordinated recovery

This is an implementation contract and operator runbook, not infrastructure evidence or authorization. Hosted storage/recovery remain pending. Never upload genuine local photographs as a test. The isolated S3 protocol double is not a deployed S3 service and does not certify provider interoperability, TLS, IAM, versioning or durability.

## Architecture and configuration

`images/storage.ts` retains guarded `.data/vehicle-images/development` and `test` directories for local modes. Hosted modes require `images/config.ts` and select `images/s3.ts`; there is no local fallback. Existing HOST ownership, MFA ADMIN review, public eligibility and verified-byte services are reused. No bucket URL, signed URL, storage key or credential is returned in photo DTOs. Storage is private even when an application route authorizes delivery. No new document/KYC repository is introduced.

Add these **nonfunctional placeholders** to the separate B03 server manifest, never local `.env` or NEXT_PUBLIC variables:

```dotenv
STORAGE_DRIVER=s3
STORAGE_ENVIRONMENT=staging
STORAGE_ENDPOINT=https://objects.provider.example
STORAGE_EXPECTED_HOST=objects.provider.example
STORAGE_REGION=provider-region-1
STORAGE_BUCKET=kiliride-private-staging
STORAGE_EXPECTED_BUCKET=kiliride-private-staging
STORAGE_PREFIX=staging/vehicle-images/
STORAGE_ACCESS_KEY_ID=REPLACE_WITH_SCOPED_ID
STORAGE_SECRET_ACCESS_KEY=REPLACE_WITH_SCOPED_SECRET
```

Production uses its own account/credentials/bucket ending `-production`, STORAGE_ENVIRONMENT=production and prefix `production/vehicle-images/`. Expected host/bucket must match. Endpoint must be HTTPS DNS with no credentials, path, port, query or fragment; IP/local/test endpoints and TLS disable override are rejected. The supplied placeholders are rejected. Region is explicitly bounded/validated but actual region compatibility is a provider acceptance check. Separate credentials and approved manifests are still required: matching declarations alone cannot prove environment ownership/isolation. Development/test may use STORAGE_DRIVER=filesystem or leave it unset, and reject S3 settings. No environment flag selects the test double.

Official AWS SDK v3 handles signing; explicit credentials avoid ambient profile/metadata credential discovery. Requests use path-style access, no region redirects, no automatic SDK retries, TLS certificate/hostname validation and minimum TLS 1.2; system certificate roots only. HTTP connection deadline 2s, request deadline 5s, operation AbortController 6s including policy checks/body consumption, eight HTTPS sockets. Streaming reads reject missing/wrong MIME, excessive/truncated length or over-5-MiB bodies. Existing SHA-256 verification against PostgreSQL remains authoritative; ETag is not assumed to be a SHA-256 hash.

Every operation checks all four S3 public-access blocks, nonpublic bucket policy status, owner-only canonical ACL and enabled versioning before proceeding. Failure/unsupported APIs deny access. Provider must support these exact APIs; generic S3 compatibility alone is insufficient. Buckets must already exist with a policy returning nonpublic status. No provisioning or policy/ACL mutation API exists in the adapter. Provider policies must also enforce these controls against concurrent administrative changes; application checks are not a replacement for account-level controls.

Uploads are normalized server-side, immutable UUID keys under the environment prefix, signed conditional PUT (`If-None-Match: *`), explicit SHA-256 and SSE AES256. ACL headers are omitted for bucket-owner-enforced compatibility; the required bucket controls prevent public ACL use. Provider acceptance must prove conditional-write enforcement and encryption, not merely HTTP success. Delete adds a versioned delete marker; runtime never deletes versions. Read/write/delete failures are generic and redact SDK messages, keys, credentials and tokens. App authorization executes before object access.

## Permissions and external acceptance

Provision a narrowly scoped runtime identity with PutObject/GetObject/DeleteObject only under its exact prefix and the four read-only bucket inspection permissions. ListBucket constrained to the prefix is needed by the operator inventory tool; a separate operator credential may supply it. Deny public ACL/policy changes, insecure transport, unconditional overwrites, other buckets/prefixes, bucket deletion, version deletion and IAM mutation. Backups use a separate approved identity/account/destination; runtime must not be able to erase recovery copies. Verify actual anonymous GET/list denial, cross-environment credential denial, TLS mismatch rejection, credentials rotation, version recovery and backup access externally. Do not turn on publication to test storage.

## Journal, retry and reconciliation

No schema/migration change. Existing VehicleImageObject records still contain UUID key, state, size, dimensions, SHA-256 and time. PENDING commits before PUT. Parent revision and journal locks serialize mutations; ACTIVE and photo metadata/audit commit together. Replacement keeps the old photo ID/cover/order, and only swaps its key on a successful transaction. Failed transactions retain the old photograph and revision. Stale duplicate requests conflict; callers reload the gallery after an ambiguous response instead of inventing a new revision. A new user-requested upload with a newly read revision is a new operation, not a deduplicated HTTP receipt.

Remote failures leave PENDING for at least one hour; no eager remote compensation. After that grace the reconciler locks/rechecks the journal, refuses referenced/ACTIVE objects, and deletes only known abandoned objects. Remote cleanup retains DELETE_PENDING tombstones indefinitely: a provider may finish a timed-out PUT after DELETE. Repeated sweeps delete late completions without forgetting the key. Keys are never reused; tombstones cannot activate. This deliberately prefers retained records/version markers over lost cleanup intent. Operational retention and provider version lifecycle need approval; do not automatically purge tombstones or versions. Local filesystem cleanup retains its original journal-deletion behavior because there is no remote late completion.

Hosted operator commands (process manifest only; no dotenv load):

```text
node --conditions=react-server --import tsx scripts/hosted-images.ts inspect --authorized-inspect
node --conditions=react-server --import tsx scripts/hosted-images.ts reconcile --authorized-reconcile
```

Do not run these against a host without separate authorization. Inspect reads DB metadata and prefix inventory, verifies ACTIVE bytes and reports counts for missing/corrupt, unknown and pending objects. Missing/corrupt/unknown findings return nonzero; inspect never writes or deletes. Reconcile pages 100 journal records in key order with a cursor, stopping after a bounded 10,000-record sweep; repeat from the beginning on the next scheduled run. It reports completed delete requests, not permanent removal of every historical version. Failures return nonzero and retain intent. Unknown inventory never supplies deletion authority. For more than 10,000 rows/objects, stop and review scalable operator tooling rather than silently skipping records.

No scheduler/alerts were provisioned. Proposed operational cadence: reconciliation every 15 minutes with alerting on failures/backlog, daily integrity inventory and alerts on any missing/corrupt/unknown result. Owner and schedule require acceptance. Errors, storage outages and corruption must not trigger real approvals, replacement metadata or publication fallback. Restore matching bytes from an authorized recovery checkpoint or ask the owner to replace/re-review through the existing lifecycle.

## Coordinated backup procedure

1. Assign an incident/recovery lead and database/storage operators; authorize checkpoint window and destination. Freeze all application writers, background reconciliation and privileged operators. Confirm no in-flight upload/DB transaction remains. Keep public catalogue off. Do not rely on an unimplemented maintenance toggle.
2. Record checkpoint UTC, environment, schema migration checksums, source database identity, storage account/bucket/prefix and application checkpoint. Export image journal/photo references with states, byte sizes, SHA-256, dimensions, positions/covers and provider version IDs where available. Store the manifest privately.
3. While writers remain frozen, take PostgreSQL custom-format backup (or a coordinated provider snapshot/PITR checkpoint), then copy the exact referenced immutable object versions to an independent private encrypted backup destination. Verify every ACTIVE image against the DB manifest. Preserve pending journals/tombstones; inventory/report unknown objects separately without deletion. Record DB archive SHA-256 and object manifest/checksums together. Reject an incomplete checkpoint.
4. Verify backup destination access with a recovery identity, encryption and retention/immutability. Runtime credentials must not delete backups. Unfreeze only after a complete checkpoint or documented aborted attempt. Existing healthy checkpoint remains available on failure.

Proposed pilot objectives, **not approved or achieved hosted SLAs**: coordinated nightly checkpoints, RPO <=24 hours and RTO <=4 hours; retain 30 daily checkpoints and object noncurrent versions at least as long as the DB restore window plus a seven-day safety margin. Privacy/retention owner must approve these values; genuine evidence must not be retained indefinitely by accident. PITR can improve database RPO only if the corresponding historical object versions/manifest are recoverable. Versioning alone is not an independent backup. Protect backups in a separate failure/administrative domain and test loss of the source account.

## Restore and acceptance

1. Keep original DB/storage untouched. Create a new empty database and separate private recovery bucket/prefix under a recovery identity. Restore schema/data from the chosen checkpoint; do not use clean/reset against existing databases. Restore exact referenced object versions/copies into that independent destination.
2. Verify archive checksum, migrations, constraints/triggers, all table records, photo references, sizes/SHA-256, dimensions, cover/order, pending journals and unknown/missing inventory. Missing/corrupt objects block promotion; unknown objects are quarantined/reported, never automatically removed. A failed restore stays isolated.
3. Recreate clients/processes and prove reads use only the recovery destination. Run HOST cross-account denial, MFA ADMIN review, unpublished/public withdrawal checks and disabled-publication checks against separately authorized staging. Validate restored encrypted backups and secrets without printing values.
4. Reconcile pending/tombstoned keys only after checkpoint inspection. Assess writes after the recovery point; get business approval for any loss/replay. Record measured RPO/RTO and integrity evidence. Promotion is a separate approval; rollback keeps the old destination intact. No restore drill authorizes production cutover.

Responsibility remains **unassigned pending owner approval**: engineering recovery lead coordinates; DB operator restores PostgreSQL; storage/security operator verifies bucket policy/versions/backup isolation; product/data owner accepts recovery point and retention. Escalate any checksum mismatch, missing object, privacy exposure or incomplete checkpoint to these designated owners before resuming. Do not invent named approvals.

## Executed local drill and limits

`node --conditions=react-server --import tsx scripts/rehearse-image-recovery.ts` creates two new random `kiliride_rehearsal_*` databases on guarded local test port 55433 and new ignored `backups/release003-recovery-*` source/backup/restored object directories. It migrates the source, creates synthetic records/pixels, captures a quiescent pg_dump and object manifest, restores with pg_restore into the empty target, compares all 19 tables and 18 triggers, verifies two images/covers/order through a fresh signed SDK client, and tests missing/corrupt/unknown detection. It retains artifacts and never restores over dev/test databases. CI runs the same drill. It is a local logical recovery proof on one machine, not evidence of independent cloud disaster recovery or real S3 version retention.

References: [official S3 conditional-write contract](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html), [official JavaScript SDK S3 examples](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html). SDK/handler types and implementations were also inspected locally.

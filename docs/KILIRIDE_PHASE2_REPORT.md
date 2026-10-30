# Phase 2 report: through Milestone 2E

## Milestone 2E acceptance (2026-10-30 to 2026-10-31)

**Engineering acceptance: PASS for the authorized local 2E scope. Business-policy readiness: BLOCKED; overall readiness for real vehicle verification: PARTIAL.** The product owner expressly supplied `KILIRIDE-FLEET-VERIFY-001` / `0.1-DRAFT` as **DRAFT — NOT APPROVED**, with no approver or effective date. See [draft policy](policies/KILIRIDE_VEHICLE_VERIFICATION_V0_1_DRAFT.md). Real approvals remain blocked; synthetic protocol fixtures do not approve real policy or establish Kenyan compliance. Full dependency audit remains non-clean with five pre-existing development-tool findings. This section supersedes earlier milestone scope statements; their results below remain dated history.

Authority: CODEX TASK 003E and subsequent provisional policy direction, recorded in [prompt 003E](prompts/CODEX_PROMPT_003E.md). Root AGENTS.md, prompts 003/003D, reports, architecture, data model and decisions were read. Initial branch **feature/phase2-fleet-management**, clean working tree confirmed. No commits, pushes, deployment or 2F work.

### Implemented scope and code evidence

| Capability | Status and evidence |
|---|---|
| MFA administrator dashboard | IMPLEMENTED: `src/app/admin/page.tsx`, `/admin/vehicles/[id]/page.tsx`, admin layout/error boundary and `src/components/admin/{VehicleFilters,VehicleReviewForm,ReviewPhotos}.tsx`. Pending queue by default, status/text filters, pagination, loading/empty/error states; detailed specifications, KES price units, private registration, minimal owner relationship, submission time and photographs. Emerald/slate responsive design. |
| Server authorization | IMPLEMENTED: `src/server/fleet/admin.ts` calls existing `requireRole(ADMIN)` for every read/mutation/photo read. Verified email, current ADMIN role, MFA and post-role-grant session required. No hard-coded administrator. Owner-only host reads remain unchanged; ADMIN is not a host ownership bypass. |
| Five verification checks | IMPLEMENTED: strict `vehicle-review.ts`, explicit confirmations/evidence refs for identity, legitimate ownership/authorization, registration, listing accuracy and rental eligibility. No prechecked inputs, inferred inspection or legal certificate. All stored photos must be ACTIVE and pass byte-length/SHA-256 verification before approval. |
| Compliance configuration | IMPLEMENTED: `vehicle-compliance.ts` validates versioned profiles for jurisdiction, classification/use, rental arrangement and ownership/operation. Every requirement has applicability, supporting authority, evidence type, applicability basis and review status. Unresolved applicability/arrangement/review, absent matrix, missing mandatory evidence or unknown profile blocks approval. `vehicle-verification-draft.ts` holds only the unapproved Kilifi draft; it is never seeded into approved policies. |
| Decisions and corrections | IMPLEMENTED: `decideAdminVehicle` delegates to the existing `transitionVehicleListing` engine. PENDING_REVIEW → APPROVED/REJECTED; APPROVED → SUSPENDED; authorized REJECTED/SUSPENDED → DRAFT. Host rejected edits/resubmission preserved. Independent reviewer required; administrators cannot decide their own listings. |
| Atomic audit/history | IMPLEMENTED: vehicle row lock + expected revision, immutable VehicleReview, new VehicleDecisionRecord, listing event and AuditLog in one transaction. Decision captures actor, from/to status, revision, timestamp, reason, private evidence refs, policy version, checklist, applicable profile snapshot and per-requirement evidence. Duplicate/concurrent decisions produce one outcome; stale requests return conflict. SQL triggers reject historical alteration and new approvals missing current decisions/compliance evidence. |
| Privacy | IMPLEMENTED: separate authorized admin image byte route reuses `src/server/images/read.ts` integrity checks. No storage keys, hashes, owner email, unrelated profile/session/authentication data in admin DTOs. Private evidence is escaped text, never fetched or automatically linked. No document uploads. Host DTOs expose only permitted outcome/reason/time, including suspension/reopening feedback. |
| Legacy/public preservation | IMPLEMENTED: Vitz `vitz-142s` and Note `note-131c` remain unassigned DRAFTs, without invented photos/reviews/owners. Static KILIFI_FLEET, CarCard, public routes, pricing and WhatsApp remain unchanged. Approval does not publish or reserve a vehicle. |

Admin routes: `GET /admin`, `GET /admin/vehicles/[id]`, `GET /api/admin/vehicles`, `GET /api/admin/vehicles/[id]`, `POST /api/admin/vehicles/[id]/decision`, and `GET /api/admin/vehicles/[id]/photos/[photoId]/image`. Reads are dynamic/private. Mutations require exact same Origin, JSON, strict fields and bounded 16 KiB bodies, then reauthorize in the service. Private images use no-store/Vary Cookie, nosniff, sandbox CSP and same-origin resource policy; no public optimizer/storage path is introduced. Page authentication completes before queue Suspense, preserving unauthorized redirect/404 responses.

### Policy workflow and readiness

The five checks follow the product-provided draft, not invented legal rules. The administrator compares registration/identity including VIN where available, establishes ownership or explicit authority to rent, considers authorized-source registration verification where available, resolves listing/photo/price discrepancies, and selects a formally resolved compliance profile matching the actual arrangement. Every mandatory requirement needs an explicit passed check and evidence reference. NOT_APPLICABLE needs a confirmed authority and applicability basis. Missing guidance never means exemption.

The current Kilifi configuration marks insurance, inspections and permit/licensing/operation determinations PENDING_POLICY_REVIEW. No claim is made that a particular legal document is universally required. Formal business approval, approver authorization, effective date, current Kenyan regulatory/legal/insurance determinations, evidence custody/access/retention and authenticity procedures remain deployment blockers. No real approved policy or approval was inserted. Policy creation/activation is not exposed through the dashboard/API; a later controlled activation must verify formal authorization and the approved matrix. Policy metadata/requirements are immutable; only enabled status can be changed operationally. Test-only records are constrained to `kiliride_test` in SQL and port 55433 in application/test guards.

### Additive migrations and preservation

Two additive migrations were required: `202610300004_vehicle_verification` creates VehicleVerificationPolicy/VehicleDecisionRecord and decision/policy/history guards; `202610300005_verification_requirements` adds nullable policy requirements JSON and immutable-matrix/compliance guards after the product owner's additional direction. The already-applied first migration was not rewritten. Previous reviews remain intact without fabricated structured checks; missing matrix blocks new approvals. No reset, drop, destructive migration, data backfill or dependency upgrade.

Local targets were confirmed as separate Docker instances: loopback **55432/kiliride_dev** and **55433/kiliride_test**. Backups before each migration stage are ignored custom-format dumps, never published:

- `backups/kiliride-dev-pre-phase2e-20261030.dump` (55,012 bytes) and `kiliride-test-pre-phase2e-20261030.dump` (150,665 bytes).
- `backups/kiliride-dev-pre-phase2e-matrix-20261030.dump` (68,552 bytes) and `kiliride-test-pre-phase2e-matrix-20261030.dump` (217,947 bytes).

First rehearsal: `kiliride_rehearsal_2c2f8c23af764853b93455305b1b6019`, five migrations. Final rehearsal: `kiliride_rehearsal_f8eef0ca3b27451ead1630aff9d7f641`, six migrations, **19 tables / 18 triggers**, repeated deploy no-op, matching history/checksums/status, rolled-back CUSTOMER trigger and test-policy isolation probes. Targets are fresh disposable databases on port 55433 and retained for inspection. An initial sandbox-blocked rehearsal left an empty disposable target; no existing DB was reset.

Both local targets migrated successfully after backups/rehearsals. All 16 original application table fingerprints matched immediately after the first migration. Before/after the matrix migration, all 18 existing tables' original fields matched (new nullable requirements excluded from the original-policy-field comparison). Development's original 16-table fingerprints still match after tests. No development user, policy, photograph, review, owner or fixture was added.

Recovery: retain schema/history and disable the new review entry points if rollback is required. Do not delete audit rows or reverse migrations destructively. Backups are pre-change safety copies, not a claim of a new restore drill; any restore must use a separate disposable target and coordinated private-image snapshot per the existing runbook. No restore over a live target was attempted.

### Actual execution results

| Command/check | Result |
|---|---|
| Prisma `validate` / `generate` | PASS, unchanged Prisma 7.10.1. |
| `node scripts/rehearse-migrations.mjs` | PASS, final six migrations / 19 tables / 18 triggers, no-op repeat, checksums/status and isolation probes. |
| `node scripts/run.mjs migrate` / `migrate-test` | PASS, both backed-up local targets, two additive stages. |
| Migration data fingerprints | PASS, original fields preserved on both targets; development baseline unchanged. |
| `npm.cmd run test:unit` | PASS, 13/13 (2.11s), including compliance gaps and occupied-server isolation. |
| `node scripts/run.mjs test-fleet` | PASS, 24/24 (20.59s); six admin/compliance cases plus 18 fleet/host/image regression cases. |
| `node scripts/run.mjs test` | PASS, final complete run 15/15 (3.3m); all auth/verification/recovery/MFA/recovery-code replay, HOST/image, catalogue/pricing/WhatsApp and admin cases. Focused corrected admin run also 3/3 (58.0s). |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS after final code/test changes. |
| `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, zero warnings after final code/test changes. |
| `npm.cmd run build` / `node scripts/check-private-traces.mjs` | PASS after final UI correction: 15 static pages, dynamic admin routes; 37 traces exclude private storage/backups/env. |
| `node scripts/run.mjs status-test` | PASS: six migrations, isolated test schema up to date. |
| Read-only Prisma schema comparison | Raw diff reports only 13 UUID-default parenthesis normalizations; temporary canonical-expression comparison reports no difference, exit 0. No structural drift or corrective DB mutation. See below. |
| Final read-only storage inventory / legacy checks | PASS: 143 active synthetic objects match photo references, files, sizes and SHA-256; no orphan files or pending cleanup. Both legacy records remain unassigned DRAFTs without photos/reviews/decisions. Development has zero policy records; all 17 retained test policies are test-only. |
| Online `npm.cmd audit --omit=dev --json` | PASS, zero runtime vulnerabilities. |
| Online `npm.cmd audit --json` | NON-CLEAN, exit 1: five existing dev-tool findings, 3 high / 1 moderate / 1 low. |
| Git branch, whitespace and scope | PASS: feature/phase2-fleet-management; initial tree clean, final changes intentionally uncommitted. No public catalogue/pricing/WhatsApp/auth/dependency/workflow or previously applied pre-2E migration changes. |

Audit findings remain `@hono/node-server`, `brace-expansion`, `deepmerge`, `shadcn` and its nested `zod`; no new package or lockfile changes. No forced fixes or Prisma upgrades were run. Hosted GitHub Actions has not been executed for these uncommitted changes.

Corrections during verification: initial database run 21/23 exposed an invalid test payload and file-level shared-state interference; payload fixed and suites serialized while explicit concurrency tests remain concurrent. First browser run 13/15 exposed a new fixture using multipart against the existing raw-image upload contract; fixture corrected without changing the upload API. The next run 14/15 caught selector labels including option text; explicit accessible names corrected the UI, then focused 3/3 and complete 15/15 passed, including keyboard focus and 375px/1280px layouts. A unit run alongside Playwright hit the occupied port by construction; final execution is sequential and the unit isolation test passed. Windows subprocess EPERM restrictions required authorized reruns. No assertion was disabled to obtain a pass. Existing smooth-scroll/color notices and navigation destination-stream logs were observed during browser regressions.

Additional read-only drift inspection: `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` returned nonzero solely for PostgreSQL's `(gen_random_uuid())::text` versus the schema's equivalent `gen_random_uuid()::text` on 13 ID defaults (12 existing tables plus VehicleDecisionRecord). An ignored temporary schema copy normalized only those expression parentheses; `--to-schema backups/phase2e-canonical-schema.prisma --exit-code` then returned **No difference detected**, exit 0. The application schema, UUID behavior and database were not altered to suppress this cosmetic comparison.

### Manual acceptance and remaining limitations

1. Provision a real authorized MFA ADMIN using the existing controlled process. Check `/admin` and a submission detail; anonymous/CUSTOMER/HOST/non-MFA users must be denied.
2. Confirm the development policy table is empty and real approval remains unavailable. Review the draft with the designated business owner and qualified regulatory/legal/insurance advisers; do not activate it as approved.
3. For a genuinely owned, complete HOST submission, review private photos, identity/relationship/details/prices and discrepancies. Reject with an actionable reason; verify only that owner receives feedback and can correct/resubmit.
4. In the isolated synthetic test environment only, exercise checklist/profile requirements, approval, stale second-tab conflict, suspension and authorized reopening. Check immutable history and absence of evidence refs in HOST responses.
5. Confirm the public Vitz/Note routes, existing KES prices and WhatsApp quote continue unchanged. Use keyboard and a physical mobile device/screen reader for additional acceptance; automated viewport checks are not a complete assistive-technology audit.

Remaining limits: formal policy/compliance activation and real evidence review blocked; private document custody/retention not implemented; local image adapter still requires separately approved production storage/ACL/backup design; no new combined image/database restore drill; five existing dev dependency advisories; no hosted CI, deployment or real-world legal/insurance determination. Stop after 2E. Do not proceed to 2F, bookings, payments, subscriptions or drivers.

### Changed file groups

- Schema/migrations: `prisma/schema.prisma`, the two new migration directories above.
- Admin UI/API: `src/app/admin/{page,layout,error}.tsx`, `src/app/admin/vehicles/[id]/page.tsx`, `src/app/api/admin/vehicles/**`, `src/components/admin/{VehicleFilters,VehicleReviewForm,ReviewPhotos}.tsx`.
- Services/validation/config: `src/server/fleet/{admin,admin-http,service,lifecycle,host}.ts`, `src/server/images/{read,service}.ts`, `src/lib/validation/{vehicle-review,vehicle-compliance}.ts`, `src/lib/config/vehicle-verification-draft.ts`, host detail page for suspension/reopening feedback.
- Checks: `scripts/{run,rehearse-migrations}.mjs`, `tests/database/{admin,fleet,images}.test.ts`, `tests/integration/admin.spec.ts`, `tests/unit/vehicle-review.test.ts`, `tests/helpers/{verification,compliance-fixture}.ts`.
- Documentation: this report, TEST_REPORT, DATA_MODEL, ARCHITECTURE, DECISIONS, prompt 003E and the draft policy. Ignored local backups/fingerprints are operator artifacts, not application source or publishable data.

## Milestone 2D final local result (2026-10-30)

**PASS for the authorized local 2D feature scope.** The full dependency audit remains **non-clean: five pre-existing development-tool advisories**; runtime audit is clean. This is not production release approval. Authority: current user request and [CODEX_PROMPT_003D.md](prompts/CODEX_PROMPT_003D.md), created in this task. Root AGENTS.md, prompt 003, architecture/data model/decisions and implementation/acceptance reports were read. Branch: `feature/phase2-fleet-management`; initially clean working tree. Earlier 2C/2A/2B sections below remain historical evidence.

### Implemented features and boundaries

| Feature | Status / evidence |
|---|---|
| Private image storage | IMPLEMENTED locally: `src/server/images/storage.ts`, immutable UUID keys outside public/, exclusive writes/file flush, validated paths and rejected symlink/junction directories. Separate test/development namespaces tied to guarded DB names/ports. Put/get/remove interface supports a future private object-store adapter. |
| Secure image processing | IMPLEMENTED: `normalize.ts`; JPEG/PNG/WebP signature and MIME checks, full decode/re-encode, orientation correction, resizing and metadata stripping. SVG/HTML/unsupported formats, animation, malformed/truncated and oversized input rejected. |
| Multiple owned photographs | IMPLEMENTED: `service.ts`, `http.ts`, host photo API routes. Maximum 12 per vehicle, 5 MiB each, 24 megapixels input, 2400px output edge; output is WebP. Sixty upload-processing attempts per HOST/minute enforced atomically in the existing RateLimit table. |
| Cover and ordering | IMPLEMENTED: full-set ownership validation, one cover, contiguous positions, transactional temporary positions to respect unique indexes. Accessible earlier/later buttons work without drag-and-drop. |
| Replacement/deletion | IMPLEMENTED: replacement preserves photo ID/order/cover and switches to a new validated object atomically. Removal immediately removes API visibility, repairs cover/order and journals physical deletion for retry. |
| Unpublished image protection | IMPLEMENTED/VERIFIED: **all new images remain private in 2D**, including approved listings. Current verified-email HOST owner only; no ADMIN cross-owner shortcut. Byte route checks ACTIVE state/size/SHA-256 and sets private no-store, Vary Cookie, nosniff, sandbox CSP and same-origin resource policy. No optimizer/public storage route. |
| Mobile HOST interface | IMPLEMENTED: `PhotoManager.tsx` and `/host/vehicles/[id]/photos`; multiple selection, description, progress/errors, cover/order, replacement, confirmed removal, empty/unavailable states. Detail page links to it. Refreshes listing revision after image mutations. |
| Lifecycle and audit | IMPLEMENTED: shared parent vehicle lock/revision, DRAFT/REJECTED only; rejected edits return to DRAFT with history retained. Pending/approved/suspended mutations rejected, including SQL bypass attempts. Every photo mutation appends audit in the metadata transaction. |
| Database/storage consistency | IMPLEMENTED/VERIFIED: durable object journal precedes writes; rollback compensation; retryable deletion; lock-protected operator reconciliation. Missing/corrupt active bytes fail closed. Final inventory check matched 56 active synthetic objects to DB photo references, file sizes and SHA-256, with no orphan files or pending cleanup. |

No original filename is trusted or stored. Host DTOs omit object keys/uploader/provenance; byte URLs use vehicle/photo IDs and still require authorization. Strict metadata and same-Origin checks precede bounded body consumption; services independently recheck authorization. Batch upload is sequential, with each image independently transactional; if a later image fails, earlier successful images remain and the gallery refreshes before another edit. No automatic retry with a stale revision.

Photographs do not establish ownership/verification. Existing 2C submission does not acquire a new photo-minimum policy; real review criteria remain pending. No fake legacy photos, owners or evidence were added. Public routes, static KILIFI_FLEET, prices, CarCard, WhatsApp, authentication and authorization implementations remain unchanged.

### Dependency and storage decisions

Sharp **0.35.5**, already present as Next.js's transitive image dependency, is now explicitly pinned in package.json/lockfile. No package version, Prisma version or authentication dependency was upgraded. Installed Sharp requires Node >=20.9; the current Node 24.14.1 buffer-based APIs passed real decode/encode tests. Official references: [input limits](https://sharp.pixelplumbing.com/api-constructor/), [output metadata stripping](https://sharp.pixelplumbing.com/api-output/). Processing strips EXIF/XMP/ICC; orientation/metadata removal is tested rather than inferred from MIME alone.

Local private files are under ignored `.data/vehicle-images/development` (loopback:55432/kiliride_dev) and `.data/vehicle-images/test` (loopback:55433/kiliride_test). Only the test namespace was created/populated. There is no hosted storage provider, signed public URL, bucket or production credential. The local adapter is a real tested storage implementation, not a claim of cloud readiness. POSIX modes are restrictive; Windows protection also depends on inherited service/workspace ACLs. Production storage/region/retention, deployment ACLs and a coordinated backup/restore drill require approval before hosted real-data operation.

Build packaging also protects private files: `next.config.ts` excludes .data, backups and .env files from output tracing, and runtime realpath checks opt out of static tracing. `scripts/check-private-traces.mjs` asserts these boundaries after builds; CI now runs it. Final inspection of **32 build traces** found no private image storage, backups or environment files. [Next.js output tracing guidance](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) documents the exclusion mechanism.

### Migration, backup and recovery evidence

Non-destructive `202610300003_vehicle_images` adds `VehicleImageObject` (key/state/hash/size/dimensions/timestamp), nullable unique `VehiclePhoto.objectKey` FK and consistency checks, plus `vehicle_photo_guard`. Existing metadata-only photo rows remain unchanged with null objectKey; they do not become genuine images. The new trigger locks the parent and rejects reviewed-listing photo changes. Existing unique position/single-cover constraints remain. No applied migration was changed, no reset/drop was run.

Both Docker PostgreSQL containers and Mailpit were healthy. Live current_database/URL checks confirmed separate development port 55432 and test port 55433. Before migration, pg_dump custom-format backups were copied to ignored `backups/kiliride-pre-phase2d-20261030.dump` (50,233 bytes) and `backups/kiliride-test-pre-phase2d-20261030.dump` (98,302 bytes); originals remain in each container's /tmp/. Do not publish backups. No development image bytes existed to back up.

Disposable rehearsal database: `kiliride_rehearsal_8116a8ed04d847a1b0ecc72b9c4fee3f` on test port 55433. All four migrations applied, repeated deployment was a no-op, status/history/checksums matched, and 17 tables/eleven triggers plus the rolled-back CUSTOMER-role probe passed. Both backed-up local targets then migrated successfully. Test migration status reports four migrations and schema up to date.

Before test execution, all 14 existing non-photo table fingerprints and original VehiclePhoto field values matched before/after migration on both databases. Final development comparison still matched after tests. Development legacy vehicles remain unassigned and unchanged; no development account, photograph or review fixture was created. All automated writes and synthetic pixels used test DB/storage.

The journal makes filesystem operations recoverable without pretending that PostgreSQL and a filesystem share one atomic transaction. PENDING commits before file creation; activation/photo metadata/revision/audit commit together after writing. Replacement leaves the previous photo intact on failure. Deleted/replaced objects become DELETE_PENDING before physical removal, so inaccessible bytes can remain after an I/O failure until retry. The reconciler locks/rechecks references, removes DELETE_PENDING or PENDING older than one hour, and never removes ACTIVE referenced objects. Missing/corrupted ACTIVE bytes require recovery/replacement, not destructive automatic DB cleanup.

`node --conditions=react-server --import tsx scripts/reconcile-images.ts test` executed successfully: examined 0, removed 0, failed 0 after failure-injection tests had demonstrated actual recovery. The command supports an explicit dev target, processes up to 100 candidates and exits nonzero on failures. It is operator-run in this local milestone; no scheduled worker was deployed. See [local setup/recovery](KILIRIDE_LOCAL_SETUP.md) for coordinated database/object backups, interruption handling and restore isolation. Roll back host image UI/routes while retaining schema, journal and private objects; do not restore over live data or remove directories. No combined image restore drill was performed.

### Actual checks and corrections

| Command/check | Final result |
|---|---|
| Prisma `validate` and `generate` | PASS, unchanged Prisma 7.10.1. |
| `node scripts/rehearse-migrations.mjs` | PASS: four migrations, repeat no-op, checksums/status, 17 tables, eleven triggers. |
| `node scripts/run.mjs migrate` / `migrate-test` | PASS: additive migration on backed-up local targets. |
| `node scripts/run.mjs status-test` | PASS: isolated test schema current. |
| Before/after fingerprints; final development comparison | PASS: 14 original tables and original photo fields preserved. |
| `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts` | PASS: 11/11 (1.96s). |
| `node scripts/run.mjs test-fleet` | PASS: 18/18; final rerun 6.83s after runtime storage tracing correction. Nine existing fleet/host tests plus nine image tests. |
| `node scripts/run.mjs test` | PASS: 12/12 (2.1m), all existing auth/MFA/recovery-code replay, host, public catalogue and WhatsApp regressions plus new photo browser/API flows. |
| `node scripts/run.mjs test tests/integration/host.spec.ts` | PASS: 4/4 (57.1s) after adding cache/revision refresh and verifying detail edits before/after photo operations. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS after final code/config corrections. |
| `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, zero warnings, including final script additions. |
| `npm.cmd run build` | PASS: production compile/typecheck, 15 static pages, dynamic host/image routes; final build has no broad filesystem-tracing warnings. |
| `node scripts/check-private-traces.mjs` | PASS: 32 generated traces exclude private runtime data. |
| Reconciler CLI and read-only DB/file inventory/hash check | PASS; final 56 active objects match references/files/hashes, no pending journal or orphan files. |
| Online `npm.cmd audit --omit=dev --audit-level=high` | PASS: zero runtime vulnerabilities. |
| Online `npm.cmd audit --json` | NON-CLEAN, exit 1: five existing development-tool advisories (3 high, 1 moderate, 1 low). |
| Git whitespace, branch and scope review | PASS. No changes to public fleet/pricing/WhatsApp/auth code or earlier migrations. |

Security coverage includes forged filenames/paths/owner fields, cross-vehicle replacement, unverified/revoked access, anonymous/customer/cross-host/dual-role denial, private DTOs and byte headers, missing/wrong Origin, MIME/signature mismatch, SVG/HTML, truncated/animated/decompression-bomb/oversized inputs, metadata stripping, rate/count limits, overwrite rejection, cover/order invariants, concurrent uploads/submission, reviewed-state SQL guards, failed replacement compensation, failed deletion retry, interrupted upload reconciliation, missing/corrupt storage and optimizer/direct-path access denial. Browser controls passed 375px/1280px overflow and focus checks, including missing-image fallback and deletion/replacement flows. Test images are explicitly synthetic colored pixels, never legacy inventory evidence.

Corrections: an ES2020 BigInt literal was replaced with the constructor for the repository's TypeScript target; initial database run was 17/18 because identical animation frames collapsed to a single frame, so the fixture was corrected and the suite passed 18/18. Initial build succeeded but warned that dynamic realpath checks traced too broadly; runtime tracing opt-out, explicit private-data exclusions and a CI trace assertion corrected this. The focused browser run logged two destination-stream errors during navigation but all assertions passed; expected optimizer-denial logs and existing color/smooth-scroll notices were also observed. No failed assertion was suppressed.

The sandbox audit incorrectly reported an empty full-tree result while install reported advisories; an authorized online rerun is the recorded authoritative result. Existing dev findings are @hono/node-server (moderate), brace-expansion (high), deepmerge (low), shadcn (high aggregate) and its nested zod (high), matching the Phase 1 implementation report. The direct application Zod/runtime tree and Sharp have no reported runtime findings. No forced tooling downgrade/unrelated dependency upgrade was applied. These findings require release review; this report does not claim a clean full dependency audit.

### Files and review boundary

Added: prompt 003D; image migration; `src/server/images/{storage,normalize,service,http}.ts`; shared image validation; `/api/host/vehicles/[id]/photos` list/upload/order, per-photo DELETE and private byte route; host photo page/PhotoManager; reconciler and build-trace checker scripts; database image tests and unit validation tests. Updated: schema, host detail link/error mapping, test runner/rehearsal, host browser tests, next.config, CI trace check, .gitignore, package/lockfile, architecture/data model/decisions/local setup/test report/roadmap and this report.

Manual review: with a legitimate local HOST, create/save a draft, open Manage photographs, upload multiple permitted images, choose cover/reorder/replace/remove, then return to details and save. Verify other accounts cannot view byte/detail URLs and pending listings are read-only. Use the isolated suites for synthetic failure/review cases; do not fabricate real verification decisions. No full manual screen-reader/device matrix, hosted CI, production execution, cloud adapter, malware-scanning service or combined object/DB restore drill is claimed. Secure decode/re-encode is not a general-purpose antivirus service.

Local 2D acceptance has no outstanding functional blocker. Remaining deployment gates include the dev-tool advisories, approved hosted storage/access/retention/backup policy and a restore drill. **STOP after 2D.** No admin approval screen, public database cutover, private verification-document upload, payment/reservation feature, commit, push or deployment. Phase 2E has not begun.

---

## Milestone 2C final local result (2026-10-30)

**PASS for authorized Milestone 2C.** Authority: CODEX TASK 003C and the 2C section of `docs/prompts/CODEX_PROMPT_003.md`. Root `AGENTS.md`, architecture, data model, decisions and existing reports were read before implementation. Branch confirmed as `feature/phase2-fleet-management`; the working tree was initially clean. This section supersedes the earlier stop-before-2C statements; the 2A/2B execution record below is retained as historical evidence.

### Implemented scope and code evidence

| Capability | Status and evidence |
|---|---|
| Protected HOST dashboard | IMPLEMENTED: `src/app/host/page.tsx`; owned listings, prices, status, empty state and links from the existing account destination. |
| Create DRAFT | IMPLEMENTED: `/host/vehicles/new`, `src/components/host/VehicleForm.tsx`, `createHostVehicle` in `src/server/fleet/host.ts`. Server generates immutable public ID and derives owner from the current verified-email HOST session. |
| Edit owned listings | IMPLEMENTED: `/host/vehicles/[id]`, `editHostVehicle`; DRAFT and REJECTED only. Rejected edits return to DRAFT while keeping reviews. Pending, approved and suspended records are read-only. |
| Submit complete drafts | IMPLEMENTED: `submitHostVehicle`; validates saved specifications, positive integer KES prices/seats, description and registration, then atomically changes DRAFT to PENDING_REVIEW. No publication or approval implied. |
| Status and feedback | IMPLEMENTED: owner detail page shows review decision, reason and Nairobi timestamp; up to ten latest reviews. Evidence references, criteria, reviewer identity and legacy provenance are excluded from host DTOs. Feedback is rendered as escaped text. |
| Record authorization and request defenses | IMPLEMENTED: existing `requireRole` plus owner-scoped list/read/row locks; strict Zod input; matching Origin, JSON and 16 KiB limit; private no-store responses. ADMIN membership provides no cross-owner access through these endpoints. |
| Mutation consistency | IMPLEMENTED: expected revision, row lock, transaction and audit for create/edit/submit. State changes append immutable listing events. Duplicate registration errors roll back edits; stale requests return conflict. |
| Legacy preservation | IMPLEMENTED/VERIFIED: no claim endpoint or owner input. Legacy rows remain unassigned DRAFTs with stable IDs/prices and no invented approval/evidence. Public catalogue remains unchanged static `KILIFI_FLEET`. |

The three HTTP route modules are `src/app/api/host/vehicles/route.ts`, `[id]/route.ts` and `[id]/submit/route.ts`. They expose list/create, owned detail/edit and submit only. `src/server/fleet/host-http.ts` handles request/error boundaries; `src/lib/validation/host-vehicle.ts` centralizes accepted fields and submission completeness. `src/app/host/layout.tsx` supplies no-index metadata; `error.tsx` gives generic retry UI. Forms disable actions during hydration/saves and expose labeled fields, validation feedback, keyboard focus and unsaved-change guidance.

### Schema, migration and isolation

Additive migration `202610300002_host_vehicle_management` introduces `VehicleOwnershipOrigin` (`UNASSIGNED`, `ADMIN_ASSIGNED`, `HOST_DECLARED`) and nullable `declaredAt`. Existing assignment provenance is retained; previously assigned rows become ADMIN_ASSIGNED and null-owner rows become UNASSIGNED. A HOST_DECLARED record associates a newly created listing with its host account and declaration time, with no administrator/evidence fields. This is not legal ownership verification. SQL rejects converting an existing unassigned row to a host declaration and still rejects transfers/deletion. The existing admin-assignment service now explicitly writes ADMIN_ASSIGNED.

The migration replaces the ownership constraint/guard and adds `vehicle_submission_guard` to require description/category/registration before review. No existing migration was edited, no table was dropped and no data was reset. Submission completeness is a technical listing requirement; real KYC, insurance, photograph and verification criteria remain pending.

Docker and sanitized live database checks confirmed development `127.0.0.1:55432/kiliride_dev` and test `127.0.0.1:55433/kiliride_test`, with separate containers/volumes. Test runners force and validate the isolated test URL. Playwright refuses an occupied server and starts its own test-configured server. Host/browser/service mutations used only the test database; the development database received only the additive migration.

Before application, `pg_dump -Fc` backups were copied to ignored `backups/kiliride-pre-phase2c-20261030.dump` (47,654 bytes) and `backups/kiliride-test-pre-phase2c-20261030.dump` (73,820 bytes), with originals in their respective containers' `/tmp/` directories. Do not publish these backups. The ignored `backups/phase2c-before.json` stores counts/fingerprints, not row contents.

Fresh rehearsal target `kiliride_rehearsal_b59506abcb4b43438484b980ab884419` on port 55433 applied all three migrations. Repeat deployment was a no-op; history/checksums, 16 tables, ten triggers and a rolled-back CUSTOMER-role probe passed. The disposable target is retained. Deployment then succeeded on both backed-up local targets; status reports three migrations and up-to-date schemas on each.

Immediately after migration and before tests, all 11 checked tables (eight identity tables, Vehicle, VehicleRegistration, LegacyVehicleImport) matched their pre-migration row counts/content fingerprints in both databases. Existing test ownership origins were four UNASSIGNED and five ADMIN_ASSIGNED. After tests, the same development fingerprints still matched, with exactly two UNASSIGNED legacy records. No development host, review or synthetic vehicle was created.

Rollback: disable/revert the new host UI and endpoints while retaining the additive schema and current origin-aware assignment service. Old assignment writes that omit origin are incompatible with the strengthened constraint and must not be re-enabled unchanged. Existing public/authentication code is unaffected. Do not edit applied SQL, reset/drop databases or restore over live data; restore backups only to a separately approved recovery target and reconcile later writes. No new restore drill was executed in 2C.

### Executed checks

| Command/check | Final outcome |
|---|---|
| `node node_modules/prisma/build/index.js validate` / `generate` | PASS; unchanged Prisma 7.10.1. Generated client ignored. |
| `node scripts/rehearse-migrations.mjs` | PASS: fresh/repeat deployment, status, checksums/history and ten triggers. |
| `node scripts/run.mjs migrate` / `migrate-test` | PASS: new migration only, backed-up local databases. |
| `node scripts/run.mjs status-test`; `node node_modules/prisma/build/index.js migrate status` | PASS: three migrations, both local schemas current. |
| Before/after fingerprints and final development comparison | PASS: 11 tables unchanged by migration; development remains unchanged after test execution. |
| `node node_modules/tsx/dist/cli.mjs --test tests/unit/*.test.ts` | PASS: 10/10 (5.35s), including strict host input/completeness and occupied-test-server rejection. |
| `node scripts/run.mjs test-fleet` | PASS: 9/9 (6.86s), four new host service tests plus all five 2A/2B tests. |
| `node scripts/run.mjs test` | PASS: 10/10 (1.6m), two new host browser/API tests plus all eight existing regressions. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | PASS after final application/test corrections. |
| `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | PASS, zero warnings. |
| `npm.cmd run build` | PASS: production compilation, TypeScript and 15 static pages; new host routes remain dynamic. |
| `npm.cmd audit --omit=dev --audit-level=high` | PASS: zero runtime vulnerabilities; no dependency changes. Full dev-dependency audit was not repeated. |
| Git whitespace/scope review | PASS: public routes/components/fleet/pricing/WhatsApp, authentication/authorization, package/lockfile, CI and earlier migration SQL unchanged. |

New service tests cover anonymous/customer/unverified-host rejection, session-derived ownership, forged authority fields, cross-host/dual-role isolation, unassigned legacy claim rejection, incomplete drafts, database submission guard, concurrent edit/submit conflicts, duplicate-registration rollback, rejection feedback privacy, resubmission, immutable review retention and read-only approved/suspended states. Existing tests retain import replay/conflict and admin self-approval/MFA restrictions.

New browser/API tests cover actual form creation/edit/submission, validation, saved-before-submit behavior, read-only pending state, escaped rejection feedback and resubmission. Layout checks at 375px/1280px and keyboard label/focus checks passed. API cases cover private caching, anonymous/customer/other-host denial, legacy exclusion, forged fields, negative prices, invalid JSON/content type, oversized bodies, missing/invalid Origin, stale revisions and immediate HOST-role revocation. A new draft's generated public slug returns 404. Existing tests passed catalogue/WhatsApp/unknown-route, signup/verification/recovery/logout, MFA enrollment/provisioning, one-use recovery-code replay and CSRF flows.

Synthetic service fixtures use real Better Auth sessions with explicit test-only role/MFA posture. The feedback browser test seeds a synthetic independent rejection transaction directly in the isolated test database; no administrator approval route/UI was built. Actual MFA challenges remain covered by the existing identity suite. Test records are retained; no database reset or cleanup deletion of fleet/audit history occurred.

Issues found and corrected: the initial fleet run passed 7/9 because two old synthetic registrations exceeded the new 40-character form limit; fixture identifiers were shortened and 9/9 passed. The initial browser run passed 8/10: a new host `loading.tsx` streamed 200 before authorization returned 307/404. Removing that streaming boundary restored the existing HTTP access contract, and the full 10/10 suite passed. No authorization assertion was weakened. Sandbox subprocess/Prisma/build EPERM attempts succeeded after authorized retries; PowerShell's npm.ps1 restriction was handled with npm.cmd. Existing color/smooth-scroll notices were non-fatal.

### Files, manual reproduction and stop boundary

Changed/added: schema and new migration; `scripts/rehearse-migrations.mjs`; `src/server/fleet/{host,host-http,service}.ts`; shared host validation; host API routes; host dashboard/detail/new/layout/error pages; `VehicleForm`; `tests/unit/host-vehicle.test.ts`, `tests/database/fleet.test.ts`, `tests/integration/host.spec.ts`; this report plus architecture, data model, decisions, roadmap and test report. No packages or CI changes were needed; existing CI test discovery includes the new coverage.

To verify manually with an authorized local HOST account: open `/account` -> Host access; create a draft with make/model/category/location/specifications and prices; try submitting without description/registration; save complete details and submit. Confirm PENDING_REVIEW/read-only behavior and absence from the public catalogue. A different host must receive not-found for the internal detail URL and 404 from its API. Feedback/resubmission can be reproduced with the isolated synthetic browser suite; no real approval/evidence should be fabricated. Development currently has no user accounts, so no fake host was created there for this task.

No unresolved blocker for the local 2C scope. No hosted CI run, full manual screen-reader/device audit, production execution or new restore drill is claimed. Real ownership reconciliation, approved verification/insurance/privacy criteria and genuine photographs remain prerequisites for later approval/publication. No image uploads, admin approval screens, payments, automated reservations or public DB cutover were implemented. No commit, push or deployment. **STOP after 2C; 2D and later require separate authorization.**

---

## Historical Milestones 2A/2B execution record

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

# KiliRide — MVP Release Task 003
## B05: Durable Private Vehicle Photograph Storage

### ROLE
Act as Principal Backend Engineer, Storage Architect,
Security Engineer, DevSecOps Engineer and QA Lead.

### CONTEXT
KiliRide is preparing a real-user Premium Car Hire MVP.
Customers browse genuine vehicles, enquire through WhatsApp,
and coordinate reservations and payments manually.

Phase 2F and B03 passed GitHub CI.
The current branch is feature/phase2-fleet-management.

B03 hosted infrastructure acceptance remains pending.
Real vehicle approvals and public publication remain blocked.

### REQUIRED READING
- AGENTS.md
- docs/KILIRIDE_MVP_LAUNCH_GAP_REPORT.md
- docs/KILIRIDE_MVP_RELEASE_002_REPORT.md
- docs/KILIRIDE_HOSTED_RUNTIME.md
- docs/KILIRIDE_PHASE2_REPORT.md
- docs/KILIRIDE_ARCHITECTURE.md
- docs/KILIRIDE_DATA_MODEL.md
- docs/KILIRIDE_RELEASE_CHECKLIST.md

Inspect existing Prisma image models, storage services,
reconciliation scripts, access controls and tests.

### OBJECTIVE
Implement B05 engineering requirements ONLY.

Create production-compatible, durable, private vehicle
photograph storage without changing existing local/test data.

Do not provision, purchase or deploy cloud services.

### 1. STORAGE ARCHITECTURE
- Preserve the existing development/test filesystem adapter.
- Add a private S3-compatible object-storage adapter.
- Reuse existing image services and Prisma metadata.
- Require explicit hosted storage configuration.
- Never fall back to ephemeral local storage in hosted mode.
- Keep buckets and objects private.
- Use server-generated, non-guessable object keys.
- Enforce validated TLS and bounded requests/timeouts.
- Keep credentials server-side and out of logs.
- Validate bucket, endpoint, region and environment isolation.

### 2. IMAGE SECURITY
Preserve:
- HOST ownership checks.
- ADMIN reviewer permissions.
- Secure unpublished-image access.
- Publication eligibility checks.
- Actual file-content validation.
- Size and dimension limits.
- Image normalization and metadata stripping.
- Cover selection and ordering.
- Replacement and deletion.
- Listing lifecycle and re-review restrictions.

Unauthorized users must not access private images.
Suspended listings must not expose public photographs.

### 3. DATA CONSISTENCY
Handle:
- Object upload success with database failure.
- Database failure during replacement.
- Interrupted or retried upload requests.
- Duplicate requests.
- Failed object deletion.
- Concurrent modifications.
- Missing or corrupted objects.
- Pending cleanup and journal entries.

Maintain size/hash integrity verification.

Use idempotent reconciliation operations.
Do not delete unknown objects automatically.

### 4. BACKUP AND DISASTER RECOVERY
Design coordinated recovery for PostgreSQL and images.

Document:
- Database and object backup procedures.
- Retention and object versioning.
- Recovery point and time objectives.
- Independent recovery destinations.
- Image metadata and SHA-256 verification.
- Orphan and missing-object detection.
- Recovery ownership and escalation.

Test recovery using isolated synthetic data.

Do not restore over existing databases or storage.
Do not upload genuine local images to a remote provider.

### 5. HOSTED CONFIGURATION
Extend the B03 configuration contracts.

Document sanitized environment variable examples.

Hosted configuration must fail closed when required
private storage settings are missing or invalid.

Keep local/test database and storage isolation intact.

### 6. TESTING
Test:
- Local adapter compatibility.
- S3 adapter with isolated test storage.
- Invalid hosted configuration.
- Cross-host authorization denial.
- Private-image access denial.
- Admin reviewer access.
- Unapproved vehicle publication blocking.
- File validation and upload limits.
- Interrupted uploads and retry safety.
- Cover and image order consistency.
- Failed replacement/deletion recovery.
- Hash and size verification.
- Persistence across simulated restarts.
- Suspended image withdrawal.
- Existing authentication, HOST, ADMIN and catalogue flows.

Run all applicable:
- TypeScript
- Strict ESLint
- Unit tests
- Database/service tests
- Browser/API tests
- Prisma checks and migration rehearsal
- Production build
- Private-file tracing
- Client-secret scanning
- Online full/runtime dependency audits

Preserve existing development/test data.
Do not weaken existing tests to obtain a PASS.

### 7. DOCUMENTATION
Create:
docs/KILIRIDE_MVP_RELEASE_003_REPORT.md

Update where necessary:
- docs/KILIRIDE_MVP_LAUNCH_GAP_REPORT.md
- docs/KILIRIDE_ARCHITECTURE.md
- docs/KILIRIDE_DATA_MODEL.md
- docs/KILIRIDE_TEST_REPORT.md
- docs/KILIRIDE_RELEASE_CHECKLIST.md
- docs/KILIRIDE_HOSTED_RUNTIME.md

Report:
- Files changed.
- Storage architecture.
- Required environment variables.
- Security controls.
- Database changes, if any.
- Exact tests and outcomes.
- Data preservation evidence.
- Reconciliation and recovery procedures.
- External provider requirements.
- Remaining B05 launch blockers.

### STRICT BOUNDARIES
Do not:
- Deploy or provision external infrastructure.
- Use real production credentials.
- Upload actual vehicle evidence remotely.
- Commit or push.
- Activate the draft verification policy.
- Publish real database inventory.
- Implement M-Pesa, bookings or subscriptions.
- Begin unrelated release tasks.

STOP after B05 local implementation.

Return:
ENGINEERING: PASS / PARTIAL / FAIL
HOSTED STORAGE: VERIFIED / PENDING
RECOVERY VALIDATION: VERIFIED / PENDING
B05 BLOCKER: CLOSED / PARTIAL / BLOCKED

# KiliRide — MVP Release Task 002
## B03: Secure Hosted Runtime Foundation

### Role
Act as Principal Backend Engineer, DevSecOps Engineer,
Database Engineer, and QA Lead.

### Context
KiliRide is preparing a limited real-user Premium Car Hire MVP.

The MVP uses:
- Real approved vehicle listings
- HOST and ADMIN management
- Public vehicle discovery
- WhatsApp enquiries
- Manually coordinated rentals and payments

M-Pesa API, transactional booking, automated subscription
billing, and driver marketplace are excluded.

Phase 2F and dependency security have passed local checks
and the latest GitHub Actions workflow.

### Required reading
- AGENTS.md
- docs/KILIRIDE_MVP_LAUNCH_GAP_REPORT.md
- docs/KILIRIDE_PHASE2_REPORT.md
- docs/KILIRIDE_PHASE2F_SECURITY_CLOSEOUT.md
- docs/KILIRIDE_RELEASE_CHECKLIST.md
- docs/KILIRIDE_ARCHITECTURE.md
- docs/KILIRIDE_DECISIONS.md
- Existing environment, auth, email, database and CI code

### Objective
Address launch blocker B03 only.

Prepare a secure, configurable hosted staging/production
runtime without deploying or activating real publication.

Preserve all local and isolated test infrastructure.

### 1. Audit current local restrictions
Inspect:
- src/server/env.ts
- src/server/db.ts
- src/server/auth.ts
- src/server/mail.ts
- scripts/local-safety.mjs
- Prisma configuration and migrations
- Next.js configuration
- Authentication cookies, origins and session security
- Existing environment variable templates

Document the current restrictions and required changes.

### 2. Environment configuration
Introduce explicitly validated development, test,
staging and production configuration.

Requirements:
- Local/test database protections remain intact.
- Production requires explicit environment configuration.
- Invalid or missing production configuration fails closed.
- No implicit fallback to local/test databases or SMTP.
- Secrets must never appear in frontend bundles or logs.
- Provide sanitized environment variable examples.
- Avoid hardcoded hosting-provider assumptions.

### 3. HTTPS authentication
Support an authorized HTTPS application origin.

Verify:
- Correct canonical origin enforcement
- Secure session cookies
- Correct proxy/header trust boundaries
- CSRF and cross-origin restrictions
- Existing MFA requirements
- Signup and account recovery behavior
- Invalid origin rejection

Do not weaken production authorization.

### 4. Hosted PostgreSQL
Support a separately provisioned PostgreSQL database.

Design:
- Encrypted connections where required
- Explicit database environment isolation
- Restricted runtime database privileges
- Separate migration privileges
- Safe pooling and connection lifecycle
- Migration status and repeatability checks

Retain all existing migrations.
Never reset development or production data.

If a database provider is not configured, implement and
test provider-independent configuration only.
Mark external connection verification as pending.

### 5. Production email
Implement configurable, authenticated email delivery
for signup verification and recovery.

Support appropriate TLS requirements and credentials.

Preserve local Mailpit behavior only for development/test.

Do not send real emails without authorized test settings.
Do not log verification codes, reset tokens or credentials.

### 6. Release safeguards
Ensure:
- Real vehicle approvals remain blocked by draft policy.
- Public database catalogue activation remains disabled.
- Production secrets are not committed.
- No private image storage is accidentally published.
- No new public payment or booking functionality appears.

Do not treat B03 as approval to bypass B05/B06/B07.

### 7. Automated verification
Add tests for:
- Local/test environment isolation
- Invalid production configuration
- HTTPS origin and cookie settings
- Authentication and MFA regressions
- SMTP TLS and credential configuration
- Database role/configuration boundaries
- Missing-secret startup failure
- Client-side secret leakage
- Existing fleet and catalogue functionality

Run:
- TypeScript
- Strict ESLint
- Unit tests
- Database/service tests
- Browser/API tests
- Prisma validation and migration checks
- Production build
- Private-file tracing
- Online full and production dependency audits

Do not connect to real hosted services unless explicitly
authorized and properly configured.

### 8. Deliverables
Create:
docs/KILIRIDE_MVP_RELEASE_002_REPORT.md

Update:
docs/KILIRIDE_MVP_LAUNCH_GAP_REPORT.md
docs/KILIRIDE_TEST_REPORT.md
docs/KILIRIDE_ARCHITECTURE.md
docs/KILIRIDE_RELEASE_CHECKLIST.md

Report:
- Changes made
- Environment variables required
- Database and email configuration strategy
- Security boundaries
- Exact tests and outcomes
- External setup prerequisites
- Remaining B03 gaps
- Whether staging deployment is technically ready

### Strict boundaries
Do not:
- Deploy or provision paid infrastructure
- Commit or push
- Activate production vehicle approvals
- Enable public database catalogue publication
- Implement durable object storage under B05
- Implement payment or booking integrations
- Begin unrelated MVP work

STOP after B03 implementation and local verification.

Return:
ENGINEERING: PASS / PARTIAL / FAIL
HOSTED CONFIGURATION: VERIFIED / PENDING
STAGING DEPLOYMENT: READY / BLOCKED

# KiliRide — Codex Task 003
## Phase 2: Fleet Management and Vehicle Verification

### ROLE
Act as Principal Full-Stack Engineer, Database Architect,
Security Engineer, Product Engineer, and QA Lead.

### PROJECT OBJECTIVE
Transform KiliRide into a secure, database-backed Premium
Car Hire marketplace serving Kilifi County, Kenya.

Customers browse approved vehicles.
Authenticated HOST users manage their own vehicle listings.
Authorized ADMIN users verify and approve vehicles.

Preserve all completed Phase 1 functionality.

### REQUIRED READING
- AGENTS.md
- docs/KILIRIDE_ARCHITECTURE.md
- docs/KILIRIDE_DATA_MODEL.md
- docs/KILIRIDE_DECISIONS.md
- docs/KILIRIDE_PHASE1_ACCEPTANCE.md
- docs/KILIRIDE_TEST_REPORT.md
- docs/KILIRIDE_ROADMAP.md

Inspect the repository, Prisma schema, migrations, existing
fleet data, authentication, and authorization before editing.

### MILESTONE 2A — DATABASE FOUNDATION

Extend the existing Prisma schema where required.

Model the following domain concepts:
1. Vehicle
2. Vehicle ownership
3. Vehicle photographs
4. Vehicle listing status
5. Vehicle review and verification history

Vehicle data should support:
- Stable public identifier
- Make, model, category, and description
- Registration information with privacy controls
- Seats, fuel type, and location
- Half-day and full-day base prices in KES
- Owner relationship
- Listing lifecycle status
- Creation and modification timestamps

Suggested listing lifecycle:
DRAFT
PENDING_REVIEW
APPROVED
REJECTED
SUSPENDED

Implement controlled transitions.

Keep listing approval separate from booking availability.

Use existing User identities and roles.
Do not duplicate authentication infrastructure.

Add appropriate constraints, indexes, and relationships.

Generate non-destructive, reviewable Prisma migrations.

Never reset the development database or change previously
applied migrations.

### MILESTONE 2B — LEGACY FLEET MIGRATION

Inspect src/lib/fleet.ts and the Vehicle interface.

Preserve existing Toyota Vitz and Nissan Note e-Power:
- Stable IDs
- Existing URLs
- Known specifications
- Existing rental prices

Create an idempotent migration/import procedure.

Do not fabricate:
- Vehicle owners
- Vehicle photographs
- Verification decisions
- Rental availability
- Inspection evidence

Where ownership is unknown, retain an explicit
unassigned state requiring administrator resolution.

Legacy vehicle import must not automatically imply approval.

Keep existing customer-facing routes operational during
the migration transition.

Do not switch public catalogue reads to the new database
until the approval and compatibility strategy is ready.

Test repeated import execution without duplicates.

### MILESTONE 2C — HOST VEHICLE MANAGEMENT

Using the Phase 1 HOST role and authorization system:

Implement:
- Host vehicle listing page
- New vehicle draft form
- Edit owned vehicle details
- Submit listing for administrator review
- Display review status and feedback
- Owner-scoped listing management

Enforce all permissions server-side.

Hosts must not:
- Modify another host's records
- Grant themselves verification
- Access private records belonging to other owners
- Bypass administrator approval

### MILESTONE 2D — PHOTOGRAPHS AND STORAGE

Build a secure image-management system.

Support:
- Multiple photographs per vehicle
- Cover image selection
- Reordering and removal
- Image validation
- Responsive galleries
- Missing-image fallbacks

Use a storage abstraction compatible with secure
production object storage.

Do not expose private verification documents publicly.
Do not use fake images as evidence of actual vehicles.

### MILESTONE 2E — ADMINISTRATOR VERIFICATION

Implement a protected administrative workflow.

Authorized administrators must be able to:
- Review submitted vehicle listings
- Inspect verification records
- Approve vehicles
- Reject with reasons
- Suspend published listings
- Review verification history

Use existing Phase 1 authorization and MFA controls.

Record decision timestamps, reviewer identities,
status changes, and applicable reasons.

Only approved, eligible listings may appear as verified.

### MILESTONE 2F — PUBLIC FLEET INTEGRATION

Replace static catalogue dependencies incrementally
with approved database-backed inventory.

Preserve:
- Current public URLs
- Existing vehicle IDs
- CarCard and reusable components
- Emerald and slate design language
- Existing quotation calculations
- WhatsApp enquiry functionality

Show:
- Genuine vehicle photographs
- Specifications and prices
- Appropriate listing status
- Loading, empty, and error states

Do not claim real-time availability before the
transactional reservation system is implemented.

Prevent unapproved or suspended vehicles from appearing
as available, verified public inventory.

### MILESTONE 2G — QUALITY AND SECURITY

Test:
- Vehicle ownership isolation
- Unauthorized creation or editing
- Admin-only approval operations
- State transition validation
- Public visibility rules
- Fleet migration idempotency
- Image validation and access security
- Stable vehicle identifiers and URLs
- Pricing regressions
- WhatsApp enquiry regressions
- TypeScript and lint
- Prisma migrations
- Integration and browser behavior
- Production build
- Dependency security audit

Use only isolated development and test infrastructure.

### PHASE 2 EXCLUSIONS

Do not implement:
- M-Pesa payment processing
- Subscription billing
- Transactional bookings
- Driver marketplace
- Production deployment
- SGR or unrelated transportation verticals

### DELIVERABLES

Create:
docs/KILIRIDE_PHASE2_REPORT.md

Update as needed:
docs/KILIRIDE_DATA_MODEL.md
docs/KILIRIDE_ARCHITECTURE.md
docs/KILIRIDE_TEST_REPORT.md
docs/KILIRIDE_ROADMAP.md
docs/KILIRIDE_DECISIONS.md

Report:
- Files changed
- Database schema changes
- Migration results
- Tests and exact outcomes
- Security controls
- Remaining blockers
- Manual verification steps

### EXECUTION CONTROL

Do not implement the entire Phase 2 in one unreviewed change.

FIRST EXECUTION:
Implement only Milestones 2A and 2B.

Run the applicable checks.
Report database models, import behavior, migration
safety, and compatibility with current functionality.

STOP for review before starting Milestone 2C.

Do not commit, push, or deploy automatically.

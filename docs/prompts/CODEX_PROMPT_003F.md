# KiliRide — Codex Task 003F
## Phase 2F: Database-Backed Public Vehicle Marketplace

### ROLE

Act as Principal Full-Stack Engineer, Database Architect,
Application Security Engineer, Product Engineer and QA Lead.

### PROJECT

KiliRide — Premium Car Hire Marketplace, Kilifi County, Kenya.

### CONTEXT

Phase 1 established identity, role authorization, MFA,
PostgreSQL, Prisma, isolated tests and CI.

Phase 2A-2B established fleet persistence, ownership,
verification models and idempotent legacy imports.

Phase 2C established HOST vehicle management.

Phase 2D established secure private vehicle photographs.

Phase 2E established administrator review, verification
evidence, audit history and controlled decisions.

IMPORTANT:
The vehicle verification policy is currently a DRAFT.

Real vehicle approvals and policy-based publication
must remain blocked until formal policy authorization.

### REQUIRED READING

Read the following before editing:

- AGENTS.md
- docs/KILIRIDE_ROADMAP.md
- docs/KILIRIDE_ARCHITECTURE.md
- docs/KILIRIDE_DATA_MODEL.md
- docs/KILIRIDE_DECISIONS.md
- docs/KILIRIDE_PHASE2_REPORT.md
- docs/KILIRIDE_TEST_REPORT.md
- docs/prompts/CODEX_PROMPT_003.md
- docs/prompts/CODEX_PROMPT_003D.md
- docs/prompts/CODEX_PROMPT_003E.md
- docs/policies/KILIRIDE_VEHICLE_VERIFICATION_V0_1_DRAFT.md

Inspect the actual implementation, not just documentation.

Confirm the branch is:
feature/phase2-fleet-management

Confirm Phase 2E is committed and the working tree
contains no unexplained changes.

Do not reset databases or rewrite existing migrations.

### OBJECTIVE

Implement Milestone 2F ONLY.

Integrate the existing KiliRide public vehicle catalogue
with approved, database-backed vehicle inventory.

Maintain the existing customer experience and ensure
the transition is secure, testable and reversible.

Do not activate production database cutover.

### MILESTONE 2F.1 — PUBLIC INVENTORY QUERY LAYER

Inspect existing fleet services and Prisma models.

Implement a server-side public inventory query layer.

A vehicle must meet every applicable publication
requirement before appearing as approved inventory:

1. Approved vehicle listing status.
2. Approval supported by an active, formally authorized
   verification policy.
3. Valid review and audit evidence.
4. Resolved legitimate ownership or rental authorization.
5. No suspension or publication restriction.
6. Public-safe vehicle metadata.

Exclude:
- DRAFT
- PENDING_REVIEW
- REJECTED
- SUSPENDED
- Unassigned legacy inventory
- Vehicles with unresolved verification eligibility

Do not grant public visibility based only on client input.

Return only explicitly permitted public fields.

Never expose private registrations, identity documents,
storage keys, private notes or verification evidence.

Reuse existing services instead of duplicating policy
and authorization logic.

### MILESTONE 2F.2 — CONTROLLED CUTOVER

Implement a server-controlled catalogue feature flag.

Requirements:
- Default OFF.
- No browser-side override.
- No automatic production activation.
- Safe local/test database preview.
- Document exact configuration and rollback.
- Fail closed when eligibility cannot be established.

When OFF:
Preserve the current compatible public catalogue.

When ON:
Display only eligible database-backed inventory.

If zero vehicles qualify, show an honest empty state.

Do not silently fall back to unapproved legacy records.

Do not bypass the unapproved verification policy.

Test positive paths using isolated test-only policy
fixtures that cannot affect real approvals.

### MILESTONE 2F.3 — LEGACY COMPATIBILITY

Inspect the existing:
- Toyota Vitz
- Nissan Note e-Power
- KILIFI_FLEET data
- Vehicle identifiers
- Public routes
- CarCard components
- Vehicle details
- Pricing calculations
- WhatsApp enquiries

Preserve stable public URLs and identifiers.

Preserve known vehicle specifications and prices.

Keep both imported database vehicles as unassigned
DRAFT records.

Do not invent their owners or verification results.

When operating in legacy catalogue mode, do not
misrepresent these listings as administrator-approved,
currently available, inspected or verified.

Plan the eventual transition to approved inventory
without breaking existing customer links.

### MILESTONE 2F.4 — CUSTOMER EXPERIENCE

Integrate the approved inventory query into the
current public-facing catalogue.

Preserve KiliRide's established emerald/slate design.

Support:
- Public vehicle listing cards
- Vehicle detail pages
- Genuine authorized photographs
- Make, model and category
- Public vehicle specifications
- Pricing in KES
- Location information
- Search and relevant filters
- Deterministic sorting
- Pagination
- Mobile responsiveness
- Accessible controls
- Loading states
- Empty states
- Safe error states
- WhatsApp enquiry functionality

Avoid exposing unpublished images.

Do not fabricate vehicle availability.

Do not implement transactional booking.

Do not claim an enquiry is a confirmed reservation.

### MILESTONE 2F.5 — SECURITY

Implement server-side publication authorization.

Verify:
- Private vehicle data never enters public responses.
- Nonpublic vehicles cannot be accessed through IDs
  or direct detail URLs.
- Unpublished photographs remain private.
- Unapproved policy state prevents publication.
- Suspended vehicles are withdrawn from eligible results.
- Client-controlled parameters cannot bypass safeguards.
- API and server component behavior are consistent.
- Queries are protected against excessive result sizes.
- Appropriate database indexes support public queries.
- Public errors do not leak internal information.

Review caching and revalidation.

Avoid serving stale approved data after suspension
or policy deactivation.

If strong cache invalidation guarantees cannot be
demonstrated, prefer conservative uncached reads.

### MILESTONE 2F.6 — TESTING

Test the following:

1. Approved and eligible vehicle visibility.
2. DRAFT exclusion.
3. PENDING_REVIEW exclusion.
4. REJECTED exclusion.
5. SUSPENDED exclusion.
6. Unassigned legacy record exclusion.
7. Unapproved policy publication blocking.
8. Feature flag OFF behavior.
9. Feature flag ON behavior.
10. Zero approved vehicles.
11. Invalid vehicle detail access.
12. Private photograph protection.
13. Pricing and stable identifier compatibility.
14. Search, filters and pagination.
15. Suspended listing cache behavior.
16. WhatsApp enquiry regression.
17. Authentication and role regressions.
18. HOST management regressions.
19. ADMIN verification regressions.
20. Image-management regressions.
21. Production build and server-side safety.

Use test-only policy fixtures for controlled positive
tests without enabling real business approvals.

Run all applicable:
- TypeScript validation
- Strict ESLint
- Unit tests
- Database/service tests
- Browser/API integration tests
- Prisma validation and migration checks
- Production build
- Dependency security audit

Keep development and test infrastructure isolated.

Do not modify production data.

### MILESTONE 2F.7 — DOCUMENTATION

Update:

- docs/KILIRIDE_PHASE2_REPORT.md
- docs/KILIRIDE_ARCHITECTURE.md
- docs/KILIRIDE_DATA_MODEL.md
- docs/KILIRIDE_DECISIONS.md
- docs/KILIRIDE_TEST_REPORT.md
- docs/KILIRIDE_ROADMAP.md
- docs/KILIRIDE_RELEASE_CHECKLIST.md

Document:

1. Files modified.
2. Public inventory query design.
3. Catalogue routes and components.
4. Feature flag and default behavior.
5. Legacy compatibility strategy.
6. Public image authorization.
7. Query filtering and pagination.
8. Caching and suspension behavior.
9. Exact commands and test results.
10. Security controls.
11. Database changes, if any.
12. Manual testing procedure.
13. Production cutover prerequisites.
14. Rollback procedure.
15. Remaining verification-policy blockers.

### STRICT BOUNDARIES

Do not:
- Approve the draft vehicle verification policy.
- Activate real vehicle approvals.
- Enable production catalogue cutover.
- Fabricate vehicles, ownership or documents.
- Implement bookings or reservations.
- Integrate M-Pesa.
- Implement owner subscriptions.
- Implement driver marketplace functionality.
- Deploy to production.
- Merge into main.
- Begin Phase 2G.
- Commit or push automatically.

### FINAL ACCEPTANCE REPORT

Return:

ENGINEERING STATUS: PASS / PARTIAL / FAIL
BUSINESS POLICY READINESS: READY / BLOCKED
PRODUCTION READINESS: READY / BLOCKED

Include:
- Completed features
- Files changed
- Tests and results
- Security observations
- Remaining blockers
- Manual verification steps

STOP after Milestone 2F.

Wait for explicit authorization before Phase 2G.

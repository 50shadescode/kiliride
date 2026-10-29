# KiliRide — Codex Engineering Directives

> Product: KiliRide, a commercial car-hire marketplace initially serving Kilifi County, Kenya.
> Status: Target architecture and delivery standards; audit the repository before selecting migrations or replacing existing systems.

## 1. Mission and operating principles

You are Codex acting as KiliRide's Principal Full-Stack Engineer, Software Architect, Security Engineer, and QA Lead. Build a real, reliable, monetizable marketplace—not a static mockup. Preserve existing value and favor incremental improvements over unjustified rewrites. Prioritize correctness of bookings and payments over cosmetic polish.

KiliRide supports four kinds of participants:
- **Renter/customer:** discovers vehicles, checks availability, receives quotes, books, pays, and manages rentals.
- **Vehicle owner/host:** completes onboarding and verification, publishes vehicles, purchases a subscription, manages inventory, and monitors rentals and revenue.
- **Driver:** registers and is vetted, manages availability, receives assignments, and tracks earnings if the driver vertical is approved.
- **Administrator/broker (Patrick and authorized staff):** reviews compliance, verifies listings, coordinates reservations, manages support, payments, and disputes, and audits operations.

Our first market is Kilifi. Design for expansion without hard-coding Kilifi into core business logic. Currency is KES; business timezone is `Africa/Nairobi`. Do not use emojis in UI copy or commits. Use `lucide-react` SVG icons.

## 2. Existing stack and architecture

- The known frontend is **Next.js App Router + TypeScript**, Tailwind CSS, `clsx`, `tailwind-merge`, custom Radix-style components, and `lucide-react`.
- First inspect the actual repository, current dependencies, API routes, auth, vehicle models, storage, and deployment setup. Do not claim a service or module exists without code or config evidence.
- Existing `src/lib/types/vehicle.ts`, `Vehicle`, `KILIFI_FLEET`, `baseFullDay`, and `baseHalfDay` are legacy entry points: inspect all usages and plan compatible migrations before changing them.
- **Preferred target architecture**, pending Phase 0 audit: modular full-stack Next.js application, PostgreSQL for transactional records, a suitable typed DB layer (Prisma or Drizzle), maintained authentication library, object storage for vehicle photos and verification documents, and server-side Safaricom M-Pesa integration.
- Use clear service/module boundaries for identity, fleet, pricing, availability, booking, payments, subscriptions, admin, notifications, and later driver dispatch. Avoid premature microservices.
- Introduce external dependencies only with documented purpose and compatibility review. Keep provider-specific integration behind adapters.
- Use migrations and seed data (non-production only); no destructive production reset. Back up and review migrations before applying them.

## 3. Product capability map

### Renter journey
Search → Filter → Vehicle details and photos → Select rental interval → Authoritative server quote → Create pending booking → Pay or choose approved manual confirmation option → Confirm booking → View booking status/history → Pickup/return and post-rental support.

### Host journey
Apply/register → Identity/ownership screening → Create vehicle listing → Upload real vehicle photos → Admin approval → Choose subscription → Pay/activate → Manage availability and reservations → View performance and earnings.

### Admin journey
Admin login with MFA where supported → Dashboard → Host and vehicle verification → Listing approval → Manage bookings/calendar → Payment reconciliation → Subscription oversight → Complaints/disputes → Financial exports and audit history.

### Driver journey (later rollout, gated)
Apply → Identity/licence screening → Approval → Set availability → Receive and accept authorized assignments → Completed job and earnings history. Do not create a ride-hailing dispatch service by accident; confirm legal, insurance and operational model before rollout.

## 4. Core domain model (refine after audit)

At minimum evaluate: User, Role/Permission, HostProfile, DriverProfile, Vehicle, VehiclePhoto, VehicleDocument, VerificationReview, AvailabilityBlock, RentalRate/PriceRule, Quote, Booking, BookingStateHistory, PaymentIntent/Transaction, SubscriptionPlan, HostSubscription, Invoice/Receipt, Payout/Settlement (if applicable), Message/Notification, SupportCase, and AuditLog.

- Define explicit ownership and foreign keys; enforce referential integrity.
- Use database-generated IDs, timestamps, and durable state transitions.
- Separate public vehicle information from sensitive identity and ownership documents.
- Preserve historical quotes and agreed pricing snapshots after booking.
- Every important mutation should have actor, timestamp and reason/context where relevant.

## 5. Booking and availability invariants

1. A confirmed vehicle rental must **never** overlap another confirmed rental or relevant maintenance/availability block.
2. Search results are not a reservation. A short-lived hold may be introduced only with an expiration policy and tested reconciliation logic.
3. Recheck eligibility, live inventory, price and time constraints on the server before confirmation.
4. Use transactions, safe concurrency control and appropriate PostgreSQL exclusion constraints or equivalent logic to prevent double bookings.
5. Define the status machine explicitly. Candidate states: `PENDING`, `AWAITING_PAYMENT`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `REJECTED`, `CANCELLED`, `EXPIRED`. Do not use status transitions without authorization and tests.
6. Keep booking time in unambiguous timestamps and render in `Africa/Nairobi`. Specify inclusivity and half-day/full-day boundaries.
7. Compute authoritative quotes on the server; client-side totals are previews only. Use integer KES or an exact money representation, never binary floating-point for financial calculations.
8. Clarify deposits, insurance, mileage, cancellation, taxes, discounts, and late-return pricing with the product owner; do not invent fee policies.
9. WhatsApp is an optional assisted-sales channel, not proof of booking or payment. Never declare a reservation confirmed solely because a link opened.

## 6. Payments, subscriptions and monetization

- Integrate Safaricom M-Pesa through official supported endpoints and sandbox testing; keep credentials and callbacks on the server. Never ship payment secrets in frontend bundles.
- Payment flow must model intent, pending, success, failure, timeout, reconciliation and refund/reversal processes as supported by provider and business policy.
- Do not trust browser-reported payment success, uncontrolled transaction IDs or a frontend callback. Implement idempotent callback processing and independently reconcile ambiguous outcomes.
- Use an append-only payment/ledger trail or immutable audit records for financial changes. Generate receipts/invoices according to approved operations and applicable obligations.
- **Provisional host plans from current website**: 1 car KES 2,000/month; up to 2 cars KES 3,000/month; up to 3 cars KES 4,000/month. Keep as product configuration—not values scattered through components.
- Subscription entitlements, vehicle limits, effective dates, grace periods, renewal, downgrade/cancellation, refunds and trials must be specified and enforced server-side.
- Any booking commissions, owner payouts, driver subscription (historical concept: KES 500/month), escrow, holding deposits, or automated settlement must be treated as *unapproved business decisions* until explicitly authorized.
- Do not activate paid features without a reconciled successful payment or a documented staff-authorized exception.

## 7. Identity, security, privacy and trust

- Apply least-privilege role-based access. Authorize server-side for each action and each record. Prevent cross-account reads and IDOR.
- Choose an established authentication solution after auditing; securely handle login, verification, password recovery, sessions, sensitive account changes and rate limiting. Provide admin MFA or an equally robust access posture.
- Validate all input server-side using the project's established validation tools. Keep secrets in environment/secret management and never commit credentials.
- Protect uploaded files with size/type/content limits; separate public gallery photos from private KYC/licence documents; use controlled access and retention rules.
- Treat a `Verified` badge as a factual claim backed by recorded review criteria, reviewer and approval timestamp.
- Add audit logs for privileged actions and financial status changes. Use structured logging without sensitive personal data.
- Address Kenya Data Protection Act obligations, ODPC registration applicability, consent, access/erasure processes, retention and cross-border storage with qualified review before production launch.
- Confirm legally correct car-hire, insurance and driver obligations with relevant professionals; do not assert compliance or coverage without evidence.
- Implement security headers, TLS, CSRF/session defenses appropriate to framework, webhook controls, backups and restore tests.

## 8. UI, branding and accessibility

- Preserve KiliRide's emerald (`emerald-600`), dark slate (`slate-900`) and light background (`slate-50`) visual identity and existing rounded card/button style unless design review supports a change.
- Use mobile-first layouts and real vehicle imagery. Never present stock photos as actual inventory.
- Build explicit CTAs: `Find a Car`, `List Your Car`, `Become a Driver` only when that feature is available. Do not leave visible dead sign-up or payment buttons.
- State rental price units, fees, availability status and booking confirmation clearly.
- Accessibility: semantic headings, labels, focus states, keyboard navigation, error messaging, image alternatives and sufficient contrast.
- SEO: localized route metadata, sitemap, canonicals, structured data only when true, and measured Core Web Vitals.

## 9. Tests and release quality gates

- Add appropriate unit, integration, end-to-end and security tests using existing repository tools where feasible.
- Minimum critical coverage: quote calculations, timezone boundaries, double-booking concurrency, booking state transitions, role authorization, image permissions, subscription entitlements, idempotent M-Pesa callbacks, reconciliation, and cancellation paths.
- Use synthetic or sandbox payment data. Never run live charges to prove a unit test.
- Before shipping: run lint, typecheck, automated tests, production build, migration verification, a responsive UI check, accessibility review and critical-flow browser QA. Report every skipped check honestly.
- Do not deploy, alter production secrets, execute destructive commands or charge real money without explicit approval.
- Document rollbacks, backups, operational runbooks, incident procedures and staging-to-production promotion steps.

## 10. Working protocol for Codex

### Before any implementation
1. Read these instructions and inspect the actual repository and git status.
2. Audit existing code before proposing libraries, schemas, or rewrites.
3. Determine exact files affected, feature dependencies, data migration impact, and potential breakage.
4. Present a compact plan with acceptance criteria, risks and unresolved business decisions.
5. Default to focused feature branches and reviewable changes.

### During implementation
1. Work in one approved phase or vertical slice at a time.
2. Preserve existing functionality and public URLs where possible.
3. Keep strict TypeScript; centralize types, validation, business rules and permission checks.
4. Use real database and integrations only after configuration and secrets are provided. If unavailable, build testable adapters and sandbox fixtures rather than fake production claims.
5. Do not silently invent business policy or make destructive migrations.

### After implementation
1. List changed files and schema changes.
2. Report actual test commands/results and failures.
3. Explain manual verification and any known limitations.
4. Update docs and identify the next safe slice.
5. Stop after the requested phase; do not proceed automatically to unrelated work.

## 11. Required project documentation

Create/maintain:
- `docs/KILIRIDE_AUDIT.md` — evidence-based inventory, paths, defects, severity.
- `docs/KILIRIDE_ARCHITECTURE.md` — actual and target architecture, diagrams and migration rationale.
- `docs/KILIRIDE_ROADMAP.md` — prioritized phases, dependencies and acceptance criteria.
- `docs/KILIRIDE_DECISIONS.md` — decision register (approved, proposed, pending).
- `docs/KILIRIDE_DATA_MODEL.md` — ERD, ownership, financial and booking invariants.
- `docs/KILIRIDE_TEST_REPORT.md` — executed tests with results and manual QA.
- `docs/KILIRIDE_RELEASE_CHECKLIST.md` — staging, backups, security, payments, policies and rollout.

Track feature status as `IMPLEMENTED`, `PARTIAL`, `MISSING`, `DEFECTIVE`, or `UNVERIFIED` with file-path evidence. Severity: `P0` revenue/security/booking blocker, `P1` significant, `P2` enhancement. Never claim features work because a component exists or a build passes.

## 12. Mandatory decisions before irreversible implementation

Confirm or document pending: booking confirmation rules; cancellation/refund/deposit policy; half-day definition and rounding; who receives rental money and how owners are paid; taxes and invoices; host subscription trial/renewal/grace terms; verification criteria; driver model; data/identity retention; permitted geographies; and supported payment credentials.

**The first Codex task is a read-only repository audit. Do not change source, install packages, create migrations, connect providers, or deploy in that task.**

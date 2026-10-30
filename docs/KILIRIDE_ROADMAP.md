# KiliRide — Commercial Product Roadmap

## Phase 2A/2B local status (2026-10-30)

IMPLEMENTED under explicit authorization: additive fleet/ownership/private-registration/photo-metadata/review/history schema, controlled server-only lifecycle, backed-up/rehearsed local migrations and idempotent import. Development has two unassigned legacy DRAFTs; public routes/components still read unchanged static data. No real owners, photographs, availability or verification evidence were invented.

Acceptance: 8 unit tests, 5 fleet database/service tests and 8 Phase 1 integration/browser regressions passed, along with TypeScript, strict lint and production build. See [KILIRIDE_PHASE2_REPORT.md](KILIRIDE_PHASE2_REPORT.md) for exact evidence and limits. Stop before 2C. Host forms/dashboards, uploads, admin UI and public database cutover require further approval; real ownership/verification/insurance/privacy decisions remain prerequisites for approval/publication. No payment, commit, push or deployment work.

## Phase 1 local implementation status (2026-10-29)

Milestones 1A–1D were implemented locally under CODEX_PROMPT_002: isolated PostgreSQL, Prisma migrations, Better Auth identity/recovery/MFA, server-side roles and ownership, minimal protected routes, tests and a GitHub Actions workflow. Existing static fleet, pricing, vehicle IDs and WhatsApp flow are retained. See KILIRIDE_PHASE1_REPORT.md for executed acceptance checks and limitations; the earlier Phase 0 backlog below is preserved as historical planning.

No production/staging deployment occurred. CI configuration is prepared but a hosted GitHub run has not been executed. Real email, operational role/retention policy and remaining development-tool security advisories require review before production consideration. Stop for Phase 1 review; Phase 2 fleet persistence and verification must not begin automatically.

Version: proposed baseline (pending repository inspection). Market: Kilifi County, Kenya. Product: managed car-hire marketplace that progressively adds automated bookings, host monetization and a driver vertical.

## Strategic release milestones

- **Milestone A: Reliable rental commerce** — real inventory, verified search, date-specific quotes, confirmed bookings and administrator operations.
- **Milestone B: Collect revenue** — verified M-Pesa payments and host subscriptions with accurate accounting and support workflows.
- **Milestone C: Self-service growth** — verified host onboarding, owner dashboard, analytics and optional driver vertical.
- **Milestone D: Operational maturity** — expanded region support, reliability, security, disputes, retention, reporting and performance tuning.

A vertical slice is complete only when UI, business logic, authorization, persistence, tests, monitoring and admin recovery path are covered.

## Phase 0 — Repository audit and execution plan (P0)

**Scope:** inspect Next.js route tree, auth, static fleet, pricing, WhatsApp handoff, integrations, config, data model, storage, tests, CI, deployment, responsiveness and visible dead ends. Assess technical debt and data migration safety.

**Exit:** evidence-based status matrix with file paths; actual vs target architecture; feature dependencies; prioritized backlog; no application source changes.

## Phase 1 — Architecture, database and identity (P0)

**Scope:** modularize current app without blanket rewrite; establish PostgreSQL and typed DB layer after architecture decision; migration and seed strategy; authentication and roles for customer/host/admin (driver role reserved); server-side authorization; environment configuration, staging, baseline CI/tests.

**Exit:** safe login/session, authenticated route/action checks, ownership isolation, reproducible migration and rollback, staging pipeline and test coverage.

## Phase 2 — Fleet, host verification and photo management (P0)

**Scope:** migrate valid KILIFI_FLEET records into persistent records; build vehicle CRUD and status; owner association; upload real images; admin verification and rejection workflow; maintenance blocks and availability calendar; transparent verification badge; avoid fake fleet data.

**Exit:** approved vehicles discoverable publicly, non-approved records hidden, authorized host/admin modifications only, images managed securely, all historical identifiers preserved or mapped.

## Phase 3 — Discovery and server-authoritative pricing (P0)

**Scope:** functional search by Kilifi area, date/time, class, capacity, price; detail pages; backend quote engine using preserved rate rules; half/full-day boundaries; itemized KES quotes; error/empty states; mobile-first redesign; local SEO groundwork.

**Exit:** renter selects exact interval and gets a reproducible quote that matches backend and saved policy, including timezone/rounding cases.

## Phase 4 — Reservation engine and broker/admin operations (P0)

**Scope:** pending booking/quote snapshot, optional timed holds, atomic confirmation, overlap protection (PostgreSQL constraints/transactional controls), admin dashboard, status history, cancellation workflows, customer itinerary and booking history; WhatsApp remains optional assisted channel.

**Exit:** no overlapping confirmed reservations under concurrency tests; administrator can manage and recover a reservation; customer receives accurate status; handoff never misrepresents confirmation.

## Phase 5 — M-Pesa payments and financial controls (P0)

**Scope:** Daraja sandbox integration, secure server-side initiation, verified callbacks and reconciliation, idempotency, payment intents, receipts and failure/retry paths. Decide rental deposit or full-payment model and beneficiary. Establish audit trails and error notifications.

**Exit:** sandbox purchase reconciles to correct booking once; duplicate/reordered callbacks cannot double-credit; payment never marked successful by browser; refunds/reversals and ambiguous cases have documented operator workflows.

## Phase 6 — Host onboarding, subscriptions and earnings (P1; monetization-critical)

**Scope:** owner registration, verification documents, vehicle submission/approval, pricing page and subscription plans: 1 car KES 2,000; up to 2 KES 3,000; up to 3 KES 4,000 per month (provisional from current site). Subscription entitlement engine; paid activation and expiry/grace rules; owner dashboard, enquiries, bookings and revenues; owner payout accounting if the operating model requires KiliRide to collect rental funds.

**Exit:** a legitimate host can onboard, get approved, pay in sandbox, manage eligible fleet and see correct subscription state. Unpaid hosts cannot exceed approved entitlements. Financial reports reconcile.

## Phase 7 — Trust, support, notifications and legal readiness (P1; launch gate)

**Scope:** publish confirmed rental policies; verify actual insurance coverage and driver eligibility; privacy terms, ODPC review, secure KYC, customer/host notices; notification channels and delivery tracking; support, cancellations, complaints and dispute case management; security hardening.

**Exit:** claims supported by evidence; private documents protected; critical policies approved; every material workflow has support path; no critical security issues.

## Phase 8 — Driver services (conditional expansion, P2)

**Scope:** confirm driver business model before implementation; registration, licence and identity vetting, admin review, verified availability, booking assignment, acceptance, job completion and payouts/subscription if approved.

**Exit:** verified authorized drivers only; assignments consistent with vehicle booking schedule and insurance/licence constraints. No launch until business and legal decisions approved.

## Phase 9 — Growth and operations (P2)

**Scope:** search/local landing pages, referral and campaign attribution (once approved), dashboards for search-to-booking, occupancy/utilization, host churn, MRR, failed payments, customer response time; monitoring, backup/restore drills and capacity testing.

**Exit:** measurable operational KPIs, observability, recovery procedure and documented optimization backlog.

## Phase 10 — Production launch gate

**Scope:** end-to-end user journeys, device and accessibility review, concurrency, payment and security tests, vulnerability review, data minimization and privacy checks, runbooks, environment audit, load tests and staging rehearsals.

**Exit:** written GO / CONDITIONAL GO / NO-GO; no outstanding P0 issues, approved business policies, live integration checks and explicit deployment authorization.

## Core revenue model (decisions pending)

1. Host monthly listing subscription: provisional KES 2,000 / 3,000 / 4,000 tiers; validate conversion and host ROI.
2. Rental booking commission: optional and *not assumed*, dependent on owner contracts, collection flows and tax treatment.
3. Driver fees or commission: optional after driver vertical validated; historical idea of KES 500/month is not approved by this document.
4. Value-added products: do not implement insurance markup, advertising, deposits, or priority listings without transparent pricing and business approval.

## Business decisions to resolve before relevant phases

- What precisely counts as half day and full day? When do late fees start?
- How are rentals priced across multi-day boundaries? Taxes, fuel, mileage, deposits?
- Does KiliRide collect rentals or only booking deposits? Who is merchant of record?
- When does a reservation become confirmed? Is payment required?
- What are cancellation, refund, no-show and damage rules?
- What proof is required to verify owner, vehicle and driver?
- What do host subscriptions entitle and when does billing renew/expire?
- Who receives payouts and who handles disputes and chargebacks?
- Which regions and driver verticals are first approved?
- Which organizational/entity and Kenya compliance obligations apply?

## Minimum KPIs for monetization

- Weekly available approved vehicles; listing approval time.
- Search → vehicle view → quote → enquiry → confirmed booking conversion.
- Utilization (rented hours/days per available vehicle); booking cancellation rate.
- Host activation rate; host monthly recurring revenue and churn.
- Booking gross merchandise value, platform recognized revenue, payment failures, reconciliation exceptions.
- Response time and support dispute resolution time.

## Working rules

Phase 0 audit is required first. Implementation is vertical-slice by vertical-slice; every phase produces a reviewable diff and evidence for acceptance. No production deployments or destructive migrations without approval. Features in later phases may be reprioritized after audit and real customer/host feedback.

## Phase 0 audit addendum — 2026-10-29

The original proposed roadmap above is preserved. The inspected working tree is a static catalogue and WhatsApp enquiry frontend, with no auth, database, payment or booking persistence. See `KILIRIDE_AUDIT.md` for the evidence matrix and `KILIRIDE_TEST_REPORT.md` for check limits. The commercial target is not yet launch-ready. All following work is proposed, not started.

### Top ten tasks in dependency order

| Rank | Priority | Task and phase | Dependencies | Acceptance evidence |
|---|---|---|---|---|
| 1 | P0 | Approve architecture/identity/provider decisions and policy decision owners (Phase 1 kickoff). | Phase 0 approval. | Signed decision register; budget/region and identity model resolved; later policies explicitly gated. |
| 2 | P0 | Establish reproducible tooling, isolated PostgreSQL, typed DB choice, env contract, migration/backup strategy and CI (Phase 1). | 1; approved infrastructure configuration. | Clean migration/restore rehearsal; no production seed; pinned stack; CI lint/typecheck/test/build. |
| 3 | P0 | Implement authenticated account access, customer/host/admin authorization and admin audit/MFA (Phase 1). | 2; auth choice and admin bootstrap policy. | Login/session/recovery tests; anonymous, role escalation and cross-account denial tests. |
| 4 | P0 | Persist validated fleet ownership, private documents, real photos, reviews and maintenance blocks (Phase 2). | 3; verification/retention policy. | Approved-only catalogue; owner isolation; private storage tests; preserved legacy slugs. |
| 5 | P0 | Authoritative versioned quotes and approved interval/fee policy (Phase 3). | 4; B02/B03 decisions. | Invalid intervals rejected; exact KES snapshots; Nairobi/half-day/full-day boundary tests. |
| 6 | P1 | Complete discovery, primary CTAs, enquiry validation, mobile navigation and accessibility (Phases 1–3 incremental UI repairs). | Route/auth readiness for relevant CTA; 4/5 for date search. | No dead controls; keyboard/mobile QA; assisted enquiry clearly distinct from booking. |
| 7 | P0 | Transactional booking engine and Patrick's protected operations/history (Phase 4). | 3–5; confirmation/cancellation policy. | No overlap against rentals or maintenance under concurrency; authorized state changes and recovery. |
| 8 | P0 | Sandbox M-Pesa intents, callbacks, reconciliation, receipts and exception handling (Phase 5). | 7; beneficiary/merchant/refund policy and sandbox credentials. | Duplicate/reordered/late callbacks handled exactly once in accounting; no browser-authoritative success. |
| 9 | P1 | Host subscriptions, server entitlements and earnings/accounting if approved (Phase 6). | 4 and 8; approved plan lifecycle/settlement terms. | Reconciled activation; expiry/downgrade/limits tested; no invented revenue or balances. |
| 10 | P0 | Complete launch trust/security/support/privacy, monitoring and restore gates (Phases 7/10). | Prior commercial slices; qualified policy review. | No open P0 blockers; runbooks and restore drill; written GO and explicit deployment authorization. |

P2 work: conditional driver services (Phase 8), local SEO expansion, analytics optimization and multi-region growth (Phase 9). Policy/privacy and security work begins alongside the foundation; Phase 7 numbering is not permission to postpone sensitive-data safeguards.

### Recommended first small vertical slice: authenticated account boundary

Retain public pages, legacy slugs and static fleet behavior. In an approved development/staging environment, add a maintained auth integration, PostgreSQL-backed identity/roles, a minimal private account page and one protected admin access view. This proves the frontend-to-server-to-database authorization boundary without changing pricing or taking payment. No full admin dashboard, fleet migration, booking system, KYC uploads or driver workflow in this slice.

### Phase 1 deliverables and acceptance

1. Approved ADR for ORM/auth/hosting; env variable **names** and validation, secret management and documented local setup. No production values in source/docs.
2. Server-only identity/data access modules and initial User/Role/Session-compatible schema, generated IDs, foreign keys, audit events and reviewed non-production migrations/seeds. Existing fleet interface remains compatible.
3. Working login/logout, account verification/recovery as supported by approved identity model; secure revocable session; role provisioning inaccessible to public users; administrator MFA or approved equivalent.
4. Record-level authorization demonstrated on own-account data; anonymous, customer, host and admin test matrix; forged account/owner/role parameters rejected. Tests use synthetic users.
5. Baseline unit/integration/browser test tooling selected after dependency review, with CI lint, typecheck, tests and build. Regression checks retain catalogue/detail/unknown-ID/WhatsApp behavior and SGR absence.
6. Staging configuration/pipeline prepared and documented; actual deployment requires authorization. Database connection/restore rehearsal only in approved isolated environment; no production migration or destructive reset.

Acceptance requires successful identity journey, negative permission tests, clean setup/migration rehearsal, rollback or forward-recovery documentation and unchanged public functionality. Secrets must not enter client bundles or logs. Mobile/keyboard access to new controls must be verified. Report all blocked checks explicitly rather than substituting mocks for integration evidence.

Phase 1 estimates and vendor costs remain uncommitted until decisions are approved. The next action is owner review of Phase 0, not automatic implementation.

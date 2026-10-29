# KiliRide decision register

## Phase 1 authorization and implemented decisions

This addendum supersedes Phase 0-only scope statements below for this local implementation. The user authorized CODEX_PROMPT_002 and milestones 1A–1D; no deployment or production access is authorized.

- T01/T03/T04: modular Next.js, Prisma 7.10.1 and Better Auth 1.7.14 selected after official compatibility inspection and local integration tests. No Prisma 8 prerelease.
- T02/B16 local subset: Docker PostgreSQL 17 with separate development/test instances and generated local credentials; Mailpit for local email. Managed providers, hosting regions/budget and real email remain pending.
- B10 local subset: public CUSTOMER only; controlled HOST activation; operator-provisioned ADMIN only for verified MFA-enabled accounts; DRIVER reserved/denied. Multiple assignments supported. Admin provisioning revokes sessions and appends audit evidence. Broader delegation/revocation operations remain later work.
- B11 local subset: email/password signup with 12–128 character passwords, verification required, recovery by expiring email link, one-day sessions and MFA/recovery-code support. No localStorage session secrets. Public privacy/account-erasure policies remain pending.
- Security compatibility decision: Next.js/eslint-config-next updated to 16.4.3; non-breaking dependency fixes applied. No forced downgrade of existing shadcn tooling. Residual advisories are recorded in the Phase 1 report.

All rental, fee, payment-beneficiary, subscription, KYC/insurance, retention and driver business decisions below remain pending. Local identity functionality does not approve commercial policies or production launch.

Date: 2026-10-29. This document records proposals, not authorization to implement or transact. Owner refers to the product/business decision maker; Patrick is the intended operational admin, subject to authorization confirmation.

## Established scope

| ID | Status | Decision / authority |
|---|---|---|
| S01 | APPROVED | Current task is Phase 0 documentation-only; stop for approval afterward (user request and prompt 001). |
| S02 | APPROVED | Premium Car Hire only; SGR remains removed (user instructions). Driver vertical stays conditional. |
| S03 | APPROVED | Preserve existing frontend, URLs and Git work; professional emerald/slate UI and SVG icons. |
| S04 | APPROVED | Updated AGENTS.md permits planning a full-stack target; does not authorize source changes, providers or migrations in this task. |
| S05 | APPROVED | Target currency KES and business timezone Africa/Nairobi, per AGENTS.md. |

## Proposed technical decisions

| ID | Status | Proposal | Approval / prerequisite |
|---|---|---|---|
| T01 | PROPOSED | Modular Next.js monolith, server-only data access and domain services. | Owner approves Phase 1 scope. |
| T02 | PROPOSED | Managed PostgreSQL with DB-generated IDs, transactions and migration history. | Provider, region, budget, backup/restore policy and staging credentials. |
| T03 | PENDING | Select Prisma or Drizzle after pinned-stack transaction/custom-SQL proof. | Engineering review of generated SQL, connection handling and migration reversibility. |
| T04 | PENDING | Choose maintained authentication solution and identity method. | Recovery/verification requirements, admin MFA, privacy and cost review. |
| T05 | PROPOSED | Protected storage adapter separating approved gallery photos from private verification records. | Retention/access policy and vendor approval; Phase 2. |
| T06 | PROPOSED | Unified inventory allocations, half-open intervals, explicit holds expiry if holds approved. | Business time/buffer rules; Phase 4 concurrency proof. |
| T07 | PROPOSED | Daraja sandbox adapter and durable reconciliation/outbox. | Merchant eligibility, supported API/callback controls and credentials; Phase 5. |

## Business decisions requiring owner approval

| ID | Status | Decision required | Blocks / safe interim position |
|---|---|---|---|
| B01 | PENDING | Who can confirm a booking? Is payment mandatory, or may Patrick authorize a documented manual exception? | Phase 4; WhatsApp remains an enquiry, not confirmation. |
| B02 | PENDING | Half-day hours, full-day boundary, rounding, minimum term, turnaround buffers, past-date restrictions and late-return rules. | Phase 3; existing arithmetic is legacy preview, not policy. |
| B03 | PENDING | Is the KES 500 reservation fee retained, refundable, credited to rental, or charged separately? Deposits, mileage, fuel, delivery and taxes? | Phases 3–5; do not invent fees or assume all-inclusive total. |
| B04 | PENDING | Cancellation, rejection, no-show, damage, extension and refund/reversal terms, including late payment after expiry. | Phases 4–5; no automatic refunds/penalties until approved. |
| B05 | PENDING | Merchant of record and beneficiary: platform collects rental/deposit, or owner receives rent directly? | Phase 5; no commission, escrow or settlement assumption. |
| B06 | PENDING | Owner payout schedule, liabilities, dispute handling, reconciliation and financial access rights. | Phases 5–6; payout module conditional on B05. |
| B07 | PENDING | Approve subscription tiers (provisional 1 car KES 2,000; up to 2 KES 3,000; up to 3 KES 4,000/month), taxes and exact vehicle-limit semantics. | Phase 6; website copy is not approved billing configuration. |
| B08 | PENDING | Trial, renewal timing, proration, grace, downgrade, cancellation, refund and treatment of existing bookings on expiry. | Phase 6; no automatic entitlement enforcement policy invented. |
| B09 | PENDING | Owner identity/ownership evidence, vehicle inspection and insurance checks, reviewer authority, expiry and badge criteria. | Phase 2 and launch; do not treat static Verified flags as evidence. |
| B10 | PENDING | Roles and multi-role accounts, host/staff delegation, initial admin bootstrap and MFA recovery procedure. | Phase 1; no public ability to assign admin. |
| B11 | PENDING | Email/phone login, recovery channel, account deletion, consent and legal notices. | Phase 1 identity design; contact phone is not verified identity. |
| B12 | PENDING | Data retention, KYC access, permitted storage regions, deletion/subject requests and applicable Kenyan compliance review. | Before sensitive data collection; qualified review, no compliance claim. |
| B13 | PENDING | Insurance coverage, renter/driver eligibility and rental contracts. | Fleet approval and launch; obtain professional operational/legal review. |
| B14 | PENDING | Initial service areas and delivery rules beyond Kilifi; who confirms physical inventory and authorizes image/plate publication? | Phase 2; current data not assumed production-valid. |
| B15 | PENDING | Driver operating model, insurance/licensing and any subscription or commission. | Phase 8 only; historical KES 500/month driver fee unapproved. |
| B16 | PENDING | Hosting/provider budget, region, supported runtime, sandbox account ownership, operational contacts and recovery objectives. | Phase 1 setup and later payment/storage integration. |

Phase 1 approval needs T01–T04 and B10/B11/B16 resolved sufficiently for a concrete implementation plan. Later policy decisions can remain pending while foundation work proceeds, provided no dependent behavior is introduced. All live deployment, real-money charges and production migrations require separate explicit authorization.

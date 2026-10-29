# Codex Task 001 — Commercial KiliRide Repository Audit (Read Only)

You are operating inside the actual KiliRide repository. First read the root `AGENTS.md` and any applicable nested instructions. You are acting as Principal Full-Stack Engineer, System Architect, Product Analyst, and QA Lead.

## Context
KiliRide is moving from a Next.js/TypeScript, static-fleet, WhatsApp-assisted Kilifi car-hire website into a commercial multi-sided rental marketplace. The target includes renters, verified vehicle owners, authorized administrators (Patrick), and a later optional driver vertical. The goal is persistent bookings, reliable availability, M-Pesa commerce, owner subscriptions, and measurable operational performance.

The old agent instructions prohibited databases and APIs only for an early MVP. That prohibition has been superseded by the updated `AGENTS.md`. However **this specific task is read-only: audit before changing source**.

## Strict instructions
- Do **not** change application source files, install packages, add a database, create migrations, modify env secrets, deploy, charge money, or refactor anything.
- You may create `docs/` audit documentation, but do not modify application behavior.
- Read the actual repository before stating architecture facts. Do not infer backend capabilities from screenshots or project slogans.
- Report evidence with real repository paths, exported symbols, route names, and where useful line ranges.
- Never invent user data, vehicle data, business policy, or completion percentages.

## Investigation

### A. Repository baseline
Inspect git status, package scripts, Next.js App Router structure, installed libraries, TS configuration, deployment/runtime, CI, linting, unit tests, E2E tooling, environment variable names (never print their secret values), and existing architectural boundaries.

### B. Pages and UX
Map homepage, about, services, pricing, contact, login/signup, vehicles, vehicle detail, navigation, footer, responsive components, missing images, dead CTAs, missing empty/loading/error states, and accessibility/SEO risks.

### C. Existing data and business logic
Locate `KILIFI_FLEET`, `Vehicle` at `src/lib/types/vehicle.ts` (if present), `baseFullDay`, `baseHalfDay`, booking date selection, price formulas, availability badges, WhatsApp handoff and any hidden persisted records. Trace the actual data flow end to end. Note hardcoded availability, pricing assumptions, uncontrolled timezones, and source-of-truth conflicts.

### D. Security and operations
Inspect authentication and roles (if any), exposed admin/contact paths, server/client boundaries, file uploads, validation, logging, secrets handling, public verification claims, analytics/monitoring, deployment and backup patterns.

### E. Commercial readiness
Map the gap to target capabilities:
1. Renter identity, catalogue, filtered search, availability, quote, bookings, payment, status/history.
2. Owner identity, verification, fleet CRUD, subscriptions, earnings.
3. Admin verification, booking/calendar management, payment reconciliation, dispute resolution.
4. Driver onboarding/assignment (optional later feature).
5. Finance: M-Pesa, refunds, invoices, entitlements, and financial audit trail.

### F. Architecture proposal
Recommend an incremental migration plan: Next.js modular backend, PostgreSQL versus any existing database, auth, object storage, provider abstraction for Daraja, transactional reservations, state transitions and staging. Justify every important choice using repo evidence and complexity/cost implications. Avoid a gratuitous rewrite.

## Deliverables

Create:
- `docs/KILIRIDE_AUDIT.md` — feature matrix with `Area | Feature | Status | Code Evidence | Severity | Finding | Recommendation`.
- `docs/KILIRIDE_ARCHITECTURE.md` — current architecture and target architecture with a migration plan and risk register.
- `docs/KILIRIDE_ROADMAP.md` — sequenced P0/P1/P2 implementation backlog, phase dependencies, acceptance criteria and suggested first small vertical slice.
- `docs/KILIRIDE_DECISIONS.md` — explicit decisions pending owner approval (booking/payment policies, subscription terms, roles, insurance, host payout model, etc.).
- `docs/KILIRIDE_TEST_REPORT.md` — tests available, safe checks actually run, results and gaps.

Classify features strictly as `IMPLEMENTED`, `PARTIAL`, `MISSING`, `DEFECTIVE`, or `UNVERIFIED`. A button or component alone does not count as full workflow implementation. Assign P0 only for launch-critical revenue, booking or security requirements.

## Final answer to me
Summarize:
1. What genuinely exists now.
2. What is missing or defective, with file-path evidence.
3. Which current components should be preserved.
4. The recommended target architecture and migration order.
5. The top 10 tasks prioritized by impact and prerequisites.
6. Major business decisions requiring approval.
7. Your proposed Phase 1 deliverables and acceptance tests.
8. Exact files/documentation changed and checks executed.

**STOP after the audit. Do not begin Phase 1 until I approve the findings.**

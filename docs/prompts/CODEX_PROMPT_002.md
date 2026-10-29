# CODEX TASK 002: KiliRide Phase 1 Implementation

## Role
Act as Principal Full-Stack Engineer, Database Architect,
Authentication Engineer, Security Engineer and QA Lead.

## Mission
Implement Phase 1 of the KiliRide commercial marketplace:
Database, Authentication, Authorization and CI Foundations.

Read AGENTS.md and the existing Phase 0 audit, architecture,
data model, decisions, roadmap and test reports first.

## Current Project
- Next.js App Router
- TypeScript
- Tailwind CSS
- Existing reusable UI components
- Static KILIFI_FLEET data
- Vehicle details and rental pricing utilities
- WhatsApp booking enquiry handoff

Preserve all existing functionality, vehicle IDs, routes,
pricing logic and the emerald/slate design system.

## Proposed Architecture
- PostgreSQL database
- Prisma ORM
- Better Auth for authentication
- Server-side authorization
- Next.js server modules and Route Handlers
- Docker PostgreSQL for local development
- GitHub Actions CI if the repository uses GitHub

Verify package compatibility and existing architectural
decisions before installing dependencies.

## MILESTONE 1A: DATABASE FOUNDATION

1. Configure isolated local PostgreSQL development and test
   databases.
2. Integrate Prisma with the installed Next.js architecture.
3. Create a minimal extensible schema for users, sessions,
   authentication and role assignments.
4. Implement server-only database connection management.
5. Add reproducible, non-destructive migrations.
6. Add .env.example with safe placeholders.
7. Ensure real credentials are excluded from Git.
8. Document database setup, backup, migration and recovery.
9. Preserve all existing static fleet data for Phase 2.

Never run destructive migrations or reset existing user data.

## MILESTONE 1B: AUTHENTICATION

Implement:
- Customer signup
- Email/password login
- Logout
- Secure session persistence
- Email verification
- Forgot password
- Reset password
- Protected account page
- Input validation and useful error feedback

Use Better Auth if compatible with the existing project.

Implement a local email testing strategy where a real email
provider is not yet configured.

Never expose password tokens, signing keys or session secrets.
Never store session secrets in localStorage.

## MILESTONE 1C: AUTHORIZATION

Supported roles:
- CUSTOMER
- HOST
- ADMIN

Reserve DRIVER for a later development phase.

Requirements:
1. New public registrations receive only CUSTOMER privileges.
2. Host access requires the appropriate controlled activation.
3. Administrator accounts must be provisioned securely.
4. Public users must never self-assign ADMIN privileges.
5. Protect private account, host and administrator routes.
6. Implement reusable server-side authorization helpers.
7. Enforce ownership and role permissions on every protected
   data access and mutation.
8. Prevent users from accessing another user's private data.
9. Provide basic protected /account, /host and /admin routes.
10. Do not build full host or administrator dashboards yet.

Never rely on frontend route hiding as the only security layer.

## MILESTONE 1D: TESTING AND CI

Implement and execute tests covering:
- Signup and login
- Email verification
- Password reset
- Session expiration and logout
- Unauthorized access
- Role privilege escalation
- Cross-account access
- Protected administrator actions
- Database migration reproducibility
- Existing pricing and WhatsApp regression behavior

Run the project's applicable:
- ESLint checks
- TypeScript checks
- Automated tests
- Production build
- Dependency security checks

Configure CI appropriate to the existing repository.

Use an isolated test database. Never connect tests to
production data.

## ENGINEERING GUARDRAILS

1. Inspect the repository and Git status before editing.
2. Preserve all existing modifications and untracked files.
3. Do not rewrite the application from scratch.
4. Do not create unrelated features.
5. Do not connect to a production database.
6. Do not deploy.
7. Do not configure live payments.
8. Do not implement M-Pesa during Phase 1.
9. Do not migrate the existing fleet records yet.
10. Do not implement booking payments or subscriptions yet.
11. Never hardcode credentials or privileged users.
12. Avoid unnecessary dependencies.
13. Use modular, strictly typed TypeScript.
14. Provide meaningful error handling.
15. Document unsupported or blocked functionality.
16. Stop after completing Phase 1.

## ACCEPTANCE CRITERIA

Phase 1 is complete only when:

- PostgreSQL development setup works.
- Prisma migrations run reproducibly.
- Customer signup and login function.
- Secure sessions and logout function.
- Verification and recovery work in the configured test flow.
- Role-based access is enforced on the server.
- Unauthorized users cannot access protected data.
- Public registration cannot grant administrator privileges.
- Existing KiliRide catalogue and WhatsApp flow still work.
- Relevant automated tests pass.
- TypeScript, lint and build checks pass.
- Any failures or skipped checks are documented.

## REQUIRED DELIVERABLES

Create:
docs/KILIRIDE_PHASE1_REPORT.md

Update as appropriate:
docs/KILIRIDE_ARCHITECTURE.md
docs/KILIRIDE_DATA_MODEL.md
docs/KILIRIDE_DECISIONS.md
docs/KILIRIDE_TEST_REPORT.md
docs/KILIRIDE_ROADMAP.md

The Phase 1 report must document:
1. Implementation summary
2. Files changed
3. Architecture decisions
4. Database schema and migrations
5. Authentication implementation
6. Authorization access matrix
7. Tests performed and results
8. Existing functionality regression checks
9. Security findings
10. Remaining work and configuration requirements
11. Manual verification steps
12. Phase 2 prerequisites

Do not claim successful tests that were not executed.

STOP after Phase 1.
Do not deploy or proceed to Phase 2 without approval.

# Commercial release gates

Phase 0, 2026-10-29. **NO-GO for commercial automated booking/payment launch.** This checklist is a future acceptance gate, not deployment authorization. Existing frontend remains unchanged.

- [ ] Owner approves phase scope, provider choices, operating budget and responsibility matrix.
- [ ] Identity, role/record isolation, admin MFA, session recovery and audit controls tested.
- [ ] Fleet ownership, real images, verification and insurance claims evidenced; invalid seed data absent from production.
- [ ] Authoritative pricing and all rental/fee/cancellation policies approved and visible.
- [ ] Booking/maintenance/hold overlap prevented under real database concurrency tests.
- [ ] Daraja sandbox flow reconciles correctly; duplicate and late callbacks, retries, refunds/reversals and exception runbooks validated.
- [ ] Merchant beneficiary, financial records, payouts if applicable, subscriptions and tax/invoice treatment approved.
- [ ] Private uploads, public photos, retention, privacy requests and qualified compliance review complete.
- [ ] CI lint/typecheck/tests/build and mobile/accessibility/critical-flow QA pass; dependencies/security findings reviewed.
- [ ] Secrets, TLS, headers, rate limits, CSRF/session defenses and sensitive-log redaction verified in staging.
- [ ] Hosting/runtime, connection pooling, job execution, monitoring, alerts and operator escalation documented.
- [ ] Backups/restores, migration rehearsal, data-compatible rollback and reconciliation after recovery demonstrated.
- [ ] Legal/support/privacy/contact pages and CTA destinations are real and approved.
- [ ] Production promotion plan receives explicit authorization; no real charges as a substitute for sandbox tests.

SGR remains excluded. Driver functionality remains gated. Phase 1 foundation completion alone does not satisfy this release checklist.

# Commercial release gates

## Phase 2F review gate (2026-10-31)

**NO-GO for production catalogue cutover.** Local controlled-preview engineering is separate from business-policy and production readiness. See [Phase 2 report](KILIRIDE_PHASE2_REPORT.md) for executed checks. No deployment is authorized.

- [x] Default-OFF, server-only `KILIRIDE_DB_CATALOGUE` and production-mode activation denial; no browser override/fallback.
- [x] Shared explicit public DTO and evidence-backed eligibility; private metadata and storage keys excluded.
- [x] Controlled, no-store photographs and dynamic pages; optimizer cache bypass blocked.
- [x] Legacy IDs/prices/routes preserved with truthful pending-review labels; database legacy rows remain unassigned DRAFTs.
- [x] Development/test database and storage separation; unchanged migrations rehearsed on a new disposable target.
- [ ] Business approver formally authorizes an immutable policy version and definitive applicable compliance requirements; record actual authority/effective date.
- [ ] Real ownership/rental authorization, registration authenticity checks, genuine photos and required rental evidence reviewed; no synthetic fixture enters real inventory.
- [ ] Rental/fee/availability representations, publication/privacy/retention rights and customer support terms approved.
- [ ] Hosted private storage, service ACLs, monitoring, backups and coordinated database/object restore accepted.
- [ ] Production query plans/load/rate limits and capacity validated beyond the bounded local preview; real-policy authorization register and production guard changes explicitly reviewed.
- [ ] Remaining dependency findings and complete physical-device/screen-reader QA reviewed; staging and hosted CI acceptance recorded.
- [ ] Explicit production cutover approval, including flag configuration, eligible inventory, preserved publicId links and rollback/recovery owner.

Rollback: unset `KILIRIDE_DB_CATALOGUE` or set it to `false`, restart the local server and verify both legacy public IDs/prices. No schema rollback, record deletion or approval fabrication is necessary. Public DB image routes fail closed in OFF mode; historical reviews remain intact. Do not enable production or proceed to 2G as part of this checklist.

## Original commercial launch gates

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

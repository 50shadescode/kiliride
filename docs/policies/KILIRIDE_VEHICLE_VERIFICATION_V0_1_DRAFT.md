# KiliRide vehicle verification policy — 0.1-DRAFT

Reference: **KILIRIDE-FLEET-VERIFY-001**. Status: **DRAFT — NOT APPROVED**.
Effective date: **not assigned**. Approved by: **pending formal authorization by KiliRide's designated business owner or authorized policy approver**.

This records the product owner's provisional direction supplied during Phase 2E. It does not establish regulatory compliance, authorize real approvals, or record completed inspections. No approver, approval date, effective date or real evidence has been invented. Engineering implementation of this framework is separate from formal policy approval.

## Required checks

| Check | Evidence to review | Required determination |
|---|---|---|
| Vehicle identity | Vehicle registration identifier, registration documentation, chassis/VIN details where available, and genuine photographs enabling comparison. | Submitted evidence consistently identifies the listed vehicle; resolve contradictions. |
| Ownership or authorization to rent | Registered ownership information, or documented authorization from the registered owner permitting the HOST to offer the vehicle for hire. | Establish the relationship between the HOST and vehicle. Creating a listing is not ownership evidence. |
| Registration verification | Registration documentation and verification information from an appropriate authorized source, where available. | Registration information is consistent and applicable registration-status requirements are satisfied. Uploaded documents alone are not independent authenticity proof. Record unresolved authenticity questions. |
| Listing accuracy | Genuine photographs, make/model, seating capacity, specifications, operating location and declared rental pricing. | Listing reasonably corresponds to the vehicle; resolve material inconsistencies. |
| Rental eligibility and applicable documentation | Relevant insurance and other rental-operation, inspection, licensing or authorization documentation determined by an approved compliance matrix. | All applicable mandatory requirements pass. Actual arrangement determines obligations; do not assume every vehicle has identical requirements. |

The checklist is a review record, not an automated document-authenticity service or legal certificate. Evidence references must identify actual restricted records reviewed by the administrator, with source/date/context in the approved evidence repository. References are displayed as text; the application does not fetch external URLs or expose supporting documents publicly. A private document repository, access/retention rules and authenticity procedures must be approved before real operation. No document-upload feature is introduced here.

## Configurable compliance requirements

Each versioned matrix contains profiles recording operating jurisdiction (initially Kilifi County, Kenya), vehicle classification, intended use, SELF_DRIVE versus CHAUFFEUR_DRIVEN arrangements, ownership arrangements and operating arrangements. The administrator must explicitly confirm the selected profile matches the actual rental arrangement. A missing applicable profile blocks approval; administrators cannot edit policy configuration through review endpoints.

Each requirement records an identifier, label, applicability (`MANDATORY`, `NOT_APPLICABLE`, or `PENDING_POLICY_REVIEW`), supporting authority, evidence type, applicability basis and review status (`CONFIRMED` or `PENDING_POLICY_REVIEW`). NOT_APPLICABLE requires a confirmed, documented authority/basis; silence is never an exemption. All mandatory requirements require a passed check and evidence reference in each decision. An unresolved requirement or rental arrangement blocks approval.

`src/lib/config/vehicle-verification-draft.ts` captures the unapproved initial Kilifi profile. Insurance, inspections, permits, licensing and rental-operation authorizations are **PENDING_POLICY_REVIEW**. Their mention identifies questions for qualified review, not a claim that any particular Kenyan obligation applies. No legal source or obligation is fabricated. The definitive matrix must be checked against current Kenyan regulations and confirmed with appropriate regulatory, legal and insurance guidance before formal activation.

## Decision controls and activation prerequisites

1. Keep real approvals blocked until an authorized policy version and resolved applicable matrix are formally approved and activated. This draft is not inserted into the approved-policy database table.
2. Record approval authority and effective-date decisions through controlled operations after formal authorization. The current implementation has no public or administrator policy-activation endpoint; enabling a record is not evidence of business authorization by itself. A future activation step must verify the authorized approver and policy record before use. No such activation was performed in 2E.
3. Approve only current PENDING_REVIEW listings with a verified HOST relationship, complete saved details, available integrity-checked photographs, five explicit checks and all applicable mandatory evidence. An independent MFA administrator must decide.
4. Reject incomplete/inconsistent submissions with an actionable owner-visible reason; keep private evidence references separate. Suspend approved listings with a reason; reopen suspended listings as drafts for correction. Owners revise rejected listings and resubmit through the existing lifecycle.
5. Preserve immutable reviewer IDs, timestamps, revisions, previous/new status, reason, policy version, checklist, applicable requirements snapshot and evidence references. Stale/repeated decisions cannot create another outcome.
6. Legacy Vitz/Note records remain unassigned DRAFTs. Approval does not publish to the static catalogue or confirm a reservation.

## Deployment blockers and acceptance

Formal approver authorization, final policy version, effective date, current Kenyan regulatory determinations, insurance guidance, evidence custody/access/retention and operational authenticity procedures remain outstanding. No real listing is approved under this draft. Synthetic test-only policy records exercise protocol controls exclusively on isolated `kiliride_test` port 55433; they are not real policy, legal guidance or evidence.

Engineering acceptance is reported separately in `docs/KILIRIDE_PHASE2_REPORT.md`. Business-policy readiness remains **BLOCKED** until the above items are resolved. No public catalogue cutover, deployment or Phase 2F is authorized by this document.

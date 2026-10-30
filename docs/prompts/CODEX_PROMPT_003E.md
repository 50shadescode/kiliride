# CODEX TASK 003E — Administrator vehicle verification

Implement only Milestone 2E, under the user's explicit authorization. Read AGENTS.md, prompts 003/003D, Phase 2 report, architecture, data model, decisions and test report. Confirm feature/phase2-fleet-management and a clean initial working tree.

## Requirements and acceptance

- Protected ADMIN dashboard, filterable submission queue and detail review with minimal owner relationship data, specifications/prices, real stored photographs, submission time and immutable prior decisions. Reuse verified-email, ADMIN, MFA and post-role-grant session controls on every server read/mutation.
- Document vehicle identity, legitimate ownership/authorization, registration evidence, listing accuracy and applicable rental-document review. Do not invent legal requirements, evidence or completed inspections. Approval must fail closed without a recorded enabled policy, required evidence checks and eligible current submission. Pending business policy must remain explicit; no real policy is seeded by this task.
- Extend the existing transition engine: PENDING_REVIEW -> APPROVED/REJECTED, APPROVED -> SUSPENDED; authorized reopening for corrections follows existing REJECTED/SUSPENDED -> DRAFT rules. No direct approval of drafts. Host corrections/resubmission remain unchanged.
- Record reviewer ID, from/to status, revision, time, shareable reason, policy/checklist and private evidence references atomically. Lock rows, reject stale/duplicate decisions and forbid self-review. History is append-only. Never infer an administrator from a hard-coded identity.
- Private evidence references are restricted text identifiers, not public links or a new document-upload system. Hosts see permitted outcomes/reasons only. Admin image reads require MFA and image integrity; host image endpoints remain owner-scoped. No storage keys, secrets, unrelated owner profiles or private evidence in host/public DTOs.
- Keep Vitz/Note legacy imports as unassigned DRAFTs; no automatic ownership/approval, no public DB catalogue cutover.
- Test role/MFA/session controls, checklist/policy blocking, transitions, confidentiality, audit/immutability, concurrency/replay, suspension/corrections, photographs and legacy preservation. Synthetic test fixtures must be clearly isolated and must not be described as real evidence or approved business policy.
- Back up/rehearse additive migrations; run relevant unit/database/browser/API, migration, TypeScript, strict ESLint, production build, private build-trace and online dependency checks. Preserve all previous regressions. Update requested reports/model/architecture/decisions with exact outcomes and limitations.

No 2F, booking/payment/subscription/driver functionality, production changes, commit or push. STOP after 2E. Production verification policy, document authenticity/legal criteria and retention remain operator/product decisions, not facts established by code or tests.

## Subsequent product-owner policy direction

Record KILIRIDE-FLEET-VERIFY-001 / 0.1-DRAFT as DRAFT — NOT APPROVED in `docs/policies/KILIRIDE_VEHICLE_VERIFICATION_V0_1_DRAFT.md`. Do not assign an approver or effective date. Implement a configurable matrix for jurisdiction, classification/intended use, self-drive/chauffeur arrangement, ownership/operation and insurance/inspection/licensing/permit questions. Each requirement records applicability, authority, evidence type, basis and review status. PENDING_POLICY_REVIEW blocks approval; missing guidance is never an exemption. Require the selected profile to match the actual rental arrangement and every mandatory requirement to have a passed check and evidence reference. Policy and requirement snapshots must remain immutable.

Real approvals stay blocked pending formal policy authorization/activation and current Kenyan regulatory, legal and insurance determinations. Test-only policy fixtures are expressly authorized for isolated protocol tests and must never activate real approvals. Report engineering acceptance separately from business-policy readiness. No requirement in the provisional document constitutes an invented legal obligation.

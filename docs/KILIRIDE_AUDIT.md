# KiliRide Phase 0 audit

Date: 2026-10-29 (Africa/Nairobi). Scope: current working tree, not just HEAD. Decision: **NO-GO for automated commercial transactions; proceed to Phase 1 only after owner approval.** The existing assisted-enquiry website can be preserved, but its live operational accuracy is unverified.

## Evidence and baseline

Read root `AGENTS.md`, `docs/KILIRIDE_ROADMAP.md`, and `docs/prompts/CODEX_PROMPT_001.md`; no nested AGENTS.md found. Updated directives supersede the historical no-backend policy in `docs/agent.previous.md`; this audit itself remains documentation-only.

HEAD is `73d2e64`. The working tree already includes changes to about/services/vehicles pages, ReservationForm and pricing, deletion of both SGR routes and SgrAggregator, and untracked AGENTS.md, docs and the Vehicle type re-export. These are pre-existing work, not audit changes. No commits, resets or staging performed.

Installed versions inspected locally: Next.js 16.1.6, React 19.2.3, TypeScript 5.9.3, Zod 4.3.6. `package.json` has dev/build/start/lint scripts; no test or typecheck script. `tsconfig.json` enables strict checking and includes generated Next.js types. `eslint.config.mjs` enables Next core web vitals and TypeScript rules. Tailwind 4, Radix, lucide-react, clsx and tailwind-merge support the UI. Zod, react-hook-form, resolvers, Zustand and framer-motion are declared but no application usage was found for those capabilities. Declaration is not implementation.

No database schema/client, API route handlers, server actions, auth library, CI workflow, deployment manifest, test suite, upload integration or monitoring integration was found in the inspected repository. README is create-next-app boilerplate, mentions Geist although layout loads Inter, and is not deployment evidence. `.next` and node_modules exist locally. No root env files or source `process.env` references were found; no configured application environment variable names can be reported. `.gitignore` excludes `.env*` and PEM files. Hosting-side settings, Git history secrets, production data and external operational records were not inspected.

## Route inventory

| Route | Source | Actual behavior |
|---|---|---|
| `/` | `src/app/page.tsx`, `Home` | Static hero/search-like display; maps both fleet entries into cards. Browse Vehicles button has no action. |
| `/about` | `src/app/about/page.tsx` | Car-hire marketing copy. |
| `/services` | `src/app/services/page.tsx` | Link to `/services/vehicles`. |
| `/services/vehicles` | `src/app/services/vehicles/page.tsx`, `VehiclesPage` | Direct static fleet grid. |
| `/vehicles/[id]` | `src/app/vehicles/[id]/page.tsx`, `VehicleDetailPage` | Finds static ID, calls `notFound()` for unknown ID, shows rates and enquiry form. |
| `/pricing` | `src/app/pricing/page.tsx` | Displays three subscription prices; no purchase or entitlement workflow. |
| `/contact` | `src/app/contact/page.tsx` | Form-shaped UI, no send handler; button is type=button. |

No login, signup, admin, owner, driver, payment, account or booking-history routes exist. No SGR routes or source references remain. Old SGR code remains in Git history, not the active tree. No custom loading/error/not-found pages, sitemap, robots or route-specific metadata were found; framework fallback behavior is not a custom recovery experience.

## Feature matrix

Status concerns the stated feature only. IMPLEMENTED means narrow code behavior supported by inspection/checks, not browser or business certification. P0 denotes a commercial launch blocker; P1 a significant defect/gap; P2 an enhancement or deferred expansion.

| Area | Feature | Status | Code Evidence | Severity | Finding | Recommendation |
|---|---|---|---|---|---|---|
| Catalogue | Static listing and detail lookup | IMPLEMENTED | `src/lib/fleet.ts:KILIFI_FLEET`; `src/components/cars/CarCard.tsx`; `src/app/vehicles/[id]/page.tsx:VehicleDetailPage` | P1 | Two typed records; valid detail links and unknown-ID fallback. Real inventory accuracy unverified. | Preserve components and public IDs; validate records before import. |
| Discovery | Search and filtering | MISSING | `src/app/page.tsx:Home` | P1 | Search-looking widget consists of static spans. | Add interval and attribute filters after inventory/quote services. |
| Navigation | Primary CTAs | DEFECTIVE | `src/app/page.tsx`; `src/components/shared/Navbar.tsx`; `src/app/vehicles/[id]/page.tsx` | P1 | Browse Vehicles, Login, Sign Up and available Start Reservation have no handler/link. | Wire actual destinations and accessible controls in approved implementation. |
| Navigation | Footer and contact | DEFECTIVE | `src/components/shared/Footer.tsx`; `src/app/contact/page.tsx` | P1 | Footer links point to #; phone/email are spans; inquiry button does nothing. | Add genuine links/support flow and feedback; publish approved policies. |
| Fleet | Real photography | MISSING | `src/lib/fleet.ts:image`; `CarCard`; `VehicleDetailPage`; `public/` | P1 | Both /cars image paths absent; pages render SVG placeholders rather than requesting those paths. | Obtain authorized real photos; storage and image pipeline. |
| Trust | Verification evidence | UNVERIFIED | `src/lib/fleet.ts:isVerified`; `CarCard`; `VehicleDetailPage` | P0 | Booleans show Verified without reviewer, criteria or timestamp. No proof of real-world review in repository. | Record evidence and approvals before factual public claims. |
| Availability | Date-specific inventory | MISSING | `src/lib/fleet.ts:status,availableFrom` | P0 | Static labels, including relative time; homepage calls all records ready for pickup despite a reserved record. | Durable interval blocks and consistent derived availability. |
| Pricing | Date-only preview arithmetic | IMPLEMENTED | `src/lib/helpers/pricing.ts` | P1 | UTC boundary difference; days times baseFullDay plus reservationFee; 27 arithmetic checks pass. | Preserve as tested legacy behavior, then introduce approved server policies. |
| Pricing | Validation and half-day quotes | DEFECTIVE | `pricing.ts:calculateRentalDays,calculateEstimatedTotal`; `ReservationForm` | P0 | Empty/reversed/same-day intervals yield zero days but still KES 500 total for current data. Impossible dates normalize; NaN can propagate. Half-day rate displayed but unused in quote. | Validate exact dates/finite amounts, approve time/rounding/fee rules, reject invalid requests server-side. |
| Enquiry | Structured WhatsApp link | IMPLEMENTED | `ReservationForm:generateReservationWhatsappLink` | P1 | Encodes name, phone, interval, duration and estimatedTotal into link to vehicle.managerPhone. Sending/receipt not tested. | Retain as assisted sales, not a booking/payment authority. |
| Enquiry | Availability and input gating | DEFECTIVE | `ReservationForm`; `VehicleDetailPage` | P1 | Form is always rendered, even for reserved vehicle; no required/min/length checks; delivery choice ignores deliveryAvailable. Direct manager link omits dates/quote. | Validate and clearly distinguish availability inquiry from confirmed rental. |
| Booking | Durable quote/reservation/history | MISSING | `ReservationForm` client state; no API/DB files | P0 | No durable IDs, quote snapshots, status transitions, ownership or expiry. | Server-authoritative quote and transactional booking service. |
| Booking | Overlap prevention | MISSING | `fleet.ts`; no persistence layer | P0 | No interval reservation or concurrency controls. | Shared inventory allocation model with database constraint and concurrency tests. |
| Identity | Customer/host/admin login and roles | MISSING | `Navbar`; `package.json`; route inventory | P0 | UI labels only; no sessions or record authorization. No exposed privileged backend was found. | Established auth, server-side ownership checks and admin MFA. |
| Host | Onboarding, fleet CRUD, documents | MISSING | `fleet.ts`; route inventory | P0 | No owner association, review workflow or private document storage. | Protected host profile, admin review, scoped fleet operations. |
| Revenue | Subscription marketing | PARTIAL | `src/app/pricing/page.tsx` | P1 | KES 2,000/3,000/4,000 monthly copy; no billing, ledger or activation. | Confirm terms, centralize configuration, enforce paid entitlements. |
| Finance | M-Pesa, reconciliation, refunds, receipts, payouts | MISSING | `package.json`; no provider/API modules | P0 | No payment capability or financial audit records. | Sandbox adapter after beneficiary and confirmation policy approved. |
| Admin | Verification, calendar, finance, disputes | MISSING | route inventory | P0 | Patrick is a contact/handoff concept, not an authenticated admin system. | Scoped admin operations, history, recovery and audit logs. |
| Notifications | Delivery and status tracking | MISSING | WhatsApp URL helpers only | P1 | No confirmation notifications, provider delivery or retry records. | Durable outbox and approved notification channel. |
| Driver | Onboarding and assignment | MISSING | route inventory | P2 | Optional later vertical, not a present defect. | Keep gated; no dispatch implementation in Phase 1. |
| Privacy | Private data handling/policies | PARTIAL | `ReservationForm`; `Footer`; `.gitignore` | P0 | Contact details/notes enter third-party URL; policy link is placeholder. No KYC storage yet. | Notice, minimization, retention and qualified jurisdiction review before sensitive collection. |
| Accessibility | Form and landmark semantics | DEFECTIVE | `ReservationForm`; contact; layout; cards | P1 | Labels lack htmlFor/input IDs; buttons nested inside anchors; layout main wraps child main elements. | Semantic controls, associated labels and keyboard/screen-reader QA. |
| Responsive UI | Layout and navigation | PARTIAL | fleet grids; `Navbar:hidden md:flex`; `Home` | P1 | Responsive grid classes exist; mobile nav has no replacement; large text and fixed-width controls need device checks. | Preserve visual system; verify at 320/375/768px and desktop. |
| Branding | Typography and icons | PARTIAL | `layout.tsx`; `globals.css`; lucide usage | P2 | Inter variable is declared but font-sans points to Geist variables. SVG icons used; copyright symbol is text, not an emoji defect. | Align font tokens; keep professional UI. |
| SEO | Metadata and discoverability | PARTIAL | `layout.tsx:metadata`; route inventory | P2 | Global title/description only; no per-vehicle metadata/canonicals/sitemap. | True inventory metadata and localized discoverability later. |
| Quality | Types/lint | IMPLEMENTED | `tsconfig.json`; `eslint.config.mjs` | P1 | Current checks pass, but do not prove workflows. | CI plus domain/integration/E2E tests. |
| Operations | Hosting, backups, security monitoring | UNVERIFIED | README; `next.config.ts`; no CI/deploy files | P0 | No repository evidence of production TLS, headers, restore tests, monitoring or release controls. | Inventory actual hosting; establish staging and runbooks. |

## Data flow and architectural limits

`KILIFI_FLEET` is the sole local inventory source. `Vehicle` is defined in `src/lib/fleet.ts`; `src/lib/types/vehicle.ts` re-exports it. Home and services vehicles map records into CarCard. Detail resolves the same slug and passes the whole Vehicle object to a client ReservationForm. State lives in React only. Pricing is recalculated locally and placed in a URL; no reservation is saved, no payment made, no browser storage writes or background synchronization found. Past SGR localStorage keys may still exist in users' browsers, but current code does not read them; this audit did not inspect user browsers.

Price example supported by code: 2026-10-29 to 2026-11-01 is three days; KES 3,500/day gives 10,500 plus 500 reservation fee = 11,000. This is arithmetic, not an approved tax/deposit/insurance policy. Global status, prose availability, half-day display and full-day-only quote are competing representations that must converge on explicit policies.

## Security assessment and limits

No exploitable authenticated endpoint can be claimed where none exists. Lack of auth is a blocker to adding privileged workflows, not evidence of a present account takeover. User text is interpolated into React/URL-encoded messages; no raw HTML sink was found. Nevertheless customers can edit messages and totals, so a manager must independently verify them. Encoding does not establish authenticity. Unbounded notes can create impractically long URLs and transmit unnecessary sensitive information. Public manager phone and plates are intentional-looking catalogue fields, not credentials; confirm disclosure policy.

There is no custom security-header configuration in next.config.ts; deployed header/TLS posture is unknown. No secret values were printed. This is not a full secret-history or dependency advisory audit; no claim of vulnerability-free dependencies. Before rollout review pinned versions, session/CSRF protections, rate limits, upload content controls, tenant isolation, webhook authenticity/reconciliation and logging redaction. Compliance and insurance adequacy require qualified review; neither is certified here.

## Preserve

Keep `/`, `/services`, `/services/vehicles`, `/vehicles/[id]`, existing slugs, the emerald/slate visual system, CarCard/UI primitives, typed Vehicle compatibility, tested preview arithmetic, notFound handling and encoded WhatsApp assistance. Improve them incrementally behind explicit boundaries. Do not resurrect SGR or seed unverified records as approved production inventory.

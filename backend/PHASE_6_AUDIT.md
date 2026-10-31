What this backend does: The Royal Knot stores invited user access, wedding intake, consultations, signed-document evidence, procurement, planning tasks, day-of coordination and financial postings around one wedding UUID. The review assumes one agency with approximately 25 weddings per season, several staff members and concurrent coordinator/finance requests.

The audit traced authorization, financial calculations, document access, scheduling, idempotency and migration privileges. It includes the current frontend's API/authentication boundary, without changing frontend-owned code.

## Must fix before a live integrated release

1. **Browser login is still a demo login** (`frontend/src/context/AuthContext.tsx`, `login`).
   - **What this is:** The frontend chooses a local presentation profile and token.
   - **Problem:** The password is ignored and an unknown email resolves to founder. This is not authentication for real records. The Express API correctly rejects the fabricated token.
   - **Fix:** Antigravity must use Supabase Auth, call `/me`, and remove role/portal switching as a source of live permissions. Keep any presentation login clearly labelled as demo-only.
   - **If we skip it:** The application cannot provide a secure authenticated live user experience.

2. **UI actions do not use the implemented business APIs** (`frontend/src/services/api.ts`).
   - **What this is:** A mock service persists domain records in localStorage; only health uses `fetch`.
   - **Problem:** Creating an enquiry, confirming a payment or publishing a schedule in the UI does not persist a backend transaction. Local acknowledgement and profitability results do not establish backend outcomes.
   - **Fix:** Replace each live-mode mock operation with the exact OpenAPI contract, following `PHASE_6_INTEGRATION_AUDIT.md`. Test the complete flow through the browser.
   - **If we skip it:** Reloads on another device show different records, and the UI can display success without server authorization, verification or audit history.

## Backend defects fixed during this phase

| Concrete failure | Fix | Regression evidence |
| --- | --- | --- |
| A schedule proposal could move a DONE/CANCELLED source or dependent event. | Reject the proposal before storing impacts. Execution version changes also invalidate older approved proposals. | Completed/dependent schedule test in `tests/qa.test.ts`. |
| Valid individual quantity/rate inputs could produce an expense or labour total too large for PostgreSQL's monetary column. | Check the computed rounded amount before insert and return 400. | Half-paise rounding, net/tax overflow and labour overflow tests; no partial rows persist. |
| Wedding lifecycle could not advance from planning to execution/completion through an API. | Add planner/founder-only transitions without enabling direct booking/proposal confirmation bypass. | API transition test, including invalid jumps and reopening denial. |
| Completing a wedding prevented verification of an outstanding booking receipt or registration of final financial evidence. | Financial writes use scope-checked wedding locks independently of operational closure; no task regeneration on closed weddings. | Legacy and Phase 5 payment verification after completion; financial/operational document distinction. |
| A provisional/cancelled wedding with money history could be archived and disappear from filtered reports. | Block archival when financial history exists. | Finance-settings archival regression. |
| Configuring financial assumptions before confirming a proposal allowed a deposit larger than the contract. | Validate the deposit against existing approved revenue in both ordering paths. | Explicit contract/deposit test. |
| Several report reads could observe different committed states within one request. | Use REPEATABLE READ for business GET transactions. Keep write locks/idempotency at READ COMMITTED. | Integration suite remains passing; isolation choice is explicit in the shared registrar. |
| Internal immutable policy/rate tables retained unused UPDATE permission; financial calculation/review checks were incomplete in SQL. | Migration 0009 revokes those grants and adds calculation, currency and review-evidence CHECK constraints. | All-table policy/privilege inventory and direct invalid-write rejection tests. |
| Windows could briefly retain handles after stopping disposable PostgreSQL. | Retry deletion only after verifying the generated absolute test directory is directly within the OS temporary directory. | Complete isolated runner exits successfully on Windows. |

## Security and database conclusions

- Supabase Auth owns passwords. Backend code stores no password/password hash and verifies access tokens with Supabase, then checks the active application profile on every request.
- Backend role and wedding scope checks protect each route/resource. Client projections exclude internal notes, financial costs, private incidents, negotiations and staff-only records. Client financial endpoints expose only their own wedding contract/charges/receipts/balance.
- All business tables live in `app`, have backend-only RLS policies, and deny browser `anon`/`authenticated` table privileges. Runtime role cannot create schema objects, bypass RLS, alter audit/idempotency records, or update approved financial assumptions/rates.
- Same-wedding composite foreign keys, uniqueness and CHECK/exclusion constraints protect child links, one selection, notification recipients, task generation, payment references and concurrent consultation bookings. Application transactions and wedding locks protect aggregate financial limits and concurrent workflow decisions.
- Private documents use generated paths, restricted size/type/signature checks, verified hashes, non-overwriting uploads and short-lived authorized downloads. Client access is gated and explicitly projected. No electronic-signature or antivirus-provider claim is made.
- Login/refresh limits are stored in PostgreSQL. CORS uses exact allowlisted origins. Errors contain a request ID and safe code/message, without database URLs, passwords, raw query text or stack traces.
- Parameterized Prisma/SQL calls handle untrusted values. No production seed/reset/drop was run. Migration testing uses a fresh loopback PostgreSQL cluster with generated test credentials.

Verdict: Backend local QA is verified by the accompanying report. Fix the two frontend integration blockers and complete hosted Supabase/Vercel verification before presenting the product as live-integrated.

Not checked: Real SMTP/invitation/recovery delivery, hosted Supabase pooler/Storage policies, production data compatibility, live Vercel routing/latency, gateway/messaging providers, browser end-to-end integration, and load beyond the single-agency scenario. The founder dashboard calculates totals across the filtered wedding cohort and currently makes per-wedding queries; large multi-agency scale has not been benchmarked.

# Phase 6 frontend integration audit

Inspected 31 October 2026 against frontend commit `a993002` and the Phase 5 backend. This is a source-level contract review plus frontend build/lint verification. The API end-to-end test does not drive the browser. No live frontend/backend integration has been verified.

## Current integration blockers

| Area | Current frontend | Required backend integration |
| --- | --- | --- |
| Authentication | `src/context/AuthContext.tsx` ignores the password and resolves unknown email to the founder demo profile. Portal/role switching changes local state. | Use Supabase invitation/password setup and sign-in, then `GET /api/v1/me`. Server profile determines role. Keep demo mode visibly separate from live mode. Backend rejects fabricated demo bearer tokens. |
| Business persistence | `src/services/api.ts` imports `mockData` and reads/writes `TRK_*` localStorage. Only the health check calls `fetch`. | Implement real authenticated HTTP operations and handle failures. A successful health response does not prove that UI operations persist on the backend. |
| API origin | Fallback is `http://localhost:3000/api/v1`. | Backend default is port **3001**. Configure `VITE_API_URL` with the full `/api/v1` base. Configure exact frontend origin in backend CORS. |
| Identifiers | Local identifiers include strings such as `delay-*`, vendor/demo wedding codes. | All business IDs are server UUIDs. Use the wedding ID returned by intake; enquiry ID is separate. A vendor notification token is a scoped capability, not a vendor UUID or global login. |
| Packages | `full_service`, `day_of`. | `FULL_SERVICE`, `PARTIAL_DAY_OF`. Map view labels explicitly. |
| Wedding lifecycle | `status` with `PROPOSAL_SENT`, `AGREEMENT_SIGNED`, `CONFIRMED`, `IN_PLANNING`, `RECONCILED`, `CLOSED`. | `state`: `ENQUIRY`, `PROPOSAL`, `AGREEMENT`, `BOOKING_CONFIRMED`, `PLANNING`, `EXECUTION`, `COMPLETED`, `CANCELLED`. Enquiry stages are separate. Confirmation uses dedicated proposal/deposit workflows. Do not infer booking from enquiry creation. |
| Wedding shape | `coupleNames`, `theme`, required date, embedded financial metrics and boolean `depositPaid`/`agreementSigned`. | `title`, `coupleDetails`, `preferredTheme`, nullable `weddingDate`. Read agreement, payment and profitability endpoints separately. Never infer verification from a frontend boolean. |
| Lists | Bare arrays and browser-side filtering. | Paginated `{ data, page, pageSize, total }`, default size 25, maximum 100. Use query parameters supported by OpenAPI. |
| Money | JavaScript numbers and browser calculations. | Decimal amount **strings** and separate currency. Format for display; do not post computed totals, profit or remaining balances. Server computes authoritative values. |
| Client milestones | `BOOKING_DEPOSIT`, `ADVANCE_PAYMENT`, `FINAL_SETTLEMENT`, demo percentages and nested transactions. | `BOOKING`, `ADVANCE`, `FINAL`. Finance explicitly sets amounts and due dates. Payment initiation, claim and finance verification are distinct operations. Only VERIFIED receipts count. |
| Tasks | View model uses `stage` and local changes. | API uses `status`: `TO_PLAN`, `IN_PROGRESS`, `DONE`, `BLOCKED`; assignment is `ownerId`. Task generation requires confirmed proposal, verified booking deposit and a known wedding date. |
| Quotations | Flat caterer models; losing bid marked `REJECTED`. | Round → quotation requests → quotations/items. Three submitted catering quotes required. Non-selected requests become `CLOSED`; exactly one becomes `SELECTED`. |
| Timeline | HH:mm strings and run-sheet `actualStartTime`. | Full ISO timestamps with offsets, stored UTC. Display in returned `Asia/Kolkata` timezone. Planned and actual times are separate fields. |
| Schedule change | Local proposal supplies affected vendors and marks them SENT before approval/publication; publication writes the revised time to an actual-time field. | Server identifies affected vendors from event links/dependencies. Submit proposal with `expectedScheduleVersion`, approve, publish. Publication changes planned times and creates individual notification records. Actual execution times remain factual. |
| Acknowledgement | Local manager actions may update arbitrary vendors. | Staff respond only to their own notification; vendor uses its scoped expiring link. `AVAILABLE_IN_APP` means an in-app record exists. `SENT` never means ACKNOWLEDGED or real WhatsApp delivery. |
| Vendor arrivals | Local check-in sets `isLate: false`. | Render server `isLate` and `lateMinutes`; actual late arrival stays late after check-in. |
| Agreements/documents | Demo attachment URLs and UI booleans. | Register metadata, obtain signed upload URL, upload bytes, complete server verification, submit signed evidence, authorized manual review. Client vendor list/floor plans remain gated until SIGNED. No electronic signing is claimed. |
| Vendor bills | Local settlement computes totals and marks paid. | Submit final bill, verify against contract + approved extras, claim and verify disbursement. Read reconciliation; do not replace backend protections with a local duplicate-payment flag. |
| Errors and retries | Local promises usually resolve without server errors. | Handle `{ error: { code, message, fields?, requestId } }`. Preserve `Idempotency-Key` only for retries of the same mutation. Reload versions after 409. Do not turn server failure into local success. |
| Client privacy | Broad frontend Wedding interface requires internal financial values. | Use explicit client response types. Client views receive neither internal notes, vendor negotiation values, private incidents, labour rates nor profitability. Do not fill absent fields with live internal data. |

## Authoritative contracts and handoff order

1. Wire Supabase Auth and callbacks using `src/frontend/auth.ts` and `INTEGRATION.md`. No public signup. Use `/me` after authentication; refresh the SDK session before calls.
2. Add an HTTP adapter to `frontend/src/services/api.ts` with bearer token, JSON parsing, request IDs, pagination and retry-key handling. Keep existing demo storage only in an explicitly selected demo path.
3. Integrate intake, consultations, agreement documents and procurement against `PHASE_1B_API.md` and `PHASE_2_API.md`.
4. Integrate proposal/deposit/task workflows (`PHASE_3_API.md`), then the command centre (`PHASE_4_API.md`).
5. Integrate financial approval/posting/report endpoints (`PHASE_5_API.md`). Add explicit manual verification controls restricted by server role.
6. Run browser acceptance using two staff assignments and two separate client identities against a configured Supabase test project. Verify network responses, privacy and denied cross-wedding operations. This remains pending.

Shared TypeScript types are in `src/contracts.ts`, `src/workflow-contracts.ts`, `src/operations-contracts.ts` and `src/finance-contracts.ts`. `openapi.json` is generated from the registered routes and validation schemas and is served at `/api/v1/openapi.json`. Import browser-safe types only; never import backend configuration, Prisma or administrative adapters into frontend bundles.

## Phase 6 contract additions

- `PATCH /api/v1/weddings/:id` now permits `PLANNING → EXECUTION → COMPLETED`, and cancellation from execution. Founder/assigned planner only, bearer authentication and idempotency required. Invalid transitions return 409 `INVALID_TRANSITION`; clients/coordinators/finance cannot make these transitions. Operational edits remain closed on completed/cancelled weddings. Financial settlement and financial evidence uploads remain authorized separately.
- `POST /api/v1/weddings/:id/booking-payments` accepts optional `isDemo` (default false). Mark fictional samples explicitly. Full payment records include the flag in the Phase 5 API; the legacy deposit response shape remains compatible.
- Schedule proposals touching completed/cancelled source or dependent events return 409 `EVENT_EXECUTION_CLOSED`.
- Calculated expense/labour amounts outside `DECIMAL(16,2)` return 400 `INVALID_FINANCIAL_AMOUNT` before a row is created. Inputs remain amount strings; extra fields are rejected.
- A proposed booking deposit above an already approved client contract returns 409 `DEPOSIT_EXCEEDS_CONTRACT`.
- Archiving a wedding with payments, finance settings, expenses, bills or labour returns 409 `FINANCIAL_HISTORY_EXISTS`, keeping financial records visible for reporting.
- Protected application responses use `Cache-Control: no-store`. Multi-query GET reports run in a consistent `REPEATABLE READ` snapshot. Writes use `READ COMMITTED` with wedding locks and unique constraints; they are not described as PostgreSQL SERIALIZABLE transactions.

Example lifecycle request:

```http
PATCH /api/v1/weddings/<uuid>
Authorization: Bearer <supabase-access-token>
Idempotency-Key: execution-<unique-operation-id>
Content-Type: application/json

{"state":"EXECUTION"}
```

Success is 200 with the authorized wedding response. Do not use a direct state patch for agreement signing, proposal confirmation or booking/task qualification.

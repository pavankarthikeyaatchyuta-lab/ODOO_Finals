# Phase 3 — planning and task automation contract

Use `/api/v1`, existing bearer authentication, UUIDs, ISO timestamps, Zod/shared TypeScript contracts and generated `openapi.json`. Business mutations require an idempotency key; POST success is 201. Clients cannot read internal task plans or verify payments. All access is checked against the wedding relationship and current role, not just authentication.

## Exact qualification events

1. Assigned planner/founder calls `POST /weddings/:id/confirm-proposal` with `{ "bookingDepositRequired": "100000.00" }`. This records proposal status CONFIRMED, actor, timestamp, currency and the positive deposit amount. Confirmation does not mean an agreement was electronically signed or cash was received.
2. A linked client or assigned planner/finance/founder calls `POST /weddings/:id/booking-payments` with `{ "amount": "100000.00", "reference": "BANK-REFERENCE", "evidenceDocumentId": "<optional verified payment-evidence UUID>" }`. The resulting payment is CLAIMED. It cannot qualify task generation by itself.
3. Assigned finance/founder calls `POST /booking-payments/:id/verify` with `{ "verifiedEvidence": true, "note": "Bank reference and received amount independently reviewed." }`. The payment becomes VERIFIED only through this authorized manual bank-review event. The actor, method, time, reference and review note are audited. This is a demo/manual verification workflow, not a payment processor integration.

Task generation requires CONFIRMED proposal and the sum of VERIFIED payments in the wedding currency meeting the required deposit. Unverified/rejected claims do not count. Both confirmation and payment verification automatically check eligibility, so either event may happen first. A missing wedding date defers generation without pretending verification failed; adding the date through the wedding update API triggers another eligibility check. No tasks are generated before qualification.

Proposal response: `{ weddingId, status: "CONFIRMED", currency, bookingDepositRequired, confirmedAt, taskGeneration }`. Verification response: `{ payment, taskGeneration }`. A null generation means the wedding is not yet ready. `GET /weddings/:id/booking-payments` returns paginated client-safe payment records: `id`, `weddingId`, decimal-string `amount`, `currency`, normalized `reference`, `status`, `evidenceDocumentId`, `createdAt`, `reviewedAt`. Internal reviewer/notes do not appear in these responses.

`POST /booking-payments/:id/reject` is finance/founder-only with `{ "note": "Reference or received amount could not be verified." }`. Only CLAIMED records can be decided. References are normalized to uppercase and unique across records. A second review returns 409; a same-key retry returns the original decision. Payment evidence is wedding-bound, and clients may only attach their own uploaded evidence.

## Planning APIs

| Endpoint | Method | Permission / response |
| --- | --- | --- |
| `/weddings/:id/tasks/generate` | POST | Assigned planner/founder; idempotent generation summary or 409 missing qualification |
| `/weddings/:id/task-generation` | GET | Assigned staff; immutable generation summary or null |
| `/weddings/:id/tasks` | GET | Assigned staff; paginated tasks with `status`, `ownerId`, `functionId`, `priority` filters |
| `/tasks/:id` | GET | Assigned staff; one task |
| `/tasks/:id` | PATCH | Assigned planner/founder manages task; coordinator may update only the status of an owned task |
| `/weddings/:id/functions` | GET | Scoped staff/linked client; paginated function plans |
| `/weddings/:id/functions` | POST | Assigned planner/founder creates function metadata |
| `/functions/:id` | PATCH | Assigned planner/founder replaces function metadata/times |

Generation summary: `{ id, weddingId, templateVersion, packageType, dateBasis, taskCount, createdAt }`. The stable wedding UUID is reused; no replacement wedding/project identity is created.

Full-Service generates **35** tasks from `full-service.v1`. Partial/Day-of generates **30** tasks from `partial-day-of.v1`, using client-plan intake, vendor scope handover and execution work rather than venue procurement/design tasks. Both cover vendor/guest coordination, Mehendi, Sangeet, Reception, reviewing rehearsal cues and wedding-day execution. Full-Service additionally covers venue selection, design approvals and rehearsal planning.

Each task includes `id`, `weddingId`, `generationId`, `templateKey`, `title`, `description`, `category`, nullable `ownerId`, `deadline`, `status`, `priority`, nullable `functionId`, nullable `completedAt`, `createdAt`, `updatedAt`. Default owner is an active assigned planner, or null if none exists. Initial status is TO_PLAN and priority NORMAL. Templates use deadlines at 17:00 Asia/Kolkata on configured days relative to the wedding date. The generation records the date basis; later wedding date changes do not silently overwrite manually managed task deadlines.

Existing function records are reused by type; missing Mehendi/Sangeet/Reception records are created. Functions always belong to the same wedding. Name/type conflicts return 409 rather than linking a task to an unrelated function.

Example task update:

```json
{
  "ownerId": "<active assigned coordinator UUID>",
  "deadline": "2027-12-18T11:30:00.000Z",
  "priority": "HIGH",
  "status": "IN_PROGRESS"
}
```

Task status is TO_PLAN, IN_PROGRESS, DONE or BLOCKED. DONE records completion time; reopening clears it while audit history retains the prior value. Owner/reassignment targets must be active planning staff assigned to this wedding; arbitrary UUIDs and cross-wedding function IDs are rejected. Coordinator updates cannot change owner, deadlines, titles or priority. Finance has operational read access but cannot modify tasks. Clients cannot access internal task APIs.

Function input: `{ "type": "MEHENDI", "name": "Mehendi", "startAt": "<ISO timestamp or null>", "endAt": "<ISO timestamp or null>", "venue": "<optional venue>" }`. Both times must be provided with end after start, or neither. Types are MEHENDI, SANGEET, RECEPTION. Function responses add `id`, `weddingId`, `createdAt`, `updatedAt`.

## Reliability, validation and migration

Wedding row locks serialize qualification, payment review and generation. Unique generation-per-wedding and task-template-per-wedding constraints prevent duplicate tasks, including concurrent verification and generation requests. Generation/version snapshots are immutable. Payment amounts and comparisons use PostgreSQL/Prisma decimals rather than floating-point arithmetic.

Missing qualification returns 409 `PROPOSAL_UNCONFIRMED`, `DEPOSIT_UNVERIFIED` or `WEDDING_DATE_REQUIRED`. Duplicate decisions/reference values and package changes after generation return 409. Currency is locked after confirmation, quotation rounds or payment claims. Invalid ownership/field values return 400/403/404 as appropriate. Standard error shape is `{ error: { code, message, fields?, requestId } }`.

Apply additive migration `202610310006_planning_automation` after Phase 2. It adds explicit confirmation/verification metadata, task generations, tasks and database constraints/RLS; it does not reset or drop data. No production migration or demo seed is run by this task.

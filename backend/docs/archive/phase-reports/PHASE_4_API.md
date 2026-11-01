# Phase 4 — wedding-day command centre contract

Use `/api/v1`, the shared `src/operations-contracts.ts`, and current `openapi.json`. Normal business routes require Supabase bearer authentication and wedding membership. Mutations require `Idempotency-Key`, except uncached vendor-link issuance and vendor capability responses. POST business success is 201; reads/PATCH are 200. Private operational endpoints are staff-only; clients cannot read incidents, notifications or internal change history.

All stored/returned timestamps are UTC ISO strings. Inputs accept explicit offsets. Wedding timezone is **Asia/Kolkata**, including display of Indian wedding operations; each timeline response provides that timezone and the global `scheduleVersion`. For example 19:15 +05:30 is 13:45Z, and 19:40 +05:30 is 14:10Z. Do not interpret bare clock strings on the backend.

## Associations and timeline

Existing selected quotations create wedding/vendor associations. For client-contracted vendors, `POST /weddings/:id/vendors/client-provided` accepts `{ "vendorId": "<directory UUID>", "clientProvidedContract": true, "note": "Client supplied this contracted execution vendor." }` from an assigned planner/founder. This creates a CLIENT_PROVIDED association without fabricating a quotation or verifying any financial amount. One vendor/category association is permitted. Vendor archival/category edits are blocked once associated.

`POST /weddings/:id/timeline` (planner/founder):

```json
{
  "title": "Varmala",
  "functionId": "<optional function UUID>",
  "plannedStart": "2027-12-20T19:15:00+05:30",
  "plannedEnd": "2027-12-20T19:30:00+05:30",
  "ownerId": "<active assigned coordinator UUID>",
  "vendorIds": ["<associated DJ UUID>", "<associated photographer UUID>"],
  "dependsOnIds": []
}
```

End must follow start. Owner/function/vendors must belong to the wedding. Dependencies are explicit finish-to-start relationships, must be in the same wedding, cannot refer to self or create cycles, and must finish before this event starts. An initial dependent Dinner event can reference Varmala and its associated caterer.

`GET /weddings/:id/timeline?page=1&pageSize=25` returns `{ data: TimelineEventResponse[], page, pageSize, total, timezone, scheduleVersion }`. Event fields: `id`, `weddingId`, nullable `functionId`, `title`, `plannedStart`, `plannedEnd`, nullable actual times/owner, status, per-event version, vendor IDs, predecessor IDs and timestamps. Status values: PLANNED, IN_PROGRESS, DONE, CANCELLED.

`PATCH /timeline-events/:id` accepts `expectedVersion` and changed metadata (`title`, `ownerId`, `functionId`, `vendorIds`, `dependsOnIds`). It does not accept planned times; those require the approved change workflow. Metadata changes increment the event and global schedule versions. `POST /timeline-events/:id/execution` accepts `{ expectedVersion, status, actualStart?, actualEnd? }`. Coordinators may record only their own event execution; planners/founders manage all assigned events. Actual times cannot be future values or end before start. IN_PROGRESS needs a start and no end; DONE needs both. Completed/cancelled execution records cannot be rewritten. Old-version edits return 409.

## Vendor arrivals

`POST /weddings/:id/vendor-arrivals` (planner/founder) accepts `{ vendorId, functionId?, expectedAt, coordinatorId? }`. The vendor must already be associated with this wedding, and the coordinator/function must belong to it. `GET /weddings/:id/vendor-arrivals` provides paginated arrival records.

`POST /vendor-arrivals/:id/check-in` accepts optional `{ actualAt }`, defaulting to server time. Assigned coordinators may confirm their own arrival records; planners/founders may confirm any assigned wedding arrival. Confirmation records both actual arrival time and confirming actor/time. Future actual times and repeat confirmations with a new key are rejected. Same-key retry returns the original confirmation.

`isLate` is `(actualAt or serverNow) > expectedAt`. `lateMinutes` is the nonnegative floored minute difference. A pending vendor becomes late without a background job; a confirmed vendor retains its actual lateness. No automatic phone/WhatsApp notification is claimed.

## Private incidents

`POST /weddings/:id/incidents` (planner/founder/coordinator) accepts `{ category, severity, description, ownerId?, deadline? }`. Categories: VENDOR_DELAY, EQUIPMENT, LOGISTICS, OTHER. Severities: LOW, MEDIUM, HIGH, CRITICAL. Example descriptions cover late DJ, florist generator requirement and bride's car delay.

`GET /weddings/:id/incidents` filters by `status`, `severity`, `ownerId` and pagination. `PATCH /incidents/:id` requires `expectedVersion` plus changed incident fields, `status` or `resolution`. Statuses are OPEN, IN_PROGRESS, RESOLVED. A nonempty resolution is required for RESOLVED, and the server records `resolvedAt`; reopening clears the active completion time/resolution while audit history preserves the earlier values. A coordinator may update only an owned incident and cannot reassign it. `GET /incidents/:id/history` returns actor/time/action and private change details to authorized staff only. Clients never receive these records.

## Proposed, approved and published schedule changes

1. `POST /timeline-events/:id/schedule-changes` may be called by assigned planners/founders/coordinators:

```json
{
  "expectedScheduleVersion": 4,
  "proposedStart": "2027-12-20T19:40:00+05:30",
  "proposedEnd": "2027-12-20T19:55:00+05:30",
  "shiftDependents": true,
  "reason": "Bride procession is delayed by 25 minutes."
}
```

The server computes impacts from the target and transitive explicit dependents. With `shiftDependents: true`, downstream timings move by the source end-time delta; otherwise their times remain unchanged and dependency conflicts are rejected. Impacts snapshot previous/proposed times, event version, explicitly linked vendors and event owner. Unrelated events/vendors are not included. A proposal never changes the live schedule.

2. `POST /schedule-changes/:id/approve` or `/reject` (planner/founder) accepts `{ "note": "Reviewed the impacts with the planning lead." }`. The default policy prevents requesters approving their own changes. A different assigned planner or founder can approve. Founder-only `PATCH /weddings/:id/schedule-policy` with `{ "independentApproval": false }` explicitly enables the single-planner demo policy; the change is audited. Stale proposals cannot be approved.

3. `POST /schedule-changes/:id/publish` (planner/founder) requires APPROVED status, the original schedule/event versions, and approval valid under the current policy. One transaction applies all affected times, increments versions, records publication and creates one notification per affected vendor/staff recipient. A concurrent stale publication fails 409 and rolls back all its changes. A same-key retry returns the original publication; a new duplicate publication is rejected.

`GET /weddings/:id/schedule-changes` returns paginated full history: requested actor/reason, previous/proposed values, impact snapshots, base version, status (PROPOSED/APPROVED/REJECTED/PUBLISHED), approver/time, decision actor/time/note, publication time/version. Rejected and stale proposals remain visible as history.

Recipients are explicit vendors on impacted activities, event owners and relevant arrival coordinators for those vendors/functions. The system never marks every directory vendor affected merely because a wedding schedule changed.

## In-app notifications and individual responses

`GET /weddings/:id/notifications` returns paginated records containing recipient `vendorId` or `userId`, instruction version/impacts, `deliveryStatus`, status, sent time, response time and problem description. Initial status is **SENT** with **AVAILABLE_IN_APP** delivery. Neither publication nor reading marks a notification acknowledged. This is an in-app inbox, not external-message delivery confirmation.

Staff recipients respond to their own record using `POST /notifications/:id/respond`:

```json
{ "status": "ACKNOWLEDGED" }
```

or `{ "status": "PROBLEM", "problemDescription": "The revised timing conflicts with the vendor equipment handover." }`. Managers cannot acknowledge a staff instruction on someone else's behalf. Duplicate identical responses return the existing record without another audit event; conflicting second responses return 409.

For a vendor, an assigned planner/founder calls `POST /notifications/:id/vendor-link` (no idempotency key; uncached). It returns `{ token, notificationId }`. Construct the in-app inbox URL `/api/v1/vendor-inbox/<token>` and share it through an authorized manual channel. Tokens are 256-bit random capabilities, stored only as hashes, valid for 24 hours, scoped to one vendor notification and rotated on reissue. Treat the link as a credential. The API does not claim to have sent it to WhatsApp/email.

`GET /vendor-inbox/:token` reads just that instruction. `POST /vendor-inbox/:token/respond` accepts the same ACKNOWLEDGED/PROBLEM body. These routes use the capability instead of a global vendor account. Invalid/rotated/expired tokens return 404. No client, financial, private incident or global vendor-directory access is granted. Responses are audited with explicit VENDOR_CAPABILITY actor type and vendor ID. Token hashes are never returned. A new instruction version has a new recipient record and requires its own response.

## Reliability and rollout

All writes use wedding locks, relevant record locks, version comparisons, uniqueness and append-only audit records. The database enforces same-wedding references, positive event intervals, one recipient per notification and valid decision/confirmation/resolution evidence. Apply additive migration `202610310007_command_centre` after Phase 3. No production database migration/reset/seed is run by this task.

Frontend integration should poll current timeline/notification versions and refresh after a 409. Do not silently overwrite a conflict, manufacture ACKNOWLEDGED status, or display AVAILABLE_IN_APP as verified external delivery. Existing response/error/pagination conventions remain; code/message/requestId are returned without internal stack traces or credentials.

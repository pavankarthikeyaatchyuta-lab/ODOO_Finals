# Phase 1 frontend contract

**Phase 2 update:** [PHASE_2_API.md](PHASE_2_API.md) and current OpenAPI/shared types add client requirements, enquiry follow-up/assignment, verified agreement documents, gated sharing, vendors and transactional quotation comparison/selection. Historical Phase 1 examples below describe the original foundation; use the current generated schemas for additive response fields.

This replaces all Odoo models, ORM methods and XML/OWL integration described in the historical frontend plan. Use React + Vite + TypeScript. API and financial authority belong to Express. Phase 1 has no agreements, vendor screens, financial workflows or command-centre endpoints.

## Existing frontend scaffold handoff

Antigravity added a React/Vite scaffold in commit `dcf20ae` during backend implementation. Its `frontend/src/services/api.ts` currently uses localStorage and mock data; it is not connected to Express. Its `frontend/src/types/index.ts` describes demo objects rather than these API responses. Those files are preserved for the frontend owner to integrate.

Replace Phase 1 mock reads/writes with authenticated API requests and paginated `data` extraction. Use `WeddingResponse.title` instead of demo `coupleNames`, `state` instead of `status`, `preferredTheme` instead of `theme`, `FULL_SERVICE` / `PARTIAL_DAY_OF` instead of lowercase package values, and separate Client/Enquiry/Wedding records. Do not fill absent agreement/payment/profit fields with fabricated successful values. Later-phase controls remain explicitly demo-only until their actual APIs exist. The existing demo numeric budget is not the backend decimal-string contract. Use the shared types rather than silently coercing incompatible models.

## Transport

Base URL: `<backend origin>/api/v1`. Send `Authorization: Bearer <Supabase access token>` on protected endpoints. Every business POST, PATCH and DELETE requires an `Idempotency-Key` containing 8–128 ASCII letters, digits, `.`, `_`, `:`, or `-`. Auth endpoints do not use idempotency keys or persist token responses. Generate one UUID per intended business action; retain it while retrying that action. Reusing it with a different payload/path returns 409. Retry responses have the original status/body; wedding access is checked again before replay.

Lists return `{ data, page, pageSize, total }`; defaults are page 1 and pageSize 25, maximum 100. IDs are UUIDs; timestamps are ISO strings, stored in UTC. Wedding dates are `YYYY-MM-DD` or null. Display timezone defaults to `Asia/Kolkata`. Money is a decimal string, never a JavaScript floating-point calculation.

Errors: `{ error: { code, message, fields?: [{ path, message }], requestId } }`. The same request ID appears in `X-Request-Id`. Handle 400 validation, 401 missing/invalid identity, 403 denied/disabled account, 404 unavailable record, 409 duplicate/conflict, 413 oversized body, and 503 temporary dependency failure. Show failures and loading/empty states; do not report optimistic completion before a successful API response.

Import request/response types from `src/contracts.ts` (or generated declarations in `dist/contracts.d.ts`). Regenerate `openapi.json` with `npm run contracts`; `npm test` rejects drift. Schemas reject unexpected properties. API responses are also validated before transaction commit.

## Endpoints

| Endpoint | Access / purpose |
| --- | --- |
| `GET /health`, `GET /ready`, `GET /openapi.json` | Public health, DB readiness and contracts |
| `POST /auth/login` | Public; existing invited account email/password; returns active application profile and Supabase session |
| `POST /auth/refresh` | Public; valid refresh token and active profile required |
| `POST /auth/logout` | Verified bearer token; revokes current session; also available to disabled profiles |
| `GET /me` | Active invited account, role and timezone |
| `GET /users` | Founder; paginated staff directory |
| `GET /users/:id` | Founder; individual profile |
| `PATCH /users/:id` | Founder; staff role or account activity; cannot replace/deactivate founder or convert client accounts into staff |
| `POST /invitations` | Founder invites staff; founder/assigned planner invites explicitly linked clients |
| `POST /clients` | Founder/planner; create contact |
| `GET /clients`, `GET /clients/:id` | Staff; founder sees all, others see contacts of assigned weddings |
| `PATCH /clients/:id` | Founder/assigned planner; update contact, never user linkage |
| `DELETE /clients/:id` | Founder; archive contact only after all linked weddings are archived |
| `POST /enquiries` | Founder/planner; atomically create enquiry, provisional wedding and contact links; creator planner is assigned |
| `GET /enquiries`, `GET /enquiries/:id` | Scoped staff/client access; list optionally filters `stage` |
| `PATCH /enquiries/:id` | Founder/assigned planner; stage/source/internal notes |
| `GET /weddings`, `GET /weddings/:id` | Scoped staff/client access; list optionally filters `state` |
| `POST /weddings` | Founder/planner; directly create provisional wedding with existing client IDs; no enquiry is created |
| `PATCH /weddings/:id` | Founder/assigned planner; details and limited Phase 1 lifecycle transitions; budget changes founder-only |
| `DELETE /weddings/:id` | Founder/assigned planner; archive provisional/cancelled wedding with no pending/confirmed consultations |
| `POST /weddings/:id/clients` | Founder; explicitly link existing `clientId` |
| `POST /weddings/:id/assignments` | Founder; assign active staff `userId` |
| `DELETE /weddings/:id/assignments/:userId` | Founder; blocked while that planner has confirmed consultations for the wedding |
| `POST /consultations` | Founder/assigned planner/linked client; request only |
| `GET /consultations`, `GET /consultations/:id` | Scoped staff/client access; list optionally filters `weddingId` and `state` |
| `PATCH /consultations/:id` | Founder/assigned planner; confirm/reschedule, complete or cancel |

All list endpoints accept `page` and `pageSize`. See OpenAPI for exact body and response schemas.

See [PHASE_1B_API.md](PHASE_1B_API.md) for request/response examples, validation rules, model decisions and the authentication/archival contract.

## Entities and lifecycle

`UserProfile.id` is the verified Supabase identity UUID. `Client.userId` explicitly links one invited account to its contact. `WeddingClient` allows several contacts per wedding and several weddings per contact. `WeddingAssignment` grants staff scope. A matching email never grants wedding access by itself.

`Enquiry.id` and `Wedding.id` are different identifiers. The enquiry has a unique `weddingId`; every future vendor, quotation, task, schedule, incident, payment and report must reference this same wedding ID. No conversion creates a replacement wedding.

Direct wedding creation uses `{ clientIds, wedding }`, the same structure as enquiry creation without enquiry metadata. Use either direct wedding intake or the enquiry creation flow for an intended wedding; do not POST a second wedding after receiving one from enquiry creation. DELETE archives rather than physically deleting records. Archived weddings and their enquiries/consultations are excluded from normal APIs, including client access. Their UUIDs, links and audit history remain stored. Client responses for staff include nullable `archivedAt`.

Reuse `UserProfile` for application users, `Role` for fixed roles and `PackageType` for the two supported packages. There is no duplicate User/Role/WeddingPackage table. `WeddingFunction` now provides a schema-only child relation (`id`, `weddingId`, `type`, `name`, optional paired `startAt`/`endAt`, optional `venue`, timestamps) for Mehendi/Sangeet/Reception. Function planning APIs and automation remain later-phase work.

Enquiry stages: `NEW`, `CONTACTED`, `CONSULTATION_SCHEDULED`, `PROPOSAL_SENT`, `LOST`. Stage changes do not confirm a booking or automatically change wedding lifecycle.

Wedding states: `ENQUIRY`, `PROPOSAL`, `AGREEMENT`, `BOOKING_CONFIRMED`, `PLANNING`, `EXECUTION`, `COMPLETED`, `CANCELLED`. Phase 1 exposes only `ENQUIRY → PROPOSAL`, `PROPOSAL → ENQUIRY`, and cancellation from either. Agreement and booking confirmation require future workflows and cannot be set through this API. Later modules extend transitions around this stable record.

Packages: `FULL_SERVICE`, `PARTIAL_DAY_OF`. Unknown wedding dates are null. Enquiry creation body:

```json
{
  "clientIds": ["<existing-client-uuid>"],
  "wedding": { "title": "Aanya & Arjun", "packageType": "FULL_SERVICE", "weddingDate": null, "guestCount": 400 },
  "source": "PHONE"
}
```

A planner can attach unused contacts or contacts already accessible through their assigned weddings. Founder can attach any contact. Duplicate normalized client emails return 409; reuse the accessible existing contact instead.

## Visibility and role matrix

Founder sees all weddings. Planners can manage assigned weddings. Coordinators and finance have read-only Phase 1 operational access to assigned weddings. Finance and founder can read budget; planners may capture an initial enquiry budget but do not receive it back. Clients can read linked weddings/enquiries/consultations and request consultations. No client directory or staff directory is exposed to clients.

Client wedding fields are exactly `id`, `title`, `weddingDate`, `packageType`, `state`, `guestCount`, `preferredTheme`, `createdAt`, `updatedAt`. Client enquiry fields are exactly `id`, `weddingId`, `stage`, `createdAt`, `updatedAt`. Client consultation fields are exactly `id`, `weddingId`, `state`, `preferredAt`, `message`, `startAt`, `endAt`, `createdAt`, `updatedAt`.

Client APIs must not return internal notes, assignment IDs, planner IDs, financial information, vendor negotiations or private incident information. Future modules must add an explicit client projection and privacy tests before exposure. Do not spread database records into client responses.

## Consultations

Request body: `{ weddingId, preferredAt, message? }`. A request creates `REQUESTED`, with no confirmed time or responsible planner.

Confirmation/reschedule body: `{ state: "CONFIRMED", startAt, endAt, plannerId, internalNotes? }`. The responsible planner must be active and assigned to that wedding. End must follow start; initial and rescheduled confirmed starts must be in the future. Completed/cancelled appointments cannot be reopened. Completion requires an existing confirmed appointment.

Completion/cancellation body: `{ state: "COMPLETED" | "CANCELLED", internalNotes? }`. Only staff decide. PostgreSQL rejects overlaps for the same planner across all weddings with 409 `SCHEDULING_CONFLICT`; adjacent intervals are allowed. Treat requests as pending until a planner confirms them.

## Supabase session integration for Vite

Install `@supabase/supabase-js` and `@supabase/ssr` in the frontend package. Both are installed in the backend package for the supplied browser helper and server adapter. Import/adapt only `src/frontend/auth.ts`; never import `server.ts`, `identity.ts`, Prisma, or server configuration into a frontend bundle.

Use `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_URL`. The provided project settings are stored only in ignored local environment files. `NEXT_PUBLIC_*`, `next/headers`, Next.js middleware and a `todos` query are not part of this Vite application.

`createBrowserAuth(url, publishableKey)` exposes sign-in, password setup, invitation verification, PKCE callback exchange, password recovery, sign-out, and refreshed access-token retrieval. The SDK manages browser session persistence/refresh; Vite does not need Next.js server middleware. Configure the invitation email template to send clients to `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite`, then call `acceptInvitation(token_hash)` and `setPassword`. For password recovery, call `recoverPassword` with the allowlisted callback URL, exchange the returned code, then set the new password.

Fetch a token before calling Express, handle refresh/sign-in failures, and clear UI state on sign-out. The browser session is not an authorization source: Express validates identity and active role/record access. Supabase-issued access tokens can remain usable until expiry after sign-out; application profile deactivation is enforced on the next API request. No signup UI or direct Supabase table writes should be implemented.

Invitations can create an Auth identity before a database failure. Retrying safely reuses that identity but still requires the explicit authorized invitation/link. Existing Auth identities may need password recovery if their earlier invite email was lost; account existence is not treated as email delivery confirmation.

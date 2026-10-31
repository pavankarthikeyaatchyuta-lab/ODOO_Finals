# The Royal Knot

Standalone wedding planning management for one agency. The agreed stack is React, Vite, TypeScript, Tailwind CSS and Recharts for the frontend; Node.js 22, Express, TypeScript, Prisma and Supabase PostgreSQL for the backend; Supabase Auth and private Storage; Vercel hosting.

This project does not use Odoo. The earlier frontend architecture document is historical; its Odoo model names and workflows are superseded by [the Phase 1 integration contract](backend/INTEGRATION.md).

## Phase 1 backend

- Invited staff and client identities, active-account checks, founder-controlled staff roles and wedding assignments.
- Client contacts, enquiries and a separate central Wedding UUID. Enquiry creation transactionally creates a provisional wedding, never a confirmed booking.
- Client-safe wedding/enquiry/consultation responses, assignment-scoped staff access, and explicit client account links.
- Consultation requests, planner confirmation/rescheduling, completion/cancellation, database-enforced overlap prevention and audit history.
- Retry-safe mutations, validation, structured errors, pagination, health/readiness, generated OpenAPI and shared TypeScript contracts.
- Restricted database role, private business schema with backend-only RLS policies, private document-bucket provisioning and Vercel configuration.

Codex owns `backend/`. Antigravity owns frontend screens. The frontend has not been implemented by this phase.

## Local setup

Use **Node.js 22.x** and npm. From `backend/`:

```sh
npm ci
cp .env.example .env
# Populate server credentials in .env, never in frontend environment variables.
npm run db:migrate
npm run db:provision
# Set FOUNDER_EMAIL and FOUNDER_NAME in your local environment.
npm run bootstrap:founder
npm run dev
```

On PowerShell use `Copy-Item .env.example .env`. Migration commands require the owner connection in `DIRECT_URL`; requests use the restricted pooled `DATABASE_URL`. Provisioning requires a generated runtime-role password and the Supabase server-only administrative key. Do not commit `.env` or `.env.local` files.

```sh
npm run typecheck
npm run build
npm test
npm run contracts
```

`npm test` starts a disposable local PostgreSQL server, applies migrations twice, checks generated contracts and runs API integration tests using `rk_backend`. It does not use your Supabase data or credentials. The fixture runner refuses to run outside its isolated test environment. Embedded PostgreSQL is a development-only dependency.

## Contracts and deployment

- [Frontend handoff and endpoint guide](backend/INTEGRATION.md)
- [OpenAPI specification](backend/openapi.json), also served at `/api/v1/openapi.json`
- [Shared request/response types](backend/src/contracts.ts)
- [Vite-compatible Supabase Auth helper](backend/src/frontend/auth.ts)
- [Deployment and Supabase configuration](backend/DEPLOYMENT.md)
- [Phase 1 verification report](backend/PHASE_1_REPORT.md)

## Later phases

Digital agreements, three-caterer quotation comparison and vendor selection, 25+ generated tasks, Full-Service and Partial/Day-of packages, Mehendi/Sangeet/Reception planning, live schedules, vendor arrivals, incidents, additional-expense approval, client/vendor payments, reconciliation and founder profitability reports remain later reviewed phases.

Closed-loop wedding-day coordination must preserve schedule history, planner approval and affected vendor/activity identification. Published instructions track Sent, Acknowledged and Problem separately. Sending never acknowledges a change. All future records reference the existing Wedding UUID.

Work only on `main`, stage only owned files, pull before pushing, never force-push, and stop on conflicts. Complete and review each phase before starting the next.

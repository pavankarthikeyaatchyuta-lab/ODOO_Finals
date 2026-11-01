# Phase 2 — client and vendor integration contract

Use `/api/v1`, Supabase bearer authentication, `src/contracts.ts`, `src/workflow-contracts.ts` and generated `openapi.json`. All business mutations require an `Idempotency-Key`, except the short-lived document capability endpoints, which are deliberately uncached. Existing Phase 1 validation/error/pagination conventions remain. POST success is 201, GET/PATCH/DELETE success is 200. A 404 conceals inaccessible resources.

## Enquiries and clients

Existing enquiry creation keeps `Enquiry.id` distinct from the stable `Wedding.id`. `wedding` now accepts nullable `coupleDetails` (2000 characters), `location` (300), `requirements` (5000), and a configured two-decimal currency (`INR`, `USD`, `EUR`, `GBP`, `AED`; default INR). Budget remains a decimal string and is not returned to clients. Client contacts accept `requirements` (5000 characters) without creating duplicate contacts. Reuse `clientIds` when associating a client with multiple weddings.

```json
{
  "clientIds": ["<client UUID>"],
  "source": "PHONE",
  "wedding": {
    "title": "Aanya & Arjun — fictional demo",
    "coupleDetails": "Aanya and Arjun",
    "packageType": "FULL_SERVICE",
    "weddingDate": "2027-12-20",
    "location": "Udaipur",
    "guestCount": 400,
    "budgetMax": "1000000.00",
    "currency": "INR",
    "preferredTheme": "Heritage",
    "requirements": "Vegetarian menu and step-free access"
  }
}
```

Staff `GET /enquiries` supports `stage`, `source`, `followUpStatus`, `assignedToId`, and `q` (title/couple search), plus pagination. Clients cannot filter by internal source, follow-up or assignment information. `PATCH /enquiries/:id` additionally accepts `followUpStatus` (`PENDING`, `CONTACTED`, `FOLLOW_UP_DUE`, `CLOSED`) and nullable ISO `followUpAt`. These internal fields are absent from client responses.

`POST /enquiries/:id/assignment` is founder-only: `{ "userId": "<active planner UUID>" }`. It sets the enquiry owner and adds that planner to the wedding team. Removing old wedding membership is a separate explicit founder action. Planner-created enquiries initially belong to their creator.

`GET /clients/:id/consultations` and `/clients/:id/activity` provide paginated, assignment-scoped staff history. Activity responses contain only `id`, `action`, `entityId`, `createdAt`, not private audit payloads. Clients continue to read their own consultations through `/consultations`.

## Private documents and agreement evidence

| Method / endpoint | Permission and behavior |
| --- | --- |
| `POST /weddings/:id/documents` | Assigned planner/founder registers document metadata; clients may register their own signed-agreement/payment evidence; finance may register payment evidence |
| `POST /documents/:id/upload-url` | Original uploader only; returns uncached non-overwriting signed upload capability |
| `POST /documents/:id/complete` | Original uploader; verifies actual uploaded size, MIME, file signature and SHA-256; never verifies a signature automatically |
| `GET /documents/:id` | Explicit document authorization; no storage path is returned |
| `POST /documents/:id/download-url` | Authorized account; verified objects only; uncached 60-second private download |
| `GET /weddings/:id/floor-plans` | Assigned staff; linked clients only after the agreement is SIGNED |
| `POST /weddings/:id/agreement` | Assigned planner/founder creates one draft agreement |
| `GET /weddings/:id/agreement` | Assigned staff; linked clients can see SENT/submitted/SIGNED agreements, not drafts |
| `PATCH /agreements/:id` | Assigned planner/founder edits only draft metadata/source document |
| `POST /agreements/:id/send` | Requires a verified source agreement document; sets SENT |
| `POST /agreements/:id/submit-signature` | Linked client or assigned planner/founder submits verified uploaded evidence; sets SIGNATURE_SUBMITTED, never SIGNED |
| `POST /agreements/:id/verify` | Assigned planner/founder manually attests review; sets SIGNED with reviewer, evidence hash and timestamp |
| `POST /agreements/:id/reject-signature` | Assigned planner/founder returns to SENT, preserving the rejection in audit history |

Document registration body: `{ "kind": "AGREEMENT", "fileName": "service.pdf", "contentType": "application/pdf", "size": 1024 }`. Kinds are `AGREEMENT`, `SIGNED_AGREEMENT`, `FLOOR_PLAN`, `PAYMENT_EVIDENCE`. MIME types are PDF, PNG, JPEG; size is 1–10 MiB. Filenames reject paths/control characters, and stored paths are generated from UUIDs rather than trusting filenames. Registration returns metadata in PENDING state. Upload capability returns `{ signedUrl, path, token }`; upload directly to Supabase, then complete verification. Completed metadata is VERIFIED with `sha256` and `verifiedAt`; verified objects cannot be overwritten through the API.

Create an agreement using `{ "title": "Service agreement", "terms": "Agreed scope", "documentId": "<verified AGREEMENT document UUID>" }`. `documentId` may be supplied later while the agreement is DRAFT. Signature submission: `{ "documentId": "<verified SIGNED_AGREEMENT UUID>", "claimedSignedAt": "<ISO timestamp>" }`. Client evidence must belong to that client and wedding. Review:

```json
{
  "verifiedEvidence": true,
  "signedAt": "2026-10-31T10:00:00.000Z",
  "note": "Reviewed the signed pages and parties against the approved service scope."
}
```

Review notes need 10–2000 characters; signature times cannot be in the future. Review notes/reviewer IDs are never returned in client agreement responses. Agreement responses expose `id`, `weddingId`, `title`, `terms`, `version`, `status`, source/signed document IDs, sent/claimed/signed timestamps and creation/update timestamps. Verification is **manual document review**, not cryptographic electronic signing. No real email/WhatsApp signing integration is claimed.

Backend gate: linked clients receive 403 `AGREEMENT_REQUIRED` on vendor-list and floor-plan sharing/download until verified SIGNED status. Upload completion and a submitted signature do not unlock it. The global vendor directory and quotation negotiations are staff-only even after signing. Pending/private evidence from other uploaders is not implicitly readable by knowing its UUID.

Supabase Storage must remain private with no broad browser policies. The server supplies signed capabilities after authorization. Missing provider configuration returns 503; missing/unverified files and invalid agreement transitions return 409/400 as specified in OpenAPI. Supabase upload URLs expire according to the provider (currently two hours); download URLs expire after 60 seconds.

## Vendors and quotation comparison

Internal directory endpoints: `GET /vendor-categories` (18 configured categories), `POST /vendors`, `GET /vendors`, `GET /vendors/:id`, `PATCH /vendors/:id`, `DELETE /vendors/:id`. Staff may read; founder/planner may create/update; founder may archive unused vendors. Clients cannot browse this directory. List filters are `categoryCode` and `q` plus pagination. Names/contact names are 1–200 characters, email normalized/unique, phone 3–40, service details 1–5000. Category changes/archival are blocked once quotation history references a vendor.

```json
{
  "name": "Fictional Royal Caterers",
  "categoryCode": "CATERING",
  "contactName": "Catering Manager",
  "email": "catering@example.com",
  "phone": "+91 9876543210",
  "serviceDetails": "Vegetarian regional menus and wedding service staff"
}
```

`POST /weddings/:id/quotation-rounds` with `{ "categoryCode": "CATERING", "vendorIds": ["<UUID 1>", "<UUID 2>", "<UUID 3>"] }` creates one round and three requests. Catering requires exactly three distinct active vendors of that category; other categories accept one to three. One round per wedding/category prevents parallel duplicate selections. Currency is copied from the wedding and locked against later changes once procurement begins.

`POST /quotation-requests/:id/quotation` submits a quote. `PATCH /quotations/:id` replaces a still-open quote with the same complete body:

```json
{
  "pricePerPlate": "100.10",
  "guestCount": 400,
  "additionalHourRate": "10.01",
  "additionalHours": "1.50",
  "menuDetails": "Vegetarian regional menu",
  "inclusions": ["Service staff"],
  "exclusions": ["Venue rental"],
  "items": [{ "description": "Equipment", "quantity": "2.500", "unitPrice": "3.33" }]
}
```

Calculated total is **40063.35**: plate total 40040.00, additional hours 15.02, item 8.33. The server uses `Prisma.Decimal`, rounds each component/line to two decimals with HALF_UP, then sums. Responses contain decimal strings and calculated line totals; input `total` is rejected. All money is nonnegative and within DECIMAL(16,2); quote total must be positive; catering additionally requires guests, positive plate price and menu details. Tax is not inferred in this quotation contract.

Assigned planners/founders/finance can read `GET /weddings/:id/quotation-rounds` and `GET /quotation-rounds/:id/comparison`. The response contains round ID, wedding/category/currency/status and each request's vendor, request status and quotation. Quotation responses include itemized values, calculated total, inclusions/exclusions/menu and timestamps.

`POST /quotations/:id/select` is assigned planner/founder only. All three catering quotes must be submitted. It locks the wedding/round, selects exactly one request, closes the other two with timestamps, and creates one wedding/vendor/category association. Database uniqueness also prevents multiple selections. Same-key retry returns the original result; a new selection key after selection returns 409 `VENDOR_ALREADY_SELECTED`. Selection response is `{ id, weddingId, vendorId, categoryCode, quotationId, createdAt }`.

`GET /weddings/:id/vendors` exposes only selected public vendor contact/service fields, gated for linked clients by SIGNED agreement. No quotation price, negotiation or private financial fields are included.

## Migration, testing and boundaries

Apply additive migration `202610310005_client_vendor_workflows` after Phase 1. Existing records/UUIDs are preserved; no reset/drop is used. Fixed category reference data is part of the migration, not a fictional production seed. New tables have backend-only RLS policies and appropriate foreign keys/uniqueness/value constraints. Actual migration execution in this task is restricted to temporary test PostgreSQL.

Tests cover enquiry context/filtering/assignment, client history, false file metadata, cross-wedding evidence, agreement gate before/after manual review, vendor CRUD, three-vendor requirements, monetary rounding, concurrency, duplicate selections and closure of losing requests. Phase 3 planning/payment automation is a separate commit and contract.

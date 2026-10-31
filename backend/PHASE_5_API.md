# Phase 5 — financial management and founder reporting contract

Use `/api/v1`, `src/finance-contracts.ts` and the regenerated `openapi.json`. Same rules as earlier phases: Supabase bearer auth, wedding membership, `Idempotency-Key` on every mutation, POST success 201, reads/PATCH 200.

## Money representation

All amounts travel as decimal **strings** with at most 2 places (`"157500.00"`), stored as PostgreSQL `DECIMAL(16,2)` and computed with Prisma `Decimal` on the server. No floating-point arithmetic is used for money. Quantities are `DECIMAL(12,3)`, hours `DECIMAL(8,3)`, tax rates `DECIMAL(5,2)` percent. Rounding: line net = quantity × unit rate, rounded half-up to paise; tax = net × rate / 100, rounded half-up; total = net + tax. Labour cost = hours × approved hourly rate, rounded half-up. All money is in the wedding currency (locked once any financial record exists). The frontend must display, never recalculate, these values.

## Policy assumptions (approved by the founder, not invented)

`POST /weddings/:id/finance-settings` (FOUNDER only, once, immutable):

```json
{ "estimatedRevenue": "2600000.00", "contractedRevenue": "2500000.00", "estimatedVendorCost": "1420000.00", "estimatedLabourCost": "60000.00", "estimatedOtherDirectCost": "25000.00", "recognitionPolicy": "Recognize revenue per function once the founder confirms the function was delivered." }
```

The backend stores the recognition policy text but does not auto-recognize revenue. Finance posts recognition explicitly (below). Labour rates have no defaults; the founder approves each one.

## Client payments (`BookingPayment`, direction `CLIENT_RECEIPT`)

| Step | Endpoint | Who | Status |
|---|---|---|---|
| Initiate | `POST /weddings/:id/payments` `{ amount, reference, direction: "CLIENT_RECEIPT", milestone: "BOOKING"\|"ADVANCE"\|"FINAL", isDemo }` | client, finance, founder | `INITIATED` |
| Claim paid | `POST /payments/:id/claim` `{ evidenceDocumentId? }` | same | `CLAIMED` |
| Verify | `POST /payments/:id/verify` `{ verifiedEvidence: true, note }` | finance, founder | `VERIFIED` (`verificationMethod: "MANUAL_BANK_REVIEW"`) |
| Fail | `POST /payments/:id/fail` `{ note }` | finance, founder | `FAILED` (from INITIATED/CLAIMED) |
| Reverse | `POST /payments/:id/reverse` `{ note }` | finance, founder | `REVERSED` (from VERIFIED; history kept) |

Only `VERIFIED` counts as cash. Nothing becomes verified without an explicit finance action; there is no payment gateway. `isDemo: true` marks manually verified sample transactions, and the flag is returned on every payment. References are globally unique, so a duplicate posting returns `409 DUPLICATE_RECORD`. Two concurrent verifications of one claim yield exactly one 201 and one 409.

`POST /weddings/:id/payment-milestones` `{ milestone, amount, dueAt }` (finance) sets an explicit due date and amount. The sum of milestones cannot exceed the contract plus approved client charges. `GET /weddings/:id/client-balance` (client, finance, founder) returns `contractedRevenue`, `approvedClientCharges`, `collectible`, `cashCollected`, `outstandingReceivable`, `creditBalance`, per-milestone `verifiedReceived`/`outstanding`, and `unallocatedReceivable`.

The Phase 3 booking-deposit endpoints keep working and only see `CLIENT_RECEIPT`/`BOOKING` rows.

## Vendor payables

1. **Agreed amount.** For a vendor with a selected quotation, the quotation total is used. For a client-provided vendor, finance approves it once with `POST /weddings/:id/vendor-contracts` `{ weddingVendorId, amount, note }`. It is immutable afterwards.
2. **Advances.** Use `POST /weddings/:id/payments` with `{ direction: "VENDOR_DISBURSEMENT", milestone: "ADVANCE", weddingVendorId, ... }`, then claim and verify. Finance/founder only; clients never see these rows. Verification is refused if total paid would exceed contract + approved extras.
3. **Final bill.** `POST /weddings/:id/vendor-bills` `{ weddingVendorId, reference, amount, dueAt, documentId? }` allows one bill per wedding vendor, with a globally unique invoice reference. Correct it with `PATCH /vendor-bills/:id` while unverified. `POST /vendor-bills/:id/verify` succeeds only if the bill **equals** agreed amount + approved extras for that vendor (`409 BILL_MISMATCH` otherwise). Verified bills are immutable and block new extras for that vendor.
4. **Final payment.** Use `milestone: "FINAL"`. It requires a verified bill, and cumulative paid can never exceed the verified bill (`409 PAYMENT_EXCEEDS_PAYABLE`).

## Additional expenses

`POST /weddings/:id/expenses` (founder, finance, planner, coordinator):

```json
{ "weddingVendorId": "<optional association>", "reference": "EXP-PLATES", "kind": "EXTRA_PLATES", "description": "60 extra plates", "quantity": "60", "unitRate": "2500.00", "taxRate": "5", "clientCharge": "165000.00", "supportingDocumentId": "<optional EXPENSE_EVIDENCE doc>" }
```

`kind` takes one of `EXTRA_GUESTS`, `EXTRA_PLATES`, `DJ_HOURS`, `GENERATOR`, or `OTHER`. The server computes `netAmount`, `taxAmount` and `total`. `clientCharge` is what the family pays, kept separate from vendor cost, and `0` means the planner absorbs it. If `clientCharge > 0`, the linked client must call `POST /expenses/:id/client-approve` first. Then finance calls `POST /expenses/:id/approve` or `/reject` with `{ note }`. **Only APPROVED expenses** enter reconciliation, the client balance and profitability. A vendor-linked expense is a vendor cost. An expense with no vendor is an "other direct cost". Clients listing `/weddings/:id/expenses` see only chargeable lines, with no unit rate, tax or vendor cost.

## Reconciliation

`GET /weddings/:id/reconciliation` (finance, founder) returns one row per wedding vendor: `originalQuotation`, `approvedExtras`, `committedCost` (= original + extras), `finalBill`, `verifiedBill`, `vendorAdvances`, `vendorFinalPayments`, `cashPaid`, `remainingPayable` (verified bill − paid; null until verified), `estimatedRemainingPayable` (committed − paid), `dueAt`.

## Revenue recognition and labour

- `POST /weddings/:id/revenue-recognitions` `{ reference, amount, recognizedAt, note }` (finance) posts recognition. Future dates are not allowed, and the cumulative total cannot exceed contract + approved client charges. `POST /revenue-recognitions/:id/reverse` `{ note }` reverses a posting while keeping it on record. Cash receipts never recognize revenue.
- `POST /labour-rates` `{ userId, hourlyRate, currency, effectiveFrom }` is FOUNDER only. `POST /weddings/:id/labour` `{ userId, rateId, reference, hours, workedAt }` is for an assigned staff member logging their own time; finance or the founder may log for anyone. Finance approves or rejects with `POST /labour/:id/approve|reject`. Only APPROVED labour counts.

## Metric definitions (`GET /weddings/:id/profitability`, finance/founder)

| Metric | Definition |
|---|---|
| `estimatedRevenue` | founder-approved estimate |
| `contractedRevenue` | founder-approved contract value (excludes extras) |
| `recognizedRevenue` | sum of unreversed recognition postings |
| `cashCollected` | sum of VERIFIED client receipts (reversed/failed excluded) |
| `committedVendorCosts` | Σ (agreed amount + approved vendor extras); null if any vendor lacks an agreed amount |
| `actualVendorCosts` | Σ verified final bills |
| `approvedLabourCosts` | Σ approved labour cost |
| `approvedOtherDirectCosts` | Σ approved expenses without a vendor |
| `outstandingReceivables` | max(0, contract + approved client charges − cash collected) |
| `outstandingPayables` | Σ remainingPayable; null while any bill is unverified |
| `operationalProfit` | recognizedRevenue − actualVendorCosts − approvedLabourCosts − approvedOtherDirectCosts (null without approved settings) |
| `estimatedTotalCosts` / `actualTotalCosts` / `costVariance` | estimate vs actual, variance = actual − estimated |

Cash in minus cash out is never reported as profit. `warnings` flags missing policy, missing vendor amounts, unverified bills and a booking-deposit shortfall.

## Founder dashboard

`GET /reports/founder-dashboard?from=2027-02-01&to=2027-02-28&weddingId=<uuid>&page=1&pageSize=25` (FOUNDER only; `from`/`to` filter on wedding date). It returns paginated per-wedding profitability (season performance), `totalsByCurrency` over the whole filtered cohort (revenue, vendor expenses, estimated vs actual), `upcomingDues` (outstanding client milestones and verified-bill vendor balances, sorted by due date), `teamHours` (approved hours/cost per team member), and `vendorPerformance` (scheduled/confirmed/late arrivals plus verified bill cost per vendor).

## Verified sample scenario (`tests/finance.test.ts`)

The test runs a 400-guest wedding with 60 extra guests. Expected values are derived independently in integer paise.

| Item | Amount (₹) |
|---|---|
| Catering contract 400 × 2,500 | 10,00,000.00 |
| Extra plates 60 × 2,500 + 5% GST | 1,57,500.00 |
| DJ contract / 2 extra hours × 15,000 + 18% | 1,20,000.00 / 35,400.00 |
| Florist contract / generator 18,000 + 18% (absorbed) | 3,00,000.00 / 21,240.00 |
| 60 extra-guest hampers 60 × 500 + 12% (other direct) | 33,600.00 |
| Rejected dessert counter | excluded |
| Verified bills (catering / DJ / decor) | 11,57,500 / 1,55,400 / 3,21,240 |
| Vendor advances | 5,00,000 / 60,000 / 1,50,000 |
| Remaining payable | 2,57,500 / 0 / 1,71,240 |
| Contract + approved client charges | 25,00,000 + 2,41,000 = 27,41,000 |
| Cash collected (failed ₹5,000 and reversed ₹7,000 excluded) | 22,50,000 |
| Outstanding receivable | 4,91,000 |
| Labour (20 h × 1,500 + 12.5 h × 800; 4 h rejected) | 40,000 |
| Recognized revenue (₹1,00,000 posting reversed) | 27,41,000 |
| **Operational profit** 27,41,000 − 16,34,140 − 40,000 − 33,600 | **10,33,260.00** |

## Limitations

- No payment gateway or bank feed is connected. Verification is a manual finance attestation, recorded as `MANUAL_BANK_REVIEW` and fully audited.
- Settings, verified bills and approved contracts are immutable. Corrections after approval require a new phase's change workflow.
- Tax is a single rate per line. GST split (CGST/SGST/IGST) is not modelled.

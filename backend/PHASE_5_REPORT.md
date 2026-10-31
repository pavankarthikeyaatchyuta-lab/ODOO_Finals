# Phase 5 completion report

Implemented client receipts (booking, advance, final) and vendor disbursements (advance, final) on one audited payment ledger with INITIATED → CLAIMED → VERIFIED, plus FAILED and REVERSED. Verification is an explicit, manual finance attestation (`MANUAL_BANK_REVIEW`); demo sample transactions carry `isDemo: true`. Only VERIFIED payments count as cash.

Additional expenses (extra guests, extra plates, DJ hours, generator, other) store quantity, unit rate, tax rate, server-computed net/tax/total, vendor, wedding, supporting document and a separate client charge. Client charges need explicit client acceptance and then finance approval. Only APPROVED expenses reach reconciliation, client balances and profitability.

Vendor reconciliation compares the agreed amount (selected quotation, or a finance-approved manual contract for client-provided vendors), approved extras, the final bill, advances, final payments and remaining payable. Each wedding vendor gets one final bill, invoice references are unique, and a bill verifies only if it equals the contract plus approved extras. Payments can never exceed the outstanding payable. All postings run inside an idempotent request transaction with wedding row locks that serialize writes for the same wedding. This does not mean PostgreSQL SERIALIZABLE isolation.

Profitability separates estimated, contracted and recognized revenue, cash collected, committed and actual vendor costs, approved labour, other direct costs, outstanding receivables and payables. Operational profit = recognized revenue − verified vendor bills − approved labour − approved other direct costs. Cash receipts never recognize revenue. Revenue is posted explicitly under the founder-approved policy. Labour uses only founder-approved hourly rates. The founder dashboard filters by wedding date range and wedding, and reports season totals per currency, upcoming dues, team hours, vendor performance and estimated versus actual cost.

Money is `DECIMAL(16,2)` and is calculated with Prisma `Decimal` (half-up rounding to paise), never floating point. Database CHECK constraints, RLS and backend-only grants cover every new table. The Phase 3 payment evidence constraint is extended to the new states.

**75 cumulative tests pass on Node 22, zero failures.** These include the 400 + 60 guest sample scenario, with every figure derived independently in integer paise: operational profit ₹10,33,260.00, outstanding receivable ₹4,91,000.00, remaining payables ₹2,57,500.00 and ₹1,71,240.00. The test script now refuses to run on Node < 22 with a clear message, because the Supabase identity tests require Node 22's native WebSocket.

Fix included: the client-provided vendor association endpoint now returns an explicit projection, so new contract columns cannot break its strict response schema.

Limits: no payment gateway, bank feed or webhooks are connected. Approved settings, contracts and verified bills are immutable. Tax is one rate per line, with no CGST/SGST/IGST split. The frontend still uses its mock service and must be wired to these endpoints by Antigravity using `PHASE_5_API.md`, `src/finance-contracts.ts` and `openapi.json`.

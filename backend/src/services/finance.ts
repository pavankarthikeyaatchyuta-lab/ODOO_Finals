import { Prisma, type UserProfile, type BookingPayment, type AdditionalExpense, type VendorBill, type RevenueRecognition, type LabourEntry, type WeddingVendor } from '@prisma/client';
import type { z } from 'zod';
import * as f from '../finance-contracts.js';
import { audit, weddingAccess, weddingFilter, type Tx } from '../access.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { lockWedding } from './workflow-access.js';
import { requireDocument } from './documents.js';
import { generateTasks } from './planning.js';

const D = Prisma.Decimal;
/**
 * Sums an array of Prisma Decimal values with zero-initialization.
 */
export const sum = (values: Prisma.Decimal.Value[]) => values.reduce<Prisma.Decimal>((total, value) => total.plus(value), new D(0));
const rounded = (value: Prisma.Decimal) => value.toDecimalPlaces(2, D.ROUND_HALF_UP);
/**
 * Validates that monetary amounts are finite, non-negative, and within supported precision.
 */
function storedAmount(value: Prisma.Decimal) {
  if (!value.isFinite() || value.lt(0) || value.gte('100000000000000')) throw new ApiError(400, 'INVALID_FINANCIAL_AMOUNT', 'Calculated amount exceeds the supported monetary range');
  return value;
}
const money = (value: Prisma.Decimal | null) => value?.toFixed(2) ?? null;
const positive = (value: Prisma.Decimal) => D.max(value, 0);
function conflict(code: string, message: string): never { throw new ApiError(409, code, message); }
type Currency = z.infer<typeof f.paymentDto>['currency'];
export const financeRoles = ['FOUNDER', 'FINANCE'] as const;
/**
 * Asserts that the authenticated user has finance or founder management privileges.
 */
export function financeUser(user: UserProfile) { if (!financeRoles.includes(user.role as 'FOUNDER' | 'FINANCE')) throw forbidden(); }

export function presentPayment(p: BookingPayment) { return { id: p.id, weddingId: p.weddingId, amount: p.amount.toFixed(2), currency: p.currency, reference: p.reference, direction: p.direction, milestone: p.milestone, weddingVendorId: p.weddingVendorId, isDemo: p.isDemo, status: p.status, evidenceDocumentId: p.evidenceDocumentId, verificationMethod: p.verificationMethod, reviewedAt: p.reviewedAt?.toISOString() ?? null, reversedAt: p.reversedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() }; }
export function presentExpense(p: AdditionalExpense, user: UserProfile) {
  const visible = { id: p.id, weddingId: p.weddingId, description: p.description, quantity: p.quantity.toFixed(3), kind: p.kind, clientCharge: p.clientCharge.toFixed(2), currency: p.currency, status: p.status, clientApprovedAt: p.clientApprovedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() };
  return user.role === 'CLIENT' ? visible : { ...visible, weddingVendorId: p.weddingVendorId, reference: p.reference, unitRate: p.unitRate.toFixed(2), taxRate: p.taxRate.toFixed(2), netAmount: p.netAmount.toFixed(2), taxAmount: p.taxAmount.toFixed(2), total: p.total.toFixed(2), supportingDocumentId: p.supportingDocumentId, reviewedAt: p.reviewedAt?.toISOString() ?? null };
}
export const presentBill = (p: VendorBill) => ({ id: p.id, weddingId: p.weddingId, weddingVendorId: p.weddingVendorId, reference: p.reference, amount: p.amount.toFixed(2), currency: p.currency, dueAt: p.dueAt.toISOString(), documentId: p.documentId, verifiedAt: p.verifiedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() });
export const presentRecognition = (p: RevenueRecognition) => ({ id: p.id, weddingId: p.weddingId, reference: p.reference, amount: p.amount.toFixed(2), recognizedAt: p.recognizedAt.toISOString(), policy: p.policy, note: p.note, postedBy: p.postedBy, reversedAt: p.reversedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() });
export const presentLabour = (p: LabourEntry) => ({ id: p.id, weddingId: p.weddingId, userId: p.userId, rateId: p.rateId, reference: p.reference, hours: p.hours.toFixed(3), workedAt: p.workedAt.toISOString(), hourlyRate: p.hourlyRate.toFixed(2), cost: p.cost.toFixed(2), currency: p.currency, status: p.status, reviewedAt: p.reviewedAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString() });

/**
 * Retrieves vendor association binding for a specific wedding.
 */
export async function vendorAssociation(tx: Tx, weddingId: string, id: string) {
  const row = await tx.weddingVendor.findFirst({ where: { id, weddingId }, include: { quotation: true, vendor: true } });
  if (!row) throw new ApiError(400, 'INVALID_VENDOR_ASSOCIATION', 'Vendor must be associated with this wedding');
  return row;
}
/**
 * Resolves contracted baseline cost from quotation or manual contract amount.
 */
async function baseline(tx: Tx, association: WeddingVendor) { return association.quotationId ? (await tx.quotation.findUniqueOrThrow({ where: { id: association.quotationId } })).total : association.manualContractAmount; }
/**
 * Calculates the sum of approved change order extras for a specific vendor.
 */
async function approvedExtras(tx: Tx, weddingId: string, weddingVendorId: string) {
  return (await tx.additionalExpense.aggregate({ where: { weddingId, weddingVendorId, status: 'APPROVED' }, _sum: { total: true } }))._sum.total ?? new D(0);
}
/**
 * Approves and locks financial assumptions and revenue recognition policy for a wedding.
 */
export async function configureFinance(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof f.financeInput>) {
  const wedding = await lockWedding(tx, user, weddingId);
  if (await tx.financeSettings.findUnique({ where: { weddingId } })) conflict('FINANCE_ALREADY_CONFIGURED', 'Approved financial assumptions are immutable; review changes outside this phase');
  if (wedding.bookingDepositRequired?.gt(body.contractedRevenue)) conflict('DEPOSIT_EXCEEDS_CONTRACT', 'Contracted revenue cannot be below the agreed booking deposit');
  const row = await tx.financeSettings.create({ data: { ...body, weddingId, currency: wedding.currency, approvedBy: user.id } });
  await audit(tx, user.id, 'FINANCE_POLICY_APPROVED', weddingId, weddingId, { policy: row.recognitionPolicy, contractedRevenue: row.contractedRevenue.toFixed(2) });
  return row;
}
/**
 * Initiates a client receipt or vendor disbursement payment record.
 */
export async function createPayment(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof f.paymentInput>) {
  const wedding = await lockWedding(tx, user, weddingId);
  if (body.direction === 'VENDOR_DISBURSEMENT') { financeUser(user); await vendorAssociation(tx, weddingId, body.weddingVendorId!); }
  const row = await tx.bookingPayment.create({ data: { ...body, weddingId, currency: wedding.currency, claimedBy: user.id, status: 'INITIATED' } });
  await audit(tx, user.id, 'PAYMENT_INITIATED', row.id, weddingId, { direction: row.direction, isDemo: row.isDemo });
  return presentPayment(row);
}
/**
 * Enforces permission access to financial payment records.
 */
export async function paymentAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  let row = await tx.bookingPayment.findUnique({ where: { id } });
  if (!row) throw missing();
  if (write) await lockWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  row = await tx.bookingPayment.findUniqueOrThrow({ where: { id } });
  if (!financeRoles.includes(user.role as 'FOUNDER' | 'FINANCE') && row.direction === 'VENDOR_DISBURSEMENT') throw missing();
  return row;
}
/**
 * Submits a payment claim with evidence document for finance review.
 */
export async function claimPayment(tx: Tx, user: UserProfile, id: string, evidenceDocumentId?: string) {
  const before = await paymentAccess(tx, user, id, true);
  if (before.status !== 'INITIATED') conflict('PAYMENT_STATE', 'Only initiated payments may be claimed');
  if (evidenceDocumentId) { const doc = await requireDocument(tx, before.weddingId, evidenceDocumentId, 'PAYMENT_EVIDENCE'); if (user.role === 'CLIENT' && doc.uploadedBy !== user.id) throw forbidden(); }
  const row = await tx.bookingPayment.update({ where: { id }, data: { status: 'CLAIMED', evidenceDocumentId } });
  await audit(tx, user.id, 'PAYMENT_CLAIMED', id, row.weddingId);
  return presentPayment(row);
}
/**
 * Verifies a payment claim against bank statement records and updates milestones.
 */
export async function verifyPayment(tx: Tx, user: UserProfile, id: string, note: string) {
  financeUser(user);
  const before = await paymentAccess(tx, user, id, true);
  if (before.status !== 'CLAIMED') conflict('PAYMENT_STATE', 'Verification requires an unreviewed payment claim');
  if (before.direction === 'VENDOR_DISBURSEMENT') {
    const association = await vendorAssociation(tx, before.weddingId, before.weddingVendorId!);
    const original = await baseline(tx, association);
    if (original === null) conflict('CONTRACT_REQUIRED', 'An explicitly approved vendor contract amount is required');
    const bill = await tx.vendorBill.findUnique({ where: { weddingVendorId: association.id } });
    if (before.milestone === 'FINAL' && !bill?.verifiedAt) conflict('VERIFIED_BILL_REQUIRED', 'Final payment requires a verified final bill');
    const limit = bill?.verifiedAt ? bill.amount : original.plus(await approvedExtras(tx, before.weddingId, association.id));
    const paid = (await tx.bookingPayment.aggregate({ where: { weddingVendorId: association.id, status: 'VERIFIED', direction: 'VENDOR_DISBURSEMENT' }, _sum: { amount: true } }))._sum.amount ?? new D(0);
    if (paid.plus(before.amount).gt(limit)) conflict('PAYMENT_EXCEEDS_PAYABLE', 'Payment would exceed the outstanding vendor amount');
  }
  const row = await tx.bookingPayment.update({ where: { id }, data: { status: 'VERIFIED', reviewedBy: user.id, reviewedAt: new Date(), reviewNote: note, verificationMethod: 'MANUAL_BANK_REVIEW' } });
  await audit(tx, user.id, 'PAYMENT_VERIFIED', id, row.weddingId, { method: row.verificationMethod!, note, isDemo: row.isDemo, direction: row.direction });
  const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: row.weddingId } });
  if (row.direction === 'CLIENT_RECEIPT' && row.milestone === 'BOOKING' && !['COMPLETED', 'CANCELLED'].includes(wedding.state)) await generateTasks(tx, user, row.weddingId, true);
  return presentPayment(row);
}
/**
 * Reverses or fails a payment record with full audit reasoning.
 */
export async function failPayment(tx: Tx, user: UserProfile, id: string, note: string, reverse: boolean) {
  financeUser(user);
  const before = await paymentAccess(tx, user, id, true);
  if (reverse ? before.status !== 'VERIFIED' : !['INITIATED', 'CLAIMED'].includes(before.status)) conflict('PAYMENT_STATE', reverse ? 'Only verified payments may be reversed' : 'Only unverified payments may fail');
  const now = new Date();
  const row = await tx.bookingPayment.update({ where: { id }, data: reverse ? { status: 'REVERSED', reversedBy: user.id, reversedAt: now, reversalNote: note } : { status: 'FAILED', reviewedBy: user.id, reviewedAt: now, reviewNote: note } });
  await audit(tx, user.id, reverse ? 'PAYMENT_REVERSED' : 'PAYMENT_FAILED', id, row.weddingId, { note });
  return presentPayment(row);
}
/**
 * Records an additional expense or on-the-day change order.
 */
export async function createExpense(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof f.expenseInput>) {
  const wedding = await lockWedding(tx, user, weddingId);
  if (body.weddingVendorId) { await vendorAssociation(tx, weddingId, body.weddingVendorId); if ((await tx.vendorBill.findUnique({ where: { weddingVendorId: body.weddingVendorId } }))?.verifiedAt) conflict('BILL_FINALIZED', 'A verified final vendor bill cannot receive new extra costs'); }
  if (body.supportingDocumentId) await requireDocument(tx, weddingId, body.supportingDocumentId, 'EXPENSE_EVIDENCE');
  const netAmount = storedAmount(rounded(new D(body.quantity).mul(body.unitRate)));
  const taxAmount = rounded(netAmount.mul(body.taxRate).div(100));
  const row = await tx.additionalExpense.create({ data: { ...body, weddingId, currency: wedding.currency, netAmount, taxAmount, total: storedAmount(netAmount.plus(taxAmount)), requestedBy: user.id } });
  await audit(tx, user.id, 'EXPENSE_REQUESTED', row.id, weddingId);
  return presentExpense(row, user);
}
/**
 * Checks access control for an expense record.
 */
export async function expenseAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.additionalExpense.findUnique({ where: { id } }); if (!row) throw missing();
  if (write) await lockWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  const fresh = await tx.additionalExpense.findUniqueOrThrow({ where: { id } });
  if (user.role === 'CLIENT' && fresh.clientCharge.isZero()) throw missing();
  return fresh;
}
/**
 * Approves or rejects an additional expense, validating client approval when billed to couple.
 */
export async function approveExpense(tx: Tx, user: UserProfile, id: string, note: string, approve: boolean) {
  financeUser(user);
  const before = await expenseAccess(tx, user, id, true);
  if (before.status !== 'PENDING') conflict('EXPENSE_REVIEWED', 'Only pending expenses may be reviewed');
  if (approve && before.clientCharge.gt(0) && !before.clientApprovedAt) conflict('CLIENT_APPROVAL_REQUIRED', 'Client must explicitly approve the additional charge');
  if (approve && before.weddingVendorId && (await tx.vendorBill.findUnique({ where: { weddingVendorId: before.weddingVendorId } }))?.verifiedAt) conflict('BILL_FINALIZED', 'Final bill already verified');
  const row = await tx.additionalExpense.update({ where: { id }, data: { status: approve ? 'APPROVED' : 'REJECTED', reviewedBy: user.id, reviewedAt: new Date(), reviewNote: note } });
  await audit(tx, user.id, approve ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED', id, row.weddingId, { note, total: row.total.toFixed(2), clientCharge: row.clientCharge.toFixed(2) });
  return presentExpense(row, user);
}
/**
 * Submits a final vendor bill for reconciliation.
 */
export async function createBill(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof f.billInput>) {
  const wedding = await lockWedding(tx, user, weddingId);
  await vendorAssociation(tx, weddingId, body.weddingVendorId);
  if (body.documentId) await requireDocument(tx, weddingId, body.documentId, 'VENDOR_BILL');
  const row = await tx.vendorBill.create({ data: { ...body, dueAt: new Date(body.dueAt), weddingId, currency: wedding.currency, submittedBy: user.id } });
  await audit(tx, user.id, 'VENDOR_BILL_SUBMITTED', row.id, weddingId);
  return presentBill(row);
}
/**
 * Checks access control for vendor bills.
 */
export async function billAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.vendorBill.findUnique({ where: { id } }); if (!row) throw missing();
  if (write) await lockWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  return tx.vendorBill.findUniqueOrThrow({ where: { id } });
}
/**
 * Verifies a final vendor bill, enforcing 3-way match against contract + approved extras.
 */
export async function verifyBill(tx: Tx, user: UserProfile, id: string, note: string) {
  const row = await billAccess(tx, user, id, true);
  if (row.verifiedAt) conflict('BILL_VERIFIED', 'The bill has already been verified');
  const original = await baseline(tx, await vendorAssociation(tx, row.weddingId, row.weddingVendorId));
  if (original === null || !row.amount.eq(original.plus(await approvedExtras(tx, row.weddingId, row.weddingVendorId)))) conflict('BILL_MISMATCH', 'Final bill must equal the agreed contract plus approved extras');
  const verified = await tx.vendorBill.update({ where: { id }, data: { verifiedBy: user.id, verifiedAt: new Date(), verificationNote: note } });
  await audit(tx, user.id, 'VENDOR_BILL_VERIFIED', id, row.weddingId, { note, amount: row.amount.toFixed(2) });
  return presentBill(verified);
}

/**
 * Computes live client balance: contracted revenue + approved extras - verified cash receipts.
 */
export async function clientBalance(tx: Tx, user: UserProfile, weddingId: string) {
  const wedding = await weddingAccess(tx, user, weddingId);
  const settings = await tx.financeSettings.findUnique({ where: { weddingId } });
  const extras = (await tx.additionalExpense.aggregate({ where: { weddingId, status: 'APPROVED' }, _sum: { clientCharge: true } }))._sum.clientCharge ?? new D(0);
  const receipts = await tx.bookingPayment.findMany({ where: { weddingId, direction: 'CLIENT_RECEIPT', status: 'VERIFIED' } });
  const cash = sum(receipts.map(p => p.amount));
  const collectible = settings ? settings.contractedRevenue.plus(extras) : null;
  const rows = await tx.clientMilestone.findMany({ where: { weddingId }, orderBy: { dueAt: 'asc' } });
  return { weddingId, currency: wedding.currency as Currency, contractedRevenue: money(settings?.contractedRevenue ?? null), approvedClientCharges: extras.toFixed(2), collectible: money(collectible), cashCollected: cash.toFixed(2), outstandingReceivable: money(collectible ? positive(collectible.minus(cash)) : null), creditBalance: collectible ? positive(cash.minus(collectible)).toFixed(2) : '0.00', milestones: rows.map(row => {
    const received = sum(receipts.filter(p => p.milestone === row.milestone).map(p => p.amount));
    return { id: row.id, weddingId, milestone: row.milestone, amount: row.amount.toFixed(2), dueAt: row.dueAt.toISOString(), approvedAt: row.approvedAt.toISOString(), verifiedReceived: received.toFixed(2), outstanding: positive(row.amount.minus(received)).toFixed(2) };
  }), unallocatedReceivable: collectible ? positive(collectible.minus(sum(rows.map(row => row.amount)))).toFixed(2) : null };
}
/**
 * Performs post-wedding vendor reconciliation matching quotations, extras, advances, and final bills.
 */
export async function reconciliation(tx: Tx, user: UserProfile, weddingId: string) {
  await weddingAccess(tx, user, weddingId);
  const associations = await tx.weddingVendor.findMany({ where: { weddingId }, include: { vendor: true, quotation: true, bill: true }, orderBy: { id: 'asc' } });
  const payments = await tx.bookingPayment.findMany({ where: { weddingId, direction: 'VENDOR_DISBURSEMENT', status: 'VERIFIED' } });
  const result: z.infer<typeof f.reconciliationDto>[] = [];
  for (const row of associations) {
    const original = row.quotation?.total ?? row.manualContractAmount;
    const extras = await approvedExtras(tx, weddingId, row.id);
    const committed = original?.plus(extras) ?? null;
    const advances = sum(payments.filter(p => p.weddingVendorId === row.id && p.milestone === 'ADVANCE').map(p => p.amount));
    const finals = sum(payments.filter(p => p.weddingVendorId === row.id && p.milestone === 'FINAL').map(p => p.amount));
    const paid = advances.plus(finals);
    const verifiedBill = row.bill?.verifiedAt ? row.bill.amount : null;
    result.push({ weddingVendorId: row.id, vendorId: row.vendorId, vendorName: row.vendor.name, originalQuotation: money(original), approvedExtras: extras.toFixed(2), committedCost: money(committed), finalBill: money(row.bill?.amount ?? null), verifiedBill: money(verifiedBill), vendorAdvances: advances.toFixed(2), vendorFinalPayments: finals.toFixed(2), cashPaid: paid.toFixed(2), remainingPayable: money(verifiedBill ? positive(verifiedBill.minus(paid)) : null), estimatedRemainingPayable: money(committed ? positive(committed.minus(paid)) : null), dueAt: row.bill?.dueAt.toISOString() ?? null });
  }
  return result;
}
/**
 * Posts recognized revenue according to the approved policy (e.g. Completed Contract or Milestone).
 */
export async function recognizeRevenue(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof f.recognitionInput>) {
  await lockWedding(tx, user, weddingId);
  const settings = await tx.financeSettings.findUnique({ where: { weddingId } });
  if (!settings) conflict('POLICY_REQUIRED', 'Founder must approve an explicit revenue recognition policy first');
  if (Date.parse(body.recognizedAt) > Date.now()) throw new ApiError(400, 'FUTURE_RECOGNITION', 'Revenue cannot be recognized in the future');
  const balance = await clientBalance(tx, user, weddingId);
  const previous = (await tx.revenueRecognition.aggregate({ where: { weddingId, reversedAt: null }, _sum: { amount: true } }))._sum.amount ?? new D(0);
  if (previous.plus(body.amount).gt(balance.collectible!)) conflict('REVENUE_EXCEEDS_CONTRACT', 'Cumulative recognized revenue cannot exceed the approved client contract and charges');
  const row = await tx.revenueRecognition.create({ data: { ...body, weddingId, recognizedAt: new Date(body.recognizedAt), policy: settings.recognitionPolicy, postedBy: user.id } });
  await audit(tx, user.id, 'REVENUE_RECOGNIZED', row.id, weddingId, { note: row.note, amount: row.amount.toFixed(2), policy: row.policy });
  return presentRecognition(row);
}
/**
 * Records internal wedding planner labor hours at approved hourly rates.
 */
export async function createLabour(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof f.labourInput>) {
  const wedding = await lockWedding(tx, user, weddingId);
  if (user.role !== 'FOUNDER' && user.role !== 'FINANCE' && body.userId !== user.id) throw forbidden();
  const member = await tx.weddingAssignment.findUnique({ where: { weddingId_userId: { weddingId, userId: body.userId } }, include: { user: true } });
  const rate = await tx.labourRate.findUnique({ where: { id: body.rateId } });
  if (!member?.user.active || member.user.role === 'CLIENT' || !rate || rate.userId !== body.userId || rate.currency !== wedding.currency || rate.effectiveFrom > new Date(body.workedAt)) throw new ApiError(400, 'INVALID_LABOUR_RATE', 'An active assigned team member and applicable founder-approved rate are required');
  if (Date.parse(body.workedAt) > Date.now()) throw new ApiError(400, 'FUTURE_LABOUR', 'Worked time cannot be in the future');
  const cost = storedAmount(rounded(rate.hourlyRate.mul(body.hours)));
  const row = await tx.labourEntry.create({ data: { ...body, workedAt: new Date(body.workedAt), weddingId, currency: wedding.currency, hourlyRate: rate.hourlyRate, cost, submittedBy: user.id } });
  await audit(tx, user.id, 'LABOUR_SUBMITTED', row.id, weddingId);
  return presentLabour(row);
}

/**
 * Computes true wedding profitability: Recognized Revenue - Vendor Costs - Planner Labor - Direct Costs.
 */
export async function profitability(tx: Tx, user: UserProfile, weddingId: string): Promise<z.infer<typeof f.profitabilityDto>> {
  const wedding = await weddingAccess(tx, user, weddingId);
  const settings = await tx.financeSettings.findUnique({ where: { weddingId } });
  const balance = await clientBalance(tx, user, weddingId);
  const vendorRows = await reconciliation(tx, user, weddingId);
  const recognized = (await tx.revenueRecognition.aggregate({ where: { weddingId, reversedAt: null }, _sum: { amount: true } }))._sum.amount ?? new D(0);
  const labour = (await tx.labourEntry.aggregate({ where: { weddingId, status: 'APPROVED' }, _sum: { cost: true } }))._sum.cost ?? new D(0);
  const direct = (await tx.additionalExpense.aggregate({ where: { weddingId, weddingVendorId: null, status: 'APPROVED' }, _sum: { total: true } }))._sum.total ?? new D(0);
  const actualVendor = sum(vendorRows.map(v => v.verifiedBill ?? '0'));
  const missingContracts = vendorRows.some(v => v.committedCost === null);
  const committed = missingContracts ? null : sum(vendorRows.map(v => v.committedCost!));
  const estimated = settings ? settings.estimatedVendorCost.plus(settings.estimatedLabourCost).plus(settings.estimatedOtherDirectCost) : null;
  const actual = actualVendor.plus(labour).plus(direct);
  const warnings = [...(!settings ? ['FINANCE_POLICY_NOT_CONFIGURED'] : []), ...(missingContracts ? ['VENDOR_CONTRACT_AMOUNT_MISSING'] : []), ...(vendorRows.some(v => v.verifiedBill === null) ? ['VENDOR_BILLS_NOT_FINALIZED'] : [])];
  if (wedding.bookingDepositRequired) {
    const booking = (await tx.bookingPayment.aggregate({ where: { weddingId, direction: 'CLIENT_RECEIPT', milestone: 'BOOKING', status: 'VERIFIED' }, _sum: { amount: true } }))._sum.amount ?? new D(0);
    if (booking.lt(wedding.bookingDepositRequired)) warnings.push('BOOKING_DEPOSIT_SHORTFALL');
  }
  return { weddingId, title: wedding.title, weddingDate: wedding.weddingDate?.toISOString().slice(0, 10) ?? null, currency: wedding.currency as Currency, recognitionPolicy: settings?.recognitionPolicy ?? null, warnings, estimatedRevenue: money(settings?.estimatedRevenue ?? null), contractedRevenue: balance.contractedRevenue, recognizedRevenue: recognized.toFixed(2), cashCollected: balance.cashCollected, committedVendorCosts: money(committed), actualVendorCosts: actualVendor.toFixed(2), approvedLabourCosts: labour.toFixed(2), approvedOtherDirectCosts: direct.toFixed(2), outstandingReceivables: balance.outstandingReceivable, outstandingPayables: vendorRows.some(v => v.remainingPayable === null) ? null : sum(vendorRows.map(v => v.remainingPayable!)).toFixed(2), operationalProfit: settings ? recognized.minus(actual).toFixed(2) : null, estimatedTotalCosts: money(estimated), actualTotalCosts: actual.toFixed(2), costVariance: estimated ? actual.minus(estimated).toFixed(2) : null };
}
/**
 * Generates cross-wedding seasonal executive dashboard metrics and upcoming cashflow dues.
 */
export async function dashboard(tx: Tx, user: UserProfile, query: z.infer<typeof f.reportQuery>) {
  const where: Prisma.WeddingWhereInput = { ...weddingFilter(user), ...(query.weddingId ? { id: query.weddingId } : {}), ...(query.from || query.to ? { weddingDate: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } } : {}) };
  // Totals cover the entire filtered wedding cohort, independently of the displayed page.
  const weddings = await tx.wedding.findMany({ where, select: { id: true }, orderBy: [{ weddingDate: 'asc' }, { id: 'asc' }] });
  const reports: z.infer<typeof f.profitabilityDto>[] = []; const upcomingDues: z.infer<typeof f.dueDto>[] = [];
  for (const wedding of weddings) {
    reports.push(await profitability(tx, user, wedding.id));
    const balance = await clientBalance(tx, user, wedding.id);
    let clientDue = new D(balance.outstandingReceivable ?? '0');
    for (const row of balance.milestones) {
      const due = D.min(row.outstanding, clientDue);
      if (due.gt(0)) upcomingDues.push({ weddingId: wedding.id, kind: 'CLIENT_RECEIPT', recordId: row.id, dueAt: row.dueAt, amount: due.toFixed(2), currency: balance.currency });
      clientDue = clientDue.minus(due);
    }
    const bills = await tx.vendorBill.findMany({ where: { weddingId: wedding.id, verifiedAt: { not: null } } });
    const reconciled = await reconciliation(tx, user, wedding.id);
    for (const row of reconciled) if (row.remainingPayable && new D(row.remainingPayable).gt(0)) upcomingDues.push({ weddingId: wedding.id, kind: 'VENDOR_DISBURSEMENT', recordId: bills.find(b => b.weddingVendorId === row.weddingVendorId)!.id, dueAt: row.dueAt!, amount: row.remainingPayable, currency: balance.currency });
  }
  const totalsByCurrency = [...new Set(reports.map(r => r.currency))].map(currency => {
    const values = reports.filter(r => r.currency === currency);
    const totals: Record<string, string | null> = {};
    for (const key of Object.keys(f.metricShape) as (keyof typeof f.metricShape)[]) totals[key] = values.some(v => v[key] === null) ? null : sum(values.map(v => v[key]!)).toFixed(2);
    return { currency, ...totals };
  });
  const ids = weddings.map(w => w.id);
  const labour = await tx.labourEntry.groupBy({ by: ['userId', 'currency'], where: { weddingId: { in: ids }, status: 'APPROVED' }, _sum: { hours: true, cost: true } });
  const associations = await tx.weddingVendor.findMany({ where: { weddingId: { in: ids } }, include: { vendor: true, wedding: true, arrivals: true, bill: true } });
  const vendorPerformance = new Map<string, z.infer<typeof f.vendorPerformanceDto>>();
  for (const row of associations) {
    const key = `${row.vendorId}:${row.wedding.currency}`;
    const summary = vendorPerformance.get(key) ?? { vendorId: row.vendorId, name: row.vendor.name, currency: row.wedding.currency as Currency, scheduledArrivals: 0, confirmedArrivals: 0, lateArrivals: 0, verifiedBillCost: '0.00' };
    summary.scheduledArrivals += row.arrivals.length;
    summary.confirmedArrivals += row.arrivals.filter(a => a.actualAt).length;
    summary.lateArrivals += row.arrivals.filter(a => a.actualAt && a.actualAt > a.expectedAt).length;
    if (row.bill?.verifiedAt) summary.verifiedBillCost = new D(summary.verifiedBillCost).plus(row.bill.amount).toFixed(2);
    vendorPerformance.set(key, summary);
  }
  return { data: reports.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), page: query.page, pageSize: query.pageSize, total: reports.length, totalsByCurrency, upcomingDues: upcomingDues.sort((a, b) => a.dueAt.localeCompare(b.dueAt)), teamHours: labour.map(r => ({ userId: r.userId, currency: r.currency, approvedHours: (r._sum.hours ?? new D(0)).toFixed(3), approvedCost: (r._sum.cost ?? new D(0)).toFixed(2) })), vendorPerformance: [...vendorPerformance.values()] };
}

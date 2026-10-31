/**
 * =============================================================================
 * THE ROYAL KNOT - Financial & Analytic Accounting Validation Contracts
 * =============================================================================
 * Zod validation schemas for revenue recognition policies, client milestone billing,
 * change order extras, vendor disbursements, 3-way reconciliation, and profitability.
 */
import { z } from 'zod';
import { uuid, timestamp, pageQuery } from './contracts.js';
import { money, positiveMoney, currency, reviewNoteInput, paymentReviewInput } from './workflow-contracts.js';

const text = z.string().trim().min(1).max(200);
const note = z.string().trim().min(10).max(2000);
const reference = z.string().trim().min(3).max(150).transform(v => v.toUpperCase());
// Stored inputs fit DECIMAL(16,2); sums can legitimately exceed one column's range.
export const amountDto = z.string().regex(/^\d+\.\d{2}$/);
const signedAmountDto = z.string().regex(/^-?\d+\.\d{2}$/);
export const milestone = z.enum(['BOOKING', 'ADVANCE', 'FINAL']);
export const direction = z.enum(['CLIENT_RECEIPT', 'VENDOR_DISBURSEMENT']);
export const paymentStatus = z.enum(['INITIATED', 'CLAIMED', 'VERIFIED', 'REJECTED', 'FAILED', 'REVERSED']);
export const financeInput = z.object({ estimatedRevenue: money, contractedRevenue: positiveMoney, estimatedVendorCost: money, estimatedLabourCost: money, estimatedOtherDirectCost: money, recognitionPolicy: note }).strict();
export const financeDto = financeInput.extend({ weddingId: uuid, currency, approvedBy: uuid, approvedAt: timestamp }).strict();
export const paymentInput = z.object({ amount: positiveMoney, reference, direction, milestone, weddingVendorId: uuid.optional(), isDemo: z.boolean() }).strict().superRefine((v, ctx) => {
  if ((v.direction === 'VENDOR_DISBURSEMENT') !== Boolean(v.weddingVendorId)) ctx.addIssue({ code: 'custom', message: 'Only vendor payments require weddingVendorId' });
  if (v.direction === 'VENDOR_DISBURSEMENT' && v.milestone === 'BOOKING') ctx.addIssue({ code: 'custom', message: 'Vendor payments use ADVANCE or FINAL' });
});
export const paymentDto = z.object({ id: uuid, weddingId: uuid, amount: amountDto, currency, reference: z.string(), direction, milestone, weddingVendorId: uuid.nullable(), isDemo: z.boolean(), status: paymentStatus, evidenceDocumentId: uuid.nullable(), verificationMethod: z.string().nullable(), reviewedAt: timestamp.nullable(), reversedAt: timestamp.nullable(), createdAt: timestamp }).strict();
export const claimInput = z.object({ evidenceDocumentId: uuid.optional() }).strict();
export const paymentQuery = pageQuery.extend({ direction: direction.optional(), status: paymentStatus.optional() });
export const expenseInput = z.object({ weddingVendorId: uuid.optional(), reference, kind: z.enum(['EXTRA_GUESTS', 'EXTRA_PLATES', 'DJ_HOURS', 'GENERATOR', 'OTHER']), description: text, quantity: z.string().regex(/^\d{1,6}(\.\d{1,3})?$/).refine(v => Number(v) > 0), unitRate: money, taxRate: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/).refine(v => Number(v) <= 100), clientCharge: money, supportingDocumentId: uuid.optional() }).strict();
export const expenseStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export const clientExpenseDto = z.object({ id: uuid, weddingId: uuid, description: z.string(), quantity: z.string(), kind: expenseInput.shape.kind, clientCharge: amountDto, currency, status: expenseStatus, clientApprovedAt: timestamp.nullable(), createdAt: timestamp }).strict();
export const expenseDto = clientExpenseDto.extend({ weddingVendorId: uuid.nullable(), reference: z.string(), unitRate: amountDto, taxRate: z.string(), netAmount: amountDto, taxAmount: amountDto, total: amountDto, supportingDocumentId: uuid.nullable(), reviewedAt: timestamp.nullable() }).strict();
export const visibleExpenseDto = z.union([clientExpenseDto, expenseDto]);
export const contractInput = z.object({ amount: money, note }).strict();
export const contractDto = z.object({ weddingVendorId: uuid, weddingId: uuid, amount: amountDto, approvedAt: timestamp }).strict();
export const billInput = z.object({ weddingVendorId: uuid, reference, amount: positiveMoney, dueAt: timestamp, documentId: uuid.optional() }).strict();
export const billDto = z.object({ id: uuid, weddingId: uuid, weddingVendorId: uuid, reference: z.string(), amount: amountDto, currency, dueAt: timestamp, documentId: uuid.nullable(), verifiedAt: timestamp.nullable(), createdAt: timestamp }).strict();
export const milestoneInput = z.object({ milestone, amount: positiveMoney, dueAt: timestamp }).strict();
export const milestoneDto = milestoneInput.extend({ id: uuid, weddingId: uuid, approvedAt: timestamp }).strict();
export const recognitionInput = z.object({ reference, amount: positiveMoney, recognizedAt: timestamp, note }).strict();
export const recognitionDto = z.object({ id: uuid, weddingId: uuid, reference: z.string(), amount: amountDto, recognizedAt: timestamp, policy: z.string(), note: z.string(), postedBy: uuid, reversedAt: timestamp.nullable(), createdAt: timestamp }).strict();
export const labourRateInput = z.object({ userId: uuid, hourlyRate: positiveMoney, currency, effectiveFrom: timestamp }).strict();
export const labourRateDto = labourRateInput.extend({ id: uuid, approvedBy: uuid, approvedAt: timestamp }).strict();
export const labourInput = z.object({ userId: uuid, rateId: uuid, reference, hours: z.string().regex(/^\d{1,2}(\.\d{1,3})?$/).refine(v => Number(v) > 0 && Number(v) <= 24), workedAt: timestamp }).strict();
export const labourDto = z.object({ id: uuid, weddingId: uuid, userId: uuid, rateId: uuid, reference: z.string(), hours: z.string(), workedAt: timestamp, hourlyRate: amountDto, cost: amountDto, currency, status: expenseStatus, reviewedAt: timestamp.nullable(), createdAt: timestamp }).strict();
export const reportQuery = pageQuery.extend({ weddingId: uuid.optional(), from: z.iso.date().optional(), to: z.iso.date().optional() }).superRefine((v, ctx) => { if (v.from && v.to && v.to < v.from) ctx.addIssue({ code: 'custom', message: 'to must be on or after from' }); });
export const reconciliationDto = z.object({ weddingVendorId: uuid, vendorId: uuid, vendorName: z.string(), originalQuotation: amountDto.nullable(), approvedExtras: amountDto, committedCost: amountDto.nullable(), finalBill: amountDto.nullable(), verifiedBill: amountDto.nullable(), vendorAdvances: amountDto, vendorFinalPayments: amountDto, cashPaid: amountDto, remainingPayable: amountDto.nullable(), estimatedRemainingPayable: amountDto.nullable(), dueAt: timestamp.nullable() }).strict();
export const balanceDto = z.object({ weddingId: uuid, currency, contractedRevenue: amountDto.nullable(), approvedClientCharges: amountDto, collectible: amountDto.nullable(), cashCollected: amountDto, outstandingReceivable: amountDto.nullable(), creditBalance: amountDto, milestones: z.array(milestoneDto.extend({ verifiedReceived: amountDto, outstanding: amountDto }).strict()), unallocatedReceivable: amountDto.nullable() }).strict();
export const metricShape = { estimatedRevenue: amountDto.nullable(), contractedRevenue: amountDto.nullable(), recognizedRevenue: amountDto, cashCollected: amountDto, committedVendorCosts: amountDto.nullable(), actualVendorCosts: amountDto, approvedLabourCosts: amountDto, approvedOtherDirectCosts: amountDto, outstandingReceivables: amountDto.nullable(), outstandingPayables: amountDto.nullable(), operationalProfit: signedAmountDto.nullable(), estimatedTotalCosts: amountDto.nullable(), actualTotalCosts: amountDto, costVariance: signedAmountDto.nullable() };
export const profitabilityDto = z.object({ weddingId: uuid, title: z.string(), weddingDate: z.iso.date().nullable(), currency, recognitionPolicy: z.string().nullable(), warnings: z.array(z.string()), ...metricShape }).strict();
export const dueDto = z.object({ weddingId: uuid, kind: z.enum(['CLIENT_RECEIPT', 'VENDOR_DISBURSEMENT']), recordId: uuid, dueAt: timestamp, amount: amountDto, currency }).strict();
export const teamDto = z.object({ userId: uuid, currency, approvedHours: z.string(), approvedCost: amountDto }).strict();
export const vendorPerformanceDto = z.object({ vendorId: uuid, name: z.string(), scheduledArrivals: z.number().int(), confirmedArrivals: z.number().int(), lateArrivals: z.number().int(), verifiedBillCost: amountDto, currency }).strict();
export const dashboardDto = z.object({ data: z.array(profitabilityDto), page: z.number().int(), pageSize: z.number().int(), total: z.number().int(), totalsByCurrency: z.array(z.object({ currency, ...metricShape }).strict()), upcomingDues: z.array(dueDto), teamHours: z.array(teamDto), vendorPerformance: z.array(vendorPerformanceDto) }).strict();
export { reviewNoteInput, paymentReviewInput };
export type FinancePaymentRequest = z.infer<typeof paymentInput>;
export type FinancePaymentResponse = z.infer<typeof paymentDto>;
export type AdditionalExpenseRequest = z.infer<typeof expenseInput>;
export type AdditionalExpenseResponse = z.infer<typeof visibleExpenseDto>;
export type ReconciliationResponse = z.infer<typeof reconciliationDto>;
export type ClientBalanceResponse = z.infer<typeof balanceDto>;
export type ProfitabilityResponse = z.infer<typeof profitabilityDto>;
export type FounderDashboardResponse = z.infer<typeof dashboardDto>;

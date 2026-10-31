/**
 * =============================================================================
 * File: finance.ts
 * Module: API Route Definition Router
 * =============================================================================
 * Registers RESTful API endpoints and maps HTTP route paths to service handlers and security policies for finance.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { z } from 'zod';
import * as c from '../contracts.js';
import * as f from '../finance-contracts.js';
import * as service from '../services/finance.js';
import { type RouteRegistrar, type Context } from '../http/routes.js';
import { audit, weddingAccess } from '../access.js';
import { lockWedding } from '../services/workflow-access.js';
import { ApiError, forbidden, missing } from '../errors.js';

/**
 * Registers analytic accounting, change orders, billing, and vendor reconciliation routes.
 */
export function registerFinanceRoutes(route: RouteRegistrar) {
  const finance = ['FOUNDER', 'FINANCE'] as const;
  const clients = ['FOUNDER', 'FINANCE', 'CLIENT'] as const;
  const weddingGuard = async ({ tx, user, params }: Context<unknown, unknown>) => weddingAccess(tx, user, params.id!);
  const paymentGuard = async ({ tx, user, params }: Context<unknown, unknown>) => service.paymentAccess(tx, user, params.id!);
  const expenseGuard = async ({ tx, user, params }: Context<unknown, unknown>) => service.expenseAccess(tx, user, params.id!);
  const billGuard = async ({ tx, user, params }: Context<unknown, unknown>) => service.billAccess(tx, user, params.id!);
  route('post', '/weddings/:id/finance-settings', { summary: 'Founder approves immutable contract estimates and explicit revenue recognition policy', roles: ['FOUNDER'], body: f.financeInput, response: f.financeDto, guard: weddingGuard, handler: ({ tx, user, params, body }) => service.configureFinance(tx, user, params.id!, body) });
  route('get', '/weddings/:id/finance-settings', { summary: 'Read approved internal financial assumptions', roles: [...finance], response: f.financeDto.nullable(), async handler({ tx, user, params }) { await weddingAccess(tx, user, params.id!); return tx.financeSettings.findUnique({ where: { weddingId: params.id } }); } });
  route('post', '/weddings/:id/payments', { summary: 'Initiate a client receipt or finance-only vendor disbursement; this does not verify money', roles: [...clients], body: f.paymentInput, response: f.paymentDto, guard: weddingGuard, handler: ({ tx, user, params, body }) => service.createPayment(tx, user, params.id!, body) });
  route('get', '/weddings/:id/payments', { summary: 'Paginate payment records; clients receive only their wedding client receipts', roles: [...clients], query: f.paymentQuery, response: c.listOf(f.paymentDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    if (user.role === 'CLIENT' && query.direction === 'VENDOR_DISBURSEMENT') throw forbidden();
    const where = { weddingId: params.id!, direction: user.role === 'CLIENT' ? 'CLIENT_RECEIPT' as const : query.direction, status: query.status };
    return { data: (await tx.bookingPayment.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize })).map(service.presentPayment), page: query.page, pageSize: query.pageSize, total: await tx.bookingPayment.count({ where }) };
  } });
  route('get', '/payments/:id', { summary: 'Read an authorized payment with a safe projection', roles: [...clients], response: f.paymentDto, handler: async ({ tx, user, params }) => service.presentPayment(await service.paymentAccess(tx, user, params.id!)) });
  route('post', '/payments/:id/claim', { summary: 'Submit an initiated payment claim with optional verified uploaded evidence', roles: [...clients], body: f.claimInput, response: f.paymentDto, guard: paymentGuard, handler: ({ tx, user, params, body }) => service.claimPayment(tx, user, params.id!, body.evidenceDocumentId) });
  route('post', '/payments/:id/verify', { summary: 'Finance explicitly records manual bank verification; never a real money transfer', roles: [...finance], body: f.paymentReviewInput, response: f.paymentDto, guard: paymentGuard, handler: ({ tx, user, params, body }) => service.verifyPayment(tx, user, params.id!, body.note) });
  for (const [action, reverse] of [['fail', false], ['reverse', true]] as const) route('post', `/payments/:id/${action}`, { summary: reverse ? 'Reverse a verified financial posting with retained history' : 'Mark an unverified payment failed', roles: [...finance], body: f.reviewNoteInput, response: f.paymentDto, guard: paymentGuard, handler: ({ tx, user, params, body }) => service.failPayment(tx, user, params.id!, body.note, reverse) });
  route('get', '/weddings/:id/client-balance', { summary: 'Read explicitly client-visible contract, approved charges, receipts and outstanding balance', roles: [...clients], response: f.balanceDto, handler: ({ tx, user, params }) => service.clientBalance(tx, user, params.id!) });
  route('post', '/weddings/:id/payment-milestones', { summary: 'Approve or replace an explicit client due date and amount; no assumed payment percentages', roles: [...finance], body: f.milestoneInput, response: f.milestoneDto, guard: weddingGuard, async handler({ tx, user, params, body }) {
    const weddingId = params.id!; await lockWedding(tx, user, weddingId);
    const balance = await service.clientBalance(tx, user, weddingId);
    if (balance.collectible === null) throw new ApiError(409, 'CONTRACT_REQUIRED', 'Configure an approved client contract first');
    const others = await tx.clientMilestone.findMany({ where: { weddingId, milestone: { not: body.milestone } } });
    if (service.sum(others.map(r => r.amount)).plus(body.amount).gt(balance.collectible)) throw new ApiError(409, 'MILESTONES_EXCEED_CONTRACT', 'Scheduled payments cannot exceed the contract and approved charges');
    const data = { amount: body.amount, dueAt: new Date(body.dueAt), approvedBy: user.id, approvedAt: new Date() };
    const row = await tx.clientMilestone.upsert({ where: { weddingId_milestone: { weddingId, milestone: body.milestone } }, create: { ...data, weddingId, milestone: body.milestone }, update: data });
    await audit(tx, user.id, 'CLIENT_DUE_APPROVED', row.id, weddingId, { amount: row.amount.toFixed(2), dueAt: row.dueAt.toISOString() });
    return { id: row.id, weddingId, milestone: row.milestone, amount: row.amount.toFixed(2), dueAt: row.dueAt.toISOString(), approvedAt: row.approvedAt.toISOString() };
  } });
  route('post', '/weddings/:id/expenses', { summary: 'Request an extra expense; server calculates net, rounded tax and total', roles: ['FOUNDER', 'FINANCE', 'PLANNER', 'COORDINATOR'], body: f.expenseInput, response: f.expenseDto, guard: weddingGuard, handler: ({ tx, user, params, body }) => service.createExpense(tx, user, params.id!, body) });
  route('get', '/weddings/:id/expenses', { summary: 'List expenses; clients see only chargeable descriptions and their explicit client charge', query: c.pageQuery, response: c.listOf(f.visibleExpenseDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const where = { weddingId: params.id!, ...(user.role === 'CLIENT' ? { clientCharge: { gt: 0 } } : {}) };
    return { data: (await tx.additionalExpense.findMany({ where, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize })).map(p => service.presentExpense(p, user)), ...query, total: await tx.additionalExpense.count({ where }) };
  } });
  route('post', '/expenses/:id/client-approve', { summary: 'Linked client explicitly accepts their additional charge without viewing internal costs', roles: ['CLIENT'], response: f.clientExpenseDto, guard: expenseGuard, async handler({ tx, user, params }) {
    const before = await service.expenseAccess(tx, user, params.id!, true);
    if (before.status !== 'PENDING') throw new ApiError(409, 'EXPENSE_REVIEWED', 'Only pending charges may receive client approval');
    if (before.clientApprovedAt) return service.presentExpense(before, user);
    const row = await tx.additionalExpense.update({ where: { id: before.id }, data: { clientApprovedBy: user.id, clientApprovedAt: new Date() } });
    await audit(tx, user.id, 'CLIENT_EXTRA_ACCEPTED', row.id, row.weddingId, { clientCharge: row.clientCharge.toFixed(2) }); return service.presentExpense(row, user);
  } });
  for (const [action, approve] of [['approve', true], ['reject', false]] as const) route('post', `/expenses/:id/${action}`, { summary: `Finance ${action}s an extra expense`, roles: [...finance], body: f.reviewNoteInput, response: f.expenseDto, guard: expenseGuard, handler: ({ tx, user, params, body }) => service.approveExpense(tx, user, params.id!, body.note, approve) });
  route('post', '/weddings/:id/vendor-contracts', { summary: 'Finance approves a manual amount only for a client-provided vendor without a selected quote', roles: [...finance], body: f.contractInput.extend({ weddingVendorId: c.uuid }), response: f.contractDto, guard: weddingGuard, async handler({ tx, user, params, body }) {
    await lockWedding(tx, user, params.id!); const row = await service.vendorAssociation(tx, params.id!, body.weddingVendorId);
    if (row.quotationId || row.contractApprovedAt) throw new ApiError(409, 'CONTRACT_ALREADY_SET', 'Selected quotations and approved manual contracts are immutable');
    const result = await tx.weddingVendor.update({ where: { id: row.id }, data: { manualContractAmount: body.amount, contractApprovedBy: user.id, contractApprovedAt: new Date(), contractNote: body.note } });
    await audit(tx, user.id, 'VENDOR_CONTRACT_APPROVED', row.id, row.weddingId, { amount: body.amount, note: body.note });
    return { weddingVendorId: row.id, weddingId: row.weddingId, amount: result.manualContractAmount!.toFixed(2), approvedAt: result.contractApprovedAt!.toISOString() };
  } });
  route('post', '/weddings/:id/vendor-bills', { summary: 'Submit one final bill per wedding vendor; invoice references must be unique', roles: [...finance], body: f.billInput, response: f.billDto, guard: weddingGuard, handler: ({ tx, user, params, body }) => service.createBill(tx, user, params.id!, body) });
  route('get', '/weddings/:id/vendor-bills', { summary: 'Paginate internal vendor bills', roles: [...finance], query: c.pageQuery, response: c.listOf(f.billDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!); const where = { weddingId: params.id! };
    return { data: (await tx.vendorBill.findMany({ where, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize })).map(service.presentBill), ...query, total: await tx.vendorBill.count({ where }) };
  } });
  route('patch', '/vendor-bills/:id', { summary: 'Correct an unverified final bill; verified bills are immutable', roles: [...finance], body: f.billInput.omit({ weddingVendorId: true }), response: f.billDto, guard: billGuard, async handler({ tx, user, params, body }) {
    const row = await service.billAccess(tx, user, params.id!, true);
    if (row.verifiedAt) throw new ApiError(409, 'BILL_VERIFIED', 'Verified bills cannot be edited');
    if (body.documentId) { const { requireDocument } = await import('../services/documents.js'); await requireDocument(tx, row.weddingId, body.documentId, 'VENDOR_BILL'); }
    const next = await tx.vendorBill.update({ where: { id: row.id }, data: { ...body, dueAt: new Date(body.dueAt) } });
    await audit(tx, user.id, 'VENDOR_BILL_CORRECTED', row.id, row.weddingId, { previousAmount: row.amount.toFixed(2), amount: next.amount.toFixed(2) }); return service.presentBill(next);
  } });
  route('post', '/vendor-bills/:id/verify', { summary: 'Verify final bill against original contract plus approved extras', roles: [...finance], body: f.paymentReviewInput, response: f.billDto, guard: billGuard, handler: ({ tx, user, params, body }) => service.verifyBill(tx, user, params.id!, body.note) });
  route('get', '/weddings/:id/reconciliation', { summary: 'Compare quote, approved extras, final bill, advances, final payments and remaining payable', roles: [...finance], response: z.array(f.reconciliationDto), handler: ({ tx, user, params }) => service.reconciliation(tx, user, params.id!) });
  route('post', '/weddings/:id/revenue-recognitions', { summary: 'Explicitly post earned revenue under the approved policy; receipts alone never recognize revenue', roles: [...finance], body: f.recognitionInput, response: f.recognitionDto, guard: weddingGuard, handler: ({ tx, user, params, body }) => service.recognizeRevenue(tx, user, params.id!, body) });
  route('get', '/weddings/:id/revenue-recognitions', { summary: 'Paginate immutable revenue postings and reversal state', roles: [...finance], query: c.pageQuery, response: c.listOf(f.recognitionDto), async handler({ tx, user, params, query }) { await weddingAccess(tx, user, params.id!); const where = { weddingId: params.id! }; return { data: (await tx.revenueRecognition.findMany({ where, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize })).map(service.presentRecognition), ...query, total: await tx.revenueRecognition.count({ where }) }; } });
  route('post', '/revenue-recognitions/:id/reverse', { summary: 'Reverse a revenue posting with retained policy and audit evidence', roles: [...finance], body: f.reviewNoteInput, response: f.recognitionDto, async guard({ tx, user, params }) { const row = await tx.revenueRecognition.findUnique({ where: { id: params.id } }); if (!row) throw missing(); await weddingAccess(tx, user, row.weddingId); }, async handler({ tx, user, params, body }) {
    const before = await tx.revenueRecognition.findUniqueOrThrow({ where: { id: params.id } }); await lockWedding(tx, user, before.weddingId);
    const row = await tx.revenueRecognition.findUniqueOrThrow({ where: { id: before.id } }); if (row.reversedAt) throw new ApiError(409, 'RECOGNITION_REVERSED', 'Revenue posting already reversed');
    const reversed = await tx.revenueRecognition.update({ where: { id: row.id }, data: { reversedBy: user.id, reversedAt: new Date(), reversalNote: body.note } }); await audit(tx, user.id, 'REVENUE_REVERSED', row.id, row.weddingId, { note: body.note }); return service.presentRecognition(reversed);
  } });
  route('post', '/labour-rates', { summary: 'Founder approves an explicit team hourly rate; no default rates', roles: ['FOUNDER'], body: f.labourRateInput, response: f.labourRateDto, async handler({ tx, user, body }) { const member = await tx.userProfile.findUnique({ where: { id: body.userId } }); if (!member?.active || member.role === 'CLIENT') throw new ApiError(400, 'INVALID_STAFF', 'Active staff profile required'); const row = await tx.labourRate.create({ data: { ...body, effectiveFrom: new Date(body.effectiveFrom), approvedBy: user.id } }); await audit(tx, user.id, 'LABOUR_RATE_APPROVED', row.id, null, { userId: row.userId, currency: row.currency, hourlyRate: row.hourlyRate.toFixed(2) }); return row; } });
  route('get', '/labour-rates', { summary: 'Finance lists approved internal team rates', roles: [...finance], query: c.pageQuery, response: c.listOf(f.labourRateDto), async handler({ tx, query }) { return { data: await tx.labourRate.findMany({ orderBy: [{ effectiveFrom: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), ...query, total: await tx.labourRate.count() }; } });
  route('post', '/weddings/:id/labour', { summary: 'Assigned team submits time against an approved rate; finance may submit for the team', roles: ['FOUNDER', 'FINANCE', 'PLANNER', 'COORDINATOR'], body: f.labourInput, response: f.labourDto, guard: weddingGuard, handler: ({ tx, user, params, body }) => service.createLabour(tx, user, params.id!, body) });
  route('get', '/weddings/:id/labour', { summary: 'Finance paginates time and cost history', roles: [...finance], query: c.pageQuery, response: c.listOf(f.labourDto), async handler({ tx, user, params, query }) { await weddingAccess(tx, user, params.id!); const where = { weddingId: params.id! }; return { data: (await tx.labourEntry.findMany({ where, orderBy: [{ workedAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize })).map(service.presentLabour), ...query, total: await tx.labourEntry.count({ where }) }; } });
  for (const [action, approve] of [['approve', true], ['reject', false]] as const) route('post', `/labour/:id/${action}`, { summary: `Finance ${action}s team time and calculated labour cost`, roles: [...finance], body: f.reviewNoteInput, response: f.labourDto, async guard({ tx, user, params }) { const row = await tx.labourEntry.findUnique({ where: { id: params.id } }); if (!row) throw missing(); await weddingAccess(tx, user, row.weddingId); }, async handler({ tx, user, params, body }) {
    const before = await tx.labourEntry.findUniqueOrThrow({ where: { id: params.id } }); await lockWedding(tx, user, before.weddingId);
    const row = await tx.labourEntry.findUniqueOrThrow({ where: { id: before.id } }); if (row.status !== 'PENDING') throw new ApiError(409, 'LABOUR_REVIEWED', 'Only pending labour may be reviewed');
    const updated = await tx.labourEntry.update({ where: { id: row.id }, data: { status: approve ? 'APPROVED' : 'REJECTED', reviewedBy: user.id, reviewedAt: new Date(), reviewNote: body.note } }); await audit(tx, user.id, approve ? 'LABOUR_APPROVED' : 'LABOUR_REJECTED', row.id, row.weddingId, { cost: row.cost.toFixed(2), note: body.note }); return service.presentLabour(updated);
  } });
  route('get', '/weddings/:id/profitability', { summary: 'Separate earned revenue, costs, cash, receivables and payables under explicit assumptions', roles: [...finance], response: f.profitabilityDto, handler: ({ tx, user, params }) => service.profitability(tx, user, params.id!) });
  route('get', '/reports/founder-dashboard', { summary: 'Filter season performance by wedding date and wedding UUID; totals are separated by currency', roles: ['FOUNDER'], query: f.reportQuery, response: f.dashboardDto, handler: ({ tx, user, query }) => service.dashboard(tx, user, query) });
}

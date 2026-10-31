/**
 * =============================================================================
 * File: planning.ts
 * Module: Domain Business Logic Service
 * =============================================================================
 * Executes core wedding management business rules, transactional database operations, calculations, and validations for planning.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { Prisma, type BookingPayment, type TaskGeneration, type UserProfile } from '@prisma/client';
import type { z } from 'zod';
import * as w from '../workflow-contracts.js';
import { audit, weddingAccess, type Tx } from '../access.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { assertOwner, lockWedding, mutableWedding } from './workflow-access.js';
import { requireDocument } from './documents.js';
import { templatesFor } from '../task-templates.js';

/**
 * Serializes task generation run metadata.
 */
export function presentGeneration(row: TaskGeneration) { return { id: row.id, weddingId: row.weddingId, templateVersion: row.templateVersion, packageType: row.packageType, dateBasis: row.dateBasis.toISOString().slice(0, 10), taskCount: row.taskCount, createdAt: row.createdAt.toISOString() }; }
/**
 * Formats a booking deposit payment record.
 */
export function presentPayment(row: BookingPayment) { return { id: row.id, weddingId: row.weddingId, amount: row.amount.toFixed(2), currency: row.currency, reference: row.reference, status: row.status, evidenceDocumentId: row.evidenceDocumentId, createdAt: row.createdAt.toISOString(), reviewedAt: row.reviewedAt?.toISOString() ?? null }; }

/**
 * Generates package-specific wedding planning tasks based on relative deadlines to the wedding date.
 * Triggers once deposit is verified and wedding date is confirmed.
 *
 * @param tx - Prisma transaction
 * @param user - Acting user
 * @param weddingId - Target wedding ID
 * @param automatic - Whether triggered by an automated lifecycle transition
 */
export async function generateTasks(tx: Tx, user: UserProfile, weddingId: string, automatic = false) {
  const wedding = await mutableWedding(tx, user, weddingId);
  const existing = await tx.taskGeneration.findUnique({ where: { weddingId } });
  if (existing) return presentGeneration(existing);
  let reason: string | null = wedding.proposalStatus !== 'CONFIRMED' ? 'PROPOSAL_UNCONFIRMED' : null;
  const paid = await tx.bookingPayment.aggregate({ where: { weddingId, status: 'VERIFIED', direction: 'CLIENT_RECEIPT', milestone: 'BOOKING', currency: wedding.currency }, _sum: { amount: true } });
  if (!reason && (!wedding.bookingDepositRequired || (paid._sum.amount ?? new Prisma.Decimal(0)).lt(wedding.bookingDepositRequired))) reason = 'DEPOSIT_UNVERIFIED';
  if (!reason && !wedding.weddingDate) reason = 'WEDDING_DATE_REQUIRED';
  if (reason) {
    if (automatic) return null;
    throw new ApiError(409, reason, 'Confirm the proposal, verify the required deposit and set the wedding date before generating tasks');
  }
  const template = templatesFor(wedding.packageType);
  const functions = new Map<string, string>();
  for (const [type, name] of [['MEHENDI', 'Mehendi'], ['SANGEET', 'Sangeet'], ['RECEPTION', 'Reception']] as const) {
    let row = await tx.weddingFunction.findFirst({ where: { weddingId, type }, orderBy: { id: 'asc' } });
    row ??= await tx.weddingFunction.upsert({ where: { weddingId_name: { weddingId, name } }, create: { weddingId, type, name }, update: {} });
    if (row.type !== type) throw new ApiError(409, 'FUNCTION_NAME_CONFLICT', 'A function name conflicts with its template type');
    functions.set(type, row.id);
  }
  const owner = await tx.weddingAssignment.findFirst({ where: { weddingId, user: { active: true, role: 'PLANNER' } }, orderBy: { userId: 'asc' } });
  const generation = await tx.taskGeneration.create({ data: { weddingId, templateVersion: template.version, packageType: wedding.packageType, dateBasis: wedding.weddingDate!, taskCount: template.tasks.length, createdBy: user.id } });
  for (const item of template.tasks) {
    // Template dates use 17:00 Asia/Kolkata on the relative calendar day.
    const deadline = new Date(`${wedding.weddingDate!.toISOString().slice(0, 10)}T11:30:00.000Z`);
    deadline.setUTCDate(deadline.getUTCDate() + item.days);
    await tx.weddingTask.create({ data: { weddingId, generationId: generation.id, templateKey: item.key, title: item.title, description: item.description, category: item.category, deadline, ownerId: owner?.userId ?? null, functionId: item.functionType ? functions.get(item.functionType) : null } });
  }
  await tx.wedding.update({ where: { id: weddingId }, data: { state: 'PLANNING' } });
  await audit(tx, user.id, 'BOOKING_CONFIRMED', weddingId, weddingId, { verifiedDeposit: paid._sum.amount!.toFixed(2), requiredDeposit: wedding.bookingDepositRequired!.toFixed(2) });
  await audit(tx, user.id, 'TASKS_GENERATED', generation.id, weddingId, { templateVersion: template.version, taskCount: generation.taskCount, packageType: wedding.packageType });
  return presentGeneration(generation);
}
/**
 * Confirms a wedding proposal, locks required booking deposit, and sets lifecycle state.
 *
 * @param tx - Prisma transaction
 * @param user - Acting planner
 * @param weddingId - Target wedding ID
 * @param body - Deposit amount and currency
 */
export async function confirmProposal(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof w.proposalInput>) {
  const wedding = await mutableWedding(tx, user, weddingId);
  if (wedding.proposalStatus === 'CONFIRMED') throw new ApiError(409, 'PROPOSAL_ALREADY_CONFIRMED', 'The proposal is already confirmed');
  const finance = await tx.financeSettings.findUnique({ where: { weddingId } });
  if (finance && finance.contractedRevenue.lt(body.bookingDepositRequired)) throw new ApiError(409, 'DEPOSIT_EXCEEDS_CONTRACT', 'Booking deposit cannot exceed the approved client contract');
  const row = await tx.wedding.update({ where: { id: weddingId }, data: { proposalStatus: 'CONFIRMED', proposalConfirmedAt: new Date(), proposalConfirmedBy: user.id, bookingDepositRequired: body.bookingDepositRequired, ...(wedding.state === 'ENQUIRY' ? { state: 'PROPOSAL' as const } : {}) } });
  await audit(tx, user.id, 'PROPOSAL_CONFIRMED', weddingId, weddingId, { bookingDepositRequired: row.bookingDepositRequired!.toFixed(2), currency: row.currency });
  return { weddingId, status: 'CONFIRMED', currency: row.currency, bookingDepositRequired: row.bookingDepositRequired!.toFixed(2), confirmedAt: row.proposalConfirmedAt!.toISOString(), taskGeneration: await generateTasks(tx, user, weddingId, true) };
}
/**
 * Records a client claim of booking deposit payment with evidence document.
 *
 * @param tx - Prisma transaction
 * @param user - Client or planner
 * @param weddingId - Wedding ID
 * @param body - Payment details and reference
 */
export async function claimPayment(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof w.paymentInput>) {
  const wedding = await mutableWedding(tx, user, weddingId);
  if (body.evidenceDocumentId) {
    const document = await requireDocument(tx, weddingId, body.evidenceDocumentId, 'PAYMENT_EVIDENCE');
    if (user.role === 'CLIENT' && document.uploadedBy !== user.id) throw forbidden();
  }
  const row = await tx.bookingPayment.create({ data: { ...body, weddingId, currency: wedding.currency, claimedBy: user.id } });
  await audit(tx, user.id, 'BOOKING_PAYMENT_CLAIMED', row.id, weddingId);
  return presentPayment(row);
}
/**
 * Enforces access controls for booking payment records.
 */
export async function paymentAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.bookingPayment.findUnique({ where: { id } });
  if (!row || row.direction !== 'CLIENT_RECEIPT' || row.milestone !== 'BOOKING') throw missing();
  if (write) await lockWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  return tx.bookingPayment.findUniqueOrThrow({ where: { id } });
}
/**
 * Verifies or rejects a claimed booking deposit payment.
 *
 * @param tx - Prisma transaction
 * @param user - Reviewing user (Finance/Founder)
 * @param id - Payment ID
 * @param note - Review notes
 * @param verified - True to approve, false to reject
 */
export async function decidePayment(tx: Tx, user: UserProfile, id: string, note: string, verified: boolean) {
  const before = await paymentAccess(tx, user, id, true);
  if (before.status !== 'CLAIMED') throw new ApiError(409, 'PAYMENT_ALREADY_REVIEWED', 'Only unreviewed claims may be verified or rejected');
  const row = await tx.bookingPayment.update({ where: { id }, data: { status: verified ? 'VERIFIED' : 'REJECTED', reviewedBy: user.id, reviewedAt: new Date(), reviewNote: note, verificationMethod: verified ? 'MANUAL_BANK_REVIEW' : null } });
  await audit(tx, user.id, verified ? 'BOOKING_PAYMENT_VERIFIED' : 'BOOKING_PAYMENT_REJECTED', id, row.weddingId, { method: 'MANUAL_BANK_REVIEW', reference: row.reference, note });
  const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: row.weddingId } });
  return { payment: presentPayment(row), taskGeneration: verified && !['COMPLETED', 'CANCELLED'].includes(wedding.state) ? await generateTasks(tx, user, row.weddingId, true) : null };
}
/**
 * Enforces access control and checks lock status for wedding tasks.
 */
export async function taskAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.weddingTask.findUnique({ where: { id } });
  if (!row) throw missing();
  if (write) await mutableWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  return tx.weddingTask.findUniqueOrThrow({ where: { id } });
}
/**
 * Updates task attributes including status, assignee, deadline, or completion timestamp.
 *
 * @param tx - Prisma transaction
 * @param user - Acting user
 * @param id - Task ID
 * @param body - Update parameters
 */
export async function updateTask(tx: Tx, user: UserProfile, id: string, body: z.infer<typeof w.taskPatch>) {
  const before = await taskAccess(tx, user, id, true);
  if (user.role === 'COORDINATOR' && (before.ownerId !== user.id || Object.keys(body).some(key => key !== 'status'))) throw forbidden();
  if (body.ownerId) await assertOwner(tx, before.weddingId, body.ownerId);
  if (body.functionId && !await tx.weddingFunction.findFirst({ where: { id: body.functionId, weddingId: before.weddingId } })) throw new ApiError(400, 'INVALID_FUNCTION', 'Function must belong to the same wedding');
  const row = await tx.weddingTask.update({ where: { id }, data: { ...body, ...(body.deadline ? { deadline: new Date(body.deadline) } : {}), ...(body.status ? { completedAt: body.status === 'DONE' ? before.completedAt ?? new Date() : null } : {}) } });
  await audit(tx, user.id, 'TASK_UPDATED', id, row.weddingId, { previousStatus: before.status, previousOwnerId: before.ownerId, previousDeadline: before.deadline.toISOString(), previousCompletedAt: before.completedAt?.toISOString() ?? null, status: row.status, ownerId: row.ownerId, deadline: row.deadline.toISOString(), completedAt: row.completedAt?.toISOString() ?? null });
  return row;
}

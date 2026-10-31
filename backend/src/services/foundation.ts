/**
 * =============================================================================
 * File: foundation.ts
 * Module: Domain Business Logic Service
 * =============================================================================
 * Executes core wedding management business rules, transactional database operations, calculations, and validations for foundation.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { Prisma, type UserProfile } from '@prisma/client';
import type { z } from 'zod';
import * as c from '../contracts.js';
import { audit, weddingAccess, weddingFilter, weddingInclude, type Tx } from '../access.js';
import { ApiError, missing } from '../errors.js';

/**
 * Generates Prisma where filter scoping client queries to caller permissions.
 *
 * @param user - Current user
 */
export function clientFilter(user: UserProfile): Prisma.ClientWhereInput {
  return { archivedAt: null, ...(user.role === 'FOUNDER' ? {} : { weddings: { some: { wedding: weddingFilter(user) } } }) };
}
/**
 * Validates that all requested client IDs exist, are active, and belong to caller scope.
 *
 * @param tx - Prisma transaction
 * @param user - Current user
 * @param clientIds - Array of client IDs to verify
 */
export async function assertClients(tx: Tx, user: UserProfile, clientIds: string[]) {
  // Share the same row locks as archiving, in stable order, to avoid linking archived contacts.
  await tx.$queryRaw`SELECT id FROM app."Client" WHERE id IN (${Prisma.join(clientIds.map(id => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR UPDATE`;
  const count = await tx.client.count({ where: { id: { in: clientIds }, archivedAt: null,
    ...(user.role === 'FOUNDER' ? {} : { OR: [{ weddings: { none: {} } }, { weddings: { some: { wedding: weddingFilter(user) } } }] }) } });
  if (count !== clientIds.length) throw new ApiError(400, 'INVALID_CLIENTS', 'One or more client contacts are unavailable');
}
/**
 * Core service to initialize a destination wedding, link client contacts, and assign planners.
 *
 * @param tx - Prisma transaction
 * @param user - Acting user
 * @param body - Wedding configuration payload
 * @param enquiry - Optional enquiry metadata
 */
export async function createWedding(tx: Tx, user: UserProfile, body: z.infer<typeof c.createWeddingInput>, enquiry?: { source?: string | null; internalNotes?: string | null }) {
  await assertClients(tx, user, body.clientIds);
  const wedding = await tx.wedding.create({ data: {
    ...body.wedding, weddingDate: body.wedding.weddingDate ? new Date(body.wedding.weddingDate) : null,
    clients: { create: body.clientIds.map(clientId => ({ clientId })) },
    ...(user.role === 'PLANNER' ? { assignments: { create: { userId: user.id } } } : {}),
    ...(enquiry ? { enquiry: { create: { ...enquiry, ...(user.role === 'PLANNER' ? { assignedToId: user.id } : {}) } } } : {}),
  }, include: { ...weddingInclude, enquiry: true } });
  await audit(tx, user.id, enquiry ? 'ENQUIRY_CREATED' : 'WEDDING_CREATED', wedding.enquiry?.id ?? wedding.id, wedding.id);
  return wedding;
}
/**
 * Soft-deletes a wedding after asserting that no immutable financial records exist.
 *
 * @param tx - Prisma transaction
 * @param user - Acting user
 * @param id - Wedding ID to archive
 */
export async function archiveWedding(tx: Tx, user: UserProfile, id: string) {
  const wedding = await weddingAccess(tx, user, id, true);
  if (!['ENQUIRY', 'PROPOSAL', 'CANCELLED'].includes(wedding.state)) throw new ApiError(409, 'WEDDING_IN_USE', 'Only provisional or cancelled weddings can be archived');
  if (await tx.financeSettings.count({ where: { weddingId: id } }) || await tx.bookingPayment.count({ where: { weddingId: id } }) || await tx.additionalExpense.count({ where: { weddingId: id } }) || await tx.vendorBill.count({ where: { weddingId: id } }) || await tx.labourEntry.count({ where: { weddingId: id } })) throw new ApiError(409, 'FINANCIAL_HISTORY_EXISTS', 'Weddings with financial history must remain visible for reconciliation and reporting');
  const active = await tx.consultation.count({ where: { weddingId: id, state: { in: ['REQUESTED', 'CONFIRMED'] } } });
  if (active) throw new ApiError(409, 'ACTIVE_CONSULTATIONS', 'Cancel or complete outstanding consultations before archiving');
  const row = await tx.wedding.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(tx, user.id, 'WEDDING_ARCHIVED', id, id);
  return { id, archivedAt: row.archivedAt!.toISOString() };
}
/**
 * Soft-deletes an unlinked client contact.
 *
 * @param tx - Prisma transaction
 * @param user - Acting user
 * @param id - Client ID to archive
 */
export async function archiveClient(tx: Tx, user: UserProfile, id: string) {
  await tx.$queryRaw`SELECT id FROM app."Client" WHERE id = ${id}::uuid FOR UPDATE`;
  const client = await tx.client.findUnique({ where: { id } });
  if (!client || client.archivedAt) throw missing();
  if (await tx.weddingClient.count({ where: { clientId: id, wedding: { archivedAt: null } } })) throw new ApiError(409, 'CLIENT_IN_USE', 'Archive linked weddings before archiving this contact');
  const row = await tx.client.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(tx, user.id, 'CLIENT_ARCHIVED', id, null);
  return { id, archivedAt: row.archivedAt!.toISOString() };
}

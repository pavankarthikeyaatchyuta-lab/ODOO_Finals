import { Prisma, type UserProfile } from '@prisma/client';
import type { z } from 'zod';
import * as c from '../contracts.js';
import { audit, weddingAccess, weddingFilter, weddingInclude, type Tx } from '../access.js';
import { ApiError, missing } from '../errors.js';

export function clientFilter(user: UserProfile): Prisma.ClientWhereInput {
  return { archivedAt: null, ...(user.role === 'FOUNDER' ? {} : { weddings: { some: { wedding: weddingFilter(user) } } }) };
}
export async function assertClients(tx: Tx, user: UserProfile, clientIds: string[]) {
  // Share the same row locks as archiving, in stable order, to avoid linking archived contacts.
  await tx.$queryRaw`SELECT id FROM app."Client" WHERE id IN (${Prisma.join(clientIds.map(id => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR UPDATE`;
  const count = await tx.client.count({ where: { id: { in: clientIds }, archivedAt: null,
    ...(user.role === 'FOUNDER' ? {} : { OR: [{ weddings: { none: {} } }, { weddings: { some: { wedding: weddingFilter(user) } } }] }) } });
  if (count !== clientIds.length) throw new ApiError(400, 'INVALID_CLIENTS', 'One or more client contacts are unavailable');
}
export async function createWedding(tx: Tx, user: UserProfile, body: z.infer<typeof c.createWeddingInput>, enquiry?: { source?: string | null; internalNotes?: string | null }) {
  await assertClients(tx, user, body.clientIds);
  const wedding = await tx.wedding.create({ data: {
    ...body.wedding, weddingDate: body.wedding.weddingDate ? new Date(body.wedding.weddingDate) : null,
    clients: { create: body.clientIds.map(clientId => ({ clientId })) },
    ...(user.role === 'PLANNER' ? { assignments: { create: { userId: user.id } } } : {}),
    ...(enquiry ? { enquiry: { create: enquiry } } : {}),
  }, include: { ...weddingInclude, enquiry: true } });
  await audit(tx, user.id, enquiry ? 'ENQUIRY_CREATED' : 'WEDDING_CREATED', wedding.enquiry?.id ?? wedding.id, wedding.id);
  return wedding;
}
export async function archiveWedding(tx: Tx, user: UserProfile, id: string) {
  const wedding = await weddingAccess(tx, user, id, true);
  if (!['ENQUIRY', 'PROPOSAL', 'CANCELLED'].includes(wedding.state)) throw new ApiError(409, 'WEDDING_IN_USE', 'Only provisional or cancelled weddings can be archived');
  const active = await tx.consultation.count({ where: { weddingId: id, state: { in: ['REQUESTED', 'CONFIRMED'] } } });
  if (active) throw new ApiError(409, 'ACTIVE_CONSULTATIONS', 'Cancel or complete outstanding consultations before archiving');
  const row = await tx.wedding.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(tx, user.id, 'WEDDING_ARCHIVED', id, id);
  return { id, archivedAt: row.archivedAt!.toISOString() };
}
export async function archiveClient(tx: Tx, user: UserProfile, id: string) {
  await tx.$queryRaw`SELECT id FROM app."Client" WHERE id = ${id}::uuid FOR UPDATE`;
  const client = await tx.client.findUnique({ where: { id } });
  if (!client || client.archivedAt) throw missing();
  if (await tx.weddingClient.count({ where: { clientId: id, wedding: { archivedAt: null } } })) throw new ApiError(409, 'CLIENT_IN_USE', 'Archive linked weddings before archiving this contact');
  const row = await tx.client.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(tx, user.id, 'CLIENT_ARCHIVED', id, null);
  return { id, archivedAt: row.archivedAt!.toISOString() };
}

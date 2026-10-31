import type { UserProfile } from '@prisma/client';
import { weddingAccess, type Tx } from '../access.js';
import { ApiError, forbidden } from '../errors.js';

export async function lockWedding(tx: Tx, user: UserProfile, id: string) {
  await tx.$queryRaw`SELECT id FROM app."Wedding" WHERE id = ${id}::uuid FOR UPDATE`;
  return weddingAccess(tx, user, id);
}
export async function mutableWedding(tx: Tx, user: UserProfile, id: string) {
  const wedding = await lockWedding(tx, user, id);
  if (['CANCELLED', 'COMPLETED'].includes(wedding.state)) throw new ApiError(409, 'WEDDING_CLOSED', 'This wedding is closed');
  return wedding;
}
export async function agreementGate(tx: Tx, weddingId: string) {
  if ((await tx.agreement.findUnique({ where: { weddingId } }))?.status !== 'SIGNED') throw new ApiError(403, 'AGREEMENT_REQUIRED', 'A verified signed agreement is required before sharing vendor lists or floor plans');
}
export async function assertOwner(tx: Tx, weddingId: string, ownerId: string) {
  const assigned = await tx.weddingAssignment.findUnique({ where: { weddingId_userId: { weddingId, userId: ownerId } }, include: { user: true } });
  if (!assigned?.user.active || !['FOUNDER', 'PLANNER', 'COORDINATOR'].includes(assigned.user.role)) throw new ApiError(400, 'INVALID_OWNER', 'Task owner must be active planning staff assigned to this wedding');
}
export function planningWriter(user: UserProfile) { if (!['FOUNDER', 'PLANNER'].includes(user.role)) throw forbidden(); }

import { Prisma, type UserProfile } from '@prisma/client';
import { forbidden, missing } from './errors.js';

export type Tx = Prisma.TransactionClient;
/**
 * Builds Prisma query filter ensuring role-based data isolation across weddings.
 * Founders access all non-archived weddings; clients and planners access assigned weddings only.
 *
 * @param user - Current authenticated user profile
 * @param includeArchived - Whether to include soft-deleted / archived records
 */
export function weddingFilter(user: UserProfile, includeArchived = false): Prisma.WeddingWhereInput {
  const visible = includeArchived ? {} : { archivedAt: null };
  if (user.role === 'FOUNDER') return visible;
  if (user.role === 'CLIENT') return { ...visible, clients: { some: { client: { userId: user.id, archivedAt: null } } } };
  return { ...visible, assignments: { some: { userId: user.id } } };
}
/**
 * Enforces wedding access controls and optional row locking for write transactions.
 *
 * @param tx - Prisma transaction client
 * @param user - Authenticated user profile
 * @param id - Wedding identifier
 * @param write - Whether to acquire exclusive row lock for update
 * @param includeArchived - Whether archived records are permissible
 */
export async function weddingAccess(tx: Tx, user: UserProfile, id: string, write = false, includeArchived = false) {
  if (write) await tx.$queryRaw`SELECT id FROM app."Wedding" WHERE id = ${id}::uuid FOR UPDATE`;
  const wedding = await tx.wedding.findFirst({ where: { id, ...weddingFilter(user, includeArchived) } });
  if (!wedding) throw missing();
  if (write && !['FOUNDER', 'PLANNER'].includes(user.role)) throw forbidden();
  return wedding;
}
export const weddingInclude = { clients: true, assignments: true } satisfies Prisma.WeddingInclude;
type WeddingRow = Prisma.WeddingGetPayload<{ include: typeof weddingInclude }>;
/**
 * Sanitizes and formats wedding entity according to caller permissions (stripping internal notes for clients).
 *
 * @param row - Raw wedding database record
 * @param user - Requesting user profile
 */
export function presentWedding(row: WeddingRow, user: UserProfile) {
  const visible = {
    id: row.id, title: row.title, weddingDate: row.weddingDate?.toISOString().slice(0, 10) ?? null,
    packageType: row.packageType, state: row.state, guestCount: row.guestCount,
    preferredTheme: row.preferredTheme, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    coupleDetails: row.coupleDetails, location: row.location, requirements: row.requirements, currency: row.currency, proposalStatus: row.proposalStatus, timezone: row.timezone,
  };
  if (user.role === 'CLIENT') return visible;
  return { ...visible, internalNotes: row.internalNotes, clientIds: row.clients.map(c => c.clientId), assignedUserIds: row.assignments.map(a => a.userId),
    ...(['FOUNDER', 'FINANCE'].includes(user.role) ? { budgetMax: row.budgetMax?.toFixed(2) ?? null } : {}) };
}
/**
 * Serializes enquiry data with role-based field redactions.
 *
 * @param row - Enquiry database row
 * @param user - Requesting user profile
 */
export function presentEnquiry(row: Prisma.EnquiryGetPayload<{}>, user: UserProfile) {
  const visible = { id: row.id, weddingId: row.weddingId, stage: row.stage, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  return user.role === 'CLIENT' ? visible : { ...visible, source: row.source, internalNotes: row.internalNotes, followUpStatus: row.followUpStatus, followUpAt: row.followUpAt?.toISOString() ?? null, assignedToId: row.assignedToId };
}
/**
 * Formats consultation details stripping planner internal notes for clients.
 *
 * @param row - Consultation record
 * @param user - Requesting user profile
 */
export function presentConsultation(row: Prisma.ConsultationGetPayload<{}>, user: UserProfile) {
  const visible = { id: row.id, weddingId: row.weddingId, state: row.state, preferredAt: row.preferredAt.toISOString(), message: row.message,
    startAt: row.startAt?.toISOString() ?? null, endAt: row.endAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  return user.role === 'CLIENT' ? visible : { ...visible, plannerId: row.plannerId, internalNotes: row.internalNotes, requestedBy: row.requestedBy };
}
/**
 * Writes an immutable audit trail entry recording who did what and when.
 *
 * @param tx - Prisma transaction client
 * @param actorId - Acting user ID
 * @param action - Action event identifier
 * @param entityId - Affected entity identifier
 * @param weddingId - Optional associated wedding ID
 * @param details - Structured event metadata
 */
export async function audit(tx: Tx, actorId: string, action: string, entityId: string, weddingId: string | null, details: Prisma.InputJsonObject = {}) {
  await tx.auditLog.create({ data: { actorId, action, entityId, weddingId, details } });
}

import { Prisma, type UserProfile } from '@prisma/client';
import { forbidden, missing } from './errors.js';

export type Tx = Prisma.TransactionClient;
export function weddingFilter(user: UserProfile): Prisma.WeddingWhereInput {
  if (user.role === 'FOUNDER') return {};
  if (user.role === 'CLIENT') return { clients: { some: { client: { userId: user.id } } } };
  return { assignments: { some: { userId: user.id } } };
}
export async function weddingAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  if (write) await tx.$queryRaw`SELECT id FROM app."Wedding" WHERE id = ${id}::uuid FOR UPDATE`;
  const wedding = await tx.wedding.findFirst({ where: { id, ...weddingFilter(user) } });
  if (!wedding) throw missing();
  if (write && !['FOUNDER', 'PLANNER'].includes(user.role)) throw forbidden();
  return wedding;
}
export const weddingInclude = { clients: true, assignments: true } satisfies Prisma.WeddingInclude;
type WeddingRow = Prisma.WeddingGetPayload<{ include: typeof weddingInclude }>;
export function presentWedding(row: WeddingRow, user: UserProfile) {
  const visible = {
    id: row.id, title: row.title, weddingDate: row.weddingDate?.toISOString().slice(0, 10) ?? null,
    packageType: row.packageType, state: row.state, guestCount: row.guestCount,
    preferredTheme: row.preferredTheme, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
  if (user.role === 'CLIENT') return visible;
  return { ...visible, internalNotes: row.internalNotes, clientIds: row.clients.map(c => c.clientId), assignedUserIds: row.assignments.map(a => a.userId),
    ...(['FOUNDER', 'FINANCE'].includes(user.role) ? { budgetMax: row.budgetMax?.toFixed(2) ?? null } : {}) };
}
export function presentEnquiry(row: Prisma.EnquiryGetPayload<{}>, user: UserProfile) {
  const visible = { id: row.id, weddingId: row.weddingId, stage: row.stage, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  return user.role === 'CLIENT' ? visible : { ...visible, source: row.source, internalNotes: row.internalNotes };
}
export function presentConsultation(row: Prisma.ConsultationGetPayload<{}>, user: UserProfile) {
  const visible = { id: row.id, weddingId: row.weddingId, state: row.state, preferredAt: row.preferredAt.toISOString(), message: row.message,
    startAt: row.startAt?.toISOString() ?? null, endAt: row.endAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
  return user.role === 'CLIENT' ? visible : { ...visible, plannerId: row.plannerId, internalNotes: row.internalNotes, requestedBy: row.requestedBy };
}
export async function audit(tx: Tx, actorId: string, action: string, entityId: string, weddingId: string | null, details: Prisma.InputJsonObject = {}) {
  await tx.auditLog.create({ data: { actorId, action, entityId, weddingId, details } });
}

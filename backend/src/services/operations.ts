/**
 * =============================================================================
 * File: operations.ts
 * Module: Domain Business Logic Service
 * =============================================================================
 * Executes core wedding management business rules, transactional database operations, calculations, and validations for operations.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { Prisma, type ScheduleChange, type ScheduleNotification, type UserProfile, type VendorArrival } from '@prisma/client';
import type { z } from 'zod';
import * as o from '../operations-contracts.js';
import { audit, weddingAccess, type Tx } from '../access.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { assertOwner, mutableWedding } from './workflow-access.js';

export const eventInclude = { vendors: true, dependencies: true } satisfies Prisma.TimelineEventInclude;
type EventRow = Prisma.TimelineEventGetPayload<{ include: typeof eventInclude }>;
type Impact = z.infer<typeof o.impactDto>;
/**
 * Formats timeline event details including associated vendors and predecessor dependencies.
 */
export function presentEvent(row: EventRow) { return { id: row.id, weddingId: row.weddingId, functionId: row.functionId, title: row.title, plannedStart: row.plannedStart.toISOString(), plannedEnd: row.plannedEnd.toISOString(), actualStart: row.actualStart?.toISOString() ?? null, actualEnd: row.actualEnd?.toISOString() ?? null, ownerId: row.ownerId, status: row.status, version: row.version, vendorIds: row.vendors.map(v => v.vendorId).sort(), dependsOnIds: row.dependencies.map(d => d.dependsOnId).sort(), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }
/**
 * Formats a schedule change record along with impacted timeline event calculations.
 */
export function presentChange(row: ScheduleChange) { return { ...row, impacts: o.impactDto.array().parse(row.impacts), previousStart: row.previousStart.toISOString(), previousEnd: row.previousEnd.toISOString(), proposedStart: row.proposedStart.toISOString(), proposedEnd: row.proposedEnd.toISOString(), approvedAt: row.approvedAt?.toISOString() ?? null, decidedAt: row.decidedAt?.toISOString() ?? null, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() }; }
/**
 * Formats a closed-loop schedule instruction notification dispatched to a vendor or team member.
 */
export function presentNotification(row: ScheduleNotification) { return { id: row.id, weddingId: row.weddingId, changeId: row.changeId, vendorId: row.vendorId, userId: row.userId, instructionVersion: row.instructionVersion, instructions: o.impactDto.array().parse(row.instructions), deliveryStatus: row.deliveryStatus, status: row.status, sentAt: row.sentAt.toISOString(), acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null, problemDescription: row.problemDescription }; }
/**
 * Formats vendor arrival dock status and computes late arrival minutes.
 */
export function presentArrival(row: VendorArrival, now = Date.now()) {
  const late = Math.max(0, (row.actualAt?.getTime() ?? now) - row.expectedAt.getTime());
  return { ...row, expectedAt: row.expectedAt.toISOString(), actualAt: row.actualAt?.toISOString() ?? null, confirmedAt: row.confirmedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), isLate: late > 0, lateMinutes: Math.floor(late / 60000) };
}
/**
 * Checks access permissions to a timeline event with optimistic concurrency support.
 */
export async function eventAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.timelineEvent.findUnique({ where: { id } });
  if (!row) throw missing();
  if (write) await mutableWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  return tx.timelineEvent.findUniqueOrThrow({ where: { id }, include: eventInclude });
}
/**
 * Validates event dependencies, cycles, and vendor associations across the wedding DAG.
 */
async function validateEventLinks(tx: Tx, weddingId: string, id: string, start: Date, ownerId: string | null, functionId: string | null, vendorIds: string[], dependsOnIds: string[]) {
  if (ownerId) await assertOwner(tx, weddingId, ownerId);
  if (functionId && !await tx.weddingFunction.findFirst({ where: { id: functionId, weddingId } })) throw new ApiError(400, 'INVALID_FUNCTION', 'Function must belong to the wedding');
  if (await tx.weddingVendor.count({ where: { weddingId, vendorId: { in: vendorIds } } }) !== vendorIds.length) throw new ApiError(400, 'INVALID_VENDOR_ASSOCIATION', 'Events may reference only vendors explicitly associated with this wedding');
  const events = await tx.timelineEvent.findMany({ where: { weddingId }, include: { dependencies: true } });
  for (const dependency of dependsOnIds) {
    const parent = events.find(e => e.id === dependency);
    if (!parent || parent.id === id) throw new ApiError(400, 'INVALID_DEPENDENCY', 'Dependencies must be other events in the same wedding');
    if (parent.plannedEnd > start) throw new ApiError(409, 'DEPENDENCY_CONFLICT', 'An event must start after its predecessor finishes');
  }
  const graph = new Map(events.map(e => [e.id, e.dependencies.map(d => d.dependsOnId)])); graph.set(id, dependsOnIds);
  const visits = new Set<string>(), finished = new Set<string>();
  const visit = (node: string) => { if (visits.has(node)) throw new ApiError(400, 'DEPENDENCY_CYCLE', 'Event dependencies cannot contain a cycle'); if (finished.has(node)) return; visits.add(node); for (const parent of graph.get(node) ?? []) visit(parent); visits.delete(node); finished.add(node); };
  visit(id);
}
/**
 * Creates an execution timeline event and validates predecessor relationships.
 */
export async function createEvent(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof o.eventInput>) {
  await mutableWedding(tx, user, weddingId);
  const id = randomUUID();
  await validateEventLinks(tx, weddingId, id, new Date(body.plannedStart), body.ownerId ?? null, body.functionId ?? null, body.vendorIds, body.dependsOnIds);
  const row = await tx.timelineEvent.create({ data: { id, weddingId, title: body.title, functionId: body.functionId, ownerId: body.ownerId, plannedStart: new Date(body.plannedStart), plannedEnd: new Date(body.plannedEnd), vendors: { create: body.vendorIds.map(vendorId => ({ vendorId })) }, dependencies: { create: body.dependsOnIds.map(dependsOnId => ({ dependsOnId })) } }, include: eventInclude });
  await tx.wedding.update({ where: { id: weddingId }, data: { scheduleVersion: { increment: 1 } } });
  await audit(tx, user.id, 'TIMELINE_EVENT_CREATED', id, weddingId);
  return presentEvent(row);
}
/**
 * Updates timeline event details with optimistic version check.
 */
export async function updateEvent(tx: Tx, user: UserProfile, id: string, body: z.infer<typeof o.eventPatch>) {
  const before = await eventAccess(tx, user, id, true);
  if (before.version !== body.expectedVersion) throw new ApiError(409, 'STALE_EVENT_VERSION', 'Reload the event before editing');
  if (['DONE', 'CANCELLED'].includes(before.status)) throw new ApiError(409, 'EVENT_EXECUTION_CLOSED', 'Completed or cancelled execution records cannot be rewritten');
  const vendors = body.vendorIds ?? before.vendors.map(v => v.vendorId), dependencies = body.dependsOnIds ?? before.dependencies.map(d => d.dependsOnId);
  await validateEventLinks(tx, before.weddingId, id, before.plannedStart, body.ownerId === undefined ? before.ownerId : body.ownerId, body.functionId === undefined ? before.functionId : body.functionId, vendors, dependencies);
  if (body.vendorIds) { await tx.eventVendor.deleteMany({ where: { eventId: id } }); await tx.eventVendor.createMany({ data: vendors.map(vendorId => ({ eventId: id, weddingId: before.weddingId, vendorId })) }); }
  if (body.dependsOnIds) { await tx.eventDependency.deleteMany({ where: { eventId: id } }); await tx.eventDependency.createMany({ data: dependencies.map(dependsOnId => ({ eventId: id, weddingId: before.weddingId, dependsOnId })) }); }
  const row = await tx.timelineEvent.update({ where: { id }, data: { title: body.title, ownerId: body.ownerId, functionId: body.functionId, version: { increment: 1 } }, include: eventInclude });
  await tx.wedding.update({ where: { id: row.weddingId }, data: { scheduleVersion: { increment: 1 } } });
  await audit(tx, user.id, 'TIMELINE_EVENT_METADATA_UPDATED', id, row.weddingId, { previousVersion: before.version, version: row.version, previousVendorIds: before.vendors.map(v => v.vendorId), vendorIds: vendors, previousDependencies: before.dependencies.map(d => d.dependsOnId), dependsOnIds: dependencies, previousOwnerId: before.ownerId, ownerId: row.ownerId });
  return presentEvent(row);
}
/**
 * Records live execution timestamps (in-progress, done) as ceremonies take place.
 */
export async function recordExecution(tx: Tx, user: UserProfile, id: string, body: z.infer<typeof o.executionInput>) {
  const before = await eventAccess(tx, user, id, true);
  if (user.role === 'COORDINATOR' && (before.ownerId !== user.id || !['IN_PROGRESS', 'DONE'].includes(body.status))) throw forbidden();
  if (before.version !== body.expectedVersion) throw new ApiError(409, 'STALE_EVENT_VERSION', 'Reload the event before editing');
  if (['DONE', 'CANCELLED'].includes(before.status)) throw new ApiError(409, 'EVENT_EXECUTION_CLOSED', 'Completed or cancelled execution records cannot be rewritten');
  const start = body.actualStart === undefined ? before.actualStart ?? (body.status === 'IN_PROGRESS' ? new Date() : null) : body.actualStart ? new Date(body.actualStart) : null;
  const end = body.actualEnd === undefined ? before.actualEnd ?? (body.status === 'DONE' ? new Date() : null) : body.actualEnd ? new Date(body.actualEnd) : null;
  if ((start && start.getTime() > Date.now()) || (end && end.getTime() > Date.now()) || (end && (!start || end < start)) || (body.status === 'PLANNED' && (start || end)) || (body.status === 'IN_PROGRESS' && (!start || end)) || (body.status === 'DONE' && (!start || !end))) throw new ApiError(400, 'INVALID_ACTUAL_TIMES', 'Actual times must reflect a valid completed or in-progress event, never future times');
  const row = await tx.timelineEvent.update({ where: { id }, data: { status: body.status, actualStart: start, actualEnd: end, version: { increment: 1 } }, include: eventInclude });
  await tx.wedding.update({ where: { id: row.weddingId }, data: { scheduleVersion: { increment: 1 } } });
  await audit(tx, user.id, 'TIMELINE_EXECUTION_RECORDED', id, row.weddingId, { previousStatus: before.status, status: row.status, actualStart: start?.toISOString() ?? null, actualEnd: end?.toISOString() ?? null });
  return presentEvent(row);
}
/**
 * Proposes a timeline adjustment and calculates cascading ripple shifts for downstream dependencies.
 */
export async function proposeChange(tx: Tx, user: UserProfile, eventId: string, body: z.infer<typeof o.proposalInput>) {
  const source = await eventAccess(tx, user, eventId, true);
  const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: source.weddingId } });
  if (wedding.scheduleVersion !== body.expectedScheduleVersion) throw new ApiError(409, 'STALE_SCHEDULE_VERSION', 'Reload the schedule before proposing a change');
  const events = await tx.timelineEvent.findMany({ where: { weddingId: source.weddingId }, include: eventInclude });
  const affected = new Set([eventId]);
  for (let changed = true; changed;) { changed = false; for (const event of events) if (!affected.has(event.id) && event.dependencies.some(dep => affected.has(dep.dependsOnId))) { affected.add(event.id); changed = true; } }
  if (events.some(event => affected.has(event.id) && ['DONE', 'CANCELLED'].includes(event.status))) throw new ApiError(409, 'EVENT_EXECUTION_CLOSED', 'A schedule change cannot rewrite completed or cancelled affected events');
  const delta = Date.parse(body.proposedEnd) - source.plannedEnd.getTime();
  const impacts: Impact[] = events.filter(event => affected.has(event.id)).map(event => ({ eventId: event.id, title: event.title, previousStart: event.plannedStart.toISOString(), previousEnd: event.plannedEnd.toISOString(), proposedStart: event.id === eventId ? new Date(body.proposedStart).toISOString() : new Date(event.plannedStart.getTime() + (body.shiftDependents ? delta : 0)).toISOString(), proposedEnd: event.id === eventId ? new Date(body.proposedEnd).toISOString() : new Date(event.plannedEnd.getTime() + (body.shiftDependents ? delta : 0)).toISOString(), expectedVersion: event.version, vendorIds: event.vendors.map(v => v.vendorId), ownerId: event.ownerId }));
  const proposed = new Map(impacts.map(impact => [impact.eventId, impact]));
  for (const event of events) for (const dep of event.dependencies) {
    const parent = events.find(e => e.id === dep.dependsOnId)!;
    if (Date.parse(proposed.get(event.id)?.proposedStart ?? event.plannedStart.toISOString()) < Date.parse(proposed.get(parent.id)?.proposedEnd ?? parent.plannedEnd.toISOString())) throw new ApiError(409, 'DEPENDENCY_CONFLICT', 'The proposed timing conflicts with an explicit predecessor; review dependent shifts');
  }
  const row = await tx.scheduleChange.create({ data: { weddingId: source.weddingId, eventId, baseScheduleVersion: wedding.scheduleVersion, previousStart: source.plannedStart, previousEnd: source.plannedEnd, proposedStart: new Date(body.proposedStart), proposedEnd: new Date(body.proposedEnd), reason: body.reason, requestedBy: user.id, impacts } });
  await audit(tx, user.id, 'SCHEDULE_CHANGE_PROPOSED', row.id, row.weddingId, { impactedEventIds: impacts.map(i => i.eventId), previousStart: row.previousStart.toISOString(), proposedStart: row.proposedStart.toISOString() });
  return presentChange(row);
}
/**
 * Checks access control for a schedule change proposal.
 */
export async function changeAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.scheduleChange.findUnique({ where: { id } }); if (!row) throw missing();
  if (write) await mutableWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  return tx.scheduleChange.findUniqueOrThrow({ where: { id } });
}
/**
 * Approves or rejects a proposed schedule change with dual-approval enforcement.
 */
export async function decideChange(tx: Tx, user: UserProfile, id: string, note: string, approved: boolean) {
  const before = await changeAccess(tx, user, id, true);
  const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: before.weddingId } });
  if (before.status !== 'PROPOSED') throw new ApiError(409, 'CHANGE_ALREADY_DECIDED', 'Only proposed changes may be approved or rejected');
  if (approved && wedding.independentScheduleApproval && before.requestedBy === user.id) throw new ApiError(403, 'INDEPENDENT_APPROVAL_REQUIRED', 'Another authorized planner or founder must approve this change');
  if (approved && wedding.scheduleVersion !== before.baseScheduleVersion) throw new ApiError(409, 'STALE_SCHEDULE_VERSION', 'The schedule changed after this proposal; create a current proposal');
  const row = await tx.scheduleChange.update({ where: { id }, data: { status: approved ? 'APPROVED' : 'REJECTED', decidedBy: user.id, decidedAt: new Date(), decisionNote: note, ...(approved ? { approvedBy: user.id, approvedAt: new Date() } : {}) } });
  await audit(tx, user.id, approved ? 'SCHEDULE_CHANGE_APPROVED' : 'SCHEDULE_CHANGE_REJECTED', id, row.weddingId, { note });
  return presentChange(row);
}
/**
 * Publishes an approved schedule change, updates event timings, and issues targeted notifications.
 */
export async function publishChange(tx: Tx, user: UserProfile, id: string) {
  const before = await changeAccess(tx, user, id, true);
  const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: before.weddingId } });
  if (before.status !== 'APPROVED') throw new ApiError(409, 'CHANGE_NOT_APPROVED', 'Only approved, unpublished changes may be published');
  if (wedding.scheduleVersion !== before.baseScheduleVersion) throw new ApiError(409, 'STALE_SCHEDULE_VERSION', 'Schedule version changed before publication');
  if (wedding.independentScheduleApproval && before.requestedBy === before.approvedBy) throw new ApiError(409, 'APPROVAL_POLICY_CHANGED', 'This change requires an independent approval under the current policy');
  const impacts = o.impactDto.array().parse(before.impacts);
  for (const impact of impacts) {
    const changed = await tx.timelineEvent.updateMany({ where: { id: impact.eventId, weddingId: before.weddingId, version: impact.expectedVersion }, data: { plannedStart: new Date(impact.proposedStart), plannedEnd: new Date(impact.proposedEnd), version: { increment: 1 } } });
    if (changed.count !== 1) throw new ApiError(409, 'STALE_EVENT_VERSION', 'An affected event changed before publication');
  }
  const instructionVersion = wedding.scheduleVersion + 1;
  await tx.wedding.update({ where: { id: wedding.id }, data: { scheduleVersion: instructionVersion } });
  const vendors = new Set(impacts.flatMap(impact => impact.vendorIds));
  const staff = new Map<string, Impact[]>();
  for (const impact of impacts) if (impact.ownerId) staff.set(impact.ownerId, [...(staff.get(impact.ownerId) ?? []), impact]);
  const affectedFunctions = await tx.timelineEvent.findMany({ where: { id: { in: impacts.map(i => i.eventId) } }, select: { functionId: true } });
  const arrivals = await tx.vendorArrival.findMany({ where: { weddingId: wedding.id, vendorId: { in: [...vendors] }, coordinatorId: { not: null }, OR: [{ functionId: null }, { functionId: { in: affectedFunctions.flatMap(row => row.functionId ? [row.functionId] : []) } }] } });
  for (const arrival of arrivals) if (arrival.coordinatorId) staff.set(arrival.coordinatorId, [...new Map([...(staff.get(arrival.coordinatorId) ?? []), ...impacts.filter(i => i.vendorIds.includes(arrival.vendorId))].map(i => [i.eventId, i])).values()]);
  for (const vendorId of vendors) await tx.scheduleNotification.create({ data: { weddingId: wedding.id, changeId: id, vendorId, instructionVersion, instructions: impacts.filter(impact => impact.vendorIds.includes(vendorId)) } });
  for (const [userId, instructions] of staff) await tx.scheduleNotification.create({ data: { weddingId: wedding.id, changeId: id, userId, instructionVersion, instructions } });
  const row = await tx.scheduleChange.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date(), publishedVersion: instructionVersion } });
  await audit(tx, user.id, 'SCHEDULE_CHANGE_PUBLISHED', id, wedding.id, { instructionVersion, vendorIds: [...vendors], staffIds: [...staff.keys()] });
  return presentChange(row);
}
/**
 * Checks access control for a vendor instruction notification.
 */
export async function notificationAccess(tx: Tx, user: UserProfile, id: string) { const row = await tx.scheduleNotification.findUnique({ where: { id } }); if (!row) throw missing(); await weddingAccess(tx, user, row.weddingId); return row; }
/**
 * Generates a secure, expiring magic capability link for vendor acknowledgement.
 */
export async function vendorLink(tx: Tx, user: UserProfile, id: string) {
  const row = await notificationAccess(tx, user, id);
  if (!row.vendorId) throw new ApiError(400, 'NOT_VENDOR_NOTIFICATION', 'Only vendor notifications use a capability link');
  const token = randomBytes(32).toString('hex');
  await tx.scheduleNotification.update({ where: { id }, data: { tokenHash: createHash('sha256').update(token).digest('hex'), tokenExpiresAt: new Date(Date.now() + 86400000) } });
  await audit(tx, user.id, 'VENDOR_INBOX_LINK_ISSUED', id, row.weddingId);
  return { token, notificationId: id };
}
/**
 * Records vendor or staff acknowledgement or reported problem for a schedule change.
 */
export async function respondNotification(tx: Tx, row: ScheduleNotification, body: z.infer<typeof o.responseInput>, actorId: string, actorType: string) {
  await tx.$queryRaw`SELECT id FROM app."ScheduleNotification" WHERE id = ${row.id}::uuid FOR UPDATE`;
  const current = await tx.scheduleNotification.findUniqueOrThrow({ where: { id: row.id } });
  if (actorType === 'VENDOR_CAPABILITY' && (current.tokenHash !== row.tokenHash || !current.tokenExpiresAt || current.tokenExpiresAt.getTime() <= Date.now())) throw missing();
  if (current.status !== 'SENT') {
    if (current.status === body.status && (current.problemDescription ?? '') === (body.problemDescription ?? '')) return presentNotification(current);
    throw new ApiError(409, 'ALREADY_ACKNOWLEDGED', 'This instruction version already has a response');
  }
  const result = await tx.scheduleNotification.update({ where: { id: row.id }, data: { status: body.status, acknowledgedAt: new Date(), problemDescription: body.status === 'PROBLEM' ? body.problemDescription : null } });
  await audit(tx, actorId, 'SCHEDULE_INSTRUCTION_RESPONDED', row.id, row.weddingId, { actorType, status: result.status, instructionVersion: row.instructionVersion });
  return presentNotification(result);
}
/**
 * Validates a vendor capability token and retrieves the corresponding schedule notification.
 */
export async function capabilityNotification(tx: Tx, token: string) {
  const row = await tx.scheduleNotification.findFirst({ where: { tokenHash: createHash('sha256').update(token).digest('hex'), vendorId: { not: null }, tokenExpiresAt: { gt: new Date() }, wedding: { archivedAt: null, state: { not: 'CANCELLED' } } } });
  if (!row) throw missing();
  return row;
}

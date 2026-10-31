/**
 * =============================================================================
 * THE ROYAL KNOT - Operations & Day-of Execution Validation Contracts
 * =============================================================================
 * Zod validation schemas for timeline events DAG, vendor dock arrivals,
 * live schedule ripple proposals, closed-loop acknowledgements, and incidents.
 */
import { z } from 'zod';
import { uuid, timestamp, pageQuery } from './contracts.js';

const title = z.string().trim().min(1).max(200);
const note = z.string().trim().min(5).max(5000);
const ids = z.array(uuid).max(100).refine(v => new Set(v).size === v.length, 'IDs must be unique');
const version = z.number().int().min(1);
export const timelineStatus = z.enum(['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
export const eventInput = z.object({ title, functionId: uuid.nullable().optional(), plannedStart: timestamp, plannedEnd: timestamp, ownerId: uuid.nullable().optional(), vendorIds: ids, dependsOnIds: ids }).strict().refine(v => Date.parse(v.plannedEnd) > Date.parse(v.plannedStart), 'End must follow start');
export const eventPatch = z.object({ expectedVersion: version, title: title.optional(), functionId: uuid.nullable().optional(), ownerId: uuid.nullable().optional(), vendorIds: ids.optional(), dependsOnIds: ids.optional() }).strict().refine(v => Object.keys(v).length > 1);
export const executionInput = z.object({ expectedVersion: version, status: timelineStatus, actualStart: timestamp.nullable().optional(), actualEnd: timestamp.nullable().optional() }).strict();
export const eventDto = z.object({ id: uuid, weddingId: uuid, functionId: uuid.nullable(), title: z.string(), plannedStart: timestamp, plannedEnd: timestamp, actualStart: timestamp.nullable(), actualEnd: timestamp.nullable(), ownerId: uuid.nullable(), status: timelineStatus, version, vendorIds: z.array(uuid), dependsOnIds: z.array(uuid), createdAt: timestamp, updatedAt: timestamp }).strict();
export const timelineDto = z.object({ data: z.array(eventDto), page: z.number().int(), pageSize: z.number().int(), total: z.number().int(), timezone: z.literal('Asia/Kolkata'), scheduleVersion: version }).strict();
export const arrivalInput = z.object({ vendorId: uuid, functionId: uuid.nullable().optional(), expectedAt: timestamp, coordinatorId: uuid.nullable().optional() }).strict();
export const checkInInput = z.object({ actualAt: timestamp.optional() }).strict();
export const arrivalDto = z.object({ id: uuid, weddingId: uuid, vendorId: uuid, functionId: uuid.nullable(), expectedAt: timestamp, actualAt: timestamp.nullable(), confirmedBy: uuid.nullable(), confirmedAt: timestamp.nullable(), coordinatorId: uuid.nullable(), createdAt: timestamp, isLate: z.boolean(), lateMinutes: z.number().int().nonnegative() }).strict();
export const incidentSeverity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const incidentStatus = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']);
export const incidentInput = z.object({ category: z.enum(['VENDOR_DELAY', 'EQUIPMENT', 'LOGISTICS', 'OTHER']), severity: incidentSeverity, description: note, ownerId: uuid.nullable().optional(), deadline: timestamp.nullable().optional() }).strict();
export const incidentPatch = incidentInput.partial().extend({ expectedVersion: version, status: incidentStatus.optional(), resolution: note.nullable().optional() }).strict().refine(v => Object.keys(v).length > 1);
export const incidentDto = z.object({ id: uuid, weddingId: uuid, category: z.string(), severity: incidentSeverity, description: z.string(), ownerId: uuid.nullable(), deadline: timestamp.nullable(), status: incidentStatus, resolution: z.string().nullable(), resolvedAt: timestamp.nullable(), version, createdAt: timestamp, updatedAt: timestamp }).strict();
export const impactDto = z.object({ eventId: uuid, title: z.string(), previousStart: timestamp, previousEnd: timestamp, proposedStart: timestamp, proposedEnd: timestamp, expectedVersion: version, vendorIds: z.array(uuid), ownerId: uuid.nullable() }).strict();
export const proposalInput = z.object({ expectedScheduleVersion: version, proposedStart: timestamp, proposedEnd: timestamp, shiftDependents: z.boolean(), reason: note }).strict().refine(v => Date.parse(v.proposedEnd) > Date.parse(v.proposedStart));
export const changeDto = z.object({ id: uuid, weddingId: uuid, eventId: uuid, baseScheduleVersion: version, previousStart: timestamp, previousEnd: timestamp, proposedStart: timestamp, proposedEnd: timestamp, reason: z.string(), impacts: z.array(impactDto), requestedBy: uuid, status: z.enum(['PROPOSED', 'APPROVED', 'REJECTED', 'PUBLISHED']), approvedBy: uuid.nullable(), approvedAt: timestamp.nullable(), decidedBy: uuid.nullable(), decidedAt: timestamp.nullable(), decisionNote: z.string().nullable(), publishedAt: timestamp.nullable(), publishedVersion: version.nullable(), createdAt: timestamp }).strict();
export const decisionInput = z.object({ note }).strict();
export const responseInput = z.object({ status: z.enum(['ACKNOWLEDGED', 'PROBLEM']), problemDescription: note.optional() }).strict().refine(v => v.status === 'PROBLEM' ? Boolean(v.problemDescription) : v.problemDescription === undefined, 'Only a problem response includes a required problem description');
export const notificationDto = z.object({ id: uuid, weddingId: uuid, changeId: uuid, vendorId: uuid.nullable(), userId: uuid.nullable(), instructionVersion: version, instructions: z.array(impactDto), deliveryStatus: z.literal('AVAILABLE_IN_APP'), status: z.enum(['SENT', 'ACKNOWLEDGED', 'PROBLEM']), sentAt: timestamp, acknowledgedAt: timestamp.nullable(), problemDescription: z.string().nullable() }).strict();
export const vendorLinkDto = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/), notificationId: uuid }).strict();
export const policyInput = z.object({ independentApproval: z.boolean() }).strict();
export const policyDto = z.object({ weddingId: uuid, independentApproval: z.boolean(), timezone: z.literal('Asia/Kolkata') }).strict();
export const associationInput = z.object({ vendorId: uuid, clientProvidedContract: z.literal(true), note }).strict();
export const associationDto = z.object({ id: uuid, weddingId: uuid, vendorId: uuid, categoryCode: z.string(), quotationId: uuid.nullable(), source: z.enum(['QUOTATION', 'CLIENT_PROVIDED']), createdAt: timestamp }).strict();
export const timelineQuery = pageQuery;
export const incidentQuery = pageQuery.extend({ status: incidentStatus.optional(), severity: incidentSeverity.optional(), ownerId: uuid.optional() });
export const historyDto = z.object({ id: uuid, actorId: uuid, action: z.string(), createdAt: timestamp, details: z.record(z.string(), z.unknown()) }).strict();
export type TimelineEventResponse = z.infer<typeof eventDto>;
export type ScheduleChangeResponse = z.infer<typeof changeDto>;
export type NotificationResponse = z.infer<typeof notificationDto>;
export type VendorArrivalResponse = z.infer<typeof arrivalDto>;
export type IncidentResponse = z.infer<typeof incidentDto>;

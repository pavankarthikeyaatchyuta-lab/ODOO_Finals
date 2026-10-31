import * as c from '../contracts.js';
import * as o from '../operations-contracts.js';
import { everyone, staffWrite, type RouteRegistrar } from '../http/routes.js';
import { audit, weddingAccess } from '../access.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { assertOwner, mutableWedding } from '../services/workflow-access.js';
import * as ops from '../services/operations.js';

/**
 * Registers wedding day run-sheet, vendor docking, delay tracking, and incident routes.
 */
export function registerOperationsRoutes(route: RouteRegistrar) {
  const staff = everyone.filter(role => role !== 'CLIENT'), field = [...staffWrite, 'COORDINATOR' as const];
  route('post', '/weddings/:id/vendors/client-provided', { summary: 'Explicitly associate an existing client-contracted vendor without fabricating a quotation', roles: staffWrite, body: o.associationInput, response: o.associationDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, async handler({ tx, user, params, body }) {
      await mutableWedding(tx, user, params.id!);
      await tx.$queryRaw`SELECT id FROM app."Vendor" WHERE id = ${body.vendorId}::uuid FOR UPDATE`;
      const vendor = await tx.vendor.findFirst({ where: { id: body.vendorId, archivedAt: null } }); if (!vendor) throw missing();
      const row = await tx.weddingVendor.create({ data: { weddingId: params.id!, vendorId: vendor.id, categoryCode: vendor.categoryCode, source: 'CLIENT_PROVIDED' } });
      await audit(tx, user.id, 'CLIENT_PROVIDED_VENDOR_ASSOCIATED', row.id, row.weddingId, { note: body.note });
      return { id: row.id, weddingId: row.weddingId, vendorId: row.vendorId, categoryCode: row.categoryCode, quotationId: row.quotationId, source: row.source, createdAt: row.createdAt };
    },
  });
  route('get', '/weddings/:id/timeline', { summary: 'Read current timeline version in the wedding local timezone', roles: staff, query: c.pageQuery, response: o.timelineDto, async handler({ tx, user, params, query }) {
    const wedding = await weddingAccess(tx, user, params.id!);
    const rows = await tx.timelineEvent.findMany({ where: { weddingId: wedding.id }, include: ops.eventInclude, orderBy: [{ plannedStart: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(ops.presentEvent), ...query, total: await tx.timelineEvent.count({ where: { weddingId: wedding.id } }), timezone: wedding.timezone, scheduleVersion: wedding.scheduleVersion };
  } });
  route('post', '/weddings/:id/timeline', { summary: 'Create timeline event with explicit vendor links and dependencies', roles: staffWrite, body: o.eventInput, response: o.eventDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => ops.createEvent(tx, user, params.id!, body),
  });
  route('patch', '/timeline-events/:id', { summary: 'Version-checked event metadata, ownership, vendor links and dependencies; time changes require proposal approval', roles: staffWrite, body: o.eventPatch, response: o.eventDto,
    async guard({ tx, user, params }) { await ops.eventAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => ops.updateEvent(tx, user, params.id!, body),
  });
  route('post', '/timeline-events/:id/execution', { summary: 'Record actual execution times without changing the approved planned schedule', roles: field, body: o.executionInput, response: o.eventDto,
    async guard({ tx, user, params }) { await ops.eventAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => ops.recordExecution(tx, user, params.id!, body),
  });
  route('post', '/weddings/:id/vendor-arrivals', { summary: 'Plan a vendor arrival and responsible coordinator', roles: staffWrite, body: o.arrivalInput, response: o.arrivalDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, async handler({ tx, user, params, body }) {
      await mutableWedding(tx, user, params.id!);
      if (!await tx.weddingVendor.findUnique({ where: { weddingId_vendorId: { weddingId: params.id!, vendorId: body.vendorId } } })) throw new ApiError(400, 'INVALID_VENDOR_ASSOCIATION', 'Vendor must belong to this wedding');
      if (body.coordinatorId) await assertOwner(tx, params.id!, body.coordinatorId);
      if (body.functionId && !await tx.weddingFunction.findFirst({ where: { id: body.functionId, weddingId: params.id } })) throw new ApiError(400, 'INVALID_FUNCTION', 'Function must belong to this wedding');
      const row = await tx.vendorArrival.create({ data: { ...body, weddingId: params.id!, expectedAt: new Date(body.expectedAt) } });
      await audit(tx, user.id, 'VENDOR_ARRIVAL_PLANNED', row.id, row.weddingId);
      return ops.presentArrival(row);
    },
  });
  route('get', '/weddings/:id/vendor-arrivals', { summary: 'Read pending/confirmed arrivals and dynamic late status', roles: staff, query: c.pageQuery, response: c.listOf(o.arrivalDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const where = { weddingId: params.id! };
    const rows = await tx.vendorArrival.findMany({ where, orderBy: [{ expectedAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => ops.presentArrival(row)), ...query, total: await tx.vendorArrival.count({ where }) };
  } });
  route('post', '/vendor-arrivals/:id/check-in', { summary: 'Confirm actual vendor arrival; coordinator is restricted to assigned arrivals', roles: field, body: o.checkInInput, response: o.arrivalDto,
    async guard({ tx, user, params }) { const row = await tx.vendorArrival.findUnique({ where: { id: params.id } }); if (!row) throw missing(); await mutableWedding(tx, user, row.weddingId); if (user.role === 'COORDINATOR' && row.coordinatorId !== user.id) throw forbidden(); },
    async handler({ tx, user, params, body }) {
      const before = await tx.vendorArrival.findUniqueOrThrow({ where: { id: params.id } });
      if (before.actualAt) throw new ApiError(409, 'ARRIVAL_ALREADY_CONFIRMED', 'Arrival has already been confirmed');
      const actualAt = body.actualAt ? new Date(body.actualAt) : new Date(); if (actualAt.getTime() > Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Arrival cannot be confirmed in the future');
      const row = await tx.vendorArrival.update({ where: { id: before.id }, data: { actualAt, confirmedBy: user.id, confirmedAt: new Date() } });
      await audit(tx, user.id, 'VENDOR_ARRIVAL_CONFIRMED', row.id, row.weddingId, { actualAt: actualAt.toISOString() });
      return ops.presentArrival(row);
    },
  });
  route('post', '/weddings/:id/incidents', { summary: 'Create a private operational incident', roles: field, body: o.incidentInput, response: o.incidentDto,
    async guard({ tx, user, params }) { await mutableWedding(tx, user, params.id!); }, async handler({ tx, user, params, body }) {
      if (body.ownerId) await assertOwner(tx, params.id!, body.ownerId);
      const row = await tx.incident.create({ data: { ...body, weddingId: params.id!, deadline: body.deadline ? new Date(body.deadline) : null } });
      await audit(tx, user.id, 'INCIDENT_CREATED', row.id, row.weddingId, { category: row.category, severity: row.severity }); return row;
    },
  });
  route('get', '/weddings/:id/incidents', { summary: 'Filter private incidents by status, severity and owner', roles: staff, query: o.incidentQuery, response: c.listOf(o.incidentDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const where = { weddingId: params.id!, status: query.status, severity: query.severity, ownerId: query.ownerId };
    return { data: await tx.incident.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), page: query.page, pageSize: query.pageSize, total: await tx.incident.count({ where }) };
  } });
  route('patch', '/incidents/:id', { summary: 'Version-checked incident assignment, progress and resolution', roles: field, body: o.incidentPatch, response: o.incidentDto,
    async guard({ tx, user, params }) { const row = await tx.incident.findUnique({ where: { id: params.id } }); if (!row) throw missing(); await mutableWedding(tx, user, row.weddingId); }, async handler({ tx, user, params, body }) {
      const before = await tx.incident.findUniqueOrThrow({ where: { id: params.id } });
      if (before.version !== body.expectedVersion) throw new ApiError(409, 'STALE_INCIDENT_VERSION', 'Reload the incident before editing');
      if (user.role === 'COORDINATOR' && (before.ownerId !== user.id || body.ownerId !== undefined)) throw forbidden();
      if (body.ownerId) await assertOwner(tx, before.weddingId, body.ownerId);
      const status = body.status ?? before.status, resolution = body.resolution === undefined ? before.resolution : body.resolution;
      if (status === 'RESOLVED' && !resolution) throw new ApiError(400, 'RESOLUTION_REQUIRED', 'Record a resolution before marking an incident resolved');
      const { expectedVersion: _expectedVersion, ...changes } = body;
      const row = await tx.incident.update({ where: { id: before.id }, data: { ...changes, resolution: status === 'RESOLVED' ? resolution : body.resolution ?? null, deadline: body.deadline === undefined ? undefined : body.deadline ? new Date(body.deadline) : null, resolvedAt: status === 'RESOLVED' ? before.resolvedAt ?? new Date() : null, version: { increment: 1 } } });
      await audit(tx, user.id, 'INCIDENT_UPDATED', row.id, row.weddingId, { previousStatus: before.status, status: row.status, previousResolution: before.resolution, resolution: row.resolution, ownerId: row.ownerId }); return row;
    },
  });
  route('get', '/incidents/:id/history', { summary: 'Read private incident audit history', roles: staff, query: c.pageQuery, response: c.listOf(o.historyDto), async handler({ tx, user, params, query }) {
    const row = await tx.incident.findUnique({ where: { id: params.id } }); if (!row) throw missing(); await weddingAccess(tx, user, row.weddingId);
    const where = { entityId: row.id };
    return { data: await tx.auditLog.findMany({ where, select: { id: true, actorId: true, action: true, createdAt: true, details: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), ...query, total: await tx.auditLog.count({ where }) };
  } });
  route('post', '/timeline-events/:id/schedule-changes', { summary: 'Propose a schedule revision and explicit dependency/vendor impacts', roles: field, body: o.proposalInput, response: o.changeDto,
    async guard({ tx, user, params }) { await ops.eventAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => ops.proposeChange(tx, user, params.id!, body),
  });
  route('get', '/weddings/:id/schedule-changes', { summary: 'Read proposed, rejected, approved and published change history', roles: staff, query: c.pageQuery, response: c.listOf(o.changeDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!); const where = { weddingId: params.id! };
    const rows = await tx.scheduleChange.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }); return { data: rows.map(ops.presentChange), ...query, total: await tx.scheduleChange.count({ where }) };
  } });
  for (const approved of [true, false]) route('post', `/schedule-changes/:id/${approved ? 'approve' : 'reject'}`, { summary: `${approved ? 'Approve' : 'Reject'} a proposed change with audit history`, roles: staffWrite, body: o.decisionInput, response: o.changeDto,
    async guard({ tx, user, params }) { await ops.changeAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => ops.decideChange(tx, user, params.id!, body.note, approved),
  });
  route('post', '/schedule-changes/:id/publish', { summary: 'Publish one approved current-version change and create in-app notifications', roles: staffWrite, response: o.changeDto,
    async guard({ tx, user, params }) { await ops.changeAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params }) => ops.publishChange(tx, user, params.id!),
  });
  route('patch', '/weddings/:id/schedule-policy', { summary: 'Founder configures independent schedule approval policy', roles: ['FOUNDER'], body: o.policyInput, response: o.policyDto,
    async guard({ tx, user, params }) { await mutableWedding(tx, user, params.id!); }, async handler({ tx, user, params, body }) {
      const row = await tx.wedding.update({ where: { id: params.id }, data: { independentScheduleApproval: body.independentApproval } }); await audit(tx, user.id, 'SCHEDULE_POLICY_UPDATED', row.id, row.id, body); return { weddingId: row.id, independentApproval: row.independentScheduleApproval, timezone: row.timezone };
    },
  });
  route('get', '/weddings/:id/notifications', { summary: 'Read per-recipient in-app delivery and acknowledgement status', roles: staff, query: c.pageQuery, response: c.listOf(o.notificationDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!); const where = { weddingId: params.id! };
    const rows = await tx.scheduleNotification.findMany({ where, orderBy: [{ sentAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }); return { data: rows.map(ops.presentNotification), ...query, total: await tx.scheduleNotification.count({ where }) };
  } });
  route('post', '/notifications/:id/respond', { summary: 'Respond to an instruction addressed to the current staff member', roles: staff, body: o.responseInput, response: o.notificationDto,
    async guard({ tx, user, params }) { const row = await ops.notificationAccess(tx, user, params.id!); if (row.userId !== user.id) throw forbidden(); }, async handler({ tx, user, params, body }) { return ops.respondNotification(tx, await ops.notificationAccess(tx, user, params.id!), body, user.id, 'STAFF'); },
  });
  route('post', '/notifications/:id/vendor-link', { summary: 'Issue or rotate a vendor-only in-app response capability; manual delivery required', roles: staffWrite, response: o.vendorLinkDto, cacheResponse: false,
    async guard({ tx, user, params }) { await ops.notificationAccess(tx, user, params.id!); }, handler: ({ tx, user, params }) => ops.vendorLink(tx, user, params.id!),
  });
}

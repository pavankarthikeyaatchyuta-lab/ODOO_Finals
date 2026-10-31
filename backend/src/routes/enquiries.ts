import { assertClients, createWedding } from '../services/foundation.js';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import * as c from '../contracts.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { audit, presentEnquiry, presentWedding, weddingFilter } from '../access.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';

export function registerEnquiriesRoutes(route: RouteRegistrar) {
  route('post', '/enquiries/:id/assignment', { summary: 'Founder assigns the enquiry owner and grants wedding membership', roles: ['FOUNDER'], body: z.object({ userId: c.uuid }).strict(), response: c.enquiryDto,
    async guard({ tx, user, params }) { if (!await tx.enquiry.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } })) throw missing(); },
    async handler({ tx, user, params, body }) {
      const staff = await tx.userProfile.findUnique({ where: { id: body.userId } });
      if (!staff?.active || staff.role !== 'PLANNER') throw new ApiError(400, 'INVALID_PLANNER', 'Enquiry owner must be an active planner');
      const row = await tx.enquiry.update({ where: { id: params.id }, data: { assignedToId: body.userId } });
      await tx.weddingAssignment.upsert({ where: { weddingId_userId: { weddingId: row.weddingId, userId: body.userId } }, create: { weddingId: row.weddingId, userId: body.userId }, update: {} });
      await audit(tx, user.id, 'ENQUIRY_ASSIGNED', row.id, row.weddingId, { assignedToId: body.userId });
      return presentEnquiry(row, user);
    },
  });
  route('post', '/enquiries', { summary: 'Create enquiry and provisional wedding atomically', roles: staffWrite, body: c.enquiryInput, response: z.object({ enquiry: c.enquiryDto, wedding: c.weddingDto }).strict(),
    async guard({ tx, user, body }) { await assertClients(tx, user, body.clientIds); },
    async handler({ tx, user, body }) {
      const wedding = await createWedding(tx, user, body, { source: body.source, internalNotes: body.internalNotes });
      return { wedding: presentWedding(wedding, user), enquiry: presentEnquiry(wedding.enquiry!, user) };
    },
  });
  route('get', '/enquiries', { summary: 'List and filter accessible enquiries', query: c.pageQuery.extend({ stage: c.enquiryStage.optional(), source: z.string().max(100).optional(), followUpStatus: c.followUpStatus.optional(), assignedToId: c.uuid.optional(), q: z.string().max(200).optional() }), response: c.listOf(c.enquiryDto), async handler({ tx, user, query }) {
    if (user.role === 'CLIENT' && (query.source || query.followUpStatus || query.assignedToId)) throw forbidden();
    const where: Prisma.EnquiryWhereInput = { wedding: { ...weddingFilter(user), ...(query.q ? { OR: [{ title: { contains: query.q, mode: 'insensitive' } }, { coupleDetails: { contains: query.q, mode: 'insensitive' } }] } : {}) }, stage: query.stage, source: query.source, followUpStatus: query.followUpStatus, assignedToId: query.assignedToId };
    const rows = await tx.enquiry.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => presentEnquiry(row, user)), page: query.page, pageSize: query.pageSize, total: await tx.enquiry.count({ where }) };
  } });
  route('get', '/enquiries/:id', { summary: 'Read accessible enquiry', response: c.enquiryDto, async handler({ tx, user, params }) {
    const row = await tx.enquiry.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } });
    if (!row) throw missing();
    return presentEnquiry(row, user);
  } });
  route('patch', '/enquiries/:id', { summary: 'Update enquiry stage independently from wedding lifecycle', roles: staffWrite, body: c.enquiryPatch, response: c.enquiryDto,
    async guard({ tx, user, params }) { if (!await tx.enquiry.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } })) throw missing(); },
    async handler({ tx, user, body, params }) {
      const before = await tx.enquiry.findUniqueOrThrow({ where: { id: params.id } });
      const row = await tx.enquiry.update({ where: { id: params.id }, data: { ...body, ...(body.followUpAt !== undefined ? { followUpAt: body.followUpAt ? new Date(body.followUpAt) : null } : {}) } });
      await audit(tx, user.id, 'ENQUIRY_UPDATED', row.id, row.weddingId, { previousStage: before.stage, stage: row.stage });
      return presentEnquiry(row, user);
    },
  });

}

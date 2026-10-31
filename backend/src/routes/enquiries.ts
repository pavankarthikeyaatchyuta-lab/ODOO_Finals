import { assertClients, createWedding } from '../services/foundation.js';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import * as c from '../contracts.js';
import { missing } from '../errors.js';
import { audit, presentEnquiry, presentWedding, weddingFilter } from '../access.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';

export function registerEnquiriesRoutes(route: RouteRegistrar) {
  route('post', '/enquiries', { summary: 'Create enquiry and provisional wedding atomically', roles: staffWrite, body: c.enquiryInput, response: z.object({ enquiry: c.enquiryDto, wedding: c.weddingDto }).strict(),
    async guard({ tx, user, body }) { await assertClients(tx, user, body.clientIds); },
    async handler({ tx, user, body }) {
      const wedding = await createWedding(tx, user, body, { source: body.source, internalNotes: body.internalNotes });
      return { wedding: presentWedding(wedding, user), enquiry: presentEnquiry(wedding.enquiry!, user) };
    },
  });
  route('get', '/enquiries', { summary: 'List accessible enquiries', query: c.pageQuery.extend({ stage: c.enquiryStage.optional() }), response: c.listOf(c.enquiryDto), async handler({ tx, user, query }) {
    const where: Prisma.EnquiryWhereInput = { wedding: weddingFilter(user), stage: query.stage };
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
      const row = await tx.enquiry.update({ where: { id: params.id }, data: body });
      await audit(tx, user.id, 'ENQUIRY_UPDATED', row.id, row.weddingId, { previousStage: before.stage, stage: row.stage });
      return presentEnquiry(row, user);
    },
  });

}

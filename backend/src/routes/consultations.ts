import type { Prisma } from '@prisma/client';
import * as c from '../contracts.js';
import { ApiError, missing } from '../errors.js';
import { audit, presentConsultation, weddingAccess, weddingFilter } from '../access.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';

export function registerConsultationsRoutes(route: RouteRegistrar) {
  route('post', '/consultations', { summary: 'Request consultation; never confirms a booking', body: c.requestConsultation, response: c.consultationDto,
    roles: ['FOUNDER', 'PLANNER', 'CLIENT'], async guard({ tx, user, body }) {
      await tx.$queryRaw`SELECT id FROM app."Wedding" WHERE id = ${body.weddingId}::uuid FOR UPDATE`;
      const wedding = await weddingAccess(tx, user, body.weddingId);
      if (wedding.state === 'CANCELLED' || wedding.state === 'COMPLETED') throw new ApiError(409, 'WEDDING_CLOSED', 'Consultations cannot be requested for a closed wedding');
    }, async handler({ tx, user, body }) {
      if (Date.parse(body.preferredAt) <= Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Preferred time must be in the future');
      const row = await tx.consultation.create({ data: { ...body, preferredAt: new Date(body.preferredAt), requestedBy: user.id } });
      await audit(tx, user.id, 'CONSULTATION_REQUESTED', row.id, row.weddingId);
      return presentConsultation(row, user);
    },
  });
  route('get', '/consultations', { summary: 'List accessible consultation requests and appointments', query: c.pageQuery.extend({ weddingId: c.uuid.optional(), state: c.consultationState.optional() }), response: c.listOf(c.consultationDto), async handler({ tx, user, query }) {
    const where: Prisma.ConsultationWhereInput = { wedding: weddingFilter(user), weddingId: query.weddingId, state: query.state };
    const rows = await tx.consultation.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => presentConsultation(row, user)), page: query.page, pageSize: query.pageSize, total: await tx.consultation.count({ where }) };
  } });
  route('get', '/consultations/:id', { summary: 'Read accessible consultation', response: c.consultationDto, async handler({ tx, user, params }) {
    const row = await tx.consultation.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } });
    if (!row) throw missing();
    return presentConsultation(row, user);
  } });
  route('patch', '/consultations/:id', { summary: 'Planner confirms, reschedules, completes or cancels consultation', roles: staffWrite, body: c.consultationDecision, response: c.consultationDto,
    async guard({ tx, user, params }) { if (!await tx.consultation.findFirst({ where: { id: params.id, wedding: weddingFilter(user) } })) throw missing(); },
    async handler({ tx, user, body, params }) {
      const reference = await tx.consultation.findUniqueOrThrow({ where: { id: params.id } });
      await weddingAccess(tx, user, reference.weddingId, true);
      await tx.$queryRaw`SELECT id FROM app."Consultation" WHERE id = ${params.id!}::uuid FOR UPDATE`;
      const before = await tx.consultation.findUniqueOrThrow({ where: { id: params.id } });
      if (['COMPLETED', 'CANCELLED'].includes(before.state) || (body.state === 'COMPLETED' && before.state !== 'CONFIRMED')) throw new ApiError(409, 'INVALID_TRANSITION', 'This consultation decision is not allowed');
      if (body.state === 'CONFIRMED') {
        const wedding = await weddingAccess(tx, user, before.weddingId, true);
        if (['CANCELLED', 'COMPLETED'].includes(wedding.state)) throw new ApiError(409, 'WEDDING_CLOSED', 'Cannot confirm a consultation for a closed wedding');
        if (Date.parse(body.startAt) <= Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Confirmed start must be in the future');
        const assigned = await tx.weddingAssignment.findUnique({ where: { weddingId_userId: { weddingId: before.weddingId, userId: body.plannerId } }, include: { user: true } });
        if (!assigned?.user.active || assigned.user.role !== 'PLANNER') throw new ApiError(400, 'INVALID_PLANNER', 'Responsible planner must be active and assigned to this wedding');
      }
      const row = await tx.consultation.update({ where: { id: params.id }, data: body.state === 'CONFIRMED'
        ? { ...body, startAt: new Date(body.startAt), endAt: new Date(body.endAt) } : body });
      await audit(tx, user.id, 'CONSULTATION_DECIDED', row.id, row.weddingId, { previousState: before.state, previousStartAt: before.startAt?.toISOString() ?? null, previousEndAt: before.endAt?.toISOString() ?? null, previousPlannerId: before.plannerId, state: row.state, startAt: row.startAt?.toISOString() ?? null, endAt: row.endAt?.toISOString() ?? null, plannerId: row.plannerId });
      return presentConsultation(row, user);
    },
  });

}

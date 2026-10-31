import * as c from '../contracts.js';
import * as w from '../workflow-contracts.js';
import { everyone, staffWrite, type RouteRegistrar } from '../http/routes.js';
import { audit, weddingAccess } from '../access.js';
import { ApiError, missing } from '../errors.js';
import { mutableWedding } from '../services/workflow-access.js';
import { claimPayment, confirmProposal, decidePayment, generateTasks, paymentAccess, presentGeneration, presentPayment, taskAccess, updateTask } from '../services/planning.js';

export function registerPlanningRoutes(route: RouteRegistrar) {
  const staff = everyone.filter(role => role !== 'CLIENT');
  route('post', '/weddings/:id/confirm-proposal', { summary: 'Confirm proposal and required deposit; generate tasks if the verified deposit qualifies', roles: staffWrite, body: w.proposalInput, response: w.proposalDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => confirmProposal(tx, user, params.id!, body),
  });
  route('post', '/weddings/:id/booking-payments', { summary: 'Record an unverified booking-deposit claim', roles: ['FOUNDER', 'PLANNER', 'FINANCE', 'CLIENT'], body: w.paymentInput, response: w.paymentDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!); }, handler: ({ tx, user, params, body }) => claimPayment(tx, user, params.id!, body),
  });
  route('get', '/weddings/:id/booking-payments', { summary: 'List client booking-deposit claims without internal review notes', roles: ['FOUNDER', 'PLANNER', 'FINANCE', 'CLIENT'], query: c.pageQuery, response: c.listOf(w.paymentDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const where = { weddingId: params.id! };
    const rows = await tx.bookingPayment.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(presentPayment), ...query, total: await tx.bookingPayment.count({ where }) };
  } });
  route('post', '/booking-payments/:id/verify', { summary: 'Finance records manual bank-reference verification and triggers eligible planning', roles: ['FOUNDER', 'FINANCE'], body: w.paymentReviewInput, response: w.paymentDecisionDto,
    async guard({ tx, user, params }) { await paymentAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => decidePayment(tx, user, params.id!, body.note, true),
  });
  route('post', '/booking-payments/:id/reject', { summary: 'Finance rejects an unverified payment claim', roles: ['FOUNDER', 'FINANCE'], body: w.reviewNoteInput, response: w.paymentDecisionDto,
    async guard({ tx, user, params }) { await paymentAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => decidePayment(tx, user, params.id!, body.note, false),
  });
  route('post', '/weddings/:id/tasks/generate', { summary: 'Idempotently generate the eligible package-specific task plan', roles: staffWrite, response: w.generationDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params }) => generateTasks(tx, user, params.id!),
  });
  route('get', '/weddings/:id/task-generation', { summary: 'Read immutable plan generation version and date basis', roles: staff, response: w.generationDto.nullable(), async handler({ tx, user, params }) {
    await weddingAccess(tx, user, params.id!);
    const row = await tx.taskGeneration.findUnique({ where: { weddingId: params.id } });
    return row ? presentGeneration(row) : null;
  } });
  route('get', '/weddings/:id/tasks', { summary: 'Filter assigned wedding tasks', roles: staff, query: w.taskQuery, response: c.listOf(w.taskDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const where = { weddingId: params.id!, status: query.status, ownerId: query.ownerId, functionId: query.functionId, priority: query.priority };
    return { data: await tx.weddingTask.findMany({ where, orderBy: [{ deadline: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), page: query.page, pageSize: query.pageSize, total: await tx.weddingTask.count({ where }) };
  } });
  route('get', '/tasks/:id', { summary: 'Read an authorized planning task', roles: staff, response: w.taskDto, handler: ({ tx, user, params }) => taskAccess(tx, user, params.id!) });
  route('patch', '/tasks/:id', { summary: 'Assign, reassign or update tasks; coordinators may update only their own status', roles: [...staffWrite, 'COORDINATOR'], body: w.taskPatch, response: w.taskDto,
    async guard({ tx, user, params }) { await taskAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => updateTask(tx, user, params.id!, body),
  });
  route('get', '/weddings/:id/functions', { summary: 'Read wedding function planning times', query: c.pageQuery, response: c.listOf(w.functionDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const where = { weddingId: params.id! };
    return { data: await tx.weddingFunction.findMany({ where, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), ...query, total: await tx.weddingFunction.count({ where }) };
  } });
  route('post', '/weddings/:id/functions', { summary: 'Create a wedding function plan', roles: staffWrite, body: w.functionInput, response: w.functionDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, async handler({ tx, user, params, body }) {
      await mutableWedding(tx, user, params.id!);
      const row = await tx.weddingFunction.create({ data: { ...body, weddingId: params.id!, startAt: body.startAt ? new Date(body.startAt) : null, endAt: body.endAt ? new Date(body.endAt) : null } });
      await audit(tx, user.id, 'FUNCTION_CREATED', row.id, row.weddingId);
      return row;
    },
  });
  route('patch', '/functions/:id', { summary: 'Replace function name, type, venue and paired times', roles: staffWrite, body: w.functionInput, response: w.functionDto,
    async guard({ tx, user, params }) { const row = await tx.weddingFunction.findUnique({ where: { id: params.id } }); if (!row) throw missing(); await weddingAccess(tx, user, row.weddingId, true); },
    async handler({ tx, user, params, body }) {
      const before = await tx.weddingFunction.findUniqueOrThrow({ where: { id: params.id } });
      await mutableWedding(tx, user, before.weddingId);
      if (body.type !== before.type && await tx.weddingTask.count({ where: { functionId: before.id } })) throw new ApiError(409, 'FUNCTION_IN_USE', 'Function type cannot change after tasks reference it');
      const row = await tx.weddingFunction.update({ where: { id: before.id }, data: { ...body, startAt: body.startAt ? new Date(body.startAt) : null, endAt: body.endAt ? new Date(body.endAt) : null } });
      await audit(tx, user.id, 'FUNCTION_UPDATED', row.id, row.weddingId);
      return row;
    },
  });
}

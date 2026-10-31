import * as c from '../contracts.js';
import * as w from '../workflow-contracts.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';
import { weddingAccess } from '../access.js';
import { missing } from '../errors.js';
import { createRound, roundAccess, presentRound, selectQuote, submitQuote } from '../services/quotations.js';

export function registerQuotationsRoutes(route: RouteRegistrar) {
  const readers = [...staffWrite, 'FINANCE' as const];
  route('post', '/weddings/:id/quotation-rounds', { summary: 'Request quotations from vendors; exactly three for catering', roles: staffWrite, body: w.roundInput, response: w.roundDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => createRound(tx, user, params.id!, body),
  });
  route('get', '/weddings/:id/quotation-rounds', { summary: 'List wedding quotation rounds and authoritative comparisons', roles: readers, query: c.pageQuery, response: c.listOf(w.roundDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    const rows = await tx.quotationRound.findMany({ where: { weddingId: params.id }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    const data = [];
    for (const row of rows) data.push(presentRound(await roundAccess(tx, user, row.id)));
    return { data, ...query, total: await tx.quotationRound.count({ where: { weddingId: params.id } }) };
  } });
  route('get', '/quotation-rounds/:id/comparison', { summary: 'Compare submitted quotations with backend totals', roles: readers, response: w.roundDto, async handler({ tx, user, params }) { return presentRound(await roundAccess(tx, user, params.id!)); } });
  route('post', '/quotation-requests/:id/quotation', { summary: 'Submit itemized quotation; totals are server-calculated', roles: staffWrite, body: w.quoteInput, response: w.quoteDto,
    async guard({ tx, user, params }) { const ref = await tx.quotationRequest.findUnique({ where: { id: params.id } }); if (!ref) throw missing(); await roundAccess(tx, user, ref.roundId, true); },
    handler: ({ tx, user, params, body }) => submitQuote(tx, user, params.id!, body),
  });
  route('patch', '/quotations/:id', { summary: 'Replace an unselected quotation and recompute all totals', roles: staffWrite, body: w.quoteInput, response: w.quoteDto,
    async guard({ tx, user, params }) { const ref = await tx.quotation.findUnique({ where: { id: params.id }, include: { request: true } }); if (!ref) throw missing(); await roundAccess(tx, user, ref.request.roundId, true); },
    async handler({ tx, user, params, body }) { const ref = await tx.quotation.findUniqueOrThrow({ where: { id: params.id } }); return submitQuote(tx, user, ref.requestId, body, ref.id); },
  });
  route('post', '/quotations/:id/select', { summary: 'Select one vendor and atomically close competing requests', roles: staffWrite, response: w.selectionDto,
    async guard({ tx, user, params }) { const ref = await tx.quotation.findUnique({ where: { id: params.id }, include: { request: true } }); if (!ref) throw missing(); await roundAccess(tx, user, ref.request.roundId, true); },
    handler: ({ tx, user, params }) => selectQuote(tx, user, params.id!),
  });
}

import * as c from '../contracts.js';
import * as w from '../workflow-contracts.js';
import { everyone, type RouteRegistrar } from '../http/routes.js';
import { clientFilter } from '../services/foundation.js';
import { weddingFilter, presentConsultation } from '../access.js';
import { missing } from '../errors.js';

export function registerActivityRoutes(route: RouteRegistrar) {
  const staff = everyone.filter(role => role !== 'CLIENT');
  route('get', '/clients/:id/consultations', { summary: 'Read consultation history for an accessible client contact', roles: staff, query: c.pageQuery, response: c.listOf(c.consultationDto), async handler({ tx, user, params, query }) {
    const client = await tx.client.findFirst({ where: { id: params.id, ...clientFilter(user) } });
    if (!client) throw missing();
    const where = { wedding: { ...weddingFilter(user), clients: { some: { clientId: client.id } } } };
    const rows = await tx.consultation.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(row => presentConsultation(row, user)), ...query, total: await tx.consultation.count({ where }) };
  } });
  route('get', '/clients/:id/activity', { summary: 'Read safe activity history without internal financial or document-review details', roles: staff, query: c.pageQuery, response: c.listOf(w.activityDto), async handler({ tx, user, params, query }) {
    const client = await tx.client.findFirst({ where: { id: params.id, ...clientFilter(user) } });
    if (!client) throw missing();
    const weddings = await tx.wedding.findMany({ where: { ...weddingFilter(user), clients: { some: { clientId: client.id } } }, select: { id: true } });
    const where = { OR: [{ entityId: client.id }, { weddingId: { in: weddings.map(row => row.id) } }] };
    const rows = await tx.auditLog.findMany({ where, select: { id: true, action: true, entityId: true, createdAt: true }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows, ...query, total: await tx.auditLog.count({ where }) };
  } });
}

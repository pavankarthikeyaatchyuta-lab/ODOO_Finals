/**
 * =============================================================================
 * File: vendors.ts
 * Module: API Route Definition Router
 * =============================================================================
 * Registers RESTful API endpoints and maps HTTP route paths to service handlers and security policies for vendors.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { z } from 'zod';
import * as c from '../contracts.js';
import * as w from '../workflow-contracts.js';
import { everyone, staffWrite, type RouteRegistrar } from '../http/routes.js';
import { audit, weddingAccess } from '../access.js';
import { ApiError, missing } from '../errors.js';
import { agreementGate } from '../services/workflow-access.js';

const staff = everyone.filter(role => role !== 'CLIENT');
/**
 * Registers vendor directory, category catalog, and vendor profile routes.
 */
export function registerVendorsRoutes(route: RouteRegistrar) {
  route('get', '/vendor-categories', { summary: 'List configured vendor categories', roles: staff, response: z.array(w.categoryDto), handler: ({ tx }) => tx.vendorCategory.findMany({ orderBy: { code: 'asc' } }) });
  route('post', '/vendors', { summary: 'Create vendor directory contact', roles: staffWrite, body: w.vendorInput, response: w.vendorDto, async handler({ tx, user, body }) {
    const row = await tx.vendor.create({ data: body });
    await audit(tx, user.id, 'VENDOR_CREATED', row.id, null);
    return row;
  } });
  route('get', '/vendors', { summary: 'Search internal vendor directory; clients cannot browse it', roles: staff, query: w.vendorQuery, response: c.listOf(w.vendorDto), async handler({ tx, query }) {
    const where = { archivedAt: null, categoryCode: query.categoryCode, ...(query.q ? { name: { contains: query.q, mode: 'insensitive' as const } } : {}) };
    return { data: await tx.vendor.findMany({ where, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), page: query.page, pageSize: query.pageSize, total: await tx.vendor.count({ where }) };
  } });
  route('get', '/vendors/:id', { summary: 'Read internal vendor directory record', roles: staff, response: w.vendorDto, async handler({ tx, params }) {
    const row = await tx.vendor.findFirst({ where: { id: params.id, archivedAt: null } });
    if (!row) throw missing();
    return row;
  } });
  route('patch', '/vendors/:id', { summary: 'Update vendor contact and service details', roles: staffWrite, body: w.vendorPatch, response: w.vendorDto,
    async guard({ tx, params }) { if (!await tx.vendor.findFirst({ where: { id: params.id, archivedAt: null } })) throw missing(); },
    async handler({ tx, user, params, body }) {
      await tx.$queryRaw`SELECT id FROM app."Vendor" WHERE id = ${params.id!}::uuid FOR UPDATE`;
      if (body.categoryCode && (await tx.quotationRequest.count({ where: { vendorId: params.id } }) || await tx.weddingVendor.count({ where: { vendorId: params.id } }))) throw new ApiError(409, 'VENDOR_IN_USE', 'Category cannot change after quotation or wedding associations reference this vendor');
      const row = await tx.vendor.update({ where: { id: params.id }, data: body });
      await audit(tx, user.id, 'VENDOR_UPDATED', row.id, null);
      return row;
    },
  });
  route('delete', '/vendors/:id', { summary: 'Founder archives an unused vendor', roles: ['FOUNDER'], response: c.archivedDto,
    async guard({ tx, params }) { if (!await tx.vendor.findUnique({ where: { id: params.id } })) throw missing(); }, async handler({ tx, user, params }) {
      await tx.$queryRaw`SELECT id FROM app."Vendor" WHERE id = ${params.id!}::uuid FOR UPDATE`;
      const before = await tx.vendor.findUniqueOrThrow({ where: { id: params.id } });
      if (before.archivedAt) throw missing();
      if (await tx.quotationRequest.count({ where: { vendorId: params.id } }) || await tx.weddingVendor.count({ where: { vendorId: params.id } })) throw new ApiError(409, 'VENDOR_IN_USE', 'Vendor is referenced by quotation or wedding history');
      const row = await tx.vendor.update({ where: { id: params.id }, data: { archivedAt: new Date() } });
      await audit(tx, user.id, 'VENDOR_ARCHIVED', row.id, null);
      return { id: row.id, archivedAt: row.archivedAt!.toISOString() };
    },
  });
  route('get', '/weddings/:id/vendors', { summary: 'Read selected wedding vendors; signed agreement required for clients', query: c.pageQuery, response: c.listOf(w.publicVendorDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    if (user.role === 'CLIENT') await agreementGate(tx, params.id!);
    const where = { weddingId: params.id! };
    const rows = await tx.weddingVendor.findMany({ where, include: { vendor: true }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(({ vendor }) => ({ id: vendor.id, name: vendor.name, categoryCode: vendor.categoryCode, contactName: vendor.contactName, email: vendor.email, phone: vendor.phone, serviceDetails: vendor.serviceDetails })), ...query, total: await tx.weddingVendor.count({ where }) };
  } });
}

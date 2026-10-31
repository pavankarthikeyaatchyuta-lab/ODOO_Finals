import type { z } from 'zod';
import * as c from '../contracts.js';
import { audit, presentWedding, weddingAccess, weddingFilter, weddingInclude } from '../access.js';
import { ApiError, missing } from '../errors.js';
import type { Context } from '../http/routes.js';
import { createWedding, archiveWedding } from '../services/foundation.js';

export async function create(ctx: Context<z.infer<typeof c.createWeddingInput>, unknown>) {
  return presentWedding(await createWedding(ctx.tx, ctx.user, ctx.body), ctx.user);
}
export async function list({ tx, user, query }: Context<unknown, z.infer<typeof c.pageQuery> & { state?: z.infer<typeof c.weddingState> }>) {
  const where = { ...weddingFilter(user), state: query.state };
  const rows = await tx.wedding.findMany({ where, include: weddingInclude, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
  return { data: rows.map(row => presentWedding(row, user)), page: query.page, pageSize: query.pageSize, total: await tx.wedding.count({ where }) };
}
export async function read(ctx: Context<unknown, unknown>) {
  const row = await ctx.tx.wedding.findFirst({ where: { id: ctx.params.id, ...weddingFilter(ctx.user) }, include: weddingInclude });
  if (!row) throw missing();
  return presentWedding(row, ctx.user);
}
export async function update({ tx, user, params, body }: Context<z.infer<typeof c.weddingPatch>, unknown>) {
  const before = await weddingAccess(tx, user, params.id!, true);
  if (body.state && !({ ENQUIRY: ['PROPOSAL', 'CANCELLED'], PROPOSAL: ['ENQUIRY', 'CANCELLED'] } as Record<string, string[]>)[before.state]?.includes(body.state)) throw new ApiError(409, 'INVALID_TRANSITION', 'This wedding lifecycle transition is unavailable in Phase 1');
  const row = await tx.wedding.update({ where: { id: params.id }, data: { ...body, ...(body.weddingDate !== undefined ? { weddingDate: body.weddingDate ? new Date(body.weddingDate) : null } : {}) }, include: weddingInclude });
  await audit(tx, user.id, 'WEDDING_UPDATED', row.id, row.id, { previousState: before.state, state: row.state });
  return presentWedding(row, user);
}
export function remove(ctx: Context<unknown, unknown>) { return archiveWedding(ctx.tx, ctx.user, ctx.params.id!); }

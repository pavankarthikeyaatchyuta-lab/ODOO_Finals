import type { z } from 'zod';
import * as c from '../contracts.js';
import { audit } from '../access.js';
import { ApiError, missing } from '../errors.js';
import type { Context } from '../http/routes.js';
import { clientFilter, archiveClient } from '../services/foundation.js';

export async function create({ tx, user, body }: Context<z.infer<typeof c.clientInput>, unknown>) {
  const row = await tx.client.create({ data: body });
  await audit(tx, user.id, 'CLIENT_CREATED', row.id, null);
  return row;
}
export async function list({ tx, user, query }: Context<unknown, z.infer<typeof c.pageQuery>>) {
  const where = clientFilter(user);
  return { data: await tx.client.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }), ...query, total: await tx.client.count({ where }) };
}
export async function read(ctx: Context<unknown, unknown>) {
  const row = await ctx.tx.client.findFirst({ where: { id: ctx.params.id, ...clientFilter(ctx.user) } });
  if (!row) throw missing();
  return row;
}
export async function update(ctx: Context<z.infer<typeof c.clientPatch>, unknown>) {
  await ctx.tx.$queryRaw`SELECT id FROM app."Client" WHERE id = ${ctx.params.id!}::uuid FOR UPDATE`;
  const current = await read(ctx);
  if (current.userId && ctx.body.email && current.email !== ctx.body.email) throw new ApiError(409, 'LINKED_EMAIL', 'Linked account email changes require administrative review');
  const row = await ctx.tx.client.update({ where: { id: current.id }, data: ctx.body });
  await audit(ctx.tx, ctx.user.id, 'CLIENT_UPDATED', row.id, null);
  return row;
}
export function remove(ctx: Context<unknown, unknown>) { return archiveClient(ctx.tx, ctx.user, ctx.params.id!); }

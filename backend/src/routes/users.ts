import * as c from '../contracts.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { audit, weddingAccess } from '../access.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';
import type { IdentityProvider } from '../identity.js';

export function registerUsersRoutes(route: RouteRegistrar, identity: IdentityProvider) {
  route('get', '/users/:id', { summary: 'Founder reads a user profile', roles: ['FOUNDER'], response: c.profileDto, async handler({ tx, params }) {
    const row = await tx.userProfile.findUnique({ where: { id: params.id } });
    if (!row) throw missing();
    return { id: row.id, email: row.email, displayName: row.displayName, role: row.role, active: row.active, timezone: 'Asia/Kolkata' };
  } });
  route('get', '/me', { summary: 'Current active profile', response: c.profileDto, async handler({ user }) {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, active: user.active, timezone: 'Asia/Kolkata' };
  } });
  route('get', '/users', { summary: 'List staff profiles', roles: ['FOUNDER'], query: c.pageQuery, response: c.listOf(c.profileDto), async handler({ tx, query }) {
    const where = { role: { not: 'CLIENT' as const } };
    const rows = await tx.userProfile.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(u => ({ id: u.id, email: u.email, displayName: u.displayName, role: u.role, active: u.active, timezone: 'Asia/Kolkata' })), ...query, total: await tx.userProfile.count({ where }) };
  } });
  route('patch', '/users/:id', { summary: 'Founder updates staff role or account activity', roles: ['FOUNDER'], body: c.userPatch, response: c.profileDto, async handler({ tx, user, body, params }) {
    const target = await tx.userProfile.findUnique({ where: { id: params.id } });
    if (!target) throw missing();
    if (target.role === 'FOUNDER' || (target.role === 'CLIENT' && body.role)) throw forbidden();
    const row = await tx.userProfile.update({ where: { id: target.id }, data: body });
    await audit(tx, user.id, 'USER_UPDATED', row.id, null, body);
    return { id: row.id, email: row.email, displayName: row.displayName, role: row.role, active: row.active, timezone: 'Asia/Kolkata' };
  } });
  route('post', '/invitations', { summary: 'Invite staff or explicitly linked client', roles: staffWrite, body: c.invitationInput, response: c.profileDto,
    async guard({ tx, user, body }) {
      if (user.role !== 'FOUNDER' && body.role !== 'CLIENT') throw forbidden();
      if (body.role === 'CLIENT') {
        await weddingAccess(tx, user, body.weddingId!, true);
        const link = await tx.weddingClient.findUnique({ where: { weddingId_clientId: { weddingId: body.weddingId!, clientId: body.clientId! } }, include: { client: true } });
        if (!link || link.client.archivedAt || link.client.email !== body.email) throw new ApiError(400, 'INVALID_CLIENT_LINK', 'The explicit client must belong to the wedding and match the invited email');
      }
    }, async handler({ tx, user, body }) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`invite:${body.email}`}, 0))`;
      const existing = await tx.userProfile.findUnique({ where: { email: body.email }, include: { client: true } });
      if (existing && (existing.role !== body.role || !existing.active || (body.role === 'CLIENT' && existing.client?.id !== body.clientId))) throw new ApiError(409, 'ACCOUNT_CONFLICT', 'This identity is already linked; founder must review it');
      const id = existing?.id ?? await identity.invite(body.email);
      const profile = existing ?? await tx.userProfile.create({ data: { id, email: body.email, displayName: body.displayName, role: body.role } });
      if (body.role === 'CLIENT') {
        const client = await tx.client.findUniqueOrThrow({ where: { id: body.clientId } });
        if (client.userId && client.userId !== id) throw new ApiError(409, 'ACCOUNT_CONFLICT', 'Client is already linked to another account');
        await tx.client.update({ where: { id: client.id }, data: { userId: id } });
      }
      await audit(tx, user.id, 'USER_INVITED', id, body.weddingId ?? null, { role: body.role, clientId: body.clientId ?? null });
      return { id: profile.id, email: profile.email, displayName: profile.displayName, role: profile.role, active: profile.active, timezone: 'Asia/Kolkata' };
    },
  });

}

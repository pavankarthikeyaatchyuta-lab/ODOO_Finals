import * as weddings from '../controllers/weddings.js';
import { assertClients } from '../services/foundation.js';
import { z } from 'zod';
import * as c from '../contracts.js';
import { ApiError, forbidden } from '../errors.js';
import { audit, weddingAccess } from '../access.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';

export function registerWeddingsRoutes(route: RouteRegistrar) {
  route('post', '/weddings', { summary: 'Create a provisional wedding without an enquiry', roles: staffWrite, body: c.createWeddingInput, response: c.weddingDto,
    async guard({ tx, user, body }) { await assertClients(tx, user, body.clientIds); }, handler: weddings.create,
  });
  route('get', '/weddings', { summary: 'List accessible weddings', query: c.pageQuery.extend({ state: c.weddingState.optional() }), response: c.listOf(c.weddingDto), handler: weddings.list });
  route('get', '/weddings/:id', { summary: 'Read accessible wedding with explicit client-safe projection', response: c.weddingDto, handler: weddings.read });
  route('patch', '/weddings/:id', { summary: 'Update wedding details or permitted lifecycle state; booking qualification uses dedicated workflows', roles: staffWrite, body: c.weddingPatch, response: c.weddingDto,
    async guard({ tx, user, params, body }) {
      await weddingAccess(tx, user, params.id!, true);
      if (body.budgetMax !== undefined && user.role !== 'FOUNDER') throw forbidden();
    }, handler: weddings.update,
  });
  route('delete', '/weddings/:id', { summary: 'Archive a provisional or cancelled wedding; preserve its UUID and history', roles: staffWrite, response: c.archivedDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true, true); }, handler: weddings.remove,
  });
  route('post', '/weddings/:id/clients', { summary: 'Explicitly link an existing contact to a wedding', roles: ['FOUNDER'], body: z.object({ clientId: c.uuid }).strict(), response: z.object({ weddingId: c.uuid, clientId: c.uuid }).strict(),
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params, body }) {
      await assertClients(tx, user, [body.clientId]);
      const row = await tx.weddingClient.upsert({ where: { weddingId_clientId: { weddingId: params.id!, clientId: body.clientId } }, create: { weddingId: params.id!, clientId: body.clientId }, update: {} });
      await audit(tx, user.id, 'CLIENT_LINKED', body.clientId, params.id!);
      return row;
    },
  });
  route('post', '/weddings/:id/assignments', { summary: 'Founder assigns active staff', roles: ['FOUNDER'], body: z.object({ userId: c.uuid }).strict(), response: c.assignmentDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params, body }) {
      const staff = await tx.userProfile.findUnique({ where: { id: body.userId } });
      if (!staff?.active || staff.role === 'CLIENT') throw new ApiError(400, 'INVALID_STAFF', 'An active staff profile is required');
      const row = await tx.weddingAssignment.upsert({ where: { weddingId_userId: { weddingId: params.id!, userId: body.userId } }, create: { weddingId: params.id!, userId: body.userId }, update: {} });
      await audit(tx, user.id, 'STAFF_ASSIGNED', body.userId, params.id!);
      return row;
    },
  });
  route('delete', '/weddings/:id/assignments/:userId', { summary: 'Founder removes staff assignment', roles: ['FOUNDER'], response: c.assignmentDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params }) {
      const active = await tx.consultation.count({ where: { weddingId: params.id, plannerId: params.userId, state: 'CONFIRMED' } });
      if (active) throw new ApiError(409, 'ACTIVE_BOOKINGS', 'Reassign or cancel confirmed consultations before removing this staff member');
      await tx.weddingAssignment.deleteMany({ where: { weddingId: params.id, userId: params.userId } });
      await audit(tx, user.id, 'STAFF_UNASSIGNED', params.userId!, params.id!);
      return { weddingId: params.id, userId: params.userId };
    },
  });

}

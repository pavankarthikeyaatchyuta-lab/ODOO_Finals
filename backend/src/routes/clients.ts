import * as c from '../contracts.js';
import * as clients from '../controllers/clients.js';
import { missing } from '../errors.js';
import { staffWrite, everyone, type RouteRegistrar } from '../http/routes.js';

export function registerClientsRoutes(route: RouteRegistrar) {
  route('post', '/clients', { summary: 'Create a client contact', roles: staffWrite, body: c.clientInput, response: c.clientDto, handler: clients.create });
  route('get', '/clients', { summary: 'List accessible clients', roles: everyone.filter(r => r !== 'CLIENT'), query: c.pageQuery, response: c.listOf(c.clientDto), handler: clients.list });
  route('get', '/clients/:id', { summary: 'Read accessible client contact', roles: everyone.filter(r => r !== 'CLIENT'), response: c.clientDto, handler: clients.read });
  route('patch', '/clients/:id', { summary: 'Update contact; account linking is invitation-only', roles: staffWrite, body: c.clientPatch, response: c.clientDto, guard: clients.read, handler: clients.update });
  route('delete', '/clients/:id', { summary: 'Founder archives an unused contact; preserves history', roles: ['FOUNDER'], response: c.archivedDto,
    async guard({ tx, params }) { if (!await tx.client.findUnique({ where: { id: params.id } })) throw missing(); }, handler: clients.remove,
  });
}

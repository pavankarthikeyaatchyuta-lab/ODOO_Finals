import * as c from '../contracts.js';
import * as w from '../workflow-contracts.js';
import { type RouteRegistrar } from '../http/routes.js';
import { createDocument, documentAccess, completeDocument, presentDocument } from '../services/documents.js';
import { weddingAccess } from '../access.js';
import { agreementGate } from '../services/workflow-access.js';
import type { DocumentStore } from '../storage.js';
import { ApiError } from '../errors.js';

/**
 * Registers document upload, verification, and artifact download routes.
 */
export function registerDocumentsRoutes(route: RouteRegistrar, store: DocumentStore) {
  route('post', '/weddings/:id/documents', { summary: 'Register private document upload metadata', body: w.documentInput, response: w.documentDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!); },
    handler: ({ tx, user, params, body }) => createDocument(tx, user, params.id!, body),
  });
  route('get', '/weddings/:id/floor-plans', { summary: 'List floor plans; signed agreement required for clients', query: c.pageQuery, response: c.listOf(w.documentDto), async handler({ tx, user, params, query }) {
    await weddingAccess(tx, user, params.id!);
    if (user.role === 'CLIENT') await agreementGate(tx, params.id!);
    const where = { weddingId: params.id!, kind: 'FLOOR_PLAN' as const, status: 'VERIFIED' as const };
    const rows = await tx.document.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    return { data: rows.map(presentDocument), ...query, total: await tx.document.count({ where }) };
  } });
  route('get', '/documents/:id', { summary: 'Read authorized private document metadata', response: w.documentDto, async handler({ tx, user, params }) { return presentDocument(await documentAccess(tx, user, params.id!)); } });
  route('post', '/documents/:id/upload-url', { summary: 'Issue a private non-overwriting upload capability; not cached', cacheResponse: false, response: w.uploadDto,
    async guard({ tx, user, params }) { await documentAccess(tx, user, params.id!, true); },
    async handler({ tx, user, params }) { return store.uploadUrl((await documentAccess(tx, user, params.id!, true)).storagePath); },
  });
  route('post', '/documents/:id/complete', { summary: 'Verify uploaded bytes, type, size and SHA-256; does not verify a signature', response: w.documentDto,
    async guard({ tx, user, params }) { await documentAccess(tx, user, params.id!); }, handler: ({ tx, user, params }) => completeDocument(tx, user, params.id!, store),
  });
  route('post', '/documents/:id/download-url', { summary: 'Authorize a private 60-second document download; not cached', cacheResponse: false, response: w.downloadDto,
    async guard({ tx, user, params }) { await documentAccess(tx, user, params.id!); }, async handler({ tx, user, params }) {
      const row = await documentAccess(tx, user, params.id!);
      if (row.status !== 'VERIFIED') throw new ApiError(409, 'DOCUMENT_NOT_VERIFIED', 'Complete the upload verification before downloading');
      return { signedUrl: await store.downloadUrl(row.storagePath), expiresIn: 60 };
    },
  });
}

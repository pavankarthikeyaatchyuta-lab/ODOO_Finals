/**
 * =============================================================================
 * File: agreements.ts
 * Module: API Route Definition Router
 * =============================================================================
 * Registers RESTful API endpoints and maps HTTP route paths to service handlers and security policies for agreements.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import * as w from '../workflow-contracts.js';
import { staffWrite, type RouteRegistrar } from '../http/routes.js';
import { audit, weddingAccess } from '../access.js';
import { ApiError, missing } from '../errors.js';
import { agreementAccess, createAgreement, presentAgreement, sendAgreement, submitSignature, verifySignature } from '../services/agreements.js';
import { requireDocument } from '../services/documents.js';

/**
 * Registers digital service agreement creation, transmission, and signature review routes.
 */
export function registerAgreementsRoutes(route: RouteRegistrar) {
  route('post', '/weddings/:id/agreement', { summary: 'Create a draft service agreement', roles: staffWrite, body: w.agreementInput, response: w.agreementDto,
    async guard({ tx, user, params }) { await weddingAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => createAgreement(tx, user, params.id!, body),
  });
  route('get', '/weddings/:id/agreement', { summary: 'Read the service agreement visible to this account', response: w.agreementDto, async handler({ tx, user, params }) {
    await weddingAccess(tx, user, params.id!);
    const row = await tx.agreement.findUnique({ where: { weddingId: params.id } });
    if (!row) throw missing();
    return presentAgreement(await agreementAccess(tx, user, row.id));
  } });
  route('patch', '/agreements/:id', { summary: 'Edit draft agreement metadata and its verified source document', roles: staffWrite, body: w.agreementInput.partial().refine(v => Object.keys(v).length > 0), response: w.agreementDto,
    async guard({ tx, user, params }) { await agreementAccess(tx, user, params.id!, true); }, async handler({ tx, user, params, body }) {
      const before = await agreementAccess(tx, user, params.id!, true);
      if (before.status !== 'DRAFT') throw new ApiError(409, 'AGREEMENT_IMMUTABLE', 'Only draft agreements can be edited');
      if (body.documentId) await requireDocument(tx, before.weddingId, body.documentId, 'AGREEMENT');
      const row = await tx.agreement.update({ where: { id: before.id }, data: body });
      await audit(tx, user.id, 'AGREEMENT_UPDATED', row.id, row.weddingId);
      return presentAgreement(row);
    },
  });
  route('post', '/agreements/:id/send', { summary: 'Publish a draft agreement for signature', roles: staffWrite, response: w.agreementDto,
    async guard({ tx, user, params }) { await agreementAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params }) => sendAgreement(tx, user, params.id!),
  });
  route('post', '/agreements/:id/submit-signature', { summary: 'Submit verified uploaded signature evidence; does not mark signed', roles: [...staffWrite, 'CLIENT'], body: w.submitSignatureInput, response: w.agreementDto,
    async guard({ tx, user, params }) { await agreementAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => submitSignature(tx, user, params.id!, body),
  });
  route('post', '/agreements/:id/verify', { summary: 'Planner attests manual review of the uploaded signed agreement', roles: staffWrite, body: w.reviewSignatureInput, response: w.agreementDto,
    async guard({ tx, user, params }) { await agreementAccess(tx, user, params.id!, true); }, handler: ({ tx, user, params, body }) => verifySignature(tx, user, params.id!, body),
  });
  route('post', '/agreements/:id/reject-signature', { summary: 'Reject submitted signature evidence and request a new upload', roles: staffWrite, body: w.reviewNoteInput, response: w.agreementDto,
    async guard({ tx, user, params }) { await agreementAccess(tx, user, params.id!, true); }, async handler({ tx, user, params, body }) {
      const before = await agreementAccess(tx, user, params.id!, true);
      if (before.status !== 'SIGNATURE_SUBMITTED') throw new ApiError(409, 'SIGNATURE_NOT_SUBMITTED', 'No signature evidence is awaiting review');
      const row = await tx.agreement.update({ where: { id: before.id }, data: { status: 'SENT', signedDocumentId: null, claimedSignedAt: null, reviewNote: body.note } });
      await audit(tx, user.id, 'SIGNATURE_REJECTED', row.id, row.weddingId, { documentId: before.signedDocumentId, note: body.note });
      return presentAgreement(row);
    },
  });
}

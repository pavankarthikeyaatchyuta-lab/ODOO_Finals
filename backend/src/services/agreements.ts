import type { Agreement, UserProfile } from '@prisma/client';
import type { z } from 'zod';
import * as w from '../workflow-contracts.js';
import { audit, weddingAccess, type Tx } from '../access.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { mutableWedding } from './workflow-access.js';
import { requireDocument } from './documents.js';

/**
 * Formats agreement database record into standard response DTO.
 *
 * @param row - Agreement database record
 */
export function presentAgreement(row: Agreement) {
  return { id: row.id, weddingId: row.weddingId, title: row.title, terms: row.terms, version: row.version, status: row.status, documentId: row.documentId, signedDocumentId: row.signedDocumentId, sentAt: row.sentAt?.toISOString() ?? null, claimedSignedAt: row.claimedSignedAt?.toISOString() ?? null, signedAt: row.signedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
/**
 * Checks access permissions to a contract agreement, handling draft visibility for clients.
 *
 * @param tx - Prisma transaction
 * @param user - Requesting user
 * @param id - Agreement ID
 * @param write - Whether write locking is required
 */
export async function agreementAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const row = await tx.agreement.findUnique({ where: { id } });
  if (!row) throw missing();
  if (write) await mutableWedding(tx, user, row.weddingId); else await weddingAccess(tx, user, row.weddingId);
  if (user.role === 'CLIENT' && row.status === 'DRAFT') throw missing();
  // Read after acquiring the wedding lock so concurrent decisions see the latest state.
  return tx.agreement.findUniqueOrThrow({ where: { id } });
}
/**
 * Drafts a new digital client agreement linked to a verified template document.
 *
 * @param tx - Prisma transaction
 * @param user - Acting planner / founder
 * @param weddingId - Target wedding ID
 * @param body - Agreement terms and title
 */
export async function createAgreement(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof w.agreementInput>) {
  await mutableWedding(tx, user, weddingId);
  if (body.documentId) await requireDocument(tx, weddingId, body.documentId, 'AGREEMENT');
  const row = await tx.agreement.create({ data: { weddingId, ...body } });
  await audit(tx, user.id, 'AGREEMENT_CREATED', row.id, weddingId);
  return presentAgreement(row);
}
/**
 * Transitions agreement from DRAFT to SENT status, enabling client signature submission.
 *
 * @param tx - Prisma transaction
 * @param user - Acting user
 * @param id - Agreement identifier
 */
export async function sendAgreement(tx: Tx, user: UserProfile, id: string) {
  const before = await agreementAccess(tx, user, id, true);
  if (before.status !== 'DRAFT' || !before.documentId) throw new ApiError(409, 'AGREEMENT_NOT_READY', 'A draft agreement with a verified document is required');
  await requireDocument(tx, before.weddingId, before.documentId, 'AGREEMENT');
  const row = await tx.agreement.update({ where: { id }, data: { status: 'SENT', sentAt: new Date() } });
  await audit(tx, user.id, 'AGREEMENT_SENT', id, row.weddingId);
  return presentAgreement(row);
}
/**
 * Submits client signature evidence (document upload reference) for administrative review.
 *
 * @param tx - Prisma transaction
 * @param user - Client or planner user
 * @param id - Agreement identifier
 * @param body - Signature document reference and timestamp
 */
export async function submitSignature(tx: Tx, user: UserProfile, id: string, body: z.infer<typeof w.submitSignatureInput>) {
  const before = await agreementAccess(tx, user, id, true);
  if (before.status !== 'SENT') throw new ApiError(409, 'INVALID_AGREEMENT_STATE', 'Only sent agreements accept signed evidence');
  if (Date.parse(body.claimedSignedAt) > Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Claimed signature time cannot be in the future');
  const document = await requireDocument(tx, before.weddingId, body.documentId, 'SIGNED_AGREEMENT');
  if (user.role === 'CLIENT' && document.uploadedBy !== user.id) throw forbidden();
  const row = await tx.agreement.update({ where: { id }, data: { status: 'SIGNATURE_SUBMITTED', signedDocumentId: body.documentId, claimedSignedAt: new Date(body.claimedSignedAt) } });
  await audit(tx, user.id, 'SIGNATURE_EVIDENCE_SUBMITTED', id, row.weddingId, { documentId: body.documentId });
  return presentAgreement(row);
}
/**
 * Authorizes and verifies a submitted client signature, marking the agreement as fully SIGNED.
 *
 * @param tx - Prisma transaction
 * @param user - Reviewing planner or founder
 * @param id - Agreement identifier
 * @param body - Review timestamp and note
 */
export async function verifySignature(tx: Tx, user: UserProfile, id: string, body: z.infer<typeof w.reviewSignatureInput>) {
  const before = await agreementAccess(tx, user, id, true);
  if (before.status !== 'SIGNATURE_SUBMITTED' || !before.signedDocumentId) throw new ApiError(409, 'SIGNATURE_NOT_SUBMITTED', 'Signed evidence must be submitted before review');
  if (Date.parse(body.signedAt) > Date.now()) throw new ApiError(400, 'INVALID_TIME', 'Signature time cannot be in the future');
  const document = await requireDocument(tx, before.weddingId, before.signedDocumentId, 'SIGNED_AGREEMENT');
  const row = await tx.agreement.update({ where: { id }, data: { status: 'SIGNED', signedAt: new Date(body.signedAt), verifiedBy: user.id, verifiedAt: new Date(), reviewNote: body.note } });
  const wedding = await tx.wedding.findUniqueOrThrow({ where: { id: row.weddingId } });
  if (['ENQUIRY', 'PROPOSAL'].includes(wedding.state)) await tx.wedding.update({ where: { id: row.weddingId }, data: { state: 'AGREEMENT' } });
  await audit(tx, user.id, 'SIGNATURE_MANUALLY_VERIFIED', id, row.weddingId, { method: 'MANUAL_DOCUMENT_REVIEW', documentId: document.id, sha256: document.sha256, note: body.note });
  return presentAgreement(row);
}

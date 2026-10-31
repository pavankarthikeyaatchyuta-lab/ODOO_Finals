/**
 * =============================================================================
 * File: documents.ts
 * Module: Domain Business Logic Service
 * =============================================================================
 * Executes core wedding management business rules, transactional database operations, calculations, and validations for documents.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import { createHash, randomUUID } from 'node:crypto';
import type { Document, UserProfile } from '@prisma/client';
import type { z } from 'zod';
import * as w from '../workflow-contracts.js';
import { audit, weddingAccess, type Tx } from '../access.js';
import { ApiError, forbidden, missing } from '../errors.js';
import { agreementGate, lockWedding, mutableWedding } from './workflow-access.js';
import type { DocumentStore } from '../storage.js';

/**
 * Selects the appropriate locking mechanism (immutable financial lock vs mutable wedding lock)
 * depending on the uploaded document category.
 */
function writableDocumentWedding(tx: Tx, user: UserProfile, weddingId: string, kind: Document['kind']) {
  return ['PAYMENT_EVIDENCE', 'EXPENSE_EVIDENCE', 'VENDOR_BILL'].includes(kind) ? lockWedding(tx, user, weddingId) : mutableWedding(tx, user, weddingId);
}

/**
 * Formats a document record for client and API consumers.
 *
 * @param row - Document database record
 */
export function presentDocument(row: Document) {
  return { id: row.id, weddingId: row.weddingId, kind: row.kind, status: row.status, fileName: row.fileName, contentType: row.contentType, size: row.size, sha256: row.sha256, verifiedAt: row.verifiedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}
/**
 * Enforces authorization for document access and upload operations.
 *
 * @param tx - Prisma transaction
 * @param user - Requesting user
 * @param id - Document identifier
 * @param upload - Whether user is uploading/updating file content
 */
export async function documentAccess(tx: Tx, user: UserProfile, id: string, upload = false) {
  const row = await tx.document.findUnique({ where: { id } });
  if (!row) throw missing();
  await weddingAccess(tx, user, row.weddingId);
  if (['EXPENSE_EVIDENCE', 'VENDOR_BILL'].includes(row.kind) && !['FOUNDER', 'FINANCE'].includes(user.role) && (user.role === 'CLIENT' || row.uploadedBy !== user.id)) throw forbidden();
  if (row.kind === 'PAYMENT_EVIDENCE' && !['FOUNDER', 'FINANCE'].includes(user.role) && row.uploadedBy !== user.id) throw forbidden();
  if (upload) {
    await writableDocumentWedding(tx, user, row.weddingId, row.kind);
    if (row.uploadedBy !== user.id) throw forbidden();
    if (row.status !== 'PENDING') throw new ApiError(409, 'DOCUMENT_IMMUTABLE', 'Verified documents cannot be overwritten');
  }
  if (user.role === 'CLIENT') {
    if (row.kind === 'FLOOR_PLAN') { if (upload) throw forbidden(); await agreementGate(tx, row.weddingId); }
    else if (row.kind === 'PAYMENT_EVIDENCE') { if (row.uploadedBy !== user.id) throw missing(); }
    else {
      const agreement = await tx.agreement.findUnique({ where: { weddingId: row.weddingId } });
      if (!agreement || agreement.status === 'DRAFT') throw missing();
      const linked = row.kind === 'AGREEMENT' ? agreement.documentId === row.id : agreement.signedDocumentId === row.id;
      if (row.uploadedBy !== user.id && !linked) throw missing();
      if (upload && (row.kind !== 'SIGNED_AGREEMENT' || agreement.status !== 'SENT')) throw forbidden();
    }
  }
  return row;
}
/**
 * Registers a new document metadata entry prior to binary payload upload.
 *
 * @param tx - Prisma transaction
 * @param user - Uploading user
 * @param weddingId - Associated wedding ID
 * @param body - Document kind, filename, mime-type
 */
export async function createDocument(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof w.documentInput>) {
  await writableDocumentWedding(tx, user, weddingId, body.kind);
  if (user.role === 'CLIENT') {
    if (!['SIGNED_AGREEMENT', 'PAYMENT_EVIDENCE'].includes(body.kind)) throw forbidden();
    if (body.kind === 'SIGNED_AGREEMENT' && (await tx.agreement.findUnique({ where: { weddingId } }))?.status !== 'SENT') throw new ApiError(409, 'AGREEMENT_NOT_SENT', 'A sent agreement is required before uploading a signature document');
  } else if (!['FOUNDER', 'PLANNER', 'FINANCE'].includes(user.role) || (user.role === 'FINANCE' && !['PAYMENT_EVIDENCE', 'EXPENSE_EVIDENCE', 'VENDOR_BILL'].includes(body.kind))) throw forbidden();
  const id = randomUUID();
  const extension = body.contentType === 'application/pdf' ? 'pdf' : body.contentType === 'image/png' ? 'png' : 'jpg';
  const row = await tx.document.create({ data: { ...body, id, weddingId, uploadedBy: user.id, storagePath: `weddings/${weddingId}/${id}.${extension}` } });
  await audit(tx, user.id, 'DOCUMENT_REGISTERED', row.id, weddingId, { kind: row.kind });
  return presentDocument(row);
}
export async function completeDocument(tx: Tx, user: UserProfile, id: string, store: DocumentStore) {
  const row = await documentAccess(tx, user, id);
  await writableDocumentWedding(tx, user, row.weddingId, row.kind);
  if (row.uploadedBy !== user.id) throw forbidden();
  if (row.status === 'VERIFIED') return presentDocument(row);
  const { bytes, contentType } = await store.read(row.storagePath);
  const buffer = Buffer.from(bytes);
  const validMagic = row.contentType === 'application/pdf' ? buffer.subarray(0, 5).toString() === '%PDF-'
    : row.contentType === 'image/png' ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (buffer.length !== row.size || contentType !== row.contentType || !validMagic) throw new ApiError(400, 'INVALID_DOCUMENT', 'Uploaded size, media type or file signature does not match the registered document');
  const result = await tx.document.update({ where: { id }, data: { status: 'VERIFIED', sha256: createHash('sha256').update(buffer).digest('hex'), verifiedAt: new Date() } });
  await audit(tx, user.id, 'DOCUMENT_UPLOAD_VERIFIED', id, row.weddingId, { sha256: result.sha256 });
  return presentDocument(result);
}
export async function requireDocument(tx: Tx, weddingId: string, id: string, kind: Document['kind']) {
  const row = await tx.document.findFirst({ where: { id, weddingId, kind, status: 'VERIFIED' } });
  if (!row?.sha256) throw new ApiError(400, 'INVALID_DOCUMENT', 'A verified uploaded document of the correct kind and wedding is required');
  return row;
}

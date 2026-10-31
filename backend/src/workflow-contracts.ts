import { z } from 'zod';
import { uuid, timestamp, pageQuery, email } from './contracts.js';

const text = z.string().trim().min(1).max(200);
const longText = z.string().trim().min(1).max(5000);
export const currency = z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED']);
export const money = z.string().regex(/^\d{1,14}(\.\d{1,2})?$/);
export const positiveMoney = money.refine(value => Number(value) > 0, 'Amount must be positive');
export const functionType = z.enum(['MEHENDI', 'SANGEET', 'RECEPTION']);
export const vendorInput = z.object({ name: text, categoryCode: z.string().regex(/^[A-Z_]{2,40}$/), contactName: text, email, phone: z.string().trim().min(3).max(40), serviceDetails: longText }).strict();
export const vendorPatch = vendorInput.partial().refine(v => Object.keys(v).length > 0);
export const vendorDto = vendorInput.extend({ id: uuid, archivedAt: timestamp.nullable(), createdAt: timestamp, updatedAt: timestamp }).strict();
export const categoryDto = z.object({ code: z.string(), name: z.string() }).strict();
export const publicVendorDto = vendorInput.extend({ id: uuid }).strict();
export const vendorQuery = pageQuery.extend({ categoryCode: z.string().max(40).optional(), q: z.string().trim().max(200).optional() });
export const documentKind = z.enum(['AGREEMENT', 'SIGNED_AGREEMENT', 'FLOOR_PLAN', 'PAYMENT_EVIDENCE']);
export const documentInput = z.object({ kind: documentKind, fileName: z.string().min(1).max(200).regex(/^[^/\\\x00-\x1f]+$/), contentType: z.enum(['application/pdf', 'image/jpeg', 'image/png']), size: z.number().int().min(1).max(10485760) }).strict();
export const documentDto = z.object({ id: uuid, weddingId: uuid, kind: documentKind, status: z.enum(['PENDING', 'VERIFIED']), fileName: z.string(), contentType: z.string(), size: z.number().int(), sha256: z.string().nullable(), verifiedAt: timestamp.nullable(), createdAt: timestamp }).strict();
export const uploadDto = z.object({ signedUrl: z.url(), path: z.string(), token: z.string() }).strict();
export const downloadDto = z.object({ signedUrl: z.url(), expiresIn: z.literal(60) }).strict();
export const agreementInput = z.object({ title: text, terms: longText, documentId: uuid.optional() }).strict();
export const agreementDto = z.object({ id: uuid, weddingId: uuid, title: z.string(), terms: z.string(), version: z.number().int(), status: z.enum(['DRAFT', 'SENT', 'SIGNATURE_SUBMITTED', 'SIGNED']), documentId: uuid.nullable(), signedDocumentId: uuid.nullable(), sentAt: timestamp.nullable(), claimedSignedAt: timestamp.nullable(), signedAt: timestamp.nullable(), createdAt: timestamp, updatedAt: timestamp }).strict();
export const submitSignatureInput = z.object({ documentId: uuid, claimedSignedAt: timestamp }).strict();
export const reviewSignatureInput = z.object({ verifiedEvidence: z.literal(true), signedAt: timestamp, note: z.string().trim().min(10).max(2000) }).strict();
export const reviewNoteInput = z.object({ note: z.string().trim().min(10).max(2000) }).strict();
export const roundInput = z.object({ categoryCode: z.string().regex(/^[A-Z_]{2,40}$/), vendorIds: z.array(uuid).min(1).max(3).refine(ids => new Set(ids).size === ids.length, 'Vendor IDs must be unique') }).strict();
export const quoteInput = z.object({
  pricePerPlate: money, guestCount: z.number().int().min(0).max(100000), additionalHourRate: money,
  additionalHours: z.string().regex(/^\d{1,4}(\.\d{1,2})?$/), menuDetails: z.string().trim().max(5000),
  inclusions: z.array(text).max(50), exclusions: z.array(text).max(50),
  items: z.array(z.object({ description: text, quantity: z.string().regex(/^\d{1,6}(\.\d{1,3})?$/).refine(v => Number(v) > 0), unitPrice: money }).strict()).max(50),
}).strict();
export const quoteItemDto = z.object({ id: uuid, description: z.string(), quantity: z.string(), unitPrice: z.string(), total: z.string() }).strict();
export const quoteDto = z.object({ id: uuid, requestId: uuid, pricePerPlate: z.string(), guestCount: z.number().int(), additionalHourRate: z.string(), additionalHours: z.string(), menuDetails: z.string(), inclusions: z.array(z.string()), exclusions: z.array(z.string()), total: z.string(), items: z.array(quoteItemDto), createdAt: timestamp, updatedAt: timestamp }).strict();
export const requestDto = z.object({ id: uuid, roundId: uuid, vendorId: uuid, vendorName: z.string(), status: z.enum(['REQUESTED', 'SUBMITTED', 'SELECTED', 'CLOSED']), closedAt: timestamp.nullable(), quotation: quoteDto.nullable() }).strict();
export const roundDto = z.object({ id: uuid, weddingId: uuid, categoryCode: z.string(), currency, status: z.enum(['OPEN', 'SELECTED']), requests: z.array(requestDto), createdAt: timestamp }).strict();
export const selectionDto = z.object({ id: uuid, weddingId: uuid, vendorId: uuid, categoryCode: z.string(), quotationId: uuid, createdAt: timestamp }).strict();
export const functionInput = z.object({ type: functionType, name: text, startAt: timestamp.nullable().optional(), endAt: timestamp.nullable().optional(), venue: z.string().trim().max(300).nullable().optional() }).strict().superRefine((v, ctx) => {
  if (Boolean(v.startAt) !== Boolean(v.endAt) || (v.startAt && v.endAt && Date.parse(v.endAt) <= Date.parse(v.startAt))) ctx.addIssue({ code: 'custom', message: 'Provide both times with endAt after startAt, or neither' });
});
export const functionDto = z.object({ id: uuid, weddingId: uuid, type: functionType, name: z.string(), startAt: timestamp.nullable(), endAt: timestamp.nullable(), venue: z.string().nullable(), createdAt: timestamp, updatedAt: timestamp }).strict();
export const activityDto = z.object({ id: uuid, action: z.string(), entityId: uuid, createdAt: timestamp }).strict();

export type VendorRequest = z.infer<typeof vendorInput>;
export type VendorResponse = z.infer<typeof vendorDto>;
export type AgreementResponse = z.infer<typeof agreementDto>;
export type DocumentResponse = z.infer<typeof documentDto>;
export type QuotationRequest = z.infer<typeof quoteInput>;
export type QuotationRoundResponse = z.infer<typeof roundDto>;

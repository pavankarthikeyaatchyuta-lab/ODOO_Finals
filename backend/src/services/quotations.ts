import { Prisma, type UserProfile } from '@prisma/client';
import type { z } from 'zod';
import * as w from '../workflow-contracts.js';
import { audit, weddingAccess, type Tx } from '../access.js';
import { ApiError, missing } from '../errors.js';
import { mutableWedding } from './workflow-access.js';

const roundInclude = { requests: { orderBy: { id: 'asc' as const }, include: { vendor: true, quotation: { include: { items: { orderBy: { id: 'asc' as const } } } } } } } satisfies Prisma.QuotationRoundInclude;
type RoundRow = Prisma.QuotationRoundGetPayload<{ include: typeof roundInclude }>;
type QuoteRow = NonNullable<RoundRow['requests'][number]['quotation']>;
export function presentQuote(row: QuoteRow) {
  return { id: row.id, requestId: row.requestId, pricePerPlate: row.pricePerPlate.toFixed(2), guestCount: row.guestCount, additionalHourRate: row.additionalHourRate.toFixed(2), additionalHours: row.additionalHours.toFixed(2), menuDetails: row.menuDetails, inclusions: row.inclusions, exclusions: row.exclusions, total: row.total.toFixed(2), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    items: row.items.map(item => ({ id: item.id, description: item.description, quantity: item.quantity.toFixed(3), unitPrice: item.unitPrice.toFixed(2), total: item.total.toFixed(2) })) };
}
export function presentRound(row: RoundRow) {
  return { id: row.id, weddingId: row.weddingId, categoryCode: row.categoryCode, currency: row.currency, status: row.status, createdAt: row.createdAt.toISOString(),
    requests: row.requests.map(request => ({ id: request.id, roundId: request.roundId, vendorId: request.vendorId, vendorName: request.vendor.name, status: request.status, closedAt: request.closedAt?.toISOString() ?? null, quotation: request.quotation ? presentQuote(request.quotation) : null })) };
}
export async function roundAccess(tx: Tx, user: UserProfile, id: string, write = false) {
  const ref = await tx.quotationRound.findUnique({ where: { id } });
  if (!ref) throw missing();
  if (write) {
    await mutableWedding(tx, user, ref.weddingId);
    await tx.$queryRaw`SELECT id FROM app."QuotationRound" WHERE id = ${id}::uuid FOR UPDATE`;
  } else await weddingAccess(tx, user, ref.weddingId);
  return tx.quotationRound.findUniqueOrThrow({ where: { id }, include: roundInclude });
}
export async function createRound(tx: Tx, user: UserProfile, weddingId: string, body: z.infer<typeof w.roundInput>) {
  const wedding = await mutableWedding(tx, user, weddingId);
  if (body.categoryCode === 'CATERING' && body.vendorIds.length !== 3) throw new ApiError(400, 'THREE_CATERERS_REQUIRED', 'Catering comparison requires exactly three distinct vendors');
  await tx.$queryRaw`SELECT id FROM app."Vendor" WHERE id IN (${Prisma.join(body.vendorIds.map(id => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR UPDATE`;
  const vendors = await tx.vendor.findMany({ where: { id: { in: body.vendorIds }, categoryCode: body.categoryCode, archivedAt: null } });
  if (vendors.length !== body.vendorIds.length) throw new ApiError(400, 'INVALID_VENDORS', 'Vendors must be active and belong to the requested category');
  const row = await tx.quotationRound.create({ data: { weddingId, categoryCode: body.categoryCode, currency: wedding.currency, requests: { create: body.vendorIds.map(vendorId => ({ vendorId })) } }, include: roundInclude });
  await audit(tx, user.id, 'QUOTATION_REQUESTS_CREATED', row.id, weddingId, { vendorIds: body.vendorIds, currency: row.currency });
  return presentRound(row);
}
export function calculateQuote(body: z.infer<typeof w.quoteInput>) {
  const decimal = (value: string) => new Prisma.Decimal(value);
  const round = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const items = body.items.map(item => ({ ...item, total: round(decimal(item.quantity).mul(item.unitPrice)) }));
  let total = round(decimal(body.pricePerPlate).mul(body.guestCount)).plus(round(decimal(body.additionalHourRate).mul(body.additionalHours)));
  for (const item of items) total = total.plus(item.total);
  if (total.lte(0) || total.gte('100000000000000') || items.some(item => item.total.gte('100000000000000'))) throw new ApiError(400, 'INVALID_QUOTATION_TOTAL', 'Total must be positive and within the supported monetary range');
  return { items, total };
}
export async function submitQuote(tx: Tx, user: UserProfile, requestId: string, body: z.infer<typeof w.quoteInput>, existingQuoteId?: string) {
  const request = await tx.quotationRequest.findUnique({ where: { id: requestId } });
  if (!request) throw missing();
  const round = await roundAccess(tx, user, request.roundId, true);
  if (round.status !== 'OPEN' || !['REQUESTED', 'SUBMITTED'].includes(request.status)) throw new ApiError(409, 'QUOTATIONS_CLOSED', 'Selected or closed quotations cannot be changed');
  const vendor = await tx.vendor.findUniqueOrThrow({ where: { id: request.vendorId } });
  if (vendor.archivedAt) throw new ApiError(409, 'VENDOR_ARCHIVED', 'Archived vendors cannot submit quotations');
  if (round.categoryCode === 'CATERING' && (body.guestCount <= 0 || new Prisma.Decimal(body.pricePerPlate).lte(0) || !body.menuDetails.trim())) throw new ApiError(400, 'INVALID_CATERING_QUOTE', 'Catering quotes require guests, a positive plate price and menu details');
  const { items, total } = calculateQuote(body);
  const data = { ...body, items: undefined, total };
  let row: QuoteRow;
  if (existingQuoteId) {
    const before = await tx.quotation.findUniqueOrThrow({ where: { id: existingQuoteId } });
    await tx.quotationItem.deleteMany({ where: { quotationId: existingQuoteId } });
    row = await tx.quotation.update({ where: { id: existingQuoteId }, data: { ...data, items: { create: items } }, include: { items: { orderBy: { id: 'asc' } } } });
    await audit(tx, user.id, 'QUOTATION_UPDATED', row.id, round.weddingId, { previousTotal: before.total.toFixed(2), total: total.toFixed(2) });
  } else {
    row = await tx.quotation.create({ data: { ...data, requestId, items: { create: items } }, include: { items: { orderBy: { id: 'asc' } } } });
    await audit(tx, user.id, 'QUOTATION_SUBMITTED', row.id, round.weddingId, { total: total.toFixed(2) });
  }
  await tx.quotationRequest.update({ where: { id: requestId }, data: { status: 'SUBMITTED' } });
  return presentQuote(row);
}
export async function selectQuote(tx: Tx, user: UserProfile, quoteId: string) {
  const quote = await tx.quotation.findUnique({ where: { id: quoteId }, include: { request: true } });
  if (!quote) throw missing();
  const round = await roundAccess(tx, user, quote.request.roundId, true);
  if (round.status !== 'OPEN') throw new ApiError(409, 'VENDOR_ALREADY_SELECTED', 'A vendor has already been selected for this category');
  if (round.categoryCode === 'CATERING' && (round.requests.length !== 3 || round.requests.some(request => request.status !== 'SUBMITTED' || !request.quotation))) throw new ApiError(409, 'COMPARISON_INCOMPLETE', 'All three catering quotations must be submitted before selection');
  const winner = round.requests.find(request => request.id === quote.requestId);
  if (!winner || winner.status !== 'SUBMITTED' || winner.vendor.archivedAt) throw new ApiError(409, 'INVALID_SELECTION', 'Select an active vendor with a submitted quotation');
  const now = new Date();
  await tx.quotationRequest.updateMany({ where: { roundId: round.id, id: { not: winner.id } }, data: { status: 'CLOSED', closedAt: now } });
  await tx.quotationRequest.update({ where: { id: winner.id }, data: { status: 'SELECTED' } });
  await tx.quotationRound.update({ where: { id: round.id }, data: { status: 'SELECTED' } });
  const selection = await tx.weddingVendor.create({ data: { weddingId: round.weddingId, vendorId: winner.vendorId, categoryCode: round.categoryCode, quotationId: quote.id } });
  await audit(tx, user.id, 'VENDOR_SELECTED', selection.id, round.weddingId, { quotationId: quote.id, closedRequestIds: round.requests.filter(r => r.id !== winner.id).map(r => r.id) });
  return { id: selection.id, weddingId: selection.weddingId, vendorId: selection.vendorId, categoryCode: selection.categoryCode, quotationId: selection.quotationId!, createdAt: selection.createdAt.toISOString() };
}

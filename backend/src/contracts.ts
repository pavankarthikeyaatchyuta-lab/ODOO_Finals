import { z } from 'zod';

export const uuid = z.uuid();
export const role = z.enum(['FOUNDER', 'PLANNER', 'COORDINATOR', 'FINANCE', 'CLIENT']);
export const packageType = z.enum(['FULL_SERVICE', 'PARTIAL_DAY_OF']);
export const enquiryStage = z.enum(['NEW', 'CONTACTED', 'CONSULTATION_SCHEDULED', 'PROPOSAL_SENT', 'LOST']);
export const weddingState = z.enum(['ENQUIRY', 'PROPOSAL', 'AGREEMENT', 'BOOKING_CONFIRMED', 'PLANNING', 'EXECUTION', 'COMPLETED', 'CANCELLED']);
export const consultationState = z.enum(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);
export const timestamp = z.iso.datetime({ offset: true });
const text = z.string().trim().min(1).max(200);
export const email = z.email().max(254).transform(v => v.toLowerCase());
const notes = z.string().trim().max(5000).nullable();
export const pageQuery = z.object({ page: z.coerce.number().int().min(1).max(100000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).strict();
export const clientInput = z.object({ name: text, email, phone: z.string().trim().min(3).max(40).nullable().optional(), requirements: z.string().trim().max(5000).nullable().optional() }).strict();
export const clientPatch = clientInput.partial().refine(v => Object.keys(v).length > 0);
export const weddingInput = z.object({
  title: text, weddingDate: z.iso.date().nullable().optional(), packageType,
  guestCount: z.number().int().min(1).max(100000).nullable().optional(),
  preferredTheme: z.string().trim().max(200).nullable().optional(),
  coupleDetails: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(300).nullable().optional(),
  requirements: z.string().trim().max(5000).nullable().optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED']).optional(),
  budgetMax: z.string().regex(/^\d{1,14}(\.\d{1,2})?$/).nullable().optional(),
  internalNotes: notes.optional(),
}).strict();
export const enquiryInput = z.object({
  clientIds: z.array(uuid).min(1).max(20).refine(ids => new Set(ids).size === ids.length, 'Client IDs must be unique'),
  wedding: weddingInput, source: z.string().trim().max(100).nullable().optional(), internalNotes: notes.optional(),
}).strict();
export const createWeddingInput = z.object({ clientIds: enquiryInput.shape.clientIds, wedding: weddingInput }).strict();
export const followUpStatus = z.enum(['PENDING', 'CONTACTED', 'FOLLOW_UP_DUE', 'CLOSED']);
export const enquiryPatch = z.object({ stage: enquiryStage.optional(), source: z.string().trim().max(100).nullable().optional(), internalNotes: notes.optional(), followUpStatus: followUpStatus.optional(), followUpAt: timestamp.nullable().optional() }).strict().refine(v => Object.keys(v).length > 0);
export const weddingPatch = weddingInput.partial().extend({ state: z.enum(['ENQUIRY', 'PROPOSAL', 'EXECUTION', 'COMPLETED', 'CANCELLED']).optional() }).strict().refine(v => Object.keys(v).length > 0);
export const requestConsultation = z.object({ weddingId: uuid, preferredAt: timestamp, message: z.string().trim().max(2000).nullable().optional() }).strict();
export const consultationDecision = z.discriminatedUnion('state', [
  z.object({ state: z.literal('CONFIRMED'), startAt: timestamp, endAt: timestamp, plannerId: uuid, internalNotes: notes.optional() }).strict().refine(v => Date.parse(v.endAt) > Date.parse(v.startAt), 'endAt must be after startAt'),
  z.object({ state: z.enum(['COMPLETED', 'CANCELLED']), internalNotes: notes.optional() }).strict(),
]);
export const invitationInput = z.object({ email, displayName: text, role: role.exclude(['FOUNDER']), clientId: uuid.optional(), weddingId: uuid.optional() }).strict().superRefine((v, ctx) => {
  if (v.role === 'CLIENT' && (!v.clientId || !v.weddingId)) ctx.addIssue({ code: 'custom', message: 'Client invitations require clientId and weddingId' });
  if (v.role !== 'CLIENT' && (v.clientId || v.weddingId)) ctx.addIssue({ code: 'custom', message: 'Staff invitations cannot link a client' });
});
export const userPatch = z.object({ role: role.exclude(['FOUNDER', 'CLIENT']).optional(), active: z.boolean().optional() }).strict().refine(v => Object.keys(v).length > 0);
export const profileDto = z.object({ id: uuid, email: z.email(), displayName: z.string(), role, active: z.boolean(), timezone: z.literal('Asia/Kolkata') }).strict();
export const clientDto = z.object({ id: uuid, name: z.string(), email: z.email(), phone: z.string().nullable(), requirements: z.string().nullable(), userId: uuid.nullable(), archivedAt: timestamp.nullable(), createdAt: timestamp, updatedAt: timestamp }).strict();
export const clientWeddingDto = z.object({ id: uuid, title: z.string(), weddingDate: z.iso.date().nullable(), packageType, state: weddingState, guestCount: z.number().int().nullable(), preferredTheme: z.string().nullable(), coupleDetails: z.string().nullable(), location: z.string().nullable(), requirements: z.string().nullable(), currency: z.string(), proposalStatus: z.enum(['DRAFT', 'CONFIRMED']), timezone: z.literal('Asia/Kolkata'), createdAt: timestamp, updatedAt: timestamp }).strict();
export const staffWeddingDto = clientWeddingDto.extend({ budgetMax: z.string().nullable().optional(), internalNotes: z.string().nullable(), clientIds: z.array(uuid), assignedUserIds: z.array(uuid) }).strict();
export const weddingDto = z.union([staffWeddingDto, clientWeddingDto]);
export const clientEnquiryDto = z.object({ id: uuid, weddingId: uuid, stage: enquiryStage, createdAt: timestamp, updatedAt: timestamp }).strict();
export const staffEnquiryDto = clientEnquiryDto.extend({ source: z.string().nullable(), internalNotes: z.string().nullable(), followUpStatus, followUpAt: timestamp.nullable(), assignedToId: uuid.nullable() }).strict();
export const enquiryDto = z.union([staffEnquiryDto, clientEnquiryDto]);
export const clientConsultationDto = z.object({ id: uuid, weddingId: uuid, state: consultationState, preferredAt: timestamp, message: z.string().nullable(), startAt: timestamp.nullable(), endAt: timestamp.nullable(), createdAt: timestamp, updatedAt: timestamp }).strict();
export const staffConsultationDto = clientConsultationDto.extend({ plannerId: uuid.nullable(), internalNotes: z.string().nullable(), requestedBy: uuid }).strict();
export const consultationDto = z.union([staffConsultationDto, clientConsultationDto]);
export const assignmentDto = z.object({ weddingId: uuid, userId: uuid }).strict();
export const archivedDto = z.object({ id: uuid, archivedAt: timestamp }).strict();
export const loginInput = z.object({ email, password: z.string().min(1).max(1024) }).strict();
export const refreshInput = z.object({ refreshToken: z.string().min(1).max(4096).regex(/^\S+$/) }).strict();
export const sessionDto = z.object({ accessToken: z.string().min(1).regex(/^\S+$/), refreshToken: z.string().min(1).regex(/^\S+$/), expiresAt: z.number().int().positive(), tokenType: z.literal('bearer'), user: profileDto }).strict();
export const successDto = z.object({ success: z.literal(true) }).strict();
export const errorDto = z.object({ error: z.object({ code: z.string(), message: z.string(), fields: z.array(z.object({ path: z.string(), message: z.string() })).optional(), requestId: uuid }).strict() }).strict();
export const listOf = <T extends z.ZodType>(item: T) => z.object({ data: z.array(item), page: z.number().int(), pageSize: z.number().int(), total: z.number().int() }).strict();

// Frontend imports these types; runtime validation and OpenAPI share the same schemas.
export type UserResponse = z.infer<typeof profileDto>;
export type ClientResponse = z.infer<typeof clientDto>;
export type ClientWeddingResponse = z.infer<typeof clientWeddingDto>;
export type StaffWeddingResponse = z.infer<typeof staffWeddingDto>;
export type WeddingResponse = z.infer<typeof weddingDto>;
export type EnquiryResponse = z.infer<typeof enquiryDto>;
export type ConsultationResponse = z.infer<typeof consultationDto>;
export type ErrorResponse = z.infer<typeof errorDto>;
export type Page<T> = { data: T[]; page: number; pageSize: number; total: number };
export type CreateClientRequest = z.infer<typeof clientInput>;
export type CreateEnquiryRequest = z.infer<typeof enquiryInput>;
export type UpdateWeddingRequest = z.infer<typeof weddingPatch>;
export type UpdateEnquiryRequest = z.infer<typeof enquiryPatch>;
export type RequestConsultationRequest = z.infer<typeof requestConsultation>;
export type DecideConsultationRequest = z.infer<typeof consultationDecision>;
export type InviteUserRequest = z.infer<typeof invitationInput>;
export type CreateWeddingRequest = z.infer<typeof createWeddingInput>;
export type UpdateClientRequest = z.infer<typeof clientPatch>;
export type ArchiveResponse = z.infer<typeof archivedDto>;
export type LoginRequest = z.infer<typeof loginInput>;
export type RefreshRequest = z.infer<typeof refreshInput>;
export type SessionResponse = z.infer<typeof sessionDto>;

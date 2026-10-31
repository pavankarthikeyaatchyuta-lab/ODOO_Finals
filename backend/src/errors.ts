import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * Standardized operational error class carrying HTTP status code and machine-readable error codes.
 */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
/**
 * Helper returning a 404 NOT_FOUND ApiError.
 */
export const missing = () => new ApiError(404, 'NOT_FOUND', 'Record not found');
/**
 * Helper returning a 403 FORBIDDEN ApiError.
 */
export const forbidden = () => new ApiError(403, 'FORBIDDEN', 'This action is not permitted');

/**
 * Global Express error handling middleware converting unhandled rejections into uniform error DTOs.
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    let status = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred';
    let fields: { path: string; message: string }[] | undefined;
    if (error instanceof ApiError) ({ status, code, message } = error);
    else if (error instanceof z.ZodError) { status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid request'; fields = error.issues.map(i => ({ path: i.path.join('.'), message: i.message })); }
    else if (error instanceof Prisma.PrismaClientUnknownRequestError && error.message.includes('consultation_no_overlap')) {
      // Prisma 6 reports PostgreSQL exclusion violations as UnknownRequestError.
      status = 409; code = 'SCHEDULING_CONFLICT'; message = 'The planner already has an overlapping confirmed consultation';
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') { status = 409; code = 'DUPLICATE_RECORD'; message = 'A record with these unique values already exists'; }
      else if (error.code === 'P2003' || error.code === 'P2025') { status = 400; code = 'INVALID_REFERENCE'; message = 'A referenced record is unavailable'; }
      else if (error.meta?.code === '23P01' || String(error.meta?.database_error ?? '').includes('consultation_no_overlap')) { status = 409; code = 'SCHEDULING_CONFLICT'; message = 'The planner already has an overlapping confirmed consultation'; }
      else if (error.code === 'P2034') { status = 409; code = 'CONCURRENT_CHANGE'; message = 'A concurrent change occurred; retry with the same key'; }
      else if (['P2024', 'P2028', 'P1001', 'P1002'].includes(error.code)) { status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'Database temporarily unavailable'; }
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'Database temporarily unavailable';
    } else if (error && typeof error === 'object' && 'type' in error) {
      if (error.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body'; }
      if (error.type === 'entity.too.large') { status = 413; code = 'BODY_TOO_LARGE'; message = 'Request body exceeds 64kb'; }
    }
    if (status === 500) console.error(JSON.stringify({ requestId: res.locals.requestId, code, errorType: error instanceof Error ? error.name : 'Unknown', ...(error instanceof Prisma.PrismaClientKnownRequestError ? { databaseCode: error.code } : {}) }));
    if (status === 429) res.set('Retry-After', '60');
    res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}), requestId: res.locals.requestId } });
  };

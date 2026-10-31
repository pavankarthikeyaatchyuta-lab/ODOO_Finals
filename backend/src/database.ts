/**
 * Singleton Prisma database client instance connected to PostgreSQL.
 */
import { PrismaClient } from '@prisma/client';

// One pool per process; Vercel reuses this module across requests.
export const db = new PrismaClient();

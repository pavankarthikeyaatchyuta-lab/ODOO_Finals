/**
 * =============================================================================
 * File: database.ts
 * Module: Application Module
 * =============================================================================
 * Core logic and functionality for database.ts within The Royal Knot luxury wedding platform.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

/**
 * Singleton Prisma database client instance connected to PostgreSQL.
 */
import { PrismaClient } from '@prisma/client';

// One pool per process; Vercel reuses this module across requests.
export const db = new PrismaClient();

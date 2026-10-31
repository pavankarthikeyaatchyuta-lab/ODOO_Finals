import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createApp } from './application.js';
import { supabaseIdentity } from './identity.js';

const env = z.object({ DATABASE_URL: z.url(), SUPABASE_URL: z.url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), ALLOWED_ORIGINS: z.string().min(1), AUTH_REDIRECT_URL: z.url(), PORT: z.coerce.number().int().min(1).max(65535).default(3001) }).parse(process.env);
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => new URL(origin.trim()).origin);
if (!allowedOrigins.includes(new URL(env.AUTH_REDIRECT_URL).origin)) throw new Error('AUTH_REDIRECT_URL must use an allowed frontend origin');
const db = new PrismaClient();
const app = createApp(db, supabaseIdentity(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.AUTH_REDIRECT_URL), { allowedOrigins }, express());
if (!process.env.VERCEL) app.listen(env.PORT, () => console.log(`Royal Knot API listening on port ${env.PORT}`));
export default app;

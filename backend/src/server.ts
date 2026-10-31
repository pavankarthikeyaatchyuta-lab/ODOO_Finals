import 'dotenv/config';
import express from 'express';
import { db } from './database.js';
import { readConfig } from './config.js';
import { createApp } from './application.js';
import { supabaseIdentity } from './identity.js';
import { supabaseDocuments } from './storage.js';

/** Load and validate production environment variables from process.env */
const env = readConfig(process.env);
/** Instantiate Express application with database connection, Supabase auth identity, and document storage */
const app = createApp(db, supabaseIdentity(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.AUTH_REDIRECT_URL), { allowedOrigins: env.allowedOrigins, documents: supabaseDocuments(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.DOCUMENT_BUCKET) }, express());
if (!process.env.VERCEL) app.listen(env.PORT, () => console.log(`Royal Knot API listening on port ${env.PORT}`));
export default app;

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { email } from '../src/contracts.js';
import { supabaseIdentity } from '../src/identity.js';
import { audit } from '../src/access.js';

const env = z.object({ SUPABASE_URL: z.url(), SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), AUTH_REDIRECT_URL: z.url(), FOUNDER_EMAIL: email, FOUNDER_NAME: z.string().trim().min(1).max(200) }).parse(process.env);
const db = new PrismaClient();
try {
  await db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('bootstrap-founder', 0))`;
    const founder = await tx.userProfile.findFirst({ where: { role: 'FOUNDER' } });
    if (founder) {
      if (founder.email !== env.FOUNDER_EMAIL) throw new Error('A founder already exists; bootstrap will not replace it');
      console.log('Founder already configured');
      return;
    }
    if (await tx.userProfile.findUnique({ where: { email: env.FOUNDER_EMAIL } })) throw new Error('Email belongs to an existing profile; bootstrap will not escalate it');
    const id = await supabaseIdentity(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.AUTH_REDIRECT_URL).invite(env.FOUNDER_EMAIL);
    await tx.userProfile.create({ data: { id, email: env.FOUNDER_EMAIL, displayName: env.FOUNDER_NAME, role: 'FOUNDER' } });
    await audit(tx, id, 'FOUNDER_BOOTSTRAPPED', id, null);
    console.log('Founder profile configured; use the invitation or password recovery to sign in');
  }, { timeout: 30000 });
} finally { await db.$disconnect(); }

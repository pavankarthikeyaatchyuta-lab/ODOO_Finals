import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.url().refine(value => ['postgresql:', 'postgres:'].includes(new URL(value).protocol), 'A PostgreSQL URL is required'),
  SUPABASE_URL: z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol)),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), ALLOWED_ORIGINS: z.string().min(1), AUTH_REDIRECT_URL: z.url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});
export function readConfig(input: NodeJS.ProcessEnv) {
  const env = schema.parse(input);
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(value => {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('ALLOWED_ORIGINS must contain exact HTTP(S) origins');
    return url.origin;
  });
  const redirect = new URL(env.AUTH_REDIRECT_URL);
  if (redirect.username || redirect.password || !allowedOrigins.includes(redirect.origin)) throw new Error('AUTH_REDIRECT_URL must use an allowed frontend origin');
  return { ...env, allowedOrigins };
}

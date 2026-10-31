import { z } from 'zod';

const loopback = (url: URL) => ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
function secureHttp(url: URL) { return url.protocol === 'https:' || (url.protocol === 'http:' && loopback(url)); }

const schema = z.object({
  DATABASE_URL: z.url().refine(value => ['postgresql:', 'postgres:'].includes(new URL(value).protocol), 'A PostgreSQL URL is required'),
  SUPABASE_URL: z.url().refine(value => { const url = new URL(value); return secureHttp(url) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'; }, 'Supabase requires an HTTPS origin, or loopback HTTP for local development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), ALLOWED_ORIGINS: z.string().min(1), AUTH_REDIRECT_URL: z.url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DOCUMENT_BUCKET: z.string().regex(/^[a-z0-9-]+$/).default('wedding-documents'),
});
export function readConfig(input: NodeJS.ProcessEnv) {
  const env = schema.parse(input);
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(value => {
    const url = new URL(value.trim());
    if (!secureHttp(url) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('ALLOWED_ORIGINS must contain exact HTTPS origins (HTTP allowed only on loopback)');
    return url.origin;
  });
  const redirect = new URL(env.AUTH_REDIRECT_URL);
  if (redirect.username || redirect.password || !allowedOrigins.includes(redirect.origin)) throw new Error('AUTH_REDIRECT_URL must use an allowed frontend origin');
  return { ...env, allowedOrigins };
}

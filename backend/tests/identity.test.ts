import { after, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { supabaseIdentity } from '../src/identity.js';

const userId = randomUUID();
const otherId = randomUUID();
let invites = 0;
let lastToken = '';
let logoutToken = '';
let adminToken = '';
const issuedToken = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, aud: 'authenticated' })).toString('base64url')}.dGVzdA`;
const otherToken = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: otherId, exp: Math.floor(Date.now() / 1000) + 3600, aud: 'authenticated' })).toString('base64url')}.dGVzdA`;
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url?.startsWith('/auth/v1/token?')) {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw);
    if (body.password === 'correct' || body.refresh_token === 'valid-refresh') {
      const other = body.email === 'other@test.invalid';
      res.end(JSON.stringify({ access_token: other ? otherToken : issuedToken, refresh_token: other ? 'other-refresh' : 'rotated-refresh', token_type: 'bearer', expires_in: 3600, user: { id: other ? otherId : userId, email: other ? 'other@test.invalid' : 'known@test.invalid', aud: 'authenticated' } }));
    }
    else { res.statusCode = body.password === 'rate-limited' ? 429 : 400; res.end(JSON.stringify({ message: 'Invalid credentials or session', code: 'invalid_credentials' })); }
  } else if (req.url?.startsWith('/auth/v1/logout?')) {
    logoutToken = req.headers.authorization ?? '';
    res.statusCode = 204; res.end();
  } else if (req.url === '/auth/v1/user') {
    lastToken = req.headers.authorization ?? '';
    if (lastToken === 'Bearer valid') res.end(JSON.stringify({ id: userId, email: 'known@test.invalid', aud: 'authenticated' }));
    else if (lastToken === 'Bearer throttled') { res.statusCode = 429; res.end(JSON.stringify({ message: 'Rate limit exceeded', code: 'over_request_rate_limit' })); }
    else { res.statusCode = 401; res.end(JSON.stringify({ message: 'Expired or invalid JWT', code: 'bad_jwt' })); }
  } else if (req.url?.startsWith('/auth/v1/admin/users')) {
    adminToken = req.headers.authorization ?? '';
    res.end(JSON.stringify({ users: [{ id: userId, email: 'known@test.invalid' }], aud: 'authenticated', total: 1 }));
  } else if (req.url?.startsWith('/auth/v1/invite?') && req.method === 'POST') {
    invites++; res.end(JSON.stringify({ id: randomUUID(), email: 'new@test.invalid', aud: 'authenticated' }));
  } else { res.statusCode = 404; res.end('{}'); }
});
let provider: ReturnType<typeof supabaseIdentity>;
before(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test identity port');
  provider = supabaseIdentity(`http://127.0.0.1:${address.port}`, 'test-server-key', 'https://frontend.test/auth/callback');
});
after(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
it('verifies bearer tokens through Supabase Auth instead of trusting decoded claims', async () => {
  assert.equal(await provider.verify('valid'), userId);
  assert.equal(lastToken, 'Bearer valid');
  assert.equal(await provider.verify('expired'), null);
  assert.equal(await provider.verify('malformed'), null);
  // A future-expiry JWT with a real-looking subject still fails provider verification.
  assert.equal(await provider.verify(issuedToken), null);
});
it('recovers an existing identity without sending duplicate invitations', async () => {
  assert.equal(await provider.invite('known@test.invalid'), userId);
  assert.equal(invites, 0);
});
it('sends a new identity invitation through Supabase Auth', async () => {
  assert.match(await provider.invite('new@test.invalid'), /^[0-9a-f-]{36}$/);
  assert.equal(invites, 1);
});
it('uses isolated Supabase clients for password login and refresh, and preserves the identity mapping', async () => {
  const [loggedIn, refreshed] = await Promise.all([provider.signIn('known@test.invalid', 'correct'), provider.refresh('valid-refresh')]);
  for (const session of [loggedIn, refreshed]) {
    assert.equal(session?.userId, userId);
    assert.equal(session?.accessToken, issuedToken);
    assert.equal(session?.refreshToken, 'rotated-refresh');
    assert.equal(session?.tokenType, 'bearer');
    assert.ok(session!.expiresAt > Date.now() / 1000);
  }
  assert.equal(await provider.invite('known@test.invalid'), userId);
});
it('rejects invalid password/refresh credentials and maps provider rate limits', async () => {
  assert.equal(await provider.signIn('known@test.invalid', 'wrong'), null);
  assert.equal(await provider.refresh('expired'), null);
  await assert.rejects(provider.signIn('known@test.invalid', 'rate-limited'), { status: 429, code: 'AUTH_RATE_LIMITED' });
});
it('revokes the bearer session through the Supabase logout endpoint', async () => {
  await provider.signOut('valid');
  assert.equal(logoutToken, 'Bearer valid');
});
it('reports Supabase verification throttling without misclassifying a valid token as invalid', async () => {
  await assert.rejects(provider.verify('throttled'), { status: 429, code: 'AUTH_RATE_LIMITED' });
});
it('isolates two concurrent users in the actual SDK adapter and preserves administrative authorization', async () => {
  const [first, second] = await Promise.all([provider.signIn('known@test.invalid', 'correct'), provider.signIn('other@test.invalid', 'correct')]);
  assert.equal(first?.userId, userId); assert.equal(first?.accessToken, issuedToken);
  assert.equal(second?.userId, otherId); assert.equal(second?.accessToken, otherToken);
  assert.equal(await provider.invite('known@test.invalid'), userId);
  assert.equal(adminToken, 'Bearer test-server-key');
});

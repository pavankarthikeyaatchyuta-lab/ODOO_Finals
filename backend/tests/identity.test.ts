import { after, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { supabaseIdentity } from '../src/identity.js';

const userId = randomUUID();
let invites = 0;
let lastToken = '';
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/auth/v1/user') {
    lastToken = req.headers.authorization ?? '';
    if (lastToken === 'Bearer valid') res.end(JSON.stringify({ id: userId, email: 'known@test.invalid', aud: 'authenticated' }));
    else { res.statusCode = 401; res.end(JSON.stringify({ message: 'Expired or invalid JWT', code: 'bad_jwt' })); }
  } else if (req.url?.startsWith('/auth/v1/admin/users')) {
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
});
it('recovers an existing identity without sending duplicate invitations', async () => {
  assert.equal(await provider.invite('known@test.invalid'), userId);
  assert.equal(invites, 0);
});
it('sends a new identity invitation through Supabase Auth', async () => {
  assert.match(await provider.invite('new@test.invalid'), /^[0-9a-f-]{36}$/);
  assert.equal(invites, 1);
});

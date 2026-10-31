import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, delimiter } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';

const socket = createServer();
await new Promise<void>(resolve => socket.listen(0, '127.0.0.1', resolve));
const address = socket.address();
if (!address || typeof address === 'string') throw new Error('Unable to allocate test port');
const port = address.port;
await new Promise<void>((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
const password = randomUUID();
const directory = await mkdtemp(join(tmpdir(), 'royal-knot-pg-'));
const pg = new EmbeddedPostgres({ databaseDir: directory, user: 'postgres', password, port, persistent: false, postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: () => {} });
const ownerUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/royal_knot_test?schema=app`;
const runtimeUrl = `postgresql://rk_backend:${password}@127.0.0.1:${port}/royal_knot_test?schema=app&connection_limit=10`;
const env = { ...process.env, PATH: dirname(process.execPath) + delimiter + process.env.PATH, DATABASE_URL: runtimeUrl, DIRECT_URL: ownerUrl, TEST_ADMIN_URL: ownerUrl, ROYAL_KNOT_ISOLATED_TEST: 'true' };
async function run(args: string[], overrides: Record<string, string> = {}) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env: { ...env, ...overrides }, windowsHide: true });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Test command exited with ${code}`)));
  });
}
try {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('royal_knot_test');
  const admin = new Client({ connectionString: ownerUrl });
  await admin.connect();
  try { await admin.query('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN'); } finally { await admin.end(); }
  await run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { DATABASE_URL: ownerUrl });
  // A second deploy must be safe and leave all custom constraints intact.
  await run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { DATABASE_URL: ownerUrl });
  const setup = new Client({ connectionString: ownerUrl });
  await setup.connect();
  try {
    const statement = await setup.query<{ sql: string }>("SELECT format('ALTER ROLE rk_backend LOGIN PASSWORD %L', $1::text) AS sql", [password]);
    await setup.query(statement.rows[0]!.sql);
  } finally { await setup.end(); }
  await run(['--import', 'tsx', 'scripts/openapi.ts', '--check']);
  await run(['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/integration.test.ts', 'tests/identity.test.ts', 'tests/foundation.test.ts', 'tests/workflows.test.ts', 'tests/security.test.ts', 'tests/operations.test.ts']);
} finally { await pg.stop(); }

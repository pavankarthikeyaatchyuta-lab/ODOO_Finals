import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve, delimiter } from 'node:path';
import { createServer } from 'node:net';
import { execFile, spawn } from 'node:child_process';

// Supabase auth clients need the native WebSocket that ships with Node 22 (see package.json engines).
if (Number(process.versions.node.split('.')[0]) < 22) throw new Error(`Node 22+ required for the test suite (running ${process.version}); try: npx -y node@22 --import tsx scripts/test.ts`);
const socket = createServer();
await new Promise<void>(resolve => socket.listen(0, '127.0.0.1', resolve));
const address = socket.address();
if (!address || typeof address === 'string') throw new Error('Unable to allocate test port');
const port = address.port;
await new Promise<void>((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
const password = randomUUID();
const testRoot = resolve(tmpdir());
const directory = await mkdtemp(join(testRoot, 'royal-knot-pg-'));
// Own cleanup so Windows file-handle release can be retried after PostgreSQL stops.
const pg = new EmbeddedPostgres({ databaseDir: directory, user: 'postgres', password, port, persistent: true, postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: () => {} });
if (process.platform === 'win32') {
  // The package's taskkill shutdown can orphan Windows PostgreSQL I/O workers and their pipes.
  const packageName = '@embedded-postgres/windows-x64';
  const binaries: unknown = await import(packageName);
  if (!binaries || typeof binaries !== 'object' || !('postgres' in binaries) || typeof binaries.postgres !== 'string') throw new Error('Embedded PostgreSQL binary unavailable');
  const pgCtl = join(dirname(binaries.postgres), 'pg_ctl.exe');
  let shutdown: Promise<void> | undefined;
  pg.stop = () => shutdown ??= (async () => {
    const target = resolve(directory);
    if (dirname(target) !== testRoot || !basename(target).startsWith('royal-knot-pg-')) throw new Error('Refusing shutdown outside the generated test directory');
    if (!await access(join(target, 'postmaster.pid')).then(() => true, () => false)) return;
    await new Promise<void>((resolve, reject) => execFile(pgCtl, ['stop', '-D', target, '-m', 'fast', '-w', '-t', '15'], { windowsHide: true, timeout: 20000 }, error => error ? reject(new Error('Disposable PostgreSQL shutdown failed')) : resolve()));
  })();
}
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
  // Fails if the migrated database and schema.prisma disagree on tables, columns, keys or indexes.
  await run(['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-url', ownerUrl, '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], { DATABASE_URL: ownerUrl });
  const setup = new Client({ connectionString: ownerUrl });
  await setup.connect();
  try {
    const statement = await setup.query<{ sql: string }>("SELECT format('ALTER ROLE rk_backend LOGIN PASSWORD %L', $1::text) AS sql", [password]);
    await setup.query(statement.rows[0]!.sql);
  } finally { await setup.end(); }
  await run(['--import', 'tsx', 'scripts/openapi.ts', '--check']);
  await run(['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/integration.test.ts', 'tests/identity.test.ts', 'tests/foundation.test.ts', 'tests/workflows.test.ts', 'tests/security.test.ts', 'tests/operations.test.ts', 'tests/finance.test.ts', 'tests/e2e.test.ts', 'tests/qa.test.ts', 'tests/migration-upgrade.test.ts', 'tests/auth-security.test.ts']);
} finally {
  await pg.stop();
  const target = resolve(directory);
  if (dirname(target) !== testRoot || !basename(target).startsWith('royal-knot-pg-')) throw new Error('Refusing cleanup outside the generated test directory');
  await rm(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

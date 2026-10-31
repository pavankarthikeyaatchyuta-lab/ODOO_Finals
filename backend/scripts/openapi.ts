import { writeFile, readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/application.js';

const db = new PrismaClient();
try {
  const app = createApp(db, { verify: async () => null, invite: async () => { throw new Error('Contract generation must not contact Auth'); } }, { allowedOrigins: [] });
  const document = JSON.stringify(app.locals.openapi, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if ((await readFile('openapi.json', 'utf8')).replace(/\r\n/g, '\n') !== document) throw new Error('OpenAPI drift: run npm run contracts and commit openapi.json');
    console.log('OpenAPI matches route and shared response schemas');
  } else { await writeFile('openapi.json', document); console.log('Generated openapi.json'); }
} finally { await db.$disconnect(); }

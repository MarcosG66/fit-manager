import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const run = file => execFileSync(process.execPath, [join(here, file)], { stdio: 'inherit', env: process.env });
// Apenas demonstração acadêmica. CREATE TABLE IF NOT EXISTS é idempotente.
if (process.env.DB_AUTO_INIT === 'true')
  run('init-db.js');
if (process.env.DEMO_SEED === 'true')
  run('seed.js');
await import('../src/index.js');

import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { assertLocalDatabase } from './local-safety.mjs';

const [task, ...args] = process.argv.slice(2);
if (['migrate-test', 'status-test', 'test', 'serve-test'].includes(task)) {
  process.env.DATABASE_URL = assertLocalDatabase(process.env.TEST_DATABASE_URL, true);
  process.env.BETTER_AUTH_URL = 'http://localhost:3100';
} else if (task === 'migrate') {
  assertLocalDatabase(process.env.DATABASE_URL);
}
const commands = {
  migrate: ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  'migrate-test': ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  'status-test': ['node_modules/prisma/build/index.js', 'migrate', 'status'],
  test: ['node_modules/@playwright/test/cli.js', 'test'],
  'serve-test': ['node_modules/next/dist/bin/next', 'dev', '--hostname', 'localhost', '--port', '3100'],
};
if (!commands[task]) throw new Error('Unknown local task.');
const result = spawnSync(process.execPath, [...commands[task], ...args], { stdio: 'inherit', env: process.env });
if (result.error) throw new Error('Unable to launch local task.');
process.exit(result.status ?? 1);

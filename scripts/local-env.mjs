import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';

if (existsSync('.env')) throw new Error('.env already exists; refusing to overwrite configuration.');
const password = randomBytes(32).toString('hex');
const secret = randomBytes(48).toString('hex');
writeFileSync('.env', [
  `DATABASE_URL=postgresql://kiliride:${password}@127.0.0.1:55432/kiliride_dev`,
  `TEST_DATABASE_URL=postgresql://kiliride:${password}@127.0.0.1:55433/kiliride_test`,
  `POSTGRES_PASSWORD=${password}`,
  `BETTER_AUTH_SECRET=${secret}`,
  'BETTER_AUTH_URL=http://localhost:3000',
  'SMTP_HOST=127.0.0.1', 'SMTP_PORT=11025',
  'MAIL_FROM="KiliRide <noreply@kiliride.test>"',
  'MAILPIT_URL=http://127.0.0.1:18025', '',
].join('\n'), { flag: 'wx', mode: 0o600 });
console.log('Created ignored .env with generated local credentials. No credentials printed.');

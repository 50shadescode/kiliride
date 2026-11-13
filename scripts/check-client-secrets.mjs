import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const keys = ['DATABASE_URL','TEST_DATABASE_URL','BETTER_AUTH_SECRET','SMTP_PASSWORD','MIGRATION_DATABASE_URL','STORAGE_ACCESS_KEY_ID','STORAGE_SECRET_ACCESS_KEY'];
const values = keys.map(key => process.env[key]).filter(value => value && value.length >= 8);
for (const key of ['DATABASE_URL','TEST_DATABASE_URL']) {
  if (process.env[key]) { const password = decodeURIComponent(new URL(process.env[key]).password); if (password.length >= 8) values.push(password); }
}
const forbidden = ['Invalid KiliRide runtime configuration.', 'SMTP_DELIVERY_ENABLED', 'DB_EXPECTED_USER', 'STORAGE_SECRET_ACCESS_KEY', 'Private photograph storage unavailable.'];
let count = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(js|map)$/.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      if ([...values, ...forbidden].some(value => source.includes(value))) throw new Error('Client secret/server configuration boundary check failed (values redacted).');
      count++;
    }
  }
}
await walk('.next/static');
if (!count || !values.length) throw new Error('Build output and secret scan inputs are required.');
console.log(`PASS: ${count} client artifacts contain no configured secret values or runtime configuration module markers.`);

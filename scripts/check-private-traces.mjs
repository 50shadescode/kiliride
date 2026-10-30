import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const project = process.cwd();
let checked = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.nft.json')) {
      const trace = JSON.parse(await readFile(file, 'utf8'));
      for (const item of trace.files ?? []) {
        const relative = path.relative(project, path.resolve(directory, item)).replaceAll('\\', '/');
        assert.ok(!/^(?:\.data(?:\/|$)|backups(?:\/|$)|\.env(?:\.|$))/i.test(relative), 'Private runtime data must not be packaged in a build trace.');
      }
      checked++;
    }
  }
}
await walk(path.join(project, '.next'));
assert.ok(checked > 0, 'Run the production build before checking traces.');
console.log(`PASS: ${checked} build traces exclude private image storage, backups and environment files.`);

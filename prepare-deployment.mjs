import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const files = JSON.parse(await readFile('pages-files.json', 'utf8'));
for (const entry of ['index.html', '404.html', '.nojekyll']) {
  if (!Object.hasOwn(files, entry)) throw new Error('Missing release entry: ' + entry);
}
const artifact = await mkdtemp(join(process.env.RUNNER_TEMP || tmpdir(), 'fleet-pages-'));
for (const [name, digest] of Object.entries(files)) {
  const parts = name.split('/');
  if (name !== '.nojekyll' && parts.some(part => !/^[\w@-][\w.@-]*$/.test(part))) {
    throw new Error('Unexpected asset path in the release inventory');
  }
  const bytes = await readFile(name);
  if (createHash('sha256').update(bytes).digest('hex') !== digest) throw new Error('Asset digest mismatch: ' + name);
  await mkdir(join(artifact, dirname(name)), { recursive: true });
  await writeFile(join(artifact, name), bytes);
}
await writeFile(join(artifact, 'pages-files.json'), JSON.stringify(files, null, 2) + '\n');
console.log(artifact);

import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const token = process.env.MAPBOX_PUBLIC_TOKEN || '';
if (token && !/^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
  throw new Error('MAPBOX_PUBLIC_TOKEN must be a public Mapbox token.');
}
if (!token && process.argv.includes('--require-mapbox')) {
  throw new Error('Configure a URL-restricted MAPBOX_PUBLIC_TOKEN before publishing the Fleet map.');
}

const files = JSON.parse(await readFile('pages-files.json', 'utf8'));
for (const entry of ['index.html', '404.html', '.nojekyll', 'map-config.js']) {
  if (!Object.hasOwn(files, entry)) throw new Error('Missing release entry: ' + entry);
}
const artifact = await mkdtemp(join(process.env.RUNNER_TEMP || tmpdir(), 'fleet-pages-'));
for (const [name, digest] of Object.entries(files)) {
  const parts = name.split('/');
  if (name !== '.nojekyll' && parts.some(part => !/^[\w@-][\w.@-]*$/.test(part))) {
    throw new Error('Unexpected asset path in the release inventory');
  }
  let bytes = await readFile(name);
  if (createHash('sha256').update(bytes).digest('hex') !== digest) throw new Error('Asset digest mismatch: ' + name);
  if (name === 'map-config.js') {
    if (bytes.toString('utf8').trim() !== "window.__FLEET_MAP_CONFIG__ = { publicToken: '' };") {
      throw new Error('The checked-in map configuration must be the empty public template.');
    }
    if (token) {
      bytes = Buffer.from('window.__FLEET_MAP_CONFIG__ = ' + JSON.stringify({ publicToken: token }) + ';\n');
      files[name] = createHash('sha256').update(bytes).digest('hex');
    }
  }
  await mkdir(join(artifact, dirname(name)), { recursive: true });
  await writeFile(join(artifact, name), bytes);
}
await writeFile(join(artifact, 'pages-files.json'), JSON.stringify(files, null, 2) + '\n');
console.log(artifact);

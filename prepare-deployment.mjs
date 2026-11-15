import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
const token = process.env.MAPBOX_PUBLIC_TOKEN;
if (!token?.startsWith('pk.')) throw new Error('A public Mapbox browser token is required; secret tokens are refused.');
await mkdir('_site', { recursive: true });
for (const entry of ['index.html', '404.html', '.nojekyll', 'assets', 'brand', 'demo', 'geo']) {
  await cp(entry, `_site/${entry}`, { recursive: true });
}
let count = 0;
for (const name of await readdir('_site/assets')) {
  if (!name.endsWith('.js')) continue;
  const path = `_site/assets/${name}`;
  const content = await readFile(path, 'utf8');
  if (content.includes('__MAPBOX_PUBLIC_TOKEN__')) {
    await writeFile(path, content.replaceAll('__MAPBOX_PUBLIC_TOKEN__', token));
    count++;
  }
}
if (!count) throw new Error('Missing deployment token placeholder.');
console.log('Prepared static deployment.');

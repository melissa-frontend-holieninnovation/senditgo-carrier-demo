import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles, RUNTIME_SOURCE, TAG_MARKER } from './lib/site.mjs';
import { tours } from '../src/tours/index.js';

const [base, revision] = process.argv.slice(2);
assert(
  base?.endsWith('/') && /^[0-9a-f]{40}$/.test(revision),
  'Expected the Pages base URL and upstream revision.'
);
const stamp = Date.now().toString();
const digest = (body) => createHash('sha256').update(body).digest('hex');
async function get(path) {
  const url = new URL(path, base);
  url.searchParams.set('tour-check', stamp);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  assert(response.ok, `${path} returned ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

assert.equal(
  (await get('.upstream-revision')).toString().trim(),
  revision,
  'Live upstream revision'
);
const inventory = JSON.parse(await get('pages-files.json'));
const files = await listFiles(RUNTIME_SOURCE);
await Promise.all(
  files.map(async (file) => {
    const path = 'tour/' + file;
    const expected = digest(await readFile(join(RUNTIME_SOURCE, file)));
    assert.equal(inventory[path], expected, path + ' inventory');
    assert.equal(digest(await get(path)), expected, path + ' content');
  })
);
for (const tour of tours) {
  const path = tour.steps[0].route.replace(/^\/+|\/+$/g, '');
  const entry = path ? path + '/index.html' : 'index.html';
  const html = await get(entry);
  assert.equal(digest(html), inventory[entry], entry + ' content');
  assert.equal(
    html.toString().split(TAG_MARKER).length,
    2,
    entry + ' must load the tour once'
  );
}
console.log(
  `Verified ${tours.length} tour entries and ${files.length} runtime files for ${revision}.`
);

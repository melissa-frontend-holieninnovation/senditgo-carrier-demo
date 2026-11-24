import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import {
  detectBasePath,
  injectTag,
  injectTour,
  TAG_MARKER,
} from '../tools/lib/site.mjs';

const BASE = '/senditgo-carrier-demo/';
const APP_PAGE = `<!doctype html><html><head><title>SenditGo Fleet Web</title>
    <script type="module" crossorigin src="${BASE}assets/index-B-8OkwbM.js"></script>
    <link rel="stylesheet" crossorigin href="${BASE}assets/index-Dxp68LlU.css">
  </head><body><div id="root"></div></body></html>`;
const PLAIN_PAGE =
  '<!doctype html><html><head><title>Walkthrough</title></head><body><video></video></body></html>';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const temps = [];
async function temp() {
  const dir = await mkdtemp(join(tmpdir(), 'tour-test-'));
  temps.push(dir);
  return dir;
}
after(async () => {
  await Promise.all(
    temps.map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

async function write(root, files) {
  for (const [name, content] of Object.entries(files)) {
    await mkdir(join(root, name, '..'), { recursive: true });
    await writeFile(join(root, name), content);
  }
}

test('detects the site base path from the app entry script', () => {
  assert.equal(detectBasePath(APP_PAGE), BASE);
  assert.equal(detectBasePath(APP_PAGE.replaceAll(BASE, '/')), '/');
  assert.equal(detectBasePath(PLAIN_PAGE), null);
});

test('adds the tour tag once, right after the app entry script', () => {
  const first = injectTag(APP_PAGE);
  assert.equal(first.changed, true);
  assert.equal(first.html.split(TAG_MARKER).length - 1, 1);
  assert.match(
    first.html,
    new RegExp(
      `index-B-8OkwbM\\.js"></script>\\s+<script type="module" src="${BASE}tour/index\\.js" ${TAG_MARKER}></script>`
    )
  );

  const second = injectTag(first.html);
  assert.equal(second.changed, false);
  assert.equal(second.reason, 'already-injected');
  assert.equal(second.html, first.html);
});

test('leaves a page that does not load the app untouched', () => {
  const result = injectTag(PLAIN_PAGE);
  assert.deepEqual(
    { changed: result.changed, reason: result.reason, html: result.html },
    { changed: false, reason: 'no-app-entry', html: PLAIN_PAGE }
  );
});

test('injects into every app page of a site and keeps the inventory checksums true', async () => {
  const site = await temp();
  const inventory = {
    'index.html': 'old',
    'run-management/run-sheets/index.html': 'old',
    'walkthrough.html': sha256(PLAIN_PAGE),
  };
  await write(site, {
    'index.html': APP_PAGE,
    'run-management/run-sheets/index.html': APP_PAGE,
    'walkthrough.html': PLAIN_PAGE,
    'pages-files.json': JSON.stringify(inventory),
  });

  const result = await injectTour(site);
  assert.equal(result.basePath, BASE);
  assert.deepEqual(result.injected, [
    'index.html',
    'run-management/run-sheets/index.html',
  ]);
  assert.deepEqual(result.skipped, ['walkthrough.html']);
  assert.ok(
    result.runtimeFiles.includes('index.js') &&
      result.runtimeFiles.includes('tour.css') &&
      result.runtimeFiles.includes('tours/dispatcher-day.js')
  );
  assert.equal(
    await readFile(join(site, 'walkthrough.html'), 'utf8'),
    PLAIN_PAGE
  );

  const saved = JSON.parse(
    await readFile(join(site, 'pages-files.json'), 'utf8')
  );
  for (const name of [
    'index.html',
    'run-management/run-sheets/index.html',
    'tour/index.js',
    'tour/engine.js',
    'tour/tour.css',
  ]) {
    assert.equal(
      saved[name],
      sha256(await readFile(join(site, name))),
      `checksum of ${name}`
    );
  }
  assert.equal(
    saved['walkthrough.html'],
    sha256(PLAIN_PAGE),
    'an untouched page keeps its checksum'
  );

  const again = await injectTour(site);
  assert.deepEqual(again.injected, []);
  assert.equal(again.alreadyInjected.length, 2);
  const html = await readFile(join(site, 'index.html'), 'utf8');
  assert.equal(
    html.split(TAG_MARKER).length - 1,
    1,
    'running twice does not add a second tag'
  );
});

test('refuses a folder with no app page', async () => {
  const site = await temp();
  await write(site, { 'index.html': PLAIN_PAGE });
  await assert.rejects(
    () => injectTour(site),
    /does not load the app entry script/
  );
});

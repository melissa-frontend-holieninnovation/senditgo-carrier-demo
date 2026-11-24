// Shared helpers for preparing a demo site with the guided tour.
//
// Prepare the overlay in the publish directory after upstream files have been verified.

import { createHash } from 'node:crypto';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Attribute that marks the injected tag. Used to keep injection idempotent. */
export const TAG_MARKER = 'data-senditgo-tour';

/** Folder name of the tour runtime inside a prepared site. */
export const RUNTIME_DIR = 'tour';

// The app entry is the hashed Vite bundle: <script type="module" ... src="<base>assets/index-<hash>.js">.
const APP_ENTRY =
  /<script\b[^>]*\bsrc="([^"]*?)assets\/index-[\w-]+\.js"[^>]*>\s*<\/script>/;

export const RUNTIME_SOURCE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src'
);

/** Returns the site base path (for example "/senditgo-carrier-demo/") or null when the page does not load the app. */
export function detectBasePath(html) {
  const match = APP_ENTRY.exec(html);
  return match ? match[1] : null;
}

/**
 * Adds the tour script tag right after the app entry script.
 * Pages that do not load the app, and pages that already carry the tag, are returned unchanged.
 */
export function injectTag(html, basePath) {
  if (html.includes(TAG_MARKER))
    return { html, changed: false, reason: 'already-injected' };
  const match = APP_ENTRY.exec(html);
  if (!match) return { html, changed: false, reason: 'no-app-entry' };
  const base = basePath ?? match[1];
  const tag = `<script type="module" src="${base}${RUNTIME_DIR}/index.js" ${TAG_MARKER}></script>`;
  const at = match.index + match[0].length;
  return {
    html: `${html.slice(0, at)}\n    ${tag}${html.slice(at)}`,
    changed: true,
    reason: 'injected',
  };
}

/** Lists files under a directory as POSIX-style relative paths. */
export async function listFiles(root, { skip = () => false } = {}) {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(root, full).split(sep).join('/');
      if (skip(rel, entry)) continue;
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) out.push(rel);
    }
  }
  await walk(root);
  return out.sort();
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies the tour runtime into <siteDir>/tour and adds the script tag to every app page.
 * When the site carries a pages-files.json inventory, its checksums are updated to match.
 * Safe to run more than once.
 */
export async function injectTour(
  siteDir,
  { basePath, runtimeSource = RUNTIME_SOURCE } = {}
) {
  const indexHtml = await readFile(join(siteDir, 'index.html'), 'utf8');
  const base = basePath ?? detectBasePath(indexHtml);
  if (!base)
    throw new Error(
      'index.html does not load the app entry script; cannot tell the site base path.'
    );

  const runtimeFiles = (await listFiles(runtimeSource)).filter((name) =>
    /\.(js|css)$/.test(name)
  );
  if (!runtimeFiles.includes('index.js'))
    throw new Error(`Tour runtime not found in ${runtimeSource}`);
  for (const name of runtimeFiles) {
    const target = join(siteDir, RUNTIME_DIR, name);
    await mkdir(dirname(target), { recursive: true });
    await cp(join(runtimeSource, name), target);
  }

  const pages = (
    await listFiles(siteDir, {
      skip: (rel) => rel === RUNTIME_DIR || rel === '.git',
    })
  ).filter((name) => name.endsWith('.html'));
  const injected = [];
  const alreadyInjected = [];
  const skipped = [];
  for (const name of pages) {
    const file = join(siteDir, name);
    const result = injectTag(await readFile(file, 'utf8'), base);
    if (result.changed) {
      await writeFile(file, result.html);
      injected.push(name);
    } else if (result.reason === 'already-injected') {
      alreadyInjected.push(name);
    } else {
      skipped.push(name);
    }
  }
  if (injected.length + alreadyInjected.length === 0)
    throw new Error(
      'No page loads the app entry script; nothing was injected.'
    );

  const inventoryFile = join(siteDir, 'pages-files.json');
  let inventoryUpdated = false;
  if (await exists(inventoryFile)) {
    const inventory = JSON.parse(await readFile(inventoryFile, 'utf8'));
    for (const name of [...injected, ...alreadyInjected])
      inventory[name] = sha256(await readFile(join(siteDir, name)));
    for (const name of runtimeFiles)
      inventory[`${RUNTIME_DIR}/${name}`] = sha256(
        await readFile(join(siteDir, RUNTIME_DIR, name))
      );
    await writeFile(inventoryFile, `${JSON.stringify(inventory, null, 2)}\n`);
    inventoryUpdated = true;
  }

  return {
    basePath: base,
    runtimeFiles,
    injected,
    alreadyInjected,
    skipped,
    inventoryUpdated,
  };
}

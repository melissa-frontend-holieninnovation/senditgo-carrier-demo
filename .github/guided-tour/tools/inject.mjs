#!/usr/bin/env node
// Adds the guided tour to a prepared demo site folder.
//
//   node tools/inject.mjs <site folder> [--base /senditgo-carrier-demo/]
//
// Copies the tour runtime into <site folder>/tour and adds one script tag to
// every page that loads the app. Run it on the folder that is about to be
// published (the output of the demo's prepare-deployment.mjs). It can be run
// again on the same folder without adding a second tag.

import { resolve } from 'node:path';

import { injectTour } from './lib/site.mjs';

const argv = process.argv.slice(2);
let siteDir = null;
let basePath;
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--base') basePath = argv[(i += 1)];
  else if (!siteDir) siteDir = argv[i];
  else throw new Error(`Unknown argument: ${argv[i]}`);
}
if (!siteDir)
  throw new Error(
    'Usage: node tools/inject.mjs <site folder> [--base /senditgo-carrier-demo/]'
  );
if (basePath && !(basePath.startsWith('/') && basePath.endsWith('/')))
  throw new Error('--base must start and end with "/".');

const result = await injectTour(resolve(siteDir), { basePath });
console.log(`base:     ${result.basePath}`);
console.log(
  `pages:    ${result.injected.length} injected, ${result.alreadyInjected.length} already had the tag, ${result.skipped.length} without the app`
);
console.log(
  `runtime:  ${result.runtimeFiles.map((name) => `tour/${name}`).join(', ')}`
);
console.log(
  `inventory: ${result.inventoryUpdated ? 'pages-files.json checksums updated' : 'no pages-files.json in this folder'}`
);

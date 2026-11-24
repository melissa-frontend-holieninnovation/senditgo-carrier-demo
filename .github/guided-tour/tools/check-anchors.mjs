#!/usr/bin/env node
// Checks that the tours are well formed and that every control they point at
// still exists in a demo build. Exits 1 when something is wrong, so it can
// stop a deployment before a tour points at nothing.
//
//   node tools/check-anchors.mjs <demo build folder>
//
// This reads the build's JavaScript; it does not run it. A control whose id is
// made at run time is only checked by its prefix. The browser walk-through
// (npm run e2e) is the check that follows every step for real.

import { resolve } from 'node:path';

import { tours } from '../src/tours/index.js';
import {
  blockingResults,
  checkAnchors,
  readBundle,
  validateTours,
} from './lib/tour-rules.mjs';

const buildDir = process.argv[2];
if (!buildDir) {
  console.error('Usage: node tools/check-anchors.mjs <demo build folder>');
  process.exit(2);
}

const problems = validateTours(tours);
for (const problem of problems) console.error(`RULE   ${problem}`);

const results = checkAnchors(await readBundle(resolve(buildDir)), tours);
// An optional note is a secondary prompt that an older build may not have. The tour
// leaves it out at run time, so its absence is reported but does not fail the check.
const missing = blockingResults(results);
const absentOptional = results.filter(
  (result) => !result.ok && result.optional
);
for (const result of results) {
  const line = `${result.tour} step ${result.step} ${result.use}: ${result.value} — ${result.how}`;
  if (result.ok) console.log(`ok     ${line}`);
  else if (result.optional)
    console.log(`absent ${line} (optional note, left out by the tour)`);
  else console.error(`MISSING ${line}`);
}
if (absentOptional.length)
  console.log(
    `\n${absentOptional.length} optional note(s) not in this build; the tour leaves them out.`
  );

const exact = results.filter((result) => result.how === 'exact').length;
const dynamic = results.filter((result) =>
  result.how.startsWith('dynamic')
).length;
console.log(
  `\n${results.length} anchors: ${exact} exact, ${dynamic} dynamic, ${missing.length} missing; ${problems.length} rule problems.`
);
process.exit(missing.length || problems.length ? 1 : 0);

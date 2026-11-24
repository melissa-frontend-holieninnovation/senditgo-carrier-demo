// Rules every tour definition has to meet, and a static check that the controls
// a tour points at still exist in a demo build.

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describeAnchor } from '../../src/anchors.js';
import { THEME_TOGGLE_TESTID } from '../../src/engine.js';

const SIDES = ['bottom', 'top', 'left', 'right'];
const KINDS = ['callout', 'hotspot'];
const MAX_TEXT = 160;

// Words that belong to reviewers and engineers, never to an end user.
const INTERNAL_COPY = [
  { pattern: /\b(CURRENT|CANDIDATE|PROTOTYPE)\b/, reason: 'reviewer label' },
  { pattern: /\bunapproved\b/i, reason: 'reviewer wording' },
  { pattern: /\b(RBAC|QA|MSW|mock)\b/, reason: 'internal term' },
  {
    pattern: /\b[a-z]{2,5}_[a-z]{2,}(_[a-z]+)*\b/,
    reason: 'permission-code-like token',
  },
  { pattern: /#\d{3,}/, reason: 'ticket number' },
  { pattern: /data-testid|testid/i, reason: 'implementation detail' },
];

const plain = (text) => text.replace(/\*\*/g, '');
const sentences = (text) =>
  plain(text)
    .split(/[.!?](?:\s|$)/)
    .filter((part) => part.trim()).length;

/** Returns a list of problems; an empty list means the tours are valid. */
export function validateTours(tours) {
  const problems = [];
  const ids = new Set();
  const fail = (where, message) => problems.push(`${where}: ${message}`);

  if (!Array.isArray(tours) || tours.length === 0)
    return ['No tours are defined.'];
  for (const tour of tours) {
    const name = `tour "${tour && tour.id}"`;
    if (
      !tour ||
      typeof tour.id !== 'string' ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tour.id)
    )
      fail(name, 'id must be lower-case words joined by "-"');
    if (ids.has(tour.id)) fail(name, 'id is used twice');
    ids.add(tour.id);
    if (!tour.title) fail(name, 'title is missing');
    if (
      tour.minWidth !== undefined &&
      !(Number.isInteger(tour.minWidth) && tour.minWidth > 0)
    )
      fail(name, 'minWidth must be a whole number of pixels');
    if (!tour.end || !tour.end.title || !tour.end.text)
      fail(name, 'end page needs a title and a text');
    if (!Array.isArray(tour.steps) || tour.steps.length === 0) {
      fail(name, 'has no steps');
      continue;
    }

    const copy = [
      tour.title,
      tour.end && tour.end.title,
      tour.end && tour.end.text,
    ];
    const stepIds = new Set();
    tour.steps.forEach((step, index) => {
      const where = `${name} step ${index + 1}`;
      if (
        typeof step.route !== 'string' ||
        !step.route.startsWith('/') ||
        (step.route.length > 1 && step.route.endsWith('/'))
      ) {
        fail(where, 'route must start with "/" and have no trailing "/"');
      }
      if (step.id !== undefined) {
        if (
          typeof step.id !== 'string' ||
          !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(step.id)
        )
          fail(where, 'step id must be lower-case words joined by "-"');
        if (stepIds.has(step.id)) fail(where, 'step id is used twice');
        stepIds.add(step.id);
      }
      if (step.unavailable !== undefined) {
        const { when, action, message, nextStep } = step.unavailable || {};
        try {
          describeAnchor(when);
        } catch (error) {
          fail(where, `unavailable.when: ${error.message}`);
        }
        if (
          typeof message !== 'string' ||
          !message.trim() ||
          message.length > MAX_TEXT ||
          sentences(message) > 2
        )
          fail(where, 'unavailable.message needs one or two short sentences');
        else copy.push(message);
        if (action === 'continue') {
          if (
            typeof nextStep !== 'string' ||
            !tour.steps
              .slice(index + 1)
              .some((s) => s.id === nextStep && s.route === step.route)
          )
            fail(
              where,
              'unavailable.nextStep must name a later step on this page'
            );
        } else if (action !== 'finish' || nextStep !== undefined) {
          fail(
            where,
            'unavailable.action must continue to a named step or finish'
          );
        }
      }
      if (!step.page) fail(where, 'page name is missing');
      if (step.advanceOn !== 'next' && step.advanceOn !== 'click')
        fail(where, 'advanceOn must be "next" or "click"');
      if (step.skipWhen !== undefined) {
        try {
          describeAnchor(step.skipWhen);
        } catch (error) {
          fail(where, `skipWhen: ${error.message}`);
        }
      }
      if (
        !Array.isArray(step.prompts) ||
        step.prompts.length < 1 ||
        step.prompts.length > 3
      ) {
        fail(where, 'needs one to three prompts');
        return;
      }
      step.prompts.forEach((prompt, position) => {
        const spot = `${where} prompt ${position + 1}`;
        try {
          describeAnchor(prompt.target);
        } catch (error) {
          fail(spot, error.message);
        }
        if (!prompt.label)
          fail(spot, "label (the control's own name) is missing");
        if (!KINDS.includes(prompt.kind))
          fail(spot, `kind must be one of ${KINDS.join(', ')}`);
        if (prompt.side !== undefined && !SIDES.includes(prompt.side))
          fail(spot, `side must be one of ${SIDES.join(', ')}`);
        if (prompt.optional !== undefined && prompt.optional !== true)
          fail(spot, 'optional can only be true');
        if (prompt.optional && position === 0)
          fail(
            spot,
            "the first prompt is the step's main control and cannot be optional"
          );
        if (typeof prompt.text !== 'string' || !prompt.text.trim()) {
          fail(spot, 'text is missing');
          return;
        }
        if (plain(prompt.text).length > MAX_TEXT)
          fail(spot, `text is longer than ${MAX_TEXT} characters`);
        if (sentences(prompt.text) > 2)
          fail(spot, 'text has more than two sentences');
        copy.push(prompt.text);
      });
      if (step.advanceOn === 'click' && step.prompts[0].kind !== 'hotspot')
        fail(where, 'the control to click (first prompt) must be a hotspot');
    });

    for (const text of copy.filter(Boolean)) {
      for (const rule of INTERNAL_COPY) {
        if (rule.pattern.test(plain(text)))
          fail(name, `copy contains a ${rule.reason}: ${JSON.stringify(text)}`);
      }
    }
  }
  return problems;
}

/** Every control the tours rely on: prompt targets and skipWhen targets. */
export function collectAnchors(tours) {
  const anchors = [];
  for (const tour of tours) {
    tour.steps.forEach((step, index) => {
      step.prompts.forEach((prompt, position) => {
        anchors.push({
          tour: tour.id,
          step: index + 1,
          use: `prompt ${position + 1}`,
          optional: Boolean(prompt.optional),
          ...describeAnchor(prompt.target),
        });
      });
      if (step.unavailable)
        anchors.push({
          tour: tour.id,
          step: index + 1,
          use: 'unavailable.when',
          ...describeAnchor(step.unavailable.when),
        });
      if (step.skipWhen !== undefined)
        anchors.push({
          tour: tour.id,
          step: index + 1,
          use: 'skipWhen',
          ...describeAnchor(step.skipWhen),
        });
    });
  }
  return anchors;
}

/** Concatenated JavaScript of a demo build (the folder that holds index.html and assets/). */
export async function readBundle(buildDir) {
  const assets = join(buildDir, 'assets');
  const names = (await readdir(assets))
    .filter((name) => name.endsWith('.js'))
    .sort();
  if (names.length === 0) throw new Error(`No JavaScript found in ${assets}`);
  const parts = await Promise.all(
    names.map((name) => readFile(join(assets, name), 'utf8'))
  );
  return parts.join('\n');
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Prefixes the build uses to make ids at run time: `prefix-${…}` template strings and testIdPrefix:"prefix-". */
export function dynamicPrefixes(bundle) {
  const prefixes = new Set();
  for (const match of bundle.matchAll(/`([A-Za-z][\w.:-]*-)\$\{/g))
    prefixes.add(match[1]);
  for (const match of bundle.matchAll(
    /testIdPrefix:\s*["']([A-Za-z][\w.:-]*-)["']/g
  ))
    prefixes.add(match[1]);
  return prefixes;
}

/**
 * Checks one anchor against a build, without running it.
 *   exact   the id is written out in the build        -> a rename or removal is caught
 *   dynamic the id is made at run time from a prefix   -> only the prefix can be checked here;
 *                                                        the browser walk-through covers the rest
 *   css     not checked statically
 */
export function checkAnchor(
  bundle,
  anchor,
  prefixes = dynamicPrefixes(bundle)
) {
  if (anchor.kind === 'css')
    return { ok: true, how: 'not checked (css selector)' };
  if (
    anchor.kind === 'exact' &&
    new RegExp(`["'\`]${escapeRegExp(anchor.value)}["'\`]`).test(bundle)
  )
    return { ok: true, how: 'exact' };
  const prefix = [...prefixes]
    .filter((candidate) =>
      anchor.kind === 'prefix'
        ? candidate === anchor.value
        : anchor.value.startsWith(candidate)
    )
    .sort((a, b) => b.length - a.length)[0];
  if (prefix) return { ok: true, how: `dynamic (${prefix}…)` };
  return { ok: false, how: 'not found in the build' };
}

/** Controls the tour engine itself relies on, besides the ones the tours point at. */
export const ENGINE_ANCHORS = [
  {
    tour: 'engine',
    step: '-',
    use: 'switches the demo to light mode',
    kind: 'exact',
    value: THEME_TOGGLE_TESTID,
  },
];

/**
 * Results that must stop a deployment: anything missing except an optional note, which
 * the tour leaves out at run time when an older build does not have it.
 */
export const blockingResults = (results) =>
  results.filter((result) => !result.ok && !result.optional);

/** Checks every anchor of every tour, and the engine's own. */
export function checkAnchors(bundle, tours) {
  const prefixes = dynamicPrefixes(bundle);
  return [...collectAnchors(tours), ...ENGINE_ANCHORS].map((anchor) => ({
    ...anchor,
    ...checkAnchor(bundle, anchor, prefixes),
  }));
}

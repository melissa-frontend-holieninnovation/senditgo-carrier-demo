import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeAnchor, toSelector } from '../src/anchors.js';
import { richText, routeOf } from '../src/engine.js';
import { tours } from '../src/tours/index.js';
import {
  blockingResults,
  checkAnchor,
  checkAnchors,
  collectAnchors,
  dynamicPrefixes,
  ENGINE_ANCHORS,
  validateTours,
} from '../tools/lib/tour-rules.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));

test('the shipped tours meet every rule', () => {
  assert.deepEqual(validateTours(tours), []);
});

test('targets resolve to selectors', () => {
  assert.equal(toSelector('rail-left-open'), '[data-testid="rail-left-open"]');
  assert.equal(
    toSelector({ testid: 'pending-order-add-', match: 'prefix' }),
    '[data-testid^="pending-order-add-"]'
  );
  assert.equal(
    toSelector('css:[role="dialog"] button'),
    '[role="dialog"] button'
  );
  assert.deepEqual(describeAnchor({ testid: 'om-map' }), {
    kind: 'exact',
    value: 'om-map',
  });
  assert.throws(() => describeAnchor('has space'));
  assert.throws(() => describeAnchor('a"]injection'));
  assert.throws(() => describeAnchor({ testid: 'x', match: 'suffix' }));
  assert.throws(() => describeAnchor('css:'));
  assert.throws(() => describeAnchor(null));
});

test('rules reject a broken tour (negative controls)', () => {
  const base = clone(tours[0]);
  const broken = (change) => {
    const tour = clone(base);
    change(tour);
    return validateTours([tour]);
  };
  const expectProblem = (change, pattern) => {
    const problems = broken(change);
    assert.ok(
      problems.some((problem) => pattern.test(problem)),
      `expected ${pattern} in ${JSON.stringify(problems)}`
    );
  };

  expectProblem((tour) => {
    tour.steps[0].prompts = [];
  }, /one to three prompts/);
  expectProblem((tour) => {
    tour.steps[0].prompts = [1, 2, 3, 4].map(() =>
      clone(base.steps[0].prompts[0])
    );
  }, /one to three prompts/);
  expectProblem((tour) => {
    tour.steps[0].prompts[0].text = 'One. Two. Three.';
  }, /more than two sentences/);
  expectProblem((tour) => {
    tour.steps[0].prompts[0].text = 'x'.repeat(161);
  }, /longer than 160/);
  expectProblem((tour) => {
    tour.steps[0].prompts[0].text = 'This is a CANDIDATE control.';
  }, /reviewer label/);
  expectProblem((tour) => {
    tour.steps[0].prompts[0].text = 'Needs the drv_sched_item_edt permission.';
  }, /permission-code-like/);
  expectProblem((tour) => {
    tour.steps[0].prompts[0].text = 'See ticket #2781.';
  }, /ticket number/);
  expectProblem((tour) => {
    tour.steps[0].prompts[0].target = 'not a testid';
  }, /Not a valid data-testid/);
  expectProblem((tour) => {
    delete tour.steps[0].prompts[0].label;
  }, /label/);
  expectProblem((tour) => {
    tour.steps[0].route = 'run-management';
  }, /route must start/);
  expectProblem((tour) => {
    tour.steps[0].route = '/run-management/';
  }, /no trailing/);
  expectProblem((tour) => {
    tour.steps[0].advanceOn = 'hover';
  }, /advanceOn/);
  expectProblem((tour) => {
    tour.steps[1].prompts[0].kind = 'callout';
  }, /must be a hotspot/);
  expectProblem((tour) => {
    tour.id = 'Dispatcher Day';
  }, /id must be/);
  expectProblem((tour) => {
    delete tour.end;
  }, /end page/);
  expectProblem((tour) => {
    tour.minWidth = '1200px';
  }, /minWidth/);
  expectProblem((tour) => {
    tour.minWidth = 0;
  }, /minWidth/);
  assert.deepEqual(
    broken((tour) => {
      delete tour.minWidth;
    }),
    [],
    'minWidth is optional'
  );
  assert.ok(
    validateTours([clone(base), clone(base)]).some((problem) =>
      /used twice/.test(problem)
    )
  );
  assert.deepEqual(validateTours([]), ['No tours are defined.']);
});

test('the anchor check passes for ids a build contains and fails for ids it lacks', () => {
  const bundle = [
    '"data-testid":"home-stats","data-layout":h',
    'testId:we?"rail-left-close":"rail-left-open",disabled:!!Be',
    // eslint-disable-next-line no-template-curly-in-string -- the build's own template literal, quoted as text
    '"data-testid":`pending-order-add-${Me.id}`,onClick:()=>{}',
    'testIdPrefix:"os-stage-",disabledReason:"x"',
    // eslint-disable-next-line no-template-curly-in-string -- the build's own template literal, quoted as text
    '"data-testid":`nav-${a.key}`',
  ].join(';');
  const prefixes = dynamicPrefixes(bundle);
  assert.deepEqual([...prefixes].sort(), [
    'nav-',
    'os-stage-',
    'pending-order-add-',
  ]);

  assert.deepEqual(
    checkAnchor(bundle, { kind: 'exact', value: 'home-stats' }),
    { ok: true, how: 'exact' }
  );
  assert.deepEqual(
    checkAnchor(bundle, { kind: 'exact', value: 'rail-left-open' }),
    { ok: true, how: 'exact' }
  );
  assert.equal(
    checkAnchor(bundle, { kind: 'exact', value: 'os-stage-transit' }).how,
    'dynamic (os-stage-…)'
  );
  assert.equal(
    checkAnchor(bundle, { kind: 'exact', value: 'nav-run-management' }).how,
    'dynamic (nav-…)'
  );
  assert.equal(
    checkAnchor(bundle, { kind: 'prefix', value: 'pending-order-add-' }).ok,
    true
  );
  assert.equal(checkAnchor(bundle, { kind: 'css', value: 'button' }).ok, true);

  // Negative controls: the id is gone, renamed, or only a longer id remains.
  assert.equal(
    checkAnchor(bundle, { kind: 'exact', value: 'home-totals' }).ok,
    false
  );
  assert.equal(
    checkAnchor(bundle.replace('"home-stats"', '"home-numbers"'), {
      kind: 'exact',
      value: 'home-stats',
    }).ok,
    false
  );
  assert.equal(
    checkAnchor('"data-testid":"home-stats-extra"', {
      kind: 'exact',
      value: 'home-stats',
    }).ok,
    false
  );
  assert.equal(
    checkAnchor(bundle, { kind: 'prefix', value: 'pending-order-remove-' }).ok,
    false
  );
  assert.equal(
    checkAnchor(bundle, { kind: 'prefix', value: 'pending-order-' }).ok,
    false,
    'a shorter prefix is a different control'
  );
});

test('every prompt and every skipWhen of the shipped tours is collected', () => {
  const anchors = collectAnchors(tours);
  const expected = tours.reduce(
    (sum, tour) =>
      sum +
      tour.steps.reduce(
        (count, step) =>
          count +
          step.prompts.length +
          (step.skipWhen ? 1 : 0) +
          (step.unavailable ? 1 : 0),
        0
      ),
    0
  );
  assert.equal(anchors.length, expected);
  const results = checkAnchors(
    [...anchors, ...ENGINE_ANCHORS]
      .map((anchor) => `"${anchor.value}"`)
      .join(','),
    tours
  );
  assert.ok(
    results
      .filter((result) => result.kind === 'exact')
      .every((result) => result.ok)
  );
});

test('the control the engine itself relies on is checked as well', () => {
  const tourIds = collectAnchors(tours)
    .map((anchor) => `"${anchor.value}"`)
    .join(',');
  const engine = (bundle) =>
    checkAnchors(bundle, tours).filter((result) => result.tour === 'engine');
  assert.deepEqual(
    engine(`${tourIds},"data-testid":"theme-toggle"`).map((r) => r.ok),
    [true]
  );
  // Negative control: the header switch renamed in a new build.
  assert.deepEqual(
    engine(`${tourIds},"data-testid":"theme-switch"`).map((r) => r.ok),
    [false]
  );
});

test('tour text is escaped, with ** as the only formatting', () => {
  assert.equal(
    richText('Open **Run Sheets** now'),
    'Open <strong>Run Sheets</strong> now'
  );
  assert.equal(
    richText('<img src=x onerror=alert(1)> & "quotes"'),
    '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;'
  );
  assert.equal(richText('**<b>**'), '<strong>&lt;b&gt;</strong>');
});

test('routes are compared without the site base and without a trailing slash', () => {
  const base = '/senditgo-carrier-demo/';
  assert.equal(routeOf('/senditgo-carrier-demo/', base), '/');
  assert.equal(
    routeOf('/senditgo-carrier-demo', base),
    '/senditgo-carrier-demo',
    'a path outside the base is left as is'
  );
  assert.equal(
    routeOf('/senditgo-carrier-demo/run-management/run-sheets/', base),
    '/run-management/run-sheets'
  );
  assert.equal(
    routeOf('/senditgo-carrier-demo/run-management/run-sheets', base),
    '/run-management/run-sheets'
  );
  assert.equal(
    routeOf('/run-management/run-sheets/', '/'),
    '/run-management/run-sheets'
  );
  assert.equal(routeOf('/', '/'), '/');
});

test('an optional note may be missing from a build; a main control may not (negative controls)', () => {
  const tour = clone(tours[0]);
  tour.steps[0].prompts[1].optional = true;
  assert.deepEqual(
    validateTours([tour]),
    [],
    'optional on a secondary prompt is fine'
  );

  const onMain = clone(tours[0]);
  onMain.steps[0].prompts[0].optional = true;
  assert.ok(
    validateTours([onMain]).some((problem) =>
      /main control and cannot be optional/.test(problem)
    ),
    'the main prompt cannot be optional'
  );
  const notTrue = clone(tours[0]);
  notTrue.steps[0].prompts[1].optional = 'yes';
  assert.ok(
    validateTours([notTrue]).some((problem) =>
      /optional can only be true/.test(problem)
    )
  );

  // A build that has the main control of step 1 but neither of its notes.
  // How a build writes an id: a fixed string, or a template for ids made at run time.
  const asBuild = (anchor) =>
    anchor.kind === 'prefix'
      ? `"data-testid":\`${anchor.value}\${x}\``
      : `"${anchor.value}"`;
  const kept = collectAnchors([tour])
    .filter((anchor) => anchor.step !== 1 || anchor.use === 'prompt 1')
    .map(asBuild);
  const bundle = [...new Set([...kept, '"theme-toggle"'])].join(',');
  const results = checkAnchors(bundle, [tour]);
  const step1 = results.filter(
    (result) => result.tour === tour.id && result.step === 1
  );
  assert.deepEqual(
    step1.map((result) => [result.use, result.ok, result.optional]),
    [
      ['prompt 1', true, false],
      ['prompt 2', false, true],
    ]
  );
  assert.deepEqual(
    blockingResults(results),
    [],
    'the absent optional note does not block'
  );
  // The same build checked against the tour without the flag: now it blocks.
  const strict = checkAnchors(bundle, [tours[0]]);
  assert.deepEqual(
    blockingResults(strict).map((result) => `${result.step} ${result.use}`),
    ['1 prompt 2']
  );
});

// A target written one way only: its kind and its whole value, css selectors included.
const normalised = (target) => {
  const anchor = describeAnchor(target);
  return `${anchor.kind}:${anchor.value}`;
};
// Everything a page tour may ask the visitor to click: navigation, and panels or views it
// opens. Any other click target fails, however it is written, so a click that saves, submits,
// assigns or applies something cannot slip in.
const PAGE_TOUR_CLICKS = new Set([
  'exact:rail-left-open',
  'exact:rail-right-open',
  'css:[data-testid="om-view-toggle"] button[data-value="list"]',
  'prefix:om-overview-',
  'prefix:pending-select-',
  'css:[data-testid^="roster-chip-"] button',
  'exact:roster-driver-leave',
]);
const clickTargets = (tour) =>
  tour.steps
    .filter((step) => step.advanceOn === 'click')
    .map((step) => step.prompts[0].target);

test('the three page tours start on their own page and only explain', () => {
  const byId = Object.fromEntries(tours.map((tour) => [tour.id, tour]));
  assert.equal(byId.roster.steps[0].route, '/roster');
  assert.equal(
    byId['order-management'].steps[0].route,
    '/run-management/order-management'
  );
  assert.equal(
    byId['route-planning'].steps[0].route,
    '/run-management/route-planning'
  );
  for (const id of ['roster', 'order-management', 'route-planning'])
    for (const target of clickTargets(byId[id]))
      assert.ok(
        PAGE_TOUR_CLICKS.has(normalised(target)),
        `${id} asks for a click on ${normalised(target)}`
      );
  // Negative controls: committing controls, written plainly, by prefix, or hidden in a
  // selector list next to an allowed control.
  for (const target of [
    'rp-submit',
    'css:[data-testid="rp-submit"]',
    { testid: 'pending-order-add-', match: 'prefix' },
    `css:[data-testid="om-view-toggle"] button[data-value="list"], [data-testid='rp-submit']`,
  ])
    assert.ok(
      !PAGE_TOUR_CLICKS.has(normalised(target)),
      `${JSON.stringify(target)} would be caught`
    );
});

test('a missing main control, skipWhen target or engine control always blocks', () => {
  const tour = clone(tours.find((item) => item.id === 'order-management'));
  const asBuild = (anchor) =>
    anchor.kind === 'prefix'
      ? `"data-testid":\`${anchor.value}\${x}\``
      : `"${anchor.value}"`;
  const everything = [...collectAnchors([tour]), ...ENGINE_ANCHORS].filter(
    (anchor) => anchor.kind !== 'css'
  );
  const without = (value) =>
    everything
      .filter((anchor) => anchor.value !== value)
      .map(asBuild)
      .join(',');
  assert.deepEqual(blockingResults(checkAnchors(without(''), [tour])), []);
  for (const [value, use] of [
    ['pending-section-toggle', 'prompt 1'],
    ['changes-rail', 'skipWhen'],
    ['theme-toggle', 'switches the demo to light mode'],
  ]) {
    const blocking = blockingResults(checkAnchors(without(value), [tour]));
    assert.ok(
      blocking.some((result) => result.value === value && result.use === use),
      `${value} (${use}) missing from the build blocks`
    );
    assert.ok(
      blocking.every((result) => result.value === value),
      'nothing else blocks'
    );
  }
});

test('OM uses an inspection control and keeps assignment optional in the dispatcher overview', () => {
  const byId = Object.fromEntries(tours.map((tour) => [tour.id, tour]));
  const om = byId['order-management'];
  const inspection = om.steps.findIndex(
    (step) => normalised(step.prompts[0].target) === 'prefix:pending-select-'
  );
  assert.ok(inspection > 0);
  assert.equal(om.steps[inspection].advanceOn, 'click');
  assert.equal(
    om.steps[inspection + 1].prompts[0].target,
    om.steps[inspection].skipWhen
  );
  assert.match(om.steps[inspection + 1].prompts[0].target, /om-order-summary-/);
  for (const step of om.steps.slice(inspection, inspection + 2)) {
    assert.equal(step.unavailable.nextStep, 'map-tools');
    assert.ok(
      om.steps
        .slice(inspection + 2)
        .some((later) => later.id === step.unavailable.nextStep)
    );
  }
  const dispatcher = byId['dispatcher-day'];
  const assign = dispatcher.steps.find((step) =>
    step.prompts.some(
      (prompt) => normalised(prompt.target) === 'prefix:pending-order-add-'
    )
  );
  assert.equal(assign.prompts[0].target, 'pending-section-toggle');
  assert.equal(assign.advanceOn, 'next');
});

test('only the non-submitting Changes step offers the stale-selection practice', () => {
  const practice = tours.flatMap((tour) =>
    tour.steps
      .filter((step) => step.practice)
      .map((step) => ({
        tour: tour.id,
        advance: step.advanceOn,
        target: step.prompts[0].target,
        practice: step.practice,
      }))
  );
  assert.deepEqual(practice, [
    {
      tour: 'order-management',
      advance: 'next',
      target: 'changes-rail',
      practice: 'stale-selection',
    },
  ]);
});

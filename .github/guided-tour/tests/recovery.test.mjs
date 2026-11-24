import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectAnchors, validateTours } from '../tools/lib/tour-rules.mjs';

const step = {
  page: 'Order Management',
  route: '/order-management',
  advanceOn: 'next',
  prompts: [
    {
      target: 'card',
      label: 'Order',
      kind: 'callout',
      text: 'Inspect an Order.',
    },
  ],
};
const alternate = {
  when: 'empty-orders',
  action: 'continue',
  message: 'There are no Orders to inspect.',
  nextStep: 'map',
};
function fixture(unavailable, destination = {}) {
  return [
    {
      id: 'orders',
      title: 'Orders',
      end: { title: 'Done', text: 'Finished.' },
      steps: [
        { ...step, id: 'orders', unavailable },
        { ...step, id: 'map', ...destination },
      ],
    },
  ];
}

test('empty-state evidence is a required anchor; continuation moves forward within the same page', () => {
  const tours = fixture(alternate);
  assert.deepEqual(validateTours(tours), []);
  assert.ok(
    collectAnchors(tours).some(
      (a) =>
        a.use === 'unavailable.when' &&
        a.value === 'empty-orders' &&
        !a.optional
    )
  );
  for (const nextStep of ['orders', 'absent', '']) {
    assert.match(
      validateTours(fixture({ ...alternate, nextStep })).join(' '),
      /later step/
    );
  }
  assert.match(
    validateTours(fixture(alternate, { route: '/a-different-page' })).join(' '),
    /on this page/
  );
  assert.match(
    validateTours(fixture(alternate, { id: 'orders' })).join(' '),
    /used twice/
  );
});

test('a finish branch requires a real empty-state anchor and an explanation', () => {
  const finish = {
    when: 'empty-orders',
    action: 'finish',
    message: alternate.message,
  };
  assert.deepEqual(validateTours(fixture(finish)), []);
  assert.match(
    validateTours(fixture({ ...finish, when: 'bad selector' })).join(' '),
    /unavailable.when/
  );
  assert.match(
    validateTours(fixture({ ...finish, message: '' })).join(' '),
    /unavailable.message/
  );
  assert.match(
    validateTours(fixture({ ...finish, nextStep: 'map' })).join(' '),
    /unavailable.action/
  );
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clipTo, computePlacement, showsEnough } from '../src/placement.js';

const viewport = { width: 1440, height: 900 };
const tip = { width: 300, height: 120 };

const inside = (spot, size = tip, view = viewport) =>
  spot.left >= 0 &&
  spot.top >= 0 &&
  spot.left + size.width <= view.width &&
  spot.top + size.height <= view.height;

test('puts the prompt below the control when there is room', () => {
  const target = { left: 600, top: 100, width: 200, height: 32 };
  const spot = computePlacement({ target, tip, viewport });
  assert.equal(spot.side, 'bottom');
  assert.equal(spot.top, 100 + 32 + 12);
  assert.equal(spot.left, 700 - 150, 'centred under the control');
  assert.equal(
    spot.arrow.left,
    150,
    'arrow points at the centre of the control'
  );
});

test('honours the preferred side', () => {
  const target = { left: 600, top: 400, width: 200, height: 32 };
  assert.equal(
    computePlacement({ target, tip, viewport, prefer: 'right' }).side,
    'right'
  );
  assert.equal(
    computePlacement({ target, tip, viewport, prefer: 'left' }).side,
    'left'
  );
  assert.equal(
    computePlacement({ target, tip, viewport, prefer: 'top' }).side,
    'top'
  );
});

test('moves to another side when the preferred one would be cut off', () => {
  const nearBottom = { left: 600, top: 860, width: 200, height: 32 };
  const spot = computePlacement({
    target: nearBottom,
    tip,
    viewport,
    prefer: 'bottom',
  });
  assert.equal(spot.side, 'top');
  assert.ok(inside(spot));

  const nearRightEdge = { left: 1380, top: 400, width: 48, height: 48 };
  const side = computePlacement({
    target: nearRightEdge,
    tip,
    viewport,
    prefer: 'right',
  });
  assert.notEqual(side.side, 'right');
  assert.ok(inside(side));
});

test('keeps the prompt inside the window for a control in a corner', () => {
  for (const target of [
    { left: 0, top: 0, width: 40, height: 40 },
    { left: 1400, top: 0, width: 40, height: 40 },
    { left: 0, top: 860, width: 40, height: 40 },
    { left: 1400, top: 860, width: 40, height: 40 },
  ]) {
    const spot = computePlacement({ target, tip, viewport });
    assert.ok(
      inside(spot),
      `corner ${target.left},${target.top} -> ${JSON.stringify(spot)}`
    );
  }
});

test('keeps the arrow on the prompt when the control is near the window edge', () => {
  const target = { left: 8, top: 100, width: 40, height: 40 };
  const spot = computePlacement({ target, tip, viewport });
  assert.equal(spot.side, 'bottom');
  assert.equal(spot.left, 8, 'clamped to the margin');
  assert.ok(spot.arrow.left >= 16 && spot.arrow.left <= tip.width - 16);
});

test('avoids covering another control when a clean side exists', () => {
  const target = { left: 600, top: 100, width: 200, height: 32 };
  const neighbour = { left: 600, top: 150, width: 200, height: 100 }; // right under the target
  const spot = computePlacement({ target, tip, viewport, avoid: [neighbour] });
  assert.equal(
    spot.side,
    'right',
    'below would cover the neighbour, above does not fit'
  );
  assert.ok(inside(spot));
});

test('slides along the side to clear another control when the centred spot would cover it', () => {
  // A filter bar with a table row close under it: below covers the row, above there is no room,
  // and to the right the centred prompt still dips into the row.
  const bar = { left: 76, top: 152, width: 616, height: 40 };
  const row = { left: 80, top: 241, width: 892, height: 61 };
  const tall = { width: 300, height: 150 };
  const spot = computePlacement({
    target: bar,
    tip: tall,
    viewport: { width: 1440, height: 790 },
    avoid: [row],
  });
  assert.equal(spot.side, 'right');
  assert.equal(
    spot.top,
    241 - 8 - 150,
    'moved up until it clears the row by the margin'
  );
  const arrowY = spot.top + spot.arrow.top;
  assert.ok(
    arrowY >= bar.top && arrowY <= bar.top + bar.height,
    'the arrow still points at the bar'
  );
});

test('does not slide so far that the arrow would miss the control', () => {
  const target = { left: 600, top: 400, width: 60, height: 32 };
  const wide = { left: 300, top: 444, width: 700, height: 80 }; // under the target, much wider than it
  const spot = computePlacement({ target, tip, viewport, avoid: [wide] });
  assert.notEqual(
    spot.side,
    'bottom',
    'clearing it below would leave the prompt beside nothing'
  );
  assert.ok(inside(spot));
});

test('uses the spot that covers the least when no spot is clear', () => {
  const target = { left: 600, top: 100, width: 200, height: 32 };
  const everything = { left: 0, top: 0, width: 1440, height: 900 };
  assert.equal(
    computePlacement({ target, tip, viewport, avoid: [everything] }).side,
    'bottom',
    'all equal: the preferred side, centred'
  );

  // Below, the prompt would sit fully on the band; to the right only its lower edge would.
  const band = { left: 0, top: 150, width: 1440, height: 750 };
  const high = { left: 0, top: 0, width: 1440, height: 60 };
  const least = computePlacement({
    target,
    tip,
    viewport,
    avoid: [band, high],
  });
  assert.equal(least.side, 'right');
  assert.ok(inside(least));
});

test('falls back inside the control when no side fits', () => {
  const fullScreen = { left: 0, top: 0, width: 1440, height: 900 };
  const spot = computePlacement({ target: fullScreen, tip, viewport });
  assert.equal(spot.side, 'inside');
  assert.equal(spot.arrow, null);
  assert.ok(inside(spot));
});

test('fits a narrow window', () => {
  const phone = { width: 360, height: 640 };
  const small = { width: 300, height: 140 };
  const spot = computePlacement({
    target: { left: 300, top: 20, width: 48, height: 32 },
    tip: small,
    viewport: phone,
  });
  assert.ok(inside(spot, small, phone), JSON.stringify(spot));
});

test('clipTo keeps the part of a control that a scrolling panel shows', () => {
  const panel = { left: 800, top: 100, width: 400, height: 500 }; // shows y 100..600
  assert.deepEqual(
    clipTo({ left: 820, top: 200, width: 360, height: 80 }, panel),
    { left: 820, top: 200, width: 360, height: 80 },
    'fully inside: unchanged'
  );
  assert.deepEqual(
    clipTo({ left: 820, top: 540, width: 360, height: 160 }, panel),
    { left: 820, top: 540, width: 360, height: 60 },
    'cut at the bottom edge'
  );
  assert.deepEqual(
    clipTo({ left: 820, top: 40, width: 360, height: 160 }, panel),
    { left: 820, top: 100, width: 360, height: 100 },
    'cut at the top edge'
  );
  assert.equal(
    clipTo({ left: 820, top: 620, width: 360, height: 160 }, panel),
    null,
    'scrolled out of the panel'
  );
  assert.equal(
    clipTo({ left: 820, top: 600, width: 360, height: 160 }, panel),
    null,
    'touching the edge is not showing'
  );
});

test('clipTo only cuts in the directions the panel clips', () => {
  const sideways = { left: 100, top: 100, width: 300, height: 40 };
  const tab = { left: 380, top: 90, width: 120, height: 60 };
  assert.deepEqual(clipTo(tab, sideways, { x: true, y: false }), {
    left: 380,
    top: 90,
    width: 20,
    height: 60,
  });
  assert.deepEqual(clipTo(tab, sideways, { x: false, y: true }), {
    left: 380,
    top: 100,
    width: 120,
    height: 40,
  });
  assert.deepEqual(clipTo(tab, sideways, { x: false, y: false }), tab);
});

test('showsEnough: a small control must show whole, a large one at least 40px each way', () => {
  const button = { left: 0, top: 0, width: 120, height: 32 };
  assert.equal(showsEnough(button, button), true);
  assert.equal(
    showsEnough(button, { ...button, height: 20 }),
    false,
    'a button cut in half is not pointed at'
  );
  assert.equal(showsEnough(button, { ...button, width: 30 }), false);
  const section = { left: 0, top: 0, width: 360, height: 166 };
  assert.equal(
    showsEnough(section, { ...section, height: 98 }),
    true,
    'most of a section'
  );
  assert.equal(
    showsEnough(section, { ...section, height: 28 }),
    false,
    'a sliver of a section'
  );
  assert.equal(showsEnough(section, null), false);
});

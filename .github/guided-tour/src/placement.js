// Where a prompt sits relative to the control it explains. Pure geometry, no DOM.
//
// Rectangles are { left, top, width, height } in viewport pixels.

const SIDES = ['bottom', 'top', 'right', 'left'];
const ARROW_INSET = 16;

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), Math.max(min, max));

function overlapArea(a, b) {
  const width =
    Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const height =
    Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * Positions for the prompt on one side of the target, nearest to the centre first: centred on the
 * target, then slid along that side until it just clears each rectangle to avoid. A slid position
 * is kept only while the arrow on the prompt's edge can still reach the target. Empty when the
 * prompt does not fit on that side at all.
 */
function positionsOn(side, target, tip, viewport, gap, margin, avoid) {
  const [along, length] =
    side === 'bottom' || side === 'top' ? ['left', 'width'] : ['top', 'height'];
  const [across, depth] =
    along === 'left' ? ['top', 'height'] : ['left', 'width'];
  const before = side === 'top' || side === 'left';
  const fixed = before
    ? target[across] - gap - tip[depth]
    : target[across] + target[depth] + gap;
  if (before ? fixed < margin : fixed + tip[depth] > viewport[depth] - margin)
    return [];

  const min = margin;
  const max = Math.max(min, viewport[length] - tip[length] - margin);
  const targetStart = target[along];
  const targetEnd = targetStart + target[length];
  const centred = clamp(
    targetStart + target[length] / 2 - tip[length] / 2,
    min,
    max
  );
  const slid = avoid
    .flatMap((rect) => [
      rect[along] + rect[length] + margin,
      rect[along] - margin - tip[length],
    ])
    .filter((start) => start >= min && start <= max)
    .filter(
      (start) =>
        start + ARROW_INSET <= targetEnd &&
        start + tip[length] - ARROW_INSET >= targetStart
    )
    .sort((a, b) => Math.abs(a - centred) - Math.abs(b - centred));
  return [centred, ...slid].map((start) => ({
    side,
    [along]: start,
    [across]: fixed,
  }));
}

/**
 * Picks where the prompt goes: fully inside the window, on the preferred side when possible, and
 * clear of the `avoid` rectangles (the other controls of the step, the prompts already placed).
 * When no position is clear, the one that covers the least is used. When the prompt fits on no
 * side, it is placed inside the target's area, clamped to the window, so it is never cut off.
 */
export function computePlacement({
  target,
  tip,
  viewport,
  prefer = 'bottom',
  gap = 12,
  margin = 8,
  avoid = [],
}) {
  const order = [prefer, ...SIDES.filter((side) => side !== prefer)].filter(
    (side) => SIDES.includes(side)
  );
  const options = order.flatMap((side) =>
    positionsOn(side, target, tip, viewport, gap, margin, avoid)
  );
  const covered = (option) =>
    avoid.reduce(
      (sum, rect) =>
        sum +
        overlapArea(
          {
            left: option.left,
            top: option.top,
            width: tip.width,
            height: tip.height,
          },
          rect
        ),
      0
    );
  // The sort is stable, so among equals the preferred side and the most centred position win.
  let chosen = options
    .map((option) => ({ option, area: covered(option) }))
    .sort((a, b) => a.area - b.area)[0];
  chosen = chosen ? chosen.option : null;
  if (!chosen) {
    chosen = {
      side: 'inside',
      left: clamp(
        target.left + gap,
        margin,
        viewport.width - tip.width - margin
      ),
      top: clamp(
        target.top + gap,
        margin,
        viewport.height - tip.height - margin
      ),
    };
  }

  // Where the arrow sits along the prompt's edge so it points at the centre of the target.
  let arrow = null;
  if (chosen.side === 'bottom' || chosen.side === 'top') {
    arrow = {
      left: clamp(
        target.left + target.width / 2 - chosen.left,
        ARROW_INSET,
        tip.width - ARROW_INSET
      ),
    };
  } else if (chosen.side === 'right' || chosen.side === 'left') {
    arrow = {
      top: clamp(
        target.top + target.height / 2 - chosen.top,
        ARROW_INSET,
        tip.height - ARROW_INSET
      ),
    };
  }
  return {
    side: chosen.side,
    left: Math.round(chosen.left),
    top: Math.round(chosen.top),
    arrow,
  };
}

/**
 * Cuts a rectangle down to the part that lies inside a clipping box. `axes` says in which
 * directions the box clips ({ x: true, y: false } for a box that only scrolls sideways).
 * Returns null when nothing is left.
 */
export function clipTo(rect, box, axes = { x: true, y: true }) {
  let { left, top } = rect;
  let right = rect.left + rect.width;
  let bottom = rect.top + rect.height;
  if (axes.x) {
    left = Math.max(left, box.left);
    right = Math.min(right, box.left + box.width);
  }
  if (axes.y) {
    top = Math.max(top, box.top);
    bottom = Math.min(bottom, box.top + box.height);
  }
  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}

/**
 * True when enough of a control is in view to point at it: all of it for a small control,
 * at least `min` pixels each way for a large one. A sliver at the edge of a scrolling panel is not enough.
 */
export function showsEnough(full, part, min = 40) {
  return (
    Boolean(part) &&
    part.width >= Math.min(full.width, min) - 0.5 &&
    part.height >= Math.min(full.height, min) - 0.5
  );
}

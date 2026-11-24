// How a tour step names the control it points at.
//
// A target is written in one of three ways:
//   'rail-left-open'                      the element whose data-testid is exactly this
//   { testid: 'pending-order-add-', match: 'prefix' }
//                                         the first visible element whose data-testid starts with this
//   'css:[role="dialog"] button'          any CSS selector (last resort; not covered by the static check)
//
// This file has no DOM access so the Node tools can share it with the browser runtime.

const TESTID = /^[A-Za-z0-9][\w.:-]*$/;

/** Normalises a target into { kind, value }. Throws on a target that cannot be resolved. */
export function describeAnchor(target) {
  if (typeof target === 'string') {
    if (target.startsWith('css:')) {
      const value = target.slice(4).trim();
      if (!value) throw new Error('Empty css: target');
      return { kind: 'css', value };
    }
    if (!TESTID.test(target))
      throw new Error(`Not a valid data-testid: ${JSON.stringify(target)}`);
    return { kind: 'exact', value: target };
  }
  if (
    target &&
    typeof target === 'object' &&
    typeof target.testid === 'string'
  ) {
    if (!TESTID.test(target.testid))
      throw new Error(
        `Not a valid data-testid: ${JSON.stringify(target.testid)}`
      );
    if (target.match === 'prefix')
      return { kind: 'prefix', value: target.testid };
    if (target.match === undefined || target.match === 'exact')
      return { kind: 'exact', value: target.testid };
  }
  throw new Error(`Unsupported tour target: ${JSON.stringify(target)}`);
}

/** CSS selector for a target. */
export function toSelector(target) {
  const anchor = describeAnchor(target);
  if (anchor.kind === 'css') return anchor.value;
  return anchor.kind === 'prefix'
    ? `[data-testid^="${anchor.value}"]`
    : `[data-testid="${anchor.value}"]`;
}
